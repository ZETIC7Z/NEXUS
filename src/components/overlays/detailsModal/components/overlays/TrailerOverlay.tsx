import { Icon, Icons } from "@/components/Icon";

import { TrailerOverlayProps } from "../../types";

export function TrailerOverlay({ trailerUrl, onClose }: TrailerOverlayProps) {
  return (
    <div
      className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center transition-opacity duration-300"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="relative w-[90%] max-w-6xl aspect-video"
        onClick={(e) => e.stopPropagation()}
        role="presentation"
      >
        {trailerUrl.includes("youtube.com/embed") ? (
          <iframe
            src={trailerUrl}
            title="Movie Trailer"
            className="w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <video
            className="w-full h-full object-contain"
            autoPlay
            controls
            playsInline
          >
            <source src={trailerUrl} type="video/mp4" />
          </video>
        )}

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 bg-black/50 hover:bg-black/70 rounded-full transition-colors"
          title="Close trailer"
          aria-label="Close trailer"
        >
          <Icon icon={Icons.X} className="text-white" />
        </button>
      </div>
    </div>
  );
}
