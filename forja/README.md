# FORJA — Treino Inteligente

Aplicativo web progressivo (PWA) de musculação que monta automaticamente o treino de cada dia a partir da sua sequência de fichas, do histórico, da recuperação e do tempo disponível. Funciona **offline**, guarda tudo **somente no aparelho**, não tem login, assinatura, servidor pago nem API de IA.

> É um PWA instalável pela opção “Adicionar à Tela de Início” do iPhone. **Não é** um aplicativo nativo da App Store.

## O que o app faz

- **Onboarding** com nome, faixa etária, nível, objetivo, local, equipamentos, dias/semana, tempo por sessão (15–75 min), estilo, dias preferidos, exercícios a evitar, limitações e peso/altura opcionais. Tudo editável depois sem perder histórico.
- **Divisões**: Full Body A/B/C (padrão; C só com ≥ 3 dias), Superiores/Inferiores, Push/Pull/Legs (com aviso quando é pouco prático), Personalizado (fichas manuais) e **Treino rápido** (~15–20 min).
- **Motor determinístico** (ver [`docs/MOTOR.md`](docs/MOTOR.md)): segue a sequência sem depender do dia da semana, mantém a ficha pendente após faltas, evita repetir os mesmos músculos em dias seguidos, respeita meta semanal, check-in de recuperação, dor/limitações, pausa longa, tempo disponível e volume semanal, e explica “Por que este treino?”.
- **Execução na academia**: carga anterior e sugerida, kg/reps/RIR por série, conclusão por série, cronômetro de descanso com sinal sonoro, cronômetro da sessão, progresso em %, troca de exercício, observações, salvamento automático, retomada após fechar o app, encerramento antecipado (parcial) e descarte com confirmação. Resumo final com séries, tempo, volume e comparação com a sessão anterior.
- **Progressão dupla** com confirmação: sugere o menor incremento quando todas as séries chegam ao topo da faixa com esforço dentro da meta; sugere manter ou reduzir quando o desempenho cai.
- **Histórico** com calendário mensal, sessões completas e parciais, séries e cargas. **Evolução** com gráficos de carga por exercício, frequência mensal, sessões e volume semanais, distribuição muscular e duração — só com dados reais.
- **Aderência sem pressão**: “Hoje só tenho 15 minutos”, “Não consegui ir hoje”, adiar, registrar descanso, meta semanal flexível, sequência de semanas opcional (desligada por padrão) e lembretes no Calendário do iPhone.
- **Biblioteca** com 83 exercícios (10 categorias), instruções, erros comuns, cuidados, alternativas, preferidos e bloqueados.
- **Tutorial de cada exercício**: demonstração animada original (boneco articulado em loop, com play/pausa e posições de início e fim), mapa muscular frente/costas destacando o músculo principal e os auxiliares, explicação do que cada músculo faz, passo a passo, respiração, onde sentir, erros comuns e cuidados. Miniaturas aparecem na tela Hoje, na execução e nas fichas. Botão opcional “Ver vídeos no YouTube” (abre vídeos de terceiros; requer internet).
- **Painel de referências científicas** (Perfil → Referências científicas do motor): 14 regras e 18 fontes com DOI/URL, população, parâmetros, quando não aplicar, nível de confiança e testes que as validam.
- **Backup** JSON (exportar/importar com validação) e apagar todos os dados com confirmação.

## Requisitos

