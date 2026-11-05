// "E se o Sol sumisse por 1 segundo?" — Technicolor 3D stage set, 9:16, 30 s.
// Deterministic: window.renderAt(t) draws the frame at video time t (seconds).
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

await document.fonts.load('78px Abril'); await document.fonts.load('30px Oswald');
const W = 1080, H = 1920;
const STREET = 7;          // facade line (|x|)
const FLOOR = 3.3;

// ---------- utilities ----------
function mulberry32(a) { return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const rng = mulberry32(19601);
const R = (a, b) => a + (b - a) * rng();
const pick = (arr) => arr[Math.floor(rng() * arr.length)];
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
const lerp = (a, b, t) => a + (b - a) * t;
const ease = (t) => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
const deg = Math.PI / 180;

// ---------- painted textures ----------
function canvas(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
function jit(hex, amt) {
  const c = new THREE.Color(hex); const k = 1 + (rng() - .5) * amt;
  return `rgb(${clamp(c.r * 255 * k, 0, 255) | 0},${clamp(c.g * 255 * k * (1 + (rng() - .5) * .06), 0, 255) | 0},${clamp(c.b * 255 * k, 0, 255) | 0})`;
}
function speckle(ctx, w, h, n, alpha) {
  for (let i = 0; i < n; i++) {
    ctx.fillStyle = rng() < .5 ? `rgba(0,0,0,${alpha * rng()})` : `rgba(255,240,210,${alpha * rng()})`;
    const s = 1 + rng() * 2.5; ctx.fillRect(rng() * w, rng() * h, s, s);
  }
}
function toTex(c, srgb = true) {
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 8;
  if (srgb) t.colorSpace = THREE.SRGBColorSpace; return t;
}
function drawBricks(ctx, bctx, x0, y0, w, h, colors, mortar, bw = 64, bh = 26) {
  ctx.fillStyle = mortar; ctx.fillRect(x0, y0, w, h);
  bctx.fillStyle = '#303030'; bctx.fillRect(x0, y0, w, h);
  for (let r = 0, y = y0; y < y0 + h; r++, y += bh) {
    const off = (r % 2) * bw / 2;
    for (let x = x0 - off; x < x0 + w; x += bw) {
      ctx.fillStyle = jit(pick(colors), .28);
      ctx.fillRect(x + 2, y + 2, bw - 4, bh - 4);
      const g = 150 + rng() * 80 | 0; bctx.fillStyle = `rgb(${g},${g},${g})`; bctx.fillRect(x + 2, y + 2, bw - 4, bh - 4);
      if (rng() < .12) { ctx.fillStyle = 'rgba(0,0,0,.18)'; ctx.fillRect(x + 2 + rng() * bw * .6, y + 2, bw * .3, bh - 4); }
      if (rng() < .1) { ctx.fillStyle = 'rgba(255,230,190,.12)'; ctx.fillRect(x + 2, y + 2, bw - 4, 4); }
    }
  }
}
function brickTex(colors, mortar) {
  const c = canvas(512, 512), b = canvas(512, 512), ctx = c.getContext('2d'), bctx = b.getContext('2d');
  drawBricks(ctx, bctx, 0, 0, 512, 520, colors, mortar);
  speckle(ctx, 512, 512, 5000, .25); speckle(bctx, 512, 512, 3000, .4);
  return { map: toTex(c), bump: toTex(b, false) };
}
function plasterTex(base, brickColors) {
  const c = canvas(512, 512), b = canvas(512, 512), ctx = c.getContext('2d'), bctx = b.getContext('2d');
  ctx.fillStyle = base; ctx.fillRect(0, 0, 512, 512); bctx.fillStyle = '#9a9a9a'; bctx.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 260; i++) {
    const x = rng() * 512, y = rng() * 512, r = 10 + rng() * 60;
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    const light = rng() < .5; g.addColorStop(0, light ? 'rgba(255,245,220,.10)' : 'rgba(70,30,10,.10)'); g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g; ctx.fillRect(x - r, y - r, 2 * r, 2 * r);
  }
  // patches of fallen plaster revealing brick
  for (let p = 0; p < 3; p++) {
    const cx = 60 + rng() * 390, cy = 60 + rng() * 390, rx = 30 + rng() * 45, ry = 20 + rng() * 30;
    for (const [cc, isB] of [[ctx, false], [bctx, true]]) {
      cc.save(); cc.beginPath();
      for (let a = 0; a < Math.PI * 2; a += .4) { const k = .7 + rng() * .4; cc.lineTo(cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k); }
      cc.closePath(); cc.clip();
      if (!isB) drawBricks(cc, bctx, cx - 90, cy - 60, 180, 120, brickColors, '#6e5a48', 40, 16); else { cc.fillStyle = '#505050'; cc.fill(); }
      cc.restore();
    }
  }
  // hairline cracks
  ctx.strokeStyle = 'rgba(60,25,10,.45)'; bctx.strokeStyle = '#303030'; ctx.lineWidth = bctx.lineWidth = 1.3;
  for (let i = 0; i < 7; i++) {
    let x = rng() * 512, y = rng() * 512; ctx.beginPath(); bctx.beginPath(); ctx.moveTo(x, y); bctx.moveTo(x, y);
    for (let s = 0; s < 8; s++) { x += (rng() - .5) * 30; y += 6 + rng() * 14; ctx.lineTo(x, y); bctx.lineTo(x, y); }
    ctx.stroke(); bctx.stroke();
  }
  speckle(ctx, 512, 512, 9000, .2); speckle(bctx, 512, 512, 9000, .5);
  return { map: toTex(c), bump: toTex(b, false) };
}
function cobbleTex() {
  const c = canvas(512, 512), b = canvas(512, 512), ctx = c.getContext('2d'), bctx = b.getContext('2d');
  ctx.fillStyle = '#3a2a22'; ctx.fillRect(0, 0, 512, 512); bctx.fillStyle = '#202020'; bctx.fillRect(0, 0, 512, 512);
  for (let r = 0; r < 16; r++) for (let k = 0; k < 11; k++) {
    const x = k * 48 + (r % 2) * 24 + (rng() - .5) * 4, y = r * 32 + (rng() - .5) * 3;
    ctx.fillStyle = jit(pick(['#a68a70', '#957660', '#b39478', '#8a6e5a']), .25);
    rr(ctx, x + 3, y + 3, 42, 26, 9); ctx.fill();
    const g = 140 + rng() * 90 | 0; bctx.fillStyle = `rgb(${g},${g},${g})`; rr(bctx, x + 3, y + 3, 42, 26, 9); bctx.fill();
    ctx.fillStyle = 'rgba(255,235,200,.12)'; rr(ctx, x + 6, y + 5, 30, 8, 4); ctx.fill();
  }
  speckle(ctx, 512, 512, 6000, .25);
  return { map: toTex(c), bump: toTex(b, false) };
}
function rr(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); }
function slabTex(base) {
  const c = canvas(256, 256), ctx = c.getContext('2d'); ctx.fillStyle = '#4a3a30'; ctx.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) { ctx.fillStyle = jit(base, .12); ctx.fillRect(i * 128 + 2, j * 128 + 2, 124, 124); }
  speckle(ctx, 256, 256, 3000, .3); return { map: toTex(c) };
}
function plankTex(base) {
  const c = canvas(256, 256), ctx = c.getContext('2d');
  for (let i = 0; i < 8; i++) { ctx.fillStyle = jit(base, .25); ctx.fillRect(i * 32, 0, 30, 256); ctx.fillStyle = 'rgba(0,0,0,.5)'; ctx.fillRect(i * 32 + 30, 0, 2, 256); }
  ctx.fillStyle = 'rgba(30,15,5,.6)'; for (let y = 40; y < 256; y += 90) ctx.fillRect(0, y, 256, 5);
  speckle(ctx, 256, 256, 2500, .3); return { map: toTex(c) };
}
function stripeTex(a, b) {
  const c = canvas(256, 64), ctx = c.getContext('2d');
  for (let i = 0; i < 8; i++) { ctx.fillStyle = i % 2 ? a : b; ctx.fillRect(i * 32, 0, 32, 64); }
  speckle(ctx, 256, 64, 800, .15); return { map: toTex(c) };
}
function signTex(text, bg, fg) {
  const c = canvas(512, 128), ctx = c.getContext('2d');
  ctx.fillStyle = bg; ctx.fillRect(0, 0, 512, 128); ctx.strokeStyle = fg; ctx.lineWidth = 6; ctx.strokeRect(10, 10, 492, 108);
  ctx.fillStyle = fg; ctx.font = '78px Abril'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(text, 256, 70);
  speckle(ctx, 512, 128, 1500, .2);
  const t = toTex(c); t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping; return t;
}

