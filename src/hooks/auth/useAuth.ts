import { useCallback } from "react";

import { SessionResponse } from "@/backend/accounts/auth";
import { bookmarkMediaToInput } from "@/backend/accounts/bookmarks";
import {
  bytesToBase64,
  bytesToBase64Url,
  encryptData,
  keysFromMnemonic,
  signChallenge,
} from "@/backend/accounts/crypto";
import { getGroupOrder } from "@/backend/accounts/groupOrder";
import { importBookmarks, importProgress } from "@/backend/accounts/import";
import { getLoginChallengeToken, loginAccount } from "@/backend/accounts/login";
import { progressMediaItemToInputs } from "@/backend/accounts/progress";
import {
  getRegisterChallengeToken,
  registerAccount,
} from "@/backend/accounts/register";
import { removeSession } from "@/backend/accounts/sessions";
import { getSettings } from "@/backend/accounts/settings";
import {
  UserResponse,
  getBookmarks,
  getProgress,
  getUser,
} from "@/backend/accounts/user";
import { useAuthData } from "@/hooks/auth/useAuthData";
import { useBackendUrl, switchBackend } from "@/hooks/auth/useBackendUrl";
import { conf } from "@/setup/config";
import { AccountWithToken, useAuthStore } from "@/stores/auth";
import { BookmarkMediaItem } from "@/stores/bookmarks";
import { ProgressMediaItem } from "@/stores/progress";
import { getProfileFromVercel } from "@/utils/uploadAvatar";

export interface RegistrationData {
  recaptchaToken?: string;
  mnemonic: string;
  userData: {
    device: string;
    profile: {
      colorA: string;
      colorB: string;
      icon: string;
    };
  };
}

export interface LoginData {
  mnemonic: string;
  userData: {
    device: string;
  };
}

