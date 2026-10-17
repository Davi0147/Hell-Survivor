# Changelog — Hell Survivor (`docs/CHANGELOG.md`)

Todas as mudanças relevantes, pacotes de refatoração, correções de bugs e novas funcionalidades deste projeto são documentadas neste arquivo.

---

## [Pacote 0.5 — Refinamento de Documentação & Alinhamento com Código Real] — 2026-10-17
### Corrigido
- Corrigida referência de propriedade de mapas em `docs/MECHANICS.md`: `itemSpawners` (e não `itemSpawns`).
- Corrigidos nomes reais de métodos de áudio de diálogo no `SoundManager`: `playDialogueVoice(speaker)` e `playDialogueTypewriter(char)`.
- Documentado o comportamento real dos Cristais de Azazel (geração dinâmica em 3 pontos aleatórios ao redor da heroína na Fase 3) e identificado que `azazelCrystals` em `DEFAULT_AZAZEL_DIM_MAP` é dado morto na configuração.
- Esclarecida a mecânica de geração de altares (Altar de Ascensão `EvolutionAltar` surge dinamicamente por timer na `GameScene`; props `altar-1` no mapa são meras imagens decorativas de cenário).
- Removidos números mágicos de balanceamento hardcoded em `docs/MECHANICS.md` e `docs/ARCHITECTURE.md`, apontando para suas constantes em `src/config/balance.ts`.

### Atualizado
- `AGENTS.md` fortalecido com regras adicionais: proibição de novo `any`, honestidade de testes (não simular aprovação), preservação de integridade do Git (proibido force push/tag -f/reset hard), protocolo obrigatório de leitura no início de cada sessão e marcação explícita de `CHAPTER_CONFIG`, `STORAGE_KEYS` e `theme.ts` como *(a criar no Pacote 2)*.
- `LIVRO_DE_ANOTACOES.md` enriquecido com a restauração de detalhes úteis das 5 abas do Sandbox, efeitos visuais/sonoros de cartas arcanas e scripts de inicialização `.bat`.
- `docs/DEVELOPMENT_RULES.md` anotado com aviso de consolidação unificada em `AGENTS.md`.

---

## [Pacote 0 — Baseline & Documentação Arquitetural] — 2026-10-17
### Adicionado
- Criada tag de segurança `baseline-pre-refactor` e branch dedicada `refactor/blindagem`.
- Criado [`docs/ARCHITECTURE.md`](ARCHITECTURE.md) com o mapa real de cenas, entidades, sistemas e fluxo de chamadas.
- Criado [`docs/MECHANICS.md`](MECHANICS.md) com os contratos técnicos reais de Armas, Inimigos, Chefes, Altares, Mapas e Cenas de Visual Novel.
- Criado [`docs/CHANGELOG.md`](CHANGELOG.md) para rastreamento histórico entre sessões.

### Atualizado
- Reestruturado [`AGENTS.md`](../AGENTS.md) com regras curtas, numeradas e verificáveis (incluindo Regra de Ouro Ampliada `Sandbox-First` + `Showroom-First` + `Level-Editor-First`, regras de `balance.ts`, `theme.ts`, timers do Phaser, `STORAGE_KEYS` e Definição de Pronto).
- Atualizado [`LIVRO_DE_ANOTACOES.md`](../LIVRO_DE_ANOTACOES.md) como documento fiel de **Status do Projeto**, corrigindo os valores de escalonamento (`+12%/+16%` HP, `+6%/+8%` Dano, `+2%` Vel até `+30%`) e marcando como implementadas a Fase 2 (`MetaProgressManager`), Fase 4 (Capítulo 2, Azazel, Dimensão `202`, Editor de Mapas, Showroom, Visual Novel, Revival) e Controles Mobile/Gamepad.
- Atualizado [`.gitignore`](../.gitignore) para ignorar diretórios temporários `backup_*/` e `scratch/`.

---

## [v0.8.1 — Correções de Revival/Cristais, Editor de Mapas em Abas & Polish do Azazel] — 2026-10-17 (`0686080`)
### Corrigido
- Corrigido congelamento físico ao clicar em *"Ressurgir das Cinzas"* no Capítulo 2 garantindo `this.physics.resume()` e `resetKeys()` na inicialização da `GameScene`.
- Corrigido erro `Cannot read properties of undefined (reading 'cameras')` ao capturar o 3º Cristal de Azazel validando a câmera antes da emissão de `'crystal-completed'`.

### Melhorado
- Reformulado `MapEditorSystem.ts` com 4 abas temáticas (`Estruturas & Altares`, `Cenário & Props`, `Textura do Chão`, `Checklist Obrigatório`), limite de 1 Altar de Chefe contextual ao capítulo e seletor de piso ao vivo (`floor-tile` / `floor-tile-2`).
- Ajustado zoom da câmera na luta contra Azazel (`2.0x` → `1.35x` após o diálogo inicial) e aumentado o volume das faixas `intro.mp3`, `mid.mp3` e `fight.mp3`.
- Removido fundo retangular das frases centrais de chefe (`UIScene.showCenterBossPhrase`), aplicando efeito de impacto em escala e partículas.

---

## [v0.8.0 — Capítulo 2 & Boss Fight Azazel em 3 Fases] — 2026-10-17 (`ba86b0a`)
### Adicionado
- Implementado o **Capítulo 2** e o chefe **Azazel, O Anjo Caído** (`AzazelBoss.ts`) com sincronia musical em 3 partes (`intro.mp3` → `mid.mp3` → `fight.mp3`).
- Implementado o **Domínio da Escuridão** (Fase 2 do Azazel aos 50% HP) com 5 investidas telegrafadas no escuro e 8 clones espectrais (`AzazelPhantomClone`) compartilhando vida.
- Implementado o **Banimento Dimensional** (Fase 3 do Azazel aos 20% HP) para o mapa `202` (`floor-tile-2`) com captura de 3 `AzazelCrystal` em posições aleatórias.
- Adicionada cena narrativa pós-chefe para o Capítulo 2 em `Chapter1EndScene.ts`.

---

## [v0.7.5 — Editor de Mapas In-Game & Galeria Showroom] — 2026-10-17 (`ba0ba77`, `2b5a316`, `115c61e`)
### Adicionado
- Criado `TestShowroomSystem.ts`: Galeria Showroom isolada em `(0, -20000)` exibindo todos os sprites do jogo organizados por categoria.
- Criado `MapEditorSystem.ts` e `mapData.ts`: Editor de fases in-game com câmera livre, exportação/importação JSON e persistência em `localStorage`.

---

## [v0.6.0 a v0.7.0 — Meta-Progressão, Cartas Arcanas, Múmia, Bot IA & Mobile/Gamepad] — 2026-10-16
### Adicionado
- Implementado `MetaProgressManager.ts` com Almas Corrompidas, Altar de Bênçãos Permanentes (6 bênçãos), reembolso de 70% e estatísticas.
- Implementadas as 6 armas completas e suas 6 Evoluções Supremas via `EvolutionAltar.ts`, além do `BossSummonAltar.ts`.
- Adicionado `MummyEnemy.ts`, `AutoPlayTestAgent.ts` (`[F3]`), `DevSandboxPanel.ts` (`[F1]`), `DebugSessionLogger.ts`, `TouchControls.ts` e `GamepadManager.ts`.
