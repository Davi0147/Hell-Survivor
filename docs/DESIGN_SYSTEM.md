# Design System & Padrões Visuais — Hell Survivor (`docs/DESIGN_SYSTEM.md`)

Este documento consolida os **padrões visuais, de interface e de experiência do usuário (UX)** do **Hell Survivor**.
Conforme a **Regra 5 e Regra 14 de `AGENTS.md`**, novos elementos visuais devem seguir rigorosamente estes padrões, e nenhum estilo existente pode ser alterado sem solicitação e aprovação explícita do dono do projeto.

---

## 1. Modelo de Entrada de Padrão

Toda especificação de componente no Design System segue este esquema:
- **Nome do Padrão:** Identificador claro do componente ou comportamento
- **Onde se aplica:** Cenas, entidades ou sistemas que utilizam este elemento
- **Especificação:** Descrição conceitual em palavras (valores numéricos e cores devem apontar para constantes no código em `theme.ts` ou indicar o local atual `arquivo:símbolo`)
- **Implementação de referência:** Arquivo e método/propriedade que serve como fonte da verdade
- **Fazer / Não fazer:** Diretrizes práticas de implementação
- **Como verificar:** Critério objetivo para testar se o padrão foi respeitado
- **Status:** `Proposta (extraído do código, aguardando confirmação do dono)` | `Aceita`

---

## 2. Auditoria dos Padrões Reais Extraídos do Código

### 2.1. Cartas Arcanas de Upgrade e Evolução
- **Nome do Padrão:** Carta Arcana Flutuante com Moldura Temática
- **Onde se aplica:** Tela de Level Up e Altar de Ascensão (`UpgradeScene.ts`)
- **Especificação:**
  - Moldura vertical base 120x200px escalada uniformemente em 2.2x (`UpgradeScene.ts:dealCards`), resultando em 264x440px.
  - Vão livre interno com largura de segurança estrita (`SAFE_INNER_WIDTH = 134px` em `UpgradeScene.ts:SAFE_INNER_WIDTH`) para não invadir as colunas decorativas de ossos e correntes das bordas.
  - Janela superior (topo): Rarity label centralizado em destaque (`card.rarityColor`, 26px), Nome da carta ampliado (`card.cardNameColor`, 38px, stroke 4.5px) com auto-scale se exceder o vão livre, e Nível discreto (`#cbd5e1`, 16px).
  - Janela inferior (base): Descrição em caixas ricas (`renderRichDescriptionBox`) com palavras-chave coloridas por categoria (Dano, Arma, Vida).
  - Animação de entrada em cascata elástica (`Back.easeOut`, 300ms, delay escalonado de 90ms por carta) e flutuação contínua suave no eixo Y (`Sine.easeInOut`, yoyo -8px, duração 1300–1900ms).
  - Interação: Hover com escala 1.09x, elevação no eixo Y (-12px) e profundidade de sobreposição; Clique acompanhado de som de caixa registradora arcade (`playCasinoLevelUp`) e explosão de partículas douradas.
- **Implementação de referência:** [`src/scenes/UpgradeScene.ts:createCard`](../src/scenes/UpgradeScene.ts)
- **Fazer:**
  - Sempre respeitar a largura segura `SAFE_INNER_WIDTH` (134px) para evitar que textos vazem sobre as bordas da carta.
  - Usar sempre a fonte temática de cartas (`this.cardFont = "'Pixelzone', 'Silkscreen', monospace"`).
- **Não fazer:**
  - NUNCA colocar fundos semitransparentes retangulares atrás da moldura da carta que escondam o trabalho artístico dos ossos.
- **Como verificar:** Abrir o Sandbox `[F1]` → Aba `[3] ARMAS & EVOLUÇÕES` → Subir nível de arma ou acionar Level Up; verificar se o texto não sobrepõe os ossos laterais da moldura.
- **Status:** Proposta (extraído do código, aguardando confirmação do dono)

---

