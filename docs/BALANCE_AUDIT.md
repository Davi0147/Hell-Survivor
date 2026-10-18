# Auditoria Técnica de Balanceamento — Hell Survivor

> **Status:** Documento de Auditoria (Pacote 1.3)  
> **Escopo:** Somente Leitura da base de código (`src/`)  
> **Data:** 17/10/2026  
> **Diretriz:** Levantamento factual e numérico sem juízo de valor, servindo como base técnica para decisões do dono do projeto.

---

## 1. Visão Geral da Auditoria

Atualmente, o arquivo [`src/config/balance.ts`](file:///E:/Downloads%20HD/Hell%20Survivor/src/config/balance.ts) centraliza os atributos base da heroína Nixy, a arma inicial *Disparo de Almas* (nível 1), as regras de XP para avanço de nível e a fórmula global de escalonamento temporal (`getEnemyScaling`).

No entanto, a totalidade das armas secundárias, evoluções arcanas, atributos de inimigos comuns, fases de chefes, altares e intervalos de spawn do diretor de jogo reside dispersa diretamente no código das classes e cenas em [`src/`](file:///E:/Downloads%20HD/Hell%20Survivor/src/). 

Abaixo encontra-se o inventário exaustivo de todos os números de gameplay dispersos fora de `balance.ts`.

---

## 2. Inventário de Gameplay Fora de `balance.ts`

### 2.1 Personagem e Mecânicas da Nixy

| Arquivo : Símbolo | Valor Atual | Descrição / Efeito | Recomendação |
| :--- | :--- | :--- | :--- |
| [`Nixy.ts:TRAIL_INTERVAL_MS`](file:///E:/Downloads%20HD/Hell%20Survivor/src/entities/characters/Nixy.ts#L8) | `40 ms` | Intervalo de geração do rastro fantasma de corrida | Migrar para `balance.ts` |
| [`Nixy.ts:rerollsRemaining`](file:///E:/Downloads%20HD/Hell%20Survivor/src/entities/characters/Nixy.ts#L51) | `2` | Cargas base de reroll de cartas no início da partida | Migrar para `balance.ts` |
| [`Nixy.ts:applyAcidRoot`](file:///E:/Downloads%20HD/Hell%20Survivor/src/entities/characters/Nixy.ts#L55) | `1000 ms` | Duração da prisão ácida (paralisação física) | Migrar para `balance.ts` |
| [`Nixy.ts:applySlow`](file:///E:/Downloads%20HD/Hell%20Survivor/src/entities/characters/Nixy.ts#L65) | `0.60x (40%), 600 ms` | Multiplicador de lentidão e duração padrão do debuff | Migrar para `balance.ts` |
| [`Nixy.ts:applyKnockback`](file:///E:/Downloads%20HD/Hell%20Survivor/src/entities/characters/Nixy.ts#L73) | `220 ms, 0.008 shake` | Duração e tremor de câmera do empurrão sofrido | Migrar para `balance.ts` |
| [`BaseCharacter.ts:body.setSize`](file:///E:/Downloads%20HD/Hell%20Survivor/src/entities/characters/BaseCharacter.ts#L76) | `28x36 px, offset (18, 24)` | Caixa de colisão física da heroína | Migrar para `balance.ts` |
| [`BaseCharacter.ts:maxUltimateCharge`](file:///E:/Downloads%20HD/Hell%20Survivor/src/entities/characters/BaseCharacter.ts#L48) | `100` | Custo de carga total para ativar a Suprema | Migrar para `balance.ts` |
| [`UltimateSystem.ts:ETERNAL_DESPAIR`](file:///E:/Downloads%20HD/Hell%20Survivor/src/systems/UltimateSystem.ts#L186) | `5000 ms aura, 8 detonações, 140 dmg` | Duração da aura, quantidade de detonações e dano em área | Migrar para `balance.ts` |

---

### 2.2 Armas e Projéteis (Upgrades e Evoluções)

#### A) Disparo de Almas / Raio do Apocalipse (`SoulBoltWeapon.ts`)
| Símbolo | Valor Atual | Descrição / Efeito | Recomendação |
| :--- | :--- | :--- | :--- |
| `upgrade(): damage` | `+6 / nível` | Aumento de dano por carta de upgrade (níveis 2 a 5) | Migrar para `balance.ts` |
| `upgrade(): cooldownMs` | `-60 ms / nível (piso 550 ms)` | Redução de recarga por nível | Migrar para `balance.ts` |
| `upgrade(): projectileSpeed` | `+25 / nível` | Aumento da velocidade linear por nível | Migrar para `balance.ts` |
| `evolve(): damage` | `46` | Dano base do Raio do Apocalipse | Migrar para `balance.ts` |
| `evolve(): cooldownMs` | `520 ms` | Tempo de recarga da evolução | Migrar para `balance.ts` |
| `evolve(): projectileSpeed` | `580` | Velocidade linear da evolução | Migrar para `balance.ts` |
| `evolve(): pierce` | `3` | Quantidade de penetrações em inimigos | Migrar para `balance.ts` |
| `evolve(): extraCount` | `+1 projétil` | Projétil bônus no cone frontal | Migrar para `balance.ts` |
| `fire(): spreadStep` | `0.18 rad (0.14 rad evo)` | Espalhamento angular do cone de disparos | Migrar para `balance.ts` |

#### B) Lâminas Orbitais / Ceifadora do Vazio (`VoidScythesWeapon.ts`)
| Símbolo | Valor Atual | Descrição / Efeito | Recomendação |
| :--- | :--- | :--- | :--- |
| `Base: damage` | `9` | Dano base contínuo por acerto | Migrar para `balance.ts` |
| `Base: orbitRadius` | `70 px` | Raio da órbita ao redor da heroína | Migrar para `balance.ts` |
| `Base: rotationSpeed` | `3.6 rad/s` | Velocidade angular das lâminas | Migrar para `balance.ts` |
| `Base: bladeCount` | `1 inicial (máx 6)` | Quantidade inicial e limite de foices | Migrar para `balance.ts` |
| `hitEnemy: enemyHitCooldown` | `260 ms (155 ms evo)` | Janela de imunidade por alvo para cada lâmina | Migrar para `balance.ts` |
| `hitEnemy: hitRadius` | `26 px (32 px evo)` | Raio de contato para detecção de colisão | Migrar para `balance.ts` |
| `evolve(): damage` | `22` | Dano por acerto da Ceifadora do Vazio | Migrar para `balance.ts` |
| `evolve(): orbitRadius` | `90 px` | Expansão do círculo de proteção | Migrar para `balance.ts` |
| `evolve(): rotationSpeed` | `6.2 rad/s` | Quase dobra a velocidade angular orbital | Migrar para `balance.ts` |
| `evolve(): bladeCount` | `6` | Conjunto completo de foices ativas | Migrar para `balance.ts` |

#### C) Adagas de Sangue (`BloodDaggersWeapon.ts`)
| Símbolo | Valor Atual | Descrição / Efeito | Recomendação |
| :--- | :--- | :--- | :--- |
| `Base: damage` | `15` | Dano inicial por adaga | Migrar para `balance.ts` |
| `Base: cooldownMs` | `760 ms` | Recarga inicial da salva de arremessos | Migrar para `balance.ts` |
| `Base: range` | `340 px` | Alcance máximo de trajetória | Migrar para `balance.ts` |
| `Base: projectileSpeed` | `540 px/s` | Velocidade de disparo | Migrar para `balance.ts` |
| `Base: projectileCount` | `3` | Leque inicial de adagas | Migrar para `balance.ts` |
| `Base: pierce` | `1` | Perfuração inicial por lâmina | Migrar para `balance.ts` |
| `upgrade(): damage` | `+4 / nível (até 31)` | Dano escalonado até nível 5 | Migrar para `balance.ts` |
| `upgrade(): count` | `+1 / nível (até 7)` | Quantidade de adagas disparadas | Migrar para `balance.ts` |
| `upgrade(): cooldownMs` | `-45 ms / nível (piso 480 ms)` | Redução do tempo entre arremessos | Migrar para `balance.ts` |
| `upgrade(): pierce` | `+1 nos níveis 3 e 5 (até 3)` | Perfurações adicionais | Migrar para `balance.ts` |

#### D) Meteoro Infernal / Cataclismo Solar (`InfernalMeteorWeapon.ts`)
| Símbolo | Valor Atual | Descrição / Efeito | Recomendação |
| :--- | :--- | :--- | :--- |
| `Base: damage` | `46` | Dano explosivo no centro da cratera | Migrar para `balance.ts` |
| `Base: cooldownMs` | `2400 ms` | Intervalo entre impactos | Migrar para `balance.ts` |
| `Base: range` | `68 px` | Raio da explosão | Migrar para `balance.ts` |
| `Base: meteorCount` | `1 (máx 4)` | Meteoros por salva nos níveis 1 a 5 | Migrar para `balance.ts` |
| `upgrade(): damage` | `+10 / nível (até 86)` | Dano escalonado até nível 5 | Migrar para `balance.ts` |
| `upgrade(): range` | `+6 px / nível (até 92 px)` | Expansão da área de dano | Migrar para `balance.ts` |
| `upgrade(): cooldownMs` | `-160 ms / nível (piso 1650 ms)` | Redução de recarga | Migrar para `balance.ts` |
| `evolve(): damage` | `95` | Dano de impacto do Cataclismo Solar | Migrar para `balance.ts` |
| `evolve(): meteorCount` | `5` | Quantidade de meteoros simultâneos | Migrar para `balance.ts` |
| `evolve(): range` | `95 px` | Raio de impacto da explosão solar | Migrar para `balance.ts` |
| `evolve(): cooldownMs` | `1200 ms` | Recarga cortada pela metade | Migrar para `balance.ts` |

#### E) Chamas do Purgatório / Supernova Abissal (`HellfireAuraWeapon.ts`)
| Símbolo | Valor Atual | Descrição / Efeito | Recomendação |
| :--- | :--- | :--- | :--- |
| `Base: damage` | `16` | Dano por pulso vulcânico | Migrar para `balance.ts` |
| `Base: pulseCooldownMs` | `1400 ms` | Intervalo entre emissões de calor | Migrar para `balance.ts` |
| `Base: range` | `95 px` | Raio do anel de fogo | Migrar para `balance.ts` |
| `upgrade(): damage` | `+7 / nível (até 44)` | Aumento de dano térmico | Migrar para `balance.ts` |
| `upgrade(): range` | `+18 px / nível (até 167 px)` | Expansão da onda de choque | Migrar para `balance.ts` |
| `upgrade(): pulseCooldownMs`| `-80 ms / nível (piso 900 ms)` | Frequência de ondas | Migrar para `balance.ts` |
| `evolve(): damage` | `78` | Dano por detonação estelar | Migrar para `balance.ts` |
| `evolve(): range` | `215 px` | Cobre grande porção da tela | Migrar para `balance.ts` |
| `evolve(): pulseCooldownMs` | `820 ms` | Ciclo rápido de explosões | Migrar para `balance.ts` |
| `evolve(): healPerPulse` | `+1.2 HP` | Cura concedida à heroína ao atingir alvos | Migrar para `balance.ts` |

#### F) Cadeias Abissais / Grilhões do Tartarus (`AbyssalChainsWeapon.ts`)
| Símbolo | Valor Atual | Descrição / Efeito | Recomendação |
| :--- | :--- | :--- | :--- |
| `Base: damage` | `18` | Dano do chicote espectral | Migrar para `balance.ts` |
| `Base: cooldownMs` | `1750 ms` | Recarga inicial | Migrar para `balance.ts` |
| `Base: range` | `165 px` | Raio de alcance das correntes | Migrar para `balance.ts` |
| `Base: targetCount` | `3 (máx 7)` | Alvos encadeados por golpe | Migrar para `balance.ts` |
| `Base: stunDurationMs` | `950 ms` | Tempo de paralisia física | Migrar para `balance.ts` |
| `upgrade(): damage` | `+6 / nível (até 42)` | Dano escalonado | Migrar para `balance.ts` |
| `upgrade(): range` | `+16 px / nível (até 229 px)` | Raio de captura | Migrar para `balance.ts` |
| `upgrade(): stunDurationMs` | `+120 ms / nível (até 1430 ms)` | Duração do atordoamento | Migrar para `balance.ts` |
| `upgrade(): cooldownMs` | `-110 ms / nível (piso 1250 ms)` | Redução de recarga | Migrar para `balance.ts` |
| `evolve(): damage` | `54` | Dano dos Grilhões do Tartarus | Migrar para `balance.ts` |
| `evolve(): targetCount` | `8` | 8 inimigos presos simultaneamente | Migrar para `balance.ts` |
| `evolve(): range` | `280 px` | Quase tela inteira de alcance | Migrar para `balance.ts` |
| `evolve(): stunDurationMs` | `1800 ms` | 1.8 segundo de paralisia total | Migrar para `balance.ts` |
| `evolve(): cooldownMs` | `950 ms` | Recarga da arma evoluída | Migrar para `balance.ts` |

---

### 2.3 Inimigos Comuns e Elites

| Arquivo : Inimigo | HP Base | Velocidade Base | Dano Base | Habilidades Especiais / Observações |
| :--- | :--- | :--- | :--- | :--- |
| [`ZombieDog.ts`](file:///E:/Downloads%20HD/Hell%20Survivor/src/entities/enemies/ZombieDog.ts) | `35` | `85 px/s` | `9` | Perseguição linear em 4 eixos; tamanho de colisão 38x28 px |
| [`ZombieDog.ts:Elite`](file:///E:/Downloads%20HD/Hell%20Survivor/src/entities/enemies/ZombieDog.ts#L33) | `140` | `90 px/s` | `13` | Escala visual 1.25x; tint vermelho (0xff4455); drop garantido |
| [`BloodBat.ts`](file:///E:/Downloads%20HD/Hell%20Survivor/src/entities/enemies/BloodBat.ts) | `14` | `155 px/s` | `5` | Escala 0.75x; voo sinoidal; alta densidade em bandos (até 12) |
| [`MummyEnemy.ts`](file:///E:/Downloads%20HD/Hell%20Survivor/src/entities/enemies/MummyEnemy.ts) | `130` | `58 px/s` | `15` | Movimento em zigue-zague; gera poças tóxicas a cada 220 ms |
| [`MummyEnemy.ts:PoisonPuddle`](file:///E:/Downloads%20HD/Hell%20Survivor/src/entities/enemies/MummyEnemy.ts#L7) | — | — | `5 / 450 ms` | Duração 6500 ms; raio 18 px; aplica lentidão de 40% (0.60x) |
| [`SkullSlime.ts`](file:///E:/Downloads%20HD/Hell%20Survivor/src/entities/enemies/SkullSlime.ts) | `160` | `46 px/s` | `11` | Perseguição lenta; entra em telegrafia de investida a 135 px |
| [`SkullSlime.ts:Dash`](file:///E:/Downloads%20HD/Hell%20Survivor/src/entities/enemies/SkullSlime.ts#L18) | — | `300 px/s` | `15 impacto` | Investida de alta velocidade em linha reta |
| [`SkullSlime.ts:Explosion`](file:///E:/Downloads%20HD/Hell%20Survivor/src/entities/enemies/SkullSlime.ts#L22) | — | — | `24 explosão` | Raio de detonação 52 px; aplica prisão ácida (1.0s) na Nixy |
| [`Succubus.ts`](file:///E:/Downloads%20HD/Hell%20Survivor/src/entities/enemies/Succubus.ts) | `85` | `115 px/s` | `18` | Mini-chefe voador em 8 direções; corpo físico 38x48 px |
| [`BaseEnemy.ts:applyStun`](file:///E:/Downloads%20HD/Hell%20Survivor/src/entities/enemies/BaseEnemy.ts#L48) | — | — | — | Chefes recebem apenas 35% da duração de qualquer stun |

---

### 2.4 Chefes de Capítulo

#### A) Succubus Boss (`SuccubusBoss.ts` — Capítulo 1 / Modo Infinito 10m)
| Símbolo | Valor Atual | Descrição / Efeito | Recomendação |
| :--- | :--- | :--- | :--- |
| `maxHp / hp` | `9000` | Vida base no minuto zero | Migrar para `balance.ts` |
| `speed` | `125 px/s` | Velocidade de perseguição | Migrar para `balance.ts` |
| `damage` | `35` | Dano por contato direto | Migrar para `balance.ts` |
| `dashCooldown` | `4500 ms` | Intervalo da Investida Telegrafada | Migrar para `balance.ts` |
| `DASH_SPEED / DURATION` | `620 px/s, 420 ms` | Velocidade da arrancada com linha vermelha | Migrar para `balance.ts` |
| `shootCooldown` | `3500 ms` | Intervalo de disparo de 5 orbes sombrios | Migrar para `balance.ts` |
| `DarkOrbProjectile: damage` | `18` | Dano individual por orbe de projétil | Migrar para `balance.ts` |
| `airJumpCooldown` | `13000 ms` | Recarga do Salto Aéreo Esmagador (Meteor Slam) | Migrar para `balance.ts` |
| `SLAM_CHARGE_DURATION` | `3600 ms` | Duração da telegrafia com círculo vermelho crescente | Migrar para `balance.ts` |
| `SLAM_MAX_RADIUS` | `190 px` | Raio do impacto e da onda de choque | Migrar para `balance.ts` |
| `executeDiveSlam(): damage` | `77` | Dano em área sofrido ao ser pega no círculo | Migrar para `balance.ts` |
| `SLAM_RECOVERY_DURATION` | `2000 ms` | Janela de atordoamento e vulnerabilidade pós-queda | Migrar para `balance.ts` |

#### B) Azazel Boss (`AzazelBoss.ts` — Capítulo 2 / Capítulo 202)
| Símbolo | Valor Atual | Descrição / Efeito | Recomendação |
| :--- | :--- | :--- | :--- |
| `maxHp / hp` | `16000` | Vida base no minuto zero | Migrar para `balance.ts` |
| `speed` | `138 px/s` | Velocidade base do Chefe Final | Migrar para `balance.ts` |
| `damage` | `42` | Dano por contato direto | Migrar para `balance.ts` |
| `arenaRadius` | `680 px` | Barreira mágica que confina o jogador no confronto | Migrar para `balance.ts` |
| `dashCooldown` | `5200 ms` | Recarga da investida rápida | Migrar para `balance.ts` |
| `DASH_SPEED / DURATION` | `760 px/s, 380 ms` | Velocidade da investida com telegrafia fina de 400ms | Migrar para `balance.ts` |
| `Rapid Dash: damage` | `46` | Dano sofrido por impacto da investida | Migrar para `balance.ts` |
| `lightningCooldown` | `7800 ms` | Recarga da Tempestade de Raios | Migrar para `balance.ts` |
| `Lightning Bolt: damage` | `48` | Dano sofrido ao ser atingida pelo raio após 1.0s de aviso | Migrar para `balance.ts` |
| `spiralCooldown` | `11500 ms` | Recarga da rajada espiral de orbes | Migrar para `balance.ts` |
| `Phase 2: Clones espectrais`| `8 clones, 32 dmg` | 8 cópias em círculo disparando orbes para o centro | Migrar para `balance.ts` |
| `Phase 2: Dark 5-Dashes` | `38 dmg / acerto` | 5 investidas consecutivas no escuro total | Migrar para `balance.ts` |
| `Phase 3: Cristais` | `3 cristais, 5s cada` | Azazel fica oculto/imune enquanto 3 cristais são purificados | Migrar para `balance.ts` |
| `Phase 4: Showdown final` | `20% a 0% HP` | Cooldowns reduzidos em 30%; arena vermelha pulsante | Migrar para `balance.ts` |

---

### 2.5 Itens, Gemas e Altares

| Arquivo : Símbolo | Valor Atual | Descrição / Efeito | Recomendação |
| :--- | :--- | :--- | :--- |
| [`SoulGem.ts:xpValue`](file:///E:/Downloads%20HD/Hell%20Survivor/src/entities/items/SoulGem.ts#L39) | `Verde: 5, Azul: 20, Vermelha: 100, Roxa: 250, Dourada: 500` | Valores de experiência por tipo de gema de alma | Migrar para `balance.ts` |
| [`SoulGem.ts:attractSpeed`](file:///E:/Downloads%20HD/Hell%20Survivor/src/entities/items/SoulGem.ts#L33) | `220 px/s até 580 px/s` | Aceleração magnética de coleta | Migrar para `balance.ts` |
| [`CorruptedSoulItem.ts:soulValue`](file:///E:/Downloads%20HD/Hell%20Survivor/src/entities/items/CorruptedSoulItem.ts#L29) | `1` | Moeda permanente para a Árvore de Bênçãos | Migrar para `balance.ts` |
| [`MapItem.ts:chalice`](file:///E:/Downloads%20HD/Hell%20Survivor/src/entities/items/MapItem.ts#L88) | `50% maxHp` | Cura fixa da Taça de Vinho gerada pelo mapa | Migrar para `balance.ts` |
| [`EvolutionAltar.ts:captureRadius`](file:///E:/Downloads%20HD/Hell%20Survivor/src/entities/items/EvolutionAltar.ts#L8) | `65 px` | Raio do círculo rúnico de captura | Migrar para `balance.ts` |
| [`EvolutionAltar.ts:progressRate`](file:///E:/Downloads%20HD/Hell%20Survivor/src/entities/items/EvolutionAltar.ts#L46) | `+15.5% / s (recua -8% / s)` | Tempo de captura ~6.45 segundos contínuos | Migrar para `balance.ts` |
| [`BossSummonAltar.ts:encounterRadius`](file:///E:/Downloads%20HD/Hell%20Survivor/src/entities/items/BossSummonAltar.ts#L18) | `190 px` | Distância de aproximação para acordar o Boss | Migrar para `balance.ts` |
| [`AzazelCrystal.ts:captureRadius`](file:///E:/Downloads%20HD/Hell%20Survivor/src/entities/items/AzazelCrystal.ts#L7) | `78 px` | Raio de captura dos cristais dimensionais | Migrar para `balance.ts` |
| [`AzazelCrystal.ts:progressRate`](file:///E:/Downloads%20HD/Hell%20Survivor/src/entities/items/AzazelCrystal.ts#L6) | `+20% / s (5 segundos)` | Tempo necessário para purificar cada cristal | Migrar para `balance.ts` |

---

### 2.6 Cenas, Diretor de Hordas e Spawn

| Arquivo : Símbolo | Valor Atual | Descrição / Efeito | Recomendação |
| :--- | :--- | :--- | :--- |
| [`GameScene.ts:mapItemSpawnTimer`](file:///E:/Downloads%20HD/Hell%20Survivor/src/scenes/GameScene.ts#L891) | `40000 ms (40s)` | Intervalo de geração de itens no mapa (Cálice/Ímã/Baú) | Migrar para `balance.ts` |
| [`GameScene.ts:currentInterval`](file:///E:/Downloads%20HD/Hell%20Survivor/src/scenes/GameScene.ts#L966) | `max(450..650, 1500 - min * 350)` | Fórmula do intervalo entre ondas contínuas de monstros | Migrar para `balance.ts` |
| [`GameScene.ts:miniBoss3m`](file:///E:/Downloads%20HD/Hell%20Survivor/src/scenes/GameScene.ts#L978) | `180 s (3:00)` | Marco temporal do Titã Cerberus no Modo Infinito | Migrar para `balance.ts` |
| [`GameScene.ts:altarAwakening`](file:///E:/Downloads%20HD/Hell%20Survivor/src/scenes/GameScene.ts#L987) | `300 s (5:00)` | Despertar do Altar de Invocação no Modo Infinito | Migrar para `balance.ts` |
| [`GameScene.ts:miniBoss6m`](file:///E:/Downloads%20HD/Hell%20Survivor/src/scenes/GameScene.ts#L992) | `360 s (6:00)` | Marco temporal da Matriarca Succubus no Modo Infinito | Migrar para `balance.ts` |
| [`GameScene.ts:boss10m`](file:///E:/Downloads%20HD/Hell%20Survivor/src/scenes/GameScene.ts#L1001) | `600 s (10:00)` | Despertar da Succubus Boss Suprema no Modo Infinito | Migrar para `balance.ts` |
| [`GameScene.ts:bossMinionTimer`](file:///E:/Downloads%20HD/Hell%20Survivor/src/scenes/GameScene.ts#L1019) | `8500 ms (8.5s)` | Intervalo de reforços invocados durante a luta contra o chefe | Migrar para `balance.ts` |
| [`GameScene.ts:purifyPhases`](file:///E:/Downloads%20HD/Hell%20Survivor/src/scenes/GameScene.ts#L1524) | `25% e 60% (ou 90s e 210s)` | Gatilhos de transição para Fase 2 e Fase 3 de hordas | Migrar para `balance.ts` |

---

## 3. Tabela Calculada: Escalonamento Efetivo

Fórmulas oficiais do motor de jogo (`src/config/balance.ts`):
- **Modo História:** `HP = base * (1 + min * 0.12)`, `Dano = base * (1 + min * 0.06)`, `Velocidade = base * min(1.30, 1 + min * 0.02)`
- **Modo Infinito:** `HP = base * (1 + min * 0.16)`, `Dano = base * (1 + min * 0.08)`, `Velocidade = base * min(1.30, 1 + min * 0.02)`

### 3.1 Tabela de Atributos Efetivos (Minutos 0, 5, 10, 20, 30)

#### Modo História
| Entidade | Minuto 0 (Base) | Minuto 5 (x1.60 HP / x1.30 Dmg) | Minuto 10 (x2.20 HP / x1.60 Dmg) | Minuto 20 (x3.40 HP / x2.20 Dmg) | Minuto 30 (x4.60 HP / x2.80 Dmg) |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Zombie Dog** | 35 HP / 9 Dmg / 85 Spd | 56 HP / 12 Dmg / 94 Spd | 77 HP / 14 Dmg / 102 Spd | 119 HP / 20 Dmg / 111 Spd | 161 HP / 25 Dmg / 111 Spd |
| **Blood Bat** | 14 HP / 5 Dmg / 155 Spd | 22 HP / 7 Dmg / **171 Spd** | 31 HP / 8 Dmg / **186 Spd** | 48 HP / 11 Dmg / **202 Spd** | 64 HP / 14 Dmg / **202 Spd** |
| **Mummy** | 130 HP / 15 Dmg / 58 Spd | 208 HP / 20 Dmg / 64 Spd | 286 HP / 24 Dmg / 70 Spd | 442 HP / 33 Dmg / 75 Spd | 598 HP / 42 Dmg / 75 Spd |
| **Skull Slime** | 160 HP / 15 Dmg / 46 Spd | 256 HP / 20 Dmg / 51 Spd | 352 HP / 24 Dmg / 55 Spd | 544 HP / 33 Dmg / 60 Spd | 736 HP / 42 Dmg / 60 Spd |
| **Zombie Dog Elite** | 140 HP / 13 Dmg / 90 Spd | 224 HP / 17 Dmg / 99 Spd | 308 HP / 21 Dmg / 108 Spd | 476 HP / 29 Dmg / 117 Spd | 644 HP / 36 Dmg / 117 Spd |
| **Succubus (Normal)** | 85 HP / 18 Dmg / 115 Spd | 136 HP / 23 Dmg / 127 Spd | 187 HP / 29 Dmg / 138 Spd | 289 HP / 40 Dmg / 150 Spd | 391 HP / 50 Dmg / 150 Spd |
| **Succubus Boss (Cap 1)**| 9.000 HP / 35 Dmg (77 Slam) | 14.400 HP / 46 Dmg (100 Slam) | 19.800 HP / 56 Dmg (123 Slam) | 30.600 HP / 77 Dmg (169 Slam) | 41.400 HP / 98 Dmg (216 Slam) |
| **Azazel Boss (Cap 2)** | 16.000 HP / 42 Dmg (48 Raio) | 25.600 HP / 55 Dmg (62 Raio) | 35.200 HP / 67 Dmg (77 Raio) | 54.400 HP / 92 Dmg (106 Raio) | 73.600 HP / 118 Dmg (134 Raio) |

#### Modo Infinito (Endless)
| Entidade | Minuto 0 (Base) | Minuto 5 (x1.80 HP / x1.40 Dmg) | Minuto 10 (x2.60 HP / x1.80 Dmg) | Minuto 20 (x4.20 HP / x2.60 Dmg) | Minuto 30 (x5.80 HP / x3.40 Dmg) |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Zombie Dog** | 35 HP / 9 Dmg / 85 Spd | 63 HP / 13 Dmg / 94 Spd | 91 HP / 16 Dmg / 102 Spd | 147 HP / 23 Dmg / 111 Spd | 203 HP / 31 Dmg / 111 Spd |
| **Blood Bat** | 14 HP / 5 Dmg / 155 Spd | 25 HP / 7 Dmg / **171 Spd** | 36 HP / 9 Dmg / **186 Spd** | 59 HP / 13 Dmg / **202 Spd** | 81 HP / 17 Dmg / **202 Spd** |
| **Mummy** | 130 HP / 15 Dmg / 58 Spd | 234 HP / 21 Dmg / 64 Spd | 338 HP / 27 Dmg / 70 Spd | 546 HP / 39 Dmg / 75 Spd | 754 HP / 51 Dmg / 75 Spd |
| **Skull Slime** | 160 HP / 15 Dmg / 46 Spd | 288 HP / 21 Dmg / 51 Spd | 416 HP / 27 Dmg / 55 Spd | 672 HP / 39 Dmg / 60 Spd | 928 HP / 51 Dmg / 60 Spd |
| **Zombie Dog Elite** | 140 HP / 13 Dmg / 90 Spd | 252 HP / 18 Dmg / 99 Spd | 364 HP / 23 Dmg / 108 Spd | 588 HP / 34 Dmg / 117 Spd | 812 HP / 44 Dmg / 117 Spd |
| **Succubus (Normal)** | 85 HP / 18 Dmg / 115 Spd | 153 HP / 25 Dmg / 127 Spd | 221 HP / 32 Dmg / 138 Spd | 357 HP / 47 Dmg / 150 Spd | 493 HP / 61 Dmg / 150 Spd |
| **Succubus Boss (Cap 1)**| 9.000 HP / 35 Dmg (77 Slam) | 16.200 HP / 49 Dmg (108 Slam) | 23.400 HP / 63 Dmg (139 Slam) | 37.800 HP / **91 Dmg (200 Slam)** | 52.200 HP / **119 Dmg (262 Slam)** |
| **Azazel Boss (Cap 2)** | 16.000 HP / 42 Dmg (48 Raio) | 28.800 HP / 59 Dmg (67 Raio) | 41.600 HP / 76 Dmg (86 Raio) | 67.200 HP / **109 Dmg (125 Raio)** | 92.800 HP / **143 Dmg (163 Raio)** |

---

### 3.2 Comparativo com a Nixy e Pontos de Ruptura

#### Atributos da Heroína Nixy:
- **Nixy Base (sem cartas/bênçãos):** 100 HP, 160 Velocidade Base, 270 Full Sprint, 100 Estamina.
- **Nixy com Bênçãos no Máximo (Vitalidade 5):** 160 HP, 184 Velocidade Base (+15%), 125 Estamina (+25%).
- **Nixy com Build Máxima na Partida:** ~210 HP (+2 cartas de Vitalidade), ~2.000 a 3.000 DPS combinado (6 armas evoluídas + 60% de bônus de dano global).

#### Onde a Curva se Rompe:
1. **Velocidade dos Morcegos vs Caminhada da Nixy:**
   - Aos **5 minutos**, a velocidade do *Blood Bat* atinge **171 px/s** (superando os 160 px/s da caminhada da Nixy).
   - Aos **20 minutos**, atinge o teto de **202 px/s**.
   - **Efeito:** Se a estamina da Nixy esgotar (0 de estamina), é fisicamente impossível escapar dos morcegos andando. Sem abate imediato por armas automáticas, o acerto é garantido.
2. **Dano de Chefes vs Vida Máxima:**
   - O *Dive Slam* da Succubus Boss causa 77 de dano base. Aos 5 min no Modo História causa 100 de dano, e aos 10 min causa 123 de dano.
   - Aos **30 minutos** no Modo Infinito, o contato normal de Azazel causa **143 de dano** e seu raio causa **163 de dano**. A vida da Nixy com bênçãos máximas é **160 HP**.
   - **Efeito:** A partir do minuto 30, qualquer golpe de chefe resulta em morte instantânea em 1 hit (One-Hit Kill), independentemente do investimento prévio no Altar de Bênçãos.
3. **Escalonamento de HP dos Chefes vs DPS de Meio de Jogo:**
   - No Capítulo 1, a Succubus Boss surge tipicamente por volta de 3 a 5 minutos (100 almas purificadas), possuindo entre 12.000 e 14.400 HP.
   - Nesse estágio, a jogadora possui 1 ou 2 armas de nível 3-4 (DPS estimado de 180 a 280).
   - **Efeito:** A luta exige de 45 a 80 segundos de dano contínuo sem interrupções. No Capítulo 2, Azazel surge com 25.600 HP aos 5 min, exigindo mais de 100 segundos de combate ininterrupto.

---

## 4. Análise de Telemetria e Coleta de Dados

### 4.1 O que o Sistema Coleta Hoje

O projeto possui dois módulos de monitoramento ativos:
1. [`DebugSessionLogger.ts`](file:///E:/Downloads%20HD/Hell%20Survivor/src/systems/DebugSessionLogger.ts):
   - **Desempenho:** FPS atual, FPS mínimo, FPS médio, detecção de quedas bruscas de taxa de quadros.
   - **Contagem de Entidades:** Número de inimigos ativos, gemas ativas no chão, itens de mapa e projéteis.
   - **Estado do Jogador:** HP da Nixy, posição (x, y), nível atual, lista de armas equipadas.
   - **Tratamento de Falhas:** Captura de erros globais `window.onerror` e `unhandledrejection`.
   - **Persistência:** Buffer de até 600 eventos em memória e backup dos 50 mais recentes no `localStorage`.
2. [`AutoPlayTestAgent.ts`](file:///E:/Downloads%20HD/Hell%20Survivor/src/systems/AutoPlayTestAgent.ts):
   - Relatórios automáticos de sessões simuladas: tempo de sobrevivência (`survivalTimeSec`), nível alcançado, abates (`kills`), HP restante e armas equipadas.

### 4.2 O que Falta Coletar para Permitir Balanceamento por Dados

Para que as decisões de balanceamento possam ser tomadas com embasamento estatístico (e não por tentativa e erro), faltam métricas essenciais:

1. **Dano Recebido por Fonte (Damage Received by Source):**
   - *Hoje:* Só sabemos que a jogadora perdeu HP ou morreu.
   - *Falta:* Discriminar quanto dano veio de: Cão Zumbi, Morcego, Poça da Múmia, Detonação do Slime, Investida do Chefe ou Raio de Azazel.
2. **Tempo de Vida Médio por Tipo de Inimigo (Time-To-Kill / TTK):**
   - *Falta:* Medir quantos segundos cada monstro permanece vivo desde o spawn até a morte. (Identifica se Skull Slimes ou Múmias estão funcionando como esponjas de dano excessivas).
3. **Dano Real e DPS por Arma Equipada (`totalDamageDealt`):**
   - *Falta:* Cada arma registrar seu volume acumulado de dano causado na partida. Sem isso, não há como saber se *Void Scythes* causa 65% do dano total enquanto *Abyssal Chains* causa 4%.
4. **Taxa de Escolha e Rejeição de Cartas (Pick/Skip Rate):**
   - *Falta:* Registrar quais cartas foram oferecidas no modal de Level Up e qual delas foi selecionada. (Permite detectar armas ou passivas que nenhum jogador ou bot escolhe).
5. **Dano Desperdiçado (Overkill Damage):**
   - *Falta:* Medir quanto dano de projéteis de alto impacto (ex.: Meteoro Infernal com 95 de dano) é desperdiçado em inimigos que possuíam apenas 4 de HP.
6. **Frequência de Exaustão de Estamina:**
   - *Falta:* Quantas vezes a heroína atingiu estamina zero durante a partida e quanto tempo permaneceu no estado exausto.

---

## 5. Pontos de Decisão para o Dono do Projeto

Abaixo estão os pontos de atrito identificados na curva matemática atual, descritos de forma puramente factual para decisão da liderança do projeto:

1. **Velocidade dos Morcegos (Blood Bats) superando a Caminhada da Nixy:**
   - *Dado:* Nixy anda a 160 px/s. Morcegos nascem a 155 px/s e alcançam 171 px/s aos 5 minutos e 202 px/s aos 20 minutos.
   - *Consequência:* Sem estamina, o jogador não tem capacidade mecânica de escapar por posicionamento. O acerto é garantido a menos que o morcego seja morto antes de encostar.
2. **Dano do Dive Slam da Chefe Succubus (77 de dano) vs 100 de HP Base:**
   - *Dado:* O impacto do salto da Chefe do Capítulo 1 causa 77 de dano fixo em 190 px de raio. A vida inicial da heroína é 100.
   - *Consequência:* Um único erro consome 77% da barra inteira de uma heroína sem bênçãos. Se ela tiver tomado qualquer outro golpe prévio, o slam causa derrota imediata.
3. **Escalonamento de Dano de Chefes no Modo Infinito:**
   - *Dado:* Aos 30 minutos de Modo Infinito, o contato direto de Azazel causa 143 de dano e o raio abissal causa 163. A vida máxima com bênçãos no limite (Vitalidade 5) é 160.
   - *Consequência:* A partir de 30 minutos, qualquer acerto de chefe resulta em morte em 1 hit, independentemente de upgrades permanentes.
4. **Atordoamento (Stun) de Chefes vs Grilhões do Tartarus:**
   - *Dado:* Chefes sofrem 35% da duração de stun. Grilhões do Tartarus aplica 1800 ms de stun com 950 ms de recarga.
   - *Consequência:* O chefe fica atordoado por 630 ms a cada 950 ms de intervalo (permanece paralisado durante 66% do combate).
5. **Volume de Poças Tóxicas de Múmias no Cenário:**
   - *Dado:* Cada múmia deposita uma poça a cada 220 ms, com duração de 6.5s e limite de 18 poças por múmia. A Fase 3 permite até 4 múmias simultâneas.
   - *Consequência:* O mapa pode acumular até 72 poças ao mesmo tempo, aplicando lentidão de 40% contínua e dano periódico sobre grande parte da área jogável.
6. **Cálice de Sangue (Taça) no Cenário:**
   - *Dado:* O cálice gerado a cada 40s cura 50% da vida máxima do jogador instantaneamente (`Math.round(maxHp * 0.5)`).
   - *Consequência:* Uma única coleta no chão recupera de 50 a 105 HP de uma vez, superando os valores de regeneração passiva de cartas (0.2 a 0.8 HP/s).
7. **Dispersão de Valores fora de `balance.ts`:**
   - *Dado:* 100% dos atributos de armas secundárias, inimigos, chefes e timers de spawn estão codificados em arquivos soltos.
   - *Consequência:* Ajustes de balanceamento exigem alterar classes de entidades e lógica de física diretamente, elevando o risco de regressões mecânicas a cada iteração.
