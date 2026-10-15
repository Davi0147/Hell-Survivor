# Game Design Document (GDD) — Hell Survivor

> **Versão:** 1.1.0  
> **Última Atualização:** 15/10/2026  
> **Status:** Aprovado — Estrutura de Modos (História & Infinito) & Ultimate Integradas  
> **Gênero:** Roguelite / Bullet Heaven / Survival de Hordas (Estilo *Vampire Survivors*)  
> **Plataforma Inicial:** Web (HTML5 Canvas/WebGL via Phaser 3 + TypeScript + Vite)  
> **Plataforma Futura:** Desktop Windows (.exe via Tauri / Electron)  

---

## 1. Visão Geral e Pilares do Projeto

### 1.1 Resumo Executivo
**Hell Survivor** é um jogo de ação e sobrevivência em ritmo acelerado onde o jogador assume o controle de heróis infernais enfrentando ondas implacáveis de inimigos. O personagem ataca automaticamente mirando sempre no inimigo mais próximo, cabendo ao jogador dominar o posicionamento, a gestão de estamina no sprint e as escolhas sinérgicas de upgrades a cada nível.

### 1.2 Os 3 Pilares de Design
1. **Game Loop Hipnótico e Satisfatório:** Matar monstros em massa -> Coletar gemas de alma brilhantes com feedback de impacto limpo -> Subir de nível e escolher upgrades que transformam o poder do herói visualmente e numericamente.
2. **Posicionamento & Mobilidade Tática (8-Way + Estamina):** Não é apenas andar em círculos. O gerenciamento de sprint cria momentos de tensão e fuga rápida quando a horda cerca a heroína.
3. **Modularidade e Extensibilidade Absoluta:** O código e a estrutura de dados são concebidos desde o primeiro dia para permitir a adição rápida de novos personagens, novas armas, inimigos e biomas sem refatoração de código base.

---

## 2. Personagem: Nixy (Heroína Inicial)

### 2.1 Identidade Visual e Recursos
* **Sprites:** 64x64 pixels, arte em alta definição em 8 direções angulares (`east`, `north-east`, `north`, `north-west`, `west`, `south-west`, `south`, `south-east`).
* **Estados de Movimento:**
  * **Idle:** Poses estáticas para os 8 ângulos de visão.
  * **Running (Corrida Normal):** Animações completas de 8 frames para cada um dos 8 ângulos (`frame_000.png` a `frame_007.png`).
  * **Full Sprint (Corrida Rápida):** Animações dedicadas de 8 frames para cada um dos 8 ângulos (`nixy-sprint-${dir}`) a 14 FPS, acompanhada de efeito de rastro fantasma (ghost trail) e consumo da barra de estamina.
  * **Taking Damage (Reação a Dano):** Poses dedicadas nos 8 ângulos de visão (`taking_damage`) ativadas por 250ms sempre que a heroína é atingida, com flash carmesim e i-frames.
  * **Sitting Down:** Pose especial / de descanso nos 8 ângulos.

### 2.2 Atributos Base da Nixy
* **Vida Máxima (HP):** 100
* **Velocidade de Movimento (Base):** 160 px/s
* **Velocidade em Full Sprint:** 260 px/s
* **Estamina Máxima:** 100 pontos
  * *Consumo de Estamina:* 35 pts/segundo durante Sprint
  * *Regeneração de Estamina:* 20 pts/segundo ao caminhar; 35 pts/segundo parada
* **Arma Inicial:** *Disparo de Almas Infernais (Soul Bolts)*
* **Passiva Única da Nixy:** +10% de aceleração e ganho de recuperação de estamina.

### 2.3 Habilidade Suprema (Ultimate): ETERNAL DESPAIR
Cada personagem em *Hell Survivor* possui uma habilidade suprema única carregada através de **eliminações de inimigos (Kills)**. Conforme monstros são derrotados, a barra/orbe de Ultimate na HUD se preenche até atingir 100%, brilhando e liberando a ativação via tecla **`E`** ou **`Q`**.

