# Changelog — Hell Survivor (`docs/CHANGELOG.md`)

Todas as mudanças relevantes, pacotes de refatoração, correções de bugs e novas funcionalidades deste projeto são documentadas neste arquivo.

## [Não publicado] — 2026-11-26

### Prólogo do Capítulo I: a fuga pelo corredor do RH

#### Resumo para o Jogador
- **O Capítulo I começa diferente:** depois da abertura, a Nixy sai do setor dela e atravessa um **corredor de escritório do inferno**, com bebedouro de lava, arquivos acorrentados, o quadro do "Funcionário do Milênio" e cafeteira pingando piche. Só dá para andar pelo chão (as paredes seguram).
- **O corredor é dividido em 5 salas:** chegando na ponta, a tela escurece rapidinho e ela passa para a próxima (dá para voltar também). Cada sala ocupa a tela inteira, sem emenda aparecendo.
- **Funcionários parados no caminho:** chegando perto aparece **FALAR** em cima da cabeça (E, Espaço, A/cruz, ou tocar no aviso). A conversa abre na mesma tela de diálogo da história, com a Nixy na esquerda e o colega na direita, cada um com retrato próprio: **Carlos** (demônio preto da papelada), a dupla **Lina e Gina** (aparecem lado a lado e só acende quem fala) e **Léo**, o segurança múmia.
- **Léo segura a saída:** se a Nixy tentar passar pela porta sem falar com ele, ele chama "Ei, espera aí!" e a conversa começa. Depois disso aparece uma **seta dourada balançando em cima da porta** e ela pode sair.
- **Porta de saída no fim:** ela atravessa e chega na arena por uma porta animada, encostada na **borda de cima do mapa**: ela **sobe do chão no fogo**, abre com luz de inferno lá dentro, a Nixy sai, a porta fecha e afunda de volta nas chamas. Ela desce e dá de cara com um **cão de guarda**, e os dois conversam.
- **Segurança novo** na última sala: uma múmia de uniforme de vigia. O cão late, a tela treme e a horda começa. Nesse momento as armas e a Suprema ficam paradas (nada ataca sozinho).
- **Morreu e ressurgiu:** volta do jeito de sempre (pentagrama + fala de raiva), sem corredor.
- O corredor **não tem PULAR** (decisão do dono).
- Os funcionários ficam encostados na parede, deixando o corredor livre.
- **Corrigido:** ao entrar numa sala segurando para cima, a Nixy conseguia andar por cima da parede. Ela nascia com o corpo dentro da parede, e a caixa dos pés saía do lugar quando ela começava a correr.

#### Técnico
- `scenes/PrologueScene.ts` (sem zoom; uma sala por vez ampliada por `roomScale`, troca de sala nas pontas com escurecida, só a sala atual e as vizinhas carregadas, filtro suave na arte da sala, colisão só nos pés), `config/prologueData.ts` (pedaços, faixa de chão, móveis, NPCs, saída), `systems/prologueLogic.ts` (puro, testado em `prologue.test.ts`). Conversas em `PROLOGUE_NPC_DIALOGUES` (roteiro do dono), abertas no `DialogueSystem` da própria cena.
- `DialogueSystem`: retrato ajustado sem distorcer (`fitBust`: os quadrados continuam 420x420) e dupla no lado direito (`DialogueLine.duo`, quem não fala fica com `DIALOGUE_THEME.duoDimTint`, a da direita nunca sai da tela). Retratos por `scripts/cut-prologue-portraits.py` (Carlos espelhado, Lina e Gina separadas pelo vão entre elas).
- `systems/StoryArrivalSystem.ts`: chegada na `GameScene` (`shouldPlayStoryArrival`). Enquanto ativa, a `GameScene.update` só roda a cena e `triggerUltimate` é ignorada. O cão vira um Cão Zumbi no fim, e os 4 cães de abertura saem de `spawnOpeningDogs()`.
- Arte: `scripts/cut-prologue-dog.py`, `scripts/cut-prologue-corridor.py` e `scripts/cut-prologue-door.py` (folha 8x3 da porta em tira de 16 quadros; apaga a lanterna que flutuava no 2º quadro da subida). Animações `prologue-door-rise/open/close/sink` (a afundada é a subida ao contrário). A cena nunca trava esperando a porta: cada animação tem tempo-limite. O corredor é carregado e solto pela própria cena (memória de vídeo do iPhone).
- Caixa dos pés medida a partir do centro do quadro (`syncFeetBox`: os quadros da Nixy têm 64 e 84 px), entrada na sala com o corpo todo fora da parede (`clampToWalkBand` com a altura da caixa) e trava dos pés na faixa do chão a cada passo da física (`WORLD_STEP`). O Arcade para de separar um corpo que já entrou numa parede.
- NPCs com arte própria: `scripts/cut-prologue-npcs.py` (`npc-<id>.png`), `hasArt` e `speakers` (dupla: falas `npc`/`npc2`) em `PROLOGUE_NPCS`.
- `TouchControls.setMovementOnly()`, ação `interact` nos ícones de botão, `SoundManager.playDogBark()` (sintetizado), `PROLOGUE_THEME`, `PROLOGUE_BALANCE` e `STORY_ARRIVAL_BALANCE`. Porta e cão na galeria do Modo de Teste.

### Escolha de capítulo nova (10 capítulos lado a lado)

#### Resumo para o Jogador
- **A tela de capítulos foi refeita:** os 10 capítulos ficam lado a lado como painéis com a arte do chefe de fundo. O que está em foco **abre** e mostra o título, o chefe, um mini resumo da história e o **melhor tempo**; os outros viram faixas com o número.
- **Capítulos liberam em ordem:** o I começa aberto; cada um abre quando você vence o anterior. Os que ainda não saíram aparecem bloqueados ("EM BREVE"), cinza e apagados, com cadeado.
- **Melhor tempo de cada capítulo** passa a ser guardado (vale a partir de agora).
- Quem já tinha vencido um chefe (ou chegado no Azazel) continua com o Capítulo II liberado.
- Teclado e controle: setas para escolher, confirmar para jogar, para baixo vai ao VOLTAR. Mouse: passar por cima abre, clicar joga. Toque: o primeiro toque abre, o segundo joga.
- **Tela de cartas:** o botão do controle (R, X...) agora fica colado no nome ("RE-ROLAR", "CANALIZAR"), não lá na ponta.
- **Arte nova na tela de capítulos:** fundo da Rosalin e do Azazel (cobrindo a tela atrás dos painéis e dentro do painel aberto), molduras douradas/violeta/ferro, fita do título, placa do resumo, placa do melhor tempo com ampulheta, escudo com o número, cadeado, selo de vencido, correntes e parede de pedra nos "em breve", setas e botão VOLTAR.
- **Menu principal:** os ícones dos botões (ESCOLHER, SELECIONAR, VOLTAR) agora ficam dentro do vão da barra de pedra da arte.
- "CAPÍTULO" centralizado na faixa vermelha da fita, e a ampulheta da placa do tempo não sai mais da barra.
- Capítulos "em breve": as correntes atravessam o painel de canto a canto (antes paravam no meio) e saiu a placa dourada do texto. A placa do título ficou do tamanho do nome.

