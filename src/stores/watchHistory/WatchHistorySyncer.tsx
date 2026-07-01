import { useEffect } from "react";

import {
  removeWatchHistory,
  setWatchHistory,
  watchHistoryUpdateItemToInput,
} from "@/backend/accounts/watchHistory";
import { useBackendUrl } from "@/hooks/auth/useBackendUrl";
import { AccountWithToken, useAuthStore } from "@/stores/auth";
import {
  WatchHistoryUpdateItem,
  useWatchHistoryStore,
} from "@/stores/watchHistory";

import { conf } from "@/setup/config";
import { useMultiBackendStore } from "@/stores/auth/multiBackendStore";

async function syncWatchHistory(
  items: WatchHistoryUpdateItem[],
  finish: (id: string) => void,
) {
  const { sessions, removeSession } = useMultiBackendStore.getState();
  const urls = conf().BACKEND_URLS;

  for (const item of items) {
    // complete it beforehand so it doesn't get handled while in progress
    finish(item.id);

    urls.forEach(async (url) => {
      const session = sessions[url];
      if (!session || !session.account) return;

      try {
        if (item.action === "delete") {
          await removeWatchHistory(
            url,
            session.account,
            item.tmdbId,
            item.episodeId,
            item.seasonId,
          );
        } else if (item.action === "add" || item.action === "update") {
          await setWatchHistory(
            url,
            session.account,
            watchHistoryUpdateItemToInput(item),
          );
        }
      } catch (err) {
        console.error(
          `Failed to sync watch history to ${url}: ${item.tmdbId} - ${item.action}`,
          err,
        );
        const anyErr: any = err;
        if (anyErr?.response?.status === 401 || anyErr?.response?.status === 403) {
          removeSession(url);
        }
      }
    });
  }
}

export function WatchHistorySyncer() {
  const clearUpdateQueue = useWatchHistoryStore((s) => s.clearUpdateQueue);
  const removeUpdateItem = useWatchHistoryStore((s) => s.removeUpdateItem);
  const url = useBackendUrl();

  // when booting for the first time, clear update queue.
  // we dont want to process persisted update items
  useEffect(() => {
    clearUpdateQueue();
  }, [clearUpdateQueue]);

  // Immediate sync when items are added or removed
  useEffect(() => {
    let syncTimeout: NodeJS.Timeout | null = null;

    const syncImmediately = async () => {
      if (!url) return;
      const state = useWatchHistoryStore.getState();
      const user = useAuthStore.getState();
      // Only sync if there are items in the queue
      if (state.updateQueue.length > 0) {
        await syncWatchHistory(
          state.updateQueue,
          removeUpdateItem,
        );
      }
    };

    const debouncedSync = () => {
      if (syncTimeout) {
        clearTimeout(syncTimeout);
      }
      syncTimeout = setTimeout(syncImmediately, 100);
    };

    // Override the addItem function to trigger immediate sync
    const originalAddItem = useWatchHistoryStore.getState().addItem;
    useWatchHistoryStore.setState({
      addItem: (...args) => {
        originalAddItem(...args);
        // Trigger debounced sync after adding item
        debouncedSync();
      },
    });

    // Override removeItem to trigger immediate sync
    const originalRemoveItem = useWatchHistoryStore.getState().removeItem;
    useWatchHistoryStore.setState({
      removeItem: (...args) => {
        originalRemoveItem(...args);
        // Trigger debounced sync after removing item
        debouncedSync();
      },
    });

    return () => {
      if (syncTimeout) {
        clearTimeout(syncTimeout);
      }
    };
  }, [removeUpdateItem, url]);

  // Regular interval sync
  useEffect(() => {
    const interval = setInterval(() => {
      (async () => {
        if (!url) return;
        const state = useWatchHistoryStore.getState();
        await syncWatchHistory(
          state.updateQueue,
          removeUpdateItem,
        );
      })();
    }, 60 * 1000);

    return () => {
      clearInterval(interval);
    };
  }, [removeUpdateItem, url]);

  return null;
}
