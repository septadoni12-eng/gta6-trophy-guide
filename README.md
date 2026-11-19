# Leonida Legend — GTA VI Trophy Guide & Tracker

All 55 official GTA VI trophies (PlayStation 5 list of 2026-11-18) with cited
own-words guides, a 6-stage platinum roadmap, a missable watch list, a spoiler
shield, a Next-Up planner, a saved checklist with notes, export/import and a
print view. No network needed: open `app/index.html` in a browser and it works
offline. First load is one HTML file, one CSS file and one JS module; the
trophy data loads after.

## The list

- **55 trophies:** 1 platinum · 2 gold · 6 silver · 46 bronze (1,815 PSN points)
- **Guides:** every trophy has a structured guide — What / How / Watch — plus a
  named Sources line (official PS5 list via Exophase and PSNProfiles; GTA V /
  RDR2 series conventions where named). No guide text is copied from any other
  guide; where no source supports a specific step, the guide says so and gives
  method instead of invented specifics.
- **Roadmap:** 6 stages in story order — Opening & Chapter 1 (3) → Chapters 2–4
  (8) → Strangers of Leonida (6) → The Grind (15) → Crime, partners & money
  (20) → Finale (3).
- **Missables:** 4 likely missable (Catch Me If You Can, Capital Offense,
  Actions Speak Louder, The Truth Is Out There) and 11 on the watch list,
  each flagged with its reason.
- **Spoiler shield:** hides story trophies until earned (or individually
  revealed). **Next Up:** your next five trophies, missables first.
- **Tracker:** localStorage checklist + per-trophy notes, PSN point and grade
  counters, kind / grade / status filters, search, JSON export/import, print
  view. Deep links: `?view=roadmap`, `?grade=silver`, `?spoiler=on`,
  `?open=15`, `?earned=2,3,8`.

## Run it

```sh
node serve.ts            # http://localhost:8080
node main.ts             # writes /output (or $MAKEFUN_OUTPUT_DIR) with dossier.json
node shots.mjs           # re-renders the 4 screenshots at 1280x800
```

`main.ts` (Node 22, standard library only) copies `app/` and `screenshots/`
into the output directory and writes `dossier.json` with the vendored
`vendor/makefun-frontend.ts` library, unchanged.

## Sources

Names, descriptions and grades are the official PlayStation 5 trophy list, as
mirrored by Exophase and PSNProfiles. Trophy point values: bronze 15, silver
30, gold 90, platinum 300. Everything else in this repo is original work.

## License

MIT — see `LICENSE`.
