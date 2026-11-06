import { useState } from 'react';
import { saveProfile } from '../../db/repo';
import { Button, Icon, Progress } from '../components/ui';
import { defaultDraft, ProfileSection, SECTION_TITLE, SECTIONS, type Draft } from './ProfileForm';

export function Onboarding({ onDone }: { onDone: () => void }) {
  const [step, setStep] = useState(-1);
  const [d, setD] = useState<Draft>(defaultDraft());
  const [ack, setAck] = useState(false);
  const [saving, setSaving] = useState(false);
  const set = (p: Partial<Draft>) => setD((x) => ({ ...x, ...p }));
  const last = step === SECTIONS.length - 1;

  async function finish() {
    setSaving(true);
    const now = new Date().toISOString();
    await saveProfile({ ...d, name: d.name.trim() || 'Atleta', id: 'me', createdAt: now, updatedAt: now, onboarded: true });
    onDone();
  }

  if (step === -1) {
    return (
      <div className="min-h-full flex flex-col pt-safe pb-safe px-5 max-w-lg mx-auto">
        <div className="flex-1 flex flex-col justify-center animate-fadeUp">
          <div className="h-16 w-16 rounded-3xl bg-accent text-onaccent grid place-items-center mb-6">
            <Icon name="bolt" className="h-9 w-9" strokeWidth={2.4} />
          </div>
          <h1 className="text-4xl font-bold tracking-tight">FORJA</h1>
          <p className="text-muted text-lg mt-1">Treino Inteligente</p>
          <p className="mt-6 leading-relaxed">
            Seu treino de cada dia, montado automaticamente a partir da sua sequência, do seu histórico e da sua recuperação. Sem login, sem mensalidade e funcionando offline.
          </p>
          <ul className="mt-5 space-y-2 text-sm text-muted">
            <li>• Faltou? A sequência continua de onde parou.</li>
            <li>• Pouco tempo? Existe o treino de 15–20 minutos.</li>
            <li>• Seus dados ficam só neste aparelho.</li>
          </ul>
        </div>
        <Button variant="primary" size="lg" onClick={() => setStep(0)} className="w-full mb-2">
          Começar
        </Button>
      </div>
    );
  }

  const section = SECTIONS[step];
  return (
    <div className="min-h-full flex flex-col pt-safe pb-safe px-5 max-w-lg mx-auto">
      <div className="flex items-center gap-3 mb-4">
        <button aria-label="Voltar" onClick={() => setStep((s) => s - 1)} className="h-10 w-10 rounded-full bg-surface2 grid place-items-center">
          <Icon name="back" />
        </button>
        <Progress value={(step + 1) / SECTIONS.length} className="flex-1" />
        <span className="text-xs text-muted tabular">
          {step + 1}/{SECTIONS.length}
        </span>
      </div>
      <h1 className="text-2xl font-bold mb-5">{SECTION_TITLE[section]}</h1>
      <div className="flex-1 animate-fadeUp" key={section}>
        <ProfileSection section={section} d={d} set={set} />
        {last && (
          <div className="mt-2 rounded-2xl bg-surface2 p-4 text-sm leading-relaxed">
            <div className="flex items-center gap-2 font-semibold mb-1">
              <Icon name="shield" /> Segurança
            </div>
            Se você tem doença cardíaca, metabólica ou renal conhecida, ou sente dor no peito, falta de ar desproporcional ou tontura ao se exercitar, procure liberação médica antes de começar. Interrompa qualquer exercício diante de dor aguda.
            <label className="flex items-center gap-3 mt-3">
              <input type="checkbox" checked={ack} onChange={(e) => setAck(e.target.checked)} className="h-5 w-5 accent-[rgb(var(--accent))]" />
              <span>Li e entendi</span>
            </label>
          </div>
        )}
      </div>
      <Button
        variant="primary"
        size="lg"
        className="w-full mt-6 mb-2"
        disabled={(last && !ack) || saving || (section === 'sobre' && !d.name.trim())}
        onClick={() => (last ? void finish() : setStep((s) => s + 1))}
      >
        {last ? 'Criar meu plano' : 'Continuar'}
      </Button>
    </div>
  );
}
