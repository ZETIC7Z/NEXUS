import { useCallback, useEffect, useMemo, useState } from "react";
import { Trans, useTranslation } from "react-i18next";
import { useCopyToClipboard } from "react-use";

import { downloadCaption } from "@/backend/helpers/subs";
import { Button } from "@/components/buttons/Button";
import { Icon, Icons } from "@/components/Icon";
import { OverlayPage } from "@/components/overlays/OverlayPage";
import { Menu } from "@/components/player/internals/ContextMenu";
import { convertSubtitlesToSrtDataurl } from "@/components/player/utils/captions";
import { useIsDesktopApp } from "@/hooks/useIsDesktopApp";
import { useOverlayRouter } from "@/hooks/useOverlayRouter";
import { usePlayerStore } from "@/stores/player/store";

interface DownloadSource {
  name: string;
  url: string;
}

interface DownloadItem {
  title: string;
  format?: string;
  resolution?: string;
  size?: string;
  sources: DownloadSource[];
}

interface GridData {
  downloads: DownloadItem[];
}

export function useDownloadLink() {
  const source = usePlayerStore((s) => s.source);
  const currentQuality = usePlayerStore((s) => s.currentQuality);
  const url = useMemo(() => {
    if (source?.type === "file") {
      const quality = currentQuality
        ? source.qualities[currentQuality]
        : undefined;
      if (quality) return quality.url;
      const firstQuality = Object.values(source.qualities)[0];
      return firstQuality?.url;
    }
    if (source?.type === "hls") return source.url;
    return undefined;
  }, [source, currentQuality]);
  return url;
}

function getZeticuzToken(): string {
  try {
    const prefData =
      typeof window !== "undefined"
        ? window.localStorage.getItem("__MW::preferences")
        : null;
    if (prefData) {
      const parsed = JSON.parse(prefData);
      const token =
        parsed?.state?.febboxKey || parsed?.state?.preferences?.febboxKey;
      if (token) return token;
    }
  } catch {
    // fall through
  }
  return import.meta.env.VITE_DEFAULT_FEBBOX_KEY || "";
}

async function fetchGridData(
  tmdbId: string,
  isMovie: boolean,
  season?: number,
  episode?: number,
): Promise<GridData> {
  const baseUrl = "https://goatapi.imreallydagoatt.workers.dev";
  const url = isMovie
    ? `${baseUrl}/api/downloader/movie/${tmdbId}`
    : `${baseUrl}/api/downloader/tv/${tmdbId}/${season ?? 1}/${episode ?? 1}`;

  const response = await fetch(url);
  if (!response.ok) throw new Error("Failed to fetch download links");
  const data = await response.json();

  const downloads: DownloadItem[] = (data.downloads || []).map((d: any) => {
    const title = d.title || "Video File";
    const extensionMatch = title.match(/\.([a-zA-Z0-9]+)$/);
    const format = extensionMatch ? extensionMatch[1] : "mkv";

    const resolutionMatch = title.match(/\b(2160p|1080p|720p|480p|360p|4k|UHD|HD)\b/i);
    const resolution = resolutionMatch ? resolutionMatch[0] : "Original";

    return {
      title,
      format,
      resolution,
      size: d.size || "Unknown size",
      sources: (d.sources || []).map((s: any) => ({
        name: s.name || "Download Link",
        url: s.url,
      })),
    };
  });

  return { downloads };
}

function StyleTrans(props: { k: string }) {
  return (
    <Trans
      i18nKey={props.k}
      components={{
        bold: <Menu.Highlight />,
        br: <br />,
        ios_share: (
          <Icon icon={Icons.IOS_SHARE} className="inline-block text-xl -mb-1" />
        ),
        ios_files: (
          <Icon icon={Icons.IOS_FILES} className="inline-block text-xl -mb-1" />
        ),
      }}
    />
  );
}

