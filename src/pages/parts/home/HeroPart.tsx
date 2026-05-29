import classNames from "classnames";
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { getMediaPoster } from "@/backend/metadata/tmdb";
import { ThinContainer } from "@/components/layout/ThinContainer";
import { useSearchQuery } from "@/hooks/useSearchQuery";
import { conf } from "@/setup/config";
import { useAuthStore } from "@/stores/auth";

export interface HeroPartProps {
  setIsSticky: (val: boolean) => void;
  searchParams: ReturnType<typeof useSearchQuery>;
  showTitle?: boolean;
}

function getTimeGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 5) return "Good Night";
  if (hour < 12) return "Good Morning";
  if (hour < 17) return "Good Afternoon";
  if (hour < 21) return "Good Evening";
  return "Good Night";
}

// Provider logos - high quality SVGs
const PROVIDER_LOGOS = [
  {
    id: "netflix",
    name: "Netflix",
    url: "https://upload.wikimedia.org/wikipedia/commons/0/08/Netflix_2015_logo.svg",
  },
  {
    id: "hbomax",
    name: "HBO Max",
    url: "https://upload.wikimedia.org/wikipedia/commons/1/17/HBO_Max_Logo.svg",
  },
  {
    id: "disney",
    name: "Disney Plus",
    url: "https://upload.wikimedia.org/wikipedia/commons/3/3e/Disney%2B_logo.svg",
  },
  {
    id: "prime",
    name: "Amazon Prime",
    url: "https://upload.wikimedia.org/wikipedia/commons/f/f1/Prime_Video.svg",
  },
  {
    id: "hulu",
    name: "Hulu",
    url: "https://upload.wikimedia.org/wikipedia/commons/e/e4/Hulu_Logo.svg",
  },
  {
    id: "appletv",
    name: "Apple TV+",
    url: "https://upload.wikimedia.org/wikipedia/commons/2/28/Apple_TV_Plus_Logo.svg",
  },
  {
    id: "paramount",
    name: "Paramount+",
    url: "https://upload.wikimedia.org/wikipedia/commons/a/a5/Paramount_Plus.svg",
  },
  {
    id: "peacock",
    name: "Peacock",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d3/NBCUniversal_Peacock_Logo.svg/1200px-NBCUniversal_Peacock_Logo.svg.png",
  },
  {
    id: "crunchyroll",
    name: "Crunchyroll",
    url: "https://upload.wikimedia.org/wikipedia/commons/0/08/Crunchyroll_Logo.png",
  },
  {
    id: "github",
    name: "GitHub",
    url: "https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png",
  },
];

const TECH_LOGOS = [
  {
    id: "react",
    name: "React",
    url: "https://upload.wikimedia.org/wikipedia/commons/a/a7/React-icon.svg",
  },
  {
    id: "typescript",
    name: "TypeScript",
    url: "https://upload.wikimedia.org/wikipedia/commons/4/4c/Typescript_logo_2020.svg",
  },
  {
    id: "vite",
    name: "Vite",
    url: "https://upload.wikimedia.org/wikipedia/commons/f/f1/Vitejs-logo.svg",
  },
  {
    id: "tailwind",
    name: "TailwindCSS",
    url: "https://upload.wikimedia.org/wikipedia/commons/d/d5/Tailwind_CSS_Logo.svg",
  },
];

const ALL_LOGOS = [...PROVIDER_LOGOS, ...TECH_LOGOS];

interface MoviePoster {
  id: string;
  poster: string;
  title: string;
}

// Component for scrolling movie poster row
function MoviePosterRow({
  posters,
  direction,
  speed,
}: {
  posters: MoviePoster[];
  direction: "left" | "right";
  speed: number;
}) {
  const animationClass =
    direction === "left" ? "animate-scroll-left" : "animate-scroll-right";

  return (
    <div
      className="flex gap-3 whitespace-nowrap"
      style={{ animationDuration: `${speed}s` }}
    >
      <div
        className={`flex gap-3 ${animationClass}`}
        style={{ animationDuration: `${speed}s` }}
      >
        {/* First set */}
        {posters.map((poster) => (
          <div
            key={`${poster.id}-first`}
            className="flex-shrink-0 w-[120px] md:w-[150px] aspect-[2/3] rounded-lg overflow-hidden"
          >
            <img
              src={poster.poster}
              alt={poster.title}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </div>
        ))}
        {/* Duplicate for seamless loop */}
        {posters.map((poster) => (
          <div
            key={`${poster.id}-second`}
            className="flex-shrink-0 w-[120px] md:w-[150px] aspect-[2/3] rounded-lg overflow-hidden"
          >
            <img
              src={poster.poster}
              alt={poster.title}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </div>
        ))}
      </div>
    </div>
  );
}

