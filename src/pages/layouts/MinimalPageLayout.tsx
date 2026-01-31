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
      <div className="min-h-screen">{props.children}</div>
    </div>
  );
}
