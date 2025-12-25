import { proxiedFetch } from "@/backend/helpers/fetch";
import { usePreferencesStore } from "@/stores/preferences";
import { useRegionStore } from "@/utils/detectRegion";

export interface FemboxStream {
  url: string;
  quality: string;
  name: string;
  speed: string;
  size: string;
}

export interface FemboxSubtitle {
  language: string;
  url: string;
  name: string;
}

export interface FemboxResponse {
  success: boolean;
  links: FemboxStream[];
  subtitles: FemboxSubtitle[];
}

/**
 * Scrape movie from Fembox API
 */
export async function scrapeFemboxMovie(
  tmdbId: string,
): Promise<FemboxResponse | null> {
  const userToken = usePreferencesStore.getState().febboxKey;
  const sharedToken = (window as any).__CONFIG__?.VITE_SHARED_FEBBOX_TOKEN;

  // Use user's token if available, otherwise use shared token
  const febboxKey = userToken || sharedToken;

  if (!febboxKey) {
    console.log("Fembox: No febbox token available (neither user nor shared)");
    return null;
  }

  if (userToken) {
    console.log("Fembox: Using user's personal token");
  } else {
    console.log(
      "Fembox: Using shared token (user doesn't have personal token)",
    );
  }

  const url = `https://fembox.lordflix.club/api/media/movie/${tmdbId}?cookie=${febboxKey}`;

  console.log(`Fembox: Fetching movie ${tmdbId} via proxy`);

  try {
    // Use proxiedFetch to bypass CORS
    const data = await proxiedFetch<FemboxResponse>(url, {});

    console.log("Fembox: Raw response:", JSON.stringify(data).substring(0, 500));

    if (data && data.success && data.links && data.links.length > 0) {
      console.log(
        `Fembox: Found ${data.links.length} streams for movie ${tmdbId}`,
      );
      return data;
    }

    console.log(`Fembox: No streams found for movie ${tmdbId}`, data);
    return null;
  } catch (error) {
    console.error(`Fembox: Error scraping movie ${tmdbId}:`, error);
    return null;
  }
}

/**
 * Scrape TV show episode from Fembox API
 */
export async function scrapeFemboxTV(
  tmdbId: string,
  season: number,
  episode: number,
): Promise<FemboxResponse | null> {
  const userToken = usePreferencesStore.getState().febboxKey;
  const sharedToken = (window as any).__CONFIG__?.VITE_SHARED_FEBBOX_TOKEN;

  // Use user's token if available, otherwise use shared token
  const febboxKey = userToken || sharedToken;

  if (!febboxKey) {
    console.log("Fembox: No febbox token available (neither user nor shared)");
    return null;
  }

  if (userToken) {
    console.log("Fembox: Using user's personal token for TV");
  } else {
    console.log(
      "Fembox: Using shared token for TV (user doesn't have personal token)",
    );
  }

  const url = `https://fembox.lordflix.club/api/media/tv/${tmdbId}/${season}/${episode}?cookie=${febboxKey}`;

  console.log(`Fembox: Fetching TV ${tmdbId} S${season}E${episode} via proxy`);

  try {
    // Use proxiedFetch to bypass CORS
    const data = await proxiedFetch<FemboxResponse>(url, {});

    console.log("Fembox: Raw TV response:", JSON.stringify(data).substring(0, 500));

    if (data && data.success && data.links && data.links.length > 0) {
      console.log(
        `Fembox: Found ${data.links.length} streams for TV ${tmdbId} S${season}E${episode}`,
      );
      return data;
    }

    console.log(
      `Fembox: No streams found for TV ${tmdbId} S${season}E${episode}`,
      data
    );
    return null;
  } catch (error) {
    console.error(
      `Fembox: Error scraping TV ${tmdbId} S${season}E${episode}:`,
      error,
    );
    return null;
  }
}

/**
 * Convert Fembox response to standard stream format
 */
export function convertFemboxToStream(femboxData: FemboxResponse) {
  if (!femboxData || !femboxData.links || femboxData.links.length === 0) {
    console.log("Fembox: No links to convert");
    return null;
  }

  // Sort links by quality - prefer higher quality
  const sortedLinks = [...femboxData.links].sort((a, b) => {
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

  // Use the highest quality link
  const primaryLink = sortedLinks[0];
  console.log(`Fembox: Using primary link with quality: ${primaryLink.quality}, url: ${primaryLink.url.substring(0, 100)}...`);

  // Map Fembox quality to standard quality
  const mapQuality = (q: string): string => {
    if (q.includes("4K") || q.includes("2160")) return "4k";
    if (q.includes("1080")) return "1080";
    if (q.includes("720")) return "720";
    if (q.includes("480")) return "480";
    if (q.includes("360")) return "360";
    return "unknown";
  };

  // Build qualities object with all available qualities
  const qualities: Record<string, { type: "mp4"; url: string }> = {};
  for (const link of sortedLinks) {
    const quality = mapQuality(link.quality);
    if (!qualities[quality]) {
      qualities[quality] = {
        type: "mp4" as const,
        url: link.url,
      };
    }
  }

  // Ensure at least one quality exists
  if (Object.keys(qualities).length === 0) {
    qualities.unknown = {
      type: "mp4" as const,
      url: primaryLink.url,
    };
  }

  console.log(`Fembox: Created stream with qualities: ${Object.keys(qualities).join(", ")}`);

  return {
    type: "file" as const,
    flags: [],
    qualities,
    captions: (femboxData.subtitles || []).map((sub) => ({
      id: sub.language,
      language: sub.language.toLowerCase().split(" ")[0], // Take first word for language code
      hasCorsRestrictions: false,
      type: "srt" as const,
      url: sub.url,
    })),
  };
}