// Scrolling movie background for non-logged in users
function MovieBackground() {
  const [movieRows, setMovieRows] = useState<MoviePoster[][]>([[], [], [], []]);

  useEffect(() => {
    const fetchRandomPosters = async () => {
      try {
        const apiKey = conf().TMDB_READ_API_KEY;
        // Fetch multiple pages for variety
        const pages = [1, 2, 3, 4];
        const allPosters: MoviePoster[] = [];

        for (const page of pages) {
          const response = await fetch(
            `https://api.themoviedb.org/3/movie/popular?api_key=${apiKey}&page=${page}`,
          );
          const data = await response.json();
          const posters = data.results
            .filter((m: any) => m.poster_path)
            .map((m: any) => ({
              id: String(m.id),
              poster: getMediaPoster(m.poster_path) || "",
              title: m.title,
            }));
          allPosters.push(...posters);
        }

        // Shuffle and split into rows
        const shuffled = allPosters.sort(() => Math.random() - 0.5);
        const rowSize = Math.ceil(shuffled.length / 4);
        setMovieRows([
          shuffled.slice(0, rowSize),
          shuffled.slice(rowSize, rowSize * 2),
          shuffled.slice(rowSize * 2, rowSize * 3),
          shuffled.slice(rowSize * 3),
        ]);
      } catch (error) {
        console.error("Error fetching movie posters:", error);
      }
    };

    fetchRandomPosters();
  }, []);

  if (movieRows[0].length === 0) return null;

  return (
    <div className="absolute inset-0 overflow-hidden opacity-15 pointer-events-none">
      {/* Gradient overlay for edge fade */}
      <div
        className="absolute inset-0 z-10"
        style={{
          background:
            "linear-gradient(to right, rgba(0,0,0,1) 0%, transparent 10%, transparent 90%, rgba(0,0,0,1) 100%)",
        }}
      />
      <div
        className="absolute inset-0 z-10"
        style={{
          background:
            "linear-gradient(to bottom, rgba(0,0,0,0.5) 0%, transparent 20%, transparent 80%, rgba(0,0,0,1) 100%)",
        }}
      />

      {/* Movie poster rows */}
      <div className="flex flex-col gap-3 py-4 transform -rotate-6 scale-110 -translate-y-10">
        <MoviePosterRow posters={movieRows[0]} direction="left" speed={60} />
        <MoviePosterRow posters={movieRows[1]} direction="right" speed={55} />
        <MoviePosterRow posters={movieRows[2]} direction="left" speed={65} />
        <MoviePosterRow posters={movieRows[3]} direction="right" speed={50} />
      </div>
    </div>
  );
}

// Provider logos marquee component
function ProviderLogosMarquee() {
  return (
    <div className="w-screen relative left-1/2 -translate-x-1/2 overflow-hidden mt-8">
      {/* Edge fade gradient */}
      <div
        className="absolute inset-0 z-10 pointer-events-none"
        style={{
          background:
            "linear-gradient(to right, rgba(0,0,0,1) 0%, transparent 8%, transparent 92%, rgba(0,0,0,1) 100%)",
        }}
      />

      {/* Scrolling logos */}
      <div className="flex animate-logo-scroll">
        {/* First set */}
        {ALL_LOGOS.map((logo) => (
          <div
            key={`${logo.id}-first`}
            className="mx-6 flex items-center justify-center h-12 w-24 opacity-50 grayscale hover:opacity-80 hover:grayscale-0 transition-all duration-300 flex-shrink-0"
          >
            <img
              src={logo.url}
              alt={logo.name}
              className="max-h-full max-w-full object-contain"
              loading="lazy"
            />
          </div>
        ))}
        {/* Duplicate for seamless loop */}
        {ALL_LOGOS.map((logo) => (
          <div
            key={`${logo.id}-second`}
            className="mx-6 flex items-center justify-center h-12 w-24 opacity-50 grayscale hover:opacity-80 hover:grayscale-0 transition-all duration-300 flex-shrink-0"
          >
            <img
              src={logo.url}
              alt={logo.name}
              className="max-h-full max-w-full object-contain"
              loading="lazy"
            />
          </div>
        ))}
      </div>
    </div>
  );
}

export function HeroPart({
  setIsSticky,
  searchParams,
  showTitle,
}: HeroPartProps) {
  const [search] = searchParams;
  const navigate = useNavigate();
  const account = useAuthStore((s) => s.account);
  const isLoggedIn = !!account;

  const _stickStateChanged = useCallback(
    (isFixed: boolean) => {
      setIsSticky(isFixed);
    },
    [setIsSticky],
  );

  const greeting = getTimeGreeting();
  const userName = account?.fullName || account?.nickname || "Guest";

  const handleDiscoverClick = () => {
    navigate("/discover");
  };

  return (
    <div className="relative">
      {/* Movie poster background for non-logged in users */}
      {!isLoggedIn && <MovieBackground />}

      <ThinContainer>
        <div
          className={classNames(
            "relative z-20 space-y-4 text-center",
            showTitle ? "mt-24 md:mt-32" : "mt-4",
          )}
        >
          {showTitle && search.length === 0 ? (
            <div className="relative z-10">
              {/* NEXUS Logo - Big and prominent */}
              <img
                src="/nexus-logo-full.png"
                alt="NEXUS"
                className="mx-auto h-24 md:h-32 lg:h-40 object-contain mb-6"
              />

              {/* Provider/Tech Logos Marquee - Below logo */}
              <ProviderLogosMarquee />

              {/* Personalized Greeting - Only show for logged in users or generic for guests */}
              <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white mt-8 mb-2">
                {isLoggedIn
                  ? `${greeting}, ${userName}!`
                  : "Your Entertainment Hub"}
              </h1>

              {!isLoggedIn && (
                <p className="text-gray-400 text-base md:text-lg mb-4">
                  Stream unlimited movies, TV shows, and anime
                </p>
              )}

              {/* Discover Button */}
              <button
                type="button"
                onClick={handleDiscoverClick}
                className="mt-4 px-8 py-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white text-base font-semibold rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-red-500/30"
              >
                Discover New Shows
              </button>
            </div>
          ) : null}
        </div>
      </ThinContainer>
    </div>
  );
}
