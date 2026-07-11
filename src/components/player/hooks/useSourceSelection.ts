import {
  EmbedOutput,
  NotFoundError,
  SourcererOutput,
} from "@p-stream/providers";
import { useAsyncFn } from "react-use";

import { isExtensionActiveCached } from "@/backend/extension/messaging";
import { prepareStream } from "@/backend/extension/streams";
import {
  connectServerSideEvents,
  makeProviderUrl,
} from "@/backend/helpers/providerApi";
import {
  scrapeSourceOutputToProviderMetric,
  useReportProviders,
} from "@/backend/helpers/report";
import { getLoadbalancedProviderApiUrl } from "@/backend/providers/fetchers";
import { getProviders } from "@/backend/providers/providers";
import { convertProviderCaption } from "@/components/player/utils/captions";
import { convertRunoutputToSource } from "@/components/player/utils/convertRunoutputToSource";
import { useOverlayRouter } from "@/hooks/useOverlayRouter";
import { metaToScrapeMedia } from "@/stores/player/slices/source";
import { usePlayerStore } from "@/stores/player/store";
import { usePreferencesStore } from "@/stores/preferences";
import { useProgressStore } from "@/stores/progress";

function getSavedProgress(items: Record<string, any>, meta: any): number {
  const item = items[meta?.tmdbId ?? ""];
  if (!item || !meta) return 0;
  if (meta.type === "movie") {
    if (!item.progress) return 0;
    return item.progress.watched;
  }

  const ep = item.episodes[meta.episode?.tmdbId ?? ""];
  if (!ep) return 0;
  return ep.progress.watched;
}

async function pingUrl(url: string, timeoutMs = 2500): Promise<number> {
  const start = Date.now();
  try {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeoutMs);
    await fetch(url, {
      method: "GET",
      mode: "no-cors",
      signal: controller.signal,
    });
    clearTimeout(id);
    return Date.now() - start;
  } catch (err) {
    return Infinity;
  }
}

export function useEmbedScraping(
  routerId: string,
  sourceId: string,
  url: string,
  embedId: string,
) {
  const setSource = usePlayerStore((s) => s.setSource);
  const setCaption = usePlayerStore((s) => s.setCaption);
  const setSourceId = usePlayerStore((s) => s.setSourceId);
  const setEmbedId = usePlayerStore((s) => (s as any).setEmbedId);
  const meta = usePlayerStore((s) => s.meta);
  const progressItems = useProgressStore((s) => s.items);
  const router = useOverlayRouter(routerId);
  const { report } = useReportProviders();
  const setLastSuccessfulSource = usePreferencesStore(
    (s) => s.setLastSuccessfulSource,
  );
  const enableLastSuccessfulSource = usePreferencesStore(
    (s) => s.enableLastSuccessfulSource,
  );

  const [request, run] = useAsyncFn(async () => {
    const providerApiUrl = getLoadbalancedProviderApiUrl();
    let result: EmbedOutput | undefined;
    if (!meta) return;
    try {
      if (providerApiUrl && !isExtensionActiveCached()) {
        const baseUrlMaker = makeProviderUrl(providerApiUrl);
        const conn = await connectServerSideEvents<EmbedOutput>(
          baseUrlMaker.scrapeEmbed(embedId, url),
          ["completed", "noOutput"],
        );
        result = await conn.promise();
      } else {
        result = await getProviders().runEmbedScraper({
          id: embedId,
          url,
        });
      }
    } catch (err) {
      console.error(`Failed to scrape ${embedId}`, err);
      const notFound = err instanceof NotFoundError;
      const status = notFound ? "notfound" : "failed";
      report([
        scrapeSourceOutputToProviderMetric(
          meta,
          sourceId,
          embedId,
          status,
          err,
        ),
      ]);
      throw err;
    }
    report([
      scrapeSourceOutputToProviderMetric(meta, sourceId, null, "success", null),
    ]);
    if (isExtensionActiveCached()) await prepareStream(result.stream[0]);
    setSourceId(sourceId);
    setEmbedId(embedId);
    setCaption(null);
    setSource(
      convertRunoutputToSource({ stream: result.stream[0] }),
      convertProviderCaption(result.stream[0].captions),
      getSavedProgress(progressItems, meta),
    );
    // Save the last successful source when manually selected
    if (enableLastSuccessfulSource) {
      setLastSuccessfulSource(sourceId);
    }
    router.close();
  }, [
    embedId,
    sourceId,
    meta,
    router,
    report,
    setCaption,
    enableLastSuccessfulSource,
    setLastSuccessfulSource,
  ]);

  return {
    run,
    loading: request.loading,
    errored: !!request.error,
    notFound: request.error instanceof NotFoundError,
  };
}

