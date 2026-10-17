# Changelog — Hell Survivor (`docs/CHANGELOG.md`)

Todas as mudanças relevantes, pacotes de refatoração, correções de bugs e novas funcionalidades deste projeto são documentadas neste arquivo.

---

## [Pacote 0.6 — Correções Finas de Documentação & Alinhamento Estrito] — 2026-10-17
### Corrigido
- Documentada a estrutura real de **4 Fases de Combate** de Azazel com citação de linhas verificadas em `AzazelBoss.ts` (L412, L898, L1187, L1240, L1300, L1311) e `GameScene.ts` (L3041–3113).
- Recontagem exata de spawners e altares nos mapas em `mapData.ts`: Cap. 1 (4 spawners, 0 altar-1), Cap. 2 (17 spawners, 2 altar-1 decorativos), Dimensão 202 (2 spawners, 0 altar-1).
- Checklist oficial do validador atualizado para diferenciar mapas de capítulo regular (Cap. 1 e Cap. 2) de arenas fechadas de boss (Cap. 202).
- Comentado campo morto `azazelCrystals` em `src/config/mapData.ts` como `@deprecated` (única linha em `src/` tocada).
- ADRs em `LIVRO_DE_ANOTACOES.md` atualizados para manter como decisão apenas fatos comprovados no código (reembolso de 70%) e marcar itens não confirmados como `(proposta — aguardando confirmação do dono)`.
- `docs/DEVELOPMENT_RULES.md` transformado em redirecionamento curto para `AGENTS.md`.

### Atualizado
- `AGENTS.md`: flexibilizado para "um commit por tarefa", autorizadas as `devDependencies` estritamente necessárias para o Pacote 1 (`vitest`, `eslint`, `typescript-eslint`, `@eslint/js`, `globals`) e adicionada a regra obrigatória de nunca corrigir bugs fora de escopo silenciosamente (sempre reportar no relatório).

---

## [Pacote 0.5 — Refinamento de Documentação & Alinhamento com Código Real] — 2026-10-17 (`5da23d1`)
### Corrigido
- Corrigida referência de propriedade de mapas em `docs/MECHANICS.md`: `itemSpawners` (e não `itemSpawns`).
- Corrigidos nomes reais de métodos de áudio de diálogo no `SoundManager`: `playDialogueVoice(speaker)` e `playDialogueTypewriter(char)`.
- Documentado o comportamento real dos Cristais de Azazel (geração dinâmica em 3 pontos aleatórios ao redor da heroína na Fase 3).
- Esclarecida a mecânica de geração de altares (`EvolutionAltar` surge por timer procedural na `GameScene`).
- Removidos números mágicos de balanceamento hardcoded em `docs/MECHANICS.md` e `docs/ARCHITECTURE.md`.

---

## [Pacote 0 — Baseline & Documentação Arquitetural] — 2026-10-17 (`ad5a804`)
### Adicionado
- Criada tag de segurança `baseline-pre-refactor` e branch dedicada `refactor/blindagem`.
- Criado [`docs/ARCHITECTURE.md`](ARCHITECTURE.md) com o mapa real de cenas, entidades, sistemas e fluxo de chamadas.
- Criado [`docs/MECHANICS.md`](MECHANICS.md) com os contratos técnicos reais de Armas, Inimigos, Chefes, Altares, Mapas e Cenas de Visual Novel.
- Criado [`docs/CHANGELOG.md`](CHANGELOG.md) para rastreamento histórico entre sessões.

---

## [v0.8.1 — Correções de Revival/Cristais, Editor de Mapas em Abas & Polish do Azazel] — 2026-10-17 (`0686080`)
### Corrigido
- Corrigido congelamento físico ao clicar em *"Ressurgir das Cinzas"* no Capítulo 2 garantindo `this.physics.resume()` e `resetKeys()` na inicialização da `GameScene`.
- Corrigido erro `Cannot read properties of undefined (reading 'cameras')` ao capturar o 3º Cristal de Azazel validando a câmera antes da emissão de `'crystal-completed'`.

### Melhorado
- Reformulado `MapEditorSystem.ts` com 4 abas temáticas, limite de 1 Altar de Chefe contextual ao capítulo e seletor de piso ao vivo (`floor-tile` / `floor-tile-2`).
- Ajustado zoom da câmera na luta contra Azazel (`2.0x` → `1.35x` após o diálogo inicial) e aumentado o volume das faixas de combate.
- Removido fundo retangular das frases centrais de chefe (`UIScene.showCenterBossPhrase`).

---

## [v0.8.0 — Capítulo 2 & Boss Fight Azazel em 4 Fases de Combate] — 2026-10-17 (`ba86b0a`)
### Adicionado
- Implementado o **Capítulo 2** e o chefe **Azazel, O Anjo Caído** (`AzazelBoss.ts`) com sincronia musical em 3 partes (`intro.mp3` → `mid.mp3` → `fight.mp3`).
- Implementado o **Domínio da Escuridão** (Fase 2 do Azazel aos 50% HP) com 5 investidas telegrafadas no escuro e 8 clones espectrais (`AzazelPhantomClone`) compartilhando vida.
- Implementado o **Banimento Dimensional** (Fase 3 do Azazel aos 20% HP) para o mapa `202` (`floor-tile-2`) com captura de 3 `AzazelCrystal` gerados dinamicamente.
- Adicionada cena narrativa pós-chefe para o Capítulo 2 em `Chapter1EndScene.ts`.

---

## [v0.7.5 — Editor de Mapas In-Game & Galeria Showroom] — 2026-10-17 (`ba0ba77`, `2b5a316`, `115c61e`)
### Adicionado
- Criado `TestShowroomSystem.ts`: Galeria Showroom isolada em `(0, -20000)` exibindo todos os sprites do jogo organizados por categoria.
- Criado `MapEditorSystem.ts` e `mapData.ts`: Editor de fases in-game com câmera livre, exportação/importação JSON e persistência em `localStorage`.

---

## [v0.6.0 a v0.7.0 — Meta-Progressão, Cartas Arcanas, Múmia, Bot IA & Mobile/Gamepad] — 2026-10-16 (`1f5a819`, `6100035`, `68dadaa`, `bb970f2`)
### Adicionado
- Implementado `MetaProgressManager.ts` com Almas Corrompidas, Altar de Bênçãos Permanentes (6 bênçãos), reembolso de 70% e estatísticas.
- Implementadas as 6 armas completas e suas 6 Evoluções Supremas via `EvolutionAltar.ts`, além do `BossSummonAltar.ts`.
- Adicionado `MummyEnemy.ts`, `AutoPlayTestAgent.ts` (`[F3]`), `DevSandboxPanel.ts` (`[F1]`), `DebugSessionLogger.ts`, `TouchControls.ts` e `GamepadManager.ts`.
