import type {
  Exercise,
  MovementPattern,
  SplitType,
  TemplateSlot,
  TrainingPlan,
  UserProfile,
  WorkoutPreferences,
  WorkoutTemplate
} from '../domain/types';
import { prescribe } from './prescription';
import { pickExercise, type SelectionContext } from './selection';

/**
 * Modelos (blueprints) de cada divisão. Cada slot define um padrão de
 * movimento, prioridade e uma ordem de preferência de exercícios. A escolha
 * final depende de equipamentos, nível e restrições (regra R14) e fica salva
 * na ficha, garantindo continuidade entre sessões.
 */

export interface SlotSpec {
  pattern: MovementPattern;
  fallback?: MovementPattern[];
  priority: 1 | 2 | 3;
  order: string[];
}

export interface TemplateSpec {
  code: string;
  name: string;
  focus: string;
  slots: SlotSpec[];
}

const SQUAT = ['agachamento_goblet', 'leg_press', 'agachamento_smith', 'agachamento_livre', 'agachamento_hack', 'agachamento_peso_corporal'];
const SQUAT_C = ['leg_press', 'agachamento_smith', 'agachamento_goblet', 'agachamento_hack', 'agachamento_livre', 'agachamento_peso_corporal'];
const HPUSH = ['supino_maquina', 'supino_reto_halteres', 'flexao_bracos', 'supino_reto_barra', 'flexao_inclinada'];
const HPUSH_C = ['supino_inclinado_halteres', 'supino_reto_halteres', 'supino_inclinado_barra', 'flexao_inclinada', 'flexao_bracos'];
const VPULL = ['puxada_frente', 'puxada_elastico', 'barra_fixa_supinada', 'barra_fixa', 'pulldown_bracos_estendidos'];
const HPULL = ['remada_baixa_polia', 'remada_maquina', 'remada_unilateral_halter', 'remada_elastico', 'remada_invertida', 'remada_curvada_barra'];
const HPULL_C = ['remada_unilateral_halter', 'remada_maquina', 'remada_elastico', 'remada_baixa_polia', 'remada_invertida', 'remada_curvada_barra'];
const VPUSH = ['desenvolvimento_halteres', 'desenvolvimento_maquina', 'desenvolvimento_elastico', 'desenvolvimento_barra', 'pike_pushup'];
const HINGE = ['terra_romeno_halteres', 'terra_romeno_barra', 'kettlebell_swing', 'terra_romeno_unilateral', 'levantamento_terra'];
const UNI = ['subida_banco', 'afundo_peso_corporal', 'afundo_halteres', 'agachamento_bulgaro'];
const HIP = ['elevacao_pelvica_halter', 'ponte_gluteo', 'elevacao_pelvica_barra', 'coice_polia', 'ponte_unilateral'];
const KNEE_FLEX = ['mesa_flexora', 'cadeira_flexora', 'flexao_nordica'];
const KNEE_EXT = ['cadeira_extensora'];
const CALF = ['panturrilha_em_pe_maquina', 'panturrilha_leg_press', 'panturrilha_sentado', 'panturrilha_halter', 'panturrilha_peso_corporal'];
const LAT = ['elevacao_lateral_halteres', 'elevacao_lateral_polia', 'elevacao_lateral_elastico'];
const REAR = ['face_pull', 'crucifixo_inverso_maquina', 'crucifixo_inverso_halteres'];
const FLY = ['crucifixo_maquina', 'crucifixo_halteres', 'crossover_polia'];
const CURL = ['rosca_alternada', 'rosca_polia', 'rosca_martelo', 'rosca_direta_barra', 'rosca_scott_maquina', 'rosca_elastico'];
const EXT = ['triceps_polia', 'triceps_frances_halter', 'triceps_elastico', 'triceps_testa', 'flexao_fechada', 'mergulho_banco'];
const CORE_AE = ['prancha', 'dead_bug'];
const CORE_AR = ['pallof_polia', 'pallof_elastico', 'perdigueiro', 'prancha_lateral'];
const CORE_FL = ['abdominal_supra', 'abdominal_polia', 'elevacao_pernas'];

