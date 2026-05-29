import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

import { Button } from "@/components/buttons/Button";
import { Icon, Icons } from "@/components/Icon";
import { WideContainer } from "@/components/layout/WideContainer";
import { MediaGrid } from "@/components/media/MediaGrid";
import { WatchedMediaCard } from "@/components/media/WatchedMediaCard";
import { SubPageLayout } from "@/pages/layouts/SubPageLayout";
import { useOverlayStack } from "@/stores/interface/overlayStack";
import {
  ProgressMediaItem,
  getProgressPercentage,
  useProgressStore,
} from "@/stores/progress";
import { MediaItem } from "@/utils/mediaTypes";

type FilterType = "all" | "movies" | "shows";

function formatTimeAgo(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

export function WatchHistory() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const progressItems = useProgressStore((s) => s.items);
  const clearProgress = useProgressStore((s) => s.clear);
  const [filter, setFilter] = useState<FilterType>("all");
  const { showModal } = useOverlayStack();

  const handleShowDetails = (media: MediaItem) => {
    showModal("details", {
      id: Number(media.id),
      type: media.type === "movie" ? "movie" : "show",
    });
  };

  const items = useMemo(() => {
    const output: (MediaItem & {
      progressPercent: number;
      lastWatched: number;
    })[] = [];

    Object.entries(progressItems).forEach(
      ([id, item]: [string, ProgressMediaItem]) => {
        // Calculate progress percentage
        let progressPercent = 0;
        if (item.type === "movie" && item.progress) {
          progressPercent = getProgressPercentage(
            item.progress.watched,
            item.progress.duration,
          );
        } else if (item.type === "show") {
          // For shows, get max episode progress
          const episodes = Object.values(item.episodes);
          if (episodes.length > 0) {
            const maxProgress = Math.max(
              ...episodes.map((ep) =>
                getProgressPercentage(
                  ep.progress.watched,
                  ep.progress.duration,
                ),
              ),
            );
            progressPercent = maxProgress;
          }
        }

        // Only include items that have been watched (progress > 0)
        if (progressPercent > 0 || item.updatedAt > 0) {
          output.push({
            id,
            title: item.title,
            year: item.year,
            poster: item.poster,
            type: item.type,
            progressPercent,
            lastWatched: item.updatedAt,
          });
        }
      },
    );

    // Sort by most recently watched
    output.sort((a, b) => b.lastWatched - a.lastWatched);

    // Apply filter
    if (filter === "movies") {
      return output.filter((item) => item.type === "movie");
    }
    if (filter === "shows") {
      return output.filter((item) => item.type === "show");
    }
    return output;
  }, [progressItems, filter]);

  const handleClearHistory = () => {
    if (window.confirm("Are you sure you want to clear all watch history?")) {
      clearProgress();
    }
  };

  if (Object.keys(progressItems).length === 0) {
    return (
      <SubPageLayout>
        <WideContainer>
          <div className="flex flex-col items-center justify-center min-h-[50vh]">
            <Icon
              icon={Icons.CLOCK}
              className="text-6xl text-type-dimmed mb-4"
            />
            <p className="text-lg text-type-dimmed mb-4">
              No watch history yet
            </p>
            <Button theme="purple" onClick={() => navigate("/")}>
              Start Watching
            </Button>
          </div>
        </WideContainer>
      </SubPageLayout>
    );
  }

  return (
    <SubPageLayout>
      <WideContainer>
        {/* Header - consistent title size with other pages */}
        <div className="flex items-center justify-between gap-4 mb-4">
          <h2 className="text-xl md:text-2xl font-bold text-white flex items-center gap-3">
            <Icon icon={Icons.CLOCK} />
            Recent Watch
          </h2>
          <Button
            theme="secondary"
            className="text-sm"
            onClick={handleClearHistory}
          >
            <Icon icon={Icons.X} className="mr-2" />
            Clear All
          </Button>
        </div>

        {/* Back Button */}
        <div className="flex items-center gap-4 pb-4">
          <button
            type="button"
            onClick={() => navigate("/")}
            className="flex items-center text-white hover:text-gray-300 transition-colors"
          >
            <Icon icon={Icons.ARROW_LEFT} className="text-xl" />
            <span className="ml-2">{t("discover.page.back")}</span>
          </button>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6">
          {(["all", "movies", "shows"] as FilterType[]).map((filterType) => (
            <button
              key={filterType}
              type="button"
              onClick={() => setFilter(filterType)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                filter === filterType
                  ? "bg-[#06b6d4] text-black"
                  : "bg-video-context-buttonFocus text-white hover:bg-video-context-border"
              }`}
            >
              {filterType === "all" && "All"}
              {filterType === "movies" && "Movies"}
              {filterType === "shows" && "TV Shows"}
            </button>
          ))}
        </div>

        {/* Results Count */}
        <p className="text-type-dimmed text-sm mb-4">
          {items.length} {items.length === 1 ? "item" : "items"}
        </p>

        {/* Content Grid */}
        {items.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-type-dimmed">
              No{" "}
              {filter === "movies"
                ? "movies"
                : filter === "shows"
                  ? "TV shows"
                  : "items"}{" "}
              in your history
            </p>
          </div>
        ) : (
          <MediaGrid>
            {items.map((item) => (
              <div key={item.id} className="relative">
                <WatchedMediaCard
                  media={item}
                  onShowDetails={() => handleShowDetails(item)}
                />
                {/* Time badge */}
                <div className="absolute top-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded-full z-10">
                  {formatTimeAgo(item.lastWatched)}
                </div>
              </div>
            ))}
          </MediaGrid>
        )}
      </WideContainer>
    </SubPageLayout>
  );
}

export default WatchHistory;
