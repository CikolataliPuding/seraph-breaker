// Autocrat · tools/smoke.mjs: smoke test (#53). Serves the repo, opens the game in headless Chrome and lets the autopilot play,
// fast-forwarded and without rendering: Arena 1 for a while, then one fight against every boss. Any page error, console error or
// exception thrown inside a game tick fails the run (exit code 1). The game itself is unchanged: this only drives its own tick().
//
//   npm install --prefix tools          (once: puppeteer-core, see tools/package.json)
//   node tools/smoke.mjs [--seconds 120] [--boss-seconds 25] [--chrome /path/to/chrome]
//
// Chrome: --chrome, else $CHROME_PATH, else the usual install paths. GitHub's ubuntu runners ship Google Chrome.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer-core';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const arg = (name, def) => { const i = process.argv.indexOf('--' + name); return i > 0 ? process.argv[i + 1] : def; };
const SECONDS = +arg('seconds', 120), BOSS_SECONDS = +arg('boss-seconds', 25);
const CHROME = arg('chrome', process.env.CHROME_PATH) || ['/usr/bin/google-chrome', '/usr/bin/google-chrome-stable', '/usr/bin/chromium',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'].find(p => fs.existsSync(p));
if (!CHROME) { console.error('smoke: no Chrome found (pass --chrome or set CHROME_PATH)'); process.exit(2); }

// static file server for the repo (the game has no build step)
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml' };
const server = http.createServer((req, res) => {
  const p = path.join(ROOT, decodeURIComponent(new URL(req.url, 'http://x').pathname));
  if (!p.startsWith(ROOT)) { res.writeHead(403); return res.end(); }
  const f = fs.existsSync(p) && fs.statSync(p).isDirectory() ? path.join(p, 'index.html') : p;
  fs.readFile(f, (err, data) => {
    if (err) { res.writeHead(404); return res.end(); }
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(f)] || 'application/octet-stream' }); res.end(data);
  });
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const url = `http://127.0.0.1:${server.address().port}/?mute=1`;

const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, protocolTimeout: 600000,
  args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--autoplay-policy=no-user-gesture-required'] });
const errors = [];
let exitCode = 0;
try {
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });
  page.on('pageerror', e => errors.push('pageerror: ' + (e && e.message || e)));
  page.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
  page.on('requestfailed', r => { if (!r.url().includes('favicon')) errors.push('request failed: ' + r.url()); });
  await page.goto(url, { waitUntil: 'load' });
  await page.waitForFunction(() => typeof launchArena === 'function' && typeof tick === 'function' && typeof DBG === 'object', { timeout: 30000 });

  // runs inside the page: the game's own tick() at a fixed 30 Hz step, the autopilot playing, death refilled (DBG.immortal)
  const result = await page.evaluate((SECONDS, BOSS_SECONDS) => {
    const out = { tickErrors: [], rooms: 0, bosses: [], seconds: 0 };
    let vt = performance.now();
    const step = n => { for (let i = 0; i < n; i++) { vt += 33; try { tick(1 / 30, vt); } catch (e) { if (out.tickErrors.length < 20) out.tickErrors.push((e && e.stack || String(e)).split('\n').slice(0, 3).join(' | ')); } } };
    const keepGoing = () => {
      if (state === 'card' || state === 'warn') stateT = 0;
      if (state === 'cine') endCine();
      if (state === 'choice' && chCfg) { if (spin && spin.left > 0) { spin.cards.forEach(c => { clearTimeout(c.timer); try { stopReel(c); } catch (e) {} }); spin.left = 0; } ignoreClickUntil = 0; pickChoice((Math.random() * chCfg.options.length) | 0); }
    };
    window.persist = () => {}; window.saveRun = () => {};          // a smoke run never writes the save
    BOT.on = true; DBG.immortal = true; DBG.noRender = true;
    // 1) Arena 1 for SECONDS of game time
    launchArena(0); let lastRoom = -1;
    const t0 = playTime;
    for (let guard = 0; playTime - t0 < SECONDS && guard < 200000; guard++) {
      keepGoing(); step(10);
      if (sortie && sortie.ri !== lastRoom) { lastRoom = sortie.ri; out.rooms++; }
      if (state === 'result') break;
    }
    out.seconds = Math.round(playTime - t0);
    // 2) one fight against every boss (bosses are where list and phase bugs hide), BOSS_SECONDS each
    for (const kind of Object.keys(BOSSES)) {
      const a = Math.max(0, ARENAS.findIndex((A, i) => arenaBossPool(i).includes(kind)));
      if (state !== 'fight' || !sortie || sortie.a !== a) { launchArena(a); for (let k = 0; k < 400 && state !== 'fight'; k++) { keepGoing(); step(3); } }
      try { DBG.jump(Math.min(sortie.N, (sortie.ri || 0) + 2), { type: 'boss', boss: kind }); } catch (e) { out.tickErrors.push('jump ' + kind + ': ' + e.message); continue; }
      for (let k = 0; k < 600 && !(boss && state === 'fight'); k++) { keepGoing(); step(3); }
      const b0 = playTime, seen = !!boss;
      for (let guard = 0; playTime - b0 < BOSS_SECONDS && guard < 60000; guard++) { keepGoing(); step(5); if (state === 'result') break; }
      out.bosses.push(kind + (seen ? '' : ' (did not spawn)'));
    }
    BOT.on = false; DBG.immortal = false;
    return out;
  }, SECONDS, BOSS_SECONDS);

  const failures = [...result.tickErrors.map(e => 'tick: ' + e), ...errors];
  console.log(`smoke: Arena 1 · ${result.seconds} s of play · ${result.rooms} rooms · bosses: ${result.bosses.join(', ')}`);
  if (failures.length) { console.error(`smoke: FAILED, ${failures.length} error(s):\n  ` + failures.slice(0, 30).join('\n  ')); exitCode = 1; }
  else console.log('smoke: OK, no errors');
} catch (e) {
  console.error('smoke: harness error: ' + (e && e.stack || e)); exitCode = 1;
} finally {
  await browser.close(); server.close();
}
process.exit(exitCode);