// ---------- renderer / scene ----------
const renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('c'), antialias: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(1); renderer.setSize(W, H, false);
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.NoToneMapping;
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(62, W / H, 0.1, 2500);
const HAZE_DAY = new THREE.Color('#e88a4c'), HAZE_NIGHT = new THREE.Color('#0a0c18');
scene.fog = new THREE.Fog(HAZE_DAY.clone(), 45, 330);

// materials
const brickColorsDark = ['#5a2219', '#4b1c16', '#682a1e', '#3f1913'];
const brickColorsRed = ['#8a3424', '#7a2c1f', '#96402a', '#6e271c'];
const brickDark = brickTex(brickColorsDark, '#5a4a3e');
const brickRed = brickTex(brickColorsRed, '#806a58');
const plasterOchre = plasterTex('#c49558', brickColorsRed);
const plasterCream = plasterTex('#d9c39a', brickColorsRed);
const plasterTeal = plasterTex('#4f7f78', brickColorsDark);
const cobble = cobbleTex(), slab = slabTex('#8c7764'), plank = plankTex('#6b4a32'), tar = slabTex('#3a2c26');
const stdMat = (o) => new THREE.MeshStandardMaterial({ roughness: .85, metalness: 0, ...o });
const wallMats = {
  brickDark: stdMat({ map: brickDark.map, bumpMap: brickDark.bump, bumpScale: 1.0 }),
  brickRed: stdMat({ map: brickRed.map, bumpMap: brickRed.bump, bumpScale: 1.0 }),
  ochre: stdMat({ map: plasterOchre.map, bumpMap: plasterOchre.bump, bumpScale: .8 }),
  cream: stdMat({ map: plasterCream.map, bumpMap: plasterCream.bump, bumpScale: .8 }),
  teal: stdMat({ map: plasterTeal.map, bumpMap: plasterTeal.bump, bumpScale: .8 }),
};
const M = {
  trim: stdMat({ map: plasterCream.map, color: '#f3e6cc' }),
  stone: stdMat({ map: slab.map, color: '#c9b49a' }),
  winDark: stdMat({ color: '#170d0b', roughness: .25 }),
  winLit: stdMat({ color: '#3a2410', emissive: new THREE.Color('#ffc66b'), emissiveIntensity: .55, roughness: .4 }),
  shutterG: stdMat({ map: plank.map, color: '#5f9a7e' }),
  shutterB: stdMat({ map: plank.map, color: '#4f78a0' }),
  iron: stdMat({ color: '#241a17', roughness: .6, metalness: .3 }),
  wood: stdMat({ map: plank.map }),
  door: stdMat({ map: plank.map, color: '#7a4a35' }),
  roof: stdMat({ map: tar.map }),
  street: stdMat({ map: cobble.map, bumpMap: cobble.bump, bumpScale: .8, color: '#ffe2c8' }),
  walk: stdMat({ map: slab.map }),
  red: stdMat({ color: '#9b1f1a' }),
  green: stdMat({ color: '#2f6a3a' }),
  flower: stdMat({ color: '#d8304a' }),
  rope: stdMat({ color: '#2a201c', roughness: .9 }),
};
const awningMats = [stripeTex('#f1e2c4', '#a3261a'), stripeTex('#f1e2c4', '#2f6f6a'), stripeTex('#f1e2c4', '#2c4f86')]
  .map((s) => stdMat({ map: s.map, side: THREE.DoubleSide }));
const clothMats = ['#f4ecdc', '#3f8f8a', '#e5b53c', '#b8282c', '#2f5aa0', '#f4ecdc'].map((c) => stdMat({ color: c, side: THREE.DoubleSide }));

// geometry batches merged per material
const batches = new Map();
function add(mat, geo) { if (!batches.has(mat)) batches.set(mat, []); batches.get(mat).push(geo); }
const TILE = 3.0;
function box(mat, w, h, d, x, y, z, rot = null, tile = TILE) {
  const g = new THREE.BoxGeometry(w, h, d); const uv = g.attributes.uv;
  const dims = [[d, h], [d, h], [w, d], [w, d], [w, h], [w, h]];
  for (let f = 0; f < 6; f++) for (let k = 0; k < 4; k++) { const i = f * 4 + k; uv.setXY(i, uv.getX(i) * dims[f][0] / tile, uv.getY(i) * dims[f][1] / tile); }
  if (rot) g.applyMatrix4(new THREE.Matrix4().makeRotationFromEuler(rot));
  g.translate(x, y, z); add(mat, g); return g;
}
function cyl(mat, r1, r2, h, x, y, z, seg = 12, rot = null) {
  const g = new THREE.CylinderGeometry(r1, r2, h, seg);
  if (rot) g.applyMatrix4(new THREE.Matrix4().makeRotationFromEuler(rot));
  g.translate(x, y, z); add(mat, g);
}
// rod between two points
function rod(mat, a, b, r = .03, seg = 6) {
  const dir = new THREE.Vector3().subVectors(b, a), len = dir.length();
  const g = new THREE.CylinderGeometry(r, r, len, seg);
  g.applyMatrix4(new THREE.Matrix4().makeRotationFromQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize())));
  g.translate((a.x + b.x) / 2, (a.y + b.y) / 2, (a.z + b.z) / 2); add(mat, g);
}

// ---------- the street ----------
const ground = new THREE.Mesh(new THREE.PlaneGeometry(60, 900), M.street);
ground.rotation.x = -Math.PI / 2; ground.position.set(0, 0, -300); ground.receiveShadow = true;
M.street.map.repeat.set(60 / 3, 900 / 3); M.street.bumpMap.repeat.copy(M.street.map.repeat);
scene.add(ground);
const far = new THREE.Mesh(new THREE.PlaneGeometry(2000, 1200), stdMat({ color: '#5a3426' }));
far.rotation.x = -Math.PI / 2; far.position.set(0, -0.05, -500); far.receiveShadow = true; scene.add(far);

for (const s of [-1, 1]) {
  box(M.walk, 2.4, .2, 150, s * (STREET - 1.2), .1, -10, null, 2);
  box(M.stone, .25, .24, 150, s * (STREET - 2.4), .12, -10, null, 1.5); // curb
}

