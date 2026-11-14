// Full verification: desktop + mobile behaviour of the Kyoto portfolio.
const { spawn } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 9400 + Math.floor(Math.random() * 200);
const URL = (process.env.SITE_URL || 'http://127.0.0.1:5000/');
const SHOTS = 'D:/PROJECTS/portfolio-ink/screenshots';

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

class CDP {
  constructor(ws) { this.ws = ws; this.id = 0; this.pending = new Map(); this.handlers = new Map(); }
  static async connect(wsUrl) {
    const ws = new WebSocket(wsUrl);
    await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
    const c = new CDP(ws);
    ws.onmessage = (ev) => {
      const msg = JSON.parse(ev.data);
      if (msg.id && c.pending.has(msg.id)) {
        const { res, rej } = c.pending.get(msg.id); c.pending.delete(msg.id);
        msg.error ? rej(new Error(JSON.stringify(msg.error))) : res(msg.result);
      } else if (msg.method) (c.handlers.get(msg.method) || []).forEach(h => h(msg.params));
    };
    return c;
  }
  on(m, f) { if (!this.handlers.has(m)) this.handlers.set(m, []); this.handlers.get(m).push(f); }
  send(method, params = {}) {
    const id = ++this.id;
    return new Promise((res, rej) => {
      this.pending.set(id, { res, rej });
      this.ws.send(JSON.stringify({ id, method, params }));
      setTimeout(() => { if (this.pending.has(id)) { this.pending.delete(id); rej(new Error('timeout ' + method)); } }, 60000);
    });
  }
  async eval(expr) {
    const r = await this.send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true });
    if (r.exceptionDetails) return { __error: r.exceptionDetails.text + ' ' + ((r.exceptionDetails.exception && r.exceptionDetails.exception.description) || '') };
    return r.result.value;
  }
  async shot(file) {
    const s = await this.send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(SHOTS, file), Buffer.from(s.data, 'base64'));
  }
}

