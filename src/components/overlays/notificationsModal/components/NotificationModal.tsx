import { useCallback, useEffect, useRef, useState } from "react";
import slugify from "slugify";

import {
  getMediaPoster,
  getTrendingMovies,
  getUpcomingMovies,
} from "@/backend/metadata/tmdb";
import { Icon, Icons } from "@/components/Icon";

import { DetailView } from "./DetailView";
import { ListView } from "./ListView";
import { SettingsView } from "./SettingsView";
import { FancyModal } from "../../Modal";
import { ModalView, NotificationItem, NotificationModalProps } from "../types";
import {
  fetchRssFeed,
  formatDate,
  getAllFeeds,
  getCategoryColor,
  getCategoryLabel,
  getSourceName,
} from "../utils";

export function NotificationModal({ id }: NotificationModalProps) {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [readNotifications, setReadNotifications] = useState<Set<string>>(
    new Set(),
  );
  const [currentView, setCurrentView] = useState<ModalView>("list");
  const [selectedNotification, setSelectedNotification] =
    useState<NotificationItem | null>(null);
  const [isShiftHeld, setIsShiftHeld] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Settings state
  const [autoReadDays, setAutoReadDays] = useState<number>(14);
  const [customFeeds, setCustomFeeds] = useState<string[]>([]);

  // Load read notifications and settings from localStorage
  useEffect(() => {
    const savedRead = localStorage.getItem("read-notifications");
    if (savedRead) {
      try {
        const readArray = JSON.parse(savedRead);
        setReadNotifications(new Set(readArray));
      } catch (e) {
        console.error("Failed to parse read notifications:", e);
      }
    }

    // Load settings
    const savedAutoReadDays = localStorage.getItem(
      "notification-auto-read-days",
    );
    if (savedAutoReadDays) {
      try {
        setAutoReadDays(parseInt(savedAutoReadDays, 10));
      } catch (e) {
        console.error("Failed to parse auto read days:", e);
      }
    }

    const savedCustomFeeds = localStorage.getItem("notification-custom-feeds");
    if (savedCustomFeeds) {
      try {
        setCustomFeeds(JSON.parse(savedCustomFeeds));
      } catch (e) {
        console.error("Failed to parse custom feeds:", e);
      }
    }
  }, []);

  // Handle shift key for mark all as unread button
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Shift") {
        setIsShiftHeld(true);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === "Shift") {
        setIsShiftHeld(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  // Fetch RSS feed and TMDB data
  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const allNotifications: NotificationItem[] = [];
      const autoReadGuids: string[] = [];

      // 1. ADD SYSTEM NOTIFICATIONS
      const systemNotifications: NotificationItem[] = [
        {
          guid: "welcome-nexus-2024",
          title: "Welcome to NEXUS 2.0!",
          link: "/discover",
          description:
            "Explore the ultimate streaming experience with our new Aether-inspired interface. No setup required, just hit play and enjoy your favorite content in stunning quality.",
          pubDate: new Date().toISOString(),
          category: "Update",
          source: "NEXUS Core",
          type: "system",
        },
        {
          guid: "nexus-extension-guide",
          title: "Get Maximum Performance with NEXUS Extension",
          link: "https://github.com/ZETIC7Z/NEXUS",
          description:
            "Want more episodic access for TV Series and Anime? Install the NEXUS Browser Extension to unlock premium direct embed sources effortlessly.",
          pubDate: new Date().toISOString(),
          category: "Enhancement",
          source: "NEXUS Lab",
          type: "system",
        },
      ];
      allNotifications.push(...systemNotifications);

      // 2. FETCH TMDB DATA (Upcoming & Trending)
      try {
        const [upcoming, trending] = await Promise.all([
          getUpcomingMovies(),
          getTrendingMovies(),
        ]);

        const tmdbNotifications: NotificationItem[] = [
          ...upcoming.slice(0, 5).map((m) => ({
            guid: `tmdb-upcoming-${m.id}`,
            title: m.title,
            // Navigate to media page directly
            link: `/media/tmdb-movie-${m.id}-${slugify(m.title, { lower: true, strict: true })}`,
            description:
              m.overview || "An exciting upcoming movie coming soon to NEXUS.",
            pubDate: m.release_date || new Date().toISOString(),
            category: "Upcoming",
            source: "Trending Now",
            posterUrl: getMediaPoster(m.poster_path),
            releaseDate: m.release_date,
            mediaId: m.id.toString(),
            type: "movie" as const,
          })),
          ...trending.slice(0, 5).map((m) => ({
            guid: `tmdb-trending-${m.id}`,
            title: `Trending: ${m.title}`,
            link: `/media/tmdb-movie-${m.id}-${slugify(m.title, { lower: true, strict: true })}`,
            description:
              m.overview || "Now trending on NEXUS and popular globally.",
            pubDate: new Date().toISOString(),
            category: "Popular",
            source: "Netflix Trend",
            posterUrl: getMediaPoster(m.poster_path),
            mediaId: m.id.toString(),
            type: "movie" as const,
          })),
        ];
        allNotifications.push(...tmdbNotifications);
      } catch (tmdbError) {
        console.error("Failed to fetch TMDB notifications:", tmdbError);
      }

      // 3. FETCH RSS FEEDS (Existing logic)
      const autoReadDate = new Date();
      autoReadDate.setDate(autoReadDate.getDate() - autoReadDays);

      const feeds = getAllFeeds();

      for (const feedUrl of feeds) {
        if (!feedUrl.trim()) continue;

        try {
          const xmlText = await fetchRssFeed(feedUrl);

          if (
            xmlText &&
            (xmlText.includes("<rss") || xmlText.includes("<feed"))
          ) {
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(xmlText, "text/xml");

            const parserError = xmlDoc.querySelector("parsererror");
            if (!parserError && xmlDoc && xmlDoc.documentElement) {
              const items = xmlDoc.querySelectorAll("item, entry");
              if (items && items.length > 0) {
                items.forEach((item) => {
                  try {
                    const guid =
                      item.querySelector("guid")?.textContent ||
                      item.querySelector("id")?.textContent ||
                      "";
                    const title =
                      item.querySelector("title")?.textContent || "";
                    const link =
                      item.querySelector("link")?.textContent ||
                      item.querySelector("link")?.getAttribute("href") ||
                      "";
                    const description =
                      item.querySelector("description")?.textContent ||
                      item.querySelector("content")?.textContent ||
                      item.querySelector("summary")?.textContent ||
                      "";
                    const pubDate =
                      item.querySelector("pubDate")?.textContent ||
                      item.querySelector("published")?.textContent ||
                      item.querySelector("updated")?.textContent ||
                      "";
                    const category =
                      item.querySelector("category")?.textContent || "";

                    const itemGuid = guid || link;
                    if (!itemGuid || !title) return;

                    const notificationDate = new Date(pubDate);

                    allNotifications.push({
                      guid: itemGuid,
                      title,
                      link,
                      description,
                      pubDate,
                      category,
                      source: getSourceName(feedUrl),
                      type: "rss" as const,
                    });

                    if (notificationDate <= autoReadDate) {
                      autoReadGuids.push(itemGuid);
                    }
                  } catch (itemError) {}
                });
              }
            }
          }
        } catch (customFeedError) {}
      }

      // Sort notifications by date (newest first)
      allNotifications.sort(
        (a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime(),
      );

      setNotifications(allNotifications);

      if (autoReadGuids.length > 0) {
        setReadNotifications((prevReadSet) => {
          const newReadSet = new Set(prevReadSet);
          autoReadGuids.forEach((guid) => newReadSet.add(guid));
          localStorage.setItem(
            "read-notifications",
            JSON.stringify(Array.from(newReadSet)),
          );
          return newReadSet;
        });
      }
    } catch (err) {
      console.error("Fetch error:", err);
      setError(
        err instanceof Error ? err.message : "Failed to load notifications",
      );
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }, [autoReadDays]);

  // Initial fetch
  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Refresh function
  const handleRefresh = () => {
    fetchNotifications();
  };

  // Save read notifications to cookie
  const markAsRead = (guid: string) => {
    const newReadSet = new Set(readNotifications);
    newReadSet.add(guid);
    setReadNotifications(newReadSet);

    // Save to localStorage
    localStorage.setItem(
      "read-notifications",
      JSON.stringify(Array.from(newReadSet)),
    );
  };

  // Mark all as read
  const markAllAsRead = () => {
    const allGuids = notifications.map((n) => n.guid);
    const newReadSet = new Set(allGuids);
    setReadNotifications(newReadSet);
    localStorage.setItem(
      "read-notifications",
      JSON.stringify(Array.from(newReadSet)),
    );
  };

  // Mark all as unread
  const markAllAsUnread = () => {
    setReadNotifications(new Set());
    localStorage.setItem("read-notifications", JSON.stringify([]));
  };

  // Navigate to detail view
  const openNotificationDetail = (notification: NotificationItem) => {
    setSelectedNotification(notification);
    setCurrentView("detail");
    markAsRead(notification.guid);
  };

  // Navigate back to list
  const goBackToList = () => {
    setCurrentView("list");
    setSelectedNotification(null);
  };

  // Settings functions
  const openSettings = () => {
    setCurrentView("settings");
  };

  const closeSettings = () => {
    setCurrentView("list");
  };

  // Save settings functions
  const saveAutoReadDays = (days: number) => {
    setAutoReadDays(days);
    localStorage.setItem("notification-auto-read-days", days.toString());
  };

  const saveCustomFeeds = (feeds: string[]) => {
    setCustomFeeds(feeds);
    localStorage.setItem("notification-custom-feeds", JSON.stringify(feeds));
  };

  // Scroll to last read notification
  useEffect(() => {
    if (
      notifications.length > 0 &&
      containerRef.current &&
      currentView === "list"
    ) {
      const lastReadIndex = notifications.findIndex(
        (n) => !readNotifications.has(n.guid),
      );
      if (lastReadIndex > 0) {
        const element = containerRef.current.children[
          lastReadIndex
        ] as HTMLElement;
        if (element) {
          // Use scrollTop instead of scrollIntoView to avoid scrolling the modal container
          const container = containerRef.current;
          const elementTop = element.offsetTop;
          const containerHeight = container.clientHeight;
          const elementHeight = element.clientHeight;

          // Calculate the scroll position to center the element
          const scrollTop =
            elementTop - containerHeight / 2 + elementHeight / 2;

          container.scrollTo({
            top: Math.max(0, scrollTop),
            behavior: "smooth",
          });
        }
      }
    }
  }, [notifications, readNotifications, currentView]);

  const unreadCount = notifications.filter(
    (n) => !readNotifications.has(n.guid),
  ).length;

  // Don't render if there's a critical error
  if (error && !loading) {
    return (
      <FancyModal id={id} title="Notifications" size="lg">
        <div className="flex flex-col items-center justify-center py-12 gap-2">
          <Icon icon={Icons.WARNING} className="text-[2rem] text-red-400" />
          <p className="text-red-400 mb-2">Failed to load notifications</p>
          <p className="text-sm text-type-secondary">{error}</p>
          <button
            type="button"
            onClick={handleRefresh}
            className="mt-4 text-sm text-type-link hover:text-type-linkHover transition-colors"
          >
            Try again
          </button>
        </div>
      </FancyModal>
    );
  }

  return (
    <FancyModal
      id={id}
      title={
        currentView === "list"
          ? "Notifications"
          : currentView === "detail" && selectedNotification
            ? selectedNotification.title
            : currentView === "settings"
              ? "Settings"
              : "Notifications"
      }
      size="lg"
    >
      {currentView === "list" ? (
        <ListView
          notifications={notifications}
          readNotifications={readNotifications}
          unreadCount={unreadCount}
          loading={loading}
          error={error}
          containerRef={containerRef}
          markAllAsRead={markAllAsRead}
          markAllAsUnread={markAllAsUnread}
          isShiftHeld={isShiftHeld}
          onRefresh={handleRefresh}
          onOpenSettings={openSettings}
          openNotificationDetail={openNotificationDetail}
          getCategoryColor={getCategoryColor}
          getCategoryLabel={getCategoryLabel}
          formatDate={formatDate}
        />
      ) : currentView === "detail" && selectedNotification ? (
        <DetailView
          selectedNotification={selectedNotification}
          goBackToList={goBackToList}
          getCategoryColor={getCategoryColor}
          getCategoryLabel={getCategoryLabel}
          formatDate={formatDate}
          isRead={readNotifications.has(selectedNotification.guid)}
          toggleReadStatus={() => {
            if (readNotifications.has(selectedNotification.guid)) {
              // Mark as unread
              const newReadSet = new Set(readNotifications);
              newReadSet.delete(selectedNotification.guid);
              setReadNotifications(newReadSet);
              localStorage.setItem(
                "read-notifications",
                JSON.stringify(Array.from(newReadSet)),
              );
            } else {
              // Mark as read
              markAsRead(selectedNotification.guid);
            }
          }}
        />
      ) : currentView === "settings" ? (
        <SettingsView
          autoReadDays={autoReadDays}
          setAutoReadDays={saveAutoReadDays}
          customFeeds={customFeeds}
          setCustomFeeds={saveCustomFeeds}
          markAllAsUnread={markAllAsUnread}
          onClose={closeSettings}
        />
      ) : null}
    </FancyModal>
  );
}
