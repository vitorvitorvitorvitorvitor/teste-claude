import type { Exercise, Goal, Level, TrainingStyle, WorkoutPreferences } from '../domain/types';

/**
 * Prescrição por exercício (regras R04, R05, R06, R07 em src/data/science.ts).
 * Números são pontos de partida conservadores, não garantias individuais.
 */

export interface Prescription {
  sets: number;
  repMin: number;
  repMax: number;
  restSec: number;
  targetRir: [number, number];
}

export interface PrescriptionContext {
  level: Level;
  goal: Goal;
  style: TrainingStyle;
  prefs?: Pick<WorkoutPreferences, 'repRangeOverride' | 'restOverride'>;
}

export function baseSets(level: Level, priority: 1 | 2 | 3, goal: Goal): number {
  if (level === 'iniciante') return 2;
  if (priority === 3) return level === 'avancado' ? 3 : 2;
  if (level === 'avancado' && (goal === 'hipertrofia' || goal === 'forca') && priority === 1) return 4;
  return 3;
}

export function targetRir(level: Level): [number, number] {
  if (level === 'iniciante') return [2, 3];
  if (level === 'intermediario') return [1, 3];
  return [0, 2];
}

export function repRange(ex: Exercise, ctx: PrescriptionContext): [number, number] {
  if (ex.loadType === 'tempo') {
    return ctx.level === 'iniciante' ? [20, 40] : [30, 60];
  }
  if (ex.loadType === 'peso_corporal') {
    if (ex.kind === 'isolado' || ex.kind === 'core') return [10, 15];
    return ctx.level === 'iniciante' ? [6, 12] : [8, 15];
  }
  if (ctx.prefs?.repRangeOverride) {
    const { min, max } = ctx.prefs.repRangeOverride;
    if (min > 0 && max >= min) return [min, max];
  }
  const compound = ex.kind === 'composto';
  switch (ctx.goal) {
    case 'forca':
      if (!compound) return [8, 12];
      if (ctx.level === 'iniciante') return [6, 10];
      return ctx.level === 'intermediario' ? [5, 8] : [4, 6];
    case 'hipertrofia':
      if (!compound) return [10, 15];
      return ctx.level === 'avancado' ? [6, 10] : [8, 12];
    case 'condicionamento':
    case 'emagrecimento':
    case 'saude':
    default:
      if (ex.kind === 'core') return [10, 15];
      return compound ? [8, 12] : [12, 15];
  }
}

export function restSeconds(ex: Exercise, ctx: PrescriptionContext): number {
  if (ctx.prefs?.restOverride && ctx.prefs.restOverride > 0) return ctx.prefs.restOverride;
  const compound = ex.kind === 'composto';
  if (ctx.style === 'circuito') return compound ? 75 : 45;
  if (ex.kind === 'core') return 45;
  if (ctx.goal === 'forca' && compound) return ctx.level === 'iniciante' ? 150 : 180;
  if (ctx.goal === 'condicionamento') return compound ? 90 : 60;
  return compound ? 120 : 75;
}

export function prescribe(ex: Exercise, priority: 1 | 2 | 3, ctx: PrescriptionContext): Prescription {
  const [repMin, repMax] = repRange(ex, ctx);
  return {
    sets: baseSets(ctx.level, priority, ctx.goal),
    repMin,
    repMax,
    restSec: restSeconds(ex, ctx),
    targetRir: targetRir(ctx.level)
  };
}

/** Limite semanal de séries diretas por músculo antes de reduzir acessórios. */
export function weeklySetCap(level: Level): number {
  return level === 'iniciante' ? 10 : level === 'intermediario' ? 16 : 20;
}