(async () => {
  const profile = path.join(os.tmpdir(), 'cdp-verify-' + PORT);
  const proc = spawn(CHROME, ['--headless=new', `--remote-debugging-port=${PORT}`, `--user-data-dir=${profile}`,
    '--window-size=1600,900', '--no-first-run', '--no-default-browser-check',
    '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--autoplay-policy=no-user-gesture-required', '--hide-scrollbars', 'about:blank'],
    { stdio: 'ignore' });

  let targets = null;
  for (let i = 0; i < 40; i++) { await sleep(500); try { targets = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json(); if (targets.length) break; } catch (e) { } }
  const c = await CDP.connect((targets.find(t => t.type === 'page') || targets[0]).webSocketDebuggerUrl);
  const logs = [];
  await c.send('Runtime.enable'); await c.send('Log.enable'); await c.send('Network.enable'); await c.send('Page.enable');
  c.on('Runtime.consoleAPICalled', p => logs.push('[' + p.type + '] ' + p.args.map(a => a.value !== undefined ? a.value : (a.description || a.type)).join(' ')));
  c.on('Runtime.exceptionThrown', p => logs.push('[PAGEERROR] ' + ((p.exceptionDetails && p.exceptionDetails.exception && p.exceptionDetails.exception.description) || p.exceptionDetails.text)));
  c.on('Log.entryAdded', p => { if (p.entry.level === 'error') logs.push('[log:error] ' + p.entry.text); });
  c.on('Network.loadingFailed', p => logs.push('[REQFAIL] ' + p.errorText));

  // ---------- DESKTOP ----------
  await c.send('Page.navigate', { url: URL });
  await sleep(11000);

  const desk = await c.eval(`(() => {
    const g = document.getElementById('mobileSwipeGuide');
    const cs = getComputedStyle(g);
    const canvas = document.getElementById('gl');
    const houses = (typeof PROJECT_HOUSES !== 'undefined') ? PROJECT_HOUSES.length : -1;
    return {
      guideDisplay: cs.display, guideVis: cs.visibility, guideOpacity: cs.opacity,
      guideClass: g.className,
      canvas: canvas.width + 'x' + canvas.height,
      houses,
      projects: (typeof PROJECTS !== 'undefined') ? PROJECTS.length : -1,
      progress: (typeof currentProgress !== 'undefined') ? +currentProgress.toFixed(2) : -1,
      fns: ['jumpTo','openModal','closeModal','flyToProject','initMobileSwipeGuide'].map(f => f + ':' + (typeof window[f])),
      navLinks: document.querySelectorAll('#nav a, nav a, .nav-link').length,
      railBtns: document.querySelectorAll('.rail-btn').length,
      stepDots: document.querySelectorAll('.step-dot').length,
      plates: document.querySelectorAll('.project-showcase-plate').length,
      contactLinks: document.querySelectorAll('.contact-link').length
    };
  })()`);
  console.log('=== DESKTOP STATE ===');
  console.log(JSON.stringify(desk, null, 2));
  await c.shot('verify_desktop_hero.png');

  // rail button click
  const railRes = await c.eval(`(() => {
    const btns = document.querySelectorAll('.rail-btn');
    btns[3].click();
    return 'clicked ' + btns[3].getAttribute('aria-label');
  })()`);
  await sleep(2500);
  const afterRail = await c.eval(`({ progress: +currentProgress.toFixed(2), target: +targetProgress.toFixed(2) })`);
  console.log('rail:', railRes, '=>', JSON.stringify(afterRail));
  await c.shot('verify_desktop_rail3.png');

  // modal open via plate
  const modalRes = await c.eval(`(() => {
    openModal(0);
    const m = document.getElementById('dossierModal');
    const inner = document.getElementById('modal');
    return { dossierOpen: m ? m.className : 'missing', modalOpen: inner ? inner.className : 'missing',
             title: (document.querySelector('#modal h2, #dossierModal h2, .m-title') || {}).textContent };
  })()`);
  console.log('modal:', JSON.stringify(modalRes));
  await sleep(1200);
  await c.shot('verify_desktop_modal.png');
  await c.eval(`(function(){ try { closeModal(); } catch(e) { return 'no closeModal'; } })()`);
  await sleep(600);

  // nav link click
  const navRes = await c.eval(`(() => {
    const links = Array.from(document.querySelectorAll('a')).filter(a => /WORK|ABOUT|CONTACT/i.test(a.textContent || ''));
    if (!links.length) return 'no nav links';
    links[0].click();
    return 'clicked ' + links[0].textContent.trim().slice(0, 30);
  })()`);
  await sleep(2500);
  const navAfter = await c.eval(`({ progress: +currentProgress.toFixed(2) })`);
  console.log('nav:', navRes, '=>', JSON.stringify(navAfter));
  await c.shot('verify_desktop_nav.png');

  console.log('=== DESKTOP LOGS (' + logs.length + ') ===');
  console.log(logs.slice(0, 40).join('\n'));

  // ---------- MOBILE ----------
  logs.length = 0;
  await c.send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
  await c.send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
  await c.send('Emulation.setUserAgentOverride', {
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
    platform: 'iPhone'
  });
  await c.send('Network.clearBrowserCache');
  await c.send('Page.navigate', { url: (process.env.SITE_URL || 'http://127.0.0.1:5000/') + '?mobiletest=1' });
  for (let i = 0; i < 14; i++) {
    await sleep(800);
    const s = await c.eval(`(() => { const g=document.getElementById('mobileSwipeGuide'); return g ? g.className + '|' + getComputedStyle(g).display + '|ls=' + localStorage.getItem('kage_seen_swipe_guide') : 'none'; })()`);
    console.log('mobile poll ' + (i * 0.8) + 's:', s);
    if (typeof s === 'string' && s.indexOf('show') > -1) break;
  }
  await sleep(2000);

  const mob = await c.eval(`(() => {
    const g = document.getElementById('mobileSwipeGuide');
    const cs = getComputedStyle(g);
    const canvas = document.getElementById('gl');
    return {
      ua: navigator.userAgent.slice(0, 60),
      w: innerWidth,
      ls: localStorage.getItem('kage_seen_swipe_guide'),
      lsKeys: JSON.stringify(Object.keys(localStorage)),
      guideClass: g.className, guideDisplay: cs.display, guideVis: cs.visibility,
      canvas: canvas.width + 'x' + canvas.height,
      houses: (typeof PROJECT_HOUSES !== 'undefined') ? PROJECT_HOUSES.length : -1,
      projects: (typeof PROJECTS !== 'undefined') ? PROJECTS.length : -1,
      progress: (typeof currentProgress !== 'undefined') ? +currentProgress.toFixed(2) : -1
    };
  })()`);
  console.log('=== MOBILE STATE ===');
  console.log(JSON.stringify(mob, null, 2));
  await c.shot('verify_mobile_hero.png');

  // close guide + swipe
  const mobActions = await c.eval(`(() => {
    const out = {};
    if (typeof closeMobileSwipeGuide === 'function') closeMobileSwipeGuide();
    out.guideAfterClose = document.getElementById('mobileSwipeGuide').className;
    return out;
  })()`);
  await sleep(800);
  await c.shot('verify_mobile_after_close.png');

  // simulate swipe up via touch events
  const swipe = await c.eval(`(() => {
    const before = +targetProgress.toFixed(2);
    const mk = (type, y) => {
      const t = new Touch({ identifier: 1, target: document.body, clientX: 195, clientY: y });
      return new TouchEvent(type, { touches: type === 'touchend' ? [] : [t], changedTouches: [t], bubbles: true, cancelable: true });
    };
    window.dispatchEvent(mk('touchstart', 600));
    window.dispatchEvent(mk('touchmove', 480));
    window.dispatchEvent(mk('touchend', 480));
    return { before, after: +targetProgress.toFixed(2) };
  })()`);
  await sleep(1800);
  const swipeAfter = await c.eval(`({ progress: +currentProgress.toFixed(2), target: +targetProgress.toFixed(2) })`);
  console.log('swipe:', JSON.stringify(swipe), '=> after 1.8s', JSON.stringify(swipeAfter));
  await c.shot('verify_mobile_swiped.png');

  console.log('=== MOBILE LOGS (' + logs.length + ') ===');
  console.log(logs.slice(0, 40).join('\n'));

  proc.kill();
  try { fs.rmSync(profile, { recursive: true, force: true }); } catch (e) { }
  process.exit(0);
})().catch(e => { console.error('FATAL', e); process.exit(1); });
