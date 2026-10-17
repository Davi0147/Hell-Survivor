# Hell Survivor — Regras Obrigatórias do Projeto (`AGENTS.md`)

## Stack & Ambiente
- **Engine:** Phaser 3 (`^3.87.0`) + TypeScript (`strict`) + Vite.
- **Dependências:** Proibido adicionar pacotes externos sem autorização explícita do usuário (única exceção autorizada: `vitest` / `eslint` como `devDependencies` no Pacote 1).

---

## 📌 Protocolo de Inicialização de Toda Sessão
Antes de realizar qualquer edição no código ou na documentação:
- É **estritamente obrigatório** ler e seguir este [`AGENTS.md`](AGENTS.md), [`docs/MECHANICS.md`](docs/MECHANICS.md), [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) e as últimas entradas em [`docs/CHANGELOG.md`](docs/CHANGELOG.md).

---

## Regras Invioláveis (Numeradas e Verificáveis)

1. **Escopo Mínimo e Preservação de Comportamento:**
   - NUNCA remova, reescreva ou refatore código fora do escopo do pacote/tarefa atual.
   - Refatorações NÃO mudam o comportamento do jogo. Se qualquer mudança de comportamento for necessária, avise e aguarde aprovação antes de editar.
   - Antes de editar, liste os arquivos que serão tocados e os potenciais riscos. Ao concluir, apresente o resumo do `git diff` confirmando que nada fora do escopo foi alterado.

2. **REGRA DE OURO AMPLIADA (`Sandbox-First` + `Showroom-First` + `Level-Editor-First`):**
   - **Sandbox & Logger:** Toda nova arma, evolução, bênção passiva, inimigo, mini-boss, chefe, item de mapa ou mecânica DEVE ser integrada simultaneamente ao Modo de Teste (`src/systems/DevSandboxPanel.ts`) e ao Gravador de Sessão (`src/systems/DebugSessionLogger.ts`).
     - Armas novas entram na aba `[3] ARMAS & EVOLUÇÕES` com botões de equipar, evoluir e remover, além do botão global de equipar todas.
     - Inimigos e chefes entram na aba `[2] HORDAS & BOSS`. Derrotar/remover chefes no Sandbox deve restaurar `SoundManager.getInstance().playBattleMusic()` sem encerrar a sessão.
     - Bênçãos entram na aba `[4] BÊNÇÃOS & ITENS` com controles de nível e snapshot no logger.
     - Visibilidade controlada pela flag `ENABLE_DEV_SANDBOX` em `src/config/balance.ts`.
   - **Galeria Showroom:** Todo novo sprite, textura, prop, coletável, projétil, inimigo, chefe ou moldura de carta DEVE ser registrado na Área de Teste / Galeria de Sprites (`src/systems/TestShowroomSystem.ts`, isolada em `Y = -20000`) na categoria correspondente (`CENÁRIO & PROPS`, `ITENS & COLETÁVEIS`, `ARMAS & PROJÉTEIS`, `INIMIGOS & CHEFES`, `CARTAS DE BÊNÇÃO`, `ANIMAÇÕES & VFX`, `UI & RETRATOS`), em escala real e como manequim pacífico.
   - **Editor de Mapas:** Todo novo prop decorativo, altar, spawner ou textura de chão aplicável a fases DEVE ser registrado na paleta do Editor de Mapas (`src/systems/MapEditorSystem.ts`), tipado em `src/config/mapData.ts` e suportado no carregador de fases (`loadCustomMapLayout` em `src/scenes/GameScene.ts`). Props decorativos mantêm `setDepth(-10)` e zero colisão física rígida para não prender entidades.

3. **Zero Números Mágicos de Balanceamento (`src/config/balance.ts`):**
   - NUNCA hardcode números de balanceamento (HP, dano, velocidade, cooldowns, metas de almas de capítulos, limites de entidades, curvas de XP/escalonamento) dentro de cenas ou entidades. Tudo deve residir em `src/config/balance.ts` (incluindo `BALANCE`, `PERFORMANCE_LIMITS`, `ARENA_CONFIG` e a tabela `CHAPTER_CONFIG` *(a criar no Pacote 2)*).
   - Nunca altere valores de balanceamento já aprovados sem pedido explícito.