Ao ativar o **Eternal Despair** da Nixy, uma sequência dramática estilo *anime action RPG* assume o controle do jogo:

1. **Character Cut-In Cinematográfico:**
   * A ação de combate normal é bruscamente interrompida por um corte diagonal estilizado rasgando a tela em formato de quadrinhos/manga.
   * Bordas brancas irregulares e serrilhadas, contornos pretos espessos e estética de papel rasgado fatiam a imagem.
   * Revela um close-up extremo no rosto da Nixy, destacando seus olhos e expressão de fúria intensa com sombreamento preto-e-branco de alto contraste e realces carmesins nos olhos e detalhes.
   * O portrait desliza em alta velocidade para o centro do corte, congela momentaneamente com efeito de *hit-stop* e sofre um tremor de impacto seco acompanhado de um som estridente e contundente. O corte rasga e dissolve, revelando a arena.

2. **Sequência Suprema — 5 Segundos (Time-Stop & Instabilidade Carmesim):**
   * **Congelamento Temporal:** Todos os inimigos visíveis na tela são imediatamente paralisados no tempo, congelando suas animações e movimentos.
   * **Atmosfera Sombria:** O cenário e os monstros sofrem leve escurecimento e dessaturação, enquanto Nixy permanece no centro emanando uma aura instável e ofuscante de energia mágica carmesim.
   * **Distorção e Partículas:** Efeito sutil de tremor centralizado na heroína, refração/distorção de calor no ar, iluminação vermelha pulsante e partículas místicas hiperbrilhantes orbitando sua silhueta.

3. **8 Detonações Carmesins em Área (AoE):**
   * Ao longo dos 5 segundos de congelamento, exatamente **8 explosões mágicas circulares** são disparadas sequencialmente na arena.
   * Cada explosão surge como uma detonação em rápida expansão de energia rubra, com núcleo brilhante escarlate, raios radiais nítidos, ondas de choque (shockwaves) e partículas incandescentes, causando dano devastador em área.

4. **Lógica Inteligente de Mira (Cluster-Targeting):**
   * Os pontos de impacto são aleatorizados, porém com priorização algorítmica aos **maiores aglomerados (clusters) de monstros próximos**. O sistema busca áreas densamente povoadas por inimigos para maximizar o estrago, mantendo variação visual entre cada impacto.
   * Cada detonação é telegrafada por um marcador circular carmesim no chão frações de segundo antes do estouro. As ondas de choque se sobrepõem quando múltiplos impactos atingem pontos vizinhos.

5. **Design de Áudio & Retorno de Impacto:**
   * Detonações mágicas em camadas: graves profundos de subwoofer, estalos cortantes de magia da morte, estalidos de alta frequência e ecos sobrenaturais de monstros sendo erradicados.
   * Tremor de tela (screen shake) sincronizado com cada explosão, mais intenso para detonações próximas à heroína e mais leve para impactos distantes.

6. **Desfecho e Retomada:**
   * Após a oitava explosão, a última onda de choque se dissipa, a iluminação do cenário e saturação são restauradas suavemente, os inimigos sobreviventes são libertados da paralisia e o controle total é devolvido à Nixy.

---

## 3. Mecânicas de Jogabilidade

### 3.1 Controles
* **Movimentação:** Teclas `W`, `A`, `S`, `D` ou Setas do Teclado (8 direções com normalização vetorial para evitar velocidade dobrada nas diagonais).
* **Full Sprint:** Tecla `Shift` ou `Barra de Espaço` (segurar enquanto houver estamina).
* **Habilidade Suprema (Ultimate):** Tecla `E` ou `Q` (quando a barra atingir 100% de abates).
* **Pausa:** Tecla `Esc` ou botão na interface.

