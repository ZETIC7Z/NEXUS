import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

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
  const [countdown, setCountdown] = useState(5);

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

      audio.play().catch(() => { });
    }
  };

  // Countdown timer - auto enter after 5 seconds
  useEffect(() => {
    if (!showSplash) return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          // Inline startIntro logic to satisfy ESLint
          const video = videoRef.current;
          const audio = audioRef.current;
          if (video && audio) {
            setShowSplash(false);
            video.muted = false;
            audio.volume = 1.0;
            video.play().catch(() => {
              video.muted = true;
              video.play().catch(() => { });
            });
            audio.play().catch(() => { });
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [showSplash]);

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

          {/* Circular countdown with Enter button */}
          <button
            type="button"
            onClick={startIntro}
            className="relative group mb-8"
          >
            {/* Circular progress ring */}
            <svg
              className="w-28 h-28 transform -rotate-90"
              viewBox="0 0 100 100"
            >
              <circle
                className="text-gray-800"
                strokeWidth="4"
                stroke="currentColor"
                fill="transparent"
                r="45"
                cx="50"
                cy="50"
              />
              <circle
                className="text-red-600 transition-all duration-1000"
                strokeWidth="4"
                stroke="currentColor"
                fill="transparent"
                r="45"
                cx="50"
                cy="50"
                strokeDasharray={283}
                strokeDashoffset={283 * (countdown / 5)}
                strokeLinecap="round"
              />
            </svg>
            {/* Center content */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-bold text-white">{countdown}</span>
              <span className="text-xs text-gray-400 uppercase tracking-wider">
                sec
              </span>
            </div>
            {/* Glow effect on hover */}
            <div className="absolute inset-0 rounded-full bg-red-600/0 group-hover:bg-red-600/20 transition-colors" />
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

// Provider logos - continuous smooth loop, logos close together
function ProviderLogoSlider({ visible }: { visible: boolean }) {
  const logos = (
    <>
      <img
        src="https://images.justwatch.com/icon/207360008/s100/netflix.webp"
        alt="Netflix"
        className="h-10 w-10 rounded-lg mx-1.5"
      />
      <img
        src="https://images.justwatch.com/icon/285237061/s100/hbomax.webp"
        alt="HBO Max"
        className="h-10 w-10 rounded-lg mx-1.5"
      />
      <img
        src="https://images.justwatch.com/icon/147638351/s100/disneyplus.webp"
        alt="Disney+"
        className="h-10 w-10 rounded-lg mx-1.5"
      />
      <img
        src="https://images.justwatch.com/icon/52449539/s100/amazonprimevideo.webp"
        alt="Prime"
        className="h-10 w-10 rounded-lg mx-1.5"
      />
      <img
        src="https://images.justwatch.com/icon/116305230/s100/hulu.webp"
        alt="Hulu"
        className="h-10 w-10 rounded-lg mx-1.5"
      />
      <img
        src="https://images.justwatch.com/icon/190848813/s100/appletvplus.webp"
        alt="Apple TV+"
        className="h-10 w-10 rounded-lg mx-1.5"
      />
      <img
        src="/vivamax-logo.jpg"
        alt="VMX"
        className="h-10 w-10 rounded-lg mx-1.5 object-cover"
      />
      <img
        src="https://images.justwatch.com/icon/232697473/s100/paramountplus.webp"
        alt="Paramount+"
        className="h-10 w-10 rounded-lg mx-1.5"
      />
      <img
        src="https://images.justwatch.com/icon/194625828/s100/peacock.webp"
        alt="Peacock"
        className="h-10 w-10 rounded-lg mx-1.5"
      />
      <img
        src="https://www.themoviedb.org/assets/2/v4/logos/v2/blue_square_2-d537fb228cf3ced904ef09b136fe3fec72548ebc1fea3fbbd1ad9e36364db38b.svg"
        alt="TMDB"
        className="h-10 w-10 rounded-lg mx-1.5"
      />
      <img
        src="https://images.justwatch.com/icon/169478387/s100/crunchyroll.webp"
        alt="Crunchyroll"
        className="h-10 w-10 rounded-lg mx-1.5"
      />
    </>
  );

  return (
    <div
      className={`flex justify-center transition-opacity duration-500 ${visible ? "opacity-100" : "opacity-0"}`}
    >
      <div className="max-w-md overflow-hidden">
        <style>
          {`
            @keyframes smoothSlide {
              0% { transform: translateX(0); }
              100% { transform: translateX(-50%); }
            }
            .smooth-slide {
              animation: smoothSlide 15s linear infinite;
            }
          `}
        </style>
        <div
          className="flex items-center smooth-slide whitespace-nowrap"
          style={{ width: "max-content" }}
        >
          {logos}
          {logos}
        </div>
      </div>
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
    <div className="min-h-screen bg-black relative overflow-hidden flex flex-col">
      <MovieBackground />

      {/* Header */}
      <header
        className={`fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-6 md:px-12 py-4 transition-opacity duration-500 ${contentVisible ? "opacity-100" : "opacity-0"
          }`}
      >
        <img
          src="/nexus-logo-full.png"
          alt="NEXUS"
          className="h-20 md:h-28 lg:h-32 object-contain"
        />
        <button
          type="button"
          onClick={handleSignIn}
          className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded transition-colors"
        >
          Sign In
        </button>
      </header>

      {/* Main content - centered */}
      <div
        className={`relative z-10 flex-1 flex flex-col items-center justify-center px-4 transition-opacity duration-500 ${contentVisible ? "opacity-100" : "opacity-0"
          }`}
      >
        <div
          className={`text-center max-w-4xl transition-all duration-700 ${contentVisible
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-8"
            }`}
        >
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4">
            Unlimited movies, TV shows, and more
          </h1>
          <p className="text-lg md:text-xl text-gray-300 mb-8">
            Watch anywhere. Cancel anytime.
          </p>

          <div className="flex justify-center mb-12">
            <button
              id="get-started-button"
              type="button"
              onClick={handleRegister}
              className="px-12 py-4 bg-red-600 hover:bg-red-700 text-white text-lg font-bold rounded transition-all hover:scale-105"
            >
              Get Started
            </button>
          </div>
        </div>
      </div>

      {/* Bottom section - fixed at bottom */}
      <div
        className={`relative z-10 pb-4 transition-opacity duration-500 ${contentVisible ? "opacity-100" : "opacity-0"
          }`}
      >
        {/* Static info section - Technology + Developer */}
        <div className="flex flex-wrap items-center justify-center gap-4 md:gap-6 mb-4 px-4">
          {/* Project Technology */}
          <div className="flex items-center gap-2">
            <span className="text-white/60 text-xs uppercase tracking-wider">
              Project Technology
            </span>
            <img
              src="https://upload.wikimedia.org/wikipedia/commons/a/a7/React-icon.svg"
              alt="React"
              className="h-6 w-6"
            />
            <img
              src="https://upload.wikimedia.org/wikipedia/commons/4/4c/Typescript_logo_2020.svg"
              alt="TypeScript"
              className="h-6 w-6"
            />
            <img
              src="https://upload.wikimedia.org/wikipedia/commons/f/f1/Vitejs-logo.svg"
              alt="Vite"
              className="h-6 w-6"
            />
            <img
              src="https://upload.wikimedia.org/wikipedia/commons/d/d5/Tailwind_CSS_Logo.svg"
              alt="TailwindCSS"
              className="h-6 w-6"
            />
          </div>

          <span className="text-white/30 hidden md:inline">|</span>

          {/* Site Developer */}
          <div className="flex items-center gap-2">
            <span className="text-white/60 text-xs uppercase tracking-wider">
              Site Developer
            </span>
            <img
              src="/sam-photo.jpg"
              alt="Sam"
              className="h-8 w-8 rounded-full object-cover border border-white/30"
            />
            <span className="text-white font-medium text-sm">
              Sam Pangilinan
            </span>
            <img
              src="/sam-logo.jpg"
              alt="Logo"
              className="h-6 w-6 rounded object-cover"
            />
          </div>
        </div>

        {/* Provider logos slider */}
        <div className="mb-4">
          <span className="text-white/60 text-xs uppercase tracking-wider block text-center mb-3">
            Movie Providers
          </span>
          <ProviderLogoSlider visible={contentVisible} />
        </div>

        {/* Footer - Contact, Copyright, DMCA */}
        <div className="flex flex-col md:flex-row items-center justify-between px-6 md:px-12 py-3 text-xs text-white/50">
          {/* Contact Developer - Left */}
          <div className="flex items-center gap-3 mb-2 md:mb-0">
            <span className="text-white/40 uppercase tracking-wider text-[10px]">
              Contact Developer
            </span>
            <a
              href="https://www.facebook.com/profile.php?id=61578123735793"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:opacity-80 transition-opacity"
            >
              <svg
                className="h-5 w-5 fill-current text-blue-500"
                viewBox="0 0 24 24"
              >
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
            </a>
            <a
              href="mailto:samxerz12@gmail.com"
              className="hover:opacity-80 transition-opacity"
            >
              <svg
                className="h-5 w-5 fill-current text-red-500"
                viewBox="0 0 24 24"
              >
                <path d="M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73l-6.545 4.909-6.545-4.909v9.273H1.636A1.636 1.636 0 0 1 0 19.366V5.457c0-2.023 2.309-3.178 3.927-1.964L5.455 4.64 12 9.548l6.545-4.909 1.528-1.145C21.69 2.28 24 3.434 24 5.457z" />
              </svg>
            </a>
          </div>

          {/* Copyright - Center */}
          <div className="mb-2 md:mb-0 text-center">
            © 2025 - 2026 ZETICUZ. All rights reserved.
          </div>

          {/* DMCA Disclaimer - Right */}
          <div className="max-w-xs text-[10px] text-white/40 text-right leading-tight">
            This platform serves as a content aggregator and does not host any
            media files directly. All content is streamed through trusted
            third-party services.
          </div>
        </div>
      </div>
    </div>
  );
}
