import { useMemo, useState } from 'react';
import type { Exercise, SplitType, TemplateSlot, WorkoutTemplate } from '../../domain/types';
import { MUSCLE_LABEL, MUSCLES } from '../../data/exercises';
import { addTemplate, regenerate, removeTemplate, saveProfile, savePrefs, saveTemplate, switchSplit } from '../../db/repo';
import { activeTemplates, nextTemplate, type EngineState } from '../../engine/recommend';
import { prescribe } from '../../engine/prescription';
import { hasEquipment, swapOptions } from '../../engine/selection';
import { selectionContext, SPLIT_LABEL, splitWarnings } from '../../engine/splits';
import { ExerciseInfo, SwapSheet } from '../components/exercise';
import { Button, Card, Chip, Confirm, Empty, Field, Icon, inputCls, NumberInput, SectionTitle, Sheet } from '../components/ui';

export function Plans({ st }: { st: EngineState }) {
  const [splitOpen, setSplitOpen] = useState(false);
  const [pendingSplit, setPendingSplit] = useState<SplitType | null>(null);
  const [edit, setEdit] = useState<{ t: WorkoutTemplate; i: number } | null>(null);
  const [regen, setRegen] = useState<WorkoutTemplate | null>(null);
  const [adding, setAdding] = useState<WorkoutTemplate | null>(null);
  const [libOpen, setLibOpen] = useState(false);
  const [renaming, setRenaming] = useState<WorkoutTemplate | null>(null);
  const [delTpl, setDelTpl] = useState<WorkoutTemplate | null>(null);
  const tpls = activeTemplates(st.plan, st.templates);
  const next = nextTemplate(st.plan, st.templates, st.sessions);
  const lib = (id: string) => st.library.find((e) => e.id === id);
  const split = st.plan?.split ?? st.profile.split;

  return (
    <div className="px-4 max-w-lg mx-auto">
      <header className="pt-safe pb-2">
        <h1 className="text-[28px] font-bold mt-2">Treinos</h1>
      </header>

      <Card>
        <div className="text-xs text-muted">Divisão atual</div>
        <div className="flex items-center justify-between">
          <div className="text-xl font-semibold">{SPLIT_LABEL[split]}</div>
          <Button size="sm" onClick={() => setSplitOpen(true)}>
            Trocar divisão
          </Button>
        </div>
        <p className="text-xs text-muted mt-2">
          {st.profile.daysPerWeek} dias/semana · {st.profile.sessionMinutes} min por sessão. A ordem das fichas é seguida em sequência, independentemente do dia da semana.
        </p>
        {splitWarnings(split, st.profile.daysPerWeek, st.profile.level).map((w) => (
          <p key={w} className="text-xs text-warn bg-warn/10 rounded-xl p-2.5 mt-2">
            {w}
          </p>
        ))}
      </Card>

      <SectionTitle
        right={
          <button className="text-xs text-accent" onClick={() => setLibOpen(true)}>
            Biblioteca de exercícios
          </button>
        }
      >
        Fichas
      </SectionTitle>

      <div className="space-y-3">
        {tpls.map((t) => (
          <Card key={t.id}>
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-semibold">{t.name}</h3>
                  {next?.id === t.id && <span className="text-[10px] uppercase tracking-wide rounded-full bg-accent text-onaccent px-2 py-0.5">Próximo</span>}
                </div>
                <div className="text-xs text-muted">{t.focus} · versão {t.version}</div>
              </div>
            </div>
            <div className="mt-3 divide-y divide-line/60">
              {t.slots.map((s, i) => {
                const ex = lib(s.exerciseId);
                return (
                  <button key={s.slotId} onClick={() => setEdit({ t, i })} className="w-full text-left py-2.5 flex items-center gap-3">
                    <span className={`h-2 w-2 rounded-full shrink-0 ${s.priority === 1 ? 'bg-accent' : s.priority === 2 ? 'bg-accent/50' : 'bg-line'}`} title={`Prioridade ${s.priority}`} />
                    <span className="flex-1">
                      <span className="block">{ex?.name ?? s.exerciseId}</span>
                      <span className="block text-xs text-muted tabular">
                        {s.sets} × {s.repMin}–{s.repMax}
                        {ex?.loadType === 'tempo' ? ' s' : ''} · {s.restSec}s · {ex ? MUSCLE_LABEL[ex.primary] : ''}
                      </span>
                    </span>
                    <Icon name="chevron" className="h-4 w-4 text-muted" />
                  </button>
                );
              })}
              {t.slots.length === 0 && <p className="py-3 text-sm text-muted">Ficha vazia. Adicione exercícios.</p>}
            </div>
            <div className="flex flex-wrap gap-2 mt-3">
              <Button size="sm" onClick={() => setAdding(t)}>
                <Icon name="plus" className="h-4 w-4" /> Exercício
              </Button>
              {split !== 'custom' && (
                <Button size="sm" onClick={() => setRegen(t)}>
                  <Icon name="refresh" className="h-4 w-4" /> Regenerar
                </Button>
              )}
              {split === 'custom' && (
                <>
                  <Button size="sm" onClick={() => setRenaming(t)}>
                    Renomear
                  </Button>
                  {tpls.length > 1 && (
                    <Button size="sm" variant="danger" onClick={() => setDelTpl(t)}>
                      Remover ficha
                    </Button>
                  )}
                </>
              )}
            </div>
          </Card>
        ))}
        {split === 'custom' && st.plan && (
          <Button className="w-full" onClick={() => addTemplate(st.plan!.id, `Treino ${String.fromCharCode(65 + tpls.length)}`)}>
            <Icon name="plus" className="h-4 w-4" /> Nova ficha
          </Button>
        )}
        <p className="text-xs text-muted px-1">
          Ponto verde = exercício essencial (mantido no treino rápido). Toque em um exercício para ajustar séries, repetições, descanso ou trocar de forma permanente.
        </p>
      </div>

      {/* Troca de divisão */}
      <Sheet open={splitOpen} onClose={() => setSplitOpen(false)} title="Trocar divisão">
        <p className="text-sm text-muted mb-3">Seu histórico de treinos é mantido. As fichas atuais são arquivadas e novas fichas são geradas.</p>
        <div className="space-y-2">
          {(Object.keys(SPLIT_LABEL) as SplitType[]).map((s) => (
            <button
              key={s}
              disabled={s === split}
              onClick={() => setPendingSplit(s)}
              className="w-full text-left rounded-2xl bg-surface2 p-3 disabled:opacity-50"
            >
              <div className="font-medium">
                {SPLIT_LABEL[s]} {s === split && '(atual)'}
              </div>
              {splitWarnings(s, st.profile.daysPerWeek, st.profile.level).map((w) => (
                <div key={w} className="text-xs text-warn mt-1">
                  {w}
                </div>
              ))}
            </button>
          ))}
        </div>
      </Sheet>
      <Confirm
        open={!!pendingSplit}
        title={`Mudar para ${pendingSplit ? SPLIT_LABEL[pendingSplit] : ''}?`}
        message="Seu histórico, cargas e evolução continuam salvos. A sequência começa na primeira ficha da nova divisão."
        confirmLabel="Mudar divisão"
        onCancel={() => setPendingSplit(null)}
        onConfirm={async () => {
          const s = pendingSplit!;
          setPendingSplit(null);
          setSplitOpen(false);
          await switchSplit(s);
        }}
      />

      <Confirm
        open={!!regen}
        title={`Regenerar ${regen?.name ?? ''}?`}
        message="Os exercícios serão trocados por variações equivalentes. Se a ficha já tiver treinos registrados, a versão anterior é preservada no histórico."
        confirmLabel="Regenerar"
        onCancel={() => setRegen(null)}
        onConfirm={async () => {
          const t = regen!;
          setRegen(null);
          await regenerate(t.id);
        }}
      />

      <Confirm
        open={!!delTpl}
        title="Remover ficha?"
        message="Sessões já registradas com esta ficha continuam no histórico."
        confirmLabel="Remover"
        danger
        onCancel={() => setDelTpl(null)}
        onConfirm={async () => {
          const t = delTpl!;
          setDelTpl(null);
          await removeTemplate(t.planId, t.id);
        }}
      />

      <RenameSheet t={renaming} onClose={() => setRenaming(null)} />
      {edit && <SlotEditor st={st} t={edit.t} index={edit.i} onClose={() => setEdit(null)} />}
      <AddExerciseSheet st={st} t={adding} onClose={() => setAdding(null)} />
      <LibrarySheet st={st} open={libOpen} onClose={() => setLibOpen(false)} />
    </div>
  );
}