4. **Identidade Visual Gótica, Sprites & Tipografia (`theme.ts` *(a criar no Pacote 2)*):**
   - NUNCA altere estilo visual (cores, fontes, layout de HUD, molduras) sem pedido explícito. Cores e fontes devem ser centralizadas em `src/config/theme.ts` *(a criar no Pacote 2)*.
   - **Zero Emojis Unicode em Textos WebGL/Canvas do Phaser:** Use apenas as fontes pixel-art do projeto (`Press Start 2P`, `Silkscreen`, `Pixelzone`) e ícones vetoriais/sprites para evitar glifos quebrados.
   - **Preservação de Escala em Troca de Texturas (`setDisplaySize`):** Sempre que substituir texturas dinamicamente em imagens com dimensões fixas (ex: bustos de diálogo em `origin(0.5, 1.0)` ou retratos), chame `image.setDisplaySize(largura, altura)` imediatamente na linha seguinte.
   - **Transições Cinematográficas Condicionais:** As animações de slide/fade dos bustos e o movimento do balão de fala só ocorrem quando o personagem falante muda (`currentSpeakerSide !== newSide`).
   - Manter a tag discreta `#build-version` no canto inferior direito do `index.html` refletindo a build ativa.

5. **Timers Seguros e Ciclo de Vida do Phaser:**
   - NUNCA use `window.setTimeout` ou `window.setInterval` em lógica de gameplay, combate ou cenas. Use sempre `this.time.delayedCall` ou `this.time.addEvent` da cena ativa para respeitar pausas (`scene.pause()`) e evitar vazamentos ao trocar de cena.
   - **Pausa em Modais/Diálogos:** Ao abrir diálogos, modais de vitória ou menus de seleção, pause a física (`this.physics.pause()`) e congele loops de atualização para evitar dano ou movimentação em segundo plano.
   - **Limpeza de Cenas:** Ao transicionar entre telas, finalize explicitamente as cenas anteriores (`this.scene.stop()`).

6. **Persistência e Chaves de `localStorage` (`STORAGE_KEYS` *(a criar no Pacote 2)*):**
   - NUNCA espalhe strings literais de chaves do `localStorage` pelo código. Todas as chaves devem ser lidas/gravadas exclusivamente via objeto centralizado `STORAGE_KEYS` *(a criar no Pacote 2 em `src/config/balance.ts`)*, sempre protegidas por `try / catch` e mantendo compatibilidade e migração defensiva com saves anteriores.

7. **Qualidade de Tipagem (Proibição de `any` Novo):**
   - É **estritamente proibido** introduzir novas anotações `any` no TypeScript. Use interfaces, tipos discriminados, genéricos ou `unknown` com asserção segura. Ao refatorar arquivos existentes, substitua progressivamente os `any` remanescentes por tipos reais.

8. **Protocolo Seguro de Git (Sem Destruição de Histórico):**
   - Exatamente **um commit por tarefa/pacote**, com mensagem clara e convencional.
   - **Proibido:** NUNCA execute `git tag -f`, `git push --force`, `git reset --hard`, `git clean -fd` ou comandos que excluam branches sem solicitação explícita do usuário.

9. **Definição de Pronto (DoD) e Honestidade de Testes:**
   - NUNCA afirme ou insinue que um teste, build ou verificação passou se ele não tiver sido de fato executado no terminal. Se um passo não foi executado, escreva explicitamente `"NÃO EXECUTADO"` e justifique o motivo.
   - O Bot Autônomo `[F3]` (`AutoPlayTestAgent`) e testes de jogabilidade visual devem ser executados pelo usuário no navegador: solicite o teste, aguarde o retorno com o log gerado e não dê a tarefa como concluída antes desse feedback.
   - Toda tarefa deve reportar o status real de `npm run check`, compilação, atualização do Livro de Anotações e Changelog.

10. **Regra de Conflito (Parada Obrigatória):**
    - **Se qualquer instrução de uma tarefa conflitar com este arquivo (`AGENTS.md`) ou com `docs/MECHANICS.md`, PARE imediatamente e pergunte ao usuário antes de escrever código.**
