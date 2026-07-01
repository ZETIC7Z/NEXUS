import classNames from "classnames";
import { useEffect, useState } from "react";

import { Icon, Icons } from "@/components/Icon";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

interface PWAInstallButtonProps {
  className?: string;
  isSidebarItem?: boolean;
}

export function PWAInstallButton({
  className,
  isSidebarItem,
}: PWAInstallButtonProps = {}) {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallButton, setShowInstallButton] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowInstallButton(true);
    };

    window.addEventListener("beforeinstallprompt", handler);

    // Check if already installed
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setShowInstallButton(false);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === "accepted") {
      setDeferredPrompt(null);
      setShowInstallButton(false);
    }
  };

  if (!showInstallButton) return null;

  if (isSidebarItem) {
    return (
      <button
        type="button"
        onClick={handleInstallClick}
        className={classNames(
          "flex items-center gap-3 w-full px-4 py-2 text-sm text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-all duration-200",
          className,
        )}
      >
        <Icon icon={Icons.DOWNLOAD} className="text-sm" />
        <span>Install NEXUS App</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleInstallClick}
      className={classNames(
        "flex items-center gap-1.5 px-2.5 py-1.5 bg-[hsl(var(--colors-active))] hover:bg-[hsl(var(--colors-active))]/80 text-white text-xs font-medium rounded-lg transition-all duration-300 hover:scale-105 shadow-lg shadow-black/20",
        className,
      )}
    >
      <Icon icon={Icons.DOWNLOAD} className="text-xs" />
      <span className="hidden sm:inline">Install App</span>
    </button>
  );
}
