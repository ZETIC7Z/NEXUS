/* eslint-disable @typescript-eslint/no-explicit-any */
import * as cheerio from "cheerio";
import CryptoJS from "crypto-js";
import slugify from "slugify";

import {
  EmbedScrapeContext,
  MovieScrapeContext,
  NotFoundError,
  ShowScrapeContext,
  SourcererOutput,
} from "@p-stream/providers";

// --- Local wrappers ---

function makeSourcerer(state: any): any {
  const mediaTypes: string[] = [];
  if (state.scrapeMovie) mediaTypes.push("movie");
  if (state.scrapeShow) mediaTypes.push("show");
  return {
    ...state,
    type: "source",
    disabled: state.disabled ?? false,
    externalSource: state.externalSource ?? false,
    mediaTypes,
  };
}

function makeEmbed(state: any): any {
  return {
    ...state,
    type: "embed",
    disabled: state.disabled ?? false,
    mediaTypes: undefined,
  };
}

// --- Shared Utilities ---

function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

// Stubs for removed scrapers
export const zetAnimeScraper = null as any;
export const allAnimeScraper = null as any;
export const animekaiEmbed = null as any;
export const animekaiScraper = null as any;
export const watchanimeworldScraper = null as any;
export const rgshowsScraper = null as any;

// ─────────────────────────────────────────────────────────────────────────────
// true source name VidLink 🔥 / Alias use for this site: Abyss
// VidLink (rank 895) — DO NOT EDIT
// ─────────────────────────────────────────────────────────────────────────────

const API_BASE = "https://enc-dec.app/api";
const VIDLINK_BASE = "https://vidlink.pro/api/b";

const vidlinkHeaders = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36",
  Connection: "keep-alive",
  Referer: "https://vidlink.pro/",
  Origin: "https://vidlink.pro",
};

async function encryptTmdbId(
  ctx: MovieScrapeContext | ShowScrapeContext,
  tmdbId: string,
): Promise<string> {
  const url = `${API_BASE}/enc-vidlink?text=${encodeURIComponent(tmdbId)}`;
  let response: { result: string } | null = null;
  // Try direct fetch first (avoids proxy overhead for a simple CORS-friendly API)
  try {
    const res = await fetch(url);
    if (res.ok) response = await res.json();
  } catch {
    // fall through to proxied fetcher
  }
  if (!response?.result) {
    response = await ctx.proxiedFetcher<{ result: string }>(
      `${API_BASE}/enc-vidlink`,
      { method: "GET", query: { text: tmdbId } },
    );
  }
  if (!response?.result) throw new NotFoundError("VidLink: Failed to encrypt TMDB ID");
  return response.result;
}

async function vidlinkComboScraper(
  ctx: ShowScrapeContext | MovieScrapeContext,
): Promise<SourcererOutput> {
  const { tmdbId } = ctx.media;
  ctx.progress(10);
  const encryptedId = await encryptTmdbId(ctx, tmdbId.toString());
  ctx.progress(30);

  const apiUrl =
    ctx.media.type === "movie"
      ? `${VIDLINK_BASE}/movie/${encryptedId}`
      : `${VIDLINK_BASE}/tv/${encryptedId}/${(ctx as ShowScrapeContext).media.season.number}/${(ctx as ShowScrapeContext).media.episode.number}`;

  let vidlinkData: any = null;
  // Try direct fetch first, then fall back to proxiedFetcher
  try {
    const res = await fetch(apiUrl, { headers: vidlinkHeaders });
    if (res.ok) vidlinkData = await res.json();
  } catch {
    // fall through
  }
  if (!vidlinkData) {
    const raw = await ctx.proxiedFetcher<any>(apiUrl, { headers: vidlinkHeaders });
    vidlinkData = typeof raw === "string" ? JSON.parse(raw) : raw;
  }

  ctx.progress(60);
  if (!vidlinkData?.stream) throw new NotFoundError("VidLink: No stream data");

  const { stream } = vidlinkData;
  ctx.progress(80);

  const captions: any[] = (stream.captions || []).map((c: any) => ({
    id: c.id || c.url,
    url: c.url,
    language: c.language || "Unknown",
    type: c.type === "srt" ? "srt" : "vtt",
    hasCorsRestrictions: c.hasCorsRestrictions || false,
  }));

  const streamType = stream.type || (stream.playlist ? "hls" : "file");

  return {
    embeds: [],
    stream: [
      {
        id: stream.id || "primary",
        type: streamType,
        ...(streamType === "hls"
          ? { playlist: stream.playlist }
          : { qualities: stream.qualities || {} }),
        captions,
        flags: [],
        headers: stream.headers || vidlinkHeaders,
      },
    ],
  };
}

