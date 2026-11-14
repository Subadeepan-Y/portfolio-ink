// Verify 3D picking still works after the batching refactor:
//  - clicking a house opens its dossier
//  - clicking the certificate in the sanctum opens the lightbox
const { spawn } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 9480 + Math.floor(Math.random() * 15);
const URL = process.env.SITE_URL || 'http://127.0.0.1:5000/';
const sleep = ms => new Promise(r => setTimeout(r, ms));
class CDP {
  constructor(ws) { this.ws = ws; this.id = 0; this.pending = new Map(); this.handlers = new Map(); }
  static async connect(u) { const ws = new WebSocket(u); await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; }); const c = new CDP(ws); ws.onmessage = e => { const m = JSON.parse(e.data); if (m.id && c.pending.has(m.id)) { const p = c.pending.get(m.id); c.pending.delete(m.id); m.error ? p.rej(new Error(JSON.stringify(m.error))) : p.res(m.result); } else if (m.method) (c.handlers.get(m.method) || []).forEach(h => h(m.params)); }; return c; }
  on(m, f) { if (!this.handlers.has(m)) this.handlers.set(m, []); this.handlers.get(m).push(f); }
  send(method, params = {}) { const id = ++this.id; return new Promise((res, rej) => { this.pending.set(id, { res, rej }); this.ws.send(JSON.stringify({ id, method, params })); setTimeout(() => { if (this.pending.has(id)) { this.pending.delete(id); rej(new Error('timeout ' + method)); } }, 90000); }); }
  async eval(e) { const r = await this.send('Runtime.evaluate', { expression: e, returnByValue: true, awaitPromise: true }); if (r.exceptionDetails) return { __error: r.exceptionDetails.text }; return r.result.value; }
  async click(x, y) {
    await this.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y, buttons: 0 });
    await sleep(120);
    await this.send('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', buttons: 1, clickCount: 1 });
    await sleep(60);
    await this.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'left', buttons: 0, clickCount: 1 });
  }
}
(async () => {
  const profile = path.join(os.tmpdir(), 'cdp-pick-' + PORT);
  const proc = spawn(CHROME, ['--headless=new', '--remote-debugging-port=' + PORT, '--user-data-dir=' + profile, '--window-size=1600,900', '--no-first-run', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--hide-scrollbars', 'about:blank'], { stdio: 'ignore' });
  let targets = null;
  for (let i = 0; i < 40; i++) { await sleep(500); try { targets = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json(); if (targets.length) break; } catch (e) { } }
  const c = await CDP.connect((targets.find(t => t.type === 'page') || targets[0]).webSocketDebuggerUrl);
  const logs = [];
  await c.send('Runtime.enable'); await c.send('Page.enable');
  c.on('Runtime.exceptionThrown', p => logs.push('[EXC] ' + ((p.exceptionDetails && p.exceptionDetails.exception && p.exceptionDetails.exception.description) || p.exceptionDetails.text)));
  await c.send('Page.navigate', { url: URL });
  await sleep(11000);

  // ---- house picking at stage 2 ----
  await c.eval(`window.__setProgress(2)`);
  await sleep(2000);
  let hit = null;
  outer:
  for (const y of [560, 480, 620, 400, 520]) {
    for (const x of [790, 300, 1250, 500, 1050]) {
      await c.click(x, y);
      await sleep(2200);
      const st = await c.eval(`(() => {
        const m = document.getElementById('dossierModal');
        return { open: m ? m.classList.contains('open') : false, title: (document.getElementById('mTitle')||{}).textContent, flight: window.__isFlightActive ? window.__isFlightActive() : false };
      })()`);
      if (st.open || st.flight) { hit = { x, y, st }; break outer; }
    }
  }
  console.log('house pick:', JSON.stringify(hit));
  if (hit) {
    await c.eval(`(function(){ try { closeModal(); } catch(e){} })()`);
    await sleep(800);
  }

  // ---- certificate picking at stage 9 ----
  await c.eval(`window.__setProgress(9)`);
  await sleep(2200);
  const certBox = await c.eval(`(() => {
    const f = window.__certFrame;
    if (!f) return { err: 'no cert frame' };
    f.updateMatrixWorld(true);
    const g = f.geometry; g.computeBoundingBox();
    return { present: true, visible: f.visible, worldPos: [f.getWorldPosition(new (f.position.constructor)()).x, f.getWorldPosition(new (f.position.constructor)()).y, f.getWorldPosition(new (f.position.constructor)()).z] };
  })()`);
  console.log('cert frame:', JSON.stringify(certBox));
  // click the centre of the screen where the certificate is rendered
  await c.click(760, 280);
  await sleep(1500);
  const lb = await c.eval(`(() => { const l = document.getElementById('lightboxModal'); return { open: l ? l.classList.contains('open') : false, src: (document.getElementById('lightboxImg')||{}).src ? (document.getElementById('lightboxImg').src||'').slice(0, 24) : '' }; })()`);
  console.log('lightbox after cert click:', JSON.stringify(lb));

  console.log('errors:', logs.length, logs.slice(0, 8).join(' | '));
  proc.kill();
  try { fs.rmSync(profile, { recursive: true, force: true }); } catch (e) { }
  process.exit(0);
})().catch(e => { console.error('FATAL', e); process.exit(1); });
