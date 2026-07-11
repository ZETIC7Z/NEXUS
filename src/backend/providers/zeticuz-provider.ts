/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * zeticuz-provider.ts
 *
 * ZETICUZ streaming backend integration for NEXUS.
 * Connects to our TMDB-Embed-API (Docker locally, HuggingFace on production).
 *
 * Local dev:  VITE_EMBED_API_URL=http://127.0.0.1:8787
 * Production: VITE_EMBED_API_URL=https://stycanine1-tmdb-embed-api.hf.space
 *             (set in Vercel environment variables)
 *
 * The backend already proxies all stream URLs through /m3u8-proxy or /ts-proxy,
 * so raw source URLs are NEVER exposed in the browser. Headers required by
 * providers (Referer, Origin, etc.) are baked into the proxy URL by the backend.
 */
import {
  MovieScrapeContext,
  NotFoundError,
  ShowScrapeContext,
  SourcererOutput,
  labelToLanguageCode,
} from "@p-stream/providers";

import { getSecureEmbedApiUrl } from "@/utils/secure-config";

// ─────────────────────────────────────────────────────────────────────────────
// Config
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Resolves the backend URL securely using the decoy binary metadata utility.
 */
const EMBED_API_BASE: string = getSecureEmbedApiUrl();

/**
 * Normalize backend quality strings to Nexus player quality keys.
 * Nexus player accepts: "4k" | "1080" | "720" | "480" | "360" | "unknown"
 */
function normalizeQuality(q: string | undefined): string {
  if (!q) return "unknown";
  const lower = q.toLowerCase().trim();
  if (lower === "2160p" || lower === "4k" || lower === "uhd") return "4k";
  if (lower === "1080p" || lower === "1080") return "1080";
  if (lower === "720p" || lower === "720") return "720";
  if (lower === "480p" || lower === "480") return "480";
  if (lower === "360p" || lower === "360") return "360";
  // "Auto", "ORG", "org", "unknown", audio tracks etc. → unknown
  return "unknown";
}

/**
 * Detect whether a URL is an HLS stream.
 * Backend prefixes HLS streams with /m3u8-proxy and MP4s with /ts-proxy.
 * We check both the proxy prefix and the raw URL content as a fallback.
 */
function detectIsHls(url: string, explicitType?: string): boolean {
  if (explicitType === "hls") return true;
  if (explicitType === "mp4" || explicitType === "file") return false;
  // Backend-proxied URLs
  if (url.includes("/m3u8-proxy")) return true;
  if (url.includes("/ts-proxy")) return false;
  // Raw URLs (fallback)
  if (url.includes(".m3u8") || url.includes("m3u8") || url.includes(".m3u")) return true;
  if (url.includes("playlist.m3u") || url.includes("index.m3u")) return true;
  return false;
}

/**
 * Build the streams URL for a movie or series request.
 * Passes imdbId if already known so the backend can skip TMDB→IMDB lookup.
 */
function buildStreamsUrl(
  ctx: MovieScrapeContext | ShowScrapeContext,
  febboxToken?: string,
): string {
  const { tmdbId } = ctx.media;
  const isMovie = ctx.media.type === "movie";
  const imdbId = (ctx.media as any).imdbId as string | undefined;

  let url: string;
  if (isMovie) {
    url = `${EMBED_API_BASE}/api/streams/movie/${tmdbId}`;
  } else {
    const s = ctx as ShowScrapeContext;
    url = `${EMBED_API_BASE}/api/streams/series/${tmdbId}?season=${s.media.season.number}&episode=${s.media.episode.number}`;
  }

  // Pass the IMDB ID so the backend can skip its own TMDB→IMDB lookup
  if (imdbId && imdbId.startsWith("tt")) {
    url += (url.includes("?") ? "&" : "?") + `imdbId=${encodeURIComponent(imdbId)}`;
  }

  if (febboxToken) {
    url += (url.includes("?") ? "&" : "?") + `userFebboxToken=${encodeURIComponent(febboxToken)}`;
  }

  return url;
}

/**
 * Read the user's Febbox token from NEXUS localStorage (set in NEXUS Settings UI).
 * Falls back to VITE_DEFAULT_FEBBOX_KEY env variable.
 * Returns empty string if not available.
 */