#### Técnico
- `config/chapterCatalog.ts` (10 capítulos: título, chefe, resumo, `released`, `art`), `systems/chapterProgress.ts` (estado, larguras do acordeão, tempo; testados) e `ui/ChapterSelectMenu.ts`. Arte provisória = sprite do chefe; arte final carregada de `assets/sprites/chapters/` quando `art` estiver preenchido (prompt na seção 24 do ART_PROMPTS).
- Save versão 2: `chapters` (vencido + melhor tempo), gravado em `BossFightSystem.completeChapter`. Migração da v1 com backup; quem já derrotou chefe ou morreu para o Azazel fica com o Capítulo I vencido. `MenuScene.startGame` aceita qualquer capítulo.
- `ActionKeyButton`: o ícone do botão segue o nome (10 px depois), sem passar da borda.
- `scripts/cut-chapter-ui.py` recorta as 16 peças de `art-source/novos/capitulos-ui.jpg` (caixas fixas que deixam de fora os nomes que o gerador escreveu; miolo verde das molduras sai como fundo). Molduras e placa de texto são NineSlice (só WebGL; no Canvas a tela desenha por código). Artes dos capítulos em `public/assets/sprites/chapters/chapter-0N.jpg` (1400 px).
- `MenuScene`: rodapé na altura do vão da barra (`MENU_ART.footerSlotY`, medido na imagem).

## [Não publicado] — 2026-11-25

### Suprema: o jogo congela durante a animação

#### Resumo para o Jogador
- **Ao ativar a Suprema, o jogo agora pausa enquanto a animação cobre a tela** (~1 segundo): monstros, flechas, orbes e spawns param. Antes a horda continuava andando e atacando por trás da imagem, e quando ela sumia você já estava cercada.
- Quando o jogo volta, a Nixy ainda fica intocável por 0,7 segundo para dar tempo de se situar.

#### Técnico
- `UltimateSystem.isCutInPlaying`: a `GameScene.update` não roda o quadro e a física fica pausada enquanto o cut-in existe (solta no `DESTROY` dele, com teto `ULTIMATE_BALANCE.cutInMaxFreezeMs`). `castInvulnerableMs` 1300 → 700, agora contando depois do congelamento (o relógio da proteção para junto).

### Correção: partida começava com a heroína travada (jogando no controle)

#### Resumo para o Jogador
- **Jogando no controle, ao reiniciar ou começar outra partida a Nixy podia nascer sem conseguir andar**, com mensagens de erro vermelhas no canto. Corrigido.

#### Técnico
- Defeito do Phaser 3.90: com o controle num índice que não é o 0 (comum no Windows com controle de Xbox ou depois de reconectar), `GamepadPlugin.gamepads` fica com buraco e `stopListeners`/`disconnectAll` quebram ao fechar a cena. A limpeza parava no meio: a UIScene não voltava e a física ficava com colisões de grupos destruídos (`World.collideObjects ... 'entries'` a cada quadro). `systems/phaserPatches.ts` (instalado no `main.ts` antes de criar o jogo) roda esses dois métodos sem os buracos; testado, e reproduzido no navegador antes e depois.

### Câmera mais afastada e Tartarus verde

#### Resumo para o Jogador
- **A câmera ficou mais longe:** dá para ver ~25% mais mapa para cada lado (zoom 1,6 em vez de 2).
- **Os monstros continuam chegando de fora da tela:** antes, em celular largo, alguns já nasciam à vista; agora a horda, as formações e os eventos (Cerco, Emboscada, Matilha Alfa) sempre nascem logo fora da área visível, em qualquer zoom.
- **Grilhões do Tartarus com cara de evolução:** as correntes e os grilhões da arma evoluída ficaram verde espectral (antes eram iguais aos da Cadeia Abissal).
- O cut-in da Suprema continua do mesmo tamanho de antes.

#### Técnico
- `CAMERA_BALANCE` (`gameplayZoom`, `spawnViewMargin`, `overlayDesignZoom`) substitui os `2` soltos (GameScene, fim do Azazel, remover chefe no Modo de Teste).
- `systems/spawnRules.ts` (`distanceToViewEdge`, `offscreenSpawnDist`, testados inclusive na tela mais larga); `EnemySpawnSystem.offscreenDist` usado pela horda, `EncounterDirector.at` e `HordeEventSystem`. Minichefes e Transportador seguem nascendo perto, de propósito (entram com clarão e aviso).
- `CHAINS_THEME` no tema (normal roxo/ciano, Tartarus verde); a catraca de cores caiu de 917 para 913.

### Talismãs no menu de pausa

#### Resumo para o Jogador
- **O menu de pausa ganhou a seção TALISMÃS:** mostra os talismãs que você tem nesta partida, do mais raro para o mais comum, com a borda da cor da raridade. Toque num deles para ver nome, raridade, tipo e o que ele faz.
- Os bônus agora ocupam só as linhas que usam, e Armas e Talismãs sobem para perto deles (cabe tudo mesmo com todos os bônus).

#### Técnico
- `ui/pauseLayout.ts` calcula as posições do meio do menu pelo número de bônus (testado: o pior caso termina 12 px acima do Volume). `ui/pauseTalismans.ts` monta a lista (`IPauseTalismanInfo`), exposta por `GameScene.getPauseTalismans`. A janela de explicação encaixa ícones não quadrados sem esticar.

### Talismãs: amuleto que evolui e ícones novos

#### Resumo para o Jogador
- **O prêmio do minichefe virou um amuleto de verdade:** ele aparece pendurado na corrente, **balançando como um pêndulo**. A cada toque ele evolui para a próxima raridade (ferro, bronze, aço azul, obsidiana, ouro com asas), com um tranco no balanço e um clarão da cor da raridade.
- No último toque a pedra **racha**, a luz explode e no lugar aparece o **ícone do talismã ganho, flutuando**, com nome, raridade, tipo e descrição embaixo.
- **Os 15 talismãs ganharam ícone próprio** (nada de ícone emprestado: o Pilar do Inferno não é mais "um coco") e não vazam mais para fora da tela.
- No chão, o talismã agora é o amuleto balançando dentro do feixe de luz (antes era uma cartinha girando).

#### Técnico
- `scripts/cut-talismans.py`: `talismas.jpg` (verde; fundo = só o verde ligado à borda, buracos fechados de verde de chroma também saem, a gema esmeralda fica) e `talisma-evolucao.jpg` (magenta; divisa entre vizinhos pela coluna mais vazia, os 10 na mesma tela 250x250 com o topo da corrente no centro-topo = pivô). Reduzidos à metade com Lanczos (grade irregular de 7 a 8 px) e alfa binário.
- `TalismanRevealModal` reescrito: pêndulo por quadro (`dampPendulum`/`pendulumAngle`/`pendulumKick` em `talismanRules.ts`, testados; números em `TALISMAN_BALANCE.reveal.pendulum`). `TALISMAN_THEME.rarity.*.card` virou `art`/`openArt`; ícones `talisman-icon-<id>` no catálogo. Amuletos na galeria de teste; teste confere que toda a arte existe.