### 3.2 Sistema de Combate e Mira Automática (Auto-Aim)
* O personagem não exige mira manual do jogador.
* A cada intervalo de ataque (*cooldown* da arma), o sistema calcula o inimigo vivo mais próximo dentro do raio de alcance da arma (`Math.hypot(dx, dy)`).
* **Filtro de Visibilidade em Tela:** O sistema só seleciona alvos que estejam efetivamente visíveis dentro da câmera do jogador (`camera.worldView.contains(enemy.x, enemy.y)`), evitando disparos "cegos" contra inimigos fora do campo de visão.
* O projétil é instanciado em direção a esse alvo com trajetória balística/linear e velocidade definida.

### 3.3 Arma Inicial: Disparo de Almas (Soul Bolts)
* **Comportamento:** Dispara esferas luminosas em intervalos de 1.0s em direção ao monstro mais próximo.
* **Dano Inicial:** 25 de dano por acerto.
* **Propriedades Evolutivas via Upgrades:**
  * Quantidade de projéteis adicionais (+1 a +4 esferas por rajada).
  * Perfuração (+1 a +3 inimigos atravessados antes de sumir).
  * Redução de intervalo de disparo (-15% a -40% de cooldown).
  * Ricochete (salta para um segundo monstro após o impacto).

### 3.4 Sistema de XP e Níveis (Progression Loop)
1. **Drop de Gemas de Alma:** Ao ser derrotado, o inimigo deixa no chão uma Gema de Alma colorida correspondente ao seu valor (ex: Verde = 5 XP, Azul = 20 XP, Vermelho = 100 XP).
2. **Ímã e Coleta (Pickup Radius):** A Nixy tem um raio base de atração (ex: 75 pixels). Gemas que entram no raio aceleram suavemente em direção à heroína.
3. **Curva de XP:** Nível seguinte = `BaseXP * (Nivel ^ 1.25)`.
4. **Modal de Level Up:**
   * O jogo pausa completamente o mundo e as entidades.
   * Apresenta **3 cartas aleatórias** sorteadas do catálogo de melhorias disponíveis.
   * O jogador escolhe 1 carta; a melhoria é aplicada imediatamente aos stats/armas do jogador e a partida é retomada.

### 3.5 Sistema de Aquisição de Armas e Cartas
* **Zero Armas Prontas de Início:** O jogador inicia a partida equipado estritamente com a **Arma Básica Única** de seu personagem (ex: *Soul Bolts* para a Nixy).
* **Desbloqueio Exclusivo via Cartas:** Armas adicionais secundárias (ex: Foices Orbitais, Lanças de Sangue, Correntes Abissais) **NÃO** vêm desbloqueadas nem prontas. Elas aparecem como cartas no sorteio de Level Up. Caso o jogador escolha uma carta de arma nova, ela passa a atirar automaticamente junto com a arma primária.
* **Reinício de Nível por Fase (Reset to Lv. 1):** A cada novo capítulo ou fase iniciada, o nível do jogador é resetado para o Nível 1. A criação de sinergias e combinações de cartas é uma experiência roguelite fresca e dinâmica a cada tentativa.

---

## 4. Modos de Jogo e Estrutura de Hordas

*Hell Survivor* é estruturado em **dois modos principais de jogo complementares**: o **Modo História** (focado em narrativa, desbloqueios e progressão por fases) e o **Modo Infinito** (focado em sobrevivência extrema, teste de builds e recordes).

### 4.1 Modo História (Campanha Narrativa e Capítulos)
O Modo História conduz o jogador pela jornada das personagens no submundo, revelando a história das heroínas, as rivalidades e a lore dos chefes infernais, além de falas e reações com personalidade da protagonista.

* **Estrutura por Capítulos/Fases Independentes:**
  * O jogo é dividido em fases fechadas (ex: *Capítulo 1 — Catacumbas Esquecidas*, *Capítulo 2 — Pântano das Almas Perdidas*, *Capítulo 3 — Cidadela Infernal*).
  * **Reinício de Nível por Capítulo (Reset to Lv. 1):** Ao iniciar uma nova fase da história, a personagem sempre começa no **Nível 1** com sua arma base, criando uma jornada roguelite autocontida de montagem de build.