function building(side, z0, len, height, wallKey, opts) {
  const fx = side * STREET;                       // facade plane
  const X = (off) => side * (STREET - off);        // offset toward street
  const zc = z0 - len / 2;
  const depth = 12;
  box(wallMats[wallKey], depth, height, len, side * (STREET + depth / 2), height / 2, zc);
  box(M.roof, depth - .2, .08, len - .2, side * (STREET + depth / 2), height + .04, zc);
  const trim = wallKey.startsWith('brick') ? M.trim : (rng() < .5 ? M.stone : M.trim);
  // pilasters at the edges
  for (const zz of [z0 - .3, z0 - len + .3]) box(trim, .3, height, .55, X(.15), height / 2, zz);
  // string courses + cornice + parapet
  const floors = Math.floor(height / FLOOR);
  for (let i = 1; i < floors; i++) box(trim, .18, .16, len, X(.09), i * FLOOR, zc);
  box(trim, .6, .35, len + .3, X(.3), height - .2, zc);
  box(trim, .35, .2, len + .2, X(.18), height - .5, zc);
  for (let z = z0 - .5; z > z0 - len + .4; z -= .7) box(trim, .4, .22, .16, X(.2), height - .55, z);
  box(wallMats[wallKey], .3, .9, len, X(-.15), height + .45, zc);
  box(trim, .45, .1, len + .1, X(-.15), height + .95, zc);

  // window grid
  const cols = Math.max(2, Math.floor((len - 1.4) / 2.5));
  const step = (len - 1.4) / cols;
  const shutter = rng() < .55 ? pick([M.shutterG, M.shutterB]) : null;
  const balconyFloor = rng() < .5 ? 2 + Math.floor(rng() * Math.max(1, floors - 3)) : -1;
  const fireCol = opts.fireEscape ? Math.floor(cols / 2) : -1;
  for (let i = 1; i < floors; i++) {
    for (let c = 0; c < cols; c++) {
      const z = z0 - .7 - step * (c + .5), y = i * FLOOR + 1.55, ww = 1.05, wh = 1.75;
      const lit = rng() < .14;
      box(lit ? M.winLit : M.winDark, .06, wh, ww, X(.03), y, z);
      box(trim, .1, .1, ww, X(.07), y, z);                      // transom bar
      box(trim, .1, wh, .06, X(.07), y, z);                     // mullion
      for (const dz of [-1, 1]) box(trim, .14, wh + .2, .12, X(.07), y, z + dz * (ww / 2 + .06));
      box(trim, .3, .12, ww + .45, X(.15), y - wh / 2 - .08, z);             // sill
      box(trim, .2, .24, ww + .4, X(.1), y + wh / 2 + .14, z);               // hood
      box(trim, .12, .1, ww + .6, X(.22), y + wh / 2 + .3, z);
      if (shutter && c !== fireCol) for (const dz of [-1, 1]) {
        box(shutter, .06, wh, .5, X(.05), y, z + dz * (ww / 2 + .4));
        for (let k = -2; k <= 2; k++) box(shutter, .08, .04, .48, X(.07), y + k * .3, z + dz * (ww / 2 + .4));
      }
      if (rng() < .22 && i !== balconyFloor) {
        box(M.green, .3, .25, ww + .1, X(.32), y - wh / 2 - .28, z);
        for (let k = 0; k < 6; k++) box(rng() < .6 ? M.flower : M.green, .14, .14, .14, X(.32 + (rng() - .5) * .15), y - wh / 2 - .1, z + (k - 2.5) * .19);
      }
    }
    if (i === balconyFloor && fireCol < 0) {
      const bl = Math.min(len - 2, 3 * step), bz = zc;
      box(M.stone, 1.1, .16, bl, X(.55), i * FLOOR + .6, bz);
      for (let k = -1; k <= 1; k += 2) box(M.stone, .5, .3, .2, X(.25), i * FLOOR + .35, bz + k * bl / 2.4);
      box(M.iron, .06, .06, bl, X(1.05), i * FLOOR + 1.6, bz);
      box(M.iron, .05, .05, bl, X(1.05), i * FLOOR + .75, bz);
      for (let k = 0; k <= bl / .16; k++) box(M.iron, .03, .9, .03, X(1.05), i * FLOOR + 1.15, bz - bl / 2 + k * .16);
      for (const k of [-1, 1]) box(M.iron, 1.1, .06, .06, X(.55), i * FLOOR + 1.6, bz + k * bl / 2);
      opts.balconies?.push({ x: X(.6), y: i * FLOOR + .68, z: bz, side });
    }
  }
  // fire escape
  if (fireCol >= 0) {
    const fz = z0 - .7 - step * (fireCol + .5), fl = 3.4;
    for (let i = 1; i < floors; i++) {
      const y = i * FLOOR + .55;
      box(M.iron, 1.2, .05, fl, X(.6), y, fz);
      for (let k = 0; k < 12; k++) box(M.iron, 1.2, .03, .03, X(.6), y + .03, fz - fl / 2 + k * fl / 11);
      box(M.iron, .05, .05, fl, X(1.2), y + 1.0, fz); box(M.iron, .05, .05, fl, X(1.2), y + .5, fz);
      for (let k = 0; k <= 14; k++) box(M.iron, .03, 1.0, .03, X(1.2), y + .5, fz - fl / 2 + k * fl / 14);
      for (const k of [-1, 1]) box(M.iron, 1.2, .05, .05, X(.6), y + 1.0, fz + k * fl / 2);
      for (const k of [-1, 1]) box(M.iron, .3, .05, .05, X(.15), y - .2, fz + k * (fl / 2 - .2));
      // ladder to the next platform (or dropped ladder to street)
      const lz = fz + (i % 2 ? 1 : -1) * (fl / 2 - .35);
      const y0 = i === 1 ? 2.2 : y - FLOOR, y1 = y + 1.0;
      for (const dz of [-.22, .22]) box(M.iron, .05, y1 - y0, .05, X(.9), (y0 + y1) / 2, lz + dz);
      for (let yy = y0 + .15; yy < y1; yy += .3) box(M.iron, .04, .04, .44, X(.9), yy, lz);
    }
  }
  // ground floor shopfront
  const shopL = len * R(.45, .62), sz = z0 - .6 - shopL / 2 - R(0, len - shopL - 1.2);
  box(M.winDark, .06, 2.4, shopL, X(.03), 1.45, sz);
  if (rng() < .5) box(M.winLit, .05, 2.2, shopL * .4, X(.06), 1.45, sz + shopL * .2);
  for (let k = 0; k <= 4; k++) box(M.wood, .14, 2.6, .12, X(.08), 1.45, sz - shopL / 2 + k * shopL / 4);
  box(M.wood, .16, .14, shopL + .3, X(.08), 2.8, sz);
  box(M.wood, .3, .45, shopL + .3, X(.15), .25, sz);
  const aw = pick(awningMats);
  box(aw, 1.8, .06, shopL + .4, X(.9), 3.25, sz, new THREE.Euler(0, 0, side * 16 * deg), 1.5);
  box(aw, .04, .35, shopL + .4, X(1.75), 2.85, sz, null, 1.5);
  for (const k of [-1, 1]) rod(M.iron, new THREE.Vector3(X(0), 3.6, sz + k * shopL / 2), new THREE.Vector3(X(1.75), 3.0, sz + k * shopL / 2), .025);
  if (opts.sign) {
    const sm = new THREE.Mesh(new THREE.PlaneGeometry(shopL * .8, shopL * .8 / 4), stdMat({ map: signTex(opts.sign, pick(['#1f3d3a', '#2a1b3d', '#3a1712']), '#f2d79a') }));
    sm.position.set(X(.2), 3.95, sz); sm.rotation.y = -side * Math.PI / 2; sm.receiveShadow = true; scene.add(sm);
    box(M.wood, .12, .42 * shopL * .8 / 1.6 + .1, shopL * .8 + .2, X(.12), 3.95, sz);
  }
  // door + stoop
  const dz = z0 - len + 1.2 + (rng() < .5 ? 0 : -0);
  box(M.door, .1, 2.4, 1.1, X(.05), 1.2 + .3, dz);
  box(trim, .2, .2, 1.5, X(.1), 2.85, dz);
  box(M.stone, .5, .15, 1.6, X(.25), .27, dz); box(M.stone, .9, .15, 1.6, X(.45), .12, dz);
  // rooftop props
  const rx = side * (STREET + R(3, 8)), rz = zc + R(-len / 3, len / 3);
  if (opts.tower) {
    const tx = side * (STREET + 4.5), tz = zc;
    for (const [dx, dz2] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) box(M.iron, .15, 3, .15, tx + dx * 1.1, height + 1.5, tz + dz2 * 1.1);
    for (const h of [1.2, 2.5]) { box(M.iron, 2.4, .08, .08, tx, height + h, tz - 1.1); box(M.iron, 2.4, .08, .08, tx, height + h, tz + 1.1); box(M.iron, .08, .08, 2.4, tx - 1.1, height + h, tz); box(M.iron, .08, .08, 2.4, tx + 1.1, height + h, tz); }
    cyl(M.wood, 1.65, 1.65, 3.2, tx, height + 4.6, tz, 20);
    for (const h of [3.4, 4.6, 5.8]) cyl(M.iron, 1.69, 1.69, .08, tx, height + h, tz, 20);
    cyl(M.roof, .1, 1.85, 1.1, tx, height + 6.75, tz, 20);
  }
  for (let k = 0; k < 2; k++) {
    const cx = side * (STREET + R(2, 10)), cz = zc + R(-len / 2.5, len / 2.5), ch = R(1.4, 2.6);
    box(wallMats.brickRed, .7, ch, .9, cx, height + ch / 2, cz);
    box(M.stone, .9, .15, 1.1, cx, height + ch, cz);
    cyl(M.iron, .12, .12, .5, cx, height + ch + .3, cz);
  }
  if (rng() < .7) {   // TV antenna
    const ah = R(3, 4.5); cyl(M.iron, .04, .04, ah, rx, height + ah / 2, rz, 6);
    for (let k = 0; k < 3; k++) box(M.iron, .04, .04, 1.6 - k * .35, rx, height + ah - k * .4, rz);
  }
  return { fx, height };
}

