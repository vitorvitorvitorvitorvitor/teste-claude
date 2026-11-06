import type { WorkoutPreferences } from '../domain/types';

export const ACCENTS: Record<WorkoutPreferences['accent'], { label: string; rgb: string; hex: string }> = {
  lima: { label: 'Lima', rgb: '197 245 66', hex: '#c5f542' },
  verde: { label: 'Verde', rgb: '52 211 120', hex: '#34d378' },
  ciano: { label: 'Ciano', rgb: '56 214 230', hex: '#38d6e6' },
  laranja: { label: 'Laranja', rgb: '255 150 64', hex: '#ff9640' },
  violeta: { label: 'Violeta', rgb: '180 140 255', hex: '#b48cff' }
};

export function applyTheme(p: Pick<WorkoutPreferences, 'accent' | 'theme'>) {
  const root = document.documentElement;
  root.dataset.theme = p.theme;
  const a = ACCENTS[p.accent] ?? ACCENTS.lima;
  // No tema claro, escurece levemente o destaque para manter contraste.
  root.style.setProperty('--accent', a.rgb);
  const meta = document.querySelector('meta[name="theme-color"]');
  meta?.setAttribute('content', p.theme === 'claro' ? '#f5f6f8' : '#0e0f11');
}
