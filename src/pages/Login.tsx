import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import { LoginFormPart } from "@/pages/parts/auth/LoginFormPart";
import { conf } from "@/setup/config";
import { useOnboardingStore } from "@/stores/onboarding";

interface MoviePoster {
  id: string;
  poster: string;
}

function MoviePosterGrid() {
  const [columns, setColumns] = useState<MoviePoster[][]>([[], [], [], [], []]);

  useEffect(() => {
    const fetchPosters = async () => {
      try {
        const apiKey = conf().TMDB_READ_API_KEY;
        const response = await fetch(
          `https://api.themoviedb.org/3/trending/all/week`,
          {
            headers: {
              Authorization: `Bearer ${apiKey}`,
              "Content-Type": "application/json",
            },
          },
        );
        const data = await response.json();

        if (!data.results) return;

        const posters: MoviePoster[] = data.results
          .slice(0, 20)
          .filter((m: { poster_path: string }) => m.poster_path)
          .map((m: { id: number; poster_path: string }) => ({
            id: String(m.id),
            poster: `https://image.tmdb.org/t/p/w300${m.poster_path}`,
          }));

        // Distribute posters into columns
        const newColumns: MoviePoster[][] = [[], [], [], [], []];
        posters.forEach((poster, index) => {
          newColumns[index % 5].push(poster);
        });

        // Duplicate posters in each column for seamless scrolling
        newColumns.forEach((col) => {
          const original = [...col];
          col.push(...original, ...original);
        });

        setColumns(newColumns);
      } catch (error) {
        console.debug("Failed to fetch posters for login background:", error);
      }
    };

    fetchPosters();
  }, []);

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      <div className="flex justify-center gap-4 h-full opacity-40">
        {columns.map((col) => {
          const colId = col[0]?.id || "empty";
          return (
            <div
              key={`col-${colId}`}
              className={`flex flex-col gap-4 ${
                col.indexOf(col[0]) % 2 === 0
                  ? "animate-slide-up"
                  : "animate-slide-down"
              }`}
              style={{ width: "200px" }}
            >
              {col.map((poster) => (
                <div
                  key={poster.id}
                  className="w-full aspect-[2/3] rounded-xl overflow-hidden shadow-2xl"
                >
                  <img
                    src={poster.poster}
                    alt=""
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>
              ))}
            </div>
          );
        })}
      </div>
      {/* Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-black" />
    </div>
  );
}

// Post-login intro animation - plays WITH AUDIO since user has clicked login button
function PostLoginIntro({ onComplete }: { onComplete: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    const audio = audioRef.current;
    if (!video || !audio) return;

    const handleEnded = () => {
      setFadeOut(true);
      audio.pause();
      audio.currentTime = 0;
      setTimeout(() => onComplete(), 500);
    };

    const handleError = () => {
      audio.pause();
      onComplete();
    };

    video.addEventListener("ended", handleEnded);
    video.addEventListener("error", handleError);

    // Play with audio - user has already interacted (clicked login button)
    video.muted = false;
    video.volume = 1.0;
    audio.volume = 1.0;

    video
      .play()
      .then(() => {
        audio.play().catch(() => {});
      })
      .catch(() => {
        // Fallback to muted video
        video.muted = true;
        video.play().catch(() => onComplete());
      });

    return () => {
      video.removeEventListener("ended", handleEnded);
      video.removeEventListener("error", handleError);
      audio.pause();
    };
  }, [onComplete]);

  return (
    <div
      className={`fixed inset-0 z-50 bg-black flex items-center justify-center transition-opacity duration-500 ${fadeOut ? "opacity-0 pointer-events-none" : "opacity-100"}`}
      style={{ width: "100vw", height: "100dvh" }}
    >
      <video
        ref={videoRef}
        src="/intro.mp4"
        className="w-full h-full object-cover"
        playsInline
        preload="auto"
      />
      <audio ref={audioRef} src="/introanim.mp3" preload="auto" />
    </div>
  );
}

export function LoginPage() {
  const navigate = useNavigate();
  const [showIntro, setShowIntro] = useState(false);
  const onboardingCompleted = useOnboardingStore((s) => s.completed);

  const handleLoginSuccess = () => {
    // Detect mobile device
    const isMobile =
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent,
      );

    if (isMobile) {
      // Skip intro on mobile, go directly to discover or onboarding
      if (!onboardingCompleted) {
        navigate("/onboarding");
      } else {
        navigate("/discover");
      }
      return;
    }

    // Desktop: Show intro animation after successful login
    setShowIntro(true);
  };

  const handleIntroComplete = async () => {
    // Check if user needs onboarding (first time user)
    if (!onboardingCompleted) {
      // Navigate to onboarding for new users
      navigate("/onboarding");
    } else {
      // Navigate to discover for returning users
      navigate("/discover");
    }
  };

  return (
    <div className="min-h-screen bg-black relative flex items-center justify-center p-4">
      {showIntro && <PostLoginIntro onComplete={handleIntroComplete} />}

      {!showIntro && (
        <>
          <MoviePosterGrid />
          <div className="relative z-10 w-full max-w-[450px]">
            <LoginFormPart onLogin={handleLoginSuccess} />
          </div>
        </>
      )}
    </div>
  );
}
