# 🎱 Bingo Party

A 75-ball bingo game for **three players on one screen**. Vite + React + TypeScript, no backend,
no assets — it builds to a handful of static files and runs anywhere.

![three cards, a caller panel and a called-numbers board](https://img.shields.io/badge/players-3-ff4d8d) ![](https://img.shields.io/badge/balls-75-22d3ee)

## How to play

1. Someone presses **Call ball** (or hits the space bar). A ball drops — say, `G — 60`.
2. Every player looks for that number on their own card and taps it. Tapping a number that has
   **not** been called counts as a miss (the cell shakes and the ✗ counter ticks up).
3. First card with five in a row — across, down or diagonally, the ★ centre is free — wins the
   round. Confetti, a trophy, and a **Next round** button.

Extras: **Auto-call** plays the caller for you at four speeds, **Auto-daub** marks cards
automatically for very young players, names are editable, and names + trophies persist in
`localStorage`.

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

## Layout

| file | what's in it |
| --- | --- |
| `src/game.ts` | pure rules: card generation, the 12 winning lines, win detection, the ball bag |
| `src/App.tsx` | game state (a reducer), the caller, auto-call, persistence |
| `src/components/` | card, ball, called-numbers board, confetti |
| `src/sound.ts` | WebAudio blips — no audio files to host |
| `src/styles.css` | the whole look; responsive from desktop to phone, hover gated behind `pointer: fine` |
| `src/pwa.ts` | service-worker registration and the install prompt |
| `scripts/generate-sw.mjs` | writes `dist/sw.js` with a precache list of the build output |
| `public/manifest.webmanifest` | app name, icons, standalone display |
