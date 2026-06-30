# World Cup 2026 — Bracket Predictor

A single-page app for filling in your own 2026 FIFA World Cup knockout-stage
bracket. Pick a winner in every match and your choice automatically advances to
the next round, all the way to the champion. Picks are saved to your browser's
`localStorage`.

## 🌐 Live site

**👉 [eleanorjboyd.github.io/world-cup-bracket](https://eleanorjboyd.github.io/world-cup-bracket/)**

Open it on your phone or scan the QR code on the landing page — it shows your
own blank bracket so anyone can fill out their picks independently. Tap
**📣 Invite** in the top bar at any time to show that QR code to a friend.

## Features

- **Landing screen** with a big QR code that anyone can scan to get their own
  blank bracket on their phone
- All five knockout rounds: Round of 32 → Round of 16 → Quarter-finals →
  Semi-finals → Final
- Real 2026 knockout data: teams, flags, match dates, and venues
- Click a team to pick the winner; the pick flows into the correct next-round slot
- Changing an earlier pick automatically clears downstream picks that depended on it
- Projected champion banner, progress counter, and a reset button
- **Live ESPN integration**: a scheduled job pulls finished knockout results and
  locks them into everyone's bracket; in-progress matches show a live banner
  with the current score
- **📅 Schedule** modal grouped by weekday with Pacific-time kickoffs
- **Share** your bracket as a PNG image or a link that encodes your picks (plus
  a QR code that opens the same bracket on a phone)
- Mobile-friendly focus stepper view that walks through one round at a time

## Tech stack

- React 18 + TypeScript
- Vite
- GitHub Pages for hosting, GitHub Actions for deploys and scheduled
  result updates

## Getting started

```bash
npm install
npm run dev
```

Then open the printed local URL (default http://localhost:5173/).

## Build

```bash
npm run build
npm run preview
```

## Deployment

The site is deployed to GitHub Pages from `main` via
`.github/workflows/deploy.yml`. A second workflow,
`.github/workflows/update-results.yml`, runs on a schedule, fetches finished
knockout results from ESPN, and commits an updated `public/results.json` that
the app loads at runtime.

## Project structure

- `src/bracket.ts` — teams and the full match tree (which match feeds which)
- `src/picks.ts` — slot resolution, cascade/prune logic, champion detection
- `src/live.ts` — ESPN fetch helpers for live scores and the schedule modal
- `src/share.ts` — share-link encoding/decoding and the public site URL
- `src/App.tsx` — UI (landing screen, bracket, share modal, invite modal,
  schedule modal, live banner)
- `src/index.css` — styling
- `scripts/fetch-results.mjs` — fetches finished results from ESPN into
  `public/results.json` (run by the scheduled workflow; `npm run update-results`)
- `docs/submissions-plan.md` — draft plan for letting friends submit picks back
