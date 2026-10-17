# Contratos de Mecânicas — Hell Survivor (`docs/MECHANICS.md`)

Este documento define o **contrato técnico e de design** de cada mecânica existente no **Hell Survivor**. Toda nova adição ou manutenção deve seguir estritamente os padrões já estabelecidos no código.

---

## 1. Contrato de Armas e Evoluções (`src/entities/weapons/`)

1. **Herança e Ciclo de Vida:**
   - Armas de disparo estendem [`BaseWeapon`](../src/entities/weapons/BaseWeapon.ts) (ou seguem a mesma interface `update(deltaMs, originX, originY, enemies)` no caso de armas orbitais/auras como `VoidScythesWeapon` e `HellfireAuraWeapon`).
   - A seleção de alvo (`findClosestEnemy`) **só mira em inimigos ativos, vivos (`!isDead`), não-invulneráveis (`!isInvulnerable`) e visíveis dentro da `camera.worldView`**.
2. **Progressão de Níveis (1 a 5) e Forma Evoluída (`isEvolved`):**
   - Toda arma possui níveis de `1` a `5` (escalando dano, quantidade de projéteis/alvos, alcance ou redução de recarga) e **1 Evolução Suprema** (`isEvolved: boolean`).
   - A evolução ocorre exclusivamente ao capturar um **Altar de Ascensão (`EvolutionAltar`)** quando a arma está no **Nível 5** (ou 6 lâminas no caso das Foices) e o jogador possui os **requisitos de bênçãos passivas** correspondentes.
3. **Integração com Atributos da Nixy:**
   - O cálculo de dano e disparo deve aplicar os bônus da `Nixy`: `getDamageMultiplier()` (`bonusDamagePercent`), `extraProjectiles`, `extraPierce` e acionar `player.onDealDamage()` ao acertar inimigos (para ativar o roubo de vida `lifeStealPerHit`).
4. **Feedback Visual e Sonoro:**
   - Todo impacto usa `enemy.takeDamage(damage)` (que já aciona flash branco de `80ms`, faíscas e `DamageTextSystem.showDamage()`).
   - Sons de disparo e impacto são chamados via `SoundManager.getInstance()`.
5. **Registro Obrigatório:**
   - Incluir no catálogo de cartas da `UpgradeScene.ts`, nos métodos de equipamento/evolução da `GameScene.ts`, na aba `[3] ARMAS & EVOLUÇÕES` do `DevSandboxPanel.ts`, no snapshot do `DebugSessionLogger.ts` e na seção `ARMAS & PROJÉTEIS` do `TestShowroomSystem.ts`.

---

## 2. Contrato de Inimigos Comuns e Elites (`src/entities/enemies/`)

1. **Herança e Física:**
   - Todo inimigo estende [`BaseEnemy`](../src/entities/enemies/BaseEnemy.ts) (`Phaser.Physics.Arcade.Sprite`).
   - Deve suportar object pooling/reuso através do método `spawn(x, y, hp, speed, damage)` que reativa o sprite, limpa tints (`clearTint()`), reseta `isDead = false`, `stunTimer = 0` e habilita o corpo físico (`body.enable = true`).
2. **Escalonamento e Números:**
   - Os valores base de HP, velocidade e dano são multiplicados pelo resultado de `getEnemyScaling(survivalTimeMs, isEndless)` definido em [`src/config/balance.ts`](../src/config/balance.ts):
     - **HP:** `+12%/min` (História) | `+16%/min` (Infinito)
     - **Dano:** `+6%/min` (História) | `+8%/min` (Infinito)
     - **Velocidade:** `+2%/min` (limitado a `+30%` / `1.30x`)
3. **Controle de Grupo e Feedback:**
   - Deve respeitar `updateStunState(deltaMs)` dentro de `updateEnemy(targetX, targetY, deltaMs)` para que o atordoamento das *Cadeias Abissais* (`0x9d4edd`) reduza a velocidade em `85%` (`15%` da velocidade normal).
4. **Limites de Performance:**
   - O spawn respeita `PERFORMANCE_LIMITS.MAX_ACTIVE_ENEMIES` (`120` inimigos ativos simultâneos) e passa pelo Viewport Culling da `GameScene`.

---

## 3. Contrato de Chefes de Capítulo (`SuccubusBoss`, `AzazelBoss`)

1. **Herança e Propriedades Obrigatórias:**
   - Estende `BaseEnemy` com `public isBoss: boolean = true` e `public isInvulnerable: boolean`.
   - Resistência a controle de grupo: `BaseEnemy.applyStun` reduz automaticamente a duração para `35%` e mantém `65%` da velocidade de movimento quando `isBoss === true`.
2. **Telegrafia Obrigatória de Ataques (Telegraph):**
   - Nenhum golpe especial de chefe (investida/dash, salto esmagador, relâmpagos em área, cortes no escuro) causa dano instantâneo sem aviso prévio.
   - Todo ataque forte desenha indicadores gráficos claros no chão (`Phaser.GameObjects.Graphics` com linhas direcionais ou círculos de preenchimento progressivo) com **tempo de reação justo** (mínimo de `550ms–1000ms` para dashes/raios e `3600ms` para salto aéreo) antes da janela de impacto.
