import classNames from "classnames";
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { Icon, Icons } from "@/components/Icon";
import { useIsMobile } from "@/hooks/useIsMobile";

export function MobileBottomNav() {
  const { isMobile } = useIsMobile();
  const navigate = useNavigate();
  const location = useLocation();
  const [showMenu, setShowMenu] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  // Navigation items: Home, Search, Bookmark, Menu, Profile
  const navItems = [
    { path: "/", icon: Icons.HOME, label: "Home" },
    { path: "search", icon: Icons.SEARCH, label: "Search" },
    { path: "/my-bookmarks", icon: Icons.BOOKMARK, label: "Saved" },
    { path: "menu", icon: Icons.MENU, label: "Menu" },
    { path: "/settings", icon: Icons.USER, label: "Profile" },
  ];

  // Menu items for the bottom sheet
  const menuItems = [
    { path: "/movies", label: "Movies", icon: Icons.FILM },
    { path: "/tv", label: "TV Shows", icon: Icons.DISPLAY },
    { path: "/anime", label: "Anime", icon: Icons.STAR },
    { path: "/discover", label: "Discover", icon: Icons.RISING },
    { path: "/settings", label: "Appearance", icon: Icons.CIRCLE_HALF },
  ];

  // Determine active index based on current path
  useEffect(() => {
    const isHome =
      location.pathname === "/" ||
      location.pathname.startsWith("/discover") ||
      location.pathname === "/browse";
    const isBookmarks =
      location.pathname === "/my-bookmarks" ||
      location.pathname === "/bookmarks";
    const isSettings = location.pathname === "/settings";

    if (showMenu) {
      setActiveIndex(3); // Menu is active when sheet is open
    } else if (isHome) {
      setActiveIndex(0);
    } else if (isBookmarks) {
      setActiveIndex(2);
    } else if (isSettings) {
      setActiveIndex(4);
    } else {
      setActiveIndex(0); // Default to Home
    }
  }, [location.pathname, showMenu]);

  if (!isMobile) return null;

  const handleNavigation = (path: string) => {
    window.scrollTo(0, 0);
    navigate(path);
    setShowMenu(false);
  };

  const handleItemClick = (item: (typeof navItems)[0], index: number) => {
    if (item.path === "search") {
      // Dispatch custom event to toggle search bar
      window.dispatchEvent(
        new CustomEvent("toggleMobileSearch", {
          detail: { show: true },
        }),
      );
      setShowMenu(false);
      setActiveIndex(index);
    } else if (item.path === "menu") {
      setShowMenu(!showMenu);
    } else {
      setActiveIndex(index);
      handleNavigation(item.path);
    }
  };

  return (
    <>
      {/* Styles for Magic Navigation - Exact CSS from specification */}
      <style>{`
        :root {
          --nav-bg: #222327;
          --bg-body: #111111;
          --bg-sheet: #1e1f23;
          --nav-primary: #06b6d4;
          --text-main: #ffffff;
          --text-muted: #aaaaaa;
        }

        /* ========================= */
        /* BOTTOM SHEET (MENU)       */
        /* ========================= */
        .bottom-sheet {
          position: fixed;
          bottom: 90px;
          left: 50%;
          transform: translateX(-50%) translateY(150%);
          width: 95%;
          max-width: 400px;
          background: var(--bg-sheet);
          border-radius: 20px;
          padding: 20px;
          box-shadow: 0 -5px 30px rgba(0,0,0,0.5);
          z-index: 10;
          transition: 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          opacity: 0;
          pointer-events: none;
          border: 1px solid #333;
        }
        .bottom-sheet.show {
          transform: translateX(-50%) translateY(0);
          opacity: 1;
          pointer-events: all;
        }

        .sheet-header h3 {
          color: var(--text-main);
          margin-bottom: 15px;
          padding-left: 10px;
          border-left: 4px solid var(--nav-primary);
          font-size: 1rem;
        }
        .sheet-content {
          display: flex;
          flex-direction: column;
          gap: 5px;
        }
        .sheet-item {
          display: flex;
          align-items: center;
          gap: 15px;
          padding: 12px 15px;
          text-decoration: none;
          color: var(--text-muted);
          border-radius: 12px;
          transition: 0.3s;
          font-weight: 500;
          cursor: pointer;
          background: transparent;
          border: none;
          width: 100%;
          text-align: left;
        }
        .sheet-item:hover {
          background: rgba(6, 182, 212, 0.1);
          color: var(--nav-primary);
        }
        .sheet-item .sheet-icon {
          font-size: 1.4rem;
          color: var(--nav-primary);
        }
        .sheet-item.logout {
          color: #ef4444;
          margin-top: 10px;
        }
        .sheet-item.logout .sheet-icon {
          color: #ef4444;
        }
        .sheet-divider {
          height: 1px;
          background: rgba(255,255,255,0.1);
          margin: 5px 0;
        }

        /* ========================= */
        /* MAGIC NAVIGATION BAR      */
        /* ========================= */
        .magic-navigation {
          position: relative;
          width: 100%;
          max-width: 400px;
          height: 70px;
          background: var(--nav-bg);
          display: flex;
          justify-content: center;
          align-items: center;
          border-radius: 15px;
          z-index: 20;
          box-shadow: 0 5px 15px rgba(0,0,0,0.5);
        }

        .magic-navigation ul {
          display: flex;
          width: 350px;
          padding: 0;
          margin: 0;
          list-style: none;
        }

        .magic-navigation ul li {
          position: relative;
          width: 70px;
          height: 70px;
          z-index: 1;
        }

        .magic-navigation ul li a {
          position: relative;
          display: flex;
          justify-content: center;
          align-items: center;
          flex-direction: column;
          width: 100%;
          text-align: center;
          font-weight: 500;
          text-decoration: none;
        }

        .magic-navigation ul li a .nav-icon {
          position: relative;
          display: block;
          line-height: 75px;
          font-size: 1.5em;
          text-align: center;
          transition: 0.5s;
          color: var(--text-main);
        }

        .magic-navigation ul li.active a .nav-icon {
          transform: translateY(-32px);
          color: #111;
        }

        .magic-navigation ul li a .nav-text {
          position: absolute;
          color: var(--text-main);
          font-weight: 400;
          font-size: 0.75em;
          letter-spacing: 0.05em;
          transition: 0.5s;
          opacity: 0;
          transform: translateY(20px);
        }

        .magic-navigation ul li.active a .nav-text {
          opacity: 1;
          transform: translateY(10px);
          color: var(--nav-primary);
          font-weight: 600;
        }

        /* The Magic Indicator Circle */
        .magic-indicator {
          position: absolute;
          top: -50%;
          width: 70px;
          height: 70px;
          background: var(--nav-primary);
          border-radius: 50%;
          border: 6px solid var(--bg-body);
          transition: 0.5s;
        }

        /* Curves around the circle */
        .magic-indicator::before {
          content: '';
          position: absolute;
          top: 50%;
          left: -22px;
          width: 20px;
          height: 20px;
          background: transparent;
          border-top-right-radius: 20px;
          box-shadow: 1px -10px 0 0 var(--bg-body);
        }

        .magic-indicator::after {
          content: '';
          position: absolute;
          top: 50%;
          right: -22px;
          width: 20px;
          height: 20px;
          background: transparent;
          border-top-left-radius: 20px;
          box-shadow: -1px -10px 0 0 var(--bg-body);
        }
      `}</style>

      {/* Bottom Sheet Menu */}
      <div className={classNames("bottom-sheet", showMenu && "show")}>
        <div className="sheet-header">
          <h3>Browse Zeticuz</h3>
        </div>
        <div className="sheet-content">
          {menuItems.map((item) => (
            <button
              key={item.path}
              type="button"
              className="sheet-item"
              onClick={() => handleNavigation(item.path)}
            >
              <Icon icon={item.icon} className="sheet-icon" />
              <span>{item.label}</span>
            </button>
          ))}
          <div className="sheet-divider" />
          <button
            type="button"
            className="sheet-item logout"
            onClick={() => {
              setShowMenu(false);
              // Add logout logic here if needed
            }}
          >
            <Icon icon={Icons.LOGOUT} className="sheet-icon" />
            <span>Log out</span>
          </button>
        </div>
      </div>

      {/* Backdrop for closing menu */}
      {showMenu && (
        <div
          className="fixed inset-0 z-[5]"
          onClick={() => setShowMenu(false)}
        />
      )}

      {/* Magic Navigation Bar */}
      <div
        className="fixed bottom-0 left-0 right-0 z-50 md:hidden flex justify-center pb-2"
        style={{ paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))" }}
      >
        <div className="magic-navigation">
          <ul>
            {navItems.map((item, index) => (
              <li
                key={item.path}
                className={classNames(activeIndex === index && "active")}
                onClick={() => handleItemClick(item, index)}
              >
                <a href="#" onClick={(e) => e.preventDefault()}>
                  <span className="nav-icon">
                    <Icon
                      icon={
                        item.path === "menu" && showMenu ? Icons.X : item.icon
                      }
                    />
                  </span>
                  <span className="nav-text">{item.label}</span>
                </a>
              </li>
            ))}
            <div
              className="magic-indicator"
              style={{
                transform: `translateX(${activeIndex * 70}px)`,
              }}
            />
          </ul>
        </div>
      </div>
    </>
  );
}
