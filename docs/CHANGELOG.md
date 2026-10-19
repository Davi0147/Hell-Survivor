# Changelog — Hell Survivor (`docs/CHANGELOG.md`)

Todas as mudanças relevantes, pacotes de refatoração, correções de bugs e novas funcionalidades deste projeto são documentadas neste arquivo.

## [v0.9.3 — Balões de Fala, Cenário da Arena & Correção do Altar no Modo de Teste] — 2026-10-19

### Resumo para o Jogador
- **O que muda para o jogador**: Nada visível na jogabilidade normal. Todo o comportamento, visuais, limites de arena, névoa, falas de combate e tempos de jogo continuam exatamente idênticos.
- **Modo de Teste ([F1] Sandbox)**: Correção na invocação "Succubus (com diálogo)". Agora é possível invocar e enfrentar a chefe com o diálogo cinemático múltiplas vezes na mesma sessão de teste, mesmo após ela já ter sido derrotada anteriormente.
- **Organização interna (código do jogo)**: Continuação da faxina e modularização da cena principal (`GameScene.ts`), separando o sistema de balões de fala de combate (`CombatBubbleSystem.ts`) e o sistema de cenário e bordas da arena (`ArenaScenerySystem.ts`) em módulos dedicados e seguros, com 145 testes automatizados cobrindo cada detalhe.

### Correções do Modo de Teste (Sandbox)
- **Restauração do Altar de Invocação para "Succubus com Diálogo" (`BossSummonAltar.ts` & `SandboxController.ts`)**:
  - *Defeito*: Ao derrotar a Chefe Succubus em combate, o evento `'boss-defeated'` chamava `bossSummonAltar.complete()`, definindo `isCompleted = true` e tint cinza de forma irreversível. Ao tentar invocar posteriormente a Succubus via "SUCCUBUS (COM DIÁLOGO)" no Sandbox, o jogo ativava o altar e exibia o aviso de aproximação, mas `BossSummonAltar.updateAltar()` abortava na verificação de `isCompleted`, impedindo o início da batalha cinematográfica por proximidade.
  - *Correção*: Implementado o método cirúrgico `resetForSandbox()` em `BossSummonAltar.ts` que restaura as flags (`isActive = false`, `isBossSpawned = false`, `isCompleted = false`), os timers de animação/partículas e a textura base `'altar-invoc-inactive'` com remoção do tint cinza (`clearTint()`). Chamado exclusivamente por `SandboxController.spawnBoss(true)` antes de invocar `triggerBossEncounter()`, preservando 100% o comportamento do jogo padrão.
  - *Testes de Contrato*: 3 novos testes adicionados em `src/__tests__/sandboxController.test.ts` validando o retorno ao estado inicial, a precedência do reset antes de `triggerBossEncounter` no spawn com diálogo e a não execução do reset no spawn direto sem diálogo. Prova por mutação gravada em `reports/mutacao-fix-altar.txt`.

### Refatoração & Arquitetura (Pacote 3 — Etapas 2 e 3)
- **Extração do Sistema de Balões de Combate (`src/systems/CombatBubbleSystem.ts`)**:
  - Extração dos métodos `startBossCombatBanter`, `showCombatSpeechBubble` e `clearCombatSpeechBubbles`, juntamente com os campos `activeCombatBubbles` e `combatBanterTimers` da `GameScene.ts`.
  - Redução líquida de 155 linhas na `GameScene.ts`, mantendo fachadas públicas de 1 linha para chamadas internas e compatibilidade retroativa com chefes e sistemas.
  - Implementação da interface de contexto `ICombatBubbleContext` e contrato genérico `ICombatBubbleTarget` respeitando a Regra 18 (sem assumir personagem fixo Nixy).
  - Encapsulamento do rastreamento suave no `PRE_RENDER` e descarte com cancelamento de timers no shutdown da cena (Regra 13).
  - 8 testes unitários de contrato em `src/__tests__/combatBubbleSystem.test.ts` com prova por mutação registrada em `reports/mutacao-pacote3-e2b.txt`.
- **Extração do Sistema de Cenário da Arena (`src/systems/ArenaScenerySystem.ts`)**:
  - Extração dos limites visuais da arena (`drawArenaBorders`), névoa ondulante das bordas (`updateBorderMist`), métodos de props individuais (`addSceneryRock`, `addSceneryTorch`, `addSceneryCrystal`, `addSceneryMushroom`, `addSceneryBones`), instanciação temática em lote (`spawnSceneryProps`), limpeza completa (`clearAllSceneryProps`) e controle de visibilidade (`setSceneryPropsVisible`) da `GameScene.ts`.
  - Redução líquida de 271 linhas na `GameScene.ts` (333 exclusões, 62 inserções), mantendo fachadas públicas de 1 linha e getters/setters para compatibilidade retroativa absoluta.
  - Criação da interface estrita de contexto `ISceneryContext` sem nenhum `any` novo.
  - Decisões arquiteturais fundamentadas: `loadCustomMapLayout` permaneceu na `GameScene.ts` por tocar em 9 elementos interdependentes da cena; `setArenaFloorTexture` permaneceu na `GameScene.ts` para manipular diretamente o `floorTile` da cena.
  - Descarte seguro e completo no evento `SHUTDOWN` (Regra 13), limpando gráficos, emissores de partículas e todos os props em cena.
  - 17 testes unitários de contrato em `src/__tests__/arenaScenerySystem.test.ts` (suíte total de 145 testes, 100% aprovados).
  - Prova por mutação executada com cancelamento da destruição de props em `clearSceneryPropsOnly`, capturada em `reports/mutacao-pacote3-e3.txt`.
- **Ajuste da Catraca de Linhas e Linter**:
  - Trava do ESLint ajustada para `--max-warnings 159` no `package.json`.

## [v0.9.2 — Fila de Level Up Sequencial, Extração do SandboxController & Trava do Lint em 166] — 2026-10-18
### Correções de Jogabilidade & Fila de Progressão
- **Fila Sequencial de Escolha de Cartas ao Subir Múltiplos Níveis (`GameScene.ts` & `UpgradeScene.ts`)**:
  - Correção de bug onde subir múltiplos níveis de uma só vez (ex.: nível 1 para 4 ao coletar grandes gemas de XP) apresentava a tela de escolha de cartas apenas uma única vez, descartando as escolhas dos demais níveis.
  - Implementada verificação resiliente no topo do loop de atualização (`GameScene.update()`) com guarda de reentrância (`isUpgradeSceneOpening`), garantindo que cada nível ganho ofereça sua respectiva escolha de cartas em sequência contínua.
  - Blindagem de física: a simulação permanece 100% congelada enquanto houver níveis pendentes na fila, retomando somente após a última escolha ser finalizada.
  - 6 novos testes unitários adicionados em `src/__tests__/levelUpQueue.test.ts` (suíte total expandida para 117 testes, 100% aprovados).

### Refatoração & Arquitetura (Pacote 3 — Etapa 1)
- **Extração do Controlador de Sandbox (`src/systems/SandboxController.ts`)**:
  - Extração de 10 métodos operacionais de trapaça/testes e dos 5 campos de modificadores de trapaça da `GameScene.ts`.
  - Redução líquida de 150 linhas na `GameScene.ts`, mantendo fachadas públicas de 1 linha para compatibilidade com o painel `DevSandboxPanel.ts`.
  - Criação da interface de contrato `ISandboxContext`, tipando a ponte entre a cena, o controlador e o painel de testes sem uso de `any`.
  - 20 testes unitários de contrato em `src/__tests__/sandboxController.test.ts` e prova por mutação registrada.

### Qualidade & Catraca do Lint
- **Abaixamento da Catraca do ESLint para 166 Avisos**:
  - A catraca rígida `--max-warnings` do ESLint foi reduzida de 203 para 166 no `package.json` e documentação técnica, blindando a limpeza de tipagem obtida no Pacote 3 contra qualquer novo aviso.

