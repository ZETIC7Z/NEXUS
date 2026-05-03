import {
  AMCIcon,
  AppleTVIcon,
  CrunchyrollIcon,
  DisneyIcon,
  FuboTVIcon,
  HBOIcon,
  HuluIcon,
  MongoDBIcon,
  NetflixIcon,
  ParamountIcon,
  PrimeVideoIcon,
  // eslint-disable-next-line sort-imports
  PWAIcon,
  ReactIcon,
  ReactRouterIcon,
  ShudderIcon,
  TailwindIcon,
  TMDBIcon,
  TSIcon,
  ViteIcon,
} from "@/components/TechIcons";

// ── Tech Stack icon + label cell ──────────────────────────────────────────────
function TechItem({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 group shrink-0 w-24">
      <div className="w-12 h-12 flex items-center justify-center opacity-60 grayscale group-hover:opacity-100 group-hover:grayscale-0 transition-all duration-300">
        {icon}
      </div>
      <span className="text-[10px] text-center text-gray-400 group-hover:text-white transition-colors duration-300 leading-tight whitespace-nowrap">
        {label}
      </span>
    </div>
  );
}

// ── Streaming provider pill cell ───────────────────────────────────────────────
function ProviderItem({ icon }: { icon: React.ReactNode }) {
  return (
    <div className="shrink-0 flex items-center justify-center group">
      <div className="w-40 h-12 flex items-center justify-center opacity-60 text-white grayscale group-hover:opacity-100 group-hover:grayscale-0 transition-all duration-300">
        {icon}
      </div>
    </div>
  );
}

// ── Tech stack list (no Zustand) ───────────────────────────────────────────────
const TECH_ITEMS = [
  { icon: <TSIcon className="w-full h-full" />, label: "TypeScript" },
  { icon: <TailwindIcon className="w-full h-full" />, label: "Tailwind CSS" },
  { icon: <ReactIcon className="w-full h-full" />, label: "React 18" },
  { icon: <ViteIcon className="w-full h-full" />, label: "Vite" },
  { icon: <ReactRouterIcon className="w-full h-full" />, label: "React Router" },
  { icon: <PWAIcon className="w-full h-full" />, label: "PWA" },
  { icon: <MongoDBIcon className="w-full h-full" />, label: "MongoDB" },
];

// ── Provider list ──────────────────────────────────────────────────────────────
const PROVIDER_ITEMS = [
  <NetflixIcon className="w-full h-full" />,
  <HBOIcon className="w-full h-full" />,
  <DisneyIcon className="w-full h-full" />,
  <AppleTVIcon className="w-full h-full" />,
  <PrimeVideoIcon className="w-full h-full" />,
  <HuluIcon className="w-full h-full" />,
  <ParamountIcon className="w-full h-full" />,
  <CrunchyrollIcon className="w-full h-full" />,
  <ShudderIcon className="w-full h-full" />,
  <FuboTVIcon className="w-full h-full" />,
  <AMCIcon className="w-full h-full" />,
  <TMDBIcon className="w-full h-full" />,
];

export function TechMarquee() {
  // Duplicate both arrays for seamless infinite loops
  const techItems = [...TECH_ITEMS, ...TECH_ITEMS];
  const providerItems = [...PROVIDER_ITEMS, ...PROVIDER_ITEMS];

  return (
    <div className="space-y-6">
      {/* ── Row 1: Tech Stack ─────────────────────────────────────────────── */}
      <div className="relative w-full overflow-hidden py-2">
        <div className="pointer-events-none absolute left-0 top-0 h-full w-20 z-10 bg-gradient-to-r from-[#0a0a0a] to-transparent" />
        <div className="pointer-events-none absolute right-0 top-0 h-full w-20 z-10 bg-gradient-to-l from-[#0a0a0a] to-transparent" />
        <div
          className="flex animate-marquee-tech"
          style={{ width: "max-content" }}
        >
          {techItems.map((item, i) => (
            // eslint-disable-next-line react/no-array-index-key
            <div key={`tech-${item.label}-${i}`} className="px-6">
              <TechItem icon={item.icon} label={item.label} />
            </div>
          ))}
        </div>
      </div>

      {/* ── Row 2: Streaming Providers ────────────────────────────────────── */}
      <div className="relative w-full overflow-hidden py-2">
        <div className="pointer-events-none absolute left-0 top-0 h-full w-20 z-10 bg-gradient-to-r from-[#0a0a0a] to-transparent" />
        <div className="pointer-events-none absolute right-0 top-0 h-full w-20 z-10 bg-gradient-to-l from-[#0a0a0a] to-transparent" />
        {/* Right-to-left for visual variety */}
        <div
          className="flex animate-marquee-providers"
          style={{ width: "max-content" }}
        >
          {providerItems.map((icon, i) => (
            // eslint-disable-next-line react/no-array-index-key
            <div key={`provider-${i}`} className="px-4">
              <ProviderItem icon={icon} />
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes marquee-ltr {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        @keyframes marquee-rtl {
          0%   { transform: translateX(-50%); }
          100% { transform: translateX(0); }
        }
        .animate-marquee-tech {
          animation: marquee-ltr 24s linear infinite;
        }
        .animate-marquee-tech:hover {
          animation-play-state: paused;
        }
        .animate-marquee-providers {
          animation: marquee-rtl 30s linear infinite;
        }
        .animate-marquee-providers:hover {
          animation-play-state: paused;
        }
      `}</style>
    </div>
  );
}
