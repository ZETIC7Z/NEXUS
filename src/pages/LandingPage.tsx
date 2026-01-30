import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import { CarouselCards } from "@/components/CarouselCards";
import { Icon, Icons } from "@/components/Icon";
import { SocialLink } from "@/components/SocialLink";
import { conf } from "@/setup/config";
import { useAuthStore } from "@/stores/auth";

interface MoviePoster {
  id: string;
  poster: string;
  title: string;
}

// Movie card background
function MovieBackground() {
  const [rows, setRows] = useState<MoviePoster[][]>([[], [], [], [], [], []]);

  useEffect(() => {
    const fetchPosters = async () => {
      try {
        const apiKey = conf().TMDB_READ_API_KEY;
        const allPosters: MoviePoster[] = [];

        for (const page of [1, 2, 3, 4, 5]) {
          const response = await fetch(
            `https://api.themoviedb.org/3/trending/all/week?page=${page}`,
            {
              headers: {
                Authorization: `Bearer ${apiKey}`,
                "Content-Type": "application/json",
              },
            },
          );
          const data = await response.json();

          if (data.results) {
            const posters = data.results
              .filter((m: { poster_path: string }) => m.poster_path)
              .map(
                (m: {
                  id: number;
                  title?: string;
                  name?: string;
                  poster_path: string;
                }) => ({
                  id: String(m.id),
                  title: m.title || m.name || "",
                  poster: `https://image.tmdb.org/t/p/w300${m.poster_path}`,
                }),
              );
            allPosters.push(...posters);
          }
        }

        const shuffled = allPosters.sort(() => Math.random() - 0.5);
        const perRow = Math.ceil(shuffled.length / 6);
        const newRows = [
          shuffled.slice(0, perRow),
          shuffled.slice(perRow, perRow * 2),
          shuffled.slice(perRow * 2, perRow * 3),
          shuffled.slice(perRow * 3, perRow * 4),
          shuffled.slice(perRow * 4, perRow * 5),
          shuffled.slice(perRow * 5),
        ];
        setRows(newRows);
      } catch (error) {
        console.debug("Failed to fetch posters:", error);
      }
    };

    fetchPosters();
  }, []);

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none">
      <div
        className="absolute opacity-50"
        style={{
          transform: "rotate(-12deg) scale(1.8)",
          transformOrigin: "center center",
          top: "-20%",
          left: "-20%",
          right: "-20%",
          bottom: "-20%",
        }}
      >
        {rows.map((row, rowIndex) => (
          <div
            key={`row-${row[0]?.id || rowIndex}`}
            className={`flex gap-3 mb-3 ${rowIndex % 2 === 0 ? "animate-scroll-slow-left" : "animate-scroll-slow-right"}`}
            style={{ width: "max-content" }}
          >
            {row.map((poster) => (
              <div
                key={`${poster.id}-first`}
                className="w-[120px] md:w-[150px] aspect-[2/3] rounded-lg overflow-hidden flex-shrink-0"
              >
                <img
                  src={poster.poster}
                  alt=""
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
            ))}
            {row.map((poster) => (
              <div
                key={`${poster.id}-second`}
                className="w-[120px] md:w-[150px] aspect-[2/3] rounded-lg overflow-hidden flex-shrink-0"
              >
                <img
                  src={poster.poster}
                  alt=""
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
            ))}
            {row.map((poster) => (
              <div
                key={`${poster.id}-third`}
                className="w-[120px] md:w-[150px] aspect-[2/3] rounded-lg overflow-hidden flex-shrink-0"
              >
                <img
                  src={poster.poster}
                  alt=""
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
            ))}
          </div>
        ))}
      </div>
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 0%, rgba(0,0,0,0.5) 40%, rgba(0,0,0,0.85) 100%)",
        }}
      />
    </div>
  );
}

