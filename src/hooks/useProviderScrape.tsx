import { FullScraperEvents, RunOutput, ScrapeMedia } from "@p-stream/providers";
import { RefObject, useCallback, useEffect, useRef, useState } from "react";

import {
  isExtensionActive,
  isExtensionActiveCached,
} from "@/backend/extension/messaging";
import { prepareStream } from "@/backend/extension/streams";
import {
  connectServerSideEvents,
  getCachedMetadata,
  makeProviderUrl,
} from "@/backend/helpers/providerApi";
import { getLoadbalancedProviderApiUrl } from "@/backend/providers/fetchers";
import { zeticuzScrapers } from "@/backend/providers/zeticuz-provider";
import { getProviders, getSourceSortOrder } from "@/backend/providers/providers";
import { usePlayerStore } from "@/stores/player/store";
import { usePreferencesStore } from "@/stores/preferences";
import { getSecureEmbedApiUrl } from "@/utils/secure-config";

export interface ScrapingItems {
  id: string;
  children: string[];
}

export interface ScrapingSegment {
  name: string;
  id: string;
  embedId?: string;
  status: "failure" | "pending" | "notfound" | "success" | "waiting";
  reason?: string;
  error?: any;
  percentage: number;
}

export type ProbeStatus = "probing" | "working" | "failed";

type ScraperEvent<Event extends keyof FullScraperEvents> = Parameters<
  NonNullable<FullScraperEvents[Event]>
>[0];

// Source name overrides for builtin providers (display aliases).
// true source name VidLink 🔥 / Alias use for this site: Abyss
// true source name LookMovies 🔥 / Alias use for this site: Apex
const SOURCE_NAME_OVERRIDES: Record<string, string> = {
  "vidlink-custom": "Abyss 🔥",
  lookmovie: "Apex 🔥",
};

const ZETICUZ_SOURCE_IDS = zeticuzScrapers.map((s) => s.id);

function applyNameOverrides(
  metadata: { id: string; name: string }[],
): { id: string; name: string }[] {
  return metadata.map((s) =>
    SOURCE_NAME_OVERRIDES[s.id] ? { ...s, name: SOURCE_NAME_OVERRIDES[s.id] } : s,
  );
}

// Mapping from backend provider name patterns → zeticuz scraper IDs
const PROVIDER_ALIAS_MAP: Record<string, string[]> = {
  showbox:       ["showbox", "febboxfid", "febbox"],
  dahmermovies:  ["dahmermovies"],
  notorrent:     ["notorrent"],
  "4khdhub":     ["4khdhub"],
  videasy:       ["videasy"],
  vixsrc:        ["vixsrc"],
  anikoto:       ["anikoto"],
  anikai:        ["anikai"],
  vidbox:        ["vidbox"],
  vidcore:       ["vidcore"],
  vidlink:       ["vidlink"],
};

function matchZeticuzScraperId(backendProviderId: string): string[] {
  const norm = backendProviderId.toLowerCase().replace(/[\s_-]/g, "");
  const matched: string[] = [];
  for (const [scraperId, aliases] of Object.entries(PROVIDER_ALIAS_MAP)) {
    if (aliases.some((a) => norm.includes(a) || a.includes(norm))) {
      matched.push(`zeticuz-${scraperId}`);
    }
  }
  return matched;
}

/**
 * Probe zeticuz providers with a SINGLE direct API call.
 * All zeticuz scrapers share the same backend response — calling runSourceScraper
 * 12 times in parallel would issue 12 simultaneous fetches to the same URL and
 * hit the 12-second timeout before a response arrives (API takes 20-40s).
 *
 * Instead we call the backend API once with a generous 45-second timeout,
 * then mark each zeticuz scraper working/failed based on which provider IDs
 * appear in the response.
 */