### 2.2. Caixa de Diálogo Cinematográfica (Estilo Persona / Visual Novel)
- **Nome do Padrão:** Balão de Fala Chanfrado com Bustos Dinâmicos Laterais
- **Onde se aplica:** Diálogos in-game de chefes (`DialogueSystem.ts`), cenas narrativas de abertura (`IntroScene.ts`) e pós-vitória (`Chapter1EndScene.ts`)
- **Especificação:**
  - Escurecimento cinematográfico translúcido cobrindo a tela toda (`0x000000`, alfa 0.70 em `DialogueSystem.ts:createDialogueUI`).
  - Bustos ilustrados em escala 420x420px (`BUST_W`, `BUST_H`) ancorados com `origin(0.5, 1.0)` na base inferior absoluta da tela (`height + 8`), sem linhas de corte visíveis.
  - O balão de fala é dinâmico e desliza no eixo X (`Cubic.easeOut`, 240ms) para o lado oposto ao personagem falante: desloca-se para a direita (`BALLOON_RIGHT_X = 370`) quando Nixy fala na esquerda, e para a esquerda (`BALLOON_LEFT_X = 40`) quando o chefe fala na direita.
  - Geometria do balão: Caixa poligonal angular chanfrada (`drawSlantedBox`) com sombra preta (alfa 0.75), fundo veludo escuro (`0x180309` para Nixy, `0x14011c` para chefe), moldura externa branca grossa (3.5px) estilo mangá e filete interno de acento (`0xc59b27` dourado para Nixy, `0xff0066` magenta para chefe).
  - Plaqueta de nome angular suspensa no topo esquerdo do balão (`drawNameplate`).
  - Tipografia: Texto em 18px com espaçamento de 10px entre linhas e destaque automático dourado em palavras censuradas (`TextHighlight.ts` com `#ffd700`). Efeito de digitação suave (24ms por letra) sincronizado com áudio de máquina de escrever e timbre vocal do falante.
  - Indicador pulsante de avanço: `▶ ESPAÇO / CLIQUE` em 11px dourado no canto inferior direito do balão.
- **Implementação de referência:** [`src/systems/DialogueSystem.ts:createDialogueUI`](../src/systems/DialogueSystem.ts)
- **Fazer:**
  - Chamar `image.setDisplaySize(largura, altura)` ao trocar texturas de bustos para evitar deformação de escala.
  - Só animar o deslizamento do balão e transição de bustos quando o lado do falante realmente mudar (`currentSpeakerSide !== newSide`).
- **Não fazer:**
  - NUNCA posicionar o balão de fala sobre o rosto dos personagens ou deixar o busto flutuando acima do chão.
- **Como verificar:** Iniciar o Capítulo 1 e observar o diálogo da Rosalin, ou acionar o diálogo de Azazel no Capítulo 2.
- **Status:** Proposta (extraído do código, aguardando confirmação do dono)

---

### 2.3. Frases Centrais de Chefe (Anúncios Dramáticos Sem Moldura)
- **Nome do Padrão:** Frase Central de Impacto Incandescente (Frameless Boss Roar)
- **Onde se aplica:** Transições de fase dramáticas de chefes na tela (`UIScene.ts:showCenterBossPhrase`), ex: *"AQUI É O MEU MUNDO"*, *"SUA POBRE ALMA FRÁGIL NÃO ENCONTRARÁ PAZ"*, *"SUA ALMA É MINHA!"*
- **Especificação:**
  - Texto monumental centralizado em tela cheia, **estritamente sem molduras, caixas ou retângulos de fundo** (`UIScene.ts:showCenterBossPhrase`).
  - Tipografia: Fonte pixel art em 24px (ou configurada por parâmetro), negrito, cor branca pura (`#ffffff`) com borda roxa abissal espessa (`#3b0764`, stroke 8px) e brilho incandescente em sombra externa (`#ff0055`, blur 24).
  - Animação de entrada: O texto surge ampliado em 2.6x com transparência total e é batido violentamente no centro da tela em escala 1.0x (`Cubic.easeIn`, 220ms), disparando tremor de câmera (320ms, força 0.024) e som de impacto pesado (`playStampImpact`) combinado à voz do chefe.
  - Efeito decorativo: Emissão de 20 faíscas/orbes luminosos flutuantes (`0xff0055`, `0xc084fc`, `0x00f5d4`) em modo aditivo (`BlendModes.ADD`) com subida suave e fade-out.
  - Vibração de tensão: Tremor contínuo suave no eixo X (+/- 2px a cada 45ms) durante o tempo de permanência da frase.
