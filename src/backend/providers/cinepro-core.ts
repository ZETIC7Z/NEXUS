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
// Format:
//   true source name <RealName> 🔥 / Alias use for this site: <Alias>
// ─────────────────────────────────────────────────────────────────────────────
export const CINEPRO_PROVIDERS = [
  // Railway CinePro Core providers
  { id: "fsharetv", alias: "Vortex" },
  { id: "Icefy", alias: "Phantom" },
  { id: "vidapi", alias: "Malice" },
  { id: "vidrock", alias: "Nebula" },
  { id: "vixsrc", alias: "Cipher" },
  // Hugging Face Space providers
  { id: "vsembed", alias: "VsEmbed" },
  { id: "anikoto", alias: "AniKoto" },
  { id: "showbox", alias: "Showbox" },
  { id: "notorrent", alias: "NoTorrent" },
  { id: "4khdhub", alias: "4KHDHub" },
  { id: "dahmermovies", alias: "DahmerMovies" },
  { id: "anikai", alias: "AniKai" },
  { id: "vidlink", alias: "Vidlink" },
  { id: "febbox fid", alias: "Febbox" },
  { id: "vidsrc", alias: "VidSrc" },
  { id: "vidembed", alias: "VidEmbed" },
  { id: "moviebox", alias: "MovieBox" }
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
const resolvedCineProCache = new Map<string, CineProResponse>();

export function getActiveProvidersFromCache(media: any): string[] | null {
  if (!media) return null;
  const cacheKey = media.type === "movie" 
    ? `movie-${media.tmdbId}` 
    : `show-${media.tmdbId}-${media.season?.number}-${media.episode?.number}`;
    
  const resolved = resolvedCineProCache.get(cacheKey);
  if (!resolved) return null;
  
  const activeIds = new Set(resolved.sources.map(s => `cinepro-core-${s.provider.id.toLowerCase()}`));
  return Array.from(activeIds);
}

async function fetchCinePro(
  ctx: MovieScrapeContext | ShowScrapeContext,
): Promise<CineProResponse> {
  const cacheKey = getMediaCacheKey(ctx);
  const cached = cineProResponseCache.get(cacheKey);
  if (cached) return cached;

  const { tmdbId } = ctx.media;
  const isMovie = ctx.media.type === "movie";

  const railwayUrl = isMovie
    ? `${CINEPRO_URL}/v1/movies/${tmdbId}`
    : `${CINEPRO_URL}/v1/tv/${tmdbId}/seasons/${(ctx as ShowScrapeContext).media.season.number}/episodes/${(ctx as ShowScrapeContext).media.episode.number}`;

  const hfUrl = isMovie
    ? `/api/streams?type=movie&id=${tmdbId}`
    : `/api/streams?type=series&id=${tmdbId}&season=${(ctx as ShowScrapeContext).media.season.number}&episode=${(ctx as ShowScrapeContext).media.episode.number}`;

  const promise = (async () => {
    // Query both backends in parallel
    const [railwayRes, hfRes] = await Promise.allSettled([
      fetch(railwayUrl).then(async (r) => {
        if (!r.ok) throw new Error("Railway API error");
        return r.json() as Promise<CineProResponse>;
      }),
      fetch(hfUrl).then(async (r) => {
        if (!r.ok) throw new Error("HF API error");
        return r.json();
      })
    ]);

    const combinedSources: CineProSource[] = [];
    const combinedSubtitles: CineProSubtitle[] = [];

    // Parse old Railway CinePro response
    if (railwayRes.status === "fulfilled" && railwayRes.value && Array.isArray(railwayRes.value.sources)) {
      combinedSources.push(...railwayRes.value.sources);
      if (Array.isArray(railwayRes.value.subtitles)) {
        combinedSubtitles.push(...railwayRes.value.subtitles);
      }
    }

    // Parse our new Hugging Face Space response
    if (hfRes.status === "fulfilled" && hfRes.value && Array.isArray(hfRes.value.streams)) {
      const mappedHf = hfRes.value.streams.flatMap((s: any) => {
        const isHls = s.url.includes('m3u8') || s.url.includes('hls') || s.url.includes('playlist') || s.url.includes('proxy');
        const base = {
          url: s.url,
          type: (isHls ? "hls" : "mp4") as "hls" | "mp4",
          quality: s.quality === "Auto" ? "unknown" : (s.quality || "unknown"),
          audioTracks: [],
        };
        const pid = s.provider.toLowerCase();
        
        // If the provider is vidsrc/vsembed/vixsrc, duplicate it for both aliases
        // so it shows up under both VidSrc and VidEmbed in the settings list.
        if (pid === "vidsrc" || pid === "vsembed" || pid === "vixsrc") {
          return [
            { ...base, provider: { id: "vidsrc", name: "VidSrc" } },
            { ...base, provider: { id: "vidembed", name: "VidEmbed" } }
          ];
        }
        
        return [{
          ...base,
          provider: { id: pid, name: s.provider }
        }];
      });
      combinedSources.push(...mappedHf);
    }

    if (combinedSources.length === 0) {
      throw new NotFoundError("CinePro: no streams found from any backend");
    }

    const result = {
      sources: combinedSources,
      subtitles: combinedSubtitles
    } as CineProResponse;

    resolvedCineProCache.set(cacheKey, result);
    return result;
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
