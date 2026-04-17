// Tech Stack Icons - exact user-provided SVGs

export const TailwindIcon = ({ className = "" }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 100 100" className={className}>
    <path fill="#848484" d="M50 20c-13.3 0-21.7 6.7-25 20 5-6.7 10.8-9.2 17.5-7.5 3.8 1 6.5 3.7 9.5 6.8 4.9 5 10.6 10.7 23 10.7 13.3 0 21.7-6.7 25-20-5 6.7-10.8 9.2-17.5 7.5-3.8-1-6.5-3.7-9.5-6.8C68.1 25.8 62.4 20 50 20M25 50C11.7 50 3.3 56.7 0 70c5-6.7 10.8-9.2 17.5-7.5 3.8 1 6.5 3.7 9.5 6.8 4.9 5 10.6 10.7 23 10.7 13.3 0 21.7-6.7 25-20-5 6.7-10.8 9.2-17.5 7.5-3.8-.9-6.5-3.7-9.5-6.8C43.1 55.8 37.4 50 25 50"/>
  </svg>
);

export const TSIcon = ({ className = "" }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 100 100" className={className}>
    <g clipPath="url(#ts-clip)">
      <path fill="#5f5f5f" d="M0 0h100v100H0z"/>
      <path fill="#fff" d="M48 37h4.8v8.3h-13v36.8l-.3.1c-.5.1-6.6.1-8 0l-1.1-.1V45.3h-13V37zm36.6 41.3c-1.9 2-4 3.1-7.4 4.1-1.5.4-1.7.4-5.1.4-3.3 0-3.6 0-5.2-.4-4.2-1.1-7.6-3.2-9.9-6.2-.7-.8-1.7-2.6-1.7-2.8 0-.1.2-.2.4-.3s.6-.4 1-.6c.3-.2 1-.6 1.4-.8s1.6-.9 2.7-1.6c1.1-.6 2-1.2 2.1-1.2s.3.2.5.5c.9 1.6 3.1 3.6 4.7 4.3 1 .4 3.1.9 4.1.9.9 0 2.7-.4 3.6-.8 1-.5 1.5-.9 2.1-1.8.4-.6.5-.8.4-2 0-1.1-.1-1.4-.4-2-.9-1.4-2.1-2.2-6.9-4.3-5-2.2-7.2-3.5-9-5.3-1.3-1.3-1.6-1.7-2.5-3.3-1.1-2.1-1.2-2.8-1.2-5.9 0-2.2 0-2.9.3-3.7.3-1.1 1.4-3.3 1.9-3.8 1-1.2 1.4-1.5 2.1-2.1 2.1-1.8 5.4-2.9 8.6-3 .4 0 1.5.1 2.7.1 3.2.3 5.4 1 7.5 2.7 1.6 1.2 4 4.2 3.7 4.6-.2.2-6.4 4.4-6.8 4.5-.2.1-.4 0-.8-.4-2.1-2.5-3-3.1-5-3.2-1.5-.1-2.2.1-3.2.7-1 .7-1.5 1.7-1.5 3.2 0 2.1.8 3.1 3.8 4.6 1.9 1 3.6 1.7 3.7 1.7.2 0 4.2 2 5.2 2.6 4.9 2.9 6.9 5.8 7.4 10.9.1 3.7-.9 7.2-3.3 9.7"/>
    </g>
    <defs>
      <clipPath id="ts-clip"><path fill="#fff" d="M0 0h100v100H0z"/></clipPath>
    </defs>
  </svg>
);

export const ReactIcon = ({ className = "" }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 100 100" className={className}>
    <path fill="#b9b9b9" d="M49.802 58.8c4.852 0 8.713-3.9 8.713-8.8s-3.861-8.8-8.713-8.8-8.713 3.9-8.713 8.8 3.861 8.8 8.713 8.8"/>
    <path stroke="#b9b9b9" strokeWidth="5" d="M49.802 68.1c25.842 0 46.832-8.1 46.832-18.1s-20.99-18.1-46.832-18.1S2.97 40 2.97 50s20.99 18.1 46.832 18.1Z"/>
    <path stroke="#b9b9b9" strokeWidth="5" d="M34.356 59c12.872 22.7 30.297 37 38.911 32 8.515-5 5.05-27.4-7.92-50C52.377 18.3 34.95 4 26.436 9c-8.614 5-5.05 27.4 7.92 50Z"/>
    <path stroke="#b9b9b9" strokeWidth="5" d="M34.357 41c-12.97 22.6-16.436 45-7.921 50 8.514 5 25.94-9.3 38.812-32 12.97-22.6 16.534-45 8.02-50-8.615-5-26.04 9.3-38.912 32Z"/>
  </svg>
);

