import { create } from "zustand";
import { persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import { AccountWithToken } from "@/stores/auth";
import { BookmarkMediaItem } from "@/stores/bookmarks";
import { ProgressMediaItem } from "@/stores/progress";

export interface SyncDataState {
  progress: Record<string, ProgressMediaItem>;
  bookmarks: Record<string, BookmarkMediaItem>;
}

export interface MultiBackendStore {
  // Store session keys for each backend url separately
  sessions: Record<string, {
    account: AccountWithToken;
    registered: boolean;
    synced: boolean;
  }>;
  // Temporary backup of user state in case of failover sync
  backupData: SyncDataState | null;

  setSession(url: string, account: AccountWithToken, registered: boolean): void;
  removeSession(url: string): void;
  markSynced(url: string, synced: boolean): void;
  setBackupData(data: SyncDataState | null): void;
  clear(): void;
}

export const useMultiBackendStore = create(
  persist(
    immer<MultiBackendStore>((set) => ({
      sessions: {},
      backupData: null,
      setSession(url, account, registered) {
        set((s) => {
          s.sessions[url] = {
            account,
            registered,
            synced: false,
          };
        });
      },
      removeSession(url) {
        set((s) => {
          delete s.sessions[url];
        });
      },
      markSynced(url, synced) {
        set((s) => {
          if (s.sessions[url]) {
            s.sessions[url].synced = synced;
          }
        });
      },
      setBackupData(data) {
        set((s) => {
          s.backupData = data;
        });
      },
      clear() {
        set((s) => {
          s.sessions = {};
          s.backupData = null;
        });
      },
    })),
    {
      name: "__MW::multi_backend_sync",
    },
  ),
);
