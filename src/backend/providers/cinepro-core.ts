/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  MovieScrapeContext,
  NotFoundError,
  ShowScrapeContext,
  SourcererOutput,
} from "@p-stream/providers";

import { createM3U8ProxyUrl } from "@/components/player/utils/proxy";

const CINEPRO_URL =
  import.meta.env.VITE_CINEPRO_CORE_URL || "http://localhost:3000";

// ─────────────────────────────────────────────────────────────────────────────
// CinePro Core provider catalog
//
// Each entry maps the real provider ID returned by the CinePro Core backend to
// the alias display name used inside Nexus. The alias appears in the turnstile
// spinner, source menu, and settings. The real provider name is kept in the
// comment above each entry so future maintenance is easy.
//
// Format:
//   true source name <RealName> 🔥 / Alias use for this site: <Alias>
// ─────────────────────────────────────────────────────────────────────────────
export const CINEPRO_PROVIDERS = [
  // true source name 02MovieDownloader 🔥 / Alias use for this site: Venom
  { id: "02moviedownloader", alias: "Venom" },
  // true source name AnyEmbed 🔥 / Alias use for this site: Oblivion
  { id: "anyembed", alias: "Oblivion" },
  // true source name CineSu 🔥 / Alias use for this site: Anomaly
  { id: "CineSu", alias: "Anomaly" },
  // true source name Fmovies4U 🔥 / Alias use for this site: Tempest
  { id: "fmovies4u", alias: "Tempest" },
  // true source name FshareTV 🔥 / Alias use for this site: Vortex
  { id: "fsharetv", alias: "Vortex" },
  // true source name Icefy 🔥 / Alias use for this site: Phantom
  { id: "Icefy", alias: "Phantom" },
  // true source name Peachify 🔥 / Alias use for this site: Eclipse
  { id: "Peachify", alias: "Eclipse" },
  // true source name Popr 🔥 / Alias use for this site: Havoc
  { id: "popr", alias: "Havoc" },
  // true source name MafiaEmbed 🔥 / Alias use for this site: Rupture
  { id: "streammafia", alias: "Rupture" },
  // true source name Tulnex 🔥 / Alias use for this site: Wrath
  { id: "tulnex", alias: "Wrath" },
  // true source name VidApi 🔥 / Alias use for this site: Malice
  { id: "vidapi", alias: "Malice" },
  // true source name Videasy 🔥 / Alias use for this site: Omen
  { id: "Videasy", alias: "Omen" },
  // true source name VidNest 🔥 / Alias use for this site: Vertex
  { id: "vidnest", alias: "Vertex" },
  // true source name VidRock 🔥 / Alias use for this site: Nebula
  { id: "vidrock", alias: "Nebula" },
  // true source name VidSrc 🔥 / Alias use for this site: Spectre
  { id: "vidsrc", alias: "Spectre" },
  // true source name VidZee 🔥 / Alias use for this site: Onyx
  { id: "vidzee", alias: "Onyx" },
  // true source name VixSrc 🔥 / Alias use for this site: Cipher
  { id: "vixsrc", alias: "Cipher" },
] as const;

interface CineProSource {
  url: string;
  type: "mp4" | "hls";
  quality: string;
  audioTracks: Array<{ language: string; label: string }>;
  provider: { id: string; name: string };
}

interface CineProSubtitle {
  url: string;
  format: string;
  label: string;
}

interface ProxyPayload {
  url: string;
  headers?: Record<string, string>;
}

// CinePro Core returns stream URLs wrapped in third-party proxies (e.g.
// nexus-api-production.up.railway.app/v1/proxy?data=<encoded-json>). We unwrap
// them so NEXUS can proxy the direct stream URL with the correct headers.
function unwrapProxiedUrl(url: string): { url: string; headers: Record<string, string> } {
  try {
    const parsed = new URL(url);
    const data = parsed.searchParams.get("data");
    if (!data) return { url, headers: {} };

    const payload: ProxyPayload = JSON.parse(data);
    if (!payload?.url) return { url, headers: {} };

    return {
      url: payload.url,
      headers: payload.headers ?? {},
    };
  } catch {
    return { url, headers: {} };
  }
}

