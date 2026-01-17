/**
 * Zeticuz Provider 🔥
 * API: https://bunnyddl.termsandconditionshere.workers.dev
 *
 * Movie: /movie/{tmdbId}
 * TV: /tv/{tmdbId}/{seasonId}/{episodeId}
 *
 * Parses HTML response to extract:
 * - MKV download links
 * - MP4 download links with quality info
 * - Subtitle links
 */

const ZETICUZ_BASE = "https://bunnyddl.termsandconditionshere.workers.dev";

export interface ZeticuzStream {
  url: string;
  quality: string;
  format: "mkv" | "mp4";
  size: string;
  name: string;
}

export interface ZeticuzSubtitle {
  language: string;
  url: string;
}

export interface ZeticuzResponse {
  success: boolean;
  title: string;
  episode?: string;
  mkvLinks: ZeticuzStream[];
  mp4Links: ZeticuzStream[];
  subtitles: ZeticuzSubtitle[];
}

/**
 * Parse HTML response from bunnyddl API
 * Uses simple regex to extract download links from minified HTML
 */
function parseZeticuzHtml(html: string): ZeticuzResponse {
  const result: ZeticuzResponse = {
    success: false,
    title: "",
    mkvLinks: [],
    mp4Links: [],
    subtitles: [],
  };

  try {
    // Extract title from <h1> tag
    const titleMatch = html.match(/<h1[^>]*>([^<]+)<\/h1>/i);
    if (titleMatch) {
      result.title = titleMatch[1].trim();
    }

    // Extract episode info from .ep class
    const epMatch = html.match(/<div class="ep"[^>]*>([^<]+)<\/div>/i);
    if (epMatch) {
      result.episode = epMatch[1].trim();
    }

    // Find ALL download links (dl-btn class) - simpler approach
    const allDlBtnLinks = html.matchAll(
      /<a\s+href="([^"]+)"[^>]*class="dl-btn"[^>]*>[\s\S]*?<div\s+class="t1">([^<]+)<\/div>[\s\S]*?<div\s+class="t2">([^<]+)<\/div>/gi,
    );

    for (const match of allDlBtnLinks) {
      const url = match[1];
      const name = match[2].trim();
      const info = match[3].trim();

      // Determine format from URL or name
      const isMkv =
        url.toLowerCase().includes(".mkv") ||
        name.toLowerCase().includes("mkv");
      const format = isMkv ? "mkv" : "mp4";

      // Extract quality from name
      let quality = "unknown";
      const nameLower = name.toLowerCase();
      if (nameLower.includes("4k") || nameLower.includes("2160"))
        quality = "4K";
      else if (nameLower.includes("1080")) quality = "1080p";
      else if (nameLower.includes("720")) quality = "720p";
      else if (nameLower.includes("480")) quality = "480p";
      else if (nameLower.includes("360")) quality = "360p";
      else if (nameLower.includes("org") || nameLower.includes("original"))
        quality = "Original";

      // Extract size from info
      const sizeMatch = info.match(/^([\d.]+\s*[GMKBT]+)/i);
      const size = sizeMatch
        ? sizeMatch[1]
        : info.split("•")[0]?.trim() || info;

      const stream: ZeticuzStream = {
        url,
        quality,
        format: format as "mkv" | "mp4",
        size,
        name,
      };

      if (isMkv) {
        result.mkvLinks.push(stream);
      } else {
        result.mp4Links.push(stream);
      }
    }

    // Find subtitle links (sub-btn class)
    const subLinks = html.matchAll(
      /<a\s+href="([^"]+)"[^>]*class="sub-btn"[^>]*>[\s\S]*?<span>([^<]+)<\/span>/gi,
    );

    for (const match of subLinks) {
      result.subtitles.push({
        url: match[1],
        language: match[2].trim(),
      });
    }

    // Check if we found any links
    result.success = result.mkvLinks.length > 0 || result.mp4Links.length > 0;
  } catch {
    // Parsing error - return empty result
  }

  return result;
}

/**
 * Fetch and parse Zeticuz for movies
 * Uses CORS proxy to bypass CAPTCHA protection
 */
