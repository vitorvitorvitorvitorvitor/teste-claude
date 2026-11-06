import { useLiveQuery } from 'dexie-react-hooks';
import { useEffect, useState } from 'react';
import { db } from './db/db';
import { engineState } from './db/repo';
import { applyTheme } from './lib/theme';
import { Icon, cx } from './ui/components/ui';
import { History } from './ui/screens/History';
import { Onboarding } from './ui/screens/Onboarding';
import { Plans } from './ui/screens/Plans';
import { Profile } from './ui/screens/Profile';
import { ProgressScreen } from './ui/screens/Progress';
import { Today } from './ui/screens/Today';
import { Workout } from './ui/screens/Workout';

const TABS = [
  { id: 'hoje', label: 'Hoje', icon: 'today' },
  { id: 'treinos', label: 'Treinos', icon: 'dumbbell' },
  { id: 'historico', label: 'Histórico', icon: 'history' },
  { id: 'evolucao', label: 'Evolução', icon: 'chart' },
  { id: 'perfil', label: 'Perfil', icon: 'user' }
] as const;
type Tab = (typeof TABS)[number]['id'];

function readTab(): Tab {
  try {
    const t = localStorage.getItem('forja.tab');
    if (TABS.some((x) => x.id === t)) return t as Tab;
  } catch {
    /* sem storage */
  }
  return 'hoje';
}

/** "Agora" atualizado a cada minuto, para virar o dia corretamente. */
function useNow() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 60000);
    const vis = () => document.visibilityState === 'visible' && setNow(new Date());
    document.addEventListener('visibilitychange', vis);
    return () => {
      window.clearInterval(id);
      document.removeEventListener('visibilitychange', vis);
    };
  }, []);
  return now;
}

export default function App() {
  const now = useNow();
  const [tab, setTab] = useState<Tab>(readTab);
  const [workoutId, setWorkoutId] = useState<string | null>(null);
  // undefined = carregando; null = sem perfil
  const st = useLiveQuery(async () => (await engineState(now)) ?? null, [now]);
  const prefs = useLiveQuery(() => db.prefs.get('prefs'), []);

  useEffect(() => {
    if (prefs) applyTheme(prefs);
  }, [prefs]);

  useEffect(() => {
    try {
      localStorage.setItem('forja.tab', tab);
    } catch {
      /* ignora */
    }
    window.scrollTo(0, 0);
  }, [tab]);

  if (st === undefined) return <div className="h-full grid place-items-center text-muted">Carregando…</div>;
  if (st === null) return <Onboarding onDone={() => setTab('hoje')} />;

  return (
    <div className="min-h-full">
      <main className="pb-nav">
        {tab === 'hoje' && <Today st={st} onOpenWorkout={setWorkoutId} goTo={(t) => setTab(t as Tab)} />}
        {tab === 'treinos' && <Plans st={st} />}
        {tab === 'historico' && <History st={st} />}
        {tab === 'evolucao' && <ProgressScreen st={st} />}
        {tab === 'perfil' && <Profile st={st} />}
      </main>

      <nav className="fixed bottom-0 inset-x-0 z-30 bg-bg/90 backdrop-blur-lg border-t border-line/70 pb-safe" aria-label="Navegação principal">
        <div className="max-w-lg mx-auto grid grid-cols-5">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              aria-current={tab === t.id ? 'page' : undefined}
              className={cx('flex flex-col items-center gap-0.5 pt-2.5 pb-1 text-[11px] transition', tab === t.id ? 'text-accent' : 'text-muted')}
            >
              <Icon name={t.icon} className="h-6 w-6" strokeWidth={tab === t.id ? 2.3 : 1.8} />
              {t.label}
            </button>
          ))}
        </div>
      </nav>

      {workoutId && <Workout sessionId={workoutId} st={st} onClose={() => setWorkoutId(null)} />}
    </div>
  );
}
