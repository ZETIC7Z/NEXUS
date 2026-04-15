import { useCallback, useEffect, useRef, useState } from "react";

import {
  TMDBContentTypes,
  getMediaDetails,
  getTrendingMovies,
  getTrendingTV,
  getUpcomingMovies,
  getUpcomingTV,
} from "@/backend/metadata/tmdb";
import { useBookmarkStore } from "@/stores/bookmarks";
import { useHistoryStore } from "@/stores/history";
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
          title: "Welcome to NEXUS site!",
          description:
            "Your ultimate entertainment hub is ready. Explore localized trending content and seamless streaming.",
          pubDate: new Date().toISOString(),
          category: "Announcement",
          source: "NEXUS System",
          type: "system",
          posterUrl: "/nexus update logo.png",
        });

        allNotifications.push({
          guid: "system-dev-intro",
          title: "Message from Zeticuz",
          description:
            "I've optimized Nexus for the best viewing experience. Check out our new 'Zetflix' integration!",
          pubDate: new Date().toISOString(),
          category: "Developer",
          source: "Zeticuz",
          type: "system",
          posterUrl: "/sam-photo.jpg",
        });

        // 2. FETCH TMDB DATA
        try {
          const [trendingMovies, upcomingMovies, trendingTV, upcomingTV] =
            await Promise.all([
              getTrendingMovies(),
              getUpcomingMovies(),
              getTrendingTV(),
              getUpcomingTV(),
            ]);

          // Mix Movie & TV Trends
          const combinedTrending = [
            ...trendingMovies.slice(0, 4),
            ...trendingTV.slice(0, 4),
          ];
          combinedTrending.forEach((media: any) => {
            const isTV = !!media.name;
            allNotifications.push({
              guid: `tmdb-trending-${media.id}`,
              title: `🔥 Trending: ${media.title || media.name}`,
              description: media.overview,
              pubDate: new Date().toISOString(),
              category: "Trending",
              source: "TMDB",
              posterUrl: `https://image.tmdb.org/t/p/w500${media.poster_path}`,
              type: isTV ? "show" : "movie",
              mediaId: media.id.toString(),
              mediaType: isTV ? "show" : "movie",
            });
          });

          // Upcoming Items
          const combinedUpcoming = [
            ...upcomingMovies.slice(0, 3),
            ...upcomingTV.slice(0, 3),
          ];
          combinedUpcoming.forEach((media: any) => {
            const isTV = !!media.name;
            allNotifications.push({
              guid: `tmdb-upcoming-${media.id}`,
              title: `📅 Upcoming: ${media.title || media.name}`,
              description: media.overview,
              pubDate:
                media.release_date ||
                media.first_air_date ||
                new Date().toISOString(),
              category: "Awaited",
              source: "TMDB",
              posterUrl: `https://image.tmdb.org/t/p/w500${media.poster_path}`,
              type: isTV ? "show" : "movie",
              mediaId: media.id.toString(),
              mediaType: isTV ? "show" : "movie",
            });
          });

          // 3. PERSONALIZED NOTIFICATIONS (Bookmarks/History)
          const bookmarks = useBookmarkStore.getState().bookmarks;
          const bookmarkedIds = Object.keys(bookmarks);

          // Check for new episodes of bookmarked shows
          for (const tmdbId of bookmarkedIds.slice(0, 5)) {
            const item = bookmarks[tmdbId];
            if (item.type === "show") {
              try {
                // We fetch simplified details to check latest status
                const details = await getMediaDetails(
                  tmdbId,
                  TMDBContentTypes.TV,
                  false,
                );
                const lastAirDate = details.last_air_date
                  ? new Date(details.last_air_date)
                  : null;
                const now = new Date();

                // If it aired in the last 7 days, notify
                if (
                  lastAirDate &&
                  now.getTime() - lastAirDate.getTime() <
                    7 * 24 * 60 * 60 * 1000
                ) {
                  allNotifications.push({
                    guid: `personal-update-${tmdbId}-${details.last_episode_to_air?.id}`,
                    title: `New Episode: ${item.title}`,
                    description: `Episode ${details.last_episode_to_air?.episode_number} of Season ${details.last_episode_to_air?.season_number} is now available!`,
                    pubDate: details.last_air_date,
                    category: "My Series",
                    source: "NEXUS Update",
                    posterUrl: item.poster || "/nexus update logo.png",
                    type: "show",
                    mediaId: tmdbId,
                    mediaType: "show",
                  });
                }
              } catch (e) {
                // skip
              }
            }
          }
        } catch (tmdbError) {
          console.error("Failed to fetch TMDB notifications:", tmdbError);
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

    // Initial fetch
    fetchNotifications();

    // Auto-update every 10 minutes
    const interval = setInterval(fetchNotifications, 10 * 60 * 1000);
    return () => clearInterval(interval);
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
