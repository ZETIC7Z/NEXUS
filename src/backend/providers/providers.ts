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
import { vidlinkScraper } from "@/backend/providers/custom";
import { zeticuzScrapers } from "@/backend/providers/zeticuz-provider";

// Initialize M3U8 proxy on module load
setupM3U8Proxy();

const zeticuzIds = zeticuzScrapers.map((s) => s.id);

/**
 * Patch builtin provider names so we can add emojis without touching the package.
 * true source name VidLink 🔥 / Alias use for this site: Abyss
 * true source name LookMovies 🔥 / Alias use for this site: Apex
 */
const PROVIDER_NAME_PATCHES: Record<string, string> = {
  "vidlink-custom": "Abyss 🔥",
  lookmovie: "Apex 🔥",
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

function buildBase(includeExtensionSources: boolean) {
  const builder = buildProviders().setFetcher(makeStandardFetcher(fetch));

  // Add each ZETICUZ provider as its own selectable source.
  // They share a response cache inside zeticuz-provider.ts so the backend is only
  // called once per media even though every provider is registered separately.
  // Ranks must be unique, so decrement by 1 for each provider.
  zeticuzScrapers.forEach((scraper, index) => {
    builder.addSource({ ...scraper, rank: 950 - index } as any);
  });

  if (includeExtensionSources) {
    // Abyss (VidLink) 🔥 rank: 890 — requires browser extension
    const vidlink = { ...vidlinkScraper, rank: 890 };
    builder.addSource(vidlink as any);

    // Apex (LookMovies) 🔥 — only available with the browser extension/app path.
    const builtinSources = getBuiltinSources();
    patchProviderNames(builtinSources);
    const activeBuiltinIds = new Set(["lookmovie"]);
    const customIds = new Set(["vidlink", "vidlink-custom", ...zeticuzIds]);
    builtinSources.forEach((source) => {
      if (activeBuiltinIds.has(source.id) && !customIds.has(source.id)) {
        builder.addSource(source);
      }
    });
  }

  // Add all built-in embeds so any embed results resolve correctly
  const builtinEmbeds = getBuiltinEmbeds();
  builtinEmbeds.forEach((embed) => {
    builder.addEmbed(embed);
  });

  return builder;
}

export function getProviders() {
  const extensionActive = isExtensionActiveCached();
  const builder = buildBase(extensionActive);

  if (extensionActive) {
    return builder
      .setProxiedFetcher(makeExtensionFetcher())
      .setTarget(targets.BROWSER_EXTENSION)
      .enableConsistentIpForRequests()
      .build();
  }

  setupM3U8Proxy();

  // Default setup: ZETICUZ sources are always available even without the
  // extension. We use the extension target so sources without the CORS_ALLOWED
  // flag are still selectable; streams are still proxied through
  // the configured M3U8 proxy.
  return builder
    .setProxiedFetcher(makeLoadBalancedSimpleProxyFetcher())
    .setTarget(targets.BROWSER_EXTENSION)
    .enableConsistentIpForRequests()
    .build();
}

export function getAllProviders() {
  return buildBase(true)
    .setTarget(targets.BROWSER_EXTENSION)
    .enableConsistentIpForRequests()
    .build();
}

export function getProviderDisplayName(id: string): string {
  if (PROVIDER_NAME_PATCHES[id]) return PROVIDER_NAME_PATCHES[id];
  const zeticuz = zeticuzScrapers.find((p) => p.id === id);
  if (zeticuz) return zeticuz.name;
  return id;
}

export function getSourceSortOrder(
  customOrder?: string[],
  enableCustom?: boolean,
): string[] {
  const allSources = getAllProviders().listSources();
  const sourceIDs = allSources.map((s) => s.id);

  if (enableCustom && customOrder && customOrder.length > 0) {
    const updated = customOrder.filter((id) => sourceIDs.includes(id));
    const missing = sourceIDs.filter((id) => !customOrder.includes(id));
    return [...updated, ...missing];
  }

  // Default order: Abyss first, Apex second, rest alphabetical by display name
  const patched = allSources.map((s) => {
    let displayName = s.name;
    if (PROVIDER_NAME_PATCHES[s.id]) {
      displayName = PROVIDER_NAME_PATCHES[s.id];
    } else {
      const zeticuz = zeticuzScrapers.find((p) => p.id === s.id);
      if (zeticuz) displayName = zeticuz.name;
    }
    return { id: s.id, name: displayName };
  });

  const abyss = patched.find((s) => s.id === "vidlink-custom" || s.id === "vidlink");
  const apex = patched.find((s) => s.id === "lookmovie");

  const rest = patched.filter(
    (s) => s.id !== "vidlink-custom" && s.id !== "vidlink" && s.id !== "lookmovie"
  );
  rest.sort((a, b) => a.name.localeCompare(b.name));

  const sortedList: string[] = [];
  if (abyss) sortedList.push(abyss.id);
  if (apex) sortedList.push(apex.id);
  sortedList.push(...rest.map((s) => s.id));

  return sortedList;
}

export { patchProviderNames };
export { zeticuzIds };
