import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { Icon, Icons } from "@/components/Icon";
import { useBookmarkStore } from "@/stores/bookmarks";

import { ListViewProps } from "../types";
import { formatNotificationDescription } from "../utils";

const GlowingDot = ({ color = 'green' }: { color?: 'green' | 'orange' | 'cyan' | 'yellow' }) => {
  const colorMap = {
    green: { ring: 'bg-green-400', pulse: 'bg-green-400', dot: 'bg-green-500', shadow: 'shadow-[0_0_10px_#22c55e,0_0_20px_#22c55e]' },
    orange: { ring: 'bg-orange-400', pulse: 'bg-orange-400', dot: 'bg-orange-500', shadow: 'shadow-[0_0_10px_#f97316,0_0_20px_#f97316]' },
    cyan: { ring: 'bg-cyan-400', pulse: 'bg-cyan-400', dot: 'bg-cyan-500', shadow: 'shadow-[0_0_10px_#06b6d4,0_0_20px_#06b6d4]' },
    yellow: { ring: 'bg-yellow-400', pulse: 'bg-yellow-400', dot: 'bg-yellow-500', shadow: 'shadow-[0_0_10px_#eab308,0_0_20px_#eab308]' },
  };
  const c = colorMap[color] || colorMap.green;
  
  return (
    <span className="relative flex h-1.5 w-1.5 flex-shrink-0">
      <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${c.ring} opacity-60`} />
      <span className={`animate-pulse absolute inline-flex h-full w-full rounded-full ${c.pulse} opacity-40 scale-[2.5]`} />
      <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${c.dot} ${c.shadow}`} />
    </span>
  );
};

