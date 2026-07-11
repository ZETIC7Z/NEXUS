import { useCallback, useEffect, useMemo, useRef } from "react";

import { usePlayerStore } from "@/stores/player/store";
import { useVolumeStore } from "@/stores/volume";

import { useCaptions } from "./useCaptions";

export function useInitializePlayer() {
  const display = usePlayerStore((s) => s.display);
  const volume = useVolumeStore((s) => s.volume);

  const init = useCallback(() => {
    display?.setVolume(volume);
  }, [display, volume]);

  return {
    init,
  };
}

export function useInitializeSource() {
  const source = usePlayerStore((s) => s.source);
  const captionList = usePlayerStore((s) => s.captionList);
  const selectedCaption = usePlayerStore((s) => s.caption.selected);
  const sourceIdentifier = useMemo(
    () => (source ? JSON.stringify(source) : null),
    [source],
  );
  const { autoSelectDefaultSubtitles } = useCaptions();

  const hasSelectedEnglish = useRef<string | null>(null);
  const hasSelectedFallback = useRef<string | null>(null);

  useEffect(() => {
    if (!sourceIdentifier) {
      hasSelectedEnglish.current = null;
      hasSelectedFallback.current = null;
      return;
    }

    if (captionList.length === 0) return;

    // Check if English subtitles are available
    const hasEnglish = captionList.some(
      (c) =>
        c.language.toLowerCase() === "en" ||
        c.language.toLowerCase().includes("english")
    );

    if (hasEnglish) {
      if (hasSelectedEnglish.current !== sourceIdentifier) {
        hasSelectedEnglish.current = sourceIdentifier;
        autoSelectDefaultSubtitles();
      }
    } else {
      // No English yet, select fallback if we haven't done so for this source
      if (hasSelectedFallback.current !== sourceIdentifier && !selectedCaption) {
        hasSelectedFallback.current = sourceIdentifier;
        autoSelectDefaultSubtitles();
      }
    }
  }, [sourceIdentifier, captionList.length, selectedCaption, autoSelectDefaultSubtitles]);
}