### Azazel: Tapa da Mão nos cristais e caveiras no duelo final

#### Resumo para o Jogador
- **Fase dos cristais — Tapa da Mão:** de tempos em tempos uma faixa vermelha marca onde você está e, 1,5 segundo depois, a **mão gigante do Azazel** desce do alto e bate ali (35 de dano). A faixa cobre **a mão e o braço inteiro**: saia para o lado e volte para o cristal. Depois de 30 segundos na fase vêm **duas mãos, a direita e a esquerda**: a segunda mira para onde você está indo.
- **Duelo final:** o Azazel volta com **duas caveiras** que giram e flutuam em volta dele e **cospem orbes em você**, uma de cada vez, abrindo a boca a cada tiro. Bater numa caveira tira vida dele.

#### Técnico
- `AzazelHandSlam` (novo, `entities/enemies`): marcas, queda da mão (tween), impacto e dano via `hitPlayer` do Azazel (respeita esquiva e imunidade curta). Regras puras em `crystalPhaseRules.ts` (`handSlamCount`, `handSlamTargets`, `handSlamRect`, `isInsideHandSlam`), testadas. Área = retângulo `handSlam.hitbox` (150 px de largura, 105 px abaixo do ponto até a ponta dos dedos, 540 px acima pelo braço). A segunda mão do par sai com `flipX` (mão esquerda). Números em `crystalPhase.handSlam`; arte de `scripts/cut-azazel-hand.py` (`art-source/novos/mao-azazel.jpg`, grade de 7,75 px, já virada com os dedos para baixo).
- Duelo final: `finalSkulls` no balanço; reaproveita duas `AzazelPhantomClone` (`activateClone` agora recebe escala). Param na fase 2/3, na morte e no respawn.
- Mão na galeria de teste; acerto do tapa vai para o `DebugSessionLogger`.

### Correção: estruturas apareciam no domínio escuro do Azazel

#### Resumo para o Jogador
- **No "AQUI É O MEU MUNDO" a tela fica preta de verdade:** arcos, pilares e outras estruturas altas não aparecem mais no meio do escuro. Também deixam de ser paredes invisíveis enquanto estiver escuro; tudo volta quando a luz retorna.

#### Técnico
- As peças altas do `ChapterDecorSystem` vão para a profundidade 24 quando a heroína passa atrás delas, acima do véu preto (14). `ChapterDecorSystem.setHidden` esconde desenho, luzes e pegadas sólidas e pausa a passada por quadro (que reexibia peças pela tela). Ligado ao evento `azazel-darkness-active` via `IBossFightContext.setDecorHidden`; também restaurado na derrota do Azazel e ao remover o chefe no Modo de Teste.

### Azazel: projéteis com arte nova

#### Resumo para o Jogador
- Os ataques do Azazel ganharam desenho próprio, na mesma cor roxa e verde-água:
  - **Rajada direcionada** (os 4 tiros seguidos): agora são **cometas** com cauda.
  - **Rajada do teleporte**: **orbes lisas** brilhantes.
  - **Disparo em espiral**: **orbes em redemoinho** que giram enquanto voam.
  - **Leque de penas**: **agulhas finas** (antes eram as mesmas bolinhas dos outros golpes).
- O acerto fica na **cabeça** do cometa e da agulha, não no meio da cauda: o que você vê é o que acerta.
- Dano, velocidade e quantidade de cada golpe não mudaram.

#### Técnico
- `scripts/cut-azazel-projectiles.py` recorta 4 peças de `art-source/novos/projeteis-azazel.jpg` (caixas aproximadas + aperto pela máscara, grade de 8 px, cor original sem a limpeza de franja do `spritecut`) para `public/assets/sprites/enemies/Azazel/Projectiles/`.
- `AZAZEL_BOSS_BALANCE.projectileArt` (textura, escala, `originX` = ponto de acerto, `spinPerMs`); `darkSkulls.orbScale` foi para `projectileArt.skull`. `DarkOrbProjectile.fire` recebe um `ProjectileLook` e redefine escala/origem/giro a cada disparo (pool). Saiu a textura inexistente `azazel-feather`. Peças na galeria de teste; teste confere que cada golpe aponta para um arquivo existente.
- Sobraram na folha, sem uso por enquanto: anéis, chamas, raios e cometas alternativos.

### Correção: Nixy travava na borda da fase dos cristais

#### Resumo para o Jogador
- **A Nixy não trava mais na borda da área dos cristais do Azazel.** Às vezes, ao encostar na borda, ela parava de andar para qualquer lado e só saía morrendo.

#### Técnico
- `clampToCircle` (`crystalPhaseRules.ts`) devolvia o ponto exatamente no raio; por arredondamento ele podia ficar ~6e-14 px fora, a borda disparava em todo quadro e o `body.reset` zerava a velocidade para sempre. Agora devolve meio pixel para dentro (`EDGE_SLACK_PX`). Teste com as coordenadas reproduzidas no jogo.

### Azazel: roda de caveiras no escuro

#### Resumo para o Jogador
- **Na fase da escuridão do Azazel, os 8 Azazels em volta de você viraram 8 caveiras.** Elas giram ao seu redor e, a cada tiro, **abrem a boca e cospem uma orbe roxa e turquesa**.
- O Azazel de verdade está disfarçado de uma das caveiras: bater em **qualquer** caveira tira vida dele, como antes.
- Ritmo, dano e duração (10 s) continuam iguais.

#### Técnico
- `scripts/cut-azazel-skulls.py` recorta `art-source/novos/caveiras-azazel.jpg` (fundo verde, grade de 16 px) em `public/assets/sprites/enemies/Azazel/Skull/skull-closed|open|orb.png`; os dois quadros da caveira têm o mesmo tamanho para a troca não pular.
- `AzazelPhantomClone` virou caveira (`updateSkullPose`/`openMouth`, `flipX` para olhar a heroína). O próprio `AzazelBoss` entra em forma de caveira (`enterSkullForm`/`exitSkullForm`: escala, caixa de colisão e animação restauradas ao sair, nas fases 3, morte e respawn).
- Números em `AZAZEL_BOSS_BALANCE.darkSkulls`. `DarkOrbProjectile.fire` recebe escala (sempre redefinida, por causa do pool). Caveiras e orbe na galeria de teste.

### Pets dos talismãs com arte própria

#### Resumo para o Jogador
- **Pets novos de verdade:** Morcego Coletor, Slime Saltador, Cão de Guarda, Cérbero Filhote e Gêmea Sombria ganharam desenho próprio (roxo, coleira dourada, contorno branco). Antes eles usavam o sprite dos monstros encolhido e dava para confundir aliado com inimigo.
- Eles andam de lado e viram para o lado em que vão; a carta de cada talismã mostra o pet novo.
- **Gêmea Sombria nova:** desenho próprio que respira quando está parada e anda com passo completo. Ela atira uma **chama roxa própria** que sai do peito dela, e se vira para o monstro a cada tiro. Ela também já aparece ao seu lado (antes ficava escondida atrás de você).
- **Gêmea e Slime menos grudados:** ficam parados perto de você e só vão atrás quando você se afasta um pouco. Some o tranco da Gêmea, que trocava entre parada e andando a cada quadro.