function OriginalFileView({ id }: { id: string }) {
  const router = useOverlayRouter(id);
  const { t } = useTranslation();
  const meta = usePlayerStore((s) => s.meta);
  const selectedCaption = usePlayerStore((s) => s.caption?.selected);
  const [data, setData] = useState<GridData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const tmdbId = meta?.tmdbId;
  const isMovie = meta?.type === "movie";
  const seasonNumber = meta?.season?.number;
  const episodeNumber = meta?.episode?.number;

  useEffect(() => {
    if (!tmdbId) return;
    let cancelled = false;
    setLoading(true);
    setError(false);

    fetchGridData(tmdbId, isMovie, seasonNumber, episodeNumber)
      .then((json) => {
        if (!cancelled) setData(json);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [tmdbId, isMovie, seasonNumber, episodeNumber]);

  const openSubtitleDownload = useCallback(() => {
    const dataUrl = selectedCaption
      ? convertSubtitlesToSrtDataurl(selectedCaption?.srtData)
      : null;
    if (!dataUrl) return;
    window.open(dataUrl);
  }, [selectedCaption]);

  const hasDownloads = data?.downloads && data.downloads.length > 0;

  return (
    <>
      <Menu.BackLink onClick={() => router.navigate("/download")}>
        {t("player.menus.downloads.original.cardTitle", "Original File")}
      </Menu.BackLink>
      <Menu.Section>
        {loading && (
          <Menu.Paragraph marginClass="mb-4">
            {t(
              "player.menus.downloads.original.loading",
              "Loading direct downloads...",
            )}
          </Menu.Paragraph>
        )}
        {error && (
          <Menu.Paragraph marginClass="mb-4">
            {t(
              "player.menus.downloads.original.error",
              "Failed to load direct downloads.",
            )}
          </Menu.Paragraph>
        )}
        {!loading && !error && !hasDownloads && (
          <Menu.Paragraph marginClass="mb-4">
            {t(
              "player.menus.downloads.original.noResults",
              "No direct downloads found.",
            )}
          </Menu.Paragraph>
        )}
        {hasDownloads &&
          data?.downloads.map((dl, i) => (
            <div
              key={`${dl.title}-${i}`}
              className="w-full rounded-lg bg-video-context-light/10 p-3 mb-2"
            >
              <div className="flex items-center gap-2 mb-1">
                {dl.format && (
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase bg-video-context-type-accent/20 text-video-context-type-accent">
                    {dl.format}
                  </span>
                )}
                {dl.resolution && (
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-video-context-light/20 text-video-context-type-main">
                    {dl.resolution}
                  </span>
                )}
                <span className="text-xs text-video-context-type-secondary ml-auto">
                  {dl.size}
                </span>
              </div>
              <p className="text-xs text-video-context-type-secondary break-all mb-2">
                {dl.title}
              </p>
              <div className="flex gap-2 flex-wrap">
                {dl.sources.map((src, j) => (
                  <a
                    key={`${src.url}-${j}`}
                    href={src.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 min-w-0 text-center px-3 py-1.5 rounded bg-video-context-type-accent/20 hover:bg-video-context-type-accent/40 transition-colors text-xs font-medium text-video-context-type-main"
                  >
                    {src.name}
                  </a>
                ))}
              </div>
            </div>
          ))}
        <Button
          className="w-full mt-2"
          onClick={openSubtitleDownload}
          disabled={!selectedCaption}
          theme="secondary"
        >
          {t("player.menus.downloads.downloadSubtitle", "Download Subtitle")}
        </Button>
      </Menu.Section>
    </>
  );
}

function StreamLinkView({ id }: { id: string }) {
  const router = useOverlayRouter(id);
  const { t } = useTranslation();
  const downloadUrl = useDownloadLink();
  const [, copyToClipboard] = useCopyToClipboard();
  const selectedCaption = usePlayerStore((s) => s.caption?.selected);
  const [copied, setCopied] = useState(false);

  const openSubtitleDownload = useCallback(() => {
    const dataUrl = selectedCaption
      ? convertSubtitlesToSrtDataurl(selectedCaption?.srtData)
      : null;
    if (!dataUrl) return;
    window.open(dataUrl);
  }, [selectedCaption]);

  return (
    <>
      <Menu.BackLink onClick={() => router.navigate("/download")}>
        {t("player.menus.downloads.stream.cardTitle", "Stream Link")}
      </Menu.BackLink>
      <Menu.Section>
        <Menu.Paragraph marginClass="mb-4">
          <Trans i18nKey="player.menus.downloads.desktopDisclaimer" />
        </Menu.Paragraph>
        <Button
          className="w-full"
          theme="purple"
          onClick={(event) => {
            event.preventDefault();
            copyToClipboard(downloadUrl ?? "");
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          }}
        >
          {copied
            ? t("player.menus.downloads.copied", "Copied!")
            : t("player.menus.downloads.copyHlsPlaylist", "Copy HLS Playlist")}
        </Button>
        <Button
          className="w-full mt-2"
          onClick={openSubtitleDownload}
          disabled={!selectedCaption}
          theme="secondary"
        >
          {t("player.menus.downloads.downloadSubtitle", "Download Subtitle")}
        </Button>

        <Menu.Divider />

        <Menu.ChevronLink onClick={() => router.navigate("/download/pc")}>
          {t("player.menus.downloads.onPc.title")}
        </Menu.ChevronLink>
        <Menu.ChevronLink onClick={() => router.navigate("/download/ios")}>
          {t("player.menus.downloads.onIos.title")}
        </Menu.ChevronLink>
        <Menu.ChevronLink onClick={() => router.navigate("/download/android")}>
          {t("player.menus.downloads.onAndroid.title")}
        </Menu.ChevronLink>
      </Menu.Section>
    </>
  );
}

function DesktopDownloadView({ id }: { id: string }) {
  const router = useOverlayRouter(id);
  const { t } = useTranslation();
  const downloadUrl = useDownloadLink();
  const meta = usePlayerStore((s) => s.meta);
  const selectedCaption = usePlayerStore((s) => s.caption?.selected);
  const captionList = usePlayerStore((s) => s.captionList);
  const duration = usePlayerStore((s) => s.progress.duration);
  const source = usePlayerStore((s) => s.source);
  const sourceType = usePlayerStore((s) => s.source?.type);

  const startOfflineDownload = useCallback(async () => {
    if (!downloadUrl) return;
    const title = meta?.title ? meta.title : t("player.menus.downloads.title");
    const poster = meta?.poster;
    let subtitleText: string | undefined;

    if (selectedCaption?.srtData) {
      subtitleText = selectedCaption.srtData;
    } else if (captionList.length > 0) {
      const defaultCaption =
        captionList.find((c) => c.language === "en") ?? captionList[0];
      try {
        subtitleText = await downloadCaption(defaultCaption);
      } catch {
        // Continue without subtitles if fetch fails
      }
    }

    const headers = {
      ...(source?.headers ?? {}),
      ...(source?.preferredHeaders ?? {}),
    };

    window.desktopApi?.startDownload({
      url: downloadUrl,
      title,
      poster,
      subtitleText,
      duration,
      type: sourceType,
      headers,
    });

    if (window.desktopApi?.openOffline) {
      window.desktopApi.openOffline();
    } else {
      router.navigate("/");
    }
  }, [
    downloadUrl,
    meta,
    selectedCaption,
    captionList,
    duration,
    router,
    source,
    sourceType,
    t,
  ]);

  return (
    <>
      <Menu.BackLink onClick={() => router.navigate("/")}>
        {t("player.menus.downloads.title")}
      </Menu.BackLink>
      <Menu.Section>
        <Menu.Paragraph marginClass="mb-6">
          <Trans i18nKey="player.menus.downloads.desktopDisclaimer" />
        </Menu.Paragraph>
        <Button className="w-full" theme="purple" onClick={startOfflineDownload}>
          {t("player.menus.downloads.offlineButton")}
        </Button>
      </Menu.Section>
    </>
  );
}

export function DownloadView({ id }: { id: string }) {
  const isDesktopApp = useIsDesktopApp();
  const router = useOverlayRouter(id);
  const { t } = useTranslation();

  if (isDesktopApp) {
    return <DesktopDownloadView id={id} />;
  }

  return (
    <>
      <Menu.BackLink onClick={() => router.navigate("/")}>
        {t("player.menus.downloads.title")}
      </Menu.BackLink>
      <Menu.Section>
        <div className="flex flex-col gap-3 mt-2">
          <button
            type="button"
            className="w-full rounded-lg bg-video-context-light/10 hover:bg-video-context-light/20 transition-colors p-4 text-left relative group cursor-pointer"
            onClick={() => router.navigate("/download/original")}
          >
            <div className="flex items-center gap-3">
              <Icon
                icon={Icons.FILE_ARROW_DOWN}
                className="text-2xl text-video-context-type-accent"
              />
              <div className="flex-1">
                <p className="text-sm font-medium text-video-context-type-main">
                  {t(
                    "player.menus.downloads.original.cardTitle",
                    "Original File",
                  )}
                </p>
                <p className="text-xs text-video-context-type-secondary mt-0.5">
                  {t(
                    "player.menus.downloads.original.cardDesc",
                    "Download the video file directly",
                  )}
                </p>
              </div>
              <div className="relative">
                <Icon
                  icon={Icons.CIRCLE_QUESTION}
                  className="text-lg text-video-context-type-secondary hover:text-video-context-type-main transition-colors peer"
                />
                <div className="absolute right-0 top-full mt-2 w-64 p-3 rounded-lg bg-video-context-background border border-video-context-border text-xs text-video-context-type-secondary leading-relaxed opacity-0 pointer-events-none peer-hover:opacity-100 peer-hover:pointer-events-auto transition-opacity z-50 shadow-lg">
                  {t(
                    "player.menus.downloads.original.description",
                    "Get high-quality direct download files from the video source.",
                  )}
                </div>
              </div>
            </div>
          </button>

          <div className="flex items-center gap-3 px-2">
            <div className="flex-1 h-px bg-video-context-border" />
            <span className="text-xs text-video-context-type-secondary uppercase">
              {t("player.menus.downloads.or", "OR")}
            </span>
            <div className="flex-1 h-px bg-video-context-border" />
          </div>

          <button
            type="button"
            className="w-full rounded-lg bg-video-context-light/10 hover:bg-video-context-light/20 transition-colors p-4 text-left cursor-pointer relative group"
            onClick={() => router.navigate("/download/stream")}
          >
            <div className="flex items-center gap-3">
              <Icon
                icon={Icons.LINK}
                className="text-2xl text-video-context-type-accent"
              />
              <div className="flex-1">
                <p className="text-sm font-medium text-video-context-type-main">
                  {t("player.menus.downloads.stream.cardTitle", "Stream Link")}
                </p>
                <p className="text-xs text-video-context-type-secondary mt-0.5">
                  {t(
                    "player.menus.downloads.stream.cardDesc",
                    "Copy the HLS playlist URL",
                  )}
                </p>
              </div>
              <div className="relative">
                <Icon
                  icon={Icons.CIRCLE_QUESTION}
                  className="text-lg text-video-context-type-secondary hover:text-video-context-type-main transition-colors peer"
                />
                <div className="absolute right-0 top-full mt-2 w-64 p-3 rounded-lg bg-video-context-background border border-video-context-border text-xs text-video-context-type-secondary leading-relaxed opacity-0 pointer-events-none peer-hover:opacity-100 peer-hover:pointer-events-auto transition-opacity z-50 shadow-lg">
                  {t(
                    "player.menus.downloads.stream.description",
                    "Copy the HLS streaming manifest (.m3u8) to play in external players.",
                  )}
                </div>
              </div>
            </div>
          </button>
        </div>
      </Menu.Section>
    </>
  );
}

function AndroidExplanationView({ id }: { id: string }) {
  const router = useOverlayRouter(id);
  const { t } = useTranslation();

  return (
    <>
      <Menu.BackLink onClick={() => router.navigate("/download/stream")}>
        {t("player.menus.downloads.onAndroid.shortTitle")}
      </Menu.BackLink>
      <Menu.Section>
        <Menu.Paragraph>
          <StyleTrans k="player.menus.downloads.onAndroid.1" />
        </Menu.Paragraph>
      </Menu.Section>
    </>
  );
}

function PCExplanationView({ id }: { id: string }) {
  const router = useOverlayRouter(id);
  const { t } = useTranslation();

  return (
    <>
      <Menu.BackLink onClick={() => router.navigate("/download/stream")}>
        {t("player.menus.downloads.onPc.shortTitle")}
      </Menu.BackLink>
      <Menu.Section>
        <Menu.Paragraph>
          <StyleTrans k="player.menus.downloads.onPc.1" />
        </Menu.Paragraph>
      </Menu.Section>
    </>
  );
}

function IOSExplanationView({ id }: { id: string }) {
  const router = useOverlayRouter(id);

  return (
    <>
      <Menu.BackLink onClick={() => router.navigate("/download/stream")}>
        <StyleTrans k="player.menus.downloads.onIos.shortTitle" />
      </Menu.BackLink>
      <Menu.Section>
        <Menu.Paragraph>
          <StyleTrans k="player.menus.downloads.onIos.1" />
        </Menu.Paragraph>
      </Menu.Section>
    </>
  );
}

export function DownloadRoutes({ id }: { id: string }) {
  return (
    <>
      <OverlayPage id={id} path="/download" width={343} height={400}>
        <Menu.CardWithScrollable>
          <DownloadView id={id} />
        </Menu.CardWithScrollable>
      </OverlayPage>
      <OverlayPage id={id} path="/download/original" width={343} height={440}>
        <Menu.CardWithScrollable>
          <OriginalFileView id={id} />
        </Menu.CardWithScrollable>
      </OverlayPage>
      <OverlayPage id={id} path="/download/stream" width={343} height={480}>
        <Menu.CardWithScrollable>
          <StreamLinkView id={id} />
        </Menu.CardWithScrollable>
      </OverlayPage>
      <OverlayPage id={id} path="/download/ios" width={343} height={440}>
        <Menu.CardWithScrollable>
          <IOSExplanationView id={id} />
        </Menu.CardWithScrollable>
      </OverlayPage>
      <OverlayPage id={id} path="/download/android" width={343} height={440}>
        <Menu.CardWithScrollable>
          <AndroidExplanationView id={id} />
        </Menu.CardWithScrollable>
      </OverlayPage>
      <OverlayPage id={id} path="/download/pc" width={343} height={440}>
        <Menu.CardWithScrollable>
          <PCExplanationView id={id} />
        </Menu.CardWithScrollable>
      </OverlayPage>
    </>
  );
}
