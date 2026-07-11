/* eslint-disable react/forbid-dom-props */
import { ScrapeMedia } from "@p-stream/providers";
import React, { ReactNode, useEffect, useMemo, useRef } from "react";
import { useTranslation } from "react-i18next";

import { getCachedMetadata } from "@/backend/helpers/providerApi";
import { zeticuzScrapers, getActiveZeticuzProviders } from "@/backend/providers/zeticuz-provider";
import { getSourceSortOrder } from "@/backend/providers/providers";
import { Loading } from "@/components/layout/Loading";
import {
  useEmbedScraping,
  useSourceScraping,
} from "@/components/player/hooks/useSourceSelection";
import { Menu } from "@/components/player/internals/ContextMenu";
import { SelectableLink } from "@/components/player/internals/ContextMenu/Links";
import { usePlayerStore } from "@/stores/player/store";
import { getMediaKey } from "@/stores/player/slices/source";
import { usePreferencesStore } from "@/stores/preferences";

// Embed option component
function EmbedOption(props: {
  embedId: string;
  url: string;
  sourceId: string;
  routerId: string;
}) {
  const { t } = useTranslation();
  const unknownEmbedName = t("player.menus.sources.unknownOption");

  const embedName = useMemo(() => {
    if (!props.embedId) return unknownEmbedName;
    const sourceMeta = getCachedMetadata().find((s) => s.id === props.embedId);
    return sourceMeta?.name ?? unknownEmbedName;
  }, [props.embedId, unknownEmbedName]);

  const { run, errored, loading, notFound } = useEmbedScraping(
    props.routerId,
    props.sourceId,
    props.url,
    props.embedId,
  );

  let rightSide;
  if (loading) {
    rightSide = undefined; // Let SelectableLink handle loading
  } else if (notFound) {
    rightSide = (
      <div className="flex items-center text-video-scraping-noresult">
        <div className="w-4 h-4 rounded-full border-2 border-current bg-current flex items-center justify-center">
          <div className="w-2 h-0.5 bg-background-main rounded-full" />
        </div>
      </div>
    );
  }

  return (
    <SelectableLink
      loading={loading}
      error={errored && !notFound}
      onClick={run}
      rightSide={rightSide}
    >
      <span className="flex flex-col">
        <span>{embedName}</span>
      </span>
    </SelectableLink>
  );
}

// Embed selection view (when a source is selected)
function EmbedSelectionView(props: {
  sourceId: string;
  routerId: string;
  onBack: () => void;
}) {
  const { t } = useTranslation();
  const { run, notfound, loading, items, errored } = useSourceScraping(
    props.sourceId,
    props.routerId,
  );

  const sourceName = useMemo(() => {
    if (!props.sourceId) return "...";
    const sourceMeta = getCachedMetadata().find((s) => s.id === props.sourceId);
    return sourceMeta?.name ?? "...";
  }, [props.sourceId]);

  const lastSourceId = useRef<string | null>(null);
  useEffect(() => {
    if (lastSourceId.current === props.sourceId) return;
    lastSourceId.current = props.sourceId;
    if (!props.sourceId) return;
    run();
  }, [run, props.sourceId]);

  let content: ReactNode = null;
  if (loading)
    content = (
      <Menu.TextDisplay noIcon>
        <Loading />
      </Menu.TextDisplay>
    );
  else if (notfound)
    content = (
      <Menu.TextDisplay
        title={t("player.menus.sources.noStream.title") ?? undefined}
      >
        {t("player.menus.sources.noStream.text")}
      </Menu.TextDisplay>
    );
  else if (items?.length === 0)
    content = (
      <Menu.TextDisplay
        title={t("player.menus.sources.noEmbeds.title") ?? undefined}
      >
        {t("player.menus.sources.noEmbeds.text")}
      </Menu.TextDisplay>
    );
  else if (errored)
    content = (
      <Menu.TextDisplay
        title={t("player.menus.sources.failed.title") ?? undefined}
      >
        {t("player.menus.sources.failed.text")}
      </Menu.TextDisplay>
    );
  else if (items && props.sourceId)
    content = items.map((v) => (
      <EmbedOption
        key={`${v.embedId}-${v.url}`}
        embedId={v.embedId}
        url={v.url}
        routerId={props.routerId}
        sourceId={props.sourceId}
      />
    ));

  return (
    <>
      <Menu.BackLink onClick={props.onBack}>{sourceName}</Menu.BackLink>
      <Menu.Section>{content}</Menu.Section>
    </>
  );
}

