import { ReactNode } from "react";
import { useLocation } from "react-router-dom";

import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
import { useBannerSize, useBannerStore } from "@/stores/banner";
import { BannerLocation } from "@/stores/banner/BannerLocation";

export function Layout(props: { children: ReactNode }) {
  const bannerSize = useBannerSize();
  const location = useBannerStore((s) => s.location);
  const routeLocation = useLocation();

  // Hide mobile nav on player pages for fullscreen
  const isPlayerPage = routeLocation.pathname.startsWith("/media/");

  return (
    <div className={isPlayerPage ? "overflow-hidden" : ""}>
      <div className="fixed inset-x-0 z-[1000]">
        <BannerLocation />
      </div>
      <div
        style={{
          paddingTop: location === null ? `${bannerSize}px` : "0px",
        }}
        className={
          isPlayerPage
            ? "flex min-h-screen flex-col overflow-hidden"
            : "flex min-h-screen flex-col pb-20 md:pb-0"
        }
      >
        {props.children}
      </div>
      {!isPlayerPage && <MobileBottomNav />}
    </div>
  );
}