3. **Fases, Transições e Sincronia Musical:**
   - Encontros no Modo História iniciam no estado `'INTRO'` (`isInvulnerable = true`, `physics.pause()` ou bloqueio de movimento) com diálogo via `DialogueSystem`.
   - Transições de fase (como os marcos de `50%` e `20%` de vida do Azazel) limpam projéteis ativos, exibem frase dramática no centro da tela via `UIScene.showCenterBossPhrase()` (sem caixa de fundo, com impacto de escala e partículas) e ajustam câmera/música via `SoundManager`.
   - Clones ou entidades secundárias que devem ser alvejadas pelas armas automáticas da Nixy (ex: `AzazelPhantomClone`) devem estender `BaseEnemy`, ser adicionados ao `enemiesGroup` da `GameScene` e redirecionar `takeDamage(amount)` para o chefe principal.
4. **Derrota e Limpeza (`cleanupGraphics`):**
   - Ao morrer, o chefe deve destruir todos os objetos gráficos auxiliares (`dashLineGraphics`, `lightningGraphics`, clones, projéteis, overlays de escuridão), restaurar o zoom da câmera (`2.0x`) e emitir `'boss-defeated'`.
   - No Modo Sandbox, derrotar ou remover o chefe restaura a música de batalha (`playBattleMusic`) sem encerrar a sessão.

---

## 4. Contrato de Altares e Objetos de Captura (`src/entities/items/`)

1. **Altar de Ascensão (`EvolutionAltar`):**
   - Usa exclusivamente o sprite inicial `altar-1` ao ser posicionado no mapa/editor. Os sprites `altar-2` (`>30%`) e `altar-3` (`>75%`) são estados internos de carregamento.
   - Captura por permanência dentro de `captureRadius = 65px` (`+15.5%/s` dentro, `-8%/s` fora), desenhando arco circular vermelho progressivo no chão. Ao atingir `100%`, emite `'altar-completed'` e se autodestrói com efeito de explosão.
2. **Altar de Invocação do Chefe (`BossSummonAltar`):**
   - **Máximo de 1 por mapa.** Vincula simultaneamente a coordenada do portal e o ponto de spawn do chefe do respectivo capítulo (Cap. 1 = Rosalin, Cap. 2 = Azazel).
   - Permanece em `altar-invoc-inactive` até que a meta de almas do capítulo atinja `100%`, quando chama `activate()`, alterna os frames `altar-invoc-active-1/2` e aguarda a aproximação da Nixy (`encounterRadius = 190px`) para emitir `'boss-summon-triggered'`.
3. **Cristais de Azazel (`AzazelCrystal`):**
   - **Não são colocáveis manualmente no Editor de Mapas.** São gerados exclusivamente de forma dinâmica em **3 posições aleatórias** da arena dimensional durante a Fase 3 da luta contra Azazel.
   - Captura em `5 segundos` (`+20%/s` dentro do `captureRadius = 75px`, `-8%/s` fora). Ao completar `100%`, executa `explodeAndDestroy()` validando `this.scene?.cameras?.main` antes de emitir `'crystal-completed'`.

---

## 5. Contrato de Capítulos e Mapas (`src/config/mapData.ts`)

1. **Estrutura de Dados (`ChapterMapConfig`):**
   - Cada mapa possui `chapter`, `name`, `version`, `floorTexture` (`'floor-tile'` ou `'floor-tile-2'`), `playerSpawn`, `bossPortal`, `bossSpawn`, `itemSpawns` e `props`.
2. **Checklist de Itens Obrigatórios de Fase (Validado no `MapEditorSystem`):**
   - Exatamente **1** `playerSpawn` (Spawn da Nixy);
   - Exatamente **1** `bossPortal` / `bossSpawn` (Altar de Invocação do Chefe do Capítulo);
   - Pelo menos **1** `altar-1` (Altar de Ascensão) em `props`;
   - Pelo menos **4** pontos em `itemSpawns` (Spawners de Item Aleatório).
   - Todas as coordenadas devem estar dentro de `ARENA_CONFIG` (`-3200` a `+3200`).
3. **Versionamento e Persistência (`MapStorageManager`):**
   - Mapas editados ficam salvos no `localStorage` por capítulo. Quando a `version` do mapa default no código for superior à `version` salva no `localStorage`, o sistema deve fazer backup do mapa custom antigo antes de adotar o novo default.

---

## 6. Contrato de Visual Novel e Diálogos (`IntroScene`, `Chapter1EndScene`, `DialogueSystem`)

1. **Bustos de Personagens (`Chat<Nome>.png`):**
   - Resolução de exibição padronizada (`420x420` no `DialogueSystem` / `IntroScene` e `430x430` na `Chapter1EndScene`), ancorados na base da tela (`origin(0.5, 1.0)`).
   - Sempre invocar `setDisplaySize(w, h)` imediatamente após qualquer `setTexture()`.
   - Animações de entrada (slide/fade) só disparam quando o lado falante muda (`left` ↔ `right`).
2. **Tipografia, Censura Dourada e Vozes:**
   - Efeito typewriter caractere por caractere com som de voz procedural (`SoundManager.playDialogueBlip(speaker)`).
   - Toda caixa de diálogo deve passar por `enableCensoredTextHighlight()` (`src/systems/TextHighlight.ts`) para destacar automaticamente `[CENSURADO]` em dourado (`#fbbf24`).
3. **Pausa de Gameplay:**
   - Enquanto um diálogo in-game (`DialogueSystem.isActive()`) estiver aberto na `GameScene`, o movimento, spawns, ataques e timers de combate ficam congelados.
