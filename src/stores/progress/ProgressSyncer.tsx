import { useEffect } from "react";

import {
  progressUpdateItemToInput,
  removeProgress,
  setProgress,
} from "@/backend/accounts/progress";
import { useBackendUrl } from "@/hooks/auth/useBackendUrl";
import { conf } from "@/setup/config";
import { useAuthStore } from "@/stores/auth";
import { useMultiBackendStore } from "@/stores/auth/multiBackendStore";
import { ProgressUpdateItem, useProgressStore } from "@/stores/progress";

const syncIntervalMs = 10 * 1000; // 10 second intervals

async function syncProgress(
  items: ProgressUpdateItem[],
  finish: (id: string) => void,
) {
  const { sessions, removeSession } = useMultiBackendStore.getState();
  const urls = conf().BACKEND_URLS;

  for (const item of items) {
    // complete it beforehand so it doesn't get handled while in progress
    finish(item.id);

    // Sync progress to all online backends in parallel
    urls.forEach(async (url) => {
      const session = sessions[url];
      if (!session || !session.account) return;

      try {
        if (item.action === "delete") {
          await removeProgress(
            url,
            session.account,
            item.tmdbId,
            item.seasonId,
            item.episodeId,
          );
        } else if (item.action === "upsert") {
          await setProgress(url, session.account, progressUpdateItemToInput(item));
        }
      } catch (err) {
        console.error(
          `Failed to sync progress to ${url}: ${item.tmdbId} - ${item.action}`,
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

export function ProgressSyncer() {
  const clearUpdateQueue = useProgressStore((s) => s.clearUpdateQueue);
  const removeUpdateItem = useProgressStore((s) => s.removeUpdateItem);
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
        const state = useProgressStore.getState();
        await syncProgress(
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