function getUserFebboxToken(): string {
  try {
    // 1. Try from localStorage preferences (user-entered in Settings)
    const prefData =
      typeof window !== "undefined"
        ? window.localStorage.getItem("__MW::preferences")
        : null;
    if (prefData) {
      const parsed = JSON.parse(prefData);
      const token =
        parsed?.state?.febboxKey || parsed?.state?.preferences?.febboxKey;
      if (token && typeof token === "string" && token.trim()) return token.trim();
    }
  } catch {
    // ignore
  }
  // 2. Fall back to env default
  const envKey = import.meta.env.VITE_DEFAULT_FEBBOX_KEY as string;
  if (envKey && envKey.trim()) return envKey.trim();
  return "";
}

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface ZeticuzSource {
  url: string;
  type: "mp4" | "hls";
  quality: string;       // already normalized to Nexus format
  rawName: string;       // "AniKoto - VidPlay-1 (sub)", "DahmerMovies", etc.
  audioTracks: Array<{ language: string; label: string }>;
  provider: { id: string; name: string };
  subtitles: ZeticuzSubtitle[];
}

interface ZeticuzSubtitle {
  url: string;
  format: string;
  label: string;
}

interface ZeticuzResponse {
  sources: ZeticuzSource[];
  subtitles: ZeticuzSubtitle[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Provider catalog
// Only includes providers from our TMDB-Embed-API project.
// Provider IDs must match the lowercase `provider` field in the backend response.
// ─────────────────────────────────────────────────────────────────────────────
export const ZETICUZ_PROVIDERS = [
  { id: "anikoto",      alias: "AniKoto" },
  { id: "anikai",       alias: "AniKai" },
  { id: "4khdhub",      alias: "4KHDHub" },
  { id: "dahmermovies", alias: "DahmerMovies" },
  { id: "vixsrc",       alias: "Vixsrc" },
  { id: "notorrent",    alias: "NoTorrent" },
  { id: "vidlink",      alias: "Vidlink" },
  { id: "showbox",      alias: "Showbox" },
  { id: "vidcore",      alias: "Vidcore" },
  { id: "videasy",      alias: "Videasy" },
  { id: "vidbox",       alias: "Vidbox" },
] as const;

// ─────────────────────────────────────────────────────────────────────────────
// Cache (shared across all provider scrapers — single API call per media item)
// ─────────────────────────────────────────────────────────────────────────────

function getMediaCacheKey(ctx: MovieScrapeContext | ShowScrapeContext): string {
  const { tmdbId } = ctx.media;
  if (ctx.media.type === "movie") return `movie-${tmdbId}`;
  const s = ctx as ShowScrapeContext;
  return `show-${tmdbId}-${s.media.season.number}-${s.media.episode.number}`;
}

const zeticuzResponseCache = new Map<string, Promise<ZeticuzResponse>>();
const zeticuzResolvedCache = new Map<string, ZeticuzResponse>();

export function getActiveZeticuzProviders(media: any): string[] | null {
  if (!media) return null;
  const key =
    media.type === "movie"
      ? `movie-${media.tmdbId}`
      : `show-${media.tmdbId}-${media.season?.number}-${media.episode?.number}`;

  const resolved = zeticuzResolvedCache.get(key);
  if (!resolved) return null;

  // Map each source's provider ID to its zeticuz scraper ID
  const activeIds = new Set<string>();
  resolved.sources.forEach((s) => {
    const scraperId = `zeticuz-${s.provider.id.toLowerCase().replace(/\s+/g, "")}`;
    activeIds.add(scraperId);
    // Also map "febbox fid" → showbox scraper
    if (s.provider.id.toLowerCase().includes("febbox")) {
      activeIds.add("zeticuz-showbox");
    }
  });

  return Array.from(activeIds);
}

// ─────────────────────────────────────────────────────────────────────────────
// Fetch
// ─────────────────────────────────────────────────────────────────────────────

async function fetchZeticuz(
  ctx: MovieScrapeContext | ShowScrapeContext,
): Promise<ZeticuzResponse> {
  const cacheKey = getMediaCacheKey(ctx);
  const cached = zeticuzResponseCache.get(cacheKey);
  if (cached) return cached;

  const febboxToken = getUserFebboxToken();
  const url = buildStreamsUrl(ctx, febboxToken || undefined);

  const promise = (async (): Promise<ZeticuzResponse> => {
    const res = await fetch(url);
    if (!res.ok) {
      throw new NotFoundError(`ZETICUZ: API error ${res.status} for ${url}`);
    }
    const data = await res.json();

    if (!data || !Array.isArray(data.streams)) {
      throw new NotFoundError("ZETICUZ: unexpected API response shape");
    }

    const seen = new Set<string>(); // dedup by URL
    const sources: ZeticuzSource[] = [];

    for (const s of data.streams) {
      if (!s.url) continue;
      if (seen.has(s.url)) continue;
      seen.add(s.url);

      const isHls = detectIsHls(s.url, s.type);
      const quality = normalizeQuality(s.quality);

      const streamSubtitles: ZeticuzSubtitle[] = (s.subtitles || []).map((sub: any) => ({
        url: sub.url,
        format: sub.format || "srt",
        label: sub.label || sub.lang || "English",
      }));

      // Determine provider ID from backend response
      // Backend uses: "anikoto", "DahmerMovies", "NoTorrent", "4khdhub", "Febbox FID", "videasy", "Vixsrc", etc.
      const rawProvider = (s.provider || s.name || "unknown") as string;
      const providerId = rawProvider.toLowerCase().replace(/\s+/g, "");

      sources.push({
        url: s.url,
        type: isHls ? "hls" : "mp4",
        quality,
        rawName: s.name || s.title || rawProvider,
        audioTracks: [],
        provider: {
          id: providerId,
          name: rawProvider,
        },
        subtitles: streamSubtitles,
      });
    }

    if (sources.length === 0) {
      throw new NotFoundError("ZETICUZ: no streams returned by API");
    }

    const result: ZeticuzResponse = { sources, subtitles: [] };
    zeticuzResolvedCache.set(cacheKey, result);
    return result;
  })();

  zeticuzResponseCache.set(cacheKey, promise);
  return promise;
}

// ─────────────────────────────────────────────────────────────────────────────
// Convert sources → SourcererOutput
// Groups multiple HLS qualities from the same provider into a single stream
// with hlsQualities so the player can auto-select based on bandwidth.
// MP4/file streams are each their own stream entry.
// ─────────────────────────────────────────────────────────────────────────────

function convertSources(
  providerId: string,
  sources: ZeticuzSource[],
  subtitles: ZeticuzSubtitle[],
): SourcererOutput {
  const streams: any[] = [];

  // Separate HLS and MP4 streams
  const hlsSources = sources.filter((s) => s.type === "hls");
  const mp4Sources = sources.filter((s) => s.type === "mp4");

  // Group HLS sources: if there are multiple quality variants, build a single
  // stream with hlsQualities so the player can switch qualities automatically.
  if (hlsSources.length > 0) {
    // Check if we have distinct quality variants (more than just "unknown")
    const distinctQualities = new Set(hlsSources.map((s) => s.quality));
    const hasMultipleQualities = distinctQualities.size > 1 ||
      (distinctQualities.size === 1 && !distinctQualities.has("unknown"));

    if (hlsSources.length > 1 && hasMultipleQualities) {
      // Build a multi-quality HLS stream
      const hlsQualities: Record<string, string> = {};
      hlsSources.forEach((s) => {
        const qKey = s.quality !== "unknown" ? s.quality : "unknown";
        if (!hlsQualities[qKey]) {
          hlsQualities[qKey] = s.url;
        }
      });

      // Collect all unique subtitles
      const allSubs = [...hlsSources.flatMap((s) => s.subtitles || []), ...subtitles];
      const captions = allSubs.map((sub) => ({
        id: sub.url,
        url: sub.url,
        language: labelToLanguageCode(sub.label) || sub.label.toLowerCase(),
        type: (sub.format === "vtt" ? "vtt" : "srt") as "vtt" | "srt",
        hasCorsRestrictions: false,
      }));

      streams.push({
        id: `zeticuz-${providerId.toLowerCase()}-hls-multi`,
        name: "Auto",
        flags: [],
        captions,
        headers: {}, // headers are baked into proxy URL by backend
        type: "hls" as const,
        playlist: hlsSources[0].url,  // primary playlist (player will use hlsQualities)
        hlsQualities,
      });
    } else {
      // Each HLS source as its own stream
      hlsSources.forEach((s, i) => {
        const mergedSubs = [...(s.subtitles || []), ...subtitles];
        const captions = mergedSubs.map((sub) => ({
          id: sub.url,
          url: sub.url,
          language: labelToLanguageCode(sub.label) || sub.label.toLowerCase(),
          type: (sub.format === "vtt" ? "vtt" : "srt") as "vtt" | "srt",
          hasCorsRestrictions: false,
        }));

        streams.push({
          id: `zeticuz-${providerId.toLowerCase()}-hls-${i}`,
          name: s.quality !== "unknown" ? s.quality + "p" : "Auto",
          flags: [],
          captions,
          headers: {}, // headers baked into proxy URL
          type: "hls" as const,
          playlist: s.url,
        });
      });
    }
  }

  // MP4/file sources — group all qualities from the provider into a single file stream
  if (mp4Sources.length > 0) {
    const qualities: Record<string, { type: "mp4"; url: string }> = {};
    mp4Sources.forEach((s) => {
      const qKey = s.quality !== "unknown" ? s.quality : "1080";
      qualities[qKey] = {
        type: "mp4" as const,
        url: s.url,
      };
    });

    const allSubs = [...mp4Sources.flatMap((s) => s.subtitles || []), ...subtitles];
    // Deduplicate subtitles by URL
    const seenSubUrls = new Set<string>();
    const dedupedSubs = allSubs.filter((sub) => {
      if (seenSubUrls.has(sub.url)) return false;
      seenSubUrls.add(sub.url);
      return true;
    });

    // Sort subtitles: English first, then others alphabetically
    const sortedSubs = dedupedSubs.sort((a, b) => {
      const aLabel = (a.label || "").toLowerCase();
      const bLabel = (b.label || "").toLowerCase();
      if (aLabel.includes("english")) return -1;
      if (bLabel.includes("english")) return 1;
      return aLabel.localeCompare(bLabel);
    });

    const captions = sortedSubs.map((sub) => ({
      id: sub.url,
      url: sub.url,
      language: labelToLanguageCode(sub.label) || sub.label.toLowerCase(),
      type: (sub.format === "vtt" ? "vtt" : "srt") as "vtt" | "srt",
      hasCorsRestrictions: false,
    }));

    streams.push({
      id: `zeticuz-${providerId.toLowerCase()}-mp4-multi`,
      name: "Auto",
      flags: [],
      captions,
      headers: {}, // headers baked into proxy URL
      type: "file" as const,
      qualities,
    });
  }

  if (streams.length === 0) {
    throw new NotFoundError(`zeticuz-${providerId}: no playable streams`);
  }

  return { embeds: [], stream: streams as any };
}

// ─────────────────────────────────────────────────────────────────────────────
// Provider ID matching
// The backend sends provider names like "DahmerMovies", "NoTorrent", "4khdhub",
// "Febbox FID", "videasy", "Vixsrc", "anikoto", "anikai", "vidbox", etc.
// We normalize both sides to lowercase+no-spaces for matching.
// ─────────────────────────────────────────────────────────────────────────────

function normalizeProviderId(id: string): string {
  return id.toLowerCase().replace(/[\s_-]/g, "");
}

// Map from scraperProviderId → list of backend provider id patterns that match
const PROVIDER_ID_ALIASES: Record<string, string[]> = {
  "showbox":      ["showbox", "febboxfid", "febbox"],
  "dahmermovies": ["dahmermovies"],
  "notorrent":    ["notorrent"],
  "4khdhub":      ["4khdhub"],
  "videasy":      ["videasy"],
  "vixsrc":       ["vixsrc"],
  "anikoto":      ["anikoto"],
  "anikai":       ["anikai"],
  "vidbox":       ["vidbox"],
  "vidcore":      ["vidcore"],
  "vidlink":      ["vidlink"],
};

function sourceMatchesProvider(sourceProviderId: string, scraperId: string): boolean {
  const normalizedSource = normalizeProviderId(sourceProviderId);
  const aliases = PROVIDER_ID_ALIASES[scraperId] || [scraperId];
  return aliases.some((alias) => normalizedSource.includes(alias) || alias.includes(normalizedSource));
}

// ─────────────────────────────────────────────────────────────────────────────
// Factory
// ─────────────────────────────────────────────────────────────────────────────

function makeZeticuzProviderScraper(providerId: string, alias: string) {
  const scraperId = `zeticuz-${providerId.toLowerCase()}`;

  async function scrape(
    ctx: MovieScrapeContext | ShowScrapeContext,
  ): Promise<SourcererOutput> {
    ctx.progress(10);
    const data = await fetchZeticuz(ctx);
    ctx.progress(60);

    // Filter sources that belong to this provider
    const providerSources = data.sources.filter(
      (s) => sourceMatchesProvider(s.provider.id, providerId.toLowerCase()),
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
    rank: providerId.toLowerCase() === "vidbox" ? 999 : 950,
    type: "source",
    disabled: false,
    externalSource: false,
    mediaTypes: ["movie", "show"],
    flags: [],
    scrapeMovie: scrape,
    scrapeShow: scrape,
  };
}

export const zeticuzScrapers = ZETICUZ_PROVIDERS.map((p) =>
  makeZeticuzProviderScraper(p.id, p.alias),
);
