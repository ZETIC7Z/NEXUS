import { useTranslation } from "react-i18next";

import { useSkipTime } from "@/components/player/hooks/useSkipTime";
import { Menu } from "@/components/player/internals/ContextMenu";
import { useOverlayRouter } from "@/hooks/useOverlayRouter";
import { usePlayerStore } from "@/stores/player/store";
import { formatSeconds } from "@/utils/formatSeconds";

export function SkipSegmentsView({ id }: { id: string }) {
  const { t } = useTranslation();
  const router = useOverlayRouter(id);
  const display = usePlayerStore((s) => s.display);
  const segments = useSkipTime();

  const handleSeek = (seconds: number) => {
    display?.setTime(seconds);
  };

  const getSegmentTypeLabel = (
    type: "intro" | "recap" | "credits" | "preview",
  ) => {
    switch (type) {
      case "intro":
        return t("player.segment.intro");
      case "recap":
        return t("player.segment.recap");
      case "credits":
        return t("player.segment.credits");
      case "preview":
        return t("player.segment.preview");
      default:
        return type;
    }
  };

  return (
    <>
      <Menu.BackLink onClick={() => router.navigate("/")}>
        {t("player.skipTime.skipSegments")}
      </Menu.BackLink>
      <Menu.Section>
        <div className="space-y-2">
          {segments.length === 0 ? (
            <div className="text-center py-4 text-type-secondary">
              {t("player.skipTime.noSegments")}
            </div>
          ) : (
            segments.map((segment) => {
              const startTime = (segment.start_ms ?? 0) / 1000;
              const endTime = segment.end_ms ? segment.end_ms / 1000 : null;

              return (
                <button
                  key={`${segment.type}-${segment.submission_count}-${segment.start_ms || "null"}`}
                  type="button"
                  onClick={() => handleSeek(startTime)}
                  className="w-full text-left p-3 rounded-xl bg-video-context-light bg-opacity-10 hover:bg-opacity-20 transition-colors cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-video-context-type-main font-medium">
                      {getSegmentTypeLabel(segment.type)}
                    </span>
                    <span className="text-video-context-type-secondary text-sm">
                      {segment.start_ms === null
                        ? "0:00"
                        : formatSeconds(startTime)}{" "}
                      -{" "}
                      {endTime === null
                        ? t("player.skipTime.endOfVideo")
                        : formatSeconds(endTime)}
                    </span>
                  </div>
                  <div className="text-xs text-type-secondary mt-1">
                    {segment.submission_count} submissions
                    {segment.confidence !== null && (
                      <span className="ml-2">
                        ({Math.round(segment.confidence * 100)}% confidence)
                      </span>
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>
      </Menu.Section>
    </>
  );
}
