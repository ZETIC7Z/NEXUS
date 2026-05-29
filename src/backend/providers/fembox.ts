import { isExtensionActive, RULE_IDS, setDomainRule } from "@/backend/extension/messaging";
import { proxiedFetch } from "@/backend/helpers/fetch";
import { createM3U8ProxyUrl } from "@/components/player/utils/proxy";
import { conf } from "@/setup/config";
import { usePreferencesStore } from "@/stores/preferences";

export interface FemboxSource {
  url: string;
  quality: string;
  type?: string;
}

export interface FemboxSubtitle {
  language: string;
  url: string;
  name?: string;
}

export interface FemboxResponse {
  sources: FemboxSource[];
  subtitles: FemboxSubtitle[];
}

// Legacy interface for backwards compatibility
export interface FemboxStream {
  url: string;
  quality: string;
  name: string;
  speed: string;
  size: string;
}

// FebBox/Fembox CDN headers required for playback
export const FEMBOX_HEADERS = {
  Referer: "https://www.febbox.com/",
  Origin: "https://www.febbox.com",
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36",
};

function mapQualityKey(q: string): string {
  const u = q.toUpperCase();
  if (u.includes("4K") || u.includes("2160")) return "4k";
  if (u.includes("1080")) return "1080";
  if (u.includes("720")) return "720";
  if (u.includes("480")) return "480";
  if (u.includes("360")) return "360";
  return "unknown";
}




/**
 * Select the best 1080p playback URL from GoatAPI FebBox streams.
 *
 * Quality strategy:
 *  • 1080p is always the primary target.
 *  • When multiple 1080p URLs exist, ping them in parallel and pick the fastest.
 *  • Falls back through 720 → 480 → 360 if 1080p is unavailable.
 *  • LAST RESORT: if ALL pings time out, use the first available URL anyway so
 *    the player attempts to load rather than showing "no video available".
 *
 * Returns { url, quality } where url is already proxied/extension-ready.
 */
async function pickBestStream(
  streams: FemboxSource[],
): Promise<{ url: string; quality: string } | null> {
  // ── 1. Filter to web-platform HLS streams (platform=web) ──────────────────
  const candidates = streams.filter((s) => {
    if (!s?.url) return false;
    const isHls = s.url.includes(".m3u8") || s.type === "hls";
    const isWeb = s.url.includes("platform=web");
    return isHls && isWeb;
  });

  // Fallback: accept any HLS if no platform=web streams exist
  const pool =
    candidates.length > 0
      ? candidates
      : streams.filter(
          (s) => s?.url && (s.url.includes(".m3u8") || s.type === "hls"),
        );

  if (pool.length === 0) return null;

  // ── 2. Group by quality tier ───────────────────────────────────────────────
  const byQuality: Record<string, FemboxSource[]> = {};
  for (const s of pool) {
    const q = mapQualityKey(s.quality);
    if (!byQuality[q]) byQuality[q] = [];
    byQuality[q].push(s);
  }

  // ── 3. Set up extension headers / proxy helper ─────────────────────────────
  let extensionActive = false;
  try {
    extensionActive = await isExtensionActive();
    if (extensionActive) {
      const hostnames = new Set<string>();
      pool.forEach((s) => {
        try {
          hostnames.add(new URL(s.url).hostname);
        } catch {}
      });
      if (hostnames.size > 0) {
        await setDomainRule({
          ruleId: RULE_IDS.PREPARE_STREAM,
          targetDomains: Array.from(hostnames),
          requestHeaders: FEMBOX_HEADERS,
        });
      }
    }
  } catch {}

  function proxyUrl(rawUrl: string): string {
    if (extensionActive) return rawUrl;
    try {
      return createM3U8ProxyUrl(rawUrl, FEMBOX_HEADERS);
    } catch {
      return rawUrl;
    }
  }

  // Helper: ping all sources in a tier and return the fastest responding URL
  async function pingTierLocal(
    sources: FemboxSource[] | undefined,
    timeoutMs: number,
  ): Promise<{ url: string; ping: number } | null> {
    if (!sources || sources.length === 0) return null;
    if (sources.length === 1) {
      // Only one — no need to ping, return immediately
      return { url: sources[0].url, ping: 0 };
    }
    const results = await Promise.all(
      sources.map(async (s) => {
        const controller = new AbortController();
        const tid = setTimeout(() => controller.abort(), timeoutMs);
        const t0 = performance.now();
        try {
          const res = await fetch(proxyUrl(s.url), {
            method: "GET",
            signal: controller.signal,
          });
          clearTimeout(tid);
          if (res.status < 500) return { url: s.url, ping: performance.now() - t0 };
        } catch {
          clearTimeout(tid);
        }
        return { url: s.url, ping: Infinity };
      }),
    );
    const sorted = results
      .filter((r) => r.ping < Infinity)
      .sort((a, b) => a.ping - b.ping);
    return sorted[0] ?? null;
  }

  // ── 4. Try quality tiers in order: 1080 → 720 → 480 → 360 → 4K ──────────
  for (const tier of ["1080", "720", "480", "360", "4k", "unknown"]) {
    const res = await pingTierLocal(byQuality[tier], 3000);
    if (res) return { url: proxyUrl(res.url), quality: tier };
  }

  // ── 5. LAST RESORT: use first available URL without pinging ───────────────
  for (const tier of ["1080", "720", "480", "360", "4k", "unknown"]) {
    const first = byQuality[tier]?.[0];
    if (first) {
      console.warn("[FebBox] All pings failed — using first available URL");
      return { url: proxyUrl(first.url), quality: tier };
    }
  }

  return null;
}

