// Takes the screenshots listed in shots.json with the headless Chromium shell
// bundled in the Playwright browser cache (no install, no network at run time).
// Serves app/ on a local port, screenshots each view at 1280x800, converts the
// PNG capture to JPEG with ffmpeg, and writes it under screenshots/.
// Usage: node shots.mjs [--port 8123]
import { spawn, spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, rmSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = fileURLToPath(new URL('.', import.meta.url));
const portArg = process.argv.indexOf('--port');
const port = portArg === -1 ? 8123 : Number(process.argv[portArg + 1] || 8123);
const shots = JSON.parse(readFileSync(join(here, 'shots.json'), 'utf8'));
const cache = join(homedir(), '.cache', 'ms-playwright');
const shell = join(cache, 'chromium_headless_shell-1200', 'chrome-headless-shell-linux64', 'chrome-headless-shell');
if (!existsSync(shell)) throw new Error(`headless shell not found under ${cache}`);

const server = spawn(process.execPath, ['serve.ts', '--port', String(port)], { cwd: here, stdio: 'ignore' });
const sleep = ms => new Promise(r => setTimeout(r, ms));
const waitUp = async () => {
  for (let i = 0; i < 50; i++) {
    try { await fetch(`http://127.0.0.1:${port}/`); return; } catch { await sleep(200); }
  }
  throw new Error('serve.ts did not come up');
};

try {
  await waitUp();
  mkdirSync(join(here, 'screenshots'), { recursive: true });
  for (const shot of shots) {
    const png = join(here, 'screenshots', shot.file.replace(/\.jpe?g$/i, '.png'));
    const jpg = join(here, 'screenshots', shot.file);
    const url = `http://127.0.0.1:${port}${shot.path}`;
    const run = spawnSync(shell, [
      '--headless', '--disable-gpu', '--no-sandbox', '--hide-scrollbars',
      `--window-size=${shot.viewport.width},${shot.viewport.height}`,
      '--virtual-time-budget=9000', `--screenshot=${png}`, url,
    ], { stdio: 'inherit' });
    if (run.status !== 0 || !existsSync(png)) throw new Error(`screenshot failed: ${shot.file}`);
    const conv = spawnSync('ffmpeg', ['-y', '-v', 'error', '-i', png, '-q:v', '4', jpg], { stdio: 'inherit' });
    rmSync(png, { force: true });
    if (conv.status !== 0 || !existsSync(jpg)) throw new Error(`jpeg convert failed: ${shot.file}`);
    console.log(`shot ${shot.file} <- ${shot.path}`);
  }
} finally {
  server.kill();
}
console.log('all screenshots written');
