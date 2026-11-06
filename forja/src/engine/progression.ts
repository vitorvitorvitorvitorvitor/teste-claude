import type { Exercise, SessionExercise, WorkoutPreferences } from '../domain/types';
import { doneSets } from './volume';

/**
 * Progressão dupla (regra R08). Nunca altera a carga automaticamente: apenas
 * retorna uma sugestão que o usuário precisa confirmar na tela de execução.
 */

export interface LoadSuggestion {
  previousWeightKg: number | null;
  suggestedWeightKg: number | null;
  action: 'primeira_vez' | 'aumentar' | 'manter' | 'reduzir' | 'repeticoes';
  note: string;
}

export interface Exposure {
  exercise: SessionExercise;
  sessionRpe?: number;
}

export function stepFor(ex: Exercise, prefs: Pick<WorkoutPreferences, 'dumbbellStepKg' | 'machineStepKg' | 'barbellStepKg'>): number {
  const eq = ex.equipment;
  let step: number;
  if (eq.includes('halteres')) step = prefs.dumbbellStepKg;
  else if (eq.includes('barra')) step = prefs.barbellStepKg;
  else if (eq.includes('kettlebell')) step = 4;
  else step = prefs.machineStepKg;
  // Compostos de membros inferiores em barra/máquina toleram o dobro do menor incremento.
  const lowerCompound = ['agachamento', 'dobradica', 'extensao_quadril'].includes(ex.pattern) && ex.kind === 'composto';
  if (lowerCompound && !eq.includes('halteres') && !eq.includes('kettlebell')) step *= 2;
  return step;
}

function roundTo(x: number, step: number): number {
  const s = step > 0 ? step : 0.5;
  return Math.round(x / s) * s;
}

function workingWeight(e: SessionExercise): number | null {
  const ws = doneSets(e).map((s) => s.weightKg ?? 0).filter((w) => w > 0);
  return ws.length ? Math.max(...ws) : null;
}

const fmt = (n: number) => n.toLocaleString('pt-BR', { maximumFractionDigits: 2 });

/**
 * @param history exposições anteriores ao exercício, da mais recente para a mais antiga
 * @param target faixa e RIR alvo da sessão atual
 */
export function suggestLoad(
  ex: Exercise,
  history: Exposure[],
  target: { repMin: number; repMax: number; targetRir: [number, number]; sets: number },
  prefs: Pick<WorkoutPreferences, 'dumbbellStepKg' | 'machineStepKg' | 'barbellStepKg'>,
  opts: { returnMode?: boolean } = {}
): LoadSuggestion {
  const valid = history.filter((h) => doneSets(h.exercise).length > 0);
  if (ex.loadType !== 'carga') {
    const last = valid[0];
    if (!last) return { previousWeightKg: null, suggestedWeightKg: null, action: 'primeira_vez', note: 'Primeira vez: foque na técnica e em repetições controladas.' };
    const sets = doneSets(last.exercise);
    const allTop = sets.length >= Math.min(target.sets, last.exercise.targetSets) && sets.every((s) => (s.reps ?? 0) >= target.repMax);
    return {
      previousWeightKg: null,
      suggestedWeightKg: null,
      action: 'repeticoes',
      note: allTop
        ? ex.loadType === 'tempo'
          ? 'Você atingiu o tempo máximo da faixa: aumente 5–10 s ou escolha uma variação mais difícil.'
          : 'Você atingiu o topo da faixa: considere uma variação mais difícil ou adicionar carga.'
        : `Última vez: ${sets.map((s) => s.reps ?? 0).join(' / ')}${ex.loadType === 'tempo' ? ' s' : ' reps'}. Busque +1 ${ex.loadType === 'tempo' ? 'a 5 s' : 'repetição'}.`
    };
  }

  const last = valid.find((h) => workingWeight(h.exercise) !== null);
  if (!last) {
    return {
      previousWeightKg: null,
      suggestedWeightKg: null,
      action: 'primeira_vez',
      note: `Primeira vez: escolha uma carga que permita ${target.repMin}–${target.repMax} repetições com cerca de ${target.targetRir[0]}–${target.targetRir[1]} repetições de reserva. Não é preciso testar carga máxima.`
    };
  }
  const w = workingWeight(last.exercise)!;
  const sets = doneSets(last.exercise).filter((s) => (s.weightKg ?? 0) === w);
  const step = stepFor(ex, prefs);

  if (opts.returnMode) {
    const s = roundTo(w * 0.9, step);
    return { previousWeightKg: w, suggestedWeightKg: s, action: 'reduzir', note: `Retorno após pausa: comece com ~90% da última carga (${fmt(s)} kg) e reavalie.` };
  }

  const required = Math.min(target.sets, last.exercise.targetSets);
  const allTop = sets.length >= required && sets.every((s) => (s.reps ?? 0) >= target.repMax);
  const rirs = sets.map((s) => s.rir).filter((r): r is number => r !== null && r !== undefined);
  const tooHard = rirs.some((r) => r < target.targetRir[0]) || (last.sessionRpe ?? 0) >= 9;

  const belowMin = (e: SessionExercise, weight: number) =>
    doneSets(e).some((s) => (s.weightKg ?? 0) >= weight && (s.reps ?? 0) < target.repMin);

  // Queda recorrente: duas exposições mais recentes abaixo do mínimo com carga igual ou maior.
  const prev = valid.filter((h) => workingWeight(h.exercise) !== null)[1];
  if (belowMin(last.exercise, w) && prev && belowMin(prev.exercise, w)) {
    const s = Math.max(0, roundTo(w * 0.9, step));
    return {
      previousWeightKg: w,
      suggestedWeightKg: s < w ? s : Math.max(0, w - step),
      action: 'reduzir',
      note: `Repetições abaixo de ${target.repMin} em duas sessões seguidas com ${fmt(w)} kg. Considere reduzir para ${fmt(s < w ? s : Math.max(0, w - step))} kg e reconstruir a progressão. Cansaço, sono e estresse também influenciam.`
    };
  }
  if (belowMin(last.exercise, w)) {
    return { previousWeightKg: w, suggestedWeightKg: w, action: 'manter', note: `Mantenha ${fmt(w)} kg e busque chegar a ${target.repMin} repetições em todas as séries.` };
  }
  if (allTop && !tooHard) {
    const s = w + step;
    const pct = Math.round((step / w) * 100);
    return {
      previousWeightKg: w,
      suggestedWeightKg: s,
      action: 'aumentar',
      note: `Você fez ${sets.length}×${target.repMax}+ com ${fmt(w)} kg dentro do esforço previsto. Sugestão: ${fmt(s)} kg (+${fmt(step)} kg${pct > 10 ? `, +${pct}% — ao subir, recomece perto de ${target.repMin} reps` : ''}). Confirme se a técnica estava boa.`
    };
  }
  if (allTop && tooHard) {
    return { previousWeightKg: w, suggestedWeightKg: w, action: 'manter', note: `Topo da faixa atingido, mas com esforço acima do previsto. Mantenha ${fmt(w)} kg até ficar mais confortável.` };
  }
  return { previousWeightKg: w, suggestedWeightKg: w, action: 'manter', note: `Mantenha ${fmt(w)} kg e tente +1 repetição em alguma série (meta ${target.repMax}).` };
}
