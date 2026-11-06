import type {
  BodyRegion,
  DayLog,
  Exercise,
  MuscleGroup,
  RecoveryCheckIn,
  SessionExercise,
  SessionMode,
  TrainingPlan,
  UserProfile,
  WorkoutPreferences,
  WorkoutSession,
  WorkoutTemplate
} from '../domain/types';
import { MUSCLE_LABEL } from '../data/exercises';
import { calendarDaysBetween, dayKey, hoursBetween, relativeDay, startOfWeek } from './dates';
import { prescribe, targetRir, weeklySetCap } from './prescription';
import { suggestLoad, type Exposure } from './progression';
import { revalidateSlots, type BuildContext } from './splits';
import { estimateMinutes, isCountedStatus, muscleSets, sessionCompletion } from './volume';

/**
 * Motor de recomendação diária. Funções puras e determinísticas: dado o
 * mesmo estado e o mesmo "agora", o resultado é sempre o mesmo.
 * Regras documentadas em src/data/science.ts (R01–R14) e docs/MOTOR.md.
 */

export interface EngineState {
  profile: UserProfile;
  prefs: WorkoutPreferences;
  plan: TrainingPlan | undefined;
  templates: WorkoutTemplate[];
  sessions: WorkoutSession[];
  dayLogs: DayLog[];
  checkIn?: RecoveryCheckIn;
  library: Exercise[];
  now: Date;
}

export type RecommendationKind =
  | 'treino'
  | 'descanso'
  | 'recuperacao_ativa'
  | 'retomar'
  | 'concluido'
  | 'pare'
  | 'sem_plano';

export interface Recommendation {
  kind: RecommendationKind;
  template?: WorkoutTemplate;
  mode: SessionMode;
  headline: string;
  reasons: string[];
  warnings: string[];
  canTrainAnyway: boolean;
  inProgress?: WorkoutSession;
  lastSession?: WorkoutSession;
  weekCount: number;
  weekTarget: number;
  painRegions: BodyRegion[];
}

export const RECOVERY_WINDOW_H = 36;
export const OVERLAP_THRESHOLD = 0.5;
export const RETURN_GAP_DAYS = 14;
export const PARTIAL_COUNTS_RATIO = 0.5;

export const ACTIVE_RECOVERY_IDEAS = [
  'Caminhada leve de 20–30 minutos.',
  'Mobilidade de quadril, tornozelos e ombros (5–10 minutos).',
  'Bicicleta ou elíptico em ritmo confortável.',
  'Alongamentos suaves, sem forçar.'
];

const byDateAsc = (a: WorkoutSession, b: WorkoutSession) => a.startedAt.localeCompare(b.startedAt);

/** Sessão conta para avançar a sequência? (R01) */
export function countsForSequence(s: WorkoutSession): boolean {
  if (s.status === 'concluida') return true;
  if (s.status === 'parcial') return sessionCompletion(s).ratio >= PARTIAL_COUNTS_RATIO;
  return false;
}

export function activeTemplates(plan: TrainingPlan | undefined, templates: WorkoutTemplate[]): WorkoutTemplate[] {
  if (!plan) return [];
  return plan.sequence.map((id) => templates.find((t) => t.id === id)).filter((t): t is WorkoutTemplate => !!t);
}

/** Próxima ficha pendente da sequência — nunca baseada no dia da semana. */
export function nextTemplate(plan: TrainingPlan | undefined, templates: WorkoutTemplate[], sessions: WorkoutSession[]): WorkoutTemplate | undefined {
  const seq = activeTemplates(plan, templates);
  if (!plan || seq.length === 0) return undefined;
  const last = sessions.filter((s) => s.planId === plan.id && countsForSequence(s)).sort(byDateAsc).at(-1);
  if (!last) return seq[0];
  let idx = seq.findIndex((t) => t.id === last.templateId);
  if (idx === -1) idx = seq.findIndex((t) => t.code === last.templateCode);
  if (idx === -1) return seq[0];
  return seq[(idx + 1) % seq.length];
}

export function templateMuscles(t: WorkoutTemplate, library: Exercise[]): MuscleGroup[] {
  const set = new Set<MuscleGroup>();
  for (const s of t.slots) {
    const ex = library.find((e) => e.id === s.exerciseId);
    if (ex && s.priority <= 2) set.add(ex.primary);
  }
  return [...set];
}

