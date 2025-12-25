import { useEffect, useRef, useState } from "react";
import { Helmet } from "react-helmet-async";

import { WideContainer } from "@/components/layout/WideContainer";
import { FeaturedCarousel } from "@/pages/discover/components/FeaturedCarousel";
import type { FeaturedMedia } from "@/pages/discover/components/FeaturedCarousel";
import { LazyMediaCarousel } from "@/pages/discover/components/LazyMediaCarousel";
import { HomeLayout } from "@/pages/layouts/HomeLayout";
import { useOverlayStack } from "@/stores/interface/overlayStack";
import { useProgressStore } from "@/stores/progress";
import { MediaItem } from "@/utils/mediaTypes";

export function MoviesPage() {
  const { showModal } = useOverlayStack();
  const carouselRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const progressItems = useProgressStore((state) => state.items);
  const [showBg, setShowBg] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleShowDetails = async (media: MediaItem | FeaturedMedia) => {
    showModal("details", {
      id: Number(media.id),
      type: media.type === "movie" ? "movie" : "show",
    });
  };

  // Get movie progress items for recommendations
  const movieProgressItems = Object.entries(progressItems || {}).filter(
    ([_, item]) => item.type === "movie",
  );

  return (
    <HomeLayout showBg={showBg}>
      <div className="mb-2">
        <Helmet>
          <title>Movies - NEXUS</title>
        </Helmet>

        {/* Featured Movie Hero */}
        <FeaturedCarousel
          forcedCategory="movies"
          onShowDetails={handleShowDetails}
          searching={false}
          shorter
        />
      </div>

      {/* Movies Content */}
      <WideContainer ultraWide classNames="!px-3 md:!px-9 pt-4">
        {/* Movie Recommendations - only show if there are movie progress items */}
        {movieProgressItems.length > 0 && (
          <LazyMediaCarousel
            key="movie-recommendations"
            content={{ type: "recommendations" }}
            isTVShow={false}
            carouselRefs={carouselRefs}
            onShowDetails={handleShowDetails}
            moreContent
            showRecommendations
            priority
          />
        )}

        {/* Latest Releases */}
        <LazyMediaCarousel
          key="movie-latest"
          content={{ type: "latest", fallback: "nowPlaying" }}
          isTVShow={false}
          carouselRefs={carouselRefs}
          onShowDetails={handleShowDetails}
          moreContent
          priority
        />

        {/* 4K Releases */}
        <LazyMediaCarousel
          key="movie-4k"
          content={{ type: "latest4k", fallback: "popular" }}
          isTVShow={false}
          carouselRefs={carouselRefs}
          onShowDetails={handleShowDetails}
          moreContent
        />

        {/* Top Rated */}
        <LazyMediaCarousel
          key="movie-top-rated"
          content={{ type: "topRated" }}
          isTVShow={false}
          carouselRefs={carouselRefs}
          onShowDetails={handleShowDetails}
          moreContent
        />

        {/* Popular */}
        <LazyMediaCarousel
          key="movie-popular"
          content={{ type: "popular" }}
          isTVShow={false}
          carouselRefs={carouselRefs}
          onShowDetails={handleShowDetails}
          moreContent
        />

        {/* Provider Movies */}
        <LazyMediaCarousel
          key="movie-providers"
          content={{ type: "provider" }}
          isTVShow={false}
          carouselRefs={carouselRefs}
          onShowDetails={handleShowDetails}
          showProviders
          moreContent
        />

        {/* Genre Movies */}
        <LazyMediaCarousel
          key="movie-genres"
          content={{ type: "genre" }}
          isTVShow={false}
          carouselRefs={carouselRefs}
          onShowDetails={handleShowDetails}
          showGenres
          moreContent
        />
      </WideContainer>
    </HomeLayout>
  );
}
