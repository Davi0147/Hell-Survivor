# Hell Survivor — Pacote de Análise Técnica & Revisão de Código

Este pacote foi preparado para **revisão técnica, auditoria arquitetural e análise profunda** do jogo **Hell Survivor**.

---

## 🎮 Visão Geral do Projeto
- **Gênero**: Roguelike Survivor / Bullet Hell com estética gótica e pixel art barroco.
- **Engine**: Phaser 3 (v3.88.2) com renderização Canvas/WebGL pixel-perfect.
- **Linguagem**: TypeScript (^5.7.3) em modo estrito.
- **Build & Dev**: Vite (v6.4.4), Vitest (v5.0.5), ESLint (v10.13.0) com catraca de qualidade ativa.
- **Plataformas**: Web Desktop, Mobile (Touch Controls com botões pixel art), Gamepad e PWA offline instalável.

---

## 🛠️ Como Instalar, Testar e Executar

```bash
# 1. Instalar dependências
npm install

# 2. Rodar a catraca completa de qualidade (TypeScript + ESLint + Vitest)
npm run check

# 3. Rodar somente os testes unitários
npm run test

# 4. Rodar o build de produção com verificação atômica de cache PWA
npm run build
```

> **Status Atual de Qualidade**:
> - TypeScript: **0 erros** (`tsc --noEmit`).
> - ESLint: **164 avisos** (limite rígido na catraca de `--max-warnings 164`; qualquer aviso novo quebra o commit/build com erro 1).
> - Catraca de Cores: **Travada em 1194 ocorrências** fora do tema via `scripts/verify-theme.mjs` e `scripts/theme-baseline.json`.
> - Testes: **91 testes unitários passando** em 11 arquivos de teste cobrindo escalonamento, persistência, capítulos, efeitos de status, validação de mapas, desfecho de derrota de chefes, trancamento do sandbox em domínios públicos, tokens/fórmulas de tema e telegrafia, estados e volumes de música pura (`musicConfig`) e máquina atômica do `MusicDirector`.
> - Guarda Automático: **Ativo via `.githooks/pre-commit`**, executando automaticamente o ciclo de qualidade completo antes de cada commit.
> - Build: **100% verificado** com sincronia atômica entre `dist/sw.js` e `dist/index.html` via `scripts/verify-build.mjs`.

### Atalhos de 1 Clique (.bat para Windows):
- **`INSTALAR_GUARDA.bat`**: Configura o Git (`core.hooksPath = .githooks`) para rodar `npm run check` automaticamente a cada commit, impedindo qualquer regressão no projeto.
- **`JOGAR.bat`**: Endereço de teste do jogo normal (porta 3000). Libera a porta 3000 de instâncias residuais, limpa caches do Vite (`.vite` e `dist`), inicia o servidor dev com `--force` e abre o navegador padrão automaticamente quando a porta responde (`http://localhost:3000/`).
- **`TESTAR_VERSAO_1.bat`**: Ensaio de produção local (porta 8080). Compila a versão de produção, sobe servidor de preview local na porta 8080 e abre o jogo.
- **`TESTAR_ATUALIZACAO.bat`**: Recompila com novo identificador de versão (`BUILD_ID`) mantendo o servidor aberto para testar o banner de atualização PWA.

---

## 📂 Estrutura do Projeto & Onde Encontrar Cada Coisa

### 1. Governança, Regras e Especificações (`docs/` e Raiz)
- **`AGENTS.md`**: As 18 regras invioláveis de engenharia do projeto (isolamento de branches, não quebrar builds, catraca de warnings, zero-any em novas adições, invariantes de ciclo de vida DEC-006, resumo simples DEC-008, integridade de cache web DEC-007, etc.).
- **`LIVRO_DE_ANOTACOES.md`**: Status operacional completo do jogo: arsenal (6 armas + 6 evoluções), meta-progressão permanente (almas e bênçãos), chefes (Rosalin e Azazel em 4 fases), controles mobile e backlog pendente.
- **`docs/ARCHITECTURE.md`**: Mapa arquitetural de cenas Phaser, barramento de eventos, máquinas de estado e hierarquia de entidades.
- **`docs/MECHANICS.md`**: Especificação matemática das mecânicas, fórmulas de balanceamento, status effects, chefes e Seção 11 com o Contrato de Ciclo de Vida de Cenas.
- **`docs/DECISIONS.md`**: Registros formais de Decisões de Arquitetura (ADRs: DEC-001 a DEC-009).
- **`docs/CHANGELOG.md`**: Histórico detalhado de versões e pacotes entregues (P1.1 a P1.6 / Release v0.9.0).
- **`docs/GUIA_DO_DONO.md`**: Manual sem jargões para o dono do projeto interagir com a IA e testar atualizações.
- **`docs/RELEASE_CHECKLIST.md`**: Auditoria completa de prontidão para publicação online no GitHub Pages.
- **`reports/`**: Registros e relatórios brutos de validações de build, lint e testes.