export const BLUEPRINTS: Record<Exclude<SplitType, 'custom'>, TemplateSpec[]> = {
  full_body: [
    {
      code: 'A', name: 'Full Body A', focus: 'Agachamento · Empurrar horizontal · Puxar vertical',
      slots: [
        { pattern: 'agachamento', priority: 1, order: SQUAT },
        { pattern: 'empurrar_horizontal', priority: 1, order: HPUSH },
        { pattern: 'puxar_vertical', fallback: ['puxar_horizontal'], priority: 1, order: VPULL },
        { pattern: 'extensao_quadril', priority: 2, order: HIP },
        { pattern: 'core_antiextensao', priority: 2, order: CORE_AE },
        { pattern: 'elevacao_lateral', priority: 3, order: LAT },
        { pattern: 'flexao_cotovelo', priority: 3, order: CURL }
      ]
    },
    {
      code: 'B', name: 'Full Body B', focus: 'Dobradiça de quadril · Empurrar vertical · Puxar horizontal',
      slots: [
        { pattern: 'dobradica', fallback: ['extensao_quadril'], priority: 1, order: HINGE },
        { pattern: 'empurrar_vertical', fallback: ['empurrar_horizontal'], priority: 1, order: VPUSH },
        { pattern: 'puxar_horizontal', priority: 1, order: HPULL },
        { pattern: 'unilateral_pernas', priority: 2, order: UNI },
        { pattern: 'core_antirrotacao', priority: 2, order: CORE_AR },
        { pattern: 'extensao_cotovelo', priority: 3, order: EXT },
        { pattern: 'panturrilha', priority: 3, order: CALF }
      ]
    },
    {
      code: 'C', name: 'Full Body C', focus: 'Pernas · Supino inclinado · Remada',
      slots: [
        { pattern: 'agachamento', priority: 1, order: SQUAT_C },
        { pattern: 'empurrar_horizontal', priority: 1, order: HPUSH_C },
        { pattern: 'puxar_horizontal', fallback: ['puxar_vertical'], priority: 1, order: HPULL_C },
        { pattern: 'flexao_joelho', fallback: ['dobradica'], priority: 2, order: KNEE_FLEX },
        { pattern: 'core_flexao', priority: 2, order: CORE_FL },
        { pattern: 'deltoide_posterior', priority: 3, order: REAR },
        { pattern: 'flexao_cotovelo', priority: 3, order: CURL }
      ]
    }
  ],
  upper_lower: [
    {
      code: 'UA', name: 'Superiores A', focus: 'Peito · Costas · Ombros · Braços',
      slots: [
        { pattern: 'empurrar_horizontal', priority: 1, order: HPUSH },
        { pattern: 'puxar_horizontal', priority: 1, order: HPULL },
        { pattern: 'empurrar_vertical', priority: 2, order: VPUSH },
        { pattern: 'puxar_vertical', priority: 2, order: VPULL },
        { pattern: 'flexao_cotovelo', priority: 3, order: CURL },
        { pattern: 'extensao_cotovelo', priority: 3, order: EXT }
      ]
    },
    {
      code: 'LA', name: 'Inferiores A', focus: 'Quadríceps · Posterior · Glúteos · Core',
      slots: [
        { pattern: 'agachamento', priority: 1, order: SQUAT },
        { pattern: 'dobradica', fallback: ['extensao_quadril'], priority: 1, order: HINGE },
        { pattern: 'flexao_joelho', fallback: ['extensao_quadril'], priority: 2, order: KNEE_FLEX },
        { pattern: 'core_antiextensao', priority: 2, order: CORE_AE },
        { pattern: 'panturrilha', priority: 3, order: CALF }
      ]
    },
    {
      code: 'UB', name: 'Superiores B', focus: 'Costas · Peito inclinado · Ombros · Braços',
      slots: [
        { pattern: 'puxar_vertical', fallback: ['puxar_horizontal'], priority: 1, order: VPULL },
        { pattern: 'empurrar_horizontal', priority: 1, order: HPUSH_C },
        { pattern: 'puxar_horizontal', priority: 2, order: HPULL_C },
        { pattern: 'elevacao_lateral', priority: 2, order: LAT },
        { pattern: 'extensao_cotovelo', priority: 3, order: EXT },
        { pattern: 'flexao_cotovelo', priority: 3, order: CURL }
      ]
    },
    {
      code: 'LB', name: 'Inferiores B', focus: 'Posterior · Unilateral · Glúteos · Core',
      slots: [
        { pattern: 'dobradica', fallback: ['extensao_quadril'], priority: 1, order: HINGE },
        { pattern: 'unilateral_pernas', priority: 1, order: UNI },
        { pattern: 'extensao_quadril', priority: 2, order: HIP },
        { pattern: 'extensao_joelho', fallback: ['agachamento'], priority: 2, order: KNEE_EXT },
        { pattern: 'core_antirrotacao', priority: 2, order: CORE_AR },
        { pattern: 'panturrilha', priority: 3, order: CALF }
      ]
    }
  ],
  ppl: [
    {
      code: 'PUSH', name: 'Empurrar (Push)', focus: 'Peito · Ombros · Tríceps',
      slots: [
        { pattern: 'empurrar_horizontal', priority: 1, order: HPUSH },
        { pattern: 'empurrar_vertical', priority: 1, order: VPUSH },
        { pattern: 'crucifixo', fallback: ['empurrar_horizontal'], priority: 2, order: FLY },
        { pattern: 'elevacao_lateral', priority: 2, order: LAT },
        { pattern: 'extensao_cotovelo', priority: 2, order: EXT }
      ]
    },
    {
      code: 'PULL', name: 'Puxar (Pull)', focus: 'Costas · Deltoide posterior · Bíceps',
      slots: [
        { pattern: 'puxar_vertical', fallback: ['puxar_horizontal'], priority: 1, order: VPULL },
        { pattern: 'puxar_horizontal', priority: 1, order: HPULL },
        { pattern: 'deltoide_posterior', priority: 2, order: REAR },
        { pattern: 'flexao_cotovelo', priority: 2, order: CURL },
        { pattern: 'core_flexao', priority: 3, order: CORE_FL }
      ]
    },
    {
      code: 'LEGS', name: 'Pernas (Legs)', focus: 'Quadríceps · Posterior · Glúteos · Panturrilhas',
      slots: [
        { pattern: 'agachamento', priority: 1, order: SQUAT },
        { pattern: 'dobradica', fallback: ['extensao_quadril'], priority: 1, order: HINGE },
        { pattern: 'flexao_joelho', fallback: ['unilateral_pernas'], priority: 2, order: KNEE_FLEX },
        { pattern: 'panturrilha', priority: 3, order: CALF },
        { pattern: 'core_antiextensao', priority: 3, order: CORE_AE }
      ]
    }
  ]
};

