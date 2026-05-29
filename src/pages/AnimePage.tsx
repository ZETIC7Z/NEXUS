import { useEffect, useRef, useState } from "react";
import { Helmet } from "react-helmet-async";

import { getMediaPoster } from "@/backend/metadata/tmdb";
import { WideContainer } from "@/components/layout/WideContainer";
import { FeaturedCarousel } from "@/pages/discover/components/FeaturedCarousel";
import type { FeaturedMedia } from "@/pages/discover/components/FeaturedCarousel";
import { HomeLayout } from "@/pages/layouts/HomeLayout";
import { useOverlayStack } from "@/stores/interface/overlayStack";
import { useProgressStore } from "@/stores/progress";
import { MediaItem } from "@/utils/mediaTypes";

// Anime-specific TMDB API calls (Japanese Animation)
async function fetchAnimeFromTMDB(
  type: "popular" | "top_rated" | "airing_today" | "trending",
): Promise<MediaItem[]> {
  const apiKey = import.meta.env.VITE_TMDB_READ_API_KEY;
  const baseUrl = "https://api.themoviedb.org/3";
  const headers = {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
  };

  let url = "";

  switch (type) {
    case "trending":
      url = `${baseUrl}/trending/tv/week`;
      break;
    case "airing_today":
      url = `${baseUrl}/discover/tv?with_genres=16&with_original_language=ja&sort_by=first_air_date.desc&first_air_date.lte=${new Date().toISOString().split("T")[0]}`;
      break;
    case "top_rated":
      url = `${baseUrl}/discover/tv?with_genres=16&with_original_language=ja&sort_by=vote_average.desc&vote_count.gte=200`;
      break;
    case "popular":
    default:
      url = `${baseUrl}/discover/tv?with_genres=16&with_original_language=ja&sort_by=popularity.desc`;
      break;
  }

  const response = await fetch(url, { headers });
  const data = await response.json();

  // Filter for anime (Japanese + Animation genre)
  let results = data.results || [];
  if (type === "trending") {
    results = results.filter(
      (item: any) =>
        item.genre_ids?.includes(16) && item.original_language === "ja",
    );
  }

  return results.slice(0, 20).map((item: any) => ({
    id: String(item.id),
    title: item.name || item.title,
    poster: getMediaPoster(item.poster_path) || "/placeholder.png",
    type: "show" as const,
    year: item.first_air_date?.split("-")[0] || "",
  }));
}

interface AnimeCarouselProps {
  title: string;
  items: MediaItem[];
  onShowDetails: (media: MediaItem) => void;
}

