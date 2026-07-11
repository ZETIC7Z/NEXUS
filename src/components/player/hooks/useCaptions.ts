import { useCallback, useMemo } from "react";
import subsrt from "subsrt-ts";

import { downloadCaption, downloadWebVTT } from "@/backend/helpers/subs";
import { Caption } from "@/stores/player/slices/source";
import { usePlayerStore } from "@/stores/player/store";
import { usePreferencesStore } from "@/stores/preferences";
import { useSubtitleStore } from "@/stores/subtitles";

import {
  filterDuplicateCaptionCues,
  parseVttSubtitles,
} from "../utils/captions";

export function useCaptions() {
  const setLanguage = useSubtitleStore((s) => s.setLanguage);
  const enabled = useSubtitleStore((s) => s.enabled);
  const resetSubtitleSpecificSettings = useSubtitleStore(
    (s) => s.resetSubtitleSpecificSettings,
  );
  const setCaption = usePlayerStore((s) => s.setCaption);
  const lastSelectedLanguage = useSubtitleStore((s) => s.lastSelectedLanguage);
  const setIsOpenSubtitles = useSubtitleStore((s) => s.setIsOpenSubtitles);

  const captionList = usePlayerStore((s) => s.captionList);
  const getHlsCaptionList = usePlayerStore((s) => s.display?.getCaptionList);
  const source = usePlayerStore((s) => s.source);
  const selectedCaption = usePlayerStore((s) => s.caption.selected);

  const getSubtitleTracks = usePlayerStore((s) => s.display?.getSubtitleTracks);
  const setSubtitlePreference = usePlayerStore(
    (s) => s.display?.setSubtitlePreference,
  );
  const setCaptionAsTrack = usePlayerStore((s) => s.setCaptionAsTrack);
  const enableNativeSubtitles = usePreferencesStore(
    (s) => s.enableNativeSubtitles,
  );

  const captions = useMemo(
    () => {
      const hlsCaptions = getHlsCaptionList?.() ?? [];
      const externalCaptions = captionList ?? [];
      // Combine them, filtering out duplicates by id if any
      const combined = [...hlsCaptions];
      for (const caption of externalCaptions) {
        if (!combined.find(c => c.id === caption.id)) {
          combined.push(caption);
        }
      }
      return combined;
    },
    [captionList, getHlsCaptionList],
  );

  const selectCaptionById = useCallback(
    async (captionId: string) => {
      const caption = captions.find((v) => v.id === captionId);
      if (!caption) return;

      const captionToSet: Caption = {
        id: caption.id,
        language: caption.language,
        url: caption.url,
        srtData: "",
      };

      if (!caption.hls) {
        const srtData = await downloadCaption(caption);
        captionToSet.srtData = srtData;
      } else {
        // request a language change to hls, so it can load the subtitles
        await setSubtitlePreference?.(caption.language);
        const track = getSubtitleTracks?.().find(
          (t) => t.id.toString() === caption.id && t.details !== undefined,
        );
        if (!track) return;

        const fragments =
          track.details?.fragments?.filter(
            (frag) => frag !== null && frag.url !== null,
          ) ?? [];

        const vttCaptions = (
          await Promise.all(
            fragments.map(async (frag) => {
              const vtt = await downloadWebVTT(frag.url);
              return parseVttSubtitles(vtt);
            }),
          )
        ).flat();

        const filtered = filterDuplicateCaptionCues(vttCaptions);

        const srtData = subsrt.build(filtered, { format: "srt" });
        captionToSet.srtData = srtData;
      }

      setIsOpenSubtitles(!!caption.opensubtitles);
      setCaption(captionToSet);

      // Only reset subtitle settings if selecting a different caption
      if (selectedCaption?.id !== caption.id) {
        resetSubtitleSpecificSettings();
      }

      setLanguage(caption.language);

      // Use native tracks for MP4 streams instead of custom rendering
      if (source?.type === "file" && enableNativeSubtitles) {
        setCaptionAsTrack(true);
      } else {
        // For HLS sources or when native subtitles are disabled, use custom rendering
        setCaptionAsTrack(false);
      }
    },
    [
      setIsOpenSubtitles,
      setLanguage,
      captions,
      setCaption,
      resetSubtitleSpecificSettings,
      getSubtitleTracks,
      setSubtitlePreference,
      source,
      setCaptionAsTrack,
      enableNativeSubtitles,
      selectedCaption,
    ],
  );

  const selectLanguage = useCallback(
    async (language: string) => {
      const caption = captions.find((v) => v.language === language);
      if (!caption) return;
      return selectCaptionById(caption.id);
    },
    [captions, selectCaptionById],
  );

  const disable = useCallback(async () => {
    setIsOpenSubtitles(false);
    setCaption(null);
    setLanguage(null);
    await setSubtitlePreference?.(null);
  }, [setCaption, setLanguage, setIsOpenSubtitles, setSubtitlePreference]);

  const selectLastUsedLanguage = useCallback(async () => {
    const { countryCode } = (
      await import("@/utils/detectRegion")
    ).useRegionStore.getState();
    const { getDefaultLanguageByCountry } = await import("@/utils/language");
    const language =
      lastSelectedLanguage ?? getDefaultLanguageByCountry(countryCode);
    await selectLanguage(language);
    return true;
  }, [lastSelectedLanguage, selectLanguage]);

  const toggleLastUsed = useCallback(async () => {
    if (enabled) disable();
    else await selectLastUsedLanguage();
  }, [selectLastUsedLanguage, disable, enabled]);

  const selectLastUsedLanguageIfEnabled = useCallback(async () => {
    if (enabled) await selectLastUsedLanguage();
  }, [selectLastUsedLanguage, enabled]);

  const autoSelectDefaultSubtitles = useCallback(async () => {
    // Enable subtitles immediately in the store
    useSubtitleStore.getState().setLanguage("en");

    // Find the English caption list
    const englishCaptions = captions.filter(
      (v) =>
        v.language.toLowerCase() === "en" ||
        v.language.toLowerCase().includes("english")
    );

    if (englishCaptions.length === 0) {
      if (captions.length > 0) {
        const firstVtt = captions.find(
          (v) =>
            v.type === "vtt" ||
            v.url?.includes(".vtt") ||
            v.id?.toLowerCase().includes("vtt"),
        );
        const fallbackCaption = firstVtt || captions[0];
        await selectCaptionById(fallbackCaption.id);
      }
      return;
    }

    // Among English captions, find the first VTT caption
    const firstEnglishVtt = englishCaptions.find(
      (v) =>
        v.type === "vtt" ||
        v.url?.includes(".vtt") ||
        v.id?.toLowerCase().includes("vtt"),
    );

    const captionToSelect = firstEnglishVtt || englishCaptions[0];
    await selectCaptionById(captionToSelect.id);
  }, [captions, selectCaptionById]);

  return {
    selectLanguage,
    disable,
    selectLastUsedLanguage,
    toggleLastUsed,
    selectLastUsedLanguageIfEnabled,
    selectCaptionById,
    autoSelectDefaultSubtitles,
  };
}
