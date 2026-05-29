import { useEffect, useState } from "react";
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

export function LandingPage() {
  const navigate = useNavigate();
  const account = useAuthStore((s) => s.account);
  const isLoggedIn = !!account;

  const [contentVisible, setContentVisible] = useState(false);

  // Redirect to discover if logged in
  useEffect(() => {
    if (isLoggedIn) {
      navigate("/discover", { replace: true });
    }
  }, [isLoggedIn, navigate]);

  // Show content with fade-in animation
  useEffect(() => {
    const timer = setTimeout(() => setContentVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const handleSignIn = () => navigate("/login");
  const handleRegister = () => navigate("/register");

  // Don't render if logged in (will redirect)
  if (isLoggedIn) return null;

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