async function probeZeticuzProviders(
  zeticuzIds: string[],
  media: ScrapeMedia,
  PROBE_TIMEOUT_MS = 45_000,
): Promise<{ workingIds: Set<string>; isAnime: boolean }> {
  const embedApiBase = getSecureEmbedApiUrl();
  if (!embedApiBase) return { workingIds: new Set(zeticuzIds), isAnime: false };

  const url = (() => {
    const imdbId = (media as any).imdbId as string | undefined;
    const imdbParam = imdbId && imdbId.startsWith("tt") ? `&imdbId=${encodeURIComponent(imdbId)}` : "";
    if (media.type === "movie") {
      return `${embedApiBase}/api/streams/movie/${media.tmdbId}${imdbParam ? `?${imdbParam.slice(1)}` : ""}`;
    }
    const s = media as any;
    return `${embedApiBase}/api/streams/series/${s.tmdbId}?season=${s.season?.number}&episode=${s.episode?.number}${imdbParam}`;
  })();

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), PROBE_TIMEOUT_MS);
    let data: any;
    try {
      const res = await fetch(url, { signal: controller.signal });
      if (!res.ok) return { workingIds: new Set(), isAnime: false };
      data = await res.json();
    } finally {
      clearTimeout(timer);
    }

    const isAnime = data?.isAnime === true;
    if (!data?.streams || !Array.isArray(data.streams)) return { workingIds: new Set(), isAnime };

    // Collect which zeticuz scrapers have at least one working stream
    const working = new Set<string>();
    for (const stream of data.streams) {
      if (!stream?.url || !stream?.provider) continue;
      const provId: string = String(stream.provider);
      const matchedIds = matchZeticuzScraperId(provId);
      for (const id of matchedIds) {
        if (zeticuzIds.includes(id)) working.add(id);
      }
    }
    return { workingIds: working, isAnime };
  } catch (err) {
    // Timeout or network error — return empty set so only working sources appear
    return { workingIds: new Set(), isAnime: false };
  }
}

/**
 * Probe non-zeticuz sourceIds in parallel — each gets a PROBE_TIMEOUT_MS window.
 * Returns a Set of IDs that successfully returned a stream.
 */
async function parallelProbe(
  sourceIds: string[],
  media: ScrapeMedia,
  PROBE_TIMEOUT_MS = 12_000,
): Promise<Set<string>> {
  if (sourceIds.length === 0) return new Set();
  const providers = getProviders();
  const results = await Promise.allSettled(
    sourceIds.map(async (id) => {
      return new Promise<string>((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error(`timeout:${id}`)), PROBE_TIMEOUT_MS);
        providers
          .runSourceScraper({ id, media })
          .then((out) => {
            clearTimeout(timer);
            if (out?.stream && out.stream.length > 0) {
              resolve(id);
            } else {
              reject(new Error(`no-stream:${id}`));
            }
          })
          .catch((err) => {
            clearTimeout(timer);
            reject(err);
          });
      });
    }),
  );

  const working = new Set<string>();
  results.forEach((r) => {
    if (r.status === "fulfilled") working.add(r.value);
  });
  return working;
}

