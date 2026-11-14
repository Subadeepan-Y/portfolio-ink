// Poster reveal + VI3ION asset loading check.
const { spawn } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 9990 + Math.floor(Math.random() * 8);
const URL = process.env.SITE_URL || 'http://127.0.0.1:5000/';
const sleep = ms => new Promise(r => setTimeout(r, ms));
class CDP {
  constructor(ws) { this.ws = ws; this.id = 0; this.pending = new Map(); this.handlers = new Map(); }
  static async connect(u) { const ws = new WebSocket(u); await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; }); const c = new CDP(ws); ws.onmessage = e => { const m = JSON.parse(e.data); if (m.id && c.pending.has(m.id)) { const p = c.pending.get(m.id); c.pending.delete(m.id); m.error ? p.rej(new Error(JSON.stringify(m.error))) : p.res(m.result); } else if (m.method) (c.handlers.get(m.method) || []).forEach(h => h(m.params)); }; return c; }
  on(m, f) { if (!this.handlers.has(m)) this.handlers.set(m, []); this.handlers.get(m).push(f); }
  send(method, params = {}) { const id = ++this.id; return new Promise((res, rej) => { this.pending.set(id, { res, rej }); this.ws.send(JSON.stringify({ id, method, params })); setTimeout(() => { if (this.pending.has(id)) { this.pending.delete(id); rej(new Error('timeout ' + method)); } }, 90000); }); }
  async eval(e) { const r = await this.send('Runtime.evaluate', { expression: e, returnByValue: true, awaitPromise: true }); if (r.exceptionDetails) return { __error: r.exceptionDetails.text }; return r.result.value; }
  async shot(f) { const s = await this.send('Page.captureScreenshot', { format: 'png' }); fs.writeFileSync('D:/PROJECTS/portfolio-ink/screenshots/' + f, Buffer.from(s.data, 'base64')); console.log('shot', f); }
}
(async () => {
  const profile = path.join(os.tmpdir(), 'cdp-postercheck-' + PORT);
  const proc = spawn(CHROME, ['--headless=new', '--remote-debugging-port=' + PORT, '--user-data-dir=' + profile, '--window-size=1600,900',
    '--no-first-run', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--hide-scrollbars', 'about:blank'], { stdio: 'ignore' });
  let targets = null;
  for (let i = 0; i < 40; i++) { await sleep(500); try { targets = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json(); if (targets.length) break; } catch (e) { } }
  const c = await CDP.connect((targets.find(t => t.type === 'page') || targets[0]).webSocketDebuggerUrl);
  const failed = [];
  const codes = [];
  await c.send('Runtime.enable'); await c.send('Page.enable'); await c.send('Network.enable');
  c.on('Network.responseReceived', p => { if (p.response.status >= 400) failed.push(p.response.status + ' ' + p.response.url); if (/vi3ion|poster/.test(p.response.url)) codes.push(p.response.status + ' ' + p.response.url.split('/').pop()); });
  c.on('Runtime.exceptionThrown', p => failed.push('EXC ' + (p.exceptionDetails.text || '')));
  await c.send('Page.navigate', { url: URL });
  await sleep(900);
  await c.shot('poster_phase_early.png');
  console.log('early poster state:', await c.eval(`(() => { const p = document.getElementById('scenePoster'); return { exists: !!p, opacity: p ? getComputedStyle(p).opacity : 'gone', bodyClass: document.body.className }; })()`));
  await sleep(9000);
  await c.shot('poster_phase_live.png');
  console.log('live poster state:', await c.eval(`(() => { const p = document.getElementById('scenePoster'); return { exists: !!p, bodyClass: document.body.className, firstFrame: window.renderer.info.render.frame }; })()`));
  // VI3ION plate + dossier images
  await c.eval(`window.__setProgress(2)`);
  await sleep(2500);
  await c.shot('vi3ion_stage.png');
  const imgs = await c.eval(`(() => Array.from(document.querySelectorAll('img')).map(i => ({ src: i.getAttribute('src'), ok: i.complete && i.naturalWidth > 0 })).filter(i => /vi3ion|landing/.test(i.src||'')))()`);
  console.log('vi3ion images:', JSON.stringify(imgs));
  await c.eval(`openModal(0)`);
  await sleep(1500);
  await c.shot('vi3ion_dossier.png');
  const mImgs = await c.eval(`(() => Array.from(document.querySelectorAll('#modal img, #dossierModal img')).map(i => ({ src: i.getAttribute('src'), ok: i.complete && i.naturalWidth > 0 })))()`);
  console.log('dossier images:', JSON.stringify(mImgs));
  console.log('failed requests:', JSON.stringify(failed.slice(0, 10)));
  console.log('vi3ion/poster responses:', JSON.stringify(codes.slice(0, 10)));
  proc.kill();
  try { fs.rmSync(profile, { recursive: true, force: true }); } catch (e) { }
  process.exit(0);
})().catch(e => { console.error('FATAL', e); process.exit(1); });