- **Implementação de referência:** [`src/scenes/UIScene.ts:showCenterBossPhrase`](../src/scenes/UIScene.ts)
- **Fazer:**
  - Manter o texto limpo e flutuante sem caixas de fundo que cubram o cenário.
- **Não fazer:**
  - NUNCA introduzir retângulos pretos ou molduras fechadas por trás dessas frases.
- **Como verificar:** Enfrentar Azazel no Capítulo 2 e reduzir seu HP para 50% para disparar *"AQUI É O MEU MUNDO"*.
- **Status:** Proposta (extraído do código, aguardando confirmação do dono)

---

### 2.4. HUD de Combate: Radar, Frascos, Barras e Retrato
- **Nome do Padrão:** Painel de Status Barroco Infernal & Radar Tático Circular
- **Onde se aplica:** Interface fixa durante a partida (`UIScene.ts`)
- **Especificação:**
  - **Radar Tático (Canto Superior Esquerdo):**
    - Círculo de radar com centro em `(X = 72, Y = 72)` e raio de `52px` (`radarRadius`).
    - Borda dupla em bronze e dourado (`0x6e2d1d` e `0xc59b27`), fundo semitransparente obsidiana (`0x0b0205`, alfa 0.88), eixos cardeais sutis e indicador cardinal norte `'N'`.
    - Marcador central azul/ciano para a heroína, pontos vermelhos para inimigos próximos, pontos dourados para altares/cristais e crânios para chefes.
  - **Painel Inferior de Vida e Estamina (Canto Inferior Direito):**
    - Retrato monumental de Nixy em 340px (`portraitSize`), ancorado na direita com profundidade sobreposta à borda do painel.
    - Moldura ornamental de pedra demoníaca com lava (`ui-status-hud`) escalada em 1.6x (448x210px).
    - Orbe/Frasco de Suprema (*Ult Gauge*) à esquerda: cavidade ornamental esférica com líquido dinâmico preenchido de baixo para cima e efeito de pulso ao carregar 100%.
    - Barras horizontais de Vida (Vermelho Sangue / Carmesim) e Estamina (Verde Esmeralda) contidas em slots chanfrados com borda metálica.
- **Implementação de referência:** [`src/scenes/UIScene.ts:create`](../src/scenes/UIScene.ts)
- **Fazer:**
  - Manter `scrollFactor = 0` em todos os elementos de HUD para que permaneçam fixos em relação à câmera.
- **Não fazer:**
  - NUNCA utilizar posições absolutas baseadas em resolução fixa sem compensar as dimensões dinâmicas da tela (`this.scale.width`, `this.scale.height`).
- **Como verificar:** Iniciar partida em qualquer modo e verificar a ancoragem do radar no topo esquerdo e da HUD de status no canto inferior direito.
- **Status:** Proposta (extraído do código, aguardando confirmação do dono)

---

### 2.5. Telegrafia de Ataques de Chefes (Ground Indicators)
- **Nome do Padrão:** Guias de Ataque Telegrafado com Preenchimento Gradual
- **Onde se aplica:** Ataques especiais de chefes em `SuccubusBoss.ts` e `AzazelBoss.ts`
- **Especificação:**
  - Todo ataque com grande potencial de dano deve desenhar indicadores gráficos no chão (`Phaser.GameObjects.Graphics` com profundidade `depth: 21`) antes de causar dano.
  - **Investidas Lineares (Dash):**
    - Linha direcional projetada do centro do chefe até o alcance máximo do ataque (480px a 560px).
    - Camada externa: Linha grossa com espessura progressiva proporcional ao tempo de carga (`lineStyle(3 + progress * 8, 0xff0044, 0.65 + progress * 0.35)`).
    - Camada interna: Fio branco de alta precisão (`lineStyle(2, 0xffffff, progress)`) indicando o vetor exato de deslocamento.
  - **Ataques em Área Circulares (Slam / Tempestade de Raios):**
    - Círculo de aviso delimitando o raio exato da explosão (`radius = 68px` no raio do Azazel).
    - Borda externa circular contínua (`lineStyle(3, 0xff2266, 0.85)`).
    - Preenchimento interno translúcido que se expande do centro para as bordas conforme o tempo esgota (`fillCircle(x, y, radius * progress)`).
    - Retículo elétrico em cruz branca (`#ffffff`) no centro do ponto de impacto.
