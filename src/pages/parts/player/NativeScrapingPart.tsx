import { ScrapeMedia } from "@p-stream/providers";
import type { ProviderControls } from "@p-stream/providers";
import { useEffect, useRef, useState } from "react";
import type { AsyncReturnType } from "type-fest";

import {
  getServers,
  getVideo,
  isNativeApp,
} from "@/backend/native/nexusBridge";
import { Loading } from "@/components/layout/Loading";

// ─── Types ────────────────────────────────────────────────────────────────────

interface NativeScrapingProps {
  media: ScrapeMedia;
  onGetStream?: (stream: AsyncReturnType<ProviderControls["runAll"]>) => void;
  onResult?: () => void;
}

// ─── Component ───────────────────────────────────────────────────────────────

/**
 * NativeScrapingPart
 *
 * Replaces the browser-based ScrapingPart when running inside the
 * NEXUS Android WebView. Routes all scraping through the Kotlin bridge
 * (window.__nexus) which invokes the native Kotlin extractors.
 *
 * The output is converted to the same RunOutput shape that playAfterScrape
 * expects, so the rest of the player pipeline is unchanged.
 */
export function NativeScrapingPart(props: NativeScrapingProps) {
  const [status, setStatus] = useState<"loading" | "error">("loading");
  const [errorMsg, setErrorMsg] = useState<string>("");
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    (async () => {
      try {
        if (!isNativeApp()) {
          throw new Error("NativeScrapingPart: not running in native WebView");
        }

        const { tmdbId, type, season, episode } = extractMediaParams(
          props.media,
        );

        // 1. Get available servers from Kotlin provider
        const servers = await getServers(tmdbId, type, season, episode);
        if (servers.length === 0) {
          throw new Error("No servers found for this media");
        }

        // 2. Extract the video URL from the first working server
        let video = null;
        let lastError = "";
        for (const server of servers) {
          try {
            video = await getVideo(server);
            if (video?.source) break;
          } catch (e: any) {
            lastError = e.message ?? String(e);
          }
        }

        if (!video?.source) {
          throw new Error(`All servers failed. Last error: ${lastError}`);
        }

        // 3. Convert to the RunOutput shape the player expects
        const runOutput = buildRunOutput(video, servers[0]);
        props.onResult?.();
        props.onGetStream?.(runOutput as any);
      } catch (e: any) {
        console.error("[NativeScraping]", e?.message ?? e);
        setErrorMsg(e?.message ?? "Unknown scraping error");
        setStatus("error");
        props.onResult?.();
      }
    })();
  }, [props]);

  if (status === "error") {
    return (
      <div className="flex flex-col items-center justify-center h-full text-white p-8">
        <p className="text-red-400 font-bold mb-2">
          ⚠ Native Extraction Failed
        </p>
        <p className="text-sm text-gray-300 text-center">{errorMsg}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center h-full gap-4">
      <Loading className="mb-4" />
      <p className="text-type-secondary text-sm">
        Fetching stream via native engine…
      </p>
    </div>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function extractMediaParams(media: ScrapeMedia): {
  tmdbId: string;
  type: "movie" | "tv";
  season: number;
  episode: number;
} {
  if (media.type === "movie") {
    return { tmdbId: media.tmdbId, type: "movie", season: 0, episode: 0 };
  }
  // series/show
  return {
    tmdbId: media.tmdbId,
    type: "tv",
    season: media.season.number,
    episode: media.episode.number,
  };
}

function buildRunOutput(video: any, server: any) {
  // Build a minimal RunOutput compatible object for the player pipeline.
  // The player only needs stream.type, stream.playlist / stream.qualities,
  // stream.captions, and sourceId.
  const isHLS =
    video.source?.includes(".m3u8") || video.type === "application/x-mpegURL";

  const stream = isHLS
    ? {
        type: "hls" as const,
        playlist: video.source,
        captions: (video.subtitles ?? []).map((s: any, i: number) => ({
          id: `native-sub-${i}`,
          language: s.label ?? "Unknown",
          hasCorsRestrictions: false,
          type: s.file?.endsWith(".vtt") ? "vtt" : "srt",
          url: s.file,
        })),
        headers: video.headers ?? {},
        flags: [],
      }
    : {
        type: "file" as const,
        qualities: {
          unknown: {
            type: "mp4" as const,
            url: video.source,
          },
        },
        captions: (video.subtitles ?? []).map((s: any, i: number) => ({
          id: `native-sub-${i}`,
          language: s.label ?? "Unknown",
          hasCorsRestrictions: false,
          type: s.file?.endsWith(".vtt") ? "vtt" : "srt",
          url: s.file,
        })),
        headers: video.headers ?? {},
        flags: [],
      };

  return {
    sourceId: `native-${server.name ?? "extractor"}`,
    stream,
  };
}
