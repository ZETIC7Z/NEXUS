import { useEffect, useState } from "react";

import { Icon, Icons } from "@/components/Icon";
import { FancyModal } from "@/components/overlays/Modal";
import {
  ReactIcon,
  TechMarquee,
  TypeScriptIcon,
} from "@/components/TechMarquee";
import { Heading3, Paragraph } from "@/components/utils/Text";

// Floating particles for code-themed background
function FloatingParticles() {
  const [particles, setParticles] = useState<
    Array<{
      id: number;
      char: string;
      left: number;
      delay: number;
      duration: number;
    }>
  >([]);

  useEffect(() => {
    const codeSymbols = [
      "{",
      "}",
      "[",
      "]",
      "(",
      ")",
      "<",
      ">",
      "/",
      "*",
      "=",
      "+",
      "-",
      ";",
      ":",
      "&",
      "|",
    ];
    const newParticles = Array.from({ length: 15 }, (_, i) => ({
      id: i,
      char: codeSymbols[Math.floor(Math.random() * codeSymbols.length)],
      left: Math.random() * 100,
      delay: Math.random() * 15,
      duration: 10 + Math.random() * 10,
    }));
    setParticles(newParticles);
  }, []);

  return (
    <div className="floating-particles absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((p) => (
        <div
          key={p.id}
          className="particle absolute font-mono text-xl opacity-10 animate-float"
          style={{
            left: `${p.left}%`,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
            color: "var(--colors-type-link, #c084fc)",
          }}
        >
          {p.char}
        </div>
      ))}
    </div>
  );
}

