import { useMemo, useState } from 'react';
import type { BodyRegion, Equipment, UserProfile } from '../../domain/types';
import { EQUIPMENT_LABEL, EXERCISES, GYM_EQUIPMENT, HOME_EQUIPMENT, REGION_LABEL } from '../../data/exercises';
import { SPLIT_LABEL, splitWarnings } from '../../engine/splits';
import { weekdayShort } from '../../engine/dates';
import { AGE_RANGES, GOAL_LABEL, LEVEL_LABEL, LOCATION_LABEL, MINUTES, STYLE_LABEL } from '../labels';
import { Chip, Field, inputCls, NumberInput, Segmented } from '../components/ui';

export type Draft = Omit<UserProfile, 'id' | 'createdAt' | 'updatedAt' | 'onboarded'>;

export function defaultDraft(): Draft {
  return {
    name: '',
    ageRange: '25-34',
    level: 'iniciante',
    goal: 'emagrecimento',
    location: 'academia',
    equipment: [...GYM_EQUIPMENT],
    daysPerWeek: 3,
    sessionMinutes: 45,
    style: 'tradicional',
    preferredDays: [1, 3, 5],
    avoidExercises: [],
    limitations: [],
    limitationNotes: '',
    split: 'full_body'
  };
}

export const SECTIONS = ['sobre', 'objetivo', 'local', 'rotina', 'divisao', 'restricoes'] as const;
export type Section = (typeof SECTIONS)[number];

export const SECTION_TITLE: Record<Section, string> = {
  sobre: 'Sobre você',
  objetivo: 'Nível e objetivo',
  local: 'Onde você treina',
  rotina: 'Sua rotina',
  divisao: 'Divisão de treino',
  restricoes: 'Cuidados e preferências'
};

const ALL_EQ = Object.keys(EQUIPMENT_LABEL) as Equipment[];
const REGIONS = Object.keys(REGION_LABEL) as BodyRegion[];

function toggle<T>(arr: T[], v: T): T[] {
  return arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v];
}

