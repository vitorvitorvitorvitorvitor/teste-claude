import { describe, expect, it } from 'vitest';
import { EXERCISES } from '../../src/data/exercises';
import { DEFAULT_PREFS } from '../../src/db/db';
import { suggestLoad, stepFor } from '../../src/engine/progression';
import { compareSessions, estimateMinutes, muscleSets, sessionVolume } from '../../src/engine/volume';
import type { SessionExercise } from '../../src/domain/types';

const sup = EXERCISES.find((e) => e.id === 'supino_maquina')!;
const target = { repMin: 8, repMax: 12, targetRir: [2, 3] as [number, number], sets: 2 };

function ex(sets: [number, number, number | null][]): SessionExercise {
  return {
    slotId: 's', exerciseId: sup.id, exerciseName: sup.name, pattern: sup.pattern, primary: 'peito', secondary: ['triceps', 'ombros'],
    loadType: 'carga', targetSets: sets.length, repMin: 8, repMax: 12, restSec: 120, targetRir: [2, 3], suggestedWeightKg: null,
    previousWeightKg: null, suggestionNote: '', notes: '',
    sets: sets.map(([w, r, rir], i) => ({ setIndex: i, weightKg: w, reps: r, rir, done: true }))
  };
}

describe('engine.progression', () => {
  it('primeira vez: sem carga sugerida', () => {
    const s = suggestLoad(sup, [], target, DEFAULT_PREFS);
    expect(s.action).toBe('primeira_vez');
    expect(s.suggestedWeightKg).toBeNull();
  });
  it('sugere aumento no topo da faixa', () => {
    const s = suggestLoad(sup, [{ exercise: ex([[30, 12, 2], [30, 12, 2]]) }], target, DEFAULT_PREFS);
    expect(s.action).toBe('aumentar');
    expect(s.suggestedWeightKg).toBe(32.5);
    expect(s.previousWeightKg).toBe(30);
  });
  it('mantém quando RIR baixo (esforço acima do previsto)', () => {
    const s = suggestLoad(sup, [{ exercise: ex([[30, 12, 0], [30, 12, 1]]) }], target, DEFAULT_PREFS);
    expect(s.action).toBe('manter');
    expect(s.suggestedWeightKg).toBe(30);
  });
  it('mantém quando ainda não atingiu o topo', () => {
    const s = suggestLoad(sup, [{ exercise: ex([[30, 12, 2], [30, 10, 2]]) }], target, DEFAULT_PREFS);
    expect(s.action).toBe('manter');
  });
  it('reduz após quedas recorrentes', () => {
    const h = [{ exercise: ex([[40, 6, 1], [40, 5, 0]]) }, { exercise: ex([[40, 7, 1], [40, 6, 1]]) }];
    const s = suggestLoad(sup, h, target, DEFAULT_PREFS);
    expect(s.action).toBe('reduzir');
    expect(s.suggestedWeightKg!).toBeLessThan(40);
  });
  it('uma única queda apenas mantém', () => {
    const h = [{ exercise: ex([[40, 6, 1], [40, 5, 0]]) }, { exercise: ex([[37.5, 12, 2], [37.5, 12, 2]]) }];
    expect(suggestLoad(sup, h, target, DEFAULT_PREFS).action).toBe('manter');
  });
  it('modo retorno sugere ~90% arredondado ao incremento disponível', () => {
    const s = suggestLoad(sup, [{ exercise: ex([[40, 10, 2], [40, 10, 2]]) }], target, DEFAULT_PREFS, { returnMode: true });
    expect(s.suggestedWeightKg).toBe(35);
  });
  it('incremento depende do equipamento', () => {
    const goblet = EXERCISES.find((e) => e.id === 'agachamento_goblet')!;
    const leg = EXERCISES.find((e) => e.id === 'leg_press')!;
    expect(stepFor(goblet, DEFAULT_PREFS)).toBe(2);
    expect(stepFor(leg, DEFAULT_PREFS)).toBe(5);
  });
  it('peso corporal progride em repetições', () => {
    const push = EXERCISES.find((e) => e.id === 'flexao_bracos')!;
    const e = { ...ex([[0, 8, 2]]), loadType: 'peso_corporal' as const };
    expect(suggestLoad(push, [{ exercise: e }], { ...target, repMin: 6 }, DEFAULT_PREFS).action).toBe('repeticoes');
  });
});

describe('engine.volume', () => {
  it('calcula volume de carga (kg × reps) apenas de séries concluídas', () => {
    const e = ex([[30, 10, 2], [30, 8, 2]]);
    e.sets.push({ setIndex: 2, weightKg: 30, reps: 10, rir: null, done: false });
    expect(sessionVolume({ exercises: [e] })).toBe(540);
  });
  it('séries indiretas contam 0,5', () => {
    const m = muscleSets([{ exercises: [ex([[30, 10, 2], [30, 10, 2]])] }]);
    expect(m.peito).toBe(2);
    expect(m.triceps).toBe(1);
    expect(m.ombros).toBe(1);
  });
  it('peso corporal não entra no volume de carga', () => {
    const e = { ...ex([[0, 10, 2]]), loadType: 'peso_corporal' as const };
    expect(sessionVolume({ exercises: [e] })).toBe(0);
  });
  it('estimativa de duração cresce com séries', () => {
    const a = estimateMinutes([{ sets: 2, restSec: 120, loadType: 'carga', repMax: 12 }]);
    const b = estimateMinutes([{ sets: 4, restSec: 120, loadType: 'carga', repMax: 12 }]);
    expect(b).toBeGreaterThan(a);
  });
  it('compara com sessão anterior', () => {
    const cur = { exercises: [ex([[32.5, 10, 2], [32.5, 10, 2]])], durationSec: 1800 } as never;
    const prev = { exercises: [ex([[30, 10, 2], [30, 10, 2]])], durationSec: 2000 } as never;
    const c = compareSessions(cur, prev)!;
    expect(c.volumeDelta).toBe(50);
    expect(c.improvedExercises).toContain(sup.name);
  });
});
