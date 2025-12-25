import classNames from "classnames";
import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { Icon, Icons } from "@/components/Icon";
import { useIsMobile } from "@/hooks/useIsMobile";

export function MobileBottomNav() {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const location = useLocation();
  const [showMenu, setShowMenu] = useState(false);

  if (!isMobile) return null;

  const isActive = (path: string) => location.pathname === path;

  // Check if on home/discover pages
  const isHome =
    location.pathname === "/" ||
    location.pathname === "/discover" ||
    location.pathname.startsWith("/discover");

  const menuItems = [
    { path: "/", label: "Home" },
    { path: "/movies", label: "Movies" },
    { path: "/tv-shows", label: "TV Shows" },
    { path: "/anime", label: "Anime" },
    { path: "/bookmarks", label: "My Bookmarks" },
  ];

  return (
    <>
      {/* Menu Overlay */}
      {showMenu && (
        <div
          className="fixed inset-0 bg-black/80 z-40"
          onClick={() => setShowMenu(false)}
        >
          <div className="fixed left-0 right-0 bottom-16 bg-background border-t border-dropdown-border p-4 space-y-2">
            {menuItems.map((item) => (
              <button
                key={item.path}
                type="button"
                onClick={() => {
                  navigate(item.path);
                  setShowMenu(false);
                }}
                className={classNames(
                  "w-full text-left px-4 py-3 rounded-lg transition-colors",
                  isActive(item.path)
                    ? "bg-pill-highlight text-white"
                    : "text-type-dimmed hover:text-white hover:bg-dropdown-contentBackground",
                )}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-black border-t border-dropdown-border md:hidden">
        <div className="flex items-center justify-around h-16">
          {/* Home */}
          <button
            type="button"
            onClick={() => navigate("/")}
            className="flex flex-col items-center justify-center flex-1 h-full"
          >
            <Icon
              icon={Icons.HOME}
              className={classNames(
                "text-2xl mb-1",
                isHome ? "text-type-link" : "text-type-dimmed",
              )}
            />
            <span
              className={classNames(
                "text-xs",
                isHome ? "text-type-link" : "text-type-dimmed",
              )}
            >
              Home
            </span>
          </button>

          {/* Bookmarks */}
          <button
            type="button"
            onClick={() => navigate("/bookmarks")}
            className="flex flex-col items-center justify-center flex-1 h-full"
          >
            <Icon
              icon={Icons.BOOKMARK}
              className={classNames(
                "text-2xl mb-1",
                isActive("/bookmarks") ? "text-type-link" : "text-type-dimmed",
              )}
            />
            <span
              className={classNames(
                "text-xs",
                isActive("/bookmarks") ? "text-type-link" : "text-type-dimmed",
              )}
            >
              Bookmarks
            </span>
          </button>

          {/* Menu Dropdown */}
          <button
            type="button"
            onClick={() => setShowMenu(!showMenu)}
            className="flex flex-col items-center justify-center flex-1 h-full"
          >
            <Icon
              icon={Icons.MENU}
              className={classNames(
                "text-2xl mb-1",
                showMenu ? "text-type-link" : "text-type-dimmed",
              )}
            />
            <span
              className={classNames(
                "text-xs",
                showMenu ? "text-type-link" : "text-type-dimmed",
              )}
            >
              Menu
            </span>
          </button>

          {/* Profile */}
          <button
            type="button"
            onClick={() => navigate("/settings")}
            className="flex flex-col items-center justify-center flex-1 h-full"
          >
            <Icon
              icon={Icons.USER}
              className={classNames(
                "text-2xl mb-1",
                isActive("/settings") ? "text-type-link" : "text-type-dimmed",
              )}
            />
            <span
              className={classNames(
                "text-xs",
                isActive("/settings") ? "text-type-link" : "text-type-dimmed",
              )}
            >
              Profile
            </span>
          </button>
        </div>
      </div>
    </>
  );
}
