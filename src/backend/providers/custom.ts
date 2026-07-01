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

// ─────────────────────────────────────────────────────────────────────────────
// VidLink 🔥 (rank 895) — DO NOT EDIT
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
  const response = await ctx.proxiedFetcher<{ result: string }>(
    `${API_BASE}/enc-vidlink`,
    { method: "GET", query: { text: tmdbId } },
  );
  if (!response?.result) throw new NotFoundError("Failed to encrypt TMDB ID");
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

  const vidlinkRaw = await ctx.proxiedFetcher<any>(apiUrl, { headers: vidlinkHeaders });
  if (!vidlinkRaw) throw new NotFoundError("No response from vidlink API");
  ctx.progress(60);
  const vidlinkData = typeof vidlinkRaw === "string" ? JSON.parse(vidlinkRaw) : vidlinkRaw;
  ctx.progress(80);
  if (!vidlinkData.stream) throw new NotFoundError("No stream data");

  const { stream } = vidlinkData;
  const captions: any[] = (stream.captions || []).map((c: any) => ({
    id: c.id || c.url,
    url: c.url,
    language: c.language || "Unknown",
    type: c.type === "srt" ? "srt" : "vtt",
    hasCorsRestrictions: c.hasCorsRestrictions || false,
  }));

  return {
    embeds: [],
    stream: [
      {
        id: stream.id || "primary",
        type: stream.type || "file",
        qualities: stream.qualities || {},
        playlist: stream.playlist,
        captions,
        flags: [],
        headers: stream.headers || vidlinkHeaders,
      },
    ],
  };
}

export const vidlinkScraper = makeSourcerer({
  id: "vidlink-custom",
  name: "VidLink \uD83D\uDD25",
  rank: 895,
  disabled: false,
  flags: [],
  scrapeMovie: vidlinkComboScraper,
  scrapeShow: vidlinkComboScraper,
});

// ─────────────────────────────────────────────────────────────────────────────
// Removed providers: FebBox, ZeticuzApi, Tugaflix, MiruroAPI, VidRock, FSOnline
// ─────────────────────────────────────────────────────────────────────────────

export const febboxScraper = null as any;
export const zeticuzApiScraper = null as any;
export const tugaflixScraper = null as any;
export const miruroApiScraper = null as any;
export const vidrockScraper = null as any;
export const fsonlineScraper = null as any;
export const fsonlineDoodstreamEmbed = null as any;

// Stubs for removed scrapers
export const zetAnimeScraper = null as any;
export const allAnimeScraper = null as any;
export const animekaiEmbed = null as any;
export const animekaiScraper = null as any;
export const watchanimeworldScraper = null as any;
export const rgshowsScraper = null as any;
export const yesmoviesScraper = null as any;
export const vidnestScraper = null as any;
export const vidnestEmbeds: any[] = [];