import { Icon, Icons } from "@/components/Icon";

// Technology Icons as SVG components
export function ReactIcon(props: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={props.className || "w-8 h-8"}
      fill="#61DAFB"
    >
      <circle cx="12" cy="12" r="2.5" />
      <ellipse
        cx="12"
        cy="12"
        rx="10"
        ry="4"
        fill="none"
        stroke="#61DAFB"
        strokeWidth="1"
      />
      <ellipse
        cx="12"
        cy="12"
        rx="10"
        ry="4"
        fill="none"
        stroke="#61DAFB"
        strokeWidth="1"
        transform="rotate(60 12 12)"
      />
      <ellipse
        cx="12"
        cy="12"
        rx="10"
        ry="4"
        fill="none"
        stroke="#61DAFB"
        strokeWidth="1"
        transform="rotate(120 12 12)"
      />
    </svg>
  );
}

export function ViteIcon(props: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={props.className || "w-8 h-8"}>
      <defs>
        <linearGradient id="viteGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#41D1FF" />
          <stop offset="100%" stopColor="#BD34FE" />
        </linearGradient>
        <linearGradient id="viteGrad2" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFBD4F" />
          <stop offset="100%" stopColor="#FF9046" />
        </linearGradient>
      </defs>
      <path
        fill="url(#viteGrad1)"
        d="M29.8836 6.146L16.7418 29.6457c-.2714.4851-.9684.488-1.2439.0052L2.0956 6.1482c-.3-.5262.1498-1.1635.746-1.057l13.156 2.3516a.7144.7144 0 00.2536 0l12.9174-2.3395c.5765-.1043 1.0214.4263.7152.9408z"
      />
      <path
        fill="url(#viteGrad2)"
        d="M22.2639 2.0001l-9.8913 1.9269a.3571.3571 0 00-.288.3314l-.6094 10.1848c-.0154.2574.2226.4543.4712.3902l2.4231-.6248c.2792-.072.5243.1907.4553.4876l-.7561 3.2557c-.072.3099.2014.5853.4983.5022l1.8394-.5147c.2975-.0833.5707.1933.4983.5042l-1.2018 5.1619c-.1174.5042.5423.7752.7894.3243l.1647-.3007 9.0998-17.2549c.1517-.2878-.0852-.6298-.4108-.5927l-2.5695.2927c-.2923.0333-.5180-.2488-.4273-.5341l1.3477-4.2226c.0914-.2864-.1367-.5765-.4326-.5499z"
      />
    </svg>
  );
}

export function TypeScriptIcon(props: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={props.className || "w-8 h-8"}
      fill="#3178C6"
    >
      <path d="M1.125 0C.502 0 0 .502 0 1.125v21.75C0 23.498.502 24 1.125 24h21.75c.623 0 1.125-.502 1.125-1.125V1.125C24 .502 23.498 0 22.875 0H1.125zm17.363 9.75c.612 0 1.154.037 1.627.111a6.38 6.38 0 0 1 1.306.34v2.458c-.23-.14-.48-.277-.717-.376a5.098 5.098 0 0 0-.862-.291 5.08 5.08 0 0 0-.869-.113c-.277-.016-.55-.02-.815-.02-.408 0-.803.053-1.162.13-.36.076-.68.195-.941.369a1.855 1.855 0 0 0-.614.655c-.15.273-.225.599-.225.98 0 .265.041.508.123.732.083.223.21.421.375.594.166.172.371.325.616.457.245.132.523.248.828.349.365.125.71.266 1.040.424.33.158.627.34.882.547.255.207.466.453.621.74.155.287.233.625.233 1.02 0 .523-.082.996-.243 1.42-.162.424-.409.78-.74 1.068-.33.288-.74.51-1.23.665-.49.155-1.05.233-1.68.233-.626 0-1.193-.057-1.702-.17a7.97 7.97 0 0 1-1.401-.428v-2.616c.44.287.915.519 1.424.694a4.8 4.8 0 0 0 1.672.263c.33 0 .645-.035.926-.107.281-.072.525-.181.736-.327.21-.145.374-.328.499-.549.124-.22.187-.481.187-.783 0-.232-.045-.441-.134-.626a1.546 1.546 0 0 0-.42-.51 3.49 3.49 0 0 0-.72-.435c-.278-.13-.605-.259-.979-.386a11.26 11.26 0 0 1-1.155-.527 4.145 4.145 0 0 1-.93-.68 2.85 2.85 0 0 1-.612-.966c-.153-.383-.23-.82-.23-1.315 0-.533.108-1 .324-1.4.216-.4.507-.733.873-.998.366-.265.804-.465 1.313-.6.51-.134 1.068-.201 1.675-.201zm-9.73.12h7.576v2.06h-2.443v8.32h-2.69v-8.32H8.757V9.87z" />
    </svg>
  );
}

