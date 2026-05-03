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
  tugaflixScraper,
  vidlinkScraper,
  vidnestEmbeds,
  vidnestScraper,
  vidrockScraper,
  yesmoviesScraper,
  zeticuzApiScraper,
} from "@/backend/providers/custom";

// Initialize M3U8 proxy on module load
setupM3U8Proxy();

function buildBase() {
  const builder = buildProviders()
    .setFetcher(makeStandardFetcher(fetch))
    .addBuiltinProviders()
    .addSource(vidlinkScraper)
    .addSource(zeticuzApiScraper)
    .addSource(fsonlineScraper)
    .addSource(vidnestScraper)
    .addSource(yesmoviesScraper)
    .addSource(vidrockScraper)
    .addSource(tugaflixScraper)
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