#### Técnico
- `scripts/cut-pets.py` recorta `art-source/novos/pets-talismas.jpg` (fundo verde, linhas achadas pelas faixas vazias) em `public/assets/sprites/pets/pet-<nome>-0/1.png`, já no tamanho final (escala 1).
- `BasePet` recebe o nome do pet (`PET_SPRITES` em `TalismanCatalog.ts`), anima `pet-<nome>-walk/idle` e espelha com `flipX` (o contorno acompanha). `TALISMAN_BALANCE.pets.walkFps`; saiu `TALISMAN_THEME.twinTint` (a Gêmea não é mais a heroína pintada).
- Gêmea: `scripts/cut-twin.py` (linhas 1-2 de `art-source/novos/gemea-sombria.jpg`, janela comum ancorada no chão para não tremer; tiro de `gemea-tiro.webp`). `PET_ANIM_FRAMES` define os quadros de cada pet; `SoulBoltWeapon.skin` / `onFire` e `SoulBoltSkin` no projétil; `TALISMAN_BALANCE.pets.twin.bolt`/`shootOffsetY`, `idleFps`; alpha da Gêmea 1 (com 0,9 o contorno branco vazava pelo corpo). Recorte comum em `scripts/spritecut.py`.
- `BasePet.followLoose` + `pets/looseFollow.ts` (testado): anda acima de `looseFollow.startPx` (52), para a `stopPx` (14); `followSpeed` da Gêmea (230) e do Slime (210).

### Escudo contra congelamento e atualização sem cache

#### Resumo para o Jogador
- **O jogo não congela mais de vez:** quando dava um erro no meio de um quadro, o jogo parava para sempre (tela amarela no level up, tela branca ao entrar no Infinito). Agora o erro é contornado, o jogo continua, e uma mensagem pequena em vermelho aparece no canto inferior esquerdo. **Se ela aparecer, mande um print**: ela diz exatamente o que quebrou.
- **Atualização sempre limpa:** o jogo instalado não guarda mais cópia de si mesmo. Toda vez que abre, ele busca a versão mais nova e apaga caches antigos, sem o aviso de "recarregar". (Sem internet, o jogo não abre.)

#### Técnico
- `src/systems/CrashGuard.ts`: embrulha o `game.loop.callback` (o Phaser liga o laço logo depois do READY); erro vai para console, `DebugSessionLogger` e um texto no DOM. Build com `sourcemap: 'hidden'` para traduzir a linha.
- `public/sw.js` mínimo: `skipWaiting` + apaga caches `hell-survivor*`; página sempre `no-store`; o resto sem interceptar. `.claude/launch.json` ganhou `hell-survivor-prod` (`vite preview`) para testar a versão compilada.

### Correção de verdade do travamento no altar

#### Resumo para o Jogador
- **Corrigido:** subir de nível e depois completar o Altar de Ascensão travava o jogo com a tela amarela. A tela de cartas reaproveitava os botões Re-rolar/Pular do level up anterior (já destruídos) e quebrava ao abrir a escolha do altar. A correção anterior não pegava esse caso.
- **Guarda anti-travamento:** se a partida ficar pausada sem nenhuma tela aberta por mais de 1,5 segundo, ela volta sozinha (e o caso fica registrado no log do Modo de Teste).
- **Um altar por vez, com recarga:** com mais de uma arma no máximo, você escolhe qual evoluir; o próximo altar, para a outra arma, aparece **3 minutos depois**. Isso se repete até não sobrar arma para evoluir.

#### Técnico
- `UpgradeScene.create` zera `rerollButton`/`skipButton`. `src/systems/pauseGuard.ts` (testado) + `UIScene.guardAgainstStuckPause`. `ALTAR_BALANCE.cooldownAfterUseMs` (180000) e `altarPresence(..., cooldownLeftMs)`.

### Topo da HUD sem placas e seta do Fim da Jornada

#### Resumo para o Jogador
- **Relógio, abates e almas sem fundo:** as placas escuras com moldura do topo saíram; os números ficam direto sobre o jogo (a barra de purificação e a vida do chefe continuam com o trilho delas).
- **Corrigido:** no Fim da Jornada, a setinha ficava presa em TENTAR NOVAMENTE quando você passava para MENU PRINCIPAL. Agora ela acompanha a opção escolhida.

### Cartas com moldura própria de cada raridade

#### Resumo para o Jogador
- **Molduras novas, uma por raridade:** Comum (ossos de catacumba), Incomum (bronze e fogo de alma verde), Rara (correntes espectrais azuis), Épica (obsidiana com runas e chifres) e Suprema (ouro, rubis, asas e fogo do inferno). Bateu o olho, sabe o quão rara é a carta.
- **Acabou o "gelo sem gelo":** as molduras antigas de gelo, veneno etc. caíam em cartas sem nada a ver. Agora todas seguem o tema do inferno, e a cor do nome da raridade combina com a moldura.
- **Talismãs também:** a carta do talismã usa as mesmas molduras (Lendária = Suprema), e o talismã no chão mostra a moldura dourada nova.
- **Mais nítidas:** a arte nova tem o dobro da resolução das antigas.

#### Técnico
- `UpgradeCard.rarity` substitui `cardSpriteKey`/`rarityLabel`/`rarityColor`; `CARD_RARITY_THEME` e `CARD_FRAME_KEYS` em `theme.ts` (`CARD_RARITY_COLORS` removido; `TALISMAN_THEME.rarity` lê dele).
- `scripts/cut-card-frames.py` recorta a folha em `public/assets/sprites/cards/card-*.png` (240x400, mesma escala, centradas pela janela). As 8 molduras antigas foram apagadas. Posições de texto e ícone na `UpgradeScene` refeitas para as janelas novas.

### Altar de Ascensão aparece quando a arma chega ao máximo

#### Resumo para o Jogador
- **Arma no máximo = altar no mapa:** antes o altar demorava até 75 segundos para aparecer. Agora, **3 segundos** depois de uma arma ficar pronta para evoluir, surge o Altar de Ascensão com o aviso "ARMA NO MÁXIMO! UM ALTAR DE ASCENSÃO SURGIU".
- **No radar:** o X vermelho do altar pulsa e, se o altar estiver longe, fica preso na borda do radar apontando a direção (a seta na borda da tela continua mostrando a distância).
- **Some quando não precisa:** se você evoluir a única arma pronta, o altar desaparece. Quando outra arma chegar ao máximo, ele aparece de novo.

#### Técnico
- `altarPresence()` em `src/systems/altarRules.ts` (testado); `ChapterConfig.altarSpawnIntervalMs` virou `altarAppearDelayMs` (3000). `EvolutionAltar.fadeAway()`; `PickupSpawnSystem.updateAltarSpawning` roda sempre.