* **Barra Global de Almas / Purificação (Objetivo da Fase):**
  * Cada fase possui uma quantidade **predefinida e fixa de monstros** a serem purificados (ex: meta de 250 monstros no Capítulo 1).
  * Uma **Barra de Purificação de Almas** ornamental na parte superior da HUD monitora o progresso em tempo real conforme os inimigos são abatidos.
  * Ao preencher a barra em 100%, todos os spawns normais cessam momentaneamente e o **Boss Predefinido do Capítulo** é convocado para a arena.
* **Sistema de Diálogos Teatrais Estilo Persona 5 (High-Energy Comic Noir):**
  * Os diálogos interrompem temporariamente a ação em momentos-chave da fase (Introdução, Encontro com o Boss e Vitória do Capítulo), apresentados com a estética de quadrinhos e balões de fala angulares inspirados na icônica interface de *Persona 5*:
    1. **Geometria Angular & Polígono Irregular:** Em vez de caixas retangulares clássicas, o balão de fala é um polígono trapezoidal inclinado e agressivo em preto profundo (`#0f0307`), envolvido por uma borda dupla recortada afiada em branco puro e detalhes em ouro envelhecido (`#c59b27`), com uma cauda/ponteiro triangular afiado apontando para o orador.
    2. **Etiqueta de Nome Inclinada (Tilted Nameplate):** O nome do personagem (ex: `NIXY`, `SUCCUBUS`) fica em destaque dentro de uma faixa estilizada inclinada que sobressai no canto superior esquerdo do balão, com tipografia em alto contraste de blocos pretos e brancos.
    3. **Bustos / Portraits Ilustrados com Corte Dinâmico:** O retrato expressivo do locutor repousa no canto inferior esquerdo, rompendo a moldura com contornos pretos espessos, iluminação cel-shading dramática e expressões faciais reativas (confiante, zombeteira, surpresa, fúria).
    4. **Tipografia & Efeito Máquina de Escrever (Typewriter FX):** As frases são reveladas suavemente letra por letra, acompanhadas por cliques sutis de áudio e um ícone animado indicador de avanço piscando no canto inferior direito do balão.
    5. **Atalhos e Controles Ágeis:**
       * `[Espaço]` / `[Enter]` / Clique: Avança para a próxima fala imediatamente.
       * `[F]` / `[FFWD]`: Acelera o fluxo do texto instantaneamente.
       * `[ESC]` / `[Pular]`: Permite ao jogador pular a conversa direto para o combate caso deseje rejogabilidade rápida.
    6. **Harmonia Visual com a Ultimate:** Utiliza os mesmos elementos gráficos (bordas serrilhadas, cortes diagonais e sombras pretas intensas) do *Cut-In* da Ultimate *Eternal Despair*, estabelecendo uma assinatura artística consistente e sofisticada para todo o jogo.
* **Desbloqueios Permanentes de Personagens:**
  * Concluir capítulos do Modo História desbloqueia **novas personagens jogáveis** com atributos, armas base e Ultimates exclusivas para serem utilizadas livremente no **Modo Infinito**.

---

### 4.2 Modo Infinito (Endless / Survival Arcade)
O Modo Infinito é a arena definitiva para testar a maestria mecânica, empurrar builds ao limite extremo, quebrar recordes mundiais de tempo/abates e acumular recursos para a Loja de Melhorias Permanentes.

* **Invasão Contínua e Sem Fim:**
  * Não há teto de abates nem encerramento pré-programado. As hordas surgem em fluxo ininterrupto.
  * **Escalonamento Infinito por Minuto:** A cada minuto sobrevivido, os monstros recebem multiplicadores graduais de vida (+15% a +25%), velocidade (+5%) e densidade de agrupamento.