## [v0.9.1 — Diretor Musical, Blindagem de Ciclo de Vida, Tema Centralizado & Guarda Pre-Commit] — 2026-10-18
### Correções Críticas & Blindagem de Áudio (PACOTE ÁUDIO-1)
- **Diretor de Música Autônomo (`src/systems/MusicDirector.ts`)**:
  - Máquina atômica de estados sonoros (`setMusicState`) desacoplada de tweens de cena do Phaser (usando timers com passos de 25ms), garantindo que trocas ou pausas de cena nunca mais deixem faixas antigas tocando em segundo plano.
  - Eliminação atômica dos 5 vazamentos musicais mapeados: parada incondicional da música do menu ao iniciar qualquer modo, corte imediato de áudio ao sair da pausa para o menu, sincronização milimétrica do fade de vitória com a troca para a cena de encerramento do capítulo, parada imediata da música ao reiniciar ou sair da partida durante o efeito de morte, e limpeza sem colisões na remoção/invocação de chefes pelo painel de testes.
  - Tabela de configuração pura (`src/config/musicConfig.ts`) mapeando 9 estados, loops, fades padrão e fórmulas exatas de volume sem alterar nenhum decibel percebido pelo jogador.
  - Fachada limpa em `src/systems/SoundManager.ts` preservando 100% da API pública e reduzindo a contagem de avisos do ESLint de 203 para 172.

### Qualidade & Ferramental Contínuo (PACOTE G & PACOTE H)
- **Guarda Automático de Qualidade (`.githooks/pre-commit` & `INSTALAR_GUARDA.bat`)**:
  - Hook pré-commit em Node puro que valida tipos, ESLint, catraca de cores e testes unitários antes de permitir commits.
  - Regra 18 no `AGENTS.md` para desacoplamento do personagem jogável (`BaseCharacter`).
  - Suíte de testes unitários expandida para 91 testes no Vitest (100% aprovados).

### Design System & Carregamento Seguro (PACOTE 2B & 2B.1)
- **Centralização Tipográfica e Semântica (`src/config/theme.ts`)**:
  - Tokens semânticos para `FONTS` (`Pixelzone` para display, `Silkscreen` para body), `COLORS` e fórmulas de telegrafia de chefes (`BOSS_TELEGRAPH`).
  - Números de dano migrados com sucesso para a fonte `Pixelzone` com contorno de alta legibilidade.
  - Catraca automatizada de cores (`verify-theme.mjs`) travada em 1194 ocorrências.
  - Espera assíncrona por fontes no `BootScene.ts` com fallback e timeout seguro de 1000ms.

### Correções de Ciclo de Vida & Teste (PACOTE L & PACOTE B)
- **Limpeza de Ouvintes**: Remoção de listeners de teclado, pointer e timers ao desligar cenas (`MenuScene`, `GameScene`, `UIScene`, `UpgradeScene`, `Chapter1EndScene`).
- **Bot Autônomo F3**: Capacidade de resolver cartas arcanas mesmo com a `GameScene` pausada e kiting de monstros calibrado.

## [Pacote G — Guarda Automático de Qualidade] — 2026-10-18
### Adicionado & Blindado (Qualidade, Ferramental & Automação)
- **Hook de Pre-Commit Automatizado (`.githooks/pre-commit` & `scripts/pre-commit.mjs`)**:
  - Script em Node puro (sem dependências externas novas) acionado automaticamente a cada tentativa de `git commit`.
  - Executa a suíte completa de qualidade (`npm run check`): checagem de tipos estritos (`tsc --noEmit`), linter com catraca de warnings (`eslint` travado em 203 avisos), catraca de novas cores fora do tema oficial (`verify-theme.mjs`) e suíte de testes de regressão (`vitest`).
  - Bloqueia imediatamente o commit com código de saída 1 e mensagem de orientação ao usuário caso qualquer uma das etapas falhe.
- **Instalação em 1 Clique & Compatibilidade Windows (`scripts/install-hooks.mjs` & `INSTALAR_GUARDA.bat`)**:
  - Script utilitário em Node puro que configura o repositório local com `git config core.hooksPath .githooks`.
  - Atalho em lote `INSTALAR_GUARDA.bat` estritamente compatível com Windows (somente caracteres ASCII, quebras de linha CRLF, sem `chcp`, sem `!`), aprovado 100% pelo validador `scripts/verify-bat.mjs`.
- **Prova de Bloqueio por Mutação e Defesa em Camadas**:
  - Validação empírica do hook realizada com injeção de warning no ESLint (`theme.test.ts`), gerando 204 avisos (> 203 permitidos) e confirmando o cancelamento imediato do commit.
  - Confirmação de integridade no fluxo de CI (`.github/workflows/deploy.yml`): qualquer tentativa de ignorar o hook local via `git commit --no-verify` é capturada e bloqueada antes do build e do deploy no GitHub Pages.
- **Documentação e Governança**:
  - Atualização do `docs/GUIA_DO_DONO.md` com seção dedicada em linguagem simples explicando a instalação em 1 clique e o significado seguro de commits bloqueados.
  - Atualização de status em `LIVRO_DE_ANOTACOES.md`.

## [Pacote 2B — Centralização de Fontes, Cores e Telegrafia de Chefes] — 2026-10-18
### Adicionado & Refatorado (DEC-008 / Regra 5)
- **Centralização Tipográfica, Semântica de Cores e Fórmulas de Telegrafia (`src/config/theme.ts`)**:
  - `FONTS`: Definição de papéis tipográficos semânticos (`display`: `'Pixelzone'` para títulos, cartas, números de dano e anúncios; `body`: `'Silkscreen'` para texto corrido, lore, diálogos e descrições; `fallback`: `'monospace'`).
  - `COLORS`: Tokens de cor semânticos preservando os mesmos valores visuais existentes no código (ouro e destaque, carmesim e perigo, neutros, fundos de veludo abissal e utilitários), sem unificar tons parecidos na estética.
  - `BOSS_TELEGRAPH`: Centralização de fórmulas geométricas e de transparência para telegrafia de investida e área com base no padrão da Succubus (`lineThickness = 3 + progress * 9`, cor `0xff0055`, miolo branco `0xffffff`, borda de área `0xff2266` com `circleBorderThickness = 2 + progress * 3`, preenchimento carmesim e mira em cruz).
- **Aplicação Controlada do Tema a Sistemas Críticos**:
  - `DamageTextSystem.ts`: Migração da fonte de números de dano de `'Impact'` para `FONTS.display` (`'Pixelzone'`), mantendo estritamente o contorno preto espesso (`stroke: '#000000'`, 3px) para garantir legibilidade imediata em combate.
  - `SuccubusBoss.ts`: Conexão da investida e do salto em área (slam) às fórmulas e constantes de `BOSS_TELEGRAPH`.
  - `AzazelBoss.ts`: Conexão da investida comum, investidas escuras (Dark Five Dashes) e círculos de tempestade de raios às fórmulas e constantes de `BOSS_TELEGRAPH`, mantendo os alcances originais (560px, 620px e raio de 68px).
- **Catraca Automatizada de Cores (`scripts/verify-theme.mjs` & `scripts/theme-baseline.json`)**:
  - Script em Node puro que varre todos os arquivos em `src/` fora de `src/config/theme.ts`, detecta literais hexadecimais (`0x......` e `#......`) e compara com a linha de base gravada em `scripts/theme-baseline.json` (baseline inicial fixado em 1194 ocorrências e 361 cores distintas).
  - Integrado ao comando `npm run check`. Em caso de inserção de novas cores fora de `theme.ts`, o script encerra a execução com código 1 e alerta de violação da Regra 5.
  - Validação de sensibilidade com prova por mutação gravada em `reports/verify-theme-fail.txt`.
- **Testes Unitários & Governança (`src/__tests__/theme.test.ts`, `docs/DESIGN_SYSTEM.md`, `AGENTS.md`)**:
  - 12 novos testes unitários cobrindo papéis de fontes, integridade dos tokens numéricos e CSS de cor, e exatidão das fórmulas matemáticas de telegrafia (total do projeto elevado para 66 testes passando).
  - Padrões 2.5 (Telegrafia de Chefes) e 2.6 (Números de Dano Flutuantes) promovidos para o status `"Aceita"` em `docs/DESIGN_SYSTEM.md`.
  - Regra 5 do `AGENTS.md` atualizada para registrar `theme.ts` como ativo e obrigatório para novas cores/fontes.

