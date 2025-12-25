/**
 * Detects if the current device is a TV or TV-like device
 * Checks for Android TV, WebOS, Tizen, and other TV platforms
 */
export function isTVDevice(): boolean {
    const userAgent = navigator.userAgent.toLowerCase();

    // Check for known TV user agents
    const tvUserAgents = [
        'googletv',
        'appletv',
        'smarttv',
        'smart-tv',
        'tv',
        'hbbtv',
        'netcast',
        'nettv',
        'web0s',
        'webos',
        'tizen',
        'aftm', // Amazon Fire TV
        'aftb', // Amazon Fire TV Stick
        'afts', // Amazon Fire TV
    ];

    // Check user agent
    const hasTVUserAgent = tvUserAgents.some(tv => userAgent.includes(tv));
    if (hasTVUserAgent) return true;

    // Check for large screen with typical TV resolution
    const isLargeScreen = window.screen.width >= 1920 && window.screen.height >= 1080;
    const isVeryLargeScreen = window.screen.width >= 3840; // 4K TVs

    // Check if using a gamepad (TV remotes often register as gamepads)
    const hasGamepad = navigator.getGamepads && navigator.getGamepads().length > 0;

    // Android TV specific check
    const isAndroidTV = userAgent.includes('android') && !userAgent.includes('mobile');

    // Detect if display-mode is tv (some browsers support this)
    const isTVDisplayMode = window.matchMedia('(display-mode: tv)').matches;

    return (
        isAndroidTV ||
        isTVDisplayMode ||
        (isVeryLargeScreen && !window.matchMedia('(pointer: fine)').matches) ||
        (isLargeScreen && hasGamepad)
    );
}

/**
 * Detects if device is Android TV specifically
 */
export function isAndroidTV(): boolean {
    const userAgent = navigator.userAgent.toLowerCase();
    return userAgent.includes('android') && !userAgent.includes('mobile');
}

/**
 * Get TV platform type
 */
export function getTVPlatform(): string | null {
    const userAgent = navigator.userAgent.toLowerCase();

    if (userAgent.includes('web0s') || userAgent.includes('webos')) return 'LG WebOS';
    if (userAgent.includes('tizen')) return 'Samsung Tizen';
    if (userAgent.includes('googletv')) return 'Google TV';
    if (isAndroidTV()) return 'Android TV';
    if (userAgent.includes('aftm') || userAgent.includes('afts') || userAgent.includes('aftb')) {
        return 'Amazon Fire TV';
    }
    if (userAgent.includes('appletv')) return 'Apple TV';

    return isTVDevice() ? 'Unknown TV' : null;
}