* **Aparição Periódica de Mini-Bosses e Bosses Aleatórios:**
  * O sistema sorteia ameaças dinâmicas com base no cronômetro da run:
    * **A cada 3 Minutos:** Um **Mini-Boss aleatório** é sorteado do catálogo e surge no meio da horda com aura especial e alta vida, dropando baús de tesouro com ouro e cartas especiais.
    * **A cada 10 Minutos:** Um **Boss Principal aleatório** (como a Succubus ou chefes de outros capítulos) desce à arena com mecânicas de ataque completas, forçando o jogador a usar a Ultimate e desviar com precisão.
* **Recordes e Competitividade:**
  * Monitoramento de tempo sobrevivido (minutos/segundos), total de monstros abatidos e dano máximo por segundo (DPS).
  * Farm de Ouro/Almas para compra de atributos passivos na Loja Meta (Aumento de Vida Base, Regeneração, Dano Global, Velocidade e Raio de Coleta).

---

### 4.3 Condições de Fim de Jogo e Pontuação
* **Vitória no Modo História:** Abater o Chefe Predefinido do Capítulo após preencher a barra de purificação.
* **Derrota (Ambos os Modos):** HP da heroína chegar a 0.
* **Tela de Fim de Partida:** Exibe tempo sobrevivido, nível alcançado, monstros derrotados, dano total causado, gemas coletadas e novos personagens/conquistas desbloqueadas.

---

### 4.4 Bestiário Atualizado (Inimigos Oficiais)
* **Zombie Dog (Cão Zumbi):**
  * **Papel:** Inimigo terrestre veloz que persegue em bando.
  * **Sprites & Animações:** 8 direções estáticas de Idle (`56x56px`) e animações de 8 frames nos 4 eixos cardinais (`72x72px`) a 11 FPS.
  * **Atributos:** HP: 35 | Velocidade: 85 px/s | Dano: 8 | Colisão Física: 38x28px.
  * **Camada Visual:** `depth: 5` (terrestre, sempre abaixo da jogadora e de inimigos voadores).

* **Succubus (Chefe Oficial da Fase 1 / Inimiga de Elite Aérea):**
  * **Papel:** Demônio alado veloz de alto dano e resistência. É a Boss oficial do Capítulo 1 no Modo História e atua como Boss aleatório no Modo Infinito.
  * **Sprites & Animações:** 8 direções de Idle (`64x64px`) e animação completa de voo com asas batendo violentamente nos 8 ângulos direcionais (`92x92px`, 5 frames por direção a 10 FPS).
  * **Atributos:** HP: 85 | Velocidade: 115 px/s | Dano de Contato: 16 | Colisão Física: 38x48px (torso humanoide).
  * **Camada Visual:** `depth: 8` (voa por cima de cães terrestres `depth: 5`, mas **estritamente abaixo da heroína `depth: 20`**).

---

### 4.5 Interface de Usuário (HUD) - Estilo Barroco Vampírico
* **Canto Inferior Direito (Heroína & Status):**
  * **Retrato Gigante da Heroína (340px):** Busto da Nixy em proporção imponente (340x340px), livre de caixas ou fundos artificiais com transparência nativa, posicionado no extremo inferior direito da tela (`depth: 150`). Ao sofrer dano, troca para `damage_ui.png` com tremor orgânico (-6px a +6px) e flash carmesim.
  * **Painel Barroco Vampírico (Sangue & Ouro):**
    * Moldura ornamentada em ouro envelhecido (`#c59b27`) e veludo vermelho que se estende por trás do sprite da heroína (`depth: 30`), criando sensação de profundidade e camadas.
    * **Frasco Alquímico Alado de Sangue:** Frasco com asas douradas de anjo/demônio e líquido carmesim dinâmico que sobe e desce em tempo real conforme a porcentagem de HP.
    * **Barra de Vida (HP):** Barra carmesim profunda com texto pixel art (`100 / 100 HP`).
    * **Barra de Estamina:** Barra dourada clássica (`100% STAMINA`) com variação para ciano durante o Sprint e magenta ao esgotar.
    * **Medidor de Habilidade Suprema (Ultimate):** Indicador visual que acumula almas por abates. Ao atingir 100%, emite brilho dourado e faíscas indicando prontidão com a tecla de atalho `[E]`.
    * **Tipografia Pixel Art:** Uso das fontes retrô *Silkscreen* e *Press Start 2P* para nome, nível e números.
