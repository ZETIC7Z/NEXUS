# NEXUS OLD — CHANGELOG (Sep 5, 2026 overhaul)

Complete record of every change made to this project (the "old NEXUS") in the
Sep 2026 overhaul session. Everything below is verified working live on
localhost:5180 and in production at https://www.zeticuz.online
(commits 1f5b29c + 35ba450 on main, deployed via Vercel).

---

## 1. Fixed the broken 3.0 provider-system port (app was dead on load)

The half-finished port of the Nexus 3.0 provider system copied components in
without their dependencies — 9 modules were missing entirely, so Vite refused
to load anything (red error overlay). Restored additively from Nexus 3.0:

- src/utils/browser/keyboardShortcuts.ts, src/utils/browser/extension.ts
- src/utils/format/ (color, formatSeconds, timestamp, uses12HourClock)
- src/components/player/casting/ (airplay.ts, chromecastSession.ts, useCasting.ts)
- src/sdk/ (index.ts, mock.ts), src/setup/popupGuard.ts
- src/stores/watchParty/sync.ts + src/hooks/useWatchPartySync.ts
- Re-registered the casting slice in the player store; restored
  isCasting / isScreenLocked on the interface slice
- Restored disabledSources / disabledEmbeds to the preferences store
  (Settings - Sources was broken without them)
- Plus port-support files: skipSegments slice, translation utils, locale
  utils, browser utils, DropFile, AudioTrackSelector, whisper subtitle-sync
  stack, GamepadEvents, etc.

## 2. Provider rebrand + re-prioritization

src/providers/embeds/shared.ts — display names only; the id slugs are the
upstream protocol ids the HF backend serves (/api/streams/<id>/...) and were
kept unchanged. New order = new priority (highest rank tried first):

| Old name   | New name   | Rank |
|------------|-----------|------|
| ShowBox    | Crimson 4K | 1020 |
| CastleTV   | Scepter    | 1015 |
| ZXCStreams | ZyPhed     | 1010 |
| OneTouchTV | Scythe     | 1005 |
| NetMirror  | Oblivion   | 1000 |
| Videasy    | Kinetic    | 995  |
| VaPlayer   | Apex       | 990  |

(AniKoto/AniKai unchanged for anime; VidLink/VixSrc stay disabled — 403 upstream.)

## 3. "Last used source" ON by default for everyone

- Restored the persist migrate block the port had dropped and bumped it to
  version 4, which force-enables enableLastSuccessfulSource (and
  enableAutoResumeOnError) once for every existing user.
- Fixed src/hooks/auth/useAuthData.ts: the account-settings server sync used
  to re-apply the server-stored false after login, silently overriding the
  local default/migration. The server can now only turn these two toggles ON,
  never force them off — the user's own toggle always wins.

## 4. Advertisements moved to its own Settings category

Per the requested layout, the ads toggle left "Preferences" and now lives in a
dedicated "Advertisements" category directly below "Connections" in the
Settings sidebar:

- New src/pages/parts/settings/AdsPart.tsx
- Sidebar entry (coins icon) in SidebarPart.tsx
- Routing + valid-category lists in src/pages/Settings.tsx
- settings.ads.title locale key added

## 5. Cast to device enabled for every source

The player settings menu previously gated casting to the artemis source only
with an "Only available on Artemis" dead-end. Removed that gate —
requestCast now engages Chromecast/AirPlay for whatever source is playing
(useCasting was already fully generic). The cast menu strings
(player.menus.castItem, etc.) were missing from en.json and were added.

## 6. Player menu matches Nexus 3.0

The player settings menu is now the 3.0 layout: Quality, Source, Subtitles,
Audio, Download, Watch Party, Enable Subtitles, Playback settings, Skip
Segments — including the Download option (per-quality/per-format list backed
by /api/downloads with download-preload warming) and the 3.0 subtitle UI
(language grid, translate view, subtitle-delay popout, auto-select choice).

## 7. Notification system replaced with the Nexus 3.0 original

- Swapped the whole src/components/overlays/notificationsModal/ directory for
  the 3.0 RSS-driven modal (ListView / DetailView / SettingsView / hook /
  utils), which the old project's Navigation badge already speaks
  (openNotifications, getUnreadCount).
- public/notifications.xml rewritten: all old notifications deleted, one
  new notification added — "NEXUS — Provider Rebrand + Player & Settings
  Overhaul" (guid nexus-old-2026-09-05-rebrand-overhaul) summarizing this
  changelog. Verified live in the running app and in production XML.

## 8. TMDB module completed (notification scheduler support)

src/backend/metadata/tmdb.ts had calls to 8 functions that were never
written. Implemented in house style + re-exported TMDBContentTypes:

getTrendingMovies, getTrendingTV, getTrendingPeople, getUpcomingMovies,
getUpcomingTV, getUpcomingLongTerm, getDiscoverPH,
getPersonCombinedCredits handling. Verified live:
/api/tmdb/trending/tv/day and /api/tmdb/discover/tv return 200.

## 9. Icons

Added TRANSLATE, THUMBS_UP, THUMBS_DOWN to the Icon enum and the SVG
iconList map (used by the subtitle translate view and skip-segment thumbs
feedback).

## 10. Watch party / player status fixes

- useWatchPartySync: added isOffline tracking (true when room polling
  fails) + widened RoomUser ids to string.
- src/backend/player/status.ts: ContentInfo TMDB ids widened to
  string | number to match the reporter.
- PlayerPart: ThumbsFeedback wiring updated to 3.0's contract.
- CaptionsPart: added missing lineHeight to the caption-reset object.

## 11. Locale fixes

- Added player.menus.subtitles.autoSelectChoice (raw key was showing in the
  subtitle menu).
- Added ads title + cast menu keys (see #4/#5).

## 12. Production (Vercel) routing fix

vercel.json: added rewrite /api/tmdb/:path* -> /api/tmdb?path=:path*
BEFORE the generic /api/(.*) catch-all. The ported TMDB client calls
same-origin path-style URLs (as the Vite dev server rewrites them), but Vercel
only served the query-style form — production TMDB metadata was 404-ing. This
was found during the post-deploy live test and fixed in commit 35ba450.

## 13. Notification modal position/size matched to 3.0 exactly

After the initial 3.0 notification swap, the modal box still sat lower than
3.0's: the old project's `FancyModal` wrapper (in
`src/components/overlays/Modal.tsx`) differed from 3.0's. Replaced it with
3.0's exact implementation (commit `17c2ae5`):

- Panel now sits inside a `p-4` centered wrapper with its own
  `max-h-[85vh] overflow-y-auto` container (was: bare `Flare.Base` with
  `mx-4`, `-m-[0.705em]`, inner `max-h-[90dvh]` scroll and a stray
  `mb-2p-[0.4em]` class).
- Result: box truly centered and sitting higher, scrolls internally instead
  of clipping, and mobile behavior is byte-identical to 3.0 (`w-full` inside
  the `p-4` wrapper + 85vh scroll).
- Verified live: DOM measures `isCentered: true`, `max-h: 580px = 85vh`,
  `overflow-y: auto`, top margin respected; production bundle contains the
  85vh wrapper and the old 90dvh wrapper is gone.

---

## Verification (live tests, not just typecheck)

- TypeScript: 0 errors; production build passes (exit 0).
- Local (localhost:5180): Discover renders fully; played Deadpool end-to-end
  (1280x720, buffering, subtitles auto-selected, 197 external captions);
  player menu shows Source: Scepter and the full 3.0 layout; Source list shows
  all 7 renamed providers in the requested order; Settings shows the
  Advertisements category below Connections; Last-used-source toggles ON.
- Production (www.zeticuz.online, post-deploy):
  - Homepage + all routes 200; new bundle deployed.
  - /api/tmdb/trending/movie/day -> 200 (after the vercel.json fix).
  - /api/streams?type=movie&id=299534 -> 200, 27 streams aggregated from
    all providers; HF direct per-provider checks: Scepter 5, Kinetic 5,
    Oblivion 2 streams.
  - /api/stream-proxy served a real HLS playlist (200, 287 KB) with
    per-stream headers; SSRF guard rejects insecure targets (403).
  - /api/downloads -> 200.
  - notifications.xml serves exactly 1 item (the new changelog notification).
  - Notification modal wrapper verified byte-identical to 3.0 (see #13).
  - Env double-check: production bundle bakes the same values as local .env
    (VITE_BACKEND_URL=https://backend.zstream.mov, same CORS proxies, same
    VITE_TMDB_EMBED_API_URL=https://stycanine1-tmdb-embed-api.hf.space, same
    Febbox key). .env is gitignored and never committed.
    NOTE: serverless-side secrets (TMDB_READ_API_KEY, BLOB_READ_WRITE_TOKEN,
    HF_API_URL) must exist as Vercel Environment Variables —
    TMDB_READ_API_KEY is confirmed working (the tmdb fn returns 200); the
    others were inherited from the previous deployment.

## Known pre-existing noise (unchanged, graceful fallbacks)

- Wyzie subtitles API 401 / Febbox DNS failures -> other subtitle sources
  still return 197 captions.
- Trakt API null responses -> TMDB fallbacks kick in.
- backend.zstream.mov progress sync can intermittently fail offline.
