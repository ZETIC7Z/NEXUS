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
    "flex items-center gap-3 w-full p-3 rounded-lg transition-all duration-300";
  const stateClasses = completed
    ? "bg-emerald-500/10 border border-emerald-500/30"
    : glowing
      ? "bg-[#1a1f26] border-2 border-cyan-400 shadow-[0_0_15px_rgba(0,255,241,0.4)]"
      : "bg-[#1a1f26] border border-white/10 hover:border-white/20";

  const content = (
    <>
      <span
        className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
          completed
            ? "bg-emerald-500 text-white"
            : glowing
              ? "bg-cyan-400 text-black"
              : "bg-white/10 text-white/60"
        }`}
      >
        {completed ? "✓" : step}
      </span>
      <span
        className={`text-sm ${completed ? "text-emerald-400" : "text-white"}`}
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

interface ExtensionPageProps {
  status: ExtensionStatus;
}

function DefaultExtensionPage(props: ExtensionPageProps) {
  const { t } = useTranslation();
  const [device] = useState<DeviceInfo>(detectDevice);
  const [browser] = useState<BrowserInfo>(() => detectBrowser(device));
  const isSuccess = props.status === "success";

  return (
    <div className="w-full max-w-sm mx-auto px-4">
      {/* Header with Device + Browser */}
      <div className="text-center mb-6">
        <div className="flex justify-center gap-3 mb-4">
          {/* Device Icon */}
          <div className="w-12 h-12 rounded-full bg-[#1a1f26] border border-white/10 p-2.5 flex items-center justify-center">
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
          {/* Browser Icon */}
          <div className="w-12 h-12 rounded-full bg-[#1a1f26] border border-white/10 p-2.5 flex items-center justify-center">
            <img
              src={browser.icon}
              alt={browser.name}
              className="w-full h-full object-contain"
            />
          </div>
        </div>

        <p className="text-xs text-gray-500 mb-3">
          {device.name} • {browser.name}
        </p>

        <h1 className="text-lg font-bold text-white mb-1">
          {t("onboarding.extension.title")}
        </h1>
        <p className="text-gray-400 text-xs">
          {t("onboarding.extension.explainer")}
        </p>
      </div>

      {/* Main Install Button */}
      {browser.supportsExtensions && browser.extensionUrl && (
        <a
          href={browser.extensionUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={`flex items-center justify-center gap-2 w-full py-3 px-4 rounded-lg font-medium text-sm transition-all duration-300 mb-3 ${
            isSuccess
              ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
              : "bg-emerald-500 text-white hover:bg-emerald-600 shadow-[0_0_15px_rgba(16,185,129,0.3)]"
          }`}
        >
          {isSuccess ? (
            <>
              <Icon icon={Icons.CHECKMARK} /> Installed
            </>
          ) : (
            `Install ${browser.name} Extension`
          )}
        </a>
      )}

      {/* Status */}
      {isSuccess && (
        <div className="flex items-center justify-center gap-2 text-emerald-400 text-xs py-2 mb-3">
          <Icon icon={Icons.CHECKMARK} />
          Extension working!
        </div>
      )}

      {/* Alternative Method */}
      <div className="pt-4 border-t border-white/10">
        <p className="text-gray-500 text-[10px] uppercase tracking-wider mb-3 text-center">
          Alternative
        </p>
        <div className="space-y-2">
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