interface CineProResponse {
  sources: CineProSource[];
  subtitles: CineProSubtitle[];
}

function getMediaCacheKey(
  ctx: MovieScrapeContext | ShowScrapeContext,
): string {
  const { tmdbId } = ctx.media;
  if (ctx.media.type === "movie") return `movie-${tmdbId}`;
  const showCtx = ctx as ShowScrapeContext;
  return `show-${tmdbId}-${showCtx.media.season.number}-${showCtx.media.episode.number}`;
}

const cineProResponseCache = new Map<string, Promise<CineProResponse>>();

async function fetchCinePro(
  ctx: MovieScrapeContext | ShowScrapeContext,
): Promise<CineProResponse> {
  const cacheKey = getMediaCacheKey(ctx);
  const cached = cineProResponseCache.get(cacheKey);
  if (cached) return cached;

  const { tmdbId } = ctx.media;
  const isMovie = ctx.media.type === "movie";

  let apiUrl: string;
  if (isMovie) {
    apiUrl = `${CINEPRO_URL}/v1/movies/${tmdbId}`;
  } else {
    const showCtx = ctx as ShowScrapeContext;
    apiUrl = `${CINEPRO_URL}/v1/tv/${tmdbId}/seasons/${showCtx.media.season.number}/episodes/${showCtx.media.episode.number}`;
  }

  const promise = (async () => {
    // CinePro Core is CORS-enabled, so fetch it directly. Fall back to the
    // proxied fetcher only if the browser blocks the request.
    let data: CineProResponse | null = null;
    try {
      const res = await fetch(apiUrl);
      if (!res.ok) {
        if (res.status === 404)
          throw new NotFoundError("CinePro Core: no streams found");
        throw new Error(`CinePro Core API error: ${res.status}`);
      }
      data = await res.json();
    } catch {
      data = await ctx.proxiedFetcher<CineProResponse>(apiUrl);
    }

    if (!data || !Array.isArray(data.sources)) {
      throw new NotFoundError("CinePro Core: invalid response");
    }

    return data;
  })();

  cineProResponseCache.set(cacheKey, promise);
  return promise;
}

function convertSources(
  providerId: string,
  sources: CineProSource[],
  subtitles: CineProSubtitle[],
): SourcererOutput {
  const captions = subtitles.map((sub) => {
    return {
      id: sub.label,
      url: sub.url,
      language: sub.label,
      type: (sub.format === "vtt" ? "vtt" : "srt") as "vtt" | "srt",
      hasCorsRestrictions: false,
    };
  });

  const streams = sources.map((s, i) => {
    const base = {
      id: `cinepro-core-${providerId.toLowerCase()}-${i}`,
      name: `${s.quality}`,
      flags: [] as string[],
      captions,
      headers: {},
    };

    if (s.type === "hls") {
      return {
        ...base,
        type: "hls" as const,
        playlist: s.url,
      };
    }

    return {
      ...base,
      type: "file" as const,
      qualities: {
        [s.quality]: {
          type: "mp4" as const,
          url: s.url,
        },
      },
    };
  });

  return {
    embeds: [],
    stream: streams as any,
  };
}

function makeCineProProviderScraper(providerId: string, alias: string) {
  const scraperId = `cinepro-core-${providerId.toLowerCase()}`;

  async function scrape(
    ctx: MovieScrapeContext | ShowScrapeContext,
  ): Promise<SourcererOutput> {
    ctx.progress(10);
    const data = await fetchCinePro(ctx);
    ctx.progress(60);

    const providerSources = data.sources.filter(
      (s) => s.provider.id === providerId,
    );

    if (providerSources.length === 0) {
      throw new NotFoundError(`${alias}: no streams available`);
    }

    ctx.progress(90);
    return convertSources(providerId, providerSources, data.subtitles);
  }

  return {
    id: scraperId,
    name: `${alias} 🔥`,
    rank: 950,
    type: "source",
    disabled: false,
    externalSource: false,
    mediaTypes: ["movie", "show"],
    flags: [],
    scrapeMovie: scrape,
    scrapeShow: scrape,
  };
}

export const cineproCoreScrapers = CINEPRO_PROVIDERS.map((p) =>
  makeCineProProviderScraper(p.id, p.alias),
);
