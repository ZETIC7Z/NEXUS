import { proxiedFetch } from "@/backend/helpers/fetch";
import { usePreferencesStore } from "@/stores/preferences";

export interface FemboxSource {
  url: string;
  quality: string;
  type?: string;
}

export interface FemboxSubtitle {
  language: string;
  url: string;
  name?: string;
}

export interface FemboxResponse {
  sources: FemboxSource[];
  subtitles: FemboxSubtitle[];
}

// Legacy interface for backwards compatibility
export interface FemboxStream {
  url: string;
  quality: string;
  name: string;
  speed: string;
  size: string;
}

/**
 * Scrape movie from Fembox API (fembox.aether.mom)
 */
export async function scrapeFemboxMovie(
  tmdbId: string,
): Promise<FemboxResponse | null> {
  const userToken = usePreferencesStore.getState().febboxKey;
  const sharedToken = import.meta.env.VITE_DEFAULT_FEBBOX_KEY;

  // Use user's token if available, otherwise use shared token
  const febboxKey = userToken || sharedToken;

  if (!febboxKey) {
    return null;
  }

  const url = `https://fembox.aether.mom/movie/${tmdbId}?ui=${febboxKey}`;

  try {
    // Use proxiedFetch to bypass CORS
    const data = await proxiedFetch<FemboxResponse>(url, {});

    if (data && data.sources && data.sources.length > 0) {
      return data;
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Scrape TV show episode from Fembox API (fembox.aether.mom)
 */
export async function scrapeFemboxTV(
  tmdbId: string,
  season: number,
  episode: number,
): Promise<FemboxResponse | null> {
  const userToken = usePreferencesStore.getState().febboxKey;
  const sharedToken = import.meta.env.VITE_DEFAULT_FEBBOX_KEY;

  // Use user's token if available, otherwise use shared token
  const febboxKey = userToken || sharedToken;

  if (!febboxKey) {
    return null;
  }

  const url = `https://fembox.aether.mom/tv/${tmdbId}-${season}-${episode}?ui=${febboxKey}`;

  try {
    // Use proxiedFetch to bypass CORS
    const data = await proxiedFetch<FemboxResponse>(url, {});

    if (data && data.sources && data.sources.length > 0) {
      return data;
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Convert Fembox response to standard stream format
 */
export function convertFemboxToStream(femboxData: FemboxResponse) {
  if (!femboxData || !femboxData.sources || femboxData.sources.length === 0) {
    return null;
  }

  // Sort sources by quality - prefer higher quality
  const sortedSources = [...femboxData.sources].sort((a, b) => {
    const qualityOrder: Record<string, number> = {
      "4K": 4,
      "2160p": 4,
      "1080p": 3,
      "1080": 3,
      "720p": 2,
      "720": 2,
      "480p": 1,
      "480": 1,
    };
    const aQuality = qualityOrder[a.quality] || 0;
    const bQuality = qualityOrder[b.quality] || 0;
    return bQuality - aQuality;
  });

  // Use the highest quality source
  const primarySource = sortedSources[0];

  // Map Fembox quality to standard quality
  const mapQuality = (q: string): string => {
    if (q.includes("4K") || q.includes("2160")) return "4k";
    if (q.includes("1080")) return "1080";
    if (q.includes("720")) return "720";
    if (q.includes("480")) return "480";
    if (q.includes("360")) return "360";
    return "unknown";
  };

  // Determine stream type - HLS or MP4
  const isHls = primarySource.url.includes(".m3u8");

  // Build qualities object with all available qualities
  const qualities: Record<string, { type: "mp4" | "hls"; url: string }> = {};
  for (const source of sortedSources) {
    const quality = mapQuality(source.quality);
    const sourceIsHls = source.url.includes(".m3u8");
    if (!qualities[quality]) {
      qualities[quality] = {
        type: sourceIsHls ? ("hls" as const) : ("mp4" as const),
        url: source.url,
      };
    }
  }

  // Ensure at least one quality exists
  if (Object.keys(qualities).length === 0) {
    qualities.unknown = {
      type: isHls ? ("hls" as const) : ("mp4" as const),
      url: primarySource.url,
    };
  }

  return {
    type: "file" as const,
    id: "fembox",
    flags: [],
    qualities,
    captions: (femboxData.subtitles || []).map((sub) => ({
      id: sub.language,
      url: sub.url,
      type: "vtt" as const,
      hasCorsRestrictions: true,
      language: sub.language,
    })),
  };
}
