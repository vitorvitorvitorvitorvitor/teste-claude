import { describe, expect, it } from 'vitest';
import { EXERCISES, MUSCLES } from '../../src/data/exercises';
import { ANIMS, EXERCISE_ANIM, animFor } from '../../src/ui/figure/animations';
import { figureSvg } from '../../src/ui/figure/render';
import { cyclePhase, interpolate, LEN, solve, type SideAnim } from '../../src/ui/figure/rig';
import { MUSCLE_INFO, muscleMapSvg } from '../../src/ui/figure/muscles';

const dist = (a: [number, number], b: [number, number]) => Math.hypot(a[0] - b[0], a[1] - b[1]);

describe('demonstrações animadas', () => {
  it('todo exercício da biblioteca tem animação própria', () => {
    for (const e of EXERCISES) expect(EXERCISE_ANIM[e.id], e.id).toBeDefined();
    for (const k of Object.values(EXERCISE_ANIM)) expect(ANIMS[k]).toBeDefined();
  });
  it('quadros são SVG válidos, sem NaN, do início ao fim', () => {
    for (const e of EXERCISES) {
      for (const t of [0, 0.25, 0.5, 1]) {
        const svg = figureSvg(animFor(e.id, e.pattern), t, { primary: e.primary, secondary: e.secondary });
        expect(svg.startsWith('<svg')).toBe(true);
        expect(svg).not.toMatch(/NaN|undefined/);
      }
    }
  });
  it('a interpolação preserva o comprimento dos segmentos', () => {
    for (const a of Object.values(ANIMS)) {
      if (a.view !== 'side') continue;
      const j = solve(interpolate((a as SideAnim).from, (a as SideAnim).to, 0.5));
      expect(dist(j.hip, j.knee)).toBeCloseTo(LEN.thigh, 5);
      expect(dist(j.shoulder, j.elbow)).toBeCloseTo(LEN.uArm, 5);
    }
  });
  it('ciclo vai e volta (0 → 1 → 0)', () => {
    expect(cyclePhase(0)).toBe(0);
    expect(cyclePhase(1200)).toBe(1);
    expect(cyclePhase(3400)).toBe(0);
  });
  it('músculo principal é destacado na cor de destaque', () => {
    const e = EXERCISES.find((x) => x.id === 'leg_press')!;
    expect(figureSvg(animFor(e.id, e.pattern), 1, { primary: e.primary, secondary: [] })).toContain('rgb(var(--accent))');
  });
  it('mapa muscular e descrição existem para todos os grupos', () => {
    for (const m of MUSCLES) {
      expect(MUSCLE_INFO[m].length).toBeGreaterThan(10);
      expect(muscleMapSvg(m, [])).toContain('rgb(var(--accent))');
    }
  });
});
