# Avaliação de Viabilidade Técnica: Ciclo Recorrente de Chefes no Modo Infinito

- **Data da Avaliação:** 2026-10-18
- **Documento:** `docs/FICHA_CICLO_DE_CHEFES.md`
- **Autor:** Antigravity (Engenharia de Software)
- **Protocolo:** Regra 11 de `AGENTS.md` (Avaliação Obrigatória de Viabilidade Técnica)
- **Status:** `[ FAZER ADAPTADO ]` — Proposta Técnica com Evidências do Código Real

---

## 1. Objetivo Entendido

- **O que foi entendido (1 frase):** No Modo Infinito, após a derrota do chefe inicial do Altar de Invocação, o jogo deve convocar novos confrontos de chefes em intervalos regulares de tempo, sorteando entre os chefes da campanha e escalonando o desafio até a morte definitiva do jogador.
- **O que NÃO foi entendido / Pontos em aberto:**
  1. *Gatilho de spawn:* O novo chefe nasce automaticamente no mapa (como aos 10:00) ou o Altar de Invocação se reativa no mapa exigindo que o jogador se desloque até ele para tocar no pentagrama?
  2. *Escopo de Chefes elegíveis:* Azazel deve ser incluído? Ele possui 4 fases complexas com banimento de tela para outra dimensão e clones espectrais, o que quebra a integridade da arena do Capítulo 1.
  3. *Recompensas:* Cada chefe adicional do ciclo deve entregar baú + gemas roxas + almas corrompidas completas ou apenas um baú de upgrade?

---

## 2. Viabilidade Técnica com Evidência no Código

### 2.1. Análise de Elegibilidade dos Chefes de História

