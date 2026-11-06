import { useEffect, useRef, useState } from 'react';
import type { Exercise } from '../../domain/types';
import { animFor } from './animations';
import { figureSvg } from './render';
import { cyclePhase } from './rig';
import { muscleMapSvg } from './muscles';

const reduced = () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

/** Demonstração animada original do exercício (loop), com play/pausa. */
export function ExerciseDemo({ ex, className = '' }: { ex: Exercise; className?: string }) {
  const [playing, setPlaying] = useState(() => !reduced());
  const [t, setT] = useState(reduced() ? 1 : 0);
  const elapsed = useRef(0);
  useEffect(() => {
    if (!playing) return;
    let id = 0;
    const base = performance.now() - elapsed.current;
    const loop = (now: number) => {
      elapsed.current = now - base;
      setT(cyclePhase(elapsed.current));
      id = requestAnimationFrame(loop);
    };
    id = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(id);
  }, [playing]);
  const anim = animFor(ex.id, ex.pattern);
  const hl = { primary: ex.primary, secondary: ex.secondary };
  return (
    <div className={`relative rounded-2xl bg-bg border border-line/60 overflow-hidden ${className}`} data-testid="exercise-demo">
      <div className="aspect-square max-h-64 mx-auto" dangerouslySetInnerHTML={{ __html: figureSvg(anim, t, hl) }} />
      <button
        onClick={() => setPlaying((p) => !p)}
        className="absolute bottom-2 right-2 h-9 px-3 rounded-full bg-surface2/90 text-xs font-medium"
        aria-label={playing ? 'Pausar demonstração' : 'Reproduzir demonstração'}
      >
        {playing ? '❚❚ Pausar' : '▶ Reproduzir'}
      </button>
      <div className="absolute top-2 left-2 text-[10px] uppercase tracking-wider text-muted bg-surface2/80 rounded-full px-2 py-0.5">Demonstração</div>
      {!playing && (
        <div className="absolute bottom-2 left-2 flex gap-1">
          <button className="h-8 px-2.5 rounded-full bg-surface2/90 text-xs" onClick={() => setT(0)}>Início</button>
          <button className="h-8 px-2.5 rounded-full bg-surface2/90 text-xs" onClick={() => setT(1)}>Fim</button>
        </div>
      )}
    </div>
  );
}

/** Miniatura estática (posição final, com a posição inicial esmaecida). */
export function ExerciseThumb({ ex, className = 'h-14 w-14' }: { ex: Exercise; className?: string }) {
  return (
    <div
      className={`rounded-xl bg-bg border border-line/60 shrink-0 ${className}`}
      aria-hidden="true"
      dangerouslySetInnerHTML={{ __html: figureSvg(animFor(ex.id, ex.pattern), 1, { primary: ex.primary, secondary: ex.secondary }) }}
    />
  );
}

export function MuscleMap({ ex }: { ex: Exercise }) {
  return <div className="max-w-[260px] mx-auto" role="img" aria-label="Mapa muscular" dangerouslySetInnerHTML={{ __html: muscleMapSvg(ex.primary, ex.secondary) }} />;
}