## [Pacote H — Arrumação de Documentos, Decisões e Catraca do Lint] — 2026-10-18
### Documentação, Governança & Qualidade
- **Regra 18 no AGENTS.md (Desacoplamento do Personagem Jogável)**:
  - Estipulado que código novo de interface, armas, cutscenes, diálogos e sistemas não deve presumir que o jogador é a heroína Nixy (proibição de `instanceof Nixy` ou literais `'nixy'` fora de constantes centralizadas).
  - Uso estrito da classe genérica `BaseCharacter` e leitura dinâmica de `characterId` e `characterName`.
- **Abaixamento da Catraca do Lint (`package.json`)**:
  - Trava do ESLint reduzida de `--max-warnings 205` para `203`, acompanhando a eliminação de casts `as any` no bot autônomo (Pacote B).
  - Prova de limite por mutação executada com `--max-warnings 202`, gerando saída de falha controlada e código de saída 1.
- **Registro Formal de Decisão de Arquitetura (`docs/DECISIONS.md`)**:
  - Formalizada a **DEC-009** (Proposta — decisão do dono, detalhes a definir), fixando: recompensa por chefe em "bastante XP", início do combate por aproximação espacial (estilo altar), inclusão do Azazel no ciclo do Infinito mediante ficha prévia de restauração de mapa, e sequenciamento técnico: Pacote 2B ➔ Pacote 3 ➔ Pacote UI ➔ Sistema de Encontros de Chefe ➔ Ciclo do Infinito ➔ Múltiplos Personagens.
- **Saneamento de Portas e Contratos nos Documentos (`LIVRO_DE_ANOTACOES.md`, `docs/MECHANICS.md`, `docs/GUIA_DO_DONO.md`, `README_ANALISE.md`)**:
  - Distinção explícita entre a porta de desenvolvimento normal (`JOGAR.bat` na porta 3000) e a porta de ensaio de produção (`TESTAR_VERSAO_1.bat` na porta 8080).
  - Retificação técnica da Fase 2 de Azazel com os símbolos reais do código (`startDarkFiveDashes`, `spawnNextDarkPhantomDash`, `startDarkEightClones`, `AzazelPhantomClone`), removendo menções a números de linha obsoletos.

## [Pacote B — Conserto do Bot Autônomo de Teste F3] — 2026-10-18
### Corrigido & Aprimorado (Ferramenta de Testes / Sandbox)
- **Resolução Autônoma da Tela de Upgrades com GameScene Pausada (`src/scenes/UpgradeScene.ts` & `src/systems/AutoPlayTestAgent.ts`)**:
  - Delegada a chamada de `checkAndResolveUpgradeModal` diretamente para o método `update` ativo da `UpgradeScene` quando `AutoPlayTestAgent.getInstance().isEnabled` estiver ativo.
  - Com o bot desativado (`isEnabled === false`), o comportamento do jogo é 100% idêntico ao original, preservando controles por teclado, mouse e gamepad, inclusive atalhos de reroll (`R`) e pular (`Espaço`).
  - Associação das instâncias de cartas aos containers visuais (`rootContainer.setData('upgradeCard', card)`) e priorização de evoluções arcanas quando disponíveis.
- **Calibração da Navegação e Coleta de Gemas de Alma (`src/systems/AutoPlayTestAgent.ts`)**:
  - Parâmetros de inteligência artificial extraídos para constantes nomeadas no topo do arquivo: `ENEMY_DETECTION_RADIUS` (180), `ENEMY_THREAT_MAX_FOR_XP` (8), `GEM_SEEK_RADIUS` (600), `MAP_ITEM_SEEK_RADIUS` (500), `REPULSE_WEIGHT` (1.35), `XP_ATTRACTION_WEIGHT` (2.0), `XP_ATTRACTION_SWARM_WEIGHT` (0.8) e `UPGRADE_REACTION_DELAY_MS` (250).
  - Removida a barreira restritiva de `threatsNear < 3` e o filtro `!g.isAttracted`, permitindo que o bot colete gemas sob pressão moderada e mantenha atração residual mesmo em enxames para evitar fugas desnecessárias para áreas vazias.
- **Telemetria de Upgrades e Subidas de Nível no Gravador de Sessão (`src/systems/DebugSessionLogger.ts`)**:
  - Adicionados métodos `recordBotUpgrade(cardTitle, level, timeSec, details)` e `recordBotLevelUp(newLevel)` ao `DebugSessionLogger`.
  - Exibição das métricas consolidadas (`Níveis Subidos` e `Cartas Escolhidas`) na seção de atributos do relatório gerado por `generateAIReport()`.

## [Pacote L — Limpeza de Ouvintes e Teclas Acumuladas no Ciclo de Vida das Cenas] — 2026-10-18
### Corrigido & Refatorado (DEC-006 / Regra 13)
- **Eliminação de Acúmulo de Teclas na Escolha de Cartas (`src/scenes/UpgradeScene.ts`)**:
  - Implementado manipulador `SHUTDOWN` que desregistra explicitamente os atalhos de teclado `'keydown-R'` (re-rolar) e `'keydown-SPACE'` (pular/canalizar) via `off` e `removeAllListeners()`.
  - Impede a multiplicação de eventos após subir múltiplos níveis consecutivamente, garantindo que cada toque consuma estritamente 1 carga de reroll.
- **Limpeza de Eventos de Loop e Teclas em Batalha (`src/scenes/GameScene.ts`)**:
  - Registrada a remoção dos ouvintes `POST_UPDATE` (sincronização do piso infinito) e `PRE_RENDER` (posicionamento de balões de fala e telegrafia de chefes) no `SHUTDOWN`.
  - Remoção completa de instâncias de teclas e ouvintes (`E`, `ESC`, `F3`, `M`), limpeza de ouvintes no jogador (`player-level-up`) e cancelamento de timers pendentes.
- **Higienização de Navegação de Menus e Telas (`src/scenes/MenuScene.ts`, `src/scenes/UIScene.ts`, `src/scenes/Chapter1EndScene.ts`)**:
  - `MenuScene`: Remoção de todas as teclas de navegação (`W/S`, `Cima/Baixo`, `Enter`, `Espaço`, `ESC`) e cancelamento de timers no `SHUTDOWN`.
  - `UIScene`: Remoção de teclas de hud (`E`, `F2`, `ESC`), desativação de ouvintes de teclado genéricos e cancelamento do timer de alertas de onda (`alertTimer`).
  - `Chapter1EndScene`: Remoção de ouvintes de teclado (`keydown`), toques/cliques (`pointerdown`) e cancelamento do timer da máquina de escrever (`typeTimer`) no `SHUTDOWN`.

## [Pacote P1.6 — Remoção da Matriarca Succubus do Modo Infinito & Saneamento de Nomes] — 2026-10-18
### Removido & Refatorado
- **Remoção da Matriarca Succubus do Modo Infinito (`src/scenes/GameScene.ts`)**:
  - Removido o bloco de spawn aos 6:00 (360s) e a flag de controle `miniBoss6mSpawned`. Atende à decisão do dono de que a Succubus deve aparecer exclusivamente como Chefe Suprema do jogo (aos 10m no Infinito ou via Altar de Invocação).
  - Mantido o método `spawnMatriarchSuccubus` e o botão correspondente do painel Sandbox (aba 4 de testes) para validações e testes manuais da equipe.
  - Confirmado via análise estrita que `src/entities/enemies/Succubus.ts` permanece como código morto preservado (nunca instanciado na cena) e não foi alterado.
  - Mantidos inalterados o Cérbero (3m), o Altar de Invocação (5m) e a Succubus Imperial (10m).
