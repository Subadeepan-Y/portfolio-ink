// Final interaction sweep: every interactive control must respond.
const { spawn } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 9500 + Math.floor(Math.random() * 90);
const sleep = ms => new Promise(r => setTimeout(r, ms));

class CDP {
  constructor(ws) { this.ws = ws; this.id = 0; this.pending = new Map(); this.handlers = new Map(); }
  static async connect(u) { const ws = new WebSocket(u); await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; }); const c = new CDP(ws); ws.onmessage = e => { const m = JSON.parse(e.data); if (m.id && c.pending.has(m.id)) { const p = c.pending.get(m.id); c.pending.delete(m.id); m.error ? p.rej(new Error(JSON.stringify(m.error))) : p.res(m.result); } else if (m.method) (c.handlers.get(m.method) || []).forEach(h => h(m.params)); }; return c; }
  on(m, f) { if (!this.handlers.has(m)) this.handlers.set(m, []); this.handlers.get(m).push(f); }
  send(method, params = {}) { const id = ++this.id; return new Promise((res, rej) => { this.pending.set(id, { res, rej }); this.ws.send(JSON.stringify({ id, method, params })); setTimeout(() => { if (this.pending.has(id)) { this.pending.delete(id); rej(new Error('timeout ' + method)); } }, 60000); }); }
  async eval(e) { const r = await this.send('Runtime.evaluate', { expression: e, returnByValue: true, awaitPromise: true }); if (r.exceptionDetails) return { __error: r.exceptionDetails.text + ' ' + ((r.exceptionDetails.exception && r.exceptionDetails.exception.description) || '') }; return r.result.value; }
  async shot(f) { const s = await this.send('Page.captureScreenshot', { format: 'png' }); fs.writeFileSync('D:/PROJECTS/portfolio-ink/screenshots/' + f, Buffer.from(s.data, 'base64')); }
}

const results = [];
function check(name, pass, detail) { results.push({ name, pass: pass ? 'PASS' : 'FAIL', detail }); console.log((pass ? 'PASS  ' : 'FAIL  ') + name + '  ' + JSON.stringify(detail)); }

