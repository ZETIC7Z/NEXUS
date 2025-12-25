import { Link } from "react-router-dom";

import { BlurEllipsis } from "@/pages/layouts/SubPageLayout";

export function MinimalPageLayout(props: { children: React.ReactNode }) {
  return (
    <div
      className="bg-background-main min-h-screen"
      style={{
        backgroundImage:
          "linear-gradient(to bottom, var(--tw-gradient-from), var(--tw-gradient-to) 800px)",
      }}
    >
      <BlurEllipsis />
      {/* Main page */}
      <div className="fixed px-7 py-5 left-0 top-0 z-20">
        <Link
          className="block tabbable rounded-full text-xs ssm:text-base"
          to="/"
        >
          <img
            src="/nexus-logo-full.png?v=6"
            alt="NEXUS"
            className="h-20 object-contain transition-transform hover:scale-105 active:scale-95"
          />
        </Link>
      </div>
      <div className="min-h-screen">{props.children}</div>
    </div>
  );
}
