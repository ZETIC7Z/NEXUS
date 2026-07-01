import { useState, useEffect } from "react";
import { Trans, useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { motion, Variants } from "framer-motion";

import { MetaResponse, getBackendMeta } from "@/backend/accounts/meta";
import { Button } from "@/components/buttons/Button";
import { Icon, Icons } from "@/components/Icon";
import { LargeCard, LargeCardButtons } from "@/components/layout/LargeCard";
import { MwLink } from "@/components/text/Link";

interface TrustBackendPartProps {
  onNext?: (meta: MetaResponse) => void;
}

const COG_VARIANTS: Variants = {
  normal: { rotate: 0 },
  animate: { rotate: 180 },
};

const COG_TRANSITION = {
  type: "spring",
  stiffness: 50,
  damping: 10,
};

/* ── Animating User Icon ── */
function UserRoundCogIcon() {
  return (
    <svg
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      viewBox="0 0 24 24"
      className="w-10 h-10 text-pink-500 relative z-10"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M2 21a8 8 0 0 1 10.434-7.62" />
      <circle cx="10" cy="8" r="5" />
      <motion.g
        variants={COG_VARIANTS}
        transition={COG_TRANSITION as any}
        style={{ transformOrigin: "18px 18px" }}
      >
        <circle cx="18" cy="18" r="3" />
        <path d="m14.305 19.53.923-.382" />
        <path d="m15.228 16.852-.923-.383" />
        <path d="m16.852 15.228-.383-.923" />
        <path d="m16.852 20.772-.383.924" />
        <path d="m19.148 15.228.383-.923" />
        <path d="m19.53 21.696-.382-.924" />
        <path d="m20.772 16.852.924-.383" />
        <path d="m20.772 19.148.924.383" />
      </motion.g>
    </svg>
  );
}

/* ── Animating Database Icon ── */
function DatabaseBackupIcon() {
  return (
    <svg
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      viewBox="0 0 24 24"
      className="w-10 h-10 text-pink-500 relative z-10"
      xmlns="http://www.w3.org/2000/svg"
    >
      <ellipse cx="12" cy="5" rx="9" ry="3" />
      <path d="M3 12a9 3 0 0 0 5 2.69" />
      <path d="M21 9.3V5" />
      <path d="M3 5v14a9 3 0 0 0 6.47 2.88" />
      <motion.g
        style={{ transformOrigin: "17.5px 17px" }}
        transition={{ duration: 0.6, ease: "easeInOut" }}
        variants={{
          normal: { rotate: 0 },
          animate: { rotate: 360 },
        }}
      >
        <path d="M12 12v4h4" />
        <path d="M13 20a5 5 0 0 0 9-3 4.5 4.5 0 0 0-4.5-4.5c-1.33 0-2.54.54-3.41 1.41L12 16" />
      </motion.g>
    </svg>
  );
}

/* ── NodeCard component with landscape box (140x96) and conic hover animation ── */
function NodeCard({ type }: { type: "user" | "database" }) {
  return (
    <motion.div
      whileHover="animate"
      initial="normal"
      style={{
        width: 140,
        height: 96,
        background: "#0d0d12",
        borderRadius: 16,
        border: "1px solid rgba(236,72,153,0.18)",
        boxShadow: "0 0 0 1px rgba(236,72,153,0.06), 0 10px 30px rgba(0,0,0,0.65)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        overflow: "hidden",
        cursor: "default",
      }}
      className="trust-node group"
    >
      {/* Conic sweep effect on hover */}
      <div className="trust-lines" />
      
      {/* Centered animating icon */}
      {type === "user" ? <UserRoundCogIcon /> : <DatabaseBackupIcon />}
    </motion.div>
  );
}

/* ── StatusPill component ── */
function StatusPill({ loading, online }: { loading: boolean; online: boolean }) {
  return (
    <div className="flex items-center gap-1.5 bg-black/60 py-1.5 px-3 rounded-full border border-white/5 mt-3 shadow-md select-none">
      <span
        className={`w-2 h-2 rounded-full flex-shrink-0 ${
          loading ? "dot-loading" : online ? "dot-online" : "dot-offline"
        }`}
      />
      <span className="text-[9px] font-mono font-bold tracking-wider text-zinc-400 uppercase">
        {loading ? "Checking…" : online ? "Online" : "Offline"}
      </span>
    </div>
  );
}

export function TrustBackendPart(props: TrustBackendPartProps) {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [backendStatuses, setBackendStatuses] = useState<
    Record<string, { online: boolean; name: string; loading: boolean; meta: MetaResponse | null }>
  >({
    "https://movies.dovetechnology.org": { online: false, name: "SPECTRUM", loading: true, meta: null },
    "https://court.fontaine.lol": { online: false, name: "REAPER", loading: true, meta: null },
  });

  useEffect(() => {
    Object.keys(backendStatuses).forEach(async (url) => {
      try {
        const meta = await getBackendMeta(url);
        setBackendStatuses((prev) => ({ ...prev, [url]: { ...prev[url], online: true, loading: false, meta } }));
      } catch {
        setBackendStatuses((prev) => ({ ...prev, [url]: { ...prev[url], online: false, loading: false, meta: null } }));
      }
    });
  }, []);

  const b1 = backendStatuses["https://movies.dovetechnology.org"] || { online: false, name: "SPECTRUM", loading: true, meta: null };
  const b2 = backendStatuses["https://court.fontaine.lol"] || { online: false, name: "REAPER", loading: true, meta: null };

  return (
    <div className="w-full max-w-[580px] mx-auto flex flex-col items-center">
      {/* ── Header — very top, outside card ── */}
      <div className="flex flex-col items-center text-center mb-10 px-4">
        <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-4">
          <Icon icon={Icons.CIRCLE_EXCLAMATION} className="text-red-500 text-2xl" />
        </div>
        <h2 className="text-2xl md:text-3xl font-black text-white mb-2">Do you trust this server?</h2>
        <p className="text-gray-400 text-sm max-w-[440px] leading-relaxed">
          You are connecting to{" "}
          <span className="text-white font-bold">MULTIPLE BACKEND</span>{" "}
          please confirm you trust them before making an account...
        </p>
      </div>

      <LargeCard>
        <style>{`
          /* Animated glow trace line */
          .flow-path-bg {
            stroke: rgba(236, 72, 153, 0.12);
            stroke-width: 2px;
            fill: none;
          }
          .flow-path-glowing {
            stroke: #ec4899;
            stroke-width: 2.5px;
            fill: none;
            filter: drop-shadow(0 0 5px rgba(236, 72, 153, 0.8));
          }

          /* Conic hover effect */
          .trust-lines {
            position: absolute;
            inset: -45%;
            border-radius: 40%;
            background: conic-gradient(transparent 0deg, rgba(236, 72, 153, 0.5) 60deg, transparent 120deg);
            opacity: 0;
            animation: spin-cw 2.8s linear infinite;
            transition: opacity 0.35s;
            pointer-events: none;
          }
          .trust-node:hover {
            border-color: rgba(236,72,153,0.6) !important;
            box-shadow: 0 0 0 1px rgba(236,72,153,0.28), 0 0 28px rgba(236,72,153,0.25), 0 10px 30px rgba(0,0,0,0.7) !important;
          }
          .trust-node:hover .trust-lines {
            opacity: 1;
          }
          @keyframes spin-cw { to { transform: rotate(360deg); } }

          /* Status indicator lights */
          .dot-online  { background:#4ade80; box-shadow: 0 0 7px #4ade80; }
          .dot-offline { background:#f87171; box-shadow: 0 0 7px #f87171; }
          .dot-loading { background:#facc15; box-shadow: 0 0 7px #facc15; animation: blink 1s ease-in-out infinite; }
          @keyframes blink { 0%,100%{opacity:1} 50%{opacity:.3} }
        `}</style>

        {/* ── Graph canvas wrapper with negative margins to expand beyond card padding ── */}
        <div className="w-[calc(100%+3rem)] mx-[-1.5rem] overflow-visible flex items-center justify-center scale-90 xs:scale-95 sm:scale-100 origin-center transition-transform duration-300">
          <div
            className="relative w-full max-w-[530px] bg-[#060608] border border-white/5 rounded-2xl overflow-visible"
            style={{ height: 380 }}
          >
            {/* SVG lines with neon pulse animations */}
            <svg
              className="absolute inset-0 w-full h-full pointer-events-none"
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
            >
              <defs>
                <filter id="glow-filter" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              {/* Left path (moved to widely separated 16%) */}
              <path id="left-wire" d="M 50,21 C 50,45 16,45 16,67" className="flow-path-bg" />
              {/* Right path (moved to widely separated 84%) */}
              <path id="right-wire" d="M 50,21 C 50,45 84,45 84,67" className="flow-path-bg" />

              {/* Glowing traveling comets/pulses */}
              <circle r="2.5" fill="#ec4899" filter="url(#glow-filter)">
                <animateMotion dur="2.4s" repeatCount="indefinite">
                  <mpath href="#left-wire" />
                </animateMotion>
              </circle>
              <circle r="2.5" fill="#ec4899" filter="url(#glow-filter)">
                <animateMotion dur="2.4s" repeatCount="indefinite">
                  <mpath href="#right-wire" />
                </animateMotion>
              </circle>
            </svg>

            {/* USER DATA — top centre */}
            <div
              className="absolute flex flex-col items-center -translate-x-1/2"
              style={{ left: "50%", top: 32 }}
            >
              <NodeCard type="user" />
              <span className="mt-3 text-[10px] font-mono font-bold tracking-[0.2em] text-gray-300 uppercase select-none">
                User Data
              </span>
            </div>

            {/* SPECTRUM — bottom left (moved to widely separated 16%) */}
            <div
              className="absolute flex flex-col items-center -translate-x-1/2"
              style={{ left: "16%", top: 208 }}
            >
              <NodeCard type="database" />
              <span className="mt-3 text-[10px] font-mono font-bold tracking-[0.18em] text-white uppercase select-none">
                {b1.name}
              </span>
              <StatusPill loading={b1.loading} online={b1.online} />
            </div>

            {/* REAPER — bottom right (moved to widely separated 84%) */}
            <div
              className="absolute flex flex-col items-center -translate-x-1/2"
              style={{ left: "84%", top: 208 }}
            >
              <NodeCard type="database" />
              <span className="mt-3 text-[10px] font-mono font-bold tracking-[0.18em] text-white uppercase select-none">
                {b2.name}
              </span>
              <StatusPill loading={b2.loading} online={b2.online} />
            </div>
          </div>
        </div>

        {/* ── Actions ── */}
        <LargeCardButtons>
          <Button theme="secondary" onClick={() => navigate("/")}>
            {t("auth.trust.no")}
          </Button>
          <Button
            theme="purple"
            onClick={() => {
              const activeMeta = b1.meta || b2.meta;
              if (activeMeta) props.onNext?.(activeMeta);
            }}
          >
            I trust this server 🤞
          </Button>
        </LargeCardButtons>

        <p className="text-center mt-6">
          <Trans i18nKey="auth.hasAccount">
            <MwLink to="/login">Already have an account? Login here.</MwLink>
          </Trans>
        </p>
      </LargeCard>
    </div>
  );
}