export const SPLIT_LABEL: Record<SplitType, string> = {
  full_body: 'Full Body',
  upper_lower: 'Superiores / Inferiores',
  ppl: 'Push / Pull / Legs',
  custom: 'Personalizado'
};

/** Quantas fichas da divisão usar (Full Body C só com ≥3 dias/semana). */
export function specsFor(split: Exclude<SplitType, 'custom'>, daysPerWeek: number): TemplateSpec[] {
  const all = BLUEPRINTS[split];
  if (split === 'full_body') return daysPerWeek >= 3 ? all : all.slice(0, 2);
  return all;
}

/** Avisos de adequação da divisão (regra R02). */
export function splitWarnings(split: SplitType, daysPerWeek: number, level: UserProfile['level']): string[] {
  const w: string[] = [];
  if (split === 'ppl' && daysPerWeek < 6 && level === 'iniciante') {
    w.push(
      daysPerWeek <= 3
        ? 'Com até 3 dias por semana, Push/Pull/Legs treina cada músculo cerca de 1× por semana. Para iniciantes, Full Body costuma ser mais prático.'
        : 'Push/Pull/Legs com menos de 6 dias treina cada músculo menos de 2× por semana. Full Body ou Superiores/Inferiores podem ser mais práticos.'
    );
  }
  if (split === 'upper_lower' && daysPerWeek <= 2) {
    w.push('Com 2 dias por semana, Superiores/Inferiores treina cada músculo 1× por semana. Full Body permite 2×.');
  }
  return w;
}

let counter = 0;
export function uid(prefix: string): string {
  counter = (counter + 1) % 1e6;
  const rnd = typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID().slice(0, 8) : Math.random().toString(36).slice(2, 10);
  return `${prefix}_${Date.now().toString(36)}${counter.toString(36)}${rnd}`;
}

export interface BuildContext {
  profile: UserProfile;
  prefs: WorkoutPreferences;
  library: Exercise[];
}

export function selectionContext(ctx: BuildContext, extraRegions: UserProfile['limitations'] = []): SelectionContext {
  return {
    equipment: ctx.profile.equipment,
    level: ctx.profile.level,
    avoid: ctx.profile.avoidExercises,
    preferred: ctx.prefs.preferredExercises,
    avoidRegions: [...new Set([...ctx.profile.limitations, ...extraRegions])],
    library: ctx.library
  };
}

