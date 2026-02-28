import { useMemo, useState } from "react";
import { useAsyncFn } from "react-use";

import { useCaptions } from "@/components/player/hooks/useCaptions";
import { Menu } from "@/components/player/internals/ContextMenu";
import { useOverlayRouter } from "@/hooks/useOverlayRouter";
import { usePlayerStore } from "@/stores/player/store";
import { useSubtitleStore } from "@/stores/subtitles";
import { getPrettyLanguageNameFromLocale } from "@/utils/language";

import { CaptionOption, useSubtitleList } from "./CaptionsView";

export function LanguageSubtitlesView({
  id,
  language,
}: {
  id: string;
  language?: string;
}) {
  const router = useOverlayRouter(id);
  const selectedCaptionId = usePlayerStore((s) => s.caption.selected?.id);
  const { selectCaptionById } = useCaptions();
  const [currentlyDownloading, setCurrentlyDownloading] = useState<
    string | null
  >(null);
  const delay = useSubtitleStore((s) => s.delay);

  const captionList = usePlayerStore((s) => s.captionList);
  const getHlsCaptionList = usePlayerStore((s) => s.display?.getCaptionList);

  const captions = useMemo(
    () =>
      captionList.length !== 0 ? captionList : (getHlsCaptionList?.() ?? []),
    [captionList, getHlsCaptionList],
  );

  const filteredCaptions = useMemo(
    () =>
      captions.filter((v) => {
        const name = getPrettyLanguageNameFromLocale(v.language) ?? v.language;
        const targetName =
          (language ? getPrettyLanguageNameFromLocale(language) : "Unknown") ??
          language;
        return name === targetName;
      }),
    [captions, language],
  );

  const list = useSubtitleList(filteredCaptions, "");

  const [downloadReq, startDownload] = useAsyncFn(
    async (captionId: string) => {
      setCurrentlyDownloading(captionId);
      return selectCaptionById(captionId);
    },
    [selectCaptionById, setCurrentlyDownloading],
  );

  const prettyLanguageName = useMemo(
    () => (language ? getPrettyLanguageNameFromLocale(language) : "Unknown"),
    [language],
  );

  return (
    <>
      <Menu.BackLink onClick={() => router.navigate("/captions")}>
        {prettyLanguageName}
      </Menu.BackLink>
      <Menu.ScrollToActiveSection className="mt-2 pb-3">
        {list.map((v) => {
          const handleDoubleClick = async () => {
            const copyData = {
              id: v.id,
              url: v.url,
              language: v.language,
              type: v.type,
              hasCorsRestrictions: v.needsProxy,
              opensubtitles: v.opensubtitles,
              display: v.display,
              media: v.media,
              isHearingImpaired: v.isHearingImpaired,
              source: v.source,
              encoding: v.encoding,
              delay,
            };

            try {
              await navigator.clipboard.writeText(JSON.stringify(copyData));
            } catch (err) {
              console.error("Failed to copy subtitle data:", err);
            }
          };

          return (
            <CaptionOption
              key={v.id}
              countryCode={v.language}
              selected={v.id === selectedCaptionId}
              loading={v.id === currentlyDownloading && downloadReq.loading}
              error={
                v.id === currentlyDownloading && downloadReq.error
                  ? downloadReq.error.toString()
                  : undefined
              }
              onClick={() => startDownload(v.id)}
              onDoubleClick={handleDoubleClick}
              flag
              subtitleUrl={v.url}
              subtitleType={v.type}
              subtitleSource={v.source}
              subtitleEncoding={v.encoding}
              isHearingImpaired={v.isHearingImpaired}
            >
              {v.languageName}
            </CaptionOption>
          );
        })}
      </Menu.ScrollToActiveSection>
    </>
  );
}

export default LanguageSubtitlesView;
