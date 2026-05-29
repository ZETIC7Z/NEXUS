import { useEffect, useState } from "react";
import { Icon, Icons } from "@/components/Icon";
import { Link } from "@/pages/migration/utils";
import { TMDBContentTypes, getMediaVideos } from "@/backend/metadata/tmdb";

import { DetailViewProps } from "../types";
import { formatNotificationDescription } from "../utils";

function GlowingDot({
  color = "green",
}: {
  color?: "green" | "orange" | "cyan" | "yellow";
}) {
  const colorMap = {
    green: {
      ring: "bg-green-400",
      pulse: "bg-green-400",
      dot: "bg-green-500",
      shadow: "shadow-[0_0_10px_#22c55e,0_0_20px_#22c55e]",
    },
    orange: {
      ring: "bg-orange-400",
      pulse: "bg-orange-400",
      dot: "bg-orange-500",
      shadow: "shadow-[0_0_10px_#f97316,0_0_20px_#f97316]",
    },
    cyan: {
      ring: "bg-cyan-400",
      pulse: "bg-cyan-400",
      dot: "bg-cyan-500",
      shadow: "shadow-[0_0_10px_#06b6d4,0_0_20px_#06b6d4]",
    },
    yellow: {
      ring: "bg-yellow-400",
      pulse: "bg-yellow-400",
      dot: "bg-yellow-500",
      shadow: "shadow-[0_0_10px_#eab308,0_0_20px_#eab308]",
    },
  };
  const c = colorMap[color] || colorMap.green;

  return (
    <span className="relative flex h-1.5 w-1.5 items-center justify-center">
      <span
        className={`animate-ping absolute inline-flex h-full w-full rounded-full ${c.ring} opacity-60`}
      />
      <span
        className={`animate-pulse absolute inline-flex h-full w-full rounded-full ${c.pulse} opacity-40 scale-[2.5]`}
      />
      <span
        className={`relative inline-flex rounded-full h-1.5 w-1.5 ${c.dot} ${c.shadow}`}
      />
    </span>
  );
}

