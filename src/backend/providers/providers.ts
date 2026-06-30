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
  febboxScraper,
  miruroApiScraper,
  tugaflixScraper,
  vidlinkScraper,
  zeticuzApiScraper,
} from "@/backend/providers/custom";

// Initialize M3U8 proxy on module load
setupM3U8Proxy();

/**
 * Patch builtin provider names so we can add emojis without touching the package.
 */
const PROVIDER_NAME_PATCHES: Record<string, string> = {
  tugaflix: "Tugaflix 🔥",
  "tugaflix-custom": "Tugaflix 🔥",
  "vidlink-custom": "VidLink 🔥",
  "zeticuzapi-custom": "ZeticuzApi 🔥",
  febbox: "FebBox 4K ⭐",
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

  // Add MiruroAPI 🌸 rank: 950
  const miruroapi = { ...miruroApiScraper, rank: 950 };
  builder.addSource(miruroapi as any);

  // Add our specific 5 custom sources with patched ranks:

  // 1. FebBox 4K ⭐  rank: 900 (tried first)
  const febbox = { ...febboxScraper, rank: 900 };
  builder.addSource(febbox as any);

  // 2. VidLink 🔥  rank: 890
  const vidlink = { ...vidlinkScraper, rank: 890 };
  builder.addSource(vidlink as any);

  // 3. ZeticuzApi 🔥  rank: 870
  const zeticuzapi = { ...zeticuzApiScraper, rank: 870 };
  builder.addSource(zeticuzapi as any);

  // 4. Tugaflix 🔥  rank: 860
  const tugaflix = { ...tugaflixScraper, rank: 860 };
  builder.addSource(tugaflix as any);

  // Add all built-in sources from p-stream providers package (avoiding duplicates)
  const builtinSources = getBuiltinSources();
  const customIds = ["febbox", "vidlink-custom", "zeticuzapi-custom", "tugaflix-custom", "miruroapi-custom"];
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
