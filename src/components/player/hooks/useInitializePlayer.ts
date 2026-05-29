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
  const sourceIdentifier = useMemo(
    () => (source ? JSON.stringify(source) : null),
    [source],
  );
  const { autoSelectDefaultSubtitles } = useCaptions();

  const hasSelected = useRef<string | null>(null);

  useEffect(() => {
    if (!sourceIdentifier) {
      hasSelected.current = null;
      return;
    }

    if (sourceIdentifier && hasSelected.current !== sourceIdentifier && captionList.length > 0) {
      hasSelected.current = sourceIdentifier;
      autoSelectDefaultSubtitles();
    }
  }, [sourceIdentifier, captionList.length, autoSelectDefaultSubtitles]);
}
