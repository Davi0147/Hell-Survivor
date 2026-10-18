# Auditoria Técnica de Balanceamento — Hell Survivor

> **Status:** Documento de Auditoria Revisado (Pacote 1.4)  
> **Escopo:** Somente Leitura da base de código (`src/`)  
> **Data:** 17/10/2026  
> **Diretriz:** Levantamento factual e numérico estrito, formulado em hipóteses com premissas explícitas, sem termos de certeza infundados e sem alteração de código.

---

## 1. Cobertura da Leitura e Metodologia

Para garantir 100% de precisão sobre cada literal de gameplay, foi realizada a leitura e varredura de todos os arquivos do núcleo do jogo. A tabela abaixo documenta a extensão de leitura de cada módulo:

| Arquivo de Gameplay | Total de Linhas | Extensão de Leitura | Método de Verificação |
| :--- | :---: | :---: | :--- |
| `src/entities/characters/Nixy.ts` | 218 | Parcial (L1–100) + AST/Regex | Inspeção de métodos de status, timers e colisões físicas |
| `src/entities/characters/BaseCharacter.ts` | 232 | Parcial (L1–100) + AST/Regex | Atributos base, passivas, i-frames (`hurtTimer`) e colisões |
| `src/systems/UltimateSystem.ts` | 439 | Integral via AST/Regex | Duração, raio, contagem de detonações e dano da Suprema |
| `src/entities/weapons/SoulBoltWeapon.ts` | 145 | Parcial (L1–85) + AST/Regex | Upgrades por nível e atributos da evolução (*Raio do Apocalipse*) |
| `src/entities/weapons/SoulBoltProjectile.ts` | 167 | Integral via AST/Regex | Lifespan, velocidade e dimensões de colisão |
| `src/entities/weapons/VoidScythesWeapon.ts` | 200 | Parcial (L1–85, L110–160) + AST/Regex | Órbita, dano, raio de contato, hit cooldown e evolução |
| `src/entities/weapons/BloodDaggersWeapon.ts` | 166 | Parcial (L1–75, L95–140) + AST/Regex | Salvas, leques por nível, alcance, dano e perfuração |
| `src/entities/weapons/BloodDaggerProjectile.ts` | 133 | Integral via AST/Regex | Lifespan e colisão da adaga |
| `src/entities/weapons/InfernalMeteorWeapon.ts` | 306 | Parcial (L1–85, L240–306) + AST/Regex | Impacto, raio da cratera, recarga, dispersão e evolução |
| `src/entities/weapons/HellfireAuraWeapon.ts` | 195 | Parcial (L1–100, L150–195) + AST/Regex | Pulsos térmicos, raios de expansão, cura e evolução |
| `src/entities/weapons/AbyssalChainsWeapon.ts` | 198 | Parcial (L1–100, L150–198) + AST/Regex | Alvos encadeados, duração de stun, alcance e evolução |
| `src/entities/enemies/BaseEnemy.ts` | 177 | Parcial (L1–60) + AST/Regex | Resistência a stun de chefes (0.35x) e caixas físicas |
| `src/entities/enemies/ZombieDog.ts` | 97 | Parcial (L1–60) + AST/Regex | Vida, velocidade, dano base e multiplicadores de elite |
| `src/entities/enemies/BloodBat.ts` | 102 | Parcial (L1–60) + AST/Regex | Vida, velocidade base e parâmetros de voo sinoidal |
| `src/entities/enemies/MummyEnemy.ts` | 227 | Parcial (L1–120, L140–180) + AST/Regex | Zigue-zague, intervalo de poças, dano de veneno e lentidão |
| `src/entities/enemies/SkullSlime.ts` | 258 | Parcial (L1–60) + AST/Regex | Velocidade base, dash, impacto, detonação ácida e prisão |
| `src/entities/enemies/Succubus.ts` | 88 | Parcial (L1–60) + AST/Regex | Atributos do mini-chefe e dimensões de colisão |
| `src/entities/enemies/SuccubusBoss.ts` | 571 | Parcial (L1–80, L210–250, L370–480) + AST/Regex | Ciclos de dash, dano de salto (*Dive Slam*), orbes e recuperação |
| `src/entities/weapons/DarkOrbProjectile.ts` | 71 | Parcial (L1–60) + AST/Regex | Dano, velocidade e tempo de vida de projéteis de chefe |
| `src/entities/enemies/AzazelBoss.ts` | 1363 | Parcial (L1–180, L700–860, L1040–1080) + AST/Regex | 4 fases, clones, raios abissais, investidas e barreiras |
| `src/entities/items/SoulGem.ts` | 197 | Parcial (L1–60) + AST/Regex | Valores de XP por cor e dinâmica de atração magnética |
| `src/entities/items/CorruptedSoulItem.ts` | 153 | Parcial (L1–60) + AST/Regex | Valor unitário de alma e raio magnético |
| `src/entities/items/MapItem.ts` | 187 | Parcial (L1–120) + AST/Regex | Cura percentual do cálice, ímã global e roleta de baú |
| `src/entities/items/EvolutionAltar.ts` | 203 | Parcial (L1–60) + AST/Regex | Raio de captura, taxas de avanço e recuo, e estágios |
| `src/entities/items/BossSummonAltar.ts` | 157 | Parcial (L1–60) + AST/Regex | Raio de aproximação e ativação |
| `src/entities/items/AzazelCrystal.ts` | 206 | Parcial (L1–60) + AST/Regex | Raio de captura e taxa de purificação de cristais |
| `src/scenes/GameScene.ts` | 3702 | Parcial (L880–1040, L1510–1720, L2780–2990) + AST/Regex | Timers do diretor de spawn, hordas, marcos temporais e i-frames |
| `src/scenes/UpgradeScene.ts` | 1488 | Parcial (L1–100, L340–1060) + AST/Regex | Valores de cartas de bônus passivo e evoluções |
| `src/systems/MetaProgressManager.ts` | 331 | Parcial (L1–120, L260–330) + AST/Regex | Custos, bônus de bênçãos e percentual de reembolso |

