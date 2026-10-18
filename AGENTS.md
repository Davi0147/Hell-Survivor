# Hell Survivor — Regras Obrigatórias do Projeto (`AGENTS.md`)

## Stack & Ambiente
- **Engine:** Phaser 3 (`^3.87.0`) + TypeScript (`strict`) + Vite.
- **Dependências:** Proibido adicionar pacotes externos sem autorização explícita do usuário. Autorizados como `devDependencies` exclusivamente para o Pacote 1: `vitest`, `eslint` e os pacotes de apoio estritamente necessários para lintar TypeScript (`typescript-eslint`, `@eslint/js`, `globals`). Nenhum outro.

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

2. **Bugs Encontrados Fora do Escopo (Relatar, Jamais Corrigir Silenciosamente):**
   - Se durante a execução de uma tarefa você identificar qualquer bug, inconsistência lógica ou dado morto fora do escopo imediato da tarefa, é **estritamente proibido** corrigi-lo por conta própria.
   - Todo problema identificado deve ser **reportado explicitamente no relatório final da tarefa** como pendência para avaliação e decisão do usuário.

3. **REGRA DE OURO AMPLIADA (`Sandbox-First` + `Showroom-First` + `Level-Editor-First`):**
   - **Sandbox & Logger:** Toda nova arma, evolução, bênção passiva, inimigo, mini-boss, chefe, item de mapa ou mecânica DEVE ser integrada simultaneamente ao Modo de Teste (`src/systems/DevSandboxPanel.ts`) e ao Gravador de Sessão (`src/systems/DebugSessionLogger.ts`).
     - Armas novas entram na aba `[3] ARMAS & EVOLUÇÕES` com botões de equipar, evoluir e remover, além do botão global de equipar todas.
     - Inimigos e chefes entram na aba `[2] HORDAS & BOSS`. Derrotar/remover chefes no Sandbox deve restaurar `SoundManager.getInstance().playBattleMusic()` sem encerrar a sessão.
     - Bênçãos entram na aba `[4] BÊNÇÃOS & ITENS` com controles de nível e snapshot no logger.
     - Visibilidade controlada pela flag `ENABLE_DEV_SANDBOX` em `src/config/balance.ts`.
   - **Galeria Showroom:** Todo novo sprite, textura, prop, coletável, projétil, inimigo, chefe ou moldura de carta DEVE ser registrado na Área de Teste / Galeria de Sprites (`src/systems/TestShowroomSystem.ts`, isolada em `Y = -20000`) na categoria correspondente (`CENÁRIO & PROPS`, `ITENS & COLETÁVEIS`, `ARMAS & PROJÉTEIS`, `INIMIGOS & CHEFES`, `CARTAS DE BÊNÇÃO`, `ANIMAÇÕES & VFX`, `UI & RETRATOS`), em escala real e como manequim pacífico.
   - **Editor de Mapas:** Todo novo prop decorativo, altar, spawner ou textura de chão aplicável a fases DEVE ser registrado na paleta do Editor de Mapas (`src/systems/MapEditorSystem.ts`), tipado em `src/config/mapData.ts` e suportado no carregador de fases (`loadCustomMapLayout` em `src/scenes/GameScene.ts`). Props decorativos mantêm `setDepth(-10)` e zero colisão física rígida para não prender entidades.

4. **Zero Números Mágicos de Balanceamento (`src/config/balance.ts`):**
   - NUNCA hardcode números de balanceamento (HP, dano, velocidade, cooldowns, metas de almas de capítulos, limites de entidades, curvas de XP/escalonamento) dentro de cenas ou entidades. Tudo deve residir em `src/config/balance.ts` (incluindo `BALANCE`, `PERFORMANCE_LIMITS`, `ARENA_CONFIG` e a tabela `CHAPTER_CONFIG` *(a criar no Pacote 2)*).
   - Nunca altere valores de balanceamento já aprovados sem pedido explícito.