- **Saneamento e Auditoria de Funções de Spawn nos Documentos (`docs/MECHANICS.md` & `docs/BALANCE_AUDIT.md`)**:
  - Alinhados os nomes reais das rotinas no código: `spawnCerberusBoss` → `spawnTitanCerberus`, `spawnMatriarchBoss` → `spawnMatriarchSuccubus`, `spawnEndless10MinBoss` → `spawnSuccubusBossEndless`, `updateHordeDirector` → `spawnEnemyRandomPerimeter`.
  - Atualizadas as tabelas de auditoria de dano e inimigos para refletir a retirada da Matriarca da timeline do Infinito.
- **Governança do Backlog de Chefes (`LIVRO_DE_ANOTACOES.md`)**:
  - Registrada a decisão do dono de postergar a implementação do ciclo recorrente de chefes do Infinito para o pós-lançamento, utilizando a especificação de [`docs/FICHA_CICLO_DE_CHEFES.md`](docs/FICHA_CICLO_DE_CHEFES.md) como ponto de partida.

## [Pacote P1.5 — Correção do Modo Infinito, DEC-007 Aceita & Espera Real no BAT] — 2026-10-18
### Corrigido & Adicionado
- **Continuidade do Modo Infinito na Derrota do Chefe (`src/config/balance.ts` & `src/scenes/GameScene.ts`)**:
  - Extraída a decisão de encerramento para a função pura `getBossDefeatOutcome(gameMode: string): 'chapter-end' | 'continue-run'`, com 4 novos testes unitários e prova por mutação.
  - No Modo Infinito (`endless`), a derrota da Succubus (invocada pelo altar ou espontânea) não encerra mais o capítulo, não pausa a física e não transiciona para `Chapter1EndScene`; em vez disso, entrega as recompensas supremas de sobrevivência (3 gemas roxas, 60-80 almas, baú de upgrade, aviso na tela, carga de ultimate e retomada das hordas).
  - Adicionada guarda `!this.isBossFightActive` na invocação da Succubus aos 10:00 (`elapsedSec >= 600`), prevenindo duplicação com confrontos em andamento.
- **Espera Real de Servidor no `TESTAR_VERSAO_1.bat` (`scripts/esperar-e-abrir.mjs`)**:
  - Substituído o timeout fixo cego de 2 segundos por monitoramento ativo HTTP na porta 8080 com abertura automática do navegador somente após resposta válida do servidor Vite preview.
  - Conformidade estrita validada por `scripts/verify-bat.mjs` (ASCII puro, CRLF, sem BOM, sem `!`, sem `chcp`).
  - Confirmado que `TESTAR_ATUALIZACAO.bat` não possui o problema pois não abre navegador.
- **Governança & Arquitetura (`docs/DECISIONS.md` & `AGENTS.md`)**:
  - DEC-007 (Integridade de Cache e Infraestrutura Web) formalmente aceita pelo dono.
  - Gravada a Regra 17 em `AGENTS.md`.
- **Ficha de Viabilidade Técnica (`docs/FICHA_CICLO_DE_CHEFES.md`)**:
  - Análise rigorosa baseada em código sobre o ciclo recorrente de chefes no Infinito, catalogando a inviabilidade do Azazel na forma atual (devido ao banimento dimensional para o mapa 202 com retorno hardcoded para o Capítulo 2) e propondo a variante com poda de fase e escalonamento por ciclo.
- **Backlog do Bot F3 (`LIVRO_DE_ANOTACOES.md`)**:
  - Registrada a hipótese técnica de travamento do bot na abertura da `UpgradeScene`.

## [Pacote P1.4 — Implementação de Decisões do Dono & Blindagem de Segurança] — 2026-10-18
### Adicionado & Refatorado
- **Modo de Teste Limpo (`src/scenes/GameScene.ts`)**:
  - `loadCustomMapLayout` ignora o bloco de spawn de itens de exploração quando `gameMode === 'sandbox'`, garantindo que a arena de testes inicie 100% limpa (itens continuam disponíveis para drop manual na aba 4 do painel F1).
  - Modo História e Infinito continuam gerando seus itens iniciais normalmente (4 no Cap. 1, 17 no Cap. 2 e 2 na Dimensão 202).
- **Blindagem do Modo Sandbox em Domínios Públicos (`src/config/balance.ts` & `src/__tests__/sandboxLock.test.ts`)**:
  - `isDevSandboxEnabled()` agora bloqueia estritamente qualquer acesso ao sandbox caso o `hostname` não seja `localhost` ou `127.0.0.1` (impedindo burlas via `?debug=1`, `?sandbox=1` ou `localStorage`).
  - Adicionado `src/__tests__/sandboxLock.test.ts` com 5 testes unitários cobrindo acessos públicos e locais sem introduzir `any`. Total de testes da suíte elevado para 48 (100% passando).
- **Ajuste de Ergonomia do Banner PWA (`src/main.ts`)**:
  - Reposicionado o card de atualização para o canto superior direito (Opção 2 aprovada pelo dono), liberando a visibilidade central do logotipo "HELL SURVIVOR".
- **Ratchet de Qualidade (`package.json`)**:
  - Trava do ESLint rebaixada de `--max-warnings 214` para `--max-warnings 205` (número real de avisos atuais do projeto).
- **Governança & Arquitetura (`docs/DECISIONS.md`, `AGENTS.md`, `docs/MECHANICS.md`)**:
  - DEC-006 (Ciclo de Vida de Cenas) e DEC-008 (Resumo simples para o dono) aprovadas e aceitas.
  - Regra 13 e Regra 16 gravadas em `AGENTS.md` e Seção 11 incluída em `docs/MECHANICS.md`.

## [Pacote P1.3b — Unificação de Executáveis e Isolamento de Cache Web] — 2026-10-18
### Adicionado & Refatorado
- **Executável Único de Desenvolvimento (`JOGAR.bat` & `scripts/jogar-dev.mjs`)**:
  - Substituição de `INICIAR_JOGO.bat` por `JOGAR.bat` curto (4 linhas, ASCII estrito, CRLF, sem BOM, sem `chcp`, sem `enabledelayedexpansion`).
  - Lógica em Node puro (`scripts/jogar-dev.mjs`): liberação da porta 3000 apenas se o processo for `node.exe`, limpeza de caches residuais (`node_modules/.vite` e `dist`), subida com `--force`, monitoramento HTTP ativo e abertura automática do navegador padrão ao obter código 200.
  - Validador estrito `scripts/verify-bat.mjs` garantindo conformidade de todos os `.bat` da raiz.
- **Proteção Contra Recarga em Primeira Visita (`src/main.ts`)**:
  - Introduzida flag `userRequestedReload`: o evento `controllerchange` só recarrega a página se o jogador tiver clicado ativamente no botão `[ RECARREGAR ]` do banner.
  - Adicionada guarda de pausa da interface (`uiScene.isPaused`) na detecção de combate ativo `isCombatActive()`.
- **Isolamento de Cache de Origem (`public/sw.js` & `scripts/sw-killswitch.js`)**:
  - Expurgo restrito estritamente a chaves que iniciem com `hell-survivor-`, protegendo outros apps do usuário na mesma origem do GitHub Pages.
- **URL Oficial do Jogo**:
  - Registrado endereço oficial `https://davi0147.github.io/Hell-Survivor/` em `docs/GUIA_DO_DONO.md` e `docs/RELEASE_CHECKLIST.md`.


## [UI Mobile — Sprites Pixel Art para Controles Touch] — 2026-10-18
### Adicionado & Refatorado
- **Sprites Customizados de Interface Touch (`src/ui/TouchControls.ts` & `src/scenes/BootScene.ts`)**:
  - Integração dos 5 novos sprites pixel art (`Analog.png`, `Stick.png`, `Sprint.png`, `UltButton.png`, `Pause.png`) em substituição aos vetores procedurais genéricos (`Phaser.GameObjects.Graphics`).
  - Carregamento oficial no preload do `BootScene.ts` com cache buster (`touch-analog`, `touch-stick`, `touch-sprint`, `touch-ult`, `touch-pause`).
  - Implementação de resposta tátil imediata: redução dimensional de 10% (efeito mecânico de clique) e variação de tonalidade/brilho ao tocar nos botões de Sprint, Ultimate e Pausa.
  - Indicador visual dinâmico no botão de Suprema (`UltButton`): dimerização a 45% de opacidade e matiz escurecido durante recarga; opacidade total (100%) e animação de pulso rítmico senoidal contínuo quando a Suprema está pronta.
  - Remoção dos textos sobrepostos desnecessários, preservando a nitidez da arte conceitual pixel art.
  - Refatoração da tipagem em `TouchControls.ts` eliminando todos os 5 usos legados de `any` e variáveis não utilizadas, reduzindo os avisos do ESLint de 213 para 207 (zero novos `any`, 0 erros, 43 testes passando).


