import classNames from "classnames";

import { useIsMobile } from "@/hooks/useIsMobile";

export function BrandPill(props: {
  clickable?: boolean;
  header?: boolean;
  backgroundClass?: string;
  large?: boolean;
}) {
  const isMobile = useIsMobile();

  // Logo sizes - smaller player logo
  const getLogoSize = () => {
    if (props.large) {
      return "h-18 md:h-20"; // Video player - smaller
    }
    if (isMobile && props.header) {
      return "h-20"; // Mobile header
    }
    return "h-28"; // Desktop header
  };

  // On mobile header, NO background - just logo
  if (isMobile && props.header) {
    return (
      <img
        src="/nexus-logo-full.png?v=5"
        alt="NEXUS"
        className={`object-contain ${getLogoSize()}`}
      />
    );
  }

  // Video player - NO background, just logo
  if (props.large) {
    return (
      <img
        src="/nexus-logo-full.png?v=5"
        alt="NEXUS"
        className={`object-contain ${getLogoSize()}`}
      />
    );
  }

  // Desktop header - with background
  return (
    <div
      className={classNames(
        "flex items-center rounded-full px-3 py-1.5 backdrop-blur-lg",
        props.backgroundClass ?? "bg-pill-background bg-opacity-50",
        props.clickable
          ? "transition-[transform,background-color] hover:scale-105 hover:bg-pill-backgroundHover active:scale-95"
          : "",
      )}
    >
      <img
        src="/nexus-logo-full.png?v=5"
        alt="NEXUS"
        className={`object-contain ${getLogoSize()}`}
      />
    </div>
  );
}
