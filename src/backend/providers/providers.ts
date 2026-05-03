import {
  buildProviders,
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
  fsonlineDoodstreamEmbed,
  fsonlineScraper,
  vidlinkScraper,
  vidnestEmbeds,
  vidnestScraper,
  vidrockScraper,
  yesmoviesScraper,
  zeticuzApiScraper,
} from "@/backend/providers/custom";

// Initialize M3U8 proxy on module load
setupM3U8Proxy();

/**
 * Patch builtin provider names so we can add emojis without touching the package.
 * Called after .build() or on getCachedMetadata() results.
 */
const PROVIDER_NAME_PATCHES: Record<string, string> = {
  tugaflix: "Tugaflix 🔥",
  // Add more overrides here if needed
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
  const builder = buildProviders()
    .setFetcher(makeStandardFetcher(fetch))
    .addBuiltinProviders()
    // === CUSTOM SOURCES (ordered by rank — higher rank = tried first) ===
    // VidLink 🔥  rank: 900 (highest = first)
    .addSource(vidlinkScraper)
    // ZeticuzApi 🔥  rank: 890
    .addSource(zeticuzApiScraper)
    // FebBox 4K is injected separately via useProviderScrape (rank: 880)
    // Tugaflix 🔥 — handled via builtin with name patch (rank: ~806)
    // FSOnline  rank: 802
    .addSource(fsonlineScraper)
    // VidNest  rank: 800
    .addSource(vidnestScraper)
    // YesMovies  rank: 799
    .addSource(yesmoviesScraper)
    // VidRock  rank: 798
    .addSource(vidrockScraper)
    .addEmbed(fsonlineDoodstreamEmbed);

  vidnestEmbeds.forEach((embed) => builder.addEmbed(embed));

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

/**
 * Returns cached metadata with patched names (Tugaflix 🔥 etc.)
 * Use this instead of getCachedMetadata() from @p-stream/providers directly.
 */
export { patchProviderNames };