## [Pacote P1.1 — Atualização Confiável e Integridade de Cache Web] — 2026-10-18
### Adicionado & Refatorado
- **Plugin de Versionamento Inline (`vite.config.ts`)**:
  - Geração de `BUILD_ID` no formato `<sha curto> • <dd/mm hh:mm>` sem novas dependências externas.
  - Injeção dinâmica no rodapé `#build-version` do `index.html` e substituição do marcador `__BUILD_ID__` em `dist/sw.js` no hook `closeBundle()`.
- **Service Worker Versionado e Atômico (`public/sw.js`)**:
  - `CACHE_NAME = 'hell-survivor-' + BUILD_ID`.
  - Estratégias segregadas: *Network-First* para navegação e `index.html`; *Cache-First* para scripts/estilos com hash em `/assets/`; *Network com `cache: 'no-cache'`* para estáticos sem hash (sprites, áudios, fontes).
  - Migração transparente: expurgo imediato do cache legado `'hell-survivor-cache-v1'` via `skipWaiting` apenas na primeira transição.
  - Ativação sob demanda em versões futuras via escuta da mensagem `SKIP_WAITING`.
- **Controle de Atualização e Banner Seguro no Cliente (`src/main.ts`)**:
  - Registro configurado com `{ updateViaCache: 'none' }` (bypassa o cache de 10 min do GitHub Pages).
  - Ouvintes de `updatefound`, `waiting`, `visibilitychange` e rotina de revalidação a cada 30 minutos em background.
  - Proteção contra loops de recarga no evento `controllerchange`.
  - Banner estilizado segundo `docs/DESIGN_SYSTEM.md` (paleta carmesim `#180208`, `#ff0055`, `#f3d17a`, `#720012`, `#240046`, fonte Silkscreen, sem emojis).
  - Guarda de momento seguro: não exibe no meio do combate ativo (`GameScene` rodando e não pausada/game over); adia até pausa, fim de jogo ou volta ao menu.
- **Ferramentas de Defesa e Automação (`scripts/`)**:
  - `scripts/sw-killswitch.js`: script de emergência para cancelamento do worker e limpeza total de caches.
  - `scripts/verify-build.mjs`: validação de integridade pós-build garantindo correspondência atômica entre `dist/sw.js` e `dist/index.html`.
- **Pipeline de CI/CD (`.github/workflows/deploy.yml`)**:
  - Adicionado `fetch-depth: 0` no checkout para expor histórico Git ao build.
  - Adicionadas etapas de qualidade obrigatórias (`npm run check`) e verificação pós-build (`node scripts/verify-build.mjs`).
- **Arquitetura & Decisões**:
  - Registrada proposta DEC-007 em `docs/DECISIONS.md`.
  - Atualizado `docs/RELEASE_CHECKLIST.md` com protocolo de testes locais E2E e guia do kill-switch.

## [Hotfix 1 — Ciclo de Vida das Cenas] — 2026-10-18
### Corrigido
- **GameScene (Crash de reinicialização e retry)**:
  - Grupos de entidades (`enemiesGroup`, `gemsGroup`, `soulsGroup`, `mapItemsGroup`) movidos para o início de `create()`, antes da chamada de `loadCustomMapLayout(activeMap)`.
  - Adicionadas guardas tipadas `if (this.mapItemsGroup && this.mapItemsGroup.children)` em `loadCustomMapLayout`, `clearAllSceneryProps` e `setSceneryPropsVisible`, eliminando `TypeError: Cannot read properties of undefined (reading 'entries')` que ocorria ao reabrir o Sandbox ou clicar em "Tentar Novamente" no modo infinito.
  - Reset de arrays e campos residuais no `init()`.
- **IntroScene (Travamento de avanço e pulo da Intro)**:
  - Implementado `init()` para reinicializar todos os campos (`isEnding = false`, `isTyping = false`, `currentStepIndex = 0`, timers e tweens), impedindo o bloqueio perpétuo de cliques ao iniciar o Modo História pela segunda vez.
  - Adicionado ouvinte de `SHUTDOWN` limpando timers, tweens e listeners de teclado/ponteiro (`removeAllKeys(true)` e `removeAllListeners()`).
  - Cancelamento explícito do timer e tween da escuridão inicial ao apertar `ESC`, realizando a transição imediata para `GameScene` se a tela já estiver preta, ou com fade rápido de 250ms durante o diálogo.

## [Pacote 2A — Correções Pontuais Seguras] — 2026-10-17
### Adicionado & Refatorado
- **Tarefa 0 — Documentação Real do Escalonamento**: Alinhado `docs/MECHANICS.md §2`, `LIVRO_DE_ANOTACOES.md` e `docs/BALANCE_AUDIT.md` com a verdade do código: `ZombieDog` e `MummyEnemy` usam `getEnemyScaling` e multiplicador de capítulo; `BloodBat` e `SkullSlime` usam fórmulas inline lineares; minichefes (`Cerberus`, `SuccubusBoss`) usam atributos estáticos fixos.
- **Tarefa 1 — Centralização de Chaves de Armazenamento (`src/config/storageKeys.ts`)**: Criado módulo tipado com as 8 chaves auditadas de `localStorage` e `sessionStorage` e funções geradoras para mapas e backups (`getChapterMapKey`, `getChapterMapBackupKey`, `getMetaSaveBackupKey`). Atualizados todos os 8 arquivos auditados (`balance.ts`, `mapData.ts`, `UIScene.ts`, `DebugSessionLogger.ts`, `MetaProgressManager.ts`, `PWAInstallPrompt.ts`, `SoundManager.ts`). Criado `src/__tests__/storageKeys.test.ts` com 7 testes unitários.
- **Tarefa 2 — Centralização de Configurações de Capítulo (`src/config/balance.ts`)**: Adicionados `ChapterConfig`, `CHAPTER_CONFIG`, `CHAPTER_CONFIG_FALLBACK` e helper `getChapterConfig(chapter)`. Removidos literais dispersos em `GameScene.ts` (intervalo de altar, meta de almas, multiplicador de capítulo). Criado `src/__tests__/chapterConfig.test.ts` com 3 testes unitários.
- **Tarefa 3 — Modularização Segura de Efeitos de Status (`src/systems/statusEffects.ts`)**: Extraídas funções puras (`getStatusEffectTint`, `applyAcidRoot`, `applySlow`, `applyKnockback`, `updateStatusEffects`). Conectado a `Nixy.ts`, garantindo que timers de lentidão e veneno continuem decrementando durante o knockback e que a cor original seja restaurada corretamente se o efeito persistir. Criado `src/__tests__/statusEffects.test.ts` (7 testes) e documentado o papel de `hurtTimer` em `docs/MECHANICS.md §3`.
- **Tarefa 4 — Object Pool para Rastro Fantasma do Sprint (`src/entities/Nixy.ts`)**: Implementado pool de até 10 sprites fantasmas (`MAX_GHOST_POOL_SIZE = 10`) reciclados com `setActive(false)/setVisible(false)` no `onComplete` do mesmo tween original (360ms, Quad.easeOut), eliminando alocação contínua e destruição a cada 40ms sem nenhuma alteração visual.
- **Tarefa 5 — Versionamento e Backup de Mapas (`src/config/mapData.ts`)**: `MapStorageManager.getActiveMap` compara a versão do mapa customizado com a padrão; mapas customizados de versões anteriores são copiados para backup (`hell_survivor_custom_map_chapter_${chapter}_backup_v${oldVersion}`) antes do reset para o padrão. Mapas legados sem `version` continuam preservados se estruturalmente válidos. Removido `@deprecated azazelCrystals` do tipo e dos mapas oficiais. Mapas padrão elevados para `version: 2`. `getDefaultMap` refatorado para lookup em `Record<number, ChapterMapConfig>`. Convertidos `it.fails` em testes normais em `src/__tests__/mapValidation.test.ts` e adicionados testes de backup.
- **Tarefa 6 — Versionamento de Save e Filtro de Modo (`src/systems/MetaProgressManager.ts`)**: Adicionado `saveVersion: 1` em `MetaSaveData`. Saves legados recebem backup em `hell_survivor_meta_save_v1_backup` antes da migração transparente. Saneados valores corrompidos (NaN, não-números e negativos são truncados a 0). `recordRun` agora recebe parâmetro `mode`: apenas `'endless'` atualiza `highestEndlessTimeSec`, e `'sandbox'` é ignorado completamente. Chamadores atualizados em `Chapter1EndScene.ts:1215`, `GameScene.ts:1753` e `GameScene.ts:3258`. Convertido `it.fails` em normal em `src/__tests__/metaProgress.test.ts` e adicionados testes de migração e sanitização (total de 12 testes no arquivo).
- **Tarefa 7 — Eliminação de Ruído de Texturas no Console (`src/scenes/BootScene.ts`)**: Envolvidas todas as 75 chamadas de `this.textures.remove(key)` em `BootScene.ts:init()` com `if (this.textures.exists(key))`. Elimina completamente os avisos *"No texture found matching key"* no console durante o boot a frio.
- **Rede de Segurança**: Total de 43 testes unitários passando em 6 arquivos de teste, 0 erros de compilação TypeScript, 214 warnings de ESLint (catraca mantida em 214).