export const vidlinkScraper = makeSourcerer({
  id: "vidlink-custom",
  name: "Abyss \uD83D\uDD25",
  rank: 895,
  disabled: false,
  flags: [],
  scrapeMovie: vidlinkComboScraper,
  scrapeShow: vidlinkComboScraper,
});

// ─────────────────────────────────────────────────────────────────────────────
// SAMXERZAPI / ZeticuzApi 🔥 (rank 880) — DO NOT EDIT
// ─────────────────────────────────────────────────────────────────────────────

const GOATAPI_BASE = "https://goatapi.imreallydagoatt.workers.dev";

function getZeticuzToken(): string {
  try {
    const prefData =
      typeof window !== "undefined"
        ? window.localStorage.getItem("__MW::preferences")
        : null;
    if (prefData) {
      const parsed = JSON.parse(prefData);
      const token =
        parsed?.state?.febboxKey || parsed?.state?.preferences?.febboxKey;
      if (token) return token;
    }
  } catch {
    // fall through
  }
  return import.meta.env.VITE_DEFAULT_FEBBOX_KEY || "";
}

function goatProxyUrl(url: string, referer: string): string {
  return `${GOATAPI_BASE}/api/proxy?url=${encodeURIComponent(url)}&referer=${encodeURIComponent(referer)}`;
}

async function zeticuzApiLogic(
  ctx: MovieScrapeContext | ShowScrapeContext,
): Promise<SourcererOutput> {
  const { tmdbId } = ctx.media;
  const isMovie = ctx.media.type === "movie";
  const showCtx = ctx as ShowScrapeContext;

  const lightningUrl = isMovie
    ? `${GOATAPI_BASE}/api/lightning/movie/${tmdbId}`
    : `${GOATAPI_BASE}/api/lightning/tv/${tmdbId}/${showCtx.media.season.number}/${showCtx.media.episode.number}`;

  try {
    let data: any = null;
    try {
      data = await ctx.proxiedFetcher<any>(lightningUrl);
    } catch {
      const res = await fetch(lightningUrl);
      data = await res.json();
    }

    if (data?.success && Array.isArray(data.streams)) {
      for (const s of data.streams) {
        if (s?.url && (s.type === "hls" || s.url.includes(".m3u8"))) {
          const referer = s.referer || "https://goatapi.imreallydagoatt.workers.dev/";
          const proxiedPlaylist = goatProxyUrl(s.url, referer);
          return {
            embeds: [],
            stream: [
              {
                id: "primary",
                type: "hls",
                playlist: proxiedPlaylist,
                headers: {
                  Referer: "https://goatapi.imreallydagoatt.workers.dev/",
                  "User-Agent":
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/137.0.0.0 Safari/537.36",
                },
                flags: [],
                captions: [],
              },
            ],
          };
        }
      }
    }
  } catch {
    // lightning failed — try febbox
  }

  // FebBox fallback (requires token, higher quality)
  const token = getZeticuzToken();
  if (token) {
    const febboxUrl = isMovie
      ? `${GOATAPI_BASE}/api/febbox/movie/${tmdbId}?token=${encodeURIComponent(token)}`
      : `${GOATAPI_BASE}/api/febbox/tv/${tmdbId}/${showCtx.media.season.number}/${showCtx.media.episode.number}?token=${encodeURIComponent(token)}`;
    try {
      let fb: any = null;
      try {
        fb = await ctx.proxiedFetcher<any>(febboxUrl);
      } catch {
        const res = await fetch(febboxUrl);
        fb = await res.json();
      }
      if (fb?.success && Array.isArray(fb.streams)) {
        const qualities: Record<string, { type: "hls" | "mp4"; url: string }> = {};
        for (const s of fb.streams) {
          if (!s.url) continue;
          const q = (s.quality || "").toUpperCase();
          const key =
            q.includes("4K") || q.includes("2160")
              ? "4k"
              : q.includes("1080")
              ? "1080"
              : q.includes("720")
              ? "720"
              : q.includes("480")
              ? "480"
              : "1080";
          if (!qualities[key]) {
            qualities[key] = {
              type: s.url.includes(".m3u8") ? "hls" : "mp4",
              url: s.url,
            };
          }
        }
        if (Object.keys(qualities).length > 0) {
          return {
            embeds: [],
            stream: [
              {
                id: "primary",
                type: "file",
                qualities,
                headers: {
                  Referer: "https://www.febbox.com/",
                  "User-Agent":
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/137.0.0.0 Safari/537.36",
                },
                flags: [],
                captions: [],
              },
            ],
          };
        }
      }
    } catch {
      // febbox also failed
    }
  }

  throw new NotFoundError("ZeticuzApi: no streams available");
}

