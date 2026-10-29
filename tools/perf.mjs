// Autocrat · tools/perf.mjs: frame cost measurement for #74. Opens the game in headless Chrome as a mid-range phone (Pixel 5 emulation,
// touch, portrait) with the CPU slowed 4x (DevTools' "4x slowdown"), sets up three scenes and times frames: the game's own tick() at 60 Hz
// plus renderer.render(). Prints a markdown table: median and p95 frame, tick and render time on the main thread, draw calls, triangles.
//
//   npm install --prefix tools
//   node tools/perf.mjs [--root <dir>] [--label <name>] [--rate 4] [--frames 180] [--chrome <path>]
//
// --root serves another checkout (e.g. a worktree of main) so before/after can be measured with the same tool.
// Note: with SwiftShader (no GPU on CI) the GPU work runs in Chrome's GPU process; the numbers here are main-thread time (JS, scene graph,
// WebGL calls), which is what draw-call and object counts drive. Compare runs on the same machine, not against a real phone.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer, { KnownDevices } from 'puppeteer-core';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const arg = (name, def) => { const i = process.argv.indexOf('--' + name); return i > 0 ? process.argv[i + 1] : def; };
const ROOT = path.resolve(arg('root', path.join(HERE, '..'))), LABEL = arg('label', path.basename(ROOT));
const RATE = +arg('rate', 4), FRAMES = +arg('frames', 180);
const CHROME = arg('chrome', process.env.CHROME_PATH) || ['/usr/bin/google-chrome', '/usr/bin/google-chrome-stable', '/usr/bin/chromium',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'].find(p => fs.existsSync(p));
if (!CHROME) { console.error('perf: no Chrome found (pass --chrome or set CHROME_PATH)'); process.exit(2); }

const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml' };
const server = http.createServer((req, res) => {
  const p = path.join(ROOT, decodeURIComponent(new URL(req.url, 'http://x').pathname));
  if (!p.startsWith(ROOT)) { res.writeHead(403); return res.end(); }
  const f = fs.existsSync(p) && fs.statSync(p).isDirectory() ? path.join(p, 'index.html') : p;
  fs.readFile(f, (err, data) => { if (err) { res.writeHead(404); return res.end(); } res.writeHead(200, { 'Content-Type': TYPES[path.extname(f)] || 'application/octet-stream' }); res.end(data); });
});
await new Promise(r => server.listen(0, '127.0.0.1', r));

const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, protocolTimeout: 600000,
  args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--autoplay-policy=no-user-gesture-required'] });
let exitCode = 0;
try {
  const page = await browser.newPage();
  await page.emulate(KnownDevices['Pixel 5']);
  // same scenes on every run: Math.random is seeded before the game loads (spawns, layouts, AI choices), so before/after differ only by code
  await page.evaluateOnNewDocument(() => { let s = 1234567; Math.random = () => { s |= 0; s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; });
  const errors = []; page.on('pageerror', e => errors.push(String(e && e.message || e)));
  await page.goto(`http://127.0.0.1:${server.address().port}/?mute=1`, { waitUntil: 'load' });
  await page.waitForFunction(() => typeof launchArena === 'function' && typeof tick === 'function' && typeof DBG === 'object', { timeout: 30000 });
  const cdp = await page.createCDPSession();
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: RATE });

  const rows = await page.evaluate((FRAMES) => {
    window.persist = () => {}; window.saveRun = () => {};
    let vt = performance.now();
    const step = (n, dt = 1 / 30) => { for (let i = 0; i < n; i++) { vt += dt * 1000; tick(dt, vt); } };
    const settle = () => { for (let k = 0; k < 600 && state !== 'fight'; k++) { if (state === 'card' || state === 'warn') stateT = 0; if (state === 'cine') endCine(); if (state === 'choice' && chCfg) { if (spin) spin.left = 0; ignoreClickUntil = 0; pickChoice(0); } step(3); } };
    const SCENES = [
      ['A1 normal room', () => { launchArena(0); settle(); step(90); }],
      ['A4 crowded room (12 mobs)', () => { launchArena(3); settle(); DBG.killAll(); spawnQ = []; const pool = ARENAS[3].mobs; for (let i = 0; i < 12; i++) DBG.spawn(pool[i % pool.length]); step(60); }],
      ['Main Stage last room', () => { const a = ARENAS.findIndex(A => A.stage); launchArena(a); settle(); DBG.jump(ARENAS[a].rooms - 1); settle(); step(240); }],
    ];
    const out = [];
    godMode = true; BOT.on = true; DBG.noRender = true;
    for (const [name, setup] of SCENES) {
      try { setup(); } catch (e) { out.push({ name, error: String(e && e.message || e) }); continue; }
      for (let i = 0; i < 30; i++) { step(1, 1 / 60); renderer.render(scene, cam); }          // warm-up (shader compiles, first uploads)
      const fr = [], tk = [], rd = [];
      for (let i = 0; i < FRAMES; i++) { if (state === 'choice' && chCfg) { if (spin) spin.left = 0; ignoreClickUntil = 0; pickChoice(0); }
        const t0 = performance.now(); step(1, 1 / 60); const t1 = performance.now(); renderer.render(scene, cam); const t2 = performance.now();
        fr.push(t2 - t0); tk.push(t1 - t0); rd.push(t2 - t1); }
      renderer.info.autoReset = false; renderer.info.reset(); renderer.render(scene, cam); const calls = renderer.info.render.calls, tris = renderer.info.render.triangles; renderer.info.autoReset = true;
      let meshes = 0; scene.traverse(o => { if (o.isMesh && o.visible) meshes++; });
      const q = (a, p) => { const s = [...a].sort((x, y) => x - y); return +s[Math.min(s.length - 1, Math.floor(s.length * p))].toFixed(2); };
      out.push({ name, frameMed: q(fr, .5), frameP95: q(fr, .95), tickMed: q(tk, .5), renderMed: q(rd, .5), calls, tris, meshes, enemies: enemies.length });
    }
    BOT.on = false; godMode = false;
    return out;
  }, FRAMES);

  console.log(`\n### ${LABEL} · Pixel 5 emulation · CPU ${RATE}x slower · ${FRAMES} frames\n`);
  console.log('| Scene | Frame median (ms) | Frame p95 | Tick median | Render median | Draw calls | Triangles | Meshes | Enemies |');
  console.log('|---|---|---|---|---|---|---|---|---|');
  for (const r of rows) console.log(r.error ? `| ${r.name} | error: ${r.error} |||||||| ` : `| ${r.name} | ${r.frameMed} | ${r.frameP95} | ${r.tickMed} | ${r.renderMed} | ${r.calls} | ${r.tris} | ${r.meshes} | ${r.enemies} |`);
  if (errors.length) { console.error('perf: page errors:\n  ' + errors.slice(0, 10).join('\n  ')); exitCode = 1; }
} catch (e) {
  console.error('perf: harness error: ' + (e && e.stack || e)); exitCode = 1;
} finally {
  await browser.close(); server.close();
}
process.exit(exitCode);
