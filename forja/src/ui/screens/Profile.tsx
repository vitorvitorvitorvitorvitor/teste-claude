import { useEffect, useRef, useState } from 'react';
import type { WorkoutPreferences } from '../../domain/types';
import { REFERENCES, RULES, referenceById } from '../../data/science';
import { backupFileName, exportBackup, importBackup } from '../../db/backup';
import { saveProfile, savePrefs, wipeAll } from '../../db/repo';
import type { EngineState } from '../../engine/recommend';
import { SPLIT_LABEL } from '../../engine/splits';
import { shareOrDownload } from '../../lib/download';
import { buildIcs } from '../../lib/ics';
import { ACCENTS } from '../../lib/theme';
import { GOAL_LABEL, LEVEL_LABEL, LOCATION_LABEL } from '../labels';
import { Button, Card, Chip, Confirm, Field, Icon, inputCls, NumberInput, SectionTitle, Segmented, Sheet, Toggle } from '../components/ui';
import { ProfileSection, SECTION_TITLE, SECTIONS, type Draft, type Section } from './ProfileForm';

export function Profile({ st }: { st: EngineState }) {
  const p = st.profile;
  const prefs = st.prefs;
  const [section, setSection] = useState<Section | null>(null);
  const [draft, setDraft] = useState<Draft>(p);
  const [askRegen, setAskRegen] = useState<Draft | null>(null);
  const [refsOpen, setRefsOpen] = useState(false);
  const [installOpen, setInstallOpen] = useState(false);
  const [wipeOpen, setWipeOpen] = useState(false);
  const [wipeText, setWipeText] = useState('');
  const [msg, setMsg] = useState<string | null>(null);
  const [importErr, setImportErr] = useState<string[] | null>(null);
  const [pendingImport, setPendingImport] = useState<unknown>(null);
  const [persisted, setPersisted] = useState<boolean | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    void navigator.storage?.persisted?.().then(setPersisted).catch(() => setPersisted(null));
  }, []);

  const setPrefs = (patch: Partial<WorkoutPreferences>) => void savePrefs(patch);

  function openSection(s: Section) {
    setDraft(p);
    setSection(s);
  }

  async function saveSection() {
    const changedPlanInputs =
      draft.level !== p.level || draft.goal !== p.goal || draft.daysPerWeek !== p.daysPerWeek || draft.style !== p.style || draft.equipment.join() !== p.equipment.join();
    if (draft.split !== p.split) {
      await saveProfile({ ...p, ...draft });
      setMsg(`Divisão alterada para ${SPLIT_LABEL[draft.split]}. Histórico mantido.`);
    } else if (changedPlanInputs && p.split !== 'custom') {
      setAskRegen(draft);
    } else {
      await saveProfile({ ...p, ...draft });
      setMsg('Perfil atualizado.');
    }
    setSection(null);
  }

  return (
    <div className="px-4 max-w-lg mx-auto">
      <header className="pt-safe pb-2">
        <h1 className="text-[28px] font-bold mt-2">Perfil</h1>
      </header>
      {msg && (
        <div className="mb-3 rounded-2xl bg-accent/15 text-sm p-3 flex justify-between items-center" role="status">
          {msg}
          <button aria-label="Fechar aviso" onClick={() => setMsg(null)}>
            <Icon name="x" className="h-4 w-4" />
          </button>
        </div>
      )}
      <Card>
        <div className="flex items-center gap-3">
          <div className="h-14 w-14 rounded-2xl bg-accent text-onaccent grid place-items-center text-2xl font-bold">{p.name.slice(0, 1).toUpperCase()}</div>
          <div>
            <div className="text-xl font-semibold">{p.name}</div>
            <div className="text-sm text-muted">
              {LEVEL_LABEL[p.level]} · {GOAL_LABEL[p.goal]}
            </div>
            <div className="text-xs text-muted">
              {LOCATION_LABEL[p.location]} · {p.daysPerWeek}×/semana · {p.sessionMinutes} min · {SPLIT_LABEL[p.split]}
            </div>
          </div>
        </div>
      </Card>

      <SectionTitle>Configuração do treino</SectionTitle>
      <Card className="p-0 overflow-hidden">
        {SECTIONS.map((s) => (
          <button key={s} onClick={() => openSection(s)} className="w-full flex items-center justify-between px-4 py-3.5 border-b border-line/60 last:border-0 active:bg-surface2">
            <span>{SECTION_TITLE[s]}</span>
            <Icon name="chevron" className="h-4 w-4 text-muted" />
          </button>
        ))}
      </Card>

      <SectionTitle>Prescrição</SectionTitle>
      <Card>
        <Field label="Faixa de repetições (exercícios com carga)" hint="Automático usa a faixa indicada para seu objetivo e para o tipo de exercício.">
          <div className="flex gap-2 items-center">
            <Chip active={!prefs.repRangeOverride} onClick={() => setPrefs({ repRangeOverride: null })}>
              Automático
            </Chip>
            <Chip active={!!prefs.repRangeOverride} onClick={() => setPrefs({ repRangeOverride: prefs.repRangeOverride ?? { min: 8, max: 12 } })}>
              Personalizar
            </Chip>
          </div>
          {prefs.repRangeOverride && (
            <div className="grid grid-cols-2 gap-2 mt-2">
              <NumberInput label="Repetições mínimas" value={prefs.repRangeOverride.min} min={1} onChange={(v) => v && setPrefs({ repRangeOverride: { ...prefs.repRangeOverride!, min: v } })} />
              <NumberInput label="Repetições máximas" value={prefs.repRangeOverride.max} min={1} onChange={(v) => v && setPrefs({ repRangeOverride: { ...prefs.repRangeOverride!, max: v } })} />
            </div>
          )}
        </Field>
        <Field label="Descanso entre séries" hint="Automático: ~120 s em compostos, ~75 s em isolados.">
          <Segmented
            value={prefs.restOverride ?? 0}
            onChange={(v) => setPrefs({ restOverride: v || null })}
            options={[0, 60, 90, 120, 180].map((v) => ({ value: v, label: v ? `${v}s` : 'Automático' }))}
            label="Descanso"
          />
        </Field>
        <p className="text-xs text-muted -mt-2 mb-3">Novas preferências valem para fichas geradas/regeneradas e para exercícios trocados. Fichas existentes mantêm seus valores (edite-as em Treinos).</p>
        <div className="grid grid-cols-3 gap-2">
          <Field label="Halter (kg)">
            <NumberInput label="Incremento de halter" decimals value={prefs.dumbbellStepKg} onChange={(v) => v && setPrefs({ dumbbellStepKg: v })} />
          </Field>
          <Field label="Barra (kg)">
            <NumberInput label="Incremento de barra" decimals value={prefs.barbellStepKg} onChange={(v) => v && setPrefs({ barbellStepKg: v })} />
          </Field>
          <Field label="Máquina (kg)">
            <NumberInput label="Incremento de máquina" decimals value={prefs.machineStepKg} onChange={(v) => v && setPrefs({ machineStepKg: v })} />
          </Field>
        </div>
        <p className="text-xs text-muted -mt-2">Menores incrementos disponíveis na sua academia/casa. Usados nas sugestões de progressão.</p>
        <Toggle label="Incluir aquecimento na estimativa de tempo" checked={prefs.includeWarmup} onChange={(v) => setPrefs({ includeWarmup: v })} />
      </Card>

      <SectionTitle>Aparência e hábitos</SectionTitle>
      <Card>
        <Field label="Cor de destaque">
          <div className="flex gap-3">
            {(Object.keys(ACCENTS) as WorkoutPreferences['accent'][]).map((a) => (
              <button
                key={a}
                aria-label={ACCENTS[a].label}
                aria-pressed={prefs.accent === a}
                onClick={() => setPrefs({ accent: a })}
                className={`h-10 w-10 rounded-full border-2 ${prefs.accent === a ? 'border-ink' : 'border-transparent'}`}
                style={{ background: ACCENTS[a].hex }}
              />
            ))}
          </div>
        </Field>
        <Field label="Tema">
          <Segmented value={prefs.theme} onChange={(v) => setPrefs({ theme: v })} options={[{ value: 'escuro', label: 'Escuro' }, { value: 'claro', label: 'Claro' }]} label="Tema" />
        </Field>
        <Field label="Unidade de peso">
          <Segmented value={prefs.weightUnit} onChange={(v) => setPrefs({ weightUnit: v })} options={[{ value: 'kg', label: 'kg' }, { value: 'lb', label: 'lb' }]} label="Unidade" />
        </Field>
        <Toggle label="Mostrar semanas ativas seguidas" checked={prefs.showStreak} onChange={(v) => setPrefs({ showStreak: v })} />
        <p className="text-xs text-muted">Desativado por padrão. Faltas nunca geram penalidade.</p>
      </Card>

      <SectionTitle>Lembretes</SectionTitle>
      <Card>
        <p className="text-sm text-muted">
          O Safari não permite que um app web agende notificações locais sem um servidor de push. Como alternativa real e gratuita, o FORJA cria lembretes recorrentes no Calendário do iPhone nos seus dias preferidos.
        </p>
        <Field label="Horário do lembrete">
          <select aria-label="Horário do lembrete" className={inputCls} value={prefs.notificationHour} onChange={(e) => setPrefs({ notificationHour: Number(e.target.value) })}>
            {Array.from({ length: 18 }, (_, i) => i + 5).map((h) => (
              <option key={h} value={h}>
                {String(h).padStart(2, '0')}:00
              </option>
            ))}
          </select>
        </Field>
        <Button
          className="w-full"
          disabled={p.preferredDays.length === 0}
          onClick={async () => {
            await shareOrDownload('forja-lembretes.ics', buildIcs(p.preferredDays, prefs.notificationHour), 'text/calendar');
            setPrefs({ notifications: true });
          }}
        >
          <Icon name="calendar" className="h-4 w-4" /> Adicionar lembretes ao Calendário
        </Button>
        {p.preferredDays.length === 0 && <p className="text-xs text-muted mt-2">Escolha dias preferidos em “Sua rotina” para criar lembretes.</p>}
        <p className="text-xs text-muted mt-2">Para remover, apague o evento “Treino FORJA” no app Calendário.</p>
      </Card>

      <SectionTitle>Seus dados</SectionTitle>
      <Card>
        <p className="text-sm text-muted mb-3">
          Tudo fica armazenado apenas neste aparelho (IndexedDB). Nada é enviado a servidores. Faça backups periódicos: se o Safari limpar os dados do site, o backup é a forma de recuperá-los.
          {persisted === true && ' Armazenamento persistente concedido.'}
        </p>
        <div className="grid grid-cols-2 gap-2">
          <Button
            onClick={async () => {
              const b = await exportBackup();
              await shareOrDownload(backupFileName(), JSON.stringify(b, null, 2));
              setMsg('Backup exportado.');
            }}
          >
            <Icon name="download" className="h-4 w-4" /> Exportar
          </Button>
          <Button onClick={() => fileRef.current?.click()}>
            <Icon name="upload" className="h-4 w-4" /> Importar
          </Button>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          data-testid="import-input"
          onChange={async (e) => {
            const f = e.target.files?.[0];
            e.target.value = '';
            if (!f) return;
            try {
              setPendingImport(JSON.parse(await f.text()));
            } catch {
              setImportErr(['O arquivo não é um JSON válido.']);
            }
          }}
        />
        <Button variant="danger" className="w-full mt-2" onClick={() => setWipeOpen(true)}>
          <Icon name="trash" className="h-4 w-4" /> Apagar todos os dados
        </Button>
      </Card>

      <SectionTitle>Sobre</SectionTitle>
      <Card className="p-0 overflow-hidden">
        <button onClick={() => setRefsOpen(true)} className="w-full flex items-center justify-between px-4 py-3.5 border-b border-line/60">
          <span className="flex items-center gap-2">
            <Icon name="book" className="h-4 w-4" /> Referências científicas do motor
          </span>
          <Icon name="chevron" className="h-4 w-4 text-muted" />
        </button>
        <button onClick={() => setInstallOpen(true)} className="w-full flex items-center justify-between px-4 py-3.5">
          <span className="flex items-center gap-2">
            <Icon name="download" className="h-4 w-4" /> Instalar no iPhone
          </span>
          <Icon name="chevron" className="h-4 w-4 text-muted" />
        </button>
      </Card>
      <p className="text-[11px] text-muted mt-4 px-1 leading-relaxed">
        FORJA v1.0 · Aplicativo web progressivo (PWA), não é um app da App Store. Não diagnostica, não prescreve tratamentos e não substitui avaliação de profissional de Educação Física ou de saúde.
      </p>
      <div className="h-4" />

      {/* Edição de seção */}
      <Sheet open={!!section} onClose={() => setSection(null)} title={section ? SECTION_TITLE[section] : ''}>
        {section && (
          <>
            <ProfileSection section={section} d={draft} set={(x) => setDraft((d) => ({ ...d, ...x }))} />
            <Button variant="primary" className="w-full mt-2" onClick={saveSection} disabled={!draft.name.trim()}>
              Salvar
            </Button>
          </>
        )}
      </Sheet>
      <Confirm
        open={!!askRegen}
        title="Atualizar as fichas?"
        message="Você mudou nível, objetivo, equipamentos, frequência ou estilo. Posso gerar novas fichas com essas configurações (o histórico é mantido) ou manter as fichas atuais — nesse caso, exercícios incompatíveis são substituídos automaticamente no dia."
        confirmLabel="Gerar novas fichas"
        onCancel={async () => {
          await saveProfile({ ...p, ...askRegen! });
          setAskRegen(null);
          setMsg('Perfil atualizado. Fichas mantidas.');
        }}
        onConfirm={async () => {
          await saveProfile({ ...p, ...askRegen! }, { regeneratePlan: true });
          setAskRegen(null);
          setMsg('Perfil atualizado e novas fichas geradas. Histórico mantido.');
        }}
      />

      <Confirm
        open={!!pendingImport}
        title="Importar backup?"
        message="Os dados atuais deste aparelho serão substituídos pelos do arquivo. O arquivo é validado antes; se houver erro, nada é alterado."
        confirmLabel="Importar"
        onCancel={() => setPendingImport(null)}
        onConfirm={async () => {
          const r = await importBackup(pendingImport);
          setPendingImport(null);
          if (r.ok) setMsg(`Backup importado: ${r.counts.sessions} sessões.`);
          else setImportErr(r.errors);
        }}
      />
      <Sheet open={!!importErr} onClose={() => setImportErr(null)} title="Backup inválido">
        <p className="text-sm text-muted mb-2">Nenhum dado foi alterado.</p>
        <ul className="text-sm text-danger list-disc pl-5">
          {importErr?.map((e) => (
            <li key={e}>{e}</li>
          ))}
        </ul>
      </Sheet>

      <Sheet open={wipeOpen} onClose={() => setWipeOpen(false)} title="Apagar todos os dados">
        <p className="text-sm text-muted mb-3">
          Perfil, fichas, histórico e registros serão apagados deste aparelho. Exporte um backup antes se quiser guardar algo. Digite <b>APAGAR</b> para confirmar.
        </p>
        <input className={inputCls} value={wipeText} onChange={(e) => setWipeText(e.target.value)} placeholder="APAGAR" aria-label="Confirmação" />
        <Button
          variant="danger"
          className="w-full mt-3"
          disabled={wipeText.trim().toUpperCase() !== 'APAGAR'}
          onClick={async () => {
            await wipeAll();
            setWipeOpen(false);
          }}
        >
          Apagar definitivamente
        </Button>
      </Sheet>

      <ReferencesSheet open={refsOpen} onClose={() => setRefsOpen(false)} />
      <Sheet open={installOpen} onClose={() => setInstallOpen(false)} title="Instalar no iPhone">
        <ol className="list-decimal pl-5 space-y-2 text-sm">
          <li>Abra este endereço no <b>Safari</b> (no iOS 16.4+ outros navegadores também oferecem a opção).</li>
          <li>Toque em <b>Compartilhar</b> (quadrado com seta para cima).</li>
          <li>Escolha <b>Adicionar à Tela de Início</b> e confirme.</li>
          <li>Abra o FORJA pelo ícone: ele roda em tela cheia e funciona offline após o primeiro carregamento.</li>
        </ol>
        <p className="text-xs text-muted mt-3">
          Dados do app instalado ficam separados dos dados do Safari. Se já usou no navegador, exporte um backup e importe no app instalado.
        </p>
      </Sheet>
    </div>
  );
}

function ReferencesSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [tab, setTab] = useState<'regras' | 'fontes'>('regras');
  return (
    <Sheet open={open} onClose={onClose} title="Referências científicas">
      <p className="text-xs text-muted mb-3">
        Painel de auditoria: cada regra do motor, a evidência que a sustenta, para quem se aplica, quando não aplicar e quais testes automatizados a verificam. Resultados médios de estudos não são garantias individuais.
      </p>
      <Segmented value={tab} onChange={setTab} options={[{ value: 'regras', label: `Regras (${RULES.length})` }, { value: 'fontes', label: `Fontes (${REFERENCES.length})` }]} label="Visão" />
      <div className="mt-4 space-y-3">
        {tab === 'regras' &&
          RULES.map((r) => (
            <details key={r.id} className="rounded-2xl bg-surface2 p-3">
              <summary className="font-medium cursor-pointer">
                <span className="text-xs text-muted mr-1">{r.id}</span> {r.title}
              </summary>
              <div className="mt-2 text-sm space-y-2">
                <p>
                  <b>Decisão:</b> {r.decision}
                </p>
                <p>
                  <b>Conclusão usada:</b> {r.conclusion}
                </p>
                <p>
                  <b>População:</b> {r.population}
                </p>
                {r.params.length > 0 && (
                  <p>
                    <b>Parâmetros:</b> {r.params.join('; ')}
                  </p>
                )}
                <p>
                  <b>Não aplicar quando:</b> {r.notApplicable}
                </p>
                <p>
                  <b>Confiança:</b> {r.confidence}
                </p>
                <p>
                  <b>Fontes:</b>{' '}
                  {r.refs.map((id, i) => {
                    const ref = referenceById(id);
                    return (
                      <span key={id}>
                        {i > 0 && ', '}
                        <a href={ref?.url} target="_blank" rel="noreferrer" className="text-accent underline">
                          {ref?.short ?? id}
                        </a>
                      </span>
                    );
                  })}
                </p>
                {r.tests.length > 0 && (
                  <div>
                    <b>Testes:</b>
                    <ul className="list-disc pl-5 text-xs text-muted">
                      {r.tests.map((t) => (
                        <li key={t}>{t}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </details>
          ))}
        {tab === 'fontes' &&
          REFERENCES.map((r) => (
            <div key={r.id} className="rounded-2xl bg-surface2 p-3 text-sm">
              <div className="font-medium">{r.title}</div>
              <div className="text-xs text-muted mt-0.5">
                {r.authors} · {r.source} · {r.year}
                {r.doi && ` · DOI ${r.doi}`}
              </div>
              <p className="mt-2">{r.keyFinding}</p>
              <p className="text-xs text-muted mt-1">População: {r.population}</p>
              <a href={r.url} target="_blank" rel="noreferrer" className="text-xs text-accent underline break-all">
                {r.url}
              </a>
              <div className="text-[11px] text-muted mt-1">Usada em: {RULES.filter((x) => x.refs.includes(r.id)).map((x) => x.id).join(', ') || '—'}</div>
            </div>
          ))}
      </div>
    </Sheet>
  );
}
