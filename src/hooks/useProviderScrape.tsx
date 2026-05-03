import { FullScraperEvents, RunOutput, ScrapeMedia } from "@p-stream/providers";
import { RefObject, useCallback, useEffect, useRef, useState } from "react";

import { isExtensionActiveCached } from "@/backend/extension/messaging";
import { prepareStream } from "@/backend/extension/streams";
import {
  connectServerSideEvents,
  getCachedMetadata,
  makeProviderUrl,
} from "@/backend/helpers/providerApi";
import { getLoadbalancedProviderApiUrl } from "@/backend/providers/fetchers";
import { getProviders } from "@/backend/providers/providers";
import { usePlayerStore } from "@/stores/player/store";
import { usePreferencesStore } from "@/stores/preferences";

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

type ScraperEvent<Event extends keyof FullScraperEvents> = Parameters<
  NonNullable<FullScraperEvents[Event]>
>[0];

// Custom sources that should appear in the spinner (defined outside to avoid recreating on every render)
const customSources: ScrapingSegment[] = [
  { id: "febbox", name: "FebBox (4K) ⭐", status: "waiting", percentage: 0 },
];

// Source name overrides for builtin providers (adds emojis etc.)
const SOURCE_NAME_OVERRIDES: Record<string, string> = {
  tugaflix: "Tugaflix 🔥",
};

function applyNameOverrides(
  metadata: { id: string; name: string }[],
): { id: string; name: string }[] {
  return metadata.map((s) =>
    SOURCE_NAME_OVERRIDES[s.id] ? { ...s, name: SOURCE_NAME_OVERRIDES[s.id] } : s,
  );
}

