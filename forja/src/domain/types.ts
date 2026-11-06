/**
 * Modelos de domínio do FORJA.
 *
 * Os tipos são independentes de React e de IndexedDB, para que o motor de
 * treino (src/engine) possa ser portado para uma versão nativa (SwiftUI)
 * mantendo as mesmas estruturas.
 */

export type Level = 'iniciante' | 'intermediario' | 'avancado';

export type Goal =
  | 'forca'
  | 'hipertrofia'
  | 'condicionamento'
  | 'emagrecimento'
  | 'saude';

export type Location = 'academia' | 'casa' | 'ambos';

export type Equipment =
  | 'peso_corporal'
  | 'halteres'
  | 'barra'
  | 'anilhas'
  | 'banco'
  | 'maquinas'
  | 'polia'
  | 'barra_fixa'
  | 'paralelas'
  | 'elastico'
  | 'kettlebell'
  | 'smith';

export type SplitType = 'full_body' | 'upper_lower' | 'ppl' | 'custom';

export type TrainingStyle = 'tradicional' | 'circuito' | 'misto';

export type AgeRange = '18-24' | '25-34' | '35-44' | '45-54' | '55-64' | '65+';

export type MuscleGroup =
  | 'peito'
  | 'costas'
  | 'ombros'
  | 'quadriceps'
  | 'posterior'
  | 'gluteos'
  | 'panturrilhas'
  | 'biceps'
  | 'triceps'
  | 'core';

/** Regiões articulares usadas para limitações e relatos de dor. */
export type BodyRegion =
  | 'ombro'
  | 'cotovelo'
  | 'punho'
  | 'lombar'
  | 'quadril'
  | 'joelho'
  | 'tornozelo'
  | 'pescoco';

export type MovementPattern =
  | 'agachamento'
  | 'dobradica'
  | 'unilateral_pernas'
  | 'extensao_quadril'
  | 'flexao_joelho'
  | 'extensao_joelho'
  | 'panturrilha'
  | 'empurrar_horizontal'
  | 'empurrar_vertical'
  | 'puxar_horizontal'
  | 'puxar_vertical'
  | 'crucifixo'
  | 'elevacao_lateral'
  | 'deltoide_posterior'
  | 'flexao_cotovelo'
  | 'extensao_cotovelo'
  | 'core_antiextensao'
  | 'core_flexao'
  | 'core_antirrotacao';

export type ExerciseKind = 'composto' | 'isolado' | 'core';

/** Como a carga é registrada. */
export type LoadType = 'carga' | 'peso_corporal' | 'tempo';

export interface Exercise {
  id: string;
  name: string;
  primary: MuscleGroup;
  secondary: MuscleGroup[];
  pattern: MovementPattern;
  /** Todos os equipamentos listados são necessários. */
  equipment: Equipment[];
  /** 1 = iniciante, 2 = intermediário, 3 = avançado */
  difficulty: 1 | 2 | 3;
  kind: ExerciseKind;
  loadType: LoadType;
  /** Incremento sugerido de carga em kg (total). */
  incrementKg: number;
  instructions: string[];
  commonMistakes: string[];
  alternatives: string[];
  cautions: string[];
  /** Regiões solicitadas de forma relevante (usadas para limitações/dor). */
  stressRegions: BodyRegion[];
  /** Referência visual local (não há imagens licenciadas embarcadas nesta versão). */
  image?: string;
  /** Exercício criado pelo usuário. */
  custom?: boolean;
}

