# Arquitetura

```
forja/
├── index.html                 # metatags iOS (standalone, status bar, apple-touch-icon)
├── vite.config.ts             # Vite + PWA (manifest + service worker Workbox) + Vitest
├── playwright.config.ts       # testes de interface (viewport iPhone 13 + desktop)
├── public/icons/              # ícones gerados (scripts/generate-icons.mjs)
├── src/
│   ├── domain/types.ts        # modelos de dados (independentes de React/IndexedDB)
│   ├── data/
│   │   ├── exercises.ts       # biblioteca local (83 exercícios)
│   │   └── science.ts         # referências científicas + regras do motor
│   ├── engine/                # motor determinístico (puro, testável) — ver MOTOR.md
│   ├── db/
│   │   ├── db.ts              # esquema Dexie/IndexedDB e versão
│   │   ├── repo.ts            # todas as escritas (transações)
│   │   └── backup.ts          # exportação/importação JSON com validação
│   ├── lib/                   # tema, .ics, download/compartilhar, sinal sonoro
│   ├── ui/
│   │   ├── components/        # design system, gráficos SVG, componentes de exercício
│   │   └── screens/           # Onboarding, Hoje, Execução, Treinos, Histórico, Evolução, Perfil
│   ├── App.tsx                # navegação por abas
│   └── main.tsx               # bootstrap, registro do service worker
├── tests/unit/                # Vitest (motor, progressão, persistência, backup)
└── tests/e2e/                 # Playwright (fluxos reais no navegador)
```

## Modelos de dados

| Modelo | Tabela | Observações |
|---|---|---|
| `UserProfile` | `profile` (id fixo `me`) | editável sem apagar histórico |
| `WorkoutPreferences` | `prefs` (id `prefs`) | tema, cor, unidade, incrementos, sobrescritas |
| `Exercise` | código (`data/exercises.ts`) + `customExercises` | IDs estáveis em texto |
| `TrainingPlan` | `plans` | nunca apagado; trocar divisão arquiva o anterior (`active=false`) |
| `WorkoutTemplate` | `templates` | regeneração cria nova versão; a anterior fica `archived` se tiver sessões |
| `WorkoutSession` | `sessions` | contém `SessionExercise[]` → `CompletedSet[]` como *snapshot* imutável (nome, padrão, músculos, faixa) |
| `ProgressRecord` | `progress` | derivado ao encerrar a sessão (maior carga, volume, e1RM de tendência) |
| `RecoveryCheckIn` | `checkins` | um por dia |
| `DayLog` | `dayLogs` | descanso / não consegui / adiado |
| `BodyWeightEntry` | `bodyWeights` | opcional |

**Integridade referencial:** sessões referenciam `planId` e `templateId`, que nunca são apagados enquanto houver sessões. A importação de backup recusa arquivos com referências quebradas. Como cada sessão guarda um *snapshot* do exercício, o histórico continua legível mesmo se a biblioteca mudar.

**Migrações:** `ForjaDB` usa `this.version(n).stores(...)`. Para mudar o esquema, crie `version(n+1)` com `.upgrade(tx => ...)` transformando os dados existentes. `SCHEMA_VERSION` vai no backup; backups de versões mais novas são recusados.

## Preparação para SwiftUI

- `domain/types.ts` mapeia diretamente para `struct`s `Codable`.
- `engine/` não depende de DOM, React ou IndexedDB: pode ser portado função por função para Swift (ou executado via JavaScriptCore). Os testes unitários servem como especificação.
- O backup JSON é o formato de migração entre o PWA e uma futura versão nativa.
