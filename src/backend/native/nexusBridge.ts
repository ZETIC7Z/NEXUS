/**
 * nexusBridge.ts
 *
 * Drop-in module for the Flickv4 web frontend that replaces direct
 * @p-stream/providers calls with calls to the Kotlin native bridge
 * (window.__nexus) when running inside the NEXUS Android WebView.
 *
 * Usage:
 *   import { isNativeApp, getServers, getVideo, extractUrl } from '@/backend/native/nexusBridge';
 *
 *   if (isNativeApp()) {
 *     const servers = await getServers(tmdbId, 'movie');
 *     const video   = await getVideo(servers[0]);
 *     // play video.source
 *   }
 */

// ─── Type Definitions ────────────────────────────────────────────────────────

export interface NativeServer {
  id: string;
  name: string;
  src: string;
}

export interface NativeSubtitle {
  label: string;
  file: string;
  default: boolean;
}

export interface NativeVideo {
  source: string;
  type: string; // e.g. "application/x-mpegURL" or "video/mp4"
  headers: Record<string, string>;
  subtitles: NativeSubtitle[];
  extraBuffering: boolean;
}

export interface NativeProvider {
  name: string;
  language: string;
  logo: string;
  baseUrl: string;
  supportsMovies: boolean;
  supportsTvShows: boolean;
}

// ─── Detection ───────────────────────────────────────────────────────────────

/**
 * Returns true when the page is running inside the NEXUS Android WebView
 * and the bridge interface has been injected.
 */
export function isNativeApp(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof (window as any).NexusBridge !== "undefined" &&
    typeof (window as any).__nexus !== "undefined"
  );
}

// ─── API ─────────────────────────────────────────────────────────────────────

/**
 * Fetch the list of available servers for a piece of media.
 * Routes through native Kotlin Provider.getServers().
 */
export async function getServers(
  tmdbId: string,
  type: "movie" | "tv" | "show" | "series",
  season = 0,
  episode = 0,
): Promise<NativeServer[]> {
  assertBridgeAvailable();
  return (window as any).__nexus.getServers(tmdbId, type, season, episode);
}

/**
 * Extract a direct video URL from a server object.
 * Routes through native Kotlin Provider.getVideo() -> Extractor.extract().
 */
export async function getVideo(server: NativeServer): Promise<NativeVideo> {
  assertBridgeAvailable();
  return (window as any).__nexus.getVideo(server.id, server.name, server.src);
}

/**
 * Directly extract a stream URL from any embed URL.
 * Routes through Extractor.extract() in Kotlin — bypasses the provider layer.
 */
export async function extractUrl(
  embedUrl: string,
  serverName = "unknown",
): Promise<NativeVideo> {
  assertBridgeAvailable();
  return (window as any).__nexus.extractUrl(embedUrl, serverName);
}

/**
 * Get the list of all available native Kotlin providers.
 */
export async function getProviders(): Promise<NativeProvider[]> {
  assertBridgeAvailable();
  return (window as any).__nexus.getProviders();
}

/**
 * Convenience: resolve a TMDb ID all the way to the first playable video URL.
 * Fetches servers, picks the first, extracts the URL.
 */
export async function resolveMedia(
  tmdbId: string,
  type: "movie" | "tv",
  season = 0,
  episode = 0,
): Promise<NativeVideo> {
  const servers = await getServers(tmdbId, type, season, episode);
  if (servers.length === 0) {
    throw new Error("No servers available for this media");
  }
  return getVideo(servers[0]);
}

// ─── Internal ────────────────────────────────────────────────────────────────

function assertBridgeAvailable(): void {
  if (!isNativeApp()) {
    throw new Error(
      "NexusBridge is not available. Are you running inside the NEXUS Android app?",
    );
  }
}