- **Implementação de referência:** [`src/entities/enemies/AzazelBoss.ts:updateTelegraphDash`](../src/entities/enemies/AzazelBoss.ts) e [`src/entities/enemies/AzazelBoss.ts:updateLightningMarkers`](../src/entities/enemies/AzazelBoss.ts)
- **Fazer:**
  - Limpar sempre o objeto `Graphics` (`g.clear()`) na conclusão do ataque, interrupção ou morte do chefe.
  - Oferecer uma janela de telegrafia mínima justa para reação humana (mínimo de 650ms para investidas e 1000ms para raios).
- **Não fazer:**
  - NUNCA aplicar dano ou colisão antes do indicador atingir 100% de preenchimento (`progress >= 1.0`).
- **Como verificar:** Jogar contra Rosalin no Cap. 1 (observar a linha de investida e o círculo do salto) ou Azazel no Cap. 2 (observar a tempestade de 7 raios).
- **Status:** Proposta (extraído do código, aguardando confirmação do dono)

---

### 2.6. Números de Dano Flutuantes (Floating Combat Text)
- **Nome do Padrão:** Dano Flutuante Arcade com Elevação e Fade
- **Onde se aplica:** Disparos e acertos em entidades em [`DamageTextSystem.ts`](../src/systems/DamageTextSystem.ts)
- **Especificação:**
  - Texto gerado na coordenada de impacto com jitter aleatório sutil (`X: -8..8px`, `Y: -5..5px`).
  - Dano Comum: Cor branca pura (`#ffffff`), tamanho `12px`, negrito, borda preta sólida (`stroke: '#000000'`, espessura 3px).
  - Dano Crítico: Cor amarelo/dourado reluzente (`#ffbe0b`), tamanho ampliado `14px`, negrito, borda preta sólida (`stroke: '#000000'`, espessura 3px).
  - Animação: Subida de 28px no eixo Y, escala suave de 1.3x para 1.0x e fade-out de alfa 1.0 para 0 ao longo de 500ms (`Power1`), com destruição imediata do objeto texto ao término.
- **Implementação de referência:** [`src/systems/DamageTextSystem.ts:showDamage`](../src/systems/DamageTextSystem.ts)
- **Fazer:**
  - Definir `depth: 200` para que os números fiquem visíveis acima dos monstros e projéteis.
  - Destruir o objeto `Text` imediatamente no callback `onComplete` do tween para evitar vazamento de memória.
- **Não fazer:**
  - NUNCA criar números de dano sem contorno preto espesso, para garantir leitura sobre qualquer bioma ou piso de lava.
- **Como verificar:** Acertar qualquer inimigo no jogo e observar a cor e o movimento dos números subindo.
- **Status:** Proposta (extraído do código, aguardando confirmação do dono)

---

### 2.7. Botões e Menus de Navegação
- **Nome do Padrão:** Botão de Texto em Pergaminho com Realce Ígneo & Seta Flutuante
- **Onde se aplica:** Menu Principal (`MenuScene.ts`) e rodapés de seleção
- **Especificação:**
  - Tipografia: Fonte pixel art em 20px, negrito (`MenuScene.ts:create`).
  - Estado Inativo: Cor osso/pergaminho envelhecido (`#d6c7b2`), stroke vinho escuro (`#150508`, 3px), sem sombra.
  - Estado Selecionado / Hover: Cor laranja vivo incandescente (`#ffa200`), stroke laranja fogo (`#ff4500`, 3px) e sombra luminosa externa (`#ff6600`, blur 14).
  - Indicador de Seleção: Sprite `ui-menu-arrow` posicionado à esquerda do botão ativo com flutuação lateral contínua (`Sine.easeInOut`, yoyo +6px, 380ms).
  - Sons: `playMenuHover()` na troca de foco e `playMenuClick()` na confirmação da ação.