export function TailwindIcon(props: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={props.className || "w-8 h-8"}
      fill="#38B2AC"
    >
      <path d="M12.001,4.8c-3.2,0-5.2,1.6-6,4.8c1.2-1.6,2.6-2.2,4.2-1.8c0.913,0.228,1.565,0.89,2.288,1.624 C13.666,10.618,15.027,12,18.001,12c3.2,0,5.2-1.6,6-4.8c-1.2,1.6-2.6,2.2-4.2,1.8c-0.913-0.228-1.565-0.89-2.288-1.624 C16.337,6.182,14.976,4.8,12.001,4.8z M6.001,12c-3.2,0-5.2,1.6-6,4.8c1.2-1.6,2.6-2.2,4.2-1.8c0.913,0.228,1.565,0.89,2.288,1.624 c1.177,1.194,2.538,2.576,5.512,2.576c3.2,0,5.2-1.6,6-4.8c-1.2,1.6-2.6,2.2-4.2,1.8c-0.913-0.228-1.565-0.89-2.288-1.624 C10.337,13.382,8.976,12,6.001,12z" />
    </svg>
  );
}

export function PWAIcon(props: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={props.className || "w-8 h-8"}
      fill="#5A0FC8"
    >
      <path d="M22.34 17.045l-2.391-5.022.003-.002 3.472-7.293a.608.608 0 00.046-.261c0-.11-.046-.204-.132-.283a.401.401 0 00-.293-.121l-2.89.001-7.35 15.427a.609.609 0 01-.554.342h-.004a.609.609 0 01-.553-.347L7.39 10.19l-6.64.012c-.12 0-.22.041-.3.123a.391.391 0 00-.122.286c0 .12.044.22.121.3l6.64 6.604c.084.086.166.161.256.225l.002.002.002.002c.177.13.372.262.583.396l.005.002.003.002c.178.114.353.204.524.27l.004.002.003.002c.178.083.353.149.521.197l.004.002.003.002c.185.05.356.084.514.102h.009l.003-.001.003-.001c.172.015.33.011.476-.016l.003-.001.003-.001c.143-.016.274-.044.392-.08l.005-.002.003-.002c.134-.036.256-.08.367-.132l.003-.002.004-.002c.133-.05.253-.106.36-.166l.003-.002.004-.002c.12-.06.227-.122.322-.188l.005-.003.004-.003c.103-.065.193-.13.272-.193l.004-.004.003-.003c.081-.06.151-.119.21-.172l.001-.001h.003L22.18 17.64a.403.403 0 00.293-.118.393.393 0 00.122-.296.605.605 0 00-.047-.182l-.001-.001h-.003v.002h.003z" />
    </svg>
  );
}

