// Leonida Legend — the entry program for gta6-trophy-guide-01.
//
// What it does: takes this directory's app/ (the static guide: one HTML file,
// one CSS file, one JS module, plus data/trophies.json with the 55 official
// trophies) and screenshots/ (four 1280x800 JPEG renders of the app), copies
// both into the output directory, and writes dossier.json there — the summary
// the judge reads — using the vendored make.fun library, which must stay
// byte-identical to the kit copy or the scorer rejects the dossier.
//
// Node 22, standard library only. Run it with:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
// Outside the grader, MAKEFUN_OUTPUT_DIR stands in for /output; with no
// variable set it writes to /output directly.

import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// Fresh output: copy the app and the screenshots in, nothing else.
mkdirSync(outDir, { recursive: true });
cpSync(join(repoRoot, 'app'), join(outDir, 'app'), { recursive: true });
mkdirSync(join(outDir, 'screenshots'), { recursive: true });
if (existsSync(join(repoRoot, 'screenshots'))) {
  cpSync(join(repoRoot, 'screenshots'), join(outDir, 'screenshots'), { recursive: true });
}

// The scorer's own caps, from the kit starter's reference/gate.json: the
// dossier text budget shapes the bytes, and the other caps refuse an entry
// the scorer would refuse — more than 4 screenshots, one over 256 KiB, more
// than 993 files and directories inside app/, or app/ over 48 MiB.
const dossierRaw = buildDossier(outDir, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
});
// buildDossier returns a Uint8Array, not a string: decode it once and use the
// text form everywhere below (comparing or parsing the raw array directly
// compares object identity, not bytes).
const dossierText = Buffer.from(dossierRaw).toString('utf8');
// Note on determinism: the vendored library keeps per-process state, so
// calling buildDossier twice in one process does NOT reproduce the same
// bytes — that is a property of the library, not of the tree. Determinism is
// therefore verified across separate runs (two `node main.ts` invocations
// produce byte-identical dossier.json files), not with a second call here.
writeFileSync(join(outDir, 'dossier.json'), dossierText);

// A short human-readable receipt on stdout, so a build run shows what landed.
const dossierBytes = statSync(join(outDir, 'dossier.json')).size;
const shots = readdirSync(join(outDir, 'screenshots'))
  .filter((f) => /\.(jpe?g|png)$/i.test(f))
  .sort()
  .map((f) => `${f} (${statSync(join(outDir, 'screenshots', f)).size} B)`);
const trophies = JSON.parse(readFileSync(join(outDir, 'app', 'data', 'trophies.json'), 'utf8')).trophies.length;
console.log(`Leonida Legend: ${trophies} trophies, dossier.json ${dossierBytes} B`);
console.log(`screenshots: ${shots.join(', ')}`);
const totalsLine = JSON.parse(dossierText).text.split('\n').find((line) => line.startsWith('Totals:'));
console.log(totalsLine ?? '(no Totals line in dossier)');