function RenameSheet({ t, onClose }: { t: WorkoutTemplate | null; onClose: () => void }) {
  const [name, setName] = useState('');
  return (
    <Sheet open={!!t} onClose={onClose} title="Renomear ficha">
      <input className={inputCls} defaultValue={t?.name} onChange={(e) => setName(e.target.value)} />
      <Button
        variant="primary"
        className="w-full mt-3"
        onClick={async () => {
          if (t && name.trim()) await saveTemplate({ ...t, name: name.trim() });
          onClose();
        }}
      >
        Salvar
      </Button>
    </Sheet>
  );
}

function SlotEditor({ st, t, index, onClose }: { st: EngineState; t: WorkoutTemplate; index: number; onClose: () => void }) {
  const [slot, setSlot] = useState<TemplateSlot>(t.slots[index]);
  const [swap, setSwap] = useState(false);
  const ex = st.library.find((e) => e.id === slot.exerciseId);
  const opts = ex ? swapOptions(ex, selectionContext({ profile: st.profile, prefs: st.prefs, library: st.library })) : [];
  const valid = slot.sets >= 1 && slot.repMin >= 1 && slot.repMax >= slot.repMin && slot.restSec >= 0;

  async function save(slots: TemplateSlot[]) {
    await saveTemplate({ ...t, slots });
    onClose();
  }
  const move = (dir: -1 | 1) => {
    const arr = [...t.slots];
    const j = index + dir;
    if (j < 0 || j >= arr.length) return;
    [arr[index], arr[j]] = [arr[j], arr[index]];
    void save(arr);
  };

  return (
    <Sheet open onClose={onClose} title={ex?.name ?? 'Exercício'}>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Séries">
          <NumberInput label="Séries" value={slot.sets} min={1} onChange={(v) => setSlot({ ...slot, sets: Math.min(10, v ?? 1), manual: true })} />
        </Field>
        <Field label="Descanso (s)">
          <NumberInput label="Descanso em segundos" value={slot.restSec} onChange={(v) => setSlot({ ...slot, restSec: v ?? 0, manual: true })} />
        </Field>
        <Field label={ex?.loadType === 'tempo' ? 'Mínimo (s)' : 'Repetições mín.'}>
          <NumberInput label="Repetições mínimas" value={slot.repMin} min={1} onChange={(v) => setSlot({ ...slot, repMin: v ?? 1, manual: true })} />
        </Field>
        <Field label={ex?.loadType === 'tempo' ? 'Máximo (s)' : 'Repetições máx.'}>
          <NumberInput label="Repetições máximas" value={slot.repMax} min={1} onChange={(v) => setSlot({ ...slot, repMax: v ?? 1, manual: true })} />
        </Field>
      </div>
      <Field label="Prioridade">
        <div className="flex gap-2">
          {([1, 2, 3] as const).map((p) => (
            <Chip key={p} active={slot.priority === p} onClick={() => setSlot({ ...slot, priority: p })}>
              {p === 1 ? 'Essencial' : p === 2 ? 'Importante' : 'Acessório'}
            </Chip>
          ))}
        </div>
      </Field>
      {!valid && <p className="text-sm text-danger mb-2">Verifique os valores (máximo deve ser ≥ mínimo).</p>}
      <div className="grid grid-cols-2 gap-2">
        <Button onClick={() => setSwap(true)}>
          <Icon name="swap" className="h-4 w-4" /> Trocar
        </Button>
        <Button
          onClick={() => {
            if (!ex) return;
            const p = prescribe(ex, slot.priority, { level: st.profile.level, goal: st.profile.goal, style: st.profile.style, prefs: st.prefs });
            setSlot({ ...slot, sets: p.sets, repMin: p.repMin, repMax: p.repMax, restSec: p.restSec, manual: false });
          }}
        >
          Valores sugeridos
        </Button>
        <Button onClick={() => move(-1)} disabled={index === 0}>
          ↑ Subir
        </Button>
        <Button onClick={() => move(1)} disabled={index === t.slots.length - 1}>
          ↓ Descer
        </Button>
      </div>
      <Button variant="primary" className="w-full mt-3" disabled={!valid} onClick={() => save(t.slots.map((s, i) => (i === index ? slot : s)))}>
        Salvar alterações
      </Button>
      <Button variant="danger" className="w-full mt-2" onClick={() => save(t.slots.filter((_, i) => i !== index))}>
        Remover da ficha
      </Button>
      {ex && (
        <details className="mt-4">
          <summary className="text-sm text-muted">Instruções do exercício</summary>
          <div className="mt-3">
            <ExerciseInfo ex={ex} />
          </div>
        </details>
      )}
      <SwapSheet
        open={swap}
        current={ex}
        options={opts}
        onClose={() => setSwap(false)}
        onPick={(o) => {
          const p = prescribe(o, slot.priority, { level: st.profile.level, goal: st.profile.goal, style: st.profile.style, prefs: st.prefs });
          setSlot({ ...slot, exerciseId: o.id, pattern: o.pattern, repMin: p.repMin, repMax: p.repMax, restSec: p.restSec });
          setSwap(false);
        }}
        title="Trocar na ficha (permanente)"
      />
    </Sheet>
  );
}