### Correção: jogo travava no Altar de Ascensão

#### Resumo para o Jogador
- **Corrigido o travamento do altar:** se a arma já tinha evoluído por outro caminho (o Baú do Abismo dá preferência a evoluções) enquanto o altar estava no mapa, completar o altar pausava o jogo e abria uma escolha vazia, deixando a tela laranja para sempre. Agora, sem evolução disponível, o **altar vira um Baú do Abismo**, então o esforço não é perdido.
- **"Parada demais!" não conta no altar:** ficar dentro do círculo do Altar de Ascensão não fortalece mais a horda; a contagem recomeça quando você sai.

#### Técnico
- `src/systems/altarRules.ts` (testado em `altarRules.test.ts`); `PickupSpawnSystem.handleAltarCompleted` troca a tela por um baú; `UpgradeScene` fecha sozinha se abrir no modo altar sem carta (rede de segurança).
- `IdlePressureSystem.update(..., onObjective)`; `GameScene.isPlayerCapturingAltar()`.

### Interface mais limpa: sem barras de fundo

#### Resumo para o Jogador
- **Sem barras pretas:** as dicas de controle do menu e da partida e os botões Re-rolar/Canalizar não têm mais caixa de fundo. Ficam só os ícones e os nomes; o selecionado acende com um traço dourado embaixo.
- **Roleta do baú mais limpa:** sem moldura, sem caixas coloridas e sem o quadrado do centro. Só os ícones correndo e as duas setas douradas marcando o prêmio.
- **Fim da Jornada novo:** sem a caixa. O jogo escurece com uma vinheta vermelha, o título cai grande na tela, e os números (tempo, abates, nível, maior combo, almas) aparecem **lado a lado contando do zero**, com o recorde embaixo (**NOVO RECORDE!** pisca em dourado). As opções são só texto, com seta e traço na escolhida.

#### Técnico
- Regra registrada no topo de `docs/DESIGN_SYSTEM.md`. `InputHint` perdeu a opção `plate`; `ActionKeyButton` não desenha caixa. Tokens sem uso removidos de `INPUT_HINT_THEME`, `ACTION_BUTTON_THEME`, `CHEST_ROULETTE_THEME` e `MODAL_THEME.gameOver`.

### Roleta do baú nova

#### Resumo para o Jogador
- **Baú do Abismo com faixa de ícones:** em vez dos nomes subindo, agora os **ícones das bênçãos** correm da direita para a esquerda numa faixa com moldura dourada, com um estalo a cada ícone que passa pelo centro. A faixa vai **desacelerando** e para no prêmio, que **cresce e brilha** entre as duas setas douradas. Depois aparecem o nome e a descrição.
- A borda de cada ícone tem a cor da carta (as evoluções têm borda dourada). Tocar durante a corrida pula direto para o prêmio, como antes.

#### Técnico
- `ChestRouletteModal` reescrito: faixa com o prêmio numa posição fixa e um tween `Quart.easeOut`; o estalo sai quando o índice no centro muda. Cores em `CHEST_ROULETTE_THEME` (12 cores a menos fora do tema; catraca travada em 941).

### Ícones de botão no lugar das dicas escritas

#### Resumo para o Jogador
- As dicas de controle agora mostram **o desenho do botão** em vez de texto tipo `[Espaço]` ou `(A)`: barra de controles da partida, tecla da Suprema, diálogos, intro, fim de capítulo, menu principal, escolha de capítulo, tela de cartas (Re-rolar, Canalizar, Altar) e roleta do baú.
- O jogo percebe sozinho o que você está usando e troca os ícones na hora: **teclado e mouse**, **controle de Xbox** (A/B/X/Y) ou **controle de PlayStation** (cruz, círculo, quadrado, triângulo). No celular aparecem só os ícones de toque onde fazem sentido.

#### Técnico
- Folha `art-source/novos/botoes-controle.webp` recortada por `scripts/cut-button-glyphs.py` num atlas único (`public/assets/sprites/ui/buttons/button-glyphs.png` + `.json`, 44 ícones).
- `src/config/inputGlyphs.ts` diz qual ícone cada ação usa em cada aparelho; `InputDeviceTracker` é a fonte única do aparelho em uso (antes cada cena repetia a detecção); `src/ui/InputHint.ts` desenha linhas de ícone + texto e se atualiza sozinho.
- `ActionKeyButton` e `SkipButton` usam o ícone em vez da tecla desenhada por código. Teste novo `inputGlyphs.test.ts` (inclui o caso "Xbox Wireless Controller", que seria lido como PlayStation).

### Talismãs: prêmio do minichefe que sobe de raridade

#### Resumo para o Jogador
- **Minichefe solta um Talismã:** ao derrotar a Lyn ou o Ghoul, cai no chão uma carta dourada com um **feixe de luz** subindo e faíscas. Ela aparece como um **losango dourado pulsando no radar** e com uma **seta na borda da tela** mostrando a distância.
- **A carta sobe de raridade:** ao pegar, a carta começa **COMUM**. Cada toque pode fazer ela **girar e subir** (Incomum → Rara → Épica → Lendária), com som cada vez mais rico e clarão na cor da raridade. Quando ela não sobe mais, o toque abre o prêmio. Épica e Lendária ganham raios girando atrás da carta. Chances: 45% comum, 28% incomum, 16% rara, 8% épica e 3% lendária.
- **10 talismãs** (pets e armas únicas, que valem só na partida e não se repetem):
  - Comum: **Morcego Coletor** (puxa gemas e bica) e **Faísca Encadeada** (raio que pula entre monstros).
  - Incomum: **Slime Saltador** (pula em cima e esmaga) e **Espinhos de Osso** (brotam do chão embaixo de 3 monstros).
  - Rara: **Cão de Guarda** (corre e morde) e **Anel de Gelo Negro** (onda que congela por um instante).
  - Épica: **Cérbero Filhote** (morde até 3 e atordoa) e **Olho do Abismo** (raio girando em volta de você).
  - Lendária: **Gêmea Sombria** (uma sombra sua que copia seus disparos) e **Pilar do Inferno** (colunas de fogo nos monstros mais fortes).
- **Pets com contorno branco**, para não se confundirem com os monstros.
- **5 habilidades que disparam sozinhas** quando a hora chega (o nome aparece sobre a Nixy):
  - Comum: **Explosão Sombria**, quando os monstros te cercam, explode e empurra todos.
  - Incomum: **Escudo de Ossos**, que segura um golpe inteiro e volta depois de um tempo.
  - Rara: **Vórtice do Abismo**, com muitos monstros na tela, suga todos para o meio e explode.
  - Épica: **Coração Sangrento**, com a vida baixa, cura um terço e solta uma onda de sangue.
  - Lendária: **Chuva de Meteoros**, quando a horda cresce, 12 meteoros caem nos monstros.
  Agora são 15 talismãs.
- No Modo História cada capítulo tem um minichefe (1 talismã). No Infinito cada Círculo traz um minichefe, então dá para juntar todos.

