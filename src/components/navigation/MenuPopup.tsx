import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

interface MenuPopupProps {
  isOpen: boolean;
  onClose: () => void;
}

const menuItems = [
  { id: "movies", label: "Movies", path: "/movies", emoji: "🎬" },
  { id: "tvshows", label: "TV Shows", path: "/tv", emoji: "📺" },
  { id: "anime", label: "Anime", path: "/anime", emoji: "✨" },
  { id: "discover", label: "Discover", path: "/discover", emoji: "🧭" },
  { id: "favorites", label: "Favorites", path: "/my-bookmarks", emoji: "❤️" },
  { id: "settings", label: "Settings", path: "/settings", emoji: "⚙️" },
];

/**
 * MenuPopup Component for p-stream
 *
 * A floating menu with smooth open/close animations.
 * Features:
 * - Backdrop fade-in/out with blur
 * - Menu scale + slide animation (in & out)
 * - Staggered button animations
 * - Hover glow effects on buttons
 */
function MenuPopup({ isOpen, onClose }: MenuPopupProps) {
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  // Handle open/close with animations
  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      setIsClosing(false);
    } else if (isVisible) {
      // Trigger close animation
      setIsClosing(true);
      const timer = setTimeout(() => {
        setIsVisible(false);
        setIsClosing(false);
      }, 300); // Match animation duration
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [isOpen, isVisible]);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
    }, 250); // Slightly less than animation to feel snappy
  };

  const handleNavigate = (path: string) => {
    setIsClosing(true);
    setTimeout(() => {
      navigate(path);
      onClose();
    }, 200);
  };

  if (!isVisible) return null;

  return (
    <>
      {/* Backdrop with fade animation */}
      <div
        className="fixed inset-0 z-[60] backdrop-blur-sm"
        style={{
          background: "rgba(0, 0, 0, 0.7)",
          animation: isClosing
            ? "fadeOut 0.3s ease-out forwards"
            : "fadeIn 0.3s ease-out forwards",
        }}
        onClick={handleClose}
        onKeyDown={(e) => e.key === "Escape" && handleClose()}
        role="button"
        tabIndex={0}
        aria-label="Close menu"
      />

      {/* Menu Box with scale + slide animation */}
      <div
        className="fixed bottom-28 left-1/2 z-[70] w-[280px]"
        style={{
          animation: isClosing
            ? "menuSlideOut 0.3s cubic-bezier(0.4, 0, 1, 1) forwards"
            : "menuSlideIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        }}
      >
        <div
          className="rounded-2xl p-4 shadow-2xl border border-white/10"
          style={{
            background: `hsl(var(--colors-background-main, 0 0% 8%))`,
            boxShadow: `0 25px 50px -12px rgba(0, 0, 0, 0.5), 
                        0 0 30px hsl(var(--colors-buttons-active, 25 95% 53%) / 0.15)`,
          }}
        >
          {/* Header with slide animation */}
          <div
            className="flex items-center gap-2 mb-4 px-1"
            style={{
              animation: isClosing
                ? "itemFadeOut 0.2s ease-out forwards"
                : "itemFadeIn 0.3s ease-out 0.1s forwards",
              opacity: isClosing ? 1 : 0,
            }}
          >
            <div
              className="w-1 h-5 rounded-full"
              style={{
                background: `hsl(var(--colors-buttons-active, 25 95% 53%))`,
              }}
            />
            <h3
              className="text-lg font-semibold"
              style={{ color: `hsl(var(--colors-type-text, 0 0% 95%))` }}
            >
              Browse
            </h3>
          </div>

          {/* Menu Grid with staggered animations */}
          <div className="grid grid-cols-2 gap-3">
            {menuItems.map((item, index) => (
              <button
                type="button"
                key={item.id}
                onClick={() => handleNavigate(item.path)}
                className="group flex items-center gap-3 px-4 py-3 rounded-xl bg-white/5 
                           hover:bg-white/15 transition-all duration-300 
                           hover:scale-[1.02] active:scale-95
                           hover:shadow-lg"
                style={{
                  animation: isClosing
                    ? `itemFadeOut 0.2s ease-out ${(5 - index) * 0.03}s forwards`
                    : `itemFadeIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) ${0.15 + index * 0.05}s forwards`,
                  opacity: isClosing ? 1 : 0,
                  boxShadow: "none",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = `0 0 20px hsl(var(--colors-buttons-active, 25 95% 53%) / 0.2)`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                <span className="text-xl transition-transform duration-300 group-hover:scale-110">
                  {item.emoji}
                </span>
                <span
                  className="text-sm font-medium transition-colors duration-300"
                  style={{ color: `hsl(var(--colors-type-text, 0 0% 95%))` }}
                >
                  {item.label}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Inline keyframe styles */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes fadeOut {
          from { opacity: 1; }
          to { opacity: 0; }
        }
        
        @keyframes menuSlideIn {
          from { 
            opacity: 0;
            transform: translateX(-50%) translateY(20px) scale(0.95);
          }
          to { 
            opacity: 1;
            transform: translateX(-50%) translateY(0) scale(1);
          }
        }
        
        @keyframes menuSlideOut {
          from { 
            opacity: 1;
            transform: translateX(-50%) translateY(0) scale(1);
          }
          to { 
            opacity: 0;
            transform: translateX(-50%) translateY(20px) scale(0.95);
          }
        }
        
        @keyframes itemFadeIn {
          from { 
            opacity: 0;
            transform: translateY(10px);
          }
          to { 
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes itemFadeOut {
          from { 
            opacity: 1;
            transform: translateY(0);
          }
          to { 
            opacity: 0;
            transform: translateY(-5px);
          }
        }
      `}</style>
    </>
  );
}

export default MenuPopup;
