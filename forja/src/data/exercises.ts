import type {
  BodyRegion,
  Equipment,
  Exercise,
  ExerciseKind,
  LoadType,
  MovementPattern,
  MuscleGroup
} from '../domain/types';

/**
 * Biblioteca local de exercícios.
 *
 * Nomes e instruções seguem a nomenclatura usual em academias brasileiras e a
 * descrição técnica de bibliotecas profissionais (ex.: ACE Exercise Library).
 * Nenhuma imagem/vídeo de terceiros é embarcada: não há licença verificada.
 * Alternativas equivalentes são calculadas automaticamente pelo mesmo padrão
 * de movimento (veja `alternativesFor`), além das listadas manualmente.
 */

interface Def {
  id: string;
  name: string;
  primary: MuscleGroup;
  secondary?: MuscleGroup[];
  pattern: MovementPattern;
  equipment: Equipment[];
  difficulty: 1 | 2 | 3;
  kind: ExerciseKind;
  loadType?: LoadType;
  inc?: number;
  stress?: BodyRegion[];
  how: string[];
  mistakes: string[];
  cautions?: string[];
  alt?: string[];
}

const D: Def[] = [
  // ───────────── PEITO ─────────────
  {
    id: 'supino_reto_barra', name: 'Supino reto com barra', primary: 'peito', secondary: ['triceps', 'ombros'],
    pattern: 'empurrar_horizontal', equipment: ['barra', 'anilhas', 'banco'], difficulty: 2, kind: 'composto', inc: 2.5,
    stress: ['ombro', 'cotovelo', 'punho'],
    how: ['Deite com olhos sob a barra e pés firmes no chão.', 'Pegada um pouco mais aberta que os ombros, escápulas aproximadas.', 'Desça controlando até tocar levemente a parte baixa do peito.', 'Empurre a barra para cima e levemente para trás, sem tirar o quadril do banco.'],
    mistakes: ['Quicar a barra no peito.', 'Cotovelos totalmente abertos a 90° do tronco.', 'Tirar o quadril do banco.'],
    cautions: ['Use apoios de segurança ou um parceiro ao usar cargas próximas do limite.']
  },
  {
    id: 'supino_reto_halteres', name: 'Supino reto com halteres', primary: 'peito', secondary: ['triceps', 'ombros'],
    pattern: 'empurrar_horizontal', equipment: ['halteres', 'banco'], difficulty: 1, kind: 'composto', inc: 2,
    stress: ['ombro', 'cotovelo'],
    how: ['Sente com os halteres sobre as coxas e deite levando-os junto ao peito.', 'Mantenha os punhos alinhados acima dos cotovelos.', 'Desça até sentir alongamento confortável no peito.', 'Empurre os halteres para cima, aproximando-os sem bater.'],
    mistakes: ['Descer além da amplitude confortável do ombro.', 'Deixar os punhos dobrarem para trás.'],
    cautions: ['Registre a carga de cada halter.']
  },
  {
    id: 'supino_inclinado_halteres', name: 'Supino inclinado com halteres', primary: 'peito', secondary: ['ombros', 'triceps'],
    pattern: 'empurrar_horizontal', equipment: ['halteres', 'banco'], difficulty: 1, kind: 'composto', inc: 2,
    stress: ['ombro', 'cotovelo'],
    how: ['Ajuste o banco entre 30° e 45°.', 'Halteres na altura do peito alto, cotovelos levemente abaixo dos ombros.', 'Empurre para cima e desça com controle.'],
    mistakes: ['Inclinação excessiva, transformando em desenvolvimento.', 'Arquear demais a lombar.']
  },
  {
    id: 'supino_inclinado_barra', name: 'Supino inclinado com barra', primary: 'peito', secondary: ['ombros', 'triceps'],
    pattern: 'empurrar_horizontal', equipment: ['barra', 'anilhas', 'banco'], difficulty: 2, kind: 'composto', inc: 2.5,
    stress: ['ombro', 'punho'],
    how: ['Banco inclinado a 30°–45°, escápulas aproximadas.', 'Desça a barra até a parte alta do peito.', 'Empurre mantendo os pés firmes.'],
    mistakes: ['Descer a barra no pescoço.', 'Perder o controle na descida.']
  },
  {
    id: 'supino_maquina', name: 'Supino sentado na máquina', primary: 'peito', secondary: ['triceps', 'ombros'],
    pattern: 'empurrar_horizontal', equipment: ['maquinas'], difficulty: 1, kind: 'composto', inc: 5,
    stress: ['ombro'],
    how: ['Ajuste o banco para as pegadas ficarem na altura do meio do peito.', 'Costas apoiadas, escápulas levemente aproximadas.', 'Empurre até quase estender os cotovelos e volte com controle.'],
    mistakes: ['Banco alto ou baixo demais.', 'Soltar o peso na volta.']
  },
  {
    id: 'flexao_bracos', name: 'Flexão de braços', primary: 'peito', secondary: ['triceps', 'ombros', 'core'],
    pattern: 'empurrar_horizontal', equipment: ['peso_corporal'], difficulty: 1, kind: 'composto', loadType: 'peso_corporal', inc: 0,
    stress: ['ombro', 'punho'],
    how: ['Mãos um pouco mais afastadas que os ombros.', 'Corpo alinhado da cabeça aos calcanhares, abdômen firme.', 'Desça o peito próximo ao chão e empurre de volta.'],
    mistakes: ['Quadril caindo ou empinado.', 'Amplitude muito curta.'],
    cautions: ['Se estiver difícil, use a flexão inclinada.']
  },
  {
    id: 'flexao_inclinada', name: 'Flexão de braços inclinada (mãos no banco)', primary: 'peito', secondary: ['triceps', 'ombros'],
    pattern: 'empurrar_horizontal', equipment: ['banco'], difficulty: 1, kind: 'composto', loadType: 'peso_corporal', inc: 0,
    stress: ['punho'],
    how: ['Apoie as mãos em um banco firme.', 'Corpo reto, desça o peito até a borda do banco.', 'Empurre até estender os braços.'],
    mistakes: ['Banco instável.', 'Quadril fora do alinhamento.']
  },
  {
    id: 'crucifixo_halteres', name: 'Crucifixo com halteres', primary: 'peito', secondary: ['ombros'],
    pattern: 'crucifixo', equipment: ['halteres', 'banco'], difficulty: 1, kind: 'isolado', inc: 2,
    stress: ['ombro'],
    how: ['Deitado, halteres acima do peito com cotovelos levemente flexionados.', 'Abra os braços em arco até sentir alongamento confortável.', 'Volte ao topo "abraçando" o ar.'],
    mistakes: ['Estender completamente os cotovelos.', 'Descer além da amplitude confortável.']
  },
  {
    id: 'crucifixo_maquina', name: 'Voador (peck deck)', primary: 'peito', secondary: ['ombros'],
    pattern: 'crucifixo', equipment: ['maquinas'], difficulty: 1, kind: 'isolado', inc: 5,
    stress: ['ombro'],
    how: ['Ajuste o assento para as manoplas ficarem na altura do peito.', 'Feche os braços à frente sem bater as pegadas.', 'Retorne devagar até leve alongamento.'],
    mistakes: ['Projetar os ombros para frente.', 'Usar impulso.']
  },
  {
    id: 'crossover_polia', name: 'Crucifixo na polia (crossover)', primary: 'peito', secondary: ['ombros'],
    pattern: 'crucifixo', equipment: ['polia'], difficulty: 2, kind: 'isolado', inc: 2.5,
    stress: ['ombro'],
    how: ['Polias na altura dos ombros ou acima, um passo à frente.', 'Cotovelos levemente flexionados, traga as mãos à frente do peito.', 'Volte controlando.'],
    mistakes: ['Transformar em empurrar com flexão de cotovelo.', 'Inclinar demais o tronco.']
  },
  {
    id: 'mergulho_paralelas', name: 'Mergulho nas paralelas', primary: 'peito', secondary: ['triceps', 'ombros'],
    pattern: 'empurrar_horizontal', equipment: ['paralelas'], difficulty: 3, kind: 'composto', loadType: 'peso_corporal', inc: 0,
    stress: ['ombro', 'cotovelo'],
    how: ['Braços estendidos sobre as barras, tronco levemente inclinado à frente.', 'Desça até os ombros ficarem próximos da altura dos cotovelos.', 'Empurre de volta sem travar bruscamente.'],
    mistakes: ['Descer além do confortável para o ombro.', 'Balançar as pernas.'],
    cautions: ['Evite em caso de desconforto no ombro.']
  },

  // ───────────── COSTAS ─────────────
  {
    id: 'puxada_frente', name: 'Puxada frontal na polia alta', primary: 'costas', secondary: ['biceps', 'ombros'],
    pattern: 'puxar_vertical', equipment: ['polia'], difficulty: 1, kind: 'composto', inc: 5,
    stress: ['ombro'],
    how: ['Ajuste o apoio das coxas e segure a barra um pouco além dos ombros.', 'Peito aberto, puxe a barra até a parte alta do peito.', 'Suba controlando até alongar as costas.'],
    mistakes: ['Puxar atrás da nuca.', 'Jogar o tronco para trás para ganhar impulso.']
  },
  {
    id: 'barra_fixa', name: 'Barra fixa pronada', primary: 'costas', secondary: ['biceps', 'core'],
    pattern: 'puxar_vertical', equipment: ['barra_fixa'], difficulty: 3, kind: 'composto', loadType: 'peso_corporal', inc: 0,
    stress: ['ombro', 'cotovelo'],
    how: ['Pegada pronada um pouco mais aberta que os ombros.', 'Puxe levando o peito em direção à barra.', 'Desça até quase estender os braços.'],
    mistakes: ['Balançar o corpo (kipping).', 'Meia repetição na parte de baixo.'],
    cautions: ['Iniciantes: prefira a puxada na polia ou barra assistida com elástico.']
  },
  {
    id: 'barra_fixa_supinada', name: 'Barra fixa supinada', primary: 'costas', secondary: ['biceps'],
    pattern: 'puxar_vertical', equipment: ['barra_fixa'], difficulty: 3, kind: 'composto', loadType: 'peso_corporal', inc: 0,
    stress: ['cotovelo', 'ombro'],
    how: ['Pegada supinada na largura dos ombros.', 'Puxe até o queixo passar a barra.', 'Desça controlando.'],
    mistakes: ['Usar impulso das pernas.', 'Encolher os ombros nas orelhas.']
  },
  {
    id: 'puxada_elastico', name: 'Puxada alta com elástico', primary: 'costas', secondary: ['biceps'],
    pattern: 'puxar_vertical', equipment: ['elastico'], difficulty: 1, kind: 'composto', loadType: 'peso_corporal', inc: 0,
    stress: ['ombro'],
    how: ['Prenda o elástico em ponto alto e firme.', 'Ajoelhado ou sentado, puxe os cotovelos para baixo e para trás.', 'Volte devagar.'],
    mistakes: ['Ancoragem instável.', 'Puxar só com os braços.'],
    cautions: ['Verifique se o elástico não tem rachaduras.']
  },
  {
    id: 'pulldown_bracos_estendidos', name: 'Pulldown com braços estendidos na polia', primary: 'costas', secondary: ['triceps', 'core'],
    pattern: 'puxar_vertical', equipment: ['polia'], difficulty: 2, kind: 'isolado', inc: 2.5,
    stress: ['ombro'],
    how: ['Em pé de frente para a polia alta, braços quase estendidos.', 'Leve a barra até as coxas usando as costas.', 'Volte controlando.'],
    mistakes: ['Dobrar os cotovelos e transformar em tríceps.', 'Arquear a lombar.']
  },
  {
    id: 'remada_baixa_polia', name: 'Remada sentada na polia baixa', primary: 'costas', secondary: ['biceps', 'ombros'],
    pattern: 'puxar_horizontal', equipment: ['polia'], difficulty: 1, kind: 'composto', inc: 5,
    stress: ['lombar'],
    how: ['Sente com joelhos levemente flexionados e tronco ereto.', 'Puxe o triângulo até o abdômen, aproximando as escápulas.', 'Retorne estendendo os braços sem curvar a coluna.'],
    mistakes: ['Balançar o tronco para frente e para trás.', 'Encolher os ombros.']
  },
  {
    id: 'remada_curvada_barra', name: 'Remada curvada com barra', primary: 'costas', secondary: ['biceps', 'posterior', 'core'],
    pattern: 'puxar_horizontal', equipment: ['barra', 'anilhas'], difficulty: 2, kind: 'composto', inc: 2.5,
    stress: ['lombar'],
    how: ['Incline o tronco à frente com coluna neutra e joelhos semiflexionados.', 'Puxe a barra em direção ao umbigo.', 'Desça controlando sem perder a posição.'],
    mistakes: ['Arredondar a coluna.', 'Subir o tronco a cada repetição.'],
    cautions: ['Evite se houver dor lombar; prefira remada apoiada.']
  },
  {
    id: 'remada_unilateral_halter', name: 'Remada unilateral com halter (serrote)', primary: 'costas', secondary: ['biceps'],
    pattern: 'puxar_horizontal', equipment: ['halteres', 'banco'], difficulty: 1, kind: 'composto', inc: 2,
    how: ['Apoie mão e joelho no banco, coluna neutra.', 'Puxe o halter em direção ao quadril.', 'Desça até alongar as costas.'],
    mistakes: ['Girar o tronco para subir o peso.', 'Puxar com o bíceps em direção ao ombro.']
  },
  {
    id: 'remada_maquina', name: 'Remada sentada na máquina', primary: 'costas', secondary: ['biceps'],
    pattern: 'puxar_horizontal', equipment: ['maquinas'], difficulty: 1, kind: 'composto', inc: 5,
    how: ['Peito apoiado e pegadas ao alcance com braços estendidos.', 'Puxe os cotovelos para trás aproximando as escápulas.', 'Volte devagar.'],
    mistakes: ['Afastar o peito do apoio.', 'Amplitude curta.']
  },
  {
    id: 'remada_elastico', name: 'Remada sentada com elástico', primary: 'costas', secondary: ['biceps'],
    pattern: 'puxar_horizontal', equipment: ['elastico'], difficulty: 1, kind: 'composto', loadType: 'peso_corporal', inc: 0,
    how: ['Sentado, elástico passando pela sola dos pés.', 'Tronco ereto, puxe as mãos até o abdômen.', 'Volte controlando.'],
    mistakes: ['Curvar a coluna.', 'Soltar o elástico de uma vez.']
  },
  {
    id: 'remada_invertida', name: 'Remada invertida na barra do Smith', primary: 'costas', secondary: ['biceps', 'core'],
    pattern: 'puxar_horizontal', equipment: ['smith'], difficulty: 2, kind: 'composto', loadType: 'peso_corporal', inc: 0,
    how: ['Barra do Smith travada na altura da cintura.', 'Pendure-se com corpo reto e calcanhares no chão.', 'Puxe o peito até a barra e desça controlando.'],
    mistakes: ['Quadril caindo.', 'Barra destravada.'],
    cautions: ['Quanto mais vertical o corpo, mais fácil.']
  },

  // ───────────── OMBROS ─────────────
  {
    id: 'desenvolvimento_halteres', name: 'Desenvolvimento com halteres sentado', primary: 'ombros', secondary: ['triceps'],
    pattern: 'empurrar_vertical', equipment: ['halteres', 'banco'], difficulty: 1, kind: 'composto', inc: 2,
    stress: ['ombro', 'lombar'],
    how: ['Banco quase vertical, halteres na altura das orelhas.', 'Empurre para cima sem bater os halteres.', 'Desça até a altura das orelhas.'],
    mistakes: ['Arquear excessivamente a lombar.', 'Descer pouco.'],
    cautions: ['Reduza a amplitude se houver desconforto no ombro.']
  },
  {
    id: 'desenvolvimento_barra', name: 'Desenvolvimento militar com barra em pé', primary: 'ombros', secondary: ['triceps', 'core'],
    pattern: 'empurrar_vertical', equipment: ['barra', 'anilhas'], difficulty: 2, kind: 'composto', inc: 2.5,
    stress: ['ombro', 'lombar'],
    how: ['Barra apoiada na frente dos ombros, glúteos e abdômen contraídos.', 'Empurre a barra em linha reta acima da cabeça.', 'Desça controlando até a clavícula.'],
    mistakes: ['Inclinar o tronco para trás.', 'Travar os joelhos em hiperextensão.']
  },
  {
    id: 'desenvolvimento_maquina', name: 'Desenvolvimento na máquina', primary: 'ombros', secondary: ['triceps'],
    pattern: 'empurrar_vertical', equipment: ['maquinas'], difficulty: 1, kind: 'composto', inc: 5,
    stress: ['ombro'],
    how: ['Ajuste o banco para as pegadas ficarem na altura dos ombros.', 'Empurre para cima sem travar os cotovelos.', 'Volte devagar.'],
    mistakes: ['Banco baixo demais.', 'Afastar as costas do apoio.']
  },
  {
    id: 'desenvolvimento_elastico', name: 'Desenvolvimento com elástico', primary: 'ombros', secondary: ['triceps'],
    pattern: 'empurrar_vertical', equipment: ['elastico'], difficulty: 1, kind: 'composto', loadType: 'peso_corporal', inc: 0,
    stress: ['ombro'],
    how: ['Pise no elástico e segure-o na altura dos ombros.', 'Empurre para cima com abdômen firme.', 'Desça devagar.'],
    mistakes: ['Arquear a lombar.', 'Elástico curto demais.']
  },
  {
    id: 'pike_pushup', name: 'Flexão pike', primary: 'ombros', secondary: ['triceps'],
    pattern: 'empurrar_vertical', equipment: ['peso_corporal'], difficulty: 2, kind: 'composto', loadType: 'peso_corporal', inc: 0,
    stress: ['ombro', 'punho'],
    how: ['Forme um "V" invertido com quadril elevado.', 'Flexione os cotovelos levando a cabeça em direção ao chão.', 'Empurre de volta.'],
    mistakes: ['Cotovelos muito abertos.', 'Descer sem controle.']
  },
  {
    id: 'elevacao_lateral_halteres', name: 'Elevação lateral com halteres', primary: 'ombros',
    pattern: 'elevacao_lateral', equipment: ['halteres'], difficulty: 1, kind: 'isolado', inc: 1,
    stress: ['ombro'],
    how: ['Em pé, halteres ao lado do corpo, cotovelos levemente flexionados.', 'Eleve os braços lateralmente até a altura dos ombros.', 'Desça controlando.'],
    mistakes: ['Usar impulso do tronco.', 'Subir acima da linha dos ombros com carga alta.']
  },
  {
    id: 'elevacao_lateral_polia', name: 'Elevação lateral na polia', primary: 'ombros',
    pattern: 'elevacao_lateral', equipment: ['polia'], difficulty: 2, kind: 'isolado', inc: 2.5,
    stress: ['ombro'],
    how: ['Polia baixa, cabo passando à frente do corpo.', 'Eleve o braço lateralmente até a altura do ombro.', 'Volte devagar.'],
    mistakes: ['Inclinar o tronco para longe da polia em excesso.']
  },
  {
    id: 'elevacao_lateral_elastico', name: 'Elevação lateral com elástico', primary: 'ombros',
    pattern: 'elevacao_lateral', equipment: ['elastico'], difficulty: 1, kind: 'isolado', loadType: 'peso_corporal', inc: 0,
    stress: ['ombro'],
    how: ['Pise no elástico e segure as pontas.', 'Eleve os braços até a altura dos ombros.', 'Desça controlando.'],
    mistakes: ['Encolher os ombros.']
  },
  {
    id: 'crucifixo_inverso_halteres', name: 'Crucifixo inverso com halteres', primary: 'ombros', secondary: ['costas'],
    pattern: 'deltoide_posterior', equipment: ['halteres'], difficulty: 1, kind: 'isolado', inc: 1,
    stress: ['lombar'],
    how: ['Tronco inclinado à frente com coluna neutra (ou peito apoiado no banco inclinado).', 'Abra os braços lateralmente até a linha do corpo.', 'Desça controlando.'],
    mistakes: ['Arredondar a coluna.', 'Usar carga excessiva.']
  },
  {
    id: 'face_pull', name: 'Face pull na polia', primary: 'ombros', secondary: ['costas'],
    pattern: 'deltoide_posterior', equipment: ['polia'], difficulty: 1, kind: 'isolado', inc: 2.5,
    how: ['Corda na polia alta, na altura do rosto.', 'Puxe a corda em direção à testa, abrindo os cotovelos.', 'Volte controlando.'],
    mistakes: ['Puxar com o tronco.', 'Cotovelos abaixo da linha das mãos.']
  },
  {
    id: 'crucifixo_inverso_maquina', name: 'Crucifixo inverso na máquina', primary: 'ombros', secondary: ['costas'],
    pattern: 'deltoide_posterior', equipment: ['maquinas'], difficulty: 1, kind: 'isolado', inc: 5,
    how: ['Sente de frente para o encosto do voador.', 'Abra os braços para trás até a linha do corpo.', 'Retorne devagar.'],
    mistakes: ['Encolher os ombros.']
  },

  // ───────────── QUADRÍCEPS ─────────────
  {
    id: 'agachamento_goblet', name: 'Agachamento goblet', primary: 'quadriceps', secondary: ['gluteos', 'core'],
    pattern: 'agachamento', equipment: ['halteres'], difficulty: 1, kind: 'composto', inc: 2,
    stress: ['joelho', 'quadril'],
    how: ['Segure um halter junto ao peito, pés na largura dos ombros.', 'Desça sentando entre os calcanhares, tronco ereto.', 'Suba empurrando o chão.'],
    mistakes: ['Joelhos colapsando para dentro.', 'Calcanhares saindo do chão.'],
    alt: ['leg_press', 'agachamento_smith']
  },
  {
    id: 'agachamento_livre', name: 'Agachamento livre com barra', primary: 'quadriceps', secondary: ['gluteos', 'posterior', 'core'],
    pattern: 'agachamento', equipment: ['barra', 'anilhas'], difficulty: 2, kind: 'composto', inc: 2.5,
    stress: ['joelho', 'lombar', 'quadril'],
    how: ['Barra apoiada no trapézio, pés na largura dos ombros.', 'Desça mantendo coluna neutra e joelhos na direção dos pés.', 'Suba mantendo o tronco firme.'],
    mistakes: ['Arredondar a lombar no fundo.', 'Joelhos para dentro.'],
    cautions: ['Use o rack com travas de segurança.']
  },
  {
    id: 'agachamento_smith', name: 'Agachamento no Smith', primary: 'quadriceps', secondary: ['gluteos'],
    pattern: 'agachamento', equipment: ['smith'], difficulty: 1, kind: 'composto', inc: 2.5,
    stress: ['joelho', 'lombar'],
    how: ['Barra no trapézio, pés ligeiramente à frente da linha da barra.', 'Desça até onde mantiver a coluna neutra.', 'Suba sem travar os joelhos.'],
    mistakes: ['Pés muito atrás.', 'Esquecer de travar a barra ao final.']
  },
  {
    id: 'leg_press', name: 'Leg press 45°', primary: 'quadriceps', secondary: ['gluteos', 'posterior'],
    pattern: 'agachamento', equipment: ['maquinas'], difficulty: 1, kind: 'composto', inc: 10,
    stress: ['joelho', 'lombar'],
    how: ['Costas e quadril apoiados, pés na largura do quadril.', 'Destrave e desça controlando até onde o quadril não sair do encosto.', 'Empurre sem travar os joelhos.'],
    mistakes: ['Tirar o quadril do encosto no fundo.', 'Travar os joelhos.']
  },
  {
    id: 'agachamento_hack', name: 'Agachamento hack na máquina', primary: 'quadriceps', secondary: ['gluteos'],
    pattern: 'agachamento', equipment: ['maquinas'], difficulty: 2, kind: 'composto', inc: 5,
    stress: ['joelho'],
    how: ['Costas no encosto, ombros sob as almofadas.', 'Desça controlando com joelhos alinhados aos pés.', 'Suba empurrando com o pé inteiro.'],
    mistakes: ['Calcanhares saindo da plataforma.']
  },
  {
    id: 'agachamento_peso_corporal', name: 'Agachamento com peso corporal', primary: 'quadriceps', secondary: ['gluteos'],
    pattern: 'agachamento', equipment: ['peso_corporal'], difficulty: 1, kind: 'composto', loadType: 'peso_corporal', inc: 0,
    stress: ['joelho'],
    how: ['Pés na largura dos ombros, braços à frente.', 'Desça como se fosse sentar em uma cadeira.', 'Suba empurrando o chão.'],
    mistakes: ['Joelhos para dentro.', 'Amplitude muito curta.'],
    cautions: ['Use uma cadeira atrás como referência de profundidade, se necessário.']
  },
  {
    id: 'cadeira_extensora', name: 'Cadeira extensora', primary: 'quadriceps',
    pattern: 'extensao_joelho', equipment: ['maquinas'], difficulty: 1, kind: 'isolado', inc: 5,
    stress: ['joelho'],
    how: ['Joelho alinhado ao eixo da máquina, rolo acima do tornozelo.', 'Estenda os joelhos sem tirar o quadril do banco.', 'Desça controlando.'],
    mistakes: ['Soltar o peso na descida.', 'Eixo desalinhado.']
  },
  {
    id: 'afundo_halteres', name: 'Afundo com halteres', primary: 'quadriceps', secondary: ['gluteos', 'posterior'],
    pattern: 'unilateral_pernas', equipment: ['halteres'], difficulty: 2, kind: 'composto', inc: 2,
    stress: ['joelho', 'quadril'],
    how: ['Dê um passo à frente com tronco ereto.', 'Desça até o joelho de trás se aproximar do chão.', 'Empurre com a perna da frente para voltar.'],
    mistakes: ['Passo curto demais.', 'Joelho da frente colapsando para dentro.'],
    cautions: ['Repetições contadas por perna.']
  },
  {
    id: 'afundo_peso_corporal', name: 'Afundo recuado com peso corporal', primary: 'quadriceps', secondary: ['gluteos'],
    pattern: 'unilateral_pernas', equipment: ['peso_corporal'], difficulty: 1, kind: 'composto', loadType: 'peso_corporal', inc: 0,
    stress: ['joelho'],
    how: ['Dê um passo para trás e desça o joelho de trás.', 'Mantenha o peso na perna da frente.', 'Volte à posição inicial.'],
    mistakes: ['Perder o equilíbrio por base estreita.'],
    cautions: ['Apoie-se em uma parede se precisar.']
  },
  {
    id: 'agachamento_bulgaro', name: 'Agachamento búlgaro', primary: 'quadriceps', secondary: ['gluteos'],
    pattern: 'unilateral_pernas', equipment: ['halteres', 'banco'], difficulty: 2, kind: 'composto', inc: 2,
    stress: ['joelho', 'quadril'],
    how: ['Peito do pé de trás apoiado no banco.', 'Desça verticalmente com a perna da frente.', 'Suba empurrando o calcanhar da frente.'],
    mistakes: ['Pé da frente perto demais do banco.', 'Tronco instável.']
  },
  {
    id: 'subida_banco', name: 'Subida no banco (step-up)', primary: 'quadriceps', secondary: ['gluteos'],
    pattern: 'unilateral_pernas', equipment: ['halteres', 'banco'], difficulty: 1, kind: 'composto', inc: 2,
    stress: ['joelho'],
    how: ['Pé inteiro apoiado em um banco estável.', 'Suba usando a perna de cima, sem impulsionar com a de baixo.', 'Desça controlando.'],
    mistakes: ['Banco alto demais.', 'Impulso com a perna de trás.']
  },

  // ───────────── POSTERIOR DE COXA ─────────────
  {
    id: 'terra_romeno_barra', name: 'Levantamento terra romeno com barra', primary: 'posterior', secondary: ['gluteos', 'costas'],
    pattern: 'dobradica', equipment: ['barra', 'anilhas'], difficulty: 2, kind: 'composto', inc: 2.5,
    stress: ['lombar'],
    how: ['Em pé, barra nas mãos, joelhos levemente flexionados.', 'Leve o quadril para trás deslizando a barra rente às coxas.', 'Desça até sentir alongamento no posterior, mantendo a coluna neutra, e volte.'],
    mistakes: ['Arredondar a coluna.', 'Afastar a barra do corpo.'],
    cautions: ['Evite se houver dor lombar aguda.']
  },
  {
    id: 'terra_romeno_halteres', name: 'Levantamento terra romeno com halteres', primary: 'posterior', secondary: ['gluteos'],
    pattern: 'dobradica', equipment: ['halteres'], difficulty: 1, kind: 'composto', inc: 2,
    stress: ['lombar'],
    how: ['Halteres à frente das coxas, joelhos levemente flexionados.', 'Empurre o quadril para trás mantendo a coluna neutra.', 'Volte contraindo glúteos.'],
    mistakes: ['Transformar em agachamento.', 'Olhar para cima, hiperestendendo o pescoço.']
  },
  {
    id: 'terra_romeno_unilateral', name: 'Terra romeno unilateral com halter', primary: 'posterior', secondary: ['gluteos', 'core'],
    pattern: 'dobradica', equipment: ['halteres'], difficulty: 2, kind: 'composto', inc: 2,
    stress: ['lombar', 'tornozelo'],
    how: ['Apoiado em uma perna, halter na mão oposta.', 'Incline o tronco à frente enquanto a perna livre vai para trás.', 'Volte controlando.'],
    mistakes: ['Girar o quadril.', 'Perder o equilíbrio por pressa.']
  },
  {
    id: 'levantamento_terra', name: 'Levantamento terra convencional', primary: 'posterior', secondary: ['gluteos', 'costas', 'quadriceps'],
    pattern: 'dobradica', equipment: ['barra', 'anilhas'], difficulty: 3, kind: 'composto', inc: 5,
    stress: ['lombar', 'quadril'],
    how: ['Barra sobre o meio dos pés, pegada fora dos joelhos.', 'Coluna neutra, empurre o chão e estenda quadril e joelhos juntos.', 'Desça a barra pelo mesmo caminho.'],
    mistakes: ['Arredondar a coluna.', 'Barra longe das pernas.'],
    cautions: ['Recomendado após domínio do terra romeno, com orientação presencial.']
  },
  {
    id: 'kettlebell_swing', name: 'Swing com kettlebell', primary: 'posterior', secondary: ['gluteos', 'core'],
    pattern: 'dobradica', equipment: ['kettlebell'], difficulty: 2, kind: 'composto', inc: 4,
    stress: ['lombar'],
    how: ['Pés um pouco mais afastados que os ombros.', 'Leve o kettlebell entre as pernas com quadril para trás.', 'Estenda o quadril de forma explosiva; braços apenas guiam.'],
    mistakes: ['Agachar em vez de dobrar o quadril.', 'Levantar com os braços.']
  },
  {
    id: 'mesa_flexora', name: 'Mesa flexora', primary: 'posterior',
    pattern: 'flexao_joelho', equipment: ['maquinas'], difficulty: 1, kind: 'isolado', inc: 5,
    stress: ['joelho'],
    how: ['Deite de bruços com joelhos alinhados ao eixo.', 'Flexione os joelhos levando o rolo em direção aos glúteos.', 'Desça controlando.'],
    mistakes: ['Tirar o quadril do banco.', 'Amplitude curta.']
  },
  {
    id: 'cadeira_flexora', name: 'Cadeira flexora', primary: 'posterior',
    pattern: 'flexao_joelho', equipment: ['maquinas'], difficulty: 1, kind: 'isolado', inc: 5,
    stress: ['joelho'],
    how: ['Sente com joelhos alinhados ao eixo e trave as coxas.', 'Flexione os joelhos ao máximo confortável.', 'Volte controlando.'],
    mistakes: ['Soltar o peso na volta.']
  },
  {
    id: 'flexao_nordica', name: 'Flexão nórdica assistida', primary: 'posterior',
    pattern: 'flexao_joelho', equipment: ['peso_corporal'], difficulty: 3, kind: 'isolado', loadType: 'peso_corporal', inc: 0,
    stress: ['joelho'],
    how: ['Ajoelhado, tornozelos presos sob um apoio firme.', 'Incline o corpo à frente o mais devagar possível.', 'Amorteça com as mãos e volte com ajuda dos braços.'],
    mistakes: ['Dobrar o quadril.', 'Volume alto logo no início.'],
    cautions: ['Gera muita dor muscular tardia: comece com poucas repetições.']
  },

  // ───────────── GLÚTEOS ─────────────
  {
    id: 'elevacao_pelvica_barra', name: 'Elevação pélvica com barra', primary: 'gluteos', secondary: ['posterior'],
    pattern: 'extensao_quadril', equipment: ['barra', 'anilhas', 'banco'], difficulty: 2, kind: 'composto', inc: 5,
    stress: ['quadril', 'lombar'],
    how: ['Escápulas apoiadas no banco, barra sobre o quadril com proteção.', 'Eleve o quadril até alinhar tronco e coxas.', 'Desça controlando.'],
    mistakes: ['Hiperestender a lombar no topo.', 'Pés longe demais.']
  },
  {
    id: 'elevacao_pelvica_halter', name: 'Elevação pélvica com halter', primary: 'gluteos', secondary: ['posterior'],
    pattern: 'extensao_quadril', equipment: ['halteres', 'banco'], difficulty: 1, kind: 'composto', inc: 2,
    stress: ['quadril'],
    how: ['Escápulas no banco, halter sobre o quadril.', 'Eleve o quadril contraindo os glúteos.', 'Desça até quase tocar o chão.'],
    mistakes: ['Empurrar com a lombar em vez do quadril.']
  },
  {
    id: 'ponte_gluteo', name: 'Ponte de glúteo no solo', primary: 'gluteos', secondary: ['posterior', 'core'],
    pattern: 'extensao_quadril', equipment: ['peso_corporal'], difficulty: 1, kind: 'composto', loadType: 'peso_corporal', inc: 0,
    how: ['Deitado, joelhos flexionados e pés no chão.', 'Eleve o quadril até alinhar com joelhos e ombros.', 'Segure 1 segundo e desça.'],
    mistakes: ['Arquear a lombar.', 'Empurrar com a ponta dos pés.']
  },
  {
    id: 'ponte_unilateral', name: 'Ponte de glúteo unilateral', primary: 'gluteos', secondary: ['posterior', 'core'],
    pattern: 'extensao_quadril', equipment: ['peso_corporal'], difficulty: 2, kind: 'composto', loadType: 'peso_corporal', inc: 0,
    how: ['Como na ponte, mas com uma perna estendida.', 'Eleve o quadril sem deixá-lo girar.', 'Desça controlando.'],
    mistakes: ['Quadril inclinando para um lado.']
  },
  {
    id: 'coice_polia', name: 'Extensão de quadril na polia (coice)', primary: 'gluteos', secondary: ['posterior'],
    pattern: 'extensao_quadril', equipment: ['polia'], difficulty: 1, kind: 'isolado', inc: 2.5,
    stress: ['lombar'],
    how: ['Tornozeleira na polia baixa, apoie as mãos.', 'Leve a perna para trás estendendo o quadril.', 'Volte sem arquear a lombar.'],
    mistakes: ['Compensar com a lombar.', 'Balançar o corpo.']
  },

  // ───────────── PANTURRILHAS ─────────────
  {
    id: 'panturrilha_em_pe_maquina', name: 'Elevação de panturrilha em pé na máquina', primary: 'panturrilhas',
    pattern: 'panturrilha', equipment: ['maquinas'], difficulty: 1, kind: 'isolado', inc: 5,
    stress: ['tornozelo'],
    how: ['Ponta dos pés na plataforma, calcanhares livres.', 'Desça os calcanhares até alongar e suba o máximo possível.', 'Pause 1 segundo no topo.'],
    mistakes: ['Repetições rápidas e curtas.', 'Flexionar os joelhos para ajudar.']
  },
  {
    id: 'panturrilha_sentado', name: 'Panturrilha sentado na máquina', primary: 'panturrilhas',
    pattern: 'panturrilha', equipment: ['maquinas'], difficulty: 1, kind: 'isolado', inc: 5,
    stress: ['tornozelo'],
    how: ['Joelhos sob o apoio, ponta dos pés na plataforma.', 'Desça os calcanhares e suba ao máximo.', 'Controle a descida.'],
    mistakes: ['Amplitude curta.']
  },
  {
    id: 'panturrilha_leg_press', name: 'Panturrilha no leg press', primary: 'panturrilhas',
    pattern: 'panturrilha', equipment: ['maquinas'], difficulty: 1, kind: 'isolado', inc: 10,
    stress: ['tornozelo'],
    how: ['Ponta dos pés na borda inferior da plataforma, joelhos estendidos sem travar.', 'Empurre com a ponta dos pés.', 'Volte devagar.'],
    mistakes: ['Destravar a máquina com os pés mal posicionados.'],
    cautions: ['Mantenha as travas de segurança acessíveis.']
  },
  {
    id: 'panturrilha_halter', name: 'Elevação de panturrilha unilateral com halter', primary: 'panturrilhas',
    pattern: 'panturrilha', equipment: ['halteres'], difficulty: 1, kind: 'isolado', inc: 2,
    stress: ['tornozelo'],
    how: ['Ponta de um pé em um degrau, halter na mão do mesmo lado.', 'Apoie a outra mão para equilíbrio.', 'Desça e suba em amplitude completa.'],
    mistakes: ['Usar impulso.']
  },
  {
    id: 'panturrilha_peso_corporal', name: 'Elevação de panturrilha com peso corporal', primary: 'panturrilhas',
    pattern: 'panturrilha', equipment: ['peso_corporal'], difficulty: 1, kind: 'isolado', loadType: 'peso_corporal', inc: 0,
    stress: ['tornozelo'],
    how: ['Em pé em um degrau, calcanhares livres.', 'Suba na ponta dos pés e desça controlando.'],
    mistakes: ['Amplitude curta.']
  },

  // ───────────── BÍCEPS ─────────────
  {
    id: 'rosca_direta_barra', name: 'Rosca direta com barra', primary: 'biceps',
    pattern: 'flexao_cotovelo', equipment: ['barra', 'anilhas'], difficulty: 1, kind: 'isolado', inc: 2,
    stress: ['cotovelo', 'punho'],
    how: ['Em pé, pegada supinada na largura dos ombros.', 'Flexione os cotovelos mantendo-os junto ao corpo.', 'Desça controlando até estender.'],
    mistakes: ['Balançar o tronco.', 'Adiantar os cotovelos.']
  },
  {
    id: 'rosca_alternada', name: 'Rosca alternada com halteres', primary: 'biceps',
    pattern: 'flexao_cotovelo', equipment: ['halteres'], difficulty: 1, kind: 'isolado', inc: 1,
    stress: ['cotovelo'],
    how: ['Halteres ao lado do corpo.', 'Flexione um cotovelo de cada vez girando a palma para cima.', 'Desça controlando.'],
    mistakes: ['Impulso com o quadril.']
  },
  {
    id: 'rosca_martelo', name: 'Rosca martelo', primary: 'biceps',
    pattern: 'flexao_cotovelo', equipment: ['halteres'], difficulty: 1, kind: 'isolado', inc: 1,
    stress: ['cotovelo'],
    how: ['Pegada neutra (palmas voltadas para o corpo).', 'Flexione os cotovelos sem mover os ombros.', 'Desça controlando.'],
    mistakes: ['Cotovelos se afastando do tronco.']
  },
  {
    id: 'rosca_polia', name: 'Rosca na polia baixa', primary: 'biceps',
    pattern: 'flexao_cotovelo', equipment: ['polia'], difficulty: 1, kind: 'isolado', inc: 2.5,
    stress: ['cotovelo'],
    how: ['De frente para a polia baixa com barra reta ou W.', 'Flexione os cotovelos mantendo-os fixos.', 'Volte controlando.'],
    mistakes: ['Inclinar o corpo para trás.']
  },
  {
    id: 'rosca_scott_maquina', name: 'Rosca Scott na máquina', primary: 'biceps',
    pattern: 'flexao_cotovelo', equipment: ['maquinas'], difficulty: 1, kind: 'isolado', inc: 2.5,
    stress: ['cotovelo'],
    how: ['Axilas encostadas no apoio, braços sobre a almofada.', 'Flexione os cotovelos.', 'Desça até quase estender, sem soltar o peso.'],
    mistakes: ['Hiperestender os cotovelos na descida.']
  },
  {
    id: 'rosca_elastico', name: 'Rosca com elástico', primary: 'biceps',
    pattern: 'flexao_cotovelo', equipment: ['elastico'], difficulty: 1, kind: 'isolado', loadType: 'peso_corporal', inc: 0,
    how: ['Pise no elástico e segure as pontas com palmas para cima.', 'Flexione os cotovelos.', 'Desça devagar.'],
    mistakes: ['Soltar a tensão rapidamente.']
  },

  // ───────────── TRÍCEPS ─────────────
  {
    id: 'triceps_polia', name: 'Tríceps na polia (pushdown)', primary: 'triceps',
    pattern: 'extensao_cotovelo', equipment: ['polia'], difficulty: 1, kind: 'isolado', inc: 2.5,
    stress: ['cotovelo'],
    how: ['Barra ou corda na polia alta, cotovelos junto ao corpo.', 'Estenda os cotovelos até os braços ficarem retos.', 'Volte até cerca de 90°.'],
    mistakes: ['Cotovelos se movendo para frente.', 'Inclinar o tronco sobre a carga.']
  },
  {
    id: 'triceps_frances_halter', name: 'Tríceps francês com halter', primary: 'triceps',
    pattern: 'extensao_cotovelo', equipment: ['halteres'], difficulty: 1, kind: 'isolado', inc: 2,
    stress: ['cotovelo', 'ombro'],
    how: ['Sentado ou em pé, segure um halter com as duas mãos acima da cabeça.', 'Desça o halter atrás da cabeça flexionando os cotovelos.', 'Estenda de volta.'],
    mistakes: ['Cotovelos abrindo demais.', 'Arquear a lombar.']
  },
  {
    id: 'triceps_testa', name: 'Tríceps testa com barra', primary: 'triceps',
    pattern: 'extensao_cotovelo', equipment: ['barra', 'anilhas', 'banco'], difficulty: 2, kind: 'isolado', inc: 2,
    stress: ['cotovelo'],
    how: ['Deitado, barra acima do peito com braços estendidos.', 'Flexione os cotovelos levando a barra até próximo da testa.', 'Estenda de volta.'],
    mistakes: ['Mover os ombros junto.', 'Carga excessiva.']
  },
  {
    id: 'mergulho_banco', name: 'Mergulho no banco', primary: 'triceps', secondary: ['peito', 'ombros'],
    pattern: 'extensao_cotovelo', equipment: ['banco'], difficulty: 2, kind: 'composto', loadType: 'peso_corporal', inc: 0,
    stress: ['ombro', 'punho'],
    how: ['Mãos na borda do banco, pernas à frente.', 'Desça flexionando os cotovelos até cerca de 90°.', 'Empurre de volta.'],
    mistakes: ['Descer demais forçando o ombro.'],
    cautions: ['Evite em caso de desconforto no ombro.']
  },
  {
    id: 'triceps_elastico', name: 'Extensão de tríceps com elástico', primary: 'triceps',
    pattern: 'extensao_cotovelo', equipment: ['elastico'], difficulty: 1, kind: 'isolado', loadType: 'peso_corporal', inc: 0,
    how: ['Elástico preso em ponto alto.', 'Cotovelos junto ao corpo, estenda os braços para baixo.', 'Volte devagar.'],
    mistakes: ['Ancoragem instável.']
  },
  {
    id: 'flexao_fechada', name: 'Flexão de braços fechada', primary: 'triceps', secondary: ['peito', 'ombros'],
    pattern: 'extensao_cotovelo', equipment: ['peso_corporal'], difficulty: 2, kind: 'composto', loadType: 'peso_corporal', inc: 0,
    stress: ['punho', 'cotovelo'],
    how: ['Mãos na largura dos ombros ou um pouco menos.', 'Desça com cotovelos próximos ao corpo.', 'Empurre de volta.'],
    mistakes: ['Cotovelos abrindo.', 'Quadril caindo.']
  },

  // ───────────── ABDÔMEN / CORE ─────────────
  {
    id: 'prancha', name: 'Prancha frontal', primary: 'core', secondary: ['ombros'],
    pattern: 'core_antiextensao', equipment: ['peso_corporal'], difficulty: 1, kind: 'core', loadType: 'tempo', inc: 0,
    how: ['Antebraços no chão, cotovelos sob os ombros.', 'Corpo alinhado, glúteos e abdômen contraídos.', 'Respire normalmente durante o tempo.'],
    mistakes: ['Quadril caindo.', 'Prender a respiração.'],
    cautions: ['Registre a duração em segundos no campo de repetições.']
  },
  {
    id: 'prancha_lateral', name: 'Prancha lateral', primary: 'core',
    pattern: 'core_antirrotacao', equipment: ['peso_corporal'], difficulty: 1, kind: 'core', loadType: 'tempo', inc: 0,
    stress: ['ombro'],
    how: ['Apoie um antebraço com cotovelo sob o ombro.', 'Eleve o quadril alinhando o corpo.', 'Mantenha o tempo e troque de lado.'],
    mistakes: ['Quadril caindo para trás.'],
    cautions: ['Registre a duração por lado em segundos.']
  },
  {
    id: 'dead_bug', name: 'Dead bug', primary: 'core',
    pattern: 'core_antiextensao', equipment: ['peso_corporal'], difficulty: 1, kind: 'core', loadType: 'peso_corporal', inc: 0,
    how: ['Deitado, braços para cima e joelhos a 90°.', 'Estenda braço e perna opostos sem tirar a lombar do chão.', 'Volte e alterne.'],
    mistakes: ['Lombar descolando do chão.', 'Movimento rápido.']
  },
  {
    id: 'perdigueiro', name: 'Perdigueiro (bird dog)', primary: 'core', secondary: ['gluteos'],
    pattern: 'core_antirrotacao', equipment: ['peso_corporal'], difficulty: 1, kind: 'core', loadType: 'peso_corporal', inc: 0,
    how: ['Em quatro apoios, coluna neutra.', 'Estenda braço e perna opostos sem girar o quadril.', 'Volte e alterne.'],
    mistakes: ['Arquear a lombar ao elevar a perna.']
  },
  {
    id: 'pallof_polia', name: 'Pallof press na polia', primary: 'core',
    pattern: 'core_antirrotacao', equipment: ['polia'], difficulty: 1, kind: 'core', inc: 2.5,
    how: ['De lado para a polia na altura do peito.', 'Empurre as mãos à frente resistindo à rotação.', 'Volte as mãos ao peito.'],
    mistakes: ['Girar o tronco em direção à polia.']
  },
  {
    id: 'pallof_elastico', name: 'Pallof press com elástico', primary: 'core',
    pattern: 'core_antirrotacao', equipment: ['elastico'], difficulty: 1, kind: 'core', loadType: 'peso_corporal', inc: 0,
    how: ['Elástico preso na altura do peito, de lado para a ancoragem.', 'Estenda os braços à frente sem girar.', 'Volte devagar.'],
    mistakes: ['Pés juntos demais, perdendo estabilidade.']
  },
  {
    id: 'abdominal_supra', name: 'Abdominal supra (crunch)', primary: 'core',
    pattern: 'core_flexao', equipment: ['peso_corporal'], difficulty: 1, kind: 'core', loadType: 'peso_corporal', inc: 0,
    stress: ['pescoco'],
    how: ['Deitado com joelhos flexionados.', 'Enrole o tronco tirando as escápulas do chão.', 'Desça devagar.'],
    mistakes: ['Puxar o pescoço com as mãos.']
  },
  {
    id: 'elevacao_pernas', name: 'Elevação de pernas deitado', primary: 'core',
    pattern: 'core_flexao', equipment: ['peso_corporal'], difficulty: 2, kind: 'core', loadType: 'peso_corporal', inc: 0,
    stress: ['lombar'],
    how: ['Deitado, mãos ao lado do corpo.', 'Eleve as pernas mantendo a lombar no chão.', 'Desça até onde a lombar não descolar.'],
    mistakes: ['Lombar arqueando na descida.'],
    cautions: ['Flexione os joelhos para facilitar.']
  },
  {
    id: 'abdominal_polia', name: 'Abdominal ajoelhado na polia', primary: 'core',
    pattern: 'core_flexao', equipment: ['polia'], difficulty: 2, kind: 'core', inc: 2.5,
    how: ['Ajoelhado de frente para a polia alta, corda junto à cabeça.', 'Flexione o tronco aproximando costelas e quadril.', 'Volte controlando.'],
    mistakes: ['Sentar sobre os calcanhares em vez de flexionar o tronco.']
  }
];

