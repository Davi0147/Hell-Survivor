# Contratos de Mecânicas — Hell Survivor (`docs/MECHANICS.md`)

Este documento define o **contrato técnico e de design** de cada mecânica existente no **Hell Survivor**. Toda nova adição ou manutenção deve seguir estritamente os padrões já estabelecidos no código real.

---

## 1. Contrato de Armas e Evoluções (`src/entities/weapons/`)

1. **Herança e Ciclo de Vida:**
   - Armas de disparo estendem [`BaseWeapon`](../src/entities/weapons/BaseWeapon.ts) (ou seguem a mesma assinatura de `update(deltaMs, originX, originY, enemies)` no caso de armas orbitais/auras como `VoidScythesWeapon` e `HellfireAuraWeapon`).
   - A seleção de alvo (`findClosestEnemy`) **só mira em inimigos ativos, vivos (`!isDead`), não-invulneráveis (`!isInvulnerable`) e visíveis dentro da tela (`camera.worldView`)**.
2. **Progressão de Níveis e Forma Evoluída (`isEvolved`):**
   - Toda arma possui níveis de `1` a `5` (escalando dano, quantidade de projéteis/alvos, alcance ou redução de recarga) e **1 Evolução Suprema** (`isEvolved: boolean`).
   - A evolução ocorre exclusivamente através de um **Altar de Ascensão (`EvolutionAltar`)** quando a arma atinge o nível máximo e o jogador possui as **bênçãos passivas de sinergia** exigidas.
3. **Integração com Atributos da Nixy:**
   - O cálculo de dano e disparo aplica os bônus da `Nixy`: multiplicador de dano (`bonusDamagePercent`), projéteis extras (`extraProjectiles`), perfuração extra (`extraPierce`) e aciona `player.onDealDamage()` ao acertar inimigos (ativando o roubo de vida `lifeStealPerHit`).
4. **Feedback Visual e Sonoro:**
   - Todo impacto chama `enemy.takeDamage(damage)` (que aciona flash de impacto, faíscas e `DamageTextSystem.showDamage()`).
   - Sons de disparo e impacto são chamados via `SoundManager.getInstance()`.
5. **Registro Obrigatório:**
   - Incluir no catálogo de cartas da `UpgradeScene.ts`, na inicialização e gerenciamento de armas da `GameScene.ts`, na aba `[3] ARMAS & EVOLUÇÕES` do `DevSandboxPanel.ts`, no snapshot do `DebugSessionLogger.ts` e na seção `ARMAS & PROJÉTEIS` do `TestShowroomSystem.ts`.

---

## 2. Contrato de Inimigos Comuns, Elites e Minichefes (`src/entities/enemies/`)

1. **Herança e Física:**
   - Todo inimigo estende [`BaseEnemy`](../src/entities/enemies/BaseEnemy.ts) (`Phaser.Physics.Arcade.Sprite`).
   - Suporta reaproveitamento/pooling via método `spawn(x, y, hp, speed, damage)`, limpando tints (`clearTint()`), resetando `isDead = false`, `stunTimer = 0` e reabilitando o corpo físico (`body.enable = true`).