export function useAuth() {
  const currentAccount = useAuthStore((s) => s.account);
  const profile = useAuthStore((s) => s.account?.profile);
  const loggedIn = !!useAuthStore((s) => s.account);
  const backendUrl = useBackendUrl();
  const {
    logout: userDataLogout,
    login: userDataLogin,
    syncData,
  } = useAuthData();

  const backupLocalState = useCallback(() => {
    try {
      const progressStore = (window as any).__zustand_progress || require("@/stores/progress")?.useProgressStore?.getState?.();
      const bookmarksStore = (window as any).__zustand_bookmarks || require("@/stores/bookmarks")?.useBookmarkStore?.getState?.();
      const progress = progressStore?.items ?? {};
      const bookmarks = bookmarksStore?.bookmarks ?? {};
      
      const { setBackupData } = require("@/stores/auth/multiBackendStore").useMultiBackendStore.getState();
      setBackupData({ progress, bookmarks });
    } catch (e) {
      // ignore
    }
  }, []);

  const callWithFallback = useCallback(
    async <T>(fn: (url: string) => Promise<T>): Promise<T> => {
      let currentUrl = backendUrl;
      if (!currentUrl) throw new Error("No backend URL available");

      try {
        return await fn(currentUrl);
      } catch (err) {
        console.warn(`[useAuth] Request failed on ${currentUrl}. Trying failover...`, err);
        const nextUrl = switchBackend();
        if (nextUrl && nextUrl !== currentUrl) {
          try {
            return await fn(nextUrl);
          } catch (retryErr) {
            switchBackend();
            throw retryErr;
          }
        }
        throw err;
      }
    },
    [backendUrl],
  );

  const login = useCallback(
    async (loginData: LoginData) => {
      const keys = await keysFromMnemonic(loginData.mnemonic);
      const publicKeyBase64Url = bytesToBase64Url(keys.publicKey);
      const seedBase64 = bytesToBase64(keys.seed);
      const encryptedDevice = await encryptData(loginData.userData.device, keys.seed);

      const loginResult = await callWithFallback(async (url) => {
        const { challenge } = await getLoginChallengeToken(
          url,
          publicKeyBase64Url,
        );
        const signature = await signChallenge(keys, challenge);
        return await loginAccount(url, {
          challenge: {
            code: challenge,
            signature,
          },
          publicKey: publicKeyBase64Url,
          device: encryptedDevice,
        });
      });

      const user = await callWithFallback((url) => getUser(url, loginResult.token));
      const account = await userDataLogin(loginResult, user.user, user.session, seedBase64);

      // Store in multi-backend store
      try {
        const { setSession } = await import("@/stores/auth/multiBackendStore").then(m => m.useMultiBackendStore.getState());
        const urls = conf().BACKEND_URLS;
        
        // Log in to all other backends in background to verify / get tokens
        urls.forEach(async (u) => {
          if (u === backendUrl) {
            setSession(u, account, true);
          } else {
            try {
              const { challenge } = await getLoginChallengeToken(u, publicKeyBase64Url);
              const signature = await signChallenge(keys, challenge);
              const res = await loginAccount(u, {
                challenge: { code: challenge, signature },
                publicKey: publicKeyBase64Url,
                device: encryptedDevice,
              });
              const uUser = await getUser(u, res.token);
              const uAccount = {
                token: res.token,
                userId: uUser.user.id,
                sessionId: res.session.id,
                deviceName: res.session.device,
                profile: uUser.user.profile,
                nickname: uUser.user.nickname,
                seed: seedBase64,
              };
              setSession(u, uAccount, true);
            } catch (e) {
              console.warn(`[useAuth] Secondary login failed during initial auth for: ${u}`, e);
            }
          }
        });
      } catch (err) {
        // Ignore multi-backend session setup errors
      }

      // Immediately load Vercel profile photo so it shows right after login
      try {
        const vercelProfile = await getProfileFromVercel(seedBase64);
        if (vercelProfile?.profile?.photoUrl) {
          useAuthStore.getState().setAccountPhotoUrl(vercelProfile.profile.photoUrl);
        }
      } catch {
        // Non-critical: profile photo will load on next restore
      }

      return account;
    },
    [userDataLogin, callWithFallback],
  );

  const logout = useCallback(async () => {
    if (!currentAccount) return;
    const urls = conf().BACKEND_URLS;
    // Log out of all backends in parallel
    await Promise.allSettled(
      urls.map(async (url) => {
        try {
          await removeSession(
            url,
            currentAccount.token,
            currentAccount.sessionId,
          );
        } catch {
          // ignore
        }
      })
    );
    await userDataLogout();
  }, [userDataLogout, currentAccount]);

  const register = useCallback(
    async (registerData: RegistrationData) => {
      const urls = conf().BACKEND_URLS;
      if (urls.length === 0) return;

      const keys = await keysFromMnemonic(registerData.mnemonic);
      const publicKey = bytesToBase64Url(keys.publicKey);
      const device = await encryptData(registerData.userData.device, keys.seed);
      const seedBase64 = bytesToBase64(keys.seed);

      let primaryResult: any = null;
      let lastError: any = null;

      // Register on all backends in parallel
      const registrations = urls.map(async (url) => {
        try {
          const { challenge } = await getRegisterChallengeToken(
            url,
            registerData.recaptchaToken,
          );
          const signature = await signChallenge(keys, challenge);
          const result = await registerAccount(url, {
            challenge: {
              code: challenge,
              signature,
            },
            publicKey,
            device,
            profile: registerData.userData.profile,
          });
          if (url === backendUrl || !primaryResult) {
            primaryResult = result;
          }
          console.log(`[useAuth] Registration successful on backend: ${url}`);

          // Register in multi backend session store
          try {
            const { setSession } = await import("@/stores/auth/multiBackendStore").then(m => m.useMultiBackendStore.getState());
            const registeredAccount = {
              token: result.token,
              userId: result.user.id,
              sessionId: result.session.id,
              deviceName: result.session.device,
              profile: result.user.profile,
              nickname: result.user.nickname,
              seed: seedBase64,
            };
            setSession(url, registeredAccount, true);
          } catch (e) {
            // ignore
          }

          return result;
        } catch (err) {
          console.error(`[useAuth] Registration failed on backend ${url}:`, err);
          lastError = err;
          throw err;
        }
      });

      await Promise.allSettled(registrations);

      if (!primaryResult) {
        throw lastError || new Error("Registration failed on all backends");
      }

      const account = userDataLogin(
        primaryResult,
        primaryResult.user,
        primaryResult.session,
        seedBase64,
      );

      // Back up local state upon registration
      backupLocalState();

      return account;
    },
    [backendUrl, userDataLogin],
  );

  const importData = useCallback(
    async (
      account: AccountWithToken,
      progressItems: Record<string, ProgressMediaItem>,
      bookmarks: Record<string, BookmarkMediaItem>,
    ) => {
      if (!backendUrl) return;
      if (
        Object.keys(progressItems).length === 0 &&
        Object.keys(bookmarks).length === 0
      ) {
        return;
      }

      const progressInputs = Object.entries(progressItems).flatMap(
        ([tmdbId, item]) => progressMediaItemToInputs(tmdbId, item),
      );

      const bookmarkInputs = Object.entries(bookmarks).map(([tmdbId, item]) =>
        bookmarkMediaToInput(tmdbId, item),
      );

      await callWithFallback(async (url) => {
        await Promise.all([
          importProgress(url, account, progressInputs),
          importBookmarks(url, account, bookmarkInputs),
        ]);
      });
    },
    [backendUrl, callWithFallback],
  );

  const restore = useCallback(
    async (account: AccountWithToken) => {
      let user: { user: UserResponse; session: SessionResponse };
      try {
        user = await callWithFallback((url) => getUser(url, account.token));
      } catch (err) {
        const anyError: any = err;
        if (
          anyError?.response?.status === 401 ||
          anyError?.response?.status === 403 ||
          anyError?.response?.status === 400
        ) {
          await logout();
          return;
        }
        console.error(err);
        throw err;
      }

      const [bookmarks, progress, settings, groupOrder, vercelProfile] = await callWithFallback(
        async (url) => {
          return Promise.all([
            getBookmarks(url, account),
            getProgress(url, account),
            getSettings(url, account),
            getGroupOrder(url, account),
            getProfileFromVercel(account.seed),
          ]);
        }
      );

      // Update account store with fresh user data (including nickname and Vercel profile details)
      const { setAccount } = useAuthStore.getState();
      if (account) {
        setAccount({
          ...account,
          nickname: user.user.nickname,
          profile: {
            ...user.user.profile,
            photoUrl: vercelProfile?.profile?.photoUrl || account.profile?.photoUrl,
          },
        });
      }

      syncData(
        user.user,
        user.session,
        progress,
        bookmarks,
        settings,
        groupOrder,
      );

      // Back up loaded state to useMultiBackendStore
      backupLocalState();
    },
    [callWithFallback, syncData, logout, backupLocalState],
  );

  return {
    loggedIn,
    profile,
    login,
    logout,
    register,
    restore,
    importData,
  };
}
