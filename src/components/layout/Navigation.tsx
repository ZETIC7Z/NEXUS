import classNames from "classnames";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { Link, To, useLocation, useNavigate } from "react-router-dom";

import { NoUserAvatar, UserAvatar } from "@/components/Avatar";
import { SearchBarInput } from "@/components/form/SearchBar";
import { Icon, Icons } from "@/components/Icon";
import { LinksDropdown } from "@/components/LinksDropdown";
import { useNotifications } from "@/components/overlays/notificationsModal";
import { PWAInstallButton } from "@/components/PWAInstallButton";
import { useAuth } from "@/hooks/auth/useAuth";
import { useBannerSize } from "@/stores/banner";

import { BrandPill } from "./BrandPill";

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface NavigationProps {
  searchQuery?: string;
  onSearchChange?: (value: string, force: boolean) => void;
  onSearchUnFocus?: (newSearch?: string) => void;
  showSettingsSearch?: boolean;
}

interface NavItem {
  path: string;
  label: string;
  icon?: Icons;
}

const navItems: NavItem[] = [
  { path: "/discover", label: "Home", icon: Icons.HOME },
  { path: "/movies", label: "Movies", icon: Icons.FILM },
  { path: "/tv", label: "TV Series", icon: Icons.DISPLAY },
  { path: "/anime", label: "Anime", icon: Icons.STAR },
  { path: "/my-bookmarks", label: "My Bookmarks", icon: Icons.BOOKMARK },
];

// Pill Navigation Component with sliding indicator
function PillNavigation() {
  const navigate = useNavigate();
  const location = useLocation();
  const navRef = useRef<HTMLDivElement>(null);
  const indicatorRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<Map<string, HTMLAnchorElement>>(new Map());

  // Determine active path
  const getActivePath = useCallback(() => {
    const currentPath = location.pathname;

    // Check if current path starts with any nav item path
    for (const item of navItems) {
      if (item.path === "/discover") {
        // Home is active for "/" and "/discover"
        if (
          currentPath === "/" ||
          currentPath === "/discover" ||
          currentPath.startsWith("/discover")
        ) {
          return item.path;
        }
      } else if (currentPath.startsWith(item.path)) {
        return item.path;
      }
    }

    // Default to home
    return "/discover";
  }, [location.pathname]);

  const activePath = getActivePath();

  // Update indicator position when active item changes
  useLayoutEffect(() => {
    const activeElement = itemRefs.current.get(activePath);
    const indicator = indicatorRef.current;

    if (activeElement && indicator) {
      const width = activeElement.offsetWidth;
      const left = activeElement.offsetLeft;

      indicator.style.width = `${width}px`;
      indicator.style.left = `${left}px`;
    }
  }, [activePath]);

  const handleClick = (
    e: React.MouseEvent<HTMLAnchorElement>,
    path: string,
  ) => {
    e.preventDefault();
    window.scrollTo(0, 0);
    navigate(path);
  };

  return (
    <nav
      ref={navRef}
      className="relative hidden lg:flex items-center bg-black/80 rounded-full px-2 py-1.5 border border-white/10"
    >
      {/* Sliding Indicator */}
      <div
        ref={indicatorRef}
        className="absolute h-[calc(100%-12px)] rounded-full bg-white/20 transition-all duration-300 ease-in-out pointer-events-none"
        style={{ top: "6px" }}
      />

      {/* Nav Items */}
      {navItems.map((item) => (
        <a
          key={item.path}
          ref={(el) => {
            if (el) itemRefs.current.set(item.path, el);
          }}
          href={item.path}
          onClick={(e) => handleClick(e, item.path)}
          className={classNames(
            "relative z-10 px-5 py-2.5 text-base font-medium whitespace-nowrap transition-all duration-200 rounded-full",
            activePath === item.path
              ? "text-white"
              : "text-gray-400 hover:text-white",
          )}
        >
          {item.label}
        </a>
      ))}
    </nav>
  );
}

