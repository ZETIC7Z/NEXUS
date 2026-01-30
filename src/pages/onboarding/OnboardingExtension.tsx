import { useEffect, useMemo, useState } from "react";
import { Trans, useTranslation } from "react-i18next";
import { useAsyncFn, useInterval } from "react-use";

import { Icon, Icons } from "@/components/Icon";
import { Stepper } from "@/components/layout/Stepper";
import { MinimalPageLayout } from "@/pages/layouts/MinimalPageLayout";
import {
  useNavigateOnboarding,
  useRedirectBack,
} from "@/pages/onboarding/onboardingHooks";
import { PageTitle } from "@/pages/parts/util/PageTitle";
import {
  ExtensionDetectionResult,
  detectExtensionInstall,
} from "@/utils/detectFeatures";
import { getExtensionState } from "@/utils/extension";
import type { ExtensionStatus } from "@/utils/extension";

// Extension URLs
const CHROME_EXTENSION_URL =
  "https://chromewebstore.google.com/detail/p-stream-extension/gnheenieicoichghfmjlpofcaebbgclh";
const FIREFOX_EXTENSION_URL =
  "https://addons.mozilla.org/en-US/firefox/addon/lordflix-extension-v1/";
const SAFARI_USERSCRIPT_APP_URL =
  "https://apps.apple.com/us/app/userscripts/id1463298887";
const USERSCRIPT_URL =
  "https://raw.githubusercontent.com/p-stream/Userscript/main/p-stream.user.js";

// Browser Icons (SVG URLs)
const BROWSER_ICONS: Record<string, string> = {
  chrome:
    "https://upload.wikimedia.org/wikipedia/commons/e/e1/Google_Chrome_icon_%28February_2022%29.svg",
  firefox:
    "https://upload.wikimedia.org/wikipedia/commons/a/a0/Firefox_logo%2C_2019.svg",
  edge: "https://upload.wikimedia.org/wikipedia/commons/9/98/Microsoft_Edge_logo_%282019%29.svg",
  safari:
    "https://upload.wikimedia.org/wikipedia/commons/5/52/Safari_browser_logo.svg",
  brave: "https://upload.wikimedia.org/wikipedia/commons/c/c4/Brave_lion.png",
  opera:
    "https://upload.wikimedia.org/wikipedia/commons/4/49/Opera_2015_icon.svg",
};

// Device Icons (SVG URLs)
const DEVICE_ICONS: Record<string, string> = {
  android:
    "https://upload.wikimedia.org/wikipedia/commons/d/d7/Android_robot.svg",
  ios: "https://upload.wikimedia.org/wikipedia/commons/f/fa/Apple_logo_black.svg",
  windows:
    "https://upload.wikimedia.org/wikipedia/commons/5/5f/Windows_logo_-_2012.svg",
  macos:
    "https://upload.wikimedia.org/wikipedia/commons/f/fa/Apple_logo_black.svg",
  linux: "https://upload.wikimedia.org/wikipedia/commons/3/35/Tux.svg",
  tv: "https://upload.wikimedia.org/wikipedia/commons/0/09/YouTube_full-color_icon_%282017%29.svg",
};

type DeviceType = "android" | "ios" | "windows" | "macos" | "linux" | "tv";

interface DeviceInfo {
  type: DeviceType;
  name: string;
  icon: string;
  isMobile: boolean;
  isTablet: boolean;
  isTV: boolean;
}

