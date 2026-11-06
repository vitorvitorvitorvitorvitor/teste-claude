import { useMemo, useState } from 'react';
import type { BodyRegion, Exercise, RecoveryCheckIn, SessionMode } from '../../domain/types';
import { MUSCLE_LABEL, REGION_LABEL } from '../../data/exercises';
import { dayKey, formatLongDate, greeting, relativeDay, formatDuration } from '../../engine/dates';
import { ACTIVE_RECOVERY_IDEAS, buildSession, createSession, recommendToday, type EngineState } from '../../engine/recommend';
import { selectionContext, uid } from '../../engine/splits';
import { swapOptions } from '../../engine/selection';
import { discardSession, logDay, saveCheckIn, saveSession, undoDayLog } from '../../db/repo';
import { unlockAudio } from '../../lib/beep';
import { MINUTES, MODE_LABEL } from '../labels';
import { ExerciseSheet, SwapSheet } from '../components/exercise';
import { ExerciseThumb } from '../figure/Demo';
import { Button, Card, Chip, Confirm, Icon, SectionTitle, Segmented, Sheet } from '../components/ui';

export function Today({ st, onOpenWorkout, goTo }: { st: EngineState; onOpenWorkout: (id: string) => void; goTo: (tab: string) => void }) {
  const rec = useMemo(() => recommendToday(st), [st]);
  const [force, setForce] = useState(false);
  const [modeSel, setModeSel] = useState<SessionMode | null>(null);
  const [minutes, setMinutes] = useState<number | null>(null);
  const [swaps, setSwaps] = useState<Record<string, string>>({});
  const [showList, setShowList] = useState(false);
  const [sheet, setSheet] = useState<null | 'duracao' | 'checkin'>(null);
  const [swapSlot, setSwapSlot] = useState<string | null>(null);
  const [info, setInfo] = useState<Exercise | null>(null);
  const [confirmDiscard, setConfirmDiscard] = useState(false);

  const showWorkout = rec.kind === 'treino' || (force && rec.canTrainAnyway && rec.template);
  const mode: SessionMode = modeSel ?? rec.mode;
  const built = useMemo(
    () => (showWorkout && rec.template ? buildSession(st, rec.template, { mode, minutes: minutes ?? undefined, swaps, painRegions: rec.painRegions }) : null),
    [showWorkout, rec, st, mode, minutes, swaps]
  );
  const lib = (id: string) => st.library.find((e) => e.id === id);
  const now = st.now;
  const todayCheckIn = st.checkIn;

  async function start() {
    if (!rec.template || !built) return;
    unlockAudio();
    const reasons = [...rec.reasons, ...built.notes];
    const s = createSession(st, rec.template, built, mode, reasons, uid('ses'));
    await saveSession(s);
    onOpenWorkout(s.id);
  }

  async function dayAction(type: 'descanso' | 'nao_consegui' | 'adiado') {
    await logDay(type, now);
    setForce(false);
    setModeSel(null);
  }

  const swapEx = swapSlot && built ? lib(built.exercises.find((e) => e.slotId === swapSlot)?.exerciseId ?? '') : undefined;
  const swapOpts = swapEx ? swapOptions(swapEx, selectionContext({ profile: st.profile, prefs: st.prefs, library: st.library }, rec.painRegions)) : [];
  const hasLogToday = st.dayLogs.some((l) => l.date === dayKey(now));

  return (
    <div className="px-4 max-w-lg mx-auto">
      <header className="pt-safe pb-2">
        <p className="text-sm text-muted mt-2">{formatLongDate(now).replace(/^./, (c) => c.toUpperCase())}</p>
        <h1 className="text-[28px] font-bold leading-tight mt-1">
          {greeting(now)}, {st.profile.name}!
        </h1>
        {rec.kind === 'treino' && <p className="text-muted">Seu treino está pronto.</p>}
        {rec.kind === 'retomar' && <p className="text-muted">Você tem um treino em andamento.</p>}
      </header>

      <WeekStrip count={rec.weekCount} target={rec.weekTarget} />

      {!todayCheckIn && rec.kind !== 'retomar' && (
        <button onClick={() => setSheet('checkin')} className="mt-3 w-full rounded-2xl bg-surface2 px-4 py-3 text-left text-sm flex items-center justify-between">
          <span>
            <span className="font-medium">Como você está hoje?</span>
            <span className="block text-muted text-xs">Check-in opcional de 10 segundos para ajustar o treino</span>
          </span>
          <Icon name="chevron" className="h-4 w-4 text-muted" />
        </button>
      )}
      {todayCheckIn && (
        <button onClick={() => setSheet('checkin')} className="mt-3 text-xs text-muted underline underline-offset-2">
          Check-in de hoje: energia {todayCheckIn.energy}/5 · sono {todayCheckIn.sleep}/5 · dor muscular {todayCheckIn.soreness}/5 (editar)
        </button>
      )}

      {/* ───── Retomar ───── */}
      {rec.kind === 'retomar' && rec.inProgress && (
        <Card className="mt-4">
          <div className="text-xs uppercase tracking-wider text-accent font-semibold">Em andamento</div>
          <h2 className="text-2xl font-bold mt-1">{rec.inProgress.templateName}</h2>
          <p className="text-muted text-sm mt-1">{rec.reasons[0]}</p>
          <Button variant="primary" size="lg" className="w-full mt-4" onClick={() => onOpenWorkout(rec.inProgress!.id)}>
            <Icon name="play" /> RETOMAR TREINO
          </Button>
          <Button variant="ghost" className="w-full mt-2 text-danger" onClick={() => setConfirmDiscard(true)}>
            Descartar treino
          </Button>
          <Confirm
            open={confirmDiscard}
            title="Descartar treino?"
            message="As séries registradas nesta sessão serão apagadas. Esta ação não pode ser desfeita."
            confirmLabel="Descartar"
            danger
            onCancel={() => setConfirmDiscard(false)}
            onConfirm={async () => {
              setConfirmDiscard(false);
              await discardSession(rec.inProgress!.id);
            }}
          />
        </Card>
      )}

      {/* ───── Pare / recuperação ───── */}
      {(rec.kind === 'pare' || rec.kind === 'recuperacao_ativa' || ((rec.kind === 'descanso' || rec.kind === 'concluido') && !force)) && (
        <Card className="mt-4">
          <div className={`text-xs uppercase tracking-wider font-semibold ${rec.kind === 'pare' ? 'text-danger' : 'text-accent'}`}>
            {rec.kind === 'pare' ? 'Atenção' : rec.kind === 'concluido' ? 'Concluído' : 'Recuperação'}
          </div>
          <h2 className="text-2xl font-bold mt-1 flex items-center gap-2">
            {rec.kind === 'pare' ? <Icon name="shield" className="h-6 w-6" /> : <Icon name="moon" className="h-6 w-6" />}
            {rec.headline}
          </h2>
          <ul className="mt-3 space-y-1.5 text-sm text-muted">
            {rec.reasons.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
          {rec.kind !== 'pare' && rec.kind !== 'concluido' && (
            <div className="mt-4 rounded-2xl bg-surface2 p-3 text-sm">
              <div className="font-medium flex items-center gap-2 mb-1">
                <Icon name="walk" className="h-4 w-4" /> Ideias para recuperação ativa (opcional)
              </div>
              <ul className="text-muted space-y-0.5">
                {ACTIVE_RECOVERY_IDEAS.map((i) => (
                  <li key={i}>• {i}</li>
                ))}
              </ul>
            </div>
          )}
          {rec.canTrainAnyway && rec.template && (
            <Button className="w-full mt-4" onClick={() => setForce(true)}>
              Treinar mesmo assim ({rec.template.name})
            </Button>
          )}
          {hasLogToday && rec.kind === 'descanso' && (
            <Button variant="ghost" className="w-full mt-2 text-sm" onClick={() => undoDayLog(now)}>
              Desfazer registro de hoje
            </Button>
          )}
          {rec.kind === 'descanso' && !hasLogToday && (
            <Button variant="ghost" className="w-full mt-2 text-sm" onClick={() => logDay('descanso', now)}>
              Registrar descanso
            </Button>
          )}
        </Card>
      )}

      {rec.kind === 'sem_plano' && (
        <Card className="mt-4">
          <h2 className="text-xl font-bold">{rec.headline}</h2>
          <p className="text-muted text-sm mt-1">{rec.reasons[0]}</p>
          <Button variant="primary" className="w-full mt-4" onClick={() => goTo('treinos')}>
            Abrir Treinos
          </Button>
        </Card>
      )}

      {/* ───── Treino recomendado ───── */}
      {showWorkout && rec.template && built && (
        <>
          <Card className="mt-4 relative overflow-hidden">
            <div className="absolute -right-10 -top-10 h-36 w-36 rounded-full bg-accent/10" />
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-wider text-accent font-semibold">Treino de hoje</span>
              {mode !== 'normal' && <span className="text-[11px] rounded-full bg-accent/15 text-accent px-2 py-0.5">{MODE_LABEL[mode]}</span>}
            </div>
            <h2 className="text-3xl font-bold mt-1" data-testid="today-workout-name">
              {rec.template.name}
            </h2>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {built.muscles.map((m) => (
                <span key={m} className="text-xs rounded-full bg-surface2 px-2.5 py-1 text-muted">
                  {MUSCLE_LABEL[m]}
                </span>
              ))}
            </div>
            <div className="grid grid-cols-3 gap-2 mt-4 text-center">
              <div className="rounded-2xl bg-surface2 py-2">
                <div className="text-xl font-semibold tabular">{built.exercises.length}</div>
                <div className="text-[11px] text-muted">exercícios</div>
              </div>
              <div className="rounded-2xl bg-surface2 py-2">
                <div className="text-xl font-semibold tabular">~{built.estimatedMin}</div>
                <div className="text-[11px] text-muted">minutos</div>
              </div>
              <div className="rounded-2xl bg-surface2 py-2">
                <div className="text-xl font-semibold tabular">{built.exercises.reduce((a, e) => a + e.targetSets, 0)}</div>
                <div className="text-[11px] text-muted">séries</div>
              </div>
            </div>
            <Button variant="primary" size="lg" className="w-full mt-4 tracking-wide" onClick={start} data-testid="start-workout">
              <Icon name="play" /> INICIAR TREINO
            </Button>
            {mode !== 'rapido' ? (
              <Button className="w-full mt-2" onClick={() => setModeSel('rapido')}>
                <Icon name="bolt" /> Hoje só tenho 15 minutos
              </Button>
            ) : (
              <Button className="w-full mt-2" onClick={() => setModeSel(null)}>
                Voltar ao treino completo
              </Button>
            )}
          </Card>

          <div className="grid grid-cols-2 gap-2 mt-3">
            <Button size="md" onClick={() => setShowList((s) => !s)}>
              <Icon name="dumbbell" className="h-4 w-4" /> {showList ? 'Ocultar' : 'Ver exercícios'}
            </Button>
            <Button size="md" onClick={() => setSheet('duracao')}>
              <Icon name="clock" className="h-4 w-4" /> Ajustar duração
            </Button>
            <Button size="md" onClick={() => setModeSel('rapido')}>
              <Icon name="bolt" className="h-4 w-4" /> Treino rápido
            </Button>
            <Button size="md" onClick={() => dayAction('adiado')}>
              <Icon name="calendar" className="h-4 w-4" /> Adiar treino
            </Button>
            <Button size="md" onClick={() => dayAction('descanso')}>
              <Icon name="moon" className="h-4 w-4" /> Registrar descanso
            </Button>
            <Button size="md" onClick={() => dayAction('nao_consegui')}>
              <Icon name="heart" className="h-4 w-4" /> Não consegui ir hoje
            </Button>
          </div>

          {(showList || swapSlot) && (
            <div className="mt-3 space-y-2" data-testid="exercise-preview">
              {built.exercises.map((e) => (
                <div key={e.slotId} className="rounded-2xl bg-surface border border-line/60 p-3 flex items-center gap-3">
                  {lib(e.exerciseId) && (
                    <button onClick={() => setInfo(lib(e.exerciseId) ?? null)} aria-label={`Ver demonstração de ${e.exerciseName}`}>
                      <ExerciseThumb ex={lib(e.exerciseId)!} />
                    </button>
                  )}
                  <button className="flex-1 text-left" onClick={() => setInfo(lib(e.exerciseId) ?? null)}>
                    <div className="font-medium">{e.exerciseName}</div>
                    <div className="text-xs text-muted tabular">
                      {e.targetSets} × {e.repMin}–{e.repMax}
                      {e.loadType === 'tempo' ? ' s' : ''} · descanso {e.restSec}s
                      {e.previousWeightKg ? ` · última ${e.previousWeightKg} kg` : ''}
                    </div>
                  </button>
                  <button aria-label={`Trocar ${e.exerciseName}`} onClick={() => setSwapSlot(e.slotId)} className="h-10 w-10 rounded-full bg-surface2 grid place-items-center">
                    <Icon name="swap" className="h-4 w-4" />
                  </button>
                </div>
              ))}
              <p className="text-xs text-muted px-1">Trocas feitas aqui valem só para hoje. Para mudar a ficha, use a aba Treinos.</p>
            </div>
          )}

          <SectionTitle>Por que este treino?</SectionTitle>
          <Card>
            <ul className="space-y-1.5 text-sm">
              {[...rec.reasons, ...built.notes].map((r) => (
                <li key={r} className="flex gap-2">
                  <Icon name="check" className="h-4 w-4 text-accent shrink-0 mt-0.5" />
                  <span>{r}</span>
                </li>
              ))}
            </ul>
            {rec.warnings.map((w) => (
              <p key={w} className="text-sm text-warn bg-warn/10 rounded-xl p-2.5 mt-3">
                {w}
              </p>
            ))}
          </Card>
        </>
      )}

      {rec.lastSession && (
        <p className="text-xs text-muted mt-5 px-1">
          Última sessão: {rec.lastSession.templateName} · {relativeDay(rec.lastSession.startedAt, now)} · {formatDuration(rec.lastSession.durationSec)}
          {rec.lastSession.status === 'parcial' ? ' · parcial' : ''}
        </p>
      )}
      <p className="text-[11px] text-muted/80 mt-4 mb-2 px-1 leading-relaxed">
        Pare imediatamente diante de dor aguda, dor no peito, falta de ar desproporcional ou tontura e procure avaliação profissional. O FORJA não substitui um profissional de Educação Física ou de saúde.
      </p>

      <Sheet open={sheet === 'duracao'} onClose={() => setSheet(null)} title="Quanto tempo você tem hoje?">
        <Segmented
          value={minutes ?? st.profile.sessionMinutes}
          onChange={(v) => {
            setMinutes(v);
            if (v <= 20) setModeSel('rapido');
            else if (mode === 'rapido') setModeSel(null);
            setSheet(null);
          }}
          options={MINUTES.map((m) => ({ value: m, label: `${m} min` }))}
          label="Duração"
        />
        <p className="text-xs text-muted mt-3">Acessórios são removidos primeiro; os exercícios essenciais da ficha são mantidos.</p>
      </Sheet>

      <CheckInSheet open={sheet === 'checkin'} initial={todayCheckIn} onClose={() => setSheet(null)} onSave={async (c) => { await saveCheckIn(c, now); setSheet(null); }} />

      <SwapSheet
        open={!!swapSlot}
        current={swapEx}
        options={swapOpts}
        onClose={() => setSwapSlot(null)}
        onPick={(o) => {
          setSwaps((s) => ({ ...s, [swapSlot!]: o.id }));
          setSwapSlot(null);
          setShowList(true);
        }}
      />
      <ExerciseSheet ex={info} onClose={() => setInfo(null)} />
    </div>
  );
}

function WeekStrip({ count, target }: { count: number; target: number }) {
  return (
    <div className="flex items-center gap-3 mt-2" aria-label={`${count} de ${target} treinos nesta semana`}>
      <div className="flex gap-1.5">
        {Array.from({ length: Math.max(target, count) }, (_, i) => (
          <span key={i} className={`h-2.5 w-6 rounded-full ${i < count ? 'bg-accent' : 'bg-surface2'}`} />
        ))}
      </div>
      <span className="text-xs text-muted tabular">
        {count} de {target} nesta semana
      </span>
    </div>
  );
}

type CheckInData = Omit<RecoveryCheckIn, 'id' | 'createdAt' | 'date'>;

function Scale({ label, value, onChange, low, high }: { label: string; value: number; onChange: (v: number) => void; low: string; high: string }) {
  return (
    <div className="mb-4">
      <div className="text-sm mb-1.5">{label}</div>
      <div className="grid grid-cols-5 gap-1.5">
        {[1, 2, 3, 4, 5].map((n) => (
          <Chip key={n} active={value === n} onClick={() => onChange(n)} className="px-0">
            {n}
          </Chip>
        ))}
      </div>
      <div className="flex justify-between text-[11px] text-muted mt-1">
        <span>{low}</span>
        <span>{high}</span>
      </div>
    </div>
  );
}

function CheckInSheet({ open, initial, onClose, onSave }: { open: boolean; initial?: RecoveryCheckIn; onClose: () => void; onSave: (c: CheckInData) => void }) {
  const [c, setC] = useState<CheckInData>(
    initial ?? { energy: 3, soreness: 2, sleep: 3, pain: 'nenhuma', painRegions: [], redFlags: false }
  );
  const regions = Object.keys(REGION_LABEL) as BodyRegion[];
  return (
    <Sheet open={open} onClose={onClose} title="Como você está hoje?">
      <Scale label="Energia" value={c.energy} onChange={(v) => setC({ ...c, energy: v })} low="muito baixa" high="ótima" />
      <Scale label="Sono da última noite" value={c.sleep} onChange={(v) => setC({ ...c, sleep: v })} low="ruim" high="ótimo" />
      <Scale label="Dor muscular (de treino)" value={c.soreness} onChange={(v) => setC({ ...c, soreness: v })} low="nenhuma" high="intensa" />
      <div className="text-sm mb-1.5">Dor articular ou de lesão</div>
      <Segmented
        value={c.pain}
        onChange={(v) => setC({ ...c, pain: v, painRegions: v === 'nenhuma' ? [] : c.painRegions })}
        options={[
          { value: 'nenhuma', label: 'Nenhuma' },
          { value: 'desconforto', label: 'Desconforto leve' },
          { value: 'aguda', label: 'Dor aguda' }
        ]}
        label="Dor"
      />
      {c.pain !== 'nenhuma' && (
        <div className="flex flex-wrap gap-2 mt-3">
          {regions.map((r) => (
            <Chip key={r} active={c.painRegions.includes(r)} onClick={() => setC({ ...c, painRegions: c.painRegions.includes(r) ? c.painRegions.filter((x) => x !== r) : [...c.painRegions, r] })}>
              {REGION_LABEL[r]}
            </Chip>
          ))}
        </div>
      )}
      <label className="flex items-start gap-3 mt-4 text-sm">
        <input type="checkbox" className="h-5 w-5 mt-0.5" checked={c.redFlags} onChange={(e) => setC({ ...c, redFlags: e.target.checked })} />
        <span>Tive dor no peito, falta de ar desproporcional, tontura ou desmaio recentemente</span>
      </label>
      <p className="text-xs text-muted mt-3">
        Dor muscular tardia é comum e diferente de dor articular. Cansaço ou falta de vontade não são lesão: nesses dias, o treino rápido costuma ajudar.
      </p>
      <Button variant="primary" className="w-full mt-4" onClick={() => onSave(c)}>
        Salvar check-in
      </Button>
    </Sheet>
  );
}
