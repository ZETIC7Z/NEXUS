import {
  buildProviders,
  makeStandardFetcher,
  targets,
} from "@nexus/providers";

import { isExtensionActiveCached } from "@/backend/extension/messaging";
import { makeExtensionFetcher } from "@/backend/providers/fetchers";
import {
  nexusCustomProviders,
  nexusCustomEmbeds,
  NEXUS_PROVIDER_CATALOG,
} from "@/providers/nexus-providers-index";

function isDesktopApp(): boolean {
  return Boolean(typeof window !== "undefined" && (window as any).__NEXUS_DESKTOP__);
}

export function getProviders() {
  const builder = buildProviders();

  // Desktop app has extension built in and can play MKV; use NATIVE target.
  if (isDesktopApp()) {
    builder
      .setFetcher(makeStandardFetcher(fetch))
      .setProxiedFetcher(makeExtensionFetcher())
      .setTarget(targets.NATIVE)
      .enableConsistentIpForRequests();
  } else if (isExtensionActiveCached()) {
    builder
      .setFetcher(makeStandardFetcher(fetch))
      .setProxiedFetcher(makeExtensionFetcher())
      .setTarget(targets.BROWSER_EXTENSION)
      .enableConsistentIpForRequests();
  } else {
    // The HF provider returns browser-ready URLs. Keep the normal fetcher
    // available to provider code, but do not install a destination proxy.
    builder
      .setFetcher(makeStandardFetcher(fetch))
      .setProxiedFetcher(makeStandardFetcher(fetch))
      .setTarget(targets.BROWSER)
      .enableConsistentIpForRequests();
  }

  for (const provider of nexusCustomProviders) {
    builder.addSource(provider as any);
  }
  for (const embed of nexusCustomEmbeds) {
    builder.addEmbed(embed as any);
  }

  return builder.build();
}

export function getAllProviders() {
  const builder = buildProviders()
    .setFetcher(makeStandardFetcher(fetch))
    .setProxiedFetcher(makeStandardFetcher(fetch))
    .setTarget(targets.BROWSER)
    .enableConsistentIpForRequests();

  for (const provider of nexusCustomProviders) {
    builder.addSource(provider as any);
  }
  for (const embed of nexusCustomEmbeds) {
    builder.addEmbed(embed as any);
  }

  return builder.build();
}

/** Display name for a provider id, resolving the nexus catalog first. */
export function getProviderDisplayName(id: string): string {
  const slug = id.replace(/^nexus-/, "");
  const def = NEXUS_PROVIDER_CATALOG.find((p) => p.id === slug);
  if (def) return def.name;
  return id;
}

/** Every playable custom provider id (prefixed with `nexus-`). */
export const zeticuzIds = NEXUS_PROVIDER_CATALOG.filter((p) => p.playable).map(
  (p) => `nexus-${p.id}`,
);

export function patchProviderNames<T extends { id: string; name: string }[]>(
  providers: T,
): T {
  return providers;
}

export function getSourceSortOrder(
  customOrder?: string[],
  enableCustom?: boolean,
): string[] {
  const allSources: { id: string; name: string }[] = getAllProviders().listSources() as any;
  const sourceIDs = allSources.map((s) => s.id);

  if (enableCustom && customOrder && customOrder.length > 0) {
    const updated = customOrder.filter((id) => sourceIDs.includes(id));
    const missing = sourceIDs.filter((id) => !customOrder.includes(id));
    return [...updated, ...missing];
  }

  // Default order: playable nexus providers by catalog rank (desc), then the rest.
  const patched = allSources.map((s: { id: string; name: string }) => {
    const slug = s.id.replace(/^nexus-/, "");
    const def = NEXUS_PROVIDER_CATALOG.find((p: { id: string }) => p.id === slug);
    return { id: s.id, name: def?.name ?? s.name, rank: def?.rank ?? 0 };
  });
  patched.sort((a: { rank: number; name: string }, b: { rank: number; name: string }) => b.rank - a.rank || a.name.localeCompare(b.name));
  return patched.map((s: { id: string }) => s.id);
}
