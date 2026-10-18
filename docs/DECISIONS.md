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

---

### DEC-006: Contrato de Ciclo de Vida e Anti-Deadlock de Cenas (Lifecycle Invariants)
- **Status:** Aceita (dono aprovou)
- **Data:** 2026-10-18
- **Contexto:** Investigação de bugs de reinicialização (`GameScene` crashando por leitura de `.children.entries` em grupos destruídos ao reentrar no Sandbox ou tentar novamente após a morte; e `IntroScene` travando cliques e avanços de diálogo ao iniciar o Modo História pela segunda vez ou pular no ESC).
- **Decisão:** Adotar três invariantes obrigatórias de ciclo de vida para todas as cenas Phaser:
  1. **Reinicialização Rigorosa (`init`):** Toda cena com propriedades de controle (`isEnding`, `isTyping`, `isPaused`, arrays de entidades) deve implementar `init()` para redefini-las ao valor padrão, pois o Phaser reutiliza a mesma instância da classe em `scene.start()`.
  2. **Ordem de Instanciação de Grupos:** Grupos de entidades (`enemiesGroup`, `gemsGroup`, `soulsGroup`, `mapItemsGroup`) devem ser instanciados no início de `create()`, antes de qualquer chamada a métodos de layout (`loadCustomMapLayout`), acompanhados de checagens defensivas (`this.group && this.group.children`).
  3. **Desligamento e Limpeza (`SHUTDOWN`):** Cenas que registram ouvintes em barramentos globais ou instâncias persistentes (`this.events.on`, `input.keyboard.on`, timers contínuos) devem registrar um ouvinte `SHUTDOWN` para desregistrar/limpar esses elementos, impedindo vazamento de listeners e duplicidade de handlers.
- **Motivo:** Eliminar crashes de reinicialização e deadlocks de cena, aprovado formalmente pelo dono no Pacote P1.4.
- **Rever quando:** Se a engine for atualizada ou se um sistema de cenas modular dedicado for introduzido.

---

### DEC-007: Protocolo de Integridade de Cache e Infraestrutura Web
- **Status:** Aceita (dono aprovou)
- **Data:** 2026-10-18
- **Contexto:** Publicações no GitHub Pages apresentavam risco de versões antigas ou "misturadas" após novos deploys (HTML novo com JS ou sprites em cache legado, ou jogadores travados no cache HTTP de 10 minutos do Pages ou no cache `hell-survivor-cache-v1` estático com estratégia *Stale-While-Revalidate* e `skipWaiting` automático que causava descompasso de assets).
- **Decisão:** Adotar protocolo atômico e determinístico de cache e atualização web em produção:
  1. **Build ID Atômico:** Plugin Vite inline sem dependências externas injeta `<sha curto> • <dd/mm hh:mm>` em `dist/sw.js` (`CACHE_NAME = 'hell-survivor-' + BUILD_ID`) e no rodapé `#build-version` de `dist/index.html`.
  2. **Estratégias de Cache Segregadas por Tipo de Asset no Service Worker:**
     - `index.html` e requisições de navegação: *Network-First* com fallback offline no cache.
     - Arquivos com hash de compilação em `/assets/` (JS e CSS): *Cache-First* imutável.
     - Arquivos estáticos sem hash (sprites, áudio, imagens, fontes, manifest): Rede com `cache: 'no-cache'` para revalidação de cabeçalhos e fallback offline no cache.
     - Ignorar requisições não-GET e origens externas.
  3. **Migração Transparente e Ativação sob Demanda:**
     - Durante a instalação do novo SW, se for detectado o cache legado `'hell-survivor-cache-v1'`, ativa-se imediatamente (`skipWaiting`) para expurgar a versão v1 no `activate`.
     - Para versões subsequentes, o novo worker permanece em espera (`waiting`) sem derrubar a partida em andamento.
     - Registro com `{ updateViaCache: 'none' }` para ignorar o cache HTTP de 10 minutos do script `sw.js`.
     - Verificação em `visibilitychange` (ao focar a aba) e a cada 30 minutos em background.
  4. **Banner Seguro em Momento Oportuno:**
     - Exibição de aviso visual conforme `docs/DESIGN_SYSTEM.md` (paleta carmesim, sem emojis).
     - Verificação de combate ativo: se o jogador estiver em `GameScene` despausada e viva, o aviso aguarda pausa, tela de derrota ou retorno ao menu.
     - Ação de recarregar restrita ao clique do jogador em `[ RECARREGAR ]` via mensagem `SKIP_WAITING`, com trava contra loops de recarregamento no evento `controllerchange`.
  5. **Mecanismos de Defesa (Kill-Switch e Verificação de Build):**
     - Criação do script de emergência `scripts/sw-killswitch.js` que desregistra o worker e deleta todos os caches se um deploy corrompido for lançado.
     - Criação do verificador pós-build `scripts/verify-build.mjs` acoplado ao workflow de CI (`deploy.yml`) com qualidade pré-build (`npm run check`) e `fetch-depth: 0`.