const signs = ['PADARIA', 'CINE ODEON', 'BAR', 'HOTEL', 'FARMÁCIA', 'ALFAIATE', 'BARBEARIA', 'MERCEARIA', 'CAFÉ'];
const balconies = [];
const heights = { '-1': [], '1': [] };
for (const side of [-1, 1]) {
  let z = 62;
  let n = 0;
  while (z > -78) {
    const len = R(9, 15);
    let h = FLOOR * Math.floor(R(4, 8)) + R(.4, 1.2);
    const nearStart = z > 20;
    if (nearStart) h = side < 0 ? FLOOR * 6 + .8 : FLOOR * 7 + .8;
    const key = nearStart ? 'brickDark' : pick(['brickDark', 'brickRed', 'ochre', 'cream', 'teal', 'brickRed']);
    const b = building(side, z, len, h, key, { fireEscape: rng() < .4, tower: rng() < .35 || (side < 0 && n === 3), sign: rng() < .7 ? pick(signs) : null, balconies });
    heights[side].push({ z0: z, z1: z - len, h });
    z -= len; n++;
  }
}

// lamp posts, hydrants, crates, ladder
for (const s of [-1, 1]) for (let z = 30 - (s > 0 ? 7 : 0); z > -75; z -= 14) {
  const x = s * (STREET - 2.2);
  cyl(M.iron, .2, .26, .5, x, .45, z); cyl(M.iron, .07, .09, 4.2, x, 2.6, z, 8);
  for (let k = 0; k < 3; k++) cyl(M.iron, .1, .1, .06, x, 1 + k * .9, z, 8);
  box(M.iron, .06, .06, .9, x, 4.6, z + .3); box(M.iron, .38, .5, .38, x, 4.4, z + .7);
  box(M.winLit, .3, .38, .3, x, 4.4, z + .7); cyl(M.iron, .02, .28, .25, x, 4.75, z + .7, 4);
}
for (const [x, z] of [[5.3, -3], [-5.3, -24], [5.3, -40]]) {
  cyl(M.red, .17, .2, .6, x, .5, z, 10); cyl(M.red, .19, .19, .1, x, .82, z, 10); cyl(M.red, .05, .12, .18, x, .95, z, 10);
  cyl(M.red, .07, .07, .5, x, .6, z, 6, new THREE.Euler(0, 0, Math.PI / 2));
}
for (const [x, z] of [[6.0, -10], [6.1, -10.9], [-6.2, 4], [-6.1, -34], [6.2, -52]]) box(M.wood, .8, .6, .8, x, .5, z, new THREE.Euler(0, rng(), 0), 1);
box(M.wood, .7, .5, .7, 6.0, 1.05, -10.4, new THREE.Euler(0, .4, 0), 1);
// leaning ladder (left wall)
{
  const lz = -15, base = -STREET + 1.3, top = -STREET + .15;
  for (const dz of [-.25, .25]) rod(M.wood, new THREE.Vector3(base, .2, lz + dz), new THREE.Vector3(top, 5.2, lz + dz), .045);
  for (let k = 1; k < 16; k++) { const t = k / 16; rod(M.wood, new THREE.Vector3(lerp(base, top, t), lerp(.2, 5.2, t), lz - .25), new THREE.Vector3(lerp(base, top, t), lerp(.2, 5.2, t), lz + .25), .03); }
  box(M.red, .3, .35, .3, -STREET + .55, .38, lz + .7, null, 1);    // paint can
}
// bench
box(M.wood, .5, .08, 2, -5.4, .5, 10); box(M.wood, .08, .5, 2, -5.7, .8, 10);
for (const dz of [-.8, .8]) box(M.iron, .5, .5, .08, -5.4, .25, 10 + dz);