#### Técnico
- Regras puras em `src/systems/talismanRules.ts` (sorteio, sem repetição, revelação por toques), testadas em `talismanRules.test.ts`. Catálogo em `TalismanCatalog.ts`, números em `TALISMAN_BALANCE`, cores em `TALISMAN_THEME`.
- `TalismanSystem` (por partida) solta, detecta a coleta e liga os efeitos; pets em `src/entities/talismans/pets/`, armas em `src/entities/talismans/weapons/`. Tela em `src/ui/TalismanRevealModal.ts`, sons em `src/systems/audio/talismanSfx.ts`.
- `UIScene.isChestRouletteActive()` agora vale para qualquer tela de prêmio (baú ou talismã); o bot [F3] toca na carta sozinho.
- Modo de Teste, aba Armas: soltar talismã e abrir carta de cada raridade. Galeria ganhou o talismã do chão.
- Pets usam a arte dos monstros (morcego, slime, cão) e da heroína até chegar arte própria.

## [Não publicado] — 2026-11-24

### Chefes mais duros e fase dos cristais sem enrolação

#### Resumo para o Jogador
- **Grito do Azazel legível:** o "SUA ALMA É MINHA!" do começo da luta aparecia em cima da cabeça dele, atrás da barra de vida. Agora surge grande no centro da tela, como as outras frases dele.
- **Fase dos cristais com pressa:** quanto mais tempo você demora para purificar os cristais, mais fortes ficam os monstros (mais vida e mais dano, e as levas chegam mais rápido). Enquanto isso o **Azazel se cura devagar** (0,4% da vida por segundo, até 60%) e dá para ver a barra subindo, com o aviso "AZAZEL SE CURA" no nome.
- **Área fechada nos cristais:** a fase acontece num círculo menor, marcado por uma borda de blocos carmesim. Não dá para sair correndo, e os cristais ficam mais perto.
- **Azazel:** +30% de vida e +10% de dano em todos os golpes.
- **Rosalin:** +20% de vida e +30% de dano (no História e no Infinito). O salto esmagador dela agora tira 55 de 100 de vida base.
- **Chefes não cobrem mais a heroína:** a Nixy sempre aparece na frente da Rosalin, do Azazel, dos clones e da Lyn.

#### Técnico
- `AZAZEL_BOSS_BALANCE.crystalPhase` + `src/systems/crystalPhaseRules.ts` (testado em `crystalPhaseRules.test.ts`); `AZAZEL_BOSS_BALANCE.damageMultiplier` aplicado a golpes, contato e clones.
- Regras de justiça da Rosalin em `bossBalance.test.ts` atualizadas para o novo dano (salto até 56% no História, 66% no Infinito; os outros golpes seguem até 45%).
- Heroína na camada 23 (chefes 21–22, projéteis 25+).

### Menu de capítulos novo e controle em mais telas

#### Resumo para o Jogador
- **Escolha de capítulo redesenhada:** duas cartas lado a lado com o chefe de cada capítulo, na moldura pixel art do menu de pausa. Agora dá para escolher **com o controle e com o teclado** (setas/analógico, A ou Enter para jogar, B ou ESC para voltar).
- **Botão PULAR das cenas:** sem a caixa e sem o ícone; só o nome e a tecla, que ficou maior e em pixel art (o "B" do controle parecia uma linha).
- **Cartas de nível:** ao abrir, escolher carta e re-rolar ficam travados por pouco mais de 1 segundo, com uma barrinha embaixo do título. Um botão apertado no combate não escolhe mais uma carta sem você ver.
- **Carta selecionada em destaque:** as outras cartas ficam levemente escurecidas, e a selecionada balança de leve com um brilho pulsando, então dá para ver de relance qual está marcada (mouse e controle usam a mesma seleção).
- **Baú de bênção:** o A do controle agora pula a roleta e coleta a bênção.
- **Altar de Bênçãos no controle:** direcional/setas andam pelas bênçãos e pelos botões de baixo (moldura dourada mostra onde você está), A/Enter compra, B/ESC volta. Na confirmação do reembolso o cursor começa em CANCELAR e o B fecha só a confirmação.
- **Lyn, a minichefe súcubo, luta do jeito dela:** antes era uma cópia da Rosalin. Agora ela fica **rodeando** você em vez de vir reto, faz um **Rasante Triplo** (três investidas curtas, cada uma com aviso rosa) e depois fica **cansada** por um instante, levando mais dano. Também solta uma **Espiral de Orbes** lenta em volta de si, que dá para atravessar pelos vãos. O salto esmagador ficou só com a Rosalin, e os golpes da serva batem menos que os da senhora.
- **Corrigido:** o fim de capítulo mostrava "ALMAS PEGAS: +0" mesmo pegando almas. As almas já iam para o saldo; só a contagem da tela estava zerada.

#### Técnico
- `src/ui/pixelFrame.ts`: molduras em degrau só com retângulos (substitui `strokeRoundedRect` nas telas novas); usada no menu de capítulos, na tecla do `ActionKeyButton` e na barra da trava.
- `ActionKeyButton` ganhou o modo `bare`; `MenuScene` ganhou `modalNav` (foco de modal para teclado e controle).
- `UPGRADE_SKIP_BALANCE.pickLockMs` + `getPickLockRemainingMs`, testados em `upgradeSkipLock.test.ts`. Tokens novos: `MODAL_THEME.chapterSelect`, `PICK_LOCK_BAR_THEME`.

### HUD nova, pensada para o celular

#### Resumo para o Jogador
- **Status no topo esquerdo:** a moldura da Nixy saiu do canto de baixo à direita (onde ficava o polegar) e foi para o alto à esquerda. O rosto dela agora aparece dentro do medalhão do olho da moldura e fica vermelho e treme quando ela toma dano. Vida e nível com números grandes.
- **Armas logo abaixo do status**, e a **barra de XP** virou uma faixa fina de ponta a ponta no alto da tela.
- **Objetivo no topo central** numa placa de obsidiana com moldura dourada: purificação (História), relógio e recorde (Infinito) ou a vida do chefe.
- **Abates e almas** lado a lado no topo direito, com o **radar** logo abaixo.
- **No celular:** tudo maior e legível. A **Suprema ficou grande no canto do polegar direito**, com esquiva e corrida em arco em volta dela, e não é mais preciso parar de andar para soltá-la. O analógico nasce em qualquer ponto da metade esquerda, abaixo das armas.
- **Corrigido:** o aviso "PARADA DEMAIS" ficava aceso por cima do Fim da Jornada.

#### Técnico
- `src/config/hudLayout.ts` (posição e escala de cada peça por tamanho de tela e tipo de aparelho), testado em `hudLayout.test.ts` (tudo dentro da tela e nada sobreposto em 1280, 1562 e 1680, no toque e no computador).
- `StatusPanelHud`, `TopCenterHud`, `WeaponSlotsHud`, `TacticalRadar`, `ComboHud` e `TouchControls` recebem a posição do layout; as cores novas foram para `HUD_COUNTER_THEME` e `OBJECTIVE_THEME`.

