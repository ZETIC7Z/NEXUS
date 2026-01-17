/**
 * Embed API Sources
 * Uses various embed APIs to get streaming links
 *
 * Sources:
 * - Vidsrc.xyz (2embed)
 * - Vidsrc.pro
 * - Vidsrc.me
 * - Embedsu
 * - Autoembed
 */

export interface EmbedSource {
  id: string;
  name: string;
  type: "iframe" | "hls" | "mp4";
  url: string;
}

// Embed provider base URLs
const EMBED_PROVIDERS = {
  vidsrcXyz: "https://vidsrc.xyz/embed",
  vidsrcPro: "https://vidsrc.pro/embed",
  vidsrcMe: "https://vidsrc.me/embed",
  embedsu: "https://embedsu.com/embed",
  autoembed: "https://player.autoembed.cc/embed",
  superembed: "https://multiembed.mov/directstream.php",
  twoembed: "https://2embed.cc/embed",
  smashystream: "https://player.smashy.stream",
};

/**
 * Get embed URLs for a movie
 */
export function getMovieEmbedUrls(tmdbId: string): EmbedSource[] {
  return [
    {
      id: "vidsrc-xyz",
      name: "VidSrc XYZ",
      type: "iframe",
      url: `${EMBED_PROVIDERS.vidsrcXyz}/movie/${tmdbId}`,
    },
    {
      id: "vidsrc-pro",
      name: "VidSrc Pro",
      type: "iframe",
      url: `${EMBED_PROVIDERS.vidsrcPro}/movie/${tmdbId}`,
    },
    {
      id: "vidsrc-me",
      name: "VidSrc Me",
      type: "iframe",
      url: `${EMBED_PROVIDERS.vidsrcMe}/movie/${tmdbId}`,
    },
    {
      id: "embedsu",
      name: "Embedsu",
      type: "iframe",
      url: `${EMBED_PROVIDERS.embedsu}/movie/${tmdbId}`,
    },
    {
      id: "autoembed",
      name: "AutoEmbed",
      type: "iframe",
      url: `${EMBED_PROVIDERS.autoembed}/movie/${tmdbId}`,
    },
    {
      id: "superembed",
      name: "SuperEmbed",
      type: "iframe",
      url: `${EMBED_PROVIDERS.superembed}?video_id=${tmdbId}&tmdb=1`,
    },
    {
      id: "2embed",
      name: "2Embed",
      type: "iframe",
      url: `${EMBED_PROVIDERS.twoembed}/${tmdbId}`,
    },
    {
      id: "smashystream",
      name: "SmashyStream",
      type: "iframe",
      url: `${EMBED_PROVIDERS.smashystream}/movie/${tmdbId}`,
    },
  ];
}

/**
 * Get embed URLs for a TV episode
 */
export function getTVEmbedUrls(
  tmdbId: string,
  season: number,
  episode: number,
): EmbedSource[] {
  return [
    {
      id: "vidsrc-xyz",
      name: "VidSrc XYZ",
      type: "iframe",
      url: `${EMBED_PROVIDERS.vidsrcXyz}/tv/${tmdbId}/${season}/${episode}`,
    },
    {
      id: "vidsrc-pro",
      name: "VidSrc Pro",
      type: "iframe",
      url: `${EMBED_PROVIDERS.vidsrcPro}/tv/${tmdbId}/${season}/${episode}`,
    },
    {
      id: "vidsrc-me",
      name: "VidSrc Me",
      type: "iframe",
      url: `${EMBED_PROVIDERS.vidsrcMe}/tv/${tmdbId}/${season}-${episode}`,
    },
    {
      id: "embedsu",
      name: "Embedsu",
      type: "iframe",
      url: `${EMBED_PROVIDERS.embedsu}/tv/${tmdbId}/${season}/${episode}`,
    },
    {
      id: "autoembed",
      name: "AutoEmbed",
      type: "iframe",
      url: `${EMBED_PROVIDERS.autoembed}/tv/${tmdbId}/${season}/${episode}`,
    },
    {
      id: "superembed",
      name: "SuperEmbed",
      type: "iframe",
      url: `${EMBED_PROVIDERS.superembed}?video_id=${tmdbId}&tmdb=1&s=${season}&e=${episode}`,
    },
    {
      id: "2embed",
      name: "2Embed",
      type: "iframe",
      url: `${EMBED_PROVIDERS.twoembed}/${tmdbId}/${season}/${episode}`,
    },
    {
      id: "smashystream",
      name: "SmashyStream",
      type: "iframe",
      url: `${EMBED_PROVIDERS.smashystream}/tv/${tmdbId}?s=${season}&e=${episode}`,
    },
  ];
}
