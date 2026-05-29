import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import { get, getMediaPoster } from "@/backend/metadata/tmdb";
import { useBookmarkStore } from "@/stores/bookmarks";
import { useOverlayStack } from "@/stores/interface/overlayStack";

// ─── Types ────────────────────────────────────────────────────────────────────

type Reel = {
  id: number;
  tmdbId: number;
  title: string;
  overview: string;
  youtubeId: string;
  poster: string;
  vote: number;
  year: string;
  releaseDate: string;
  portrait: boolean;
  mediaType: "movie" | "tv";
  isUnreleased: boolean;
  genres?: string[];
};

type Bucket = "vivamax" | "pinoy" | "intl" | "anime";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatReleaseDate(date: string): string {
  if (!date) return "";
  const d = new Date(date);
  if (isNaN(d.getTime())) return date;
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function fmt(t: number) {
  if (!isFinite(t) || t < 0) t = 0;
  const m = Math.floor(t / 60);
  const s = Math.floor(t % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function weightedShuffle(
  buckets: Record<Bucket, Reel[]>,
  weights: Record<Bucket, number>,
): Reel[] {
  const pools: Record<Bucket, Reel[]> = {
    vivamax: shuffle(buckets.vivamax),
    pinoy: shuffle(buckets.pinoy),
    intl: shuffle(buckets.intl),
    anime: shuffle(buckets.anime),
  };
  const out: Reel[] = [];
  const seen = new Set<number>();
  const keys: Bucket[] = ["vivamax", "pinoy", "intl", "anime"];
  while (keys.some((k) => pools[k].length)) {
    const available = keys.filter((k) => pools[k].length);
    const total = available.reduce((s, k) => s + weights[k], 0);
    let r = Math.random() * total;
    let pick: Bucket = available[0];
    for (const k of available) {
      r -= weights[k];
      if (r <= 0) { pick = k; break; }
    }
    const reel = pools[pick].shift();
    if (reel && !seen.has(reel.id)) {
      seen.add(reel.id);
      out.push(reel);
    }
  }
  return out;
}

async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  mapper: (item: T) => Promise<R>,
): Promise<R[]> {
  const results: R[] = [];
  for (let i = 0; i < items.length; i += limit) {
    const batch = items.slice(i, i + limit);
    results.push(...(await Promise.all(batch.map(mapper))));
  }
  return results;
}

// ─── Data Fetching ────────────────────────────────────────────────────────────

async function fetchTmdbList(url: string, params?: object): Promise<any[]> {
  try {
    const data = await get<{ results: any[] }>(url, params);
    return data.results || [];
  } catch {
    return [];
  }
}

async function fetchReels(): Promise<Reel[]> {
  const now = new Date();

  const [
    intlMovies1, intlMovies2, intlTv,
    nowPlaying, popular, topRated, tvPopular, tvTopRated
  ] = await Promise.all([
    fetchTmdbList("trending/movie/day", { page: 1 }),
    fetchTmdbList("trending/movie/day", { page: 2 }),
    fetchTmdbList("trending/tv/day", { page: 1 }),
    fetchTmdbList("movie/now_playing", { page: 1 }),
    fetchTmdbList("movie/popular", { page: 1 }),
    fetchTmdbList("movie/top_rated", { page: 1 }),
    fetchTmdbList("tv/popular", { page: 1 }),
    fetchTmdbList("tv/top_rated", { page: 1 }),
  ]);

  const intlRaw = [...intlMovies1, ...intlMovies2, ...intlTv, ...nowPlaying, ...popular, ...topRated, ...tvPopular, ...tvTopRated];

  const [
    animeRaw1, animeRaw2, animeMovies,
    vivamaxRecent, vivamaxPop,
    pinoyKw1, pinoyPop1, pinoyKw2, pinoyPop2, pinoyOrigin, pinoyTvOrigin
  ] = await Promise.all([
    fetchTmdbList("discover/tv", { with_genres: 16, with_original_language: "ja", sort_by: "popularity.desc", page: 1 }),
    fetchTmdbList("discover/tv", { with_genres: 16, with_original_language: "ja", sort_by: "popularity.desc", page: 2 }),
    fetchTmdbList("discover/movie", { with_genres: 16, with_original_language: "ja", sort_by: "popularity.desc", page: 1 }),
    fetchTmdbList("discover/movie", { with_companies: 149142, sort_by: "primary_release_date.desc", page: 1 }),
    fetchTmdbList("discover/movie", { with_companies: 149142, sort_by: "popularity.desc", page: 1 }),
    fetchTmdbList("discover/movie", { with_keywords: "6895", sort_by: "primary_release_date.desc", page: 1 }),
    fetchTmdbList("discover/movie", { with_keywords: "6895", sort_by: "popularity.desc", page: 1 }),
    fetchTmdbList("discover/movie", { with_keywords: "197870", sort_by: "popularity.desc", page: 1 }),
    fetchTmdbList("discover/movie", { with_keywords: "197870", sort_by: "primary_release_date.desc", page: 1 }),
    fetchTmdbList("discover/movie", { with_origin_country: "PH", sort_by: "popularity.desc", page: 1 }),
    fetchTmdbList("discover/tv", { with_origin_country: "PH", sort_by: "popularity.desc", page: 1 }),
  ]);

  const animeRaw = [...animeRaw1, ...animeRaw2, ...animeMovies];
  const vivamaxRaw = [...vivamaxRecent, ...vivamaxPop];
  const pinoyRaw = [...pinoyKw1, ...pinoyPop1, ...pinoyKw2, ...pinoyPop2, ...pinoyOrigin, ...pinoyTvOrigin];

  const vivamaxIds = new Set(vivamaxRaw.map((m: any) => m.id));
  const pinoyClean = pinoyRaw.filter((m: any) => !vivamaxIds.has(m.id));
  const pinoyIds = new Set(pinoyClean.map((m: any) => m.id));
  const animeClean = animeRaw.filter((m: any) => !vivamaxIds.has(m.id) && !pinoyIds.has(m.id));
  const animeIds = new Set(animeClean.map((m: any) => m.id));
  const intlClean = intlRaw.filter(
    (m: any) => !vivamaxIds.has(m.id) && !pinoyIds.has(m.id) && !animeIds.has(m.id),
  );

  async function toReel(m: any): Promise<Reel | null> {
    try {
      const isTv = !m.title && !!m.name;
      const mediaType: "movie" | "tv" = isTv ? "tv" : "movie";
      const endpoint = isTv ? "tv" : "movie";

      const videoData = await get<{ results: any[] }>(`/${endpoint}/${m.id}/videos`);
      const list = (videoData.results || []).filter((x: any) => x.site === "YouTube");

      const isPortrait = (x: any) =>
        /short|vertical|portrait|9:16|tiktok|reel/i.test(x.name || "");
      const portrait =
        list.find((x: any) => isPortrait(x) && (x.type === "Trailer" || x.type === "Teaser")) ||
        list.find((x: any) => isPortrait(x));
      const yt =
        portrait ||
        list.find((x: any) => (x.type === "Trailer" || x.type === "Teaser") && x.official) ||
        list.find((x: any) => x.type === "Trailer" || x.type === "Teaser") ||
        list[0];

      if (!yt) return null;

      const date = m.release_date || m.first_air_date || "";
      const isUnreleased = date ? new Date(date) > now : false;
      const poster = m.backdrop_path
        ? `https://image.tmdb.org/t/p/w780${m.backdrop_path}`
        : (getMediaPoster(m.poster_path) ?? "");

      return {
        id: m.id,
        tmdbId: m.id,
        title: m.title || m.name,
        overview: m.overview || "",
        youtubeId: yt.key,
        poster,
        vote: Math.round((m.vote_average || 0) * 10) / 10,
        year: date.slice(0, 4),
        releaseDate: date,
        portrait: !!portrait,
        mediaType,
        isUnreleased,
      };
    } catch {
      return null;
    }
  }

  const cap = (arr: any[], n: number) => shuffle(arr).slice(0, n);
  const [intlReels, animeReels, vivamaxReels, pinoyReels] = await Promise.all([
    mapWithConcurrency(cap(intlClean, 30), 6, toReel),
    mapWithConcurrency(cap(animeClean, 14), 6, toReel),
    mapWithConcurrency(cap(vivamaxRaw, 14), 6, toReel),
    mapWithConcurrency(cap(pinoyClean, 18), 6, toReel),
  ]);

  const buckets: Record<Bucket, Reel[]> = {
    intl: intlReels.filter((r): r is Reel => !!r),
    anime: animeReels.filter((r): r is Reel => !!r),
    vivamax: vivamaxReels.filter((r): r is Reel => !!r),
    pinoy: pinoyReels.filter((r): r is Reel => !!r),
  };

  return weightedShuffle(buckets, { intl: 40, pinoy: 25, vivamax: 20, anime: 15 }).slice(0, 50);
}

// ─── YouTube IFrame API ───────────────────────────────────────────────────────

let ytApiPromise: Promise<any> | null = null;
function loadYouTubeAPI(): Promise<any> {
  if (typeof window === "undefined") return Promise.resolve(null);
  if ((window as any).YT?.Player) return Promise.resolve((window as any).YT);
  if (ytApiPromise) return ytApiPromise;
  ytApiPromise = new Promise((resolve) => {
    const existing = document.getElementById("yt-iframe-api");
    if (!existing) {
      const tag = document.createElement("script");
      tag.id = "yt-iframe-api";
      tag.src = "https://www.youtube.com/iframe_api";
      document.body.appendChild(tag);
    }
    (window as any).onYouTubeIframeAPIReady = () => resolve((window as any).YT);
  });
  return ytApiPromise;
}

// ─── Icons ────────────────────────────────────────────────────────────────────

function IconBookmark({ filled }: { filled: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className="h-7 w-7" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
    </svg>
  );
}

function IconVolumeOff() {
  return (
    <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15zM17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
    </svg>
  );
}

function IconVolumeOn() {
  return (
    <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.536 8.464a5 5 0 010 7.072M12 6v12m0-12L7 9H4a1 1 0 00-1 1v4a1 1 0 001 1h3l5 3V6zM19.07 4.93a10 10 0 010 14.14" />
    </svg>
  );
}

function IconPlay() {
  return (
    <svg viewBox="0 0 24 24" className="h-14 w-14 fill-white" stroke="none">
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}

function IconChevronDown() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  );
}

// ─── ReelVideo Component ──────────────────────────────────────────────────────

function ReelVideo({
  youtubeId, active, muted, poster, reel, bookmarked, index, total,
  onToggleMute, onToggleBookmark, onWatchNow, onEnded, onScrollNext,
}: {
  youtubeId: string;
  active: boolean;
  muted: boolean;
  poster: string;
  reel: Reel;
  bookmarked: boolean;
  index: number;
  total: number;
  onToggleMute: (nextMuted?: boolean) => void;
  onToggleBookmark: () => void;
  onWatchNow: () => void;
  onEnded: () => void;
  onScrollNext: () => void;
}) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const playerRef = useRef<any>(null);
  const [ready, setReady] = useState(false);
  const [duration, setDuration] = useState(0);
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [bookmarkAnim, setBookmarkAnim] = useState(false);
  const [doubleTapAnim, setDoubleTapAnim] = useState(false);
  const lastTapRef = useRef(0);

  // stopVideo: pause + mute player so no audio bleeds through when modal opens
  const stopVideo = useCallback(() => {
    const p = playerRef.current;
    if (!p) return;
    try { p.pauseVideo(); p.mute(); } catch { /* ignore */ }
  }, []);

  const applyMuteState = useCallback((nextMuted: boolean) => {
    const p = playerRef.current;
    if (!p) return;
    try {
      if (nextMuted) { p.mute(); }
      else { p.unMute(); p.setVolume(100); p.playVideo(); }
    } catch { /* ignore */ }
  }, []);

  useEffect(() => { setMounted(active); }, [active]);

  useEffect(() => {
    if (!mounted || !hostRef.current) return;
    let destroyed = false;
    let interval: ReturnType<typeof setInterval> | undefined;
    let startTimer: ReturnType<typeof setTimeout> | undefined;
    const mountNode = document.createElement("div");
    mountNode.style.cssText = "width:100%;height:100%";
    hostRef.current.replaceChildren(mountNode);

    loadYouTubeAPI().then((YT) => {
      if (destroyed || !YT) return;
      playerRef.current = new YT.Player(mountNode, {
        videoId: youtubeId,
        host: "https://www.youtube-nocookie.com",
        playerVars: {
          autoplay: 1, mute: 1, controls: 0, modestbranding: 1,
          rel: 0, playsinline: 1, iv_load_policy: 3, disablekb: 1,
          fs: 0, enablejsapi: 1, origin: window.location.origin,
        },
        events: {
          onReady: (e: any) => {
            if (destroyed) return;
            setReady(true);
            setDuration(e.target.getDuration() || 0);
            applyMuteState(muted);
            if (active) e.target.playVideo();
            startTimer = setTimeout(() => {
              try {
                const YTState = (window as any).YT?.PlayerState;
                const p = playerRef.current;
                if (!destroyed && active && YTState && p?.getPlayerState?.() !== YTState.PLAYING) {
                  onEnded();
                }
              } catch { /* ignore */ }
            }, 5000);
            interval = setInterval(() => {
              try {
                const p = playerRef.current;
                if (!p) return;
                const t = p.getCurrentTime?.() || 0;
                const d = p.getDuration?.() || 0;
                setCurrent(t);
                if (d) setDuration(d);
              } catch { /* ignore */ }
            }, 250);
          },
          onStateChange: (e: any) => {
            const YTState = (window as any).YT?.PlayerState;
            if (!YTState) return;
            if (e.data === YTState.PLAYING) setPaused(false);
            if (e.data === YTState.PAUSED) setPaused(true);
            if (e.data === YTState.ENDED) onEnded();
          },
          onError: () => { if (!destroyed) onEnded(); },
        },
      });
    });

    return () => {
      destroyed = true;
      if (interval) clearInterval(interval);
      if (startTimer) clearTimeout(startTimer);
      try { playerRef.current?.destroy(); } catch { /* ignore */ }
      try { hostRef.current?.replaceChildren(); } catch { /* ignore */ }
      playerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted, youtubeId]);

  useEffect(() => {
    if (!ready) return;
    applyMuteState(muted);
  }, [applyMuteState, muted, ready]);

  useEffect(() => {
    const p = playerRef.current;
    if (!ready || !p) return;
    try {
      if (active) p.playVideo();
      else p.pauseVideo();
    } catch { /* ignore */ }
  }, [active, ready]);

  const togglePlay = () => {
    const p = playerRef.current;
    if (!p) return;
    try { if (paused) p.playVideo(); else p.pauseVideo(); } catch { /* ignore */ }
  };

  const handleTap = (e: React.MouseEvent) => {
    // Double-tap to bookmark (like TikTok heart animation)
    const now = Date.now();
    if (now - lastTapRef.current < 300) {
      // Double tap
      if (!bookmarked) {
        onToggleBookmark();
        setBookmarkAnim(true);
        setTimeout(() => setBookmarkAnim(false), 1000);
      }
      setDoubleTapAnim(true);
      setTimeout(() => setDoubleTapAnim(false), 700);
    } else {
      togglePlay();
    }
    lastTapRef.current = now;
  };

  const seek = (e: React.MouseEvent<HTMLDivElement>) => {
    const p = playerRef.current;
    if (!p || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = (e.clientX - rect.left) / rect.width;
    try { p.seekTo(Math.max(0, Math.min(1, pct)) * duration, true); } catch { /* ignore */ }
  };

  const pct = duration ? Math.min((current / duration) * 100, 100) : 0;

  return (
    <div className="cuts-reel-item relative h-full w-full overflow-hidden bg-black">
      {/* Blurred poster background */}
      {poster && (
        <div
          className="absolute inset-0 scale-110"
          style={{
            backgroundImage: `url(${poster})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            filter: "blur(24px) brightness(0.35)",
          }}
        />
      )}

      {/* YouTube video frame */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div
          className="relative"
          style={reel.portrait ? { width: "100%", height: "100%" } : { width: "178%", height: "178%" }}
        >
          {mounted && <div ref={hostRef} className="absolute inset-0" />}
        </div>
      </div>

      {/* Tap / double-tap layer */}
      <button
        type="button"
        aria-label="Play or pause"
        onClick={handleTap}
        className="absolute inset-0 z-10"
        style={{ background: "transparent", touchAction: "pan-y" }}
      />

      {/* Double-tap heart burst (TikTok style) */}
      {doubleTapAnim && (
        <div
          className="pointer-events-none absolute inset-0 z-50 flex items-center justify-center"
          style={{ animation: "cuts-heart-burst 0.7s ease-out forwards" }}
        >
          <svg viewBox="0 0 24 24" className="h-28 w-28 fill-red-500 drop-shadow-2xl opacity-0"
            style={{ animation: "cuts-heart-anim 0.7s ease-out forwards" }}>
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
          </svg>
        </div>
      )}

      {/* Paused overlay */}
      {paused && ready && (
        <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center"
          style={{ animation: "cuts-fade-in 0.15s ease" }}>
          <div className="flex items-center justify-center rounded-full"
            style={{ width: 80, height: 80, background: "rgba(0,0,0,0.55)", backdropFilter: "blur(12px)" }}>
            <IconPlay />
          </div>
        </div>
      )}

      {/* Bookmark flash anim (when double-tapped to save) */}
      {bookmarkAnim && (
        <div className="pointer-events-none absolute inset-x-0 bottom-36 z-50 flex justify-center"
          style={{ animation: "cuts-bookmark-float 1s ease-out forwards" }}>
          <div className="rounded-xl px-4 py-2 text-sm font-bold text-yellow-400 shadow-2xl"
            style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }}>
            ✦ Added to Bookmarks
          </div>
        </div>
      )}

      {/* ── Top gradient fade ── */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-30 h-28"
        style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.5) 0%, transparent 100%)" }} />

      {/* ── Top bar: counter + media type badge ── */}
      <div className="absolute inset-x-0 top-0 z-40 flex items-center justify-between px-4 pt-4">
        <div className="flex items-center gap-2">
          <span className="rounded-full px-3 py-1 text-xs font-bold tracking-wide uppercase text-white"
            style={{ background: "rgba(220,38,38,0.9)", backdropFilter: "blur(8px)" }}>
            {reel.mediaType === "tv" ? "Series" : "Movie"}
          </span>
          {reel.isUnreleased && (
            <span className="rounded-full px-3 py-1 text-xs font-bold text-white"
              style={{ background: "rgba(234,179,8,0.85)", backdropFilter: "blur(8px)" }}>
              Coming Soon
            </span>
          )}
        </div>
        <span className="text-xs font-medium text-white/60">
          {index + 1} / {total}
        </span>
      </div>

      {/* ── Right side action buttons (TikTok / Reels style) ── */}
      <div className="cuts-action-col absolute right-3 z-40 flex flex-col items-center gap-4"
        style={{ touchAction: "pan-y" }}>

        {/* Bookmark / Save */}
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onToggleBookmark(); }}
          className="cuts-action-btn flex flex-col items-center gap-1.5"
          aria-label={bookmarked ? "Remove bookmark" : "Save"}
        >
          <div className="cuts-action-circle"
            style={{
              background: bookmarked ? "rgba(250,204,21,0.25)" : "rgba(255,255,255,0.12)",
              border: bookmarked ? "1px solid rgba(250,204,21,0.5)" : "1px solid rgba(255,255,255,0.15)",
            }}>
            <span style={{ color: bookmarked ? "#facc15" : "white" }}>
              <IconBookmark filled={bookmarked} />
            </span>
          </div>
          <span className="text-[11px] font-semibold text-white drop-shadow"
            style={{ textShadow: "0 1px 4px rgba(0,0,0,0.8)" }}>
            {bookmarked ? "Saved" : "Save"}
          </span>
        </button>

        {/* Mute toggle */}
        <button
          type="button"
          onPointerDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
            const next = !muted;
            onToggleMute(next);
            requestAnimationFrame(() => applyMuteState(next));
          }}
          className="cuts-action-btn flex flex-col items-center gap-1.5"
          aria-label={muted ? "Unmute" : "Mute"}
        >
          <div className="cuts-action-circle"
            style={{
              background: muted ? "rgba(239,68,68,0.2)" : "rgba(255,255,255,0.12)",
              border: muted ? "1px solid rgba(239,68,68,0.4)" : "1px solid rgba(255,255,255,0.15)",
            }}>
            {muted ? <IconVolumeOff /> : <IconVolumeOn />}
          </div>
          <span className="text-[11px] font-semibold text-white drop-shadow"
            style={{ textShadow: "0 1px 4px rgba(0,0,0,0.8)" }}>
            {muted ? "Muted" : "Sound"}
          </span>
        </button>

        {/* Scroll to next */}
        {index < total - 1 && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onScrollNext(); }}
            className="cuts-action-btn flex flex-col items-center gap-1.5 mt-1"
            aria-label="Next"
          >
            <div className="cuts-action-circle cuts-next-btn"
              style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.15)" }}>
              <IconChevronDown />
            </div>
            <span className="text-[11px] font-semibold text-white/80">Next</span>
          </button>
        )}
      </div>

      {/* ── Bottom gradient ── */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-30"
        style={{
          height: "65%",
          background: "linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.7) 40%, rgba(0,0,0,0.2) 75%, transparent 100%)",
        }}
      />

      {/* ── Bottom info panel ── */}
      <div className="cuts-bottom-info absolute inset-x-0 bottom-0 z-40 px-4"
        style={{ touchAction: "pan-y" }}>
        {/* Progress bar (YouTube Shorts style — thin, at very bottom above info) */}
        <div className="mb-3">
          <div
            className="cuts-progress-track relative h-[3px] w-full cursor-pointer rounded-full overflow-hidden"
            style={{ background: "rgba(255,255,255,0.25)" }}
            onClick={seek}
          >
            <div
              className="absolute inset-y-0 left-0 rounded-full cuts-progress-fill"
              style={{ width: `${pct}%`, background: "linear-gradient(90deg, #ef4444, #f97316)" }}
            />
          </div>
          <div className="mt-1 flex justify-between text-[10px] tabular-nums"
            style={{ color: "rgba(255,255,255,0.5)" }}>
            <span>{fmt(current)}</span>
            <span>{fmt(duration)}</span>
          </div>
        </div>

        {/* Metadata row */}
        <div className="flex items-center gap-2 mb-1.5">
          <span className="rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white"
            style={{ background: "rgba(220,38,38,0.85)" }}>
            Trailer
          </span>
          {reel.year && (
            <span className="text-xs font-medium" style={{ color: "rgba(255,255,255,0.6)" }}>
              {reel.year}
            </span>
          )}
          {reel.vote > 0 && (
            <span className="flex items-center gap-1 text-xs font-medium" style={{ color: "rgba(255,215,0,0.9)" }}>
              ★ {reel.vote}
            </span>
          )}
          {reel.releaseDate && (
            <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.45)" }}>
              {formatReleaseDate(reel.releaseDate)}
            </span>
          )}
        </div>

        {/* Title */}
        <h2 className="text-[18px] font-extrabold leading-tight text-white mb-1"
          style={{ textShadow: "0 2px 8px rgba(0,0,0,0.9)", letterSpacing: "-0.01em" }}>
          {reel.title}
        </h2>

        {/* Overview + expand */}
        {reel.overview && (
          <div className="mb-2 max-w-[calc(100%-80px)]">
            <p
              className="text-[13px] leading-snug"
              style={{
                color: "rgba(255,255,255,0.78)",
                textShadow: "0 1px 4px rgba(0,0,0,0.7)",
                display: "-webkit-box",
                WebkitLineClamp: expanded ? ("unset" as any) : 2,
                WebkitBoxOrient: "vertical",
                overflow: expanded ? "visible" : "hidden",
              }}
            >
              {reel.overview}
            </p>
            {reel.overview.length > 100 && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setExpanded(v => !v); }}
                className="mt-0.5 text-[12px] font-semibold"
                style={{ color: "rgba(255,255,255,0.55)" }}
              >
                {expanded ? "less ▲" : "more ▼"}
              </button>
            )}
          </div>
        )}

        {/* Action row: Watch Now / Unreleased */}
        <div className="flex items-center gap-2 flex-wrap mt-1">
          {reel.isUnreleased ? (
            <div className="flex items-center gap-2 rounded-full px-4 py-2"
              style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)" }}>
              <span className="text-[13px] font-bold" style={{ color: "rgba(255,255,255,0.45)" }}>
                🔒 Unreleased
              </span>
            </div>
          ) : (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); stopVideo(); onWatchNow(); }}
              className="cuts-watch-btn flex items-center gap-2 rounded-full px-5 py-2.5 text-[14px] font-bold text-white transition-all"
              style={{
                background: "linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)",
                boxShadow: "0 4px 20px rgba(220,38,38,0.45)",
              }}
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4 fill-white flex-shrink-0" stroke="none">
                <path d="M8 5v14l11-7z" />
              </svg>
              Watch Now
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Loading Skeleton ─────────────────────────────────────────────────────────

function LoadingReel() {
  return (
    <div className="flex h-screen w-full flex-col items-center justify-center bg-black">
      <div className="flex flex-col items-center gap-5">
        {/* Animated reel icon */}
        <div className="relative flex h-24 w-24 items-center justify-center">
          <div className="absolute inset-0 rounded-full border-4 border-red-600/30" />
          <div
            className="absolute inset-0 rounded-full border-4 border-transparent border-t-red-600"
            style={{ animation: "cuts-spin 0.9s linear infinite" }}
          />
          <svg viewBox="0 0 24 24" className="h-10 w-10 fill-white/80" stroke="none">
            <path d="M18 4l2 4h-3l-2-4h-2l2 4h-3l-2-4H8l2 4H7L5 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4h-4z" />
          </svg>
        </div>
        <div className="text-center">
          <p className="text-lg font-bold text-white tracking-wide">Loading Cuts</p>
          <p className="mt-1 text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>
            Fetching trending trailers…
          </p>
        </div>
        {/* Animated dots */}
        <div className="flex gap-2">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-2 w-2 rounded-full bg-red-500"
              style={{ animation: `cuts-bounce 1.2s ease-in-out ${i * 0.2}s infinite` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Main CutsPage Component ──────────────────────────────────────────────────

function ReelsPage() {
  const navigate = useNavigate();
  const [reels, setReels] = useState<Reel[]>([]);
  const [active, setActive] = useState(0);
  const [muted, setMuted] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);

  const { bookmarks, addBookmark, removeBookmark } = useBookmarkStore();
  const { showModal } = useOverlayStack();

  useEffect(() => {
    fetchReels()
      .then((r) => {
        if (r.length === 0) setError("No trailers found. Please try again later.");
        else setReels(r);
      })
      .catch(() => setError("Failed to load trailers."))
      .finally(() => setLoading(false));
  }, []);

  // Unmute on first user interaction (browser policy)
  useEffect(() => {
    if (!muted) return;
    const unmute = () => {
      setMuted(false);
      ["pointerdown", "keydown", "touchstart", "scroll"].forEach(ev =>
        window.removeEventListener(ev, unmute),
      );
    };
    ["pointerdown", "keydown", "touchstart"].forEach(ev =>
      window.addEventListener(ev, unmute, { once: true }),
    );
    window.addEventListener("scroll", unmute, { once: true, passive: true });
    return () => {
      ["pointerdown", "keydown", "touchstart", "scroll"].forEach(ev =>
        window.removeEventListener(ev, unmute),
      );
    };
  }, [muted]);

  // IntersectionObserver to track active reel
  useEffect(() => {
    if (!reels.length) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting && e.intersectionRatio >= 0.55) {
            setActive(Number((e.target as HTMLElement).dataset.index));
          }
        });
      },
      { threshold: [0.55] },
    );
    itemRefs.current.forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
  }, [reels]);

  const toggleMute = useCallback((nextMuted?: boolean) => {
    setMuted((m) => (typeof nextMuted === "boolean" ? nextMuted : !m));
  }, []);

  const getKey = (reel: Reel) => `${reel.mediaType === "movie" ? "movie" : "show"}-${reel.tmdbId}`;
  const isBookmarked = (reel: Reel) => !!bookmarks[getKey(reel)];

  const toggleBookmark = useCallback((reel: Reel) => {
    const key = getKey(reel);
    if (bookmarks[key]) {
      removeBookmark(key);
    } else {
      addBookmark({
        type: reel.mediaType === "movie" ? "movie" : "show",
        title: reel.title,
        tmdbId: key,
        releaseYear: parseInt(reel.year, 10) || 0,
        poster: reel.poster,
      });
    }
  }, [bookmarks, addBookmark, removeBookmark]);

  const handleWatchNow = useCallback((reel: Reel) => {
    showModal("details", {
      id: reel.tmdbId,
      type: reel.mediaType === "tv" ? "show" : "movie",
    });
  }, [showModal]);

  const scrollToNext = useCallback((index: number) => {
    const container = containerRef.current;
    if (!container) return;
    const slideHeight = container.clientHeight;
    container.scrollTo({ top: (index + 1) * slideHeight, behavior: "smooth" });
  }, []);

  if (loading) return <LoadingReel />;

  if (error) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center bg-black text-white">
        <div className="text-5xl mb-4">🎬</div>
        <p className="text-xl font-bold text-red-400">{error}</p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="mt-6 rounded-full px-6 py-3 text-sm font-bold text-white"
          style={{ background: "linear-gradient(135deg, #dc2626, #b91c1c)" }}
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="cuts-page-root">
      {/* Global Cuts CSS — animations + layout */}
      <style>{`
        /* ── Force full-screen on Cuts page (hide bottom mobile nav) ── */
        body:has(.cuts-page-root) .magic-navigation-wrapper,
        body:has(.cuts-page-root) [class*="MobileBottomNav"],
        body:has(.cuts-page-root) .fixed.bottom-0.left-0.right-0.z-50.md\\:hidden {
          display: none !important;
        }

        /* ── Cuts page root fills full screen ── */
        .cuts-page-root {
          position: fixed;
          inset: 0;
          width: 100%;
          height: 100%;
          height: 100dvh;
          background: #000;
          z-index: 900;
          overflow: hidden;
        }

        /* ── Scroll container ── */
        .cuts-container {
          width: 100%;
          height: 100%;
          height: 100dvh;
          overflow-y: scroll;
          scroll-snap-type: y mandatory;
          scroll-behavior: smooth;
          overscroll-behavior: contain;
          background: #000;
          -webkit-overflow-scrolling: touch;
        }
        .cuts-container::-webkit-scrollbar { display: none; }
        .cuts-container { scrollbar-width: none; }

        /* Prevent iframe from intercepting pointer events in Firefox/Safari */
        .cuts-reel-item iframe,
        .cuts-reel-item object,
        .cuts-reel-item embed {
          pointer-events: none !important;
        }

        /* ── Each reel slide ── */
        .cuts-reel-slide {
          height: 100dvh;
          width: 100%;
          scroll-snap-align: start;
          scroll-snap-stop: always;
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
        }

        /* ── Reel item fills slide ── */
        .cuts-reel-item {
          width: 100%;
          height: 100%;
          max-width: 540px;
        }

        /* ── Right action buttons — respect iOS safe area ── */
        .cuts-action-col {
          bottom: calc(env(safe-area-inset-bottom, 0px) + 24px);
        }
        @media (max-width: 768px) {
          .cuts-action-col {
            bottom: calc(env(safe-area-inset-bottom, 0px) + 20px);
          }
        }

        /* ── Bottom info panel — respect iOS notch/home bar ── */
        .cuts-bottom-info {
          padding-bottom: calc(env(safe-area-inset-bottom, 0px) + 12px);
        }
        @media (max-width: 768px) {
          .cuts-bottom-info {
            padding-bottom: calc(env(safe-area-inset-bottom, 0px) + 16px);
          }
        }

        /* ── Action button circle ── */
        .cuts-action-circle {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 52px;
          height: 52px;
          border-radius: 50%;
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          transition: transform 0.15s cubic-bezier(0.34, 1.56, 0.64, 1), background 0.2s;
          color: white;
        }
        .cuts-action-btn:active .cuts-action-circle {
          transform: scale(0.88);
        }

        /* ── Next button pulse ── */
        .cuts-next-btn {
          animation: cuts-pulse 2.5s ease-in-out infinite;
        }

        /* ── Watch Now button ── */
        .cuts-watch-btn {
          transition: transform 0.15s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.2s;
        }
        .cuts-watch-btn:active {
          transform: scale(0.94);
          box-shadow: 0 2px 10px rgba(220,38,38,0.3) !important;
        }

        /* ── Progress bar fill animation ── */
        .cuts-progress-fill {
          transition: width 0.25s linear;
        }

        /* ── Keyframes ── */
        @keyframes cuts-spin { to { transform: rotate(360deg); } }
        @keyframes cuts-bounce {
          0%, 80%, 100% { transform: scale(0); opacity: 0.5; }
          40% { transform: scale(1); opacity: 1; }
        }
        @keyframes cuts-pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.08); opacity: 0.8; }
        }
        @keyframes cuts-fade-in {
          from { opacity: 0; transform: scale(1.08); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes cuts-heart-anim {
          0% { opacity: 0; transform: scale(0.3); }
          40% { opacity: 1; transform: scale(1.3); }
          60% { transform: scale(0.9); }
          80% { opacity: 1; transform: scale(1.1); }
          100% { opacity: 0; transform: scale(1); }
        }
        @keyframes cuts-bookmark-float {
          0% { opacity: 0; transform: translateY(16px); }
          20% { opacity: 1; transform: translateY(0); }
          75% { opacity: 1; transform: translateY(-8px); }
          100% { opacity: 0; transform: translateY(-20px); }
        }

        /* ── Desktop: center the feed ── */
        @media (min-width: 769px) {
          .cuts-reel-slide {
            background: #0a0a0a;
          }
          .cuts-reel-item {
            border-radius: 0;
          }
        }
      `}</style>

      {/* ── Close Button (top-right) — back to /discover ── */}
      <button
        type="button"
        aria-label="Close Cuts"
        onClick={() => navigate("/discover")}
        className="absolute z-[100] flex items-center justify-center"
        style={{
          top: `max(16px, env(safe-area-inset-top, 0px))`,
          right: 16,
          width: 44,
          height: 44,
          borderRadius: "50%",
          background: "rgba(0,0,0,0.55)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          border: "1px solid rgba(255,255,255,0.18)",
          boxShadow: "0 4px 16px rgba(0,0,0,0.5)",
          transition: "transform 0.15s cubic-bezier(0.34,1.56,0.64,1), background 0.2s",
        }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.15)"; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(0,0,0,0.55)"; }}
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="white" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      <div ref={containerRef} className="cuts-container">
        {reels.map((reel, i) => (
          <div
            key={reel.id}
            data-index={i}
            ref={(el) => { itemRefs.current[i] = el; }}
            className="cuts-reel-slide"
          >
            <ReelVideo
              youtubeId={reel.youtubeId}
              active={i === active}
              muted={muted}
              poster={reel.poster}
              reel={reel}
              bookmarked={isBookmarked(reel)}
              index={i}
              total={reels.length}
              onToggleMute={toggleMute}
              onToggleBookmark={() => toggleBookmark(reel)}
              onWatchNow={() => handleWatchNow(reel)}
              onEnded={() => scrollToNext(i)}
              onScrollNext={() => scrollToNext(i)}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Export ───────────────────────────────────────────────────────────────────

export function CutsPage() {
  return <ReelsPage />;
}
