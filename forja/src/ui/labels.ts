import type { AgeRange, Goal, Level, Location, TrainingStyle } from '../domain/types';

export const LEVEL_LABEL: Record<Level, string> = { iniciante: 'Iniciante', intermediario: 'Intermediário', avancado: 'Avançado' };
export const GOAL_LABEL: Record<Goal, string> = {
  forca: 'Força',
  hipertrofia: 'Hipertrofia',
  condicionamento: 'Condicionamento',
  emagrecimento: 'Emagrecimento com preservação muscular',
  saude: 'Saúde geral'
};
export const LOCATION_LABEL: Record<Location, string> = { academia: 'Academia', casa: 'Casa', ambos: 'Ambos' };
export const STYLE_LABEL: Record<TrainingStyle, string> = {
  tradicional: 'Tradicional (séries e descanso)',
  circuito: 'Circuito (descansos curtos)',
  misto: 'Misto'
};
export const AGE_RANGES: AgeRange[] = ['18-24', '25-34', '35-44', '45-54', '55-64', '65+'];
export const MINUTES = [15, 20, 30, 45, 60, 75];
export const MODE_LABEL = { normal: 'Normal', rapido: 'Rápido', retorno: 'Retorno', leve: 'Leve' } as const;
