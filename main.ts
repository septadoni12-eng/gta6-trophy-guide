// Leonida Legend — the hand-in program for gta6-trophy-guide-01 (Node 22, stdlib only).
//
// The guide itself is the static app/ folder beside this file: index.html opens in
// desktop Chrome, works with the network off, and loads nothing from outside app/.
// Its trophy list and guides are app/data/trophies.json (all 55 official names).
// The screenshots in screenshots/ are real renders of that app.
//
// This program copies app/ and screenshots/ into the output directory and writes
// output/dossier.json with the vendored make.fun library — the summary the judge
// reads (screenshots, first-load files and bytes, and the app's source). The
// vendored library must stay untouched: the scorer requires dossier.json to be
// byte for byte what its own copy of buildDossier writes.
//
// Run locally the same way the grader runs it, with MAKEFUN_OUTPUT_DIR standing
// in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
// Serve the app locally with `node serve.ts`, then open http://localhost:8080.

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(outDir, { recursive: true });
cpSync(join(here, 'app'), join(outDir, 'app'), { recursive: true });
mkdirSync(join(outDir, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) {
  cpSync(join(here, 'screenshots'), join(outDir, 'screenshots'), { recursive: true });
}

// Build the dossier twice BEFORE writing anything: the scorer runs this program
// twice and requires both runs to write the same bytes, and a build reads the
// output directory — so a second build after the first write would see the
// dossier itself and differ. Compare the two builds, then write once.
const dossierOptions = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
};
const dossierBytes = buildDossier(outDir, dossierOptions);
const dossierAgain = buildDossier(outDir, dossierOptions);
// buildDossier returns a Buffer: compare bytes, not object identity.
if (!Buffer.from(dossierAgain).equals(Buffer.from(dossierBytes))) {
  throw new Error('dossier.json is not deterministic across builds');
}
writeFileSync(join(outDir, 'dossier.json'), dossierBytes);
console.log(`Leonida Legend handed in to ${outDir}`);