- **Implementação de referência:** [`src/scenes/MenuScene.ts:updateMenuVisuals`](../src/scenes/MenuScene.ts)
- **Fazer:**
  - Configurar zonas interativas com área ampla de clique (`hitZone` de 460x46px) para garantir ergonomia no mouse e em telas de toque.
- **Não fazer:**
  - NUNCA alternar opções sem emitir feedback sonoro auditivo para o jogador.
- **Como verificar:** Navegar pelas opções do Menu Principal com teclado (W/S) ou mouse.
- **Status:** Proposta (extraído do código, aguardando confirmação do dono)

---

### 2.8. Modais de Sistema (Pausa, Game Over, Vitória)
- **Nome do Padrão:** Janela Modal de Pedra Carmesim com Borda Dupla Metálica
- **Onde se aplica:** Modais de Game Over e Vitória (`UIScene.ts`), Menu de Pausa (`UIScene.ts:openPauseModal`), Confirmação de Saída e Seleção de Capítulos (`MenuScene.ts`)
- **Especificação:**
  - Fundo escurecido semiopaco cobrindo a tela toda (`0x000000`, alfa 0.90) com captura de cliques interativos para isolar a partida em segundo plano.
  - Painel retangular com cantos arredondados (raio de 11 a 14px):
    - Preenchimento interno: Obsidiana carmesim escura (`0x180208`, alfa 0.98).
    - Borda externa principal: Magenta infernal (`0xff0055`, 3px de espessura).
    - Filete decorativo interno: Dourado antigo (`0xf3d17a`, 1.5px de espessura com recuo de 4px).
  - Título superior: Caixa alta em 24px com stroke preto espesso (5px).
  - Botões de ação lado a lado: Caixas retangulares arredondadas (raio 8px) com fundo vinho escuro (`0x720012`), realce para magenta (`0xff0055`) no hover, e atalhos mapeados no teclado (`ENTER`, `SPACE`, `ESC`).
- **Implementação de referência:** [`src/scenes/UIScene.ts:showGameOverModal`](../src/scenes/UIScene.ts)
- **Fazer:**
  - Pausar o motor de física do jogo (`this.physics.pause()`) enquanto o modal estiver aberto.
  - Sempre fornecer opção clara de cancelamento/retorno via teclado (`ESC`) ou botão dedicado.
- **Não fazer:**
  - NUNCA deixar o modal fechar sem reabilitar adequadamente os controles e a física da partida.
- **Como verificar:** Sofrer dano até zerar o HP para abrir a tela de Game Over, ou pressionar `[ESC]` em jogo para abrir o menu de pausa.
- **Status:** Proposta (extraído do código, aguardando confirmação do dono)

---

## 3. Inconsistências Mapeadas na Auditoria (Para Decisão do Dono)

Durante a auditoria estrita do código fonte, identificamos **5 inconsistências visuais reais** onde elementos com a mesma finalidade são construídos com estilos diferentes entre arquivos:

### Inconsistência 1: Fonte Não-Pixel Art no Dano Flutuante
- **Onde está:** [`src/systems/DamageTextSystem.ts`](../src/systems/DamageTextSystem.ts#L18)
- **Variações:** `DamageTextSystem.ts` utiliza exclusivamente a fonte **`'Impact, sans-serif'`**, enquanto todas as outras telas, diálogos, menus e HUDs do jogo utilizam fontes pixel art (`Silkscreen`, `Press Start 2P` ou `Pixelzone`).
- **Padrão Principal:** Famílias pixel-art góticas (`Silkscreen` / `Pixelzone`).
- **Ação:** Aguarda decisão do dono se o dano deve migrar para `Pixelzone` pixel-art ou permanecer em `Impact`.

### Inconsistência 2: Competição Entre Duas Famílias de Fonte Pixel Art Principais
- **Onde está:** Dispersa entre cenas de interface e cenas de cartas/mapas.
- **Variações:**
  - Família A: `"'Silkscreen', 'Press Start 2P', monospace"` (usada na `MenuScene.ts`, `DialogueSystem.ts`, `IntroScene.ts`, `Chapter1EndScene.ts` e HUD de `UIScene.ts`).
  - Família B: `"'Pixelzone', 'Silkscreen', monospace"` (usada nas cartas de `UpgradeScene.ts`, no `MapEditorSystem.ts`, no `TestShowroomSystem.ts` e em textos de impacto de `UltimateSystem.ts`).
- **Padrão Principal:** Ambas convivem. `Silkscreen` predomina em narrativas e menus; `Pixelzone` predomina em cartas arcanas e ferramentas in-game.
- **Ação:** Aguarda decisão do dono para unificação no futuro `theme.ts` (Pacote 2).

### Inconsistência 3: Divergência de Geometria Entre Modais e Caixas de Texto
- **Onde está:** `DialogueSystem.ts` vs `UIScene.ts` (GameOver/Pause) vs `MenuScene.ts` (Capítulos/Bênçãos).
- **Variações:**
  - Diálogos usam corte chanfrado angular de mangá (`drawSlantedBox`) com borda branca grossa de 3.5px.
  - Modais de fim de jogo (`UIScene.ts`) usam cantos arredondados suaves com borda dupla magenta/ouro.
  - Modais do Menu Principal (`MenuScene.ts`) usam painéis retangulares com borda bronze/ouro envelhecido (`0x6e2d1d`).
- **Padrão Principal:** A identidade gótica oscila entre o estilo anime/Persona (diálogos) e gótico barroco escuro (HUD/menus).
- **Ação:** Aguarda decisão do dono se os modais devem padronizar para o estilo de cantos arredondados com borda dupla ou manter personalização temática por contexto.

### Inconsistência 4: Parâmetros Divergentes de Telegrafia de Investida entre Chefes
- **Onde está:** [`SuccubusBoss.ts`](../src/entities/enemies/SuccubusBoss.ts#L265) vs [`AzazelBoss.ts`](../src/entities/enemies/AzazelBoss.ts#L676)
- **Variações:**
  - Rosalin (Cap. 1): Linha de 480px, cor magenta `#ff0055`, espessura `3 + progress * 9`.
  - Azazel (Cap. 2): Linha de 560px, cor carmesim `#ff0044`, espessura `3 + progress * 8`.
- **Padrão Principal:** A estrutura da telegrafia em duas camadas (linha de progresso colorida + fio branco fino de mira) é idêntica, mas cores e alcances foram configurados com valores mágicos soltos em cada arquivo.
- **Ação:** Aguarda consolidação das cores e espessuras de telegrafia no futuro `theme.ts` do Pacote 2.

### Inconsistência 5: Fragmentação Excessiva de Cores Hexadecimais Próximas
- **Onde está:** Espalhada em mais de 1.200 ocorrências literais em `src/`.
- **Variações:**
  - Dourados: `#c59b27`, `#f3d17a`, `#ffd700`, `#facc15`, `#ffd60a` (5 variações para o mesmo tom dourado).
  - Carmesins/Vermelhos: `#ff0055`, `#ff0044`, `#ff2255`, `#ff4d6d`, `#9d0208`, `#720012` (6 variações para vermelho de alerta).
  - Fundos Escuros: `0x060205`, `0x080206`, `0x14011c`, `0x180309`, `0x180208`, `0x13070b` (6 variações para preto/obsidiana).
- **Padrão Principal:** Ausência de paleta semântica centralizada.
- **Ação:** Esta fragmentação será resolvida no Pacote 2 com a criação do dicionário centralizado `src/config/theme.ts`.

---

## 4. Baseline Quantitativo de Cores e Tipografia em `src/`

Medição estrita realizada via varredura automatizada em todos os arquivos TypeScript do diretório `src/`:

| Métrica Auditada | Total Encontrado | Observações |
| :--- | :--- | :--- |
| **Total de Ocorrências de Cores Hexadecimais Literais** | **1.218 ocorrências** | Cores inseridas diretamente em código sem referência a constantes |
| **Valores Hexadecimais Distintos** | **362 valores únicos** | Alto grau de dispersão que será normalizado pelo `theme.ts` |
| **Famílias / Combinações de Fontes em Uso** | **6 famílias distintas** | `Silkscreen`, `Press Start 2P`, `Pixelzone`, `Impact`, `sans-serif`, `monospace` |
