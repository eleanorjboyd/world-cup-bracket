# World Cup 2026 — Bracket Predictor

A single-page app for filling in your own 2026 FIFA World Cup knockout-stage
bracket. Pick a winner in every match and your choice automatically advances to
the next round, all the way to the champion. Picks are saved to your browser's
`localStorage`.

## Features

- All five knockout rounds: Round of 32 → Round of 16 → Quarter-finals →
  Semi-finals → Final
- Real 2026 knockout data: teams, flags, match dates, and venues
- Click a team to pick the winner; the pick flows into the correct next-round slot
- Changing an earlier pick automatically clears downstream picks that depended on it
- Projected champion banner, progress counter, and a reset button

## Tech stack

- React 18 + TypeScript
- Vite

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

## Project structure

- `src/bracket.ts` — teams and the full match tree (which match feeds which)
- `src/picks.ts` — slot resolution, cascade/prune logic, champion detection
- `src/App.tsx` — UI
- `src/index.css` — styling
