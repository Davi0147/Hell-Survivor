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
2. **Atributos e Escalonamento:**
   - Os valores base de HP, velocidade e dano de todos os inimigos, elites, minichefes e chefes moram em `src/config/balance.ts` (`ENEMY_BALANCE`, `SUCCUBUS_BOSS_BALANCE`, `AZAZEL_BOSS_BALANCE`). Este documento não repete os números.
   - `ZombieDog` (comum e elite) e `MummyEnemy` escalam pelo tempo de partida via `getEnemyScaling` e pelo multiplicador do capítulo (`CHAPTER_CONFIG.enemyStatMultiplier`, só no Modo História).
   - `BloodBat` e `SkullSlime` têm atributos fixos no Modo História e ganham bônus lineares por minuto apenas no Modo Infinito (`endlessHpPerMinute`, `endlessSpeedPerMinute`), além do multiplicador do capítulo.
   - Minichefes (Ghoul Devorador, Lyn) e chefes (Rosalin, Azazel) usam valores fixos na História. No Infinito, minichefe e Rosalin ganham vida (e a Rosalin dano) a cada Círculo (`ENDLESS_SCHEDULE.miniBossHpPerCircle`, `ENDLESS_SCHEDULE.boss`).
   - QUANDO cada inimigo aparece é o cronograma (seção 13): `STORY_SCHEDULE` e `ENDLESS_SCHEDULE`. O elite de `ZombieDog` só existe depois que o cronograma libera `elite`, com a chance da tabela.
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
   Conforme implementado em `src/entities/enemies/AzazelBoss.ts` e `src/systems/BossFightSystem.ts`, a luta contra Azazel possui **4 Fases de Combate (`AzazelCombatPhase = 1 | 2 | 3 | 4`)**:
   - **Fase 1 (100% → 50% HP):** Arena delimitada, investidas telegrafadas, tempestade de raios e barragem espiral (`AzazelBoss.ts`).
   - **Fase 2 (50% → 20% HP — *"AQUI É O MEU MUNDO"*):** Domínio da Escuridão Total (HUD oculta, música amplificada via `boostCurrentMusicVolume`), alternando em ciclo: (1) 5 investidas rápidas sequenciais do próprio Azazel com telegrafia relâmpago (`startDarkFiveDashes` / `spawnNextDarkPhantomDash`) e (2) um anel de 8 atiradores orbitando o jogador por 10s (`startDarkEightClones`: Azazel original no índice 0 + 7 clones espectrais `AzazelPhantomClone` com HP compartilhado, disparando salvas periódicas via `spawnAzazelOrb`); gatilho em `takeDamage` ao atingir o limiar de 50% de HP.
   - **Fase 3 (Trava aos 20% HP — *"SUA POBRE ALMA FRÁGIL NÃO ENCONTRARÁ PAZ"*):** Banimento para a Dimensão Abissal (`map 202`, `floor-tile-2` / `chao2`), disparado pelo evento `'azazel-phase3-dimension-start'`, onde Azazel fica oculto/invulnerável enquanto o jogador purifica os 3 Cristais em meio a uma horda intensa (`BossFightSystem.ts`; gatilho ao atingir 20% de HP).
   - **Fase 4 (20% → 0% HP — Showdown Final):** Azazel reaparece com velocidade ampliada (+20%) para o confronto decisivo até 0% de HP (`BossFightSystem.ts` e `AzazelBoss.ts`).
4. **Limpeza Gráfica e Restauração:**
   - Na derrota do chefe, todos os gráficos de telegrafia, clones e overlays de escuridão devem ser destruídos imediatamente.
   - O zoom da câmera deve ser restaurado suavemente para o padrão de exploração via tween.

---

## 4.1. Rede de Segurança das Lutas de Chefe (`src/config/balance.ts`)

1. **Teto de dano por golpe:** nenhum golpe da Rosalin no Modo História tira mais de 45% da vida base da heroína, e o golpe mais forte é sempre o mais telegrafado. No Azazel, nenhum golpe passa de 25% (são muitos na tela). Travado por `src/__tests__/bossBalance.test.ts`.
2. **Exaustão (`BOSS_FATIGUE`, `getBossFatigueMultiplier`):** depois de `startsAfterMs` de combate, o chefe recebe `bonusPerStep` de dano extra a cada `stepMs`, até `maxBonus`. O relógio é do `BossFightSystem` e zera a cada luta; o multiplicador é aplicado em `damageTakenMultiplier` do chefe.
3. **Revanche (`BOSS_MERCY`, `getBossMercy`):** só no Modo História. Cada morte registrada em `MetaProgressManager.getDeathsToBoss` reduz vida e dano do chefe na próxima tentativa, até `maxStacks`. Infinito e Modo de Teste sempre enfrentam a luta cheia.
4. **Cálices do Azazel (`healOnPhaseChange`):** um Cálice de Cura ao entrar na fase dos cristais e outro ao voltar para o duelo final.
5. **Pacto Demoníaco (`REVIVAL_BALANCE`):** uma ressurreição por partida, tratada pelo `RunEndSystem`.

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
   - **Comportamento Real do Código:** Os 3 cristais são gerados dinamicamente em tempo de execução pelo `BossFightSystem` dentro de `startAzazelCrystalPhase()` em ângulos e distâncias aleatórias ao redor do jogador na Fase 3 da luta.
   - **Campo Morto Deprecated:** O campo `azazelCrystals` em `ChapterMapConfig` / `DEFAULT_AZAZEL_DIM_MAP` está marcado como `@deprecated` (não é lido por `loadCustomMapLayout` e será removido no Pacote 2).
   - A captura exige permanência no raio do cristal (`captureRadius` em `AzazelCrystal.ts`) durante o tempo estabelecido. Ao completar, valida a câmera, solta a explosão e emite `'crystal-completed'` **antes** de `destroy()` (que remove os ouvintes).

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