---

## [Pacote 1.5 — Verificação Rigorosa & Correção das Auditorias] — 2026-10-17
### Verificado & Corrigido
- **Integridade da Catraca e `package.json`**:
  - Comprovado via `package.json` e `git log` que a versão oficial é `0.1.0` e o script `check` contém `"tsc --noEmit && eslint src --max-warnings 214 && vitest run"`.
  - Provada a ativação da catraca: `npx eslint src --max-warnings 213` falha com código 1 (`ESLint found too many warnings (maximum: 213)`).
- **Mapeamento de Persistência (`docs/RELEASE_CHECKLIST.md`)**:
  - Correção da chave de mapa para `hell_survivor_custom_map_chapter_${chapter}` (`mapData.ts:254`).
  - Correção dos volumes padrão de áudio para `0.10` (música) e `0.60` (SFX) em `SoundManager.ts:14, 15`.
  - Descoberta e documentação da 8ª chave de armazenamento: `hell_survivor_pwa_dismissed` em `sessionStorage` (`PWAInstallPrompt.ts:22, 55, 160, 179`).
  - Prova linha a linha de todas as 8 chaves, seus símbolos e valores padrão.
- **Correção Matemática de Balanceamento (`docs/BALANCE_AUDIT.md`)**:
  - Nixy com Agilidade 5: caminho exato comprovado (`MetaProgressManager.ts:220` dá +20%, `Nixy.ts:43-45` aplica em `this.bonusSpeedPercent = 20`, e `BaseCharacter.ts:140-142` multiplica por 1.20). Velocidade real de andar: 192 px/s; corrida: 324 px/s. Corrigidos os caminhos de arquivo e o símbolo (`sprintSpeed` em vez de `playerRunSpeed`).
  - Morcego de Sangue: velocidade base real é 155 px/s (`BloodBat.ts:31` e `GameScene.ts:1199`). Na História não escala (fixo em 155 px/s). No Infinito segue `155 + minutes * 5` (0m: 155, 5m: 180, 10m: 205, 20m: 255).
  - Vida do Morcego vs Disparo de Almas: na História e no início do Infinito morrem com 1 tiro (25 dano > 14 HP), mas aos 5 min no Infinito (29 HP) exigem 2 tiros com arma nível 1.
  - Chefes: comprovado que nem `getEnemyScaling` nem `getChapterEnemyStatMultiplier()` são aplicados aos bosses. Conciliados os danos de Succubus (35 história, 40 infinito 10m, 24 matriarca 6m, 77 dive slam, 18 orbe, 53 dash) e Azazel (42 contato, 46 dash, 48 raio).
- **Service Worker e Produção**:
  - Documentado registro condicionado a `import.meta.env.PROD || window.location.protocol === 'https:'` em `src/main.ts:32-36`.
  - Registrado que em localhost o worker nunca roda, sendo obrigatório que o dono teste atualizações no endereço publicado (HTTPS).
- **Auditoria de Texturas e Avisos de Console**:
  - Esclarecida a origem dos 470 avisos de `No texture found matching key`: decorrem de `this.textures.remove()` prematuro no `BootScene.ts:init()` antes do `preload()` carregar os assets no TextureManager.
  - Comprovado via script que todos os arquivos (`azazel-run-west-*`, `chat-nixy-damage`, `chat-rosalin-defeated`, `ui-star`) existem fisicamente no disco e são carregados no `preload()`.

---

## [Pacote 1.4 — Complementação e Correção de Auditorias] — 2026-10-17
### Corrigido & Complementado
- **Auditoria de Balanceamento (`docs/BALANCE_AUDIT.md`)**:
  - Recontagem exata via varredura AST/Regex: substituído "mais de 70 números" pelo inventário exaustivo de **232 valores numéricos** dispersos fora de `balance.ts` (Nixy: 14, Armas/Evoluções: 84, Inimigos: 41, Chefes: 41, Itens/Altares: 19, Cenas/Diretor: 33).
  - Tabela de cobertura completa catalogando os 29 arquivos auditados com método de leitura (integral vs recorte de linhas).
  - Reformulação matemática dos 3 pontos críticos como hipóteses numéricas fundamentadas, eliminando termos de certeza ("one-hit kill", "impossível", "nulo"):
    - *Dive Slam* (77) + golpe leve (18) = 95 < 100 HP base da Nixy (sobrevive com 5 HP base ou 65 HP com Vitalidade 5; janela de invulnerabilidade de 450ms em `GameScene.ts:2519` impede acúmulo no mesmo instante).
    - Azazel aos 30 min no Modo Infinito: comprovado no código que Azazel não existe no Modo Infinito (aparecem apenas Cerberus aos 3m, Matriarca aos 6m e Succubus Imperial aos 10m) e que chefes não chamam `getEnemyScaling`, usando literais estáticos de dano. Mesmo com escalonamento hipotético (x3.40), o contato de 143 é inferior aos 160 HP da Nixy com bênção de Vitalidade.
    - Morcegos de Sangue: velocidade base de 160 px/s da Nixy é superada pela velocidade de perseguição do morcego (171 px/s) aos 5 min, mas a heroína conta com mecânica de Corrida/Sprint (270 px/s), bênção de Agilidade (até 184 px/s) e ataques automáticos contra inimigos de baixa vida (14–22 HP).
  - Mapeamento direto dos campos existentes de telemetria (`DebugSessionLogger` e `AutoPlayTestAgent`) contra as métricas pendentes para balanceamento por dados.
