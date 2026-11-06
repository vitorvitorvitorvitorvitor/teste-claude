import type { MuscleGroup } from '../../domain/types';
import { interpolate, LEN, solve, type Anim, type FrontAnim, type Joint, type Pt, type SideAnim } from './rig';

/**
 * Gera o SVG (string) de um quadro da animação. Função pura, usada pelo
 * componente React e pelos testes. Cores vêm das variáveis CSS do tema
 * (aplicadas via atributo style, compatível com Safari).
 */

type Part = 'torso' | 'uArm' | 'fArm' | 'thigh' | 'shin';

const MUSCLE_PARTS: Record<MuscleGroup, Part[]> = {
  peito: ['torso'],
  costas: ['torso'],
  core: ['torso'],
  ombros: ['uArm'],
  biceps: ['uArm'],
  triceps: ['uArm'],
  quadriceps: ['thigh'],
  posterior: ['thigh'],
  gluteos: ['thigh'],
  panturrilhas: ['shin']
};

export interface Highlight {
  primary: MuscleGroup;
  secondary: MuscleGroup[];
}

const C = {
  body: 'rgb(var(--ink) / 0.82)',
  far: 'rgb(var(--muted) / 0.75)',
  ghost: 'rgb(var(--muted) / 0.22)',
  accent: 'rgb(var(--accent))',
  accentSoft: 'rgb(var(--accent) / 0.55)',
  prop: 'rgb(var(--muted) / 0.9)',
  propSoft: 'rgb(var(--line))',
  iron: 'rgb(var(--ink) / 0.6)'
};

const f = (n: number) => Math.round(n * 10) / 10;
const seg = (a: Pt, b: Pt, color: string, w: number, extra = '') =>
  `<line x1="${f(a[0])}" y1="${f(a[1])}" x2="${f(b[0])}" y2="${f(b[1])}" style="stroke:${color};stroke-width:${w};stroke-linecap:round"${extra}/>`;
const circle = (c: Pt, r: number, fill: string, extra = '') => `<circle cx="${f(c[0])}" cy="${f(c[1])}" r="${r}" style="fill:${fill}"${extra}/>`;

function partColor(part: Part, hl: Highlight | undefined, base: string) {
  if (!hl) return base;
  if (MUSCLE_PARTS[hl.primary].includes(part)) return C.accent;
  if (hl.secondary.some((m) => MUSCLE_PARTS[m].includes(part))) return C.accentSoft;
  return base;
}

function headCenter(j: Record<Joint, Pt>): Pt {
  const dx = j.head[0] - j.shoulder[0];
  const dy = j.head[1] - j.shoulder[1];
  const l = Math.hypot(dx, dy) || 1;
  return [j.head[0] + (dx / l) * LEN.head, j.head[1] + (dy / l) * LEN.head];
}

function body(j: Record<Joint, Pt>, hl: Highlight | undefined, ghost = false): string {
  const g = ghost ? C.ghost : undefined;
  const col = (p: Part, base: string) => g ?? partColor(p, hl, base);
  const out: string[] = [];
  // lado distante
  out.push(seg(j.hip, j.knee2, col('thigh', C.far), 10), seg(j.knee2, j.ankle2, col('shin', C.far), 9), seg(j.ankle2, j.toe2, g ?? C.far, 6));
  out.push(seg(j.shoulder, j.elbow2, col('uArm', C.far), 8), seg(j.elbow2, j.wrist2, col('fArm', C.far), 7));
  // tronco e cabeça
  out.push(seg(j.hip, j.shoulder, col('torso', C.body), 15));
  out.push(seg(j.shoulder, j.head, g ?? C.body, 7));
  out.push(circle(headCenter(j), LEN.head, g ?? C.body));
  // lado próximo
  out.push(seg(j.hip, j.knee, col('thigh', C.body), 11), seg(j.knee, j.ankle, col('shin', C.body), 10), seg(j.ankle, j.toe, g ?? C.body, 7));
  out.push(seg(j.shoulder, j.elbow, col('uArm', C.body), 9), seg(j.elbow, j.wrist, col('fArm', C.body), 8));
  if (!ghost && hl && (hl.primary === 'gluteos' || hl.secondary.includes('gluteos'))) {
    out.push(circle(j.hip, 7, hl.primary === 'gluteos' ? C.accent : C.accentSoft));
  }
  return out.join('');
}

