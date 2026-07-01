import { conf } from "@/setup/config";

let activeBackendUrl: string | null = null;
let pingStarted = false;

async function selectActiveBackend() {
  if (pingStarted) return;
  pingStarted = true;

  const urls = conf().BACKEND_URLS;
  if (urls.length <= 1) {
    activeBackendUrl = urls[0] || null;
    return;
  }

  const pingPromises = urls.map(async (url) => {
    try {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), 2000);
      const res = await fetch(`${url}/health`, { signal: controller.signal });
      clearTimeout(id);
      if (res.ok) return url;
    } catch (e) {
      // ignore
    }
    return null;
  });

  try {
    const fastestUrl = await Promise.any(
      pingPromises.map((p) => p.then((res) => res || Promise.reject()))
    );
    if (fastestUrl) {
      activeBackendUrl = fastestUrl;
      console.log("[BackendUrl] Active backend selected:", activeBackendUrl);
    }
  } catch (e) {
    activeBackendUrl = urls[0];
  }
}

// Start ping immediately on script load
selectActiveBackend();

export function useBackendUrl(): string | null {
  const urls = conf().BACKEND_URLS;
  return activeBackendUrl || urls[0] || null;
}

export function getActiveBackendUrl(): string | null {
  const urls = conf().BACKEND_URLS;
  return activeBackendUrl || urls[0] || null;
}

export function switchBackend(): string | null {
  const urls = conf().BACKEND_URLS;
  if (urls.length <= 1) return getActiveBackendUrl();

  const current = getActiveBackendUrl();
  const next = urls.find((u) => u !== current) || urls[0];
  activeBackendUrl = next;
  console.log("[BackendUrl] Switched active backend to:", activeBackendUrl);
  return activeBackendUrl;
}
