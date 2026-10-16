# Livro de Anotações de Desenvolvimento — Hell Survivor

> **REGRA DE OURO OBRIGATÓRIA — SINCRONIZAÇÃO COM O MODO DE TESTE (SANDBOX-FIRST RULE):**
> Tudo o que for adicionado ou alterado no jogo daqui para frente (novas armas, evoluções, bênçãos passivas, inimigos, mini-bosses, chefes, itens de mapa, biomas ou mecânicas) **DEVE OBRIGATORIAMENTE** ser integrado no mesmo instante ao **Modo de Teste (`src/systems/DevSandboxPanel.ts`)** e ao **Gravador de Sessão (`src/systems/DebugSessionLogger.ts`)**, garantindo que qualquer novidade possa ser testada em 1 clique e auditada nos relatórios exportados para a IA.

---

## Etapa 0: Fundação, Combate Base e Capítulo 1 (Concluído & Aprovado)
- [x] Movimentação em 8 direções da Nixy com animações de corrida, sprint e controle de estamina.
- [x] Sistema de câmera pixel-perfect com zoom 2x e chão infinito sincronizado no `POST_UPDATE`.
- [x] Cutscene de Introdução (6 cenas ilustradas, música ambiente, diálogos com censura dourada `[CENSURADO]`).
- [x] Inimigos do Capítulo 1: Cão Zumbi, Cão Alfa Elite, Morcego de Sangue e Skull Slime.
- [x] Chefe do Capítulo 1: **Succubus Imperial** (9.000 HP História / 12.000 HP Infinito, teletransporte, orbes negros, lacaios e diálogos em combate).
- [x] Armas iniciais: Disparo de Almas (`SoulBoltWeapon`), Lâminas Orbitais (`VoidScythesWeapon` com sprite de foice girando no próprio eixo) e Chamas do Purgatório (`HellfireAuraWeapon`).
- [x] Habilidade Suprema (Ultimate): *Julgamento do Caos* (recarga 3x mais cadenciada e equilibrada).
- [x] Itens de Mapa com levitação e ícone verde no minimapa: Taça de Vinho (50% HP), Ímã de Almas (atrai todo o XP) e Baú do Abismo.
- [x] Roleta Minimalista do Baú: nomes subindo verticalmente, efeitos sonoros procedurais de giro e prêmio, congelamento total de spawns durante o baú e período de graça/imunidade ao fechar.
- [x] Atributos passivos de Regeneração Sombria (+0.2 a +0.8 HP/s) e Dreno Vital (+0.1 a +0.3 HP/hit).

---

## Ferramenta Oficial: Modo de Teste (Sandbox) & Gravador de Sessão p/ IA *(Concluído — Pronto para Uso)*
- [x] **Acesso no Menu Principal (`MODO DE TESTE`) + Chave de Lançamento Oficial:** Controlado por `ENABLE_DEV_SANDBOX` em `src/config/balance.ts`. Ao mudar para `false` no lançamento oficial, fica 100% oculto para os jogadores (mantendo backdoor secreto `?debug=1` para o desenvolvedor).
- [x] **Barra Rápida no Topo & Atalho `[F1]`:** Exibe FPS ao vivo, contagem de inimigos, status do God Mode e botão de 1 clique `[COPIAR LOG IA]`.
- [x] **Aba 1 (`[1] CHEATS & NIXY`):** Vida Infinita (God Mode), Ultimate Infinita, Estamina Infinita, Auto-Spawn de Hordas ON/OFF, Hitboxes Físicas ON/OFF, Velocidade do Jogo (`0.5x`, `1x`, `2x`), Level Up instantâneo, Cura e disparo imediato da Suprema.
- [x] **Aba 2 (`[2] HORDAS & BOSS`):** Spawn individual ou em horda de todos os monstros e Mini-Bosses, remoção limpa de hordas (com ou sem drop de XP) e invocação/remoção da **Succubus Imperial** com transição musical limpa (`bgm-boss` ↔ `bgm-battle`) sem conflitos de áudio.
- [x] **Aba 3 (`[3] ARMAS & EVOLUÇÕES`):** Equipar, subir nível (`+1 Nív`), Maximizar/Evoluir para a forma Suprema (`MAX / EVO`) ou remover qualquer uma das 6 armas do jogo, além de botão para equipar e evoluir todas de uma vez.
- [x] **Aba 4 (`[4] BÊNÇÃOS & ITENS`):** Adicionar (`+`) ou remover (`-`) níveis de todas as 9 bênçãos passivas livremente, resetar atributos e dropar Taça de Vinho, Ímã, Baú do Abismo, Roleta Direta ou Chuva de 20 Gemas ao lado da Nixy.
- [x] **Aba 5 (`[5] LOGS & EXPORTAR IA`):** Gravador de Voo (`DebugSessionLogger`) que intercepta erros globais, monitora quedas de FPS/anomalias e gera um relatório completo formatado em 1 clique (`[ COPIAR RELATÓRIO COMPLETO P/ IA ]` ou `[ BAIXAR LOG (.JSON) ]`).

---

## Fase 1: Expansão do Arsenal e Evoluções de Armas *(Implementado — Pronto para Testar no Sandbox)*
*Foco: Rejogabilidade, variedade de builds e progressão de poder dentro da partida.*

