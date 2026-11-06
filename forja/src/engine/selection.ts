import type { BodyRegion, Equipment, Exercise, Level, MovementPattern } from '../domain/types';

/**
 * Seleção e substituição determinística de exercícios (regras R10 e R14).
 */

export interface SelectionContext {
  equipment: Equipment[];
  level: Level;
  avoid: string[];
  preferred: string[];
  /** Regiões a evitar (limitações do perfil + desconforto relatado hoje). */
  avoidRegions: BodyRegion[];
  library: Exercise[];
}

export type Exclusion = 'equipamento' | 'bloqueado' | 'limitacao' | 'nivel';

export function hasEquipment(ex: Exercise, eq: Equipment[]): boolean {
  return ex.equipment.every((e) => e === 'peso_corporal' || eq.includes(e));
}

export function levelMax(level: Level): number {
  return level === 'iniciante' ? 2 : 3;
}

/** Retorna o motivo pelo qual o exercício não pode ser usado, ou null. */
export function exclusionReason(ex: Exercise, ctx: SelectionContext): Exclusion | null {
  if (ctx.avoid.includes(ex.id)) return 'bloqueado';
  if (!hasEquipment(ex, ctx.equipment)) return 'equipamento';
  if (ex.stressRegions.some((r) => ctx.avoidRegions.includes(r))) return 'limitacao';
  return null;
}

/**
 * Lista ordenada de candidatos para um padrão de movimento.
 * Ordem: preferidos pelo usuário → ordem sugerida pela ficha → dificuldade
 * adequada ao nível → ordem da biblioteca. Exercícios acima do nível só
 * entram se não houver alternativa.
 */
export function candidates(
  pattern: MovementPattern,
  ctx: SelectionContext,
  order: string[] = []
): Exercise[] {
  const pool = ctx.library.filter((e) => e.pattern === pattern && exclusionReason(e, ctx) === null);
  const max = levelMax(ctx.level);
  const rank = (e: Exercise) => {
    const pref = ctx.preferred.includes(e.id) ? 0 : 1;
    const idx = order.indexOf(e.id);
    const ord = idx === -1 ? 100 : idx;
    const over = e.difficulty > max ? 1 : 0;
    const diff = ctx.level === 'iniciante' ? e.difficulty : 0;
    const lib = ctx.library.indexOf(e);
    return [over, pref, ord, diff, lib];
  };
  return [...pool].sort((a, b) => {
    const ra = rank(a);
    const rb = rank(b);
    for (let i = 0; i < ra.length; i++) if (ra[i] !== rb[i]) return ra[i] - rb[i];
    return 0;
  });
}

export function pickExercise(
  patterns: MovementPattern[],
  ctx: SelectionContext,
  order: string[] = [],
  exclude: Set<string> = new Set(),
  offset = 0
): Exercise | null {
  for (const p of patterns) {
    const list = candidates(p, ctx, order).filter((e) => !exclude.has(e.id));
    if (list.length > 0) return list[offset % list.length];
  }
  // Se tudo foi excluído por estar em uso, permite repetir.
  for (const p of patterns) {
    const list = candidates(p, ctx, order);
    if (list.length > 0) return list[offset % list.length];
  }
  return null;
}

/** Alternativas equivalentes válidas para troca manual. */
export function swapOptions(ex: Exercise, ctx: SelectionContext): Exercise[] {
  return candidates(ex.pattern, ctx, ex.alternatives).filter((e) => e.id !== ex.id);
}
