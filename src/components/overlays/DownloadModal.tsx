import classNames from "classnames";
import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";

import { Icon, Icons } from "@/components/Icon";

export interface DownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const downloadLinks = {
  windows:
    "https://github.com/ZETIC7Z/NEXUS/releases/download/v1.2.1/NEXUS.Setup.1.2.1.exe",
  mac: "https://github.com/ZETIC7Z/NEXUS/releases/download/v1.2.1/NEXUS-1.2.1-arm64.dmg",
  linux:
    "https://github.com/ZETIC7Z/NEXUS/releases/download/v1.2.1/NEXUS-1.2.1.AppImage",
  android:
    "https://github.com/ZETIC7Z/NEXUS/releases/download/v1.2.1/NEXUS.apk",
};

export function DownloadModal({ isOpen, onClose }: DownloadModalProps) {
  const [mounted, setMounted] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  const handleClose = useCallback(() => {
    setIsClosing(true);
    setTimeout(() => {
      setMounted(false);
      onClose();
    }, 400); // Wait for transition out
  }, [onClose]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        handleClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, handleClose]);

  // Mount logic for transitions
  useEffect(() => {
    if (isOpen) {
      setMounted(true);
      setIsClosing(false);
    }
  }, [isOpen]);

  const handleDownload = (os: keyof typeof downloadLinks) => {
    // Open link
    window.open(downloadLinks[os], "_blank");
    // Auto-close modal
    handleClose();
  };

  if (!mounted && !isOpen) return null;

  return createPortal(
    <div
      className={classNames(
        "fixed inset-0 z-[1000] flex items-center justify-center p-4 transition-all duration-400 ease-[cubic-bezier(0.16,1,0.3,1)]",
        isOpen && !isClosing ? "opacity-100" : "opacity-0 pointer-events-none",
      )}
    >
      {/* Blurred Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-md"
        onClick={handleClose}
      />

      {/* Modal Container */}
      <div
        className={classNames(
          "relative w-full max-w-3xl bg-[#0a0a0d] border border-white/10 rounded-2xl overflow-hidden transition-all duration-400 ease-[cubic-bezier(0.16,1,0.3,1)] shadow-[0_0_100px_-20px_rgba(0,0,0,0.8),inset_0_1px_0_rgba(255,255,255,0.05)]",
          isOpen && !isClosing
            ? "scale-100 translate-y-0"
            : "scale-95 translate-y-8",
        )}
      >
        {/* Decorative Top Gradient Effect */}
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-[hsl(var(--colors-active)_/_0.5)] to-transparent" />
        <div className="absolute -top-32 inset-x-0 h-32 bg-[hsl(var(--colors-active))] blur-[100px] opacity-20 pointer-events-none" />

        {/* Close Button */}
        <button
          type="button"
          onClick={handleClose}
          className="absolute top-4 right-4 p-2 text-white/50 hover:text-white hover:bg-white/10 rounded-full transition-all duration-200 z-10 active:scale-90"
          title="Close Download Modal"
          aria-label="Close Download Modal"
        >
          <Icon icon={Icons.X} className="text-xl" />
        </button>

        <div className="p-10 pt-12 md:p-16 flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mb-6 border border-white/10 shadow-lg shadow-black/50 overflow-hidden relative group">
            <div className="absolute inset-0 bg-gradient-to-br from-[hsl(var(--colors-active)_/_0.2)] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <Icon
              icon={Icons.DOWNLOAD}
              className="text-3xl text-white relative z-10"
            />
          </div>

          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 tracking-tight">
            Take NEXUS Everywhere
          </h2>
          <p className="text-white/60 text-lg max-w-lg mx-auto mb-12">
            Download the native desktop app for a faster, distraction-free
            premium streaming experience.
          </p>

          {/* OS Buttons Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 w-full max-w-4xl mx-auto">
            {/* Windows Button */}
            <a
              href={downloadLinks.windows}
              download="NEXUS.Setup.1.2.1.exe"
              className="group relative flex flex-col items-center justify-center p-6 md:p-8 bg-white/5 hover:bg-white/10 border border-white/5 hover:border-blue-500/50 rounded-2xl transition-all duration-300 hover:shadow-[0_0_30px_-5px_rgba(59,130,246,0.3)] hover:-translate-y-1 block max-w-full md:max-w-[200px] w-full"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="relative z-10 flex flex-col items-center gap-4 text-center">
                <div className="p-4 bg-white/5 rounded-xl text-blue-400 group-hover:text-blue-300 group-hover:scale-110 transition-all duration-300">
                  <Icon icon={Icons.WINDOWS} className="text-3xl md:text-4xl" />
                </div>
                <div>
                  <div className="text-white font-medium text-base md:text-lg">
                    Windows
                  </div>
                  <div className="text-white/40 text-xs md:text-sm mt-1">
                    .exe / x64
                  </div>
                </div>
              </div>
            </a>

            {/* macOS Button */}
            <a
              href={downloadLinks.mac}
              download="NEXUS-1.2.1-arm64.dmg"
              className="group relative flex flex-col items-center justify-center p-6 md:p-8 bg-white/5 hover:bg-white/10 border border-white/5 hover:border-purple-500/50 rounded-2xl transition-all duration-300 hover:shadow-[0_0_30px_-5px_rgba(168,85,247,0.3)] hover:-translate-y-1 block max-w-full md:max-w-[200px] w-full"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="relative z-10 flex flex-col items-center gap-4 text-center">
                <div className="p-4 bg-white/5 rounded-xl text-purple-400 group-hover:text-purple-300 group-hover:scale-110 transition-all duration-300">
                  <Icon icon={Icons.APPLE} className="text-3xl md:text-4xl" />
                </div>
                <div>
                  <div className="text-white font-medium text-base md:text-lg">
                    macOS
                  </div>
                  <div className="text-white/40 text-xs md:text-sm mt-1">
                    .dmg / M1 & Intel
                  </div>
                </div>
              </div>
            </a>

            {/* Linux Button */}
            <a
              href={downloadLinks.linux}
              download="NEXUS-1.2.1.AppImage"
              className="group relative flex flex-col items-center justify-center p-6 md:p-8 bg-white/5 hover:bg-white/10 border border-white/5 hover:border-orange-500/50 rounded-2xl transition-all duration-300 hover:shadow-[0_0_30px_-5px_rgba(249,115,22,0.3)] hover:-translate-y-1 block max-w-full md:max-w-[200px] w-full"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="relative z-10 flex flex-col items-center gap-4 text-center">
                <div className="p-4 bg-white/5 rounded-xl text-orange-400 group-hover:text-orange-300 group-hover:scale-110 transition-all duration-300">
                  <Icon icon={Icons.LINUX} className="text-3xl md:text-4xl" />
                </div>
                <div>
                  <div className="text-white font-medium text-base md:text-lg">
                    Linux
                  </div>
                  <div className="text-white/40 text-xs md:text-sm mt-1">
                    .AppImage / x64
                  </div>
                </div>
              </div>
            </a>

            {/* Android Button */}
            <a
              href={downloadLinks.android}
              target="_blank"
              rel="noreferrer"
              className="group relative flex flex-col items-center justify-center p-6 md:p-8 bg-white/5 hover:bg-white/10 border border-white/5 hover:border-green-500/50 rounded-2xl transition-all duration-300 hover:shadow-[0_0_30px_-5px_rgba(34,197,94,0.3)] hover:-translate-y-1 block max-w-full md:max-w-[200px] w-full"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="relative z-10 flex flex-col items-center gap-4 text-center">
                <div className="p-4 bg-white/5 rounded-xl text-green-400 group-hover:text-green-300 group-hover:scale-110 transition-all duration-300">
                  <Icon
                    icon={Icons.ANDROID}
                    className="text-3xl md:text-4xl"
                  />
                </div>
                <div>
                  <div className="text-white font-medium text-base md:text-lg">
                    Android
                  </div>
                  <div className="text-white/40 text-xs md:text-sm mt-1">
                    .apk / ARM64
                  </div>
                </div>
              </div>
            </a>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
