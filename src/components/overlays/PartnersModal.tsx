import { forwardRef, useCallback, useEffect, useRef, useState } from "react";

import { FancyModal } from "@/components/overlays/Modal";
import { TechMarquee } from "@/components/TechMarquee";
import { ReactIcon, TSIcon as TypeScriptIcon } from "@/components/TechIcons";

/* ─────────────────────────────────────────────────────────────────────────────
   MAGIC UI — ANIMATED BEAM  (self-contained, no extra package)
   Uses forwardRef + ResizeObserver + SVG animateMotion for smooth beam travel.
   Layout: 3 tech nodes (left) → NEXUS center ← 3 tech nodes (right)
───────────────────────────────────────────────────────────────────────────── */

// ── Node circle ──────────────────────────────────────────────────────────────
const NodeCircle = forwardRef<
  HTMLDivElement,
  { children: React.ReactNode; className?: string; style?: React.CSSProperties }
>(({ children, className = "", style }, ref) => (
  <div
    ref={ref}
    className={[
      "relative z-10 flex items-center justify-center rounded-full",
      "border border-white/[0.12] bg-[#0f0f1a]",
      "shadow-[0_0_14px_rgba(139,92,246,0.22)]",
      "transition-all duration-300",
      "hover:shadow-[0_0_28px_rgba(167,139,250,0.5)] hover:border-violet-400/40",
      className,
    ].join(" ")}
    style={style}
  >
    {children}
  </div>
));
NodeCircle.displayName = "NodeCircle";

// ── Helpers ───────────────────────────────────────────────────────────────────
function getCenter(el: HTMLElement, container: HTMLElement) {
  const er = el.getBoundingClientRect();
  const cr = container.getBoundingClientRect();
  return {
    x: er.left - cr.left + er.width / 2,
    y: er.top - cr.top + er.height / 2,
  };
}

function buildCurvedPath(
  from: { x: number; y: number },
  to:   { x: number; y: number },
  curvature: number,
) {
  const mx = (from.x + to.x) / 2;
  const my = (from.y + to.y) / 2;
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const len = Math.sqrt(dx * dx + dy * dy) || 1;
  const cpx = mx + (-dy / len) * curvature;
  const cpy = my + ( dx / len) * curvature;
  return `M ${from.x} ${from.y} Q ${cpx} ${cpy} ${to.x} ${to.y}`;
}

// ── Single beam ───────────────────────────────────────────────────────────────
interface BeamProps {
  containerRef: React.RefObject<HTMLDivElement | null>;
  fromRef:      React.RefObject<HTMLDivElement | null>;
  toRef:        React.RefObject<HTMLDivElement | null>;
  curvature?:   number;
  duration?:    number;
  delay?:       number;
  startColor?:  string;
  endColor?:    string;
  id:           string;
}

