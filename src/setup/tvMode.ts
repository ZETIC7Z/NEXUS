import { isTVDevice } from "@/utils/isTVDevice";

/**
 * Initialize TV mode - adds data-tv-mode attribute to HTML element if TV is detected
 * This enables TV-specific CSS styles
 */
export function initializeTVMode() {
    if (isTVDevice()) {
        document.documentElement.setAttribute("data-tv-mode", "true");
        console.log("[TV Mode] TV device detected, enabling TV optimizations");
    }
}
