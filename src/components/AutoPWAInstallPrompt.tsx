import { useEffect, useState } from "react";
import classNames from "classnames";

import { Icon, Icons } from "@/components/Icon";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function AutoPWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    // Only show on mobile
    const isMobile = window.innerWidth <= 768;
    if (!isMobile) return;

    // Check if dismissed before
    const hasDismissed = localStorage.getItem("pwa-prompt-dismissed");
    if (hasDismissed) return;

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowPrompt(true);
    };

    window.addEventListener("beforeinstallprompt", handler);

    // Check if already installed
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setShowPrompt(false);
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
      setShowPrompt(false);
    }
  };

  const handleDismiss = () => {
    localStorage.setItem("pwa-prompt-dismissed", "true");
    setShowPrompt(false);
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 animate-slideUp">
      <div className="bg-[#1a1a1a] border border-white/10 rounded-xl p-4 shadow-2xl flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <img
            src="/pwa-logo.svg"
            alt="NEXUS"
            className="w-10 h-10 rounded-xl"
          />
          <div className="flex flex-col">
            <span className="text-white font-bold text-sm">Install NEXUS</span>
            <span className="text-gray-400 text-xs">
              Add to your Home Screen
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleDismiss}
            title="Close install prompt"
            aria-label="Close install prompt"
            className="p-2 text-gray-400 hover:text-white rounded-full transition-colors"
          >
            <Icon icon={Icons.X} />
          </button>
          <button
            type="button"
            onClick={handleInstallClick}
            className="px-4 py-2 bg-[hsl(var(--colors-active))] hover:bg-[hsl(var(--colors-active))]/90 text-white text-xs font-semibold rounded-lg shadow-lg shadow-[hsl(var(--colors-active))]/20 transition-all hover:scale-105"
          >
            Install
          </button>
        </div>
      </div>
    </div>
  );
}
