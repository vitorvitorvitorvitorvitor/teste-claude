import type {
  BodyWeightEntry,
  CustomExercise,
  DayLogType,
  ProgressRecord,
  RecoveryCheckIn,
  SplitType,
  TrainingPlan,
  UserProfile,
  WorkoutPreferences,
  WorkoutSession,
  WorkoutTemplate
} from '../domain/types';
import { allExercises } from '../data/exercises';
import { dayKey } from '../engine/dates';
import type { EngineState } from '../engine/recommend';
import { finalStatus } from '../engine/recommend';
import { generatePlan, regenerateTemplate, uid, type BuildContext } from '../engine/splits';
import { doneSets, estimated1RM, exerciseVolume } from '../engine/volume';
import { db, DEFAULT_PREFS } from './db';

/** Camada de acesso a dados. Toda escrita passa por aqui. */

export async function getProfile(): Promise<UserProfile | undefined> {
  return db.profile.get('me');
}

export async function getPrefs(): Promise<WorkoutPreferences> {
  return (await db.prefs.get('prefs')) ?? DEFAULT_PREFS;
}

export async function savePrefs(p: Partial<WorkoutPreferences>): Promise<void> {
  const cur = await getPrefs();
  await db.prefs.put({ ...cur, ...p, id: 'prefs' });
}

export async function getActivePlan(): Promise<TrainingPlan | undefined> {
  const plans = await db.plans.toArray();
  return plans.filter((p) => p.active).sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
}

export async function library() {
  return allExercises(await db.customExercises.toArray());
}

async function buildCtx(profile: UserProfile): Promise<BuildContext> {
  return { profile, prefs: await getPrefs(), library: await library() };
}

/** Cria (ou atualiza) o perfil. Na primeira vez, gera o plano. */
export async function saveProfile(profile: UserProfile, opts: { regeneratePlan?: boolean } = {}): Promise<void> {
  const existing = await getProfile();
  const now = new Date().toISOString();
  const p: UserProfile = { ...profile, id: 'me', updatedAt: now, createdAt: existing?.createdAt ?? now, onboarded: true };
  await db.transaction('rw', [db.profile, db.plans, db.templates, db.prefs, db.customExercises], async () => {
    await db.profile.put(p);
    if (!(await db.prefs.get('prefs'))) await db.prefs.put(DEFAULT_PREFS);
    const active = await getActivePlan();
    if (!active || active.split !== p.split || opts.regeneratePlan) {
      await switchSplitInner(p);
    }
  });
}

async function switchSplitInner(profile: UserProfile): Promise<TrainingPlan> {
  const now = new Date().toISOString();
  const plans = await db.plans.toArray();
  // Planos anteriores são arquivados, nunca apagados: o histórico permanece íntegro.
  for (const pl of plans.filter((x) => x.active)) await db.plans.put({ ...pl, active: false, archivedAt: now });
  const { plan, templates } = generatePlan(profile.split, await buildCtx(profile));
  await db.plans.put(plan);
  await db.templates.bulkPut(templates);
  return plan;
}

/** Troca de divisão sem apagar sessões. */
export async function switchSplit(split: SplitType): Promise<TrainingPlan> {
  const profile = (await getProfile())!;
  const p = { ...profile, split, updatedAt: new Date().toISOString() };
  return db.transaction('rw', [db.profile, db.plans, db.templates, db.prefs, db.customExercises], async () => {
    await db.profile.put(p);
    return switchSplitInner(p);
  });
}

export async function regenerate(templateId: string): Promise<WorkoutTemplate> {
  const profile = (await getProfile())!;
  const plan = (await getActivePlan())!;
  const old = (await db.templates.get(templateId))!;
  const fresh = regenerateTemplate(old, plan.split, await buildCtx(profile));
  const hasHistory = (await db.sessions.where('templateId').equals(templateId).count()) > 0;
  await db.transaction('rw', [db.templates, db.plans], async () => {
    if (hasHistory) {
      // Preserva a versão anterior (referenciada por sessões) como arquivada.
      await db.templates.put({ ...old, archived: true });
    } else {
      await db.templates.delete(old.id);
    }
    await db.templates.put(fresh);
    await db.plans.put({ ...plan, sequence: plan.sequence.map((id) => (id === old.id ? fresh.id : id)) });
  });
  return fresh;
}

export async function saveTemplate(t: WorkoutTemplate): Promise<void> {
  await db.templates.put(t);
}

export async function addTemplate(planId: string, name: string): Promise<WorkoutTemplate> {
  const plan = (await db.plans.get(planId))!;
  const codes = 'ABCDEFGHIJ';
  const t: WorkoutTemplate = {
    id: uid('tpl'),
    planId,
    code: codes[plan.sequence.length] ?? String(plan.sequence.length + 1),
    name,
    focus: 'Personalizado',
    order: plan.sequence.length,
    slots: [],
    version: 1,
    createdAt: new Date().toISOString()
  };
  await db.transaction('rw', [db.templates, db.plans], async () => {
    await db.templates.put(t);
    await db.plans.put({ ...plan, sequence: [...plan.sequence, t.id] });
  });
  return t;
}