// strung lines: clotheslines, bunting, wires
function catenary(a, b, sag, n = 24) {
  const pts = []; for (let i = 0; i <= n; i++) { const t = i / n; const p = new THREE.Vector3().lerpVectors(a, b, t); p.y -= sag * 4 * t * (1 - t); pts.push(p); }
  return pts;
}
function line(pts, r = .02) { add(M.rope, new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), pts.length * 2, r, 5, false)); }
const flagGeo = () => { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute([-.18, 0, 0, .18, 0, 0, 0, -.42, 0], 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute([1, 0, 0, 1, 0, 0, 1, 0, 0], 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute([0, 1, 1, 1, .5, 0], 2)); g.setIndex([0, 1, 2]); return g; };
for (const [z, y, kind] of [[3, 10.5, 'cloth'], [-8, 7.6, 'flags'], [-21, 12.4, 'cloth'], [-33, 8.2, 'flags'], [-46, 14.5, 'cloth']]) {
  const a = new THREE.Vector3(-STREET + .1, y, z), b = new THREE.Vector3(STREET - .1, y + R(-.6, .6), z + R(-1.5, 1.5));
  const pts = catenary(a, b, 1.1); line(pts);
  box(M.iron, .3, .1, .1, a.x + .1, a.y, a.z); box(M.iron, .3, .1, .1, b.x - .1, b.y, b.z);
  const curve = new THREE.CatmullRomCurve3(pts);
  if (kind === 'cloth') {
    for (let t = .08; t < .93; t += R(.07, .12)) {
      const p = curve.getPoint(t), w = R(.35, .8), h = R(.5, 1.0);
      const g = new THREE.BoxGeometry(w, h, .02); g.rotateY(Math.atan2(b.z - a.z, b.x - a.x) * -1); g.translate(p.x, p.y - h / 2, p.z);
      add(pick(clothMats), g);
      box(M.wood, .05, .1, .03, p.x, p.y, p.z, null, 1);
    }
  } else {
    for (let t = .03; t < .98; t += .045) {
      const p = curve.getPoint(t), g = flagGeo(); g.rotateY(-Math.atan2(b.z - a.z, b.x - a.x)); g.translate(p.x, p.y, p.z);
      add(pick(clothMats.slice(1, 5)), g);
    }
  }
}
// overhead wires running along the street
for (const s of [-1, 1]) for (let z = 40; z > -70; z -= 22) {
  const a = new THREE.Vector3(s * (STREET - .1), R(13, 16), z), b = new THREE.Vector3(-s * (STREET - .1), R(13, 16), z - 22);
  line(catenary(a, b, .7, 20), .012);
}

for (const [mat, geos] of batches) {
  const mesh = new THREE.Mesh(mergeGeometries(geos, false), mat);
  mesh.castShadow = true; mesh.receiveShadow = true; scene.add(mesh);
  if (mat.map && mat.map.repeat && mat !== M.street) { /* uv-scaled geometry */ }
}

// painted distant flats (stage backdrop cut-outs)
function skylineFlat(color, seed, y0, hMin, hMax, width) {
  const r = mulberry32(seed), c = canvas(2048, 256), ctx = c.getContext('2d');
  ctx.fillStyle = color; let x = 0;
  while (x < 2048) {
    const w = 30 + r() * 110, h = hMin + r() * (hMax - hMin);
    ctx.fillRect(x, 256 - h, w + 1, h);
    if (r() < .3) { ctx.fillRect(x + w * .3, 256 - h - 40, 14, 40); }          // chimney / spire
    if (r() < .15) { ctx.beginPath(); ctx.moveTo(x, 256 - h); ctx.lineTo(x + w / 2, 256 - h - 50); ctx.lineTo(x + w, 256 - h); ctx.fill(); }
    if (r() < .1) { ctx.beginPath(); ctx.arc(x + w / 2, 256 - h, w / 2.2, Math.PI, 0); ctx.fill(); }
    x += w;
  }
  const t = toTex(c); t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping;
  const m = new THREE.Mesh(new THREE.PlaneGeometry(width, width / 8), new THREE.MeshBasicMaterial({ map: t, transparent: true, fog: false, alphaTest: .5 }));
  return m;
}
const flats = [];
for (const [col, seed, z, w, ph] of [['#d8743f', 7, -420, 900, [40, 110]], ['#b9532f', 11, -300, 600, [50, 140]], ['#93391f', 13, -190, 380, [60, 160]]]) {
  const f = skylineFlat(col, seed, 0, ph[0], ph[1], w); f.position.set(0, w / 16 - 0.5, z); f.userData.base = new THREE.Color(col);
  scene.add(f); flats.push(f);
}

// ---------- painted sky ----------
const skyUniforms = {
  uNight: { value: 0 },
  cHaze: { value: new THREE.Color('#f39a52') }, cMain: { value: new THREE.Color('#E0481E') },
  cTop: { value: new THREE.Color('#5c2a62') }, cCloud: { value: new THREE.Color('#a8321a') },
  cGold: { value: new THREE.Color('#f7c24a') }, cNight: { value: new THREE.Color('#070a1c') },
  cNightHaze: { value: new THREE.Color('#1a1630') },
};
const sky = new THREE.Mesh(new THREE.SphereGeometry(1500, 64, 32), new THREE.ShaderMaterial({
  side: THREE.BackSide, depthWrite: false, fog: false, uniforms: skyUniforms,
  vertexShader: `varying vec3 vDir; void main(){ vDir = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
  fragmentShader: `
    varying vec3 vDir; uniform float uNight; uniform vec3 cHaze,cMain,cTop,cCloud,cGold,cNight,cNightHaze;
    float h(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7)))*43758.5453); }
    float n(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.-2.*f); return mix(mix(h(i),h(i+vec2(1,0)),f.x), mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x), f.y); }
    float fbm(vec2 p){ float a=.5, s=0.; for(int i=0;i<5;i++){ s+=a*n(p); p*=2.03; a*=.5; } return s; }
    float band(float az, float el){
      float m = smoothstep(.03,.12,el) * (1.-smoothstep(.75,1.0,el));
      float v = fbm(vec2(az*1.6, el*20.0)) + .25*sin(el*38.0 + fbm(vec2(az*3.0, el*4.))*4.0);
      return smoothstep(.62,.70,v) * m;
    }
    void main(){
      vec3 d = normalize(vDir); float el = asin(clamp(d.y,-1.,1.)); float az = atan(d.x, -d.z);
      vec3 col = mix(cHaze, cMain, smoothstep(-.02, .2, el));
      col = mix(col, cTop, smoothstep(.55, .95, el));
      float b = band(az, el), below = band(az, el - .012), above = band(az, el + .02);
      col = mix(col, cCloud, b * .8);
      float edge = clamp(b - below, 0., 1.);
      col = mix(col, cGold, edge * .95);
      col = mix(col, cGold * 1.1, clamp(b - above, 0., 1.) * .25);
      // brush grain in the paint
      col *= .96 + .08 * n(vec2(az*240., el*90.));
      // night
      vec3 nc = mix(cNightHaze, cNight, smoothstep(-.02,.35,el));
      nc = mix(nc, nc*.6 + cCloud*.05, b*.7);
      vec2 g = vec2(az*260., el*260.); vec2 gi = floor(g); float s = h(gi);
      float star = step(.986, s) * smoothstep(.45, .0, length(fract(g)-.5)) * smoothstep(.02,.15,el);
      nc += vec3(1.,.95,.85) * star * (.6 + .8*h(gi+3.1)) * (1. - b);
      col = mix(col, nc, uNight);
      gl_FragColor = vec4(col, 1.0);
    }`,
}));
sky.renderOrder = -10; sky.frustumCulled = false; scene.add(sky);

function discMat(core, rim, rimW, glowCol, glowAmt) {
  return new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, fog: false,
    uniforms: { uOp: { value: 1 }, cCore: { value: new THREE.Color(core) }, cRim: { value: new THREE.Color(rim) }, cGlow: { value: new THREE.Color(glowCol) } },
    vertexShader: `varying vec2 vUv; void main(){ vUv = uv*2.-1.; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
    fragmentShader: `varying vec2 vUv; uniform float uOp; uniform vec3 cCore,cRim,cGlow;
      void main(){ float r = length(vUv);
        float core = 1. - smoothstep(.70, .705, r);
        float rim = (1. - smoothstep(${(.70 + rimW).toFixed(3)}, ${(.705 + rimW).toFixed(3)}, r)) * (1.-core);
        float glow = (1.-smoothstep(.70, 1., r)) * ${glowAmt.toFixed(2)} * (1.-core) * (1.-rim);
        vec3 c = cCore * (1.03 - .06*r) ;
        vec3 col = c*core + cRim*rim + cGlow*glow;
        float a = (core + rim + glow) * uOp;
        if (a < .003) discard;
        gl_FragColor = vec4(col / max(core+rim+glow, 1e-3), a); }`,
  });
}
const sunMat = discMat('#D97757', '#000000', .06, '#ffcf6a', .55);
const sun = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), sunMat); sun.renderOrder = -9; sun.frustumCulled = false; scene.add(sun);
const moonMat = discMat('#f3e4c4', '#000000', .05, '#f3e4c4', .0);
const moon = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), moonMat); moon.renderOrder = -9; moon.frustumCulled = false; scene.add(moon);
const SUN_DIR = new THREE.Vector3().setFromSphericalCoords(1, (90 - 9.5) * deg, Math.PI + 2 * deg);   // low, straight down the street
const MOON_DIR = new THREE.Vector3().setFromSphericalCoords(1, (90 - 27) * deg, Math.PI - 6 * deg);
const SUN_ANG = 11.5 * deg, MOON_ANG = 3.2 * deg;

