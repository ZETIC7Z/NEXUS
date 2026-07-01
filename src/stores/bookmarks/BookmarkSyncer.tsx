import { useEffect } from "react";

import { addBookmark, removeBookmark } from "@/backend/accounts/bookmarks";
import { useBackendUrl } from "@/hooks/auth/useBackendUrl";
import { conf } from "@/setup/config";
import { useAuthStore } from "@/stores/auth";
import { useMultiBackendStore } from "@/stores/auth/multiBackendStore";
import { BookmarkUpdateItem, useBookmarkStore } from "@/stores/bookmarks";

const syncIntervalMs = 5 * 1000;

async function syncBookmarks(
  items: BookmarkUpdateItem[],
  finish: (id: string) => void,
) {
  const { sessions, removeSession } = useMultiBackendStore.getState();
  const urls = conf().BACKEND_URLS;

  for (const item of items) {
    // complete it beforehand so it doesn't get handled while in progress
    finish(item.id);

    // Sync to all backends in parallel
    urls.forEach(async (url) => {
      const session = sessions[url];
      if (!session || !session.account) return;

      try {
        if (item.action === "delete") {
          await removeBookmark(url, session.account, item.tmdbId);
        } else if (item.action === "add") {
          await addBookmark(url, session.account, {
            meta: {
              poster: item.poster,
              title: item.title ?? "",
              type: item.type ?? "",
              year: item.year ?? NaN,
            },
            tmdbId: item.tmdbId,
            group: item.group,
            favoriteEpisodes: item.favoriteEpisodes,
          });
        }
      } catch (err) {
        console.error(
          `Failed to sync bookmark to ${url}: ${item.tmdbId} - ${item.action}`,
          err,
        );
        // If a server returned 401/403 or is offline, clear user multi session so reconciler will pick it up
        const anyErr: any = err;
        if (anyErr?.response?.status === 401 || anyErr?.response?.status === 403) {
          removeSession(url);
        }
      }
    });
  }
}

export function BookmarkSyncer() {
  const clearUpdateQueue = useBookmarkStore((s) => s.clearUpdateQueue);
  const removeUpdateItem = useBookmarkStore((s) => s.removeUpdateItem);
  const url = useBackendUrl();

  // when booting for the first time, clear update queue.
  // we dont want to process persisted update items
  useEffect(() => {
    clearUpdateQueue();
  }, [clearUpdateQueue]);

  useEffect(() => {
    const interval = setInterval(() => {
      (async () => {
        if (!url) return;
        const state = useBookmarkStore.getState();
        await syncBookmarks(
          state.updateQueue,
          removeUpdateItem,
        );
      })();
    }, syncIntervalMs);

    return () => {
      clearInterval(interval);
    };
  }, [removeUpdateItem, url]);

  return null;
}
