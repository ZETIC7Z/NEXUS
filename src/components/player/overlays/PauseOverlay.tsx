/* eslint-disable react/forbid-dom-props */
import { useEffect, useState } from "react";

import {
  getMediaBackdrop,
  getMediaDetails,
  getMediaLogo,
} from "@/backend/metadata/tmdb";
import { TMDBContentTypes } from "@/backend/metadata/types/tmdb";
import { useShouldShowControls } from "@/components/player/hooks/useShouldShowControls";
import { useIsMobile } from "@/hooks/useIsMobile";
import { playerStatus } from "@/stores/player/slices/source";
import { usePlayerStore } from "@/stores/player/store";
import { usePreferencesStore } from "@/stores/preferences";

interface PauseDetails {
  voteAverage: number | null;
  genres: string[];
}

export function PauseOverlay() {
  const isPaused = usePlayerStore((s) => s.mediaPlaying.isPaused);
  const status = usePlayerStore((s) => s.status);
  const meta = usePlayerStore((s) => s.meta);
  const enablePauseOverlay = usePreferencesStore((s) => s.enablePauseOverlay);
  const enableImageLogos = usePreferencesStore((s) => s.enableImageLogos);
  const { isMobile } = useIsMobile();
  const { showTargets } = useShouldShowControls();
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [posterUrl, setPosterUrl] = useState<string | null>(null);
  const [showLogoDelaved, setShowLogoDelayed] = useState(false);
  const [details, setDetails] = useState<PauseDetails>({
    voteAverage: null,
    genres: [],
  });

  let shouldShow =
    isPaused && status === playerStatus.PLAYING && enablePauseOverlay;
  if (isMobile && status === playerStatus.SCRAPING) shouldShow = false;

  useEffect(() => {
    let timeout: NodeJS.Timeout;
    if (shouldShow) {
      // 1 second delay when showing
      timeout = setTimeout(() => setShowLogoDelayed(true), 1000);
    } else {
      // Hide immediately when shouldShow becomes false
      setShowLogoDelayed(false);
    }
    return () => clearTimeout(timeout);
  }, [shouldShow]);

  useEffect(() => {
    let mounted = true;
    const fetchLogoAndPoster = async () => {
      if (!meta?.tmdbId) {
        setLogoUrl(null);
        setPosterUrl(null);
        return;
      }

      const type =
        meta.type === "movie" ? TMDBContentTypes.MOVIE : TMDBContentTypes.TV;

      if (enableImageLogos) {
        try {
          const url = await getMediaLogo(meta.tmdbId, type);
          if (mounted) setLogoUrl(url || null);
        } catch {
          if (mounted) setLogoUrl(null);
        }
      } else {
        setLogoUrl(null);
      }

      // We can also fetch the poster to show it during pause
      try {
        const detailsData = await getMediaDetails(meta.tmdbId, type, false);
        if (mounted && detailsData?.backdrop_path) {
          const url = getMediaBackdrop(detailsData.backdrop_path);
          setPosterUrl(url || null);
        }
      } catch {
        if (mounted) setPosterUrl(null);
      }
    };

    fetchLogoAndPoster();
    return () => {
      mounted = false;
    };
  }, [meta?.tmdbId, meta?.type, enableImageLogos]);

  useEffect(() => {
    let mounted = true;
    const fetchDetails = async () => {
      if (!meta?.tmdbId) {
        setDetails({ voteAverage: null, genres: [] });
        return;
      }
      try {
        const type =
          meta.type === "movie" ? TMDBContentTypes.MOVIE : TMDBContentTypes.TV;

        // For shows with episode, just use the main show rating in the Nexus app
        // since getEpisodeDetails is not exported in this repo.
        const isShowWithEpisode =
          meta.type === "show" && meta.season && meta.episode;
        const voteAverage: number | null = null;

        const data = await getMediaDetails(meta.tmdbId, type, false);
        if (mounted && data) {
          const genres = (data.genres ?? []).map(
            (g: { name: string }) => g.name,
          );
          // Use episode rating for shows (never fall back to show rating)
          const finalVoteAverage = isShowWithEpisode
            ? voteAverage
            : typeof data.vote_average === "number"
              ? data.vote_average
              : null;
          setDetails({ voteAverage: finalVoteAverage, genres });
        }
      } catch {
        if (mounted) setDetails({ voteAverage: null, genres: [] });
      }
    };

    fetchDetails();
    return () => {
      mounted = false;
    };
  }, [meta?.tmdbId, meta?.type, meta?.season, meta?.episode]);

  if (!meta) return null;

  const overview =
    meta.type === "show" ? meta.episode?.overview : meta.overview;

  // Don't render anything if we don't have content, but keep structure for fade if valid
  const hasDetails = details.voteAverage !== null || details.genres.length > 0;
  const hasContent = overview || logoUrl || meta.title || hasDetails;
  if (!hasContent) return null;

  return (
    <div
      className={`absolute inset-0 pointer-events-none flex flex-col justify-center transition-opacity duration-500 z-10 ${
        shouldShow ? "opacity-100" : "opacity-0"
      }`}
    >
      {/* Poster Background layer */}
      {posterUrl && (
        <>
          <div
            className="absolute inset-0 pointer-events-none transition-opacity duration-700"
            ref={(el) => {
              if (el) {
                el.style.opacity = shouldShow ? "0.45" : "0";
                el.style.webkitMaskImage =
                  "linear-gradient(to bottom, transparent 0%, black 15%, black 85%, transparent 100%)";
                el.style.maskImage =
                  "linear-gradient(to bottom, transparent 0%, black 15%, black 85%, transparent 100%)";
              }
            }}
          >
            <img
              src={posterUrl}
              alt="backdrop"
              className="w-full h-full object-cover pointer-events-none"
            />
          </div>
        </>
      )}

      {/* Logo/Details layer (Fade in delayed) */}
      <div
        className={`relative z-10 md:ml-16 max-w-sm lg:max-w-2xl p-8 pointer-events-none transition-opacity duration-1000 ${
          showLogoDelaved ? "opacity-100" : "opacity-0"
        }`}
      >
        {logoUrl ? (
          <img
            src={logoUrl}
            alt={meta.title}
            className="mb-6 max-h-32 object-contain drop-shadow-lg"
          />
        ) : (
          <h1 className="mb-4 text-4xl font-bold text-white drop-shadow-lg">
            {meta.title}
          </h1>
        )}

        {meta.type === "show" && meta.episode && (
          <h2 className="mb-2 text-2xl font-semibold text-white/90 drop-shadow-md">
            {meta.episode.title}
          </h2>
        )}

        {(details.voteAverage !== null || details.genres.length > 0) && (
          <div className="mb-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-white/80 drop-shadow-md">
            {details.voteAverage !== null && (
              <span>
                {details.voteAverage.toFixed(1)}
                <span className="text-white/60 ml-0.5">/10</span>
              </span>
            )}
            {details.genres.length > 0 && (
              <>
                {details.voteAverage !== null && (
                  <span className="text-white/60">•</span>
                )}
                <span>{details.genres.slice(0, 4).join(", ")}</span>
              </>
            )}
          </div>
        )}

        {overview && (
          <p className="text-lg text-white/80 drop-shadow-md line-clamp-6">
            {overview}
          </p>
        )}
      </div>
    </div>
  );
}
