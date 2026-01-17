import classNames from "classnames";
import { ReactNode } from "react";

interface GlowButtonProps {
  children: ReactNode;
  onClick?: () => void;
  href?: string;
  className?: string;
  glowing?: boolean;
  theme?: "primary" | "secondary";
}

export function GlowButton({
  children,
  onClick,
  href,
  className,
  glowing,
  theme = "primary",
}: GlowButtonProps) {
  const Component = href ? "a" : "button";

  return (
    <Component
      href={href}
      onClick={onClick}
      target={href ? "_blank" : undefined}
      rel={href ? "noopener noreferrer" : undefined}
      className={classNames(
        "relative inline-flex items-center justify-center px-8 py-4 font-bold uppercase tracking-widest overflow-hidden transition-all duration-500 rounded-lg",
        theme === "primary"
          ? "bg-white/5 backdrop-blur-md border border-white/10 text-white hover:bg-white hover:text-black hover:shadow-[0_0_5px_#fff,0_0_25px_#fff,0_0_50px_#fff,0_0_200px_#fff]"
          : "bg-black/20 backdrop-blur-md border border-white/5 text-gray-300 hover:text-white hover:bg-white/10",
        glowing ? "glow-btn shadow-[0_0_15px_rgba(255,255,255,0.3)]" : "",
        className,
      )}
    >
      {glowing && (
        <>
          <span className="absolute block top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent to-white animate-[animate1_1s_linear_infinite]" />
          <span className="absolute block top-[-100%] right-0 w-[2px] h-full bg-gradient-to-b from-transparent to-white animate-[animate2_1s_linear_infinite_0.25s]" />
          <span className="absolute block bottom-0 right-0 w-full h-[2px] bg-gradient-to-l from-transparent to-white animate-[animate3_1s_linear_infinite_0.5s]" />
          <span className="absolute block bottom-[-100%] left-0 w-[2px] h-full bg-gradient-to-t from-transparent to-white animate-[animate4_1s_linear_infinite_0.75s]" />
        </>
      )}
      {children}
    </Component>
  );
}
