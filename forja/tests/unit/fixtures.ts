import type { UserProfile, WorkoutSession, WorkoutTemplate } from '../../src/domain/types';
import { DEFAULT_PREFS } from '../../src/db/db';
import { EXERCISES, GYM_EQUIPMENT } from '../../src/data/exercises';
import { generatePlan } from '../../src/engine/splits';
import { buildSession, createSession, type EngineState } from '../../src/engine/recommend';

export function profile(over: Partial<UserProfile> = {}): UserProfile {
  return {
    id: 'me',
    name: 'Teste',
    ageRange: '25-34',
    level: 'iniciante',
    goal: 'hipertrofia',
    location: 'academia',
    equipment: [...GYM_EQUIPMENT],
    daysPerWeek: 3,
    sessionMinutes: 60,
    style: 'tradicional',
    preferredDays: [1, 3, 5],
    avoidExercises: [],
    limitations: [],
    limitationNotes: '',
    split: 'full_body',
    onboarded: true,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...over
  };
}

export function state(over: Partial<EngineState> = {}, p: Partial<UserProfile> = {}): EngineState {
  const prof = profile(p);
  const { plan, templates } = generatePlan(prof.split, { profile: prof, prefs: DEFAULT_PREFS, library: EXERCISES });
  return {
    profile: prof,
    prefs: DEFAULT_PREFS,
    plan,
    templates,
    sessions: [],
    dayLogs: [],
    library: EXERCISES,
    now: new Date(2026, 10, 2, 9, 0), // segunda-feira, 2 nov 2026
    ...over
  };
}

let n = 0;
/** Simula uma sessão realizada de uma ficha numa data, com todas as séries completas. */
export function doSession(
  st: EngineState,
  tpl: WorkoutTemplate,
  at: Date,
  opts: { reps?: number; weight?: number; rir?: number | null; fraction?: number; rpe?: number } = {}
): WorkoutSession {
  const s0 = { ...st, now: at };
  const built = buildSession(s0, tpl);
  const s = createSession(s0, tpl, built, 'normal', [], `ses_${++n}`);
  let k = 0;
  const total = s.exercises.reduce((a, e) => a + e.sets.length, 0);
  const limit = Math.round(total * (opts.fraction ?? 1));
  for (const e of s.exercises) {
    for (const set of e.sets) {
      if (k++ >= limit) continue;
      set.done = true;
      set.reps = opts.reps ?? e.repMax;
      set.weightKg = e.loadType === 'carga' ? opts.weight ?? 20 : null;
      set.rir = opts.rir === undefined ? 2 : opts.rir;
    }
  }
  const done = s.exercises.flatMap((e) => e.sets).filter((x) => x.done).length;
  s.status = done === total ? 'concluida' : done === 0 ? 'descartada' : 'parcial';
  s.durationSec = 3000;
  s.sessionRpe = opts.rpe;
  s.endedAt = new Date(at.getTime() + 3000e3).toISOString();
  return s;
}

export const d = (day: number, h = 9) => new Date(2026, 10, day, h, 0);