* **Topo da Tela (Objetivos e Barra de Almas):**
  * No **Modo História**: Exibe a **Barra de Purificação de Almas** com contador de abates restantes para invocar o Boss.
  * No **Modo Infinito**: Exibe o **Cronômetro de Sobrevivência** (`MM:SS`) e indicador da próxima onda de Mini-Boss/Boss.
* **Canto Superior Direito:**
  * Contador de abates (`💀 ABATES: X`) e dados da arma primária em painel barroco escarlate.
* **Topo Central:**
  * Botão de recarga dinâmica de sprites `[🔄 Recarregar [F2]]`.

---

## 5. Arquitetura de Software e Organização de Pastas

```
Hell Survivor/
├── docs/
│   ├── GDD.md                  # Este documento oficial de Game Design
│   └── TIMELINE.md             # Linha do tempo e roadmap detalhado por fases
├── public/                     # Assets estáticos servidos pelo Vite
│   ├── assets/
│   │   ├── sprites/
│   │   │   ├── nixy/           # Sprites da heroína organizados por estado e ângulo
│   │   │   │   ├── idle/
│   │   │   │   ├── running/
│   │   │   │   └── sitting/
│   │   │   ├── enemies/        # Sprites e texturas dos monstros
│   │   │   ├── projectiles/    # Efeitos de tiros, magias e cortes
│   │   │   └── items/          # Gemas de XP, baús, orbes de cura
│   │   └── sounds/             # SFX e trilhas sonoras organizadas por SoundGroups
├── src/
│   ├── config/                 # Configurações globais e de balanceamento
│   │   ├── gameConfig.ts       # Resolução, FPS, física Phaser
│   │   └── balance.ts          # Tabelas de dano, curvas de XP, velocidades
│   ├── core/                   # Núcleo da arquitetura
│   │   ├── GameState.ts        # Estado da run (score, tempo, stats ativos)
│   │   └── EventBus.ts         # Barramento de eventos desacoplado
│   ├── entities/               # Classes e componentes de jogo
│   │   ├── characters/
│   │   │   ├── BaseCharacter.ts # Classe abstrata base para qualquer personagem
│   │   │   └── Nixy.ts         # Implementação específica da Nixy
│   │   ├── enemies/
│   │   │   ├── BaseEnemy.ts    # Classe base de monstro com pooling
│   │   │   └── EnemyFactory.ts # Spawner e instanciador de inimigos
│   │   ├── weapons/
│   │   │   ├── BaseWeapon.ts   # Lógica base de armas e auto-aim
│   │   │   └── SoulBolt.ts     # Disparo místico da Nixy
│   │   └── items/
│   │       └── Gem.ts          # Gema de XP com física de atração
│   ├── systems/                # Sistemas gerenciais de jogo
│   │   ├── SpawnerSystem.ts    # Gerenciador de hordas e cronômetro
│   │   ├── UpgradeSystem.ts    # Pool de cartas e árvore de evolução
│   │   └── AudioManager.ts     # Controle categorizado por SoundGroups
│   ├── scenes/                 # Cenas do Phaser 3
│   │   ├── BootScene.ts        # Carregamento de assets e atlas
│   │   ├── MainMenuScene.ts    # Menu inicial e seleção
│   │   ├── GameScene.ts        # Cena principal do loop de sobrevivência
│   │   ├── UIScene.ts          # Camada de interface HUD independente do zoom da câmera
│   │   └── UpgradeScene.ts     # Overlay de seleção de cartas ao subir de nível
│   └── main.ts                 # Ponto de entrada da aplicação
├── package.json
├── tsconfig.json
└── vite.config.ts
```