// Video intro animation with modern splash screen
function VideoIntro({ onComplete }: { onComplete: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [fadeOut, setFadeOut] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [showSplash, setShowSplash] = useState(true);

  // Start the intro with audio
  const startIntro = () => {
    const video = videoRef.current;
    const audio = audioRef.current;

    if (video && audio) {
      setShowSplash(false);
      video.muted = false;
      audio.volume = 1.0;

      video.play().catch(() => {
        video.muted = true;
        video.play().catch(() => onComplete());
      });

      audio.play().catch(() => {});
    }
  };

  // Video intro - no countdown, user clicks to start
  // (Removed auto-countdown timer per user request)

  // Video event handlers
  useEffect(() => {
    const video = videoRef.current;
    const audio = audioRef.current;
    if (!video || !audio) return;

    const handleEnded = () => {
      setFadeOut(true);
      audio.pause();
      audio.currentTime = 0;
      setTimeout(() => onComplete(), 500);
    };

    const handleError = () => {
      setHasError(true);
      audio.pause();
      onComplete();
    };

    video.addEventListener("ended", handleEnded);
    video.addEventListener("error", handleError);

    return () => {
      video.removeEventListener("ended", handleEnded);
      video.removeEventListener("error", handleError);
      audio.pause();
    };
  }, [onComplete]);

  if (hasError) return null;

  return (
    <div
      className={`fixed inset-0 z-50 bg-black transition-opacity duration-500 ${fadeOut ? "opacity-0 pointer-events-none" : "opacity-100"}`}
    >
      {/* Modern Splash Screen */}
      {showSplash && (
        <div className="absolute inset-0 z-20 bg-gradient-to-b from-black via-gray-900 to-black flex flex-col items-center justify-center">
          {/* Glowing animated logo */}
          <div className="relative mb-8">
            <div className="absolute inset-0 blur-3xl bg-red-600/30 animate-pulse rounded-full scale-150" />
            <img
              src="/nexus-logo-full.png"
              alt="NEXUS"
              className="relative h-32 md:h-40 lg:h-48 object-contain drop-shadow-[0_0_30px_rgba(239,68,68,0.8)] animate-pulse"
            />
          </div>

          {/* Play button - click to enter */}
          <button
            type="button"
            onClick={startIntro}
            className="relative group mb-8 w-28 h-28 rounded-full bg-gray-800/50 hover:bg-red-600/30 border-2 border-gray-700 hover:border-red-600 flex items-center justify-center transition-all"
          >
            <svg
              className="w-12 h-12 text-white ml-2"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M8 5v14l11-7z" />
            </svg>
            {/* Glow effect on hover */}
            <div className="absolute inset-0 rounded-full bg-red-600/0 group-hover:bg-red-600/10 transition-colors" />
          </button>

          {/* Enter Site button */}
          <button
            type="button"
            onClick={startIntro}
            className="flex items-center gap-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white px-10 py-4 rounded-full text-lg font-bold uppercase tracking-wider shadow-lg shadow-red-600/30 hover:shadow-red-600/50 transition-all hover:scale-105 mb-10"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
            Enter Site
          </button>

          {/* 18+ Disclaimer */}
          <div className="max-w-lg text-center px-6">
            <div className="flex items-center justify-center gap-2 mb-3">
              <span className="text-2xl">🔞</span>
              <span className="text-red-500 font-bold text-xl uppercase tracking-wider">
                Adults Only (18+)
              </span>
            </div>
            <p className="text-gray-500 text-sm leading-relaxed">
              This website contains content intended for adults only. By
              entering, you confirm that you are at least 18 years of age and
              agree to our Terms of Service.
            </p>
          </div>

          {/* Decorative elements */}
          <div className="absolute bottom-4 text-gray-600 text-xs">
            © 2025 NEXUS · All Rights Reserved
          </div>
        </div>
      )}

      <video
        ref={videoRef}
        src="/intro.mp4"
        className="w-full h-full object-cover"
        playsInline
        preload="auto"
      />
      <audio ref={audioRef} src="/introanim.mp3" preload="auto" />
    </div>
  );
}

export function LandingPage() {
  const navigate = useNavigate();
  const account = useAuthStore((s) => s.account);
  const isLoggedIn = !!account;

  const [contentVisible, setContentVisible] = useState(false);
  const [showTVIntro, setShowTVIntro] = useState(false);
  const [tvIntroComplete, setTVIntroComplete] = useState(false);

  // Check if TV and if intro has been shown
  useEffect(() => {
    const isTVSessionStorageKey = "nexus-tv-intro-shown";
    const hasShownIntro = sessionStorage.getItem(isTVSessionStorageKey);

    // Check if this is a TV device
    const isTV = document.documentElement.hasAttribute("data-tv-mode");

    if (isTV && !hasShownIntro && !isLoggedIn) {
      setShowTVIntro(true);
    } else {
      setTVIntroComplete(true);
    }
  }, [isLoggedIn]);

  const handleTVIntroComplete = () => {
    sessionStorage.setItem("nexus-tv-intro-shown", "true");
    setShowTVIntro(false);
    setTVIntroComplete(true);
  };

  // Redirect to discover if logged in
  useEffect(() => {
    if (isLoggedIn) {
      navigate("/discover", { replace: true });
    }
  }, [isLoggedIn, navigate]);

  // Show content with fade-in animation
  useEffect(() => {
    if (tvIntroComplete) {
      const timer = setTimeout(() => setContentVisible(true), 100);
      return () => clearTimeout(timer);
    }
  }, [tvIntroComplete]);

  const handleSignIn = () => navigate("/login");
  const handleRegister = () => navigate("/register");

  // Don't render if logged in (will redirect)
  if (isLoggedIn) return null;

  // Show TV intro if needed
  if (showTVIntro) {
    return <VideoIntro onComplete={handleTVIntroComplete} />;
  }

  return (
    <div className="h-screen bg-black relative overflow-hidden flex flex-col">
      <MovieBackground />

      {/* Header - Clean minimal header like Netflix */}
      <header
        className={`relative z-40 flex items-center justify-between px-3 md:px-6 lg:px-10 py-2 md:py-3 transition-all duration-500 flex-shrink-0 ${
          contentVisible ? "opacity-100" : "opacity-0"
        }`}
      >
        {/* Logo - Bigger for branding */}
        <img
          src="/nexus-logo-full.png"
          alt="NEXUS"
          className="h-10 md:h-14 lg:h-16 object-contain"
        />

        {/* Sign In Button */}
        <button
          type="button"
          onClick={handleSignIn}
          className="px-3 md:px-4 py-1 md:py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded transition-colors"
        >
          Sign In
        </button>
      </header>

      {/* Main content - centered in available space */}
      <div
        className={`relative z-10 flex-1 flex flex-col items-center justify-center px-4 transition-opacity duration-500 ${
          contentVisible ? "opacity-100" : "opacity-0"
        }`}
      >
        <div
          className={`text-center max-w-4xl mx-auto transition-all duration-1000 ${
            contentVisible
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-12"
          }`}
        >
          <h1 className="text-2xl sm:text-3xl md:text-5xl lg:text-6xl font-black text-white mb-2 md:mb-4 px-2 leading-tight tracking-tighter text-balance">
            Unlimited movies, <br className="hidden sm:block" /> TV shows, and
            more
          </h1>
          <p className="text-sm sm:text-base md:text-lg lg:text-xl text-gray-200 mb-4 md:mb-6 font-medium tracking-wide">
            Watch anywhere. Cancel anytime.
          </p>

          <div className="flex justify-center mb-4 md:mb-6">
            <button
              id="get-started-button"
              type="button"
              onClick={handleRegister}
              className="group relative px-8 md:px-10 py-2.5 md:py-3 bg-red-600 overflow-hidden text-white text-sm md:text-base font-black rounded-full transition-all hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(239,68,68,0.4)]"
            >
              <span className="relative z-10">Get Started</span>
              <div className="absolute inset-0 bg-gradient-to-r from-red-500 to-red-600 transition-transform duration-300 group-hover:scale-110" />
              <div className="absolute inset-x-0 -bottom-px h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
            </button>
          </div>
        </div>
      </div>

      {/* Bottom section - fixed at bottom */}
      <div
        className={`relative z-10 pb-2 flex-shrink-0 transition-opacity duration-500 ${
          contentVisible ? "opacity-100" : "opacity-0"
        }`}
      >
        {/* Site Developer Info */}
        <div className="flex flex-wrap items-center justify-center gap-2 md:gap-4 mb-3 md:mb-4 px-2">
          <div className="flex items-center gap-2 md:gap-3 bg-white/5 border border-white/10 px-3 md:px-4 py-1.5 md:py-2 rounded-full backdrop-blur-xl hover:bg-white/10 transition-colors cursor-default group">
            <span className="text-white/40 text-[8px] md:text-[9px] uppercase tracking-[0.15em] font-black group-hover:text-white/60 transition-colors">
              Site Developer
            </span>
            <div className="flex items-center gap-2">
              <div className="relative">
                <img
                  src="/sam-photo.jpg"
                  alt="Sam"
                  className="h-5 w-5 md:h-6 md:w-6 rounded-full object-cover border border-white/20 group-hover:border-red-500/50 transition-colors"
                />
              </div>
              <span className="text-white font-black text-[10px] md:text-xs tracking-tight">
                Sam Pangilinan
              </span>
              <img
                src="/sam-logo.jpg"
                alt="Logo"
                className="h-4 w-4 md:h-5 md:w-5 rounded shadow-lg object-cover"
              />
            </div>
          </div>
        </div>

        {/* Carousel Cards - Streaming Sites */}
        <div className="mb-2">
          <span className="text-white/60 text-[10px] uppercase tracking-[0.2em] block text-center mb-1 font-bold">
            Streaming Partners
          </span>
          <CarouselCards />
        </div>

        {/* Footer - Contact, Copyright, DMCA */}
        <div className="flex flex-col md:flex-row items-center justify-between px-3 md:px-8 py-1 text-[10px] text-white/50">
          {/* Contact Developer - Left */}
          <div className="flex items-center gap-2 mb-1 md:mb-0">
            <span className="text-white/40 uppercase tracking-[0.15em] text-[8px] font-bold">
              Contact
            </span>
            <div className="flex items-center gap-2">
              <SocialLink
                href="https://www.facebook.com/profile.php?id=61578123735793"
                color="#1877F2"
                icon={<Icon icon={Icons.FACEBOOK} className="text-xs" />}
                className="h-6 w-6"
              />
              <SocialLink
                href="mailto:samxerz12@gmail.com"
                color="#EA4335"
                icon={<Icon icon={Icons.MAIL} className="text-xs" />}
                className="h-6 w-6"
              />
            </div>
          </div>

          {/* Copyright - Center */}
          <div className="mb-1 md:mb-0 text-center text-[9px]">
            © 2025 - 2026 ZETICUZ. All rights reserved.
          </div>

          {/* DMCA Disclaimer - Right */}
          <div className="max-w-[200px] text-[8px] text-white/40 text-right leading-tight hidden md:block">
            Content aggregator. All streams via third-party services.
          </div>
        </div>
      </div>
    </div>
  );
}