// ---------- lights ----------
const key = new THREE.DirectionalLight(new THREE.Color('#ffb36a'), 5.2);
const KEY_DIR = new THREE.Vector3(-.40, .27, -.88).normalize();     // raking, from far left
key.castShadow = true; key.shadow.mapSize.set(4096, 4096);
Object.assign(key.shadow.camera, { left: -70, right: 70, top: 90, bottom: -90, near: 1, far: 400 });
key.shadow.bias = -.0004; key.shadow.normalBias = .03;
key.target.position.set(0, 0, -5); key.position.copy(key.target.position).addScaledVector(KEY_DIR, 180);
scene.add(key, key.target);
const fill = new THREE.HemisphereLight(new THREE.Color('#7f95d8'), new THREE.Color('#4a2c28'), 1.35);
scene.add(fill);
const bounce = new THREE.DirectionalLight(new THREE.Color('#ff7a4a'), .25); bounce.position.set(.4, .1, 1); scene.add(bounce);

// ---------- mannequins ----------
const wood = stdMat({ color: '#e7cfa2', roughness: .5 });
const jointM = stdMat({ color: '#3b2419', roughness: .5 });
function capsule(r, l, mat, y) { const m = new THREE.Mesh(new THREE.CapsuleGeometry(r, l, 6, 12), mat); m.position.y = y; m.castShadow = m.receiveShadow = true; return m; }
function sphere(r, mat, y = 0) { const m = new THREE.Mesh(new THREE.SphereGeometry(r, 16, 12), mat); m.position.y = y; m.castShadow = m.receiveShadow = true; return m; }
function makeMannequin(shirtCol, hat) {
  const shirt = stdMat({ color: shirtCol, roughness: .6 });
  const root = new THREE.Group(), pelvis = new THREE.Group(); pelvis.position.y = .98; root.add(pelvis);
  const p = sphere(.16, shirt); p.scale.set(1.05, .65, .75); pelvis.add(p);
  const spine = new THREE.Group(); spine.position.y = .06; pelvis.add(spine);
  const torso = capsule(.15, .32, shirt, .3); torso.scale.set(1.18, 1, .72); spine.add(torso);
  spine.add(sphere(.05, jointM, .58));
  const neck = new THREE.Group(); neck.position.y = .64; spine.add(neck);
  neck.add(capsule(.04, .06, wood, .03));
  const head = new THREE.Group(); head.position.y = .08; neck.add(head);
  const hd = sphere(.11, wood, .1); hd.scale.set(.9, 1.18, .98); head.add(hd);
  const nose = sphere(.022, wood, .1); nose.position.z = .1; head.add(nose);
  if (hat) {
    const hm = stdMat({ color: '#2a1e1a' });
    const brim = new THREE.Mesh(new THREE.CylinderGeometry(.19, .19, .015, 20), hm); brim.position.y = .2; head.add(brim);
    const crown = new THREE.Mesh(new THREE.CylinderGeometry(.1, .11, .12, 20), hm); crown.position.y = .26; head.add(crown);
    const band = new THREE.Mesh(new THREE.CylinderGeometry(.112, .112, .03, 20), M.red); band.position.y = .22; head.add(band);
    for (const m of [brim, crown, band]) m.castShadow = true;
  }
  const limb = (parent, x, y, r1, l1, r2, l2, endMat, isLeg) => {
    const a = new THREE.Group(); a.position.set(x, y, 0); parent.add(a);
    a.add(sphere(r1 * 1.25, jointM));
    a.add(capsule(r1, l1, isLeg ? shirtLeg : wood, -(l1 / 2 + r1)));
    const b = new THREE.Group(); b.position.y = -(l1 + 2 * r1); a.add(b);
    b.add(sphere(r2 * 1.2, jointM));
    b.add(capsule(r2, l2, isLeg ? shirtLeg : wood, -(l2 / 2 + r2)));
    if (isLeg) { const f = new THREE.Mesh(new THREE.BoxGeometry(.1, .06, .22), jointM); f.position.set(0, -(l2 + 2 * r2) - .01, .05); f.castShadow = true; b.add(f); }
    else b.add(sphere(.045, wood, -(l2 + 2 * r2) - .02));
    return [a, b];
  };
  const shirtLeg = stdMat({ color: new THREE.Color(shirtCol).multiplyScalar(.45), roughness: .7 });
  const [shL, elL] = limb(spine, -.21, .5, .045, .2, .04, .2, wood, false);
  const [shR, elR] = limb(spine, .21, .5, .045, .2, .04, .2, wood, false);
  const [hipL, knL] = limb(pelvis, -.09, -.05, .065, .3, .055, .3, null, true);
  const [hipR, knR] = limb(pelvis, .09, -.05, .065, .3, .055, .3, null, true);
  return { root, pelvis, spine, neck, head, shL, elL, shR, elR, hipL, knL, hipR, knR };
}
function pose(m, o) {
  const g = (k, d = 0) => o[k] ?? d;
  m.pelvis.position.y = .98 + g('bob');
  m.spine.rotation.x = g('lean'); m.spine.rotation.y = g('twist');
  m.head.rotation.x = g('headX'); m.head.rotation.y = g('headY'); m.neck.rotation.x = g('neckX');
  m.shL.rotation.set(g('shLx'), 0, g('shLz', -.12)); m.shR.rotation.set(g('shRx'), 0, g('shRz', .12));
  m.elL.rotation.x = g('elL', -.2); m.elR.rotation.x = g('elR', -.2);
  m.hipL.rotation.x = g('hipL'); m.hipR.rotation.x = g('hipR'); m.knL.rotation.x = g('knL'); m.knR.rotation.x = g('knR');
}
function walkPose(phase, amp) {
  const s = Math.sin(phase);
  return {
    hipL: -.42 * s * amp, hipR: .42 * s * amp,
    knL: (.08 + .55 * Math.max(0, Math.sin(phase - 1.2))) * amp + .05, knR: (.08 + .55 * Math.max(0, Math.sin(phase + Math.PI - 1.2))) * amp + .05,
    shLx: .35 * s * amp, shRx: -.35 * s * amp, elL: -.25 - .15 * amp, elR: -.25 - .15 * amp,
    bob: .025 * Math.cos(2 * phase) * amp - .01 * amp, lean: .04 * amp,
  };
}
const people = [];
function person(col, hat, cfg) { const m = makeMannequin(col, hat); scene.add(m.root); people.push({ m, ...cfg }); return m; }
person('#3d7f7a', true, { type: 'walk', x: 5.4, z0: 12, dir: -1, speed: 1.05, ph: 0 });
person('#e2b13c', false, { type: 'walk', x: -5.5, z0: -24, dir: 1, speed: .95, ph: 1.7 });
person('#2f5aa0', true, { type: 'walk', x: 4.6, z0: -30, dir: 1, speed: .9, ph: 2.6 });
person('#b8282c', false, { type: 'walk', x: -4.6, z0: 18, dir: -1, speed: 1.15, ph: .6 });
person('#f1e6cf', false, { type: 'sit', x: 6.1, z: -10.4, ry: -Math.PI / 2 - .3 });
person('#3d7f7a', false, { type: 'paint', x: -5.9, z: -14.2, ry: -Math.PI / 2 + .25 });
const lb = heights['1'][1];
person('#2f5aa0', true, { type: 'roof', x: STREET + 1.0, y: lb.h + .02, z: lb.z0 - 3.5, ry: -Math.PI / 2 - .5 });
const lb2 = heights['-1'][1];
person('#e2b13c', false, { type: 'roof', x: -STREET - 1.0, y: lb2.h + .02, z: lb2.z0 - 5, ry: Math.PI / 2 + .4 });
// a little group in the street that the ground-level push arrives at
person('#b8282c', true, { type: 'stand', x: -1.3, z: -10.5, ry: .5, ph: .3 });
person('#3d7f7a', false, { type: 'stand', x: .2, z: -11.3, ry: -.35, ph: 1.4 });
person('#e2b13c', false, { type: 'walk', x: 2.2, z0: 16, dir: -1, speed: 1.2, ph: 2.1 });
person('#f1e6cf', true, { type: 'walk', x: -2.6, z0: -26, dir: 1, speed: .85, ph: .9 });
if (balconies.length) for (const b of balconies.slice(0, 3)) person(pick(['#e2b13c', '#b8282c', '#f1e6cf']), false, { type: 'balcony', x: b.x, y: b.y, z: b.z, ry: -b.side * Math.PI / 2 });

