import { useEffect, useMemo, useRef, useState } from 'react';
import type { CompletedSet, Exercise, SessionExercise, WorkoutSession } from '../../domain/types';
import { db } from '../../db/db';
import { discardSession, finishSession, saveSession } from '../../db/repo';
import { formatDuration } from '../../engine/dates';
import { replaceSessionExercise, type EngineState } from '../../engine/recommend';
import { selectionContext } from '../../engine/splits';
import { swapOptions } from '../../engine/selection';
import { compareSessions, isCountedStatus, sessionCompletion, sessionVolume } from '../../engine/volume';
import { beep, unlockAudio } from '../../lib/beep';
import { MODE_LABEL } from '../labels';
import { ExerciseSheet, SwapSheet } from '../components/exercise';
import { ExerciseThumb } from '../figure/Demo';
import { Button, Chip, Confirm, Icon, NumberInput, Progress, Sheet, Stat, cx, inputCls } from '../components/ui';

const LB = 2.20462;
type Unit = 'kg' | 'lb';
const toUnit = (kg: number | null, u: Unit) => (kg === null ? null : u === 'kg' ? kg : Math.round(kg * LB * 2) / 2);
const fromUnit = (v: number | null, u: Unit) => (v === null ? null : u === 'kg' ? v : Math.round((v / LB) * 100) / 100);
const fmtW = (kg: number, u: Unit) => `${toUnit(kg, u)!.toLocaleString('pt-BR', { maximumFractionDigits: 2 })} ${u}`;

