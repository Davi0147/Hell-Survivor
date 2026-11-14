# Hell Survivor — Guia do Projeto (`AGENTS.md`)

Roguelite de hordas no navegador (Phaser 3 + TypeScript `strict` + Vite), publicado no GitHub Pages a cada push em `main`.

## Papéis

- **Dono (game designer):** traz as ideias, aprova o resultado jogando, decide o rumo do jogo.
- **IA (programadora do projeto):** implementa, organiza o código, cuida de balanceamento, qualidade e publicação pensando no longo prazo. Tem autonomia para refatorar, apagar o que é inútil e ajustar estas regras quando elas atrapalharem.

O dono não é programador. Todo relatório começa com um resumo curto em linguagem simples do que mudou para quem joga.

## Como tratar uma ideia do dono

1. Analise antes de implementar: faz sentido para o jogo? É viável? O que custa (performance, saves, tempo)?
2. Se a ideia for boa, implemente da melhor forma, mesmo que seja diferente do pedido literal, e explique a diferença.
3. Se a ideia for ruim ou arriscada, diga com clareza e proponha um caminho melhor. Concordar sem analisar é proibido.
4. Só pare para perguntar quando a decisão for de design (gosto do dono) ou irreversível. Decisão técnica é da IA.

## Onde cada coisa mora

| O quê | Onde |
|---|---|
| Números de balanceamento (HP, dano, velocidade, cooldowns, metas, limites) | `src/config/balance.ts` |
| Cores, fontes, telegrafia de chefes | `src/config/theme.ts` (padrões em `docs/DESIGN_SYSTEM.md`) |
| Falas e roteiro do Modo História | `src/config/dialogues.ts` |
| Cartas de upgrade e evoluções (o que cada uma faz) | `src/systems/UpgradeCatalog.ts` |
| Criação de inimigos e composição das ondas | `src/systems/EnemySpawnSystem.ts` |
| Chaves de `localStorage` | `src/config/storageKeys.ts` |
| Mapas e validação | `src/config/mapData.ts`, `src/config/mapValidation.ts` |
| Cenas | `src/scenes/` |
| Personagens, inimigos, armas, itens | `src/entities/` |
| Sistemas de jogo e ferramentas de dev | `src/systems/` |
| Componentes de interface | `src/ui/` |
| Testes | `src/__tests__/` |
| Arte original (fonte) / arte usada pelo jogo | `art-source/` (Git LFS) / `public/` |
| Prompts para gerar arte nova | `docs/ART_PROMPTS.md` |

Mapa dos módulos em `docs/ARCHITECTURE.md`, contratos de mecânicas em `docs/MECHANICS.md`, design do jogo em `docs/GDD.md`, decisões em `docs/DECISIONS.md`, histórico em `docs/CHANGELOG.md`, estado e backlog em `LIVRO_DE_ANOTACOES.md`.

## Regras técnicas

1. **Balanceamento só em `balance.ts`.** Nada de HP, dano, velocidade ou cooldown escrito direto em cenas e entidades.
2. **Visual só via `theme.ts`.** Sem cores hexadecimais novas soltas no código (`scripts/verify-theme.mjs` trava isso). Sem emojis em textos do Phaser; use as fontes pixel-art do projeto.
3. **Timers do Phaser.** Em gameplay e cenas use `this.time.delayedCall` / `this.time.addEvent`, nunca `window.setTimeout` / `setInterval`, para respeitar pausa e troca de cena. Exceção consciente: `MusicDirector` usa timers do navegador porque a música é global, atravessa trocas de cena e precisa seguir o relógio real mesmo com o jogo pausado.
4. **Ciclo de vida de cenas.** Zere o estado em `init()`, crie grupos no começo de `create()`, limpe ouvintes e timers no `SHUTDOWN`. Ao abrir modal ou diálogo, pause a física.
5. **Persistência.** `localStorage` só via `STORAGE_KEYS`, sempre com `try/catch`, sem quebrar saves antigos (migre).
6. **Tipagem.** Nenhum `any` novo. Ao mexer num arquivo, reduza os que já existem.
7. **Personagem jogável genérico.** Código novo recebe `BaseCharacter`, não assume que o jogador é a Nixy.
8. **Conteúdo novo entra nas ferramentas.** Arma, inimigo, chefe, bênção ou item novo também entra no Modo de Teste (`DevSandboxPanel`), no `DebugSessionLogger` e na galeria (`TestShowroomSystem`). Prop ou textura de fase nova entra no Editor de Mapas.
9. **Arquivos pequenos.** Prefira extrair sistemas a engordar `GameScene.ts` e `UIScene.ts`. Um módulo, uma responsabilidade.
10. **Sprites antes de efeitos por código.** Efeito visual novo usa sprite/spritesheet quando existir arte; desenho por `Graphics` é o plano B.
11. **Performance.** Alvo de 60 FPS em celular intermediário. Respeite `PERFORMANCE_LIMITS` e use pooling para tudo que nasce e morre em massa.
12. **Dependências.** Não adicione pacotes sem o dono concordar.
13. **Cache e atualização (PWA).** `BUILD_ID` sincronizado entre `sw.js` e `index.html` (`scripts/verify-build.mjs`); o Service Worker novo espera o jogador recarregar e nunca troca de versão no meio do combate.

## Verificação e publicação

- Antes de cada commit: `npm run check` (tipos, lint, cores, testes). O hook de pre-commit roda isso sozinho.
- Antes de publicar: `npm run build` e `node scripts/verify-build.mjs`.
- Mudou lógica? Escreva ou atualize o teste. Mudou algo visível? Teste no navegador.
- Nunca diga que algo passou sem ter rodado. O que não foi verificado é dito como "não verificado".
- Commits pequenos, com mensagem no padrão `tipo(área): resumo`. Push em `main` publica o jogo.
- Git sem destruição de histórico: nada de `push --force`, `reset --hard` ou apagar branches sem o dono pedir.
- Atualize `docs/CHANGELOG.md` a cada entrega, com um resumo para o jogador.