// ---------- timeline ----------
// world time w: seconds since the Sun vanished (18:00:00).
function worldTime(t) {
  if (t < 7) return t - 3.5;
  if (t < 14) return 3.5 + (497 - 3.5) * ease((t - 7) / 7);
  if (t < 15.5) return 497 + (t - 14) * 2;
  if (t < 20.5) return 500 + (t - 15.5) * .5;
  return 502.5 + (t - 20.5);
}
// animation clock (slows to half speed during the slow-motion section)
function animRate(t) { return 1 - .5 * smooth(15.0, 15.6, t) * (1 - smooth(20.2, 21.0, t)); }
function animClock(t) { let a = 0; const dt = 1 / 120; for (let s = 0; s < t; s += dt) a += animRate(s) * Math.min(dt, t - s); return a; }
const nightAt = (w) => smooth(499.97, 500.03, w) * (1 - smooth(500.97, 501.03, w));
const moonDark = (w) => smooth(501.25, 501.31, w) * (1 - smooth(502.25, 502.31, w));

// camera spline: high low-angle → one continuous descent → ground-level push
const camKeys = [
  [0, .8, 16.5, 40], [3.5, .7, 17.0, 38.0], [7, .5, 17.2, 35.5], [10.5, .3, 9.0, 28.5], [14, 0, 1.9, 20.5],
  [18, 0, 1.45, 13.8], [22, -.2, 1.4, 8.4], [26, -.3, 1.35, 2.8], [30, -.3, 1.35, -2.2],
];
const pitchKeys = [[0, 17], [3.5, 16], [7, 13], [10.5, 5], [14, 4.5], [18, 6.5], [22, 7], [30, 6]];
const yawKeys = [[0, -1.5], [7, -.5], [14, .5], [22, 0], [30, -1]];
function catmull(keys, t, idx) {
  let i = 0; while (i < keys.length - 2 && t > keys[i + 1][0]) i++;
  const k0 = keys[Math.max(0, i - 1)], k1 = keys[i], k2 = keys[i + 1], k3 = keys[Math.min(keys.length - 1, i + 2)];
  const u = clamp((t - k1[0]) / (k2[0] - k1[0])), u2 = u * u, u3 = u2 * u;
  const p0 = k0[idx], p1 = k1[idx], p2 = k2[idx], p3 = k3[idx];
  return .5 * (2 * p1 + (-p0 + p2) * u + (2 * p0 - 5 * p1 + 4 * p2 - p3) * u2 + (-p0 + 3 * p1 - 3 * p2 + p3) * u3);
}

// ---------- post: grade + grain + vignette ----------
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
composer.addPass(new OutputPass());
const grade = new ShaderPass({
  uniforms: { tDiffuse: { value: null }, uSeed: { value: 0 }, uRes: { value: new THREE.Vector2(W, H) } },
  vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
  fragmentShader: `varying vec2 vUv; uniform sampler2D tDiffuse; uniform float uSeed; uniform vec2 uRes;
    float h(vec2 p){ return fract(sin(dot(p, vec2(12.9898,78.233)) + uSeed*7.13)*43758.5453); }
    void main(){ vec3 c = texture2D(tDiffuse, vUv).rgb;
      float l = dot(c, vec3(.299,.587,.114));
      c = mix(vec3(l), c, 1.12);                                  // saturate
      c *= vec3(1.035, 1.0, .95);                                 // warm
      c = c + (c - c*c) * .08;                                     // gentle S
      vec2 q = vUv - .5; c *= 1. - .35 * dot(q*vec2(1.,.75), q*vec2(1.,.75)) * 1.6;   // vignette
      float g = (h(floor(vUv*uRes*.7)) - .5) * .06;               // fine grain ±3%
      c += g;
      gl_FragColor = vec4(clamp(c,0.,1.), 1.); }`,
});
composer.addPass(grade);

