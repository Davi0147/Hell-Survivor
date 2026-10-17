# Livro de Anotações & Status do Projeto — Hell Survivor

> **📌 Regras Obrigatórias do Projeto (`Sandbox-First`, `Showroom-First`, `Level-Editor-First`):**
> Todas as regras invioláveis de desenvolvimento e manutenção foram movidas e consolidadas em **[`AGENTS.md`](AGENTS.md)**.
> Consulte também: **[`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)** | **[`docs/MECHANICS.md`](docs/MECHANICS.md)** | **[`docs/CHANGELOG.md`](docs/CHANGELOG.md)**.

---

## 📊 1. O Que Já Existe e Está Implementado (`[x]`)

### 1.1. Fundação, Heroína Nixy, Cenas de Morte e Revival (`Concluído ✅`)
- [x] **Movimentação 8-Way & Estamina (`BaseCharacter.ts`, `Nixy.ts`):** Vetor normalizado nas 8 direções (`N, NE, E, SE, S, SW, W, NW`), Full Sprint com rastro fantasma (`createSprintGhost`) e regeneração diferenciada andando/parada.
- [x] **Animação de Morte & Ressurreição (`Nixy.ts`, `GameScene.ts`, `UIScene.ts`):** Sequência dramática `nixy-death-anim`, modal de Game Over e botão **Ressurgir das Cinzas** (quando a bênção *Pacto Demoníaco* está ativa), reiniciando com ciclo físico limpo (`physics.resume()`).
- [x] **Câmera & Arena (`balance.ts`, `GameScene.ts`):** Arena delimitada de `6400x6400` (`-3200` a `+3200`), câmera pixel-perfect (`2.0x` em exploração/combate normal e abertura suave para `1.35x` na luta contra Azazel).

### 1.2. Arsenal Completo (6 Armas + 6 Evoluções Supremas) & Cartas Arcanas (`Concluído ✅`)
- [x] **Disparo de Almas (`SoulBoltWeapon`)** → Evolui no Altar para **Raio do Apocalipse**.
- [x] **Lâminas Orbitais (`VoidScythesWeapon`)** → Evolui no Altar para **Ceifadora do Vazio**.
- [x] **Chamas do Purgatório (`HellfireAuraWeapon`)** → Evolui no Altar para **Supernova Abissal**.
- [x] **Adagas de Sangue (`BloodDaggersWeapon` + `Adaga.png`)** → Evolui no Altar para **Chuva de Mil Lâminas**.
- [x] **Cadeias Abissais (`AbyssalChainsWeapon` com Stun)** → Evolui no Altar para **Prisão de Tártaro**.
- [x] **Meteoro Infernal (`InfernalMeteorWeapon` + `Meteoro.png`)** → Evolui no Altar para **Cataclismo Estelar**.
- [x] **Habilidade Suprema (`UltimateSystem.ts`):** *Julgamento do Caos* (`[E]`).
- [x] **Cartas Arcanas (`UpgradeScene.ts`):** 8 molduras temáticas pixel-art (`Gold`, `Mystic`, `Fire`, `Inferno`, `Green`, `Ice`, `Obsidian`, `Base`), fonte `Pixelzone`, destaque colorido de palavras-chave, botões de **Reroll** e **Skip (+20 HP)**.

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
- [x] **Elenco de Inimigos Atuais (`src/entities/enemies/`):**
  - Cão Zumbi (`ZombieDog`) + Variante Alfa Elite;
  - Morcego de Sangue (`BloodBat`);
  - Skull Slime (`SkullSlime`);
  - Múmia do Abismo (`MummyEnemy` — movimento em zigue-zague, poças de veneno com lentidão de `-40%` e knockback no contato);
  - Succubus Menor (`Succubus`).
- [x] **Escalonamento Progressivo Oficial (`getEnemyScaling` em `src/config/balance.ts`):**
  - **Vida (HP):** `+12%/min` no Modo História | `+16%/min` no Modo Infinito;
  - **Dano:** `+6%/min` no Modo História | `+8%/min` no Modo Infinito;
  - **Velocidade:** `+2%/min` (limitado ao teto máximo de `+30%` / `1.30x`).
- [x] **Limites Rígidos e Viewport Culling (`PERFORMANCE_LIMITS`):**
  - Máximo de `120` inimigos ativos simultâneos e `150` gemas no chão (com fusão de gemas excedentes e culling fora da `camera.worldView + 100px`).

### 1.5. Fase 4 — Capítulos 1 e 2, Chefes, Visual Novel e Dimensão de Azazel (`Concluído ✅`)
- [x] **Capítulo 1 & Chefe Succubus Imperial (Imperatriz Rosalin — `SuccubusBoss.ts`):**
  - Meta de `900` almas para ativar o `BossSummonAltar`;
  - Ataques telegrafados: Investida Rápida, Salva de Orbes Sombrios e Salto Aéreo Esmagador (`3.6s` de carga).
- [x] **Capítulo 2 & Chefe Azazel, O Anjo Caído (`AzazelBoss.ts` + `AzazelCrystal.ts`):**
  - Meta de `1.350` almas no Capítulo 2 para ativar o Altar de Invocação de Azazel;
  - **Trilha Musical Sincronizada em 3 Partes (`SoundManager.ts`):** `intro.mp3` (loop durante o diálogo inicial, aguarda o término do último compasso) → `mid.mp3` (2 segundos com pose de mão erguida e grito *"SUA ALMA É MINHA!"*) → `fight.mp3` (loop de combate com abertura de câmera para `1.35x`);
  - **Fase 1 (100% → 50% HP):** Arena delimitada (`750px`), teleporte, investida telegrafada, tempestade de raios (`1.0s` de aviso no chão) e barragem espiral;
  - **Fase 2 (50% → 20% HP — *"AQUI É O MEU MUNDO"*):** Domínio da Escuridão Total (HUD oculta, música amplificada), alternando 5 investidas rápidas no escuro e 8 clones espectrais (`AzazelPhantomClone`) ao redor da Nixy que compartilham a vida do chefe;
  - **Fase 3 (20% HP — *"SUA POBRE ALMA FRÁGIL NÃO ENCONTRARÁ PAZ"*):** Banimento para a Dimensão Abissal (mapa `202` com textura `floor-tile-2` / `chao2`), enxame de monstros e **3 Cristais de Azazel** gerados em locais aleatórios (captura de `5s` cada);
  - **Fase 4 (20% → 0% HP):** Retorno após destruir os 3 cristais para o confronto final enfurecido.
- [x] **Modo Visual Novel (`IntroScene.ts`, `Chapter1EndScene.ts`, `DialogueSystem.ts`):**
  - Cenas ilustradas de abertura e encerramento de capítulos (Cap. 1 Rosalin e Cap. 2 Azazel), corte interativo de lâmina na tela (`Slash Cut`), bustos `420x420` / `430x430` e destaque dourado automático para `[CENSURADO]`.

### 1.6. Ferramental In-Game: Sandbox, Galeria Showroom, Editor de Mapas e Bot IA (`Concluído ✅`)
- [x] **Painel Sandbox (`DevSandboxPanel.ts` — `[F1]`):** 5 abas completas para cheats, spawn de hordas/chefes (Rosalin e Azazel), controle das 6 armas/evoluções, bênçãos/itens, teleporte para a Sala de Teste, abertura do Editor de Mapas e exportação do `DebugSessionLogger`.
- [x] **Área de Teste / Galeria Showroom (`TestShowroomSystem.ts`):** Sala isolada em `(0, -20000)` fora da arena com todos os sprites, props, itens, armas, projéteis, inimigos, chefes e molduras de cartas lado a lado em escala real.
- [x] **Editor de Mapas In-Game (`MapEditorSystem.ts` & `mapData.ts`):**
  - 4 abas organizadas (`Estruturas & Altares`, `Cenário & Props`, `Textura do Chão`, `Checklist Obrigatório`);
  - Limites estritos (1 Spawn da Nixy, 1 Altar de Chefe contextual ao capítulo, apenas `altar-1` para Ascensão, Cristais de Azazel restritos à boss fight);
  - Seletor em tempo real de textura do chão (`floor-tile` vs `floor-tile-2`) e exportação/importação JSON.
- [x] **Bot Autônomo de Testes (`AutoPlayTestAgent.ts` — `[F3]`):** Joga sozinho com kiting, captura de altares/cristais e escolha automática de upgrades.

### 1.7. Acessibilidade Multiplataforma (`Concluído ✅`)
- [x] **Controles Mobile (`TouchControls.ts`):** Joystick virtual flutuante/fixo à esquerda e botões de Sprint, Ultimate e Pausa à direita.
- [x] **Suporte a Gamepad (`GamepadManager.ts`):** Movimentação analógica, gatilhos de Sprint/Ultimate e navegação completa por botões em todos os menus e cenas de diálogo.

---

## ⏳ 2. O Que Está Pendente (`[ ]`)

### 2.1. Roteiro de Blindagem Arquitetural e Qualidade (Em Execução)
- [x] **Pacote 0:** Baseline Git (`baseline-pre-refactor`), `AGENTS.md`, `docs/ARCHITECTURE.md`, `docs/MECHANICS.md`, `docs/CHANGELOG.md` e atualização deste Livro de Status.
- [ ] **Pacote 1:** Rede de segurança com `npm run check` (`tsc --noEmit` + `eslint` + `vitest`) e testes unitários de lógica pura (`getEnemyScaling`, `MetaProgressManager`, validador de mapas).
- [ ] **Pacote 2:** Correções pontuais (`Nixy.ts` timers no topo + prioridade única de `tint` + object pool do Ghost Trail; `mapData.ts` versionamento com backup + `Record` + limpeza de props duplicados; `MetaProgressManager` `saveVersion` + filtro de modo em `recordRun`; `CHAPTER_CONFIG` e `STORAGE_KEYS` em `balance.ts`).
- [ ] **Pacote 3:** Modularização segura da `GameScene.ts` (`SandboxController` → `CombatBubbleSystem` → `ArenaScenerySystem`) e tipagem forte no lugar de `any`.
- [ ] **Pacote 4:** Refatoração interna do `SoundManager.ts` (`playTone`/`playNoise`, `BGM_TRACKS`, limite de vozes/cooldown de horda, remoção de `window.setTimeout` e divisão interna mantendo a fachada pública).

### 2.2. Expansões Futuras de Gameplay (Backlog)
- [ ] **Novos Inimigos da Fase 3:** *Cultista Arcano* (artilheiro à distância) e *Brutamonte das Profundezas* (tanque com resistência a knockback).
- [ ] **Eventos Dinâmicos de Horda:** Cerco circular e ondas de emboscada em minutos específicos.
- [ ] **Sistema de Conquistas In-Game (Achievements):** Notificações estilo arcade aproveitando os dados de `MetaProgressManager.stats`.
- [ ] **Capítulo 3:** Novo bioma, chefe inédito e continuação da campanha.

---

## 🏛️ 3. Decisões Técnicas e de Design Tomadas (ADR)
1. **Pacto Demoníaco com Nível Único (`maxLevel: 1`):** Intencional para limitar a ressurreição a no máximo 1 por partida, mantendo a tensão dos confrontos contra chefes.
2. **Reembolso de Bênçãos Fixado em 70%:** Intencional para permitir experimentar builds no Altar de Bênçãos com custo estratégico (`Math.floor(totalSpent * 0.70)`).
3. **Sala de Teste Isolada em `Y = -20000`:** Posicionada longe da arena (`-3200..3200`) para que os manequins e efeitos visuais nunca interfiram no minimapa, na câmera ou no auto-aim durante a partida.
4. **Cristais de Azazel Exclusivos da Boss Fight:** Não aparecem na paleta do Editor de Mapas porque são instanciados dinamicamente em 3 coordenadas aleatórias apenas durante a Fase 3 do Azazel.
5. **Abertura de Câmera no Azazel (`Zoom 1.35x`):** A câmera abre de `2.0x` para `1.35x` após o diálogo inicial do Azazel para garantir visibilidade justa das linhas de investida, relâmpagos e clones espectrais.