function useFiltered(st: EngineState, q: string, onlyAvailable: boolean) {
  return useMemo(() => {
    const s = q.trim().toLowerCase();
    return st.library.filter(
      (e) => (!s || e.name.toLowerCase().includes(s) || MUSCLE_LABEL[e.primary].toLowerCase().includes(s)) && (!onlyAvailable || hasEquipment(e, st.profile.equipment))
    );
  }, [st, q, onlyAvailable]);
}

function AddExerciseSheet({ st, t, onClose }: { st: EngineState; t: WorkoutTemplate | null; onClose: () => void }) {
  const [q, setQ] = useState('');
  const list = useFiltered(st, q, true);
  return (
    <Sheet open={!!t} onClose={onClose} title="Adicionar exercício">
      <input className={inputCls} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por nome ou músculo…" />
      <div className="mt-3 space-y-1.5 max-h-[55vh] overflow-y-auto">
        {list.map((e) => (
          <button
            key={e.id}
            className="w-full text-left rounded-xl bg-surface2 p-3 active:bg-line"
            onClick={async () => {
              if (!t) return;
              const p = prescribe(e, 2, { level: st.profile.level, goal: st.profile.goal, style: st.profile.style, prefs: st.prefs });
              const slot: TemplateSlot = {
                slotId: `${t.code}-m${Date.now().toString(36)}`,
                pattern: e.pattern,
                exerciseId: e.id,
                sets: p.sets,
                repMin: p.repMin,
                repMax: p.repMax,
                restSec: p.restSec,
                priority: 2
              };
              await saveTemplate({ ...t, slots: [...t.slots, slot] });
              onClose();
            }}
          >
            <div className="font-medium">{e.name}</div>
            <div className="text-xs text-muted">{MUSCLE_LABEL[e.primary]}</div>
          </button>
        ))}
        {list.length === 0 && <Empty>Nenhum exercício encontrado com seus equipamentos.</Empty>}
      </div>
    </Sheet>
  );
}

