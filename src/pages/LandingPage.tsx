import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";

import { CarouselCards } from "@/components/CarouselCards";
import { Icon, Icons } from "@/components/Icon";
import { SocialLink } from "@/components/SocialLink";
import { conf } from "@/setup/config";
import { useAuthStore } from "@/stores/auth";
import {
  createQRSession,
  getQRSession,
  deleteQRSession,
  getQRCodeUrl,
} from "@/utils/qrSession";

interface MoviePoster {
  id: string;
  poster: string;
  title: string;
}

// Movie card background
function MovieBackground() {
  const [rows, setRows] = useState<MoviePoster[][]>([[], [], [], [], [], []]);

  useEffect(() => {
    const fetchPosters = async () => {
      try {
        const apiKey = conf().TMDB_READ_API_KEY;
        const allPosters: MoviePoster[] = [];

        for (const page of [1, 2, 3, 4, 5]) {
          const response = await fetch(
            `https://api.themoviedb.org/3/trending/all/week?page=${page}`,
            {
              headers: {
                Authorization: `Bearer ${apiKey}`,
                "Content-Type": "application/json",
              },
            },
          );
          const data = await response.json();

          if (data.results) {
            const posters = data.results
              .filter((m: { poster_path: string }) => m.poster_path)
              .map(
                (m: {
                  id: number;
                  title?: string;
                  name?: string;
                  poster_path: string;
                }) => ({
                  id: String(m.id),
                  title: m.title || m.name || "",
                  poster: `https://image.tmdb.org/t/p/w300${m.poster_path}`,
                }),
              );
            allPosters.push(...posters);
          }
        }

        const shuffled = allPosters.sort(() => Math.random() - 0.5);
        const perRow = Math.ceil(shuffled.length / 6);
        const newRows = [
          shuffled.slice(0, perRow),
          shuffled.slice(perRow, perRow * 2),
          shuffled.slice(perRow * 2, perRow * 3),
          shuffled.slice(perRow * 3, perRow * 4),
          shuffled.slice(perRow * 4, perRow * 5),
          shuffled.slice(perRow * 5),
        ];
        setRows(newRows);
      } catch (error) {
        console.debug("Failed to fetch posters:", error);
      }
    };

    fetchPosters();
  }, []);

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none">
      <div
        className="absolute opacity-50"
        style={{
          transform: "rotate(-12deg) scale(1.8)",
          transformOrigin: "center center",
          top: "-20%",
          left: "-20%",
          right: "-20%",
          bottom: "-20%",
        }}
      >
        {rows.map((row, rowIndex) => (
          <div
            key={`row-${row[0]?.id || rowIndex}`}
            className={`flex gap-3 mb-3 ${rowIndex % 2 === 0 ? "animate-scroll-slow-left" : "animate-scroll-slow-right"}`}
            style={{ width: "max-content" }}
          >
            {row.map((poster) => (
              <div
                key={`${poster.id}-first`}
                className="w-[120px] md:w-[150px] aspect-[2/3] rounded-lg overflow-hidden flex-shrink-0"
              >
                <img
                  src={poster.poster}
                  alt=""
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
            ))}
            {row.map((poster) => (
              <div
                key={`${poster.id}-second`}
                className="w-[120px] md:w-[150px] aspect-[2/3] rounded-lg overflow-hidden flex-shrink-0"
              >
                <img
                  src={poster.poster}
                  alt=""
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
            ))}
            {row.map((poster) => (
              <div
                key={`${poster.id}-third`}
                className="w-[120px] md:w-[150px] aspect-[2/3] rounded-lg overflow-hidden flex-shrink-0"
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
        ))}
      </div>
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 0%, rgba(0,0,0,0.5) 40%, rgba(0,0,0,0.85) 100%)",
        }}
      />
    </div>
  );
}

