import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { useLocation, useNavigate } from "react-router-dom";

import { Icon, Icons } from "@/components/Icon";
import { WideContainer } from "@/components/layout/WideContainer";
import { Heading1 } from "@/components/utils/Text";

export function MusicPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [iframeUrl, setIframeUrl] = useState("https://zxcprime.icu/music");

  // Initialize localSearch from URL directly so it survives navigation
  const [localSearch, setLocalSearch] = useState(() => {
    const params = new URLSearchParams(location.search);
    return params.get("q") || "";
  });

  // 1. Debounced Live Search Effect
  // As the user types, wait 600ms then automatically trigger the search!
  useEffect(() => {
    const handler = setTimeout(() => {
      const currentQuery = new URLSearchParams(location.search).get("q") || "";
      if (localSearch.trim() !== currentQuery) {
        if (localSearch.trim()) {
          navigate(`/music?q=${encodeURIComponent(localSearch.trim())}`, {
            replace: true,
          });
        } else {
          navigate("/music", { replace: true });
        }
      }
    }, 600);
    return () => clearTimeout(handler);
  }, [localSearch, navigate, location.search]);

  // 2. React to URL Changes to update Iframe
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const query = params.get("q");
    const timestamp = Date.now();

    // Keep input synced if back/forward browser buttons are used
    if (query && localSearch !== query) {
      setLocalSearch(query);
    } else if (!query && localSearch !== "") {
      setLocalSearch("");
    }

    if (query) {
      const safeQuery = encodeURIComponent(query).replace(/%20/g, "+");
      // Use the 'music' endpoint which triggers the results dropdown with covers automatically
      setIframeUrl(
        `https://zxcprime.icu/music?type=music&query=${safeQuery}&t=${timestamp}`,
      );
    } else {
      setIframeUrl(`https://zxcprime.icu/music?t=${timestamp}`);
    }
  }, [location.search]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (localSearch.trim()) {
      navigate(`/music?q=${encodeURIComponent(localSearch.trim())}`, {
        replace: true,
      });
    } else {
      navigate("/music", { replace: true });
    }
  };

  // 3. Dynamic Scaling for Mobile to force Desktop Layout
  const [windowWidth, setWindowWidth] = useState(
    typeof window !== "undefined" ? window.innerWidth : 1280,
  );

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const isMobile = windowWidth < 640;
  const desktopWidth = 1280;
  const scale = isMobile ? windowWidth / desktopWidth : 1;

  return (
    <>
      <Helmet>
        <title>Music - NEXUS</title>
        <meta
          name="description"
          content="Listen to your favorite music on NEXUS"
        />
      </Helmet>

      {/* 
        Container covers viewport, clearing the main navbar.
        Matches the genre page spacing while keeping the iframe structure intact.
      */}
      <div className="relative flex h-[100dvh] w-full flex-col bg-[#0f0f0f] overflow-hidden pt-[80px] sm:pt-[100px]">
        {/* Genre-style Search Bar & Spacing */}
        <div className="w-full flex-shrink-0 z-[50]">
          <WideContainer classNames="!px-4 sm:!px-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4">
              <Heading1 className="!text-2xl !font-bold text-white !mb-0">
                NEXUS Music
              </Heading1>

              {/* Mobile/Desktop Search Bar (Now visible on both) */}
              <div className="w-full sm:w-[320px]">
                <form onSubmit={handleSearchSubmit} className="relative group">
                  <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none z-10">
                    <Icon
                      icon={Icons.SEARCH}
                      className="text-white/40 group-focus-within:text-white/80 transition-colors text-base"
                    />
                  </div>
                  <input
                    type="text"
                    value={localSearch}
                    onChange={(e) => setLocalSearch(e.target.value)}
                    placeholder="Search music..."
                    className="w-full bg-[#1a1a1a] border border-[#2a2a2a] focus:border-red-600/50 rounded-xl py-3 pl-11 pr-10 text-sm text-white placeholder-white/30 outline-none transition-all shadow-lg"
                  />
                  {localSearch && (
                    <button
                      type="button"
                      onClick={() => {
                        setLocalSearch("");
                        navigate("/music", { replace: true });
                      }}
                      className="absolute inset-y-0 right-4 flex items-center text-white/30 hover:text-white/80 transition-colors z-10"
                      title="Clear search"
                    >
                      <Icon icon={Icons.X} className="text-base" />
                    </button>
                  )}
                </form>
              </div>
            </div>
          </WideContainer>
        </div>

        {/* 
          Iframe container. On mobile, we force desktop width and scale down
          to enable the automatic search results dropdown with covers.
        */}
        <div className="relative flex-1 w-full h-full overflow-hidden z-[10] border-t border-white/5 bg-black">
          <div
            style={{
              width: isMobile ? `${desktopWidth}px` : "100%",
              height: isMobile ? `${100 / scale}%` : "100%",
              transform: isMobile ? `scale(${scale})` : "none",
              transformOrigin: "top left",
              position: "absolute",
              top: 0,
              left: 0,
            }}
          >
            <iframe
              src={iframeUrl}
              title="NEXUS Music Player"
              className="absolute left-0 w-full border-none"
              style={{
                top: "-85px", // Still crop out the top navigation to hide ZXC branding
                height: "calc(100% + 85px)", // Ensure it reaches the bottom
              }}
              allowFullScreen
            />
          </div>
        </div>
      </div>
    </>
  );
}

export default MusicPage;
