import { useEffect, useMemo, useRef, useState } from "react";
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

  const [showLogo, setShowLogo] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const iframeSrc = useMemo(() => {
    if (!params.media) return null;

    // We decode the TMDB ID from the URL (e.g. tmdb-movie-xxxx-slug or tmdb-tv-xxxx-slug)
    const decoded = decodeTMDBId(params.media);
    if (!decoded) return null;

    const { id, type } = decoded;

    if (type === MWMediaType.MOVIE) {
      return `https://zxcstream.xyz/player/movie/${id}?server=5&domainAd=www.zeticuz.online&color=E50914`;
    }

    if (type === MWMediaType.SERIES) {
      const seasonNum = params.season || "1";
      const episodeNum = params.episode || "1";
      return `https://zxcstream.xyz/player/tv/${id}/${seasonNum}/${episodeNum}?server=5&domainAd=www.zeticuz.online&color=E50914`;
    }

    return null;
  }, [params.media, params.season, params.episode]);

  // Handle auto-hiding the logo after 5 seconds of inactivity
  useEffect(() => {
    let timer: NodeJS.Timeout;

    const handleInactivity = () => {
      setShowLogo(true);
      clearTimeout(timer);
      timer = setTimeout(() => {
        setShowLogo(false);
      }, 5000); // 5 seconds
    };

    window.addEventListener("mousemove", handleInactivity);
    window.addEventListener("mousedown", handleInactivity);
    window.addEventListener("touchstart", handleInactivity);
    window.addEventListener("keydown", handleInactivity);
    window.addEventListener("focus", handleInactivity);
    window.addEventListener("blur", handleInactivity);
    window.addEventListener("wheel", handleInactivity);
    window.addEventListener("scroll", handleInactivity, true);

    handleInactivity();

    return () => {
      window.removeEventListener("mousemove", handleInactivity);
      window.removeEventListener("mousedown", handleInactivity);
      window.removeEventListener("touchstart", handleInactivity);
      window.removeEventListener("keydown", handleInactivity);
      window.removeEventListener("focus", handleInactivity);
      window.removeEventListener("blur", handleInactivity);
      window.removeEventListener("wheel", handleInactivity);
      window.removeEventListener("scroll", handleInactivity, true);
      clearTimeout(timer);
    };
  }, []);

  // Listen for fullscreen changes to update UI state
  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFsChange);
    return () =>
      document.removeEventListener("fullscreenchange", handleFsChange);
  }, []);

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch((err) => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  };

  if (!iframeSrc) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-black font-bold text-white">
        Invalid Media ID
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="relative flex h-screen w-full flex-col overflow-hidden bg-black p-[2px]"
      onMouseMove={() => setShowLogo(true)}
    >
      <Helmet>
        <title>Zeticuz Player | NEXUS</title>
      </Helmet>

      {/* NEXUS Logo Overlay - Positioned at top-[-12px] (up +3) and right-20. Now shows instantly (duration-75). Logo size responds to device. */}
      <Transition
        animation="fade"
        show={showLogo}
        durationClass="duration-75"
        className="absolute right-20 top-[-12px] z-[60] pointer-events-none md:right-24 lg:right-28"
      >
        <img
          src="/nexus-logo-full.png"
          alt="NEXUS"
          className="h-12 w-auto opacity-90 drop-shadow-[0_2px_10px_rgba(0,0,0,1)] transition-opacity sm:h-16 md:h-20"
        />
      </Transition>

      {/* Back button overlay */}
      <Transition
        animation="fade"
        show={showLogo}
        durationClass="duration-200"
        className="absolute left-4 top-4 z-50"
      >
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="rounded-full bg-black/50 p-3 text-white backdrop-blur-md transition-colors hover:bg-black/70"
          title={t("player.back")}
        >
          <Icon icon={Icons.ARROW_LEFT} />
        </button>
      </Transition>

      {/* Fullscreen Proxy Detector: Intercepts clicks on the player's internal FS button to use our branded FS instead. */}
      <div
        className="absolute bottom-0 right-0 z-[70] h-16 w-16 cursor-pointer opacity-0"
        onClick={toggleFullscreen}
        aria-hidden="true"
        title="Fullscreen"
      />

      {/* Embedded Zeticuz player */}
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