2. **Escalonamento e Realidade no Código (Auditoria Exaustiva dos Inimigos e Chefes):**
   - **`ZombieDog` (Comum) (`GameScene.spawnZombieDogAt` L1069-1126, `GameScene.updateHordeDirector` L1625-1627):**
     - Usa `getEnemyScaling` e `getChapterEnemyStatMultiplier()`. A função é testada em `scaling.test.ts`; o uso no spawn não é testado.
     - HP: `Math.round(28 * scaling.hpMultiplier * chMult)`.
     - Velocidade: `Math.floor(Math.min(130, 85 * scaling.speedMultiplier))`.
     - Dano: `Math.round(8 * scaling.damageMultiplier * chMult)`.
     - *História vs Infinito:* No Infinito, o escalonamento de HP (+16%/min vs +12%/min) e Dano (+8%/min vs +6%/min) é mais agressivo. No Modo História, aplica ainda o multiplicador de capítulo `chMult` (1.0 no Cap. 1, 1.2 no Cap. 2).
   - **`ZombieDog` (Alfa / Elite) (`GameScene.updateHordeDirector` L1617-1622):**
     - Surge **exclusivamente no Modo Infinito** a partir do minuto 2 (`isEndless && scaling.minutes >= 2 && Math.random() < 0.12`).
     - Usa `getEnemyScaling` e `getChapterEnemyStatMultiplier()`. A função é testada em `scaling.test.ts`; o uso no spawn não é testado.
     - HP: `Math.round(75 * scaling.hpMultiplier * chMult)`.
     - Velocidade: `Math.floor(Math.min(145, 95 * scaling.speedMultiplier))`.
     - Dano: `Math.round(14 * scaling.damageMultiplier * chMult)`.
   - **`BloodBat` (`GameScene.spawnBloodBatAt` L1199-1202, `BloodBat.ts:31`):**
     - **NÃO usa os multiplicadores de stat de `getEnemyScaling`** (apenas usa `scaling.minutes` em `GameScene.ts:1552` para tamanho do bando `flockSize`). Usa fórmula linear inline própria. Não é testado em `scaling.test.ts`.
     - HP: `Math.round((14 + (isEndless ? min * 3 : 0)) * chMult)`.
     - Velocidade: `Math.floor(155 + (isEndless ? min * 5 : 0))` (sem teto).
     - Dano: `Math.round(5 * chMult)`.
     - *História vs Infinito:* Na História, HP (14) e Velocidade (155) são fixos no tempo (multiplicados por `chMult`). No Infinito, ganha +3 HP e +5 vel por minuto decorrido.
   - **`SkullSlime` (`GameScene.spawnSkullSlimeAt` L1159-1163, `SkullSlime.ts:40-42`):**
     - **NÃO usa os multiplicadores de stat de `getEnemyScaling`** (apenas usa `scaling.minutes` em `GameScene.ts:1566` para teto `maxSlimes`). Usa fórmula linear inline própria. Não é testado em `scaling.test.ts`.
     - HP: `Math.round((160 + (isEndless ? min * 30 : 0)) * chMult)`.
     - Velocidade: Fixa em `46` px/s (com dash rápido de `300` px/s via timer interno).
     - Dano: `Math.round(10 * chMult)`.
     - *História vs Infinito:* Na História, HP (160) e Dano (10) são estáticos com o tempo. No Infinito, ganha +30 HP por minuto.
   - **`MummyEnemy` (`GameScene.updateHordeDirector` L1587-1593, `GameScene.spawnMummyAt` L1232-1260, `MummyEnemy.ts:82-87`):**
     - Usa `getEnemyScaling` e `getChapterEnemyStatMultiplier()`. A função é testada em `scaling.test.ts`; o uso no spawn não é testado.
     - HP: `Math.round(130 * scaling.hpMultiplier * chMult)`.
     - Velocidade: `Math.floor(Math.min(100, 58 * scaling.speedMultiplier))`.
     - Dano: `Math.round(15 * scaling.damageMultiplier * chMult)`.
     - *História vs Infinito:* Escala via `getEnemyScaling` com multiplicadores percentuais completos de HP, velocidade e dano.
   - **`Succubus` menor (`src/entities/enemies/Succubus.ts`):**
     - Código morto (`HP 85, Vel 115, Dano 18`). Nunca é importado, instanciado ou gerado na `GameScene.ts`.
   - **`Cerberus` (Minichefe do Infinito aos 3 min) (`GameScene.spawnCerberusBoss` L1646):**
     - Instanciado como sprite de `ZombieDog` com escala 1.85x e tint púrpura.
     - Constantes estáticas puras: `HP = 1400`, `Velocidade = 95`, `Dano = 20`.
     - **NÃO usa `getEnemyScaling`** e **NÃO usa `getChapterEnemyStatMultiplier()`**. Não é testado em `scaling.test.ts`.
     - Surge estritamente no Modo Infinito ao atingir 3 minutos (`elapsedMinutes >= 3 && !endless3MinBossSpawned`).
   - **`Matriarca` (Minichefe do Infinito aos 6 min) (`GameScene.spawnMatriarchBoss` L1676):**
     - Instanciada como sprite de `SuccubusBoss` com escala 1.45x.
     - Constantes estáticas puras: `HP = 2400`, `Velocidade = 115`, `Dano = 24`.
     - **NÃO usa `getEnemyScaling`** e **NÃO usa `getChapterEnemyStatMultiplier()`**. Não é testado em `scaling.test.ts`.
     - Surge estritamente no Modo Infinito ao atingir 6 minutos (`elapsedMinutes >= 6 && !endless6MinBossSpawned`).
   - **`Succubus Imperial` (Imperatriz Rosalin — Chefe Cap. 1 & Infinito 10m) (`GameScene.spawnSuccubusBoss` L2807 e `GameScene.spawnEndless10MinBoss` L1707, `SuccubusBoss.ts:82-84`):**
     - **História (Cap. 1):** `HP = 9000`, `Velocidade = 125`, `Dano = 35`, escala `1.75` (`GameScene.ts:2807`).
     - **Infinito (10 min):** `HP = 12000`, `Velocidade = 135`, `Dano = 40`, escala `1.85` (`GameScene.ts:1707`).
     - **NÃO usa `getEnemyScaling`** e **NÃO usa `getChapterEnemyStatMultiplier()`**. Não é testada em `scaling.test.ts`.
   - **`Azazel, O Anjo Caído` (Chefe Cap. 2) (`GameScene.spawnAzazelBoss` L2971, `AzazelBoss.ts:213-215`):**
     - **Capítulo 2:** `HP = 16000`, `Velocidade = 138`, `Dano = 42`, escala `1.65` (`GameScene.ts:2971`).
     - **NÃO usa `getEnemyScaling`** e **NÃO usa `getChapterEnemyStatMultiplier()`**. Não é testado em `scaling.test.ts`.
   - > **Nota de Auditoria e Decisão do Dono:** O teste automatizado `src/__tests__/scaling.test.ts` protege **exclusivamente a função matemática pura `getEnemyScaling`** (cujos multiplicadores só são consumidos por `ZombieDog` e `MummyEnemy`). `BloodBat` e `SkullSlime` usam lógica inline separada, e os minichefes/chefes usam literais estáticos. **A função é testada; o uso no spawn não é testado.**
