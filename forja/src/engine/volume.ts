import type { MuscleGroup, SessionExercise, WorkoutSession } from '../domain/types';
import { MUSCLES } from '../data/exercises';

/** Sessões que contam como treino realizado (concluídas ou parciais). */
export function isCountedStatus(s: WorkoutSession): boolean {
  return s.status === 'concluida' || s.status === 'parcial';
}

export function doneSets(ex: SessionExercise) {
  return ex.sets.filter((s) => s.done);
}

export function sessionCompletion(s: Pick<WorkoutSession, 'exercises'>): { done: number; total: number; ratio: number } {
  let done = 0;
  let total = 0;
  for (const e of s.exercises) {
    total += e.sets.length;
    done += doneSets(e).length;
  }
  return { done, total, ratio: total === 0 ? 0 : done / total };
}

/**
 * Volume de carga estimado (kg × repetições) somente para séries com carga
 * registrada. Exercícios de peso corporal/tempo não entram (não calculável).
 * Para halteres usa-se a carga registrada (por halter), como informado na UI.
 */
export function exerciseVolume(ex: SessionExercise): number {
  if (ex.loadType !== 'carga') return 0;
  return doneSets(ex).reduce((acc, s) => acc + (s.weightKg ?? 0) * (s.reps ?? 0), 0);
}

export function sessionVolume(s: Pick<WorkoutSession, 'exercises'>): number {
  return s.exercises.reduce((a, e) => a + exerciseVolume(e), 0);
}

export function sessionReps(s: Pick<WorkoutSession, 'exercises'>): number {
  return s.exercises.reduce(
    (a, e) => a + (e.loadType === 'tempo' ? 0 : doneSets(e).reduce((x, st) => x + (st.reps ?? 0), 0)),
    0
  );
}

/**
 * Séries por grupo muscular: séries diretas valem 1, indiretas 0,5
 * (abordagem fracionada que melhor explicou os dados em Pelland et al.).
 */
export function muscleSets(sessions: Pick<WorkoutSession, 'exercises'>[], onlyDone = true): Record<MuscleGroup, number> {
  const out = Object.fromEntries(MUSCLES.map((m) => [m, 0])) as Record<MuscleGroup, number>;
  for (const s of sessions) {
    for (const e of s.exercises) {
      const n = onlyDone ? doneSets(e).length : e.targetSets;
      if (!n) continue;
      out[e.primary] += n;
      for (const m of e.secondary) out[m] += n * 0.5;
    }
  }
  return out;
}

export function estimated1RM(weight: number, reps: number): number | null {
  // Epley; usada apenas como indicador de tendência, nunca como teste máximo.
  if (!weight || !reps || reps > 15) return null;
  return Math.round(weight * (1 + reps / 30) * 10) / 10;
}

export interface SessionComparison {
  volumeDelta: number | null;
  setsDelta: number;
  durationDelta: number;
  improvedExercises: string[];
}

export function compareSessions(cur: WorkoutSession, prev: WorkoutSession | undefined): SessionComparison | null {
  if (!prev) return null;
  const cv = sessionVolume(cur);
  const pv = sessionVolume(prev);
  const improved: string[] = [];
  for (const e of cur.exercises) {
    const pe = prev.exercises.find((x) => x.exerciseId === e.exerciseId);
    if (!pe) continue;
    const best = (x: SessionExercise) =>
      Math.max(0, ...doneSets(x).map((s) => (x.loadType === 'carga' ? (s.weightKg ?? 0) * 1000 + (s.reps ?? 0) : s.reps ?? 0)));
    if (best(e) > best(pe) && best(pe) > 0) improved.push(e.exerciseName);
  }
  return {
    volumeDelta: cv > 0 && pv > 0 ? cv - pv : null,
    setsDelta: sessionCompletion(cur).done - sessionCompletion(prev).done,
    durationDelta: cur.durationSec - prev.durationSec,
    improvedExercises: improved
  };
}

/** Estimativa de duração em minutos (inclui aquecimento opcional). */
export function estimateMinutes(
  items: { sets: number; restSec: number; loadType: string; repMax: number }[],
  warmupMin = 5
): number {
  let sec = warmupMin * 60;
  for (const it of items) {
    const work = it.loadType === 'tempo' ? it.repMax : 40;
    sec += it.sets * work + Math.max(0, it.sets - 1) * it.restSec + 60; // 60 s de transição/ajuste
  }
  return Math.max(5, Math.round(sec / 60));
}