- **Checklist Técnico de Publicação (`docs/RELEASE_CHECKLIST.md`)**:
  - Rebaixado o item da Fonte Pixelzone de "Bloqueador" para "RESOLVIDO / PRONTO": teste empírico de compilação em `dist/index.html` e `scratch/dist-sub/index.html` comprovou que o plugin HTML do Vite reescreve automaticamente URLs absolutas de fontes dentro de `<style>` para casar com a `base` (`assets/fonts/...` e `/Hell-Survivor/assets/...`).
  - Incluído o código integral (37 linhas) de `public/sw.js` com análise técnica: presença de `skipWaiting()` e `clients.claim()`, e comprovação de que `CACHE_NAME` estático gera cache-first cego sem invalidar na primeira visita após novo deploy (único bloqueador crítico remanescente).
  - Documentado o bloco `on:` de `deploy.yml`, esclarecendo que pushes em `refactor/blindagem` não disparam deploy, enquanto merges na `main` publicam automaticamente.
  - Demonstração com código dos backdoors de runtime: `?debug=1` contorna restrições de produção, o atalho "digitar DEV" é comentário morto inexistente em `MenuScene.ts`, e `hell_survivor_dev_unlocked` opera exclusivamente fora de produção.
  - Tabela completa de persistência com as 7 chaves do `localStorage` e análise de resiliência a corrupção/migração.
  - Inventário rigoroso de conformidade de assets: 8 áudios BGM, 1 fonte local, 3 texturas, 11 cenas e 525 sprites devidamente classificados como "origem não documentada no repositório", sem suposições.
  - Confirmação do ranking dos top 10 maiores arquivos em `public/` e esclarecimento definitivo sobre o uso estritamente temporário de `npx tsx`, com compromisso registrado de utilizar apenas `node` e `vite-node` nos pacotes subsequentes.

---

## [Pacote 1.3 — Auditoria de Balanceamento & Checklist de Publicação] — 2026-10-17
### Adicionado
- Criado [`docs/BALANCE_AUDIT.md`](BALANCE_AUDIT.md) contendo auditoria profunda e somente leitura dos valores numéricos de gameplay:
  - Inventário detalhado de mais de 70 valores numéricos dispersos fora de `balance.ts` agrupados em 6 subsistemas: Mecânicas da Nixy, Armas/Evoluções, Inimigos Comuns, Chefes, Itens/Altares e Cenas/Diretor de Hordas.
  - Tabela calculada de escalonamento efetivo (minutos 0, 5, 10, 20 e 30) comparando Modo História vs Modo Infinito.
  - Análise dos pontos de quebra mecânica: velocidade dos morcegos superando a caminhada da Nixy aos 5 min; *Dive Slam* da Chefe Succubus consumindo 77% da vida base da heroína; dano de chefes aos 30 min no Modo Infinito causando *One-Hit Kill* mesmo com Vitalidade 5; e *Grilhões do Tartarus* paralisando chefes durante 66% do combate.
  - Análise comparativa da telemetria atual (`DebugSessionLogger` e `AutoPlayTestAgent`) e especificação das métricas faltantes para balanceamento por dados (dano por fonte, tempo de vida de monstros, DPS por arma e taxa de escolha/rejeição de cartas).
  - 7 pontos de decisão factuais para direcionamento do dono do projeto.
- Criado [`docs/RELEASE_CHECKLIST.md`](RELEASE_CHECKLIST.md) contendo auditoria completa de prontidão para lançamento e publicação:
  - Identificados 2 bloqueadores críticos: caminho absoluto com barra inicial no `@font-face` do Pixelzone em `index.html` (quebra em subdiretórios) e estratégia *Cache-First* estática no `sw.js` (impede que jogadores recebam atualizações no GitHub Pages).
  - Executado script temporário de verificação de assets (`scratch/check_assets.ts`): 492 referências validadas em `BootScene.ts`, 0 erros de case-sensitivity, 0 caminhos absolutos no código Phaser, e 56 arquivos órfãos / peso morto catalogados em `public/` (2.79 MB).
  - Avaliação de segurança: backdoor de URL `?debug=1` permitindo acesso ao Sandbox em produção e globais expostas no objeto `window`.
  - Mapeamento das 7 chaves de `localStorage` e diagnóstico da falta de validação de dados / migração de schema.
  - Inventário de licenças: fontes Google Fonts (OFL) documentadas, enquanto músicas e sprites constam com origem e licenças não documentadas no repositório.
  - Métricas de performance: `dist/` totalizando 56.79 MB (download em 4G estimado entre 22s e 45s); top 10 maiores arquivos mapeados; `npm run build` e `vite preview` validados com sucesso absoluto.

---

## [Pacote 1.2 — Protocolo de Registro de Memória & Design System] — 2026-10-17
### Adicionado
- Adicionada a **Regra 14 (Registro de Memória)** no [`AGENTS.md`](../AGENTS.md) estipulando os 6 passos obrigatórios para comandos como "lembra", "anota" ou "sempre faça assim".
- Criada a skill [`.agent/skills/registrar/SKILL.md`](../.agent/skills/registrar/SKILL.md) e workflow [`.agent/workflows/registrar.md`](../.agent/workflows/registrar.md) para execução do comando `/registrar` sem alterar arquivos em `src/`.
- Criado o documento [`docs/DESIGN_SYSTEM.md`](DESIGN_SYSTEM.md) contendo a especificação auditada dos 8 componentes visuais e de UX do jogo com referências diretas ao código real:
  - Cartas de upgrade flutuantes (`UpgradeScene.ts`).
  - Caixa de diálogo chanfrada e bustos dinâmicos (`DialogueSystem.ts`).
  - Frases centrais de chefe sem moldura (`UIScene.ts`).
  - HUD de combate: radar circular tático e painel de status barroco (`UIScene.ts`).
  - Telegrafia de ataques em linha e radial (`SuccubusBoss.ts`, `AzazelBoss.ts`).
  - Números de dano flutuantes (`DamageTextSystem.ts`).
  - Botões de menu em pergaminho com realce ígneo e seta (`MenuScene.ts`).
  - Modais de pedra carmesim e borda dupla (`UIScene.ts`).
- Catalogadas 5 inconsistências visuais encontradas no código para decisão do dono do projeto.
- Estabelecido o baseline quantitativo de cores (1.218 ocorrências com 362 hexadecimais únicos) e tipografia (6 famílias em uso) no diretório `src/`.

---

## [Pacote 1.1 — Correções do Pacote 1, Saneamento de Docs & Protocolo de Avaliação de Pedidos] — 2026-10-17
### Adicionado
- Trava rígida de catraca no ESLint configurada no script check (`--max-warnings 214`), com falha comprovada no terminal sob `--max-warnings 213` (exit code 1).
- Provas de mutação e reversão com `git diff` limpo para os módulos de escalonamento (`balance.ts`: trava de velocidade em 1.30x) e validação de mapas (`mapValidation.ts`: mínimo de 4 spawners).
- Implementadas as Regras 11 e 12 em `AGENTS.md`: Avaliação Obrigatória de Viabilidade Técnica (com Ficha de 6 tópicos) e "Pedido Não É Regra".
- Criado [`docs/DECISIONS.md`](DECISIONS.md) contendo o registro formal de decisões (ADRs migradas do Livro com seus status rigorosamente atribuídos: `Aceita` ou `Proposta`).
- Criada a skill `.agent/skills/viabilidade/SKILL.md` (e workflow `.agent/workflows/viabilidade.md`) para gerar a Ficha de Viabilidade sem tocar em código.

### Corrigido
- `docs/MECHANICS.md` (§3): reescritos os status da Nixy baseados exclusivamente no código real (`slowTimer` com `0x70e000` / verde tóxico; `rootTimer` com `0x55ff77` / verde ácido; `knockbackTimer` com velocidade direta sem arrasto; `hurtTimer` em `BaseCharacter.ts` controlando pose de animação; e `playerInvulnerableTimer` em `GameScene.ts`).
- `docs/MECHANICS.md` (§4 e §5): removidos números de linha voláteis e corrigida a referência do método de transição da Fase 3 do Azazel para `startAzazelPhase3Dimension()`.
- `docs/ARCHITECTURE.md`: corrigido o nome do grupo de almas para `soulsGroup`, localização dos timers da heroína e lista de falantes tratados em `playDialogueVoice`.

---