### Botão PULAR que funciona no celular

#### Resumo para o Jogador
- **Pular no celular:** o botão PULAR da intro e do fim de capítulo ficava minúsculo no iPhone (uns 15 pontos de altura), e no fim do Capítulo 1 havia uma área em volta dele que engolia o toque. Agora ele é grande no celular, tem o visual dourado dos botões da tela de cartas e funciona na área inteira.
- **Diálogos no meio da partida** (chegada da Rosalin, do Azazel...) ganharam o mesmo botão PULAR. Antes só dava para pular com ESC ou o B do controle.
- **Corrigido:** os botões RE-ROLAR e CANALIZAR da tela de cartas só respondiam no quarto de cima à esquerda; agora respondem no botão todo.

#### Técnico
- `src/ui/SkipButton.ts` (tamanho por tipo de aparelho, `containsPointer` para a cena não avançar o texto com o mesmo toque).
- `ActionKeyButton`: área de toque de Container é relativa ao canto (Phaser soma `displayOrigin`); mesma correção no botão do Editor.

### Fúria do Inferno e Lyn na vila

#### Resumo para o Jogador
- **Fúria do Inferno (Modo Infinito):** ao subir de nível, há chance de a arena pegar fogo por 30 segundos: a tela fica avermelhada, brasas sobem e o chão treme de tempos em tempos. Nesse tempo os monstros batem mais forte, aguentam mais e correm mais, e dão **+50% de XP**. A chance começa em 5% e cresce a cada nível sem fúria, para ela não sumir no fim da partida; depois de uma fúria, a próxima só pode vir 4 níveis depois. Se um chefe chegar, a fúria se apaga.
- **Lua de Sangue** agora é só do Modo História (Capítulo 2); no Infinito o lugar dela é da Fúria.
- **Capítulo 1:** a **Lyn**, que mora na vila, é a minichefe do meio da fase. O **Ghoul Devorador** passou para o Capítulo 2.
- **Modo de Teste:** botão "EVENTO: FÚRIA DO INFERNO" na aba 2; os botões de evento agora ficam em três colunas para caber no painel.

#### Técnico
- `InfernalFurySystem.ts` (efeitos, visual, velocidade dos monstros) + `infernalFuryRules.ts` (sorteio puro, testado em `infernalFuryRules.test.ts`). Números em `INFERNAL_FURY_BALANCE`; cores `infernalFuryOverlay`/`infernalFuryEmber` em `theme.ts`.
- `GameScene.enemyStrengthMultiplier` = Pressão do Abismo × Fúria.

## [Não publicado] — 2026-11-21

### Tela de cartas: Espaço não pula mais a carta sem querer

#### Resumo para o Jogador
- **CANALIZAR travado por 5 segundos:** ao subir de nível, o botão CANALIZAR (Espaço / B / clique) fica apagado, com a contagem no lugar do "+40%", por 5 s. Quem estava esquivando com Espaço quando o nível subiu não perde mais a escolha de carta. As cartas e o RE-ROLAR continuam liberados na hora.
- **Corrigido:** na primeira tela de cartas da partida, a trava antiga nem funcionava, e um Espaço pulava a carta na hora.

## [v0.16.0 — Arqueira, Lyn e Círculos do Infinito] — 2026-11-20

### Cronograma de Inimigos e Círculos do Infinito

#### Resumo para o Jogador
- **Cada inimigo novo é apresentado:** na primeira vez que ele aparece, um aviso no centro da tela ("NOVO: ARQUEIRAS DEMÔNIAS — ATIRAM DE LONGE E FOGEM") e um grupinho só dele. Depois ele entra na mistura.
- **Capítulo 1 ensina o básico:** começa só com cães; morcegos aos 20% da barra, múmias aos 40%, **Ghoul Devorador no meio da fase (55%)** e slimes aos 70%. Sem Alfas, Arqueiras ou Colossus.
- **Capítulo 2 junta os novos:** Arqueiras desde 15%, Alfas a partir de 30%, Colossus aos 50%, **Lyn no meio da fase** e formações: **Matilha** (Alfas juntos) e **Muralha** (Colossus na frente, Arqueiras atrás, protegidas da perfuração).
- **Modo Infinito em Círculos de 5 minutos, sem fim:**
  - **Círculo 1** apresenta todo mundo: morcegos 0:45, Arqueiras 1:30, múmias 2:00, **Ghoul 2:30**, Alfas 2:50, Colossus 3:25, slimes 4:00.
  - **Chefe no fim de cada Círculo:** aviso "A ROSALIN SE APROXIMA — CHEGA EM 30 SEGUNDOS", outro aos 10 s, e ela vem até você (não precisa mais ir ao altar). Os eventos de horda param 20 s antes.
  - **Depois do chefe:** 10 s de calmaria sem hordas novas, e começa o próximo Círculo.
  - **Do Círculo 2 em diante:** tudo liberado, e cada Círculo tem um **tema** que se repete: Muralha, Enxame (morcegos de vários lados), Pântano (múmias e slimes), Matilha, Caçada (Arqueiras cercando).
  - **Minichefe no meio de todo Círculo**, revezando Ghoul e Lyn. Chefe e minichefe ficam mais fortes a cada Círculo.
- **Corrigido:** no Infinito, se você não fosse ao Altar de Invocação aos 5:00, as hordas paravam para sempre. O altar não é mais usado no Infinito.
- **Modo de Teste:** botão "INFINITO: AVANÇAR 30 S NO CRONOGRAMA" (aba 2), para pular partes do Círculo dentro de uma partida do Infinito.

#### Técnico
- Novo `EncounterDirector` (execução) + `encounterRules.ts` (regras puras); tabelas `STORY_SCHEDULE`, `ENDLESS_SCHEDULE`, `FORMATION_BALANCE` em `balance.ts`. Sai `STORY_ELITES`, `miniBoss3mSpawned`/`boss10mSpawned` e os `minMinutes` de Arqueira, Colossus e Alfa.
- `EnemySpawnSystem` pergunta `isEnemyUnlocked(kind)` antes de cada tipo; `spawnScaledMummyAt` novo; `spawnGhoulDevourer`/`spawnLyn` aceitam multiplicador de vida; `spawnEndlessTimedBoss` aceita escala do Círculo.
- `HordeEventSystem` respeita `isEncounterQuiet`. Formação recusada por arena lotada tenta de novo em `retryWhenFullMs`.
- Testes: `encounterRules.test.ts` e `encounterDirector.test.ts` (simula Círculos inteiros quadro a quadro).

### Lyn

#### Resumo para o Jogador
- **A Matriarca Súcubo agora é a Lyn:** antes ela era a própria Rosalin pintada de rosa. Agora é uma súcubo jovem de cabelo preto e asas pretas, com arte e animação de voo próprias. Os golpes e a recompensa continuam iguais (2 gemas roxas, 15 a 20 almas e um baú).
- No Modo de Teste o botão virou "INVOCAR MINI-BOSS: LYN (SÚCUBO)", e ela está na galeria no lugar da "Succubus Menor".

