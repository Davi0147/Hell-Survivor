# Regras Críticas do Projeto — Hell Survivor (`AGENTS.md`)

## 1. REGRA DE OURO OBRIGATÓRIA: Sincronização com o Modo de Teste & Gravador de Sessão (`Sandbox-First Rule`)

**Qualquer funcionalidade, entidade ou mecânica adicionada ou alterada no jogo DEVE OBRIGATORIAMENTE ser atualizada simultaneamente no Modo de Teste (`src/systems/DevSandboxPanel.ts`) e no Gravador de Sessão (`src/systems/DebugSessionLogger.ts`).**

Sempre que criar ou modificar:
1. **Nova Arma ou Evolução Suprema:**
   - Adicione um card correspondente na aba **`[3] ARMAS & EVOLUÇÕES`** do `DevSandboxPanel.ts` com botões para `[ EQUIPAR ]`, `[ +1 NÍV ]`, `[ MAX / EVO ]` e `[ REMOVER ]`, além de incluí-la no botão global `[ EQUIPAR E EVOLUIR TODAS AS 6 ARMAS ]`.
   - Registre o evento no `DebugSessionLogger.getInstance().log('WEAPON', ...)`.
2. **Novo Inimigo, Mini-Boss ou Chefe (Boss):**
   - Adicione um botão de invocação na aba **`[2] HORDAS & BOSS`** do `DevSandboxPanel.ts` e no método `sandboxSpawnHorde()` / `sandboxSpawnBoss()` em `GameScene.ts`.
   - Garanta que ao remover ou derrotar o Chefe no Modo de Teste, a música de batalha (`SoundManager.getInstance().playBattleMusic(1500)`) seja restaurada sem encerrar a sessão Sandbox e sem conflito de faixas de áudio.
3. **Nova Bênção Passiva, Atributo ou Moeda/Economia:**
   - Adicione controles `[ - ]` e `[ + ]` na aba **`[4] BÊNÇÃOS & ITENS`** do `DevSandboxPanel.ts` e inclua o atributo no botão de Reset e no snapshot de estado do `DebugSessionLogger.ts` (`captureSnapshot`).
4. **Novo Item de Mapa, Evento ou Bioma:**
   - Adicione um botão de spawn/acionamento imediato próximo à Nixy no `DevSandboxPanel.ts` para que o usuário possa testar a mecânica em 1 clique sem depender de RNG ou espera de tempo.
5. **Chave de Produção (`ENABLE_DEV_SANDBOX`):**
   - Mantenha o controle de visibilidade do Modo de Teste centralizado em `ENABLE_DEV_SANDBOX` (`src/config/balance.ts`), permitindo ocultar o modo para jogadores finais no lançamento oficial apenas mudando `ENABLE_DEV_SANDBOX = false`.

---

## 2. Preservação de Balanceamento e Regras de Áudio/UI
- **Nunca altere valores de balanceamento já aprovados** (como vida da Succubus, recarga da Ultimate, etc.) a menos que o usuário peça explicitamente.
- **Zero Emojis Unicode em Textos do Phaser:** Utilize apenas tipografia pixel art (`Silkscreen`, `Press Start 2P`) e ícones vetoriais/sprites para evitar glifos quebrados no WebGL/Canvas.
- **Transições de Áudio Limpas:** Ao alternar entre músicas (`bgm-menu`, `bgm-battle`, `bgm-boss`), utilize sempre os métodos do `SoundManager` que interrompem imediatamente qualquer faixa anterior antes de iniciar a nova.

---

## 3. REGRA DE OURO OBRIGATÓRIA: Atualização Contínua da Área de Teste / Galeria de Sprites (`Showroom-First Rule`)

**Todo e qualquer sprite, textura, prop de cenário, item coletável, arma, projétil, inimigo, chefe, moldura de carta ou efeito visual (VFX) adicionado ou alterado no jogo DEVE OBRIGATORIAMENTE ser registrado na Área de Teste / Galeria de Sprites (`src/systems/TestShowroomSystem.ts`).**

Diretrizes da Galeria Showroom:
1. **Organização Lógica por Categorias:** Novos elementos devem ser inseridos em sua respectiva categoria temática (`CENÁRIO & PROPS`, `ITENS & COLETÁVEIS`, `ARMAS & PROJÉTEIS`, `INIMIGOS & CHEFES`, `CARTAS DE BÊNÇÃO`, `ANIMAÇÕES & VFX`, `UI & RETRATOS`) ou em uma nova categoria dedicada se for um sistema inédito.
2. **Escala e Renderização Fiel In-Game:** O sprite deve ser exibido com a mesma proporção, cor/tint e efeitos complementares (ex: tochas acompanhadas do seu halo crepitante de iluminação; animações rodando em loop contínuo).
3. **Manequins Pacíficos:** Inimigos e chefes posicionados na galeria são estritamente manequins estáticos para inspeção visual (sem dano de contato, sem knockback, sem agressão ao jogador).
4. **Espaçamento e Legibilidade:** Manter espaçamento limpo entre os itens com rótulo descritivo sob cada sprite para fácil conferência visual de fidelidade estética.

