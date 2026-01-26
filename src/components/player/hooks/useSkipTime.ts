import { useEffect, useState } from "react";

import { proxiedFetch } from "@/backend/helpers/fetch";
import { usePlayerMeta } from "@/components/player/hooks/usePlayerMeta";
import { conf } from "@/setup/config";
import { usePreferencesStore } from "@/stores/preferences";
import { getTurnstileToken } from "@/utils/turnstile";

// Thanks Nemo for this API
const FED_SKIPS_BASE_URL = "https://fed-skips.pstream.mov";
const INTRODB_BASE_URL = "https://api.introdb.app/intro";
const MAX_RETRIES = 3;

export interface SegmentData {
  start: number;
  end: number;
  type: "intro" | "recap" | "credits";
}

export interface SkipTimeData {
  skiptime: SegmentData | null;
  source: "fed-skips" | "introdb" | "theintrodb" | "unknown";
}

export function useSkipTime(): SkipTimeData | null {
  const { playerMeta: meta } = usePlayerMeta();
  const [skipData, setSkipData] = useState<SkipTimeData | null>(null);
  const febboxKey = usePreferencesStore((s) => s.febboxKey);
  const tidbKey = usePreferencesStore((s) => s.tidbKey);

  useEffect(() => {
    const fetchFedSkipsTime = async (
      retries = 0,
    ): Promise<SegmentData | null> => {
      if (!meta?.imdbId || meta.type === "movie") return null;
      if (!conf().ALLOW_FEBBOX_KEY) return null;
      if (!febboxKey) return null;

      try {
        const apiUrl = `${FED_SKIPS_BASE_URL}/${meta.imdbId}/${meta.season?.number}/${meta.episode?.number}`;

        const turnstileToken = await getTurnstileToken(
          "0x4AAAAAAB6ocCCpurfWRZyC",
        );
        if (!turnstileToken) return null;

        const response = await fetch(apiUrl, {
          headers: {
            "cf-turnstile-response": turnstileToken,
          },
        });

        if (!response.ok) {
          if (response.status === 500 && retries < MAX_RETRIES) {
            return fetchFedSkipsTime(retries + 1);
          }
          throw new Error("Fed-skips API request failed");
        }

        const data = await response.json();

        const parseSkipTime = (
          timeStr: string | undefined,
        ): SegmentData | null => {
          if (!timeStr || typeof timeStr !== "string") return null;
          const match = timeStr.match(/^(\d+)s$/);
          if (!match) return null;
          return {
            start: 0,
            end: parseInt(match[1], 10),
            type: "intro",
          };
        };

        const skipTime = parseSkipTime(data.introSkipTime);

        return skipTime;
      } catch (error) {
        console.error("Error fetching fed-skips time:", error);
        return null;
      }
    };

    const fetchIntroDBTime = async (): Promise<SegmentData | null> => {
      if (!meta?.imdbId || meta.type === "movie") return null;

      try {
        const apiUrl = `${INTRODB_BASE_URL}?imdb_id=${meta.imdbId}&season=${meta.season?.number}&episode=${meta.episode?.number}`;

        const data = await proxiedFetch(apiUrl);

        if (data && typeof data.end_ms === "number") {
          // Convert milliseconds to seconds
          return {
            start: data.start_ms ? Math.floor(data.start_ms / 1000) : 0,
            end: Math.floor(data.end_ms / 1000),
            type: "intro",
          };
        }

        return null;
      } catch (error) {
        console.error("Error fetching IntroDB time:", error);
        return null;
      }
    };

    const fetchTIDBTime = async (): Promise<SegmentData | null> => {
      // TIDB implementation would go here if API was available
      // For now returning null
      if (!tidbKey) return null;
      return null;
    };

    const fetchSkipTime = async (): Promise<void> => {
      // Prioritize TheIntroDB if available (placeholder)
      const tidbTime = await fetchTIDBTime();
      if (tidbTime) {
        setSkipData({ skiptime: tidbTime, source: "theintrodb" });
        return;
      }

      // If user has febbox key, try Fed-skips (better quality)
      if (febboxKey) {
        const fedSkipsTime = await fetchFedSkipsTime();
        if (fedSkipsTime !== null) {
          setSkipData({ skiptime: fedSkipsTime, source: "fed-skips" });
          return;
        }
      }

      // Fall back to IntroDB API (available to all users)
      const introDBTime = await fetchIntroDBTime();
      if (introDBTime) {
        setSkipData({ skiptime: introDBTime, source: "introdb" });
      } else {
        setSkipData(null);
      }
    };

    fetchSkipTime();
  }, [
    meta?.tmdbId,
    meta?.imdbId,
    meta?.type,
    meta?.season?.number,
    meta?.episode?.number,
    febboxKey,
    tidbKey,
  ]);

  return skipData;
}
