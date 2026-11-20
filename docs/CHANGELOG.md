# Changelog — Hell Survivor (`docs/CHANGELOG.md`)

Todas as mudanças relevantes, pacotes de refatoração, correções de bugs e novas funcionalidades deste projeto são documentadas neste arquivo.

## [Não publicado — Transportador] — 2026-11-20

### Resumo para o Jogador
- **O Ladrão de Almas virou o Transportador:** no lugar do cão dourado, agora foge um diabrete magro com um saco de gemas nas costas, com arte e animação de corrida próprias. Funciona como antes: siga a seta dourada e abata ele em até 15 segundos para o saco se abrir (chuva de gemas, almas e às vezes um baú). Se o tempo acabar, ele escapa.
- No Modo de Teste o botão virou "EVENTO: TRANSPORTADOR", e ele está na galeria de inimigos.

### Técnico
- Nova entidade `TransporterEnemy` (`src/entities/enemies/TransporterEnemy.ts`); a lógica de fuga saiu do `ZombieDog` (`isFleeing`, `isSpecialMiniBoss` removidos) e foi para a entidade nova. Escala e ritmo de fuga em `HORDE_EVENT_BALANCE.thief` (`scale`, `fleeRelaxDistance`, `relaxedPace`). O id interno do evento continua `thief`.
- `FX_COLORS.thiefTint` removida (o cão dourado não existe mais).
- Sprites em `public/assets/sprites/enemies/Transporter/` (fonte em `art-source/Sprites/Enemies/Transporter/`).

## [Não publicado — Ghoul Devorador] — 2026-11-20

### Resumo para o Jogador
- **Minichefe novo no Modo Infinito (3:00):** o Titã Cerberus (que era só o cão zumbi maior) saiu. No lugar dele chega o **Ghoul Devorador**, um monstro de arte própria, bem maior e mais forte: 2100 de vida (era 1400), 24 de dano no contato (era 20), anda um pouco mais rápido e é maior na tela.
- **Bote telegrafado:** de tempos em tempos ele para, pisca em vermelho por meio segundo e salta em linha reta na direção da Nixy (34 de dano se acertar). Todo golpe dele empurra a Nixy para trás, e o bote empurra bem mais longe. Dá para escapar com a esquiva ou saindo da linha.
- Ele resiste a atordoamento e empurrões, como os chefes. Recompensa igual à do antigo Titã (gema roxa, 10 a 15 almas e Cálice ou Ímã).
- No Modo de Teste o botão virou "INVOCAR MINI-BOSS: GHOUL DEVORADOR", e ele está na galeria de inimigos.

### Técnico
- Nova entidade `GhoulEnemy` (`src/entities/enemies/GhoulEnemy.ts`); atributos em `ENEMY_BALANCE.ghoulDevourer` (substitui `titanCerberus`); cor do aviso em `FX_COLORS.ghoulLungeTelegraph`.
- `spawnTitanCerberus` → `spawnGhoulDevourer`; tipo de horda do Modo de Teste `titan_cerberus` → `ghoul`.
- Sprites em `public/assets/sprites/enemies/Ghoul/` (fonte em `art-source/Sprites/Enemies/Ghoul/`).

## [v0.14.1 — Azazel com Nome Próprio] — 2026-11-20

### Resumo para o Jogador
- **Barra de vida do Azazel com o nome certo:** a barra do topo só sabia ler a Rosalin e escolhia o nome pelo capítulo; no Modo Infinito o Azazel aparecia como "ROSALIN". Agora ela mostra o chefe que está na luta, com o nome e a vida dele.
- **Fim do Capítulo 2 sem a Rosalin:** a cena final reaproveitava as imagens do fim do Capítulo 1 (com a Rosalin caída). Agora usa um céu violeta provisório, com o retrato do Azazel, até a arte própria ficar pronta.
- **Azazel mais forte:** vida de 16000 para 24000 e todos os golpes com +20% de dano (o mais forte agora tira 24).

## [v0.14.0 — Azazel Refinado] — 2026-11-20

### Resumo para o Jogador
- **Azazel não mata mais de uma vez:** o dash da escuridão acertava a cada quadro em que passava pela Nixy (5 ou 6 vezes seguidas) e matava de uma vez. Agora cada golpe dele acerta uma vez só, e depois de um acerto a Nixy fica meio segundo imune (a mesma imunidade do contato com monstros): golpes não se somam no mesmo instante. Nenhum golpe passa de 20 de dano. O contato com o corpo dele caiu de 13 para 8.
- **Duas habilidades novas:**
  - **Leque de Penas:** ele marca um cone no chão na direção da Nixy e solta uma rajada de 9 penas. O cone para de mirar um pouco antes do disparo: dá para sair.
  - **Auréola Partida:** abaixo de 75% da vida, ele ergue a mão e um anel se expande pela arena. Atravesse com a esquiva ou fique longe. Na fase final ele solta duas ondas seguidas.
- **Entrada com câmera:** enquanto ele espera a música terminar o loop, a câmera desliza devagar até ele e se aproxima (para ninguém achar que o jogo travou). Quando a música vira, a câmera volta rápido para a Nixy.

## [v0.13.2 — HUD Não Some Mais] — 2026-11-20

### Resumo para o Jogador
- **HUD sumindo depois de morrer:** depois do Fim da Jornada e "Tentar novamente", pausar e continuar fazia sumirem os botões de toque (e o radar e a barra de armas paravam de atualizar). O jogo achava que a HUD ainda estava escondida da tela de derrota. Corrigido.
- **Contador de combo no celular** subiu e foi para a esquerda, saindo de trás dos botões de corrida e esquiva.

## [v0.13.1 — Celular Confortável] — 2026-11-20

### Resumo para o Jogador
- **Sem faixa preta embaixo no iPhone (provável):** o jogo espera o celular terminar de ajustar a tela antes de medir, e se a área visível mudar enquanto você está no menu ele se reajusta sozinho.
- **Barra de armas no meio de baixo** no celular, liberando o canto esquerdo para o analógico.
- **Analógico nasce onde você tocar** em qualquer ponto da metade esquerda da tela (fora do radar, da Suprema e da barra de armas). Parado, ele fica apagado; com o dedo, acende.
- **Botões maiores** (corrida, esquiva, Suprema e pausa) e com **contorno branco** para enxergar em cima de qualquer chão.
- **Etiqueta da versão menor** e mais discreta no canto da tela.