5. **Identidade Visual Gótica, Sprites & Tipografia (`theme.ts` *(a criar no Pacote 2)*):**
   - NUNCA altere estilo visual (cores, fontes, layout de HUD, molduras) sem pedido explícito. Cores e fontes devem ser centralizadas em `src/config/theme.ts` *(a criar no Pacote 2)*.
   - Padrões visuais de interface, caixas de diálogo, modais e telegrafia estão documentados em [`docs/DESIGN_SYSTEM.md`](docs/DESIGN_SYSTEM.md).
   - **Zero Emojis Unicode em Textos WebGL/Canvas do Phaser:** Use apenas as fontes pixel-art do projeto (`Press Start 2P`, `Silkscreen`, `Pixelzone`) e ícones vetoriais/sprites para evitar glifos quebrados.
   - **Preservação de Escala em Troca de Texturas (`setDisplaySize`):** Sempre que substituir texturas dinamicamente em imagens com dimensões fixas (ex: bustos de diálogo em `origin(0.5, 1.0)` ou retratos), chame `image.setDisplaySize(largura, altura)` imediatamente na linha seguinte.
   - **Transições Cinematográficas Condicionais:** As animações de slide/fade dos bustos e o movimento do balão de fala só ocorrem quando o personagem falante muda (`currentSpeakerSide !== newSide`).
   - Manter a tag discreta `#build-version` no canto inferior direito do `index.html` refletindo a build ativa.

6. **Timers Seguros e Ciclo de Vida do Phaser:**
   - NUNCA use `window.setTimeout` ou `window.setInterval` em lógica de gameplay, combate ou cenas. Use sempre `this.time.delayedCall` ou `this.time.addEvent` da cena ativa para respeitar pausas (`scene.pause()`) e evitar vazamentos ao trocar de cena.
   - **Pausa em Modais/Diálogos:** Ao abrir diálogos, modais de vitória ou menus de seleção, pause a física (`this.physics.pause()`) e congele loops de atualização para evitar dano ou movimentação em segundo plano.
   - **Limpeza de Cenas:** Ao transicionar entre telas, finalize explicitamente as cenas anteriores (`this.scene.stop()`).

7. **Persistência e Chaves Centralizadas (`STORAGE_KEYS` em `src/config/storageKeys.ts`):**
   - NUNCA espalhe strings literais de chaves do `localStorage` ou `sessionStorage` pelo código. Todas as chaves devem ser lidas/gravadas exclusivamente via objeto centralizado `STORAGE_KEYS` e suas funções auxiliares (`getChapterMapKey`, `getChapterMapBackupKey`) em [`src/config/storageKeys.ts`](src/config/storageKeys.ts), sempre protegidas por `try / catch` e mantendo compatibilidade e migração defensiva com saves anteriores.

8. **Qualidade de Tipagem (Proibição de `any` Novo):**
   - É **estritamente proibido** introduzir novas anotações `any` no TypeScript. Use interfaces, tipos discriminados, genéricos ou `unknown` com asserção segura. Ao refatorar arquivos existentes, substitua progressivamente os `any` remanescentes por tipos reais.

9. **Protocolo Seguro de Git (Sem Destruição de Histórico):**
   - Exatamente **um commit por tarefa** (um pacote de trabalho pode ter múltiplos commits, um para cada tarefa ou extração concluída).
   - **Proibido:** NUNCA execute `git tag -f`, `git push --force`, `git reset --hard`, `git clean -fd` ou comandos que excluam branches sem solicitação explícita do usuário.

10. **Definição de Pronto (DoD) e Honestidade de Testes:**
    - NUNCA afirme ou insinue que um teste, build ou verificação passou se ele não tiver sido de fato executado no terminal. Se um passo não foi executado, escreva explicitamente `"NÃO EXECUTADO"` e justifique o motivo.
    - O Bot Autônomo `[F3]` (`AutoPlayTestAgent`) e testes de jogabilidade visual devem ser executados pelo usuário no navegador: solicite o teste, aguarde o retorno com o log gerado e não dê a tarefa como concluída antes desse feedback.
    - Toda tarefa deve reportar o status real de `npm run check`, compilação, atualização do Livro de Anotações e Changelog.

11. **Avaliação de Viabilidade (Obrigatória antes de Implementar):**
    - Para todo pedido que crie ou mude mecânica, arquitetura, regra, balanceamento ou estilo (exceto ajustes triviais: texto, cor pontual, bug de causa óbvia), ANTES de editar responda com a FICHA e aguarde "ok":
      1. Objetivo entendido em 1 frase e o que NÃO entendi.
      2. Viabilidade técnica com evidência (arquivo/linha ou comando), nunca de memória.
      3. Impacto: arquivos, risco de regressão, performance (`PERFORMANCE_LIMITS`, 60 FPS, mobile), compatibilidade com saves.
      4. Conflitos com `AGENTS.md`, `docs/MECHANICS.md` ou decisões anteriores.
      5. Pelo menos 1 alternativa e quando ela é melhor.
      6. Recomendação: `FAZER` / `FAZER ADAPTADO` / `NÃO FAZER`, com motivo.
    - Discordar com argumento é obrigação. É proibido elogiar ou aceitar uma ideia sem análise. Se o pedido parecer ruim, diga e proponha caminho melhor; a decisão final é do dono.