function LibrarySheet({ st, open, onClose }: { st: EngineState; open: boolean; onClose: () => void }) {
  const [q, setQ] = useState('');
  const [sel, setSel] = useState<Exercise | null>(null);
  const [onlyAvail, setOnlyAvail] = useState(false);
  const list = useFiltered(st, q, onlyAvail);
  const preferred = st.prefs.preferredExercises;
  const blocked = st.profile.avoidExercises;
  return (
    <Sheet open={open} onClose={() => (sel ? setSel(null) : onClose())} title={sel ? sel.name : `Biblioteca (${st.library.length})`}>
      {sel ? (
        <>
          <ExerciseInfo ex={sel} />
          <div className="grid grid-cols-2 gap-2 mt-4">
            <Button
              onClick={() =>
                savePrefs({ preferredExercises: preferred.includes(sel.id) ? preferred.filter((x) => x !== sel.id) : [...preferred, sel.id] })
              }
            >
              {preferred.includes(sel.id) ? '★ Preferido' : '☆ Preferir'}
            </Button>
            <Button
              variant={blocked.includes(sel.id) ? 'danger' : 'secondary'}
              onClick={() =>
                saveProfile({ ...st.profile, avoidExercises: blocked.includes(sel.id) ? blocked.filter((x) => x !== sel.id) : [...blocked, sel.id] })
              }
            >
              {blocked.includes(sel.id) ? 'Bloqueado' : 'Bloquear'}
            </Button>
          </div>
          <p className="text-xs text-muted mt-2">Preferidos são escolhidos primeiro ao gerar ou substituir. Bloqueados nunca são recomendados.</p>
          <Button variant="ghost" className="w-full mt-2" onClick={() => setSel(null)}>
            Voltar à lista
          </Button>
        </>
      ) : (
        <>
          <input className={inputCls} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por nome ou músculo…" />
          <label className="flex items-center gap-2 text-sm mt-2">
            <input type="checkbox" checked={onlyAvail} onChange={(e) => setOnlyAvail(e.target.checked)} /> Só com meus equipamentos
          </label>
          <div className="mt-3 max-h-[55vh] overflow-y-auto">
            {MUSCLES.map((m) => {
              const items = list.filter((e) => e.primary === m);
              if (!items.length) return null;
              return (
                <div key={m} className="mb-3">
                  <div className="text-xs uppercase tracking-wider text-muted mb-1">{MUSCLE_LABEL[m]}</div>
                  {items.map((e) => (
                    <button key={e.id} onClick={() => setSel(e)} className="w-full text-left py-2 border-b border-line/50 flex justify-between">
                      <span>
                        {preferred.includes(e.id) && '★ '}
                        {e.name}
                      </span>
                      {blocked.includes(e.id) && <span className="text-xs text-danger">bloqueado</span>}
                    </button>
                  ))}
                </div>
              );
            })}
          </div>
        </>
      )}
    </Sheet>
  );
}