#### Técnico
- `SuccubusBoss.useLynSprites()`: troca o conjunto de sprites (`lyn-*`, voo em 4 eixos) e a colisão; a Rosalin segue com `succubus-*` em 8 direções.
- `spawnMatriarchSuccubus` → `spawnLyn`; `ENEMY_BALANCE.matriarchSuccubus` → `ENEMY_BALANCE.lyn`; tipo do Modo de Teste `matriarch` → `lyn`. A tinta rosa saiu (catraca de cores: 1034 → 1033).
- Sprites em `public/assets/sprites/enemies/Lyn/{Idle,Fly}` (fonte em `art-source/Sprites/Enemies/Lyn/`).

### Arqueira Demônia

#### Resumo para o Jogador
- **Inimigo novo no Modo Infinito: Arqueira Demônia.** Rápida, corre até ficar a uma distância segura da Nixy, para, puxa o arco e solta uma flecha na direção dela. Atira a cada 1,5 segundo.
- **Ela foge:** se a Nixy avança, a arqueira recua até a distância segura e volta a atirar. Recuando ela é um pouco mais lenta que a Nixy andando, então dá para alcançar (correndo, bem mais fácil).
- **Justa no celular:** ela só atira se estiver **visível na tela**, longe das barras do HUD. Como a tela é baixa, se não houver espaço em cima ou embaixo da Nixy, ela se posiciona mais para o lado (corrigido: a de cima ficava subindo e descendo sem atirar). A puxada do arco é o aviso; a flecha voa devagar o bastante para dar para desviar, e a esquiva atravessa a flecha.
- Frágil (45 de vida), flecha de 8 de dano (cresce com o tempo). Aparece a partir de 1:30 no Infinito, até 2 ao mesmo tempo (4 depois dos 6 minutos).
- **Modo de Teste:** botão "SPAWNAR +3 ARQUEIRAS DEMÔNIAS" na aba 2, e ela e a flecha estão na galeria. Os botões de "EVENTO" foram para a coluna da direita, dois por linha, para caber tudo.

#### Técnico
- Entidade `ArcherEnemy` com regras puras em `archerRules.ts` (`archerStandoffPoint`, `isInsideView`, `shouldHold`, `shouldAbortDraw`); números e `getArcherMaxAlive` em `balance.ts` (`ENEMY_BALANCE.archer`). Testes em `archer.test.ts`.
- `EnemyArrowSystem`: pool de flechas inimigas (imagens movidas à mão, sem corpo físico), criado pela `GameScene` e exposto ao spawner por `IEnemySpawnContext.enemyArrows`. Textura `enemy-arrow` desenhada por código (sem arte ainda; cores em `FX_COLORS.archerArrow*`).
- Sprites em `public/assets/sprites/enemies/Archer/{Idle,Run,Shoot}` (fonte em `art-source/Sprites/Enemies/Archer/`).

## [v0.15.0 — Colossus, Transportador e Ghoul] — 2026-11-20

### Colossus

#### Resumo para o Jogador
- **Inimigo novo no Modo Infinito: Colossus.** Um demônio de armadura, grande e lento, que chega na frente de uma fila de 4 cães. Ele é o escudo da horda: **flechas e adagas que perfuram param nele** e não atingem quem está atrás. Tem muita vida (520 no começo, cresce com o tempo como os outros), mas bate como um monstro comum (10) e não recua quando leva golpe.
- **Ele é sólido:** a Nixy não atravessa o Colossus (nem com a esquiva) e, quando ele encosta e bate, ela é jogada para trás.
- Aparece a partir de 2:30 no Infinito, um de cada vez (até dois depois dos 7 minutos). Ao morrer deixa uma gema vermelha e 2 a 4 almas.
- No Modo de Teste: botão "SPAWNAR COLOSSUS + ESCOLTA" na aba 2, e ele está na galeria.

#### Técnico
- Nova entidade `ColossusEnemy`; atributos e regras de aparição em `ENEMY_BALANCE.colossus` e `getColossusMaxAlive` (`balance.ts`).
- `BaseEnemy.blocksPierce` (projéteis param), `BaseEnemy.isHeavy` (sem recuo) e `BaseEnemy.isSolid` (collider com a heroína; corpo imóvel). O contato de monstro com a heroína virou `GameScene.handleEnemyContact`, chamado pela sobreposição e pelo collider dos sólidos. Empurrão em `ENEMY_BALANCE.colossus.knockback`. Regra pura em `entities/weapons/pierceRules.ts`, usada pela Adaga de Sangue e pelo Disparo de Alma. Testes em `colossus.test.ts`.
- Sprites em `public/assets/sprites/enemies/Colossus/` (fonte em `art-source/Sprites/Enemies/Colossus/`).

### Transportador

#### Resumo para o Jogador
- **O Ladrão de Almas virou o Transportador:** no lugar do cão dourado, agora foge um diabrete magro com um saco de gemas nas costas, com arte e animação de corrida próprias. Funciona como antes: siga a seta dourada e abata ele em até 15 segundos para o saco se abrir (chuva de gemas, almas e às vezes um baú). Se o tempo acabar, ele escapa.
- No Modo de Teste o botão virou "EVENTO: TRANSPORTADOR", e ele está na galeria de inimigos.

#### Técnico
- Nova entidade `TransporterEnemy` (`src/entities/enemies/TransporterEnemy.ts`); a lógica de fuga saiu do `ZombieDog` (`isFleeing`, `isSpecialMiniBoss` removidos) e foi para a entidade nova. Escala e ritmo de fuga em `HORDE_EVENT_BALANCE.thief` (`scale`, `fleeRelaxDistance`, `relaxedPace`). O id interno do evento continua `thief`.
- `FX_COLORS.thiefTint` removida (o cão dourado não existe mais).
- Sprites em `public/assets/sprites/enemies/Transporter/` (fonte em `art-source/Sprites/Enemies/Transporter/`).

### Ghoul Devorador

#### Resumo para o Jogador
- **Minichefe novo no Modo Infinito (3:00):** o Titã Cerberus (que era só o cão zumbi maior) saiu. No lugar dele chega o **Ghoul Devorador**, um monstro de arte própria, bem maior e mais forte: 2100 de vida (era 1400), 24 de dano no contato (era 20), anda um pouco mais rápido e é maior na tela.
- **Bote telegrafado:** de tempos em tempos ele para, pisca em vermelho por meio segundo e salta em linha reta na direção da Nixy (34 de dano se acertar). Todo golpe dele empurra a Nixy para trás, e o bote empurra bem mais longe. Dá para escapar com a esquiva ou saindo da linha.
- Ele resiste a atordoamento e empurrões, como os chefes. Recompensa igual à do antigo Titã (gema roxa, 10 a 15 almas e Cálice ou Ímã).
- No Modo de Teste o botão virou "INVOCAR MINI-BOSS: GHOUL DEVORADOR", e ele está na galeria de inimigos.

#### Técnico
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