## [v0.13.0 — Abismo Agitado] — 2026-11-20

### Resumo para o Jogador
- **Modo Infinito mais difícil no fim da partida** (antes, com a build pronta, dava para ficar parado sem morrer):
  - **Monstros crescem cada vez mais rápido:** aos 10 min têm ~5x a vida e 3x o dano do começo; aos 20 min, ~14x a vida e ~7x o dano (antes era 2,6x e 1,8x aos 10 min). Morcegos e slimes agora também batem mais forte com o tempo, e depois dos 8 min a horda nasce mais rápido.
  - **Pressão do Abismo:** ficar parado no mesmo lugar deixa todos os monstros mais fortes (causam mais dano e aguentam mais): +10% aos 10 s, +15% aos 20 s, +25%, +40%, +60%... sem teto. Sair de perto do ponto onde parou zera. Aos 5 s parado aparece um aviso amarelo; com o castigo ativo, um aviso vermelho no topo. Passinhos no lugar não enganam: conta a distância do ponto onde parou. Só no Modo Infinito.
  - **Canalizar cura 40% da vida máxima** (antes, 20 fixos): pular a carta no level-up passa a valer a pena também no fim da partida. O botão mostra "+40%".
  - **Roubo de vida com teto:** cura no máximo 4 de vida por segundo. Com muitos projéteis, ele curava mais do que os monstros conseguiam tirar.
- **Menu de pausa novo:** agora mostra o resumo da partida: modo e capítulo, tempo, abates, nível, almas, todos os bônus ganhos com cartas (com o ícone de cada carta) e as armas equipadas com o nível. Moldura de arte nova (cristais e chifres nos cantos, crânio com asas no topo), placa do título e botões desenhados, no mesmo violeta do painel da Nixy. O texto dos botões não fica mais preto ao passar o mouse; o botão selecionado cresce e acende uma luz suave por trás.
  - Clicar num bônus ou numa arma abre uma janela explicando o que ele faz, com o ícone em destaque e um X para fechar.
  - Reiniciar e Menu pedem confirmação antes, avisando que o progresso da partida se perde (as almas ficam guardadas).
- **Todas as cartas com ícone:** Alma Extra, Perfuração, Vigor, Olho Abissal, Golpe Fatal, Passo Sombrio, Alma Instável e Sede de Sangue ganharam ícone próprio no meio da carta (antes ficavam vazias).
- **Painel da Nixy novo:** moldura violeta de obsidiana e cristal, no lugar da pedra com lava. As barras de vida e estamina ficam por trás da moldura, que cobre as pontas delas, então tudo parece uma peça só. O logo NIXY fica por cima da moldura, o nível fica acima da barra de vida, e o painel foi um pouco para a esquerda para a mão do retrato não esconder o fim das barras.
- **Monstros não somem mais atrás dos altares:** o Altar de Invocação e o Altar de Evolução são plataformas no chão; agora qualquer monstro que passa por cima deles aparece na frente, em vez de ficar escondido atrás.

## [v0.12.4 — iPhone de Verdade] — 2026-11-17

### Resumo para o Jogador
- **HUD quebrando no iPhone:** no Safari do iPhone, tudo que é desenhado por código (barras de vida e estamina, minimapa, molduras da barra de armas, menu de pausa) sumia enquanto imagens e textos continuavam. Causa provável: o jogo pedia ~200 MB de memória de vídeo e o Safari descartava o WebGL. Correções:
  - **Metade da memória:** cenas da história, fundo do menu e pisos antigos estavam muito maiores do que aparecem na tela; agora ~100 MB no total (originais guardados em `art-source/originais-alta-resolucao/`).
  - **Rede de segurança:** se o aparelho perder o WebGL mesmo assim, ele passa a usar o modo compatível (Canvas) e recarrega, em vez de ficar com a tela quebrada. Dá para forçar pelo link: `?render=canvas` (ou voltar com `?render=webgl`).
- **Tela certa no iPhone:** o jogo usa só a área realmente visível (não fica mais atrás das barras do Safari) e respeita o notch e os cantos arredondados; arrastar o dedo não rola mais a página.
- **Controles de toque:**
  - Botão da Suprema ao lado do analógico (em cima e à direita), maior; tocar nele não puxa o analógico.
  - Botão de pausa maior.
  - Corrida e esquiva subiram para cima do retrato da Nixy (não ficam mais na frente dela).
  - Minimapa 45% maior no celular.
## [v0.12.3 — Tela Cheia no Celular] — 2026-11-17

### Resumo para o Jogador
- **Sem borda preta no celular.** O jogo agora estica a largura para o formato da tela (de 16:9 até 21:9), mantendo a altura: tudo continua do mesmo tamanho, você só enxerga um pouco mais do mapa nos lados. No PC 16:9 nada muda.
- **Girou o celular no menu?** O jogo se reajusta sozinho ao novo formato (no meio da partida ele só reescala, para não perder o progresso).
- **Joystick longe da borda:** a posição de descanso fica mais para dentro e acima da barra de armas; mesmo tocando bem no canto, ele nasce afastado da borda e volta para o lugar ao soltar o dedo. Os botões da direita também ficaram mais para dentro.
- **No celular some o rodapé de teclas** ("[WASD] Mover..."), que não serve para toque.
## [v0.12.2 — Ninguém Fica Preso] — 2026-11-17

### Resumo para o Jogador
- **Monstros não travam mais entre objetos.** Tocha e candelabro (só um poste fino) deixaram de bloquear; os objetos sólidos de cada conjunto ficam com um vão largo entre si; e um monstro que passa mais de 1 segundo encostado sem conseguir sair atravessa o cenário por um instante e segue.
- Teste: 30 cães nascendo atrás de um sarcófago e de um grupo de rochas chegaram todos até a heroína em até 6 segundos.
## [v0.12.1 — Obstáculos de Verdade] — 2026-11-17