---

## 6. Regras de Manutenção do GDD
1. Qualquer nova arma, personagem, inimigo ou alteração em fórmulas de balanceamento deve ser atualizada neste arquivo antes ou imediatamente após sua implementação.
2. Cada nova fase concluída da Linha do Tempo deve ter seu status devidamente marcado como Concluído.

---

## 7. Diretrizes Técnicas de Renderização Pixel-Art
1. **Zoom Inteiro Estrito (Pixel Perfection):** Em jogos com pixel-art nítido (como os sprites 64x64 e 84x84 da Nixy), o zoom da câmera deve ser sempre um multiplicador inteiro (ex: 2.0x, nunca fracionado como 1.5x) para evitar deformação de subpixel e efeito de pixel-shimmering / borrão em movimento.
2. **Câmera Ancorada (Vampire Survivors Style):** A câmera utiliza lerp instantâneo (1, 1) e `setRoundPixels(true)`, mantendo a personagem estável no centro da tela e eliminando qualquer vibração relativa entre o sprite e a viewport.
3. **Sincronização de Piso (POST_UPDATE):** A textura de piso em TileSprite atualiza suas coordenadas estritamente no evento `POST_UPDATE` com `Math.round()`, garantindo que o scroll do chão acompanhe a câmera sem defasagem de 1 frame.
4. **Hierarquia Estrita de Camadas (Depth / Z-Index Anti-Sobreposição):**
   * **Piso Infinito (`floorTile`):** `-100` (fundo absoluto).
   * **Inimigos Terrestres (`ZombieDog`):** `5` (rasteiros, no chão).
   * **Inimigos Voadores / Mini-Chefes (`Succubus`):** `8` (voam sobrepondo inimigos terrestres, mas **abaixo da heroína**).
   * **Rastro Fantasma do Sprint (Afterimage):** `19` (silhuetas luminosas logo atrás da personagem).
   * **Heroína Jogável (`Nixy`):** `20` (nunca fica encoberta por nenhum monstro, garantindo total leitura tática).
   * **Projéteis Místicos (`SoulBoltProjectile`):** `25` (visíveis cortando o ar por cima de monstros e personagens).
   * **Partículas & Faíscas de Impacto:** `30`.
   * **Números de Dano Flutuantes (`DamageTextSystem`):** `200` (sempre legíveis no topo da ação).
   * **Interface de Usuário (`UIScene`):** Renderizada em cena separada (`depth: 30 a 150` desacoplada da câmera de gameplay).

---

## 8. Pipeline de Sprites em Tempo Real (Zero-Latency Assets)
1. **Junção Direta de Diretórios (NTFS Junction):** O diretório `public/assets/sprites/nixy/` é uma junção direta (Junction) com a pasta de trabalho `Sprites/Nixy/`. Qualquer arte exportada, sobrescrita ou salva nessa pasta reflete imediatamente no servidor sem nenhuma necessidade de cópia manual.
2. **Cache-Busting Dinâmico:** Todas as texturas no `BootScene` são carregadas com query string baseada em timestamp dinâmico (`?t=${Date.now()}`), garantindo que o navegador nunca sirva imagens em cache antigo.
3. **Botão e Atalho de Recarga (F2):** Pressionar a tecla `F2` no teclado ou clicar no botão dourado `[🔄 Recarregar Sprites]` no topo da tela remove as texturas anteriores da memória do Phaser, baixa as novas artes do disco e retoma o jogo em menos de 100ms.

---

## 9. Cenários e Texturas de Piso
1. **Piso Infernal (Chão 1):** Utiliza a textura de alta definição `Chão1.jpg` (2048x2048) da pasta `Sprites/Texturas/`, renderizada através de um `TileSprite` conectado à viewport.
2. **Repetição Contínua (Tiling sem Esticar):** A textura se repete infinitamente em grade contínua nas coordenadas X e Y sem nenhuma deformação ou esticamento, acompanhando suavemente o deslocamento do jogador.



