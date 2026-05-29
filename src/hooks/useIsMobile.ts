import { useEffect, useRef, useState } from "react";

import { isAndroidTV, isTVDevice } from "@/utils/isTVDevice";

export function useIsMobile(horizontal?: boolean) {
  const [isMobile, setIsMobile] = useState(false);
  const isMobileCurrent = useRef<boolean | null>(false);

  useEffect(() => {
    function onResize() {
      const value = horizontal
        ? window.innerHeight < 600
        : window.innerWidth < 1024;
      const isChanged = isMobileCurrent.current !== value;
      if (!isChanged) return;

      isMobileCurrent.current = value;
      setIsMobile(value);
    }

    onResize();
    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("resize", onResize);
    };
  }, [horizontal]);

  return {
    isMobile,
  };
}

export function useIsPWA() {
  return window.matchMedia("(display-mode: standalone)").matches;
}

export function useIsIOS() {
  return /iPad|iPhone|iPod/.test(navigator.userAgent);
}

export function useIsTVDevice() {
  const [isTV, setIsTV] = useState(false);

  useEffect(() => {
    setIsTV(isTVDevice());
  }, []);

  return isTV;
}

export function useIsAndroidTV() {
  const [isTV, setIsTV] = useState(false);

  useEffect(() => {
    setIsTV(isAndroidTV());
  }, []);

  return isTV;
}