function useBaseScrape() {
  const [sources, setSources] = useState<Record<string, ScrapingSegment>>({});
  const [sourceOrder, setSourceOrder] = useState<ScrapingItems[]>([]);
  const [currentSource, setCurrentSource] = useState<string>();
  const [probedSources, setProbedSources] = useState<Record<string, ProbeStatus>>({});
  const lastId = useRef<string | null>(null);


  const initEvent = useCallback((evt: ScraperEvent<"init">) => {
    // Initialize spinner state from the providers engine source list (FebBox is now a real provider)
    setSources((existingSources) => {
      const allSources: Record<string, ScrapingSegment> = {};

      // Add all provider sources (with name overrides applied, e.g. Tugaflix 🔥)
      const patchedMeta = applyNameOverrides(getCachedMetadata());
      evt.sourceIds.forEach((v) => {
        // Preserve existing status if already set (e.g. from resume)
        if (existingSources[v]) {
          allSources[v] = existingSources[v];
          return;
        }
        const source = patchedMeta.find((s) => s.id === v);
        const out: ScrapingSegment = {
          name: source?.name || v,
          id: v,
          status: "waiting",
          percentage: 0,
        };
        allSources[v] = out;
      });

      return allSources;
    });

    setSourceOrder((existingOrder) => {
      const allSourceOrder: ScrapingItems[] = [];

      // Add provider sources in order
      evt.sourceIds.forEach((v) => {
        if (!allSourceOrder.find((o) => o.id === v)) {
          allSourceOrder.push({ id: v, children: [] });
        }
      });

      // Keep any existing entries not in this list (e.g. from resume)
      existingOrder.forEach((o) => {
        if (!allSourceOrder.find((ao) => ao.id === o.id)) {
          allSourceOrder.push(o);
        }
      });

      return allSourceOrder;
    });
  }, []);

  const startEvent = useCallback((id: ScraperEvent<"start">) => {
    const lastIdTmp = lastId.current;
    setSources((s) => {
      if (s[id]) s[id].status = "pending";
      if (lastIdTmp && s[lastIdTmp] && s[lastIdTmp].status === "pending")
        s[lastIdTmp].status = "notfound";
      return { ...s };
    });
    setCurrentSource(id);
    lastId.current = id;
  }, []);

  const updateEvent = useCallback((evt: ScraperEvent<"update">) => {
    setSources((s) => {
      if (s[evt.id]) {
        s[evt.id].status = evt.status;
        s[evt.id].reason = evt.reason;
        s[evt.id].error = evt.error;
        s[evt.id].percentage = evt.percentage;
      }
      return { ...s };
    });
  }, []);

  const discoverEmbedsEvent = useCallback(
    (evt: ScraperEvent<"discoverEmbeds">) => {
      setSources((s) => {
        evt.embeds.forEach((v) => {
          const source = getCachedMetadata().find(
            (src) => src.id === v.embedScraperId,
          );
          const out: ScrapingSegment = {
            embedId: v.embedScraperId,
            name: source?.name ?? v.embedScraperId,
            id: v.id,
            status: "waiting",
            percentage: 0,
          };
          s[v.id] = out;
        });
        return { ...s };
      });
      setSourceOrder((s) => {
        const source = s.find((v) => v.id === evt.sourceId);
        if (!source) {
          console.error("invalid source id for discoverEmbeds", evt.sourceId);
          return s;
        }
        source.children = evt.embeds.map((v) => v.id);
        return [...s];
      });
    },
    [],
  );

  const startScrape = useCallback(() => {
    lastId.current = null;
  }, []);

  const getResult = useCallback((output: RunOutput | null) => {
    if (output && lastId.current) {
      setSources((s) => {
        if (!lastId.current) return s;
        if (s[lastId.current]) s[lastId.current].status = "success";
        return { ...s };
      });
    }
    return output;
  }, []);

  return {
    initEvent,
    startEvent,
    updateEvent,
    discoverEmbedsEvent,
    startScrape,
    getResult,
    sources,
    sourceOrder,
    currentSource,
    probedSources,
    setProbedSources,
    setSources,
    setSourceOrder,
    setCurrentSource,
  };
}

