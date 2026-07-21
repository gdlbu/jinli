const { chromium } = require('playwright');
const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const MIME = { '.html':'text/html','.js':'text/javascript','.mjs':'text/javascript',
  '.json':'application/json','.glb':'model/gltf-binary','.hdr':'image/vnd.radiance',
  '.jpg':'image/jpeg','.png':'image/png','.svg':'image/svg+xml','.webmanifest':'application/manifest+json' };

const server = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]);
  if (p === '/') p = '/index.html';
  const fp = path.join(ROOT, p);
  if (!fp.startsWith(ROOT) || !fs.existsSync(fp) || fs.statSync(fp).isDirectory()) {
    res.writeHead(404); return res.end('404 ' + p);
  }
  res.writeHead(200, { 'Content-Type': MIME[path.extname(fp)] || 'application/octet-stream' });
  fs.createReadStream(fp).pipe(res);
});

(async () => {
  await new Promise(r => server.listen(0, r));
  const port = server.address().port;
  const url = `http://localhost:${port}/`;
  console.log('serving', url);

  const browser = await chromium.launch({
    args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']
  });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
  const errors = [], logs = [];
  page.on('console', m => logs.push(`[${m.type()}] ${m.text()}`));
  page.on('pageerror', e => errors.push('PAGEERROR: ' + e.message));
  page.on('requestfailed', r => errors.push('REQFAIL: ' + r.url() + ' ' + (r.failure()?.errorText||'')));

  await page.goto(url, { waitUntil: 'load', timeout: 30000 });

  // 等加载遮罩消失（body.ready）
  let ready = false;
  try { await page.waitForSelector('body.ready', { timeout: 60000 }); ready = true; } catch(e){}

  await page.waitForTimeout(2500);
  await page.screenshot({ path: 'shot-load.png', timeout: 120000 });

  // 判断 canvas 是否真的画了东西（非纯色）
  const canvasInfo = await page.evaluate(() => {
    const c = document.getElementById('scene');
    return { w: c.width, h: c.height, koi: window.__debugKoi || null };
  });

  // 点一下水面聚鱼
  await page.mouse.click(720, 520);
  await page.waitForTimeout(1500);
  await page.screenshot({ path: 'shot-ripple.png', timeout: 120000 });

  // 求好运
  await page.click('#seekBtn');
  await page.waitForTimeout(9000);
  const cardShown = await page.evaluate(() => document.getElementById('fmask').classList.contains('show'));
  const dbg = await page.evaluate(() => ({ seek: window.__seekCalled, block: window.__seekBlock,
    kois: (window.kois || []).length, landed: window.__landed, show: window.__showFortune, ferr: window.__fortuneErr }));
  await page.screenshot({ path: 'shot-fortune.png', timeout: 120000 });

  console.log('=== ready:', ready, '| canvas:', JSON.stringify(canvasInfo), '| card:', cardShown, '| dbg:', JSON.stringify(dbg));
  console.log('=== ERRORS ('+errors.length+') ==='); errors.forEach(e=>console.log(e));
  console.log('=== LOGS (tail) ==='); logs.slice(-14).forEach(l=>console.log(l));

  await browser.close();
  server.close();
  process.exit(errors.length && !ready ? 1 : 0);
})().catch(e => { console.error('HARNESS FAIL', e); process.exit(2); });