### 1.1. Novas Armas Ativas no Catálogo de Level Up
- [x] **Adagas de Sangue (`BloodDaggersWeapon`):** Dispara leques velozes de adagas carmesins na direção em que a Nixy está olhando (ou mirando no inimigo frontal mais próximo). Evolui do Nível 1 ao 5 aumentando a quantidade de adagas no leque, velocidade e dano.
- [x] **Cadeias Abissais (`AbyssalChainsWeapon`):** Correntes espectrais que chicoteiam grupos de inimigos próximos, causando dano em área e aplicando **Grilhão Abissal (Atordoamento/Lentidão temporária)**. Evolui do Nível 1 ao 5 aumentando o alcance, número de alvos e duração do controle de grupo.
- [x] **Meteoro Infernal (`InfernalMeteorWeapon`):** Invoca rochas vulcânicas do céu que caem sobre áreas de alta concentração de monstros com indicador visual de impacto, causando dano massivo de explosão. Evolui do Nível 1 ao 5 reduzindo a recarga e aumentando o número de meteoros por salva.

### 1.2. Sistema de Evolução Suprema de Armas (Weapon Fusion)
- [x] **Raio do Apocalipse *(Evolução do Disparo de Almas)*:** Desbloqueado ao ter *Alma Extra* (ou *Perfuração Mística*) + *Fúria Infernal*. Transforma os disparos em projéteis astrais colossais dourados/cianos de altíssima cadência e perfuração devastadora.
- [x] **Ceifadora do Vazio *(Evolução das Lâminas Orbitais)*:** Desbloqueada ao atingir o nível máximo de 6 Foices + *Celeridade Abissal*. Transforma as foices em um vórtice carmesim hiper-veloz com raio expandido e dano crítico amplificado.
- [x] **Supernova Abissal *(Evolução das Chamas do Purgatório)*:** Desbloqueada ao atingir o Nível 5 das Chamas + *Vitalidade Sangrenta*. Emite ondas duplas de fogo azul/dourado que queimam uma área colossal e restauram vida da Nixy a cada pulso.

### 1.3. Mecânicas Táticas de Level Up (Reroll & Skip)
- [x] **Botão de Re-rolar Bênçãos (`Reroll`):** Permite sortear 3 novas opções de cartas na tela de Level Up (2 cargas por partida).
- [x] **Botão de Pular / Canalizar Energia (`Skip`):** Permite recusar as 3 cartas em troca de uma cura imediata de emergência (+20 HP), garantindo que o jogador nunca seja forçado a pegar algo que não deseja.

---

## Fase 2: Meta-Progressão Permanente & Economia *(Pendente)*
*Foco: Sensação de evolução contínua entre partidas.*
- [ ] **Moeda Persistente (Almas Corrompidas / Ouro Abissal):** Dropada por elites, chefes e baús, salva automaticamente no `localStorage`.
- [ ] **Altar de Bênçãos Permanentes (Loja no Menu Principal):** Compra de atributos permanentes para a Nixy (*Vida Base*, *Dano Global*, *Velocidade*, *Raio de Coleta*, *Cargas Extras de Reroll*, *Ressurreição Extra*).
- [ ] **Grimório de Estatísticas e Recordes:** Painel com melhor tempo no Modo Infinito, total de demônios purificados e armas evoluídas descobertas.

---

## Fase 3: Novos Inimigos e Dinâmica de Enxame *(Pendente)*
*Foco: Desafio tático e variedade de ameaças.*
- [ ] **Inimigo Artilheiro — Cultista Arcano:** Dispara projéteis mágicos à distância, exigindo movimentação lateral e uso estratégico do Sprint.
- [ ] **Inimigo Tanque — Brutamonte das Profundezas:** Demônio pesado com alta vida e resistência a empurrão (knockback) que protege a linha de frente da horda.
- [ ] **Eventos Dinâmicos de Horda:** Cerco circular de inimigos e ondas de emboscada rápida em minutos específicos.

---

## Fase 4: Capítulo 2 e Progressão da Campanha *(Pendente)*
*Foco: Expansão da história e novos ambientes.*
- [ ] **Novo Bioma (Capítulo 2 — Cripta de Sangue / Rio Estígio):** Novo piso, atmosfera visual e perigos ambientais no mapa (poças de magma/ácido).
- [ ] **Novo Chefe do Capítulo 2:** Mecânicas inéditas de combate, novas fases de ataque e diálogos ácidos com `[CENSURADO]` em dourado.
- [ ] **Cutscenes de Transição para o Capítulo 2:** Continuação direta da fuga da Nixy.

---

## Fase 5: Polimento de Controles (Mobile & Gamepad) & Conquistas *(Pendente)*
*Foco: Acessibilidade multiplataforma e sensação Arcade.*
- [ ] **Controles de Tela para Mobile (Touch Controls):**
  - Joystick Virtual flutuante/fixo no lado esquerdo da tela para movimentação fluida em 360 graus.
  - Botões dedicados na direita da tela para **Sprint (Correr)** e **Ultimate (E)** com feedback visual de recarga e toque responsivo.
  - Adaptação ergonômica de todos os menus e modais para toque direto.
- [ ] **Suporte Completo a Gamepad / Controles:** Movimentação no analógico, sprint nos gatilhos, uso da Ultimate e navegação nos menus.
- [ ] **Sistema de Conquistas In-Game (Achievements):** Notificações estilo arcade no canto da tela ao cumprir desafios especiais.