export function useScrape() {
  const {
    sources,
    sourceOrder,
    currentSource,
    updateEvent,
    discoverEmbedsEvent,
    initEvent,
    getResult,
    startEvent,
    startScrape,
    probedSources,
    setProbedSources,
    setSources,
    setSourceOrder,
    setCurrentSource,
  } = useBaseScrape();

  const preferredSourceOrder = usePreferencesStore((s) => s.sourceOrder);
  const enableSourceOrder = usePreferencesStore((s) => s.enableSourceOrder);
  const lastSuccessfulSource = usePreferencesStore(
    (s) => s.lastSuccessfulSource,
  );
  const setLastSuccessfulSource = usePreferencesStore(
    (s) => s.setLastSuccessfulSource,
  );
  const enableLastSuccessfulSource = usePreferencesStore(
    (s) => s.enableLastSuccessfulSource,
  );
  const disabledSources = usePreferencesStore((s) => s.disabledSources);
  const preferredEmbedOrder = usePreferencesStore((s) => s.embedOrder);
  const enableEmbedOrder = usePreferencesStore((s) => s.enableEmbedOrder);
  const disabledEmbeds = usePreferencesStore((s) => s.disabledEmbeds);

  const startScraping = useCallback(
    async (media: ScrapeMedia, startFromSourceId?: string) => {
      const extensionActive = await isExtensionActive();
      const providerInstance = getProviders();
      const allSources = providerInstance.listSources();
      const playerState = usePlayerStore.getState();

      // Get media-specific failed sources/embeds using the new per-media tracking
      const { getMediaKey } = await import("@/stores/player/slices/source");
      let mediaKey = getMediaKey(playerState.meta);
      if (!mediaKey) {
        // Derive media key from ScrapeMedia if meta is not set yet
        if (media.type === "movie") {
          mediaKey = `movie-${media.tmdbId}`;
        } else if (media.type === "show" && media.season && media.episode) {
          mediaKey = `show-${media.tmdbId}-${media.season.tmdbId}-${media.episode.tmdbId}`;
        } else if (media.type === "show") {
          mediaKey = `show-${media.tmdbId}`;
        }
      }
      const failedSources = mediaKey
        ? playerState.failedSourcesPerMedia[mediaKey] || []
        : [];
      const failedEmbeds = mediaKey
        ? playerState.failedEmbedsPerMedia[mediaKey] || {}
        : {};

      // All sources from the providers engine
      // Filtered by: media type, not disabled, not already failed for this media, and strictly allowed IDs
      // Sort order: determined by getSourceSortOrder (custom or default alphabetical order)
      const sortOrder = getSourceSortOrder(preferredSourceOrder, enableSourceOrder);

      // All sources from the providers engine — filter by media type support,
      // disabled sources list, and already-failed sources for this media.
      // We do NOT restrict to ALLOWED_IDS here so TV-capable providers are not
      // accidentally excluded.
      const availableSources = allSources
        .filter((source) => {
          const isMovie = media.type === "movie";
          const supportsMovie = source.mediaTypes?.includes("movie");
          const supportsShow = source.mediaTypes?.includes("show");
          if (isMovie && !supportsMovie) return false;
          if (!isMovie && !supportsShow) return false;
          return (
            !(disabledSources || []).includes(source.id) &&
            !failedSources.includes(source.id)
          );
        })
        .map((source) => source.id);

      let baseSourceOrder = availableSources;
      baseSourceOrder.sort((a, b) => {
        if (extensionActive) {
          const extensionIds = ["vidlink-custom", "lookmovie"];
          const isExtA = extensionIds.includes(a);
          const isExtB = extensionIds.includes(b);
          if (isExtA && !isExtB) return -1;
          if (!isExtA && isExtB) return 1;
        }
        const idxA = sortOrder.indexOf(a);
        const idxB = sortOrder.indexOf(b);
        return (idxA === -1 ? 999 : idxA) - (idxB === -1 ? 999 : idxB);
      });

      // If starting from a specific source ID, filter the order to start AFTER that source
      let filteredSourceOrder = baseSourceOrder;
      if (startFromSourceId) {
        let startIndex = filteredSourceOrder.indexOf(startFromSourceId);

        // If the source was removed (e.g., due to failing previously), find its index in the unfiltered list
        if (startIndex === -1) {
          // Disabled FebBox injection: the FebBox source is temporarily hidden.
          // const unfilteredOrder = allSources.map((s) => s.id);
          // // Add custom sources to unfiltered order for reference
          // const febboxKeyPresent =
          //   usePreferencesStore.getState().febboxKey ||
          //   import.meta.env.VITE_DEFAULT_FEBBOX_KEY;
          // if (febboxKeyPresent && !unfilteredOrder.includes("febbox")) {
          //   unfilteredOrder.unshift("febbox");
          // }
          const unfilteredOrder = allSources.map((s) => s.id);

          const rawIndex = unfilteredOrder.indexOf(startFromSourceId);
          if (rawIndex !== -1) {
            // Find the next available source in the filtered list that comes AFTER the rawIndex
            const nextAvailable = unfilteredOrder
              .slice(rawIndex + 1)
              .find((id) => filteredSourceOrder.includes(id));
            if (nextAvailable) {
              startIndex = filteredSourceOrder.indexOf(nextAvailable) - 1; // -1 because we slice(startIndex + 1) below
            }
          }
        }

        if (startIndex !== -1) {
          filteredSourceOrder = filteredSourceOrder.slice(startIndex + 1);
        }

        // If we reached the end of the list, DO NOT loop back — return empty so error screen shows
        if (filteredSourceOrder.length === 0) {
          filteredSourceOrder = [];
        }
      }

      // Collect all failed embed IDs across all sources
      const allFailedEmbedIds = Object.values(failedEmbeds).flat();

      // Filter out disabled and failed embeds from the embed order
      const filteredEmbedOrder = enableEmbedOrder
        ? (preferredEmbedOrder || []).filter(
            (id) =>
              !(disabledEmbeds || []).includes(id) &&
              !allFailedEmbedIds.includes(id),
          )
        : undefined;

      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      // PHASE 1: Parallel probe — scan ALL sources simultaneously.
      // Run runSourceScraper() for every candidate at once. Only sources that
      // return a valid stream are shown in the spinner and source list.
      // Failed / timed-out sources are silently hidden from both.
      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      const probeOrder = [...baseSourceOrder];

      // Mark every candidate as 'probing' immediately
      const initialProbeState: Record<string, ProbeStatus> = {};
      probeOrder.forEach((id) => { initialProbeState[id] = "probing"; });
      setProbedSources(initialProbeState);
      if (mediaKey) {
        usePlayerStore.getState().setProbedSources(mediaKey, initialProbeState);
      }

      // Split probe order into zeticuz vs regular providers.
      // Zeticuz providers must NOT be probed via parallelProbe (all 12 scrapers
      // share the same slow API call — the 12s timeout fires before it responds).
      // Instead, probe zeticuz once via a direct API fetch (45s timeout).
      const zeticuzProbeIds = probeOrder.filter((id) => id.startsWith("zeticuz-"));
      const regularProbeIds = probeOrder.filter((id) => !id.startsWith("zeticuz-"));

      let zeticuzPromise = Promise.resolve({ workingIds: new Set<string>(), isAnime: false });
      if (zeticuzProbeIds.length > 0) {
        zeticuzPromise = probeZeticuzProviders(zeticuzProbeIds, media);
      }

      let workingSourceIds: Set<string>;
      let isAnime = false;
      let regularWorking: Set<string>;

      if (extensionActive) {
        // Probe local providers first
        regularWorking = await parallelProbe(regularProbeIds, media);
        let allowedExtensionWorking = [...regularWorking].filter(
          (id) => id === "lookmovie" || id === "vidlink-custom"
        );
        if (media.type === "show") {
          allowedExtensionWorking = allowedExtensionWorking.filter(
            (id) => id !== "lookmovie"
          );
        }

        if (allowedExtensionWorking.length > 0) {
          const firstId = allowedExtensionWorking[0];
          try {
            const patchedMetaForSpinner = applyNameOverrides(
              allSources.map((s) => ({ id: s.id, name: s.name })),
            );
            const source = patchedMetaForSpinner.find((s) => s.id === firstId);
            const rawName = source?.name || firstId;
            const patchedName = SOURCE_NAME_OVERRIDES[firstId] ?? rawName;

            setSources({
              [firstId]: {
                id: firstId,
                name: patchedName,
                status: "pending",
                percentage: 0,
              },
            });
            setSourceOrder([{ id: firstId, children: [] }]);
            setCurrentSource(firstId);
            lastId.current = firstId;
            startScrape();

            const providers = getProviders();
            const out = await providers.runSourceScraper({
              id: firstId,
              media,
              events: {
                init: initEvent,
                start: startEvent,
                update: updateEvent,
                discoverEmbeds: discoverEmbedsEvent,
              },
            });

            if (out?.stream && out.stream.length > 0) {
              const partialProbeState: Record<string, ProbeStatus> = {};
              probeOrder.forEach((id) => {
                partialProbeState[id] = id === firstId ? "working" : "probing";
              });
              setProbedSources(partialProbeState);

              if (isExtensionActiveCached()) {
                await prepareStream(out.stream);
              }

              // Background resolution of zeticuz results
              zeticuzPromise.then((zeticuzResult) => {
                const finalProbeState: Record<string, ProbeStatus> = {};
                probeOrder.forEach((id) => {
                  const isWorking =
                    id === firstId ||
                    zeticuzResult.workingIds.has(id) ||
                    regularWorking.has(id);
                  finalProbeState[id] = isWorking ? "working" : "failed";
                });
                setProbedSources(finalProbeState);
                if (mediaKey) {
                  usePlayerStore.getState().setProbedSources(mediaKey, finalProbeState);
                }
              }).catch(console.error);

              return getResult(out);
            }
          } catch (err) {
            console.error(`Early scrape failed for ${firstId}`, err);
          }
        }

        // If local run failed or returned no streams, wait for zeticuz to finish
        try {
          const zeticuzResult = await zeticuzPromise;
          workingSourceIds = new Set([...zeticuzResult.workingIds, ...regularWorking]);
          isAnime = zeticuzResult.isAnime;
        } catch {
          workingSourceIds = new Set(probeOrder);
        }
      } else {
        // Fallback: wait for both
        try {
          const [zeticuzResult, regWorking] = await Promise.all([
            zeticuzPromise,
            parallelProbe(regularProbeIds, media),
          ]);
          regularWorking = regWorking;
          workingSourceIds = new Set([...zeticuzResult.workingIds, ...regularWorking]);
          isAnime = zeticuzResult.isAnime;
        } catch {
          workingSourceIds = new Set(probeOrder);
        }
      }

      if (isAnime) {
        const animeFiltered = (id: string) => id !== "lookmovie" && id !== "vidlink" && id !== "vidlink-custom";
        workingSourceIds = new Set([...workingSourceIds].filter(animeFiltered));
        baseSourceOrder = baseSourceOrder.filter(animeFiltered);
        filteredSourceOrder = filteredSourceOrder.filter(animeFiltered);
      }

      if (media.type === "movie") {
        const movieFiltered = (id: string) => id !== "zeticuz-anikoto" && id !== "zeticuz-anikai";
        workingSourceIds = new Set([...workingSourceIds].filter(movieFiltered));
        baseSourceOrder = baseSourceOrder.filter(movieFiltered);
        filteredSourceOrder = filteredSourceOrder.filter(movieFiltered);
      }

      if (media.type === "show") {
        const showFiltered = (id: string) => id !== "lookmovie";
        workingSourceIds = new Set([...workingSourceIds].filter(showFiltered));
        baseSourceOrder = baseSourceOrder.filter(showFiltered);
        filteredSourceOrder = filteredSourceOrder.filter(showFiltered);
      }

      // Update probedSources with final results
      const finalProbeState: Record<string, ProbeStatus> = {};
      probeOrder.forEach((id) => {
        finalProbeState[id] = workingSourceIds.has(id) ? "working" : "failed";
      });
      setProbedSources(finalProbeState);
      if (mediaKey) {
        usePlayerStore.getState().setProbedSources(mediaKey, finalProbeState);
      }

      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      // PHASE 2: Filter to working sources only, then run sequential scraper
      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      const workingOrder = baseSourceOrder.filter((id) => workingSourceIds.has(id));
      // Graceful fallback: if probe found nothing, try everything anyway
      const effectiveSourceOrder = workingOrder.length > 0 ? workingOrder : baseSourceOrder;

      // Use effectiveSourceOrder (working sources only) for spinner init when not resuming
      const spinnerSourceOrder = startFromSourceId
        ? filteredSourceOrder
        : effectiveSourceOrder;

      // Initialize sources in spinner â€” only show what we'll actually try
      const allSourcesInit: Record<string, ScrapingSegment> = {};
      const allSourceOrder: ScrapingItems[] = [];

      // Map spinnerSourceOrder to ScrapingSegment items (all sources come from the providers engine)
      const patchedMetaForSpinner = applyNameOverrides(
        allSources.map((s) => ({ id: s.id, name: s.name })),
      );
      const combinedSources: ScrapingSegment[] = spinnerSourceOrder.map(
        (id) => {
          const source = patchedMetaForSpinner.find((s) => s.id === id);
          const rawName = source?.name || id;
          const patchedName = SOURCE_NAME_OVERRIDES[id] ?? rawName;
          return {
            id,
            name: patchedName,
            status: "waiting" as const,
            percentage: 0,
          };
        },
      );

      // Build the sources and order for the spinner
      combinedSources.forEach((source) => {
        allSourcesInit[source.id] = { ...source };
        allSourceOrder.push({ id: source.id, children: [] });
      });

      setSources(allSourcesInit);
      setSourceOrder(allSourceOrder);

      // Run all providers in the correct order (only working sources from probe)
      // The providers engine handles NotFoundError silently
      const providerSourceOrder = startFromSourceId ? filteredSourceOrder : effectiveSourceOrder;

      const providerApiUrl = getLoadbalancedProviderApiUrl();
      const hasZeticuz = providerSourceOrder.some((id) => id.startsWith("zeticuz-"));
      if (providerApiUrl && !extensionActive && !hasZeticuz) {
        startScrape();
        const baseUrlMaker = makeProviderUrl(providerApiUrl);
        const conn = await connectServerSideEvents<RunOutput | "">(
          baseUrlMaker.scrapeAll(
            media,
            providerSourceOrder,
            filteredEmbedOrder,
          ),
          ["completed", "noOutput"],
        );
        conn.on("init", initEvent);
        conn.on("start", startEvent);
        conn.on("update", updateEvent);
        conn.on("discoverEmbeds", discoverEmbedsEvent);
        const sseOutput = await conn.promise();
        if (sseOutput && isExtensionActiveCached())
          await prepareStream(sseOutput.stream);

        return getResult(sseOutput === "" ? null : sseOutput);
      }

      startScrape();
      const providers = getProviders();
      const output = await providers.runAll({
        media,
        sourceOrder: providerSourceOrder,
        embedOrder: filteredEmbedOrder,
        events: {
          init: initEvent,
          start: startEvent,
          update: updateEvent,
          discoverEmbeds: discoverEmbedsEvent,
        },
      });

      if (output && isExtensionActiveCached())
        await prepareStream(output.stream);
      return getResult(output);
    },
    [
      initEvent,
      startEvent,
      updateEvent,
      discoverEmbedsEvent,
      getResult,
      startScrape,
      preferredSourceOrder,
      enableSourceOrder,
      enableLastSuccessfulSource,
      lastSuccessfulSource,
      setLastSuccessfulSource,
      disabledSources,
      preferredEmbedOrder,
      enableEmbedOrder,
      disabledEmbeds,
      setSources,
      setSourceOrder,
      setCurrentSource,
      setProbedSources,
    ],
  );

  const resumeScraping = useCallback(
    async (media: ScrapeMedia, startFromSourceId: string) => {
      return startScraping(media, startFromSourceId);
    },
    [startScraping],
  );

  return {
    startScraping,
    resumeScraping,
    sourceOrder,
    sources,
    currentSource,
    probedSources,
  };
}

