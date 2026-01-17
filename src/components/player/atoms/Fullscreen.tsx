import { useCallback, useEffect } from "react";

import { Icons } from "@/components/Icon";
import { VideoPlayerButton } from "@/components/player/internals/Button";
import { usePlayerStore } from "@/stores/player/store";

export function Fullscreen() {
  const { isFullscreen } = usePlayerStore((s) => s.interface);
  const display = usePlayerStore((s) => s.display);
  const setScreenLocked = usePlayerStore((s) => s.setScreenLocked);

  // Handle orientation lock/unlock when fullscreen changes
  const handleOrientationChange = useCallback(
    (enteringFullscreen: boolean) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const screenAny = window.screen as any;

      if (enteringFullscreen) {
        // Lock to landscape when entering fullscreen
        if (screenAny.orientation?.lock) {
          screenAny.orientation.lock("landscape").catch(() => {
            // Orientation lock not supported or failed - silently ignore
            // This is expected on desktop browsers and iOS
          });
        }
      } else {
        // Unlock orientation when exiting fullscreen
        if (screenAny.orientation?.unlock) {
          try {
            screenAny.orientation.unlock();
          } catch {
            // Orientation unlock not supported
          }
        }
        // Also auto-unlock the screen lock when exiting fullscreen
        setScreenLocked(false);
      }
    },
    [setScreenLocked],
  );

  // Listen for fullscreen changes to trigger orientation lock
  // This ensures the orientation lock happens AFTER fullscreen is established
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isNowFullscreen = !!document.fullscreenElement;
      handleOrientationChange(isNowFullscreen);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange);

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener(
        "webkitfullscreenchange",
        handleFullscreenChange,
      );
    };
  }, [handleOrientationChange]);

  const handleFullscreenToggle = () => {
    // Just toggle fullscreen - orientation will be handled by the event listener
    display?.toggleFullscreen();
  };

  return (
    <VideoPlayerButton
      onClick={handleFullscreenToggle}
      icon={isFullscreen ? Icons.COMPRESS : Icons.EXPAND}
    />
  );
}
