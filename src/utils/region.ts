const REGION_CACHE_KEY = "__MW::user_region";

export async function getUserRegion(): Promise<string> {
  const cached = localStorage.getItem(REGION_CACHE_KEY);
  if (cached && cached !== "undefined" && cached !== "null") {
    return cached;
  }

  try {
    // Attempt to fetch IP-based country code using a free public API
    const response = await fetch("https://api.country.is/");
    const data = await response.json();

    if (data && data.country) {
      localStorage.setItem(REGION_CACHE_KEY, data.country);
      return data.country;
    }
  } catch (error) {
    console.warn("Failed to fetch user region, falling back to US:", error);
  }

  // Fallback to US
  const fallback = "US";
  localStorage.setItem(REGION_CACHE_KEY, fallback);
  return fallback;
}
