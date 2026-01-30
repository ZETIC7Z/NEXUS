import { motion } from "framer-motion";
import { memo, useState } from "react";

interface CardProps {
  logo: string;
  name: string;
  index: number;
}

const Card = memo(({ logo, name, index }: CardProps) => {
  const [hasError, setHasError] = useState(false);

  return (
    <motion.div
      className="relative group cursor-pointer flex-shrink-0"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03 }}
    >
      <div className="relative w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-xl overflow-hidden bg-white/5 border border-white/10 backdrop-blur-xl transition-all duration-500 group-hover:border-white/30 group-hover:bg-white/10 flex items-center justify-center">
        {!hasError ? (
          <img
            src={logo}
            alt={name}
            className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 object-contain drop-shadow-2xl transition-transform duration-500 group-hover:scale-110"
            onError={() => setHasError(true)}
            loading="lazy"
          />
        ) : (
          <span className="text-lg font-bold text-white/60">
            {name.charAt(0)}
          </span>
        )}
      </div>
      <span className="block mt-1 text-center text-[7px] sm:text-[8px] md:text-[9px] font-bold uppercase tracking-wider text-white/50 group-hover:text-white/80 transition-colors">
        {name}
      </span>
    </motion.div>
  );
});

export function CarouselCards() {
  // Using TMDB provider logos - these are the official streaming provider images
  const streamingSites = [
    {
      id: "netflix",
      name: "Netflix",
      logo: "https://image.tmdb.org/t/p/original/pbpMk2JmcoNnQwx5JGpXngfoWtp.jpg",
    },
    {
      id: "hbomax",
      name: "Max",
      logo: "https://image.tmdb.org/t/p/original/6Q3ZYUNA9Hsgj6iWnVsw2gR5V6z.jpg",
    },
    {
      id: "disneyplus",
      name: "Disney+",
      logo: "https://image.tmdb.org/t/p/original/7rwgEs15tFwyR9NPQ5vpzxTj19Q.jpg",
    },
    {
      id: "primevideo",
      name: "Prime",
      logo: "https://image.tmdb.org/t/p/original/dQeAar5H991VYporEjUspolDarG.jpg",
    },
    {
      id: "hulu",
      name: "Hulu",
      logo: "https://image.tmdb.org/t/p/original/bxBlRPEPpMVDc4jMhSrTf2339DW.jpg",
    },
    {
      id: "appletv",
      name: "Apple TV+",
      logo: "https://image.tmdb.org/t/p/original/2E03IAZsX4ZaUqM7tXlctEPMGWS.jpg",
    },
    {
      id: "paramount",
      name: "Paramount+",
      logo: "https://image.tmdb.org/t/p/original/xbhHHa1YgtpwhC8lb1NQ3ACVcLd.jpg",
    },
    {
      id: "peacock",
      name: "Peacock",
      logo: "https://image.tmdb.org/t/p/original/xTHltMrZPAJFLQ6qyCBjAnXSmZt.jpg",
    },
  ];

  // Triple the items for truly seamless infinite loop
  const tripleItems = [...streamingSites, ...streamingSites, ...streamingSites];

  return (
    <div className="relative w-full overflow-hidden py-3 md:py-4">
      <div className="flex items-start gap-3 md:gap-4 animate-carousel-scroll">
        {tripleItems.map((site, i) => (
          <Card
            key={`${site.id}-${i}`} // eslint-disable-line react/no-array-index-key
            logo={site.logo}
            name={site.name}
            index={i % streamingSites.length}
          />
        ))}
      </div>

      <style>{`
        @keyframes carousel-scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-33.333%); }
        }
        .animate-carousel-scroll {
          animation: carousel-scroll 20s linear infinite;
          width: max-content;
        }
        .animate-carousel-scroll:hover {
          animation-play-state: paused;
        }
      `}</style>

      {/* Gradient Overlays */}
      <div className="absolute inset-y-0 left-0 w-8 md:w-20 bg-gradient-to-r from-black to-transparent z-10 pointer-events-none" />
      <div className="absolute inset-y-0 right-0 w-8 md:w-20 bg-gradient-to-l from-black to-transparent z-10 pointer-events-none" />
    </div>
  );
}
