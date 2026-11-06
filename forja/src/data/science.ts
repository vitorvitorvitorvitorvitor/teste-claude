/**
 * Registro de referências científicas e das regras do motor de treino.
 *
 * Cada regra aponta para as fontes que a justificam, a conclusão usada, a
 * população a que se aplica, parâmetros configuráveis, quando NÃO aplicar,
 * nível de confiança e os testes automatizados que validam o comportamento.
 *
 * Importante: resultados médios de estudos não são garantias individuais.
 * Os números do motor são pontos de partida conservadores e ajustáveis.
 */

export type Confidence = 'alta' | 'moderada' | 'baixa' | 'consenso/prática';

export interface Reference {
  id: string;
  short: string;
  title: string;
  authors: string;
  source: string;
  year: number;
  url: string;
  doi?: string;
  kind: 'diretriz' | 'revisao_sistematica' | 'metanalise' | 'posicionamento' | 'material_tecnico' | 'saude_publica';
  population: string;
  keyFinding: string;
}

export const REFERENCES: Reference[] = [
  {
    id: 'acsm2026',
    short: 'ACSM 2026',
    title:
      'American College of Sports Medicine Position Stand. Resistance Training Prescription for Muscle Function, Hypertrophy, and Physical Performance in Healthy Adults: An Overview of Reviews',
    authors: 'Currier BS, et al.',
    source: 'Medicine & Science in Sports & Exercise 58(4):851–872',
    year: 2026,
    url: 'https://doi.org/10.1249/MSS.0000000000003897',
    doi: '10.1249/MSS.0000000000003897',
    kind: 'diretriz',
    population: 'Adultos saudáveis (síntese de 137 revisões sistemáticas, >30 mil participantes).',
    keyFinding:
      'Treino resistido progressivo, realizado ao menos 2×/semana envolvendo os principais grupos musculares, melhora força e hipertrofia. Muitas variáveis (treinar até a falha, tipo de equipamento, periodização, estrutura de séries) não alteraram consistentemente os resultados: consistência e progressão importam mais do que detalhes.'
  },
  {
    id: 'acsm2026_resumo',
    short: 'ACSM 2026 (resumo oficial)',
    title: 'ACSM unveils landmark 2026 resistance training guidelines — infográfico e resumo oficial',
    authors: 'American College of Sports Medicine',
    source: 'acsm.org',
    year: 2026,
    url: 'https://acsm.org/wp-content/uploads/2026/03/Resistance-Training-Position-Stand-infographic.pdf',
    kind: 'diretriz',
    population: 'Adultos saudáveis.',
    keyFinding:
      'Recomenda treino resistido progressivo com esforço alto mensurável por RPE/RIR, pelo menos duas vezes por semana, trabalhando todos os grandes grupos musculares.'
  },
  {
    id: 'acsm2009',
    short: 'ACSM 2009',
    title: 'Progression Models in Resistance Training for Healthy Adults (Position Stand)',
    authors: 'American College of Sports Medicine',
    source: 'Medicine & Science in Sports & Exercise 41(3):687–708',
    year: 2009,
    url: 'https://pubmed.ncbi.nlm.nih.gov/19204579/',
    doi: '10.1249/MSS.0b013e3181915670',
    kind: 'posicionamento',
    population: 'Adultos saudáveis, de iniciantes a avançados.',
    keyFinding:
      'Sugere aumentos de carga de cerca de 2–10% quando o indivíduo consegue realizar 1–2 repetições acima do número alvo em duas sessões consecutivas; iniciantes podem treinar o corpo inteiro 2–3×/semana.'
  },
  {
    id: 'iusca2021',
    short: 'IUSCA 2021',
    title:
      'Resistance Training Recommendations to Maximize Muscle Hypertrophy in an Athletic Population: Position Stand of the IUSCA',
    authors: 'Schoenfeld BJ, Fisher JP, Grgic J, et al.',
    source: 'International Journal of Strength and Conditioning 1(1)',
    year: 2021,
    url: 'https://journal.iusca.org/index.php/Journal/article/view/81',
    doi: '10.47206/ijsc.v1i1.81',
    kind: 'posicionamento',
    population: 'População atlética/treinada. Aplicar com cautela a iniciantes.',
    keyFinding:
      'Hipertrofia pode ser obtida em ampla faixa de cargas e repetições desde que o esforço seja alto; volume semanal é um fator importante; variedade de exercícios ajuda a distribuir o estímulo.'
  },
  {
    id: 'oms2020',
    short: 'OMS 2020',
    title: 'World Health Organization 2020 guidelines on physical activity and sedentary behaviour',
    authors: 'Bull FC, Al-Ansari SS, Biddle S, et al.',
    source: 'British Journal of Sports Medicine 54:1451–1462',
    year: 2020,
    url: 'https://www.who.int/publications/i/item/9789240015128',
    doi: '10.1136/bjsports-2020-102955',
    kind: 'diretriz',
    population: 'Adultos (18–64 anos) e idosos.',
    keyFinding:
      'Adultos devem fazer 150–300 min/semana de atividade aeróbica moderada (ou 75–150 vigorosa) e fortalecimento muscular de intensidade moderada ou maior para os principais grupos musculares em 2 ou mais dias por semana. Qualquer atividade é melhor que nenhuma.'
  },
  {
    id: 'ms2021',
    short: 'Ministério da Saúde 2021',
    title: 'Guia de Atividade Física para a População Brasileira',
    authors: 'Ministério da Saúde (Brasil)',
    source: 'Ministério da Saúde, Brasília',
    year: 2021,
    url: 'https://bvsms.saude.gov.br/bvs/publicacoes/guia_atividade_fisica_populacao_brasileira.pdf',
    kind: 'saude_publica',
    population: 'População brasileira.',
    keyFinding:
      'Recomenda ao menos 150 min/semana de atividade moderada e fortalecimento muscular em 2 ou mais dias; incentiva começar aos poucos, respeitar limites e procurar orientação profissional.'
  },
  {
    id: 'pelland2026',
    short: 'Pelland et al. 2025/2026',
    title:
      'The Resistance Training Dose Response: Meta-Regressions Exploring the Effects of Weekly Volume and Frequency on Muscle Hypertrophy and Strength Gains',
    authors: 'Pelland JC, Remmert JF, Robinson ZP, et al.',
    source: 'Sports Medicine (online dez/2025; registro 2026)',
    year: 2026,
    url: 'https://doi.org/10.1007/s40279-025-02344-w',
    doi: '10.1007/s40279-025-02344-w',
    kind: 'metanalise',
    population: 'Adultos saudáveis (67 estudos), majoritariamente jovens.',
    keyFinding:
      'Força e hipertrofia aumentam com o volume semanal, com retornos decrescentes. Séries indiretas contadas como fração (≈0,5) explicaram melhor os dados. Com volume equiparado, frequência teve efeito incerto/negligenciável na hipertrofia e efeito positivo (decrescente) na força.'
  },
  {
    id: 'schoenfeld2019',
    short: 'Schoenfeld et al. 2019',
    title:
      'How many times per week should a muscle be trained to maximize muscle hypertrophy? A systematic review and meta-analysis of studies examining the effects of resistance training frequency',
    authors: 'Schoenfeld BJ, Grgic J, Krieger J',
    source: 'Journal of Sports Sciences 37(11):1286–1295',
    year: 2019,
    url: 'https://pubmed.ncbi.nlm.nih.gov/30558493/',
    doi: '10.1080/02640414.2018.1555906',
    kind: 'metanalise',
    population: 'Adultos treinados e não treinados.',
    keyFinding:
      'Com volume equiparado, a frequência semanal tem pouco efeito na hipertrofia; a frequência pode ser escolhida pela conveniência e para distribuir o volume.'
  },
  {
    id: 'robinson2024',
    short: 'Robinson et al. 2024 (RIR)',
    title:
      'Exploring the Dose–Response Relationship Between Estimated Resistance Training Proximity to Failure, Strength Gain, and Muscle Hypertrophy: A Series of Meta-Regressions',
    authors: 'Robinson ZP, Pelland JC, Remmert JF, et al.',
    source: 'Sports Medicine 54(9):2209–2231',
    year: 2024,
    url: 'https://pubmed.ncbi.nlm.nih.gov/38970765/',
    doi: '10.1007/s40279-024-02069-2',
    kind: 'metanalise',
    population: 'Adultos saudáveis; análise exploratória.',
    keyFinding:
      'Ganhos de força foram semelhantes em diferentes RIR; a hipertrofia tendeu a aumentar com séries mais próximas da falha. Treinar até a falha não é obrigatório; RIR baixo-moderado é suficiente.'
  },
  {
    id: 'singer2024',
    short: 'Singer et al. 2024 (descanso)',
    title:
      'Give it a rest: a systematic review with Bayesian meta-analysis on the effect of inter-set rest interval duration on muscle hypertrophy',
    authors: 'Singer A, Wolf M, Generoso L, et al.',
    source: 'Frontiers in Sports and Active Living 6:1429789',
    year: 2024,
    url: 'https://www.frontiersin.org/articles/10.3389/fspor.2024.1429789/full',
    doi: '10.3389/fspor.2024.1429789',
    kind: 'metanalise',
    population: 'Adultos (9 estudos), heterogeneidade substancial.',
    keyFinding:
      'Pequeno benefício hipertrófico com descansos >60 s; sem diferenças apreciáveis acima de ~90 s.'
  },
  {
    id: 'wolf2023',
    short: 'Wolf et al. 2023 (amplitude)',
    title: 'Partial Vs Full Range of Motion Resistance Training: A Systematic Review and Meta-Analysis',
    authors: 'Wolf M, Androulakis-Korakakis P, Fisher J, Schoenfeld B, Steele J',
    source: 'International Journal of Strength and Conditioning 3(1):1–21',
    year: 2023,
    url: 'https://journal.iusca.org/index.php/Journal/article/view/182',
    doi: '10.47206/ijsc.v3i1.182',
    kind: 'metanalise',
    population: 'Adultos.',
    keyFinding:
      'Efeito geral trivial a favor da amplitude completa; possível vantagem de treinar em comprimentos musculares longos (incerta). Não existe regra universal: usar amplitude completa confortável e controlada.'
  },
  {
    id: 'ace_library',
    short: 'ACE Exercise Library',
    title: 'ACE Exercise Library',
    authors: 'American Council on Exercise',
    source: 'acefitness.org',
    year: 2024,
    url: 'https://www.acefitness.org/resources/everyone/exercise-library/',
    kind: 'material_tecnico',
    population: 'Público geral.',
    keyFinding:
      'Referência de nomes, equipamentos e instruções técnicas. Imagens/vídeos NÃO foram incorporados (direitos de uso não verificados).'
  },
  {
    id: 'riebe2015',
    short: 'ACSM 2015 (triagem)',
    title: "Updating ACSM's Recommendations for Exercise Preparticipation Health Screening",
    authors: 'Riebe D, Franklin BA, Thompson PD, et al.',
    source: 'Medicine & Science in Sports & Exercise 47(11):2473–2479',
    year: 2015,
    url: 'https://pubmed.ncbi.nlm.nih.gov/26473759/',
    doi: '10.1249/MSS.0000000000000664',
    kind: 'posicionamento',
    population: 'Adultos que iniciam programas de exercício.',
    keyFinding:
      'Pessoas com sinais/sintomas de doença cardiovascular, metabólica ou renal (ex.: dor no peito, falta de ar desproporcional, tontura/desmaio) devem buscar liberação médica; iniciar com intensidade leve a moderada e progredir gradualmente.'
  },
  {
    id: 'niddk',
    short: 'NIDDK',
    title: 'Tips to Help You Get Active / Getting Started Safely',
    authors: 'National Institute of Diabetes and Digestive and Kidney Diseases (NIH)',
    source: 'niddk.nih.gov',
    year: 2023,
    url: 'https://www.niddk.nih.gov/health-information/weight-management/tips-get-active',
    kind: 'saude_publica',
    population: 'Adultos iniciantes, incluindo pessoas com excesso de peso.',
    keyFinding:
      'Começar devagar, aumentar aos poucos, interromper a atividade diante de dor no peito, falta de ar intensa, tontura ou dor aguda e procurar avaliação.'
  },
  {
    id: 'cdc_start',
    short: 'CDC — começar',
    title: 'Physical Activity Basics — Adding Physical Activity as an Adult / Getting Started',
    authors: 'Centers for Disease Control and Prevention',
    source: 'cdc.gov',
    year: 2023,
    url: 'https://www.cdc.gov/physical-activity-basics/adding-adults/index.html',
    kind: 'saude_publica',
    population: 'Adultos sedentários ou iniciantes.',
    keyFinding:
      'Algum exercício é melhor que nenhum; comece com sessões curtas e aumente gradualmente; fortalecimento muscular ≥2 dias/semana.'
  },
  {
    id: 'cdc_weight',
    short: 'CDC — peso saudável',
    title: 'Healthy Weight — Steps for Losing Weight / Physical Activity and Your Weight',
    authors: 'Centers for Disease Control and Prevention',
    source: 'cdc.gov',
    year: 2024,
    url: 'https://www.cdc.gov/healthy-weight-growth/losing-weight/index.html',
    kind: 'saude_publica',
    population: 'Adultos.',
    keyFinding:
      'Perda de peso gradual (cerca de 0,5–1 kg/semana) é mais sustentável; atividade física, sono e manejo do estresse fazem parte do processo.'
  },
  {
    id: 'nice_ng69',
    short: 'NICE NG69',
    title: 'Eating disorders: recognition and treatment (NG69)',
    authors: 'National Institute for Health and Care Excellence',
    source: 'nice.org.uk',
    year: 2017,
    url: 'https://www.nice.org.uk/guidance/ng69',
    kind: 'diretriz',
    population: 'Pessoas com risco ou presença de transtornos alimentares.',
    keyFinding:
      'Exercício compulsivo/compensatório é um comportamento de risco. Base para o app NÃO usar exercício como compensação por comida nem mensagens de culpa.'
  },
  {
    id: 'singh2024',
    short: 'Singh et al. 2024 (hábitos)',
    title: 'Time to Form a Habit: A Systematic Review and Meta-Analysis of Health Behaviour Habit Formation and Its Determinants',
    authors: 'Singh B, Murphy A, Maher C, Smith AE',
    source: 'Healthcare 12(23):2488',
    year: 2024,
    url: 'https://pubmed.ncbi.nlm.nih.gov/39685110/',
    doi: '10.3390/healthcare12232488',
    kind: 'metanalise',
    population: 'Adultos (20 estudos, 2.601 participantes).',
    keyFinding:
      'Formação de hábitos variou muito entre indivíduos (medianas ~59–66 dias; de 4 a 335 dias). Frequência, horário consistente, escolha pessoal e experiência agradável associaram-se à força do hábito.'
  }
];