3. **Controle de Grupo e Resistência:**
   - O controle de grupo é gerenciado por `applyStun(durationMs)` e `updateStunState(deltaMs)` dentro de `updateEnemy`.
   - Inimigos comuns sofrem redução drástica de velocidade e recebem tint de paralisia; chefes possuem resistência embutida que reduz a duração efetiva do efeito.
4. **Limites de Performance e Culling:**
   - A quantidade simultânea respeita `PERFORMANCE_LIMITS.MAX_ACTIVE_ENEMIES` em `src/config/balance.ts`.
   - Entidades fora da área de visão da câmera (`worldView + margin`) têm renderização pausada via Viewport Culling na `GameScene`.

---

## 3. Contrato de Efeitos de Status da Nixy (`src/entities/characters/`)

1. **Estados de Controle e Timers da Heroína (`Nixy.ts`):**
   - **Lentidão (`slowTimer`):** Configurado via `applySlow(multiplier = 0.60, durationMs = 600)`. Reduz a velocidade através de `speedDebuffMultiplier` (padrão 0.60) e aplica coloração verde tóxico do lodo (`this.setTint(0x70e000)`). O timer é decrementado por `deltaMs` no método `Nixy.updateNixy`. Ao zerar, restaura `speedDebuffMultiplier = 1.0` e limpa o tint caso a heroína não esteja enraizada nem sofrendo dano.
   - **Prisão Ácida / Enraizamento (`rootTimer`):** Configurado via `applyAcidRoot(durationMs = 1000)`. Zera a velocidade do corpo físico (`body.setVelocity(0, 0)`), bloqueia vetores de entrada (`dx = 0`, `dy = 0`), impede ativação de sprint e aplica coloração verde ácida (`this.setTint(0x55ff77)`). O timer é decrementado por `deltaMs` no método `Nixy.updateNixy`. Ao expirar, desativa `isRooted = false` e chama `clearTint()`.
   - **Empurrão / Impacto (`knockbackTimer`):** Configurado via `applyKnockback(vx, vy, durationMs = 220)`. Armazena o vetor em `knockbackVelocity` e impõe velocidade contínua diretamente ao corpo físico (`body.setVelocity(this.knockbackVelocity.x, this.knockbackVelocity.y)`) a cada frame enquanto `knockbackTimer > 0`, sem utilizar atrito/arrasto físico da engine. Dispara tremor de câmera via `this.camerasShake(durationMs)`. O timer é decrementado por `deltaMs` no método `Nixy.updateNixy`.
   - **Sombra Fantasma de Sprint (`trailTimer`):** A cada `40ms` (`TRAIL_INTERVAL_MS`) de deslocamento contínuo em sprint, gera uma cópia translúcida (`createSprintGhost`) com tint magenta/rubi (`0xff2a6d`), alfa `0.85`, blend mode aditivo e fade-out de `360ms`.
