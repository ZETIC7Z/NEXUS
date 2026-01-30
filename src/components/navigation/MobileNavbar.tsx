import { AnimatePresence, motion } from "framer-motion";
import { History, Home, Search, User, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import nexusLogo from "@/assets/nexus-logo.svg";

import MenuPopup from "./MenuPopup";

interface NavItem {
  id: string;
  label: string;
  icon: typeof Home;
  path: string;
}

const navItems: NavItem[] = [
  { id: "home", label: "Home", icon: Home, path: "/" },
  { id: "search", label: "Search", icon: Search, path: "/search" },
  { id: "recent", label: "Recent", icon: History, path: "/watch-history" },
  { id: "profile", label: "Profile", icon: User, path: "/settings" },
];

function MobileNavBar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSettingsUnsaved, setIsSettingsUnsaved] = useState(false);

  const isActive = (path: string) => {
    if (path === "/" && location.pathname === "/discover") return true;
    return location.pathname === path;
  };

  // Listen for settings unsaved/saved events
  useEffect(() => {
    const handleUnsaved = () => setIsSettingsUnsaved(true);
    const handleSaved = () => setIsSettingsUnsaved(false);

    window.addEventListener("settings-unsaved", handleUnsaved);
    window.addEventListener("settings-saved", handleSaved);

    return () => {
      window.removeEventListener("settings-unsaved", handleUnsaved);
      window.removeEventListener("settings-saved", handleSaved);
    };
  }, []);

  const handleSearchClick = () => {
    setIsSearchOpen(true);
  };

  const hiddenRoutes = [
    "/",
    "/login",
    "/register",
    "/onboarding",
    "/onboarding/extension",
    "/onboarding/proxy",
    "/profile-selection",
  ];

  const isVisible =
    !hiddenRoutes.includes(location.pathname) && !isSettingsUnsaved;

  const activeColor = "#ff8c00"; // Original orange/amber glow color

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.nav
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          className="fixed bottom-0 left-0 right-0 z-[100] md:hidden pb-[env(safe-area-inset-bottom)]"
        >
          {/* Search Bar Overlay */}
          <AnimatePresence>
            {isSearchOpen && (
              <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                className="absolute bottom-24 left-4 right-4 z-[110]"
              >
                <div className="relative flex items-center bg-[#1a1a1a] border border-white/10 rounded-2xl p-2 shadow-2xl">
                  <Search className="ml-3 h-5 w-5 text-white/50" />
                  <input
                    autoFocus
                    type="text"
                    placeholder="Search movies, shows..."
                    className="flex-1 bg-transparent border-none focus:ring-0 text-white px-3 py-2 placeholder:text-white/30"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        navigate(
                          `/search?q=${encodeURIComponent(searchQuery)}`,
                        );
                        setIsSearchOpen(false);
                      }
                      if (e.key === "Escape") setIsSearchOpen(false);
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setIsSearchOpen(false)}
                    className="p-2 hover:bg-white/10 rounded-full transition-colors"
                  >
                    <X className="h-5 w-5 text-white/50" />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="relative mx-auto max-w-[420px] w-[92%] mb-6">
            {/* Navbar background pill */}
            <div className="flex items-center justify-between px-6 py-4 rounded-[2rem] bg-[#121212] border border-white/10 shadow-2xl">
              {/* Left side */}
              <div className="flex gap-8">
                {navItems.slice(0, 2).map((item) => {
                  const active = isActive(item.path);
                  const Icon = item.icon;
                  return (
                    <button
                      type="button"
                      key={item.id}
                      onClick={() => {
                        if (item.id === "search") handleSearchClick();
                        else navigate(item.path);
                      }}
                      className="flex flex-col items-center gap-1 active:scale-90 transition-all"
                    >
                      <Icon
                        className="h-6 w-6 text-white"
                        strokeWidth={active ? 2.5 : 2}
                      />
                      <span className="text-[10px] font-medium text-white">
                        {item.label}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Center spacer for the floating button */}
              <div className="w-16" />

              {/* Right side */}
              <div className="flex gap-8">
                {navItems.slice(2).map((item) => {
                  const active = isActive(item.path);
                  const Icon = item.icon;
                  return (
                    <button
                      type="button"
                      key={item.id}
                      onClick={() => navigate(item.path)}
                      className="flex flex-col items-center gap-1 active:scale-90 transition-all"
                    >
                      <Icon
                        className="h-6 w-6 text-white"
                        strokeWidth={active ? 2.5 : 2}
                      />
                      <span className="text-[10px] font-medium text-white">
                        {item.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Floating menu button */}
            <div className="absolute left-1/2 -translate-x-1/2 -top-10 flex flex-col items-center">
              <button
                type="button"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="relative flex items-center justify-center active:scale-95 transition-all group"
                style={{ zIndex: 120 }}
              >
                {/* Animated glow ring - ALWAYS ON */}
                <div
                  className="absolute rounded-full animate-pulse"
                  style={{
                    width: 88,
                    height: 88,
                    background: `radial-gradient(circle, ${activeColor}44 0%, transparent 70%)`,
                    filter: "blur(8px)",
                  }}
                />
                <div
                  className="absolute rounded-full"
                  style={{
                    width: 80,
                    height: 80,
                    background: `radial-gradient(circle, ${activeColor}66 0%, transparent 60%)`,
                    filter: "blur(4px)",
                  }}
                />

                <div
                  className="relative flex items-center justify-center rounded-full border-2 border-white/20 bg-[#121212] shadow-2xl"
                  style={{
                    width: 72,
                    height: 72,
                    boxShadow: `0 0 25px ${activeColor}, 0 0 50px ${activeColor}66`,
                  }}
                >
                  <img
                    src={nexusLogo}
                    alt="Menu"
                    className="h-10 w-10 relative z-20"
                    style={{
                      filter: `drop-shadow(0 0 6px ${activeColor})`,
                    }}
                  />
                </div>
              </button>

              <span
                className="mt-2 text-[11px] font-bold uppercase tracking-wider"
                style={{
                  color: activeColor,
                  textShadow: `0 0 10px ${activeColor}`,
                }}
              >
                Menu
              </span>
            </div>
          </div>

          {/* Popup */}
          <MenuPopup isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
        </motion.nav>
      )}
    </AnimatePresence>
  );
}

export default MobileNavBar;
export { MobileNavBar };
