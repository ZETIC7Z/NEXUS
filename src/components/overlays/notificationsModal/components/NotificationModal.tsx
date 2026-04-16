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
import { useNotifications } from "../hooks/useNotifications";
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
  const {
    notifications,
    deleteNotification,
    clearNotifications,
    markAllAsRead,
  } = useNotifications();

  const [loading] = useState(false); // Hook handles loading internally now simplified
  const [error] = useState<string | null>(null);
  const [readNotifications, setReadNotifications] = useState<Set<string>>(new Set());
  const [currentView, setCurrentView] = useState<ModalView>("list");
  const [selectedNotification, setSelectedNotification] = useState<NotificationItem | null>(null);
  const [isShiftHeld, setIsShiftHeld] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Settings state (kept for UI compatibility)
  const [autoReadDays, setAutoReadDays] = useState<number>(14);
  const [customFeeds, setCustomFeeds] = useState<string[]>([]);

  // Sync read notifications from localStorage
  useEffect(() => {
    const savedRead = localStorage.getItem("read-notifications");
    if (savedRead) {
      try {
        setReadNotifications(new Set(JSON.parse(savedRead)));
      } catch {}
    }
  }, [notifications]);

  // Handle shift key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => { if (e.key === "Shift") setIsShiftHeld(true); };
    const handleKeyUp = (e: KeyboardEvent) => { if (e.key === "Shift") setIsShiftHeld(false); };
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  const markAsRead = (guid: string) => {
    const newReadSet = new Set(readNotifications);
    newReadSet.add(guid);
    setReadNotifications(newReadSet);
    localStorage.setItem("read-notifications", JSON.stringify(Array.from(newReadSet)));
  };

  const markAllAsUnread = () => {
    setReadNotifications(new Set());
    localStorage.setItem("read-notifications", JSON.stringify([]));
  };

  const openNotificationDetail = (notification: NotificationItem) => {
    setSelectedNotification(notification);
    setCurrentView("detail");
    markAsRead(notification.guid);
  };

  const goBackToList = () => {
    setCurrentView("list");
    setSelectedNotification(null);
  };

  const openSettings = () => setCurrentView("settings");
  const closeSettings = () => setCurrentView("list");

  const unreadCount = notifications.filter(n => !readNotifications.has(n.guid)).length;

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
          clearReadNotifications={() => clearNotifications("read")}
          isShiftHeld={isShiftHeld}
          onRefresh={() => {}} // Hook handles auto-refresh
          onOpenSettings={openSettings}
          openNotificationDetail={openNotificationDetail}
          getCategoryColor={getCategoryColor}
          getCategoryLabel={getCategoryLabel}
          formatDate={formatDate}
          deleteNotification={deleteNotification}
          clearNotifications={clearNotifications}
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
              const newReadSet = new Set(readNotifications);
              newReadSet.delete(selectedNotification.guid);
              setReadNotifications(newReadSet);
              localStorage.setItem("read-notifications", JSON.stringify(Array.from(newReadSet)));
            } else {
              markAsRead(selectedNotification.guid);
            }
          }}
        />
      ) : currentView === "settings" ? (
        <SettingsView
          autoReadDays={autoReadDays}
          setAutoReadDays={setAutoReadDays}
          customFeeds={customFeeds}
          setCustomFeeds={setCustomFeeds}
          markAllAsUnread={markAllAsUnread}
          onClose={closeSettings}
        />
      ) : null}
    </FancyModal>
  );
}