// Hero Section with Developer-style intro
function HeroSection() {
  return (
    <div className="hero-section relative py-8 mb-8">
      <div className="hero-content text-center relative z-10">
        {/* Greeting */}
        <div
          className="hero-greeting font-mono text-lg mb-4"
          style={{ color: "var(--colors-type-link, #c084fc)" }}
        >
          <span>Hello, I&apos;m</span>
          <span className="greeting-cursor animate-blink">|</span>
        </div>

        {/* Name */}
        <div className="hero-name font-mono text-4xl md:text-5xl font-bold mb-6 leading-tight">
          <span className="name-prefix" style={{ color: "#a78bfa" }}>
            const{" "}
          </span>
          <span className="name-value bg-clip-text text-transparent bg-gradient-to-r from-[#c084fc] via-[#a78bfa] to-[#67e8f9]">
            ZETICUZ
          </span>
          <span className="name-suffix" style={{ color: "#67e8f9" }}>
            {" "}
            ;
          </span>
        </div>

        {/* Title */}
        <div
          className="hero-title font-mono text-xl mb-6"
          style={{ color: "#67e8f9" }}
        >
          <span className="title-prefix text-gray-500">{"// "}</span>
          Full Stack Developer &amp; UI/UX Designer
        </div>

        {/* Description */}
        <p className="hero-description text-gray-400 text-lg mb-8 max-w-xl mx-auto leading-relaxed">
          Passionate developer creating exceptional digital experiences with
          modern technologies.
        </p>
      </div>

      {/* Floating Badges */}
      <div className="floating-badges hidden md:block">
        <div className="floating-badge badge-1 absolute top-4 right-4 bg-[#1e293b] border border-white/10 rounded-2xl px-4 py-3 flex items-center gap-3 shadow-lg animate-float-badge">
          <div className="text-2xl" style={{ color: "#61DAFB" }}>
            ⚛
          </div>
          <div>
            <div className="font-bold text-white text-sm">React</div>
            <div className="text-xs text-gray-400">Redux, Router, Hooks</div>
          </div>
        </div>
        <div
          className="floating-badge badge-2 absolute bottom-4 right-8 bg-[#1e293b] border border-white/10 rounded-2xl px-4 py-3 flex items-center gap-3 shadow-lg animate-float-badge"
          style={{ animationDelay: "1s" }}
        >
          <div className="text-2xl font-bold" style={{ color: "#F7DF1E" }}>
            JS
          </div>
          <div>
            <div className="font-bold text-white text-sm">JavaScript</div>
            <div className="text-xs text-gray-400">ES6+, TypeScript</div>
          </div>
        </div>
        <div
          className="floating-badge badge-3 absolute top-1/2 left-4 bg-[#1e293b] border border-white/10 rounded-2xl px-4 py-3 flex items-center gap-3 shadow-lg animate-float-badge"
          style={{ animationDelay: "2s" }}
        >
          <div className="text-2xl" style={{ color: "#339933" }}>
            ⬢
          </div>
          <div>
            <div className="font-bold text-white text-sm">Node.js</div>
            <div className="text-xs text-gray-400">Express, Socket.io</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Glowing Flowchart Component
function GlowingFlowchart() {
  return (
    <div className="flowchart-container relative max-w-4xl mx-auto py-20 px-4">
      <div className="relative grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-24">
        {/* Connection Lines (Desktop) */}
        <svg className="hidden md:block absolute inset-0 w-full h-full pointer-events-none z-0">
          <path
            d="M 150 100 L 350 100 M 550 100 L 750 100"
            className="flow-line-bg"
            fill="none"
            stroke="rgba(255,255,255,0.05)"
            strokeWidth="2"
          />
          <path
            d="M 150 100 L 350 100 M 550 100 L 750 100"
            className="flow-line-glow"
            fill="none"
            stroke="url(#glowGradient)"
            strokeWidth="2"
            strokeDasharray="20, 180"
          />
          <defs>
            <linearGradient id="glowGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="transparent" />
              <stop offset="50%" stopColor="#fff" />
              <stop offset="100%" stopColor="transparent" />
            </linearGradient>
          </defs>
        </svg>

        {/* Step 1: Source */}
        <div className="flow-node group">
          <div className="node-circle">
            <Icon icon={Icons.P_STREAM} className="text-4xl text-white" />
            <div className="node-glow" />
          </div>
          <div className="node-content">
            <h4 className="text-white font-bold text-lg">Data Source</h4>
            <p className="text-xs text-gray-500">P-STREAM Backend</p>
          </div>
        </div>

        {/* Step 2: Processing */}
        <div className="flow-node group">
          <div className="node-circle">
            <TypeScriptIcon className="w-12 h-12 text-white" />
            <div className="node-glow" />
          </div>
          <div className="node-content">
            <h4 className="text-white font-bold text-lg">Logic Layer</h4>
            <p className="text-xs text-gray-500">TypeScript & Node.js</p>
          </div>
        </div>

        {/* Step 3: Delivery */}
        <div className="flow-node group">
          <div className="node-circle">
            <ReactIcon className="w-12 h-12 text-white" />
            <div className="node-glow" />
          </div>
          <div className="node-content">
            <h4 className="text-white font-bold text-lg">Experience</h4>
            <p className="text-xs text-gray-500">React + Vite UI</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export function PartnersModal(props: { id: string }) {
  return (
    <FancyModal id={props.id} title="Partners & Technologies" size="xl">
      <div className="partners-modal-content relative overflow-hidden bg-[#0a0a0a]">
        {/* Animated Background */}
        <div className="hero-background absolute inset-0 z-0">
          <div
            className="code-grid-bg absolute inset-0 opacity-5"
            style={{
              backgroundImage: `
                linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
              `,
              backgroundSize: "60px 60px",
              animation: "gridMove 30s linear infinite",
            }}
          />
          <FloatingParticles />
        </div>

        <div className="relative z-10 space-y-16 py-12 px-6">
          {/* Hero Section */}
          <HeroSection />

          {/* Tech Stack & Partners Marquee */}
          <div className="text-center space-y-8">
            <div className="inline-block px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-[10px] font-bold uppercase tracking-[0.3em] text-gray-400 mb-4">
              Our Tech Stack and Streaming Partner
            </div>
            <TechMarquee />
          </div>

          {/* Technology Process */}
          <div className="space-y-12 pt-12 border-t border-white/5">
            <div className="text-center max-w-2xl mx-auto">
              <Heading3 className="text-3xl font-black tracking-tight text-white mb-4">
                Technology Process
              </Heading3>
              <Paragraph className="text-gray-400 leading-relaxed">
                NEXUS leverages a cutting-edge distributed architecture to
                ensure seamless streaming, real-time updates, and a premium user
                experience across all devices.
              </Paragraph>
            </div>

            <GlowingFlowchart />

            {/* Detailed Descriptions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="p-8 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-white/20 hover:bg-white/[0.04] transition-all duration-500 group">
                <div className="flex items-center gap-4 mb-6">
                  <div className="p-3 rounded-xl bg-white/5 text-white group-hover:scale-110 transition-transform duration-500">
                    <ReactIcon className="w-8 h-8" />
                  </div>
                  <h4 className="text-xl text-white font-bold tracking-tight">
                    Frontend Excellence
                  </h4>
                </div>
                <p className="text-sm text-gray-500 leading-relaxed">
                  Built with **React** and **Vite**, our frontend is optimized
                  for speed and responsiveness. We utilize advanced caching
                  strategies and component-level optimization to deliver a
                  buttery-smooth interface that feels like a native application.
                </p>
              </div>

              <div className="p-8 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-white/20 hover:bg-white/[0.04] transition-all duration-500 group">
                <div className="flex items-center gap-4 mb-6">
                  <div className="p-3 rounded-xl bg-white/5 text-white group-hover:scale-110 transition-transform duration-500">
                    <TypeScriptIcon className="w-8 h-8" />
                  </div>
                  <h4 className="text-xl text-white font-bold tracking-tight">
                    Robust Logic
                  </h4>
                </div>
                <p className="text-sm text-gray-500 leading-relaxed">
                  **TypeScript** ensures our codebase is maintainable and
                  bug-free. By enforcing strict typing across the entire
                  application, we can confidently scale and add new features
                  while maintaining the highest standards of code quality.
                </p>
              </div>
            </div>
          </div>

          {/* Attribution Section */}
          <div className="text-center space-y-12 pt-12 border-t border-white/5">
            <div className="inline-block px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-[10px] font-bold uppercase tracking-[0.3em] text-gray-400">
              This Project Made Possible By
            </div>

            <div className="flex flex-wrap justify-center items-center gap-12 md:gap-24">
              {/* TMDB */}
              <div className="flex flex-col items-center gap-6 group">
                <div className="relative w-48 h-24 flex items-center justify-center rounded-2xl bg-white/5 border border-white/5 group-hover:border-[#90CEA1]/30 transition-all duration-500">
                  <Icon
                    icon={Icons.TMDB}
                    className="text-7xl text-white opacity-80 group-hover:opacity-100 transition-opacity"
                  />
                </div>
                <p className="text-[11px] text-gray-500 max-w-[200px] leading-relaxed">
                  Providing the world&apos;s most comprehensive movie and TV
                  metadata and imagery.
                </p>
              </div>

              {/* P-STREAM */}
              <div className="flex flex-col items-center gap-6 group">
                <div className="relative w-48 h-24 flex items-center justify-center rounded-2xl bg-white/5 border border-white/5 group-hover:border-[#8b8bf5]/30 transition-all duration-500">
                  <img
                    src="/pstream-logo.png"
                    alt="P-STREAM"
                    className="h-16 w-auto object-contain opacity-80 group-hover:opacity-100 transition-opacity"
                  />
                </div>
                <p className="text-[11px] text-gray-500 max-w-[200px] leading-relaxed">
                  Our core backend infrastructure powering high-quality
                  streaming and real-time library updates.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Styles */}
      <style>{`
        @keyframes gridMove {
          0% { transform: translate(0, 0); }
          100% { transform: translate(60px, 60px); }
        }
        
        
        @keyframes flowLine {
          0% { stroke-dashoffset: 200; }
          100% { stroke-dashoffset: 0; }
        }
        
        .flow-line-glow {
          animation: flowLine 3s linear infinite;
        }
        
        .node-circle {
          position: relative;
          width: 100px;
          height: 100px;
          border-radius: 50%;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.1);
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 20px;
          transition: all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          z-index: 2;
        }
        
        .node-glow {
          position: absolute;
          inset: -10px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
          opacity: 0;
          transition: opacity 0.5s ease;
        }
        
        .flow-node:hover .node-circle {
          transform: scale(1.1);
          border-color: rgba(255,255,255,0.3);
          background: rgba(255,255,255,0.05);
          box-shadow: 0 0 30px rgba(255,255,255,0.1);
        }
        
        .flow-node:hover .node-glow {
          opacity: 1;
        }
        
        .node-content {
          text-align: center;
        }
        
        @keyframes float {
          0%, 100% {
            transform: translateY(100vh) rotate(0deg);
            opacity: 0;
          }
          10%, 90% {
            opacity: 0.1;
          }
          50% {
            transform: translateY(-100px) rotate(180deg);
            opacity: 0.2;
          }
        }
        
        @keyframes blink {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0; }
        }
        
        @keyframes floatBadge {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-15px); }
        }
        
        .animate-float {
          animation: float 15s infinite ease-in-out;
        }
        
        .animate-blink {
          animation: blink 1s infinite;
        }
        
        .animate-float-badge {
          animation: floatBadge 3s ease-in-out infinite;
        }
        
        .hexagon-menu {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: 0;
          padding: 60px 0;
          perspective: 1000px;
        }
        
        .hexagon-item {
          cursor: pointer;
          width: 140px;
          height: 121.24px;
          float: left;
          margin-left: -20px;
          z-index: 0;
          position: relative;
          transform: rotate(30deg) translateZ(0);
          transition: all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }
        
        .hexagon-item:first-child {
          margin-left: 0;
        }
        
        .hexagon-item:hover {
          z-index: 10;
          transform: rotate(30deg) scale(1.1) translateZ(50px);
        }
        
        .hexagon-item:hover .hex-item:last-child {
          opacity: 1;
          transform: scale(1.3);
        }
        
        .hexagon-item:hover .hex-item:first-child {
          opacity: 1;
          transform: scale(1.2);
        }
        
        .hexagon-item:hover .hex-item:first-child div:before,
        .hexagon-item:hover .hex-item:first-child div:after {
          height: 5px;
        }
        
        .hexagon-item:hover .hex-item div::before,
        .hexagon-item:hover .hex-item div::after {
          background-color: var(--colors-type-link, #c084fc);
          box-shadow: 0 0 15px var(--colors-type-link, #c084fc);
        }
        
        .hexagon-item:hover .hex-content svg:last-child {
          transform: scale(0.97);
        }
        
        .hexagon-item:hover .icon {
          filter: drop-shadow(0 0 15px var(--colors-type-link, #c084fc));
          transform: scale(1.2) rotate(-30deg);
        }
        
        .hexagon-item:hover .title {
          animation: focus-in-contract 0.5s cubic-bezier(0.250, 0.460, 0.450, 0.940) both;
          color: var(--colors-type-link, #c084fc);
          text-shadow: 0 0 10px rgba(192, 132, 252, 0.5);
        }
        
        .hexagon-item:nth-child(n+4) {
          transform: rotate(30deg) translate(60px, -56px);
        }
        
        .hexagon-item:nth-child(n+4):hover {
          transform: rotate(30deg) translate(60px, -56px) scale(1.1) translateZ(50px);
        }
        
        .hex-item {
          position: absolute;
          top: 0;
          left: 35px;
          width: 70px;
          height: 121.24px;
        }
        
        .hex-item:first-child {
          z-index: 0;
          transform: scale(0.9);
          transition: all 0.3s cubic-bezier(0.165, 0.84, 0.44, 1);
        }
        
        .hex-item:last-child {
          transition: all 0.3s cubic-bezier(0.19, 1, 0.22, 1);
          z-index: 1;
        }
        
        .hex-item div {
          box-sizing: border-box;
          position: absolute;
          top: 0;
          width: 70px;
          height: 121.24px;
          transform-origin: center center;
        }
        
        .hex-item div::before,
        .hex-item div::after {
          background-color: #2a3140;
          content: "";
          position: absolute;
          width: 100%;
          height: 3px;
          transition: all 0.3s cubic-bezier(0.165, 0.84, 0.44, 1) 0s;
        }
        
        .hex-item div::before {
          top: 0;
        }
        
        .hex-item div::after {
          bottom: 0;
        }
        
        .hex-item div:nth-child(1) {
          transform: rotate(0deg);
        }
        
        .hex-item div:nth-child(2) {
          transform: rotate(60deg);
        }
        
        .hex-item div:nth-child(3) {
          transform: rotate(120deg);
        }
        
        .hex-content {
          color: #fff;
          display: block;
          height: 126px;
          margin: 0 auto;
          position: relative;
          text-align: center;
          transform: rotate(-30deg);
          width: 109px;
        }
        
        .hex-content-inner {
          left: 50%;
          margin: -3px 0 0 2px;
          position: absolute;
          top: 50%;
          transform: translate(-50%, -50%);
        }
        
        .hex-content .icon {
          display: flex;
          justify-content: center;
          align-items: center;
          font-size: 28px;
          line-height: 30px;
          margin-bottom: 8px;
          transition: all 0.5s ease;
        }
        
        .hex-content .title {
          display: block;
          font-family: "Open Sans", sans-serif;
          font-size: 11px;
          letter-spacing: 1px;
          line-height: 18px;
          text-transform: uppercase;
          font-weight: 600;
          transition: all 0.3s ease;
        }
        
        .hex-content svg:last-child {
          left: -5px;
          position: absolute;
          top: -9px;
          transform: scale(0.61);
          z-index: -1;
          transition: all 0.3s cubic-bezier(0.165, 0.84, 0.44, 1) 0s;
        }
        
        .hex-content svg:last-child path {
          fill: #1e2530;
        }
        
        @keyframes focus-in-contract {
          0% {
            letter-spacing: 1em;
            filter: blur(12px);
            opacity: 0;
          }
          100% {
            filter: blur(0px);
            opacity: 1;
          }
        }
        
        @media only screen and (max-width: 767px) {
          .hexagon-item {
            float: none;
            margin: 0 auto 35px;
            width: 120px;
            height: 103.92px;
          }
          
          .hexagon-item:first-child {
            margin-left: auto;
          }
          
          .hexagon-item:nth-child(n+4) {
            transform: rotate(30deg) translate(0px, 0px);
          }
          
          .hexagon-item:nth-child(n+4):hover {
            transform: rotate(30deg) scale(1.1) translateZ(50px);
          }
          
          .hexagon-menu {
            flex-direction: column;
            align-items: center;
          }
          
          .hex-item {
            left: 30px;
            width: 60px;
            height: 103.92px;
          }
          
          .hex-item div {
            width: 60px;
            height: 103.92px;
          }
          
          .hex-content {
            height: 108px;
            width: 93px;
          }
          
          .hex-content svg:last-child {
            transform: scale(0.52);
          }
          
          .tech-marquee-item .w-24 {
            width: 80px;
            height: 80px;
          }
          
          .node-circle {
            width: 80px;
            height: 80px;
          }
          
          .hero-name {
            font-size: 2rem !important;
          }
        }
      `}</style>
    </FancyModal>
  );
}