// ---------- HUD text ----------
const $ = (id) => document.getElementById(id);
const captions = [
  [0.2, 3.35, 'Fim de tarde.<br>Um dia comum.'],
  [3.55, 6.95, '18:00:00 — a 150 milhões de km, o <em>Sol</em> some por 1 segundo.'],
  [7.15, 10.95, 'Aqui, nada muda. A luz que já saiu dele <em>continua viajando.</em>'],
  [11.1, 15.3, 'A luz — e a gravidade — levam <em>8 min 20 s</em> para chegar até nós.'],
  [15.55, 17.45, 'Escuridão total.<br><em>Estrelas</em> no fim de tarde.'],
  [17.6, 20.45, 'O Sol volta. E a <em>Lua</em> apaga — com 1,3 s de atraso.'],
  [20.6, 23.0, 'Seu cérebro leva ~0,3 s só para <em>notar</em> o escuro.'],
  [23.15, 25.55, 'Painéis solares: <em>1 segundo</em> sem energia.'],
  [25.7, 28.0, 'A órbita da Terra? Desvia só <em>3 milímetros.</em>'],
  [28.15, 30.5, '1 segundo de noite.<br><em>E o mundo segue.</em>'],
];
const pad = (n, l = 2) => String(Math.floor(n)).padStart(l, '0');
function hud(t, w) {
  let cap = '', op = 0;
  for (const [a, b, s] of captions) if (t >= a - .01 && t < b) { cap = s; op = smooth(a, a + .25, t) * (1 - smooth(b - .25, b, t)); }
  const c = $('cap'); if (c.innerHTML !== cap) c.innerHTML = cap; c.style.opacity = op;
  c.style.transform = `translateY(${(1 - op) * 18}px)`;
  const clock = 18 * 3600 + w;
  const tenths = t >= 15.5 && t < 20.5;
  $('clk').textContent = `${pad(clock / 3600)}:${pad(clock / 60 % 60)}:${pad(clock % 60)}${tenths ? ',' + Math.floor((clock * 10) % 10) : ''}`;
  let sub = '', lbl = 'HORA LOCAL';
  if (w >= 0 && w < 500) { sub = `ESCURIDÃO CHEGA EM ${pad((500 - w) / 60)}:${pad(Math.ceil(500 - w - 1e-6) % 60)}`; if (Math.ceil(500 - w - 1e-6) % 60 === 0 && 500 - w > 59) sub = `ESCURIDÃO CHEGA EM ${pad(Math.ceil(500 - w) / 60)}:00`; }
  else if (w >= 500 && w < 501) sub = `SEM SOL · ${(w - 500).toFixed(1).replace('.', ',')} s`;
  else if (w >= 501.28 && w < 502.28) sub = 'LUA APAGADA';
  else if (w >= 501 && w < 503) sub = 'SOL DE VOLTA';
  $('sub').textContent = sub; $('lbl').textContent = lbl; $('sub').style.display = sub ? 'block' : 'none';
  $('hud').style.opacity = smooth(.0, .4, t) * (1 - smooth(29.6, 30, t) * 0);
  let tag = '';
  if (t >= 7.2 && t < 13.8) tag = '▶▶ ACELERADO'; else if (t >= 15.4 && t < 20.5) tag = 'CÂMERA LENTA ½×';
  $('tag').textContent = tag; $('tag').style.display = tag ? 'block' : 'none';
}

// ---------- frame ----------
const tmp = new THREE.Vector3();
function placeDisc(mesh, dir, ang) {
  const d = 1300; mesh.position.copy(camera.position).addScaledVector(dir, d);
  const r = d * Math.tan(ang / 2) / .70; mesh.scale.set(r, r, 1); mesh.lookAt(camera.position);
}
window.renderAt = function (t) {
  const w = worldTime(t), night = nightAt(w), a = animClock(t);
  // camera
  camera.position.set(catmull(camKeys, t, 1), catmull(camKeys, t, 2), catmull(camKeys, t, 3));
  const pitch = catmull(pitchKeys, t, 1) * deg, yaw = catmull(yawKeys, t, 1) * deg;
  tmp.set(Math.sin(yaw) * Math.cos(pitch), Math.sin(pitch), -Math.cos(yaw) * Math.cos(pitch));
  camera.lookAt(tmp.add(camera.position)); camera.updateMatrixWorld();
  sky.position.copy(camera.position);
  placeDisc(sun, SUN_DIR, SUN_ANG); placeDisc(moon, MOON_DIR, MOON_ANG);
  sunMat.uniforms.uOp.value = 1 - night;
  moonMat.uniforms.uOp.value = (1 - night) * (1 - moonDark(w)) * .92;
  skyUniforms.uNight.value = night;
  key.intensity = 5.2 * (1 - night); bounce.intensity = .45 * (1 - night);
  fill.intensity = lerp(1.35, .32, night);
  fill.color.set('#7f95d8').lerp(new THREE.Color('#3b4f9a'), night);
  scene.fog.color.copy(HAZE_DAY).lerp(HAZE_NIGHT, night);
  for (const f of flats) f.material.color.setRGB(1, 1, 1).lerp(new THREE.Color('#14122a').multiplyScalar(4), night);
  M.winLit.emissiveIntensity = lerp(.55, 1.3, night);
  // people: they keep moving, slow to a stop after the blackout, then look up
  const stopF = smooth(16.0, 19.0, t), look = smooth(18.2, 22.5, t);
  for (const p of people) {
    const m = p.m;
    if (p.type === 'walk') {
      // distance integrates speed * (1-stop) over the anim clock
      let dist = 0; const dt = 1 / 60;
      for (let s = 0; s < t; s += dt) dist += p.speed * (1 - smooth(16.0, 19.0, s)) * animRate(s) * Math.min(dt, t - s);
      const amp = 1 - stopF;
      m.root.position.set(p.x, 0, p.z0 + p.dir * dist); m.root.rotation.y = p.dir < 0 ? Math.PI : 0;
      const o = walkPose(dist / 1.45 * Math.PI * 2 + p.ph, amp);
      o.headX = -.6 * look; o.lean = (o.lean ?? 0) - .12 * look; o.headY = .15 * look * Math.sin(p.ph * 3);
      pose(m, o);
    } else if (p.type === 'sit') {
      m.root.position.set(p.x, -.42, p.z); m.root.rotation.y = p.ry;
      pose(m, { hipL: -1.45, hipR: -1.35, knL: 1.4, knR: 1.5, lean: .15 - .2 * look, shLx: -.5, shRx: -.6, elL: -1.0, elR: -.9, headX: .2 - .75 * look + .03 * Math.sin(a * 1.3), bob: 0 });
    } else if (p.type === 'paint') {
      m.root.position.set(p.x, 0, p.z); m.root.rotation.y = p.ry;
      const brush = Math.sin(a * 2.4) * (1 - stopF);
      pose(m, { shRx: -2.5 + .25 * brush, shRz: .2, elR: -.35, shLx: -.2, elL: -.4, headX: -.35 - .3 * look, lean: -.05, headY: .2 * look });
    } else if (p.type === 'roof') {
      m.root.position.set(p.x, p.y, p.z); m.root.rotation.y = p.ry;
      pose(m, { shLx: -.15, shRx: -1.9 + .08 * Math.sin(a * 1.1), shRz: .3, elR: -1.2, headX: -.25 - .25 * look, headY: .1 * Math.sin(a * .6), lean: -.04 });
    } else if (p.type === 'stand') {
      m.root.position.set(p.x, 0, p.z); m.root.rotation.y = p.ry;
      const talk = Math.sin(a * 1.6 + p.ph) * (1 - stopF);
      pose(m, { shLx: -.3 + .25 * talk, elL: -.9, shRx: .05, elR: -.3, headX: .05 * Math.sin(a + p.ph) - .7 * look, headY: (p.ph > 1 ? .5 : -.5) * (1 - look),
        lean: .03 - .1 * look, hipL: -.05, hipR: .08, knL: .1, knR: .05 });
    } else if (p.type === 'balcony') {
      m.root.position.set(p.x, p.y, p.z); m.root.rotation.y = p.ry;
      pose(m, { lean: .28 - .3 * look, shLx: -1.0, shRx: -1.0, elL: -.9, elR: -.9, headX: .1 - .7 * look + .04 * Math.sin(a * .8), shLz: -.3, shRz: .3 });
    }
  }
  grade.uniforms.uSeed.value = (t * 30) % 97;
  hud(t, w);
  composer.render();
};
window.sceneReady = true;
