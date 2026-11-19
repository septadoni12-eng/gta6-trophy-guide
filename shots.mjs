// Re-render the entry's screenshots from the finished app, so every shot is a
// real render of the code in this repo: serve app/ on a scratch port, open
// each view from shots.json in headless Chromium at 1280x800, and convert the
// capture to a JPEG under 256 KiB. Run with `node shots.mjs` from the repo root.
//
// Needs the Chromium binary from the Playwright cache and ffmpeg on PATH.
// Screenshots land in screenshots/ beside this file (the first by name is
// the entry's cover). Nothing here is part of the judged app/ payload.

import { execFile, spawn } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, renameSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const CHROME = join(process.env.HOME, '.cache/ms-playwright/chromium-1255/chrome-linux64/chrome');
const PORT = 8931;
const MAX_BYTES = 262144;

const run = (cmd, args, opts = {}) =>
  new Promise((resolve, reject) =>
    execFile(cmd, args, opts, (err, stdout, stderr) => (err ? reject(new Error(`${cmd} ${args.join(' ')}: ${stderr || err.message}`)) : resolve(stdout))));

async function waitForServer(url, tries = 40) {
  for (let i = 0; i < tries; i++) {
    try {
      const res = await fetch(url);
      if (res.ok) return;
    } catch { /* not up yet */ }
    await new Promise((r) => setTimeout(r, 250));
  }
  throw new Error(`server never came up at ${url}`);
}

async function shoot(shot) {
  const png = join(tmpdir(), `leonida-${shot.file}.png`);
  const url = `http://127.0.0.1:${PORT}${shot.path}`;
  await run(CHROME, [
    '--headless=new', '--no-sandbox', '--disable-gpu', '--hide-scrollbars',
    `--window-size=${shot.viewport.width},${shot.viewport.height}`,
    '--virtual-time-budget=10000', `--screenshot=${png}`, url,
  ]);
  if (!existsSync(png)) throw new Error(`no capture for ${shot.file}`);
  const dest = join(repoRoot, 'screenshots', shot.file);
  // Convert to JPEG; drop quality until the 256 KiB cap holds.
  for (const quality of [85, 78, 70, 60]) {
    await run('ffmpeg', ['-y', '-v', 'error', '-i', png, '-q:v', String(quality), dest]);
    if (statSync(dest).size <= MAX_BYTES) {
      console.log(`${shot.file}: ${statSync(dest).size} B at quality ${quality} (${url})`);
      return;
    }
  }
  throw new Error(`${shot.file} still over 256 KiB after quality 60`);
}

const shots = JSON.parse(readFileSync(join(repoRoot, 'shots.json'), 'utf8'));
mkdirSync(join(repoRoot, 'screenshots'), { recursive: true });
const server = spawn(process.execPath, [join(repoRoot, 'serve.ts'), '--port', String(PORT)], { stdio: 'ignore' });
try {
  await waitForServer(`http://127.0.0.1:${PORT}/`);
  for (const shot of shots) await shoot(shot);
  console.log(`done: ${shots.length} screenshots in screenshots/`);
} finally {
  server.kill();
}
