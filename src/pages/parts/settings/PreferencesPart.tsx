import classNames from "classnames";
import { useMemo } from "react";
import { Trans, useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

import { getAllProviders, getProviders } from "@/backend/providers/providers";
import { Button } from "@/components/buttons/Button";
import { Toggle } from "@/components/buttons/Toggle";
import { FlagIcon } from "@/components/FlagIcon";
import { Dropdown } from "@/components/form/Dropdown";
import { SortableListWithToggles } from "@/components/form/SortableListWithToggles";
import { Heading1 } from "@/components/utils/Text";
import { appLanguageOptions } from "@/setup/i18n";
import { usePreferencesStore } from "@/stores/preferences";
import { isAutoplayAllowed } from "@/utils/autoplay";
import { getLocaleInfo, sortLangCodes } from "@/utils/language";

export function PreferencesPart(props: {
  language: string;
  setLanguage: (l: string) => void;
  enableThumbnails: boolean;
  setEnableThumbnails: (v: boolean) => void;
  enableAutoplay: boolean;
  setEnableAutoplay: (v: boolean) => void;
  enableSkipCredits: boolean;
  setEnableSkipCredits: (v: boolean) => void;
  sourceOrder: string[];
  setSourceOrder: (v: string[]) => void;
  enableSourceOrder: boolean;
  setenableSourceOrder: (v: boolean) => void;
  enableLastSuccessfulSource: boolean;
  setEnableLastSuccessfulSource: (v: boolean) => void;
  disabledSources: string[];
  setDisabledSources: (v: string[]) => void;
  enableLowPerformanceMode: boolean;
  setEnableLowPerformanceMode: (v: boolean) => void;
  enableHoldToBoost: boolean;
  setEnableHoldToBoost: (v: boolean) => void;
  manualSourceSelection: boolean;
  setManualSourceSelection: (v: boolean) => void;
  enableDoubleClickToSeek: boolean;
  setEnableDoubleClickToSeek: (v: boolean) => void;
  enableAutoResumeOnPlaybackError: boolean;
  setEnableAutoResumeOnPlaybackError: (v: boolean) => void;
}) {
  const { t } = useTranslation();
  const sorted = sortLangCodes(appLanguageOptions.map((item) => item.code));

  const allowAutoplay = isAutoplayAllowed();

  const options = appLanguageOptions
    .sort((a, b) => sorted.indexOf(a.code) - sorted.indexOf(b.code))
    .map((opt) => ({
      id: opt.code,
      name: `${opt.name}${opt.nativeName ? ` — ${opt.nativeName}` : ""}`,
      leftIcon: <FlagIcon langCode={opt.code} />,
    }));

  const selected = options.find(
    (item) => item.id === getLocaleInfo(props.language)?.code,
  );

  const hasFebboxKey = usePreferencesStore((s) => !!s.febboxKey);

  const allSources = useMemo(() => {
    const sources = getAllProviders().listSources();

    if (hasFebboxKey && !sources.some((s) => s.id === "febbox")) {
      sources.push({
        id: "febbox",
        name: "FebBox (4K) ⭐",
        rank: 999,
        mediaTypes: ["movie", "show"],
      } as any);
    }

    return sources;
  }, [hasFebboxKey]);

  const sourceItems = useMemo(() => {
    const currentDeviceSources = getProviders().listSources();
    return props.sourceOrder.map((id) => ({
      id,
      name: allSources.find((s) => s.id === id)?.name || id,
      disabled: !currentDeviceSources.find((s) => s.id === id),
      enabled: !props.disabledSources.includes(id),
    }));
  }, [props.sourceOrder, props.disabledSources, allSources]);

  const navigate = useNavigate();

  const handleLowPerformanceModeToggle = () => {
    props.setEnableLowPerformanceMode(!props.enableLowPerformanceMode);
  };

  const handleSourceToggle = (sourceId: string) => {
    const newDisabledSources = props.disabledSources.includes(sourceId)
      ? props.disabledSources.filter((id) => id !== sourceId)
      : [...props.disabledSources, sourceId];
    props.setDisabledSources(newDisabledSources);
  };

  return (
    <div className="space-y-12">
      <Heading1 border>{t("settings.preferences.title")}</Heading1>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Column */}
        <div className="space-y-8">
          {/* Language Preference */}
          <div>
            <p className="text-white font-bold mb-3">
              {t("settings.preferences.language")}
            </p>
            <p className="max-w-[20rem] font-medium">
              {t("settings.preferences.languageDescription")}
            </p>
            <Dropdown
              className="w-full"
              options={options}
              selectedItem={selected || options[0]}
              setSelectedItem={(opt) => props.setLanguage(opt.id)}
            />
          </div>

          {/* Thumbnail Preference */}
          <div>
            <p className="text-white font-bold mb-3">
              {t("settings.preferences.thumbnail")}
            </p>
            <p className="max-w-[25rem] font-medium">
              {t("settings.preferences.thumbnailDescription")}
            </p>
            <div
              role="button"
              tabIndex={0}
              onClick={() => {
                if (!props.enableLowPerformanceMode) {
                  props.setEnableThumbnails(!props.enableThumbnails);
                }
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  if (!props.enableLowPerformanceMode) {
                    props.setEnableThumbnails(!props.enableThumbnails);
                  }
                }
              }}
              className={classNames(
                "bg-dropdown-background hover:bg-dropdown-hoverBackground select-none my-4 cursor-pointer space-x-3 flex items-center max-w-[25rem] py-3 px-4 rounded-lg outline-none focus:ring-2 focus:ring-[hsl(var(--colors-active))]",
                props.enableLowPerformanceMode
                  ? "cursor-not-allowed opacity-50 pointer-events-none"
                  : "cursor-pointer opacity-100 pointer-events-auto",
              )}
            >
              <Toggle enabled={props.enableThumbnails} />
              <p className="flex-1 text-white font-bold">
                {t("settings.preferences.thumbnailLabel")}
              </p>
            </div>
          </div>

          {/* Autoplay Preference */}
          <div>
            <p className="text-white font-bold mb-3">
              {t("settings.preferences.autoplay")}
            </p>
            <p className="max-w-[25rem] font-medium">
              {t("settings.preferences.autoplayDescription")}
            </p>
            <div
              role="button"
              tabIndex={0}
              onClick={() =>
                allowAutoplay && !props.enableLowPerformanceMode
                  ? props.setEnableAutoplay(!props.enableAutoplay)
                  : null
              }
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  if (allowAutoplay && !props.enableLowPerformanceMode) {
                    props.setEnableAutoplay(!props.enableAutoplay);
                  }
                }
              }}
              className={classNames(
                "bg-dropdown-background hover:bg-dropdown-hoverBackground select-none my-4 cursor-pointer space-x-3 flex items-center max-w-[25rem] py-3 px-4 rounded-lg outline-none focus:ring-2 focus:ring-[hsl(var(--colors-active))]",
                allowAutoplay && !props.enableLowPerformanceMode
                  ? "cursor-pointer opacity-100 pointer-events-auto"
                  : "cursor-not-allowed opacity-50 pointer-events-none",
              )}
            >
              <Toggle enabled={props.enableAutoplay && allowAutoplay} />
              <p className="flex-1 text-white font-bold">
                {t("settings.preferences.autoplayLabel")}
              </p>
            </div>

            {/* Skip End Credits Preference */}
            {props.enableAutoplay &&
              allowAutoplay &&
              !props.enableLowPerformanceMode && (
                <div className="pt-4 pl-4 border-l-8 border-dropdown-background">
                  <p className="text-white font-bold mb-3">
                    {t("settings.preferences.skipCredits")}
                  </p>
                  <p className="max-w-[25rem] font-medium">
                    {t("settings.preferences.skipCreditsDescription")}
                  </p>
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() =>
                      props.setEnableSkipCredits(!props.enableSkipCredits)
                    }
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        props.setEnableSkipCredits(!props.enableSkipCredits);
                      }
                    }}
                    className="bg-dropdown-background hover:bg-dropdown-hoverBackground select-none my-4 cursor-pointer space-x-3 flex items-center max-w-[25rem] py-3 px-4 rounded-lg outline-none focus:ring-2 focus:ring-[hsl(var(--colors-active))]"
                  >
                    <Toggle enabled={props.enableSkipCredits} />
                    <p className="flex-1 text-white font-bold">
                      {t("settings.preferences.skipCreditsLabel")}
                    </p>
                  </div>
                </div>
              )}
          </div>
          {/* Low Performance Mode */}
          <div>
            <p className="text-white font-bold mb-3">
              {t("settings.preferences.lowPerformanceMode")}
            </p>
            <p className="max-w-[25rem] font-medium">
              {t("settings.preferences.lowPerformanceModeDescription")}
            </p>
            <div
              role="button"
              tabIndex={0}
              onClick={handleLowPerformanceModeToggle}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  handleLowPerformanceModeToggle();
                }
              }}
              className="bg-dropdown-background hover:bg-dropdown-hoverBackground select-none my-4 cursor-pointer space-x-3 flex items-center max-w-[25rem] py-3 px-4 rounded-lg outline-none focus:ring-2 focus:ring-[hsl(var(--colors-active))]"
            >
              <Toggle enabled={props.enableLowPerformanceMode} />
              <p className="flex-1 text-white font-bold">
                {t("settings.preferences.lowPerformanceModeLabel")}
              </p>
            </div>
          </div>

          {/* Hold to Boost Preference */}
          <div>
            <p className="text-white font-bold mb-3">
              {t("settings.preferences.holdToBoost")}
            </p>
            <p className="max-w-[25rem] font-medium">
              {t("settings.preferences.holdToBoostDescription")}
            </p>
            <div
              role="button"
              tabIndex={0}
              onClick={() =>
                props.setEnableHoldToBoost(!props.enableHoldToBoost)
              }
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  props.setEnableHoldToBoost(!props.enableHoldToBoost);
                }
              }}
              className="bg-dropdown-background hover:bg-dropdown-hoverBackground select-none my-4 cursor-pointer space-x-3 flex items-center max-w-[25rem] py-3 px-4 rounded-lg outline-none focus:ring-2 focus:ring-[hsl(var(--colors-active))]"
            >
              <Toggle enabled={props.enableHoldToBoost} />
              <p className="flex-1 text-white font-bold">
                {t("settings.preferences.holdToBoostLabel")}
              </p>
            </div>
          </div>

          {/* Double Click to Seek Preference */}
          <div>
            <p className="text-white font-bold mb-3">
              {t("settings.preferences.doubleClickToSeek")}
            </p>
            <p className="max-w-[25rem] font-medium">
              {t("settings.preferences.doubleClickToSeekDescription")}
            </p>
            <div
              role="button"
              tabIndex={0}
              onClick={() =>
                props.setEnableDoubleClickToSeek(!props.enableDoubleClickToSeek)
              }
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  props.setEnableDoubleClickToSeek(
                    !props.enableDoubleClickToSeek,
                  );
                }
              }}
              className="bg-dropdown-background hover:bg-dropdown-hoverBackground select-none my-4 cursor-pointer space-x-3 flex items-center max-w-[25rem] py-3 px-4 rounded-lg outline-none focus:ring-2 focus:ring-[hsl(var(--colors-active))]"
            >
              <Toggle enabled={props.enableDoubleClickToSeek} />
              <p className="flex-1 text-white font-bold">
                {t("settings.preferences.doubleClickToSeekLabel")}
              </p>
            </div>
          </div>

          {/* Auto Skip Segments Preference */}
          <div>
            <p className="text-white font-bold mb-3">
              {t("settings.preferences.autoSkipSegments", "Auto-Skip Segments")}
            </p>
            <p className="max-w-[25rem] font-medium">
              {t(
                "settings.preferences.autoSkipSegmentsDescription",
                "Automatically skip intro, recap, and preview segments when available. Uses data from TheIntroDB and other community sources.",
              )}
            </p>
            <div
              role="button"
              tabIndex={0}
              onClick={() => {
                const store = usePreferencesStore.getState();
                store.setEnableAutoSkipSegments(!store.enableAutoSkipSegments);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  const store = usePreferencesStore.getState();
                  store.setEnableAutoSkipSegments(
                    !store.enableAutoSkipSegments,
                  );
                }
              }}
              className="bg-dropdown-background hover:bg-dropdown-hoverBackground select-none my-4 cursor-pointer space-x-3 flex items-center max-w-[25rem] py-3 px-4 rounded-lg outline-none focus:ring-2 focus:ring-[hsl(var(--colors-active))]"
            >
              <Toggle
                enabled={usePreferencesStore((s) => s.enableAutoSkipSegments)}
              />
              <p className="flex-1 text-white font-bold">
                {t(
                  "settings.preferences.autoSkipSegmentsLabel",
                  "Auto-skip segments",
                )}
              </p>
            </div>
          </div>

          {/* Pause Overlay Preference */}
          <div>
            <p className="text-white font-bold mb-3">
              {t("settings.preferences.pauseOverlay", "Pause Overlay")}
            </p>
            <p className="max-w-[25rem] font-medium">
              {t(
                "settings.preferences.pauseOverlayDescription",
                "Show media information (title, poster, episode details) when the video is paused.",
              )}
            </p>
            <div
              role="button"
              tabIndex={0}
              onClick={() => {
                const store = usePreferencesStore.getState();
                store.setEnablePauseOverlay(!store.enablePauseOverlay);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  const store = usePreferencesStore.getState();
                  store.setEnablePauseOverlay(!store.enablePauseOverlay);
                }
              }}
              className="bg-dropdown-background hover:bg-dropdown-hoverBackground select-none my-4 cursor-pointer space-x-3 flex items-center max-w-[25rem] py-3 px-4 rounded-lg outline-none focus:ring-2 focus:ring-[hsl(var(--colors-active))]"
            >
              <Toggle
                enabled={usePreferencesStore((s) => s.enablePauseOverlay)}
              />
              <p className="flex-1 text-white font-bold">
                {t("settings.preferences.pauseOverlayLabel", "Pause overlay")}
              </p>
            </div>
          </div>
        </div>

        {/* Column */}
        <div id="source-order" className="space-y-8">
          <div className="flex flex-col gap-3">
            {/* Manual Source Selection */}
            <div>
              <p className="text-white font-bold mb-3">
                {t("settings.preferences.manualSource")}
              </p>
              <p className="max-w-[25rem] font-medium">
                {t("settings.preferences.manualSourceDescription")}
              </p>
              <div
                role="button"
                tabIndex={0}
                onClick={() =>
                  props.setManualSourceSelection(!props.manualSourceSelection)
                }
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    props.setManualSourceSelection(
                      !props.manualSourceSelection,
                    );
                  }
                }}
                className="bg-dropdown-background hover:bg-dropdown-hoverBackground select-none my-4 cursor-pointer space-x-3 flex items-center max-w-[25rem] py-3 px-4 rounded-lg outline-none focus:ring-2 focus:ring-[hsl(var(--colors-active))]"
              >
                <Toggle enabled={props.manualSourceSelection} />
                <p className="flex-1 text-white font-bold">
                  {t("settings.preferences.manualSourceLabel")}
                </p>
              </div>
            </div>

            {/* Auto Resume on Playback Error */}
            <div>
              <p className="text-white font-bold mb-3">
                {t("settings.preferences.autoResumeOnPlaybackError")}
              </p>
              <p className="max-w-[25rem] font-medium">
                {t("settings.preferences.autoResumeOnPlaybackErrorDescription")}
              </p>
              <div
                role="button"
                tabIndex={0}
                onClick={() =>
                  props.setEnableAutoResumeOnPlaybackError(
                    !props.enableAutoResumeOnPlaybackError,
                  )
                }
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    props.setEnableAutoResumeOnPlaybackError(
                      !props.enableAutoResumeOnPlaybackError,
                    );
                  }
                }}
                className="bg-dropdown-background hover:bg-dropdown-hoverBackground select-none my-4 cursor-pointer space-x-3 flex items-center max-w-[25rem] py-3 px-4 rounded-lg outline-none focus:ring-2 focus:ring-[hsl(var(--colors-active))]"
              >
                <Toggle enabled={props.enableAutoResumeOnPlaybackError} />
                <p className="flex-1 text-white font-bold">
                  {t("settings.preferences.autoResumeOnPlaybackErrorLabel")}
                </p>
              </div>
            </div>

            {/* Last Successful Source Preference */}
            <div>
              <p className="text-white font-bold mb-3">
                {t("settings.preferences.lastSuccessfulSource")}
              </p>
              <p className="max-w-[25rem] font-medium">
                {t("settings.preferences.lastSuccessfulSourceDescription")}
              </p>
              <div
                role="button"
                tabIndex={0}
                onClick={() =>
                  props.setEnableLastSuccessfulSource(
                    !props.enableLastSuccessfulSource,
                  )
                }
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    props.setEnableLastSuccessfulSource(
                      !props.enableLastSuccessfulSource,
                    );
                  }
                }}
                className="bg-dropdown-background hover:bg-dropdown-hoverBackground select-none my-4 cursor-pointer space-x-3 flex items-center max-w-[25rem] py-3 px-4 rounded-lg outline-none focus:ring-2 focus:ring-[hsl(var(--colors-active))]"
              >
                <Toggle enabled={props.enableLastSuccessfulSource} />
                <p className="flex-1 text-white font-bold">
                  {t("settings.preferences.lastSuccessfulSourceEnableLabel")}
                </p>
              </div>
            </div>

            <p className="text-white font-bold">
              {t("settings.preferences.sourceOrder")}
            </p>
            <div className="max-w-[25rem] font-medium">
              <Trans
                i18nKey="settings.preferences.sourceOrderDescription"
                components={{
                  bold: (
                    <span
                      role="button"
                      tabIndex={0}
                      aria-label={t(
                        "settings.preferences.sourceOrderDescriptionLink",
                        "Go to extension onboarding",
                      )}
                      className="text-type-link font-bold cursor-pointer outline-none hover:underline focus:underline"
                      onClick={() => navigate("/onboarding/extension")}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          navigate("/onboarding/extension");
                        }
                      }}
                    />
                  ),
                }}
              />
              <div
                role="button"
                tabIndex={0}
                onClick={() =>
                  props.setenableSourceOrder(!props.enableSourceOrder)
                }
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    props.setenableSourceOrder(!props.enableSourceOrder);
                  }
                }}
                className="bg-dropdown-background hover:bg-dropdown-hoverBackground select-none my-4 cursor-pointer space-x-3 flex items-center max-w-[25rem] py-3 px-4 rounded-lg outline-none focus:ring-2 focus:ring-[hsl(var(--colors-active))]"
              >
                <Toggle enabled={props.enableSourceOrder} />
                <p className="flex-1 text-white font-bold">
                  {t("settings.preferences.sourceOrderEnableLabel")}
                </p>
              </div>
            </div>

            {props.enableSourceOrder && (
              <div className="w-full flex flex-col gap-4">
                <SortableListWithToggles
                  items={sourceItems}
                  setItems={(items) =>
                    props.setSourceOrder(items.map((item) => item.id))
                  }
                  onToggle={handleSourceToggle}
                />
                <Button
                  className="max-w-[25rem]"
                  theme="secondary"
                  onClick={() =>
                    props.setSourceOrder(allSources.map((s) => s.id))
                  }
                >
                  {t("settings.reset")}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