function propsSvg(a: SideAnim, j: Record<Joint, Pt>, layer: 'back' | 'front'): string {
  const out: string[] = [];
  for (const p of a.props) {
    if (layer === 'back') {
      if (p.k === 'floor') out.push(seg([8, p.y ?? 192], [192, p.y ?? 192], C.propSoft, 3));
      if (p.k === 'box') out.push(`<rect x="${p.x}" y="${p.y}" width="${p.w}" height="${p.h}" rx="${p.r ?? 4}" style="fill:${C.propSoft}"/>`);
      if (p.k === 'line') out.push(seg(p.from, p.to, C.prop, p.w ?? 4));
      if (p.k === 'cable') out.push(seg(j[p.at], p.to, C.prop, 1.6), circle(p.to, 4, C.prop));
      if (p.k === 'band') out.push(seg(j[p.at], p.to, 'rgb(var(--warn) / 0.8)', 3), circle(p.to, 3, C.prop));
    } else {
      const c = j[(p as { at: Joint }).at];
      if (p.k === 'barbell') out.push(`<circle cx="${f(c[0])}" cy="${f(c[1])}" r="${p.size ?? 15}" style="fill:none;stroke:${C.iron};stroke-width:5"/>`, circle(c, 3.5, C.iron));
      if (p.k === 'dumbbell') out.push(`<rect x="${f(c[0] - 9)}" y="${f(c[1] - 4)}" width="18" height="8" rx="3" style="fill:${C.iron}"/>`);
      if (p.k === 'kettlebell') out.push(circle([c[0], c[1] + 9], 8, C.iron), seg([c[0] - 4, c[1]], [c[0] + 4, c[1]], C.iron, 3));
      if (p.k === 'plate') out.push(circle(c, 9, C.iron));
      if (p.k === 'pad') out.push(circle(c, p.r ?? 6, C.prop));
    }
  }
  return out.join('');
}

function sideSvg(a: SideAnim, t: number, hl?: Highlight, ghost = true): string {
  const pose = interpolate(a.from, a.to, a.hold ? t * 0.08 : t);
  const j = solve(pose);
  const gj = solve(a.to);
  return [
    propsSvg(a, j, 'back'),
    ghost && !a.hold ? body(gj, hl, true) : '',
    body(j, hl),
    propsSvg(a, j, 'front')
  ].join('');
}

function frontSvg(a: FrontAnim, t: number, hl?: Highlight): string {
  const u = a.from.uArm + (a.to.uArm - a.from.uArm) * t;
  const fa = a.from.fArm + (a.to.fArm - a.from.fArm) * t;
  const cx = 100;
  const sh: [Pt, Pt] = [[cx - 19, 64], [cx + 19, 64]];
  const hp: [Pt, Pt] = [[cx - 11, 116], [cx + 11, 116]];
  const spread = (a.from.legs ?? 'afastadas') === 'afastadas' ? 14 : 6;
  const d = (deg: number, l: number): Pt => [Math.sin((deg * Math.PI) / 180) * l, -Math.cos((deg * Math.PI) / 180) * l];
  const out: string[] = [];
  if (a.props.includes('floor')) out.push(seg([20, 192], [180, 192], C.propSoft, 3));
  const armCol = hl ? partColor('uArm', hl, C.body) : C.body;
  const torsoCol = hl ? partColor('torso', hl, C.body) : C.body;
  for (const side of [1, -1] as const) {
    const s = sh[side === 1 ? 1 : 0];
    const e: Pt = [s[0] + d(u * side, LEN.uArm)[0], s[1] + d(u * side, LEN.uArm)[1]];
    const w: Pt = [e[0] + d(fa * side, LEN.fArm)[0], e[1] + d(fa * side, LEN.fArm)[1]];
    if (a.props.includes('cables')) out.push(seg(w, [cx + side * 92, 20], C.prop, 1.6));
    if (a.props.includes('bands')) out.push(seg(w, [cx + side * 6, 190], 'rgb(var(--warn) / 0.8)', 3));
    out.push(seg(s, e, armCol, 9), seg(e, w, armCol, 8));
    if (a.props.includes('dumbbells')) out.push(`<rect x="${f(w[0] - 4)}" y="${f(w[1] - 9)}" width="8" height="18" rx="3" style="fill:${C.iron}"/>`);
    const h = hp[side === 1 ? 1 : 0];
    const k: Pt = [h[0] + side * (spread / 2), 152];
    const an: Pt = [h[0] + side * spread, 188];
    const legCol = hl ? partColor('thigh', hl, C.body) : C.body;
    out.push(seg(h, k, legCol, 11), seg(k, an, hl ? partColor('shin', hl, C.body) : C.body, 10));
  }
  out.push(`<path d="M${sh[0][0]},${sh[0][1]} L${sh[1][0]},${sh[1][1]} L${hp[1][0] + 2},${hp[1][1]} L${hp[0][0] - 2},${hp[0][1]} Z" style="fill:${torsoCol};stroke:${torsoCol};stroke-width:8;stroke-linejoin:round"/>`);
  out.push(seg([cx, 64], [cx, 50], C.body, 7), circle([cx, 38], 11, C.body));
  return out.join('');
}

export function figureSvg(a: Anim, t: number, hl?: Highlight, opts: { ghost?: boolean } = {}): string {
  const inner = a.view === 'side' ? sideSvg(a, t, hl, opts.ghost ?? true) : frontSvg(a, t, hl);
  return `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" role="img">${inner}</svg>`;
}
