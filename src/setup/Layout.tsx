import classNames from "classnames";
import { useLocation } from "react-router-dom";

import { Navigation } from "@/components/layout/Navigation";
import { YouTubeSidebar } from "@/components/layout/YouTubeSidebar";
import { useAuth } from "@/hooks/auth/useAuth";
import { useBannerSize } from "@/stores/banner";
import { useSidebarStore } from "@/stores/sidebar";

export function Layout(props: { children: React.ReactNode }) {
  const bannerSize = useBannerSize();
  const location = useLocation().pathname;
  const { isExpanded } = useSidebarStore();
  const { loggedIn } = useAuth();

  const isPlayerPage = location.startsWith("/watch");
  const isLandingPage = location === "/" && !loggedIn;
  const isOnboarding = location.startsWith("/onboarding");
  const isLogin = location.startsWith("/login");
  const isRegister = location.startsWith("/register");
  const isSettings = location.startsWith("/settings");

  const showSidebar =
    !isPlayerPage &&
    !isLandingPage &&
    !isOnboarding &&
    !isLogin &&
    !isRegister &&
    !isSettings;

  return (
    <>
      <Navigation />
      {showSidebar && <YouTubeSidebar />}
      <div
        style={{
          paddingTop: location === null ? `${bannerSize}px` : "0px",
        }}
        className={classNames(
          "flex min-h-screen flex-col transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]",
          // Mobile (< md): Overlay (pl-0)
          // Desktop (>= lg): Hidden (pl-0)
          // Tablet (md <= x < lg): Rail (pl-20 or pl-64)
          showSidebar && isExpanded && "pl-0 md:pl-64 lg:pl-0",
          showSidebar && !isExpanded && "pl-0 md:pl-20 lg:pl-0",
        )}
      >
        {props.children}
      </div>
    </>
  );
}