### Resumo para o Jogador
- **Objetos grandes do cenário bloqueiam a passagem:** pilar, arco (só as duas pernas; dá para passar pelo vão), estátua, sarcófago, rochas grandes e médias, altar de caveiras, gaiola e braseiro.
- Só a **base** do objeto é sólida, como numa vista de cima: dá para passar por trás da parte alta.
- **Monstros comuns também batem nos objetos** e contornam pelo lado em vez de ficarem presos. Dá para usar pilares e sarcófagos para segurar a horda.
- **Chefes atravessam o cenário,** para investidas e teleportes não travarem.
## [v0.12.0 — Catacumbas de Verdade] — 2026-11-17

### Resumo para o Jogador
- **Capítulo 1 com cenário novo** (também no Infinito e no Modo de Teste, que usam o mapa do Capítulo 1):
  - Piso novo de pedra gótica, escuro e com pouco contraste, para monstros e gemas se destacarem.
  - 16 objetos novos na mesma proporção: pilar quebrado com rosas, arco em ruína, estátua da succubus, sarcófago, altar de caveiras, gaiola, tocha de ferro, candelabro, velas, braseiro, rochas em 3 tamanhos, entulho, ossos e espinhos com rosas.
  - Conjuntos montados pelo mapa (ex.: estátua sobre círculo ritual com velas; sarcófago com candelabro e mancha de sangue; gaiola com correntes e ossos).
  - Manchas no chão espalhadas pela arena inteira (sangue, rachaduras, pétalas, cera, queimaduras, musgo, fendas de lava) e entulho miúdo (caveiras, ossos, correntes, espada, vaso, teia, pedra rúnica), para o piso não parecer repetido.
  - Tochas, candelabros, velas, braseiros e fendas de lava têm luz pulsando.
  - A Nixy passa **atrás** dos objetos altos (pilar, arco, estátua, gaiola, tocha), e eles ficam meio transparentes enquanto a cobrem.
- O Capítulo 2 continua com o cenário antigo até chegar o kit dele.

### Organização do Projeto
- Novo `src/systems/ChapterDecorSystem.ts` (troca das peças antigas, conjuntos, manchas, luzes, profundidade e corte do que está fora da tela) e `src/config/sceneryCatalog.ts` (peças, camadas, trocas e conjuntos).
- Arte recortada em `public/assets/sprites/scenery/ch1/` e `public/assets/textures/floor-ch1.png` (densidade 2x, desenhada com escala 0.5); escala do piso por textura em `ARENA_FLOOR_SCALE`.
- Editor de Mapas: 20 peças novas na aba de cenário.
- Mapas salvos continuam valendo: as peças antigas são trocadas pelas novas no mesmo lugar.

### Não verificado
- Desempenho em celular com o cenário mais cheio (no PC ficou estável).
## [v0.11.3 — Caça ao Ladrão] — 2026-11-17

### Resumo para o Jogador
- **O Ladrão de Almas agora é fácil de achar.** Ele aparece no minimapa como uma estrela dourada pulsando (presa na borda quando está longe) e ganha uma seta dourada na borda da tela com a distância e os segundos que faltam para ele fugir. O anúncio diz "SIGA A SETA DOURADA".
- **Setas de borda mais legíveis:** a ponta da seta agora sai de fora da plaquinha de distância (antes ficava escondida atrás dela), também para os altares e cristais.
## [v0.11.2 — HUD Mais Limpa] — 2026-11-17

### Resumo para o Jogador
- **A Suprema mora num lugar só.** O frasco da Suprema saiu do painel da direita; agora ela fica no primeiro espaço da barra de armas, maior que os outros, com uma tecla desenhada no canto (E no teclado, Y no controle; no celular some porque o botão já está na tela). Quando fica pronta, a tecla cresce, acende e pulsa. Clicar no ícone também ativa a Suprema. A tecla fica centralizada embaixo do ícone, por cima de tudo, com a mesma moldura quadrada dos espaços.
- **Barras de vida e estamina mais largas**, ocupando o espaço que era do frasco.
- **Botões da tela de cartas redesenhados:** só ícone, nome e a tecla do controle em uso (R / X para re-rolar, ESPAÇO / B para canalizar). O número de cargas aparece no canto do ícone; sem cargas, o botão fica apagado.
## [v0.11.1 — Ícones de Verdade] — 2026-11-17

### Resumo para o Jogador
- **Barra de armas na HUD** (canto inferior esquerdo): mostra a Suprema (escurece enquanto carrega, borda pulsando quando pronta) e cada arma equipada com seu ícone, o nível em pontinhos e moldura dourada quando evoluída.
- **Cartas de Level Up com ícone:** armas, evoluções e bênçãos de atributo ganharam o ícone pintado no meio da carta, com brilho pulsando.
- **Altar de Bênçãos com medalhões:** cada bênção tem seu ícone; fica apagado enquanto está no nível 0.
- **HUD com ícones novos:** caveira de abates, chama de almas, ampulheta no cronômetro do Infinito e seta de nível.
- **Botões da tela de cartas** (re-rolar e canalizar) com ícones.

### Arte
- Recortadas e colocadas no jogo: 13 ícones de armas e Suprema (já vieram recortados), 6 bênçãos e 10 ícones de interface (recortados das folhas `Bençãos.jpg` e `UI Icons.jpg`, fundo removido por código).
- Ainda sem uso no jogo: engrenagem, sinos de som e cadeado (prontos em `public/assets/sprites/icons/ui/` para os menus).
- Ainda faltam as folhas de HUD e de itens (`docs/ART_PROMPTS.md` §10 e §11).

### Organização do Projeto
- Novo `src/ui/WeaponSlotsHud.ts`, `src/config/iconKeys.ts` (lista dos ícones carregados), `CARD_ICON_KEYS` e `getWeaponIconInfo` em `UpgradeCatalog.ts`, cores em `WEAPON_SLOT_THEME`.
## [v0.11.0 — Ascensão Infernal] — 2026-11-17