function AnimeCarousel({ title, items, onShowDetails }: AnimeCarouselProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  if (items.length === 0) return null;

  return (
    <div className="mb-8">
      <h2 className="text-xl md:text-2xl font-bold text-white mb-4 px-2">
        {title}
      </h2>
      <div
        ref={containerRef}
        className="flex gap-2 md:gap-3 overflow-x-auto pb-4 px-2 scrollbar-hide"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {items.map((item) => (
          <div
            key={item.id}
            className="flex-shrink-0 w-[140px] md:w-[180px] cursor-pointer"
            onClick={() => onShowDetails(item)}
          >
            <div className="relative aspect-[2/3] rounded-lg overflow-hidden bg-gray-800 mb-2">
              <img
                src={item.poster}
                alt={item.title}
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                loading="lazy"
              />
            </div>
            <p className="text-white text-sm font-medium truncate">
              {item.title}
            </p>
            {item.year && <p className="text-gray-400 text-xs">{item.year}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}

interface ContinueWatchingItem extends MediaItem {
  percentage: number;
}

function ContinueWatchingCarousel({
  items,
  onShowDetails,
}: {
  items: ContinueWatchingItem[];
  onShowDetails: (media: MediaItem) => void;
}) {
  if (items.length === 0) return null;

  return (
    <div className="mb-8">
      <h2 className="text-xl md:text-2xl font-bold text-white mb-4 px-2">
        Continue Watching
      </h2>
      <div
        className="flex gap-2 md:gap-3 overflow-x-auto pb-4 px-2 scrollbar-hide"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {items.map((item) => (
          <div
            key={item.id}
            className="flex-shrink-0 w-[140px] md:w-[180px] cursor-pointer"
            onClick={() => onShowDetails(item)}
          >
            <div className="relative aspect-[2/3] rounded-lg overflow-hidden bg-gray-800 mb-2">
              <img
                src={item.poster}
                alt={item.title}
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                loading="lazy"
              />
              {/* Progress bar */}
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-700">
                <div
                  className="h-full bg-red-600"
                  style={{ width: `${item.percentage}%` }}
                />
              </div>
            </div>
            <p className="text-white text-sm font-medium truncate">
              {item.title}
            </p>
            {item.year && <p className="text-gray-400 text-xs">{item.year}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}

export function AnimePage() {
  const { showModal } = useOverlayStack();
  const [_showBg, _setShowBg] = useState(false);
  const [loading, setLoading] = useState(true);
  const progressItems = useProgressStore((state) => state.items);

  // Anime content state
  const [popularAnime, setPopularAnime] = useState<MediaItem[]>([]);
  const [topRatedAnime, setTopRatedAnime] = useState<MediaItem[]>([]);
  const [trendingAnime, setTrendingAnime] = useState<MediaItem[]>([]);
  const [airingAnime, setAiringAnime] = useState<MediaItem[]>([]);

  const loadAnimeContent = async () => {
    try {
      setLoading(true);

      const [popular, topRated, trending, airing] = await Promise.all([
        fetchAnimeFromTMDB("popular"),
        fetchAnimeFromTMDB("top_rated"),
        fetchAnimeFromTMDB("trending"),
        fetchAnimeFromTMDB("airing_today"),
      ]);

      setPopularAnime(popular);
      setTopRatedAnime(topRated);
      setTrendingAnime(trending);
      setAiringAnime(airing);
    } catch (error) {
      console.error("Error loading anime content:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    window.scrollTo(0, 0);
    loadAnimeContent();
  }, []);

  const handleShowDetails = async (media: MediaItem | FeaturedMedia) => {
    showModal("details", {
      id: Number(media.id),
      type: media.type === "movie" ? "movie" : "show",
    });
  };

  // Get anime-specific continue watching items
  const continueWatchingItems: ContinueWatchingItem[] = Object.entries(
    progressItems || {},
  )
    .filter(([_, item]) => item.type === "show") // Anime is categorized as show
    .map(([id, item]) => ({
      id,
      title: item.title || "Unknown",
      poster: item.poster || "/placeholder.png",
      type: "show" as const,
      year: item.year ? Number(item.year) : undefined,

      percentage: Math.min(
        100,
        Math.round(
          ((item.progress?.watched || 0) / (item.progress?.duration || 1)) *
            100,
        ),
      ),
    }))
    .filter((item) => item.percentage > 0 && item.percentage < 95)
    .slice(0, 10);

  return (
    <HomeLayout>
      <div className="mb-2">
        <Helmet>
          <title>Anime - NEXUS</title>
        </Helmet>

        {/* Featured Anime Hero - anime only */}
        <FeaturedCarousel
          forcedCategory="anime"
          onShowDetails={handleShowDetails}
          searching={false}
          shorter
        />
      </div>

      {/* Anime Content */}
      <WideContainer ultraWide classNames="!px-3 md:!px-9 pt-4">
        {/* Continue Watching Section */}
        {continueWatchingItems.length > 0 && (
          <ContinueWatchingCarousel
            items={continueWatchingItems}
            onShowDetails={handleShowDetails}
          />
        )}

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-500" />
          </div>
        ) : (
          <>
            <AnimeCarousel
              title="🔥 Trending Anime"
              items={trendingAnime}
              onShowDetails={handleShowDetails}
            />

            <AnimeCarousel
              title="📺 Currently Airing"
              items={airingAnime}
              onShowDetails={handleShowDetails}
            />

            <AnimeCarousel
              title="⭐ Popular Anime"
              items={popularAnime}
              onShowDetails={handleShowDetails}
            />

            <AnimeCarousel
              title="🏆 Top Rated Anime"
              items={topRatedAnime}
              onShowDetails={handleShowDetails}
            />
          </>
        )}
      </WideContainer>
    </HomeLayout>
  );
}