function detectDevice(): DeviceInfo {
  const ua = navigator.userAgent;

  // TV detection
  if (/TV|SmartTV|GoogleTV|AFTM|AFT|Roku|webOS|Tizen/i.test(ua)) {
    return {
      type: "tv",
      name: "Smart TV",
      icon: DEVICE_ICONS.tv,
      isMobile: false,
      isTablet: false,
      isTV: true,
    };
  }

  // iOS detection
  if (/iPhone|iPad|iPod/i.test(ua)) {
    const isTablet = /iPad/i.test(ua);
    return {
      type: "ios",
      name: isTablet ? "iPad" : "iPhone",
      icon: DEVICE_ICONS.ios,
      isMobile: !isTablet,
      isTablet,
      isTV: false,
    };
  }

  // Android detection
  if (/Android/i.test(ua)) {
    const isTablet = !/Mobile/i.test(ua);
    return {
      type: "android",
      name: isTablet ? "Android Tablet" : "Android",
      icon: DEVICE_ICONS.android,
      isMobile: !isTablet,
      isTablet,
      isTV: false,
    };
  }

  // macOS
  if (/Mac OS X|Macintosh/i.test(ua)) {
    return {
      type: "macos",
      name: "macOS",
      icon: DEVICE_ICONS.macos,
      isMobile: false,
      isTablet: false,
      isTV: false,
    };
  }

  // Windows
  if (/Windows/i.test(ua)) {
    return {
      type: "windows",
      name: "Windows",
      icon: DEVICE_ICONS.windows,
      isMobile: false,
      isTablet: false,
      isTV: false,
    };
  }

  // Linux
  if (/Linux/i.test(ua)) {
    return {
      type: "linux",
      name: "Linux",
      icon: DEVICE_ICONS.linux,
      isMobile: false,
      isTablet: false,
      isTV: false,
    };
  }

  return {
    type: "windows",
    name: "Desktop",
    icon: DEVICE_ICONS.windows,
    isMobile: false,
    isTablet: false,
    isTV: false,
  };
}

interface BrowserInfo {
  name: string;
  icon: string;
  extensionUrl: string | null;
  supportsExtensions: boolean;
  violentmonkeyUrl: string;
}

function detectBrowser(device: DeviceInfo): BrowserInfo {
  const ua = navigator.userAgent;

  if (ua.includes("Firefox")) {
    return {
      name: "Firefox",
      icon: BROWSER_ICONS.firefox,
      extensionUrl: FIREFOX_EXTENSION_URL,
      supportsExtensions: true,
      violentmonkeyUrl:
        "https://addons.mozilla.org/en-US/firefox/addon/violentmonkey/",
    };
  }

  if (ua.includes("Safari") && !ua.includes("Chrome")) {
    return {
      name: "Safari",
      icon: BROWSER_ICONS.safari,
      extensionUrl: null,
      supportsExtensions: false,
      violentmonkeyUrl: SAFARI_USERSCRIPT_APP_URL,
    };
  }

  if (ua.includes("Edg")) {
    return {
      name: "Edge",
      icon: BROWSER_ICONS.edge,
      extensionUrl: CHROME_EXTENSION_URL,
      supportsExtensions: !device.isMobile && !device.isTablet,
      violentmonkeyUrl:
        "https://microsoftedge.microsoft.com/addons/detail/violentmonkey/eeagobfjdenkkddmbclomhiblgggliao",
    };
  }

  if ((navigator as any).brave) {
    return {
      name: "Brave",
      icon: BROWSER_ICONS.brave,
      extensionUrl: CHROME_EXTENSION_URL,
      supportsExtensions: !device.isMobile && !device.isTablet,
      violentmonkeyUrl:
        "https://chromewebstore.google.com/detail/violentmonkey/jinjaccalgkegednnccohejagnlnfdag",
    };
  }

  if (ua.includes("OPR") || ua.includes("Opera")) {
    return {
      name: "Opera",
      icon: BROWSER_ICONS.opera,
      extensionUrl: CHROME_EXTENSION_URL,
      supportsExtensions: !device.isMobile && !device.isTablet,
      violentmonkeyUrl:
        "https://chromewebstore.google.com/detail/violentmonkey/jinjaccalgkegednnccohejagnlnfdag",
    };
  }

  // Default Chrome
  return {
    name: "Chrome",
    icon: BROWSER_ICONS.chrome,
    extensionUrl: CHROME_EXTENSION_URL,
    supportsExtensions: !device.isMobile && !device.isTablet,
    violentmonkeyUrl:
      "https://chromewebstore.google.com/detail/violentmonkey/jinjaccalgkegednnccohejagnlnfdag",
  };
}