### Resumo para o Jogador
- **Suprema nova: Ascensão Infernal.** Ela não congela mais a horda nem solta detonações. Agora a Nixy entra num modo de poder por 8 segundos:
  - as armas trabalham ~90% mais rápido (mais tiros, foices girando mais rápido, aura pulsando mais vezes, meteoros e correntes com mais frequência);
  - +50% de dano e +35% de velocidade;
  - explosão ao ativar (empurra e fere quem está perto), um pulso de fogo por segundo e uma explosão final ao acabar;
  - aura de chamas, runa girando sob os pés, rastro fantasma laranja, bordas da tela escurecidas e um contador regressivo sobre a cabeça. O frasco da HUD esvazia junto com o tempo.
  - A horda continua vindo durante a Suprema (antes parava), então é hora de colher abates e combo.
  - Fica intocável durante a animação de ativação.
- **Quatro itens novos no mapa:**
  - **Bomba Infernal:** explosão gigante em volta da Nixy (dano alto nos monstros, menor nos chefes).
  - **Ampulheta Partida:** paralisa toda a horda ao redor por 4,5 segundos.
  - **Frasco de Fúria:** enche a Suprema na hora.
  - **Relíquia Dourada:** espalha um anel de gemas e um punhado de almas.
  - Os itens agora saem por sorteio com peso: cálice, ímã e baú continuam os mais comuns.
- **Arte provisória:** os itens novos usam desenhos feitos por código até chegar a arte final.

### Arte pedida
- `docs/ART_PROMPTS.md` §10: prompt da folha de HUD nova (16 peças: painel, barras de vida, estamina e XP, frasco da Suprema, radar, ícones, emblema de combo, barra de chefe e faixa de alerta).
- `docs/ART_PROMPTS.md` §11: prompt da folha de itens (cálice, ímã e baú refeitos, os 4 itens novos, almas, as 6 gemas, baú aberto e a runa da Suprema).

### Organização do Projeto
- `UltimateSystem.ts` reescrito como instância por partida (`IUltimateContext`); números em `ULTIMATE_BALANCE`.
- `BaseCharacter.weaponHasteMultiplier` acelera o relógio de todas as armas; `grantIntangibility` reaproveita a proteção da esquiva.
- `src/systems/mapItemRules.ts` (sorteio puro dos itens), `src/systems/PlaceholderItemTextures.ts` (arte provisória), pesos e efeitos em `BALANCE.MAP_ITEMS`, cores em `ITEM_COLORS`.
- Modo de Teste: botões dos 4 itens novos (aba 4); galeria com os 4 itens.
- Catraca de cores 1099 → 1081. Testes: 237 passando.

### Não verificado
- Sensação da Suprema nova em luta de chefe (testada contra horda comum no navegador).
## [v0.10.1 — Combo que Pega Fogo] — 2026-11-17

### Resumo para o Jogador
- **Gemas nunca mais somem nem param de cair.** Antes, com 150 gemas no chão, os monstros paravam de soltar gema nova e o XP ia para gemas distantes, obrigando a voltar para catar. Agora toda gema existe sempre: as que ficam longe da tela são guardadas só como posição e reaparecem quando você passa por perto. O Ímã de Almas puxa todas, inclusive as guardadas.
- **Contador de combo grande e "vivo".** O número ficou bem maior e cresce conforme o combo sobe. A cada degrau muda de cor (amarelo → laranja → vermelho → rosa → branco), passa a tremer e balançar cada vez mais, solta faíscas a cada abate e entra com um carimbo e explosão quando chega num degrau novo. A barra do tempo pisca quando está acabando, e o número fica cinza quando o combo quebra.
- **Números de dano mais fortes.** Estouram grandes e saem voando em arco para o lado; golpes altos aparecem maiores e dourados.
- **Crítico de verdade.** Número enorme, torto, com degradê dourado-laranja, que treme, segura na tela e sobe; clarão em estrela no ponto do golpe, mais faíscas e um tranco curto na câmera. Mesmo com a tela cheia de números, o crítico sempre aparece.

### Organização do Projeto
- **Novo `src/systems/GemReserve.ts`** (lógica pura, 5 testes): depósito das gemas fora da tela. Limites em `PERFORMANCE_LIMITS` (`MAX_STORED_GEMS`, `GEM_PARK_MARGIN`, `GEM_PARK_INTERVAL_MS`, `MAGNET_MAX_STORED_GROUPS`). Desempenho: no máximo 150 gemas com sprite, como antes.
- **Testes:** 232 passando.

### Não verificado
- Sensação em partida longa real (testado com comandos no navegador de desenvolvimento).
## [v0.10.0 — Frenesi] — 2026-11-16

### Resumo para o Jogador
- **Combo de abates.** Matar em sequência faz um contador crescer no canto direito da tela. Cada degrau (10, 25, 50, 100 e 200 abates seguidos) tem nome próprio e dá bônus de XP de +5% até +50%. Ficar 3,2s sem matar zera o combo.
- **Frenesi.** A cada 50 abates seguidos a heroína entra em Frenesi por 6s: +40% de dano, +20% de velocidade, aura de fogo e tela piscando.
- **Esquiva (novo botão).** Espaço no teclado, (A) ou LB no controle e um botão azul novo no celular. É uma arrancada curta que gasta 25 de fôlego e deixa a heroína intocável durante o movimento, inclusive contra golpes de chefe. O Sprint agora é só no Shift.
- **Golpes críticos.** Toda arma tem 5% de chance de causar dano dobrado, com número dourado maior e som próprio.
- **Cinco cartas novas:** Olho do Abismo (+8% de crítico), Golpe Fatal (críticos mais fortes), Passo Sombrio (a esquiva fere quem atravessa e gasta menos fôlego), Alma Instável (monstros podem explodir ao morrer e encadear explosões) e Sede de Sangue (combo e Frenesi duram mais).
- **Eventos de horda.** A cada 40 a 50 segundos a partida muda de ritmo: Cerco Infernal (anel de cães fechando), Emboscada (tudo vem de um lado só), Ladrão de Almas (um cão dourado que foge; quem o abate em 15s leva chuva de gemas, almas e às vezes um baú), Matilha Alfa e Lua de Sangue (20s de horda quase em dobro com XP em dobro).
- **Capítulo 2 com identidade própria.** Tempestade de Azazel: raios avisados no chão caem durante todo o capítulo e ferem a heroína e também os monstros, então dá para atrair a horda para dentro do raio. Cães Alfa Elite, Matilha Alfa e Lua de Sangue só aparecem do Capítulo 2 em diante (e no Infinito).
- **Combate mais "pesado".** Monstros recuam ao levar golpe, morrem achatados com estouro de faíscas, e subir de nível solta uma onda de choque que empurra e fere quem está perto.
- **Recorde de combo** salvo e mostrado na tela de fim de jogo.
- **Proteção contra pular carta sem querer:** como Espaço virou esquiva, a tela de Level Up ignora o Espaço no primeiro instante.