2. **Reação a Dano e Propósito Exclusivo de `hurtTimer` (`BaseCharacter.ts:250ms`):**
   - O `hurtTimer` (250ms) existe exclusivamente na classe base `BaseCharacter.ts` para disparar a animação visual de impacto (`nixy-hurt-${dir}`) e foi omitido do Livro anterior porque não altera velocidade, física nem coloração.
   - Ele é inicializado em `BaseCharacter.takeDamage` e decrementado pelo delta de física em `updateMovement`, mantendo precedência na máquina de estados de animação sobre idle/run/sprint.
   - Ele não concede imunidade mecânica nem frame de invulnerabilidade (que pertence estritamente a `playerInvulnerableTimer` de 450ms na `GameScene`).
   - Ele não aplica tint de cor no sprite (a heroína não pisca vermelho nem altera sua paleta de cores através do `hurtTimer`).
   - Por ser puramente um bloqueador transitório de pose de animação e não um status de controle de grupo, opera de forma desacoplada de Slow, Root e Knockback.
3. **Invulnerabilidade Pós-Dano (`GameScene.ts`):**
   - A imunidade de dano não reside em `Nixy.ts` nem em `BaseCharacter.ts`. Ela é gerenciada centralmente na cena principal através da propriedade `playerInvulnerableTimer` em [`src/scenes/GameScene.ts`](../src/scenes/GameScene.ts).
   - Ao sofrer dano por colisão com monstros, `playerInvulnerableTimer` é inicializado em `450ms` e é decrementado pelo tempo delta (`delta`) a cada quadro dentro de `GameScene.update()`. Enquanto `playerInvulnerableTimer > 0`, novos danos de colisão com inimigos são ignorados.
4. **Regra de Prioridade Visual de Cores e Módulo Puro (`src/systems/statusEffects.ts`):**
   - As colorações visuais seguem a hierarquia estrita: `Prisão (Root: 0x55ff77) > Lentidão (Slow: 0x70e000) > Normal (clearTint / null)`.
   - **Decremento sem congelamento:** Os timers de Slow e Root decrementam continuamente mesmo durante o Knockback, evitando acúmulo artificial de penalidades.
   - **Limpeza não-destrutiva:** Quando um efeito de status expira mas outro ainda possui tempo restante, o tint do efeito restante é reaplicado imediatamente em vez de executar um `clearTint()` cego.

---

## 4. Contrato de Chefes de Capítulo (`SuccubusBoss`, `AzazelBoss`)

1. **Herança e Identificação:**
   - Estendem `BaseEnemy` com flag `public isBoss: boolean = true` e controle de invulnerabilidade `public isInvulnerable: boolean`.