- [Node.js](https://nodejs.org/) 20 ou superior (testado com Node 22) e npm.
- Para os testes de interface: navegador Chromium do Playwright (`npx playwright install chromium`).

## Executar no Windows

Abra o **PowerShell** na pasta do projeto (`forja`):

```powershell
npm install
npm run dev
```

Acesse `http://localhost:5173` no navegador. Para abrir no iPhone na mesma rede Wi-Fi, use o endereço “Network” exibido pelo Vite (ex.: `http://192.168.0.10:5173`). Pelo HTTP local o app funciona, mas **o modo offline e a instalação completa exigem HTTPS** (veja abaixo).

Versão de produção local:

```powershell
npm run build
npm run preview
```

Testes:

```powershell
npm test                          # testes unitários (Vitest)
npx playwright install chromium   # apenas na primeira vez
npm run test:e2e                  # testes de interface (Playwright)
```

> Se o PowerShell bloquear scripts do npm, execute uma vez: `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned`.

## Disponibilizar por HTTPS (gratuito)

O build gera a pasta `dist/` com arquivos estáticos (sem servidor). O app usa caminhos relativos, então funciona na raiz ou em subpastas. **Nenhum dado pessoal vai para o servidor**: perfil e treinos ficam no IndexedDB do aparelho.

**Opção A — Cloudflare Pages (recomendada, com acesso restrito opcional)**

1. `npm run build`.
2. Em <https://dash.cloudflare.com> → Workers & Pages → Create → Pages → *Upload assets* → envie a pasta `dist`.
3. Você recebe `https://<nome>.pages.dev`.
4. Para restringir o acesso, ative **Cloudflare Access** (Zero Trust, gratuito para poucos usuários) e permita apenas o seu e-mail. Após o primeiro carregamento, o app funciona offline mesmo assim.

**Opção B — Netlify Drop**: acesse <https://app.netlify.com/drop> e arraste a pasta `dist`. O endereço gerado é difícil de adivinhar, mas é público; use a opção A se quiser restrição real.

**Opção C — GitHub Pages**: exige repositório público no plano gratuito. Só use se concordar em tornar o código público (os dados continuam no aparelho).

**Teste rápido sem hospedar** (temporário): com `npm run preview` rodando, instale o [cloudflared](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/) e execute `cloudflared tunnel --url http://localhost:4173`. Ele exibe um endereço `https://...trycloudflare.com` válido enquanto o comando estiver aberto.

## Instalar no iPhone

1. Abra o endereço HTTPS no **Safari**.
2. Toque em **Compartilhar** → **Adicionar à Tela de Início** → **Adicionar**.
3. Abra o FORJA pelo ícone: ele abre em tela cheia (standalone), respeitando a área segura e a Dynamic Island.
4. Abra uma vez com internet; depois disso funciona offline.

Dicas: o app instalado e o Safari têm armazenamentos separados. Use **Perfil → Seus dados → Exportar** para fazer backup periodicamente (o arquivo pode ser salvo em Arquivos/iCloud pela folha de compartilhamento).

## Uso no dia a dia

1. Aba **Hoje**: veja o treino recomendado e o motivo. Opcionalmente faça o check-in (energia, sono, dor).
2. **INICIAR TREINO** → registre carga, repetições e (opcional) RIR; toque ✓ em cada série; o descanso inicia sozinho.
3. Se a sugestão de carga aparecer, toque em “Usar X kg” para aceitá-la — nada muda sem sua confirmação.
4. **Encerrar**: informe o esforço da sessão (opcional) e veja o resumo.
5. Não deu para ir? Toque “Não consegui ir hoje”. A ficha continua esperando.

## Testes executados nesta entrega

Executados de verdade neste ambiente (Linux, Node 22, Chromium do Playwright):

- `npm test` → **69 testes unitários aprovados** (demonstrações animadas de todos os 83 exercícios, mapa muscular, motor, divisões, seleção/substituição, prescrição, progressão, volume, persistência com IndexedDB simulado, troca de divisão, regeneração, backup/validação, apagar dados).
- `npm run test:e2e` → **9 testes de interface aprovados**: tutorial do exercício (demonstração, mapa muscular, link de vídeos), fluxo completo (perfil → Full Body A → registro → histórico → recarregar → dia seguinte → falta → B), retomada de sessão após recarregar, treino rápido + “não consegui”, troca de divisão mantendo histórico, layout mobile sem rolagem horizontal em todas as abas, funcionamento offline com service worker, backup exportar/apagar/importar e painel de referências.

Cobertura dos 16 cenários pedidos: 1–13 e 16 em testes unitários e/ou E2E; 14 (offline) e 15 (layout mobile) em E2E.

## Limitações conhecidas

- **Testado em Chromium com viewport e user-agent de iPhone**, não em um iPhone/Safari real (WebKit não estava disponível no ambiente). Recomenda-se uma verificação manual no aparelho.
- **Notificações**: o Safari não agenda notificações locais sem servidor de push. Alternativa implementada: arquivo `.ics` com lembretes recorrentes no Calendário do iPhone.
- **Cronômetro de descanso em segundo plano**: o iOS suspende páginas em segundo plano; o tempo é recalculado ao voltar, mas o sinal sonoro só toca com o app aberto. Vibração não é suportada no Safari.
- **Armazenamento**: o Safari pode limpar dados de sites pouco usados; o app instalado na Tela de Início e o pedido de armazenamento persistente reduzem o risco. Faça backups.
- **Imagens e vídeos**: as demonstrações são ilustrações animadas originais do FORJA (estilizadas, não fotos). Fotos de bancos “de domínio público” foram avaliadas e descartadas porque exibem marca comercial (origem e licença não verificáveis). Vídeos reais ficam no link opcional para o YouTube, que exige internet e não é controlado pelo app.
- **Unidade lb**: convertida na tela de execução; textos de sugestão e gráficos exibem kg.
- Os parâmetros do motor são pontos de partida conservadores, não garantias individuais. O app não diagnostica, não prescreve tratamentos e não substitui avaliação de profissional de Educação Física ou de saúde.

## Documentação

- [`docs/MOTOR.md`](docs/MOTOR.md) — algoritmo de recomendação e progressão.
- [`docs/ARQUITETURA.md`](docs/ARQUITETURA.md) — estrutura de pastas, modelos e migrações.
- `src/data/science.ts` — referências e regras (também visíveis no app).