function AnimatedBeam({
  containerRef,
  fromRef,
  toRef,
  curvature = 0,
  duration = 3,
  delay = 0,
  startColor = "#a855f7",
  endColor   = "#6d28d9",
  id,
}: BeamProps) {
  const [svgD, setSvgD]   = useState("");
  const [svgWH, setSvgWH] = useState({ w: 0, h: 0 });

  const recalc = useCallback(() => {
    const c = containerRef.current;
    const f = fromRef.current;
    const t = toRef.current;
    if (!c || !f || !t) return;
    const from = getCenter(f, c);
    const to   = getCenter(t, c);
    const cr   = c.getBoundingClientRect();
    setSvgD(buildCurvedPath(from, to, curvature));
    setSvgWH({ w: cr.width, h: cr.height });
  }, [containerRef, fromRef, toRef, curvature]);

  useEffect(() => {
    // Give the browser one paint to place the DOM nodes, then measure
    const raf = requestAnimationFrame(() => {
      setTimeout(recalc, 50);
    });
    const obs = new ResizeObserver(recalc);
    const watch = (r: React.RefObject<HTMLDivElement | null>) => {
      if (r.current) obs.observe(r.current);
    };
    watch(containerRef);
    watch(fromRef);
    watch(toRef);
    return () => { cancelAnimationFrame(raf); obs.disconnect(); };
  }, [recalc, containerRef, fromRef, toRef]);

  if (!svgD || !svgWH.w) return null;

  const gradId   = `bg-${id}`;
  const glowId   = `glow-${id}`;
  const pathId   = `path-${id}`;
  const dotGradId = `dot-${id}`;

  return (
    <svg
      className="pointer-events-none absolute inset-0"
      width={svgWH.w}
      height={svgWH.h}
      style={{ zIndex: 1, overflow: "visible" }}
    >
      <defs>
        {/* Track gradient (dim, always visible) */}
        <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%"   stopColor={startColor} stopOpacity="0.08" />
          <stop offset="100%" stopColor={endColor}   stopOpacity="0.08" />
        </linearGradient>

        {/* Glow blur filter */}
        <filter id={glowId} x="-40%" y="-200%" width="180%" height="500%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        {/* Gradient for the moving beam dot */}
        <linearGradient id={dotGradId} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%"   stopColor={startColor} stopOpacity="0" />
          <stop offset="50%"  stopColor={startColor} stopOpacity="1" />
          <stop offset="100%" stopColor={endColor}   stopOpacity="0" />
        </linearGradient>

        {/* The path itself for animateMotion */}
        <path id={pathId} d={svgD} />
      </defs>

      {/* Static dim track line */}
      <path
        d={svgD}
        fill="none"
        stroke={`url(#${gradId})`}
        strokeWidth="2"
      />

      {/* Moving beam: a fat glowing stroke segment animated along the path */}
      <path
        d={svgD}
        fill="none"
        stroke={`url(#${dotGradId})`}
        strokeWidth="2.5"
        strokeLinecap="round"
        filter={`url(#${glowId})`}
        style={{
          strokeDasharray: "80 10000",
          animation: `beam-move-${id} ${duration}s ease-in-out ${delay}s infinite`,
        }}
      />

      {/* Bright leading dot that travels the path */}
      <circle r="4" fill={startColor} filter={`url(#${glowId})`} opacity="0.9">
        <animateMotion
          dur={`${duration}s`}
          begin={`${delay}s`}
          repeatCount="indefinite"
          rotate="auto"
          calcMode="spline"
          keyTimes="0;1"
          keySplines="0.42 0 0.58 1"
        >
          <mpath xlinkHref={`#${pathId}`} />
        </animateMotion>
      </circle>

      <style>{`
        @keyframes beam-move-${id} {
          0%   { stroke-dashoffset: 10000; }
          100% { stroke-dashoffset: -80; }
        }
      `}</style>
    </svg>
  );
}

// ── Label badge ───────────────────────────────────────────────────────────────
function Label({ children }: { children: string }) {
  return (
    <span className="mt-2 block text-center text-[9px] font-bold uppercase tracking-[0.2em] text-gray-500">
      {children}
    </span>
  );
}