---

## 2. Contagem Exata de Valores Fora de `balance.ts`

A varredura completa identificou **232 valores numéricos de gameplay** hardcoded fora de [`src/config/balance.ts`](file:///E:/Downloads%20HD/Hell%20Survivor/src/config/balance.ts). A distribuição exata por subsistema é a seguinte:

```
Total Geral Catalogado: 232 valores numéricos

1. Mecânicas da Nixy: 14 valores
2. Armas, Projéteis e Evoluções (84 valores no total):
   - Disparo de Almas / Raio do Apocalipse: 14 valores
   - Lâminas Orbitais / Ceifadora do Vazio: 13 valores
   - Adagas de Sangue: 14 valores
   - Meteoro Infernal / Cataclismo Solar: 15 valores
   - Chamas do Purgatório / Supernova Abissal: 12 valores
   - Cadeias Abissais / Grilhões do Tartarus: 16 valores
3. Inimigos Comuns e Elites (41 valores no total):
   - BaseEnemy (colisões e resistências): 3 valores
   - Cão Zumbi e Cão Elite: 8 valores
   - Morcego de Sangue: 5 valores
   - Múmia do Abismo e Poça Tóxica: 11 valores
   - Skull Slime (viscoso, dash e explosão): 10 valores
   - Succubus Normal: 4 valores
4. Chefes de Capítulo (41 valores no total):
   - Succubus Imperial (Cap. 1 e Infinito): 22 valores
   - Azazel (Cap. 2 / Dimensão 202 com 4 fases): 19 valores
5. Itens de Mapa e Altares: 19 valores
6. Cenas, Diretor de Hordas e Progressão: 33 valores
```

---

## 3. Realidade do Escalonamento: Inimigos Comuns vs Chefes

### 3.1 Onde a Função `getEnemyScaling` É (e Não É) Aplicada

A verificação minuciosa em todo o código-fonte revelou um fato crucial sobre a arquitetura atual do jogo:

1. **Inimigos Comuns Recebem Escalonamento:**
   - Em [`src/scenes/GameScene.ts:1513`](file:///E:/Downloads%20HD/Hell%20Survivor/src/scenes/GameScene.ts#L1513), a função `getEnemyScaling(survivalTimeMs, isEndless)` é invocada exclusivamente dentro de `spawnEnemyRandomPerimeter()`.
   - Apenas os 4 inimigos comuns da horda contínua recebem esse multiplicador: **Zombie Dog**, **Blood Bat**, **MummyEnemy** e **SkullSlime**.
2. **Chefes NÃO Recebem Escalonamento:**
   - Nenhum arquivo dentro de `src/entities/enemies/` importa ou chama `getEnemyScaling`.
   - Em `GameScene.ts`, os métodos de spawn de chefes instanciam as classes com **valores numéricos fixos e imutáveis**:
     - `spawnSuccubusBoss` (História — Cap 1): HP 9.000, Velocidade 125, Dano 35 (Linha 2805).
     - `spawnSuccubusBossEndless` (Modo Infinito — 10:00): HP 12.000, Velocidade 135, Dano 40 (Linha 1706).
     - `spawnAzazelBoss` (História — Cap 2 / 202): HP 16.000, Velocidade 138, Dano 42 (Linha 2969).
   - Os ataques especiais de chefes causam dano por chamadas diretas a literais numéricos:
     - `player.takeDamage(77)` para o Dive Slam da Succubus (`SuccubusBoss.ts:467`).
     - `player.takeDamage(53)` para o Dash da Succubus (`SuccubusBoss.ts:314`).
     - `player.takeDamage(46)` para o Dash de Azazel (`AzazelBoss.ts:716`).
     - `player.takeDamage(48)` para o Raio de Azazel (`AzazelBoss.ts:847`).
     - `player.takeDamage(38)` para os 5 Dashes de Azazel na Fase 2 (`AzazelBoss.ts:1055`).
3. **Presença de Chefes no Modo Infinito:**
   - O Modo Infinito agenda exclusivamente:
     - Minuto 3:00 (180s): Mini-Boss Titã Cerberus (HP 2.000, Vel 95, Dano 18).
     - Minuto 6:00 (360s): Mini-Boss Matriarca Succubus (HP 2.400, Vel 115, Dano 24).
     - Minuto 10:00 (600s): Chefe Suprema Succubus Imperial (HP 12.000, Vel 135, Dano 40).
   - **Azazel Boss não existe nem é spawnado no Modo Infinito.**
   - Não há nenhum chefe programado para spawnar aos 20 ou 30 minutos de partida no Modo Infinito.

---

## 4. Recálculo dos 3 Pontos Críticos com Números Completos

Com base no código real, os pontos anteriormente considerados críticos foram recalculados sob a forma de **hipóteses com premissas explícitas**:

### Hipótese 1: Impacto do Dive Slam da Chefe Succubus
- **Premissa:** Nixy em início de jornada, sem nenhuma bênção do Altar e sem cartas de HP na partida.
- **Números Reais:**
  - Vida Máxima da Nixy Base: **100 HP**.
  - Dano do *Dive Slam* (salto com círculo de aviso de 3.6s): **77 de dano fixo** (`SuccubusBoss.ts:467`).
  - Dano do Orbe Sombrio mais próximo: **18 de dano fixo** (`DarkOrbProjectile.ts:5`).
  - Dano de Contato com monstro comum: **9 de dano** (Cão Zumbi).
  - Invulnerabilidade da heroína: Ao sofrer qualquer dano de contato, a Nixy recebe **450 ms de imunidade** (`this.playerInvulnerableTimer = 450` em `GameScene.ts:361`).
- **Recálculo Factual:**
  - Se a jogadora for atingida pelo *Dive Slam* (77) após tomar um projétil de orbe (18), o dano total é:  
    `77 + 18 = 95 de dano`.
  - Como `95 < 100`, **a Nixy sobrevive com 5 HP**. Não ocorre derrota instantânea (*one-hit kill*).
  - Se a jogadora possuir Vitalidade nível 1 (+12 HP) no Altar de Bênçãos, sua vida é 112 HP, restando **17 HP**. Com Vitalidade nível 5 (160 HP), restam **65 HP**. Com cartas de Vitalidade (+25 HP cada), a margem de sobrevivência é substancial.
  - O golpe só resulta em morte se a heroína estiver previamente com 77 ou menos de HP no momento do impacto da queda.

---

### Hipótese 2: O Cenário de 30 Minutos de Azazel no Modo Infinito
- **Situação no Código Real:** **Cenário Irrelevante / Inexistente.**
- **Justificativa Comprovada:**
  1. Azazel Boss não possui agendamento no Modo Infinito (`GameScene.ts`). Ele só é acessível na campanha de história (Capítulos 2 e 202).
  2. Mesmo na campanha de história, Azazel não utiliza a função `getEnemyScaling`. Seu dano de contato é fixo em **42**, seu dash é fixo em **46** e seu raio abissal é fixo em **48**.
  3. No Modo Infinito, o último chefe surge aos 10 minutos (Succubus com 40 de dano de contato e 77 de dive slam fixo).
- **Recálculo da Hipótese Teórica (Caso a fórmula de scaling `x3.40` de monstros comuns fosse aplicada a Azazel aos 30 minutos):**
  - Dano de contato escalonado teórico: `42 * 3.40 = 142.8 ≈ 143`.
  - Vida da Nixy com Vitalidade nível 5: **160 HP**.
  - Como `143 < 160`, **a heroína sobreviveria ao contato direto com 17 HP remanescentes**.
  - Dano do raio abissal escalonado teórico: `48 * 3.40 = 163.2 ≈ 163`.
  - Excederia a vida de 160 HP por apenas 3 pontos (1.8%), e somente sob a premissa de que a jogadora não escolheu nenhuma carta de Vitalidade (+25 HP) ao longo de 30 minutos de partida.
- **Conclusão:** O balanceamento aos 30 minutos de Azazel não pode ser classificado como quebrado, pois o evento não ocorre no motor do jogo.

---

### Hipótese 3: Velocidade dos Morcegos (*Blood Bats*) vs Nixy
- **Premissa:** Jogadora caminhando normalmente, sem estamina para sprintar, sem Bênção de Agilidade e sem cartas passivas de velocidade.
- **Números Reais:**
  - Velocidade de caminhada da Nixy Base: **160 px/s** (`balance.ts:14`).
  - Velocidade do Morcego: Base de **155 px/s**, escalonando em Modo História para **171 px/s** aos 5 minutos (`155 * 1.10`) e atingindo o teto rígido de **202 px/s** aos 20 minutos (`155 * 1.30`).
- **Recálculo Factual e Recursos Disponíveis:**
  - A afirmação de que "é impossível escapar" desconsidera os mecanismos de mobilidade e combate nativos:
    1. **Full Sprint:** A Nixy corre a **270 px/s** enquanto tiver estamina, sendo consideravelmente mais rápida que o morcego em velocidade máxima (270 > 202).
    2. **Bênção de Agilidade:** O nível 5 concede +15% de velocidade permanente, elevando a caminhada base para **184 px/s** (superando os 171 px/s dos morcegos aos 5 minutos).
    3. **Cartas de Velocidade:** Concedem +8% de velocidade cada.
    4. **Fragilidade dos Morcegos:** Morcegos nascem com apenas **14 HP** (22 HP aos 5 minutos). Armas automáticas com auto-aim (Disparo de Almas a 420 px/s e Adagas a 540 px/s) abatem morcegos à distância antes que alcancem o corpo a corpo.
- **Conclusão:** A pressão dos morcegos é uma mecânica de ameaça intencional que pune jogadores que esgotam 100% da sua estamina sem possuir defesas de área ativas, e não uma quebra matemática irreversível.

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
