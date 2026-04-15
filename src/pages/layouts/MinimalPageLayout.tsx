import { Link } from "react-router-dom";

import { BlurEllipsis } from "@/pages/layouts/SubPageLayout";

export function MinimalPageLayout(props: { children: React.ReactNode }) {
  return (
    <div
      className="bg-background-main min-h-screen relative overflow-x-hidden"
      style={{
        backgroundImage:
          "linear-gradient(to bottom, var(--tw-gradient-from), var(--tw-gradient-to))",
        backgroundAttachment: "fixed",
      }}
    >
      <BlurEllipsis />
      {/* Main page */}
      <div className="relative z-10 w-full min-h-screen flex flex-col">
        {props.children}
      </div>
    </div>
  );
}
