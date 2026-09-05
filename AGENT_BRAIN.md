# 🧠 NEXUS Agent Brain

This document is the memory for any future AI agent working on this project. It
explains how the app is wired together, how to add a provider, and how to keep the
build clean. Read this first before changing anything.

---

## 1. Project type

- **Framework:** React + Vite + TypeScript, Tailwind, zustand, i18next.
- **Package manager:** `pnpm` only (there is a `preinstall` guard).
- **Provider engine:** `@p-stream/providers` (aliased as `@nexus/providers`).
- **UI style:** This project has its **own** visual design. Do not copy 3.0's UI.
  Keep the existing routes, styling and layout intact.

## 2. How streaming providers work

Providers are registered in `src/backend/providers/providers.ts`. It builds a
provider registry (`buildProviders()` from `@nexus/providers`) and adds every
source from `src/providers/nexus-providers-index.ts`.

- `src/providers/nexus-providers-index.ts` re-exports `nexusCustomProviders`
  (the list of playable sources) and `nexusCustomEmbeds`.
- The actual catalog + scraping engine is in `src/providers/embeds/shared.ts`.
- Each provider fetches streams from the **TMDB-Embed HuggingFace backend**
  (`VITE_TMDB_EMBED_URL`, default `https://stycanine1-tmdb-embed-api.hf.space`).

### Add a NEW playable provider

1. Open `src/providers/embeds/shared.ts`.
2. Add an entry to `NEXUS_PROVIDER_CATALOG`:

   ```ts
   { id: "myprovider", name: "MyProvider", playable: true, rank: 900 },
   ```

   - `playable: true` → shows as a source in the player.
   - `moviesOnly: true` → only shows for movies, hidden for TV.
   - `anime: true` → treated as an anime provider.
3. Make the HF backend actually return streams for `myprovider` at
   `/api/streams/myprovider/{movie|series}/{tmdbId}`.
4. Rebuild. The source appears automatically in the player (id is prefixed
   `nexus-myprovider`).

### Add a DOWNLOAD-ONLY provider (MKV)

Set `playable: false` in the catalog. It will NOT show as a playback source; it is
surfaced in the **Downloads** menu instead (see `DOWNLOAD_ONLY_PROVIDERS`).

## 3. Environment variables

Copy `.env` from a sibling project. Key ones:

| Var | Purpose |
|-----|---------|
| `VITE_APP_DOMAIN` | The site's canonical domain (no trailing slash). |
| `VITE_TMDB_EMBED_URL` | HF backend that aggregates providers. |
| `VITE_M3U8_PROXY_URL` | HLS proxy list (comma-separated). |
| `VITE_CORS_PROXY_URL` | CORS proxy list. |
| `TMDB_READ_API_KEY` | Server-side TMDB key used by the API functions. |
| `VITE_AD_CONTENT_URL` | Homepage banner ad config (see ADDING_ADS_TUTORIAL.md). |

**Never commit `.env`** (it is gitignored). Mirror the same vars in Vercel.

## 4. The ads toggle

- Store: `src/stores/ads/index.ts` (`useAdsStore.adsDisabled`).
- UI: `src/components/ads/AdsToggle.tsx` (mounted in Settings → Preferences).
- Ads render via `src/pages/parts/home/AdsPart.tsx` and `HomeAd.tsx`.
- Gate any ad component on `adsDisabled` so the switch truly controls ads.

## 5. Notifications

The site reads `public/notifications.xml` (RSS). To post an update, add a new
`<item>` to that file with a `guid`, `title`, `description`, and `pubDate`.
**Always do this before every push** — it's the changelog users see.

## 6. Build & deploy checklist

```bash
pnpm install          # install deps
pnpm run build        # production build (esbuild, fast)
pnpm exec tsc --noEmit  # type check
```

- `vite.config.mts` has `manualChunks` that split `language-db`, `hls`, `auth`,
  `locales`, `Icons`, `caption-parsing` so the first paint stays small.
- If you add a heavy import on the boot path, move it behind `import()`.

## 7. Provider port notes (2026-09-04)

The provider system was ported from the `nexus3.0` sibling project:

- Copied `src/providers/` (embeds, shared, provider-health, allowed-providers).
- Copied `src/utils/common/originHealth.ts` and `src/utils/hosting/cdn.ts`.
- Replaced `src/components/player/utils/proxy.ts` with the 3.0 version (imports
  `@/utils/proxyUrls`).
- Added `@nexus/providers` alias in both `vite.config.mts` (resolve.alias) and
  `tsconfig.json` (paths → `../node_modules/@p-stream/providers`).
- Rewrote `src/backend/providers/providers.ts` to register `nexusCustomProviders`.
- The download/MKV pipeline, tip-jar, and top-10 rows were **not** fully ported
  yet — see the GitHub issues / sibling repo for those.

## 8. Cross-site button

`src/components/layout/Navigation.tsx` has a "Watch On" dropdown. It now contains
the ZETFLIX button and a **WATCH ON NEXUS 2.0** button (glow + NEW fire badge)
linking to `https://www.nexusph.xyz`. Change that URL if the target site changes.