export const ViteIcon = ({ className = "" }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 100 100" className={className}>
    <g clipPath="url(#vite-clip)">
      <path fill="url(#vite-b)" d="M98.8 14.8 52.7 98.7c-1 1.7-3.4 1.7-4.4 0l-47-83.9c-1-1.9.6-4.1 2.7-3.8l46.2 8.4q.45.15.9 0L96.2 11c2.1-.3 3.7 1.9 2.6 3.8"/>
      <path fill="url(#vite-c)" d="M72.1 0 38 6.8c-.3.1-.5.2-.7.4-.2.3-.3.5-.3.8l-2.1 36.1c0 .2 0 .4.1.6s.2.3.3.5c.1.1.3.2.5.3h.6l9.5-2.2c.9-.2 1.7.6 1.5 1.5l-2.8 14.1c-.2.9.7 1.8 1.6 1.5l5.9-1.8c.9-.3 1.8.5 1.6 1.5L49.2 82c-.3 1.4 1.5 2.1 2.3 1l.5-.8 27.8-56.5c.5-.9-.3-2-1.4-1.8l-9.8 1.9c-.9.2-1.7-.7-1.4-1.6l6.4-22.5c.2-1-.6-1.9-1.5-1.7"/>
    </g>
    <defs>
      <linearGradient id="vite-b" x1="29.124" x2="79.975" y1="-3.871" y2="64.011" gradientUnits="userSpaceOnUse">
        <stop stopColor="#ababab"/><stop offset="1" stopColor="#737373"/>
      </linearGradient>
      <linearGradient id="vite-c" x1="52.565" x2="63.147" y1="2.145" y2="73.497" gradientUnits="userSpaceOnUse">
        <stop stopColor="#e5e5e5"/><stop offset=".083" stopColor="#d5d5d5"/><stop offset="1" stopColor="#b0b0b0"/>
      </linearGradient>
      <clipPath id="vite-clip"><path fill="#fff" d="M0 0h100v100H0z"/></clipPath>
    </defs>
  </svg>
);

export const ReactRouterIcon = ({ className = "" }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 100 100" className={className}>
    <g clipPath="url(#rr-clip)">
      <path fill="#000" d="M30.6 59.3c-5 0-9-4.1-9-9.1s4-9.1 9-9.1 9 4.1 9 9.1c.1 5.1-4 9.1-9 9.1M9 77.4c-5 0-9-4.1-9-9.1 0-2.4 1-4.7 2.7-6.4s4-2.7 6.4-2.7c5 0 9 4.1 9 9.1 0 2.4-1 4.7-2.7 6.4s-4 2.7-6.4 2.7m82.1 0c-2.4 0-4.7-.9-6.4-2.6s-2.7-4-2.7-6.4c0-5 4-9.1 9-9.1 2.4 0 4.7.9 6.4 2.6s2.7 4 2.7 6.4c-.1 4.9-4.1 9-9 9.1"/>
      <path fill="#797979" d="M74.1 41.7c-2.5-.8-5.1-1.1-7.6-1.4-4-.4-5.6-2-6.2-6-.4-2.2-.9-4.5-1.9-6.5-1.8-3.8-6.1-5.6-10.4-4.6-3.6.8-6.7 4.5-6.8 8.2-.2 4.2 2.2 7.9 6.4 9.1 2 .6 4.1.9 6.2 1 3.8.3 5.1 1.4 6.1 3.1.7 1.1 1.3 2.2 1.3 5.4 0 3.3-.6 4.3-1.3 5.4-1 1.7-2.3 2.9-6.1 3.1-2.1.2-4.2.5-6.2 1-4.2 1.3-6.6 4.9-6.4 9.1.2 3.7 3.2 7.3 6.8 8.2 4.3 1 8.6-.7 10.4-4.6 1-2 1.5-4.3 1.9-6.5.7-4 2.3-5.5 6.2-6 2.6-.3 5.2-.6 7.6-1.4 3.7-1.2 6-4.6 6-8.5 0-3.5-2.2-6.9-6-8.1"/>
    </g>
    <defs>
      <clipPath id="rr-clip"><path fill="#fff" d="M0 0h100v100H0z"/></clipPath>
    </defs>
  </svg>
);

