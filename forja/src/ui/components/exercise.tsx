import type { Exercise } from '../../domain/types';
import { EQUIPMENT_LABEL, MUSCLE_LABEL, PATTERN_LABEL } from '../../data/exercises';
import { Icon, Sheet } from './ui';

export function ExerciseInfo({ ex }: { ex: Exercise }) {
  return (
    <div className="space-y-4 text-sm leading-relaxed">
      <div className="flex flex-wrap gap-2 text-xs">
        <span className="rounded-full bg-accent/15 text-accent px-2.5 py-1">{MUSCLE_LABEL[ex.primary]}</span>
        {ex.secondary.map((m) => (
          <span key={m} className="rounded-full bg-surface2 px-2.5 py-1 text-muted">
            {MUSCLE_LABEL[m]}
          </span>
        ))}
        <span className="rounded-full bg-surface2 px-2.5 py-1 text-muted">{PATTERN_LABEL[ex.pattern]}</span>
        <span className="rounded-full bg-surface2 px-2.5 py-1 text-muted">Nível {ex.difficulty}</span>
      </div>
      <div className="text-muted">Equipamento: {ex.equipment.map((e) => EQUIPMENT_LABEL[e]).join(', ')}</div>
      <div>
        <h4 className="font-semibold mb-1">Como executar</h4>
        <ol className="list-decimal pl-5 space-y-1">
          {ex.instructions.map((i) => (
            <li key={i}>{i}</li>
          ))}
        </ol>
      </div>
      <div>
        <h4 className="font-semibold mb-1">Erros comuns</h4>
        <ul className="list-disc pl-5 space-y-1 text-muted">
          {ex.commonMistakes.map((i) => (
            <li key={i}>{i}</li>
          ))}
        </ul>
      </div>
      {ex.cautions.length > 0 && (
        <div className="rounded-2xl bg-warn/10 text-warn p-3">
          {ex.cautions.map((c) => (
            <p key={c}>{c}</p>
          ))}
        </div>
      )}
      <p className="text-xs text-muted">Use amplitude completa e confortável, com controle. Pare se sentir dor aguda.</p>
    </div>
  );
}

export function ExerciseSheet({ ex, onClose }: { ex: Exercise | null; onClose: () => void }) {
  return (
    <Sheet open={!!ex} onClose={onClose} title={ex?.name}>
      {ex && <ExerciseInfo ex={ex} />}
    </Sheet>
  );
}

export function SwapSheet({
  open,
  current,
  options,
  onPick,
  onClose,
  title = 'Trocar exercício'
}: {
  open: boolean;
  current?: Exercise;
  options: Exercise[];
  onPick: (ex: Exercise) => void;
  onClose: () => void;
  title?: string;
}) {
  return (
    <Sheet open={open} onClose={onClose} title={title}>
      {current && <p className="text-sm text-muted mb-3">Equivalentes a {current.name}, compatíveis com seus equipamentos e restrições:</p>}
      {options.length === 0 && <p className="text-sm text-muted">Nenhum equivalente disponível com suas configurações atuais.</p>}
      <div className="space-y-2">
        {options.map((o) => (
          <button key={o.id} onClick={() => onPick(o)} className="w-full text-left rounded-2xl bg-surface2 p-3 flex items-center justify-between active:bg-line">
            <span>
              <span className="block font-medium">{o.name}</span>
              <span className="block text-xs text-muted">
                {MUSCLE_LABEL[o.primary]} · {o.equipment.map((e) => EQUIPMENT_LABEL[e]).join(', ')}
              </span>
            </span>
            <Icon name="chevron" className="h-4 w-4 text-muted" />
          </button>
        ))}
      </div>
    </Sheet>
  );
}
