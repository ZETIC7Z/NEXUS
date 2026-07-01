import { useEffect, useRef } from "react";

import { useSkipTime } from "@/components/player/hooks/useSkipTime";
import { usePlayerStore } from "@/stores/player/store";
import { usePreferencesStore } from "@/stores/preferences";

interface SegmentSkipState {
  segmentId: string;
  hasSkipped: boolean;
}

/**
 * Component that automatically skips segments (intro, recap, preview, credits)
 * when the enableAutoSkipSegments preference is enabled.
 * For credits segments, only skips if end_ms is null (end of video).
 */
export function AutoSkipSegments() {
  const enableAutoSkipSegments = usePreferencesStore(
    (s) => s.enableAutoSkipSegments,
  );
  const skipCredits = usePreferencesStore((s) => s.enableSkipCredits);
  const display = usePlayerStore((s) => s.display);
  const time = usePlayerStore((s) => s.progress.time);
  const meta = usePlayerStore((s) => s.meta);
  const segments = useSkipTime();

  const skippedSegmentsRef = useRef<Map<string, SegmentSkipState>>(new Map());

  // Reset skip state when media changes
  useEffect(() => {
    skippedSegmentsRef.current.clear();
  }, [meta?.tmdbId, meta?.season?.number, meta?.episode?.number]);

  useEffect(() => {
    if (!enableAutoSkipSegments || !display) return;

    const currentSeconds = time;

    for (const segment of segments) {
      const isCreditsSegment = segment.type === "credits";
      if (isCreditsSegment) {
        if (!skipCredits) continue;
        if (segment.end_ms !== null) continue;
      } else if (segment.end_ms === null) {
        continue;
      }

      const startSeconds = (segment.start_ms ?? 0) / 1000;
      const endSeconds = segment.end_ms ? segment.end_ms / 1000 : Infinity;
      const segmentId = `${segment.type}-${startSeconds}-${endSeconds}`;

      if (currentSeconds >= startSeconds && currentSeconds < endSeconds) {
        const skipState = skippedSegmentsRef.current.get(segmentId);

        if (!skipState || !skipState.hasSkipped) {
          display.setTime(
            endSeconds === Infinity ? currentSeconds + 10 : endSeconds,
          );

          skippedSegmentsRef.current.set(segmentId, {
            segmentId,
            hasSkipped: true,
          });
        }
      }
    }
  }, [
    enableAutoSkipSegments,
    skipCredits,
    display,
    time,
    segments,
    meta?.tmdbId,
    meta?.season?.number,
    meta?.episode?.number,
  ]);

  return null;
}