#### Chefe 1: Succubus Imperial (Imperatriz Rosalin — `SuccubusBoss.ts`)
- **Status:** **100% VIÁVEL**.
- **Evidência no código:**
  - Instanciação e spawn: [`GameScene.ts:2813-2816`](../src/scenes/GameScene.ts#L2813-L2816) e [`GameScene.ts:1706-1716`](../src/scenes/GameScene.ts#L1706-L1716).
  - A Succubus opera dentro da arena regular sem exigir mudança de tilemap, sem transições de câmera disruptivas e sem travamento de HUD.
  - Seus projéteis (`Salva de Orbes Sombrios`, `SuccubusBoss.ts:380`) e o `Salto Aéreo Esmagador` (`SuccubusBoss.ts:460`) interagem de forma limpa com as hordas normais.

#### Chefe 2: Azazel, O Anjo Caído (`AzazelBoss.ts`)
- **Status:** **INVIÁVEL NA FORMA ATUAL (Exige Adaptação Obrigatória)**.
- **Evidência no código:**
  - Azazel opera em uma máquina de combate de 4 fases cinematográficas:
    1. *Fase 1 (100% -> 50% HP):* Confronto padrão na arena ([`AzazelBoss.ts:412-890`](../src/entities/enemies/AzazelBoss.ts#L412-L890)).
    2. *Fase 2 (50% -> 20% HP):* Domínio da Escuridão com 8 clones espectrais (`AzazelPhantomClone`, [`AzazelBoss.ts:898-1180`](../src/entities/enemies/AzazelBoss.ts#L898-L1180)).
    3. *Fase 3 (Trava aos 20% HP — Banimento Dimensional):* [`GameScene.ts:3043-3090`](../src/scenes/GameScene.ts#L3043-L3090):
       ```typescript
       // Linha 3046 em GameScene.ts:
       this.loadCustomMapLayout(202); // Muda para o mapa dimensional fechado
       // Linha 3112 em GameScene.ts (ao purificar os 3 Cristais):
       this.loadCustomMapLayout(2);   // HARDCODED: Teleporta para o Capítulo 2!
       ```
  - **O Risco Crítico:** O Modo Infinito roda na arena do Capítulo 1. Se Azazel entrar na Fase 3, ele transportará o jogador para a Dimensão 202; ao destruir os cristais, a linha 3112 executará `loadCustomMapLayout(2)`, **teleportando o jogador para o Capítulo 2 no meio de uma partida infinita do Capítulo 1**, destruindo o layout do mapa, os spawners e a coerência do save!
  - **Adaptação Necessária para Azazel no Infinito:** Criar uma flag no spawn do Azazel (ex.: `isEndlessVariant = true`) que **suprime a Fase 3 (Banimento Dimensional)**, fazendo com que aos 20% de vida ele entre direto na Fase 4 (Showdown com velocidade ampliada) na própria arena do Infinito, sem cristais e sem troca de mapa.

---

### 2.2. Escalonamento Numérico dos Chefes (Scaling)

- **Evidência no código:**
  - Atualmente, **nenhum chefe ou minichefe utiliza a função de escalonamento** [`balance.ts:getEnemyScaling()`](../src/config/balance.ts#L30):
    - `TitanCerberus`: 1400 HP, 95 vel, 20 dano fixos ([`GameScene.ts:1652`](../src/scenes/GameScene.ts#L1652)).
    - `MatriarchSuccubus`: 2400 HP, 115 vel, 24 dano fixos ([`GameScene.ts:1683`](../src/scenes/GameScene.ts#L1683)).
    - `SuccubusBossEndless`: 12000 HP, 135 vel, 40 dano fixos ([`GameScene.ts:1716`](../src/scenes/GameScene.ts#L1716)).
    - `AzazelBoss`: 26000 HP, 140 vel, 45 dano fixos ([`GameScene.ts:2970`](../src/scenes/GameScene.ts#L2970)).
- **Diagnóstico:** No Modo Infinito, as armas evoluídas do jogador (como *Supernova Abissal* e *Raio do Apocalipse*) escalam para centenas de dano por segundo. Um chefe convocado aos 20 ou 25 minutos com os mesmos 12000 HP do minuto 5 morrerá em menos de 4 segundos.
- **Solução Recomendada:** Criar uma função pura `getEndlessBossScaling(cycleIndex: number)`:
  - Multiplicador de HP: `1.0 + (cycleIndex * 0.40)` (+40% de vida a cada ciclo).
  - Multiplicador de Dano: `1.0 + (cycleIndex * 0.15)` (+15% de dano por ciclo).
  - Velocidade: mantida constante ou limitada a teto de `+10%` para não gerar investidas indefensáveis.

---

### 2.3. Cronograma e Interação com Minichefes Existentes

A linha do tempo atual do Modo Infinito em [`GameScene.ts:988-1018`](../src/scenes/GameScene.ts#L988-L1018):
- **03:00 (180s):** `spawnTitanCerberus()` (Minichefe 1).
- **05:00 (300s):** `activateBossSummonAltar()` (Altar de Invocação).
- **06:00 (360s):** `spawnMatriarchSuccubus()` (Minichefe 2).
- **10:00 (600s):** `spawnSuccubusBossEndless()` (Chefe Suprema).

#### Intervalo Sugerido para o Ciclo Recorrente:
- **Intervalo ideal:** **3 minutos (180 segundos)** após a morte do chefe anterior.
- **Racional:** Uma batalha contra um chefe com scaling leva entre 40s e 90s. Um intervalo de 180s após a derrota concede aproximadamente 1 minuto a 1.5 minuto de respiro para farmar gemas normais da horda e se posicionar antes do próximo alarme sonoro.

---

### 2.4. Risco de Sobreposição de Chefes (Anti-Conflito de Estado)

- **Evidência no código:**
  - O sistema possui variáveis de controle de batalha:
    - `this.isBossFightActive` ([`GameScene.ts:98`](../src/scenes/GameScene.ts#L98)).
    - `this.bossInstance` ([`GameScene.ts:88`](../src/scenes/GameScene.ts#L88)).
  - Se um timer de ciclo tentar invocar um novo chefe enquanto `this.isBossFightActive === true`, ocorrerá **conflito destrutivo**: o novo chefe sobrescreverá `this.bossInstance`, deixando o chefe anterior como "órfão" imortal no mapa e dessincronizando a trilha sonora.
- **Regra de Defesa Obrigatória:**
  ```typescript
  if (this.isBossFightActive || (this.bossInstance && this.bossInstance.active && !this.bossInstance.isDead)) {
    // Adia o ciclo: aguarda a eliminação do chefe atual antes de agendar o próximo
    return;
  }
  ```

---

### 2.5. O Estado do Altar de Invocação no Modo Infinito

- **O que acontece hoje no código:**
  - Ao derrotar o chefe do altar, a linha 2828 de `GameScene.ts` chama:
    ```typescript
    this.bossSummonAltar.complete(); // Marca isCompleted = true, tint cinza 0x777777
    ```
  - Em [`BossSummonAltar.ts:58`](../src/entities/items/BossSummonAltar.ts#L58):
    ```typescript
    if (this.isCompleted || !player || !player.active) return;
    ```
  - Em [`GameScene.ts:2430`](../src/scenes/GameScene.ts#L2430):
    ```typescript
    if (!this.bossSummonAltar || this.bossSummonAltar.isActive) return;
    ```
  - **Conclusão:** O Altar hoje é **descartável de uso único**. Uma vez completado, ele permanece inerte para sempre.
- **Para torná-lo rearmável:**
  - O `BossSummonAltar` precisa de um método `resetAltar()` que reverta `isCompleted = false`, `isActive = false`, `isBossSpawned = false`, limpe o tint cinza e volte à textura inativa.
  - Alternativamente, os chefes subsequentes podem surgir por **Invocação Direta na Arena** com aviso de tela (estilo 10:00), dispensando o deslocamento repetitivo até o altar toda vez.

---

## 3. Impacto e Riscos

- **Arquivos Afetados:**
  - `src/config/balance.ts`: Criação das funções puras `getEndlessBossScaling(cycle)` e `selectEndlessBoss(cycle, rngSeed)`.
  - `src/scenes/GameScene.ts`: Gerenciador do cronômetro de ciclos (`endlessBossCycleTimer`), guardas de anti-sobreposição e despacho do chefe sorteado.
  - `src/entities/enemies/AzazelBoss.ts`: Flag `isEndlessVariant` para ignorar a Fase 3 (Banimento Dimensional).
  - `src/entities/items/BossSummonAltar.ts`: Método `resetAltar()` caso o ciclo utilize o altar físico.
- **Risco de Regressão:**
  - **Médio-Alto se Azazel for incluído sem poda da Fase 3:** Teleporte para mapas inexistentes e perda de viewport.
  - **Baixo se o ciclo alternar entre Succubus e variantes de Minichefes**, ou se Azazel for podado para Fases 1 e 2 apenas.
- **Performance:**
  - Dentro dos limites de `PERFORMANCE_LIMITS.MAX_ENEMIES_ACTIVE = 120`. Chefes usam poucos draw calls. Clones de Azazel aumentam contagem de projéteis em tela (exige culling).
- **Compatibilidade com Saves (`STORAGE_KEYS`):**
  - Compatibilidade total: estatísticas de chefes derrotados (`bossesDefeated`) já utilizam contagem numérica pura via `MetaProgressManager.recordBossDefeated()`.

---

## 4. Conflitos

- **`AGENTS.md` (Regra 13 — Ciclo de Vida de Cenas):** Nenhum grupo ou ouvinte será destruído prematuramente.
- **`docs/MECHANICS.md` (Seção 4 — Chefes e Altares):** Exige atualização para documentar as regras de rotação e scaling de chefes do Modo Infinito.
- **`docs/DECISIONS.md`:** Sem conflitos com DEC-001 a DEC-008.

---

## 5. Alternativas de Implementação

### Alternativa 1 (Recomendada): Invocação Espontânea com Aviso na Tela
- **Como funciona:** O primeiro chefe (5:00) desperta pelo Altar. A partir da sua morte, um cronômetro de 3 minutos é iniciado. Ao expirar, a tela treme, o aviso central toca (`ALERTA: O ANJO CAÍDO DESPERTA!`) e o chefe materializa a 250px de Nixy.
- **Quando ela é melhor:** Evita que o jogador tenha que interromper sua rota de fuga no Infinito para andar milhares de pixels de volta até o Altar parado no meio da arena, mantendo o dinamismo frenético do survivor.

### Alternativa 2: Altar Físico Recarregável
- **Como funciona:** O Altar esfria por 3 minutos e volta a pulsar fogo. Nixy deve ir até o Altar para ativar o próximo chefe.
- **Quando ela é melhor:** Dá controle total ao jogador sobre QUANDO quer enfrentar o próximo chefe (caso esteja com pouca vida).

---

## 6. Recomendação Técnica da Engenharia

- **Opção:** `[ FAZER ADAPTADO ]`
- **Motivo e Roteiro de Adaptação Proposto:**
  1. **Aprovar a rotação com poda de Azazel:** Permitir Succubus e Azazel, porém Azazel entra em variante *Infinito* (Fases 1, 2 e 4 apenas), eliminando o Banimento Dimensional para o mapa 202 que destruiria a partida infinita.
  2. **Aplicar scaling progressivo por ciclo:** Multiplicador puro de HP (`+40%/ciclo`) e Dano (`+15%/ciclo`) via função pura testável em `src/config/balance.ts`.
  3. **Blindagem de Anti-Sobreposição:** Trava rígida garantindo que nenhum chefe nasce se `this.isBossFightActive === true`.
  4. **Intervalo:** 180 segundos após a derrota do chefe anterior.

*(Aguardando avaliação e decisão do dono para inclusão em pacote de implementação futuro).*