function sessionMuscles(s: WorkoutSession): MuscleGroup[] {
  const set = new Set<MuscleGroup>();
  for (const e of s.exercises) if (e.sets.some((x) => x.done)) set.add(e.primary);
  return [...set];
}

export function weekSessions(sessions: WorkoutSession[], now: Date): WorkoutSession[] {
  const start = startOfWeek(now).getTime();
  return sessions.filter((s) => isCountedStatus(s) && new Date(s.startedAt).getTime() >= start && new Date(s.startedAt).getTime() <= now.getTime());
}

export function recommendToday(st: EngineState): Recommendation {
  const { profile, now } = st;
  const sessions = [...st.sessions].sort(byDateAsc);
  const counted = sessions.filter(isCountedStatus);
  const lastSession = counted.at(-1);
  const weekCount = weekSessions(sessions, now).length;
  const base = {
    reasons: [] as string[],
    warnings: [] as string[],
    canTrainAnyway: false,
    lastSession,
    weekCount,
    weekTarget: profile.daysPerWeek,
    painRegions: [] as BodyRegion[],
    mode: 'normal' as SessionMode
  };
  const today = dayKey(now);
  const ci = st.checkIn && st.checkIn.date === today ? st.checkIn : undefined;

  // 1. Sinais de alerta (R10)
  if (ci?.redFlags) {
    return {
      ...base,
      kind: 'pare',
      headline: 'Hoje é dia de cuidar da saúde',
      reasons: [
        'Você relatou sintomas que merecem atenção (como dor no peito, falta de ar desproporcional, tontura ou desmaio).',
        'Não treine hoje e procure avaliação médica. Em caso de emergência, ligue 192 (SAMU).'
      ]
    };
  }

  // 2. Sessão em andamento
  const inProgress = sessions.filter((s) => s.status === 'em_andamento').at(-1);
  if (inProgress) {
    return {
      ...base,
      kind: 'retomar',
      inProgress,
      template: st.templates.find((t) => t.id === inProgress.templateId),
      headline: 'Você tem um treino em andamento',
      reasons: [`${inProgress.templateName} iniciado ${relativeDay(inProgress.startedAt, now)}. Seus registros foram salvos.`]
    };
  }

  const tpl = nextTemplate(st.plan, st.templates, sessions);
  if (!st.plan || !tpl) {
    return { ...base, kind: 'sem_plano', headline: 'Monte sua ficha', reasons: ['Seu plano ainda não tem treinos. Abra a aba Treinos para criar uma ficha.'] };
  }
  if (tpl.slots.length === 0) {
    return { ...base, kind: 'sem_plano', template: tpl, headline: 'Adicione exercícios à ficha', reasons: [`A ficha ${tpl.name} está vazia. Adicione exercícios na aba Treinos.`] };
  }

  // 3. Já treinou hoje
  const doneToday = counted.filter((s) => dayKey(s.startedAt) === today);
  if (doneToday.length > 0) {
    return {
      ...base,
      kind: 'concluido',
      template: tpl,
      canTrainAnyway: true,
      headline: 'Treino de hoje concluído',
      reasons: [`Você concluiu ${doneToday.at(-1)!.templateName} hoje. Próximo da sequência: ${tpl.name}.`, 'Descanso faz parte do progresso.']
    };
  }

  // 4. Registros do dia (descanso / não consegui / adiado)
  const log = [...st.dayLogs].filter((l) => l.date === today).sort((a, b) => a.createdAt.localeCompare(b.createdAt)).at(-1);
  if (log) {
    const msg: Record<DayLog['type'], string> = {
      descanso: 'Você registrou descanso hoje.',
      recuperacao_ativa: 'Você registrou recuperação ativa hoje.',
      nao_consegui: 'Tudo bem não ter conseguido hoje. Nada foi perdido.',
      adiado: 'Treino adiado.'
    };
    return {
      ...base,
      kind: 'descanso',
      template: tpl,
      canTrainAnyway: true,
      headline: log.type === 'adiado' ? 'Treino adiado para o próximo dia' : 'Dia de descanso',
      reasons: [msg[log.type], `${tpl.name} continua sendo o próximo da sequência.`]
    };
  }

  // 5. Dor aguda → recuperação + orientação (R10)
  if (ci?.pain === 'aguda') {
    return {
      ...base,
      kind: 'recuperacao_ativa',
      template: tpl,
      canTrainAnyway: false,
      painRegions: ci.painRegions,
      headline: 'Hoje: recuperação',
      reasons: [
        'Você relatou dor aguda. Não é recomendado treinar força sobre dor aguda.',
        'Se a dor persistir, piorar ou vier com inchaço, formigamento ou perda de força, procure avaliação de um profissional de saúde.',
        `${tpl.name} fica para quando você estiver bem.`
      ]
    };
  }

  const reasons: string[] = [];
  const warnings: string[] = [];
  let mode: SessionMode = 'normal';
  const painRegions = ci?.pain === 'desconforto' ? ci.painRegions : [];

  // Explicação da sequência (R01)
  const planSessions = counted.filter((s) => s.planId === st.plan!.id && countsForSequence(s));
  const lastInPlan = planSessions.at(-1);
  if (lastInPlan) {
    reasons.push(`Última ficha: ${lastInPlan.templateName} (${relativeDay(lastInPlan.startedAt, now)}). Próxima da sequência: ${tpl.name}.`);
  } else {
    reasons.push(`Primeira ficha do plano: ${tpl.name}.`);
  }

  // 6. Recuperação muscular (R03)
  if (lastSession) {
    const h = hoursBetween(lastSession.startedAt, now);
    const next = templateMuscles(tpl, st.library);
    const prev = sessionMuscles(lastSession);
    const overlap = next.length ? next.filter((m) => prev.includes(m)).length / next.length : 0;
    const consecutive = calendarDaysBetween(lastSession.startedAt, now) <= 1 || h < RECOVERY_WINDOW_H;
    if (consecutive && overlap >= OVERLAP_THRESHOLD) {
      return {
        ...base,
        kind: 'descanso',
        template: tpl,
        canTrainAnyway: true,
        painRegions,
        headline: 'Hoje é dia de recuperação',
        reasons: [
          `Você treinou ${relativeDay(lastSession.startedAt, now)} e ${tpl.name} trabalha os mesmos músculos principais (${next.filter((m) => prev.includes(m)).map((m) => MUSCLE_LABEL[m]).join(', ')}).`,
          'Um intervalo de cerca de 48 h entre estímulos do mesmo grupo é o padrão para iniciantes. Uma caminhada leve ou mobilidade são ótimas opções.',
          `${tpl.name} continua pendente para o próximo treino.`
        ]
      };
    }
    const gap = calendarDaysBetween(lastSession.startedAt, now);
    if (gap >= RETURN_GAP_DAYS) {
      mode = 'retorno';
      reasons.push(`Faz ${gap} dias desde o último treino. Hoje é uma sessão de retorno, mais leve, para retomar com segurança.`);
    } else if (gap >= 4) {
      reasons.push('Bom te ver de volta. A sequência continua de onde você parou.');
    }
  }

  // 7. Meta semanal flexível (R12)
  if (weekCount >= profile.daysPerWeek) {
    return {
      ...base,
      kind: 'descanso',
      template: tpl,
      canTrainAnyway: true,
      painRegions,
      headline: 'Meta da semana alcançada',
      reasons: [`Você fez ${weekCount} de ${profile.daysPerWeek} treinos planejados nesta semana.`, 'Treinar mais é opcional. Descansar também é progresso.']
    };
  }

  // 8. Check-in de recuperação
  if (ci) {
    if (ci.energy <= 2 || ci.sleep <= 2 || ci.soreness >= 4) {
      if (mode === 'normal') mode = 'leve';
      reasons.push('Pelo seu check-in (energia, sono ou dor muscular), a sessão foi ajustada: menos séries e mais repetições em reserva. O treino rápido também é uma boa opção.');
    }
    if (painRegions.length) {
      warnings.push('Exercícios que solicitam a região com desconforto foram substituídos hoje. Interrompa qualquer exercício que cause dor.');
    }
  }

  if (profile.limitations.length) {
    warnings.push('Suas limitações informadas foram consideradas na escolha dos exercícios. O app não substitui avaliação profissional.');
  }

  return {
    ...base,
    kind: 'treino',
    template: tpl,
    mode,
    reasons,
    warnings,
    painRegions,
    canTrainAnyway: true,
    headline: 'Seu treino está pronto'
  };
}

