/**
 * Browser detection utilities for userscript manager installation
 */

export interface BrowserInfo {
  name: string;
  logo: string;
  userscriptManager: {
    name: string;
    url: string;
    logo: string;
  };
  chromeDirectUrl?: string; // Direct Chrome Web Store extension URL
  emoji?: string;
  violentmonkeyUrl?: string;
}

export function detectBrowser(): BrowserInfo {
  const userAgent = navigator.userAgent;

  // Firefox
  if (userAgent.includes("Firefox")) {
    return {
      name: "Firefox",
      logo: "🦊",
      userscriptManager: {
        name: "Violentmonkey",
        url: "https://addons.mozilla.org/en-US/firefox/addon/violentmonkey/",
        logo: "https://addons.mozilla.org/user-media/addon_icons/2657/2657704-64.png?modified=2023-03-14T10:00:00.000Z",
      },
    };
  }

  // Edge
  if (userAgent.includes("Edg")) {
    return {
      name: "Microsoft Edge",
      logo: "🌐",
      userscriptManager: {
        name: "Tampermonkey",
        url: "https://microsoftedge.microsoft.com/addons/detail/tampermonkey/iikmkjmpaadaobahmlepeloendndfphd",
        logo: "https://www.tampermonkey.net/favicon.ico",
      },
    };
  }

  // Opera
  if (userAgent.includes("OPR") || userAgent.includes("Opera")) {
    return {
      name: "Opera",
      logo: "🎭",
      userscriptManager: {
        name: "Tampermonkey",
        url: "https://addons.opera.com/en/extensions/details/tampermonkey-beta/",
        logo: "https://www.tampermonkey.net/favicon.ico",
      },
    };
  }

  // Safari
  if (userAgent.includes("Safari") && !userAgent.includes("Chrome")) {
    return {
      name: "Safari",
      logo: "🧭",
      userscriptManager: {
        name: "Userscripts",
        url: "https://apps.apple.com/app/userscripts/id1463298887",
        logo: "https://is1-ssl.mzstatic.com/image/thumb/Purple126/v4/ed/96/a6/ed96a6e4-8e5c-3a5d-c2c4-6e5c9e5e5e5e/AppIcon-0-0-1x_U007emarketing-0-0-0-7-0-0-sRGB-0-0-0-GLES2_U002c0-512MB-85-220-0-0.png/230x0w.webp",
      },
    };
  }

  // Chrome (default fallback)
  return {
    name: "Chrome",
    logo: "🌐",
    emoji: "🌐",
    chromeDirectUrl:
      "https://chromewebstore.google.com/detail/p-stream-extension/gnheenieicoichghfmjlpofcaebbgclh",
    violentmonkeyUrl:
      "https://chromewebstore.google.com/detail/violentmonkey/jinjaccalgkegednnccohejagnlnfdag",
    userscriptManager: {
      name: "Tampermonkey",
      url: "https://www.tampermonkey.net/",
      logo: "https://www.tampermonkey.net/favicon.ico",
    },
  };
}

export function getUserscriptInstallUrl(): string {
  // This should point to your userscript raw URL
  return "https://raw.githubusercontent.com/p-stream/Userscript/main/p-stream.user.js";
}
