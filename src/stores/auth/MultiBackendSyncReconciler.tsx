import { useEffect } from "react";
import { conf } from "@/setup/config";
import { useMultiBackendStore } from "@/stores/auth/multiBackendStore";
import { getBackendMeta } from "@/backend/accounts/meta";
import { getRegisterChallengeToken, registerAccount } from "@/backend/accounts/register";
import { keysFromMnemonic, signChallenge, bytesToBase64Url, bytesToBase64, encryptData } from "@/backend/accounts/crypto";
import { importProgress, importBookmarks } from "@/backend/accounts/import";
import { progressMediaItemToInputs } from "@/backend/accounts/progress";
import { bookmarkMediaToInput } from "@/backend/accounts/bookmarks";
import { useAuthStore } from "@/stores/auth";
import { useProgressStore } from "@/stores/progress";
import { useBookmarkStore } from "@/stores/bookmarks";

export function MultiBackendSyncReconciler() {
  const account = useAuthStore((s) => s.account);

  useEffect(() => {
    if (!account) return;

    const interval = setInterval(async () => {
      const urls = conf().BACKEND_URLS;
      const { sessions, setSession, backupData } = useMultiBackendStore.getState();

      for (const url of urls) {
        const session = sessions[url];

        // If backend does not have an active registered session, check if it's back online and sync
        try {
          // Check health
          const meta = await getBackendMeta(url);
          
          if (!session && account.seed) {
            console.log(`[Reconciler] Recovered backend detected online: ${url}. Attempting registration & synchronization...`);
            
            // Re-register account on this recovered backend
            const keys = await keysFromMnemonic(account.seed); // fallback mnemonic seed
            const publicKey = bytesToBase64Url(keys.publicKey);
            const device = await encryptData(account.deviceName, keys.seed);

            const { challenge } = await getRegisterChallengeToken(url);
            const signature = await signChallenge(keys, challenge);
            const result = await registerAccount(url, {
              challenge: { code: challenge, signature },
              publicKey,
              device,
              profile: account.profile,
            });

            const registeredAccount = {
              token: result.token,
              userId: result.user.id,
              sessionId: result.session.id,
              deviceName: result.session.device,
              profile: result.user.profile,
              nickname: result.user.nickname,
              seed: account.seed,
            };

            setSession(url, registeredAccount, true);
            console.log(`[Reconciler] Successfully registered recovered session on ${url}`);

            // Perform automatic data sync of bookmarks & progress to this backend
            const progressStore = useProgressStore.getState();
            const bookmarksStore = useBookmarkStore.getState();
            const progressItems = backupData?.progress || progressStore.items || {};
            const bookmarkItems = backupData?.bookmarks || bookmarksStore.bookmarks || {};

            const progressInputs = Object.entries(progressItems).flatMap(
              ([tmdbId, item]) => progressMediaItemToInputs(tmdbId, item),
            );
            const bookmarkInputs = Object.entries(bookmarkItems).map(([tmdbId, item]) =>
              bookmarkMediaToInput(tmdbId, item),
            );

            await Promise.all([
              importProgress(url, registeredAccount, progressInputs),
              importBookmarks(url, registeredAccount, bookmarkInputs),
            ]);
            console.log(`[Reconciler] Re-synchronized backup bookmarks and progress to ${url}`);
          }
        } catch (e) {
          // Ignore offline check failures
        }
      }
    }, 15000); // Poll every 15 seconds

    return () => clearInterval(interval);
  }, [account]);

  return null;
}