// ───────────────────────── Montagem da sessão ─────────────────────────

export interface BuildOptions {
  mode?: SessionMode;
  minutes?: number;
  swaps?: Record<string, string>;
  painRegions?: BodyRegion[];
}

export interface BuiltSession {
  exercises: SessionExercise[];
  estimatedMin: number;
  notes: string[];
  muscles: MuscleGroup[];
}

export function exposuresFor(exerciseId: string, sessions: WorkoutSession[]): Exposure[] {
  return [...sessions]
    .filter(isCountedStatus)
    .sort((a, b) => b.startedAt.localeCompare(a.startedAt))
    .flatMap((s) =>
      s.exercises.filter((e) => e.exerciseId === exerciseId).map((e) => ({ exercise: e, sessionRpe: s.sessionRpe }))
    );
}

export const QUICK_MINUTES = 20;

export function buildSession(st: EngineState, tpl: WorkoutTemplate, opts: BuildOptions = {}): BuiltSession {
  const ctx: BuildContext = { profile: st.profile, prefs: st.prefs, library: st.library };
  const mode = opts.mode ?? 'normal';
  const notes: string[] = [];
  const rv = revalidateSlots(tpl, ctx, opts.painRegions ?? []);
  notes.push(...rv.notes);
  let slots = rv.slots.map((s) => {
    const swap = opts.swaps?.[s.slotId];
    return swap ? { ...s, exerciseId: swap, swappedFrom: s.exerciseId } : { ...s, swappedFrom: undefined as string | undefined };
  });

  const lib = (id: string) => st.library.find((e) => e.id === id)!;
  let minutes = opts.minutes ?? st.profile.sessionMinutes;
  const warmup = st.prefs.includeWarmup ? (mode === 'rapido' ? 3 : 5) : 0;

  // Itens com prescrição ajustada ao modo
  let items = slots.map((s) => {
    const ex = lib(s.exerciseId);
    let sets = s.sets;
    let rest = s.restSec;
    let { repMin, repMax } = s;
    if (s.swappedFrom && !s.manual) {
      // Exercício trocado: recalcula faixa conforme o tipo do novo exercício.
      const p = prescribe(ex, s.priority, { level: st.profile.level, goal: st.profile.goal, style: st.profile.style, prefs: st.prefs });
      repMin = p.repMin;
      repMax = p.repMax;
      rest = p.restSec;
    }
    if (mode === 'rapido') {
      sets = Math.min(sets, 2);
      rest = Math.min(rest, ex.kind === 'composto' ? 75 : 45);
    }
    if (mode === 'leve' || mode === 'retorno') sets = Math.max(1, sets - 1);
    return { slot: s, ex, sets, rest, repMin, repMax };
  });

  // Guarda de volume semanal (R04): acessórios de músculos já muito trabalhados.
  const weekAgo = st.now.getTime() - 7 * 86400000;
  const recent = st.sessions.filter((s) => isCountedStatus(s) && new Date(s.startedAt).getTime() >= weekAgo);
  const ms = muscleSets(recent);
  const cap = weeklySetCap(st.profile.level);
  items = items.filter((it) => {
    if (it.slot.priority === 3 && ms[it.ex.primary] >= cap) {
      notes.push(`${it.ex.name} ficou de fora: ${MUSCLE_LABEL[it.ex.primary]} já somou ${ms[it.ex.primary]} séries nos últimos 7 dias.`);
      return false;
    }
    return true;
  });

  // Treino rápido (R09): mantém os essenciais e no máximo um item de prioridade 2.
  if (mode === 'rapido') {
    minutes = Math.min(minutes, QUICK_MINUTES);
    const essentials = items.filter((i) => i.slot.priority === 1);
    const p2 = items.find((i) => i.slot.priority === 2);
    const kept = [...essentials];
    if (p2) kept.push(p2);
    const removed = items.filter((i) => !kept.includes(i));
    if (removed.length) notes.push(`Treino rápido: mantidos os exercícios essenciais da ficha; ${removed.length} acessório(s) ficaram para a próxima.`);
    items = items.filter((i) => kept.includes(i));
  }

  // Ajuste ao tempo disponível (R09)
  const est = () => estimateMinutes(items.map((i) => ({ sets: i.sets, restSec: i.rest, loadType: i.ex.loadType, repMax: i.repMax })), warmup);
  const removedForTime: string[] = [];
  for (const prio of [3, 2] as const) {
    while (est() > minutes) {
      const idx = items.map((i) => i.slot.priority).lastIndexOf(prio);
      if (idx === -1) break;
      removedForTime.push(items[idx].ex.name);
      items.splice(idx, 1);
    }
  }
  while (est() > minutes && items.some((i) => i.sets > 1)) {
    const big = items.reduce((a, b) => (b.sets > a.sets ? b : a));
    big.sets -= 1;
  }
  if (removedForTime.length) notes.push(`Para caber em ${minutes} min: ${removedForTime.join(', ')} ficaram de fora hoje.`);

  const rir = targetRir(st.profile.level);
  const tr: [number, number] = mode === 'leve' || mode === 'retorno' ? [rir[0] + 1, rir[1] + 1] : rir;

  const exercises: SessionExercise[] = items.map((it) => {
    const sug = suggestLoad(
      it.ex,
      exposuresFor(it.ex.id, st.sessions),
      { repMin: it.repMin, repMax: it.repMax, targetRir: tr, sets: it.sets },
      st.prefs,
      { returnMode: mode === 'retorno' }
    );
    return {
      slotId: it.slot.slotId,
      exerciseId: it.ex.id,
      exerciseName: it.ex.name,
      pattern: it.ex.pattern,
      primary: it.ex.primary,
      secondary: it.ex.secondary,
      loadType: it.ex.loadType,
      targetSets: it.sets,
      repMin: it.repMin,
      repMax: it.repMax,
      restSec: it.rest,
      targetRir: tr,
      suggestedWeightKg: sug.suggestedWeightKg,
      previousWeightKg: sug.previousWeightKg,
      suggestionNote: sug.note,
      notes: '',
      swappedFrom: it.slot.swappedFrom,
      sets: Array.from({ length: it.sets }, (_, i) => ({
        setIndex: i,
        // Pré-preenche com a carga anterior (nunca com o aumento sugerido).
        weightKg: sug.previousWeightKg !== null ? (sug.action === 'reduzir' ? sug.suggestedWeightKg : sug.previousWeightKg) : null,
        reps: null,
        rir: null,
        done: false
      }))
    };
  });

  return {
    exercises,
    estimatedMin: est(),
    notes,
    muscles: [...new Set(exercises.map((e) => e.primary))]
  };
}