// Step Button with glowing effect
function StepButton({
  step,
  label,
  href,
  onClick,
  glowing = false,
  completed = false,
}: {
  step: number;
  label: string;
  href?: string;
  onClick?: () => void;
  glowing?: boolean;
  completed?: boolean;
}) {
  const baseClasses =
    "flex items-center gap-3 w-full p-3 rounded-xl transition-all duration-300 backdrop-blur-sm";
  const stateClasses = completed
    ? "bg-emerald-500/15 border border-emerald-500/40 shadow-[0_0_20px_rgba(16,185,129,0.2)]"
    : glowing
      ? "bg-gradient-to-r from-cyan-500/20 to-purple-500/20 border-2 border-cyan-400 shadow-[0_0_25px_rgba(0,255,241,0.5)]"
      : "bg-white/5 border border-white/10 hover:border-white/30 hover:bg-white/10";

  const content = (
    <>
      <span
        className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
          completed
            ? "bg-gradient-to-br from-emerald-400 to-emerald-600 text-white shadow-lg"
            : glowing
              ? "bg-gradient-to-br from-cyan-400 to-cyan-500 text-black shadow-lg shadow-cyan-500/30"
              : "bg-white/10 text-white/60"
        }`}
      >
        {completed ? "✓" : step}
      </span>
      <span
        className={`text-sm font-medium ${completed ? "text-emerald-400" : "text-white"}`}
      >
        {label}
      </span>
    </>
  );

  if (href) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={`${baseClasses} ${stateClasses}`}
      >
        {content}
      </a>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={`${baseClasses} ${stateClasses}`}
    >
      {content}
    </button>
  );
}

// Animated Loading Dots
function LoadingDots() {
  return (
    <div className="flex items-center gap-1.5">
      {[0, 1, 2, 3].map((i) => (
        <span
          key={i}
          className="w-2.5 h-2.5 rounded-full bg-white/40 animate-pulse"
          style={{
            animationDelay: `${i * 150}ms`,
            animationDuration: "1s",
          }}
        />
      ))}
    </div>
  );
}

// Waiting Overlay - Shows while waiting for extension
function WaitingOverlay({
  isWaiting,
  browserName,
}: {
  isWaiting: boolean;
  browserName: string;
}) {
  if (!isWaiting) return null;

  return (
    <div className="space-y-4 mt-6">
      {/* Waiting Card */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-gray-900/80 to-gray-800/80 border border-white/5 p-6 backdrop-blur-xl">
        {/* Animated gradient border */}
        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 via-cyan-500/20 to-purple-500/20 opacity-50 animate-pulse" />

        <div className="relative z-10 flex flex-col items-center justify-center py-4">
          <LoadingDots />
          <p className="text-gray-400 text-sm mt-4 text-center">
            Waiting for you to install the extension
          </p>
        </div>
      </div>

      {/* Reload Prompt */}
      <div className="rounded-2xl bg-gradient-to-br from-gray-900/60 to-gray-800/60 border border-white/5 p-4 backdrop-blur-xl">
        <div className="flex items-center justify-between gap-4">
          <p className="text-gray-400 text-xs leading-relaxed">
            Installed on {browserName}, but the site isn&apos;t detecting it?
            Try reloading the page!
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="flex-shrink-0 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 border border-white/10 text-white text-sm font-medium transition-all hover:scale-105"
          >
            Reload page
          </button>
        </div>
      </div>
    </div>
  );
}

interface ExtensionPageProps {
  status: ExtensionStatus;
}

function DefaultExtensionPage(props: ExtensionPageProps) {
  const { t } = useTranslation();
  const [device] = useState<DeviceInfo>(detectDevice);
  const [browser] = useState<BrowserInfo>(() => detectBrowser(device));
  const isSuccess = props.status === "success";
  const isWaiting = props.status !== "success";

  return (
    <div className="w-full max-w-sm mx-auto px-4">
      {/* Header with Device + Browser - Improved Design */}
      <div className="text-center mb-6">
        <div className="flex justify-center gap-4 mb-4">
          {/* Device Icon - Glassmorphism */}
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/30 to-cyan-500/30 rounded-2xl blur-xl opacity-50 group-hover:opacity-80 transition-opacity" />
            <div className="relative w-14 h-14 rounded-2xl bg-gradient-to-br from-white/10 to-white/5 border border-white/20 p-3 flex items-center justify-center backdrop-blur-sm">
              <img
                src={device.icon}
                alt={device.name}
                className="w-full h-full object-contain"
                style={{
                  filter:
                    device.type === "ios" || device.type === "macos"
                      ? "invert(1)"
                      : "none",
                }}
              />
            </div>
          </div>
          {/* Browser Icon - Glassmorphism */}
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/30 to-emerald-500/30 rounded-2xl blur-xl opacity-50 group-hover:opacity-80 transition-opacity" />
            <div className="relative w-14 h-14 rounded-2xl bg-gradient-to-br from-white/10 to-white/5 border border-white/20 p-3 flex items-center justify-center backdrop-blur-sm">
              <img
                src={browser.icon}
                alt={browser.name}
                className="w-full h-full object-contain"
              />
            </div>
          </div>
        </div>

        <p className="text-xs text-gray-400 mb-3 font-medium">
          {device.name} • {browser.name}
        </p>

        <h1 className="text-xl font-bold text-white mb-2">
          {t("onboarding.extension.title")}
        </h1>
        <p className="text-gray-400 text-sm leading-relaxed">
          {t("onboarding.extension.explainer")}
        </p>
      </div>

      {/* Main Install Button - Premium Design */}
      {browser.supportsExtensions && browser.extensionUrl && (
        <a
          href={browser.extensionUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={`relative overflow-hidden flex items-center justify-center gap-2 w-full py-3.5 px-4 rounded-xl font-semibold text-sm transition-all duration-300 mb-4 ${
            isSuccess
              ? "bg-gradient-to-r from-emerald-500/20 to-emerald-600/20 text-emerald-400 border border-emerald-500/40"
              : "bg-gradient-to-r from-emerald-500 to-emerald-600 text-white hover:from-emerald-400 hover:to-emerald-500 shadow-lg shadow-emerald-500/30"
          }`}
        >
          {!isSuccess && (
            <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -translate-x-full animate-[shimmer_2s_infinite]" />
          )}
          <span className="relative z-10 flex items-center gap-2">
            {isSuccess ? (
              <>
                <Icon icon={Icons.CHECKMARK} /> Extension Installed
              </>
            ) : (
              `Install ${browser.name} Extension`
            )}
          </span>
        </a>
      )}

      {/* Success Status */}
      {isSuccess && (
        <div className="flex items-center justify-center gap-2 text-emerald-400 text-sm py-3 mb-4 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
          <Icon icon={Icons.CHECKMARK} />
          <span className="font-medium">Extension working!</span>
        </div>
      )}

      {/* Waiting Overlay - Shows when waiting for extension */}
      <WaitingOverlay isWaiting={isWaiting} browserName={browser.name} />

      {/* Alternative Method */}
      <div className="pt-5 border-t border-white/10 mt-4">
        <p className="text-gray-500 text-[10px] uppercase tracking-widest mb-4 text-center font-semibold">
          Alternative
        </p>
        <div className="space-y-2.5">
          <StepButton
            step={1}
            label="Install Violentmonkey"
            href={browser.violentmonkeyUrl}
            glowing={
              !isSuccess &&
              (!browser.supportsExtensions || !browser.extensionUrl)
            }
          />
          <StepButton
            step={2}
            label="Install NEXUS Script"
            href={USERSCRIPT_URL}
          />
          <StepButton
            step={3}
            label="Refresh Page"
            onClick={() => window.location.reload()}
          />
        </div>
      </div>
    </div>
  );
}

function IosExtensionPage(props: ExtensionPageProps) {
  const { t } = useTranslation();
  const [device] = useState<DeviceInfo>(detectDevice);
  const isSuccess = props.status === "success";

  return (
    <div className="w-full max-w-sm mx-auto px-4">
      <div className="text-center mb-6">
        <div className="flex justify-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-full bg-[#1a1f26] border border-white/10 p-2.5 flex items-center justify-center">
            <img
              src={DEVICE_ICONS.ios}
              alt="iOS"
              className="w-full h-full object-contain"
              style={{ filter: "invert(1)" }}
            />
          </div>
          <div className="w-12 h-12 rounded-full bg-[#1a1f26] border border-white/10 p-2.5 flex items-center justify-center">
            <img
              src={BROWSER_ICONS.safari}
              alt="Safari"
              className="w-full h-full object-contain"
            />
          </div>
        </div>

        <p className="text-xs text-gray-500 mb-3">{device.name} • Safari</p>

        <h1 className="text-lg font-bold text-white mb-1">
          {t("onboarding.extension.title")}
        </h1>
        <p className="text-gray-400 text-xs">
          <Trans
            i18nKey="onboarding.extension.explainerIos"
            components={{ bold: <span className="text-white font-medium" /> }}
          />
        </p>
      </div>

      <div className="space-y-2">
        <StepButton
          step={1}
          label="Install Userscripts App"
          href={SAFARI_USERSCRIPT_APP_URL}
          glowing={!isSuccess}
        />
        <StepButton
          step={2}
          label="Install NEXUS Script"
          href={USERSCRIPT_URL}
        />
        <StepButton
          step={3}
          label="Refresh Page"
          onClick={() => window.location.reload()}
        />
      </div>

      {isSuccess && (
        <div className="flex items-center justify-center gap-2 text-emerald-400 text-xs py-3 mt-3">
          <Icon icon={Icons.CHECKMARK} />
          Extension working!
        </div>
      )}
    </div>
  );
}

export function OnboardingExtensionPage() {
  const { t: _t } = useTranslation();
  const navigate = useNavigateOnboarding();
  const { completeAndRedirect } = useRedirectBack();
  const extensionSupport = useMemo(() => detectExtensionInstall(), []);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const [{ value }, exec] = useAsyncFn(
    async (triggeredManually: boolean = false) => {
      const status = await getExtensionState();
      if (status === "success" && triggeredManually) completeAndRedirect();
      return status;
    },
    [completeAndRedirect],
  );
  useInterval(exec, 1000);

  const componentMap: Record<
    ExtensionDetectionResult,
    typeof DefaultExtensionPage
  > = {
    chrome: DefaultExtensionPage,
    firefox: DefaultExtensionPage,
    ios: IosExtensionPage,
    unknown: DefaultExtensionPage,
  };
  const PageContent = componentMap[extensionSupport];

  return (
    <MinimalPageLayout>
      <PageTitle subpage k="global.pages.onboarding" />

      <div className="w-full min-h-screen bg-[#0c1016] flex flex-col items-center justify-center py-6">
        <div className="w-full max-w-sm">
          <Stepper steps={2} current={2} className="mb-6 px-4" />

          <PageContent status={value ?? "unknown"} />

          {/* Footer */}
          <div className="flex justify-between items-center px-4 mt-6 pt-4 border-t border-white/5">
            <button
              type="button"
              onClick={() => navigate("/onboarding")}
              className="text-gray-500 hover:text-white text-xs transition-colors"
            >
              ← Back
            </button>

            <button
              type="button"
              onClick={() => value === "success" && exec(true)}
              disabled={value !== "success"}
              className={`py-2 px-5 rounded-lg text-xs font-medium transition-all ${
                value === "success"
                  ? "bg-emerald-500 text-white hover:bg-emerald-600 shadow-[0_0_15px_rgba(16,185,129,0.4)]"
                  : "bg-white/5 text-gray-600 cursor-not-allowed"
              }`}
            >
              Continue →
            </button>
          </div>
        </div>
      </div>
    </MinimalPageLayout>
  );
}