### Organização do Projeto
- **Novos sistemas:** `CombatFeelSystem.ts` (combo, Frenesi, críticos, faíscas, onda de Level Up, dano da esquiva, explosão de cadáver), `ComboTracker.ts` (lógica pura do combo), `HordeEventSystem.ts` (diretor de eventos e Tempestade de Azazel), `hordeEventRules.ts` (regras puras de quais eventos podem sair) e `ui/ComboHud.ts`.
- **Balanceamento em `balance.ts`:** `COMBO_BALANCE`, `CRIT_BALANCE`, `DASH_BALANCE`, `CORPSE_EXPLOSION_BALANCE`, `BLOODTHIRST_BALANCE`, `IMPACT_BALANCE`, `HORDE_EVENT_BALANCE`, `STORM_BALANCE` e `STORY_ELITES`.
- **Cores em `theme.ts`:** `FX_COLORS` e `CARD_RARITY_COLORS`. Catraca de cores 1103 → 1099.
- **Desempenho:** números de dano reaproveitados (pool de 48 textos) e faíscas num emissor de partículas único, no lugar de criar e destruir objetos a cada golpe.
- **Ferramentas:** eventos de horda e a rajada da tempestade têm botões na aba 2 do Modo de Teste; as cinco cartas novas entram na aba 4; o Ladrão de Almas está na galeria; combo, Frenesi e eventos são gravados no registro de sessão.
- **Save:** `stats.bestCombo` novo, com padrão 0 para saves antigos.
- **Testes:** 227 passando (11 novos em `comboAndHordeEvents.test.ts`).

### Não verificado
- Esquiva no controle físico e no botão de toque do celular (testada só por código no navegador de desenvolvimento).
- Sensação de dificuldade do Capítulo 2 numa partida completa até o Azazel.
## [v0.9.20 — Contrato da GameScene Tipado] — 2026-11-15

### Resumo para o Jogador
- **Nada muda na jogabilidade.** É uma arrumação interna que faz o computador avisar sozinho quando uma mudança futura quebrar cartas, Modo de Teste, gravador de sessão ou Editor de Mapas.

### Organização do Projeto
- **Avisos do lint: 54 → 0.** A catraca agora é `--max-warnings 0`: qualquer `any` novo trava o commit.
- **Contratos estreitos no lugar de `any`**: `UpgradeGameScene` (o que as cartas usam: a cena e a lista de armas), `IAutoPlayWorld` (o que o bot [F3] enxerga), `ILoggerWorld` (o que o gravador de sessão lê), `MapItemHostScene` (o que cálice, ímã e baú usam) e `EquippedWeapon` (o que ferramentas podem perguntar a uma arma).
- **Poças de veneno** tipadas como `PoisonPuddle`; aviso de instalação (PWA) e vibração do controle sem `any`.
- **Editor de Mapas** fala com a `GameScene` pelos métodos reais (`setArenaFloorTexture`, `setHUDVisible`) em vez de checar "às cegas" se existem.- **Chão por capítulo**: a cor do chão agora é definida por capítulo em `theme.ts` (`ARENA_FLOOR_TINT`). O Capítulo 2 ficou mais frio e escuro, mas a diferença é discreta porque a textura ainda é a mesma pedra vermelha; a identidade de verdade depende das artes novas listadas em `docs/ART_PROMPTS.md` (seção 9.1).
## [v0.9.19 — Lutas de Chefe Justas] — 2026-11-15

### Resumo para o Jogador
- **Azazel agora pode ser vencido.** Havia um defeito na fase dos cristais: purificar um cristal não contava, então a luta nunca saía daquela fase. Corrigido.
- **Rosalin bate menos forte por golpe.** Antes o salto esmagador tirava 77 de vida e a investida 53 (a heroína começa com 100): dois erros e era o fim. Agora são 42 e 30, os orbes caíram de 26 para 12 e o contato de 35 para 20. Os avisos no chão continuam iguais, então a luta segue exigindo desviar.
- **Azazel:** investida e raios, que dão para desviar, passaram de 14 para 18. Os orbes continuam fracos porque são muitos na tela. As investidas no escuro agora avisam por 0,42s (era 0,36s) e travam a mira na metade final.
- **Fôlego entre as fases do Azazel:** um Cálice de Cura aparece ao entrar na fase dos cristais e outro ao voltar para o duelo final.
- **Chefe cansa em luta longa.** Se a sua build causa pouco dano e a luta passa de 1min40 (Rosalin) ou 3min (Azazel), o chefe começa a receber dano extra, aumentando a cada 15s. Um aviso aparece na tela. Builds fortes nem chegam a ver isso.
- **Revanche mais leve no Modo História.** Cada morte para o mesmo chefe tira 7% da vida e 5% do dano dele na próxima tentativa (até 4 mortes, ou seja, no máximo -28% de vida e -20% de dano).
- **Reforços da Rosalin** vêm a cada 11s (era 8,5s) e só depois que a luta começa de verdade.