// Main source selection view
export function SourceSelectPart(props: { media: ScrapeMedia }) {
  const { t } = useTranslation();
  const [selectedSourceId, setSelectedSourceId] = React.useState<string | null>(
    null,
  );
  const routerId = "manualSourceSelect";
  const preferredSourceOrder = usePreferencesStore((s) => s.sourceOrder);
  const enableSourceOrder = usePreferencesStore((s) => s.enableSourceOrder);
  const lastSuccessfulSource = usePreferencesStore(
    (s) => s.lastSuccessfulSource,
  );
  const enableLastSuccessfulSource = usePreferencesStore(
    (s) => s.enableLastSuccessfulSource,
  );
  const disabledSources = usePreferencesStore((s) => s.disabledSources);

  const playerMeta = usePlayerStore((s) => s.meta);
  const probedSources = usePlayerStore((s) => s.probedSources);

  const sources = useMemo(() => {
    const metaType = props.media.type;
    if (!metaType) return [];

    // Sort order: determined by getSourceSortOrder (custom or default alphabetical order)
    const sortOrder = getSourceSortOrder(preferredSourceOrder, enableSourceOrder);

    const mediaKey = getMediaKey(playerMeta);
    const probedForMedia = mediaKey ? probedSources[mediaKey] : null;
    const probeComplete = probedForMedia && Object.values(probedForMedia).some((s) => s === "working" || s === "failed");

    // Fallback: use activeZeticuzIds only when probe hasn't completed yet
    const activeZeticuzIds = probeComplete ? null : getActiveZeticuzProviders(playerMeta);

    const allSources = getCachedMetadata()
      .filter((v) => v.type === "source")
      .filter((v) => v.mediaTypes?.includes(metaType))
      .filter((v) => !(disabledSources || []).includes(v.id))
      .filter((v) => sortOrder.includes(v.id))
      .filter((v) => {
        // For zeticuz providers: use probed status when available, else activeZeticuzIds
        if (!v.id.startsWith("zeticuz-")) return true;
        if (probeComplete && probedForMedia) {
          const status = probedForMedia[v.id];
          return status === "working";
        }
        if (!activeZeticuzIds) return true; // show all if not resolved yet
        return activeZeticuzIds.includes(v.id);
      })
      // For non-zeticuz: filter by probe status
      .filter((v) => {
        if (v.id.startsWith("zeticuz-")) return true; // already handled above
        if (!probedForMedia) return true;
        const status = probedForMedia[v.id];
        return status === "working" || status === "probing" || status === undefined;
      })
      // Hide anime-only sources when watching a movie
      .filter((v) => {
        if (metaType !== "movie") return true;
        return v.id !== "zeticuz-anikoto" && v.id !== "zeticuz-anikai";
      });

    allSources.sort((a, b) => {
      const idxA = sortOrder.indexOf(a.id);
      const idxB = sortOrder.indexOf(b.id);
      return (idxA === -1 ? 999 : idxA) - (idxB === -1 ? 999 : idxB);
    });

    return allSources;
  }, [
    props.media.type,
    disabledSources,
    playerMeta,
    probedSources,
    preferredSourceOrder,
    enableSourceOrder,
  ]);

  if (selectedSourceId) {
    return (
      <div className="h-full w-full flex items-center justify-center">
        <div className="w-full max-w-md h-[50vh] flex flex-col">
          <Menu.CardWithScrollable>
            <EmbedSelectionView
              sourceId={selectedSourceId}
              routerId={routerId}
              onBack={() => setSelectedSourceId(null)}
            />
          </Menu.CardWithScrollable>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full flex items-center justify-center">
      <div className="w-full max-w-md h-[50vh] flex flex-col">
        <Menu.CardWithScrollable>
          <Menu.Title>{t("player.menus.sources.title")}</Menu.Title>
          <Menu.Section className="pb-4">
            {sources.map((v) => (
              <SelectableLink
                key={v.id}
                onClick={() => setSelectedSourceId(v.id)}
              >
                {v.name}
              </SelectableLink>
            ))}
          </Menu.Section>
        </Menu.CardWithScrollable>
      </div>
    </div>
  );
}