---

## 11. Contrato de Ciclo de Vida de Cenas Phaser (DEC-006)

1. **Reinicialização Rigorosa (`init`):**
   - Toda cena com propriedades de controle (`isEnding`, `isTyping`, `isPaused`, arrays de entidades) deve implementar `init()` para redefini-las ao valor padrão, pois o Phaser reutiliza a mesma instância da classe em `scene.start()`.
2. **Ordem de Instanciação de Grupos:**
   - Grupos de entidades (`enemiesGroup`, `gemsGroup`, `soulsGroup`, `mapItemsGroup`) devem ser instanciados no início de `create()`, antes de qualquer chamada a métodos de layout (`loadCustomMapLayout`), acompanhados de checagens defensivas (`this.group && this.group.children`).
3. **Desligamento e Limpeza (`SHUTDOWN`):**
   - Cenas que registram ouvintes em barramentos globais ou instâncias persistentes (`this.events.on`, `input.keyboard.on`, timers contínuos) devem registrar um ouvinte `SHUTDOWN` para desregistrar/limpar esses elementos, impedindo vazamento de listeners e duplicidade de handlers.
---

## 12. Contrato de Ritmo de Combate (`CombatFeelSystem`, `ComboTracker`, `HordeEventSystem`)
Todos os números moram em `src/config/balance.ts`.

- **Combo (`COMBO_BALANCE`):** cada inimigo comum abatido soma 1; chefes não contam. A janela (3,2s) renova inteira a cada abate. Degraus dão bônus de XP aplicado em `BaseCharacter.xpGainMultiplier`, que a `GameScene` recalcula todo quadro como `1 + combo + evento de horda`.
- **Frenesi:** dispara a cada múltiplo de `frenzyEvery`. Soma dano e velocidade em `bonusDamagePercent`/`bonusSpeedPercent` e retira ao acabar (nunca abaixo de zero).
- **Crítico (`CRIT_BALANCE`):** rolado num único ponto, `BaseEnemy.takeDamage`, usando `critChance`/`critMultiplier` do jogador. Golpes acima de `ignoreAbove` (limpeza de arena) não rolam.
- **Esquiva (`DASH_BALANCE`):** `BaseCharacter.tryDash`. Durante a esquiva e 110ms depois, `takeDamage` do jogador é ignorado e o contato com monstros não fere. Não sai quando a heroína está presa (raiz) ou sendo arremessada.
- **Onda de Level Up (`IMPACT_BALANCE`):** pedida ao abrir a tela de cartas, disparada quando a cena volta e não há mais níveis na fila.
- **Explosão de cadáver (`CORPSE_EXPLOSION_BALANCE`):** no máximo `maxPerFrame` por quadro, para a reação em cadeia não derrubar o desempenho.
- **Eventos de horda (`HORDE_EVENT_BALANCE`):** primeiro aos 50s, depois a cada 38 a 52s; não acontecem com chefe em campo, com o Altar de Invocação desperto, na calmaria pós-chefe do Infinito nem nos `eventQuietBeforeBossMs` antes do chefe do Círculo; nunca o mesmo evento duas vezes seguidas; respeitam `MAX_ACTIVE_ENEMIES`. Regras de elegibilidade em `hordeEventRules.ts`.
- **Tempestade de Azazel (`STORM_BALANCE`):** só no Modo História dos capítulos listados em `chapters`. Aviso de 1,15s no padrão de telegrafia de chefes; fere jogador e monstros comuns (chefes não).
- **Arqueira Demônia** (`ArcherEnemy`; quando aparece: cronograma): calcula um ponto de tiro (`archerStandoffPoint`) a `range` px da heroína, do lado em que está, sempre dentro da área visível da câmera menos `screenMarginPx` (se não cabe em cima/embaixo, o ponto escorrega para o lado mantendo a distância). Corre até ele; afastando-se da heroína anda a `speed × retreatSpeedMult` (abaixo da heroína andando). Só para se estiver dentro da área segura e a até `holdPx` do ponto (sai da parada só acima de `holdPx × 1,6`, para não tremer). Parada, puxa o arco por `drawMs` e solta a flecha mirando a posição atual da heroína, uma a cada `fireCooldownMs` (1,5 s). Desiste da puxada se atordoada ou se a heroína entrar abaixo de 75% de `minRange`. Flechas em `EnemyArrowSystem`: dano via `takeDamage` (respeita esquiva e modo deus); na esquiva atravessam sem sumir.
- **Colossus** (`ColossusEnemy`; quando aparece: cronograma): tanque lento com escolta de cães atrás. `blocksPierce`: qualquer projétil que perfura zera a perfuração ao acertá-lo (ver `remainingPierce`). `isHeavy`: não recua com golpes. `isSolid`: collider com a heroína (corpo imóvel, ela não atravessa nem na esquiva); o golpe de contato a empurra para trás (`knockback`). Atordoamento funciona normal.
- **Transportador** (antes Ladrão de Almas; entidade `TransporterEnemy`): dano de contato zero, foge do jogador e desacelera quando longe; some sem recompensa após `lifetimeMs`.
- **Gemas fora da tela (`GemReserve`):** gema parada além da câmera + `GEM_PARK_MARGIN` vira registro (posição + XP) e volta a ser sprite quando entra na área de novo; só a tela tem teto de 150 sprites (excedente na tela funde na vizinha). Depósito cheio soma o XP na guardada mais próxima. O Ímã chama `releaseStoredGems` antes de puxar.
- **Suprema Ascensão Infernal (`ULTIMATE_BALANCE`):** modo de poder com duração fixa. Soma dano e velocidade em `bonusDamagePercent`/`bonusSpeedPercent` e multiplica `weaponHasteMultiplier` (a `GameScene` passa `delta * weaponHasteMultiplier` às armas); tudo é desfeito no fim, sem descer abaixo do valor base. A horda não para de nascer durante a Suprema. A morte encerra a Suprema sem explosão final.
- **Itens de mapa (`BALANCE.MAP_ITEMS`):** sorteio por peso em `mapItemRules.ts`. Bomba fere monstros no raio (chefes recebem `bossDamage`); Ampulheta aplica `applyStun` (chefes reduzem o tempo como em qualquer atordoamento); Frasco enche a Suprema se ela não estiver ativa; Relíquia espalha gemas e almas.

