import { useEffect, useState } from "react";

export interface MobileFeatures {
  supportsCast: boolean;
  supportsPiP: boolean;
  supportsAirPlay: boolean;
  supportsOrientation: boolean;
  supportsFullscreen: boolean;
  isMobile: boolean;
  isIOS: boolean;
  isPWA: boolean;
}

export function useMobileFeatures(): MobileFeatures {
  const [features, setFeatures] = useState<MobileFeatures>({
    supportsCast: false,
    supportsPiP: false,
    supportsAirPlay: false,
    supportsOrientation: false,
    supportsFullscreen: false,
    isMobile: false,
    isIOS: false,
    isPWA: false,
  });

  useEffect(() => {
    const checkFeatures = () => {
      // Detect mobile device
      const isMobile =
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
          navigator.userAgent,
        ) || window.innerWidth <= 768;

      // Detect iOS
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

      // Detect PWA
      const isPWA =
        window.matchMedia("(display-mode: standalone)").matches ||
        (window.navigator as any).standalone === true;

      // Detect Cast API (Chrome, Edge, Opera)
      const w = window as any;
      const supportsCast = !!(w.chrome?.cast?.isAvailable || w.cast?.framework);

      // Detect Picture-in-Picture API
      const supportsPiP = "pictureInPictureEnabled" in document;

      // Detect AirPlay (Safari/iOS)
      const video = document.createElement("video");
      const supportsAirPlay =
        typeof (video as any).webkitShowPlaybackTargetPicker === "function";

      // Detect Screen Orientation API
      const supportsOrientation = !!(
        window.screen.orientation ||
        (window.screen as any).mozOrientation ||
        (window.screen as any).msOrientation
      );

      // Detect Fullscreen API
      const supportsFullscreen = !!(
        document.fullscreenEnabled ||
        (document as any).webkitFullscreenEnabled ||
        (document as any).mozFullScreenEnabled ||
        (document as any).msFullscreenEnabled
      );

      setFeatures({
        supportsCast,
        supportsPiP,
        supportsAirPlay,
        supportsOrientation,
        supportsFullscreen,
        isMobile,
        isIOS,
        isPWA,
      });
    };

    checkFeatures();

    // Re-check when Cast API is loaded
    if ((window as any).chrome?.cast) {
      (window as any).__onGCastApiAvailable = () => {
        checkFeatures();
      };
    }
  }, []);

  return features;
}