export interface UserProfile {
  id: 'me';
  name: string;
  ageRange: AgeRange;
  level: Level;
  goal: Goal;
  location: Location;
  equipment: Equipment[];
  daysPerWeek: number;
  sessionMinutes: number;
  style: TrainingStyle;
  /** 0 = domingo ... 6 = sábado. Usado apenas como preferência, nunca para decidir o treino. */
  preferredDays: number[];
  avoidExercises: string[];
  limitations: BodyRegion[];
  limitationNotes: string;
  split: SplitType;
  weightKg?: number;
  heightCm?: number;
  onboarded: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface WorkoutPreferences {
  id: 'prefs';
  accent: 'lima' | 'verde' | 'ciano' | 'laranja' | 'violeta';
  theme: 'escuro' | 'claro';
  weightUnit: 'kg' | 'lb';
  showStreak: boolean;
  notifications: boolean;
  notificationHour: number;
  preferredExercises: string[];
  /** Sobrescrita opcional das faixas de repetição (null = automático). */
  repRangeOverride: { min: number; max: number } | null;
  /** Sobrescrita opcional do descanso em segundos (null = automático). */
  restOverride: number | null;
  /** Incremento disponível para halteres (kg por halter). */
  dumbbellStepKg: number;
  /** Menor incremento das máquinas/polia (kg). */
  machineStepKg: number;
  /** Menor par de anilhas disponível para barra (kg totais). */
  barbellStepKg: number;
  includeWarmup: boolean;
}

export interface TemplateSlot {
  slotId: string;
  pattern: MovementPattern;
  exerciseId: string;
  sets: number;
  repMin: number;
  repMax: number;
  restSec: number;
  /** 1 = essencial, 2 = importante, 3 = acessório */
  priority: 1 | 2 | 3;
  /** Valores definidos manualmente pelo usuário (não sobrescritos pelo motor). */
  manual?: boolean;
}

export interface WorkoutTemplate {
  id: string;
  planId: string;
  code: string;
  name: string;
  focus: string;
  order: number;
  slots: TemplateSlot[];
  version: number;
  /** Template substituído por uma regeneração: mantido para histórico. */
  archived?: boolean;
  createdAt: string;
}

export interface TrainingPlan {
  id: string;
  split: SplitType;
  name: string;
  active: boolean;
  /** IDs dos templates ativos, na ordem da sequência. */
  sequence: string[];
  createdAt: string;
  archivedAt?: string;
}

export interface CompletedSet {
  setIndex: number;
  weightKg: number | null;
  reps: number | null;
  /** Repetições em reserva (opcional). */
  rir: number | null;
  done: boolean;
  completedAt?: string;
}

export interface SessionExercise {
  slotId: string;
  exerciseId: string;
  exerciseName: string;
  pattern: MovementPattern;
  primary: MuscleGroup;
  secondary: MuscleGroup[];
  loadType: LoadType;
  targetSets: number;
  repMin: number;
  repMax: number;
  restSec: number;
  targetRir: [number, number];
  suggestedWeightKg: number | null;
  previousWeightKg: number | null;
  suggestionNote: string;
  sets: CompletedSet[];
  notes: string;
  swappedFrom?: string;
}

export type SessionStatus = 'em_andamento' | 'concluida' | 'parcial' | 'descartada';
export type SessionMode = 'normal' | 'rapido' | 'retorno' | 'leve';

export interface WorkoutSession {
  id: string;
  planId: string;
  templateId: string;
  templateCode: string;
  templateName: string;
  split: SplitType;
  status: SessionStatus;
  mode: SessionMode;
  startedAt: string;
  endedAt?: string;
  /** Duração ativa em segundos (atualizada ao salvar). */
  durationSec: number;
  /** Esforço percebido da sessão (1–10, escala CR-10). */
  sessionRpe?: number;
  notes: string;
  reasons: string[];
  exercises: SessionExercise[];
}

export interface ProgressRecord {
  id: string;
  sessionId: string;
  exerciseId: string;
  date: string;
  topWeightKg: number | null;
  bestReps: number | null;
  totalReps: number;
  volumeKg: number;
  setsDone: number;
  estimated1RM: number | null;
}

export interface RecoveryCheckIn {
  id: string;
  date: string; // YYYY-MM-DD
  createdAt: string;
  /** 1 (muito baixa) – 5 (ótima) */
  energy: number;
  /** 1 (nenhuma) – 5 (intensa) */
  soreness: number;
  /** 1 (ruim) – 5 (ótimo) */
  sleep: number;
  pain: 'nenhuma' | 'desconforto' | 'aguda';
  painRegions: BodyRegion[];
  /** Sintomas preocupantes (dor no peito, falta de ar, tontura...). */
  redFlags: boolean;
}

export type DayLogType = 'descanso' | 'nao_consegui' | 'adiado' | 'recuperacao_ativa';

export interface DayLog {
  id: string;
  date: string; // YYYY-MM-DD
  type: DayLogType;
  createdAt: string;
}

export interface BodyWeightEntry {
  id: string;
  date: string;
  weightKg: number;
}

export interface CustomExercise extends Exercise {
  custom: true;
}
