import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Helmet } from "react-helmet-async";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";

import { decodeTMDBId } from "@/backend/metadata/tmdb";
import { MWMediaType } from "@/backend/metadata/types/mw";
import { Icon, Icons } from "@/components/Icon";
import { Transition } from "@/components/utils/Transition";

export function ZeticuzIframePlayer() {
  const params = useParams<{
    media: string;
    episode?: string;
    season?: string;
  }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const containerRef = useRef<HTMLDivElement>(null);

  const [showControls, setShowControls] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isScreenLocked, setIsScreenLocked] = useState(false);
  const [showLockButton, setShowLockButton] = useState(false);
  const [isLandscape, setIsLandscape] = useState(false);
  const lockButtonTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Build the iframe URL
  const iframeSrc = useMemo(() => {
    if (!params.media) return null;
    const decoded = decodeTMDBId(params.media);
    if (!decoded) return null;
    const { id, type } = decoded;

    if (type === MWMediaType.MOVIE) {
      return `https://zxcstream.xyz/player/movie/${id}?server=1&domainAd=www.zeticuz.online&color=E50914`;
    }
    if (type === MWMediaType.SERIES) {
      const seasonNum = params.season || "1";
      const episodeNum = params.episode || "1";
      return `https://zxcstream.xyz/player/tv/${id}/${seasonNum}/${episodeNum}?server=1&domainAd=www.zeticuz.online&color=E50914`;
    }
    return null;
  }, [params.media, params.season, params.episode]);

  // ─── Auto-hide controls after 5s of inactivity ───
  useEffect(() => {
    if (isScreenLocked) return; // Don't run inactivity timer when locked

    let timer: NodeJS.Timeout;
    const handleActivity = () => {
      setShowControls(true);
      clearTimeout(timer);
      timer = setTimeout(() => setShowControls(false), 5000);
    };

    const events = [
      "mousemove",
      "mousedown",
      "touchstart",
      "keydown",
      "wheel",
    ] as const;
    events.forEach((e) => window.addEventListener(e, handleActivity));
    handleActivity(); // Start the timer immediately

    return () => {
      events.forEach((e) => window.removeEventListener(e, handleActivity));
      clearTimeout(timer);
    };
  }, [isScreenLocked]);

  // ─── Landscape detection ───
  useEffect(() => {
    const check = () => setIsLandscape(window.innerWidth > window.innerHeight);
    check();
    window.addEventListener("resize", check);
    window.addEventListener("orientationchange", check);
    return () => {
      window.removeEventListener("resize", check);
      window.removeEventListener("orientationchange", check);
    };
  }, []);

  // ─── Fullscreen change listener ───
  useEffect(() => {
    const handleFsChange = () => {
      const nowFs = !!document.fullscreenElement;
      setIsFullscreen(nowFs);
      if (!nowFs) {
        // Auto-unlock when exiting fullscreen
        setIsScreenLocked(false);
        setShowLockButton(false);
        // Unlock orientation
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const screenAny = window.screen as any;
        if (screenAny.orientation?.unlock) {
          try {
            screenAny.orientation.unlock();
          } catch {
            /* not supported */
          }
        }
      }
    };
    document.addEventListener("fullscreenchange", handleFsChange);
    document.addEventListener("webkitfullscreenchange", handleFsChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFsChange);
      document.removeEventListener("webkitfullscreenchange", handleFsChange);
    };
  }, []);

  // ─── Toggle fullscreen with orientation lock ───
  const toggleFullscreen = useCallback(() => {
    if (!containerRef.current) return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const screenAny = window.screen as any;

    if (!document.fullscreenElement) {
      // Entering fullscreen — lock to landscape
      if (screenAny.orientation?.lock) {
        screenAny.orientation.lock("landscape").catch(() => {});
      }
      containerRef.current.requestFullscreen().catch((err) => {
        console.error(`Fullscreen error: ${err.message}`);
      });
    } else {
      // Exiting fullscreen — unlock orientation
      if (screenAny.orientation?.unlock) {
        try {
          screenAny.orientation.unlock();
        } catch {
          /* not supported */
        }
      }
      setIsScreenLocked(false);
      document.exitFullscreen();
    }
  }, []);

  // ─── Lock screen helpers ───
  const startLockButtonTimer = useCallback(() => {
    if (lockButtonTimerRef.current) clearTimeout(lockButtonTimerRef.current);
    lockButtonTimerRef.current = setTimeout(
      () => setShowLockButton(false),
      3000,
    );
  }, []);

  const toggleLock = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      e.stopPropagation();
      e.preventDefault();
      const newLocked = !isScreenLocked;
      setIsScreenLocked(newLocked);
      setShowLockButton(true);
      startLockButtonTimer();
    },
    [isScreenLocked, startLockButtonTimer],
  );

  const handleLockedScreenTap = useCallback(() => {
    if (isScreenLocked) {
      setShowLockButton(true);
      startLockButtonTimer();
    }
  }, [isScreenLocked, startLockButtonTimer]);

  // Show lock button briefly when lock state changes
  useEffect(() => {
    if (isScreenLocked) {
      setShowLockButton(true);
      startLockButtonTimer();
    }
  }, [isScreenLocked, startLockButtonTimer]);

  // ─── Render ───
  if (!iframeSrc) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-black font-bold text-white">
        Invalid Media ID
      </div>
    );
  }

  // Decide whether to show the lock button area (only in landscape fullscreen)
  const showLockFeature = isFullscreen && isLandscape;

  return (
    <div
      ref={containerRef}
      className="relative flex h-screen w-full flex-col overflow-hidden bg-black"
      onMouseMove={() => {
        if (!isScreenLocked) setShowControls(true);
      }}
      onTouchStart={() => {
        if (!isScreenLocked) setShowControls(true);
      }}
    >
      <Helmet>
        <title>Zeticuz Player | NEXUS</title>
      </Helmet>

      {/* ══════════════ NEXUS Logo ══════════════
          Mobile: top-[2px] right-[74px] h-[28px]  (exactly in the red-box area from reference image)
          Desktop: top-[-12px] right-20 h-20
          Fullscreen: same responsive positions apply
      */}
      <Transition
        animation="fade"
        show={showControls && !isScreenLocked}
        durationClass="duration-200"
        className="absolute z-[60] pointer-events-none right-[74px] top-[2px] md:right-24 md:top-[-12px] lg:right-28"
      >
        <img
          src="/nexus-logo-full.png"
          alt="NEXUS"
          className="h-[28px] w-auto opacity-90 drop-shadow-[0_2px_10px_rgba(0,0,0,1)] sm:h-12 md:h-16 lg:h-20"
        />
      </Transition>

      {/* ══════════════ Back Button ══════════════
          Always shows on interaction (same auto-hide as logo).
          Hidden when screen is locked.
      */}
      <Transition
        animation="fade"
        show={showControls && !isScreenLocked}
        durationClass="duration-200"
        className="absolute left-3 top-3 z-[60] md:left-4 md:top-4"
      >
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="rounded-full bg-black/50 p-2.5 text-white backdrop-blur-md transition-colors hover:bg-black/70 md:p-3"
          title={t("player.back")}
        >
          <Icon icon={Icons.ARROW_LEFT} />
        </button>
      </Transition>

      {/* ══════════════ Fullscreen Proxy ══════════════
          Invisible trigger over the player's internal fullscreen button.
          Intercepts click to use OUR fullscreen (with landscape lock).
          Hidden when screen is locked.
      */}
      {!isScreenLocked && (
        <div
          className="absolute bottom-0 right-0 z-[70] h-16 w-16 cursor-pointer opacity-0"
          onClick={toggleFullscreen}
          aria-hidden="true"
          title="Fullscreen"
        />
      )}

      {/* ══════════════ Wake-up Overlay ══════════════
          Captures initial mouse movement or tap over the iframe
          when controls are hidden, so we can show them immediately.
      */}
      {!showControls && !isScreenLocked && (
        <div
          className="absolute inset-0 z-[50]"
          onMouseMove={() => setShowControls(true)}
          onTouchStart={() => setShowControls(true)}
          onClick={() => setShowControls(true)}
        />
      )}

      {/* ══════════════ Lock Screen (Fullscreen Landscape Only) ══════════════
          Full-screen touch blocker when locked.
      */}
      {showLockFeature && isScreenLocked && (
        <div
          className="absolute inset-0 z-[100] cursor-default"
          onClick={handleLockedScreenTap}
          onTouchStart={handleLockedScreenTap}
          aria-label="Screen is locked. Tap to show unlock button."
        />
      )}

      {/* Lock/Unlock button — right-center of screen */}
      {showLockFeature && (
        <Transition
          animation="fade"
          show={showLockButton || (showControls && !isScreenLocked)}
          className="absolute right-4 top-1/2 -translate-y-1/2 z-[101]"
        >
          <button
            type="button"
            onClick={toggleLock}
            onTouchEnd={toggleLock}
            className="flex h-12 w-12 items-center justify-center rounded-full border border-white/20 bg-black/50 backdrop-blur-sm transition-all duration-200 hover:bg-black/70"
            aria-label={isScreenLocked ? "Unlock screen" : "Lock screen"}
          >
            <Icon
              icon={isScreenLocked ? Icons.LOCK : Icons.UNLOCK}
              className="text-xl text-white"
            />
          </button>
        </Transition>
      )}

      {/* ══════════════ Iframe Player ══════════════ */}
      <iframe
        src={iframeSrc}
        title="Zeticuz Iframe Player"
        className="h-full w-full border-0"
        allow="autoplay; fullscreen"
        allowFullScreen
        sandbox="allow-scripts allow-same-origin allow-forms allow-presentation"
      />
    </div>
  );
}