export const PWAIcon = ({ className = "" }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 100 100" className={className}>
    <g clipPath="url(#pwa-clip)">
      <path fill="#3d3d3d" d="m73.6 61.9 2.9-7.3h8.3l-4-11.1 5-12.5L100 68.7H89.5L87.1 62H73.6z"/>
      <path fill="#3a3a3a" d="M64.7 68.7 79.9 31H69.8L59.4 55.3 52 31h-7.7l-7.9 24.3-5.6-11.1-5.1 15.6 5.1 8.8h9.9l7.2-21.8 6.8 21.8h10"/>
      <path fill="#3d3d3d" d="M9.6 55.7h6.2c1.9 0 3.6-.2 5-.6l1.6-4.9 4.5-13.8c-.3-.5-.7-1.1-1.2-1.5C23.4 32.3 20 31 15.6 31H0v37.7h9.6zm8.2-16c.9.9 1.3 2.1 1.3 3.6q0 2.25-1.2 3.6-1.35 1.5-4.8 1.5H9.6V38.3h3.6c2.1 0 3.7.5 4.6 1.4"/>
    </g>
    <defs>
      <clipPath id="pwa-clip"><path fill="#fff" d="M0 0h100v100H0z"/></clipPath>
    </defs>
  </svg>
);

export const MongoDBIcon = ({ className = "" }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 100 100" className={className}>
    <g clipPath="url(#mongo-clip)">
      <path fill="#797979" d="m50.1.3 2.7 5c.6.9 1.2 1.7 2 2.5 2.2 2.2 4.3 4.6 6.3 7.1 4.5 5.9 7.6 12.5 9.7 19.7 1.3 4.4 2 8.8 2.1 13.3.2 13.5-4.4 25.1-13.7 34.7-1.5 1.5-3.2 2.9-4.9 4.2-.9 0-1.4-.7-1.7-1.4-.7-1.2-1.2-2.5-1.4-3.9-.3-1.6-.5-3.3-.4-5v-.8c-.2 0-1-75-.7-75.4"/>
      <path fill="#8e8e8e" d="M50.1.1c-.1-.2-.2-.1-.3.1.1 1.1-.3 2.1-.9 3-.7.9-1.5 1.6-2.4 2.4-4.8 4.2-8.7 9.3-11.7 14.9-4.1 7.6-6.2 15.8-6.7 24.4-.3 3.1 1 14.1 2 17.2 2.7 8.4 7.5 15.4 13.7 21.5 1.5 1.5 3.2 2.8 4.8 4.1.5 0 .5-.4.7-.8.2-.7.4-1.4.5-2.1l1.1-8.2z"/>
      <path fill="silver" d="M52.8 90.1c.1-1.2.7-2.3 1.4-3.3-.7-.3-1.1-.8-1.5-1.4-.3-.6-.6-1.2-.8-1.8-.8-2.3-.9-4.7-1.1-7v-1.4c-.3.2-.3 2.1-.3 2.3-.2 2.5-.5 4.9-1 7.4-.2 1-.3 2-.9 2.8 0 .1 0 .2.1.4 1 2.9 1.2 5.8 1.4 8.8V98c0 1.3-.1 1 1 1.5.4.2.9.2 1.4.5.3 0 .4-.3.4-.5l-.2-1.8v-5c-.2-.9 0-1.7.1-2.6"/>
    </g>
    <defs>
      <clipPath id="mongo-clip"><path fill="#fff" d="M0 0h100v100H0z"/></clipPath>
    </defs>
  </svg>
);