2. **Telegrafia Obrigatória de Ataques (Telegraph):**
   - Nenhum ataque especial de grande impacto (investidas rápidas, quedas de meteoro, raios caindo do céu) causa dano imediato sem aviso visual.
   - Todo ataque perigoso projeta previamente guias visuais no chão (`Phaser.GameObjects.Graphics`) com linha direcional ou área circular preenchida progressivamente durante um intervalo de tempo justo para reação do jogador antes do dano ser ativado.
3. **Estrutura de Fases do Azazel (Verificado no Código):**
   Conforme implementado em `src/entities/enemies/AzazelBoss.ts` e `src/scenes/GameScene.ts`, a luta contra Azazel possui **4 Fases de Combate (`AzazelCombatPhase = 1 | 2 | 3 | 4`)**:
   - **Fase 1 (100% → 50% HP):** Arena delimitada, investidas telegrafadas, tempestade de raios e barragem espiral (`AzazelBoss.ts`).
   - **Fase 2 (50% → 20% HP — *"AQUI É O MEU MUNDO"*):** Domínio da Escuridão Total (HUD oculta, música amplificada), alternando 5 investidas rápidas no escuro e 8 clones espectrais (`AzazelPhantomClone`) que compartilham vida com o chefe (`AzazelBoss.ts`; gatilho ao atingir 50% de HP).
   - **Fase 3 (Trava aos 20% HP — *"SUA POBRE ALMA FRÁGIL NÃO ENCONTRARÁ PAZ"*):** Banimento para a Dimensão Abissal (`map 202`, `floor-tile-2` / `chao2`), disparado pelo evento `'azazel-phase3-dimension-start'`, onde Azazel fica oculto/invulnerável enquanto o jogador purifica os 3 Cristais em meio a uma horda intensa (`GameScene.ts`; gatilho ao atingir 20% de HP).
   - **Fase 4 (20% → 0% HP — Showdown Final):** Azazel reaparece com velocidade ampliada (+20%) para o confronto decisivo até 0% de HP (`GameScene.ts` e `AzazelBoss.ts`).
4. **Limpeza Gráfica e Restauração:**
   - Na derrota do chefe, todos os gráficos de telegrafia, clones e overlays de escuridão devem ser destruídos imediatamente.
   - O zoom da câmera deve ser restaurado suavemente para o padrão de exploração via tween.

---

## 5. Contrato de Altares, Cristais e Geração no Mapa (`src/entities/items/`)

1. **Altar de Invocação do Chefe (`BossSummonAltar`):**
   - **Exatamente 1 por mapa.** Vincula a coordenada do portal (`bossPortal`) e a área de invocação do chefe (`bossSpawn`).
   - Permanece em estado inativo (`altar-invoc-inactive`) até a meta de almas do capítulo ser atingida, ativando labaredas animadas (`altar-invoc-active-1/2`) e emitindo `'boss-summon-triggered'` quando o jogador se aproxima do seu raio de encontro (`encounterRadius` em `BossSummonAltar.ts`).
2. **Altar de Ascensão (`EvolutionAltar`):**
   - **Geração Dinâmica na Partida:** O `EvolutionAltar` interativo **não depende de props fixos no mapa**. Ele é gerado dinamicamente pela `GameScene` a cada intervalo configurado (`ALTAR_SPAWN_INTERVAL` na `GameScene`), surgindo próximo à Nixy apenas quando o jogador possui armas prontas para evoluir.
   - Quando colocado na lista `props` de um mapa customizado/editor (`altar-1`), o carregador `loadCustomMapLayout` instancia uma imagem estática decorativa (`setDepth(-12)`), sem lógica de captura.
   - Durante a captura do altar interativo, o jogador deve permanecer dentro do raio de captura (`captureRadius` em `EvolutionAltar.ts`) até completar a barra circular rúnica, emitindo `'altar-completed'`.
