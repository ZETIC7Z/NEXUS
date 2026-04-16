import { useCallback, useEffect, useRef, useState } from "react";

import {
  TMDBContentTypes,
  getDiscoverPH,
  getMediaDetails,
  getPersonCombinedCredits,
  getTrendingMovies,
  getTrendingPeople,
  getTrendingTV,
  getUpcomingLongTerm,
  getUpcomingMovies,
  getUpcomingTV,
} from "@/backend/metadata/tmdb";
import { base64ToBuffer, decryptData } from "@/backend/accounts/crypto";
import { useAuthStore } from "@/stores/auth";
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

        // 1. AUTH & SIGNUP DATE INITIALIZATION
        const auth = useAuthStore.getState();
        let nickname = "Friend";

        if (auth.account && auth.account.deviceName) {
          try {
            nickname = decryptData(
              auth.account.deviceName,
              base64ToBuffer(auth.account.seed),
            );
          } catch (e) {
            nickname = auth.account.nickname || "Friend";
          }
        }
        let signupDate = auth.account?.signupDate;

        if (auth.account && !signupDate) {
          signupDate = new Date().toISOString();
          auth.updateAccount({ signupDate });
        }

        const signupTime = signupDate ? new Date(signupDate).getTime() : 0;

        // 2. ADD SYSTEM NOTIFICATIONS
        allNotifications.push({
          guid: "nexus-v2-1-patch",
          title: "NEXUS v2.1 PATCH UPDATE",
          description:
            "Integrated a powerful notification engine for real-time movie and series updates. Refined the mobile onboarding experience for seamless device installation.",
          pubDate: new Date().toISOString(),
          category: "Update",
          source: "NEXUS Core",
          type: "system",
          posterUrl: "/nexus update logo.png",
        });

        allNotifications.push({
          guid: "system-welcome-personalized",
          title: `Welcome back, ${nickname}!`,
          description:
            "We're glad to have you back on NEXUS. Your personalized entertainment dashboard is ready.",
          pubDate: signupDate || new Date().toISOString(),
          category: "Announcement",
          source: "NEXUS System",
          type: "system",
          posterUrl: "/nexus update logo.png",
        });

        // 3. SCHEDULED NOTIFICATIONS (6AM, 1PM, 9PM)
        const now = new Date();
        const currentHour = now.getHours();

        // 6AM SLOT: Upcoming & New
        if (currentHour >= 6) {
          try {
            const [upcomingMovies, trendingMovies] = await Promise.all([
              getUpcomingMovies(),
              getTrendingMovies(),
            ]);
            const movie = upcomingMovies[0] || trendingMovies[0];
            if (movie) {
              allNotifications.push({
                guid: `scheduled-6am-${movie.id}`,
                title: `🌅 Morning Buzz: ${movie.title}`,
                description: `Start your day with the latest trending release: ${movie.overview}`,
                pubDate: new Date(now.setHours(6, 0, 0, 0)).toISOString(),
                category: "Morning Pick",
                source: "NEXUS Scheduler",
                posterUrl: `https://image.tmdb.org/t/p/w500${movie.poster_path}`,
                type: "movie",
                mediaId: movie.id.toString(),
                mediaType: "movie",
              });
            }
          } catch (e) {}
        }

        // 1PM SLOT: Actor Highlight
        if (currentHour >= 13) {
          try {
            const people = await getTrendingPeople();
            const person = people[Math.floor(Math.random() * Math.min(5, people.length))];
            if (person) {
              const credits = await getPersonCombinedCredits(person.id.toString());
              const project = credits[0];
              if (project) {
                allNotifications.push({
                  guid: `scheduled-1pm-${person.id}`,
                  title: `🎭 Star Spot: ${person.name}`,
                  description: `${person.name} is trending! Check out their project: ${
                    (project as any).title || (project as any).name || "New Release"
                  }`,
                  pubDate: new Date(now.setHours(13, 0, 0, 0)).toISOString(),
                  category: "Actor Highlight",
                  source: "NEXUS Scheduler",
                  posterUrl: `https://image.tmdb.org/t/p/w500${person.profile_path || project.poster_path}`,
                  type: project.media_type === TMDBContentTypes.TV ? "show" : "movie",
                  mediaId: project.id.toString(),
                  mediaType: project.media_type === TMDBContentTypes.TV ? "show" : "movie",
                });
              }
            }
          } catch (e) {}
        }

        // 9PM SLOT: PH Content
        if (currentHour >= 21) {
          try {
            const phContent = await getDiscoverPH();
            const movie = phContent[0];
            if (movie) {
                allNotifications.push({
                  guid: `scheduled-9pm-${movie.id}`,
                  title: `🇵🇭 Local Hits: ${
                    (movie as any).title || (movie as any).name || "New Release"
                  }`,
                  description: `Trending in the Philippines: ${movie.overview}`,
                  pubDate: new Date(now.setHours(21, 0, 0, 0)).toISOString(),
                  category: "PH Trending",
                  source: "NEXUS Scheduler",
                  posterUrl: `https://image.tmdb.org/t/p/w500${movie.poster_path}`,
                  type: (movie as any).title ? "movie" : "show",
                  mediaId: movie.id.toString(),
                  mediaType: (movie as any).title ? "movie" : "show",
                });
            }
          } catch (e) {}
        }

        // 2. FETCH TMDB DATA
        try {
          const [trendingMovies, upcomingLongTerm, trendingTV] =
            await Promise.all([
              getTrendingMovies(),
              getUpcomingLongTerm(),
              getTrendingTV(),
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

          // Long Term Upcoming Items (Up to Dec 2026)
          upcomingLongTerm.slice(0, 10).forEach((media: any) => {
            const isTV = media.media_type === TMDBContentTypes.TV;
            allNotifications.push({
              guid: `tmdb-longupcoming-${media.id}`,
              title: `📅 Upcoming: ${media.title || media.name}`,
              description: media.overview,
              pubDate:
                media.release_date ||
                media.first_air_date ||
                new Date().toISOString(),
              category: "Awaited",
              source: "TMDB Discovery",
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

        // 4. FILTER BY BLACKLIST, DISMISSED IDs, AND SIGNUP DATE (Strict)
        const savedDismissed = localStorage.getItem("dismissed-notifications");
        const dismissedSet = new Set(
          savedDismissed ? JSON.parse(savedDismissed) : [],
        );

        const savedBlacklist = localStorage.getItem("blacklisted-media-ids");
        const blacklistSet = new Set(
          savedBlacklist ? JSON.parse(savedBlacklist) : [],
        );

        const filteredNotifications = allNotifications.filter((n) => {
          // 1. Blacklist/Dismiss filters
          if (dismissedSet.has(n.guid)) return false;
          if (n.mediaId && blacklistSet.has(n.mediaId)) return false;

          // 2. Strict Date Filter
          const pubTime = new Date(n.pubDate).getTime();
          if (pubTime < signupTime) return false;

          return true;
        });

        // 5. FORCE NEXUS LOGO FOR SYSTEM ITEMS
        const brandedNotifications = filteredNotifications.map((n) => {
          if (
            (n.type === "system" || n.source === "NEXUS Core") &&
            (!n.posterUrl || n.posterUrl.includes("nexus update logo.png"))
          ) {
            return { ...n, posterUrl: "/nexus update logo.png" };
          }
          return n;
        });

        setNotifications(brandedNotifications);
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

  // Manual Dismissal
  const deleteNotification = (guid: string, mediaId?: string) => {
    try {
      // Add to dismissed GUIDs
      const savedDismissed = localStorage.getItem("dismissed-notifications");
      const dismissedArray = savedDismissed ? JSON.parse(savedDismissed) : [];
      if (!dismissedArray.includes(guid)) {
        dismissedArray.push(guid);
        localStorage.setItem(
          "dismissed-notifications",
          JSON.stringify(dismissedArray),
        );
      }

      // If it's a media item, blacklist the mediaId so it never returns
      if (mediaId) {
        const savedBlacklist = localStorage.getItem("blacklisted-media-ids");
        const blacklistArray = savedBlacklist ? JSON.parse(savedBlacklist) : [];
        if (!blacklistArray.includes(mediaId)) {
          blacklistArray.push(mediaId);
          localStorage.setItem(
            "blacklisted-media-ids",
            JSON.stringify(blacklistArray),
          );
        }
      }

      // Update local state for immediate response
      setNotifications((prev) => {
        const next = prev.filter((n) => n.guid.trim() !== guid.trim());
        console.log(`[Persistence] Dismissed ${guid}. Remaining: ${next.length}`);
        return next;
      });
    } catch (e) {
      console.error("Failed to delete notification:", e);
    }
  };

  // Unified Clear Logic
  const clearNotifications = (mode: "read" | "all") => {
    try {
      const savedRead = localStorage.getItem("read-notifications");
      const readArray = savedRead ? JSON.parse(savedRead) : [];
      const readSet = new Set(readArray);

      const savedDismissed = localStorage.getItem("dismissed-notifications");
      const dismissedArray = savedDismissed ? JSON.parse(savedDismissed) : [];

      const savedBlacklist = localStorage.getItem("blacklisted-media-ids");
      const blacklistArray = savedBlacklist ? JSON.parse(savedBlacklist) : [];

      const notificationsToClear = notifications.filter((n) => {
        if (mode === "read") return readSet.has(n.guid);
        return true;
      });

      notificationsToClear.forEach((n) => {
        if (!dismissedArray.includes(n.guid)) dismissedArray.push(n.guid);
        if (n.mediaId && !blacklistArray.includes(n.mediaId)) {
          blacklistArray.push(n.mediaId);
        }
      });

      localStorage.setItem(
        "dismissed-notifications",
        JSON.stringify(dismissedArray),
      );
      localStorage.setItem(
        "blacklisted-media-ids",
        JSON.stringify(blacklistArray),
      );

      // Local state update
      const remainingGuids = new Set(notificationsToClear.map((n) => n.guid));
      setNotifications((prev) =>
        prev.filter((n) => !remainingGuids.has(n.guid)),
      );
    } catch {
      // skip
    }
  };

  // Get unread count for badge
  const getUnreadCount = () => {
    try {
      const savedRead = localStorage.getItem("read-notifications");
      const readArray = savedRead ? JSON.parse(savedRead) : [];
      const readSet = new Set(readArray);

      // Get count excluding read state
      const count = notifications.filter((n) => !readSet.has(n.guid)).length;

      return count > 99 ? "99+" : count;
    } catch {
      return 0;
    }
  };

  const markAllAsRead = () => {
    try {
      const gids = notifications.map((n) => n.guid);
      localStorage.setItem("read-notifications", JSON.stringify(gids));
      // Sync local state read status here if needed
    } catch {
      // skip
    }
  };

  return {
    notifications,
    openNotifications,
    closeNotifications,
    isNotificationsOpen,
    getUnreadCount,
    deleteNotification,
    clearNotifications,
    markAllAsRead,
  };
}