export interface EngineRule {
  id: string;
  title: string;
  decision: string;
  refs: string[];
  conclusion: string;
  population: string;
  params: string[];
  notApplicable: string;
  confidence: Confidence;
  tests: string[];
}

export const RULES: EngineRule[] = [
  {
    id: 'R01-sequencia',
    title: 'Sequência de fichas independente do dia da semana',
    decision:
      'O próximo treino é a ficha seguinte à última sessão contabilizada do plano ativo. Faltas não avançam nem reiniciam a sequência.',
    refs: ['acsm2026', 'singh2024'],
    conclusion:
      'Os resultados dependem de exposição consistente e progressiva ao treino; não há evidência de que o dia da semana importe. Rotinas flexíveis reduzem atrito para formar hábito.',
    population: 'Todos os usuários.',
    params: ['Sessão parcial conta se ≥ 50% das séries foram concluídas.'],
    notApplicable: 'Quando o usuário regenera ou troca de divisão: a sequência recomeça na primeira ficha do novo plano.',
    confidence: 'consenso/prática',
    tests: ['engine.recommend › segue A → B → C', 'engine.recommend › falta na quarta mantém B pendente na quinta', 'engine.recommend › não usa o dia da semana']
  },
  {
    id: 'R02-frequencia',
    title: 'Frequência inicial 2–3 sessões de corpo inteiro',
    decision:
      'Iniciantes recebem Full Body com 2–3 sessões/semana como padrão; divisões PPL com ≤3 dias geram aviso.',
    refs: ['acsm2026', 'acsm2009', 'oms2020', 'ms2021', 'schoenfeld2019', 'pelland2026'],
    conclusion:
      'Treinar cada grande grupo ≥2×/semana é recomendado; com volume igual, a frequência tem pouco efeito na hipertrofia, então a divisão é escolhida pela praticidade.',
    population: 'Adultos saudáveis; iniciantes.',
    params: ['Dias por semana (1–6)', 'Divisão escolhida'],
    notApplicable: 'Atletas com necessidades específicas de periodização.',
    confidence: 'alta',
    tests: ['engine.splits › Full Body gera A/B/C com 3 dias e A/B com 2 dias', 'engine.splits › PPL com poucos dias gera aviso']
  },
  {
    id: 'R03-recuperacao',
    title: 'Evitar repetir os mesmos músculos em dias consecutivos',
    decision:
      'Se a última sessão foi ontem (ou há menos de 36 h) e ≥50% dos músculos principais do próximo treino coincidem, o app sugere descanso ou recuperação ativa (o usuário pode treinar mesmo assim).',
    refs: ['acsm2009', 'acsm2026', 'niddk'],
    conclusion:
      'Diretrizes para iniciantes sugerem intervalo de ~48 h para o mesmo grupo muscular; treinos alternados (superior/inferior) permitem dias seguidos.',
    population: 'Iniciantes e intermediários.',
    params: ['Dia seguinte ou janela de 36 h', 'Sobreposição ≥ 50% dos músculos principais'],
    notApplicable: 'Divisões sem sobreposição (ex.: Upper → Lower).',
    confidence: 'moderada',
    tests: ['engine.recommend › Full Body no dia seguinte sugere descanso', 'engine.recommend › Upper/Lower permite dias consecutivos']
  },
  {
    id: 'R04-series',
    title: 'Volume conservador por exercício',
    decision:
      'Iniciantes: 2 séries por exercício (ajustável); intermediários/avançados: 3. Volume semanal por músculo é monitorado com séries indiretas valendo 0,5.',
    refs: ['acsm2026', 'pelland2026', 'iusca2021'],
    conclusion:
      'Mais volume tende a gerar mais ganhos, mas com retornos decrescentes; iniciantes respondem bem a volumes baixos. Mais volume não é garantia de melhora.',
    population: 'Adultos saudáveis.',
    params: ['Séries por nível', 'Limite semanal de séries por músculo (iniciante 10, intermediário 16, avançado 20)'],
    notApplicable: 'Quando o usuário define séries manualmente na ficha.',
    confidence: 'moderada',
    tests: ['engine.prescription › iniciante recebe 2 séries', 'engine.volume › séries indiretas contam 0,5']
  },
  {
    id: 'R05-repeticoes',
    title: 'Faixas de repetições por objetivo e tipo de exercício',
    decision:
      'Hipertrofia/saúde: compostos 8–12, isolados 10–15. Força: compostos 6–10 para iniciantes (técnica) e 4–8 para treinados. Core em tempo ou repetições.',
    refs: ['acsm2026', 'iusca2021', 'acsm2009'],
    conclusion:
      'Hipertrofia ocorre em ampla faixa de cargas com esforço suficiente; força se beneficia de cargas mais altas. Faixas moderadas facilitam técnica em iniciantes.',
    population: 'Adultos saudáveis.',
    params: ['Sobrescrita de faixa de repetições nas preferências'],
    notApplicable: 'Exercícios com peso corporal (faixas próprias) e isometrias (tempo).',
    confidence: 'moderada',
    tests: ['engine.prescription › faixas variam por objetivo e tipo']
  },
  {
    id: 'R06-esforco',
    title: 'Esforço por RIR sem exigir falha',
    decision:
      'Meta de 2–3 repetições em reserva para iniciantes, 1–3 para intermediários e 0–2 para avançados. Falha muscular nunca é obrigatória.',
    refs: ['robinson2024', 'acsm2026', 'acsm2026_resumo'],
    conclusion:
      'Força melhora de forma semelhante em vários RIR; hipertrofia tende a ser maior perto da falha, mas treinar até a falha não mostrou benefício consistente.',
    population: 'Adultos saudáveis.',
    params: ['RIR alvo por nível'],
    notApplicable: 'Dias de recuperação ou sessão leve (RIR +1).',
    confidence: 'moderada',
    tests: ['engine.prescription › RIR alvo nunca exige falha para iniciantes']
  },
  {
    id: 'R07-descanso',
    title: 'Descanso entre séries',
    decision:
      'Compostos ~120 s (força: 150–180 s), isolados ~75 s, core ~45 s. No treino rápido o descanso é reduzido, aceitando pequena perda de volume.',
    refs: ['singer2024', 'acsm2009'],
    conclusion: 'Descansos >60 s têm pequeno benefício; acima de ~90 s não há diferença apreciável para hipertrofia.',
    population: 'Adultos.',
    params: ['Sobrescrita de descanso nas preferências'],
    notApplicable: 'Estilo circuito escolhido pelo usuário.',
    confidence: 'moderada',
    tests: ['engine.prescription › descanso maior em compostos']
  },
  {
    id: 'R08-progressao',
    title: 'Progressão dupla com confirmação',
    decision:
      'Se todas as séries atingiram o topo da faixa sem esforço acima do previsto, sugere-se o menor incremento disponível. Quedas em 2 sessões seguidas sugerem reduzir ~10%. Nada é aplicado sem confirmação.',
    refs: ['acsm2009', 'acsm2026'],
    conclusion: 'Sobrecarga progressiva é o princípio central; aumentos de 2–10% quando as repetições alvo são superadas.',
    population: 'Todos os níveis.',
    params: ['Incremento de halteres, barra e máquinas nas preferências'],
    notApplicable: 'Exercícios de peso corporal ou tempo: progride-se em repetições/variação.',
    confidence: 'moderada',
    tests: ['engine.progression › sugere aumento no topo da faixa', 'engine.progression › mantém quando RIR baixo', 'engine.progression › reduz após quedas recorrentes']
  },
  {
    id: 'R09-tempo',
    title: 'Ajuste ao tempo disponível',
    decision:
      'Acessórios (prioridade 3) são removidos primeiro, depois prioridade 2; o treino rápido (15–25 min) mantém os compostos essenciais da ficha.',
    refs: ['acsm2026', 'oms2020', 'cdc_start'],
    conclusion: 'Qualquer treino é melhor que nenhum; consistência supera complexidade.',
    population: 'Todos.',
    params: ['Tempo disponível por sessão (15–75 min)'],
    notApplicable: '—',
    confidence: 'consenso/prática',
    tests: ['engine.session › treino rápido mantém essenciais', 'engine.session › respeita o tempo disponível']
  },
  {
    id: 'R10-dor',
    title: 'Dor, sinais de alerta e limitações',
    decision:
      'Dor aguda → sem treino de força no dia e orientação para avaliação. Desconforto em uma região → exercícios que a solicitam são substituídos. Sintomas de alerta → parar e procurar atendimento.',
    refs: ['riebe2015', 'niddk', 'cdc_start'],
    conclusion: 'Sinais e sintomas exigem interrupção e avaliação; o app não diagnostica.',
    population: 'Todos.',
    params: ['Limitações do perfil', 'Check-in de recuperação'],
    notApplicable: '—',
    confidence: 'consenso/prática',
    tests: ['engine.selection › limitações excluem exercícios', 'engine.recommend › dor aguda leva a recuperação']
  },
  {
    id: 'R11-retorno',
    title: 'Retorno após pausa longa',
    decision:
      'Após ≥14 dias sem treinar, a sessão é de retorno: −1 série (mínimo 1) e cargas sugeridas a ~90% da última.',
    refs: ['acsm2009', 'cdc_start'],
    conclusion: 'Progressão gradual reduz risco ao retomar. O percentual é uma escolha conservadora de prática, não um valor derivado de estudo específico.',
    population: 'Todos.',
    params: ['Janela de 14 dias', 'Fator 0,9'],
    notApplicable: 'Pausas curtas.',
    confidence: 'baixa',
    tests: ['engine.recommend › pausa longa gera modo retorno']
  },
  {
    id: 'R12-aderencia',
    title: 'Aderência sem pressão',
    decision:
      'Metas semanais flexíveis, sem penalidade por faltas, sequência de dias opcional (desativada por padrão), botão "Hoje só tenho 15 minutos" e mensagens baseadas em realizações concretas. O app nunca relaciona treino a comida.',
    refs: ['singh2024', 'nice_ng69', 'cdc_weight'],
    conclusion: 'Hábito leva semanas a meses e varia muito; flexibilidade e autonomia favorecem a manutenção. Exercício compensatório é comportamento de risco.',
    population: 'Todos, especialmente quem tem dificuldade com hábitos.',
    params: ['Exibir sequência', 'Meta semanal'],
    notApplicable: '—',
    confidence: 'moderada',
    tests: ['engine.recommend › meta semanal atingida sugere descanso opcional']
  },
  {
    id: 'R13-amplitude',
    title: 'Amplitude de movimento',
    decision: 'Instruções orientam amplitude completa e confortável, com controle, sem forçar além do que a articulação tolera.',
    refs: ['wolf2023'],
    conclusion: 'Diferenças entre amplitudes são triviais a pequenas, levemente a favor da amplitude completa.',
    population: 'Adultos.',
    params: [],
    notApplicable: 'Limitações articulares: reduzir amplitude conforme orientação profissional.',
    confidence: 'moderada',
    tests: []
  },
  {
    id: 'R14-substituicao',
    title: 'Substituição determinística por equivalentes',
    decision:
      'Exercícios indisponíveis (equipamento, bloqueio, limitação) são trocados pelo primeiro equivalente do mesmo padrão de movimento, em ordem fixa de preferência. A seleção fica salva na ficha para evitar mudanças excessivas.',
    refs: ['acsm2026', 'iusca2021'],
    conclusion: 'Tipo de equipamento não alterou resultados de forma consistente; manter os mesmos exercícios facilita medir progressão.',
    population: 'Todos.',
    params: ['Equipamentos', 'Exercícios bloqueados/preferidos'],
    notApplicable: '—',
    confidence: 'moderada',
    tests: ['engine.selection › substitui exercício sem equipamento', 'engine.selection › escolha é determinística']
  }
];

export function referenceById(id: string): Reference | undefined {
  return REFERENCES.find((r) => r.id === id);
}