async function fetchFemboxData(url: string): Promise<FemboxResponse | null> {
  try {
    const data = await proxiedFetch<any>(url, {});
    const sources: FemboxSource[] = data?.streams || data?.sources || [];
    const subtitles: FemboxSubtitle[] = data?.subtitles || [];
    if (sources.length > 0) return { sources, subtitles };
    return null;
  } catch {
    return null;
  }
}

export async function scrapeFemboxMovie(
  tmdbId: string,
): Promise<FemboxResponse | null> {
  const febboxKey =
    usePreferencesStore.getState().febboxKey || conf().VITE_DEFAULT_FEBBOX_KEY;
  if (!febboxKey) return null;

  const url = `https://goatapi.imreallydagoatt.workers.dev/api/febbox/movie/${tmdbId}?token=${encodeURIComponent(febboxKey)}`;
  const data = await fetchFemboxData(url);
  if (!data) return null;

  const best = await pickBestStream(data.sources);
  if (!best) return null;

  return {
    sources: [{ url: best.url, quality: best.quality, type: "hls" }],
    subtitles: data.subtitles,
  };
}

export async function scrapeFemboxTV(
  tmdbId: string,
  season: number,
  episode: number,
): Promise<FemboxResponse | null> {
  const febboxKey =
    usePreferencesStore.getState().febboxKey || conf().VITE_DEFAULT_FEBBOX_KEY;
  if (!febboxKey) return null;

  const url = `https://goatapi.imreallydagoatt.workers.dev/api/febbox/tv/${tmdbId}/${season}/${episode}?token=${encodeURIComponent(febboxKey)}`;
  const data = await fetchFemboxData(url);
  if (!data) return null;

  const best = await pickBestStream(data.sources);
  if (!best) return null;

  return {
    sources: [{ url: best.url, quality: best.quality, type: "hls" }],
    subtitles: data.subtitles,
  };
}

/**
 * Convert a FemboxResponse into the player stream format.
 * The source URL is already proxied through createM3U8ProxyUrl, so FebBox CDN
 * headers are injected on every manifest and segment request automatically.
 */
export function convertFemboxToStream(femboxData: FemboxResponse) {
  if (!femboxData?.sources?.length) return null;

  const captions = (femboxData.subtitles || []).map((sub) => ({
    id: sub.language,
    url: sub.url,
    type: "vtt" as const,
    hasCorsRestrictions: true,
    language: sub.language,
  }));

  const primary = femboxData.sources[0];

  return {
    type: "hls" as const,
    playlist: primary.url,
    headers: FEMBOX_HEADERS,
    flags: [],
    captions,
  };
}