3. **Cristais de Azazel (`AzazelCrystal`):**
   - **Comportamento Real do Código:** Os 3 cristais são gerados dinamicamente em tempo de execução pela `GameScene` dentro de `startAzazelPhase3Dimension()` em ângulos e distâncias aleatórias ao redor do jogador na Fase 3 da luta.
   - **Campo Morto Deprecated:** O campo `azazelCrystals` em `ChapterMapConfig` / `DEFAULT_AZAZEL_DIM_MAP` está marcado como `@deprecated` (não é lido por `loadCustomMapLayout` e será removido no Pacote 2).
   - A captura exige permanência no raio do cristal (`captureRadius` em `AzazelCrystal.ts`) durante o tempo estabelecido. Ao completar, valida a câmera antes da explosão e emite `'crystal-completed'`.

---

## 6. Contrato de Mapas e Checklist Oficial do Validador (`src/config/mapData.ts`)

1. **Estrutura de Dados (`ChapterMapConfig`):**
   - Cada mapa define `version`, `chapter`, `name`, `floorTexture`, `playerSpawn` (`MapPoint`), `bossPortal` (`MapPoint`), `bossSpawn` (`MapPoint`), `itemSpawners` (`MapPoint[]`) e `props` (`MapEntityProp[]`).
   - A propriedade oficial é **`itemSpawners`** (e não `itemSpawns`).
2. **Contagens Reais dos Mapas Atuais (Verificado no Código):**
   - **Capítulo 1 (`DEFAULT_CHAPTER_1_MAP`):** 4 `itemSpawners`, 0 props `altar-1`.
   - **Capítulo 2 (`DEFAULT_CHAPTER_2_MAP`):** 17 `itemSpawners`, 2 props `altar-1` decorativos.
   - **Dimensão de Azazel (`DEFAULT_AZAZEL_DIM_MAP`, Cap. 202):** 2 `itemSpawners`, 0 props `altar-1`.
3. **Checklist Oficial Aprovado por Tipo de Mapa:**
   - **Mapas de Capítulo (Capítulo 1 e Capítulo 2):**
     - Exatamente 1 `playerSpawn` (dentro dos limites de `ARENA_CONFIG`);
     - Exatamente 1 `bossPortal` e 1 `bossSpawn` (dentro dos limites de `ARENA_CONFIG`);
     - Mínimo de 4 `itemSpawners` (dentro de `ARENA_CONFIG`);
     - *Altar de Ascensão (`altar-1` em props):* **Opcional** (a mecânica real do `EvolutionAltar` surge via timer procedural na `GameScene`).
   - **Arena de Chefe / Dimensão Fechada (Capítulo 202):**
     - Exatamente 1 `playerSpawn` (dentro de `ARENA_CONFIG`);
     - Exatamente 1 `bossPortal` e 1 `bossSpawn` (dentro de `ARENA_CONFIG`);
     - Mínimo de 2 `itemSpawners` (dentro de `ARENA_CONFIG`);
     - Sem exigência de altar de ascensão.
   - **Regra de Espaçamento de Props:** Props quase duplicados (mesmo `type` com distância euclidiana inferior a `48px`) geram **aviso informativo** listado no relatório de validação, sem reprovar o mapa.

---

## 7. Contrato de Áudio (`src/systems/SoundManager.ts`)

1. **Trilhas Musicais (BGM):**
   - Gerenciadas por métodos de troca limpa com crossfade/fade-in (`playMenuMusic`, `playBattleMusic`, `playBossMusic`, `playIntroMusic`, `playSpookyMusic`, `playAzazelIntroMusic`, `playAzazelFightMusic`).
   - A máquina de sincronia do Azazel utiliza `finishAzazelIntroAndTransition(onMidStart, onFightStart)` para aguardar a finalização do compasso da intro antes de engatar o mid de 2 segundos e a música de batalha.
   - Parada geral via `stopMusic(fadeOutMs)`.
