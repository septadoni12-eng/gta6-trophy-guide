# Leonida Legend — GTA VI Trophy Guide & Tracker

[![make.fun](https://make.fun/badge/gta6-trophy-guide-01.svg)](https://make.fun/bounty/gta6-trophy-guide-01)
[![rank](https://make.fun/badge/gta6-trophy-guide-01/septadoni12-eng/gta6-trophy-guide/rank.svg)](https://make.fun/bounty/gta6-trophy-guide-01)
[![reward](https://make.fun/badge/gta6-trophy-guide-01/septadoni12-eng/gta6-trophy-guide/reward.svg)](https://make.fun/bounty/gta6-trophy-guide-01)

An offline guide and tracker for every one of Grand Theft Auto VI's 55
PlayStation 5 trophies, built for the
[make.fun gta6-trophy-guide-01 bounty](https://make.fun/bounty/gta6-trophy-guide-01).

## What is inside

- **All 55 official trophies** — names, descriptions and grades exactly as
  PlayStation publishes them, each with a guide written in this project's own
  words that cites its sources beside it.
- **A saved checklist** — tick trophies off as you earn them; progress, notes
  and the spoiler setting persist in the browser (localStorage), with
  export/import as JSON and a print view.
- **Filters that find things fast** — by kind (story, strangers,
  collectibles, activities, crime, partner, money, moments, completion),
  by grade, by missable, by earned state, plus full-text search.
- **A 6-stage platinum roadmap** — in story order, with a live per-stage
  count, so you always know which stage you are in.
- **A missable watch list** — built from the wording of the official
  descriptions: 4 likely missable, 11 to watch before the endgame.
- **A spoiler shield** — hides the names, descriptions and guides of
  un-earned story trophies until you earn them.
- **A Next-Up planner** — the next trophy to chase, roadmap order first,
  missables before grinds.
- **A tiny first load** — one HTML file, one stylesheet, one script; the
  trophy data loads after first paint. No network requests at run time.

## Run it

```sh
node serve.ts
# open http://localhost:8080
```

No build step, no dependencies. `node main.ts` (with `MAKEFUN_OUTPUT_DIR`
set outside the grader) copies `app/` and `screenshots/` and writes the
`dossier.json` the judge reads.

## Sources

- The official PlayStation 5 trophy list, as mirrored by Exophase and
  PSNProfiles (names, descriptions, grades).
- Series conventions from GTA V and Red Dead Redemption 2 trophy design,
  named as such wherever a guide leans on them.
- This project's own roadmap ordering, derived from the official
  descriptions — no guide text is copied from any other guide.

No Rockstar Games logo, artwork, box art or game screenshot is used
anywhere in this guide. Leonida Legend is an unofficial fan-made tracker;
Grand Theft Auto and GTA are trademarks of Take-Two Interactive.

## License

MIT — see [LICENSE](LICENSE).