### Organização do Projeto
- **Novo `src/systems/BossFightSystem.ts`**: Altar de Invocação, entradas cinematográficas, diálogos de revanche, música, reforços, fases do Azazel, recompensas e fim de capítulo saíram da `GameScene.ts`.
- **Novo `src/systems/RunEndSystem.ts`**: morte, Pacto Demoníaco, registro de recordes e tela de Game Over.
- **`GameScene.ts`: 2.051 → 1.267 linhas.**
- **Balanceamento em `balance.ts`**: os danos e tempos da Rosalin estavam escritos direto no código da chefe; agora moram em `SUCCUBUS_BOSS_BALANCE.attacks`. Novos blocos `BOSS_FATIGUE`, `BOSS_MERCY` e `REVIVAL_BALANCE`.
- **Chefes recebem `BaseCharacter`** em vez de assumir que o jogador é a Nixy.
- **Testes: 171 → 213**, incluindo regras de justiça (nenhum golpe da Rosalin tira mais de 45% da vida base; golpe mais forte é o mais telegrafado).## [v0.9.18 — Limpeza do Lint e Tipos] — 2026-11-15

### Resumo para o Jogador
- **Nada muda na jogabilidade.**

### Organização do Projeto
- **Avisos do lint: 138 → 54.** Saíram imports e variáveis sem uso, valores iniciais que nunca eram lidos e blocos vazios sem explicação (agora comentados com o motivo).
- **Tipos no lugar de `any`**: `BaseEnemy` declara `isBoss` e `isInvulnerable` (antes lidos "às cegas" por armas e pelo atordoamento), `ZombieDog` declara `isSpecialMiniBoss` (Titã Cerberus), e som, HUD, Azazel, múmia e itens deixaram de usar `any`.
- **Pendente:** os `any` restantes vêm do contrato solto da `GameScene` usado pelas cartas, Modo de Teste, logger e Editor de Mapas.
## [v0.9.17 — Props do Mapa no Sistema de Cenário] — 2026-11-14

### Resumo para o Jogador
- **Nada muda na jogabilidade.** Os mapas carregam os mesmos objetos de cenário.
- **Modo de Teste:** o botão do Editor de Mapas agora usa a fonte pixel do jogo (antes tinha um emoji, que alguns aparelhos mostram como quadrado).

### Organização do Projeto
- **`ArenaScenerySystem.placeMapProps`**: a colocação dos objetos de um mapa salvo saiu da `GameScene.ts` (2.080 → 2.051 linhas), com teste novo (171 testes no total).
## [v0.9.16 — Controles em Sistema Próprio] — 2026-11-14

### Resumo para o Jogador
- **Nada muda na jogabilidade.** Teclado, controle (gamepad), toque na tela e o bot de testes [F3] movem a heroína do mesmo jeito.

### Organização do Projeto
- **Novo `src/systems/PlayerInputSystem.ts`**: junta os quatro tipos de controle em um só vetor de movimento, com a mesma prioridade de antes (bot > toque > gamepad > teclado). `GameScene.ts` caiu de 2.140 para 2.080 linhas.
- **Lint**: 2 `any` a menos; limite de avisos baixado de 140 para 138.
## [v0.9.15 — Coletáveis Atualizados pelo Próprio Sistema] — 2026-11-14

### Resumo para o Jogador
- **Nada muda na jogabilidade.** Gemas e almas continuam sendo atraídas e coletadas igual, e os itens de mapa seguem surgindo a cada 40 segundos (no máximo 4).

### Organização do Projeto
- **`PickupSpawnSystem.update`**: a atualização por quadro de gemas, almas, itens de mapa e Altar de Ascensão saiu do `update()` da `GameScene.ts` (2.198 → 2.140 linhas).
- **Balanceamento em `balance.ts`**: XP de cada cor de gema (`BALANCE.XP.gemValues`) e o relógio de itens de mapa (`BALANCE.MAP_ITEMS`), antes números soltos no código. Novo teste `pickupBalance.test.ts` (170 testes no total).
## [v0.9.14 — Drops e Itens em Sistema Próprio] — 2026-11-14

### Resumo para o Jogador
- **Nada muda na jogabilidade.** Gemas, almas, itens de mapa e o Altar de Ascensão surgem e funcionam igual.

### Organização do Projeto
- **Novo `src/systems/PickupSpawnSystem.ts`** (contrato `IPickupSpawnContext`), no mesmo formato do `EnemySpawnSystem`. A tabela de XP por cor de gema virou uma lista única (`GEM_XP`). `GameScene.ts` caiu de 2.333 para 2.198 linhas.
## [v0.9.13 — Painel de Status em Arquivo Próprio] — 2026-11-14

### Resumo para o Jogador
- **Nada muda na jogabilidade.** Retrato, barras de vida e estamina e o medidor da Suprema funcionam igual, incluindo o clique no frasco e a tecla [E].

### Organização do Projeto
- **Novo `src/ui/StatusPanelHud.ts`** com o contrato `IStatusPanelPlayer` (o painel não assume mais que o jogador é a Nixy pelo tipo). `UIScene.ts` caiu de 914 para 587 linhas, menos de um terço do tamanho do início do Pacote E (2.159).
- **Lint**: 3 `any` a menos; limite de avisos baixado de 143 para 140.
## [v0.9.12 — Topo da HUD em Arquivo Próprio] — 2026-11-14

### Resumo para o Jogador
- **Nada muda na jogabilidade.** A barra de purificação, a barra de vida do chefe e o cronômetro do Infinito aparecem igual.

### Organização do Projeto
- **Novo `src/ui/TopCenterHud.ts`**, com o contrato tipado `ITopCenterHudWorld` no lugar de leituras soltas da `GameScene`. `UIScene.ts` caiu de 1.088 para 914 linhas.
## [v0.9.11 — Anúncios de Tela em Arquivo Próprio] — 2026-11-14

### Resumo para o Jogador
- **Nada muda na jogabilidade.** As frases de Azazel, os alertas de onda e os anúncios dourados aparecem igual.

