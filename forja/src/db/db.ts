import Dexie, { type Table } from 'dexie';
import type {
  BodyWeightEntry,
  CustomExercise,
  DayLog,
  ProgressRecord,
  RecoveryCheckIn,
  TrainingPlan,
  UserProfile,
  WorkoutPreferences,
  WorkoutSession,
  WorkoutTemplate
} from '../domain/types';

/**
 * Banco local (IndexedDB via Dexie). Nenhum dado sai do aparelho.
 * Migrações: incremente a versão e use .upgrade() para transformar dados
 * existentes sem perdê-los.
 */
export class ForjaDB extends Dexie {
  profile!: Table<UserProfile, string>;
  prefs!: Table<WorkoutPreferences, string>;
  plans!: Table<TrainingPlan, string>;
  templates!: Table<WorkoutTemplate, string>;
  sessions!: Table<WorkoutSession, string>;
  progress!: Table<ProgressRecord, string>;
  checkins!: Table<RecoveryCheckIn, string>;
  dayLogs!: Table<DayLog, string>;
  bodyWeights!: Table<BodyWeightEntry, string>;
  customExercises!: Table<CustomExercise, string>;

  constructor(name = 'forja') {
    super(name);
    this.version(1).stores({
      profile: 'id',
      prefs: 'id',
      plans: 'id, active, createdAt',
      templates: 'id, planId',
      sessions: 'id, planId, templateId, status, startedAt',
      progress: 'id, sessionId, exerciseId, date',
      checkins: 'id, date',
      dayLogs: 'id, date',
      bodyWeights: 'id, date',
      customExercises: 'id'
    });
  }
}

export const SCHEMA_VERSION = 1;

export let db = new ForjaDB();

/** Usado nos testes para isolar bancos. */
export function useDatabase(name: string): ForjaDB {
  db = new ForjaDB(name);
  return db;
}

export const DEFAULT_PREFS: WorkoutPreferences = {
  id: 'prefs',
  accent: 'lima',
  theme: 'escuro',
  weightUnit: 'kg',
  showStreak: false,
  notifications: false,
  notificationHour: 18,
  preferredExercises: [],
  repRangeOverride: null,
  restOverride: null,
  dumbbellStepKg: 2,
  machineStepKg: 2.5,
  barbellStepKg: 2.5,
  includeWarmup: true
};

/** Solicita armazenamento persistente (reduz risco de o Safari limpar dados). */
export async function requestPersistence(): Promise<boolean> {
  try {
    if (navigator.storage?.persist) return await navigator.storage.persist();
  } catch {
    /* sem suporte */
  }
  return false;
}
