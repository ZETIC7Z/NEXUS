import { ReactNode, useEffect, useMemo, useRef } from "react";
import { useTranslation } from "react-i18next";

import { getCachedMetadata } from "@/backend/helpers/providerApi";
import { zeticuzScrapers, getActiveZeticuzProviders } from "@/backend/providers/zeticuz-provider";
import { getSourceSortOrder } from "@/backend/providers/providers";
import { getMediaKey } from "@/stores/player/slices/source";
import { Loading } from "@/components/layout/Loading";
import {
  useEmbedScraping,
  useSourceScraping,
} from "@/components/player/hooks/useSourceSelection";
import { Menu } from "@/components/player/internals/ContextMenu";
import { SelectableLink } from "@/components/player/internals/ContextMenu/Links";
import { useOverlayRouter } from "@/hooks/useOverlayRouter";
import { playerStatus } from "@/stores/player/slices/source";
import { usePlayerStore } from "@/stores/player/store";
import { usePreferencesStore } from "@/stores/preferences";

export interface SourceSelectionViewProps {
  id: string;
  onChoose?: (id: string) => void;
}

export interface EmbedSelectionViewProps {
  id: string;
  sourceId: string | null;
}

export function EmbedOption(props: {
  embedId: string;
  url: string;
  sourceId: string;
  routerId: string;
}) {
  const { t } = useTranslation();
  const currentEmbedId = usePlayerStore((s) => s.embedId);
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
      selected={props.embedId === currentEmbedId}
      rightSide={rightSide}
    >
      <span className="flex flex-col">
        <span>{embedName}</span>
      </span>
    </SelectableLink>
  );
}

export function EmbedSelectionView({ sourceId, id }: EmbedSelectionViewProps) {
  const { t } = useTranslation();
  const router = useOverlayRouter(id);
  const { run, watching, notfound, loading, items, errored } =
    useSourceScraping(sourceId, id);

  const sourceName = useMemo(() => {
    if (!sourceId) return "...";
    const sourceMeta = getCachedMetadata().find((s) => s.id === sourceId);
    return sourceMeta?.name ?? "...";
  }, [sourceId]);

  const lastSourceId = useRef<string | null>(null);
  useEffect(() => {
    if (lastSourceId.current === sourceId) return;
    lastSourceId.current = sourceId;
    if (!sourceId) return;
    run();
  }, [run, sourceId]);

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
  else if (watching)
    content = null; // when it starts watching, empty the display
  else if (items && sourceId)
    content = items.map((v) => (
      <EmbedOption
        key={`${v.embedId}-${v.url}`}
        embedId={v.embedId}
        url={v.url}
        routerId={id}
        sourceId={sourceId}
      />
    ));

  return (
    <>
      <Menu.BackLink onClick={() => router.navigate("/source")}>
        {sourceName}
      </Menu.BackLink>
      <Menu.Section>{content}</Menu.Section>
    </>
  );
}

export function SourceSelectionView({
  id,
  onChoose,
}: SourceSelectionViewProps) {
  const { t } = useTranslation();
  const router = useOverlayRouter(id);
  const playerMeta = usePlayerStore((s) => s.meta);
  const probedSources = usePlayerStore((s) => s.probedSources);
  const metaType = playerMeta?.type;
  const currentSourceId = usePlayerStore((s) => s.sourceId);
  const setResumeFromSourceId = usePlayerStore((s) => s.setResumeFromSourceId);
  const setStatus = usePlayerStore((s) => s.setStatus);
  const preferredSourceOrder = usePreferencesStore((s) => s.sourceOrder);
  const enableSourceOrder = usePreferencesStore((s) => s.enableSourceOrder);
  const lastSuccessfulSource = usePreferencesStore(
    (s) => s.lastSuccessfulSource,
  );
  const enableLastSuccessfulSource = usePreferencesStore(
    (s) => s.enableLastSuccessfulSource,
  );
  const disabledSources = usePreferencesStore((s) => s.disabledSources);
  const manualSourceSelection = usePreferencesStore(
    (s) => s.manualSourceSelection,
  );
  const febboxKey = usePreferencesStore((s) => s.febboxKey);
  const hasFebboxKey = febboxKey && febboxKey.length > 0;

  const ZETICUZ_SOURCE_IDS = useMemo(
    () => zeticuzScrapers.map((s) => s.id),
    [],
  );

  const sources = useMemo(() => {
    if (!metaType) return [];

    // Sort order: determined by getSourceSortOrder (custom or default alphabetical order)
    const sortOrder = getSourceSortOrder(preferredSourceOrder, enableSourceOrder);

    const mediaKey = getMediaKey(playerMeta);
    const probedForMedia = mediaKey ? probedSources[mediaKey] : null;
    const probeComplete = probedForMedia && Object.values(probedForMedia).some((s) => s === "working" || s === "failed");

    // Fallback: use activeZeticuzIds only when probe hasn't completed yet
    const activeZeticuzIds = probeComplete ? null : getActiveZeticuzProviders(playerMeta);

    let allSources = getCachedMetadata()
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
      // For non-zeticuz: also filter by probe status
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
    metaType,
    disabledSources,
    preferredSourceOrder,
    enableSourceOrder,
    playerMeta,
    probedSources,
  ]);

  const handleFindNextSource = () => {
    if (!currentSourceId) return;
    // Set the resume source ID in the store
    setResumeFromSourceId(currentSourceId);
    // Close the settings overlay
    router.close();
    // Set status to SCRAPING to trigger scraping from next source
    setStatus(playerStatus.SCRAPING);
  };

  return (
    <>
      <Menu.BackLink
        onClick={() => router.navigate("/")}
        rightSide={
          <div className="flex items-center gap-2">
            {currentSourceId && !manualSourceSelection && (
              <button
                type="button"
                onClick={handleFindNextSource}
                className="-mr-2 -my-1 px-2 p-[0.4em] rounded tabbable hover:bg-video-context-light hover:bg-opacity-10"
              >
                {t("player.menus.sources.findNextSource")}
              </button>
            )}
          </div>
        }
      >
        {t("player.menus.sources.title")}
      </Menu.BackLink>
      <Menu.Section className="pb-4">
        {sources.map((v) => (
          <SelectableLink
            key={v.id}
            onClick={() => {
              onChoose?.(v.id);
              router.navigate("/source/embeds");
            }}
            selected={v.id === currentSourceId}
          >
            {v.name}
          </SelectableLink>
        ))}
      </Menu.Section>
    </>
  );
}