export function useListCenter(
  containerRef: RefObject<HTMLDivElement | null>,
  listRef: RefObject<HTMLDivElement | null>,
  sourceOrder: ScrapingItems[],
  currentSource: string | undefined,
) {
  const [renderedOnce, setRenderedOnce] = useState(false);

  const updatePosition = useCallback(() => {
    if (!containerRef.current) return;
    if (!listRef.current) return;

    const elements = [
      ...listRef.current.querySelectorAll("div[data-source-id]"),
    ] as HTMLDivElement[];

    const currentIndex = elements.findIndex(
      (e) => e.getAttribute("data-source-id") === currentSource,
    );

    const currentElement = elements[currentIndex];

    if (!currentElement) return;

    const containerWidth = containerRef.current.getBoundingClientRect().width;
    const listWidth = listRef.current.getBoundingClientRect().width;

    const containerHeight = containerRef.current.getBoundingClientRect().height;

    const listTop = listRef.current.getBoundingClientRect().top;

    const currentTop = currentElement.getBoundingClientRect().top;
    const currentHeight = currentElement.getBoundingClientRect().height;

    const topDifference = currentTop - listTop;

    const listNewLeft = containerWidth / 2 - listWidth / 2;
    const listNewTop = containerHeight / 2 - topDifference - currentHeight / 2;

    // On the very first render, snap into position immediately (no animation).
    // On subsequent updates (source changes), animate smoothly.
    if (!renderedOnce) {
      listRef.current.style.transition = "none";
    } else {
      listRef.current.style.transition = "transform 0.35s cubic-bezier(0.4,0,0.2,1)";
    }
    listRef.current.style.transform = `translateY(${listNewTop}px) translateX(${listNewLeft}px)`;
    setTimeout(() => {
      setRenderedOnce(true);
    }, 150);
  }, [currentSource, containerRef, listRef, setRenderedOnce, renderedOnce]);

  const updatePositionRef = useRef(updatePosition);

  useEffect(() => {
    updatePosition();
    updatePositionRef.current = updatePosition;
  }, [updatePosition, sourceOrder]);

  useEffect(() => {
    function resize() {
      updatePositionRef.current();
    }
    window.addEventListener("resize", resize);
    return () => {
      window.removeEventListener("resize", resize);
    };
  }, []);

  return renderedOnce;
}