export function DetailView({
  selectedNotification,
  goBackToList,
  getCategoryLabel,
  formatDate,
  isRead,
  toggleReadStatus,
}: DetailViewProps) {
  const isMovie = selectedNotification.type === "movie";
  const isShow = selectedNotification.type === "show";
  const isSystem = selectedNotification.type === "system";

  const [videoKey, setVideoKey] = useState<string | null>(null);

  useEffect(() => {
    if ((isMovie || isShow) && selectedNotification.mediaId) {
      const type = isMovie ? TMDBContentTypes.MOVIE : TMDBContentTypes.TV;
      getMediaVideos(selectedNotification.mediaId, type).then((videos) => {
        if (videos && videos.length > 0) {
          setVideoKey(videos[0].key);
        }
      }).catch(console.error);
    }
  }, [isMovie, isShow, selectedNotification.mediaId]);

  return (
    <div className="flex flex-col h-full max-h-[80vh]">
      {/* Actions / Read status toggle */}
      <div className="flex items-center justify-end pb-4 mb-4 border-b border-white/5">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={toggleReadStatus}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
              isRead
                ? "bg-white/5 border-white/10 text-white/60 hover:text-white"
                : "bg-type-link/10 border-type-link/20 text-type-link hover:bg-type-link/20"
            }`}
          >
            <Icon icon={isRead ? Icons.EYE_SLASH : Icons.EYE} />
            {isRead ? "Mark Unread" : "Mark Read"}
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto pr-2 space-y-6 custom-scrollbar">
        {/* Visual Header / Hero */}
        {!isSystem ? (
          <div className="relative rounded-3xl overflow-hidden border border-white/10 shadow-2xl bg-white/5">
            {videoKey ? (
              <div className="aspect-video w-full relative">
                <iframe
                  className="w-full h-full object-cover"
                  src={`https://www.youtube-nocookie.com/embed/${videoKey}?autoplay=1&controls=1&modestbranding=1&rel=0`}
                  title="Trailer"
                  allow="autoplay; encrypted-media; fullscreen"
                  allowFullScreen
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background-main via-transparent to-transparent pointer-events-none" />
              </div>
            ) : selectedNotification.posterUrl ? (
              <div className="aspect-video w-full relative">
                <img
                  src={selectedNotification.posterUrl}
                  alt=""
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background-main via-background-main/20 to-black/40" />
              </div>
            ) : (
              <div className="h-32 w-full flex items-center justify-center bg-gradient-to-br from-type-link/20 to-purple-500/20">
                <Icon
                  icon={isMovie ? Icons.FILM : Icons.BELL}
                  className="text-5xl text-white/20"
                />
              </div>
            )}

            <div className="absolute bottom-0 left-0 right-0 p-6 pointer-events-none">
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <div className="flex items-center gap-3 px-0 py-1 backdrop-blur-md">
                  <span className="text-[10px] font-bold text-white uppercase tracking-wider">
                    {getCategoryLabel(selectedNotification.category)}
                  </span>
                  
                  {/* Glowing Dot Section */}
                  {selectedNotification.category.toLowerCase() === "announcement" && (
                    <GlowingDot color="orange" />
                  )}
                  {selectedNotification.category.toLowerCase() === "update" && (
                    <GlowingDot color="orange" />
                  )}
                  {selectedNotification.category.toLowerCase() === "trending" && (
                    <GlowingDot color="cyan" />
                  )}
                  {selectedNotification.category.toLowerCase() === "awaited" && (
                    <GlowingDot color="yellow" />
                  )}
                  {/* Fallback dot for other categories to keep consistency */}
                  {!["announcement", "update", "trending", "awaited"].includes(
                    selectedNotification.category.toLowerCase(),
                  ) && <GlowingDot color="orange" />}
                </div>
                <span className="text-[10px] text-white/50 font-bold px-2 py-1 bg-black/40 backdrop-blur-md rounded-md border border-white/5 uppercase">
                  {selectedNotification.source}
                </span>
                {selectedNotification.releaseDate && (
                  <span className="text-[10px] text-yellow-500 font-bold px-2 py-1 bg-yellow-500/10 backdrop-blur-md rounded-md border border-yellow-500/20 uppercase">
                    {selectedNotification.releaseDate}
                  </span>
                )}
              </div>
              <h1 className="text-2xl md:text-3xl font-black text-white leading-tight drop-shadow-lg mb-4">
                {selectedNotification.title}
              </h1>

              {/* Watch Now Button below trailer/hero */}
              {(isMovie || isShow) && selectedNotification.mediaId && (
                <div className="pointer-events-auto">
                  <Link
                    href={selectedNotification.link || `/media/tmdb-${selectedNotification.mediaType}-${selectedNotification.mediaId}`}
                    className="inline-flex px-6 py-2.5 bg-type-link hover:bg-type-linkHover text-white rounded-lg font-bold transition-all items-center gap-2 shadow-lg shadow-type-link/40 text-sm"
                  >
                    <Icon icon={Icons.PLAY} className="text-xs" />
                    WATCH NOW
                  </Link>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="pt-2 pb-6">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <div className="flex items-center gap-3 px-0 py-1">
                <span className="text-[10px] font-bold text-white uppercase tracking-wider">
                  {getCategoryLabel(selectedNotification.category)}
                </span>
                {/* Glowing Dot Section */}
                <GlowingDot color="orange" />
              </div>
              <span className="text-[10px] text-white/50 font-bold px-2 py-1 bg-black/40 rounded-md border border-white/5 uppercase">
                {selectedNotification.source}
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-white leading-tight drop-shadow-lg">
              {selectedNotification.title}
            </h1>
          </div>
        )}

        {/* Description Section */}
        <div className="space-y-4 px-1">
          <div className="flex items-center gap-3 text-xs text-type-secondary font-medium">
            <div className="flex items-center gap-1.5">
              <Icon icon={Icons.CLOCK} className="text-[10px]" />
              {formatDate(selectedNotification.pubDate)}
            </div>
          </div>

          {/* eslint-disable-next-line react/no-danger */}
          <div
            className="text-base text-type-secondary leading-relaxed font-medium opacity-95 pr-2 prose prose-invert max-w-none 
            [&_h3]:text-white [&_h3]:mt-6 [&_h3]:mb-2 [&_h3]:font-black [&_h3]:tracking-tight
            [&_p]:mb-3 [&_strong]:text-white [&_strong]:font-bold"
            dangerouslySetInnerHTML={{
              __html: formatNotificationDescription(
                selectedNotification.description,
              ),
            }}
          />
        </div>

        {/* Actions Section */}
        {selectedNotification.link && (
          <div className="pt-6 border-t border-white/5 flex flex-wrap gap-4">
            <Link
              href={selectedNotification.link}
              target={
                selectedNotification.link.startsWith("http")
                  ? "_blank"
                  : undefined
              }
              className="px-8 py-3 bg-type-link hover:bg-type-linkHover text-white rounded-xl font-bold transition-all flex items-center gap-2 shadow-lg shadow-type-link/20 group"
            >
              <span>{isMovie ? "Watch Now" : "Learn More"}</span>
              <Icon
                icon={Icons.CHEVRON_RIGHT}
                className="group-hover:translate-x-1 transition-transform"
              />
            </Link>

            <button
              onClick={goBackToList}
              className="px-8 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl font-bold transition-all border border-white/5"
            >
              Dismiss
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