export function useSourceScraping(sourceId: string | null, routerId: string) {
  const meta = usePlayerStore((s) => s.meta);
  const setSource = usePlayerStore((s) => s.setSource);
  const setCaption = usePlayerStore((s) => s.setCaption);
  const setSourceId = usePlayerStore((s) => s.setSourceId);
  const setEmbedId = usePlayerStore((s) => (s as any).setEmbedId);
  const progressItems = useProgressStore((s) => s.items);
  const router = useOverlayRouter(routerId);
  const { report } = useReportProviders();
  const setLastSuccessfulSource = usePreferencesStore(
    (s) => s.setLastSuccessfulSource,
  );
  const enableLastSuccessfulSource = usePreferencesStore(
    (s) => s.enableLastSuccessfulSource,
  );

  const [request, run] = useAsyncFn(async () => {
    if (!sourceId || !meta) return null;
    setEmbedId(null);
    const scrapeMedia = metaToScrapeMedia(meta);
    const providerApiUrl = getLoadbalancedProviderApiUrl();

    // Special handling for FebBox API (fembox.aether.mom)
    if (sourceId === "febbox") {
      const { scrapeFemboxMovie, scrapeFemboxTV, convertFemboxToStream } =
        await import("@/backend/providers/fembox");

      let turnstileToken = "";
      try {
        const { getTurnstileToken, isTurnstileInitialized } = await import(
          "@/stores/turnstile"
        );
        if (isTurnstileInitialized()) {
          turnstileToken = await getTurnstileToken();
        }
      } catch {
        // Ignore turnstile error
      }

      let femboxData = null;
      if (scrapeMedia.type === "movie") {
        femboxData = await scrapeFemboxMovie(
          scrapeMedia.tmdbId,
          turnstileToken,
        );
      } else if (
        scrapeMedia.type === "show" &&
        scrapeMedia.episode &&
        scrapeMedia.season
      ) {
        femboxData = await scrapeFemboxTV(
          scrapeMedia.tmdbId,
          scrapeMedia.season.number,
          scrapeMedia.episode.number,
          turnstileToken,
        );
      }

      if (femboxData && femboxData.sources && femboxData.sources.length > 0) {
        const stream = convertFemboxToStream(femboxData);
        if (stream) {
          // Ensure the stream conforms to the required Stream interface by providing a fallback id
          const normalizedStream = {
            ...stream,
            id: `ext-${Date.now()}`,
          } as any; // cast to any to satisfy TypeScript for now
          if (isExtensionActiveCached()) await prepareStream(normalizedStream);
          setEmbedId(null);
          setCaption(null);
          setSource(
            convertRunoutputToSource({ stream: normalizedStream }),
            convertProviderCaption(normalizedStream.captions || []),
            getSavedProgress(progressItems, meta),
          );
          setSourceId(sourceId);
          if (enableLastSuccessfulSource) {
            setLastSuccessfulSource(sourceId);
          }
          router.close();
          return null;
        }
      }

      throw new NotFoundError("No streams found from FED API");
    }

    // StreamBuddy removed - proxy issues causing 403 errors

    let result: SourcererOutput | undefined;
    try {
      const isZeticuz = sourceId.startsWith("zeticuz-");
      if (providerApiUrl && !isExtensionActiveCached() && !isZeticuz) {
        const baseUrlMaker = makeProviderUrl(providerApiUrl);
        const conn = await connectServerSideEvents<SourcererOutput>(
          baseUrlMaker.scrapeSource(sourceId, scrapeMedia),
          ["completed", "noOutput"],
        );
        result = await conn.promise();
      } else {
        result = await getProviders().runSourceScraper({
          id: sourceId,
          media: scrapeMedia,
        });
      }
    } catch (err) {
      console.error(`Failed to scrape ${sourceId}`, err);
      const notFound = err instanceof NotFoundError;
      const status = notFound ? "notfound" : "failed";
      report([
        scrapeSourceOutputToProviderMetric(meta, sourceId, null, status, err),
      ]);
      throw err;
    }
    report([
      scrapeSourceOutputToProviderMetric(meta, sourceId, null, "success", null),
    ]);

    if (result.stream && result.stream.length > 0) {
      let bestStream = result.stream[0];
      if (result.stream.length > 1) {
        const pingPromises = result.stream.map(async (stream) => {
          const playlistUrl = stream.type === "hls" ? stream.playlist : (stream.qualities ? stream.qualities[Object.keys(stream.qualities)[0]]?.url : null);
          const ping = playlistUrl ? await pingUrl(playlistUrl) : Infinity;
          return { stream, ping };
        });
        const pingResults = await Promise.all(pingPromises);
        pingResults.sort((a, b) => a.ping - b.ping);
        bestStream = pingResults[0].stream;
      }
      // Normalize stream to ensure required fields exist
      const normalized = {
        ...bestStream,
        id: bestStream.id ?? `ext-${Date.now()}` as string,
      } as any;
      if (isExtensionActiveCached()) await prepareStream(normalized);
      setEmbedId(null);
      setCaption(null);
      setSource(
        convertRunoutputToSource({ stream: normalized }),
        convertProviderCaption(normalized.captions),
        getSavedProgress(progressItems, meta),
      );
      setSourceId(sourceId);
      // Save the last successful source when manually selected
      if (enableLastSuccessfulSource) {
        setLastSuccessfulSource(sourceId);
      }
      router.close();
      return null;
    }

    if (result.embeds && result.embeds.length > 0) {
      // Scrape all embeds in parallel to find the fastest/lowest ping one
      const scrapePromises = result.embeds.map(async (embed) => {
        try {
          let embedResult: EmbedOutput;
          if (providerApiUrl && !isExtensionActiveCached()) {
            const baseUrlMaker = makeProviderUrl(providerApiUrl);
            const conn = await connectServerSideEvents<EmbedOutput>(
              baseUrlMaker.scrapeEmbed(embed.embedId, embed.url),
              ["completed", "noOutput"],
            );
            embedResult = await conn.promise();
          } else {
            embedResult = await getProviders().runEmbedScraper({
              id: embed.embedId,
              url: embed.url,
            });
          }
          if (embedResult && embedResult.stream && embedResult.stream[0]) {
            const stream = embedResult.stream[0];
            const playlistUrl = stream.type === "hls" ? stream.playlist : (stream.qualities ? stream.qualities[Object.keys(stream.qualities)[0]]?.url : null);
            const ping = playlistUrl ? await pingUrl(playlistUrl) : Infinity;
            return { embed, embedResult, ping };
          }
        } catch (e) {
          // ignore failed embed scrapes
        }
        return null;
      });

      const scrapeResults = (await Promise.all(scrapePromises)).filter((r): r is NonNullable<typeof r> => r !== null);
      if (scrapeResults.length > 0) {
        // Sort by ping ascending (fastest first)
        scrapeResults.sort((a, b) => a.ping - b.ping);
        const best = scrapeResults[0];

        setSourceId(sourceId);
        setEmbedId(best.embed.embedId);
        setCaption(null);

        const embedNormalized = {
          ...best.embedResult.stream[0],
          id: best.embedResult.stream[0].id ?? `ext-${Date.now()}` as string,
        } as any;

        if (isExtensionActiveCached()) await prepareStream(embedNormalized);
        setSource(
          convertRunoutputToSource({ stream: embedNormalized }),
          convertProviderCaption(embedNormalized.captions),
          getSavedProgress(progressItems, meta),
        );
        if (enableLastSuccessfulSource) {
          setLastSuccessfulSource(sourceId);
        }
        router.close();
        return null;
      }
    }
    throw new NotFoundError("No streams found");
  }, [
    sourceId,
    meta,
    router,
    setCaption,
    enableLastSuccessfulSource,
    setLastSuccessfulSource,
  ]);

  return {
    run,
    watching: (request.value ?? null) === null,
    loading: request.loading,
    items: request.value,
    notfound: !!(request.error instanceof NotFoundError),
    errored: !!request.error,
  };
}