export function NodeIcon(props: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={props.className || "w-8 h-8"}
      fill="#339933"
    >
      <path d="M11.998,24c-0.321,0-0.641-0.084-0.922-0.247l-2.936-1.737c-0.438-0.245-0.224-0.332-0.08-0.383 c0.585-0.203,0.703-0.25,1.328-0.604c0.065-0.037,0.151-0.023,0.218,0.017l2.256,1.339c0.082,0.045,0.197,0.045,0.272,0l8.795-5.076 c0.082-0.047,0.134-0.141,0.134-0.238V6.921c0-0.099-0.053-0.192-0.137-0.242l-8.791-5.072c-0.081-0.047-0.189-0.047-0.271,0 L3.075,6.68C2.99,6.729,2.936,6.825,2.936,6.921v10.15c0,0.097,0.054,0.189,0.139,0.235l2.409,1.392 c1.307,0.654,2.108-0.116,2.108-0.89V7.787c0-0.142,0.114-0.253,0.256-0.253h1.115c0.139,0,0.255,0.112,0.255,0.253v10.021 c0,1.745-0.95,2.745-2.604,2.745c-0.508,0-0.909,0-2.026-0.551L2.28,18.675c-0.57-0.329-0.922-0.945-0.922-1.604V6.921 c0-0.659,0.353-1.275,0.922-1.603l8.795-5.082c0.557-0.315,1.296-0.315,1.848,0l8.794,5.082c0.57,0.329,0.924,0.944,0.924,1.603 v10.15c0,0.659-0.354,1.273-0.924,1.604l-8.794,5.078C12.643,23.916,12.324,24,11.998,24z" />
    </svg>
  );
}

export function TechMarquee() {
  const techIcons = [
    {
      id: "react",
      icon: <ReactIcon className="w-12 h-12 text-white" />,
      name: "React",
    },
    {
      id: "vite",
      icon: <ViteIcon className="w-12 h-12 text-white" />,
      name: "Vite",
    },
    {
      id: "typescript",
      icon: <TypeScriptIcon className="w-12 h-12 text-white" />,
      name: "TypeScript",
    },
    {
      id: "tailwind",
      icon: <TailwindIcon className="w-12 h-12 text-white" />,
      name: "Tailwind",
    },
    {
      id: "pwa",
      icon: <PWAIcon className="w-12 h-12 text-white" />,
      name: "PWA",
    },
    {
      id: "node",
      icon: <NodeIcon className="w-12 h-12 text-white" />,
      name: "Node.js",
    },
    {
      id: "tmdb",
      icon: <Icon icon={Icons.TMDB} className="text-5xl text-white" />,
      name: "TMDB",
    },
    {
      id: "pstream",
      icon: <Icon icon={Icons.P_STREAM} className="text-5xl text-white" />,
      name: "P-STREAM",
    },
  ];

  return (
    <div className="tech-marquee-container relative w-full overflow-hidden py-12">
      <div className="tech-marquee flex items-center gap-16 animate-marquee whitespace-nowrap">
        {/* Triple the icons for a seamless loop */}
        {[...techIcons, ...techIcons, ...techIcons].map((item, i) => {
          const loopIndex = Math.floor(i / techIcons.length);
          return (
            <div
              key={`tech-${item.id}-${loopIndex}`}
              className="tech-marquee-item flex flex-col items-center justify-center gap-3 transition-all duration-500 hover:scale-110 group"
            >
              <div className="w-24 h-24 flex items-center justify-center rounded-2xl bg-white/5 backdrop-blur-md group-hover:bg-white/10 transition-colors duration-500">
                {item.icon}
              </div>
              <span className="text-[10px] text-gray-500 uppercase tracking-widest font-bold opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                {item.name}
              </span>
            </div>
          );
        })}
      </div>
      {/* Gradient Overlays for smooth edges */}
      <div className="absolute inset-y-0 left-0 w-48 bg-gradient-to-r from-[#0a0a0a] to-transparent z-10" />
      <div className="absolute inset-y-0 right-0 w-48 bg-gradient-to-l from-[#0a0a0a] to-transparent z-10" />

      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-33.33%); }
        }
        
        .animate-marquee {
          animation: marquee 30s linear infinite;
        }
      `}</style>
    </div>
  );
}