## [Pacote 1 — Rede de Segurança, Testes Unitários & Linter em Catraca] — 2026-10-17
### Adicionado
- Instaladas ferramentas de garantia de qualidade autorizadas (`vitest`, `eslint`, `typescript-eslint`, `@eslint/js`, `globals`) sem impacto no runtime de produção.
- Adicionado script unificado `"check": "tsc --noEmit && eslint src && vitest run"` e `"test": "vitest run"` em `package.json`.
- Configurado `vitest.config.ts` com isolamento de testes e ambiente headless.
- Configurado `eslint.config.js` em modo catraca: 0 erros bloqueantes, 214 advertências de baseline registradas para o código legado.
- Criado validador puro de mapas em `src/config/mapValidation.ts` (`validateMap`) com suporte a mapas regulares (Cap. 1 e 2) e arenas dimensionais fechadas (Cap. 202), alertando sobre props sobrepostos.
- Criada suíte de 21 testes unitários de lógica pura em `src/__tests__/`:
  - `scaling.test.ts`: progressão de HP, Dano e Velocidade de monstros aos 0, 5 e 10 minutos, trava de velocidade em 1.30x e diferenciação Story vs Endless.
  - `metaProgress.test.ts`: custos, progressão, limite de níveis, reembolso estrito de 70% das almas, cálculo de modificadores e registro de mortes por chefe. Inclui teste com `it.fails` demonstrando o bug conhecido de `recordRun` salvando tempo endless no modo história (alvo do Pacote 2).
  - `mapValidation.test.ts`: validação dos mapas padrão (Cap. 1, Cap. 2, Dimensão 202) e casos de erro. Inclui teste com `it.fails` registrando a falta de verificação de `version` no carregamento de mapas salvos (alvo do Pacote 2).
- Demonstração de mutação comprovada: alteração temporária do reembolso de 70% para 80% em `MetaProgressManager.ts` causou falha imediata nos testes, demonstrando a eficácia da rede de proteção antes da reversão limpa.

---

## [Pacote 0.6 — Correções Finas de Documentação & Alinhamento Estrito] — 2026-10-17 (`05787bc`)
### Corrigido
- Documentada a estrutura real de **4 Fases de Combate** de Azazel com citação de linhas verificadas em `AzazelBoss.ts` (L412, L898, L1187, L1240, L1300, L1311) e `GameScene.ts` (L3041–3113).
- Recontagem exata de spawners e altares nos mapas em `mapData.ts`: Cap. 1 (4 spawners, 0 altar-1), Cap. 2 (17 spawners, 2 altar-1 decorativos), Dimensão 202 (2 spawners, 0 altar-1).
- Checklist oficial do validador atualizado para diferenciar mapas de capítulo regular (Cap. 1 e Cap. 2) de arenas fechadas de boss (Cap. 202).
- Comentado campo morto `azazelCrystals` em `src/config/mapData.ts` como `@deprecated` (única linha em `src/` tocada).
- ADRs em `LIVRO_DE_ANOTACOES.md` atualizados para manter como decisão apenas fatos comprovados no código (reembolso de 70%) e marcar itens não confirmados como `(proposta — aguardando confirmação do dono)`.
- `docs/DEVELOPMENT_RULES.md` transformado em redirecionamento curto para `AGENTS.md`.

### Atualizado
- `AGENTS.md`: flexibilizado para "um commit por tarefa", autorizadas as `devDependencies` estritamente necessárias para o Pacote 1 (`vitest`, `eslint`, `typescript-eslint`, `@eslint/js`, `globals`) e adicionada a regra obrigatória de nunca corrigir bugs fora de escopo silenciosamente (sempre reportar no relatório).

---

## [Pacote 0.5 — Refinamento de Documentação & Alinhamento com Código Real] — 2026-10-17 (`5da23d1`)
### Corrigido
- Corrigida referência de propriedade de mapas em `docs/MECHANICS.md`: `itemSpawners` (e não `itemSpawns`).
- Corrigidos nomes reais de métodos de áudio de diálogo no `SoundManager`: `playDialogueVoice(speaker)` e `playDialogueTypewriter(char)`.
- Documentado o comportamento real dos Cristais de Azazel (geração dinâmica em 3 pontos aleatórios ao redor da heroína na Fase 3).
- Esclarecida a mecânica de geração de altares (`EvolutionAltar` surge por timer procedural na `GameScene`).
- Removidos números mágicos de balanceamento hardcoded em `docs/MECHANICS.md` e `docs/ARCHITECTURE.md`.

---

## [Pacote 0 — Baseline & Documentação Arquitetural] — 2026-10-17 (`ad5a804`)
### Adicionado
- Criada tag de segurança `baseline-pre-refactor` e branch dedicada `refactor/blindagem`.
- Criado [`docs/ARCHITECTURE.md`](ARCHITECTURE.md) com o mapa real de cenas, entidades, sistemas e fluxo de chamadas.
- Criado [`docs/MECHANICS.md`](MECHANICS.md) com os contratos técnicos reais de Armas, Inimigos, Chefes, Altares, Mapas e Cenas de Visual Novel.
- Criado [`docs/CHANGELOG.md`](CHANGELOG.md) para rastreamento histórico entre sessões.

---

## [v0.8.1 — Correções de Revival/Cristais, Editor de Mapas em Abas & Polish do Azazel] — 2026-10-17 (`0686080`)
### Corrigido
- Corrigido congelamento físico ao clicar em *"Ressurgir das Cinzas"* no Capítulo 2 garantindo `this.physics.resume()` e `resetKeys()` na inicialização da `GameScene`.
- Corrigido erro `Cannot read properties of undefined (reading 'cameras')` ao capturar o 3º Cristal de Azazel validando a câmera antes da emissão de `'crystal-completed'`.

### Melhorado
- Reformulado `MapEditorSystem.ts` com 4 abas temáticas, limite de 1 Altar de Chefe contextual ao capítulo e seletor de piso ao vivo (`floor-tile` / `floor-tile-2`).
- Ajustado zoom da câmera na luta contra Azazel (`2.0x` → `1.35x` após o diálogo inicial) e aumentado o volume das faixas de combate.
- Removido fundo retangular das frases centrais de chefe (`UIScene.showCenterBossPhrase`).

---

## [v0.8.0 — Capítulo 2 & Boss Fight Azazel em 4 Fases de Combate] — 2026-10-17 (`ba86b0a`)
### Adicionado
- Implementado o **Capítulo 2** e o chefe **Azazel, O Anjo Caído** (`AzazelBoss.ts`) com sincronia musical em 3 partes (`intro.mp3` → `mid.mp3` → `fight.mp3`).
- Implementado o **Domínio da Escuridão** (Fase 2 do Azazel aos 50% HP) com 5 investidas telegrafadas no escuro e 8 clones espectrais (`AzazelPhantomClone`) compartilhando vida.
- Implementado o **Banimento Dimensional** (Fase 3 do Azazel aos 20% HP) para o mapa `202` (`floor-tile-2`) com captura de 3 `AzazelCrystal` gerados dinamicamente.
- Adicionada cena narrativa pós-chefe para o Capítulo 2 em `Chapter1EndScene.ts`.

---

## [v0.7.5 — Editor de Mapas In-Game & Galeria Showroom] — 2026-10-17 (`ba0ba77`, `2b5a316`, `115c61e`)
### Adicionado
- Criado `TestShowroomSystem.ts`: Galeria Showroom isolada em `(0, -20000)` exibindo todos os sprites do jogo organizados por categoria.
- Criado `MapEditorSystem.ts` e `mapData.ts`: Editor de fases in-game com câmera livre, exportação/importação JSON e persistência em `localStorage`.

---

## [v0.6.0 a v0.7.0 — Meta-Progressão, Cartas Arcanas, Múmia, Bot IA & Mobile/Gamepad] — 2026-10-16 (`1f5a819`, `6100035`, `68dadaa`, `bb970f2`)
### Adicionado
- Implementado `MetaProgressManager.ts` com Almas Corrompidas, Altar de Bênçãos Permanentes (6 bênçãos), reembolso de 70% e estatísticas.
- Implementadas as 6 armas completas e suas 6 Evoluções Supremas via `EvolutionAltar.ts`, além do `BossSummonAltar.ts`.
- Adicionado `MummyEnemy.ts`, `AutoPlayTestAgent.ts` (`[F3]`), `DevSandboxPanel.ts` (`[F1]`), `DebugSessionLogger.ts`, `TouchControls.ts` e `GamepadManager.ts`.