export const EXERCISES: Exercise[] = D.map((d) => ({
  id: d.id,
  name: d.name,
  primary: d.primary,
  secondary: d.secondary ?? [],
  pattern: d.pattern,
  equipment: d.equipment,
  difficulty: d.difficulty,
  kind: d.kind,
  loadType: d.loadType ?? 'carga',
  incrementKg: d.inc ?? 2.5,
  instructions: d.how,
  commonMistakes: d.mistakes,
  cautions: d.cautions ?? [],
  stressRegions: d.stress ?? [],
  alternatives: [
    ...(d.alt ?? []),
    ...D.filter((o) => o.pattern === d.pattern && o.id !== d.id && !(d.alt ?? []).includes(o.id)).map((o) => o.id)
  ]
}));

const BY_ID = new Map(EXERCISES.map((e) => [e.id, e]));

export function getExercise(id: string, custom: Exercise[] = []): Exercise | undefined {
  return BY_ID.get(id) ?? custom.find((c) => c.id === id);
}

export function allExercises(custom: Exercise[] = []): Exercise[] {
  return [...EXERCISES, ...custom];
}

export const MUSCLE_LABEL: Record<MuscleGroup, string> = {
  peito: 'Peito',
  costas: 'Costas',
  ombros: 'Ombros',
  quadriceps: 'Quadríceps',
  posterior: 'Posterior de coxa',
  gluteos: 'Glúteos',
  panturrilhas: 'Panturrilhas',
  biceps: 'Bíceps',
  triceps: 'Tríceps',
  core: 'Abdômen/core'
};

