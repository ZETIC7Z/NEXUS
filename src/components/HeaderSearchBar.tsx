import { Search, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface HeaderSearchBarProps {
  onSearch?: (query: string) => void;
}

export function HeaderSearchBar({ onSearch }: HeaderSearchBarProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Handle click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        if (searchQuery.length === 0) {
          setIsExpanded(false);
        }
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [searchQuery]);

  // Focus input when expanded
  useEffect(() => {
    if (isExpanded && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isExpanded]);

  const handleIconClick = () => {
    if (isExpanded) {
      // If expanded and no query, close it
      if (searchQuery.length === 0) {
        setIsExpanded(false);
      } else {
        // If has query, trigger search
        onSearch?.(searchQuery);
      }
    } else {
      setIsExpanded(true);
    }
  };

  const handleClear = () => {
    setSearchQuery("");
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && searchQuery.length > 0) {
      onSearch?.(searchQuery);
    }
    if (e.key === "Escape") {
      setSearchQuery("");
      setIsExpanded(false);
    }
  };

  return (
    <div
      ref={containerRef}
      className={`
        relative flex items-center h-10 md:h-12
        transition-all duration-300 ease-out
        ${isExpanded ? "w-48 md:w-64 lg:w-80" : "w-10 md:w-12"}
      `}
    >
      {/* Search Container */}
      <div
        className={`
          absolute inset-0 flex items-center
          rounded-full border
          transition-all duration-300 ease-out
          ${
            isExpanded
              ? "bg-white/10 border-white/30 shadow-lg shadow-black/20"
              : "bg-transparent border-transparent hover:bg-white/5"
          }
        `}
      >
        {/* Search Icon Button */}
        <button
          type="button"
          onClick={handleIconClick}
          className={`
            flex-shrink-0 flex items-center justify-center
            w-10 h-10 md:w-12 md:h-12
            text-white/80 hover:text-white
            transition-all duration-200
            ${isExpanded ? "pl-3" : ""}
          `}
          aria-label="Search"
        >
          <Search className="w-4 h-4 md:w-5 md:h-5" />
        </button>

        {/* Input Field */}
        <input
          ref={inputRef}
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Search movies, shows..."
          className={`
            flex-1 bg-transparent border-none outline-none
            text-white text-sm placeholder-white/40
            transition-all duration-300 ease-out
            ${isExpanded ? "opacity-100 w-full pr-10" : "opacity-0 w-0"}
          `}
        />

        {/* Clear Button */}
        {isExpanded && searchQuery.length > 0 && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3 p-1 text-white/60 hover:text-white transition-colors"
            aria-label="Clear search"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}
