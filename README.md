# 🎱 Bingo Party

A 75-ball bingo game for **one to eight players** — around one screen, or one device each over
your own Wi-Fi. German and English. Vite + React + TypeScript with a Tauri shell; no backend,
no accounts, no tracking, and no internet connection required at any point.

![three cards, a caller panel and a called-numbers board](https://img.shields.io/badge/players-3-ff4d8d) ![](https://img.shields.io/badge/balls-75-22d3ee)

## How to play

1. Someone presses **Call ball** (or hits the space bar). A ball drops — say, `G — 60`.
2. Every player looks for that number on their own card and taps it. Tapping a number that has
   **not** been called counts as a miss (the cell shakes and the ✗ counter ticks up).
3. First card with five in a row — across, down or diagonally, the ★ centre is free — wins the
   round. Confetti, a trophy, and a **Next round** button.

Extras: four **win patterns** (any line, four corners, big X, blackout), a **spoken caller**
using the device's own voices, **auto-call** at four speeds, **auto-daub** for very young
players, editable names, and trophies that persist on the device.

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

There is no App Store build. That would need Xcode, an Apple developer account and a wrapper
like Capacitor; the home-screen install gets you the same full-screen, offline app without any
of that.

## Run it locally

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # static build into dist/
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
including the two SIL OFL fonts and 431 Rust crates, are listed in
[THIRD-PARTY-NOTICES.md](THIRD-PARTY-NOTICES.md).

## Layout

| file | what's in it |
| --- | --- |
| `src/game.ts` | pure rules and the reducer: cards, patterns, win detection, the ball bag |
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
