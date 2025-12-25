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

export function TVSeriesPage() {
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

  // Get TV show progress items for recommendations
  const tvProgressItems = Object.entries(progressItems || {}).filter(
    ([_, item]) => item.type === "show",
  );

  return (
    <HomeLayout showBg={showBg}>
      <div className="mb-2">
        <Helmet>
          <title>TV Series - NEXUS</title>
        </Helmet>

        {/* Featured TV Show Hero */}
        <FeaturedCarousel
          forcedCategory="tvshows"
          onShowDetails={handleShowDetails}
          searching={false}
          shorter
        />
      </div>

      {/* TV Shows Content */}
      <WideContainer ultraWide classNames="!px-3 md:!px-9 pt-4">
        {/* TV Show Recommendations - only show if there are TV show progress items */}
        {tvProgressItems.length > 0 && (
          <LazyMediaCarousel
            key="tv-recommendations"
            content={{ type: "recommendations" }}
            isTVShow
            carouselRefs={carouselRefs}
            onShowDetails={handleShowDetails}
            moreContent
            showRecommendations
            priority
          />
        )}

        {/* On Air */}
        <LazyMediaCarousel
          key="tv-on-air"
          content={{ type: "latesttv", fallback: "onTheAir" }}
          isTVShow
          carouselRefs={carouselRefs}
          onShowDetails={handleShowDetails}
          moreContent
          priority
        />

        {/* Top Rated */}
        <LazyMediaCarousel
          key="tv-top-rated"
          content={{ type: "topRated" }}
          isTVShow
          carouselRefs={carouselRefs}
          onShowDetails={handleShowDetails}
          moreContent
        />

        {/* Popular */}
        <LazyMediaCarousel
          key="tv-popular"
          content={{ type: "popular" }}
          isTVShow
          carouselRefs={carouselRefs}
          onShowDetails={handleShowDetails}
          moreContent
        />

        {/* Provider TV Shows */}
        <LazyMediaCarousel
          key="tv-providers"
          content={{ type: "provider" }}
          isTVShow
          carouselRefs={carouselRefs}
          onShowDetails={handleShowDetails}
          showProviders
          moreContent
        />

        {/* Genre TV Shows */}
        <LazyMediaCarousel
          key="tv-genres"
          content={{ type: "genre" }}
          isTVShow
          carouselRefs={carouselRefs}
          onShowDetails={handleShowDetails}
          showGenres
          moreContent
        />
      </WideContainer>
    </HomeLayout>
  );
}