## 13. Contrato do Cronograma de Inimigos (`EncounterDirector`, `encounterRules.ts`)
Tabelas em `src/config/balance.ts` (`STORY_SCHEDULE`, `ENDLESS_SCHEDULE`, `FORMATION_BALANCE`); regras puras em `encounterRules.ts`; execução em `EncounterDirector` (criado junto do `EnemySpawnSystem`, atualizado todo quadro pela `GameScene`).

- **Quem pode nascer:** `EnemySpawnSystem.spawnEnemyRandomPerimeter` só cria um tipo se `isEnemyUnlocked(kind)` (a "fase" antiga regula só quantidade e chance). Sem diretor, só cães (ou tudo, no Modo de Teste).
- **Apresentação:** na primeira vez que um tipo é liberado na partida, aviso central `NOVO: ...` + grupinho `FORMATION_BALANCE.intro` chegando do mesmo lado. Uma vez por partida. O cão não tem apresentação.
- **História:** liberação pela barra de purificação (`unlocks`, 0 a 1). Minichefe uma vez em `miniBoss.atRatio`. Formações do capítulo a cada `storyIntervalMs`, alternando. Com o Altar desperto ou chefe em campo, o diretor não faz nada.
- **Infinito (Círculos de `circleMs`):** o relógio do Círculo só anda sem chefe e sem calmaria. Círculo 1: estreias em `firstCircleUnlocksSec`; do 2 em diante tudo liberado e um tema (`themes`, girando) que vira formação a cada `endlessIntervalMs`. Minichefe em `miniBossAtMs` (rodízio `miniBossRotation`, vida × `endlessMiniBossHpMultiplier`). Aviso do chefe em `bossWarningMs` e `bossFinalWarningMs`; no fim, `spawnEndlessTimedBoss` (sem altar, nasce perto da heroína) com `endlessBossMultipliers`. Chefe derrotado → `calmAfterBossMs` sem hordas novas → próximo Círculo. O Altar de Invocação não é usado no Infinito.
- **Desempenho:** apresentação e formação só nascem se `hasRoomForEnemies` (respeita `MAX_ACTIVE_ENEMIES`); formação recusada tenta de novo em `retryWhenFullMs`.
- **Modo de Teste:** o diretor fica parado. Botão "INFINITO: AVANÇAR 30 S NO CRONOGRAMA" (aba 2) chama `debugAdvance` dentro de uma partida do Infinito.