/** Constrói os slots de uma ficha a partir do modelo (determinístico). */
export function buildSlots(spec: TemplateSpec, ctx: BuildContext, usedInPlan: Set<string>, variant = 0): TemplateSlot[] {
  const sel = selectionContext(ctx);
  const inTemplate = new Set<string>();
  const slots: TemplateSlot[] = [];
  spec.slots.forEach((s, i) => {
    const exclude = new Set([...inTemplate, ...usedInPlan]);
    const ex = pickExercise([s.pattern, ...(s.fallback ?? [])], sel, s.order, exclude, variant);
    if (!ex) return;
    inTemplate.add(ex.id);
    const p = prescribe(ex, s.priority, { level: ctx.profile.level, goal: ctx.profile.goal, style: ctx.profile.style, prefs: ctx.prefs });
    slots.push({
      slotId: `${spec.code}-${i}`,
      pattern: ex.pattern,
      exerciseId: ex.id,
      sets: p.sets,
      repMin: p.repMin,
      repMax: p.repMax,
      restSec: p.restSec,
      priority: s.priority
    });
  });
  slots.forEach((s) => usedInPlan.add(s.exerciseId));
  return slots;
}

export interface GeneratedPlan {
  plan: TrainingPlan;
  templates: WorkoutTemplate[];
}

export function generatePlan(split: SplitType, ctx: BuildContext, now = new Date()): GeneratedPlan {
  const planId = uid('plan');
  const createdAt = now.toISOString();
  if (split === 'custom') {
    const t: WorkoutTemplate = {
      id: uid('tpl'), planId, code: 'A', name: 'Treino A', focus: 'Personalizado', order: 0, slots: [], version: 1, createdAt
    };
    return {
      plan: { id: planId, split, name: SPLIT_LABEL[split], active: true, sequence: [t.id], createdAt },
      templates: [t]
    };
  }
  const specs = specsFor(split, ctx.profile.daysPerWeek);
  const used = new Set<string>();
  const templates = specs.map<WorkoutTemplate>((spec, i) => ({
    id: uid('tpl'),
    planId,
    code: spec.code,
    name: spec.name,
    focus: spec.focus,
    order: i,
    slots: buildSlots(spec, ctx, used),
    version: 1,
    createdAt
  }));
  return {
    plan: { id: planId, split, name: SPLIT_LABEL[split], active: true, sequence: templates.map((t) => t.id), createdAt },
    templates
  };
}

/**
 * Regenera uma ficha escolhendo a próxima variação de cada slot.
 * A versão anterior é preservada (arquivada) para o histórico.
 */
export function regenerateTemplate(old: WorkoutTemplate, split: SplitType, ctx: BuildContext, now = new Date()): WorkoutTemplate {
  const spec =
    split === 'custom'
      ? undefined
      : BLUEPRINTS[split].find((s) => s.code === old.code);
  const variant = old.version;
  let slots: TemplateSlot[];
  if (spec) {
    slots = buildSlots(spec, ctx, new Set(), variant);
  } else {
    const sel = selectionContext(ctx);
    slots = old.slots.map((s) => {
      const cur = ctx.library.find((e) => e.id === s.exerciseId);
      const ex = pickExercise([s.pattern], sel, cur?.alternatives ?? [], new Set([s.exerciseId]), 0) ?? cur;
      return { ...s, exerciseId: ex?.id ?? s.exerciseId };
    });
  }
  return { ...old, id: uid('tpl'), slots, version: old.version + 1, archived: false, createdAt: now.toISOString() };
}

/**
 * Revalida as escolhas da ficha contra o perfil atual (equipamento,
 * bloqueios, limitações). Retorna slots corrigidos e explicações.
 */
export function revalidateSlots(
  t: WorkoutTemplate,
  ctx: BuildContext,
  extraRegions: UserProfile['limitations'] = []
): { slots: TemplateSlot[]; notes: string[]; changed: boolean } {
  const sel = selectionContext(ctx, extraRegions);
  const notes: string[] = [];
  let changed = false;
  const used = new Set(t.slots.map((s) => s.exerciseId));
  const slots: TemplateSlot[] = [];
  for (const s of t.slots) {
    const ex = ctx.library.find((e) => e.id === s.exerciseId);
    const invalid =
      !ex ||
      sel.avoid.includes(s.exerciseId) ||
      !ex.equipment.every((e) => e === 'peso_corporal' || sel.equipment.includes(e)) ||
      ex.stressRegions.some((r) => sel.avoidRegions.includes(r));
    if (!invalid) {
      slots.push(s);
      continue;
    }
    changed = true;
    const rep = pickExercise([s.pattern], sel, ex?.alternatives ?? [], used);
    if (rep) {
      used.add(rep.id);
      notes.push(`${ex?.name ?? 'Exercício'} foi trocado por ${rep.name} (equivalente disponível).`);
      slots.push({ ...s, exerciseId: rep.id, pattern: rep.pattern });
    } else {
      notes.push(`${ex?.name ?? 'Exercício'} foi removido hoje: sem equivalente compatível com suas restrições.`);
    }
  }
  return { slots, notes, changed };
}
