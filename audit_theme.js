// Visible-text audit + stage screenshots after the theme rewrite.
const { spawn } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 9985 + Math.floor(Math.random() * 10);
const URL = process.env.SITE_URL || 'http://127.0.0.1:5000/';
const sleep = ms => new Promise(r => setTimeout(r, ms));
class CDP {
  constructor(ws) { this.ws = ws; this.id = 0; this.pending = new Map(); this.handlers = new Map(); }
  static async connect(u) { const ws = new WebSocket(u); await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; }); const c = new CDP(ws); ws.onmessage = e => { const m = JSON.parse(e.data); if (m.id && c.pending.has(m.id)) { const p = c.pending.get(m.id); c.pending.delete(m.id); m.error ? p.rej(new Error(JSON.stringify(m.error))) : p.res(m.result); } else if (m.method) (c.handlers.get(m.method) || []).forEach(h => h(m.params)); }; return c; }
  on(m, f) { if (!this.handlers.has(m)) this.handlers.set(m, []); this.handlers.get(m).push(f); }
  send(method, params = {}) { const id = ++this.id; return new Promise((res, rej) => { this.pending.set(id, { res, rej }); this.ws.send(JSON.stringify({ id, method, params })); setTimeout(() => { if (this.pending.has(id)) { this.pending.delete(id); rej(new Error('timeout ' + method)); } }, 90000); }); }
  async eval(e) { const r = await this.send('Runtime.evaluate', { expression: e, returnByValue: true, awaitPromise: true }); if (r.exceptionDetails) return { __error: r.exceptionDetails.text }; return r.result.value; }
  async shot(f) { const s = await this.send('Page.captureScreenshot', { format: 'png' }); fs.writeFileSync('D:/PROJECTS/portfolio-ink/screenshots/' + f, Buffer.from(s.data, 'base64')); }
}
(async () => {
  const profile = path.join(os.tmpdir(), 'cdp-theme-' + PORT);
  const proc = spawn(CHROME, ['--headless=new', '--remote-debugging-port=' + PORT, '--user-data-dir=' + profile, '--window-size=1600,900',
    '--no-first-run', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--hide-scrollbars', 'about:blank'], { stdio: 'ignore' });
  let targets = null;
  for (let i = 0; i < 40; i++) { await sleep(500); try { targets = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json(); if (targets.length) break; } catch (e) { } }
  const c = await CDP.connect((targets.find(t => t.type === 'page') || targets[0]).webSocketDebuggerUrl);
  const errs = [];
  await c.send('Runtime.enable'); await c.send('Page.enable');
  c.on('Runtime.exceptionThrown', p => errs.push(p.exceptionDetails.text || ''));
  await c.send('Page.navigate', { url: URL });
  await sleep(11000);

  const audit = await c.eval(`(() => {
    const cjk = /[\\u3000-\\u30ff\\u3400-\\u4dbf\\u4e00-\\u9fff\\uf900-\\ufaff]/;
    const themed = /sanctuary|kyoto|hidden gate|ritual|sacred|inner sanctum|temple|shrine|void/i;
    const texts = [];
    const walk = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    let n;
    while ((n = walk.nextNode())) { const t = (n.textContent || '').trim(); if (t) texts.push(t); }
    const attrs = [];
    document.querySelectorAll('[aria-label],[title],[alt]').forEach(el => {
      ['aria-label','title','alt'].forEach(a => { if (el.getAttribute(a)) attrs.push(el.getAttribute(a)); });
    });
    const source = require('fs').readFileSync('D:/PROJECTS/portfolio-ink/build_kage_editorial.js', 'utf8');
    const escapedCjk = /\\u[3-9][0-9a-f]{3}/gi.test(source);
    const badText = texts.filter(t => cjk.test(t) || themed.test(t));
    const badAttrs = attrs.filter(t => cjk.test(t) || themed.test(t));
    return {
      escapedCjkInSource: escapedCjk,
      title: document.title,
      textCount: texts.length,
      badText: badText.slice(0, 30),
      badAttrs: badAttrs.slice(0, 30),
      railLabels: Array.from(document.querySelectorAll('.rail-btn')).map(b => (b.innerText||'').trim().replace(/\\s+/g,' ')),
      hudPhase: (document.getElementById('hudPhase')||{}).textContent,
      bottomMeta: (document.querySelector('.meta-left')||{}).textContent,
      brandSub: (document.querySelector('.brand-sub')||{}).textContent,
      guideSub: (document.querySelector('.mobile-guide-sub')||{}).textContent
    };
  })()`);
  console.log(JSON.stringify(audit, null, 1));
  for (const st of [0, 1, 2, 8, 9]) {
    await c.eval(`window.__setProgress(${st})`);
    await sleep(1800);
    await c.shot('theme_stage_' + st + '.png');
    console.log('shot stage', st);
  }
  console.log('errors:', errs.length, errs.slice(0, 5).join(' | '));
  proc.kill();
  try { fs.rmSync(profile, { recursive: true, force: true }); } catch (e) { }
  process.exit(0);
})().catch(e => { console.error('FATAL', e); process.exit(1); });