### Organização do Projeto
- **Novo `src/ui/ScreenAnnouncer.ts`**: frase de chefe no centro, faixa de alerta de onda e anúncio dourado de evento saíram da `UIScene.ts` (1.351 → 1.088 linhas). A `UIScene` mantém `showCenterBossPhrase`, `showWaveAlert` e `showCenterAnnouncement` como fachadas.
## [v0.9.10 — Roleta do Baú em Arquivo Próprio] — 2026-11-14

### Resumo para o Jogador
- **Nada muda na jogabilidade.** A roleta do Baú do Abismo gira, pula e entrega a bênção igual.

### Organização do Projeto
- **Novo `src/ui/ChestRouletteModal.ts`**: a roleta saiu da `UIScene.ts` (1.696 → 1.351 linhas), seguindo o mesmo formato dos modais de Pausa e Game Over. A `UIScene` mantém as mesmas funções de acesso (`showChestRoulette`, `isChestRouletteActive`, `resolveChestRoulette`), e o tipo `any` da cena de jogo virou o contrato `IChestRouletteGameScene`.
- **Lint**: limite de avisos baixado de 144 para 143.
## [v0.9.9 — Radar em Arquivo Próprio] — 2026-11-14

### Resumo para o Jogador
- **Nada muda na jogabilidade.** O radar e a seta que aponta para o altar funcionam igual.

### Organização do Projeto
- **Novo `src/ui/TacticalRadar.ts`** (minimapa circular) e **`src/ui/AltarEdgeIndicator.ts`** (seta de borda com a distância até cristal, altar de invocação ou altar de ascensão), com o contrato tipado em `src/ui/radarTypes.ts`. `UIScene.ts` caiu de 2.159 para 1.696 linhas.
- **Lint**: 8 `any` a menos; limite de avisos baixado de 152 para 144.
## [v0.9.8 — Sons Organizados por Tema] — 2026-11-14

### Resumo para o Jogador
- **Nada muda na jogabilidade nem no som.** Todos os efeitos sonoros são os mesmos.

### Organização do Projeto
- **`SoundManager.ts` dividido** (1.693 → 447 linhas): os 39 efeitos sintetizados foram para `src/systems/audio/` em cinco arquivos por tema (`uiSfx`, `dialogueSfx`, `combatSfx`, `cutsceneSfx`, `weaponSfx`). O `SoundManager` continua sendo a única porta de entrada, com os mesmos métodos; ele só cuida de volume, canal de saída e limitadores de repetição (digitação, dano, batimento).
## [v0.9.7 — Roteiro e Catálogo de Cartas em Arquivos Próprios] — 2026-11-13

### Resumo para o Jogador
- **Nada muda na jogabilidade.** Falas e cartas são exatamente as mesmas.

### Organização do Projeto
- **Novo `src/config/dialogues.ts` (roteiro)**: todas as falas do Modo História saíram da `GameScene.ts` (abertura dos capítulos, primeiro encontro com Rosalin e Azazel, falas de ressurreição e de revanche). Para mudar um texto, basta editar esse arquivo. `GameScene.ts` caiu de 2.862 para 2.333 linhas.
- **Novo `src/systems/UpgradeCatalog.ts`**: o catálogo de cartas de Level Up e de Evolução de Altar saiu da `UpgradeScene.ts`, que caiu de 1.528 para 762 linhas e agora só desenha e anima as cartas.
- **Novo teste `dialogues.test.ts`**: garante que toda fala tem texto, falante e retrato, e que ressurreição e revanche existem para qualquer número de mortes (168 testes no total).

## [v0.9.6 — Sistema de Spawn Separado & Limpeza de Assets] — 2026-11-13

### Resumo para o Jogador
- **Nada muda na jogabilidade.** O jogo fica cerca de 2,7 MB mais leve para baixar.

### Organização do Projeto
- **Novo `src/systems/EnemySpawnSystem.ts`**: toda a criação de inimigos comuns, elites e minichefes e a composição das ondas por fase saíram da `GameScene.ts` (418 linhas a menos), ligadas pelo contrato `IEnemySpawnContext`. A cena mantém fachadas de 1 linha.
- **Assets duplicados removidos de `public/`**: 12 arquivos idênticos a outros e sem nenhuma referência no código (cópias de gemas, retratos, ícone e uma segunda cópia da textura do chão).
- **Lint**: imports sem uso removidos; limite de avisos baixado de 154 para 152.
- **`MusicDirector`**: os timers do navegador foram mantidos de propósito (a música atravessa cenas e segue o relógio real); a exceção está registrada na regra 3 do `AGENTS.md`.

## [v0.9.5 — Organização, Balanceamento Centralizado & Correção de Tela Preta] — 2026-11-13

### Resumo para o Jogador
- **Tela preta ao abrir o jogo**: corrigido o caso em que o jogo carregava com a aba em segundo plano (ou num app que ainda estava abrindo) e ficava com a tela toda preta até redimensionar a janela.
- **Nada muda no combate**: inimigos e chefes têm exatamente a mesma vida, velocidade e dano de antes.

### Organização do Projeto
- **Atributos de inimigos e chefes centralizados (`src/config/balance.ts`)**: criadas as tabelas `ENEMY_BALANCE` e `SUCCUBUS_BOSS_BALANCE`. `GameScene.ts` e `SandboxController.ts` não têm mais números de HP, velocidade e dano escritos direto no código. Novo teste `enemyBalance.test.ts` protege a hierarquia de ameaça (comum < minichefe < chefe).
- **Correção em `src/main.ts`**: um `ResizeObserver` reajusta o canvas quando o contêiner muda de tamanho.
- **Código morto removido**: `src/entities/enemies/Succubus.ts` (nunca era usado).
- **Documentação enxugada**: `AGENTS.md` reescrito (papéis de dono e programadora, 13 regras técnicas); removidos `README_ANALISE.md`, `docs/DEVELOPMENT_RULES.md`, `docs/TIMELINE.md`, `docs/RELEASE_CHECKLIST.md`, `docs/BALANCE_AUDIT.md`, `docs/GUIA_DO_DONO.md` e a pasta `.agent/`. `docs/MECHANICS.md` deixa de repetir números e aponta para `balance.ts`.
- **Novo `docs/ART_PROMPTS.md`**: prompts prontos para gerar ícones, efeitos de ataque, animações de chefes, inimigos e cenário no estilo do jogo.

