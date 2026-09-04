# 🎱 Bingo Party

A 75- and 90-ball bingo game for **one to eight players** — around one screen, on printed
tickets, or one device each over your own Wi-Fi. German and English. Vite + React + TypeScript
with a Tauri shell; no accounts, no tracking, and no internet connection required.

![three cards, a caller panel and a called-numbers board](https://img.shields.io/badge/players-3-ff4d8d) ![](https://img.shields.io/badge/balls-75-22d3ee)

## How to play

1. Choose American **75-ball** or European **90-ball**, a win pattern, and one to six tickets
   per player. Someone presses **Call ball** (or hits the space bar).
2. Every player looks for that number on their tickets and taps it. Tapping a number that has
   **not** been called counts as a miss (the cell shakes and the ✗ counter ticks up).
3. The first ticket to complete the pattern wins. 75-ball offers a line, corners, X or blackout;
   90-ball offers one line, two lines or a full house.

Extras include a **spoken caller**, **auto-call** at four speeds, **auto-daub**, editable names,
persistent trophies, and optional B-I-N-G-O headings for pattern games.

## Paper tickets and claim verification

The print button lays every current ticket out for A4 printing or the browser's **Save as PDF**
flow. Each paper ticket includes a QR and fallback code. The host's ✓ verifier scans or accepts
that code, confirms it was issued by the current game, and checks the ticket against the current
called balls and win pattern. QR scanning runs locally on the camera frames; the printed code
is a no-camera fallback.

## Play together over Wi-Fi

The installed app can serve the game to every other device on the same network. Open
**📶 Play together → Share this game**: it shows a QR code and an address like
`http://192.168.0.35:8077/`. Anyone who scans it — Android phone or tablet, iPhone, iPad,
Windows laptop, Mac — gets the game in their browser, **takes a card of their own**, and sees
only that card plus the current ball. Any of them can call the next ball.

It is your network and nothing else: the host serves the same bundle it runs itself, the
WebSocket carries the game state, and nothing is sent anywhere else. Hosting needs the
installed app (a browser cannot open a listening socket); joining needs nothing but a browser.
On Windows the firewall asks once, on iOS the local-network prompt appears once.

## Install it as an app

It is a PWA: one build, installable on every platform, and it runs with **no network at all**
once opened — the service worker precaches the app, the icons and the fonts (which are
self-hosted, so nothing is fetched from Google).

| platform | how |
| --- | --- |
| **iPad / iPhone** | Open the URL in Safari → **Share** → **Add to Home Screen**. It launches full screen with no browser chrome. |
| **Android** | Chrome offers *Install app*, or use the **⤓ Install** button in the header. |
| **macOS / Windows / Linux** | Chrome or Edge: the install icon in the address bar (or the ⤓ Install button). Runs in its own window. |

An iPad is the natural home for it — three players around one screen, big tap targets, the
caller pinned to the top while you scroll to your card. Sound uses WebAudio, so on an iPad the
ring/silent switch mutes it like any other web audio.

The repository also includes a Tauri desktop/mobile shell. Store signing and submission are
intentionally separate because they require the owner's Apple/Google account credentials.

## Run it locally

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # static build into dist/
npm test         # game-engine invariants and anti-forgery checks
npm run preview  # serve the build
```

## Deploy to GitHub Pages

Two ways, both already wired up:

**GitHub Actions (recommended).** Push to `main`. In the repo, go to
*Settings → Pages → Build and deployment → Source* and pick **GitHub Actions**. The workflow in
`.github/workflows/deploy.yml` builds and publishes on every push.

**From your machine.**

```bash
npm run deploy   # builds and pushes dist/ to the gh-pages branch
```

then set *Settings → Pages → Source* to **Deploy from a branch → gh-pages**.

`vite.config.ts` uses `base: './'`, so the build works under any repo name
(`https://<user>.github.io/<repo>/`) with no further configuration.

## Native apps

`src-tauri/` is a Tauri 2 shell, laid out for mobile from the start (`[lib] name = "app"`,
`crate-type = ["staticlib", "cdylib", "rlib"]`, `main.rs` calling `app::run()`).

```bash
npm run app:dev     # native window, hot reload
npm run app:build   # .app / .dmg / .msi / .deb / AppImage for the current platform
```

macOS entitlements declare `network.client` (without it a sandboxed WKWebView renders nothing)
and `network.server` (without it the sandbox refuses to open the LAN port); iOS carries
`NSLocalNetworkUsageDescription`, `PrivacyInfo.xcprivacy` and a 15.0 minimum. `scripts/` holds
the post-`tauri ios init` patches.

## Licence

AGPL-3.0-only, with the section 7 additional permission that lets the official binaries ship
through the App Store and Google Play — see [LICENSE](LICENSE). Third-party components,
including the two SIL OFL fonts and 502 Rust crates, are listed in
[THIRD-PARTY-NOTICES.md](THIRD-PARTY-NOTICES.md).

## Layout

| file | what's in it |
| --- | --- |
| `src/game.ts` | pure rules and reducer: 75/90 tickets, patterns, claims and the ball bag |
| `src/i18n.tsx`, `src/locales/` | dependency-free i18n; English is the source of truth |
| `src/App.tsx` | the shared-screen game: caller, auto-call, persistence |
| `src/lan.ts`, `src/useLanHost.ts`, `src/useLanClient.ts` | LAN transport, host and joined device |
| `src-tauri/src/lan.rs` | the HTTP + WebSocket server; Rust serves and relays, the rules stay in TS |
| `src/components/` | card, ball, board, confetti, pattern picker, About, LAN views |
| `src/sound.ts` | WebAudio blips — no audio files to host |
| `src/styles.css` | the whole look; responsive from desktop to phone, hover gated behind `pointer: fine` |
| `src/pwa.ts` | service-worker registration and the install prompt |
| `scripts/generate-sw.mjs` | writes `dist/sw.js` with a precache list of the build output |
| `public/manifest.webmanifest` | app name, icons, standalone display |
