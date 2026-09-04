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
| `src/styles.css` | the whole look; responsive down to a phone |