export const ZustandIcon = ({ className = "" }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 100 100" className={className}>
    <g clipPath="url(#zus-clip)">
      <mask id="zus-mask" width="100" height="100" x="0" y="0" maskUnits="userSpaceOnUse" style={{maskType:"luminance"}}>
        <path fill="#fff" d="M100 0H0v100h100z"/>
      </mask>
      <g mask="url(#zus-mask)">
        <path fill="#070707" d="M78.2 1.4c1.7.9 3.1 2.3 4 4.1-.2 0-.2 0-.1.3.5 1.4.8 2.8.9 4.3v1c-.2.2-.3.5-.2.7 0 .3.1.6.2.9 0 .2 0 .3-.4.2l-.5-.2c-.4-.1-.6-.3-.6-.7 0-.5 0-1.1.2-1.6v-.3c-.2-1.3-.5-2.6-.8-3.7 0-.4-.3-.6-.5-.8 0-.3-.2-.5-.4-.7 0-.2-.2-.3-.3-.4-.1-.3-.4-.5-.7-.6 0 0-.1-.2-.2-.2l-.8-1s-.1-.1-.2-.1c-1.1-.3-2.1-.4-3.2-.3-.9 0-1.8.2-2.6.6-.5.2-1.3.6-2.3 1.2-1.2.7-2.2 1.6-3.1 2.6l-1.9 1.9c-.5.3-1 .9-1.5 1.6 0 0-.1.3-.2.5l-.4 1.1c-.3.5-.4 1-.6 1.5 0 .2-.2.3-.3 0-.1-.1-.3-.2-.5-.2.2 0 .3-.2.4-.4 0-.3.1-.6.2-.8q0-.3.3-.6c.1-.2.2-.4.3-.7.1-.6.4-1.1.8-1.5h.1s.1 0 0-.2q.9-1.5 2.1-2.7c.8-.8 1.7-1.5 2.5-2.3L70 2.7c.9-.6 1.6-.9 2.1-1.1 1.4-.5 2.9-.7 4.4-.6.7 0 1.3.2 1.8.5z"/>
        <path fill="#efefef" d="M74.5 2.3c1 0 2 .2 2.9.7 0 0 .3.2.6.5.2.2.4.3.7.3 0 0 .2.1.2.2.2.3.4.5.7.6.2.1.3.3.3.4 0 .2 0 .4-.2.4-1.4-1.5-3-2.3-5-2.4-.8 0-1.6.1-2.5.4-1.7.6-3.2 1.5-4.6 2.7-.3.3-.7.5-1 .8 0 0-.1 0-.1-.1.9-1.1 1.9-1.9 3.1-2.6 1-.6 1.8-1 2.3-1.2.8-.3 1.7-.5 2.6-.6z"/>
        <path fill="#b3b3b3" d="M66.5 6.7s0 .1.1.1c-.6.7-1.2 1.3-1.9 1.9v-.1l1.9-1.9z"/>
        <path fill="#050505" d="M73.9 6c1.8.1 3.3.9 4.5 2.3v.2c0 .3-.1.5-.2.7 0 .1 0 .2.1.2.3 0 .4.1.6.4 0 .2.2.3.3.4.1 0 .2.2 0 .3v.4c.1.1.2.3.2.6v1.4c0 .4.1.8 0 1.1 0 .7-.2 1.3-.3 2H79c-.4-.3-.4-.5-.2-.7s.2-.5.3-.9c.2-.1.3-.3 0-.5v-1.2s0-.1-.1-.2-.2-.3-.1-.4c0-.2 0-.3-.2-.2 0 0-.1 0-.2.1 0 .1-.2.2-.4.3-.3-1.1-.6-2.1-1.1-3.1-.2-.4-.4-.7-.7-.9-.8-.6-1.8-.9-2.8-.9-.6 0-1.2.2-1.8.5-2.4 1.2-4.3 3-5.8 5.4l-1 1.6c-.2.2-.3.4-.2.6 0 .1.2.2.4.3.7.3 1.4.5 2.1.8 1 .4 1.9.9 2.8 1.5.7.4 1.4.8 2.2 1.2 1 .5 1.9 1.1 2.7 1.9.2.1.4.3.5.5 0 0 0 .1.1.1l1 .4c.3.1.5.3.5.5.1.3.3.5.6.7l.5.3c.4.3.7.5 1 .8.3-.5.5-.9.5-1.3 0 0 .1-.5.4-1.5.3-1.2.6-2.5.8-3.7v-1c0-.5 0-.8.1-1 .2-.3.2-.7.1-1v-.8c0-.4.3-.6.5-.6v.3c0 .1-.2.3-.3.5 0 .1 0 .2.2.1.2 0 .3-.1.4-.2.2-.2.3-.2.4 0v1c0 .6 0 1.2-.3 1.8q0 .15-.3.6c-.2.3-.2.5-.1.8.1.4.1.8 0 1.1-.3.6-.4 1.2-.5 1.8 0 .2 0 .3.2.2l-1.3 3.2c0 .2 0 .5.1.6 3.2 3.2 5.8 6.8 8 10.7.6-.3 1.2-.5 1.8-.7.7-.4 1.4-.6 2.2-.7h2.2c.8.2 1.3.4 1.5.5q.75.6 1.8 1.2c.1 0 .2.2.2.3 0 .2.2.3.5.5 0 0 .2.1.2.2q.75 1.05.9 2.4v.3c.1.1.1.2 0 .4v.2c0 1.4-.3 2.8-1 4l-.2.1c-.1 0-.2.2-.2.4v.2c-.2.3-.4.5-.6.8-.2.6-.7 1-1.2 1.3-.5.4-.9.8-1.5 1.1-.7.5-1.5.8-2.4.8h-.1v.1c0 .4 0 .7.2 1v6.4c0 .6-.1.9-.1.9-.1 1.4-.3 2.8-.5 4.2 0 .5-.1 1-.4 1.4v.2c0 .4 0 .7-.3 1-.2.1-.3.3-.2.5v.2c0 .2 0 .4-.1.7 0 .2-.1.4-.2.6s-.2.4-.2.7-.1.5-.2.7-.2.5-.2.8c0 .4-.2.7-.3.9-.1.3-.3.6-.4.9-1.6 3.8-3.7 7.3-6.3 10.6-.5.8-1.1 1.5-1.7 2.2-.5.3-.9.7-1.3 1.1-1.2 1.4-2.6 2.8-4.1 4-1 .8-1.8 1.4-2.5 2-.9.6-1.8 1.2-2.7 1.7-.4.3-.8.5-1.3.7-.3 0-.5.2-.8.4-.7.5-1.6 1-2.6 1.3-.4.1-.9.4-1.4.7s-1 .5-1.3.7c-1.4.5-2.7 1.1-4.1 1.7-.9.2-1.8.5-2.6.8-.8.2-1.6.3-2.4.5-.9.2-1.7.4-2.4.4-2.1.2-4.2.3-6.4.2h-3.2c-3.9-.3-6.1-.5-6.7-.6-.7-.2-1.4-.3-2.1-.5h-1.5c-.9-.4-1.7-.7-2.2-.9-1.5-.4-3.1-.9-4.8-1.6-.8-.3-1.6-.7-2.2-1.2-1-.6-2-1.3-3-2-1.4-.7-2.7-1.5-4-2.4-.6-.4-1.3-1-2.1-1.7s-1.5-1.4-2.3-2.1c-.5-.6-.9-1.2-1.4-1.7-.4-.4-.8-.8-1.2-1.3s-.6-.8-.6-.8c-.9-1.1-1.7-2.3-2.4-3.5-.3-.4-.7-1.1-1.3-2.2-1.1-2.1-2-4.3-2.8-6.6l-.2-.4c-.8-2.4-1.4-4.8-1.8-7.3 0-.5-.1-1.5-.2-3v-2.4c-.1-1.3 0-2.7.2-4 0-.6 0-1.3.3-1.9.7-5.2 2.4-10 5-14.5.2-.5.5-1 .7-1.4 0 0 .3-.4.7-1.2.4-.6.9-1.2 1.4-1.7v.5h.6v-.4l-.3-.5h-.2v-.5q-.3-1.2-.9-3.9c0-.7 0-1.3-.3-1.9-.1-.3-.2-.5-.2-.7 0-.3 0-.5.1-.8V24c0-.2 0-.3-.1-.5 0-1.6 0-3.1.4-4.5q.75-3.3 2.4-6 1.5-2.4 3.9-3.9l.6-.4c.5-.3 1-.5 1.6-.4h1.1c2 0 3.9.6 5.8 1.8.8.5 1.4 1 1.7 1.4 1 1 2 2 2.8 3.2l.3.5c.2.3.5.6.9.8l.3.6c1.4-.5 2.8-1 4.2-1.6h1q.15 0 .3-.3c1.6-.5 2.6-.8 2.8-.8 1.6-.3 3.1-.5 4.7-.7.8-.2 1.6-.3 2.4-.2.8-.1 1.7-.2 2.5-.3.8 0 1.5 0 2.3.2h.2c.2-.1.5-.1.7 0 .6.1 1.4.2 2.2.1 1.4.2 2.8.4 4.2.5 0 0 1.4.3 4.1 1 .3.1.6.2.8.4.7.1 1.3.4 1.7.8l.8-2.1c.7-1.7 1.7-3.1 3.1-4.2.5-.4 1.1-.9 1.6-1.3 1.4-1.1 2.9-1.6 4.7-1.4z"/>
      </g>
    </g>
    <defs>
      <clipPath id="zus-clip"><path fill="#fff" d="M0 0h100v100H0z"/></clipPath>
    </defs>
  </svg>
);