12. **Pedido Não É Regra:**
    - Pedidos do dono são pontuais por padrão. Nada vira regra em `AGENTS.md`/`docs/MECHANICS.md` ou decisão em `docs/DECISIONS.md` sem o dono dizer "registre como regra" e sem você mostrar antes o texto exato.
    - Decisões em `docs/DECISIONS.md` têm: Status (`Proposta` | `Aceita`), Data, Contexto, Decisão, Motivo (apenas o dito pelo dono ou comprovado no código; senão `"não informado"`), Rever quando. Nunca invente justificativa. Regras podem ser revisadas: substitua marcando a antiga como "Substituída por ...", não apague.

13. **Ciclo de Vida de Cenas Phaser (DEC-006):**
    - **Zerar estado em `init()`:** Toda cena com variáveis de controle (`isEnding`, `isTyping`, `isPaused`, arrays de entidades) deve implementar `init()` para redefini-las ao valor padrão, pois o Phaser reutiliza a mesma instância da classe em `scene.start()`.
    - **Criar grupos antes de usá-los:** Grupos de entidades (`enemiesGroup`, `gemsGroup`, `soulsGroup`, `mapItemsGroup`) devem ser instanciados no início de `create()`, antes de qualquer chamada a métodos de layout (`loadCustomMapLayout`), com checagens defensivas (`this.group && this.group.children`).
    - **Limpar ouvintes no `SHUTDOWN`:** Cenas que registram ouvintes (`this.events.on`, `input.keyboard.on`, timers contínuos) devem registrar um ouvinte `SHUTDOWN` para desregistrar/limpar esses elementos, impedindo vazamento de listeners e duplicidade de handlers.

14. **Registro de Memória (Workflow `/registrar`):**
    - Quando o dono disser "lembra", "anota", "sempre faça assim" ou equivalente, NÃO responda apenas "ok". Siga o workflow `/registrar`:
      1. Classifique o pedido: `REGRA` inviolável (neste arquivo) | `CONTRATO` de mecânica (`docs/MECHANICS.md`) | `PADRÃO` visual/UX (`docs/DESIGN_SYSTEM.md`) | `DECISÃO` (`docs/DECISIONS.md`) | `TAREFA` pendente (`LIVRO_DE_ANOTACOES.md`) | `PREFERÊNCIA` pontual (esta última não é registrada).
      2. Se for ambíguo, pergunte qual tipo é antes de escrever.
      3. Procure no repositório se já existe algo igual ou conflitante (`AGENTS.md`, `docs/MECHANICS.md`, `docs/DESIGN_SYSTEM.md`, `docs/DECISIONS.md`) e mostre.
      4. Mostre o TEXTO EXATO e o ARQUIVO DE DESTINO e aguarde o "ok" do dono. Valores numéricos/cores moram no código (`theme.ts`, `balance.ts`), o documento só aponta para eles.
      5. Grave, mostre o `git diff` e registre no `docs/CHANGELOG.md`.
      6. Nunca invente motivo: "Motivo" é apenas o explicitamente dito pelo dono ou o que o código comprova.

15. **Regra de Conflito (Parada Obrigatória):**
    - **Se qualquer instrução de uma tarefa conflitar com este arquivo (`AGENTS.md`), com `docs/MECHANICS.md`, com `docs/DESIGN_SYSTEM.md` ou com `docs/DECISIONS.md`, PARE imediatamente e pergunte ao usuário antes de escrever código.**

16. **Resumo Simples no Início dos Relatórios (DEC-008):**
    - Todo relatório de entrega gerado pela IA deve obrigatoriamente iniciar com a seção "O Que Isso Significa Para Você", contendo até 5 linhas em linguagem simples, direta e sem termos técnicos complexos, explicando o que mudou na experiência do jogador ou do dono.
