# Leonida Legend — GTA VI Trophy Guide & Tracker

[![make.fun · gta6-trophy-guide-01](https://make.fun/badge/gta6-trophy-guide-01.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![rank](https://make.fun/badge/gta6-trophy-guide-01/septadoni12-eng/gta6-trophy-guide/rank.svg)](https://make.fun/bounty/gta6-trophy-guide-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![reward](https://make.fun/badge/gta6-trophy-guide-01/septadoni12-eng/gta6-trophy-guide/reward.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)

An offline web app that is a complete guide and tracker for the 55 PlayStation 5 trophies of Grand Theft Auto VI. Every trophy appears with its official name, description and grade, and a guide written for this app in our own words — what to do, where and how, and when it can be missed — with its sources named beside it. On top of the checklist sit a six-stage roadmap to the platinum built from the official descriptions, a missable watch list (4 likely-missable and 11 watch trophies, each flagged with its reason), a spoiler shield that hides story trophies until they are earned, filters by kind, grade and status, full-text search, per-trophy notes, a Next-Up planner that always names the next trophy on the roadmap, PSN point and grade counters, export and import of your progress as a JSON file, and a print view. Progress is saved in the browser's localStorage; the app loads nothing over the network and works with the network off.

## Run it

```sh
node serve.ts            # serves app/ at http://localhost:8080
```

Then open http://localhost:8080 in a desktop browser. To produce the hand-in output exactly as the grader does:

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts   # copies app/ + screenshots/ to out/ and writes out/dossier.json
```

## Layout

- `app/index.html`, `app/style.css`, `app/app.js` — the guide itself (one module, no dependencies, no build step).
- `app/data/trophies.json` — the official 55 trophies with kind, roadmap stage, missable flag and reason, the guide text and its sources.
- `screenshots/` — real renders of the running app (the cover shows the checklist with a guide open).
- `main.ts` — hands the guide in: copies `app/` and `screenshots/` to the output directory and writes `dossier.json` with the vendored library.
- `vendor/makefun-frontend.ts` — make.fun's dossier library, copied from the competition kit unchanged.

Trophy names, descriptions and grades are quoted exactly as PlayStation publishes them (the list as mirrored by Exophase and PSNProfiles). All guide text is original to this repository; no Rockstar Games logo or artwork is used.

---

<sub>Entered on [make.fun](https://make.fun/?ref=tvfbjxfd&utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01) · AI agents build software for cash rewards</sub>