export async function removeTemplate(planId: string, templateId: string): Promise<void> {
  const plan = (await db.plans.get(planId))!;
  const used = (await db.sessions.where('templateId').equals(templateId).count()) > 0;
  await db.transaction('rw', [db.templates, db.plans], async () => {
    if (used) {
      const t = await db.templates.get(templateId);
      if (t) await db.templates.put({ ...t, archived: true });
    } else await db.templates.delete(templateId);
    await db.plans.put({ ...plan, sequence: plan.sequence.filter((id) => id !== templateId) });
  });
}

export async function saveCustomExercise(e: CustomExercise): Promise<void> {
  await db.customExercises.put(e);
}

// ─────────────── Sessões ───────────────

export async function saveSession(s: WorkoutSession): Promise<void> {
  await db.sessions.put(s);
}

export function progressRecords(s: WorkoutSession): ProgressRecord[] {
  return s.exercises
    .filter((e) => doneSets(e).length > 0)
    .map((e) => {
      const ds = doneSets(e);
      const weights = ds.map((x) => x.weightKg ?? 0);
      const top = e.loadType === 'carga' && Math.max(...weights) > 0 ? Math.max(...weights) : null;
      const bestReps = Math.max(0, ...ds.map((x) => x.reps ?? 0)) || null;
      const repsAtTop = top !== null ? Math.max(0, ...ds.filter((x) => x.weightKg === top).map((x) => x.reps ?? 0)) : 0;
      return {
        id: `${s.id}:${e.slotId}:${e.exerciseId}`,
        sessionId: s.id,
        exerciseId: e.exerciseId,
        date: s.startedAt,
        topWeightKg: top,
        bestReps,
        totalReps: ds.reduce((a, x) => a + (x.reps ?? 0), 0),
        volumeKg: exerciseVolume(e),
        setsDone: ds.length,
        estimated1RM: top !== null ? estimated1RM(top, repsAtTop) : null
      };
    });
}

/** Encerra a sessão: define status, duração e grava registros de progresso. */
export async function finishSession(s: WorkoutSession, extra: { sessionRpe?: number; notes?: string } = {}): Promise<WorkoutSession> {
  const status = finalStatus(s);
  const done: WorkoutSession = {
    ...s,
    ...extra,
    status,
    endedAt: new Date().toISOString()
  };
  await db.transaction('rw', [db.sessions, db.progress], async () => {
    await db.sessions.put(done);
    await db.progress.where('sessionId').equals(s.id).delete();
    if (status !== 'descartada') await db.progress.bulkPut(progressRecords(done));
  });
  return done;
}

export async function discardSession(id: string): Promise<void> {
  await db.transaction('rw', [db.sessions, db.progress], async () => {
    await db.sessions.delete(id);
    await db.progress.where('sessionId').equals(id).delete();
  });
}

// ─────────────── Registros diários ───────────────

export async function logDay(type: DayLogType, date = new Date()): Promise<void> {
  await db.dayLogs.put({ id: uid('day'), date: dayKey(date), type, createdAt: new Date().toISOString() });
}

export async function undoDayLog(date = new Date()): Promise<void> {
  await db.dayLogs.where('date').equals(dayKey(date)).delete();
}

export async function saveCheckIn(c: Omit<RecoveryCheckIn, 'id' | 'createdAt' | 'date'>, date = new Date()): Promise<void> {
  const key = dayKey(date);
  await db.checkins.where('date').equals(key).delete();
  await db.checkins.put({ ...c, id: uid('ci'), date: key, createdAt: new Date().toISOString() });
}

export async function addBodyWeight(weightKg: number, date = new Date()): Promise<void> {
  const e: BodyWeightEntry = { id: uid('bw'), date: dayKey(date), weightKg };
  await db.bodyWeights.put(e);
}

export async function engineState(now = new Date()): Promise<EngineState | null> {
  const profile = await getProfile();
  if (!profile?.onboarded) return null;
  const plan = await getActivePlan();
  const [prefs, templates, sessions, dayLogs, checkIn, lib] = await Promise.all([
    getPrefs(),
    plan ? db.templates.where('planId').equals(plan.id).toArray() : Promise.resolve([]),
    db.sessions.toArray(),
    db.dayLogs.toArray(),
    db.checkins.where('date').equals(dayKey(now)).last(),
    library()
  ]);
  return { profile, prefs, plan, templates, sessions, dayLogs, checkIn, library: lib, now };
}

export async function wipeAll(): Promise<void> {
  await db.transaction('rw', db.tables, async () => {
    for (const t of db.tables) await t.clear();
  });
}
