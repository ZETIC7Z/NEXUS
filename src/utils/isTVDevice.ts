/**
 * Detects if the current device is a TV or TV-like device.
 * Only matches real TV platforms — NOT regular desktops, tablets, or phones.
 */
export function isTVDevice(): boolean {
  const userAgent = navigator.userAgent.toLowerCase();

  // Check for known TV-specific user agent strings
  // These are unique to TV platforms and won't match desktops/tablets
  const tvUserAgents = [
    "googletv",
    "appletv",
    "smarttv",
    "smart-tv",
    "hbbtv", // Hybrid Broadcast Broadband TV standard
    "netcast", // LG NetCast
    "nettv", // Philips Net TV
    "web0s", // LG webOS (old format)
    "webos", // LG webOS
    "tizen", // Samsung Tizen TVs
    "aftm", // Amazon Fire TV (AFTM models)
    "aftb", // Amazon Fire TV Stick (AFTB models)
    "afts", // Amazon Fire TV (AFTS models)
    "aftt", // Amazon Fire TV Stick (AFTT models)
    "crkey", // Chromecast
  ];

  // Check user agent for TV-specific strings
  const hasTVUserAgent = tvUserAgents.some((tv) => userAgent.includes(tv));
  if (hasTVUserAgent) return true;

  // Check specifically for "android tv" as a phrase (not just "android" alone)
  if (userAgent.includes("android tv")) return true;

  // Detect if display-mode is tv (some browsers support this)
  try {
    if (window.matchMedia("(display-mode: tv)").matches) return true;
  } catch {
    // matchMedia not available
  }

  return false;
}

/**
 * Detects if device is Android TV specifically
 */
export function isAndroidTV(): boolean {
  const userAgent = navigator.userAgent.toLowerCase();
  // Only match "android tv" specifically, not regular Android tablets
  return userAgent.includes("android tv");
}

/**
 * Get TV platform type
 */
export function getTVPlatform(): string | null {
  const userAgent = navigator.userAgent.toLowerCase();

  if (userAgent.includes("web0s") || userAgent.includes("webos"))
    return "LG WebOS";
  if (userAgent.includes("tizen")) return "Samsung Tizen";
  if (userAgent.includes("googletv")) return "Google TV";
  if (userAgent.includes("android tv")) return "Android TV";
  if (
    userAgent.includes("aftm") ||
    userAgent.includes("afts") ||
    userAgent.includes("aftb") ||
    userAgent.includes("aftt")
  ) {
    return "Amazon Fire TV";
  }
  if (userAgent.includes("appletv")) return "Apple TV";
  if (userAgent.includes("crkey")) return "Chromecast";

  return isTVDevice() ? "Unknown TV" : null;
}