export function LandingPage() {
  const navigate = useNavigate();
  const account = useAuthStore((s) => s.account);
  const isLoggedIn = !!account;

  const [contentVisible, setContentVisible] = useState(false);
  const [qrSessionId, setQrSessionId] = useState<string | null>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [qrStatus, setQrStatus] = useState<"idle" | "pending" | "approved" | "error">("idle");
  const [qrError, setQrError] = useState("");
  const [showZoomModal, setShowZoomModal] = useState(false);
  const [isPairingSuccessful, setIsPairingSuccessful] = useState(false);

  const getDeviceNameFromUA = () => {
    const ua = navigator.userAgent;
    let browser = "Unknown Browser";
    let os = "Unknown OS";

    if (ua.indexOf("Firefox") > -1) browser = "Firefox";
    else if (ua.indexOf("SamsungBrowser") > -1) browser = "Samsung Browser";
    else if (ua.indexOf("Opera") > -1 || ua.indexOf("OPR") > -1) browser = "Opera";
    else if (ua.indexOf("Trident") > -1) browser = "Internet Explorer";
    else if (ua.indexOf("Edge") > -1 || ua.indexOf("Edg") > -1) browser = "Edge";
    else if (ua.indexOf("Chrome") > -1) browser = "Chrome";
    else if (ua.indexOf("Safari") > -1) browser = "Safari";

    if (ua.indexOf("Windows NT 10.0") > -1) os = "Windows 10/11";
    else if (ua.indexOf("Windows NT 6.2") > -1) os = "Windows 8";
    else if (ua.indexOf("Windows NT 6.1") > -1) os = "Windows 7";
    else if (ua.indexOf("Macintosh") > -1) os = "macOS";
    else if (ua.indexOf("Android") > -1) os = "Android";
    else if (ua.indexOf("iPhone") > -1 || ua.indexOf("iPad") > -1) os = "iOS";
    else if (ua.indexOf("Linux") > -1) os = "Linux";

    return `${browser} on ${os}`;
  };

  // Redirect to discover if logged in
  useEffect(() => {
    if (isLoggedIn && !isPairingSuccessful) {
      navigate("/discover", { replace: true });
    }
  }, [isLoggedIn, isPairingSuccessful, navigate]);

  // Polling claimed status
  useEffect(() => {
    if (!qrSessionId || qrStatus !== "pending") return;

    const intervalId = setInterval(async () => {
      try {
        const session = await getQRSession(qrSessionId);
        if (!session) return;

        if (session.status === "claimed" && session.authData) {
          clearInterval(intervalId);
          setQrStatus("approved");
          setIsPairingSuccessful(true);

          const authData = session.authData;
          const localAccount = {
            token: authData.token,
            userId: authData.userId,
            sessionId: authData.sessionId || "dummy-session-id",
            deviceName: "Paired Device",
            seed: authData.seed,
            nickname: authData.account.nickname,
            profile: {
              colorA: authData.account.profile.colorA,
              colorB: authData.account.profile.colorB,
              icon: authData.account.profile.icon,
              photoUrl: authData.account.profile.photoUrl,
            },
          };

          useAuthStore.getState().setBackendUrl(authData.backendUrl);
          useAuthStore.getState().setAccount(localAccount);

          // Background delete
          deleteQRSession(qrSessionId);

          setTimeout(() => {
            navigate("/onboarding");
          }, 1500);
        } else if (session.status === "expired") {
          clearInterval(intervalId);
          setQrStatus("error");
          setQrError("Pairing session expired. Please try again.");
        }
      } catch (err) {
        console.error("Polling error:", err);
      }
    }, 2000);

    return () => clearInterval(intervalId);
  }, [qrSessionId, qrStatus, navigate]);

  const handleQRLoginInit = async () => {
    try {
      setQrStatus("pending");
      setQrError("");

      const deviceName = getDeviceNameFromUA();
      const session = await createQRSession(deviceName);

      setQrSessionId(session.id);
      setQrCodeUrl(getQRCodeUrl(session.id));
    } catch (err: any) {
      setQrStatus("error");
      setQrError(err.message || "Failed to initialize QR session.");
    }
  };

  // Show content with fade-in animation
  useEffect(() => {
    const timer = setTimeout(() => setContentVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const handleSignIn = () => navigate("/login");
  const handleRegister = () => navigate("/register");

  // Don't render if logged in (will redirect)
  if (isLoggedIn && !isPairingSuccessful) return null;

  return (
    <div className="h-screen bg-black relative overflow-hidden flex flex-col">
      <MovieBackground />

      {/* Header - Clean minimal header like Netflix */}
      <header
        className={`relative z-40 flex items-center justify-between px-3 md:px-6 lg:px-10 py-2 md:py-3 transition-all duration-500 flex-shrink-0 ${
          contentVisible ? "opacity-100" : "opacity-0"
        }`}
      >
        {/* Logo - Bigger for branding */}
        <img
          src="/nexus-logo-full.png"
          alt="NEXUS"
          className="h-10 md:h-14 lg:h-16 object-contain"
        />

        {/* Sign In Button */}
        <button
          type="button"
          onClick={handleSignIn}
          className="px-3 md:px-4 py-1 md:py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded transition-colors"
        >
          Sign In
        </button>
      </header>

      {/* Main content - centered in available space */}
      <div
        className={`relative z-10 flex-1 flex flex-col items-center justify-center px-4 transition-opacity duration-500 ${
          contentVisible ? "opacity-100" : "opacity-0"
        }`}
      >
        <div
          className={`text-center max-w-4xl mx-auto transition-all duration-1000 ${
            contentVisible
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-12"
          }`}
        >
          <h1 className="text-2xl sm:text-3xl md:text-5xl lg:text-6xl font-black text-white mb-2 md:mb-4 px-2 leading-tight tracking-tighter text-balance">
            Unlimited movies, <br className="hidden sm:block" /> TV shows, and
            more
          </h1>
          <p className="text-sm sm:text-base md:text-lg lg:text-xl text-gray-200 mb-4 md:mb-6 font-medium tracking-wide">
            Watch anywhere. Cancel anytime.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-4 md:mb-6">
            <button
              id="get-started-button"
              type="button"
              onClick={handleRegister}
              className="group relative px-8 md:px-10 py-2.5 md:py-3 bg-red-600 overflow-hidden text-white text-sm md:text-base font-black rounded-full transition-all hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(239,68,68,0.4)] w-full sm:w-auto"
            >
              <span className="relative z-10">Get Started</span>
              <div className="absolute inset-0 bg-gradient-to-r from-red-500 to-red-600 transition-transform duration-300 group-hover:scale-110" />
              <div className="absolute inset-x-0 -bottom-px h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
            </button>
            <button
              type="button"
              onClick={handleQRLoginInit}
              className="group relative px-8 md:px-10 py-2.5 md:py-3 bg-purple-600 overflow-hidden text-white text-sm md:text-base font-black rounded-full transition-all hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(147,51,234,0.4)] w-full sm:w-auto"
            >
              <span className="relative z-10">Log in using other device</span>
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-purple-600 transition-transform duration-300 group-hover:scale-110" />
              <div className="absolute inset-x-0 -bottom-px h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
            </button>
          </div>

          {qrStatus !== "idle" && (
            <div className="mt-6 max-w-sm mx-auto animate-fade-in flex flex-col items-center">
              {qrStatus === "pending" && qrCodeUrl && (
                <>
                  <div
                    onClick={() => setShowZoomModal(true)}
                    className="bg-white p-4 rounded-xl cursor-zoom-in hover:scale-[1.02] active:scale-95 transition-all shadow-2xl relative group mb-4"
                  >
                    <QRCodeSVG value={qrCodeUrl} size={150} />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-xl">
                      <span className="text-white text-xs font-bold bg-black/60 px-2.5 py-1.5 rounded-full">🔍 Click to zoom</span>
                    </div>
                  </div>

                  <div className="flex h-8 items-center justify-center">
                    <div className="mx-1 h-2 w-2 animate-loading-pin rounded-full bg-purple-400" />
                    <div className="mx-1 h-2 w-2 animate-loading-pin rounded-full bg-purple-400 [animation-delay:150ms]" />
                    <div className="mx-1 h-2 w-2 animate-loading-pin rounded-full bg-purple-400 [animation-delay:300ms]" />
                    <div className="mx-1 h-2 w-2 animate-loading-pin rounded-full bg-purple-400 [animation-delay:450ms]" />
                  </div>
                  <p className="text-sm text-white/80 font-semibold mt-1 drop-shadow-lg animate-pulse">Waiting for authorization...</p>
                  <p className="text-sm text-white font-bold mt-2 drop-shadow-lg text-center px-2">
                    Scan the QR code on your device to log in. Go to{" "}
                    <span className="text-purple-300">Settings &gt; Scan QR Code</span>.
                  </p>
                </>
              )}

              {qrStatus === "approved" && (
                <div className="py-4 space-y-3 text-center animate-fadeIn">
                  {/* Animated checkmark ring */}
                  <div className="relative w-20 h-20 mx-auto">
                    <div className="absolute inset-0 rounded-full border-4 border-green-400 animate-ping opacity-30" />
                    <div className="w-20 h-20 bg-green-500/20 border-2 border-green-400 rounded-full flex items-center justify-center text-green-400 text-4xl font-black shadow-[0_0_30px_rgba(74,222,128,0.4)]">
                      ✓
                    </div>
                  </div>
                  <p className="text-xl font-black text-green-400 drop-shadow-lg">Login Successful!</p>
                  <p className="text-xs text-white/60 drop-shadow">Redirecting you to onboarding...</p>
                </div>
              )}

              {qrStatus === "error" && (
                <div className="py-4 space-y-4 text-center animate-fadeIn">
                  <div className="w-16 h-16 bg-red-500/20 border-2 border-red-500/50 rounded-full flex items-center justify-center mx-auto text-red-400 text-3xl shadow-[0_0_20px_rgba(239,68,68,0.3)]">
                    ✗
                  </div>
                  <p className="text-sm text-red-400 font-bold drop-shadow">{qrError}</p>
                  <button
                    type="button"
                    onClick={handleQRLoginInit}
                    className="px-4 py-1.5 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-lg transition-colors"
                  >
                    Retry
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* QR Zoom Modal */}
      {showZoomModal && qrCodeUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md transition-opacity duration-300"
          onClick={() => setShowZoomModal(false)}
        >
          <div
            className="bg-white p-8 rounded-3xl shadow-2xl relative animate-fadeIn max-w-[90vw]"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setShowZoomModal(false)}
              className="absolute -top-3 -right-3 w-8 h-8 bg-black border border-white/20 text-white rounded-full flex items-center justify-center hover:bg-white/10 transition-colors shadow-lg text-lg animate-fadeIn"
            >
              ×
            </button>
            <QRCodeSVG value={qrCodeUrl} size={320} className="w-full max-w-[320px] aspect-square" />
            <p className="text-center text-xs text-black/40 font-bold mt-4">Scan this QR code from your logged-in device</p>
          </div>
        </div>
      )}

      {/* Bottom section - fixed at bottom */}
      <div
        className={`relative z-10 pb-2 flex-shrink-0 transition-opacity duration-500 ${
          contentVisible ? "opacity-100" : "opacity-0"
        }`}
      >
        {/* Site Developer Info */}
        <div className="flex flex-wrap items-center justify-center gap-2 md:gap-4 mb-3 md:mb-4 px-2">
          <div className="flex items-center gap-2 md:gap-3 bg-white/5 border border-white/10 px-3 md:px-4 py-1.5 md:py-2 rounded-full backdrop-blur-xl hover:bg-white/10 transition-colors cursor-default group">
            <span className="text-white/40 text-[8px] md:text-[9px] uppercase tracking-[0.15em] font-black group-hover:text-white/60 transition-colors">
              Site Developer
            </span>
            <div className="flex items-center gap-2">
              <div className="relative">
                <img
                  src="/sam-photo.jpg"
                  alt="Sam"
                  className="h-5 w-5 md:h-6 md:w-6 rounded-full object-cover border border-white/20 group-hover:border-red-500/50 transition-colors"
                />
              </div>
              <span className="text-white font-black text-[10px] md:text-xs tracking-tight">
                Sam Pangilinan
              </span>
              <img
                src="/sam-logo.jpg"
                alt="Logo"
                className="h-4 w-4 md:h-5 md:w-5 rounded shadow-lg object-cover"
              />
            </div>
          </div>
        </div>

        {/* Carousel Cards - Streaming Sites */}
        <div className="mb-2">
          <span className="text-white/60 text-[10px] uppercase tracking-[0.2em] block text-center mb-1 font-bold">
            Streaming Partners
          </span>
          <CarouselCards />
        </div>

        {/* Footer - Contact, Copyright, DMCA */}
        <div className="flex flex-col md:flex-row items-center justify-between px-3 md:px-8 py-1 text-[10px] text-white/50">
          {/* Contact Developer - Left */}
          <div className="flex items-center gap-2 mb-1 md:mb-0">
            <span className="text-white/40 uppercase tracking-[0.15em] text-[8px] font-bold">
              Contact
            </span>
            <div className="flex items-center gap-2">
              <SocialLink
                href="https://www.facebook.com/profile.php?id=61578123735793"
                color="#1877F2"
                icon={<Icon icon={Icons.FACEBOOK} className="text-xs" />}
                className="h-6 w-6"
              />
              <SocialLink
                href="mailto:samxerz12@gmail.com"
                color="#EA4335"
                icon={<Icon icon={Icons.MAIL} className="text-xs" />}
                className="h-6 w-6"
              />
            </div>
          </div>

          {/* Copyright - Center */}
          <div className="mb-1 md:mb-0 text-center text-[9px]">
            © 2025 - 2026 ZETICUZ. All rights reserved.
          </div>

          {/* DMCA Disclaimer - Right */}
          <div className="max-w-[200px] text-[8px] text-white/40 text-right leading-tight hidden md:block">
            Content aggregator. All streams via third-party services.
          </div>
        </div>
      </div>
    </div>
  );
}
