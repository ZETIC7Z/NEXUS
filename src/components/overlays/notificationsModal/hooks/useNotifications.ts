import { useEffect, useState } from "react";

import { getTrendingMovies, getUpcomingMovies } from "@/backend/metadata/tmdb";
import { useOverlayStack } from "@/stores/interface/overlayStack";

import { NotificationItem } from "../types";
import { fetchRssFeed, getAllFeeds, getSourceName } from "../utils";

// Hook to manage notifications
export function useNotifications() {
  const { showModal, hideModal, isModalVisible } = useOverlayStack();
  const modalId = "notifications";
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  // Fetch notifications for badge count
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const allNotifications: NotificationItem[] = [];

        // 1. ADD SYSTEM NOTIFICATIONS
        allNotifications.push({
          guid: "system-welcome-nexus",
          title: "Welcome to NEXUS!",
          description: "Enjoy zero setup movie playback on all your devices.",
          pubDate: new Date().toISOString(),
          category: "Announcement",
          source: "NEXUS System",
          type: "system",
        });

        // 2. FETCH TMDB DATA
        try {
          const [trending, upcoming] = await Promise.all([
            getTrendingMovies(),
            getUpcomingMovies(),
          ]);

          trending.slice(0, 5).forEach((movie: any) => {
            allNotifications.push({
              guid: `tmdb-trending-${movie.id}`,
              title: `Trending: ${movie.title}`,
              description: movie.overview,
              pubDate: new Date().toISOString(),
              category: "Trending",
              source: "TMDB",
              posterUrl: `https://image.tmdb.org/t/p/w500${movie.poster_path}`,
              type: "movie",
              mediaId: movie.id.toString(),
              mediaType: "movie",
            });
          });

          upcoming.slice(0, 5).forEach((movie: any) => {
            allNotifications.push({
              guid: `tmdb-upcoming-${movie.id}`,
              title: `Upcoming: ${movie.title}`,
              description: movie.overview,
              pubDate: movie.release_date,
              category: "Upcoming",
              source: "TMDB",
              posterUrl: `https://image.tmdb.org/t/p/w500${movie.poster_path}`,
              type: "movie",
              mediaId: movie.id.toString(),
              mediaType: "movie",
              releaseDate: movie.release_date,
            });
          });
        } catch (tmdbError) {
          console.error(
            "Failed to fetch TMDB notifications for badge:",
            tmdbError,
          );
        }

        // 3. FETCH RSS FEEDS
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

                      allNotifications.push({
                        guid: itemGuid,
                        title,
                        link,
                        description,
                        pubDate,
                        category,
                        source: getSourceName(feedUrl),
                        type: "rss",
                      });
                    } catch (itemError) {
                      // skip
                    }
                  });
                }
              }
            }
          } catch (rssError) {
            // skip
          }
        }

        setNotifications(allNotifications);
      } catch (err) {
        // fail silently for badge
      }
    };

    fetchNotifications();
  }, []);

  const openNotifications = () => {
    showModal(modalId);
  };

  const closeNotifications = () => {
    hideModal(modalId);
  };

  const isNotificationsOpen = () => {
    return isModalVisible(modalId);
  };

  // Get unread count for badge
  const getUnreadCount = () => {
    try {
      const savedRead = localStorage.getItem("read-notifications");
      if (!savedRead) {
        const count = notifications.length;
        return count > 99 ? "99+" : count;
      }

      const readArray = JSON.parse(savedRead);
      const readSet = new Set(readArray);

      // Get the actual count from the notifications state
      const count = notifications.filter(
        (n: NotificationItem) => !readSet.has(n.guid),
      ).length;

      return count > 99 ? "99+" : count;
    } catch {
      return 0;
    }
  };

  return {
    openNotifications,
    closeNotifications,
    isNotificationsOpen,
    getUnreadCount,
  };
}