export async function scrapeZeticuzMovie(
  tmdbId: string,
): Promise<ZeticuzResponse | null> {
  try {
    const url = `${ZETICUZ_BASE}/movie/${tmdbId}`;

    // Always use proxy to bypass CAPTCHA - direct fetch triggers protection
    const { getLoadbalancedProxyUrl } = await import(
      "@/backend/providers/fetchers"
    );
    const proxyUrl = getLoadbalancedProxyUrl();
    const proxyFullUrl = `${proxyUrl}?destination=${encodeURIComponent(url)}`;

    const response = await fetch(proxyFullUrl);
    if (!response.ok) {
      return null;
    }

    const html = await response.text();

    if (!html || html.length < 100) {
      return null;
    }

    const data = parseZeticuzHtml(html);
    return data.success ? data : null;
  } catch {
    return null;
  }
}
/**
 * Fetch and parse Zeticuz for TV episodes
 * Uses CORS proxy to bypass CAPTCHA protection
 */
export async function scrapeZeticuzTV(
  tmdbId: string,
  season: number,
  episode: number,
): Promise<ZeticuzResponse | null> {
  try {
    const url = `${ZETICUZ_BASE}/tv/${tmdbId}/${season}/${episode}`;

    // Always use proxy to bypass CAPTCHA - direct fetch triggers protection
    const { getLoadbalancedProxyUrl } = await import(
      "@/backend/providers/fetchers"
    );
    const proxyUrl = getLoadbalancedProxyUrl();
    const proxyFullUrl = `${proxyUrl}?destination=${encodeURIComponent(url)}`;

    const response = await fetch(proxyFullUrl);
    if (!response.ok) {
      return null;
    }

    const html = await response.text();

    if (!html || html.length < 100) {
      return null;
    }

    const data = parseZeticuzHtml(html);
    return data.success ? data : null;
  } catch {
    return null;
  }
}

/**
 * Convert Zeticuz response to player stream format
 * Prefers MP4 for better compatibility, falls back to MKV
 */
export function convertZeticuzToStream(data: ZeticuzResponse) {
  if (!data.success) {
    return null;
  }

  // Combine all links (prefer MP4 over MKV for browser compatibility)
  const allLinks = [...data.mp4Links, ...data.mkvLinks];

  if (allLinks.length === 0) {
    return null;
  }

  // Quality priority order
  const qualityOrder: Record<string, number> = {
    "4K": 5,
    "2160p": 5,
    "1080p": 4,
    Original: 3,
    "720p": 2,
    "480p": 1,
    "360p": 0,
  };

  // Sort by quality (highest first), then by format (MP4 first)
  const sortedLinks = [...allLinks].sort((a, b) => {
    const aQuality = qualityOrder[a.quality] ?? 0;
    const bQuality = qualityOrder[b.quality] ?? 0;
    if (bQuality !== aQuality) return bQuality - aQuality;
    // Prefer MP4 over MKV for browser compatibility
    if (a.format === "mp4" && b.format !== "mp4") return -1;
    if (b.format === "mp4" && a.format !== "mp4") return 1;
    return 0;
  });

  // Build qualities object
  const qualities: Record<string, { type: "mp4"; url: string }> = {};

  // Map quality names to standard quality keys
  const mapQualityKey = (q: string): string => {
    if (q === "4K" || q === "2160p") return "4k";
    if (q === "1080p") return "1080";
    if (q === "720p") return "720";
    if (q === "480p") return "480";
    if (q === "360p") return "360";
    if (q === "Original") return "1080"; // Treat original as 1080p
    return "unknown";
  };

  for (const link of sortedLinks) {
    const qualityKey = mapQualityKey(link.quality);
    // Only add if not already present (first one wins = highest priority)
    if (!qualities[qualityKey]) {
      qualities[qualityKey] = {
        type: "mp4", // Both MP4 and MKV can be played as mp4 type
        url: link.url,
      };
    }
  }

  // Ensure at least one quality exists
  if (Object.keys(qualities).length === 0 && sortedLinks.length > 0) {
    qualities.unknown = {
      type: "mp4",
      url: sortedLinks[0].url,
    };
  }

  // Don't include Zeticuz subtitles - use main subtitle source (external subtitles)
  // The player will automatically fetch subtitles from the main subtitle provider

  return {
    type: "file" as const,
    id: "zeticuz",
    flags: [],
    qualities,
    captions: [], // Empty - main subtitle source will be used
  };
}
