import type { Exercise, MovementPattern } from '../../domain/types';
import { EQUIPMENT_LABEL, MUSCLE_LABEL, PATTERN_LABEL } from '../../data/exercises';
import { ExerciseDemo, MuscleMap } from '../figure/Demo';
import { MUSCLE_INFO } from '../figure/muscles';
import { Icon, Sheet } from './ui';

/** Respiração e sensação esperada por padrão de movimento. */
const PATTERN_TIPS: Record<MovementPattern, { breath: string; feel: string }> = {
  agachamento: { breath: 'Inspire antes de descer, solte o ar ao subir.', feel: 'Coxas e glúteos; o joelho acompanha a direção dos pés.' },
  dobradica: { breath: 'Inspire e firme o abdômen antes de inclinar; solte ao subir.', feel: 'Alongamento atrás das coxas e glúteos, não na lombar.' },
  unilateral_pernas: { breath: 'Inspire ao descer, solte ao subir.', feel: 'Coxa e glúteo da perna da frente.' },
  extensao_quadril: { breath: 'Solte o ar ao subir o quadril.', feel: 'Contração dos glúteos no topo, sem arquear a lombar.' },
  flexao_joelho: { breath: 'Solte o ar ao flexionar o joelho.', feel: 'Parte de trás da coxa.' },
  extensao_joelho: { breath: 'Solte o ar ao estender.', feel: 'Frente da coxa.' },
  panturrilha: { breath: 'Respiração contínua e ritmada.', feel: 'Batata da perna, com pausa no topo.' },
  empurrar_horizontal: { breath: 'Inspire ao descer o peso, solte ao empurrar.', feel: 'Peito e parte de trás do braço; ombros estáveis.' },
  empurrar_vertical: { breath: 'Inspire embaixo, solte ao empurrar para cima.', feel: 'Ombros e tríceps, com abdômen firme.' },
  puxar_horizontal: { breath: 'Solte o ar ao puxar, inspire ao voltar.', feel: 'Meio das costas, aproximando as escápulas.' },
  puxar_vertical: { breath: 'Solte o ar ao puxar para baixo.', feel: 'Laterais das costas (dorsais), não só os braços.' },
  crucifixo: { breath: 'Inspire ao abrir, solte ao fechar.', feel: 'Peito alongando e contraindo; cotovelos levemente dobrados.' },
  elevacao_lateral: { breath: 'Solte o ar ao elevar.', feel: 'Lateral do ombro, sem encolher o pescoço.' },
  deltoide_posterior: { breath: 'Solte o ar ao abrir os braços.', feel: 'Parte de trás do ombro e entre as escápulas.' },
  flexao_cotovelo: { breath: 'Solte o ar ao subir o peso.', feel: 'Frente do braço; cotovelos parados ao lado do corpo.' },
  extensao_cotovelo: { breath: 'Solte o ar ao estender o cotovelo.', feel: 'Parte de trás do braço.' },
  core_antiextensao: { breath: 'Respire curto e contínuo, sem prender o ar.', feel: 'Abdômen trabalhando para a lombar não afundar.' },
  core_flexao: { breath: 'Solte o ar ao contrair.', feel: 'Abdômen; o pescoço fica relaxado.' },
  core_antirrotacao: { breath: 'Respiração contínua.', feel: 'Laterais do abdômen resistindo à rotação.' }
};

export function ExerciseInfo({ ex }: { ex: Exercise }) {
  return (
    <div className="space-y-4 text-sm leading-relaxed">
      <ExerciseDemo ex={ex} />
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
      <div className="rounded-2xl bg-surface2 p-3">
        <h4 className="font-semibold mb-2">Músculos trabalhados</h4>
        <MuscleMap ex={ex} />
        <p className="mt-2">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-accent mr-1.5" />
          <b>Principal — {MUSCLE_LABEL[ex.primary]}:</b> {MUSCLE_INFO[ex.primary]}
        </p>
        {ex.secondary.length > 0 && (
          <p className="mt-1.5 text-muted">
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-accent/45 mr-1.5" />
            <b>Auxiliares:</b> {ex.secondary.map((m) => MUSCLE_LABEL[m]).join(', ')}.
          </p>
        )}
      </div>
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
      <div className="grid grid-cols-1 gap-2">
        <p><b>Respiração:</b> {PATTERN_TIPS[ex.pattern].breath}</p>
        <p><b>Onde sentir:</b> {PATTERN_TIPS[ex.pattern].feel}</p>
      </div>
      {ex.cautions.length > 0 && (
        <div className="rounded-2xl bg-warn/10 text-warn p-3">
          {ex.cautions.map((c) => (
            <p key={c}>{c}</p>
          ))}
        </div>
      )}
      <p className="text-xs text-muted">Use amplitude completa e confortável, com controle. Pare se sentir dor aguda.</p>
      <a
        href={`https://www.youtube.com/results?search_query=${encodeURIComponent(`${ex.name} execução correta`)}`}
        target="_blank"
        rel="noreferrer"
        className="flex items-center justify-center gap-2 h-11 rounded-2xl bg-surface2 text-sm"
      >
        <Icon name="play" className="h-4 w-4" /> Ver vídeos no YouTube
      </a>
      <p className="text-[11px] text-muted -mt-2">
        A demonstração acima é uma ilustração original do FORJA e funciona offline. O botão do YouTube abre vídeos de terceiros (requer internet); confira se o conteúdo é de um profissional qualificado.
      </p>
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