2. **Efeitos Sonoros e Síntese Web Audio:**
   - Efeitos de combate, interface e cassino geram áudio procedural via Web Audio API, sem depender de assets externos de SFX.
   - Diálogos utilizam estritamente:
     - **`playDialogueVoice(speaker: string)`**: emite tom característico para cada personagem (`nixy`, `rosalin`, `azazel`, `narrator`).
     - **`playDialogueTypewriter(char?: string)`**: emite ruído sutil de tecla durante a digitação.

---

## 8. Contrato de Cartas de Upgrade (`src/scenes/UpgradeScene.ts`)

1. **Molduras Pixel-Art e Tipografia:**
   - 8 molduras temáticas padronizadas: `Gold`, `Mystic`, `Fire`, `Inferno`, `Green`, `Ice`, `Obsidian` e `Base`.
   - Trava geométrica horizontal rígida de largura de texto (`SAFE_INNER_WIDTH = 134px`) na fonte oficial `Pixelzone.ttf` para impedir que descrições ultrapassem a moldura.
2. **Cores por Categoria Semântica de Palavras-Chave:**
   - **Armas e Habilidades:** Roxo (`#9b5de5`).
   - **Dano e Ataque:** Vermelho (`#ff3333`).
   - **Vida, Cura e Regeneração:** Verde (`#2ecc71`).
   - **Velocidade e Controle de Grupo:** Azul Ciano (`#38bdf8`).
   - **Utilidade, Almas e Projéteis Extras:** Dourado (`#fbbf24`).
3. **Mecânicas da Interface:**
   - Flutuação contínua em senoide com brilho ao redor (`Back-Glow`) no hover.
   - Seleção com explosão de partículas e dispersão das cartas não escolhidas.
   - Botões funcionais de **Reroll** (gasta carga da partida) e **Skip** (cura emergencial de +20 HP).

---

## 9. Contrato de Meta-Progressão e Economia (`src/systems/MetaProgressManager.ts`)

1. **Persistência e Estrutura de Save:**
   - Dados salvos em `localStorage` sob a chave `hell_survivor_meta_save_v1` (a ser migrada para `STORAGE_KEYS` no Pacote 2).
   - Armazena Almas Corrompidas acumuladas (`corruptedSouls`), níveis das bênçãos permanentes e estatísticas de jogo (`totalKills`, `totalRuns`, `highestEndlessTimeSec`, etc.).
2. **Catálogo de Bênçãos (`BLESSINGS_CATALOG`):**
   - 6 bênçãos oficiais: *Vitalidade Abissal* (`vitality`), *Fúria Sombria* (`might`), *Atração Etérea* (`magnetism`), *Passo Fantasma* (`agility`), *Sorte do Destino* (`reroll`) e *Pacto Demoníaco* (`revival`).
   - A bênção de ressurreição possui nível único (`maxLevel: 1`).
3. **Reembolso Exato de 70%:**
   - O método `refundBlessings()` calcula o total histórico gasto em todas as bênçãos e credita exatamente `Math.floor(totalSpent * 0.70)`, resetando os níveis para zero.
4. **Exportação de Modificadores:**
   - O método `getModifiers()` consolida os bônus acumulados de vida, dano, raio de coleta, velocidade, estamina, rerolls e flag de ressurreição para consumo direto na inicialização da partida.

---

## 10. Contrato de Visual Novel e Diálogos (`IntroScene`, `Chapter1EndScene`, `DialogueSystem`)

1. **Bustos e Resolução:**
   - Sprites dedicados em `Chat<Nome>.png` exibidos em dimensões padronizadas de contrato estável (`420x420` no `DialogueSystem` / `IntroScene` e `430x430` na `Chapter1EndScene`), ancorados em `origin(0.5, 1.0)`.
   - Sempre invocar `setDisplaySize(largura, altura)` imediatamente após `setTexture()`.
2. **Destaque de Texto Dourado:**
   - Integração automática com `enableCensoredTextHighlight()` (`src/systems/TextHighlight.ts`) para renderizar a palavra `[CENSURADO]` em dourado brilhante (`#fbbf24`).
