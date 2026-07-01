/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  MovieScrapeContext,
  NotFoundError,
  ShowScrapeContext,
  SourcererOutput,
} from "@p-stream/providers";

const CINEPRO_URL = import.meta.env.VITE_CINEPRO_CORE_URL || "http://localhost:3000";

interface CineProSource {
  url: string;
  type: "mp4" | "hls";
  quality: string;
  audioTracks: Array<{ language: string; label: string }>;
  provider: { id: string; name: string };
}

interface CineProResponse {
  sources: CineProSource[];
  subtitles: Array<{ url: string; format: string; label: string }>;
}

function convertSources(data: CineProResponse, ctx: MovieScrapeContext | ShowScrapeContext): SourcererOutput {
  const streams = data.sources.map((s, i) => ({
    id: `cinepro-core-${i}`,
    type: s.type === "hls" ? "hls" : "file",
    ...(s.type === "hls"
      ? { playlist: s.url }
      : { qualities: { [s.quality]: { type: "mp4" as const, url: s.url } } }),
    name: `${s.provider.name} ${s.quality}`,
    flags: [],
    captions: data.subtitles.map((sub) => ({
      id: sub.label,
      url: sub.url,
      language: sub.label,
      type: sub.format === "vtt" ? "vtt" : "srt",
      hasCorsRestrictions: false,
    })),
    headers: {},
  }));

  return {
    embeds: [],
    stream: streams,
  };
}

async function cineproCoreLogic(ctx: MovieScrapeContext | ShowScrapeContext): Promise<SourcererOutput> {
  const { tmdbId } = ctx.media;
  const isMovie = ctx.media.type === "movie";

  ctx.progress(10);

  let apiUrl: string;
  if (isMovie) {
    apiUrl = `${CINEPRO_URL}/v1/movies/${tmdbId}`;
  } else {
    const showCtx = ctx as ShowScrapeContext;
    apiUrl = `${CINEPRO_URL}/v1/tv/${tmdbId}/seasons/${showCtx.media.season.number}/episodes/${showCtx.media.episode.number}`;
  }

  const res = await fetch(apiUrl);
  if (!res.ok) {
    if (res.status === 404) throw new NotFoundError("CinePro Core: no streams found");
    throw new NotFoundError(`CinePro Core API error: ${res.status}`);
  }

  ctx.progress(50);

  const data: CineProResponse = await res.json();

  if (!data.sources || data.sources.length === 0) {
    throw new NotFoundError("CinePro Core: no streams available");
  }

  ctx.progress(80);

  return convertSources(data, ctx);
}

export const cineproCoreScraper = {
  id: "cinepro-core",
  name: "CinePro Core 🎬",
  rank: 950,
  disabled: false,
  flags: [],
  scrapeMovie: cineproCoreLogic,
  scrapeShow: cineproCoreLogic,
};