export const zeticuzApiScraper = makeSourcerer({
  id: "zeticuzapi-custom",
  name: "ZeticuzApi 🔥",
  rank: 880,
  flags: [],
  scrapeMovie: zeticuzApiLogic,
  scrapeShow: zeticuzApiLogic,
});

// ─────────────────────────────────────────────────────────────────────────────
// FebBox 4K ⭐ (rank 870) — Direct fembox.aether.mom API
// ─────────────────────────────────────────────────────────────────────────────

async function febboxScraperLogic(
  ctx: MovieScrapeContext | ShowScrapeContext,
): Promise<SourcererOutput> {
  const { scrapeFemboxMovie, scrapeFemboxTV, convertFemboxToStream } =
    await import("@/backend/providers/fembox");

  let femboxData = null;
  if (ctx.media.type === "movie") {
    femboxData = await scrapeFemboxMovie(ctx.media.tmdbId);
  } else if (ctx.media.type === "show") {
    const showCtx = ctx as ShowScrapeContext;
    femboxData = await scrapeFemboxTV(
      showCtx.media.tmdbId,
      showCtx.media.season.number,
      showCtx.media.episode.number,
    );
  }

  if (!femboxData) {
    throw new NotFoundError("FebBox: no stream available for this title");
  }

  const stream = convertFemboxToStream(femboxData);
  if (!stream) {
    throw new NotFoundError("FebBox: could not convert stream data");
  }

  return {
    embeds: [],
    stream: [{ ...stream, id: "febbox-stream" }],
  };
}

export const febboxScraper = makeSourcerer({
  id: "febbox",
  name: "FebBox 4K ⭐",
  rank: 870,
  flags: [],
  scrapeMovie: febboxScraperLogic,
  scrapeShow: febboxScraperLogic,
});

// ─────────────────────────────────────────────────────────────────────────────
// VidRock (rank 860) — uses updated API endpoint with TMDB ID directly
// ─────────────────────────────────────────────────────────────────────────────

const VIDROCK_BASE = "https://vidrock.net";
const VIDROCK_PASSPHRASE = "x7k9mPqT2rWvY8zA5bC3nF6hJ2lK4mN9";