// ── Main animated beam flowchart ──────────────────────────────────────────────
function AnimatedBeamFlowchart() {
  const containerRef = useRef<HTMLDivElement>(null);

  // Left nodes
  const tsRef     = useRef<HTMLDivElement>(null);
  const tailRef   = useRef<HTMLDivElement>(null);
  const viteRef   = useRef<HTMLDivElement>(null);

  // Center node
  const nexusRef  = useRef<HTMLDivElement>(null);

  // Right nodes
  const reactRef  = useRef<HTMLDivElement>(null);
  const routerRef = useRef<HTMLDivElement>(null);
  const nodeRef   = useRef<HTMLDivElement>(null);

  const ICON_SIZE = 56;  // px — outer circle diameter
  const ICON_PAD  = 11;  // px — inner padding

  return (
    <div
      ref={containerRef}
      className="relative w-full select-none overflow-visible"
      style={{ height: 340 }}
    >
      {/* ── Beams (rendered first so they sit behind icons) ── */}
      <AnimatedBeam id="ts"     containerRef={containerRef} fromRef={tsRef}     toRef={nexusRef} curvature={-60}  duration={3.2} delay={0}    startColor="#3b82f6" endColor="#818cf8" />
      <AnimatedBeam id="tail"   containerRef={containerRef} fromRef={tailRef}   toRef={nexusRef} curvature={0}    duration={3.0} delay={0.7}  startColor="#06b6d4" endColor="#7c3aed" />
      <AnimatedBeam id="vite"   containerRef={containerRef} fromRef={viteRef}   toRef={nexusRef} curvature={60}   duration={2.9} delay={1.4}  startColor="#f59e0b" endColor="#a78bfa" />
      <AnimatedBeam id="react"  containerRef={containerRef} fromRef={reactRef}  toRef={nexusRef} curvature={-60}  duration={3.1} delay={0.35} startColor="#38bdf8" endColor="#818cf8" />
      <AnimatedBeam id="router" containerRef={containerRef} fromRef={routerRef} toRef={nexusRef} curvature={0}    duration={3.3} delay={1.0}  startColor="#f43f5e" endColor="#a78bfa" />
      <AnimatedBeam id="node"   containerRef={containerRef} fromRef={nodeRef}   toRef={nexusRef} curvature={60}   duration={2.7} delay={1.7}  startColor="#4ade80" endColor="#7c3aed" />

      {/* ── Layout row ── */}
      <div className="absolute inset-0 flex items-center justify-between px-10">

        {/* LEFT column */}
        <div className="flex flex-col gap-6">
          {/* TypeScript */}
          <div>
            <NodeCircle ref={tsRef} style={{ width: ICON_SIZE, height: ICON_SIZE, padding: ICON_PAD }}>
              <svg viewBox="0 0 400 400" className="w-full h-full">
                <rect width="400" height="400" rx="50" fill="#3178c6"/>
                <path fill="#fff" d="M87.7 219h47.7v-17.6H0V219h47v133.5h40.7V219zm90.5-17.7c-22.5 0-40.5 5-52.7 14.7l15 23.3c10-7.5 24-12 38-12 17.8 0 27.3 7.4 27.3 21.3v3h-28.5c-40 0-59.6 15-59.6 44.3 0 27 19.3 43.5 48.3 43.5 20.8 0 35-6.8 43.8-20.5v18h37.8v-88c0-32.5-25.4-47.6-69.4-47.6zm25.6 93.8c-5.8 10.8-17 16.7-31 16.7-14.3 0-22.5-6.5-22.5-17.3 0-13 10-19.5 32.5-19.5h21v20.1z"/>
              </svg>
            </NodeCircle>
            <Label>TypeScript</Label>
          </div>

          {/* Tailwind */}
          <div>
            <NodeCircle ref={tailRef} style={{ width: ICON_SIZE, height: ICON_SIZE, padding: ICON_PAD }}>
              <svg viewBox="0 0 54 33" className="w-full h-full">
                <path fillRule="evenodd" clipRule="evenodd"
                  d="M27 0C19.8 0 15.3 3.6 13.5 10.8c2.7-3.6 5.85-4.95 9.45-4.05 2.054.513 3.522 2.004 5.147 3.653C30.744 12.672 33.514 15.5 40.5 15.5c7.2 0 11.7-3.6 13.5-10.8C51.3 8.3 48.15 9.65 44.55 8.75c-2.054-.513-3.522-2.004-5.147-3.653C36.756 2.372 33.986 0 27 0ZM13.5 15.5C6.3 15.5 1.8 19.1 0 26.3c2.7-3.6 5.85-4.95 9.45-4.05 2.054.514 3.522 2.004 5.147 3.653C17.244 28.172 20.014 31 27 31c7.2 0 11.7-3.6 13.5-10.8-2.7 3.6-5.85 4.95-9.45 4.05-2.054-.514-3.522-2.004-5.147-3.653C23.256 18.328 20.486 15.5 13.5 15.5Z"
                  fill="#06b6d4" />
              </svg>
            </NodeCircle>
            <Label>Tailwind</Label>
          </div>

          {/* Vite */}
          <div>
            <NodeCircle ref={viteRef} style={{ width: ICON_SIZE, height: ICON_SIZE, padding: ICON_PAD }}>
              <svg viewBox="0 0 410 404" className="w-full h-full">
                <defs>
                  <linearGradient id="vA" x1="6" y1="32" x2="235" y2="344" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#41D1FF" /><stop offset="1" stopColor="#BD34FE" />
                  </linearGradient>
                  <linearGradient id="vB" x1="194" y1="9" x2="236" y2="293" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#FF3E00" /><stop offset=".33" stopColor="#FF7A2F" /><stop offset="1" stopColor="#FFC700" />
                  </linearGradient>
                </defs>
                <path d="M399.641 59.524L215.643 388.508c-3.465 6.07-12.33 6.125-15.87.1L1.241 59.645c-3.67-6.21.765-13.887 7.971-13.816l190.636 1.899c.507.005 1.012.072 1.502.2l192.549-1.899c7.191-.07 11.641 7.57 7.742 13.495Z" fill="url(#vA)" />
                <path d="M292.965.43L168.849 24.765l-24.04 143.076 80.153-14.507 26.004 48.055 41.998-182.96Z" fill="url(#vB)" />
              </svg>
            </NodeCircle>
            <Label>Vite</Label>
          </div>
        </div>

        {/* CENTER — NEXUS */}
        <div className="flex flex-col items-center">
          <div className="relative">
            {/* Outer pulsing rings */}
            <div className="absolute inset-0 rounded-full border border-violet-500/20 scale-[1.35] pointer-events-none animate-pulse" />
            <div className="absolute inset-0 rounded-full border border-violet-500/10 scale-[1.75] pointer-events-none" />
            <NodeCircle
              ref={nexusRef}
              style={{ width: 108, height: 108, padding: 14 }}
              className="border-violet-500/50 bg-[#0d0d1a] shadow-[0_0_60px_rgba(109,40,217,0.5),0_0_120px_rgba(109,40,217,0.18)] hover:shadow-[0_0_80px_rgba(139,92,246,0.65)]"
            >
              <img
                src="/NEXUS-LOGO.svg"
                alt="NEXUS"
                className="w-full h-full object-contain"
                draggable={false}
                onError={(e) => {
                  // fallback if SVG fails
                  (e.currentTarget as HTMLImageElement).src = "/nexus-logo.png";
                }}
              />
            </NodeCircle>
          </div>
          <span className="mt-3 text-[11px] font-black uppercase tracking-[0.35em] text-violet-400">
            NEXUS
          </span>
        </div>

        {/* RIGHT column */}
        <div className="flex flex-col gap-6">
          {/* React */}
          <div>
            <NodeCircle ref={reactRef} style={{ width: ICON_SIZE, height: ICON_SIZE, padding: ICON_PAD }}>
              <svg viewBox="-11.5 -10.23 23 20.46" className="w-full h-full">
                <circle cx="0" cy="0" r="2.05" fill="#61DAFB" />
                <g stroke="#61DAFB" strokeWidth="1" fill="none">
                  <ellipse rx="11" ry="4.2" />
                  <ellipse rx="11" ry="4.2" transform="rotate(60)" />
                  <ellipse rx="11" ry="4.2" transform="rotate(120)" />
                </g>
              </svg>
            </NodeCircle>
            <Label>React</Label>
          </div>

          {/* React Router */}
          <div>
            <NodeCircle ref={routerRef} style={{ width: ICON_SIZE, height: ICON_SIZE, padding: ICON_PAD }}>
              <svg viewBox="0 0 100 100" className="w-full h-full">
                <circle cx="50" cy="14" r="11" fill="none" stroke="#f44250" strokeWidth="7" />
                <circle cx="15" cy="80" r="11" fill="none" stroke="#f44250" strokeWidth="7" />
                <circle cx="85" cy="80" r="11" fill="none" stroke="#f44250" strokeWidth="7" />
                <path d="M50 25 L15 69 M50 25 L85 69" stroke="#f44250" strokeWidth="6" fill="none" strokeLinecap="round" />
              </svg>
            </NodeCircle>
            <Label>Router</Label>
          </div>

          {/* Node.js */}
          <div>
            <NodeCircle ref={nodeRef} style={{ width: ICON_SIZE, height: ICON_SIZE, padding: ICON_PAD }}>
              <svg viewBox="0 0 232 262" className="w-full h-full">
                <path fill="#83CD29" d="M116 262c-4 0-8-1-11-3L75 239c-5-3-2-4-1-5l8-2 30 17c2 1 4 1 6 0l116-67c2-1 3-3 3-5V85c0-2-1-4-3-5L119 13c-2-1-4-1-6 0L6 80C4 81 3 83 3 85v134c0 2 1 4 3 5l31 18c17 8 27-1 27-8V97c0-1 1-2 2-2h11c1 0 2 1 2 2v137c0 27-15 42-40 42Z"/>
                <path fill="#404137" d="M162 232c-32 0-38-15-38-27v-2c0-1 1-2 2-2h11c1 0 2 1 2 2v2c0 7 3 22 21 22 13 0 19-6 19-16 0-10-4-16-30-22-23-5-37-16-37-38 0-25 21-40 55-40 39 0 58 13 60 42 0 1-1 2-2 2h-12c-1 0-2-1-2-2-2-15-10-26-44-26-27 0-43 9-43 28 0 13 5 19 30 25 25 7 38 17 38 35 0 22-14 36-50 36Z"/>
              </svg>
            </NodeCircle>
            <Label>Node.js</Label>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Partners Modal ─────────────────────────────────────────────────────────────
export function PartnersModal(props: { id: string }) {
  return (
    <FancyModal id={props.id} title="Partners &amp; Technologies" size="xl">
      <div className="relative overflow-hidden bg-[#08080f]">
        {/* Subtle animated grid background */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: `
              linear-gradient(rgba(139,92,246,0.5) 1px, transparent 1px),
              linear-gradient(90deg, rgba(139,92,246,0.5) 1px, transparent 1px)
            `,
            backgroundSize: "48px 48px",
            animation: "pm-grid 25s linear infinite",
          }}
        />

        <div className="relative z-10 space-y-10 px-6 py-10">

          {/* Section label */}
          <div className="text-center">
            <span className="inline-block rounded-full border border-violet-500/20 bg-violet-500/5 px-4 py-1 text-[10px] font-bold uppercase tracking-[0.3em] text-violet-400">
              Technology Stack
            </span>
            <h3 className="mt-3 text-2xl font-black text-white">
              Powered by Modern Tools
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Every beam represents data flowing into the NEXUS core
            </p>
          </div>

          {/* ── THE ANIMATED BEAM ── */}
          <AnimatedBeamFlowchart />

          {/* Description cards */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="group rounded-2xl border border-white/5 bg-white/[0.02] p-6 transition-all duration-300 hover:border-white/15 hover:bg-white/[0.04]">
              <div className="mb-4 flex items-center gap-3">
                <div className="rounded-xl bg-white/5 p-2.5 transition-transform duration-300 group-hover:scale-110">
                  <ReactIcon className="h-7 w-7" />
                </div>
                <h4 className="text-lg font-bold text-white">Frontend Excellence</h4>
              </div>
              <p className="text-sm leading-relaxed text-gray-500">
                Built with <strong className="text-gray-300">React 18</strong> and{" "}
                <strong className="text-gray-300">Vite</strong>, our frontend is
                lightning-fast. Advanced code-splitting and component-level caching deliver
                a buttery-smooth experience across all devices.
              </p>
            </div>

            <div className="group rounded-2xl border border-white/5 bg-white/[0.02] p-6 transition-all duration-300 hover:border-white/15 hover:bg-white/[0.04]">
              <div className="mb-4 flex items-center gap-3">
                <div className="rounded-xl bg-white/5 p-2.5 transition-transform duration-300 group-hover:scale-110">
                  <TypeScriptIcon className="h-7 w-7" />
                </div>
                <h4 className="text-lg font-bold text-white">Type-Safe Architecture</h4>
              </div>
              <p className="text-sm leading-relaxed text-gray-500">
                <strong className="text-gray-300">TypeScript</strong> enforces strict
                typing across every layer. Combined with{" "}
                <strong className="text-gray-300">React Router</strong> for navigation and{" "}
                <strong className="text-gray-300">Node.js</strong> for the backend, the
                codebase is future-proof and maintainable at scale.
              </p>
            </div>
          </div>

          {/* Marquee */}
          <div className="border-t border-white/5 pt-8 text-center">
            <div className="mb-6 inline-block rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.3em] text-gray-400">
              Our Tech Stack &amp; Streaming Partner
            </div>
            <TechMarquee />
          </div>
        </div>

        {/* Styles */}
        <style>{`
          @keyframes pm-grid {
            0%   { transform: translate(0,0); }
            100% { transform: translate(48px,48px); }
          }
        `}</style>
      </div>
    </FancyModal>
  );
}