export const MUSCLES = Object.keys(MUSCLE_LABEL) as MuscleGroup[];

export const EQUIPMENT_LABEL: Record<Equipment, string> = {
  peso_corporal: 'Peso corporal',
  halteres: 'Halteres',
  barra: 'Barra olímpica/reta',
  anilhas: 'Anilhas',
  banco: 'Banco',
  maquinas: 'Máquinas de musculação',
  polia: 'Polia / cabos',
  barra_fixa: 'Barra fixa',
  paralelas: 'Paralelas',
  elastico: 'Elástico / faixa',
  kettlebell: 'Kettlebell',
  smith: 'Smith'
};

export const GYM_EQUIPMENT: Equipment[] = [
  'peso_corporal', 'halteres', 'barra', 'anilhas', 'banco', 'maquinas', 'polia', 'barra_fixa', 'paralelas', 'smith'
];
export const HOME_EQUIPMENT: Equipment[] = ['peso_corporal', 'halteres', 'elastico', 'banco'];

export const REGION_LABEL: Record<string, string> = {
  ombro: 'Ombro',
  cotovelo: 'Cotovelo',
  punho: 'Punho',
  lombar: 'Lombar',
  quadril: 'Quadril',
  joelho: 'Joelho',
  tornozelo: 'Tornozelo',
  pescoco: 'Pescoço'
};

export const PATTERN_LABEL: Record<MovementPattern, string> = {
  agachamento: 'Agachamento',
  dobradica: 'Dobradiça de quadril',
  unilateral_pernas: 'Pernas unilateral',
  extensao_quadril: 'Extensão de quadril',
  flexao_joelho: 'Flexão de joelho',
  extensao_joelho: 'Extensão de joelho',
  panturrilha: 'Panturrilha',
  empurrar_horizontal: 'Empurrar horizontal',
  empurrar_vertical: 'Empurrar vertical',
  puxar_horizontal: 'Puxar horizontal',
  puxar_vertical: 'Puxar vertical',
  crucifixo: 'Crucifixo',
  elevacao_lateral: 'Elevação lateral',
  deltoide_posterior: 'Deltoide posterior',
  flexao_cotovelo: 'Flexão de cotovelo',
  extensao_cotovelo: 'Extensão de cotovelo',
  core_antiextensao: 'Core antiextensão',
  core_flexao: 'Core flexão',
  core_antirrotacao: 'Core antirrotação'
};
