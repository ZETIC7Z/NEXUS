/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  buildProviders,
  getBuiltinEmbeds,
  getBuiltinSources,
  makeStandardFetcher,
  targets,
} from "@p-stream/providers";

import { isExtensionActiveCached } from "@/backend/extension/messaging";
import {
  makeExtensionFetcher,
  makeLoadBalancedSimpleProxyFetcher,
  setupM3U8Proxy,
} from "@/backend/providers/fetchers";
import {
  miruroApiScraper,
  tugaflixScraper,
  vidlinkScraper,
} from "@/backend/providers/custom";
import { cineproCoreScraper } from "@/backend/providers/cinepro-core";

// Initialize M3U8 proxy on module load
setupM3U8Proxy();

/**
 * Patch builtin provider names so we can add emojis without touching the package.
 */
const PROVIDER_NAME_PATCHES: Record<string, string> = {
  tugaflix: "Tugaflix 🔥",
  "tugaflix-custom": "Tugaflix 🔥",
  "vidlink-custom": "VidLink 🔥",
  lookmovie: "LookMovies",
};

function patchProviderNames<T extends { id: string; name: string }[]>(
  providers: T,
): T {
  providers.forEach((p) => {
    if (PROVIDER_NAME_PATCHES[p.id]) {
      p.name = PROVIDER_NAME_PATCHES[p.id];
    }
  });
  return providers;
}

function buildBase() {
  const builder = buildProviders().setFetcher(makeStandardFetcher(fetch));

  // Add CinePro Core 🎬 rank: 950 (highest priority)
  const cineprocore = { ...cineproCoreScraper, rank: 950 };
  builder.addSource(cineprocore as any);

  // Add MiruroAPI 🌸 rank: 940
  const miruroapi = { ...miruroApiScraper, rank: 940 };
  builder.addSource(miruroapi as any);

  // Add our custom sources with patched ranks:

  // 1. VidLink 🔥  rank: 890
  const vidlink = { ...vidlinkScraper, rank: 890 };
  builder.addSource(vidlink as any);

  // 2. Tugaflix 🔥  rank: 860
  const tugaflix = { ...tugaflixScraper, rank: 860 };
  builder.addSource(tugaflix as any);

  // Add all built-in sources from p-stream providers package (avoiding duplicates)
  const builtinSources = getBuiltinSources();
  const customIds = ["vidlink", "vidlink-custom", "tugaflix", "tugaflix-custom", "miruroapi-custom", "cinepro-core"];
  builtinSources.forEach((source) => {
    if (!customIds.includes(source.id)) {
      builder.addSource(source);
    }
  });

  // Add all built-in embeds so any embed results resolve correctly
  const builtinEmbeds = getBuiltinEmbeds();
  builtinEmbeds.forEach((embed) => {
    builder.addEmbed(embed);
  });

  return builder;
}

export function getProviders() {
  const builder = buildBase();

  if (isExtensionActiveCached()) {
    return builder
      .setProxiedFetcher(makeExtensionFetcher())
      .setTarget(targets.BROWSER_EXTENSION)
      .enableConsistentIpForRequests()
      .build();
  }

  setupM3U8Proxy();

  return builder
    .setProxiedFetcher(makeLoadBalancedSimpleProxyFetcher())
    .setTarget(targets.BROWSER)
    .build();
}

export function getAllProviders() {
  return buildBase()
    .setTarget(targets.BROWSER_EXTENSION)
    .enableConsistentIpForRequests()
    .build();
}

export { patchProviderNames };
