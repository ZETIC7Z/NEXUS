/* eslint-disable no-console */
import { labelToLanguageCode } from "@p-stream/providers";

import { CaptionListItem } from "@/stores/player/slices/source";

export async function scrapeOpenSubtitlesCaptions(
  imdbId: string | undefined,
  season?: number,
  episode?: number,
): Promise<CaptionListItem[]> {
  try {
    if (!imdbId) return [];

    const url = `https://rest.opensubtitles.org/search/${
      season && episode ? `episode-${episode}/` : ""
    }imdbid-${imdbId.slice(2)}${season && episode ? `/season-${season}` : ""}`;

    const response = await fetch(url, {
      headers: {
        "X-User-Agent": "VLSub 0.10.2",
      },
    });

    if (!response.ok) {
      throw new Error(`OpenSubtitles API returned ${response.status}`);
    }

    const data = await response.json();
    const openSubtitlesCaptions: CaptionListItem[] = [];

    for (const caption of data) {
      // Validate season and episode for TV shows to ensure accuracy
      if (season !== undefined && caption.SeriesSeason !== undefined && caption.SeriesSeason !== null && caption.SeriesSeason !== "") {
        if (parseInt(caption.SeriesSeason, 10) !== season) continue;
      }
      if (episode !== undefined && caption.SeriesEpisode !== undefined && caption.SeriesEpisode !== null && caption.SeriesEpisode !== "") {
        if (parseInt(caption.SeriesEpisode, 10) !== episode) continue;
      }

      const downloadUrl = caption.SubDownloadLink.replace(".gz", "").replace(
        "download/",
        "download/subencoding-utf8/",
      );
      const language = labelToLanguageCode(caption.LanguageName) || "";

      if (!downloadUrl || !language) continue;

      openSubtitlesCaptions.push({
        id: downloadUrl,
        language,
        url: downloadUrl,
        type: caption.SubFormat || "srt",
        needsProxy: false,
        opensubtitles: true,
        source: "opensubs", // shortened becuase used on CaptionView for badge
      });
    }

    return openSubtitlesCaptions;
  } catch (error) {
    console.error("Error fetching OpenSubtitles:", error);
    return [];
  }
}