// ── Streaming Provider Pills ──────────────────────────────────────────────────
// viewBox wider (220×64) so even long names like CRUNCHYROLL fit without crop
const TextPillIcon = ({
  text,
  className = "",
}: {
  text: string;
  className?: string;
}) => (
  <svg viewBox="0 0 220 64" className={className}>
    <rect
      width="220"
      height="64"
      rx="14"
      fill="currentColor"
      fillOpacity="0.08"
      stroke="currentColor"
      strokeOpacity="0.35"
      strokeWidth="2"
    />
    <text
      x="110"
      y="41"
      textAnchor="middle"
      fill="currentColor"
      fontSize="22"
      fontWeight="800"
      fontFamily="system-ui, sans-serif"
      letterSpacing="0.5"
    >
      {text}
    </text>
  </svg>
);

export const NetflixIcon = ({ className }: { className?: string }) => (
  <TextPillIcon text="NETFLIX" className={className} />
);
export const TMDBIcon = ({ className }: { className?: string }) => (
  <TextPillIcon text="TMDB" className={className} />
);
export const HBOIcon = ({ className }: { className?: string }) => (
  <TextPillIcon text="HBO MAX" className={className} />
);
export const DisneyIcon = ({ className }: { className?: string }) => (
  <TextPillIcon text="DISNEY+" className={className} />
);
export const AppleTVIcon = ({ className }: { className?: string }) => (
  <TextPillIcon text="APPLE TV+" className={className} />
);
export const PrimeVideoIcon = ({ className }: { className?: string }) => (
  <TextPillIcon text="PRIME VIDEO" className={className} />
);
export const HuluIcon = ({ className }: { className?: string }) => (
  <TextPillIcon text="HULU" className={className} />
);
export const ParamountIcon = ({ className }: { className?: string }) => (
  <TextPillIcon text="PARAMOUNT+" className={className} />
);
export const CrunchyrollIcon = ({ className }: { className?: string }) => (
  <TextPillIcon text="CRUNCHYROLL" className={className} />
);
export const ShudderIcon = ({ className }: { className?: string }) => (
  <TextPillIcon text="SHUDDER" className={className} />
);
export const FuboTVIcon = ({ className }: { className?: string }) => (
  <TextPillIcon text="FUBOTV" className={className} />
);
export const AMCIcon = ({ className }: { className?: string }) => (
  <TextPillIcon text="AMC+" className={className} />
);
