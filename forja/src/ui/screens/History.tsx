import { useMemo, useState } from 'react';
import type { WorkoutSession } from '../../domain/types';
import { dayKey, formatDuration, formatShortDate, monthName, weekdayShort } from '../../engine/dates';
import type { EngineState } from '../../engine/recommend';
import { isCountedStatus, sessionCompletion, sessionVolume } from '../../engine/volume';
import { SPLIT_LABEL } from '../../engine/splits';
import { MODE_LABEL } from '../labels';
import { Card, Empty, Icon, SectionTitle, cx } from '../components/ui';

const LOG_LABEL = { descanso: 'Descanso', nao_consegui: 'Não consegui ir', adiado: 'Adiado', recuperacao_ativa: 'Recuperação ativa' } as const;

export function History({ st }: { st: EngineState }) {
  const [month, setMonth] = useState(() => new Date(st.now.getFullYear(), st.now.getMonth(), 1));
  const [selDay, setSelDay] = useState<string | null>(null);
  const [open, setOpen] = useState<string | null>(null);

  const sessions = useMemo(
    () => st.sessions.filter((s) => s.status !== 'em_andamento' && s.status !== 'descartada').sort((a, b) => b.startedAt.localeCompare(a.startedAt)),
    [st.sessions]
  );
  const byDay = useMemo(() => {
    const m = new Map<string, WorkoutSession[]>();
    for (const s of sessions) m.set(dayKey(s.startedAt), [...(m.get(dayKey(s.startedAt)) ?? []), s]);
    return m;
  }, [sessions]);
  const logsByDay = useMemo(() => new Map(st.dayLogs.map((l) => [l.date, l])), [st.dayLogs]);

  const first = new Date(month);
  const offset = (first.getDay() + 6) % 7;
  const days = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const cells = [...Array(offset).fill(null), ...Array.from({ length: days }, (_, i) => new Date(month.getFullYear(), month.getMonth(), i + 1))];
  const monthSessions = sessions.filter((s) => {
    const d = new Date(s.startedAt);
    return d.getMonth() === month.getMonth() && d.getFullYear() === month.getFullYear();
  });
  const listed = selDay ? sessions.filter((s) => dayKey(s.startedAt) === selDay) : monthSessions;
  const todayKey = dayKey(st.now);

  return (
    <div className="px-4 max-w-lg mx-auto">
      <header className="pt-safe pb-2">
        <h1 className="text-[28px] font-bold mt-2">Histórico</h1>
      </header>
      <Card>
        <div className="flex items-center justify-between mb-3">
          <button aria-label="Mês anterior" className="h-9 w-9 rounded-full bg-surface2 grid place-items-center" onClick={() => { setSelDay(null); setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1)); }}>
            <Icon name="back" className="h-4 w-4" />
          </button>
          <div className="font-semibold capitalize">
            {monthName(month.getMonth())} {month.getFullYear()}
          </div>
          <button aria-label="Próximo mês" className="h-9 w-9 rounded-full bg-surface2 grid place-items-center" onClick={() => { setSelDay(null); setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1)); }}>
            <Icon name="chevron" className="h-4 w-4" />
          </button>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center text-[11px] text-muted mb-1">
          {[1, 2, 3, 4, 5, 6, 0].map((d) => (
            <span key={d}>{weekdayShort(d)}</span>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1" data-testid="calendar">
          {cells.map((d, i) => {
            if (!d) return <span key={i} />;
            const k = dayKey(d);
            const ss = byDay.get(k) ?? [];
            const done = ss.some((s) => s.status === 'concluida');
            const partial = !done && ss.some((s) => s.status === 'parcial');
            const log = logsByDay.get(k);
            return (
              <button
                key={i}
                onClick={() => setSelDay(selDay === k ? null : k)}
                aria-label={`${d.getDate()}${done ? ', treino concluído' : partial ? ', treino parcial' : log ? `, ${LOG_LABEL[log.type]}` : ''}`}
                className={cx(
                  'aspect-square rounded-xl grid place-items-center text-sm tabular relative',
                  done ? 'bg-accent text-onaccent font-semibold' : partial ? 'bg-accent/35' : 'bg-surface2',
                  selDay === k && 'ring-2 ring-ink',
                  k === todayKey && !done && 'border border-accent'
                )}
              >
                {d.getDate()}
                {log && !done && !partial && <span className="absolute bottom-1 h-1 w-1 rounded-full bg-muted" />}
              </button>
            );
          })}
        </div>
        <div className="flex gap-4 text-[11px] text-muted mt-3">
          <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded bg-accent" /> concluído</span>
          <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded bg-accent/35" /> parcial</span>
          <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-muted" /> descanso/registro</span>
        </div>
      </Card>

      <SectionTitle>{selDay ? `Dia ${formatShortDate(selDay + 'T12:00')}` : `${monthSessions.length} sessões no mês`}</SectionTitle>
      {selDay && logsByDay.get(selDay) && <p className="text-sm text-muted px-1 mb-2">Registro do dia: {LOG_LABEL[logsByDay.get(selDay)!.type]}</p>}
      <div className="space-y-2" data-testid="history-list">
        {listed.map((s) => {
          const c = sessionCompletion(s);
          const vol = sessionVolume(s);
          const isOpen = open === s.id;
          return (
            <Card key={s.id} onClick={() => setOpen(isOpen ? null : s.id)}>
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold">{s.templateName}</div>
                  <div className="text-xs text-muted tabular">
                    {formatShortDate(s.startedAt)} · {formatDuration(s.durationSec)} · {c.done}/{c.total} séries
                    {vol > 0 ? ` · ${Math.round(vol).toLocaleString('pt-BR')} kg` : ''}
                  </div>
                </div>
                <span className={cx('text-[11px] rounded-full px-2 py-0.5', s.status === 'concluida' ? 'bg-accent/15 text-accent' : 'bg-warn/15 text-warn')}>
                  {s.status === 'concluida' ? 'Concluída' : 'Parcial'}
                </span>
              </div>
              {isOpen && (
                <div className="mt-3 space-y-2 text-sm">
                  <div className="text-xs text-muted">
                    {SPLIT_LABEL[s.split]} · modo {MODE_LABEL[s.mode].toLowerCase()}
                    {s.sessionRpe ? ` · esforço ${s.sessionRpe}/10` : ''}
                  </div>
                  {s.exercises.map((e) => (
                    <div key={e.slotId + e.exerciseId} className="rounded-xl bg-surface2 p-2.5">
                      <div className="font-medium">{e.exerciseName}</div>
                      <div className="text-xs text-muted tabular">
                        {e.sets.filter((x) => x.done).length === 0
                          ? 'não realizado'
                          : e.sets
                              .filter((x) => x.done)
                              .map((x) => (e.loadType === 'carga' ? `${x.weightKg ?? '—'} kg × ${x.reps ?? '—'}` : `${x.reps ?? '—'}${e.loadType === 'tempo' ? ' s' : ''}`) + (x.rir !== null ? ` @RIR ${x.rir}` : ''))
                              .join(' · ')}
                      </div>
                      {e.notes && <div className="text-xs mt-1 italic">“{e.notes}”</div>}
                    </div>
                  ))}
                  {s.notes && <p className="text-xs italic text-muted">Obs.: {s.notes}</p>}
                </div>
              )}
            </Card>
          );
        })}
        {listed.length === 0 && <Empty>{sessions.filter(isCountedStatus).length === 0 ? 'Nenhum treino registrado ainda. Seu primeiro treino aparecerá aqui.' : 'Nenhuma sessão neste período.'}</Empty>}
      </div>
      <div className="h-4" />
    </div>
  );
}
