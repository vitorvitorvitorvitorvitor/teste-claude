// Renders the scene frame by frame in headless Chromium and encodes a 9:16 MP4.
// usage: node render.mjs            -> full video (out/sol-1-segundo.mp4)
//        node render.mjs --stills 0,8,16  -> preview stills in out/
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)('playwright');

const ROOT = path.dirname(new URL(import.meta.url).pathname);
const FPS = 30, DUR = 30;
const types = { '.html': 'text/html', '.js': 'text/javascript', '.ttf': 'font/ttf' };
const server = http.createServer((req, res) => {
  const f = path.join(ROOT, decodeURIComponent(req.url.split('?')[0]));
  if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'content-type': types[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(res);
}).listen(0);
const port = server.address().port;
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') console.log('[page]', m.text()); });
page.on('pageerror', (e) => console.log('[pageerror]', e.message));
await page.goto(`http://localhost:${port}/index.html`);
await page.waitForFunction(() => window.sceneReady === true, null, { timeout: 120000 });
fs.mkdirSync(path.join(ROOT, 'out'), { recursive: true });

const stillsArg = process.argv.indexOf('--stills');
if (stillsArg > 0) {
  for (const t of process.argv[stillsArg + 1].split(',').map(Number)) {
    const t0 = Date.now();
    await page.evaluate((t) => window.renderAt(t), t);
    await page.screenshot({ path: path.join(ROOT, 'out', `still_${String(t).replace('.', '_')}.jpg`), type: 'jpeg', quality: 90 });
    console.log('still', t, Date.now() - t0, 'ms');
  }
} else {
  const dir = path.join(ROOT, 'frames'); fs.rmSync(dir, { recursive: true, force: true }); fs.mkdirSync(dir);
  const N = FPS * DUR, t0 = Date.now();
  for (let i = 0; i < N; i++) {
    await page.evaluate((t) => window.renderAt(t), i / FPS);
    await page.screenshot({ path: path.join(dir, `f${String(i).padStart(4, '0')}.jpg`), type: 'jpeg', quality: 94 });
    if (i % 30 === 0) console.log(`frame ${i}/${N}  ${((Date.now() - t0) / 1000).toFixed(0)}s`);
  }
  execFileSync('python3', [path.join(ROOT, 'soundtrack.py'), path.join(ROOT, 'out', 'soundtrack.wav')], { stdio: 'inherit' });
  execFileSync('ffmpeg', ['-y', '-framerate', String(FPS), '-i', path.join(dir, 'f%04d.jpg'), '-i', path.join(ROOT, 'out', 'soundtrack.wav'),
    '-c:v', 'libx264', '-preset', 'slow', '-crf', '18', '-pix_fmt', 'yuv420p', '-profile:v', 'high', '-movflags', '+faststart',
    '-c:a', 'aac', '-b:a', '192k', '-shortest', path.join(ROOT, 'out', 'sol-1-segundo.mp4')], { stdio: 'inherit' });
}
await browser.close(); server.close();
