/**
 * Boneco articulado em SVG (vista lateral ou frontal) para demonstrar a
 * execução dos exercícios. Arte 100% original do FORJA — sem imagens de
 * terceiros. As poses de início e fim são interpoladas por ângulo
 * (cinemática direta), então o comprimento dos segmentos é preservado.
 *
 * Ângulos absolutos em graus, medidos no sentido horário a partir de "para
 * cima": 0 = cima, 90 = frente (direita), 180 = baixo, 270 = trás.
 */

export type Seg =
  | 'torso' | 'neck' | 'uArm' | 'fArm' | 'thigh' | 'shin' | 'foot'
  | 'uArm2' | 'fArm2' | 'thigh2' | 'shin2' | 'foot2';
export type Joint =
  | 'hip' | 'shoulder' | 'head' | 'elbow' | 'wrist' | 'knee' | 'ankle' | 'toe'
  | 'elbow2' | 'wrist2' | 'knee2' | 'ankle2' | 'toe2';
export type Angles = Partial<Record<Seg, number>>;
export type Pt = [number, number];

export interface Pose {
  a: Angles;
  anchor: Joint;
  at: Pt;
}

export type Prop =
  | { k: 'floor'; y?: number }
  | { k: 'box'; x: number; y: number; w: number; h: number; r?: number }
  | { k: 'line'; from: Pt; to: Pt; w?: number }
  | { k: 'barbell'; at: Joint; size?: number }
  | { k: 'dumbbell'; at: Joint }
  | { k: 'kettlebell'; at: Joint }
  | { k: 'cable'; at: Joint; to: Pt }
  | { k: 'band'; at: Joint; to: Pt }
  | { k: 'plate'; at: Joint }
  | { k: 'pad'; at: Joint; r?: number };

export interface SideAnim {
  view: 'side';
  from: Pose;
  to: Pose;
  props: Prop[];
  /** Isometria: o corpo quase não se move. */
  hold?: boolean;
}

export interface FrontAnim {
  view: 'front';
  /** Ângulos do braço direito do boneco (o esquerdo é espelhado). */
  from: { uArm: number; fArm: number; legs?: 'juntas' | 'afastadas' };
  to: { uArm: number; fArm: number; legs?: 'juntas' | 'afastadas' };
  props: ('dumbbells' | 'cables' | 'bands' | 'floor')[];
}

export type Anim = SideAnim | FrontAnim;

export const LEN = { torso: 52, neck: 13, uArm: 29, fArm: 27, thigh: 42, shin: 41, foot: 13, head: 9.5 };

const BASE: Required<Pick<Angles, 'torso' | 'neck' | 'uArm' | 'fArm' | 'thigh' | 'shin' | 'foot'>> = {
  torso: 0, neck: 0, uArm: 180, fArm: 180, thigh: 180, shin: 180, foot: 90
};

const rad = (d: number) => (d * Math.PI) / 180;
const dir = (deg: number, len: number): Pt => [Math.sin(rad(deg)) * len, -Math.cos(rad(deg)) * len];
const add = (a: Pt, b: Pt): Pt => [a[0] + b[0], a[1] + b[1]];

export function fullAngles(a: Angles): Required<Angles> {
  const b = { ...BASE, ...a };
  return {
    ...b,
    uArm2: a.uArm2 ?? b.uArm,
    fArm2: a.fArm2 ?? b.fArm,
    thigh2: a.thigh2 ?? b.thigh,
    shin2: a.shin2 ?? b.shin,
    foot2: a.foot2 ?? b.foot
  };
}

export function solve(p: Pose): Record<Joint, Pt> {
  const a = fullAngles(p.a);
  const hip: Pt = [0, 0];
  const shoulder = add(hip, dir(a.torso, LEN.torso));
  const head = add(shoulder, dir(a.neck, LEN.neck));
  const elbow = add(shoulder, dir(a.uArm, LEN.uArm));
  const wrist = add(elbow, dir(a.fArm, LEN.fArm));
  const elbow2 = add(shoulder, dir(a.uArm2, LEN.uArm));
  const wrist2 = add(elbow2, dir(a.fArm2, LEN.fArm));
  const knee = add(hip, dir(a.thigh, LEN.thigh));
  const ankle = add(knee, dir(a.shin, LEN.shin));
  const toe = add(ankle, dir(a.foot, LEN.foot));
  const knee2 = add(hip, dir(a.thigh2, LEN.thigh));
  const ankle2 = add(knee2, dir(a.shin2, LEN.shin));
  const toe2 = add(ankle2, dir(a.foot2, LEN.foot));
  const j: Record<Joint, Pt> = { hip, shoulder, head, elbow, wrist, elbow2, wrist2, knee, ankle, toe, knee2, ankle2, toe2 };
  const off: Pt = [p.at[0] - j[p.anchor][0], p.at[1] - j[p.anchor][1]];
  for (const k of Object.keys(j) as Joint[]) j[k] = add(j[k], off);
  return j;
}

function lerpAngle(a: number, b: number, t: number) {
  let d = ((b - a) % 360 + 540) % 360 - 180;
  return a + d * t;
}

export function interpolate(from: Pose, to: Pose, t: number): Pose {
  const fa = fullAngles(from.a);
  const ta = fullAngles(to.a);
  const a: Angles = {};
  for (const k of Object.keys(fa) as Seg[]) a[k] = lerpAngle(fa[k], ta[k], t);
  return { a, anchor: from.anchor, at: [from.at[0] + (to.at[0] - from.at[0]) * t, from.at[1] + (to.at[1] - from.at[1]) * t] };
}

export const easeInOut = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

/** Fase do ciclo (0→1→0) para um tempo em ms. Subida 1,1 s, pausa, descida 1,5 s, pausa. */
export function cyclePhase(ms: number): number {
  const up = 1100, hold = 350, down = 1500, rest = 450;
  const T = up + hold + down + rest;
  const x = ms % T;
  if (x < up) return easeInOut(x / up);
  if (x < up + hold) return 1;
  if (x < up + hold + down) return 1 - easeInOut((x - up - hold) / down);
  return 0;
}