export function ListView({
  notifications: allNotifications,
  readNotifications,
  unreadCount,
  loading,
  error,
  containerRef,
  markAllAsRead,
  markAllAsUnread,
  clearReadNotifications,
  isShiftHeld,
  onRefresh,
  onOpenSettings,
  openNotificationDetail,
  getCategoryColor,
  getCategoryLabel,
  formatDate,
  // Add new props from hook for dismissal
  deleteNotification,
  clearNotifications,
}: ListViewProps & {
  deleteNotification: (guid: string, mediaId?: string) => void;
  clearNotifications: (mode: "read" | "all") => void;
}) {
  const [showClearOptions, setShowClearOptions] = useState(false);
  const navigate = useNavigate();
  const addBookmark = useBookmarkStore((s) => s.addBookmark);
  const removeBookmark = useBookmarkStore((s) => s.removeBookmark);
  const bookmarks = useBookmarkStore((s) => s.bookmarks);

  const handleClearAll = (mode: "read" | "all") => {
    clearNotifications(mode);
    setShowClearOptions(false);
  };

  const toggleBookmark = (e: React.MouseEvent, notification: any) => {
    e.stopPropagation();
    e.preventDefault();
    
    // Fallback to guid if mediaId is completely omitted
    const targetId = notification.mediaId || notification.guid;
    if (!targetId) return;

    const isBookmarked = !!bookmarks[targetId];
    if (isBookmarked) {
      removeBookmark(targetId);
    } else {
      let rYear = 0;
      if (notification.releaseDate) rYear = parseInt(String(notification.releaseDate).split('-')[0]);
      else if (notification.pubDate) rYear = parseInt(String(notification.pubDate).split('-')[0]);

      addBookmark({
        type: notification.mediaType === "show" ? "show" : "movie",
        title: notification.title || "Unknown Title",
        tmdbId: targetId,
        releaseYear: isNaN(rYear) ? 0 : rYear,
        poster: notification.posterUrl || "",
      });
    }
  };

  return (
    <div className="flex flex-col h-full max-h-[75vh]">
      {/* Header with refresh and mark all buttons */}
      <div className="flex justify-between items-center pb-4 mb-4 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Icon icon={Icons.BELL} className="text-xl text-type-link" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500" />
              </span>
            )}
          </div>
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight">
              Inbox
            </h2>
            <p className="text-xs text-type-secondary">
              {unreadCount} new notification{unreadCount !== 1 ? "s" : ""}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 relative">
          {unreadCount > 0 && (
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowClearOptions(!showClearOptions)}
                className="px-3 py-1.5 text-xs font-semibold bg-white/5 hover:bg-white/10 text-white rounded-lg transition-all border border-white/5 flex items-center gap-2 group"
              >
                <Icon
                  icon={Icons.X}
                  className="text-[10px] group-hover:rotate-90 transition-transform"
                />
                Clear All
              </button>

              <AnimatePresence>
                {showClearOptions && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 5 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 5 }}
                    className="absolute right-0 mt-2 w-48 bg-slate-900 border border-white/10 rounded-xl shadow-2xl z-[100] overflow-hidden"
                  >
                    <button
                      onClick={() => handleClearAll("read")}
                      className="w-full px-4 py-2.5 text-left text-xs text-white/70 hover:text-white hover:bg-white/5 transition-colors border-b border-white/5"
                    >
                      Clear Read Notifications
                    </button>
                    <button
                      onClick={() => handleClearAll("all")}
                      className="w-full px-4 py-2.5 text-left text-xs text-red-400 hover:text-red-300 hover:bg-white/5 transition-colors"
                    >
                      Clear EVERYTHING Completely
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
          <button
            type="button"
            onClick={onRefresh}
            disabled={loading}
            className="p-2 text-type-secondary hover:text-white bg-white/5 rounded-lg transition-all disabled:opacity-50"
            title="Refresh"
          >
            <Icon
              icon={Icons.RELOAD}
              className={loading ? "animate-spin" : ""}
            />
          </button>
          <button
            type="button"
            onClick={onOpenSettings}
            className="p-2 text-type-secondary hover:text-white bg-white/5 rounded-lg transition-all"
            title="Settings"
          >
            <Icon icon={Icons.SETTINGS} />
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar"
      >
        {/* Loading state */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-12 h-12 border-2 border-type-link/30 border-t-type-link rounded-full animate-spin" />
            <span className="text-sm font-medium text-type-secondary animate-pulse">
              Syncing notifications...
            </span>
          </div>
        )}

        {/* Error state */}
        {error && !loading && (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-center px-6">
            <div className="p-4 bg-red-500/10 rounded-full">
              <Icon icon={Icons.WARNING} className="text-3xl text-red-500" />
            </div>
            <h3 className="text-white font-bold">Failed to connect</h3>
            <p className="text-sm text-type-secondary">{error}</p>
            <button
              type="button"
              onClick={onRefresh}
              className="mt-2 text-sm text-type-link hover:underline"
            >
              Try again
            </button>
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && allNotifications.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
            <div className="p-6 bg-white/5 rounded-full">
              <Icon icon={Icons.BELL} className="text-4xl text-white/20" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">All caught up!</h3>
              <p className="text-sm text-type-secondary max-w-[200px] mx-auto">
                No new notifications at the moment.
              </p>
            </div>
          </div>
        )}

        {/* Notifications list */}
        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {!loading &&
              !error &&
              allNotifications.map((notification) => {
                const isRead = readNotifications.has(notification.guid);
                return (
                  <motion.div
                    key={notification.guid}
                    layout
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    whileHover={!isRead ? { 
                      scale: 1.02, 
                      y: -2,
                    } : { scale: 1.01 }}
                    exit={{ opacity: 0, x: 50, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className={`
                    group relative flex gap-4 p-3 rounded-2xl border transition-all duration-300 cursor-default overflow-hidden
                    ${
                      isRead
                        ? "bg-white/[0.02] border-white/5 opacity-60 grayscale-[0.5]"
                        : "bg-white/[0.05] border-white/10 hover:border-orange-500/50 hover:shadow-[0_0_30px_-5px_rgba(249,115,22,0.3)] shadow-lg shadow-black/20"
                    }
                  `}
                  >
                    {/* Background Glow */}
                    {!isRead && (
                      <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    )}
                    {/* Dismiss Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteNotification(
                          notification.guid,
                          notification.mediaId,
                        );
                      }}
                      className="absolute top-2 right-2 p-1.5 opacity-0 group-hover:opacity-100 text-white/20 hover:text-red-500 transition-all z-20"
                      title="Dismiss"
                    >
                      <Icon icon={Icons.X} className="text-sm" />
                    </button>

                    <div
                      className="flex-1 flex gap-4 cursor-pointer"
                      onClick={() => openNotificationDetail(notification)}
                    >
                      {/* Unread dot */}
                      {!isRead && (
                        <div className="absolute top-3 left-3 w-1.5 h-1.5 bg-type-link rounded-full z-10 shadow-[0_0_8px_rgba(59,130,246,0.8)]" />
                      )}

                      {/* Poster/Image */}
                      <div className={`relative flex-shrink-0 rounded-xl overflow-hidden bg-white/5 border border-white/10 ${
                        ["trending", "awaited"].includes(notification.category.toLowerCase())
                          ? "w-24 self-stretch min-h-[140px]"
                          : "w-20 h-28"
                      }`}>
                        {notification.posterUrl ? (
                          <img
                            src={notification.posterUrl}
                            alt=""
                            className={`w-full h-full transition-transform duration-500 group-hover:scale-110 ${
                              notification.posterUrl ===
                                "/nexus update logo.png" ||
                              notification.source === "NEXUS Core"
                                ? "object-contain bg-black/40 p-1"
                                : "object-cover"
                            }`}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-white/10">
                            <Icon
                              icon={
                                notification.type === "movie"
                                  ? Icons.FILM
                                  : Icons.BELL
                              }
                              className="text-2xl"
                            />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60" />
                      </div>

                      {/* Details */}
                      <div className="flex-1 min-w-0 flex flex-col justify-between py-1">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <div className="flex items-center gap-3 px-0 py-0.5 backdrop-blur-sm">
                              <span className="text-[10px] font-bold text-white uppercase tracking-wider">
                                {getCategoryLabel(notification.category)}
                              </span>
                              
                              {/* Glowing Dot Section */}
                              {notification.category.toLowerCase() === "announcement" && <GlowingDot color="orange" />}
                              {notification.category.toLowerCase() === "update" && <GlowingDot color="orange" />}
                              {notification.category.toLowerCase() === "trending" && (
                                <GlowingDot color="cyan" />
                              )}
                              {notification.category.toLowerCase() === "awaited" && <GlowingDot color="yellow" />}
                              {/* Fallback dot for other categories to keep consistency */}
                              {!["announcement", "update", "trending", "awaited"].includes(notification.category.toLowerCase()) && (
                                <GlowingDot color="orange" />
                              )}
                            </div>
                            <span className="text-[10px] text-white/40 font-medium truncate">
                              {notification.source}
                            </span>
                          </div>
                          <h3
                            className={`text-sm font-bold leading-tight line-clamp-2 mb-1 ${
                              isRead ? "text-white/60" : "text-white"
                            }`}
                          >
                            {notification.title}
                          </h3>
                          <div
                            className="text-xs text-type-secondary line-clamp-2 opacity-80"
                            dangerouslySetInnerHTML={{
                              __html: formatNotificationDescription(
                                notification.description,
                              ),
                            }}
                          />
                        </div>

                        {notification.mediaId && (
                          <div className="mt-2 flex gap-2">
                            {notification.category.toLowerCase() === "awaited" ? (
                              <button
                                type="button"
                                onClick={(e) => toggleBookmark(e, notification)}
                                className={`relative z-50 px-4 py-1.5 text-[10px] font-bold rounded-lg transition-all flex items-center gap-1.5 border ${
                                  bookmarks[notification.mediaId || notification.guid] 
                                    ? "bg-type-link/20 text-type-link border-type-link/50 hover:bg-type-link/30" 
                                    : "bg-white/10 text-white hover:bg-white/20 border-white/10"
                                }`}
                              >
                                {bookmarks[notification.mediaId || notification.guid] ? (
                                  <>
                                    <Icon icon={Icons.BOOKMARK} className="text-[10px]" />
                                    BOOKMARKED
                                  </>
                                ) : (
                                  <>
                                    <Icon icon={Icons.BOOKMARK_OUTLINE} className="text-[10px]" />
                                    ADD TO BOOKMARK
                                  </>
                                )}
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  e.preventDefault();
                                  if (!notification.mediaId || !notification.mediaType) return;
                                  navigate(`/media/tmdb-${notification.mediaType}-${notification.mediaId}`);
                                }}
                                className="relative z-50 px-4 py-1.5 bg-type-link text-white text-[10px] font-bold rounded-lg hover:bg-type-link/80 transition-all flex items-center gap-1.5 shadow-lg shadow-type-link/20"
                              >
                                <Icon icon={Icons.PLAY} className="text-[8px]" />
                                WATCH NOW
                              </button>
                            )}
                          </div>
                        )}

                        <div className="flex items-center mt-2">
                          <span className="text-[10px] text-white/30 font-medium">
                            {formatDate(notification.pubDate)}
                          </span>
                        </div>
                      </div>
                    </div>

                      {/* Repositioned VIEW button */}
                      <div className="absolute bottom-4 right-4 flex items-center gap-1 text-[10px] text-type-link font-bold opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 z-10 pointer-events-none">
                        VIEW
                        <Icon
                          icon={Icons.CHEVRON_RIGHT}
                          className="text-[8px]"
                        />
                      </div>
                    </motion.div>
                );
              })}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
