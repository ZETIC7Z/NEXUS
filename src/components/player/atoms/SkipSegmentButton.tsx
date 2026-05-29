import classNames from "classnames";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";

import { Icon, Icons } from "@/components/Icon";
import { NextEpisodeButton } from "@/components/player/atoms/NextEpisodeButton";
import type { SegmentData } from "@/components/player/hooks/useSkipTime";
import { useSkipTracking } from "@/components/player/hooks/useSkipTracking";
import { Transition } from "@/components/utils/Transition";
import type { PlayerMeta } from "@/stores/player/slices/source";
import { usePlayerStore } from "@/stores/player/store";

function getSegmentText(
  type: "intro" | "recap" | "credits" | "preview",
  t: (key: string) => string,
): string {
  switch (type) {
    case "intro":
      return t("player.skipTime.intro");
    case "recap":
      return t("player.skipTime.recap");
    case "credits":
      return t("player.skipTime.credits");
    case "preview":
      return t("player.skipTime.preview");
    default:
      return t("player.skipTime.intro");
  }
}

function shouldShowSkipButton(
  currentTime: number,
  segment: SegmentData | null,
): "always" | "hover" | "none" {
  if (!segment) return "none";

  const currentTimeMs = currentTime * 1000;
  const startMs = segment.start_ms ?? 0;
  const endMs = segment.end_ms ?? Infinity;

  if (currentTimeMs >= startMs && currentTimeMs <= endMs) {
    const timeInSegment = currentTimeMs - startMs;
    if (timeInSegment <= 10000) return "always";
    return "hover";
  }

  return "none";
}

function SkipButton(props: {
  className: string;
  onClick?: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      className={classNames(
        "font-bold rounded h-10 w-40 scale-95 hover:scale-100 transition-all duration-200",
        props.className,
      )}
      type="button"
      onClick={props.onClick}
    >
      {props.children}
    </button>
  );
}

function SkipSegmentButton(props: {
  controlsShowing: boolean;
  segments: SegmentData[];
  inControl: boolean;
  onChangeMeta?: (meta: PlayerMeta) => void;
  onSkipTriggered?: (segment: SegmentData, skipTime: number) => void;
}) {
  const { t } = useTranslation();
  const time = usePlayerStore((s) => s.progress.time);
  const _duration = usePlayerStore((s) => s.progress.duration);
  const status = usePlayerStore((s) => s.status);
  const display = usePlayerStore((s) => s.display);
  const meta = usePlayerStore((s) => s.meta);
  const { addSkipEvent } = useSkipTracking(20);

  const shouldShowNextEpisodeInsteadOfCredits =
    meta?.type === "show" &&
    props.segments.some((segment) => {
      if (segment.type !== "credits") return false;
      return segment.end_ms === null;
    });

  const activeSegments = props.segments.filter((segment) => {
    if (segment.type === "credits" && shouldShowNextEpisodeInsteadOfCredits) {
      return false;
    }
    const showingState = shouldShowSkipButton(time, segment);
    return showingState !== "none";
  });

  const creditsSegment = props.segments.find(
    (s) => s.type === "credits" && s.end_ms === null,
  );
  const inCreditsSegment =
    creditsSegment != null && time * 1000 >= (creditsSegment.start_ms ?? 0);
  const showNextEpisodeButton =
    shouldShowNextEpisodeInsteadOfCredits &&
    props.inControl &&
    inCreditsSegment;

  const handleSkip = useCallback(
    (segment: SegmentData) => {
      if (!display) return;

      const startTime = time;
      const targetTime = segment.end_ms ? segment.end_ms / 1000 : _duration;
      const skipDuration = targetTime - startTime;
      display.setTime(targetTime);

      addSkipEvent({
        startTime,
        endTime: targetTime,
        skipDuration,
        confidence: 0.95,
        meta: meta
          ? {
              title:
                meta.type === "show" && meta.episode
                  ? `${meta.title} - S${meta.season?.number || 0}E${meta.episode.number || 0}`
                  : meta.title,
              type: meta.type === "movie" ? "Movie" : "TV Show",
              tmdbId: meta.tmdbId,
              seasonNumber: meta.season?.number,
              episodeNumber: meta.episode?.number,
            }
          : undefined,
      });

      if (props.onSkipTriggered) {
        props.onSkipTriggered(segment, targetTime);
      }
    },
    [display, time, _duration, addSkipEvent, meta, props],
  );

  if (!props.inControl) return null;
  if (status !== "playing") return null;
  if (activeSegments.length === 0 && !showNextEpisodeButton) return null;

  return (
    <>
      <div className="absolute right-[calc(3rem+env(safe-area-inset-right))] bottom-0">
        {activeSegments.map((segment, index) => {
          const showingState = shouldShowSkipButton(time, segment);
          const animation = showingState === "hover" ? "slide-up" : "fade";

          let bottom = "bottom-[calc(6rem+env(safe-area-inset-bottom))]";
          if (showingState === "always") {
            bottom = props.controlsShowing
              ? bottom
              : "bottom-[calc(3rem+env(safe-area-inset-bottom))]";
          }

          const verticalOffset = index * 60;
          const adjustedBottom = bottom.replace(
            /bottom-\[calc\(([^)]+)\)\]/,
            `bottom-[calc($1 + ${verticalOffset}px)]`,
          );

          let show = false;
          if (showingState === "always") show = true;
          else if (showingState === "hover" && props.controlsShowing)
            show = true;

          return (
            <Transition
              key={segment.type}
              animation={animation}
              show={show}
              className="absolute right-0"
            >
              <div
                className={classNames([
                  "absolute bottom-0 right-0 transition-[bottom] duration-200 flex items-center space-x-3",
                  adjustedBottom,
                ])}
              >
                <SkipButton
                  onClick={() => handleSkip(segment)}
                  className="bg-buttons-primary hover:bg-buttons-primaryHover text-buttons-primaryText flex justify-center items-center"
                >
                  <Icon className="text-xl mr-1" icon={Icons.SKIP_EPISODE} />
                  {getSegmentText(segment.type, t)}
                </SkipButton>
              </div>
            </Transition>
          );
        })}
      </div>
      {showNextEpisodeButton && (
        <NextEpisodeButton
          controlsShowing={props.controlsShowing}
          onChange={props.onChangeMeta}
          inControl={props.inControl}
        />
      )}
    </>
  );
}

export { SkipSegmentButton };