### 2. Código-Fonte (`src/`)
- **`src/config/`**: Configurações imutáveis e tema:
  - `theme.ts`: Ponto único de verdade para papéis tipográficos (`FONTS`), paleta semântica (`COLORS`) e telegrafia de chefes (`BOSS_TELEGRAPH`).
  - `musicConfig.ts`: Tabela pura da máquina de estados musicais (9 estados, loops, volumes calibrados e fades).
  - `balance.ts`: Constantes numéricas de gameplay, curvas de sobrevivência e `isDevSandboxEnabled()` (com trava de segurança para domínios públicos).
  - `storageKeys.ts`: Chaves tipadas de `localStorage`.
  - `mapData.ts` & `mapValidation.ts`: Layouts de fases (Cap. 1, 2 e 202) e validador geométrico.
- **`src/entities/`**:
  - `characters/`: Heroína Nixy com movimentação 8-way, estamina, Full Sprint e rastro fantasma reciclado via Object Pool.
  - `enemies/`: ZombieDog, BloodBat, SkullSlime, MummyEnemy (com poças de veneno), SuccubusBoss (Rosalin) e AzazelBoss (4 fases: Domínio da Escuridão, Clones Espectrais, Banimento Dimensional e Showdown).
  - `weapons/` & `evolution/`: 6 armas básicas e 6 evoluções supremas com invocação via altares.
  - `items/`: Gemas de XP com fusão por proximidade, Almas Corrompidas, Taças, Baús.
- **`src/scenes/`**: Máquina de estados Phaser:
  - `BootScene.ts`: Pré-carregamento com cache busters e registro de texturas.
  - `MenuScene.ts`: Menu principal com Altar de Bênçãos e bloqueio de Sandbox em produção.
  - `GameScene.ts`: Loop principal de combate, geração procedural, câmera e chefes.
  - `UIScene.ts`: HUD de combate, radar circular tático, avisos centrais e painel F1.
  - `UpgradeScene.ts`: Sistema de Cartas Arcanas com tipografia Pixelzone, palavras-chave semânticas e animações de cassino.
  - `IntroScene.ts` & `Chapter1EndScene.ts`: Cenas de Visual Novel com corte de lâmina.
- **`src/systems/`**:
  - `MetaProgressManager.ts`: Economia de Almas, Bênçãos permanentes, reembolso de 70% e estatísticas.
  - `MusicDirector.ts`: Diretor musical autônomo com transições atômicas, timers independentes de cena e controle total do Azazel.
  - `SoundManager.ts`: Fachada de áudio repassando requisições musicais ao `MusicDirector` e gerindo síntese procedural de SFX e vozes.
  - `DevSandboxPanel.ts`: Painel de testes in-game (`[F1]`) com 5 abas (Cheats, Hordas, Armas, Bênçãos, Logs).
  - `AutoPlayTestAgent.ts`: Bot autônomo de testes (`[F3]`) com kiting e desvio de projéteis.
  - `MapEditorSystem.ts`: Editor in-game com 4 abas e exportação/importação JSON.
- **`src/ui/TouchControls.ts`**: Controles mobile virtuais com novos botões e analógico em pixel art dedicados.
- **`src/__tests__/`**: 91 testes unitários automatizados em Vitest.

### 3. Scripts e Infraestrutura (`scripts/` & `public/`)
- **`public/sw.js`**: Service Worker PWA com injeção de `BUILD_ID`, segregação de estratégias de cache (stale-while-revalidate, cache-first para assets com hash e rede com fallback para sprites/áudio) e recarga controlada fora de combate.
- **`scripts/jogar-dev.mjs`**: Runner de inicialização em Node puro.
- **`scripts/sw-killswitch.js`**: Script de emergência para desativação e expurgo de caches em navegadores de clientes.
- **`scripts/verify-bat.mjs`**: Validador estrito de conformidade para arquivos `.bat` (ASCII puro, CRLF, sem BOM).
- **`scripts/verify-build.mjs`**: Verificador pós-build garantindo integridade atômica do `BUILD_ID`.