export function Workout({ sessionId, st, onClose }: { sessionId: string; st: EngineState; onClose: () => void }) {
  const [s, setS] = useState<WorkoutSession | null>(null);
  const [finished, setFinished] = useState<WorkoutSession | null>(null);
  const base = useRef({ dur: 0, at: Date.now() });
  const [tick, setTick] = useState(0);
  const [rest, setRest] = useState<{ end: number; total: number; name: string } | null>(null);
  const [swapIdx, setSwapIdx] = useState<number | null>(null);
  const [noteIdx, setNoteIdx] = useState<number | null>(null);
  const [info, setInfo] = useState<Exercise | null>(null);
  const [finishOpen, setFinishOpen] = useState(false);
  const [discardOpen, setDiscardOpen] = useState(false);
  const [rpe, setRpe] = useState<number | undefined>(undefined);
  const [sessionNotes, setSessionNotes] = useState('');
  const saveTimer = useRef<number | undefined>(undefined);
  const latest = useRef<WorkoutSession | null>(null);

  useEffect(() => {
    void db.sessions.get(sessionId).then((x) => {
      if (!x) return onClose();
      base.current = { dur: x.durationSec, at: Date.now() };
      latest.current = x;
      setS(x);
      setSessionNotes(x.notes);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  // Relógio (1 s) e fim do descanso
  useEffect(() => {
    const id = window.setInterval(() => setTick((t) => t + 1), 1000);
    return () => window.clearInterval(id);
  }, []);
  const restLeft = rest ? Math.ceil((rest.end - Date.now()) / 1000) : 0;
  useEffect(() => {
    if (rest && restLeft <= 0) {
      beep();
      setRest(null);
    }
  }, [rest, restLeft, tick]);

  const elapsed = () => base.current.dur + Math.floor((Date.now() - base.current.at) / 1000);

  // Salvamento automático (debounce) + ao ocultar a página
  function persist(next: WorkoutSession, immediate = false) {
    const withDur = { ...next, durationSec: elapsed() };
    latest.current = withDur;
    window.clearTimeout(saveTimer.current);
    if (immediate) return saveSession(withDur);
    saveTimer.current = window.setTimeout(() => void saveSession(withDur), 300);
    return Promise.resolve();
  }
  useEffect(() => {
    const flush = () => {
      if (document.visibilityState === 'hidden' && latest.current?.status === 'em_andamento') void saveSession({ ...latest.current, durationSec: elapsed() });
    };
    document.addEventListener('visibilitychange', flush);
    window.addEventListener('pagehide', flush);
    return () => {
      document.removeEventListener('visibilitychange', flush);
      window.removeEventListener('pagehide', flush);
    };
  }, []);

  function update(fn: (x: WorkoutSession) => WorkoutSession) {
    setS((cur) => {
      if (!cur) return cur;
      const next = fn(structuredClone(cur));
      void persist(next);
      return next;
    });
  }

  const comp = s ? sessionCompletion(s) : { done: 0, total: 0, ratio: 0 };
  const lib = (id: string) => st.library.find((e) => e.id === id);
  const swapEx = swapIdx !== null && s ? lib(s.exercises[swapIdx].exerciseId) : undefined;
  const swapOpts = useMemo(
    () => (swapEx ? swapOptions(swapEx, selectionContext({ profile: st.profile, prefs: st.prefs, library: st.library })) : []),
    [swapEx, st]
  );

  if (finished) return <Summary s={finished} st={st} onClose={onClose} />;
  if (!s) return <div className="fixed inset-0 bg-bg" />;

  function setField(ei: number, si: number, patch: Partial<CompletedSet>) {
    update((x) => {
      Object.assign(x.exercises[ei].sets[si], patch);
      return x;
    });
  }

  function toggleDone(ei: number, si: number) {
    unlockAudio();
    const ex = s!.exercises[ei];
    const set = ex.sets[si];
    const done = !set.done;
    update((x) => {
      const t = x.exercises[ei].sets[si];
      t.done = done;
      t.completedAt = done ? new Date().toISOString() : undefined;
      if (done && t.reps === null) t.reps = ex.repMin;
      // Propaga a carga para as próximas séries ainda vazias
      if (done && t.weightKg !== null)
        x.exercises[ei].sets.forEach((o, i) => {
          if (i > si && !o.done && o.weightKg === null) o.weightKg = t.weightKg;
        });
      return x;
    });
    const isLast = ei === s!.exercises.length - 1 && si === ex.sets.length - 1;
    if (done && !isLast) setRest({ end: Date.now() + ex.restSec * 1000, total: ex.restSec, name: ex.exerciseName });
  }

  async function saveAndExit() {
    await persist(s!, true);
    onClose();
  }

  async function doFinish() {
    const cur = { ...s!, durationSec: elapsed(), notes: sessionNotes };
    window.clearTimeout(saveTimer.current);
    if (sessionCompletion(cur).done === 0) {
      await discardSession(cur.id);
      onClose();
      return;
    }
    const done = await finishSession(cur, { sessionRpe: rpe, notes: sessionNotes });
    latest.current = done;
    setFinishOpen(false);
    setFinished(done);
  }

  return (
    <div className="fixed inset-0 z-40 bg-bg overflow-y-auto" data-testid="workout-screen">
      <div className="sticky top-0 z-10 bg-bg/95 backdrop-blur pt-safe border-b border-line/60">
        <div className="max-w-lg mx-auto px-4 pb-3">
          <div className="flex items-center justify-between gap-2">
            <Button size="sm" variant="ghost" onClick={saveAndExit} aria-label="Salvar e sair">
              <Icon name="back" className="h-4 w-4" /> Salvar e sair
            </Button>
            <div className="text-center">
              <div className="text-xl font-semibold tabular" data-testid="session-timer">{formatDuration(elapsed())}</div>
            </div>
            <Button size="sm" variant="primary" onClick={() => setFinishOpen(true)} data-testid="finish-workout">
              Encerrar
            </Button>
          </div>
          <div className="mt-2 flex items-center gap-3">
            <div className="text-sm font-semibold truncate">{s.templateName}</div>
            {s.mode !== 'normal' && <span className="text-[11px] rounded-full bg-accent/15 text-accent px-2 py-0.5">{MODE_LABEL[s.mode]}</span>}
            <Progress value={comp.ratio} className="flex-1" />
            <span className="text-xs text-muted tabular" data-testid="session-progress">{Math.round(comp.ratio * 100)}%</span>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 pt-4 pb-40 space-y-4">
        {s.exercises.map((e, ei) => (
          <ExerciseCard
            key={`${e.slotId}-${e.exerciseId}`}
            e={e}
            index={ei}
            unit={st.prefs.weightUnit}
            exercise={lib(e.exerciseId)}
            onInfo={() => setInfo(lib(e.exerciseId) ?? null)}
            onSwap={() => setSwapIdx(ei)}
            onNote={() => setNoteIdx(ei)}
            onField={(si, p) => setField(ei, si, p)}
            onToggle={(si) => toggleDone(ei, si)}
            onUseSuggestion={() =>
              update((x) => {
                x.exercises[ei].sets.forEach((st2) => {
                  if (!st2.done) st2.weightKg = e.suggestedWeightKg;
                });
                return x;
              })
            }
            onAddSet={() =>
              update((x) => {
                const sets = x.exercises[ei].sets;
                const lastW = [...sets].reverse().find((z) => z.weightKg !== null)?.weightKg ?? null;
                sets.push({ setIndex: sets.length, weightKg: lastW, reps: null, rir: null, done: false });
                return x;
              })
            }
            onRemoveSet={() =>
              update((x) => {
                const sets = x.exercises[ei].sets;
                if (sets.length > 1 && !sets[sets.length - 1].done) sets.pop();
                return x;
              })
            }
          />
        ))}
        <p className="text-xs text-muted text-center px-6">
          Seus registros são salvos automaticamente neste aparelho. Pare se sentir dor aguda.
        </p>
        <Button variant="ghost" className="w-full text-danger" onClick={() => setDiscardOpen(true)}>
          <Icon name="trash" className="h-4 w-4" /> Descartar treino
        </Button>
      </div>

      {rest && restLeft > 0 && (
        <div className="fixed bottom-0 inset-x-0 z-20 pb-safe">
          <div className="max-w-lg mx-auto m-3 rounded-3xl bg-surface border border-line p-4 shadow-2xl animate-sheet" data-testid="rest-timer">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs text-muted">Descanso · {rest.name}</div>
                <div className="text-3xl font-bold tabular">{formatDuration(restLeft)}</div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={() => setRest((r) => (r ? { ...r, end: r.end - 15000 } : r))}>−15s</Button>
                <Button size="sm" onClick={() => setRest((r) => (r ? { ...r, end: r.end + 15000, total: r.total + 15 } : r))}>+15s</Button>
                <Button size="sm" variant="primary" onClick={() => setRest(null)}>
                  Pular
                </Button>
              </div>
            </div>
            <Progress value={1 - restLeft / rest.total} className="mt-3" />
          </div>
        </div>
      )}

      <SwapSheet
        open={swapIdx !== null}
        current={swapEx}
        options={swapOpts}
        onClose={() => setSwapIdx(null)}
        onPick={(o) => {
          const idx = swapIdx!;
          update((x) => {
            x.exercises[idx] = replaceSessionExercise(st, x.exercises[idx], o, x.mode);
            return x;
          });
          setSwapIdx(null);
        }}
      />

      <Sheet open={noteIdx !== null} onClose={() => setNoteIdx(null)} title="Observações do exercício">
        {noteIdx !== null && (
          <>
            <textarea
              className={`${inputCls} h-28 py-3`}
              defaultValue={s.exercises[noteIdx].notes}
              placeholder="Ex.: ajuste do banco na posição 4; senti o ombro na última série…"
              onChange={(ev) => {
                const v = ev.target.value;
                const i = noteIdx;
                update((x) => {
                  x.exercises[i].notes = v;
                  return x;
                });
              }}
            />
            <Button variant="primary" className="w-full mt-3" onClick={() => setNoteIdx(null)}>
              Salvar
            </Button>
          </>
        )}
      </Sheet>

      <Sheet open={finishOpen} onClose={() => setFinishOpen(false)} title="Encerrar treino">
        <p className="text-sm text-muted mb-3">
          {comp.done === 0
            ? 'Nenhuma série foi marcada como concluída. Encerrar agora descarta esta sessão.'
            : comp.done < comp.total
              ? `Você concluiu ${comp.done} de ${comp.total} séries. O treino será salvo como parcial — e tudo bem.`
              : `Todas as ${comp.total} séries concluídas.`}
        </p>
        {comp.done > 0 && (
          <>
            <div className="text-sm mb-1.5">Esforço da sessão (opcional, 1 = muito leve · 10 = máximo)</div>
            <div className="grid grid-cols-5 gap-1.5">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                <Chip key={n} active={rpe === n} onClick={() => setRpe(rpe === n ? undefined : n)} className="px-0">
                  {n}
                </Chip>
              ))}
            </div>
            <textarea className={`${inputCls} h-20 py-3 mt-3`} value={sessionNotes} onChange={(e) => setSessionNotes(e.target.value)} placeholder="Observações da sessão (opcional)" />
          </>
        )}
        <div className="grid grid-cols-2 gap-3 mt-4">
          <Button onClick={() => setFinishOpen(false)}>Continuar treinando</Button>
          <Button variant={comp.done === 0 ? 'danger' : 'primary'} onClick={doFinish} data-testid="confirm-finish">
            {comp.done === 0 ? 'Descartar' : 'Encerrar'}
          </Button>
        </div>
      </Sheet>

      <Confirm
        open={discardOpen}
        title="Descartar treino?"
        message="Todas as séries registradas nesta sessão serão apagadas. Esta ação não pode ser desfeita."
        confirmLabel="Descartar"
        danger
        onCancel={() => setDiscardOpen(false)}
        onConfirm={async () => {
          window.clearTimeout(saveTimer.current);
          latest.current = null;
          await discardSession(s.id);
          onClose();
        }}
      />
      <ExerciseSheet ex={info} onClose={() => setInfo(null)} />
    </div>
  );
}

function ExerciseCard({
  e,
  index,
  unit,
  exercise,
  onInfo,
  onSwap,
  onNote,
  onField,
  onToggle,
  onUseSuggestion,
  onAddSet,
  onRemoveSet
}: {
  e: SessionExercise;
  index: number;
  unit: Unit;
  exercise?: Exercise;
  onInfo: () => void;
  onSwap: () => void;
  onNote: () => void;
  onField: (si: number, p: Partial<CompletedSet>) => void;
  onToggle: (si: number) => void;
  onUseSuggestion: () => void;
  onAddSet: () => void;
  onRemoveSet: () => void;
}) {
  const allDone = e.sets.every((x) => x.done);
  const anyDone = e.sets.some((x) => x.done);
  const isLoad = e.loadType === 'carga';
  const repUnit = e.loadType === 'tempo' ? 's' : 'reps';
  const showSuggest = isLoad && e.suggestedWeightKg !== null && e.suggestedWeightKg !== e.previousWeightKg;
  return (
    <section className={cx('rounded-3xl border p-4 transition', allDone ? 'border-accent/50 bg-accent/5' : 'border-line/60 bg-surface')} data-testid={`exercise-${index}`}>
      <div className="flex items-start gap-2">
        {exercise && (
          <button onClick={onInfo} aria-label={`Ver demonstração de ${e.exerciseName}`} className="shrink-0">
            <ExerciseThumb ex={exercise} className="h-16 w-16" />
          </button>
        )}
        <button className="flex-1 text-left min-w-0" onClick={onInfo}>
          <div className="text-xs text-muted tabular">Exercício {index + 1}</div>
          <h3 className="text-lg font-semibold leading-snug">{e.exerciseName}</h3>
          <div className="text-sm text-muted tabular">
            {e.targetSets} × {e.repMin}–{e.repMax} {repUnit} · RIR {e.targetRir[0]}–{e.targetRir[1]} · descanso {e.restSec}s
          </div>
        </button>
      </div>
      <div className="flex gap-2 mt-3">
        <button aria-label="Ver instruções" onClick={onInfo} className="flex-1 h-10 rounded-xl bg-surface2 flex items-center justify-center gap-1.5 text-sm">
          <Icon name="play" className="h-4 w-4" /> Como fazer
        </button>
        <button aria-label="Trocar exercício" onClick={onSwap} disabled={anyDone} className="flex-1 h-10 rounded-xl bg-surface2 flex items-center justify-center gap-1.5 text-sm disabled:opacity-30">
          <Icon name="swap" className="h-4 w-4" /> Trocar
        </button>
        <button aria-label="Observações" onClick={onNote} className={cx('flex-1 h-10 rounded-xl flex items-center justify-center gap-1.5 text-sm', e.notes ? 'bg-accent/20 text-accent' : 'bg-surface2')}>
          <Icon name="note" className="h-4 w-4" /> Nota
        </button>
      </div>

      <div className="mt-3 rounded-2xl bg-surface2 p-3 text-sm">
        {isLoad && (
          <div className="flex flex-wrap gap-x-4 gap-y-1 tabular mb-1">
            <span>
              Anterior: <b>{e.previousWeightKg !== null ? fmtW(e.previousWeightKg, unit) : '—'}</b>
            </span>
            <span>
              Sugerida: <b>{e.suggestedWeightKg !== null ? fmtW(e.suggestedWeightKg, unit) : '—'}</b>
            </span>
          </div>
        )}
        <p className="text-muted">{e.suggestionNote}</p>
        {showSuggest && !allDone && (
          <Button size="sm" variant="primary" className="mt-2" onClick={onUseSuggestion}>
            Usar {fmtW(e.suggestedWeightKg!, unit)} nas próximas séries
          </Button>
        )}
      </div>

      <div className="mt-3">
        <div className={cx('grid gap-2 text-[11px] text-muted px-1 mb-1', isLoad ? 'grid-cols-[28px_1fr_1fr_56px_48px]' : 'grid-cols-[28px_1fr_56px_48px]')}>
          <span>Série</span>
          {isLoad && <span className="text-center">{unit}{/halter/i.test(e.exerciseName) ? ' (cada)' : ''}</span>}
          <span className="text-center">{repUnit}</span>
          <span className="text-center">RIR</span>
          <span />
        </div>
        <div className="space-y-2">
          {e.sets.map((set, si) => (
            <div key={si} className={cx('grid gap-2 items-center', isLoad ? 'grid-cols-[28px_1fr_1fr_56px_48px]' : 'grid-cols-[28px_1fr_56px_48px]')}>
              <span className={cx('text-center font-semibold tabular', set.done ? 'text-accent' : 'text-muted')}>{si + 1}</span>
              {isLoad && (
                <NumberInput label={`Carga série ${si + 1}`} decimals value={toUnit(set.weightKg, unit)} onChange={(v) => onField(si, { weightKg: fromUnit(v, unit) })} placeholder={unit} className={set.done ? 'opacity-70' : ''} />
              )}
              <NumberInput label={`Repetições série ${si + 1}`} value={set.reps} onChange={(v) => onField(si, { reps: v })} placeholder={`${e.repMin}–${e.repMax}`} className={set.done ? 'opacity-70' : ''} />
              <NumberInput label={`RIR série ${si + 1}`} value={set.rir} onChange={(v) => onField(si, { rir: v === null ? null : Math.min(10, v) })} placeholder="—" />
              <button
                aria-label={`Concluir série ${si + 1}`}
                aria-pressed={set.done}
                onClick={() => onToggle(si)}
                className={cx('h-11 w-12 rounded-xl grid place-items-center border transition', set.done ? 'bg-accent text-onaccent border-accent' : 'bg-surface2 border-line text-muted')}
              >
                <Icon name="check" className="h-5 w-5" strokeWidth={3} />
              </button>
            </div>
          ))}
        </div>
        <div className="flex gap-2 mt-2">
          <Button size="sm" variant="ghost" onClick={onAddSet}>
            <Icon name="plus" className="h-4 w-4" /> Série
          </Button>
          {e.sets.length > 1 && !e.sets[e.sets.length - 1].done && (
            <Button size="sm" variant="ghost" onClick={onRemoveSet}>
              <Icon name="minus" className="h-4 w-4" /> Série
            </Button>
          )}
        </div>
      </div>
    </section>
  );
}

function Summary({ s, st, onClose }: { s: WorkoutSession; st: EngineState; onClose: () => void }) {
  const comp = sessionCompletion(s);
  const vol = sessionVolume(s);
  const prev = useMemo(
    () =>
      st.sessions
        .filter((x) => x.id !== s.id && x.templateCode === s.templateCode && x.planId === s.planId && isCountedStatus(x) && x.startedAt < s.startedAt)
        .sort((a, b) => b.startedAt.localeCompare(a.startedAt))[0],
    [st, s]
  );
  const cmp = compareSessions(s, prev);
  const exDone = s.exercises.filter((e) => e.sets.some((x) => x.done)).length;
  return (
    <div className="fixed inset-0 z-40 bg-bg overflow-y-auto" data-testid="summary-screen">
      <div className="max-w-lg mx-auto px-4 pt-safe pb-safe">
        <div className="mt-6 h-14 w-14 rounded-2xl bg-accent text-onaccent grid place-items-center animate-fadeUp">
          <Icon name="check" className="h-8 w-8" strokeWidth={3} />
        </div>
        <h1 className="text-3xl font-bold mt-4">{s.status === 'concluida' ? 'Treino concluído' : 'Treino registrado'}</h1>
        <p className="text-muted mt-1">
          {s.templateName}
          {s.status === 'parcial' ? ' · parcial' : ''}
        </p>
        <div className="grid grid-cols-2 gap-2 mt-5">
          <Stat label="Exercícios concluídos" value={`${exDone}/${s.exercises.length}`} />
          <Stat label="Séries realizadas" value={`${comp.done}/${comp.total}`} />
          <Stat label="Tempo total" value={formatDuration(s.durationSec)} />
          <Stat label="Volume de carga" value={vol > 0 ? `${Math.round(vol).toLocaleString('pt-BR')} kg` : '—'} sub={vol > 0 ? 'kg × repetições' : 'sem carga registrada'} />
        </div>
        <div className="mt-5 rounded-3xl bg-surface border border-line/60 p-4 text-sm space-y-2">
          <h2 className="font-semibold">Comparação com a sessão anterior</h2>
          {!cmp && <p className="text-muted">Primeira vez com esta ficha. A partir da próxima sessão você verá a comparação.</p>}
          {cmp && (
            <>
              {cmp.volumeDelta !== null && (
                <p>
                  Volume: {cmp.volumeDelta >= 0 ? '+' : ''}
                  {Math.round(cmp.volumeDelta).toLocaleString('pt-BR')} kg em relação a {s.templateName} anterior.
                </p>
              )}
              <p>
                Séries: {cmp.setsDelta >= 0 ? '+' : ''}
                {cmp.setsDelta}. Tempo: {cmp.durationDelta >= 0 ? '+' : '−'}
                {formatDuration(Math.abs(cmp.durationDelta))}.
              </p>
              {cmp.improvedExercises.length > 0 ? (
                <p className="text-accent">Melhor marca registrada em: {cmp.improvedExercises.join(', ')}.</p>
              ) : (
                <p className="text-muted">Desempenho semelhante ao anterior — manter também é progresso.</p>
              )}
            </>
          )}
        </div>
        <p className="text-sm text-muted mt-4">
          Você registrou {comp.done} séries hoje. Na próxima vez, o FORJA usa estes números para sugerir as cargas — sempre com sua confirmação.
        </p>
        <Button variant="primary" size="lg" className="w-full mt-6 mb-4" onClick={onClose} data-testid="summary-close">
          Concluir
        </Button>
      </div>
    </div>
  );
}