/** Cria o objeto de sessão (não persiste). */
export function createSession(
  st: EngineState,
  tpl: WorkoutTemplate,
  built: BuiltSession,
  mode: SessionMode,
  reasons: string[],
  id: string
): WorkoutSession {
  return {
    id,
    planId: tpl.planId,
    templateId: tpl.id,
    templateCode: tpl.code,
    templateName: tpl.name,
    split: st.plan?.split ?? 'custom',
    status: 'em_andamento',
    mode,
    startedAt: st.now.toISOString(),
    durationSec: 0,
    notes: '',
    reasons,
    exercises: built.exercises
  };
}

/** Status final ao encerrar (R01: parcial se nem todas as séries foram feitas). */
export function finalStatus(s: WorkoutSession): 'concluida' | 'parcial' | 'descartada' {
  const c = sessionCompletion(s);
  if (c.done === 0) return 'descartada';
  return c.done === c.total ? 'concluida' : 'parcial';
}

/** Cria um item de sessão para um exercício trocado durante o treino. */
export function replaceSessionExercise(st: EngineState, base: SessionExercise, ex: Exercise, mode: SessionMode): SessionExercise {
  const p = prescribe(ex, 2, { level: st.profile.level, goal: st.profile.goal, style: st.profile.style, prefs: st.prefs });
  const sug = suggestLoad(ex, exposuresFor(ex.id, st.sessions), { repMin: p.repMin, repMax: p.repMax, targetRir: base.targetRir, sets: base.targetSets }, st.prefs, {
    returnMode: mode === 'retorno'
  });
  return {
    ...base,
    exerciseId: ex.id,
    exerciseName: ex.name,
    pattern: ex.pattern,
    primary: ex.primary,
    secondary: ex.secondary,
    loadType: ex.loadType,
    repMin: p.repMin,
    repMax: p.repMax,
    restSec: base.restSec,
    suggestedWeightKg: sug.suggestedWeightKg,
    previousWeightKg: sug.previousWeightKg,
    suggestionNote: sug.note,
    swappedFrom: base.swappedFrom ?? base.exerciseId,
    sets: base.sets.map((_s, i) => ({ setIndex: i, weightKg: sug.previousWeightKg, reps: null, rir: null, done: false }))
  };
}

export function canTrainPreferredDay(profile: UserProfile, now: Date): boolean {
  return profile.preferredDays.length === 0 || profile.preferredDays.includes(now.getDay());
}

export type { WorkoutPreferences };
