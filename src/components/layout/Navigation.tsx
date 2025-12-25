import classNames from "classnames";
import { useCallback, useEffect, useRef, useState } from "react";
import { Link, To, useLocation, useNavigate } from "react-router-dom";

import { NoUserAvatar, UserAvatar } from "@/components/Avatar";
import { Icon, Icons } from "@/components/Icon";
import { LinksDropdown } from "@/components/LinksDropdown";
import { useNotifications } from "@/components/overlays/notificationsModal";
import { PWAInstallButton } from "@/components/PWAInstallButton";
import { useAuth } from "@/hooks/auth/useAuth";
import { useBannerSize } from "@/stores/banner";

import { BrandPill } from "./BrandPill";

export interface NavigationProps {
  bg?: boolean;
}

interface NavLinkProps {
  to: string;
  children: React.ReactNode;
  isActive?: boolean;
}

function NavLink({ to, children, isActive }: NavLinkProps) {
  const navigate = useNavigate();

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    window.scrollTo(0, 0);
    navigate(to);
  };

  return (
    <a
      href={to}
      onClick={handleClick}
      className={classNames(
        "text-sm font-medium transition-colors duration-200 hover:text-white whitespace-nowrap",
        isActive ? "text-white" : "text-gray-300",
      )}
    >
      {children}
    </a>
  );
}

export function Navigation(props: NavigationProps) {
  const bannerHeight = useBannerSize();
  const navigate = useNavigate();
  const location = useLocation();
  const { loggedIn } = useAuth();
  const [scrollPosition, setScrollPosition] = useState(0);
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

  // Calculate background opacity based on scroll position
  const getBackgroundOpacity = () => {
    const maxScroll = 100;
    return Math.min(scrollPosition, maxScroll) / maxScroll;
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
        <div
          className={classNames("transition-colors duration-300 ease-in-out")}
          style={{
            backgroundColor: `rgba(20, 20, 20, ${props.bg || scrollPosition > 50 ? getBackgroundOpacity() : 0})`,
          }}
        >
          <div className="px-4 md:px-12 py-3 flex items-center justify-between">
            {/* Left side - Logo and Nav Links */}
            <div className="flex items-center space-x-6 md:space-x-8">
              <Link
                className="block tabbable rounded-full text-xs ssm:text-base"
                to="/"
                onClick={() => window.scrollTo(0, 0)}
              >
                <BrandPill clickable header />
              </Link>

              {/* Navigation Links - Hidden on mobile */}
              <nav className="hidden md:flex items-center space-x-5">
                <NavLink
                  to="/discover"
                  isActive={
                    isActive("/discover") ||
                    (isActive("/") &&
                      !isActive("/movies") &&
                      !isActive("/tv") &&
                      !isActive("/anime") &&
                      !isActive("/my-bookmarks"))
                  }
                >
                  Home
                </NavLink>
                <NavLink to="/movies" isActive={isActive("/movies")}>
                  Movies
                </NavLink>
                <NavLink to="/tv" isActive={isActive("/tv")}>
                  TV Series
                </NavLink>
                <NavLink to="/anime" isActive={isActive("/anime")}>
                  Anime
                </NavLink>
                <NavLink
                  to="/my-bookmarks"
                  isActive={isActive("/my-bookmarks")}
                >
                  My Bookmarks
                </NavLink>
              </nav>

              {/* Mobile Hamburger Menu Button - COMPLETELY HIDDEN */}
              <button
                type="button"
                className="hidden"
                onClick={() => setMobileMenuOpen(true)}
                aria-label="Open menu"
              >
                <Icon icon={Icons.MENU} className="text-xl" />
              </button>
            </div>

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
