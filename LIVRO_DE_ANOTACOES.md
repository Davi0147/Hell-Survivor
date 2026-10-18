# Livro de Anotações & Status do Projeto — Hell Survivor

> **📌 Regras Obrigatórias do Projeto (`Sandbox-First`, `Showroom-First`, `Level-Editor-First`):**
> Todas as regras invioláveis de desenvolvimento e manutenção foram consolidadas em **[`AGENTS.md`](AGENTS.md)**.
> Documentos de arquitetura e contratos: **[`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)** | **[`docs/MECHANICS.md`](docs/MECHANICS.md)** | **[`docs/CHANGELOG.md`](docs/CHANGELOG.md)**.

---

## 📊 1. O Que Já Existe e Está Implementado (`[x]`)

### 1.1. Fundação, Heroína Nixy, Cenas de Morte e Revival (`Concluído ✅`)
- [x] **Movimentação 8-Way & Estamina (`BaseCharacter.ts`, `Nixy.ts`):** Vetor normalizado nas 8 direções (`N, NE, E, SE, S, SW, W, NW`), Full Sprint com rastro fantasma (`createSprintGhost`) e regeneração diferenciada andando/parada.
- [x] **Animação de Morte & Ressurreição (`Nixy.ts`, `GameScene.ts`, `UIScene.ts`):** Sequência dramática `nixy-death-anim`, modal de Game Over e botão **Ressurgir das Cinzas** (quando a bênção *Pacto Demoníaco* está ativa), reiniciando com ciclo físico limpo (`physics.resume()`).
- [x] **Câmera & Arena (`balance.ts`, `GameScene.ts`):** Arena delimitada finita de `6400x6400` (`-3200` a `+3200`), câmera pixel-perfect com zoom de exploração normal e abertura suave para `1.35x` na luta contra Azazel.

### 1.2. Arsenal Completo (6 Armas + 6 Evoluções Supremas) & Sistema de Cartas Arcanas (`Concluído ✅`)
- [x] **Disparo de Almas (`SoulBoltWeapon`)** → Evolui no Altar para **Raio do Apocalipse**.
- [x] **Lâminas Orbitais (`VoidScythesWeapon`)** → Evolui no Altar para **Ceifadora do Vazio**.
- [x] **Chamas do Purgatório (`HellfireAuraWeapon`)** → Evolui no Altar para **Supernova Abissal**.
- [x] **Adagas de Sangue (`BloodDaggersWeapon` + `Adaga.png` com rastro carmesim)** → Evolui no Altar para **Chuva de Mil Lâminas**.
- [x] **Cadeias Abissais (`AbyssalChainsWeapon` com Stun e correntes)** → Evolui no Altar para **Prisão de Tártaro**.
- [x] **Meteoro Infernal (`InfernalMeteorWeapon` + `Meteoro.png` com cauda de fogo e rotação)** → Evolui no Altar para **Cataclismo Estelar**.
- [x] **Habilidade Suprema (`UltimateSystem.ts`):** *Julgamento do Caos* (`[E]`).
- [x] **Novo Sistema de Cartas Arcanas (`UpgradeScene.ts` & Fonte `Pixelzone`):**
  - 8 molduras temáticas oficiais em pixel-art escaladas: *Gold, Mystic, Fire, Inferno, Green, Ice, Obsidian, Base*, atribuídas de acordo com o elemento e raridade de cada bênção/arma.
  - Tipografia oficial `Pixelzone.ttf` com trava geométrica horizontal rígida (`SAFE_INNER_WIDTH = 134px`), garantindo que Raridade/Nome fiquem na janela superior e a descrição na janela inferior sem invadir os ossos da moldura.
  - Palavras-chave semânticas multicoloridas: **Armas/Habilidades** em Roxo (`#9b5de5`), **Dano** em Vermelho (`#ff3333`), **Vida/Cura/Regen** em Verde (`#2ecc71`), **Velocidade/Controle** em Azul Ciano (`#38bdf8`) e **Utilidade/Projéteis** em Dourado (`#fbbf24`).
  - Efeitos visuais: flutuação contínua em onda senoidal, brilho traseiro concêntrico ao passar o mouse (`Back-Glow`), queda suave das cartas recusadas e explosão de 40+ partículas e ondas de choque na carta escolhida.
  - Efeitos sonoros temáticos de Arcade/Cassino: `playCasinoLevelUp()`, `playCardHover()` e som de caixa registradora/moedas `playCardCashSelect()`.
  - Mecânicas táticas de Level Up: botão de **Reroll** (sorteia 3 novas cartas, gastando carga da partida) e botão de **Skip** (descarta com cura emergencial de +20 HP).

### 1.3. Fase 2 — Meta-Progressão Permanente & Economia (`MetaProgressManager.ts` — `Concluído ✅`)
- [x] **Moeda Persistente (`CorruptedSoulItem.ts`):** Almas Corrompidas coletadas durante a partida (`runSoulsCollected`) e salvas automaticamente no `localStorage` ao encerrar a run ou fechar a aba (`beforeunload`).
- [x] **Altar de Bênçãos Permanentes (`MenuScene.ts` + `BLESSINGS_CATALOG`):**
  - *Vitalidade Abissal* (`vitality`, até Nív. 5: `+12 HP Máx` por nível);
  - *Fúria Sombria* (`might`, até Nív. 5: `+5% Dano Global` por nível);
  - *Atração Etérea* (`magnetism`, até Nív. 5: `+15% Raio de Coleta` por nível);
  - *Passo Fantasma* (`agility`, até Nív. 5: `+4% Vel / +10 Estamina` por nível);
  - *Sorte do Destino* (`reroll`, até Nív. 3: `+1 Reroll` por nível);
  - *Pacto Demoníaco* (`revival`, Nív. único: `+1 Ressurreição` por partida).
- [x] **Sistema de Reembolso (`refundBlessings`):** Devolve estritamente **70%** do total de almas investidas (`Math.floor(totalSpent * 0.70)`).
- [x] **Estatísticas Persistentes (`MetaSaveData.stats`):** Registra `totalKills`, `totalRuns`, `highestEndlessTimeSec`, `bossesDefeated`, `totalSoulsCollected`, `storyDeathCount` e `bossDeaths`.

### 1.4. Inimigos, Escalonamento e Otimização de Performance (`Concluído ✅`)
- [x] **Elenco de Inimigos e Minichefes Atuais (`src/entities/enemies/` e `GameScene.ts`):**
  - Cão Zumbi (`ZombieDog`) + Variante Alfa Elite (apenas Infinito $\ge$2 min);
  - Morcego de Sangue (`BloodBat`);
  - Skull Slime (`SkullSlime`);
  - Múmia do Abismo (`MummyEnemy` — movimentação em zigue-zague, poças de veneno tóxico com lentidão de `-40%` e dano periódico que duram 5 segundos após a morte da múmia, além de knockback no contato);
  - Succubus Menor (`Succubus` — código morto em `src/entities/enemies/Succubus.ts`, nunca instanciado na cena);
  - Titã Cerberus (minichefe do Infinito aos 3 min — sprite de `ZombieDog`, 1400 HP, vel 95, dano 20 fixos);
  - Matriarca Succubus (minichefe do Infinito aos 6 min — sprite de `SuccubusBoss`, 2400 HP, vel 115, dano 24 fixos).
- [x] **Realidade do Escalonamento no Código vs Testes Unitários:**
  - `getEnemyScaling(survivalTimeMs, isEndless)` em `src/config/balance.ts`: calcula HP (+12% hist / +16% inf por min), Dano (+6% hist / +8% inf por min) e Velocidade (+2%/min até teto de 1.30x).
  - **Inimigos que realmente usam `getEnemyScaling` e `getChapterEnemyStatMultiplier()`:** `ZombieDog` (comum e Alfa) e `MummyEnemy`.
  - **Inimigos que usam fórmulas lineares inline próprias:** `BloodBat` (HP `(14 + (isEndless ? min*3 : 0))*chMult`, Vel `155 + (isEndless ? min*5 : 0)`, Dano `5*chMult`) e `SkullSlime` (HP `(160 + (isEndless ? min*30 : 0))*chMult`, Vel fixa `46`, Dano `10*chMult`).
  - **Minichefes que usam literais fixos:** Cerberus (1400/95/20) e Matriarca (2400/115/24) não usam scaling nem multiplicador de capítulo.
  - **Proteção de Testes:** `src/__tests__/scaling.test.ts` protege **exclusivamente** `ZombieDog` e `MummyEnemy`.
  - > **Decisão do dono:** manter comportamento atual ou unificar em `getEnemyScaling` no futuro.
- [x] **Limites Rígidos e Viewport Culling (`PERFORMANCE_LIMITS`):**
  - Máximo de `120` inimigos ativos simultâneos e `150` gemas no chão (com fusão de gemas excedentes e culling fora da `camera.worldView + 100px`).

### 1.5. Fase 4 — Capítulos 1 e 2, Chefes, Visual Novel e Dimensão de Azazel (`Concluído ✅`)
- [x] **Capítulo 1 & Chefe Succubus Imperial (Imperatriz Rosalin — `SuccubusBoss.ts`):**
  - Meta de `900` almas para ativar o `BossSummonAltar`;
  - Ataques telegrafados: Investida Rápida, Salva de Orbes Sombrios e Salto Aéreo Esmagador (`3.6s` de carga).
- [x] **Capítulo 2 & Chefe Azazel, O Anjo Caído (`AzazelBoss.ts` + `AzazelCrystal.ts`):**
  - Meta de `1.350` almas no Capítulo 2 para ativar o Altar de Invocação de Azazel;
  - **Trilha Musical Sincronizada em 3 Partes (`SoundManager.ts`):** `intro.mp3` (loop durante o diálogo inicial, aguarda o término do último compasso) → `mid.mp3` (2 segundos com pose de mão erguida e grito *"SUA ALMA É MINHA!"*) → `fight.mp3` (loop de combate com abertura de câmera para `1.35x`);
  - **Fase 1 (100% → 50% HP):** Arena delimitada, teleporte, investida telegrafada, tempestade de raios e barragem espiral (`AzazelBoss.ts` L412–890);
  - **Fase 2 (50% → 20% HP — *"AQUI É O MEU MUNDO"*):** Domínio da Escuridão Total (HUD oculta, música amplificada), alternando 5 investidas rápidas no escuro e 8 clones espectrais (`AzazelPhantomClone`) que compartilham vida com o chefe (`AzazelBoss.ts` L898–1180, gatilho L1300);
  - **Fase 3 (Trava aos 20% HP — *"SUA POBRE ALMA FRÁGIL NÃO ENCONTRARÁ PAZ"*):** Banimento para a Dimensão Abissal (mapa `202` com textura `floor-tile-2` / `chao2`), enxame de monstros e 3 Cristais de Azazel gerados em locais aleatórios dinâmicos enquanto Azazel fica oculto (`GameScene.ts` L3041–3090, `AzazelBoss.ts` L1187, gatilho L1311);
  - **Fase 4 (20% → 0% HP — Showdown Final):** Retorno após purificar os 3 cristais para o confronto final com velocidade ampliada (+20%) até a derrota (`GameScene.ts` L3112, `AzazelBoss.ts` L412, L1240).
- [x] **Modo Visual Novel (`IntroScene.ts`, `Chapter1EndScene.ts`, `DialogueSystem.ts`):**
  - Cenas ilustradas de abertura e encerramento de capítulos (Cap. 1 Rosalin e Cap. 2 Azazel), corte interativo de lâmina na tela (`Slash Cut`), bustos padronizados e destaque dourado automático para `[CENSURADO]`.

### 1.6. Ferramental In-Game: Sandbox, Galeria Showroom, Editor de Mapas e Scripts de Execução (`Concluído ✅`)
- [x] **Painel Sandbox Oficial (`DevSandboxPanel.ts` — atalho `[F1]`):**
  - **Barra Rápida Superior:** Exibe FPS ao vivo, contagem de entidades ativas, status do God Mode e botão de 1 clique para copiar relatório para a IA.
  - **Aba 1 (`[1] CHEATS & NIXY`):** Vida Infinita (God Mode), Ultimate Infinita, Estamina Infinita, Auto-Spawn de Hordas ON/OFF, Hitboxes Físicas ON/OFF, Velocidade do Jogo (`0.5x`, `1x`, `2x`), Level Up instantâneo, Cura completa e disparo imediato da Suprema.
  - **Aba 2 (`[2] HORDAS & BOSS`):** Invocação individual ou em horda de todos os inimigos e mini-bosses, remoção limpa de hordas e invocação/remoção de Rosalin e Azazel com transição de áudio limpa.
  - **Aba 3 (`[3] ARMAS & EVOLUÇÕES`):** Equipar, subir nível (+1 Nív), Maximizar/Evoluir (MAX / EVO) ou remover individualmente qualquer uma das 6 armas, além de botão para equipar e evoluir todas simultaneamente.
  - **Aba 4 (`[4] BÊNÇÃOS & ITENS`):** Adicionar (+) ou remover (-) níveis de todas as bênçãos passivas de run, reset de atributos e spawn imediato ao lado da heroína de Taça de Vinho (50% HP), Ímã de Gemas, Baú do Abismo, Roleta Direta ou Chuva de 20 Gemas.
  - **Aba 5 (`[5] LOGS & EXPORTAR IA`):** Gravador de Voo (`DebugSessionLogger`) com captura de erros de console, quedas de FPS, botão `[ COPIAR RELATÓRIO COMPLETO P/ IA ]` e exportação JSON.
- [x] **Área de Teste / Galeria Showroom (`TestShowroomSystem.ts`):** Sala isolada em `Y = -20000` fora da arena com todos os sprites, props, itens, armas, projéteis, inimigos, chefes e molduras de cartas lado a lado em escala real com manequins pacíficos.
- [x] **Editor de Mapas In-Game (`MapEditorSystem.ts` & `mapData.ts`):** 4 abas organizadas (`Estruturas & Altares`, `Cenário & Props`, `Textura do Chão`, `Checklist Obrigatório`), limites estritos e exportação/importação JSON.
- [x] **Script de Execução e Limpeza de Cache (`JOGAR.bat`):** Script em lote (.bat) de 1 clique que limpa o cache interno do Vite (`node_modules\.vite` e `dist`), libera a porta 3000 de instâncias residuais do node, aguarda a resposta HTTP ativa e abre o jogo automaticamente no navegador padrão via `scripts/jogar-dev.mjs`.
- [x] **Bot Autônomo de Testes (`AutoPlayTestAgent.ts` — `[F3]`):** Joga sozinho com kiting, captura de altares e escolha automática de upgrades.

### 1.7. Acessibilidade Multiplataforma (`Concluído ✅`)
- [x] **Controles Mobile (`TouchControls.ts`):** Joystick virtual flutuante/fixo à esquerda e botões ergonômicos de Sprint, Ultimate e Pausa à direita com sprites dedicados em pixel art (`Analog.png`, `Stick.png`, `Sprint.png`, `UltButton.png`, `Pause.png`), feedback tátil com compressão/tintura e pulso visual de prontidão da Suprema.
- [x] **Suporte a Gamepad (`GamepadManager.ts`):** Movimentação analógica, gatilhos de Sprint/Ultimate e navegação completa por botões em todos os menus, upgrades e cenas de diálogo.

---

## ⏳ 2. O Que Está Pendente (`[ ]`)

### 2.1. Roteiro de Blindagem Arquitetural e Qualidade (Em Execução)
- [x] **Pacote 0:** Baseline Git (`baseline-pre-refactor`), `AGENTS.md`, `docs/ARCHITECTURE.md`, `docs/MECHANICS.md`, `docs/CHANGELOG.md` e atualização deste Livro de Status.
- [x] **Pacote 0.5:** Consolidação de documentação, alinhamento estrito dos contratos com o código real e enriquecimento do histórico.
- [x] **Pacote 1:** Rede de segurança com `npm run check` (`tsc --noEmit` + `eslint` em modo catraca + `vitest`) e 21 testes unitários de lógica pura (`getEnemyScaling`, `MetaProgressManager`, validador realista de mapas `validateMap`). 19 passando, 2 falhas esperadas (`it.fails`) para bugs do Pacote 2, 0 erros no lint (214 warnings de baseline).
- [x] **Pacote 2A:** Correções pontuais seguras concluídas (Tarefa 0 a Tarefa 7: scaling docs, `storageKeys.ts`, `CHAPTER_CONFIG`, `statusEffects.ts`, object pool do Ghost Trail, versionamento e backup de mapas, migração `saveVersion` e filtro de modo no `MetaProgressManager`, e eliminação de avisos de textura no `BootScene.ts`). 43 testes unitários passando, 0 erros no lint, catraca respeitada em 214.
- [x] **Hotfix 1 (Ciclo de Vida de Cenas — commit `36a8289`):** Resolução do crash por grupo destruído em `GameScene.ts` (instanciação antecipada de `enemiesGroup`, `gemsGroup`, `soulsGroup` e `mapItemsGroup` antes de `loadCustomMapLayout`, guardas tipadas sem `any` e limpeza de estado) e correção do deadlock de input e conflito de timers em `IntroScene.ts` (método `init()`, limpeza no `SHUTDOWN` e transição imediata no ESC).
- [x] **Pacote P1.1 (Atualização Confiável e Integridade de Cache Web):** Implementação de Service Worker versionado atômico (`BUILD_ID = <sha curto> • <dd/mm hh:mm>`), segregação de estratégias de rede no SW, migração transparente do cache `v1` legado, banner de atualização seguro fora de combate com reload controlado (`SKIP_WAITING`), script de emergência `scripts/sw-killswitch.js`, verificador pós-build `scripts/verify-build.mjs`, trava de qualidade no CI (`deploy.yml`) e proposta formal DEC-007.
- [ ] **Pacote 2B:** Centralização tipográfica e semântica de cores (`theme.ts` — aguardando decisões do dono).
- [ ] **Pacote 3:** Modularização segura da `GameScene.ts` (`SandboxController` → `CombatBubbleSystem` → `ArenaScenerySystem`) e tipagem forte no lugar de `any`.
- [ ] **Pacote 4:** Refatoração interna do `SoundManager.ts` (`playTone`/`playNoise`, `BGM_TRACKS`, limite de vozes/cooldown de horda, remoção de `window.setTimeout` e divisão interna mantendo a fachada pública).

### 2.2. Expansões Futuras de Gameplay (Backlog)
- [ ] **Novos Inimigos da Fase 3:** *Cultista Arcano* (artilheiro à distância) e *Brutamonte das Profundezas* (tanque com resistência a knockback).
- [ ] **Eventos Dinâmicos de Horda:** Cerco circular e ondas de emboscada em minutos específicos.
- [ ] **Sistema de Conquistas In-Game (Achievements):** Notificações estilo arcade aproveitando os dados de `MetaProgressManager.stats`.
- [ ] **Capítulo 3:** Novo bioma, chefe inédito e continuação da campanha.

---

## 🏛️ 3. Decisões Técnicas e de Design Tomadas (ADR)
O registro formal de decisões de arquitetura e design foi migrado para [`docs/DECISIONS.md`](docs/DECISIONS.md) conforme estipulado pela Regra 12 de `AGENTS.md`. Consulte esse documento para visualizar o histórico completo de propostas e decisões aceitas.

