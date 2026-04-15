import { Icon, Icons } from "@/components/Icon";

import { ListViewProps } from "../types";
import { formatNotificationDescription } from "../utils";

export function ListView({
  notifications,
  readNotifications,
  unreadCount,
  loading,
  error,
  containerRef,
  markAllAsRead,
  markAllAsUnread,
  isShiftHeld,
  onRefresh,
  onOpenSettings,
  openNotificationDetail,
  getCategoryColor,
  getCategoryLabel,
  formatDate,
}: ListViewProps) {
  // Handle clear all (marks all as read and potentially hides them if we add that logic later)
  const handleClearAll = () => {
    if (confirm("Are you sure you want to clear all notifications?")) {
      markAllAsRead();
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

        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={handleClearAll}
              className="px-3 py-1.5 text-xs font-semibold bg-white/5 hover:bg-white/10 text-white rounded-lg transition-all border border-white/5 flex items-center gap-2 group"
            >
              <Icon
                icon={Icons.X}
                className="text-[10px] group-hover:rotate-90 transition-transform"
              />
              Clear All
            </button>
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
        {!loading && !error && notifications.length === 0 && (
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
        {!loading &&
          !error &&
          notifications.map((notification) => {
            const isRead = readNotifications.has(notification.guid);
            return (
              <div
                key={notification.guid}
                onClick={() => openNotificationDetail(notification)}
                className={`
                group relative flex gap-4 p-3 rounded-2xl border transition-all duration-300 cursor-pointer overflow-hidden
                ${
                  isRead
                    ? "bg-white/[0.02] border-white/5 opacity-60 grayscale-[0.5]"
                    : "bg-white/[0.05] border-white/10 hover:border-type-link/50 hover:bg-white/[0.08] shadow-lg shadow-black/20"
                }
              `}
              >
                {/* Unread dot */}
                {!isRead && (
                  <div className="absolute top-3 left-3 w-1.5 h-1.5 bg-type-link rounded-full z-10 shadow-[0_0_8px_rgba(59,130,246,0.8)]" />
                )}

                {/* Poster/Image */}
                <div className="relative w-20 h-28 flex-shrink-0 rounded-xl overflow-hidden bg-white/5 border border-white/10">
                  {notification.posterUrl ? (
                    <img
                      src={notification.posterUrl}
                      alt=""
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
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
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider ${
                          getCategoryColor(notification.category) ||
                          "bg-white/10"
                        }`}
                      >
                        {getCategoryLabel(notification.category)}
                      </span>
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

                  <div className="flex items-center justify-between mt-2">
                    <span className="text-[10px] text-white/30 font-medium">
                      {formatDate(notification.pubDate)}
                    </span>
                    <div className="flex items-center gap-1 text-[10px] text-type-link font-bold opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all">
                      VIEW
                      <Icon icon={Icons.CHEVRON_RIGHT} className="text-[8px]" />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
}
