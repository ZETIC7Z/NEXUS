# 🧾 How to Add Your Own Ads (Money-Tag) — Step by Step

This guide explains exactly how to plug your own ad network (Money-Tag / Adsterra /
any banner provider) into NEXUS. The site already has an **ads area** ready and an
**Ads Toggle** in Settings so users can turn ads on/off.

---

## 1. Where the ads live

There are two places ads can appear:

| File | Purpose |
|------|---------|
| `src/pages/parts/home/AdsPart.tsx` | Homepage banner ad (uses `VITE_AD_CONTENT_URL`) |
| `src/pages/parts/home/HomeAd.tsx` | Script-based ad slots (banner tag) |

The switch that controls all ads is `src/components/ads/AdsToggle.tsx` (reads
`useAdsStore` from `src/stores/ads/index.ts`). Ads are **ON by default**; users can
switch them off from **Settings → Preferences → Disable advertisements**.

---

## 2. Method A — Banner image + link (easiest)

The config key `VITE_AD_CONTENT_URL` is a comma/semicolon-separated string the
`AdsPart` component parses into an array. The format is:

```
VITE_AD_CONTENT_URL=default message,referal link,image link,card message
```

Example (set this in `.env` locally and in the Vercel dashboard):

```
VITE_AD_CONTENT_URL=Support us!,https://yourlink.com,https://yourimage.com/banner.jpg,Sponsored
```

- If the first value is `null`, no text link is shown.
- The image shows as a banner; clicking it opens the referral link.

## 3. Method B — Script / banner-tag ad (Money-Tag, Adsterra, etc.)

If your ad network gives you a JS tag (like Money-Tag), use the **HomeAd** slot.
In `src/setup/config.ts` there are these keys (set them in env):

| Env var | Meaning |
|---------|---------|
| `VITE_ENABLE_HOME_AD` | `true` to enable the 728×90 homepage banner |
| `VITE_HOME_AD_ZONE_ID` | Your zone / placement id from the ad network |
| `VITE_ENABLE_SECONDARY_AD` | `true` to enable a 300×250 ad |
| `VITE_SECONDARY_AD_ZONE_ID` | Zone id for the secondary ad |
| `VITE_ENABLE_BOOKMARKS_AD` | `true` to enable a 336×280 ad on Bookmarks |
| `VITE_BOOKMARKS_AD_ZONE_ID` | Zone id for the bookmarks ad |
| `VITE_ENABLE_PRIMARY_BANNER_GIF` | `true` to show a custom GIF banner |
| `VITE_PRIMARY_BANNER_GIF_URL` | The URL the GIF banner links to |

The ad script source is hard-coded at the top of `HomeAd.tsx`:

```ts
const BTAG_SRC = "https://aqle3.com/btag.min.js";
```

If you use a different network, **change `BTAG_SRC`** to your network's script URL.

> The primary GIF banner image is served from `/ads/primary-banner.gif`
> (see `PRIMARY_BANNER_GIF_SRC`). Place your own GIF at `public/ads/primary-banner.gif`.

## 4. Add a brand-new ad slot (optional)

To add a slot somewhere else (e.g. inside the player), copy the `AdSlotInner`
component from `HomeAd.tsx`:

```tsx
<AdSlotInner cfg={{ zoneId: "YOUR_ZONE_ID", width: 300, height: 250 }} />
```

Make sure the zone id is enabled via the matching `VITE_ENABLE_*_AD` env var.

## 5. Make the toggle actually control ads

The store `useAdsStore.adsDisabled` tells the app ads are off. Any component that
renders ads should check it:

```ts
const adsDisabled = useAdsStore((s) => s.adsDisabled);
if (adsDisabled) return null; // don't render the ad
```

The toggle already writes this flag, so just gate your ad components on it.

## 6. Verify

1. Set the env vars in `.env`, restart the dev server (`pnpm dev`).
2. Open the homepage — the banner should appear.
3. Go to **Settings → Preferences** and flip **Disable advertisements** to OFF.
4. Confirm the ad disappears; flip it back ON and confirm it returns.

## 7. Deploy

After adding your env vars, add them to Vercel too (Project → Settings →
Environment Variables) and redeploy.

---

*Ads are OFF by default for the site owner in dev; make sure the toggle is left
ON for visitors so your ad network earns revenue.*
