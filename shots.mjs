// shots.mjs — take the entry's screenshots with headless Chromium over CDP.
// Usage: node shots.mjs <base-url> <out-dir>
// Renders the real app at 1280x800: it seeds the tracker through the app's own
// localStorage (the same state a player would have), opens views through the
// app's own controls and deep links, and captures JPEG screenshots.
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

const [baseUrl, outDir] = process.argv.slice(2);
const chromePath = join(homedir(), '.cache/ms-playwright/chromium-1255/chrome-linux64/chrome');
const PORT = 9333;
mkdirSync(outDir, { recursive: true });

const chrome = spawn(chromePath, [
  '--headless=new', '--no-sandbox', '--disable-gpu', '--hide-scrollbars',
  `--remote-debugging-port=${PORT}`, '--remote-debugging-address=127.0.0.1', '--window-size=1280,800',
  '--user-data-dir=/tmp/leonida-shots-profile', 'about:blank',
], { stdio: 'ignore' });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function connect() {
  for (let i = 0; i < 160; i++) {
    try {
      const targets = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
      const page = targets.find((t) => t.type === 'page');
      if (page) return page.webSocketDebuggerUrl;
    } catch { /* not up yet */ }
    await sleep(250);
  }
  throw new Error('chromium CDP did not come up');
}

const wsUrl = await connect();
const ws = new WebSocket(wsUrl);
await new Promise((resolve, reject) => { ws.onopen = resolve; ws.onerror = reject; });
let seq = 0;
const pending = new Map();
ws.onmessage = (event) => {
  const msg = JSON.parse(event.data);
  if (msg.id && pending.has(msg.id)) { pending.get(msg.id)(msg.result); pending.delete(msg.id); }
};
function cdp(method, params = {}) {
  const id = ++seq;
  return new Promise((resolve) => { pending.set(id, resolve); ws.send(JSON.stringify({ id, method, params })); });
}

async function evaluate(expression) {
  const result = await cdp('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
  if (result?.exceptionDetails) throw new Error('page error: ' + JSON.stringify(result.exceptionDetails).slice(0, 400));
  return result?.result?.value;
}

async function shoot(file, setup) {
  await cdp('Page.navigate', { url: baseUrl });
  await sleep(900);
  if (setup) { await evaluate(setup); await sleep(700); }
  const shot = await cdp('Page.captureScreenshot', { format: 'jpeg', quality: 82 });
  writeFileSync(join(outDir, file), Buffer.from(shot.data, 'base64'));
  console.log('shot', file);
}

await cdp('Page.enable', {});
await cdp('Runtime.enable', {});
await cdp('Emulation.setDeviceMetricsOverride', { width: 1280, height: 800, deviceScaleFactor: 1, mobile: false });

const SEED = `localStorage.setItem('leonida-legend-tracker-v1', JSON.stringify({ earned: [2, 3, 8, 20, 44, 53], notes: { 40: 'Vault 3 of 5 done — try the marina branch next, boat escape worked.' }, shield: true }));`;

// 1 — cover: checklist with progress, a silver guide open, its sources and a note visible.
await shoot('1-cover.jpg', `${SEED} location.hash = 'trophy-40'; location.reload();`);
// 2 — the roadmap: six stages with progress bars and trophy chips.
await shoot('2-roadmap.jpg', `${SEED} location.hash = 'roadmap'; location.reload();`);
// 3 — the missable watch list.
await shoot('3-missables.jpg', `${SEED} location.hash = 'missables'; location.reload();`);
// 4 — spoiler shield at work: story filter, unearned story trophies masked.
await shoot('4-spoiler-shield.jpg', `${SEED} location.hash = ''; location.reload(); setTimeout(() => { [...document.querySelectorAll('.chip')].find(c => c.textContent === 'Story')?.click(); }, 350);`);

ws.close();
chrome.kill('SIGTERM');
console.log('done');
