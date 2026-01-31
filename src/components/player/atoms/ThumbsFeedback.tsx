import { SegmentData } from "@/components/player/hooks/useSkipTime";

export interface ThumbsFeedbackProps {
  controlsShowing: boolean;
  feedbackData: { key: string; item: SegmentData } | null;
  onAction: (key: string, item: SegmentData) => void;
}

export function ThumbsFeedback({
  controlsShowing,
  feedbackData,
  onAction,
}: ThumbsFeedbackProps) {
  if (!controlsShowing) return null;

  return (
    <div className="hidden">
      {/* Placeholder for ThumbsFeedback component - restored to fix build */}
    </div>
  );
}