- **Motivo:** Aprovado formalmente pelo dono no Pacote P1.5 para garantir atualizações web seguras e sem mistura de assets.
- **Rever quando:** O dono do projeto homologar o comportamento de deploy em produção ou caso o jogo seja migrado para domínio próprio com controle granular de cabeçalhos HTTP via CDN (ex: Cloudflare / Netlify / Vercel).

---

### DEC-008: Resumo Simples para o Dono no Início dos Relatórios (Plain Language Summary)
- **Status:** Aceita (dono aprovou)
- **Data:** 2026-10-18
- **Contexto:** O dono do projeto não é programador profissional e precisa de visibilidade clara e rápida sobre o impacto das entregas sem navegar por jargões técnicos de infraestrutura.
- **Decisão:** Todo relatório de entrega gerado pela IA deve obrigatoriamente iniciar com a seção "O Que Isso Significa Para Você", contendo até 5 linhas em linguagem simples, direta e sem termos técnicos complexos, explicando o que mudou na experiência do jogador ou do dono.
- **Motivo:** Aprovado formalmente pelo dono no Pacote P1.4 para garantir transparência executiva e facilidade de teste.
- **Rever quando:** Nunca (regra permanente de comunicação).

---

### DEC-009: Diretrizes do Ciclo de Chefes do Infinito e Ordem de Roadmap
- **Status:** Proposta — decisão do dono, detalhes a definir
- **Data:** 2026-10-18
- **Contexto:** Planejamento do ciclo recorrente de chefes para o Modo Infinito (com a entrada de Azazel e chefes futuros) e sequenciamento técnico dos próximos pacotes de refatoração e expansão.
- **Decisão:** Adotar quatro diretrizes orientadoras definidas pelo dono para o desenvolvimento futuro:
  1. **Recompensa por Chefe no Infinito:** A recompensa pela vitória contra chefes no Modo Infinito será "bastante XP" (valor numérico exato a definir posteriormente em etapa de balanceamento, sem números fixados agora).
  2. **Início do Confronto por Proximidade:** O chefe já nascerá parado em seu ponto designado esperando o jogador; a batalha só tem início quando o jogador se aproximar fisicamente do local (mesmo comportamento e fluxo de ativação do altar atual).
  3. **Inclusão do Azazel no Ciclo do Infinito:** O chefe Azazel fará parte do ciclo do Infinito, mediante adaptações arquiteturais prévias a serem detalhadas em ficha de viabilidade (especificamente: restaurar o mapa e o piso originais após a Dimensão Corrompida da Fase 3 e implementar o ramo do Modo Infinito em `handleAzazelDefeated` para a run não encerrar como Modo História).
  4. **Ordem de Precedência Técnica de Pacotes:**
     `Pacote 2B (Centralização Tipográfica e Cores)` ➔ `Pacote 3 (Modularizar GameScene)` ➔ `Pacote UI (Dividir a UIScene)` ➔ `Sistema de Encontros de Chefe` ➔ `Ciclo de Chefes do Infinito` ➔ `Múltiplos Personagens Jogáveis`.
- **Motivo:** Decisão explícita do dono do projeto quanto à progressão do jogo e à mitigação de riscos técnicos antes de introduzir novos chefes e heróis.
- **Rever quando:** Ao iniciar a implementação do sistema de encontros de chefe e elaboração da ficha técnica de adaptação do Azazel.

