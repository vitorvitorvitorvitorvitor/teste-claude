# Motor de treino do FORJA

O motor é um conjunto de **funções puras e determinísticas** em `src/engine/`. Com o mesmo estado (perfil, preferências, plano, histórico, registros do dia, check-in) e o mesmo "agora", o resultado é sempre o mesmo. Não há IA generativa nem aleatoriedade.

Cada regra está registrada com fontes, população, parâmetros, contraindicações, nível de confiança e testes em `src/data/science.ts` — o mesmo conteúdo aparece no app em **Perfil → Referências científicas do motor** (painel de auditoria).

## Módulos

| Arquivo | Responsabilidade |
|---|---|
| `engine/splits.ts` | Modelos de cada divisão (Full Body A/B/C, Superiores/Inferiores, Push/Pull/Legs, Personalizado), geração do plano, regeneração de ficha, revalidação contra equipamentos/limitações. |
| `engine/selection.ts` | Escolha e substituição determinística de exercícios por padrão de movimento. |
| `engine/prescription.ts` | Séries, faixa de repetições, descanso e RIR alvo por nível, objetivo e tipo de exercício. |
| `engine/recommend.ts` | Decisão do dia (`recommendToday`) e montagem da sessão (`buildSession`). |
| `engine/progression.ts` | Progressão dupla com sugestão de carga (nunca aplicada sem confirmação). |
| `engine/volume.ts` | Volume de carga, séries por músculo (diretas = 1, indiretas = 0,5), duração estimada, comparação entre sessões. |

## Decisão do dia (`recommendToday`) — ordem de avaliação

1. **Sinais de alerta** no check-in (dor no peito, falta de ar desproporcional, tontura/desmaio) → `pare`: não treinar e procurar avaliação médica (R10).
2. **Sessão em andamento** → `retomar` (com opção de descartar mediante confirmação).
3. **Próxima ficha pendente** = ficha seguinte à última sessão *contabilizada* do plano ativo (R01). Sessão parcial conta somente se ≥ 50% das séries foram feitas. O dia da semana **nunca** é usado.
4. **Já treinou hoje** → `concluido` (pode treinar de novo se quiser).
5. **Registro do dia** (descanso, "não consegui ir", adiado) → `descanso`; a ficha pendente não muda.
6. **Dor aguda** relatada → `recuperacao_ativa` + orientação de avaliação (R10).
7. **Recuperação muscular** (R03): se o último treino foi ontem (ou < 36 h) e ≥ 50% dos músculos principais da próxima ficha coincidem → sugere descanso/recuperação ativa (o usuário pode “Treinar mesmo assim”). Superiores → Inferiores não se sobrepõem, então dias seguidos são permitidos.
8. **Pausa longa** (≥ 14 dias) → modo `retorno`: −1 série e ~90% da última carga (R11).
9. **Meta semanal flexível** atingida → descanso opcional (R12).
10. **Check-in**: energia ≤ 2, sono ≤ 2 ou dor muscular ≥ 4 → modo `leve` (−1 série, RIR +1). Desconforto em uma região → exercícios que a solicitam são substituídos naquele dia.
11. Caso contrário → `treino`, com a lista de motivos ("Por que este treino?").

### Exemplo do enunciado

- Segunda: Full Body A concluído.
- Terça: o app sugere recuperação (mesmos músculos no dia seguinte). B continua pendente.
- Quarta: o usuário toca em “Não consegui ir hoje”. Nada é perdido.
- Quinta: o app recomenda **Full Body B** (testado em `engine.recommend › falta na quarta mantém B pendente na quinta`).

## Montagem da sessão (`buildSession`)

1. Revalida cada exercício da ficha (equipamento, bloqueios, limitações, desconforto do dia). Incompatíveis → primeiro equivalente do mesmo padrão; sem equivalente → removido com explicação.
2. Aplica trocas manuais do dia.
3. Ajusta ao modo: `rapido` (≤ 2 séries, descanso reduzido, apenas prioridade 1 + um item de prioridade 2, alvo de 20 min), `leve`/`retorno` (−1 série).
4. Guarda de volume semanal (R04): acessórios de músculos que já passaram do limite semanal (iniciante 10, intermediário 16, avançado 20 séries ponderadas em 7 dias) ficam de fora.
5. Ajuste ao tempo disponível (R09): remove prioridade 3, depois 2; por fim reduz séries.
6. Sugestão de carga por exercício (R08). Os campos de carga vêm pré-preenchidos com a **carga anterior**, nunca com o aumento; o aumento exige tocar em “Usar X kg”.

## Progressão dupla (`suggestLoad`)

| Situação na última exposição | Sugestão |
|---|---|
| Sem histórico | Escolher carga que permita a faixa com 2–3 RIR; sem teste de carga máxima |
| Todas as séries no topo da faixa e RIR ≥ alvo mínimo (e RPE da sessão < 9) | + menor incremento disponível (halter, barra ou máquina; dobro para compostos de membros inferiores em barra/máquina) |
| Topo da faixa, mas RIR abaixo do previsto | Manter |
| Alguma série abaixo do mínimo (uma vez) | Manter |
| Abaixo do mínimo em 2 exposições seguidas com a mesma carga | Reduzir ~10% (arredondado ao incremento) |
| Peso corporal / tempo | Progressão por repetições, segundos ou variação |

Incrementos são configuráveis em Perfil → Prescrição.

## Limites conhecidos do motor

- As faixas e limites são **pontos de partida conservadores**, não valores ótimos individuais. As metanálises descrevem médias populacionais.
- O fator de 90% no retorno e a janela de 36 h são escolhas de prática conservadora (confiança baixa/moderada), não derivadas de um estudo específico.
- O motor não diagnostica nada. Dor aguda ou sintomas preocupantes sempre levam à orientação de avaliação profissional.
- Os textos de sugestão do motor usam kg; com a unidade lb, a tela de execução converte os campos e os valores exibidos.
