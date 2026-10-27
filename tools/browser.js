/* Elektron — pilota di Chrome senza finestra, per le verifiche nel browser (non fa parte del sito).
   Usa il protocollo DevTools con il WebSocket di Node (≥ 22): nessuna dipendenza da installare.
   Ogni avvio usa un profilo nuovo e vuoto: nessun service worker o cache di una versione vecchia.
   const B = require('./tools/browser.js'); const p = await B.open(url, { w: 360, h: 780, dark: false });
   await p.eval('1 + 1'); await p.shot('file.png'); p.errors; await p.close(); */
const { spawn } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');
const CHROME = process.env.CHROME || ['C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe', '/usr/bin/google-chrome', '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'].find((p) => fs.existsSync(p));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function open(url, o = {}) {
  const port = 9300 + Math.floor(Math.random() * 500);
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'elektron-chrome-'));
  const proc = spawn(CHROME, ['--headless=new', '--disable-gpu', '--hide-scrollbars', '--no-first-run', '--no-default-browser-check', '--allow-file-access-from-files',
    `--remote-debugging-port=${port}`, `--user-data-dir=${dir}`, `--window-size=${o.w || 360},${o.h || 780}`, 'about:blank'], { stdio: 'ignore' });
  let targets = null;
  for (let k = 0; k < 60 && !targets; k++) { await sleep(150); try { targets = await (await fetch(`http://127.0.0.1:${port}/json`)).json(); } catch (e) { targets = null; } }
  if (!targets) throw new Error('Chrome non risponde');
  const t = targets.find((x) => x.type === 'page');
  const ws = new WebSocket(t.webSocketDebuggerUrl);
  await new Promise((r, j) => { ws.onopen = r; ws.onerror = j; });
  let id = 0;
  const waiting = new Map();
  const errors = [], logs = [];
  ws.onmessage = (m) => {
    const d = JSON.parse(m.data);
    if (d.id && waiting.has(d.id)) { const { res, rej } = waiting.get(d.id); waiting.delete(d.id); if (d.error) rej(new Error(d.error.message)); else res(d.result); return; }
    if (d.method === 'Runtime.exceptionThrown') { const e = d.params.exceptionDetails; errors.push(((e.exception && e.exception.description) || e.text || '').split('\n').slice(0, 3).join(' ')); }
    if (d.method === 'Runtime.consoleAPICalled') { const s = d.params.args.map((a) => a.value ?? a.description ?? '').join(' '); if (['error', 'warning', 'assert'].includes(d.params.type)) errors.push(d.params.type + ': ' + s); else logs.push(s); }
    if (d.method === 'Log.entryAdded' && ['error', 'warning'].includes(d.params.entry.level) && !/favicon/.test(d.params.entry.url || '')) errors.push('log: ' + d.params.entry.text);
  };
  const send = (method, params = {}) => new Promise((res, rej) => { const i = ++id; waiting.set(i, { res, rej }); ws.send(JSON.stringify({ id: i, method, params })); });
  await send('Runtime.enable'); await send('Log.enable'); await send('Page.enable');
  await send('Emulation.setDeviceMetricsOverride', { width: o.w || 360, height: o.h || 780, deviceScaleFactor: o.scale || 2, mobile: (o.w || 360) < 700 });
  await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-color-scheme', value: o.dark ? 'dark' : 'light' }, { name: 'prefers-reduced-motion', value: 'reduce' }] });
  const p = {
    errors, logs, send,
    async goto(u) { await send('Page.navigate', { url: u }); await sleep(o.wait || 900); },
    async eval(expr) {
      const r = await send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true });
      if (r.exceptionDetails) throw new Error((r.exceptionDetails.exception && r.exceptionDetails.exception.description) || r.exceptionDetails.text);
      return r.result.value;
    },
    async size(w, h) { await send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: o.scale || 2, mobile: w < 700 }); await sleep(150); },
    async dark(on) { await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-color-scheme', value: on ? 'dark' : 'light' }, { name: 'prefers-reduced-motion', value: 'reduce' }] }); await sleep(100); },
    async shot(file, full) {
      let clip;
      if (full) { const m = await send('Page.getLayoutMetrics'); clip = { x: 0, y: 0, width: m.cssContentSize.width, height: Math.min(m.cssContentSize.height, 6000), scale: 1 }; }
      const r = await send('Page.captureScreenshot', Object.assign({ format: 'png' }, clip ? { clip, captureBeyondViewport: true } : {}));
      fs.writeFileSync(file, Buffer.from(r.data, 'base64'));
    },
    async close() { try { ws.close(); } catch (e) { /* già chiuso */ } proc.kill(); await sleep(300); try { fs.rmSync(dir, { recursive: true, force: true }); } catch (e) { /* Chrome tiene ancora qualche file */ } },
  };
  if (url) await p.goto(url);
  return p;
}
module.exports = { open, sleep };
