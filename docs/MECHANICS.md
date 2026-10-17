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

## 2. Contrato de Inimigos Comuns e Elites (`src/entities/enemies/`)

1. **Herança e Física:**
   - Todo inimigo estende [`BaseEnemy`](../src/entities/enemies/BaseEnemy.ts) (`Phaser.Physics.Arcade.Sprite`).
   - Suporta reaproveitamento/pooling via método `spawn(x, y, hp, speed, damage)`, limpando tints (`clearTint()`), resetando `isDead = false`, `stunTimer = 0` e reabilitando o corpo físico (`body.enable = true`).
2. **Escalonamento e Balanceamento:**
   - Os valores base de vida, velocidade e dano são multiplicados pela função `getEnemyScaling(survivalTimeMs, isEndless)` em [`src/config/balance.ts`](../src/config/balance.ts), que eleva gradualmente os atributos com base nos minutos decorridos e no modo de jogo (História vs Infinito).
3. **Controle de Grupo e Resistência:**
   - O controle de grupo é gerenciado por `applyStun(durationMs)` e `updateStunState(deltaMs)` dentro de `updateEnemy`.
   - Inimigos comuns sofrem redução drástica de velocidade e recebem tint de paralisia; chefes possuem resistência embutida que reduz a duração efetiva do efeito.
4. **Limites de Performance e Culling:**
   - A quantidade simultânea respeita `PERFORMANCE_LIMITS.MAX_ACTIVE_ENEMIES` em `src/config/balance.ts`.
   - Entidades fora da área de visão da câmera (`worldView + margin`) têm renderização pausada via Viewport Culling na `GameScene`.

---

## 3. Contrato de Efeitos de Status da Nixy (`src/entities/characters/Nixy.ts`)

1. **Estados de Controle e Timers:**
   - **Lentidão (`slowTimer`):** Reduz temporariamente a velocidade para uma fração da velocidade base e aplica coloração fria/ciano.
   - **Enraizamento/Prisão (`rootTimer`):** Trava a velocidade do corpo físico em zero e aplica coloração púrpura/sombria.
   - **Empurrão (`knockbackTimer`):** Desloca a heroína na direção do impacto enquanto desacelera suavemente por arrasto físico.
   - **Dano Recente (`hurtTimer`):** Aplica flash avermelhado durante milissegundos após sofrer impacto.
   - **Imunidade de Graça (`invulnerableTimer`):** Período breve pós-dano onde a heroína não recebe novos danos.
2. **Regra de Prioridade Visual de Cores (A ser consolidada no Pacote 2):**
   - As colorações visuais devem seguir a hierarquia estrita: `Dano (Hurt) > Prisão (Root) > Lentidão (Slow) > Normal (clearTint)`.
   - A contagem regressiva de todos os timers deve ocorrer sem interrupções antecipadas.

---

## 4. Contrato de Chefes de Capítulo (`SuccubusBoss`, `AzazelBoss`)

1. **Herança e Identificação:**
   - Estendem `BaseEnemy` com flag `public isBoss: boolean = true` e controle de invulnerabilidade `public isInvulnerable: boolean`.
2. **Telegrafia Obrigatória de Ataques (Telegraph):**
   - Nenhum ataque especial de grande impacto (investidas rápidas, quedas de meteoro, raios caindo do céu) causa dano imediato sem aviso visual.
   - Todo ataque perigoso projeta previamente guias visuais no chão (`Phaser.GameObjects.Graphics`) com linha direcional ou área circular preenchida progressivamente durante um intervalo de tempo justo para reação do jogador antes do dano ser ativado.
3. **Estrutura de Fases do Azazel (Verificado no Código):**
   Conforme implementado em `src/entities/enemies/AzazelBoss.ts` (linhas 7, 412, 898, 1187, 1240, 1300, 1311) e `src/scenes/GameScene.ts` (linhas 3041–3113), a luta contra Azazel possui **4 Fases de Combate (`AzazelCombatPhase = 1 | 2 | 3 | 4`)**:
   - **Fase 1 (100% → 50% HP):** Arena delimitada, investidas telegrafadas, tempestade de raios e barragem espiral (`AzazelBoss.ts` L412–890).
   - **Fase 2 (50% → 20% HP — *"AQUI É O MEU MUNDO"*):** Domínio da Escuridão Total (HUD oculta, música amplificada), alternando 5 investidas rápidas no escuro e 8 clones espectrais (`AzazelPhantomClone`) que compartilham vida com o chefe (`AzazelBoss.ts` L898–1180; gatilho em `takeDamage` L1300).
   - **Fase 3 (Trava aos 20% HP — *"SUA POBRE ALMA FRÁGIL NÃO ENCONTRARÁ PAZ"*):** Banimento para a Dimensão Abissal (`map 202`, `floor-tile-2` / `chao2`), onde Azazel fica oculto/invulnerável enquanto o jogador purifica os 3 Cristais em meio a uma horda intensa (`GameScene.ts` L3041–3090, `AzazelBoss.ts` L1187; gatilho em L1311).
   - **Fase 4 (20% → 0% HP — Showdown Final):** Azazel reaparece com velocidade ampliada (+20% em L412) para o confronto decisivo até 0% de HP (`GameScene.ts` L3112, `AzazelBoss.ts` L1240).
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
   - **Comportamento Real do Código:** Os 3 cristais são gerados dinamicamente em tempo de execução pela `GameScene` (`handleAzazelPhase3Transition`, linhas 3051–3067) em ângulos e distâncias aleatórias ao redor do jogador na Fase 3 da luta.
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
