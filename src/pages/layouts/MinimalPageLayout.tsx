import { Link } from "react-router-dom";

import { BlurEllipsis } from "@/pages/layouts/SubPageLayout";

export function MinimalPageLayout(props: { children: React.ReactNode }) {
  return (
    <div className="bg-black min-h-screen relative overflow-x-hidden">
      {/* Fixed Background Gradient */}
      <div
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          backgroundImage:
            "linear-gradient(to bottom, var(--tw-gradient-from), var(--tw-gradient-to))",
        }}
      />
      <BlurEllipsis />
      {/* Main page */}
      <div className="relative z-10 w-full min-h-screen flex flex-col">
        {props.children}
      </div>
    </div>
  );
}