function useBaseScrape() {
  const [sources, setSources] = useState<Record<string, ScrapingSegment>>({});
  const [sourceOrder, setSourceOrder] = useState<ScrapingItems[]>([]);
  const [currentSource, setCurrentSource] = useState<string>();
  const lastId = useRef<string | null>(null);

  const initEvent = useCallback((evt: ScraperEvent<"init">) => {
    // PRESERVE existing custom sources (they may be processing) and ADD provider sources
    setSources((existingSources) => {
      const allSources: Record<string, ScrapingSegment> = {};

      // First, add custom sources (preserve existing status if already processing)
      customSources.forEach((source) => {
        if (existingSources[source.id]) {
          allSources[source.id] = existingSources[source.id];
        } else {
          allSources[source.id] = { ...source };
        }
      });

      // Add regular provider sources (with name overrides applied)
      const patchedMeta = applyNameOverrides(getCachedMetadata());
      evt.sourceIds.forEach((v) => {
        const source = patchedMeta.find((s) => s.id === v);
        if (!source) return;
        const out: ScrapingSegment = {
          name: source.name,
          id: source.id,
          status: "waiting",
          percentage: 0,
        };
        allSources[v] = out;
      });

      return allSources;
    });

    setSourceOrder((existingOrder) => {
      const allSourceOrder: ScrapingItems[] = [];

      // Add custom sources first (if not already in order)
      customSources.forEach((source) => {
        if (!existingOrder.find((o) => o.id === source.id)) {
          allSourceOrder.push({ id: source.id, children: [] });
        }
      });

      // Keep existing custom source order
      existingOrder
        .filter((o) => customSources.some((c) => c.id === o.id))
        .forEach((o) => {
          if (!allSourceOrder.find((ao) => ao.id === o.id)) {
            allSourceOrder.push(o);
          }
        });

      // Add provider sources
      evt.sourceIds.forEach((v) => {
        if (!allSourceOrder.find((o) => o.id === v)) {
          allSourceOrder.push({ id: v, children: [] });
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
        s[lastIdTmp].status = "success";
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
          if (!source) throw new Error("invalid source id");
          const out: ScrapingSegment = {
            embedId: v.embedScraperId,
            name: source.name,
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
        if (!source) throw new Error("invalid source id");
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

      // Start with all available sources (filtered by disabled and failed ones)
      const hasFebboxKey =
        usePreferencesStore.getState().febboxKey ||
        import.meta.env.VITE_DEFAULT_FEBBOX_KEY;
      const availableSources = allSources
        .filter(
          (source) =>
            !(disabledSources || []).includes(source.id) &&
            !failedSources.includes(source.id),
        )
        .map((source) => source.id);

      // Inject FebBox into the available sources list at rank position 880
      // (after ZeticuzApi rank 890, before Tugaflix rank ~806)
      // This gives: VidLink > ZeticuzApi > FebBox > Tugaflix > FSOnline > ...
      if (hasFebboxKey && !availableSources.includes("febbox")) {
        const zeticuzIdx = availableSources.indexOf("zeticuzapi-custom");
        if (zeticuzIdx !== -1) {
          // Insert after ZeticuzApi
          availableSources.splice(zeticuzIdx + 1, 0, "febbox");
        } else {
          // Fallback: insert at position 2 (after VidLink and ZeticuzApi slot)
          availableSources.splice(2, 0, "febbox");
        }
      }

      let baseSourceOrder = availableSources;

      // Apply custom source ordering if enabled (from settings)
      if (enableSourceOrder && (preferredSourceOrder || []).length > 0) {
        const orderedSources: string[] = [];
        const remainingSources = [...baseSourceOrder];

        // Add sources in preferred order
        for (const sourceId of preferredSourceOrder) {
          const sourceIndex = remainingSources.indexOf(sourceId);
          if (sourceIndex !== -1) {
            orderedSources.push(sourceId);
            remainingSources.splice(sourceIndex, 1);
          }
        }

        // Add remaining sources
        baseSourceOrder = [...orderedSources, ...remainingSources];
      }

      // Dynamic prioritization: last successful source goes to the very top
      if (enableLastSuccessfulSource && lastSuccessfulSource) {
        const lastSourceIndex = baseSourceOrder.indexOf(lastSuccessfulSource);
        if (lastSourceIndex !== -1) {
          baseSourceOrder = [
            lastSuccessfulSource,
            ...baseSourceOrder.filter((id) => id !== lastSuccessfulSource),
          ];
        }
      }
      // Otherwise: natural rank-based ordering is used (VidLink 900 > ZeticuzApi 890 > FebBox 880 > Tugaflix > FSOnline...)

      // If starting from a specific source ID, filter the order to start AFTER that source
      let filteredSourceOrder = baseSourceOrder;
      if (startFromSourceId) {
        let startIndex = filteredSourceOrder.indexOf(startFromSourceId);

        // If the source was removed (e.g., due to failing previously), find its index in the unfiltered list
        if (startIndex === -1) {
          const unfilteredOrder = allSources.map((s) => s.id);
          // Add custom sources to unfiltered order for reference
          const febboxKeyPresent =
            usePreferencesStore.getState().febboxKey ||
            import.meta.env.VITE_DEFAULT_FEBBOX_KEY;
          if (febboxKeyPresent && !unfilteredOrder.includes("febbox")) {
            unfilteredOrder.unshift("febbox");
          }

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
        } else {
          // Explicitly prevent restarting from beginning if we were trying to find the next source and failed
          // If we couldn't find a valid starting point, just empty it or find something else so we don't loop
          const currentFebboxIdx = filteredSourceOrder.indexOf("febbox");
          if (startFromSourceId === "febbox" && currentFebboxIdx !== -1) {
            filteredSourceOrder = filteredSourceOrder.slice(
              currentFebboxIdx + 1,
            );
          }
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

      // Use filteredSourceOrder for spinner when resuming, baseSourceOrder for fresh start
      const spinnerSourceOrder = startFromSourceId
        ? filteredSourceOrder
        : baseSourceOrder;

      // Initialize sources in spinner â€” only show what we'll actually try
      const allSourcesInit: Record<string, ScrapingSegment> = {};
      const allSourceOrder: ScrapingItems[] = [];

      // Map spinnerSourceOrder to ScrapingSegment items
      const combinedSources: ScrapingSegment[] = spinnerSourceOrder.map(
        (id) => {
          // If it's a custom source (FebBox)
          const custom = customSources.find((c) => c.id === id);
          if (custom) return { ...custom, status: "waiting" as const };

          // Otherwise it's a provider source — apply name overrides (e.g. Tugaflix 🔥)
          const source = allSources.find((s) => s.id === id);
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

      // Only try custom sources that are in filteredSourceOrder (respects resume position)
      const customSourceIdsToTry = filteredSourceOrder.filter((id) =>
        customSources.some((c) => c.id === id),
      );

      // Try custom sources (FebBox) only if they are in the filtered list
      for (const customSourceId of customSourceIdsToTry) {
        if (customSourceId === "febbox") {
          // Try Febbox with a 15-second timeout for fast failure detection
          setCurrentSource("febbox");
          setSources((s) => ({
            ...s,
            febbox: { ...s.febbox, status: "pending", percentage: 50 },
          }));
          try {
            const { scrapeFemboxMovie, scrapeFemboxTV, convertFemboxToStream } =
              await import("@/backend/providers/fembox");

            // Wrap FebBox scraping in a timeout (15s max)
            const febboxTimeout = <T,>(
              promise: Promise<T>,
              ms: number,
            ): Promise<T | null> =>
              Promise.race([
                promise,
                new Promise<null>((resolve) => {
                  setTimeout(() => resolve(null), ms);
                }),
              ]);

            let femboxData = null;
            if (media.type === "movie") {
              femboxData = await febboxTimeout(
                scrapeFemboxMovie(media.tmdbId),
                15000,
              );
            } else if (media.type === "show" && media.episode && media.season) {
              femboxData = await febboxTimeout(
                scrapeFemboxTV(
                  media.tmdbId,
                  media.season.number,
                  media.episode.number,
                ),
                15000,
              );
            }

            if (femboxData) {
              const stream = convertFemboxToStream(femboxData);
              if (stream) {
                setSources((s) => ({
                  ...s,
                  febbox: { ...s.febbox, status: "success", percentage: 100 },
                }));
                setLastSuccessfulSource("febbox");
                const femboxOutput = {
                  stream: { ...stream, id: "febbox-stream" },
                  sourceId: "febbox",
                  embedId: undefined,
                };
                if (isExtensionActiveCached()) {
                  await prepareStream(femboxOutput.stream);
                }
                return getResult(femboxOutput);
              }
            }
            setSources((s) => ({
              ...s,
              febbox: { ...s.febbox, status: "failure", percentage: 100 },
            }));
          } catch {
            setSources((s) => ({
              ...s,
              febbox: { ...s.febbox, status: "failure", percentage: 100 },
            }));
          }
        }
      }

      // Continue with regular providers (exclude custom sources like febbox from provider engine)
      const customSourceIds = customSources.map((c) => c.id);
      const providerSourceOrder = filteredSourceOrder.filter(
        (id) => !customSourceIds.includes(id),
      );

      const providerApiUrl = getLoadbalancedProviderApiUrl();
      if (providerApiUrl && !isExtensionActiveCached()) {
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

    listRef.current.style.transform = `translateY(${listNewTop}px) translateX(${listNewLeft}px)`;
    setTimeout(() => {
      setRenderedOnce(true);
    }, 150);
  }, [currentSource, containerRef, listRef, setRenderedOnce]);

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