function vidRockEncrypt(input: string): string {
  const key = CryptoJS.enc.Utf8.parse(VIDROCK_PASSPHRASE);
  const iv = CryptoJS.enc.Utf8.parse(VIDROCK_PASSPHRASE.substring(0, 16));
  const encrypted = CryptoJS.AES.encrypt(input, key, {
    iv,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7,
  });
  return encrypted.ciphertext
    .toString(CryptoJS.enc.Base64)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

const vidrockHeaders = {
  Referer: `${VIDROCK_BASE}/`,
  Origin: VIDROCK_BASE,
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36",
};

async function vidrockFetchStream(ctx: MovieScrapeContext | ShowScrapeContext, encId: string, type: "movie" | "show"): Promise<string | null> {
  // Try encrypted API first
  try {
    const apiPath = type === "movie" ? "movie" : "show";
    const res = await ctx.proxiedFetcher<any>(
      `${VIDROCK_BASE}/api/${apiPath}/${encodeURIComponent(encId)}`,
      { headers: vidrockHeaders },
    );
    const streamUrl = res?.Atlas?.url || res?.url || res?.stream?.url || res?.hls;
    if (streamUrl) return streamUrl;
  } catch {
    // try alternative endpoint
  }

  // Alternative: try TMDB ID-based endpoint (newer API)
  try {
    const apiPath2 = type === "movie" ? "movie" : "tv";
    const res2 = await ctx.proxiedFetcher<any>(
      `${VIDROCK_BASE}/api/v2/${apiPath2}/${encId}`,
      { headers: vidrockHeaders },
    );
    const streamUrl2 = res2?.url || res2?.stream || res2?.hls || res2?.Atlas?.url;
    if (streamUrl2) return streamUrl2;
  } catch {
    // both failed
  }

  return null;
}

export const vidrockScraper = makeSourcerer({
  id: "vidrock-custom",
  name: "VidRock",
  rank: 860,
  flags: [],
  scrapeMovie: async (ctx: MovieScrapeContext) => {
    const encId = vidRockEncrypt(ctx.media.tmdbId.toString());
    const streamUrl = await vidrockFetchStream(ctx, encId, "movie");
    if (!streamUrl) throw new NotFoundError("VidRock: No stream found");
    return {
      embeds: [],
      stream: [{
        id: "primary",
        type: "hls",
        playlist: streamUrl,
        headers: vidrockHeaders,
        flags: [],
        captions: [],
      }],
    };
  },
  scrapeShow: async (ctx: ShowScrapeContext) => {
    const itemId = `${ctx.media.tmdbId}_${ctx.media.season.number}_${ctx.media.episode.number}`;
    const encId = vidRockEncrypt(itemId);
    const streamUrl = await vidrockFetchStream(ctx, encId, "show");
    if (!streamUrl) throw new NotFoundError("VidRock: No stream found");
    return {
      embeds: [],
      stream: [{
        id: "primary",
        type: "hls",
        playlist: streamUrl,
        headers: vidrockHeaders,
        flags: [],
        captions: [],
      }],
    };
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// Tugaflix 🔥 (rank 830) — Searches tugaflix.best, extracts direct streams
// ─────────────────────────────────────────────────────────────────────────────

const TUGAFLIX_BASE = "https://tugaflix.site";

async function scrapeTugaflixMovie(ctx: MovieScrapeContext): Promise<SourcererOutput> {
  const slug = normalizeTitle(ctx.media.title);
  const searchUrl = `${TUGAFLIX_BASE}/?s=${encodeURIComponent(ctx.media.title)}`;
  const searchRes = await ctx.proxiedFetcher.full(searchUrl, {
    headers: { Referer: TUGAFLIX_BASE },
  });
  const $ = cheerio.load(searchRes.body);

  let movieUrl: string | undefined;
  $("article a[href]").each((_: any, el: any) => {
    if (movieUrl) return;
    const href = $(el).attr("href") || "";
    const hrefSlug = href.toLowerCase();
    if (
      hrefSlug.includes(slug) ||
      (ctx.media.releaseYear && hrefSlug.includes(String(ctx.media.releaseYear)))
    ) {
      movieUrl = href;
    }
  });

  if (!movieUrl) throw new NotFoundError("Tugaflix: movie page not found");
  return scrapeTugaflixPage(ctx, movieUrl);
}

async function scrapeTugaflixShow(ctx: ShowScrapeContext): Promise<SourcererOutput> {
  const slug = normalizeTitle(ctx.media.title);
  const searchUrl = `${TUGAFLIX_BASE}/?s=${encodeURIComponent(ctx.media.title)}`;
  const searchRes = await ctx.proxiedFetcher.full(searchUrl, {
    headers: { Referer: TUGAFLIX_BASE },
  });
  const $ = cheerio.load(searchRes.body);

  let showUrl: string | undefined;
  $("article a[href]").each((_: any, el: any) => {
    if (showUrl) return;
    const href = $(el).attr("href") || "";
    if (href.toLowerCase().includes(slug)) showUrl = href;
  });

  if (!showUrl) throw new NotFoundError("Tugaflix: show page not found");

  const sNum = String(ctx.media.season.number).padStart(2, "0");
  const eNum = String(ctx.media.episode.number).padStart(2, "0");
  const episodeUrl = `${showUrl.replace(/\/$/, "")}/s${sNum}e${eNum}/`;

  return scrapeTugaflixPage(ctx, episodeUrl);
}

async function scrapeTugaflixPage(
  ctx: MovieScrapeContext | ShowScrapeContext,
  pageUrl: string,
): Promise<SourcererOutput> {
  const res = await ctx.proxiedFetcher.full(pageUrl, {
    headers: { Referer: TUGAFLIX_BASE },
  });
  const $ = cheerio.load(res.body);

  let streamtapeUrl: string | undefined;
  $("iframe[src]").each((_: any, el: any) => {
    const src = $(el).attr("src") || "";
    if (src.includes("streamtape") || src.includes("streamtp")) {
      streamtapeUrl = src.startsWith("//") ? `https:${src}` : src;
    }
  });

  if (!streamtapeUrl) throw new NotFoundError("Tugaflix: Streamtape embed not found");

  // Fetch the Streamtape embed page
  const stRes = await ctx.proxiedFetcher.full(streamtapeUrl, {
    headers: {
      Referer: pageUrl,
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/137.0.0.0 Safari/537.36",
    },
  });
  const stHtml = stRes.body as string;

  let getVideoPath: string | undefined;

  // Modern: two adjacent string literals joined with +
  const twoPartMatch = stHtml.match(
    /innerHTML\s*=\s*"([^"]+)"\s*\+\s*"([^"]+)"/
  );
  if (twoPartMatch) {
    getVideoPath = twoPartMatch[1] + twoPartMatch[2];
  }

  // Older robotlink pattern
  if (!getVideoPath) {
    const robotMatch = stHtml.match(
      /id="robotlink"[^>]*>([^<]+)<\/[^>]+>\s*<[^>]+>'\s*\+\s*'([^']+)'/s
    );
    if (robotMatch) {
      getVideoPath = robotMatch[1].trim() + robotMatch[2].trim();
    }
  }

  // Fallback: look for get_video path directly in script
  if (!getVideoPath) {
    const directMatch = stHtml.match(/(\/get_video\?[^"'\s&]+(?:&[^"'\s]+)*)/i);
    if (directMatch) {
      getVideoPath = directMatch[1];
    }
  }

  if (!getVideoPath) throw new NotFoundError("Tugaflix: could not extract Streamtape video path");

  const getVideoUrl = getVideoPath.startsWith("//")
    ? `https:${getVideoPath}`
    : getVideoPath.startsWith("/")
    ? `https://streamtape.com${getVideoPath}`
    : getVideoPath;

  const redirectRes = await ctx.proxiedFetcher.full(getVideoUrl, {
    headers: {
      Referer: "https://streamtape.com/",
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/137.0.0.0 Safari/537.36",
    },
  });
  const finalMp4 = redirectRes.finalUrl || getVideoUrl;

  return {
    embeds: [],
    stream: [
      {
        id: "primary",
        type: "file",
        qualities: {
          unknown: { type: "mp4", url: finalMp4 },
        },
        headers: {
          Referer: "https://streamtape.com/",
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/137.0.0.0 Safari/537.36",
        },
        flags: [],
        captions: [],
      },
    ],
  };
}

export const tugaflixScraper = makeSourcerer({
  id: "tugaflix-custom",
  name: "Tugaflix 🔥",
  rank: 830,
  flags: [],
  scrapeMovie: scrapeTugaflixMovie,
  scrapeShow: scrapeTugaflixShow,
});

// ─────────────────────────────────────────────────────────────────────────────
// FSOnline (rank 820) — Romanian site with Doodstream embeds
// ─────────────────────────────────────────────────────────────────────────────

const fsonlineOrigin = "https://www3.fsonline.app";
const fsonlineEmbedUrl = "https://www3.fsonline.app/wp-admin/admin-ajax.php";

async function scrapeDoodstream(ctx: any, url: string): Promise<any> {
  const response = await ctx.proxiedFetcher.full(url, {
    headers: {
      Referer: fsonlineOrigin,
      Origin: fsonlineOrigin,
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/137.0.0.0 Safari/537.36",
    },
  });
  const $ = cheerio.load(response.body);
  const streamHost = new URL(response.finalUrl).hostname;
  const scriptText = $("script")
    .map((_: any, s: any) => $(s).text())
    .get()
    .join("\n");

  const streamReq = scriptText.match(/\$\.get\('(\/pass_md5\/.+?)'/)?.[1];
  const tokenParams =
    scriptText.match(/\?\s*(token=[^&'"\s]+(?:&[^'"\s]+)*)/)?.[1] ||
    scriptText.match(/\+ "\?(token=.+?)"/)?.[1];

  if (!streamReq) {
    const directUrl = scriptText.match(
      /(https?:\/\/[a-z0-9]+\.(?:cloudatacdn|doods|doodcdn)\.com\/[^'"\s]+)/i
    )?.[1];
    if (directUrl) {
      return {
        type: "file",
        id: "primary",
        flags: [],
        captions: [],
        qualities: { unknown: { type: "mp4", url: directUrl } },
        headers: {
          Referer: `https://${streamHost}/`,
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/137.0.0.0 Safari/537.36",
        },
      };
    }
    return null;
  }

  const streamKey = Math.random().toString(36).substring(2, 12);
  const finalToken = tokenParams
    ? `${streamKey}?${tokenParams}${Date.now()}`
    : streamKey;

  const streamResponse = await ctx.proxiedFetcher.full(
    `https://${streamHost}${streamReq}`,
    {
      headers: {
        "X-Requested-With": "XMLHttpRequest",
        Referer: response.finalUrl,
        Origin: fsonlineOrigin,
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/137.0.0.0 Safari/537.36",
      },
    },
  );

  const streamUrl = (streamResponse.body as string).trim() + finalToken;
  return {
    type: "file",
    id: "primary",
    flags: [],
    captions: [],
    qualities: { unknown: { type: "mp4", url: streamUrl } },
    headers: {
      Referer: `https://${streamHost}/`,
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/137.0.0.0 Safari/537.36",
    },
  };
}

export const fsonlineScraper = makeSourcerer({
  id: "fsonline-custom",
  name: "FSOnline",
  rank: 820,
  flags: [],
  scrapeMovie: async (ctx: MovieScrapeContext) => {
    const movieUrl = `https://www3.fsonline.app/film/${slugify(ctx.media.title, { lower: true, strict: true })}/`;
    const response = await ctx.proxiedFetcher.full(movieUrl, {
      headers: { Referer: fsonlineOrigin, Origin: fsonlineOrigin },
    });
    const $ = cheerio.load(response.body);
    const movieId = $("#show_player_lazy").attr("movie-id");
    if (!movieId) throw new NotFoundError("Movie ID not found");

    const sourcesRes = await ctx.proxiedFetcher.full(fsonlineEmbedUrl, {
      method: "POST",
      headers: {
        "X-Requested-With": "XMLHttpRequest",
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
        Referer: movieUrl,
        Origin: fsonlineOrigin,
      },
      body: `action=lazy_player&movieID=${movieId}`,
    });

    const $sources = cheerio.load(sourcesRes.body);
    const embeds: any[] = [];
    $sources("li.dooplay_player_option").each((_: any, el: any) => {
      const embedUrl = $sources(el).attr("data-vs");
      if (embedUrl) embeds.push({ embedId: "fsonline-doodstream-custom", url: embedUrl });
    });

    if (embeds.length === 0) throw new NotFoundError("FSOnline: no embeds found");
    return { embeds };
  },
  scrapeShow: async (ctx: ShowScrapeContext) => {
    const showUrl = `https://www3.fsonline.app/episoade/${slugify(ctx.media.title, { lower: true, strict: true })}-sezonul-${ctx.media.season.number}-episodul-${ctx.media.episode.number}/`;
    const response = await ctx.proxiedFetcher.full(showUrl, {
      headers: { Referer: fsonlineOrigin, Origin: fsonlineOrigin },
    });
    const $ = cheerio.load(response.body);
    const movieId = $("#show_player_lazy").attr("movie-id");
    if (!movieId) throw new NotFoundError("Episode ID not found");

    const sourcesRes = await ctx.proxiedFetcher.full(fsonlineEmbedUrl, {
      method: "POST",
      headers: {
        "X-Requested-With": "XMLHttpRequest",
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
        Referer: showUrl,
        Origin: fsonlineOrigin,
      },
      body: `action=lazy_player&movieID=${movieId}`,
    });

    const $sources = cheerio.load(sourcesRes.body);
    const embeds: any[] = [];
    $sources("li.dooplay_player_option").each((_: any, el: any) => {
      const embedUrl = $sources(el).attr("data-vs");
      if (embedUrl) embeds.push({ embedId: "fsonline-doodstream-custom", url: embedUrl });
    });

    if (embeds.length === 0) throw new NotFoundError("FSOnline: no episode embeds found");
    return { embeds };
  },
});

export const fsonlineDoodstreamEmbed = makeEmbed({
  id: "fsonline-doodstream-custom",
  name: "FSOnline Doodstream",
  rank: 801,
  flags: [],
  scrape: async (ctx: EmbedScrapeContext) => {
    const stream = await scrapeDoodstream(ctx, ctx.url);
    if (!stream) throw new NotFoundError("Stream not found");
    return { stream: [stream] };
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// Removed / Stub scrapers — kept as null to avoid import errors
// ─────────────────────────────────────────────────────────────────────────────

// YesMovies removed — API defunct
export const yesmoviesScraper = null as any;

// VidNest removed — iframe-only, no real stream extraction
export const vidnestScraper = null as any;
export const vidnestEmbeds: any[] = [];

// ─────────────────────────────────────────────────────────────────────────────
// MiruroAPI Anime Provider (rank 950)
// ─────────────────────────────────────────────────────────────────────────────

const MIRURO_API_BASE = "http://localhost:3000/api";

async function scrapeMiruro(
  ctx: MovieScrapeContext | ShowScrapeContext,
): Promise<SourcererOutput> {
  const isMovie = ctx.media.type === "movie";
  const title = ctx.media.title;

  ctx.progress(10);
  // Search for the anime on MiruroAPI
  const searchUrl = `${MIRURO_API_BASE}/search`;
  const searchResult = await ctx.proxiedFetcher<any>(searchUrl, {
    method: "GET",
    query: { query: title },
  });

  if (!searchResult?.success || !Array.isArray(searchResult?.results) || searchResult.results.length === 0) {
    throw new NotFoundError("MiruroAPI: no search results for title: " + title);
  }

  ctx.progress(30);

  // Simple title similarity matching
  const normalizedTargetTitle = normalizeTitle(title);
  let bestMatch = searchResult.results.find((item: any) => {
    const titles = [
      item.title?.english,
      item.title?.romaji,
      item.title?.userPreferred,
    ].filter(Boolean);
    return titles.some((t) => normalizeTitle(t) === normalizedTargetTitle);
  });

  // Fallback to the first result
  if (!bestMatch && searchResult.results.length > 0) {
    bestMatch = searchResult.results[0];
  }

  if (!bestMatch) {
    throw new NotFoundError("MiruroAPI: anime matching not found");
  }

  const anilistId = bestMatch.id;
  ctx.progress(50);

  // Fetch episodes for the matching AniList ID
  const episodesUrl = `${MIRURO_API_BASE}/episodes/${anilistId}`;
  const episodesResult = await ctx.proxiedFetcher<any>(episodesUrl);
  if (!episodesResult?.success || !Array.isArray(episodesResult?.results) || episodesResult.results.length === 0) {
    throw new NotFoundError("MiruroAPI: no episodes found for ID: " + anilistId);
  }

  ctx.progress(70);

  // Match the episode number
  const targetEpisodeNum = isMovie ? 1 : (ctx as ShowScrapeContext).media.episode.number;
  const matchedEpisode = episodesResult.results.find((ep: any) => ep.number === targetEpisodeNum);
  if (!matchedEpisode) {
    throw new NotFoundError(`MiruroAPI: episode ${targetEpisodeNum} not found`);
  }

  const providers = matchedEpisode.providers || {};
  const providerNames = Object.keys(providers);
  if (providerNames.length === 0) {
    throw new NotFoundError("MiruroAPI: no streaming providers available for episode");
  }

  // Preferred order of providers
  const preferredProviders = ["kiwi", "bonk", "pewe", "bee", "ally"];
  const sortedProviders = providerNames.sort((a, b) => {
    const indexA = preferredProviders.indexOf(a);
    const indexB = preferredProviders.indexOf(b);
    if (indexA === -1 && indexB === -1) return 0;
    if (indexA === -1) return 1;
    if (indexB === -1) return -1;
    return indexA - indexB;
  });

  // Try each provider until we successfully fetch stream URLs
  for (const provider of sortedProviders) {
    const subCategories = providers[provider] || {};
    const category = subCategories.sub ? "sub" : subCategories.dub ? "dub" : null;
    if (!category) continue;

    const slug = subCategories[category];
    if (!slug) continue;

    // Fetch watch sources from the provider
    const watchUrl = `${MIRURO_API_BASE}/watch/${provider}/${anilistId}/${category}/${slug}`;
    try {
      const watchResult = await ctx.proxiedFetcher<any>(watchUrl);
      if (watchResult?.success && Array.isArray(watchResult?.results?.sources) && watchResult.results.sources.length > 0) {
        ctx.progress(90);
        const streams = watchResult.results.sources.map((s: any, idx: number) => {
          const referer = s.referer || "https://kwik.cx/";
          // Wrap with MiruroAPI local proxy
          const proxiedUrl = `${MIRURO_API_BASE}/proxy?url=${encodeURIComponent(s.url)}&referer=${encodeURIComponent(referer)}`;

          if (s.isM3U8 || s.url.includes(".m3u8")) {
            return {
              id: `${provider}-${idx}`,
              type: "hls",
              playlist: proxiedUrl,
              headers: {
                Referer: referer,
                "User-Agent":
                  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36",
              },
              flags: [],
              captions: [],
            };
          } else {
            return {
              id: `${provider}-${idx}`,
              type: "file",
              qualities: {
                [s.quality || "default"]: {
                  type: "mp4",
                  url: proxiedUrl,
                },
              },
              headers: {
                Referer: referer,
                "User-Agent":
                  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36",
              },
              flags: [],
              captions: [],
            };
          }
        });

        if (streams.length > 0) {
          ctx.progress(100);
          return {
            embeds: [],
            stream: streams,
          };
        }
      }
    } catch {
      // Continue to next provider
    }
  }

  throw new NotFoundError("MiruroAPI: no working streams found across providers");
}

export const miruroApiScraper = makeSourcerer({
  id: "miruroapi-custom",
  name: "MiruroAPI 🌸",
  rank: 950,
  disabled: false,
  flags: [],
  scrapeMovie: scrapeMiruro,
  scrapeShow: scrapeMiruro,
});
