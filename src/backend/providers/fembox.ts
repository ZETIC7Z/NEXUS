import { usePreferencesStore } from "@/stores/preferences";

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

  try {
    // Use direct fetch to avoid proxy issues
    const response = await fetch(url, {
      headers: { Accept: "application/json" },
    });

    if (!response.ok) {
      console.error(`Fembox: HTTP ${response.status} for movie ${tmdbId}`);
      return null;
    }

    const data = await response.json();

    if (data && data.success && data.links && data.links.length > 0) {
      console.log(
        `Fembox: Found ${data.links.length} streams for movie ${tmdbId}`,
      );
      return data as FemboxResponse;
    }

    console.log(`Fembox: No streams found for movie ${tmdbId}`);
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

  try {
    // Use direct fetch to avoid proxy issues
    const response = await fetch(url, {
      headers: { Accept: "application/json" },
    });

    if (!response.ok) {
      console.error(
        `Fembox: HTTP ${response.status} for TV ${tmdbId} S${season}E${episode}`,
      );
      return null;
    }

    const data = await response.json();

    if (data && data.success && data.links && data.links.length > 0) {
      console.log(
        `Fembox: Found ${data.links.length} streams for TV ${tmdbId} S${season}E${episode}`,
      );
      return data as FemboxResponse;
    }

    console.log(
      `Fembox: No streams found for TV ${tmdbId} S${season}E${episode}`,
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
    return null;
  }

  // Use the first (highest quality) link
  const primaryLink = femboxData.links[0];

  return {
    type: "file" as const,
    flags: [],
    qualities: {
      unknown: {
        type: "mp4" as const,
        url: primaryLink.url,
      },
    },
    captions: femboxData.subtitles.map((sub) => ({
      id: sub.language,
      language: sub.language.toLowerCase(),
      hasCorsRestrictions: false,
      type: "srt" as const,
      url: sub.url,
    })),
  };
}