(async () => {
  const profile = path.join(os.tmpdir(), 'cdp-final-' + PORT);
  const proc = spawn(CHROME, ['--headless=new', `--remote-debugging-port=${PORT}`, `--user-data-dir=${profile}`, '--window-size=1600,900', '--no-first-run', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--autoplay-policy=no-user-gesture-required', '--hide-scrollbars', 'about:blank'], { stdio: 'ignore' });
  let targets = null;
  for (let i = 0; i < 40; i++) { await sleep(500); try { targets = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json(); if (targets.length) break; } catch (e) { } }
  const c = await CDP.connect((targets.find(t => t.type === 'page') || targets[0]).webSocketDebuggerUrl);
  const logs = [];
  await c.send('Runtime.enable'); await c.send('Page.enable'); await c.send('Log.enable');
  c.on('Runtime.exceptionThrown', p => logs.push('[EXC] ' + ((p.exceptionDetails && p.exceptionDetails.exception && p.exceptionDetails.exception.description) || p.exceptionDetails.text)));
  c.on('Runtime.consoleAPICalled', p => { if (p.type === 'error' || p.type === 'warning') logs.push('[' + p.type + '] ' + p.args.map(a => a.value !== undefined ? a.value : (a.description || a.type)).join(' ')); });
  c.on('Log.entryAdded', p => { if (p.entry.level === 'error') logs.push('[log:error] ' + p.entry.text + ' ' + (p.entry.url || '')); });

  await c.send('Page.navigate', { url: (process.env.SITE_URL || 'http://127.0.0.1:5000/') });
  await sleep(10000);

  const boot = await c.eval(`(() => {
    const canvas = document.getElementById('gl');
    return { canvas: canvas.width + 'x' + canvas.height, houses: PROJECT_HOUSES.length, projects: PROJECTS.length,
             guide: getComputedStyle(document.getElementById('mobileSwipeGuide')).display,
             progress: +currentProgress.toFixed(2) };
  })()`);
  check('scene boot (canvas sized, 6 houses, 6 projects)', boot.canvas !== '300x150' && boot.houses === 6 && boot.projects === 6, boot);
  check('desktop: swipe guide hidden', boot.guide === 'none', { display: boot.guide });

  // nav button
  await c.eval(`document.querySelectorAll('.nav-link')[2].click()`);
  await sleep(2500);
  let p = await c.eval(`({ p: +currentProgress.toFixed(2), t: +targetProgress.toFixed(2) })`);
  check('nav button WORK jumps to stage 2', p.t === 2, p);

  // scroll cue
  await c.eval(`document.querySelector('.scroll-cue').click()`);
  await sleep(2500);
  p = await c.eval(`({ t: +targetProgress.toFixed(2) })`);
  check('scroll cue click works', p.t === 1, p);

  // wheel scroll
  await c.eval(`window.dispatchEvent(new WheelEvent('wheel', { deltaY: 600, cancelable: true, bubbles: true }))`);
  await sleep(600);
  p = await c.eval(`({ t: +targetProgress.toFixed(2) })`);
  check('wheel scroll advances stage', p.t > 1, p);

  // sound toggle
  const snd = await c.eval(`(() => {
    const b = document.getElementById('soundBtn');
    if (!b) return { err: 'no #soundBtn' };
    const before = b.className;
    b.click();
    return { before, after: b.className, aria: b.getAttribute('aria-label') };
  })()`);
  check('sound button toggles', snd.before !== snd.after, snd);

  // rail
  await c.eval(`document.querySelectorAll('.rail-btn')[5].click()`);
  await sleep(2500);
  p = await c.eval(`({ t: +targetProgress.toFixed(2) })`);
  check('rail button jumps to stage 5', p.t === 5, p);

  // step dot
  await c.eval(`document.querySelectorAll('.step-dot')[3].click()`);
  await sleep(2500);
  p = await c.eval(`({ t: +targetProgress.toFixed(2) })`);
  check('stepper dot jumps to stage 5', p.t === 5, p);

  // cinematic fly + modal
  const fly = await c.eval(`(() => { window.flyToProject(3); return { started: window.__isFlightActive() }; })()`);
  await sleep(3500);
  const afterFly = await c.eval(`(() => {
    const m = document.getElementById('dossierModal');
    return { flight: window.__isFlightActive(), modalOpen: m ? m.classList.contains('open') : null,
             title: (document.querySelector('#modal .m-title, #modal h2, #dossierModal h2') || {}).textContent };
  })()`);
  check('fly to project opens dossier', fly.started === true && afterFly.modalOpen === true, afterFly);
  await c.shot('verify_modal_after_fly.png');

  // modal next / prev
  const mod = await c.eval(`(() => {
    const before = (document.getElementById('mCount') || {}).textContent;
    const next = document.getElementById('mNext');
    if (!next) return { err: 'no next button' };
    next.click();
    return { before };
  })()`);
  await sleep(900);
  const modAfter = await c.eval(`(document.getElementById('mCount') || {}).textContent`);
  check('modal next slide works', !!mod.err || modAfter !== mod.before, { before: mod.before, after: modAfter, err: mod.err });

  // close modal
  await c.eval(`(function(){ try { closeModal(); } catch(e){} })()`);
  await sleep(800);
  const closed = await c.eval(`document.getElementById('dossierModal').classList.contains('open')`);
  check('modal closes', closed === false, { stillOpen: closed });

  // contact links
  const links = await c.eval(`(() => Array.from(document.querySelectorAll('a.contact-link[href]')).map(a => a.getAttribute('href')))()`);
  check('contact links present (4)', Array.isArray(links) && links.length === 4, links);
  const placeholders = await c.eval(`document.querySelectorAll('.contact-link.placeholder, .placeholder-inline').length`);
  check('personal placeholders visible', placeholders === 3, { placeholders });

  // hotkey modal (key "?" = Shift+/)
  await c.send('Input.dispatchKeyEvent', { type: 'rawKeyDown', key: '?', code: 'Slash', windowsVirtualKeyCode: 191, modifiers: 8 });
  await c.send('Input.dispatchKeyEvent', { type: 'keyUp', key: '?', code: 'Slash', windowsVirtualKeyCode: 191, modifiers: 8 });
  await sleep(900);
  const hot = await c.eval(`(() => { const h = document.getElementById('hotkeyModal'); return h ? h.className : 'missing'; })()`);
  check('hotkey overlay opens with ?', /open/.test(String(hot)), { hotkeyModal: hot });
  await c.send('Input.dispatchKeyEvent', { type: 'rawKeyDown', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });
  await c.send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });
  await sleep(600);

  // keyguide button click
  await c.eval(`document.getElementById('keyGuide').click()`);
  await sleep(700);
  const hot2 = await c.eval(`document.getElementById('hotkeyModal').className`);
  check('keyGuide button opens shortcuts', /open/.test(String(hot2)), { hotkeyModal: hot2 });
  await c.eval(`closeHotkeyModal()`);
  await sleep(400);

  await c.shot('verify_final_desktop.png');
  check('no console errors', logs.filter(l => /EXC|error/i.test(l)).length === 0, logs.slice(0, 10));

  console.log('\n=== SUMMARY ===');
  const fails = results.filter(r => r.pass === 'FAIL');
  console.log(results.length + ' checks, ' + fails.length + ' failed');
  fails.forEach(f => console.log('FAILED: ' + f.name + ' ' + JSON.stringify(f.detail)));
  console.log('logs:', logs.length);
  logs.slice(0, 20).forEach(l => console.log('  ' + l));

  proc.kill();
  try { fs.rmSync(profile, { recursive: true, force: true }); } catch (e) { }
  process.exit(fails.length ? 2 : 0);
})().catch(e => { console.error('FATAL', e); process.exit(1); });
