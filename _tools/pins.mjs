// Renders the WorkHourMath Pinterest pin images (1000x1500 JPEG) listed in _tools/pins.json.
// Each job names its template: img/pin.html (calculators, guides) or img/pin-chart.html (printable charts).
// Requires Google Chrome and Node 22+.
//
//   python _tools/pins.py        # refresh pins.json first
//   node _tools/pins.mjs         # only renders missing images
//   node _tools/pins.mjs --all   # re-renders every image
import { spawn } from 'node:child_process';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');
const jobs = JSON.parse(readFileSync(join(here, 'pins.json'), 'utf8'));
const all = process.argv.includes('--all');
const todo = jobs.filter((j) => all || !existsSync(join(root, j.out)));
if (!todo.length) { console.log('All pin images exist.'); process.exit(0); }

const chrome = [process.env.CHROME_PATH, 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome'].filter(Boolean).find((p) => existsSync(p));
if (!chrome) { console.error('Chrome not found. Set CHROME_PATH.'); process.exit(1); }

const port = 9335;
const proc = spawn(chrome, ['--headless=new', '--disable-gpu', '--hide-scrollbars', `--remote-debugging-port=${port}`,
  '--window-size=1000,1500', '--user-data-dir=' + join(here, '.chrome-profile'), 'about:blank'], { stdio: 'ignore' });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let target;
for (let i = 0; i < 50 && !target; i++) {
  try { target = (await (await fetch(`http://127.0.0.1:${port}/json/list`)).json()).find((t) => t.type === 'page'); } catch { await sleep(200); }
}
if (!target) { console.error('Could not connect to Chrome.'); proc.kill(); process.exit(1); }

const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((r) => ws.addEventListener('open', r, { once: true }));
let id = 0; const pending = new Map(); const waiters = [];
ws.addEventListener('message', (ev) => {
  const msg = JSON.parse(ev.data);
  if (msg.id && pending.has(msg.id)) { pending.get(msg.id)(msg.result); pending.delete(msg.id); }
  if (msg.method) waiters.filter((w) => w.m === msg.method).forEach((w) => { w.r(); waiters.splice(waiters.indexOf(w), 1); });
});
const send = (method, params = {}) => new Promise((r) => { const i = ++id; pending.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
const once = (m) => new Promise((r) => waiters.push({ m, r }));

await send('Page.enable');
await send('Emulation.setDeviceMetricsOverride', { width: 1000, height: 1500, deviceScaleFactor: 1, mobile: false });
for (const j of todo) {
  const tpl = pathToFileURL(join(here, 'img', j.tpl || 'pin.html')).href;
  const hash = new URLSearchParams({ h: j.headline, s: j.sub, l: j.label, c: j.cta, i: j.icon, r: JSON.stringify(j.rows || []) }).toString();
  const loaded = once('Page.loadEventFired');
  await send('Page.navigate', { url: `${tpl}?v=${Date.now()}#${hash}` });
  await loaded; await sleep(200);
  const shot = await send('Page.captureScreenshot', { format: 'jpeg', quality: 85, clip: { x: 0, y: 0, width: 1000, height: 1500, scale: 1 } });
  const out = join(root, j.out);
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, Buffer.from(shot.data, 'base64'));
  console.log('wrote', j.out);
}
ws.close(); proc.kill();
