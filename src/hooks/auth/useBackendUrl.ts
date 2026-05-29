import { conf } from "@/setup/config";

export function useBackendUrl(): string | null {
  // Always use the config BACKEND_URL to avoid CORS issues with old cached URLs
  // The authStore.backendUrl may contain outdated URLs like server.fifthwit.net
  // which don't have CORS configured for the current domain
  return conf().BACKEND_URL;
}
