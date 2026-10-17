# Registro de Decisões de Arquitetura e Design — Hell Survivor (`docs/DECISIONS.md`)

Este arquivo registra todas as decisões formais de arquitetura, balanceamento e design do projeto **Hell Survivor**.
Conforme estipulado na **Regra 12 de `AGENTS.md`**, pedidos de usuário são pontuais por padrão: nada se torna regra ou decisão permanente sem aprovação explícita do dono do projeto e sem o registro completo no modelo abaixo.

---

## Modelo de Decisão (ADR)
Cada decisão registrada deve conter estritamente:
- **Status:** `Proposta` | `Aceita` | `Substituída por [link]`
- **Data:** YYYY-MM-DD
- **Contexto:** Cenário ou problema que motivou a discussão
- **Decisão:** O que foi efetivamente definido
- **Motivo:** Apenas o explicitamente declarado pelo dono do projeto ou comprovado no código; caso contrário, registrar `"não informado"`
- **Rever quando:** Condições técnicas ou de design para reavaliação futura

---

## Decisões Registradas

### DEC-001: Reembolso de Bênçãos Fixado em 70%
- **Status:** Aceita
- **Data:** 2026-10-17
- **Contexto:** Mecânica do Altar de Bênçãos (`MetaProgressManager.ts`), onde o jogador pode redefinir seus pontos de melhoria permanente e recuperar almas corrompidas.
- **Decisão:** O reembolso devolve estritamente 70% das almas gastas em bênçãos, arredondado para baixo (`Math.floor(totalSpent * 0.70)`), com perda definitiva de 30% como penalidade econômica.
- **Motivo:** Comprovado no código (`src/systems/MetaProgressManager.ts`, método `refundBlessings`).
- **Rever quando:** O dono do projeto solicitar balanceamento da economia de meta-progressão.

---

### DEC-002: Galeria de Testes (Showroom) Isolada em `Y = -20000`
- **Status:** Aceita
- **Data:** 2026-10-17
- **Contexto:** Criação da área de testes visuais (`TestShowroomSystem.ts`) para inspecionar todos os sprites, props, projéteis, molduras e inimigos em tamanho real.
- **Decisão:** Posicionar o showroom em coordenadas muito afastadas da arena principal (`Y = -20000`), enquanto a arena de gameplay é delimitada no intervalo `[-3200..3200]`.
- **Motivo:** Comprovado no código (`src/systems/TestShowroomSystem.ts`), garantindo que manequins pacíficos e efeitos visuais não interfiram no radar, na câmera ou no combate da partida real.
- **Rever quando:** Houver reestruturação da arquitetura de cenas ou salas de teste.

---

### DEC-003: Bênção Pacto Demoníaco com Nível Único (`maxLevel: 1`)
- **Status:** Proposta
- **Data:** 2026-10-17
- **Contexto:** Configuração da bênção de alto custo no catálogo de bênçãos permanentes (`BLESSINGS_CATALOG` em `MetaProgressManager.ts`).
- **Decisão:** Manter a bênção "Pacto Demoníaco" com nível único (`maxLevel: 1` ao custo de 1.200 almas).
- **Motivo:** não informado (proposta — aguardando confirmação do dono).
- **Rever quando:** O dono do projeto avaliar o balanceamento do catálogo de bênçãos no Pacote 2.

---

### DEC-004: Geração Procedural dos 3 Cristais de Azazel
- **Status:** Proposta
- **Data:** 2026-10-17
- **Contexto:** Fase 3 do combate contra o chefe Azazel (`startAzazelPhase3Dimension`), na qual a heroína é banida para a Dimensão Abissal e deve purificar cristais antes do confronto final.
- **Decisão:** Gerar 3 instâncias de `AzazelCrystal` proceduralmente em ângulos e distâncias aleatórias ao redor do jogador na Fase 3, mantendo o campo estático `azazelCrystals` em `mapData.ts` marcado como `@deprecated`.
- **Motivo:** não informado (proposta — aguardando confirmação do dono).
- **Rever quando:** O dono do projeto decidir se os cristais devem permanecer gerados proceduralmente ou posicionados em coordenadas fixas no mapa 202.

---

### DEC-005: Abertura Dinâmica de Câmera no Chefe Azazel (`Zoom 1.35x`)
- **Status:** Proposta
- **Data:** 2026-10-17
- **Contexto:** A boss fight do Azazel envolve projéteis de alta velocidade, tempestade de raios e clones em área ampla.
- **Decisão:** Transicionar suavemente o zoom da câmera de `2.0x` para `1.35x` ao término do diálogo introdutório e início da batalha (`GameScene.ts`).
- **Motivo:** não informado (proposta — aguardando confirmação do dono).
- **Rever quando:** O dono do projeto avaliar a visibilidade e o conforto visual do combate em monitores desktop e telas móveis.