## [v0.9.4 — Pacote UI, Organização de Repositório & Balanceamento de Azazel] — 2026-10-21

### Resumo para o Jogador
- **Balanceamento do Chefe Azazel**: O dano de contato e de todas as habilidades mágicas e tiros do Boss Azazel (Capítulo 2) foram reduzidos em 70%, tornando a batalha mais justa e equilibrada.
- **Roleta do Baú do Abismo**: Agora é possível avançar/pular a animação da roleta com segurança pressionando Espaço, Enter ou clicando em qualquer lugar da tela (inclusive no fundo escuro), sem risco de travamento. O Bot de testes [F3] agora também avança sozinho.
- **Interface e Modais**: Os menus de Pausa, Fim de Jogo e Vitória de Capítulo foram padronizados numa moldura compartilhada sem alterar o visual clássico do jogo, preparando o terreno para futuras personalizações de estilo.
- **Proteção dos Arquivos Originais**: Músicas, sprites e fontes brutas agora ficam salvos e protegidos no repositório através de Git LFS.
### Refatoração & Arquitetura (Pacote UI & Organização)
- **Extração de Modais da `UIScene.ts` para `src/ui/` (`ModalFrame.ts`, `PauseMenu.ts`, `GameOverModal.ts`, `ChapterVictoryModal.ts`)**:
  - Criação do construtor de moldura compartilhada `createModalFrame` em `src/ui/ModalFrame.ts` e centralização de todos os tokens cromáticos dos modais em `MODAL_THEME` dentro de `src/config/theme.ts`.
  - Extração completa do `PauseMenu`, `GameOverModal` e `ChapterVictoryModal` para `src/ui/` sem nenhum `any` novo, reduzindo a `UIScene.ts` em ~862 linhas (de 3.027 para 2.165 linhas) e mantendo 100% da API pública e aparência original.
  - Redução da catraca de cores fora do tema (`verify-theme`) de 1194 para 1107 literais (-87 cores hardcoded) e redução da catraca do ESLint de 159 para 154 avisos.
  - 5 novos testes unitários de contrato em `src/__tests__/uiModals.test.ts` (suíte total expandida para 17 arquivos e 158 testes, 100% aprovados).
- **Organização da Raiz e Proteção de Fontes Brutas em `art-source/` com Git LFS**:
  - Unificação de `Sprites/`, `Sounds/` e `fontes/` dentro de `art-source/` rastreado com **Git LFS** (`.gitattributes`), garantindo que os 20,7 MB de áudio original nunca sejam perdidos ao formatar o PC.
  - Arquivamento externo das pastas legadas (`backups/`, `backup_v0.7.5/`, `backup_v0.8_pre_azazel/`, `scratch/`) em `D:\HellSurvivor_arquivo`.

### Balanceamento de Combate (Capítulo 2)
- **Redução de 70% no Dano Base e Habilidades do Chefe Azazel (`src/config/balance.ts`, `AzazelBoss.ts`, `GameScene.ts`)**:
  - Centralização das constantes do chefe Azazel em `AZAZEL_BOSS_BALANCE` no `src/config/balance.ts` (Regra 4).
  - Redução de 70% em todos os valores de dano base e habilidades de Azazel: contato principal (`42 -> 13`), contato dos clones espectrais (`32 -> 10`), rajada direcionada (`30 -> 9`), orbes pós-teleporte (`28 -> 8`), investida rápida (`46 -> 14`), tempestade de raios (`48 -> 14`), barragem em espiral (`26 -> 8`), 5 avanços na escuridão (`38 -> 11`) e tiros dos 8 clones (`25 -> 8`).

### Correções de Jogabilidade & Interface (UI)
- **Correção de Crash ao Pressionar Espaço na Roleta do Baú (`UIScene.ts`)**:
  - *Defeito*: Pressionar a barra de Espaço ou Enter enquanto a roleta de bênçãos do Baú do Abismo estava girando tentava finalizar a coleta prematuramente enquanto um timer assíncrono de rolagem (`this.time.delayedCall`) ainda estava agendado. Ao disparar, chamava `setText` em `headerText` já destruído, gerando o erro fatal `TypeError: Cannot read properties of null (reading 'drawImage')` dentro de `Frame.updateUVs` do Phaser.
  - *Correção*: Implementado o fluxo seguro de "Pular para o Prêmio" (`revealPrizeNow`): se o jogador pressionar Espaço, Enter ou clicar na tela antes do término, a roleta é interrompida imediatamente, os textos temporários são limpos e o prêmio sorteado é revelado no centro com a devida fanfarra e descrição. Um debounce curto de proteção (180ms) impede que toques repetidos fechem o modal sem que o jogador veja a bênção sorteada. Foram adicionadas guardas estritas contra execução de timers sobre instâncias destruídas (`!modal.scene || !headerText.scene`).
- **Confirmação e Coleta ao Clicar Fora / em Qualquer Área (`UIScene.ts`)**:
  - O fundo escuro translúcido (`backdrop`) agora possui cursor de clique interativo (`useHandCursor: true`) e escuta eventos de clique (`pointerdown`). O jogador pode clicar em qualquer lugar da tela tanto para pular o sorteio quanto para coletar a bênção concedida.
- **Resolução Autônoma do Bot [F3] no Baú (`AutoPlayTestAgent.ts` & `UIScene.ts`)**:
  - O Bot AI de testes agora detecta a roleta aberta durante o loop de `UIScene.update()` e avança automaticamente (com tempo de reação simulado de 250ms), pulando a animação e coletando o item sem travar ou interromper partidas no modo infinito/história.
- **Testes Unitários de Contrato (`src/__tests__/chestRoulette.test.ts`)**:
  - 7 novos testes unitários validando a reação do bot, o avanço e coleta em etapas, a janela de debounce anti-missclick, a proteção contra execução em objetos destruídos e a limpeza de eventos no descarte do modal (suíte total expandida para 152 testes, 100% aprovados).

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
