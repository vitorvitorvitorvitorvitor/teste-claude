import type { MuscleGroup } from '../../domain/types';

/** Mapa muscular original (frente e costas) em SVG. */

type Shape = { m: MuscleGroup | null; d: string };
const E = (cx: number, cy: number, rx: number, ry: number) => `M${cx - rx},${cy} a${rx},${ry} 0 1,0 ${rx * 2},0 a${rx},${ry} 0 1,0 ${-rx * 2},0`;
const pair = (m: MuscleGroup | null, cx: number, cy: number, rx: number, ry: number, _gap = 0): Shape[] => [
  { m, d: E(cx, cy, rx, ry) },
  { m, d: E(120 - cx, cy, rx, ry) }
];

const R = (x: number, y: number, w: number, h: number, r: number) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}"/>`;
const SILHOUETTE = [
  '<circle cx="60" cy="16" r="11"/>',
  R(55, 25, 10, 12, 3),
  R(38, 34, 44, 90, 14),
  R(20, 40, 14, 44, 7), R(86, 40, 14, 44, 7),
  R(17, 80, 12, 42, 6), R(91, 80, 12, 42, 6),
  R(42, 116, 17, 58, 8), R(61, 116, 17, 58, 8),
  R(44, 172, 13, 48, 6), R(63, 172, 13, 48, 6)
].join('');

const FRONT: Shape[] = [
  ...pair('ombros', 32, 45, 8, 8),
  ...pair('peito', 51, 55, 10, 8),
  ...pair('biceps', 27, 66, 5.5, 12),
  ...pair(null, 23, 100, 4.5, 13),
  { m: 'core', d: 'M51,68 h18 v40 a6,6 0 0,1 -6,6 h-6 a6,6 0 0,1 -6,-6 Z' },
  ...pair('quadriceps', 50.5, 146, 7.5, 23),
  ...pair(null, 50.5, 194, 5, 17)
];
const BACK: Shape[] = [
  { m: 'costas', d: 'M46,36 h28 l8,10 -5,36 -9,10 h-16 l-9,-10 -5,-36 Z' },
  ...pair('ombros', 32, 45, 8, 8),
  ...pair('triceps', 27, 66, 5.5, 12),
  ...pair(null, 23, 100, 4.5, 13),
  { m: 'core', d: 'M53,96 h14 v14 h-14 Z' },
  ...pair('gluteos', 51, 124, 9, 9),
  ...pair('posterior', 50.5, 152, 7, 18),
  ...pair('panturrilhas', 50.5, 192, 5.5, 14)
];

function view(shapes: Shape[], primary: MuscleGroup, secondary: MuscleGroup[], label: string, dx: number) {
  const fill = (m: MuscleGroup | null) =>
    m === primary ? 'rgb(var(--accent))' : m && secondary.includes(m) ? 'rgb(var(--accent) / 0.45)' : 'rgb(var(--line))';
  return `<g transform="translate(${dx},0)"><g style="fill:rgb(var(--bg))">${SILHOUETTE}</g>${shapes
    .map((s) => `<path d="${s.d}" style="fill:${fill(s.m)}"/>`)
    .join('')}<text x="60" y="236" text-anchor="middle" style="fill:rgb(var(--muted));font-size:10px">${label}</text></g>`;
}

export function muscleMapSvg(primary: MuscleGroup, secondary: MuscleGroup[]): string {
  return `<svg viewBox="0 0 250 242" xmlns="http://www.w3.org/2000/svg" role="img">${view(FRONT, primary, secondary, 'Frente', 0)}${view(BACK, primary, secondary, 'Costas', 130)}</svg>`;
}

export const MUSCLE_INFO: Record<MuscleGroup, string> = {
  peito: 'Peitoral maior: aproxima os braços e empurra à frente do corpo. Sente-se no meio do peito, não no ombro.',
  costas: 'Dorsais, romboides e trapézio: puxam os braços para baixo e para trás e estabilizam as escápulas.',
  ombros: 'Deltoides: elevam o braço à frente, ao lado e para trás. Parte anterior, lateral ou posterior conforme o exercício.',
  quadriceps: 'Quadríceps (frente da coxa): estendem o joelho. Trabalham forte em agachamentos, leg press e extensora.',
  posterior: 'Isquiotibiais (parte de trás da coxa): flexionam o joelho e estendem o quadril.',
  gluteos: 'Glúteos: estendem o quadril (levantar do agachamento, subir o quadril na ponte) e estabilizam a pelve.',
  panturrilhas: 'Gastrocnêmio e sóleo: elevam o calcanhar (flexão plantar).',
  biceps: 'Bíceps braquial: flexiona o cotovelo e gira a palma para cima.',
  triceps: 'Tríceps: estende o cotovelo. Atua em todos os movimentos de empurrar.',
  core: 'Abdômen e músculos do tronco: estabilizam a coluna, resistem à extensão e à rotação e flexionam o tronco.'
};