export function ProfileSection({ section, d, set }: { section: Section; d: Draft; set: (p: Partial<Draft>) => void }) {
  const [q, setQ] = useState('');
  const results = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (s.length < 2) return [];
    return EXERCISES.filter((e) => e.name.toLowerCase().includes(s)).slice(0, 8);
  }, [q]);

  switch (section) {
    case 'sobre':
      return (
        <>
          <Field label="Nome ou apelido">
            <input aria-label="Nome ou apelido" className={inputCls} value={d.name} onChange={(e) => set({ name: e.target.value })} placeholder="Como quer ser chamado?" autoComplete="nickname" />
          </Field>
          <Field label="Faixa etária">
            <Segmented value={d.ageRange} onChange={(v) => set({ ageRange: v })} options={AGE_RANGES.map((a) => ({ value: a, label: a }))} label="Faixa etária" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Peso (kg) — opcional">
              <NumberInput label="Peso em kg" decimals value={d.weightKg ?? null} onChange={(v) => set({ weightKg: v ?? undefined })} placeholder="—" />
            </Field>
            <Field label="Altura (cm) — opcional">
              <NumberInput label="Altura em cm" value={d.heightCm ?? null} onChange={(v) => set({ heightCm: v ?? undefined })} placeholder="—" />
            </Field>
          </div>
        </>
      );
    case 'objetivo':
      return (
        <>
          <Field label="Nível de experiência">
            <Segmented value={d.level} onChange={(v) => set({ level: v })} options={Object.entries(LEVEL_LABEL).map(([value, label]) => ({ value: value as Draft['level'], label }))} label="Nível" />
          </Field>
          <Field label="Objetivo principal">
            <div className="flex flex-col gap-2">
              {Object.entries(GOAL_LABEL).map(([value, label]) => (
                <Chip key={value} active={d.goal === value} onClick={() => set({ goal: value as Draft['goal'] })} className="justify-start text-left h-auto py-2.5 rounded-2xl">
                  {label}
                </Chip>
              ))}
            </div>
          </Field>
          {d.goal === 'emagrecimento' && (
            <p className="text-xs text-muted -mt-2">
              O FORJA ajuda a preservar e ganhar músculo enquanto você emagrece de forma gradual. Ele não calcula calorias e nunca usa treino como compensação por comida.
            </p>
          )}
        </>
      );
    case 'local':
      return (
        <>
          <Field label="Local">
            <Segmented
              value={d.location}
              onChange={(v) => set({ location: v, equipment: v === 'casa' ? [...HOME_EQUIPMENT] : v === 'academia' ? [...GYM_EQUIPMENT] : [...new Set([...GYM_EQUIPMENT, ...HOME_EQUIPMENT])] })}
              options={Object.entries(LOCATION_LABEL).map(([value, label]) => ({ value: value as Draft['location'], label }))}
              label="Local"
            />
          </Field>
          <Field label="Equipamentos disponíveis" hint="O treino só usa o que estiver marcado. Peso corporal está sempre disponível.">
            <div className="flex flex-wrap gap-2">
              {ALL_EQ.filter((e) => e !== 'peso_corporal').map((e) => (
                <Chip key={e} active={d.equipment.includes(e)} onClick={() => set({ equipment: toggle(d.equipment, e) })}>
                  {EQUIPMENT_LABEL[e]}
                </Chip>
              ))}
            </div>
          </Field>
        </>
      );
    case 'rotina':
      return (
        <>
          <Field label="Quantos dias por semana você quer treinar?" hint="Para começar, 2–3 dias funcionam muito bem.">
            <Segmented value={d.daysPerWeek} onChange={(v) => set({ daysPerWeek: v })} options={[1, 2, 3, 4, 5, 6].map((n) => ({ value: n, label: `${n}` }))} label="Dias por semana" />
          </Field>
          <Field label="Tempo disponível por sessão">
            <Segmented value={d.sessionMinutes} onChange={(v) => set({ sessionMinutes: v })} options={MINUTES.map((m) => ({ value: m, label: `${m} min` }))} label="Tempo por sessão" />
          </Field>
          <Field label="Estilo de treinamento">
            <Segmented value={d.style} onChange={(v) => set({ style: v })} options={Object.entries(STYLE_LABEL).map(([value, label]) => ({ value: value as Draft['style'], label }))} label="Estilo" />
          </Field>
          <Field label="Dias preferidos (opcional)" hint="Usados só para lembretes. O treino do dia é decidido pela sua sequência, não pelo calendário.">
            <div className="flex flex-wrap gap-2">
              {[1, 2, 3, 4, 5, 6, 0].map((wd) => (
                <Chip key={wd} active={d.preferredDays.includes(wd)} onClick={() => set({ preferredDays: toggle(d.preferredDays, wd) })}>
                  {weekdayShort(wd)}
                </Chip>
              ))}
            </div>
          </Field>
        </>
      );
    case 'divisao': {
      const warns = splitWarnings(d.split, d.daysPerWeek, d.level);
      const desc: Record<Draft['split'], string> = {
        full_body: 'Corpo inteiro em cada sessão (A/B ou A/B/C). Recomendado para iniciantes e para 2–3 dias por semana.',
        upper_lower: 'Alterna superiores e inferiores. Bom para 4 dias por semana.',
        ppl: 'Empurrar, puxar e pernas. Mais adequado para 6 dias por semana.',
        custom: 'Você monta suas fichas manualmente na aba Treinos.'
      };
      return (
        <>
          <div className="flex flex-col gap-2">
            {(Object.keys(SPLIT_LABEL) as Draft['split'][]).map((s) => (
              <button
                key={s}
                type="button"
                aria-pressed={d.split === s}
                onClick={() => set({ split: s })}
                className={`text-left rounded-2xl p-4 border transition ${d.split === s ? 'border-accent bg-accent/10' : 'border-line bg-surface2'}`}
              >
                <div className="font-semibold flex items-center gap-2">
                  {SPLIT_LABEL[s]}
                  {s === 'full_body' && <span className="text-[10px] uppercase tracking-wide bg-accent text-onaccent rounded-full px-2 py-0.5">Recomendado</span>}
                </div>
                <div className="text-sm text-muted mt-1">{desc[s]}</div>
              </button>
            ))}
          </div>
          {warns.map((w) => (
            <p key={w} className="mt-3 text-sm text-warn bg-warn/10 rounded-2xl p-3">
              {w}
            </p>
          ))}
        </>
      );
    }
    case 'restricoes':
      return (
        <>
          <Field label="Regiões com limitação ou desconforto (opcional)" hint="Exercícios que solicitam essas regiões serão evitados. Isso não substitui avaliação profissional.">
            <div className="flex flex-wrap gap-2">
              {REGIONS.map((r) => (
                <Chip key={r} active={d.limitations.includes(r)} onClick={() => set({ limitations: toggle(d.limitations, r) })}>
                  {REGION_LABEL[r]}
                </Chip>
              ))}
            </div>
          </Field>
          <Field label="Observações (opcional)">
            <textarea aria-label="Observações sobre limitações" className={`${inputCls} h-20 py-3`} value={d.limitationNotes} onChange={(e) => set({ limitationNotes: e.target.value })} placeholder="Ex.: desconforto no joelho direito ao agachar fundo" />
          </Field>
          <Field label="Exercícios que deseja evitar">
            <input aria-label="Buscar exercício para evitar" className={inputCls} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar exercício…" />
            {results.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {results.map((e) => (
                  <Chip key={e.id} active={d.avoidExercises.includes(e.id)} onClick={() => set({ avoidExercises: toggle(d.avoidExercises, e.id) })}>
                    {e.name}
                  </Chip>
                ))}
              </div>
            )}
            {d.avoidExercises.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {d.avoidExercises.map((id) => (
                  <Chip key={id} active onClick={() => set({ avoidExercises: d.avoidExercises.filter((x) => x !== id) })}>
                    {EXERCISES.find((e) => e.id === id)?.name ?? id} ✕
                  </Chip>
                ))}
              </div>
            )}
          </Field>
        </>
      );
  }
}
