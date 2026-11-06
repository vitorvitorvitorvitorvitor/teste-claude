import { useLiveQuery } from 'dexie-react-hooks';
import { useMemo, useState } from 'react';
import { db } from '../../db/db';
import { addBodyWeight } from '../../db/repo';
import { MUSCLE_LABEL, MUSCLES } from '../../data/exercises';
import { addDays, dayKey, formatShortDate, monthName, startOfWeek } from '../../engine/dates';
import type { EngineState } from '../../engine/recommend';
import { isCountedStatus, muscleSets, sessionVolume } from '../../engine/volume';
import { BarChart, HBarChart, LineChart } from '../components/charts';
import { Button, Card, Empty, NumberInput, SectionTitle, Stat } from '../components/ui';

export function ProgressScreen({ st }: { st: EngineState }) {
  const records = useLiveQuery(() => db.progress.toArray(), [], []);
  const weights = useLiveQuery(() => db.bodyWeights.orderBy('date').toArray(), [], []);
  const [bw, setBw] = useState<number | null>(null);
  const sessions = useMemo(() => st.sessions.filter(isCountedStatus).sort((a, b) => a.startedAt.localeCompare(b.startedAt)), [st.sessions]);
  const now = st.now;

  const loadExercises = useMemo(() => {
    const ids = new Map<string, number>();
    for (const r of records) if (r.topWeightKg) ids.set(r.exerciseId, (ids.get(r.exerciseId) ?? 0) + 1);
    return [...ids.entries()].sort((a, b) => b[1] - a[1]).map(([id]) => ({ id, name: st.library.find((e) => e.id === id)?.name ?? id }));
  }, [records, st.library]);
  const [exId, setExId] = useState<string | null>(null);
  const selEx = exId ?? loadExercises[0]?.id ?? null;
  const loadSeries = records
    .filter((r) => r.exerciseId === selEx && r.topWeightKg)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-15)
    .map((r) => ({ label: formatShortDate(r.date), value: r.topWeightKg! }));

  const months = Array.from({ length: 6 }, (_, i) => new Date(now.getFullYear(), now.getMonth() - 5 + i, 1));
  const monthly = months.map((m) => ({
    label: monthName(m.getMonth()).slice(0, 3),
    value: sessions.filter((s) => {
      const d = new Date(s.startedAt);
      return d.getMonth() === m.getMonth() && d.getFullYear() === m.getFullYear();
    }).length
  }));

  const weeks = Array.from({ length: 8 }, (_, i) => addDays(startOfWeek(now), -7 * (7 - i)));
  const inWeek = (w: Date) => sessions.filter((s) => {
    const t = new Date(s.startedAt).getTime();
    return t >= w.getTime() && t < addDays(w, 7).getTime();
  });
  const weeklyVolume = weeks.map((w) => ({ label: formatShortDate(w), value: Math.round(inWeek(w).reduce((a, s) => a + sessionVolume(s), 0)) }));
  const weeklySessions = weeks.map((w) => ({ label: formatShortDate(w), value: inWeek(w).length }));

  const last28 = sessions.filter((s) => new Date(s.startedAt).getTime() >= now.getTime() - 28 * 86400000);
  const ms = muscleSets(last28);
  const muscleData = MUSCLES.map((m) => ({ label: MUSCLE_LABEL[m], value: Math.round(ms[m] * 10) / 10 })).sort((a, b) => b.value - a.value);

  const durations = sessions.slice(-12).map((s) => ({ label: formatShortDate(s.startedAt), value: Math.round(s.durationSec / 60) }));
  const completed = sessions.filter((s) => s.status === 'concluida').length;
  const last14 = sessions.filter((s) => new Date(s.startedAt).getTime() >= now.getTime() - 14 * 86400000).length;
  const avgMin = sessions.length ? Math.round(sessions.reduce((a, s) => a + s.durationSec, 0) / sessions.length / 60) : 0;

  // Mensagens baseadas em realizações concretas (sem exageros)
  const wins: string[] = [];
  if (sessions.length) wins.push(`Você registrou ${sessions.length} treino${sessions.length > 1 ? 's' : ''} no total.`);
  if (last14 > 0) wins.push(`${last14} treino${last14 > 1 ? 's' : ''} nas últimas 2 semanas.`);
  if (loadSeries.length >= 2 && loadSeries.at(-1)!.value > loadSeries[0].value)
    wins.push(`${loadExercises.find((e) => e.id === selEx)?.name}: de ${loadSeries[0].value} kg para ${loadSeries.at(-1)!.value} kg nos registros.`);
  const activeWeeks = (() => {
    if (!st.prefs.showStreak) return null;
    // A semana atual sem treino não "quebra" a contagem: ainda há tempo.
    let w = startOfWeek(now);
    if (inWeek(w).length === 0) w = addDays(w, -7);
    let n = 0;
    while (inWeek(w).length > 0 && n < 520) {
      n++;
      w = addDays(w, -7);
    }
    return n;
  })();

  return (
    <div className="px-4 max-w-lg mx-auto">
      <header className="pt-safe pb-2">
        <h1 className="text-[28px] font-bold mt-2">Evolução</h1>
      </header>
      <div className="grid grid-cols-3 gap-2">
        <Stat label="Concluídas" value={completed} />
        <Stat label="Últimos 14 dias" value={last14} />
        <Stat label="Duração média" value={avgMin ? `${avgMin} min` : '—'} />
      </div>
      {activeWeeks !== null && activeWeeks > 0 && (
        <p className="text-sm mt-3 px-1">
          Semanas ativas seguidas: <b>{activeWeeks}</b>
        </p>
      )}
      {wins.length > 0 && (
        <Card className="mt-3">
          <ul className="text-sm space-y-1">
            {wins.map((w) => (
              <li key={w}>✓ {w}</li>
            ))}
          </ul>
        </Card>
      )}

      {sessions.length === 0 && (
        <Card className="mt-3">
          <Empty>Os gráficos aparecem a partir do seu primeiro treino registrado. Nenhum dado de exemplo é exibido.</Empty>
        </Card>
      )}

      {sessions.length > 0 && (
        <>
          <SectionTitle>Carga por exercício</SectionTitle>
          <Card>
            {loadExercises.length === 0 ? (
              <Empty>Registre cargas em kg para acompanhar a evolução por exercício.</Empty>
            ) : (
              <>
                <select className="w-full h-11 rounded-xl bg-surface2 border border-line px-3 mb-3" value={selEx ?? ''} onChange={(e) => setExId(e.target.value)} aria-label="Exercício">
                  {loadExercises.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.name}
                    </option>
                  ))}
                </select>
                <LineChart data={loadSeries} unit=" kg" title="Maior carga por sessão" />
                <p className="text-[11px] text-muted mt-1">Maior carga registrada em cada sessão.</p>
              </>
            )}
          </Card>

          <SectionTitle>Frequência mensal</SectionTitle>
          <Card>
            <BarChart data={monthly} title="Sessões por mês" />
          </Card>

          <SectionTitle>Sessões por semana</SectionTitle>
          <Card>
            <BarChart data={weeklySessions} title="Sessões por semana" />
            <p className="text-[11px] text-muted mt-1">Semana iniciando na segunda-feira indicada.</p>
          </Card>

          <SectionTitle>Volume de treino semanal</SectionTitle>
          <Card>
            <BarChart data={weeklyVolume} unit=" kg" title="Volume semanal (kg × repetições)" />
            <p className="text-[11px] text-muted mt-1">Soma de carga × repetições das séries com carga registrada. Mais volume não significa necessariamente mais resultado.</p>
          </Card>

          <SectionTitle>Distribuição muscular (28 dias)</SectionTitle>
          <Card>
            <HBarChart data={muscleData} title="Séries por grupo muscular" />
            <p className="text-[11px] text-muted mt-2">Séries diretas contam 1; séries em que o músculo é secundário contam 0,5.</p>
          </Card>

          <SectionTitle>Duração das sessões</SectionTitle>
          <Card>
            <LineChart data={durations} unit=" min" title="Duração por sessão" />
          </Card>
        </>
      )}

      <SectionTitle>Peso corporal (opcional)</SectionTitle>
      <Card>
        <div className="flex gap-2">
          <NumberInput label="Peso corporal em kg" decimals value={bw} onChange={setBw} placeholder="kg" />
          <Button
            variant="primary"
            disabled={!bw || bw < 30 || bw > 300}
            onClick={async () => {
              await addBodyWeight(bw!, now);
              setBw(null);
            }}
          >
            Registrar
          </Button>
        </div>
        {weights.length > 0 ? (
          <div className="mt-3">
            <LineChart data={weights.slice(-20).map((w) => ({ label: formatShortDate(w.date + 'T12:00'), value: w.weightKg }))} unit=" kg" title="Peso corporal" />
          </div>
        ) : (
          <p className="text-xs text-muted mt-2">Registrar o peso é opcional. Mudanças graduais ao longo de semanas são mais significativas que variações diárias.</p>
        )}
        {weights.some((w) => w.date === dayKey(now)) && <p className="text-xs text-muted mt-1">Registro de hoje salvo.</p>}
      </Card>
      <div className="h-4" />
    </div>
  );
}