export function Navigation(props: NavigationProps) {
  const bannerHeight = useBannerSize();
  const navigate = useNavigate();
  const location = useLocation();
  const { loggedIn } = useAuth();
  const [_scrollPosition, setScrollPosition] = useState(0);
  const { openNotifications, getUnreadCount } = useNotifications();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Hide navigation on landing page for non-logged-in users
  const isLandingPage = location.pathname === "/" && !loggedIn;

  // Search bar state
  const [searchExpanded, setSearchExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);
  const autoFoldTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      setScrollPosition(window.scrollY);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Auto-fold search after 5 seconds of no input
  useEffect(() => {
    if (searchExpanded && searchQuery === "") {
      // Clear any existing timeout
      if (autoFoldTimeoutRef.current) {
        clearTimeout(autoFoldTimeoutRef.current);
      }

      // Set new timeout to fold after 5 seconds
      autoFoldTimeoutRef.current = setTimeout(() => {
        setSearchExpanded(false);
      }, 5000);
    }

    return () => {
      if (autoFoldTimeoutRef.current) {
        clearTimeout(autoFoldTimeoutRef.current);
      }
    };
  }, [searchExpanded, searchQuery]);

  // Focus input when search expands
  useEffect(() => {
    if (searchExpanded && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [searchExpanded]);

  const handleSearchClick = useCallback(() => {
    if (searchExpanded) {
      // If already expanded and has query, navigate to search
      if (searchQuery.trim()) {
        navigate(`/browse/${encodeURIComponent(searchQuery.trim())}`);
        setSearchExpanded(false);
        setSearchQuery("");
      } else {
        setSearchExpanded(false);
      }
    } else {
      setSearchExpanded(true);
    }
  }, [searchExpanded, searchQuery, navigate]);

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && searchQuery.trim()) {
      navigate(`/browse/${encodeURIComponent(searchQuery.trim())}`);
      setSearchExpanded(false);
      setSearchQuery("");
    } else if (e.key === "Escape") {
      setSearchExpanded(false);
      setSearchQuery("");
    }
  };

  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    // Reset timer when user types
    if (autoFoldTimeoutRef.current) {
      clearTimeout(autoFoldTimeoutRef.current);
    }
  };

  const handleClick = (path: To) => {
    window.scrollTo(0, 0);
    navigate(path);
  };

  // Check which nav item is active
  const isActive = (path: string) => {
    if (path === "/" && location.pathname === "/") return true;
    if (path !== "/" && location.pathname.startsWith(path)) return true;
    return false;
  };

  // Hide navigation on landing page
  if (isLandingPage) {
    return null;
  }

  return (
    <>
      {/* Netflix-style navigation header */}
      <div
        className="fixed left-0 right-0 z-[500] top-0"
        style={{
          top: `${bannerHeight}px`,
        }}
      >
        <div className="transition-all duration-300 ease-in-out">
          <div className="px-4 md:px-8 lg:px-12 py-3 flex items-center justify-between">
            {/* Left side - Logo */}
            <div className="flex items-center">
              <Link
                className="block tabbable rounded-full text-xs ssm:text-base"
                to="/"
                onClick={() => window.scrollTo(0, 0)}
              >
                <BrandPill clickable header />
              </Link>
            </div>

            {/* Center - Pill Navigation or Settings Search */}
            {!location.pathname.startsWith("/settings") &&
              !location.pathname.startsWith("/register") &&
              !location.pathname.startsWith("/login") &&
              !location.pathname.startsWith("/onboarding") && (
                <div className="hidden lg:flex flex-1 justify-center">
                  <PillNavigation />
                </div>
              )}

            {/* Settings Search */}
            {location.pathname.startsWith("/settings") &&
              props.showSettingsSearch &&
              props.onSearchChange && (
                <div className="hidden lg:flex flex-1 justify-center max-w-xl mx-auto">
                  <div className="w-full">
                    <SearchBarInput
                      value={props.searchQuery || ""}
                      onChange={props.onSearchChange}
                      onUnFocus={props.onSearchUnFocus || (() => {})}
                      placeholder="Search settings..."
                      hideTooltip
                    />
                  </div>
                </div>
              )}

            {/* Right side - Icons */}
            <div className="flex items-center space-x-3">
              {/* Expandable Search Bar */}
              <div className="relative flex items-center">
                <div
                  className={classNames(
                    "flex items-center transition-all duration-300 ease-in-out overflow-hidden",
                    searchExpanded
                      ? "bg-black/80 border border-white/50 rounded"
                      : "bg-transparent border-transparent",
                  )}
                  style={{
                    width: searchExpanded ? "280px" : "40px",
                  }}
                >
                  {/* Search Icon Button */}
                  <button
                    type="button"
                    onClick={handleSearchClick}
                    className="flex items-center justify-center w-10 h-10 text-white hover:text-gray-300 transition-colors flex-shrink-0"
                    aria-label="Search"
                  >
                    <Icon icon={Icons.SEARCH} className="text-xl" />
                  </button>

                  {/* Search Input */}
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={handleSearchInputChange}
                    onKeyDown={handleSearchKeyDown}
                    placeholder="What do you want to watch?"
                    className={classNames(
                      "bg-transparent text-white placeholder-gray-400 outline-none text-sm transition-all duration-300",
                      searchExpanded
                        ? "w-full pr-3 opacity-100"
                        : "w-0 opacity-0",
                    )}
                  />
                </div>
              </div>

              {/* Notifications */}
              <button
                type="button"
                onClick={() => openNotifications()}
                className="text-white cursor-pointer hover:text-gray-300 transition-colors relative p-2"
              >
                <Icon icon={Icons.BELL} className="text-xl" />
                {(() => {
                  const count = getUnreadCount();
                  const shouldShow =
                    typeof count === "number" ? count > 0 : count === "99+";
                  return shouldShow ? (
                    <span className="absolute -top-0.5 -right-0.5 bg-red-600 text-white text-[10px] rounded-full min-w-[14px] h-3.5 px-1 flex items-center justify-center">
                      {count}
                    </span>
                  ) : null;
                })()}
              </button>

              {/* PWA Install Button - Mobile only */}
              <div className="md:hidden">
                <PWAInstallButton />
              </div>

              {/* User Avatar - HIDDEN ON MOBILE */}
              <div className="relative hidden md:block">
                <LinksDropdown>
                  {loggedIn ? <UserAvatar withName /> : <NoUserAvatar />}
                </LinksDropdown>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Side Panel Menu */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-[600] md:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Side Panel */}
          <div className="absolute top-0 left-0 h-full w-72 bg-[#141414] shadow-2xl animate-slideIn">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <BrandPill clickable />
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="text-white p-2 hover:bg-white/10 rounded transition-colors"
                aria-label="Close menu"
              >
                <Icon icon={Icons.X} className="text-xl" />
              </button>
            </div>

            {/* Navigation Links */}
            <nav className="p-4 space-y-2">
              <button
                type="button"
                onClick={() => {
                  handleClick("/discover");
                  setMobileMenuOpen(false);
                }}
                className={classNames(
                  "w-full text-left px-4 py-3 rounded-lg transition-colors flex items-center gap-3",
                  isActive("/discover")
                    ? "bg-white/10 text-white"
                    : "text-gray-300 hover:bg-white/5",
                )}
              >
                <Icon icon={Icons.HOME} className="text-lg" />
                Home
              </button>
              <button
                type="button"
                onClick={() => {
                  handleClick("/movies");
                  setMobileMenuOpen(false);
                }}
                className={classNames(
                  "w-full text-left px-4 py-3 rounded-lg transition-colors flex items-center gap-3",
                  isActive("/movies")
                    ? "bg-white/10 text-white"
                    : "text-gray-300 hover:bg-white/5",
                )}
              >
                <Icon icon={Icons.FILM} className="text-lg" />
                Movies
              </button>
              <button
                type="button"
                onClick={() => {
                  handleClick("/tv");
                  setMobileMenuOpen(false);
                }}
                className={classNames(
                  "w-full text-left px-4 py-3 rounded-lg transition-colors flex items-center gap-3",
                  isActive("/tv")
                    ? "bg-white/10 text-white"
                    : "text-gray-300 hover:bg-white/5",
                )}
              >
                <Icon icon={Icons.DISPLAY} className="text-lg" />
                TV Series
              </button>
              <button
                type="button"
                onClick={() => {
                  handleClick("/anime");
                  setMobileMenuOpen(false);
                }}
                className={classNames(
                  "w-full text-left px-4 py-3 rounded-lg transition-colors flex items-center gap-3",
                  isActive("/anime")
                    ? "bg-white/10 text-white"
                    : "text-gray-300 hover:bg-white/5",
                )}
              >
                <Icon icon={Icons.STAR} className="text-lg" />
                Anime
              </button>
              <button
                type="button"
                onClick={() => {
                  handleClick("/my-bookmarks");
                  setMobileMenuOpen(false);
                }}
                className={classNames(
                  "w-full text-left px-4 py-3 rounded-lg transition-colors flex items-center gap-3",
                  isActive("/my-bookmarks")
                    ? "bg-white/10 text-white"
                    : "text-gray-300 hover:bg-white/5",
                )}
              >
                <Icon icon={Icons.BOOKMARK} className="text-lg" />
                My Bookmarks
              </button>
            </nav>

            {/* Divider */}
            <div className="mx-4 border-t border-white/10" />

            {/* Settings & Account */}
            <div className="p-4 space-y-2">
              <button
                type="button"
                onClick={() => {
                  handleClick("/settings");
                  setMobileMenuOpen(false);
                }}
                className="w-full text-left px-4 py-3 rounded-lg transition-colors flex items-center gap-3 text-gray-300 hover:bg-white/5"
              >
                <Icon icon={Icons.SETTINGS} className="text-lg" />
                Settings
              </button>
              {loggedIn && (
                <button
                  type="button"
                  onClick={() => {
                    handleClick("/settings/account");
                    setMobileMenuOpen(false);
                  }}
                  className="w-full text-left px-4 py-3 rounded-lg transition-colors flex items-center gap-3 text-gray-300 hover:bg-white/5"
                >
                  <Icon icon={Icons.PROFILE} className="text-lg" />
                  Account
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
