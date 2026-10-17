# Hell Survivor — Regras Obrigatórias do Projeto (`AGENTS.md`)

## Stack & Ambiente
- **Engine:** Phaser 3 (`^3.87.0`) + TypeScript (`strict`) + Vite.
- **Dependências:** Proibido adicionar pacotes externos sem autorização explícita do usuário (exceção autorizada: `vitest` / `eslint` como `devDependencies`).

---

## Regras Invioláveis (Numeradas e Verificáveis)

1. **Escopo Mínimo e Preservação de Comportamento:**
   - NUNCA remova, reescreva ou refatore código fora do escopo do pacote/tarefa atual.
   - Refatorações NÃO mudam o comportamento do jogo. Se qualquer mudança de comportamento for necessária, avise antes de editar.
   - Antes de editar, liste os arquivos que serão tocados e os potenciais riscos. Ao concluir, apresente o resumo do `git diff` confirmando que nada fora do escopo foi alterado.

2. **REGRA DE OURO AMPLIADA (`Sandbox-First` + `Showroom-First` + `Level-Editor-First`):**
   - **Sandbox & Logger:** Toda nova arma, evolução, bênção passiva, inimigo, mini-boss, chefe, item de mapa ou mecânica DEVE ser integrada simultaneamente ao Modo de Teste (`src/systems/DevSandboxPanel.ts`) e ao Gravador de Sessão (`src/systems/DebugSessionLogger.ts`).
   - **Galeria Showroom:** Todo novo sprite, textura, prop, coletável, projétil, inimigo, chefe ou moldura de carta DEVE ser registrado na Área de Teste / Galeria de Sprites (`src/systems/TestShowroomSystem.ts`, isolada em `Y = -20000`) na categoria correspondente, em escala real e como manequim pacífico.
   - **Editor de Mapas:** Todo novo prop decorativo, altar, spawner ou textura de chão aplicável a fases DEVE ser registrado na paleta do Editor de Mapas (`src/systems/MapEditorSystem.ts`), tipado em `src/config/mapData.ts` e suportado no carregador de fases (`loadCustomMapLayout` em `src/scenes/GameScene.ts`). Props decorativos têm `depth = -10` e zero colisão física rígida.

3. **Zero Números Mágicos de Balanceamento (`src/config/balance.ts`):**
   - NUNCA hardcode números de balanceamento (HP, dano, velocidade, cooldowns, metas de almas de capítulos, limites de entidades, curvas de XP/escalonamento) dentro de cenas ou entidades. Tudo deve residir em `src/config/balance.ts` (incluindo `BALANCE`, `PERFORMANCE_LIMITS`, `ARENA_CONFIG`, `CHAPTER_CONFIG`).
   - Nunca altere valores de balanceamento já aprovados sem pedido explícito.

4. **Identidade Visual Gótica & Tipografia (`src/config/theme.ts`):**
   - NUNCA altere estilo visual (cores, fontes, layout de HUD, molduras) sem pedido explícito. Cores, fontes e constantes de VFX devem ser centralizadas em `src/config/theme.ts`.
   - **Zero Emojis Unicode em Textos WebGL/Canvas do Phaser:** Use apenas as fontes pixel-art do projeto (`Press Start 2P`, `Silkscreen`, `Pixelzone`) e ícones vetoriais/sprites para evitar glifos quebrados.
   - Ao trocar texturas dinamicamente em imagens com tamanho fixo (ex: bustos de diálogo `420x420` ou `430x430`), chame sempre `setDisplaySize(w, h)` logo após `setTexture()`.

5. **Timers Seguros no Ciclo do Phaser:**
   - NUNCA use `window.setTimeout` ou `window.setInterval` em lógica de gameplay, combate ou cenas. Use sempre `this.time.delayedCall` ou `this.time.addEvent` da cena ativa para respeitar pausas (`scene.pause()`) e evitar vazamentos ao trocar de cena.

6. **Persistência e Chaves de `localStorage` (`STORAGE_KEYS`):**
   - NUNCA espalhe strings literais de chaves do `localStorage` pelo código. Todas as chaves (`meta_save`, `custom_map`, `sound_settings`, `dev_unlocked`) devem ser lidas/gravadas exclusivamente via objeto centralizado `STORAGE_KEYS` (em `src/config/balance.ts`), sempre protegidas por `try / catch` e mantendo compatibilidade/migração com saves anteriores.

7. **Arquitetura e Contratos de Mecânicas (`docs/`):**
   - Toda mecânica nova ou alterada deve respeitar estritamente os contratos definidos em [`docs/MECHANICS.md`](docs/MECHANICS.md) e a divisão de responsabilidades em [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).
   - Novos subsistemas de lógica devem ficar em `src/systems/`; `GameScene.ts` atua apenas como cena orquestradora.

8. **Definição de Pronto (DoD — Definition of Done):**
   Uma tarefa ou pacote SÓ é considerado concluído quando:
   - `npm run check` (`tsc --noEmit` + `eslint` + `vitest`) e `npm run build` passam com 0 erros;
   - O Bot Autônomo (`[F3]` / `AutoPlayTestAgent`) roda por pelo menos 2 minutos sem gerar erro novo no `DebugSessionLogger`;
   - [`LIVRO_DE_ANOTACOES.md`](LIVRO_DE_ANOTACOES.md) e [`docs/CHANGELOG.md`](docs/CHANGELOG.md) foram atualizados refletindo a entrega;
   - Commit limpo realizado na branch de trabalho.

9. **Regra de Conflito (Parada Obrigatória):**
   - **Se qualquer instrução de uma tarefa conflitar com este arquivo (`AGENTS.md`) ou com `docs/MECHANICS.md`, PARE imediatamente e pergunte ao usuário antes de escrever código.**
