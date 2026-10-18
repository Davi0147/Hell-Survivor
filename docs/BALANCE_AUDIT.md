# Auditoria Completa de Balanceamento Numérico — Hell Survivor

> **Status:** Documento de Auditoria Técnica e Inventário Numérico (Pacote 1.5 — Verificado e Corrigido)  
> **Data:** 17/10/2026  
> **Escopo:** Somente Leitura dos arquivos de gameplay e lógica de combate em `src/`. Nenhum arquivo de jogo foi alterado.

---

## 1. Cobertura da Auditoria de Código

Auditoria realizada em **29 arquivos** de gameplay, lógica de combate e progressão, com metodologia de leitura documentada:

| Arquivo de Gameplay / Lógica | Linhas Totais | Método de Leitura | Conteúdo Auditado |
| :--- | :---: | :---: | :--- |
| [`src/config/balance.ts`](file:///E:/Downloads%20HD/Hell%20Survivor/src/config/balance.ts) | 120 | Integral (100%) | Baseline de atributos, Nixy, armas base, balanceamento global. |
| [`src/entities/characters/BaseCharacter.ts`](file:///E:/Downloads%20HD/Hell%20Survivor/src/entities/characters/BaseCharacter.ts) | 232 | Integral (100%) | Movimentação vetorial, estamina, `sprintSpeed`, aplicação de `bonusSpeedPercent` (L140-142). |
| [`src/entities/characters/Nixy.ts`](file:///E:/Downloads%20HD/Hell%20Survivor/src/entities/characters/Nixy.ts) | 218 | Integral (100%) | `applyMetaProgressBlessings()` (L30-53), debuffs, knockback, hitbox. |
| [`src/entities/enemies/BaseEnemy.ts`](file:///E:/Downloads%20HD/Hell%20Survivor/src/entities/enemies/BaseEnemy.ts) | 165 | Integral (100%) | Spawn padrão, atordoamento (stun), velocidade vetorial. |
| [`src/entities/enemies/BloodBat.ts`](file:///E:/Downloads%20HD/Hell%20Survivor/src/entities/enemies/BloodBat.ts) | 102 | Integral (100%) | `spawn(x, y, hp=14, speed=155, damage=5)` (L31), trajetória senoidal de voo. |
| [`src/entities/enemies/ZombieDog.ts`](file:///E:/Downloads%20HD/Hell%20Survivor/src/entities/enemies/ZombieDog.ts) | 98 | Integral (100%) | Spawn, perseguição direta, velocidade base 85. |
| [`src/entities/enemies/SkullSlime.ts`](file:///E:/Downloads%20HD/Hell%20Survivor/src/entities/enemies/SkullSlime.ts) | 162 | Integral (100%) | BASE_SPEED 46, DASH_SPEED 300, intervalo de dash. |
| [`src/entities/enemies/MummyEnemy.ts`](file:///E:/Downloads%20HD/Hell%20Survivor/src/entities/enemies/MummyEnemy.ts) | 175 | Integral (100%) | HP 130, Vel 58, poças de ácido tóxico. |
| [`src/entities/enemies/Succubus.ts`](file:///E:/Downloads%20HD/Hell%20Survivor/src/entities/enemies/Succubus.ts) | 95 | Integral (100%) | HP 85, Vel 115, Dano 18. |
| [`src/entities/enemies/SuccubusBoss.ts`](file:///E:/Downloads%20HD/Hell%20Survivor/src/entities/enemies/SuccubusBoss.ts) | 536 | Blocos de Método | Salto Esmagador (Dive Slam: L467, 77 dano, raio 190), Dash (53 dano), Orbe (18 dano). |
| [`src/entities/enemies/AzazelBoss.ts`](file:///E:/Downloads%20HD/Hell%20Survivor/src/entities/enemies/AzazelBoss.ts) | 1340 | Blocos de Método | 4 Fases, 16.000 HP, Dano 42, Dash 46, Raio 48, Dashes Fase 2 (38 dano). |
| [`src/entities/weapons/BaseWeapon.ts`](file:///E:/Downloads%20HD/Hell%20Survivor/src/entities/weapons/BaseWeapon.ts) | 45 | Integral (100%) | Assinatura base de armas e projéteis. |
| [`src/entities/weapons/SoulBoltWeapon.ts`](file:///E:/Downloads%20HD/Hell%20Survivor/src/entities/weapons/SoulBoltWeapon.ts) | 145 | Integral (100%) | Disparo de Almas: 25 dano inicial, +6 por nível (L50), evolução Apocalipse (580 vel). |
| [`src/entities/weapons/VoidScythesWeapon.ts`](file:///E:/Downloads%20HD/Hell%20Survivor/src/entities/weapons/VoidScythesWeapon.ts) | 128 | Integral (100%) | Foice do Vazio: dano orbital, raio e velocidade angular. |
| [`src/entities/weapons/BloodDaggersWeapon.ts`](file:///E:/Downloads%20HD/Hell%20Survivor/src/entities/weapons/BloodDaggersWeapon.ts) | 130 | Integral (100%) | Adagas de Sangue: perfuração, velocidade de disparo. |
| [`src/entities/weapons/InfernalMeteorWeapon.ts`](file:///E:/Downloads%20HD/Hell%20Survivor/src/entities/weapons/InfernalMeteorWeapon.ts) | 150 | Integral (100%) | Meteoro Infernal: dano de área, raio de impacto e queima. |
| [`src/entities/weapons/SoulBoltProjectile.ts`](file:///E:/Downloads%20HD/Hell%20Survivor/src/entities/weapons/SoulBoltProjectile.ts) | 88 | Integral (100%) | Colisão física e perfuração de projéteis de alma. |
| [`src/entities/weapons/DarkOrbProjectile.ts`](file:///E:/Downloads%20HD/Hell%20Survivor/src/entities/weapons/DarkOrbProjectile.ts) | 52 | Integral (100%) | Esfera sombria da Succubus (18 dano). |
| [`src/entities/weapons/BloodDaggerProjectile.ts`](file:///E:/Downloads%20HD/Hell%20Survivor/src/entities/weapons/BloodDaggerProjectile.ts) | 68 | Integral (100%) | Projétil perfurante de adagas. |
| [`src/entities/items/SoulGem.ts`](file:///E:/Downloads%20HD/Hell%20Survivor/src/entities/items/SoulGem.ts) | 155 | Integral (100%) | XP por cor de gema (5, 20, 100, 250, 500) e atração magnética. |
| [`src/entities/items/CorruptedSoulItem.ts`](file:///E:/Downloads%20HD/Hell%20Survivor/src/entities/items/CorruptedSoulItem.ts) | 160 | Integral (100%) | Moeda permanente do Altar, atração e física de dispersão. |
| [`src/entities/items/EvolutionAltar.ts`](file:///E:/Downloads%20HD/Hell%20Survivor/src/entities/items/EvolutionAltar.ts) | 210 | Integral (100%) | Altar de evolução procedural, tempo de surgimento e ativação. |
| [`src/entities/items/BossSummonAltar.ts`](file:///E:/Downloads%20HD/Hell%20Survivor/src/entities/items/BossSummonAltar.ts) | 140 | Integral (100%) | Altar de invocação de chefe dos capítulos 1 e 2. |
| [`src/systems/MetaProgressManager.ts`](file:///E:/Downloads%20HD/Hell%20Survivor/src/systems/MetaProgressManager.ts) | 331 | Integral (100%) | Árvore de bênçãos, custos, modificadores (L220: Agilidade dá +4% vel/nível). |
| [`src/systems/EvolutionManager.ts`](file:///E:/Downloads%20HD/Hell%20Survivor/src/systems/EvolutionManager.ts) | 115 | Integral (100%) | Regras e sinergias de evolução de armas de nível 5. |
| [`src/systems/DebugSessionLogger.ts`](file:///E:/Downloads%20HD/Hell%20Survivor/src/systems/DebugSessionLogger.ts) | 383 | Integral (100%) | Coleta de métricas e persistência dos últimos 150 logs em localStorage. |
| [`src/systems/AutoPlayTestAgent.ts`](file:///E:/Downloads%20HD/Hell%20Survivor/src/systems/AutoPlayTestAgent.ts) | 260 | Integral (100%) | Bot de teste autônomo, métricas de sobrevivência e causa de morte. |
| [`src/scenes/GameScene.ts`](file:///E:/Downloads%20HD/Hell%20Survivor/src/scenes/GameScene.ts) | 3702 | Blocos de Método | Spawns (L1082, 1198, 1231, 2805, 2969), escalonamento, i-frames (L2519: 450ms). |
| [`src/scenes/UIScene.ts`](file:///E:/Downloads%20HD/Hell%20Survivor/src/scenes/UIScene.ts) | 2921 | Blocos de Método | HUD, radar circular, histórico endless (`getBestRecordSec` L1629). |

---

## 2. Inventário Exato de Números Fora de `balance.ts` (Total: 232 Valores)

A varredura exaustiva catalogou exatamente **232 valores numéricos** de balanceamento espalhados pelo código:

| Subsistema / Categoria | Qtd. Valores | Exemplos Comprovados no Código |
| :--- | :---: | :--- |
| **1. Mecânicas da Nixy** | **14** | i-Frame pós-dano (450ms em `GameScene.ts:2519`), cooldown de stamina (1.0s), vida recuperada no revive (50%). |
| **2. Armas e Evoluções** | **84** | Dano base do Disparo de Almas (25) e upgrade (+6 por nível em `SoulBoltWeapon.ts:50`), velocidade da Foice (3.6 rad/s), dano do Meteoro (80). |
| **3. Inimigos Comuns** | **41** | Spawn de BloodBat (hp=14, vel=155, dmg=5 em `BloodBat.ts:31`), SkullSlime (vel base=46, dash=300), MummyEnemy (hp=130, vel=58, dmg=15). |
| **4. Chefes de Capítulo** | **41** | Succubus História (HP 9000, vel 125, dmg 35 em `GameScene.ts:2805`), Succubus Infinito 10m (HP 12000, vel 135, dmg 40 em L1706), Matriarca 6m (HP 2400, vel 115, dmg 24 em L1675), Azazel História (HP 16000, vel 138, dmg 42 em L2969), Dive Slam (77 em `SuccubusBoss.ts:467`). |
| **5. Itens de Mapa e Altares** | **19** | Valores de XP de gemas (5, 20, 100, 250, 500 em `GameScene.ts:1290`), cura da Taça (50% HP a cada 40s), raio do Altar. |
| **6. Cenas, Diretor e Progressão** | **33** | Gatilhos de fase da horda (25%, 60% e 85% de purificação), limites de inimigos ativos (40/60). |

---

## 3. Realidade do Escalonamento: Auditoria Exaustiva dos 8 Inimigos e Minichefes

A auditoria de código revelou que nem todos os inimigos comuns utilizam a função centralizada `getEnemyScaling`. Abaixo está a realidade comprovada linha a linha no código:

### 3.1 Mapeamento Detalhado dos 8 Inimigos e Minichefes

| Inimigo / Minichefe | Local no Código (Arquivo:Linhas) | Usa `getEnemyScaling`? | Usa `getChapterEnemyStatMultiplier`? | Comportamento História vs Infinito |
| :--- | :--- | :---: | :---: | :--- |
| **1. ZombieDog (Comum)** | [`GameScene.ts:1623-1626`](file:///E:/Downloads%20HD/Hell%20Survivor/src/scenes/GameScene.ts#L1623), [`1082-1084`](file:///E:/Downloads%20HD/Hell%20Survivor/src/scenes/GameScene.ts#L1082) | **SIM** (HP, Vel, Dmg) | **SIM** (HP, Dmg) | **História:** HP `28 * hpMult * chMult`, Vel `min(130, 85 * spdMult)`, Dano `8 * dmgMult * chMult`.<br>**Infinito:** `hpMult` (+16%/min vs +12%) e `dmgMult` (+8%/min vs +6%) mais agressivos. |
| **2. ZombieDog (Alfa/Elite)** | [`GameScene.ts:1618-1621`](file:///E:/Downloads%20HD/Hell%20Survivor/src/scenes/GameScene.ts#L1618) | **SIM** (HP, Vel, Dmg) | **SIM** (HP, Dmg) | Surge **exclusivamente no Infinito** aos 2+ min (`Math.random() < 0.18`). HP base 75, Vel base 95 (cap 145), Dano base 14, multiplicados por `scaling` e `chMult`. |
| **3. BloodBat** | [`GameScene.ts:1196-1201`](file:///E:/Downloads%20HD/Hell%20Survivor/src/scenes/GameScene.ts#L1196), [`BloodBat.ts:31`](file:///E:/Downloads%20HD/Hell%20Survivor/src/entities/enemies/BloodBat.ts#L31) | **NÃO** (apenas `minutes` p/ `flockSize` L1552) | **SIM** (HP, Dmg) | **História:** HP `14 * chMult`, Vel fixa `155`, Dano `5 * chMult` (sem escalonamento de stats por tempo).<br>**Infinito:** HP `(14 + min * 3) * chMult`, Vel `155 + min * 5` (sem teto!), Dano `5 * chMult`. |
| **4. SkullSlime** | [`GameScene.ts:1158-1162`](file:///E:/Downloads%20HD/Hell%20Survivor/src/scenes/GameScene.ts#L1158), [`SkullSlime.ts:17`](file:///E:/Downloads%20HD/Hell%20Survivor/src/entities/enemies/SkullSlime.ts#L17) | **NÃO** (apenas `minutes` p/ `maxSlimes` L1566) | **SIM** (HP, Dmg) | **História:** HP `160 * chMult`, Vel fixa `46`, Dano `10 * chMult`.<br>**Infinito:** HP `(160 + min * 30) * chMult`, Vel fixa `46`, Dano `10 * chMult`. |
| **5. MummyEnemy** | [`GameScene.ts:1589-1592`](file:///E:/Downloads%20HD/Hell%20Survivor/src/scenes/GameScene.ts#L1589), [`1231-1233`](file:///E:/Downloads%20HD/Hell%20Survivor/src/scenes/GameScene.ts#L1231) | **SIM** (HP, Vel, Dmg) | **SIM** (HP, Dmg) | **História:** HP `130 * hpMult * chMult`, Vel `min(100, 58 * spdMult)`, Dano `15 * dmgMult * chMult`.<br>**Infinito:** escalona com multiplicadores completos de `getEnemyScaling`. |
| **6. Succubus Menor** | [`Succubus.ts:1-95`](file:///E:/Downloads%20HD/Hell%20Survivor/src/entities/enemies/Succubus.ts) | **NÃO** | **NÃO** | **Código Morto:** Arquivo existe, mas nunca é importado ou instanciado na `GameScene.ts`. |
| **7. Cerberus (Minichefe 3 min)** | [`GameScene.ts:1645`](file:///E:/Downloads%20HD/Hell%20Survivor/src/scenes/GameScene.ts#L1645) | **NÃO** | **NÃO** | **Infinito apenas:** Surge aos 3 min. Constantes literais: HP 1400, Vel 95, Dano 20 fixos (sprite de `ZombieDog` escala 2.2x, tint `0xff2222`). |
| **8. Matriarca (Minichefe 6 min)** | [`GameScene.ts:1675`](file:///E:/Downloads%20HD/Hell%20Survivor/src/scenes/GameScene.ts#L1675) | **NÃO** | **NÃO** | **Infinito apenas:** Surge aos 6 min. Constantes literais: HP 2400, Vel 115, Dano 24 fixos (sprite de `SuccubusBoss` escala 1.1x, tint `0xaa22ff`). |

### 3.2 Onde `getEnemyScaling` e `getChapterEnemyStatMultiplier` Realmente Operam

1. **`getEnemyScaling(survivalTimeMs, isEndless)`:**
   - Invocado em [`GameScene.ts:1513`](file:///E:/Downloads%20HD/Hell%20Survivor/src/scenes/GameScene.ts#L1513) dentro do despachante `spawnEnemyRandomPerimeter()`.
   - Seus multiplicadores numéricos de status (`hpMultiplier`, `speedMultiplier`, `damageMultiplier`) são aplicados **estritamente em `ZombieDog` (comum e Alfa) e `MummyEnemy`**.
   - Para `BloodBat` e `SkullSlime`, o despachante lê apenas `scaling.minutes` para determinar tamanho de bando ou limite populacional, enquanto seus stats de combate seguem fórmulas lineares separadas inline.
2. **`getChapterEnemyStatMultiplier()`:**
   - Definido em `src/scenes/GameScene.ts:1063-1065`:
     ```typescript
     private getChapterEnemyStatMultiplier(): number {
       return this.gameMode === 'story' && this.currentChapter >= 2 ? 1.2 : 1.0;
     }
     ```
   - No Capítulo 2 da História concede +20% de vida e dano a: `ZombieDog` (L1082), `BloodBat` (L1197), `SkullSlime` (L1160) e `MummyEnemy` (L1231).
3. **Chefes NÃO Recebem Nenhum Multiplicador de Tempo ou Capítulo:**
   - Nenhuma função de boss importa ou aplica `getEnemyScaling` ou `getChapterEnemyStatMultiplier()`.
   - Todos os atributos de chefes de capítulo e minichefes são literais estáticos passados em seus métodos de spawn:
     - Succubus História: 9000 HP / 125 vel / 35 dmg (`GameScene.ts:2805`).
     - Succubus Imperial Infinito 10m: 12000 HP / 135 vel / 40 dmg (`GameScene.ts:1706`).
     - Cerberus Infinito 3m: 1400 HP / 95 vel / 20 dmg (`GameScene.ts:1645`).
     - Matriarca Succubus Infinito 6m: 2400 HP / 115 vel / 24 dmg (`GameScene.ts:1675`).
     - Azazel História: 16000 HP / 138 vel / 42 dmg (`GameScene.ts:2969`).
4. **Cobertura de Testes Unitários e Decisão do Dono:**
   - O arquivo de testes `src/__tests__/scaling.test.ts` protege **exclusivamente a fórmula matemática de `getEnemyScaling`** (e, portanto, afeta apenas `ZombieDog` e `MummyEnemy`).
   - Divergências entre o modelo teórico nos documentos antigos e a implementação real no código:
     > **Decisão do dono: manter comportamento atual ou unificar em getEnemyScaling no futuro.**

---

## 4. Recálculo dos Pontos Críticos com Fórmulas e Valores Exatos

### 4.1 Velocidade da Nixy com Bênção de Agilidade Nível 5

- **Caminho no Código:**
  1. [`src/systems/MetaProgressManager.ts:220`](file:///E:/Downloads%20HD/Hell%20Survivor/src/systems/MetaProgressManager.ts#L220):
     `bonusSpeedMultiplier: 1 + agilityLvl * 0.04`
     Com Agilidade nível 5: `1 + 5 * 0.04 = 1.20` (+20%).
  2. [`src/entities/characters/Nixy.ts:43-45`](file:///E:/Downloads%20HD/Hell%20Survivor/src/entities/characters/Nixy.ts#L43):
     `if (mods.bonusSpeedMultiplier > 1) this.bonusSpeedPercent += (mods.bonusSpeedMultiplier - 1) * 100;`
     `this.bonusSpeedPercent` recebe `20` (+20%).
  3. [`src/entities/characters/BaseCharacter.ts:140-142`](file:///E:/Downloads%20HD/Hell%20Survivor/src/entities/characters/BaseCharacter.ts#L140):
     `speedMult = (1 + this.bonusSpeedPercent / 100) = 1.20`.
     `currentSpeed = (this.isSprinting ? this.sprintSpeed : this.baseSpeed) * speedMult`.
- **Valores Base da Nixy (`src/config/balance.ts:14-16`):**
  - `baseSpeed`: **160 px/s**
  - `sprintSpeed`: **270 px/s**
- **Resultado Factual:**
  - **Velocidade de Andar:** `160 * 1.20 =` **192 px/s**
  - **Velocidade de Corrida (Sprint):** `270 * 1.20 =` **324 px/s**

---

### 4.2 Velocidade e Escalonamento Real do Morcego de Sangue (`BloodBat`)

- **Valores Base no Código:**
  - Em [`src/entities/enemies/BloodBat.ts:31`](file:///E:/Downloads%20HD/Hell%20Survivor/src/entities/enemies/BloodBat.ts#L31): Parâmetro padrão de `spawn`: `speed: number = 155`.
  - Em [`src/scenes/GameScene.ts:1199`](file:///E:/Downloads%20HD/Hell%20Survivor/src/scenes/GameScene.ts#L1199):
    ```typescript
    const speed = Math.floor(155 + (this.gameMode === 'endless' ? minutes * 5 : 0));
    ```
- **Comportamento por Modo de Jogo:**
  1. **Modo História:**  
     `this.gameMode === 'endless'` é `false`. A velocidade é **estritamente fixa em 155 px/s** em todos os minutos (0, 5, 10, 20). Não há escalonamento de velocidade de morcegos na campanha.
  2. **Modo Infinito:**  
     Aplica-se a fórmula `155 + minutes * 5`:
     - **0 min:** `155 + 0 * 5 =` **155 px/s**
     - **5 min:** `155 + 5 * 5 =` **180 px/s**
     - **10 min:** `155 + 10 * 5 =` **205 px/s**
     - **20 min:** `155 + 20 * 5 =` **255 px/s**
- **Comparação com a Nixy:**
  - A Nixy caminhando sem bênção (160 px/s) é mais rápida que o morcego aos 0 min (160 > 155), mas é superada no Infinito aos 5 min (180 > 160).
  - Com Agilidade 5, a caminhada da Nixy é **192 px/s**, superando o morcego até quase os 8 minutos de Modo Infinito (192 > 180 aos 5 min).
  - Em Sprint (324 px/s com Agilidade 5, ou 270 px/s base), a Nixy supera com folga a velocidade máxima do morcego aos 20 min (324 > 255 e 270 > 255).

---

### 4.3 Vida do Morcego vs Disparo de Almas: "Morcegos Morrem com 1 Golpe?"

- **Fórmula de Vida do Morcego (`GameScene.ts:1198`):**
  `const hp = Math.round((14 + (this.gameMode === 'endless' ? minutes * 3 : 0)) * chMult);`
  - *Modo História:* Cap. 1 (`chMult = 1.0`): **14 HP**. Cap. 2 (`chMult = 1.2`): **17 HP**.
  - *Modo Infinito:* Min 0: **14 HP**; Min 5: **29 HP**; Min 10: **44 HP**; Min 20: **74 HP**.
- **Dano do Disparo de Almas (`SOUL_BOLT` em `balance.ts:25` e `SoulBoltWeapon.ts:50`):**
  - Nível 1: **25 de dano**
  - Nível 2: **31 de dano**
  - Nível 3: **37 de dano**
  - Nível 4: **43 de dano**
  - Nível 5: **49 de dano**
- **Análise Factual:**
  - **Modo História:** **SIM, morrem sempre com 1 golpe** (25 de dano > 14 HP ou 17 HP).
  - **Modo Infinito (0 min):** **SIM** (25 > 14 HP).
  - **Modo Infinito (5 min):** **NÃO morrem com 1 golpe** se a arma estiver no Nível 1 (25 de dano < 29 HP; exige 2 golpes). Porém, caso o jogador tenha evoluído a arma para o Nível 2 (31 de dano) ou possua bênção de Força (+5% a +25%), volta a abater com 1 único golpe.
  - **Modo Infinito (10 min):** Exige arma Nível 5 (49 de dano > 44 HP) para abater em 1 golpe. Com níveis 1 a 4, exige 2 acertos.

---

### 4.4 Conciliação dos Danos de Chefes e Minibosses

| Ataque / Ação do Chefe | Dano | Arquivo:Linha | Descrição Mecânica |
| :--- | :---: | :--- | :--- |
| **Dive Slam (Succubus Boss)** | **77** | [`SuccubusBoss.ts:467`](file:///E:/Downloads%20HD/Hell%20Survivor/src/entities/enemies/SuccubusBoss.ts#L467) | Ataque em área (Salto Aéreo Esmagador) com círculo vermelho de 190px de raio e 3.6s de telegrafia. Aplica dano direto caso a heroína esteja dentro do raio no impacto. |
| **Dash (Succubus Boss)** | **53** | [`SuccubusBoss.ts:314`](file:///E:/Downloads%20HD/Hell%20Survivor/src/entities/enemies/SuccubusBoss.ts#L314) | Investida veloz em linha reta telegrafada. |
| **Orbe Sombrio (Succubus)** | **18** | [`SuccubusBoss.ts:311`](file:///E:/Downloads%20HD/Hell%20Survivor/src/entities/enemies/SuccubusBoss.ts#L311) | Projétil disparado pela chefe a 240 px/s (`DarkOrbProjectile.ts:25`). |
| **Contato Físico (Succubus História)** | **35** | [`GameScene.ts:2805`](file:///E:/Downloads%20HD/Hell%20Survivor/src/scenes/GameScene.ts#L2805) | Dano de colisão corpo-a-corpo padrão da Succubus no Capítulo 1 da campanha. |
| **Contato Físico (Succubus Infinito 10m)**| **40** | [`GameScene.ts:1706`](file:///E:/Downloads%20HD/Hell%20Survivor/src/scenes/GameScene.ts#L1706) | Dano de colisão da Succubus Imperial aos 10 minutos do Modo Infinito. |
| **Contato Físico (Matriarca Succubus 6m)**| **24** | [`GameScene.ts:1675`](file:///E:/Downloads%20HD/Hell%20Survivor/src/scenes/GameScene.ts#L1675) | Dano de colisão da miniboss aos 6 minutos do Modo Infinito. |
| **Contato Físico (Azazel História)** | **42** | [`GameScene.ts:2969`](file:///E:/Downloads%20HD/Hell%20Survivor/src/scenes/GameScene.ts#L2969) | Dano de colisão corpo-a-corpo padrão do Chefe Azazel no Capítulo 2 da campanha. |
| **Dash de Azazel (Fase 1)** | **46** | [`AzazelBoss.ts:716`](file:///E:/Downloads%20HD/Hell%20Survivor/src/entities/enemies/AzazelBoss.ts#L716) | Investida a 760 px/s com linha de telegrafia púrpura. |
| **Raio Abissal de Azazel** | **48** | [`AzazelBoss.ts:847`](file:///E:/Downloads%20HD/Hell%20Survivor/src/entities/enemies/AzazelBoss.ts#L847) | Raio vertical de trovão sobre a posição da heroína. |
| **Dashes de Azazel (Fase 2)** | **38** | [`AzazelBoss.ts:1055`](file:///E:/Downloads%20HD/Hell%20Survivor/src/entities/enemies/AzazelBoss.ts#L1055) | Sequência de 5 investidas no domínio da escuridão. |

---

## 5. Mapeamento da Telemetria Existente vs Faltante

Para permitir o balanceamento baseado em dados reais de telemetria, as informações atuais do [`DebugSessionLogger.ts`](file:///E:/Downloads%20HD/Hell%20Survivor/src/systems/DebugSessionLogger.ts) e [`AutoPlayTestAgent.ts`](file:///E:/Downloads%20HD/Hell%20Survivor/src/systems/AutoPlayTestAgent.ts) foram mapeadas contra as lacunas propostas:

| Métrica Necessária para Balanceamento | Status Atual | Onde / Campo Existente no Código | O que Falta (Proposta sem Alterar Código) |
| :--- | :---: | :--- | :--- |
| **Taxa de Quadros e Estabilidade** | ✅ Coletado | `TelemetrySnapshot.fps`, `minFps`, `avgFps` | Nenhum. Sistema já registra alertas sob quedas abaixo de 45 FPS. |
| **Densidade de Entidades Ativas** | ✅ Coletado | `TelemetrySnapshot.enemiesActive`, `gemsActive`, `mapItemsActive`, `projectilesActive` | Nenhum. Permite auditar sobrecarga de instâncias. |
| **Estado Básico do Jogador** | ✅ Coletado | `TelemetrySnapshot.playerHp`, `playerLevel`, `equippedWeapons` | Nenhum. Registrado a cada snapshot. |
| **Resumo da Sessão de Jogo** | ✅ Coletado | `TestRunReport.survivalTimeSec`, `kills`, `hpRemaining`, `deathCause` | Nenhum. O bot autônomo consolida ao final da run. |
| **Dano Sofrido por Tipo de Inimigo** | ❌ Não Coletado | `DebugSessionLogger.log('COMBAT')` registra mensagem genérica: `"Nixy recebeu X de dano"` | Incluir no objeto `details` o campo `sourceType: enemy.constructor.name` (ex.: `ZombieDog`, `BloodBat`). |
| **Dano de Projéteis e Áreas de Chefe** | ❌ Não Coletado | `DarkOrbProjectile`, `PoisonPuddle` e *Dive Slam* aplicam `takeDamage` sem emitir log | Conectar chamadas de dano de projéteis e áreas ao `DebugSessionLogger`. |
| **Tempo de Vida Médio de Inimigos (TTK)** | ❌ Não Coletado | Inimigos possuem `spawn()` e `takeDamage()`, mas não gravam `spawnTimestamp` | Injetar timestamp de nascimento na entidade e calcular `Date.now() - spawnTimestamp` na morte. |
| **DPS Real Acumulado por Arma** | ❌ Não Coletado | Armas calculam dano no disparo, mas não possuem acumulador de dano | Adicionar propriedade `totalDamageDealt: number` na classe `BaseWeapon`. |
| **Taxa de Escolha de Cartas (Pick/Skip)** | ❌ Não Coletado | `UpgradeScene.ts` abre e seleciona a carta, mas não registra quais 3 opções foram exibidas | Registrar evento `UPGRADE_OFFERED` com as 3 opções e `UPGRADE_CHOSEN` com a vencedora. |
| **Frequência de Exaustão de Estamina** | ❌ Não Coletado | `isStaminaExhausted` muda de estado internamente em `BaseCharacter.ts`, sem telemetria | Emitir log na transição `stamina <= 0`. |

---

## 6. Pontos que Exigem Decisão do Dono do Projeto

1. **Centralização de Atributos:**
   - Deseja manter atributos nas classes individuais de armas/inimigos ou migrar os 232 valores identificados para `src/config/balance.ts`?
2. **Escalonamento de Dano de Chefes:**
   - O comportamento atual onde chefes possuem atributos estáticos é intencional, ou deseja que chefes passem a receber multiplicadores de `getEnemyScaling` com o tempo?
3. **Equilíbrio de Atordoamento (Stun) em Chefes:**
   - O *Grilhões do Tartarus* paralisa chefes por 630 ms a cada 950 ms (66% do tempo de combate). Deseja manter ou ajustar a resistência a controle de grupo dos chefes?
4. **Cura da Taça de Vinho (`chalice`):**
   - O valor atual recupera 50% do HP total do jogador instantaneamente a cada 40 segundos. Deseja manter percentual fixo ou adotar um valor plano de cura?
5. **Dano em Área do Salto da Chefe Succubus:**
   - O *Dive Slam* causa 77 de dano fixo em 190 px de raio após 3.6s de aviso visual no chão. O valor é considerado satisfatório para a tensão do combate?
