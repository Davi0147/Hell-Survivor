# Prompts de Arte — Hell Survivor

Prompts prontos para colar num gerador de imagens (o estilo atual do jogo combina com geradores de pixel art como o PixelLab; também funcionam em Midjourney, DALL·E, Leonardo e similares). Os prompts estão em inglês porque os geradores entendem melhor.

## Como usar

1. Cole o **bloco de estilo** abaixo no começo de todo prompt. Ele é o que mantém tudo com a mesma cara.
2. Gere, escolha a melhor versão e salve em `art-source/novos/` com o **nome de arquivo indicado** em cada item.
3. Me avise que os arquivos estão lá. Eu recorto, ajusto o tamanho, coloco no jogo e registro na galeria de sprites.

Se o gerador não fizer fundo transparente, peça fundo liso magenta (`#ff00ff`) que eu removo.

### Bloco de estilo (cole sempre)

```text
16-bit pixel art, dark gothic baroque fantasy, hell and catacombs theme, hand-placed pixels,
crisp hard edges, no anti-aliasing, no blur, no gradients banding, limited palette of
crimson red (#ff0055), ember orange, deep violet (#9b5de5), antique gold (#f3d17a) and
near-black purple shadows, strong dark outline, high contrast, dramatic rim light,
top-down 3/4 view game asset, transparent background, centered, no text, no watermark
```

### Tamanhos usados no jogo

| Tipo | Tamanho por quadro |
|---|---|
| Ícone de item, arma, projétil | 40x40 (gere em 64x64 ou maior, eu reduzo) |
| Ícone de interface / bênção | 64x64 |
| Inimigo comum | 64x64 a 80x80 |
| Chefe | 92x92 a 112x112 |
| Efeito de ataque pequeno | 64x64 por quadro |
| Efeito de área grande | 128x128 ou 192x192 por quadro |
| Retrato de diálogo | 200x200 (ou maior, mesma proporção) |
| Moldura de carta | 240x400 (unidade 120x200, gere 5x maior) |

Para **animações**, peça sempre uma *sprite sheet* horizontal: todos os quadros lado a lado, mesmo tamanho, mesma posição do centro. Exemplo: `horizontal sprite sheet, 8 frames, each frame 64x64, evenly spaced, consistent center`.

---

## 1. Ícones das armas (aparecem nas cartas de upgrade e no HUD)

Formato: 64x64, um objeto só, centralizado. Acrescente ao fim de cada prompt: `single game icon, 64x64, object fills 80% of the frame`.

| Arquivo | Prompt |
|---|---|
| `icon-weapon-soulbolt.png` | `a floating violet soul flame bolt with a pale skull-shaped core and a trailing wisp tail, glowing magenta edges` |
| `icon-weapon-soulbolt-evo.png` | `an apocalyptic lightning bolt made of screaming souls, white-hot core, violet and gold arcs, tiny skulls in the energy` |
| `icon-weapon-scythes.png` | `two crossed curved void scythes with obsidian blades and violet glowing edges, bone handles wrapped in dark cloth` |
| `icon-weapon-scythes-evo.png` | `a giant reaper scythe with a blade made of starless void, purple event-horizon glow, gold baroque filigree on the shaft` |
| `icon-weapon-hellfire.png` | `a ring of crimson and orange hellfire flames around a dark empty center, embers rising` |
| `icon-weapon-hellfire-evo.png` | `an abyssal supernova, collapsing black sun with a blinding crimson-white corona and violet flares` |
| `icon-weapon-daggers.png` | `three ornate blood-red ritual daggers fanned out, dripping blood, gold crossguards, ruby pommels` |
| `icon-weapon-daggers-evo.png` | `a storm of a dozen crimson blades raining downward in formation, blood mist, gold glints` |
| `icon-weapon-chains.png` | `black iron abyssal chains with hooked spikes coiled in a spiral, faint violet glow between links` |
| `icon-weapon-chains-evo.png` | `a cage of colossal chains forming a prison sphere, a padlock shaped like a demon skull, violet lightning` |
| `icon-weapon-meteor.png` | `a burning infernal meteor falling diagonally, molten cracks, long fire tail, smoke` |
| `icon-weapon-meteor-evo.png` | `a cataclysm of several meteors falling from a red starry sky, shockwave ring at the bottom, gold and crimson` |
| `icon-ultimate.png` | `a demonic judgment sigil, inverted pentagram inside a baroque gold ring, crimson energy exploding outward` |

## 2. Ícones das bênçãos (Altar de Bênçãos do menu)

Formato: 64x64. Acrescente: `single game icon, 64x64, framed inside a thin antique gold baroque ring`.

| Arquivo | Bênção | Prompt |
|---|---|---|
| `icon-blessing-vitality.png` | Vitalidade Abissal | `an anatomical demon heart wrapped in thorny black vines, glowing crimson, one drop of blood` |
| `icon-blessing-might.png` | Fúria Sombria | `a clawed demon gauntlet clenched into a fist, wreathed in dark red aura and sparks` |
| `icon-blessing-magnetism.png` | Atração Etérea | `a spectral violet hand pulling small glowing soul gems toward its palm, swirling trails` |
| `icon-blessing-agility.png` | Passo Fantasma | `a winged boot made of ghostly mist with a magenta afterimage trail behind it` |
| `icon-blessing-reroll.png` | Sorte do Destino | `two bone dice with glowing gold pips tumbling, tarot card corner behind them` |
| `icon-blessing-revival.png` | Pacto Demoníaco | `a burning contract scroll signed in blood with a phoenix-like flame rising from it, gold seal` |

## 3. Ícones de interface (HUD e menus)

Formato: 32x32 ou 64x64, traço bem legível em tamanho pequeno. Acrescente: `tiny UI icon, readable silhouette at 32x32, flat dark background removed`.

| Arquivo | Prompt |
|---|---|
| `ui-icon-kills.png` | `a small horned demon skull, crimson, front view` |
| `ui-icon-souls.png` | `a small blue-violet corrupted soul flame with a tiny face` |
| `ui-icon-timer.png` | `a gothic hourglass with red sand, gold frame` |
| `ui-icon-level.png` | `an upward gold arrow with small bat wings` |
| `ui-icon-reroll.png` | `two curved arrows forming a circle around a bone die` |
| `ui-icon-skip.png` | `a double chevron arrow carved in stone with a green healing glow` |
| `ui-icon-settings.png` | `a rusty iron gear with a ruby in the center` |
| `ui-icon-sound-on.png` / `ui-icon-sound-off.png` | `a small gothic bell ringing with sound waves` / `the same bell, cracked and crossed out in red` |
| `ui-icon-chapter-lock.png` | `a heavy iron padlock with a demon face keyhole` |

## 4. Efeitos de ataque das armas (substituem os efeitos desenhados por código)

Formato: sprite sheet horizontal, fundo transparente. Acrescente ao fim: `horizontal sprite sheet, N frames, each frame WxH, evenly spaced, consistent center, animation reads left to right` (troque N, W e H pelos valores da tabela).

| Arquivo | Quadros | Prompt |
|---|---|---|
| `fx-soulbolt-projectile.png` | 6 de 48x48 | `a violet soul flame projectile flying to the right, flickering skull core, wispy tail, looping flight animation` |
| `fx-soulbolt-hit.png` | 6 de 64x64 | `a violet soul burst impact, expanding ring and scattering wisps that fade out` |
| `fx-apocalypse-ray.png` | 8 de 192x48 | `a horizontal apocalyptic energy beam, white core, violet and gold lightning edges, charging then firing then fading` |
| `fx-scythe-spin.png` | 8 de 64x64 | `a void scythe spinning 360 degrees around its center, obsidian blade with violet motion trail, seamless loop` |
| `fx-hellfire-aura.png` | 8 de 192x192 | `a circular ring of hellfire seen from above, flames licking outward, empty transparent center, seamless loop` |
| `fx-supernova.png` | 10 de 192x192 | `an abyssal supernova explosion seen from above, black core collapsing then a crimson-white shockwave expanding and dissipating` |
| `fx-dagger-trail.png` | 4 de 48x48 | `a blood-red ritual dagger flying to the right with a crimson slash trail, slight flicker` |
| `fx-blade-rain.png` | 8 de 96x128 | `crimson daggers falling from above and stabbing the ground, blood splash on impact, then fading` |
| `fx-chain-link.png` | 1 de 32x16 | `a single black iron chain link segment with violet glow, horizontal, tileable left to right` |
| `fx-chain-bind.png` | 8 de 96x96 | `abyssal chains erupting from a dark portal on the ground and wrapping tight around an empty center, then snapping` |
| `fx-meteor-fall.png` | 6 de 64x96 | `an infernal meteor falling straight down with a long fire tail, rotating rock, looping` |
| `fx-meteor-impact.png` | 10 de 192x192 | `a meteor impact seen from above, fire explosion, expanding shockwave ring, molten crater cracks, smoke fading` |
| `fx-meteor-warning.png` | 4 de 128x128 | `a glowing red circular rune target on the ground, pulsing, baroque demonic glyphs around the edge, seamless loop` |
| `fx-ultimate-judgment.png` | 12 de 256x256 | `a massive crimson demonic explosion seen from above, pentagram sigil flash, pillars of red light, shockwave, embers fading` |

## 5. Efeitos gerais (inimigos, coleta, subir de nível)

| Arquivo | Quadros | Prompt |
|---|---|---|
| `fx-enemy-death.png` | 8 de 64x64 | `a small demon dissolving into dark smoke and red embers, soul wisp escaping upward` |
| `fx-hit-spark.png` | 5 de 32x32 | `a sharp white and crimson impact spark, star-shaped, quick flash` |
| `fx-level-up.png` | 10 de 128x128 | `a pillar of gold and violet light rising from a rune circle on the ground, sparkles, then fading` |
| `fx-gem-pickup.png` | 5 de 32x32 | `a small sparkle burst of green and gold glitter` |
| `fx-heal.png` | 8 de 64x64 | `rising green and crimson healing motes with small crosses, soft glow` |
| `fx-poison-pool.png` | 6 de 96x96 | `a bubbling toxic green slime puddle seen from above, bubbles popping, seamless loop` |
| `fx-sprint-dust.png` | 5 de 32x32 | `a small puff of dark dust and magenta sparks kicked up from the ground` |
| `fx-revive.png` | 12 de 128x128 | `a phoenix-like burst of crimson fire wings opening from ashes, gold sparks` |

## 6. Chefes — animações únicas de ataque

Mantenha o personagem igual ao sprite atual; envie o sprite existente como imagem de referência se o gerador permitir. Formato: 8 direções quando possível, senão as 4 principais (`south, east, north, west`).

### Imperatriz Rosalin (Succubus) — quadros de 92x92

| Arquivo | Quadros | Prompt |
|---|---|---|
| `rosalin-dash-windup.png` | 6 | `a red-haired succubus empress in a black and crimson dress, crouching and spreading her bat wings wide, charging energy, about to lunge` |
| `rosalin-dash.png` | 4 | `the same succubus empress lunging forward at high speed, wings folded back, crimson speed streak` |
| `rosalin-orb-cast.png` | 8 | `the same succubus empress raising one hand and conjuring dark violet orbs above her palm, hair flowing` |
| `rosalin-leap.png` | 8 | `the same succubus empress leaping high into the air with wings fully open, then diving down` |
| `rosalin-slam-impact.png` | 10 de 192x192 | `a crimson shockwave slam on the ground seen from above, cracked floor, heart-shaped dark energy burst, dust ring` |
| `rosalin-hurt.png` / `rosalin-death.png` | 4 / 12 | `the same succubus empress recoiling in pain` / `the same succubus empress falling to her knees and dissolving into rose petals and embers` |
| `rosalin-orb.png` | 6 de 48x48 | `a dark violet orb with a crimson heart-shaped core, pulsing, looping` |

### Azazel, o Anjo Caído — quadros de 112x112

| Arquivo | Quadros | Prompt |
|---|---|---|
| `azazel-teleport.png` | 8 | `a fallen angel with torn black feathered wings and a broken halo, dissolving into black feathers and reappearing` |
| `azazel-dash-windup.png` | 6 | `the same fallen angel drawing a long dark sword back, wings flared, red eyes glowing, about to charge` |
| `azazel-dash.png` | 4 | `the same fallen angel dashing forward with a sword thrust, black feather trail` |
| `azazel-lightning-cast.png` | 8 | `the same fallen angel raising his hand to the sky, summoning dark lightning, halo crackling` |
| `azazel-lightning-bolt.png` | 8 de 64x192 | `a vertical bolt of black and violet lightning striking the ground, white core, impact flash at the bottom` |
| `azazel-spiral-orb.png` | 6 de 32x32 | `a small corrupted holy orb, pale gold core with black cracks, looping pulse` |
| `azazel-darkness-roar.png` | 8 | `the same fallen angel spreading all wings and roaring, waves of darkness pouring out` |
| `azazel-clone.png` | 6 | `a translucent shadow copy of the same fallen angel, violet silhouette with glowing eyes, flickering` |
| `azazel-death.png` | 14 | `the same fallen angel kneeling, wings crumbling into ash, halo shattering, a last beam of light` |
| `azazel-feather.png` | 4 de 16x16 | `a single black feather drifting, slight rotation` |

## 7. Novos inimigos (próxima leva de conteúdo)

Formato: 64x64 por quadro, 8 direções, animações `walk` (6 quadros), `attack` (6) e `death` (8).

| Arquivo | Prompt |
|---|---|
| `enemy-cultist-*.png` | `a hooded arcane cultist in tattered crimson robes, faceless dark hood with two glowing violet eyes, holding a bone staff with a floating purple flame` |
| `enemy-brute-*.png` | `a hulking abyssal brute demon, massive stone-like arms, small head with broken horns, chains around the wrists, slow heavy stance` |
| `enemy-cultist-projectile.png` | `a small purple arcane flame bolt with a rune trail, 32x32, 4 frame loop` |
| `enemy-imp-*.png` | `a small mischievous red imp with oversized wings and a pointed tail, carrying a tiny pitchfork, fast and twitchy` |
| `enemy-wraith-*.png` | `a floating pale wraith with a torn shroud, hollow glowing eyes, long clawed hands, lower body fading into mist` |

## 8. Personagens e retratos

| Arquivo | Prompt |
|---|---|
| `portrait-<nome>-<emocao>.png` | `bust portrait of <descrição do personagem>, <emotion: neutral / angry / smirking / hurt / shocked>, facing 3/4, detailed pixel art, 200x200, dark vignette background removed` |
| `cutin-nixy-ultimate.png` | `dramatic anime-style cut-in of a purple-haired demon heroine with horns, eyes glowing magenta, hand reaching toward the viewer, crimson speed lines, wide 640x200 banner` |

Prompts completos para refazer as folhas da Nixy (fiel à arte da HUD): `docs/NIXY_SPRITE_PROMPTS.md`.

Para um **personagem jogável novo**, peça o conjunto completo no mesmo padrão da Nixy: `idle` (8 direções), `run` (8 direções, 6 quadros), `hurt` (8 direções, 3 quadros) e `death` (12 quadros), em 64x64 ou 80x80.

## 9. Cenário

| Arquivo | Prompt |
|---|---|
| `floor-<tema>.png` | `seamless tileable top-down floor texture, <cracked hellstone with glowing lava veins / bone-littered catacomb tiles / frozen abyss ice with trapped souls>, 256x256, no visible seams, dark and low contrast so characters stand out` |
| `prop-<nome>.png` | `top-down 3/4 view dungeon prop, <gothic broken pillar / iron torture cage / pile of skulls with candles / demonic statue / lava crack>, 96x96, soft shadow at the base` |

### 9.1. Cenário próprio de cada capítulo (lista fechada)

Hoje os capítulos 1 e 2 usam o mesmo chão e os mesmos objetos; só a cor do chão muda. Para cada capítulo ter a sua cara, gere **um conjunto por capítulo**: 1 chão + 6 objetos + 1 altar. Salve em `art-source/novos/cenario/` com os nomes abaixo e eu coloco no jogo e no Editor de Mapas.

Regras para todos: chão em 512x512, emendável nos quatro lados, **escuro e com pouco contraste** (os monstros precisam aparecer); objetos em 96x96 com fundo transparente e sombra suave na base.

**Capítulo 1 — Catacumbas de Rosalin** (quente, carmesim, luxo decadente)

| Arquivo | Prompt |
|---|---|
| `floor-ch1.png` | `seamless tileable top-down floor texture, dark cracked catacomb flagstones with faint crimson veins and scattered rose petals, 512x512, no visible seams, very dark, low contrast` |
| `ch1-prop-pillar.png` | `broken gothic marble pillar wrapped in thorned rose vines` |
| `ch1-prop-candelabra.png` | `tall iron candelabra with dripping red candles, small warm flame` |
| `ch1-prop-coffin.png` | `open velvet-lined coffin tilted on its side` |
| `ch1-prop-skulls.png` | `pile of skulls with melted candles on top` |
| `ch1-prop-statue.png` | `cracked statue of a winged succubus, one wing missing` |
| `ch1-prop-thorns.png` | `cluster of black thorn bushes with a few red roses` |
| `ch1-altar.png` | `circular summoning altar carved with a heart-shaped pentagram, crimson glow` (2 quadros: apagado e aceso) |

**Capítulo 2 — Santuário Caído de Azazel** (frio, azul-violeta, ruína celestial)

| Arquivo | Prompt |
|---|---|
| `floor-ch2.png` | `seamless tileable top-down floor texture, shattered pale cathedral marble with black feather stains and thin violet lightning cracks, 512x512, no visible seams, very dark, low contrast` |
| `ch2-prop-pillar.png` | `fallen white cathedral column, cracked, blackened at the base` |
| `ch2-prop-wing.png` | `giant broken stone angel wing lying on the ground` |
| `ch2-prop-halo.png` | `shattered golden halo half buried in rubble, faint glow` |
| `ch2-prop-brazier.png` | `iron brazier burning with cold violet fire` |
| `ch2-prop-statue.png` | `headless angel statue holding a broken sword` |
| `ch2-prop-feathers.png` | `heap of black feathers with small violet embers` |
| `ch2-altar.png` | `circular summoning altar with a fallen-angel sigil, violet lightning glow` (2 quadros: apagado e aceso) |

**Dimensão Corrompida (fase dos cristais do Azazel)**

| Arquivo | Prompt |
|---|---|
| `floor-dimension.png` | `seamless tileable top-down floor texture, void-black glass floor with floating magenta cracks and distant stars underneath, 512x512, no visible seams, very dark` |
| `dimension-prop-shard.png` | `floating jagged obsidian shard with magenta inner glow` |

**Capítulo 3** ainda não tem tema definido. Quando você escolher o bioma e o chefe, eu escrevo a lista dele no mesmo formato.

---

## 10. Folha da HUD nova (kit profissional, 16 peças)

A HUD atual mistura peças desenhadas por código (barras, radar, contador de combo) com poucas imagens. Esta folha troca **tudo** por arte de verdade, no mesmo estilo gótico-barroco do painel da Nixy. Gere **uma imagem só** com as 16 peças numa grade; eu recorto cada célula pelo fundo magenta, reduzo para o tamanho do jogo e encaixo.

**Como pedir (cole o bloco de estilo do topo e depois este prompt inteiro):**

```text
UI KIT SPRITE SHEET for a dark gothic pixel art action game HUD.
Canvas 2048x2048 pixels, solid flat magenta background (#FF00FF) everywhere that is not art,
divided into an invisible 4x4 grid of 512x512 cells. Exactly ONE element per cell, centered
in its cell, never touching or crossing into another cell, at least 24 px of pure magenta
margin around every element. No drop shadows on the background, no glow bleeding onto the
magenta, no text, no letters, no numbers anywhere.

Visual language for every piece: 16-bit pixel art, hand-placed pixels, hard 1-pixel dark
outline (#12020a), antique gold baroque filigree (#c59b27 to #f3d17a) over black-cherry
volcanic stone (#1a0208 to #3b0a14), small crimson rubies (#ff0055) as accents, tiny bone
and horn details, subtle ember-orange rim light from below. Readable at small size: big
simple silhouettes, strong value contrast, interiors of frames left EMPTY and dark so the
game can draw numbers and liquid inside them. Pieces 1-9 and 13-16 must share the exact
same gold, stone and ruby palette so they look like one set.

Row 1:
 Cell 1 - STATUS PANEL FRAME: a wide horizontal plaque, aspect 2.15:1, carved volcanic
   stone slab with a thick gold baroque border, two small horned gargoyle heads on the
   upper corners, molten lava cracks glowing along the bottom edge. On the left third a
   round socket (empty dark hole) for a potion orb; on the right two thirds two long
   empty horizontal grooves stacked vertically (top groove taller than bottom one) for
   health and stamina bars. Upper center has an empty flat banner area for the hero name.
 Cell 2 - HEALTH BAR FRAME: long thin horizontal bar frame, aspect 12:1, gold rim with a
   tiny ruby at each end and a small heart-shaped gold cap on the left end, interior
   completely empty and near-black.
 Cell 3 - HEALTH BAR FILL: the liquid that goes inside cell 2, same aspect 12:1 but 6%
   smaller, glossy crimson blood liquid (#d90429 base, #ff4d6d top highlight band, darker
   #6a0010 bottom band), flat ends, no frame.
 Cell 4 - STAMINA BAR FRAME: like cell 2 but thinner (aspect 16:1), gold rim, small
   winged-boot gold cap on the left end, empty interior.

Row 2:
 Cell 5 - STAMINA BAR FILL: liquid for cell 4, warm amber-gold energy (#e0a96d base,
   #ffe3a8 highlight band), flat ends, no frame.
 Cell 6 - EXPERIENCE BAR FRAME: very long, very thin frame meant to span the top of the
   screen, aspect 24:1, minimal gold line with small skull rivets every 1/8 of its length,
   empty interior.
 Cell 7 - EXPERIENCE BAR FILL: liquid for cell 6, glowing cyan-teal soul energy (#00f5d4
   base, #bfffff highlight), tiny brighter specks, flat ends.
 Cell 8 - ULTIMATE ORB FRAME: a round glass orb (perfect circle) held by a gold claw cage
   with four talons, a small inverted pentagram crest on top, the glass interior empty,
   dark and slightly reflective with one curved white highlight on the upper left.

Row 3:
 Cell 9 - ULTIMATE ORB LIQUID: a perfect disc that fits inside cell 8 glass, swirling
   violet-to-crimson demonic energy (#7b2cbf to #ff0055) with a bright gold swirl in the
   center, flat circular silhouette, no frame.
 Cell 10 - RADAR FRAME: a circular minimap ring, outer diameter fills the cell, thick gold
   ring with 8 small engraved tick marks (bigger tick at the top for north), four small
   bat-wing ornaments at north/east/south/west, interior completely empty and transparent
   black (#0b0205), ring thickness about 9% of the diameter.
 Cell 11 - KILLS ICON: a small horned demon skull, front view, crimson eyes, cracked bone,
   fills 70% of the cell, very bold silhouette.
 Cell 12 - SOULS ICON: a corrupted soul flame, blue-violet (#6d28d9 to #38bdf8) wisp with
   a tiny screaming face, fills 70% of the cell.

Row 4:
 Cell 13 - LEVEL BADGE: a small heraldic shield, gold rim, dark ruby center left EMPTY for
   a number, tiny bat wings on the sides.
 Cell 14 - COMBO EMBLEM: a backing plate for a big combo counter: jagged burst/explosion
   shape made of crimson and orange flames around an empty dark center, wide aspect 1.6:1,
   two crossed daggers behind it.
 Cell 15 - BOSS HEALTH BAR FRAME: ornate wide bar, aspect 9:1, black iron with gold trims,
   a large horned skull medallion in the exact center top edge, chains hanging at both
   ends, empty interior.
 Cell 16 - ALERT BANNER: a horizontal torn parchment ribbon / scroll, aspect 6:1, blood-red
   cloth with gold edges and two curled ends, center completely empty for text.
```

**Nomes que eu vou dar a cada peça depois de recortar** (só para você saber; não precisa fazer nada):

| Célula | Arquivo final | Tamanho no jogo |
|---|---|---|
| 1 | `hud-status-panel.png` | 448x210 |
| 2 / 3 | `hud-hp-frame.png` / `hud-hp-fill.png` | 240x20 |
| 4 / 5 | `hud-stamina-frame.png` / `hud-stamina-fill.png` | 240x15 |
| 6 / 7 | `hud-xp-frame.png` / `hud-xp-fill.png` | 1280x14 (eu estico o meio) |
| 8 / 9 | `hud-ult-orb-frame.png` / `hud-ult-orb-liquid.png` | 80x80 |
| 10 | `hud-radar-frame.png` | 120x120 |
| 11 / 12 | `hud-icon-kills.png` / `hud-icon-souls.png` | 32x32 |
| 13 | `hud-level-badge.png` | 40x40 |
| 14 | `hud-combo-emblem.png` | 200x125 |
| 15 | `hud-boss-bar-frame.png` | 520x58 |
| 16 | `hud-alert-banner.png` | 480x80 |

**Se o gerador errar a grade** (peças grudadas, tamanhos desiguais): gere em 4 imagens menores, uma por linha, pedindo `canvas 2048x512, 1x4 grid of 512x512 cells` e colando só a linha correspondente. Não precisa ficar perfeito: o importante é o **fundo magenta liso** e **uma peça por célula, sem encostar**.

Salve como `art-source/novos/hud-kit.png` (ou `hud-kit-linha1.png` … `linha4.png`).

---

## 11. Folha de itens (antigos refeitos + 4 novos, 16 peças)

Os itens novos já estão no jogo com **arte provisória desenhada por código** (bomba, ampulheta, frasco, relíquia). Esta folha substitui essas artes e refaz os itens antigos para ficarem no mesmo nível.

```text
GAME ITEM SPRITE SHEET, 16-bit pixel art, top-down 3/4 view collectible pickups for a dark
gothic hell survival game. Canvas 2048x2048 pixels, solid flat magenta background (#FF00FF),
invisible 4x4 grid of 512x512 cells, exactly ONE item per cell, centered, item fills about
70% of its cell, at least 40 px of pure magenta margin, nothing crosses into another cell.
No text, no numbers, no ground shadow, no glow spilling onto the magenta.

Shared style: hand-placed pixels, hard 1-pixel near-black outline (#12020a), strong
silhouette readable at 32x32, 3 to 4 shading tones per material, a single bright specular
pixel cluster on the upper-left, subtle colored rim light matching each item's aura color.
All items must look like they belong to the same set (same outline weight, same light
direction from the upper left, same level of detail).

Row 1 (classic items, redesigned):
 Cell 1 - BLOOD CHALICE (heals): ornate gold goblet with ruby studs, overflowing with
   glowing dark-red wine, a few drops running down the outside, faint green healing sparkle.
 Cell 2 - SOUL MAGNET: a horseshoe magnet forged from black iron and gold, tips glowing
   cyan (#38bdf8), three tiny soul gems floating toward it on curved trails.
 Cell 3 - ABYSS CHEST (closed): small heavy treasure chest of black wood and gold bands,
   a demon-face lock with ruby eyes, golden light leaking through the lid seam.
 Cell 4 - INFERNAL BOMB (new): round black iron bomb with riveted gold bands and a carved
   skull on the front, short braided fuse with a bright orange-white spark at the tip,
   molten orange cracks starting to glow on the shell.

Row 2 (new items):
 Cell 5 - SHATTERED HOURGLASS (freezes enemies): gothic hourglass with a gold frame and
   bone pillars, the upper glass bulb cracked, glowing turquoise (#00f5d4) sand frozen in
   mid-air as floating grains, faint clock-rune ring behind it.
 Cell 6 - FURY FLASK (fills the ultimate): round-bottom alchemy flask with a cork and gold
   wire, filled with swirling crimson-to-magenta (#ff0055) liquid, a tiny horned demon
   silhouette visible inside the liquid, small bubbles rising.
 Cell 7 - GOLDEN RELIC (treasure burst): an ancient gold medallion / idol coin with a
   four-pointed star engraving and a ruby in the center, a few small coins and gems
   spilling from behind it.
 Cell 8 - CORRUPTED SOUL (meta currency): a floating blue-violet soul flame with a tiny
   sorrowful face and a curling wisp tail.

Row 3 (experience gems, same cut, growing size and value):
 Cell 9  - GREEN SOUL GEM: small elongated hexagonal crystal, emerald green (#06d6a0).
 Cell 10 - BLUE SOUL GEM: same cut, slightly bigger, sapphire blue (#118ab2).
 Cell 11 - RED SOUL GEM: same cut, bigger, ruby red (#ef233c), tiny inner flame.
 Cell 12 - ORANGE SOUL GEM: same cut, same size as red, amber orange (#ff7b00).

Row 4:
 Cell 13 - PURPLE SOUL GEM: same cut, larger, amethyst (#b5179e) with a swirling core.
 Cell 14 - GOLD SOUL GEM: same cut, largest, radiant gold (#ffd700) with a white-hot core
   and four small sparkle points around it.
 Cell 15 - ABYSS CHEST (open): the same chest as cell 3 seen with the lid thrown open,
   a column of golden light and floating soul gems bursting out.
 Cell 16 - ASCENSION RUNE (ground decal for the new ultimate): a perfectly flat top-down
   circular magic seal seen from directly above, inverted pentagram inside two concentric
   rings of demonic runes, glowing crimson (#ff0055) lines with gold (#ffd166) highlights,
   empty dark center, NOT in 3/4 view, perfectly round.
```

| Célula | Arquivo final | Tamanho no jogo |
|---|---|---|
| 1 | `chalice.png` | 40x40 |
| 2 | `magnet.png` | 40x40 |
| 3 | `chest.png` | 40x40 |
| 4 | `bomb.png` | 40x40 |
| 5 | `hourglass.png` | 40x40 |
| 6 | `fury.png` | 40x40 |
| 7 | `relic.png` | 40x40 |
| 8 | `Soul.png` | 40x40 |
| 9 a 14 | `gem-green.png` … `gem-gold.png` | 40x40 |
| 15 | `chest-open.png` | 64x64 (roleta do baú) |
| 16 | `ult-rune.png` | 128x128 (runa sob os pés na Suprema) |

Salve como `art-source/novos/items-kit.png`. Quando os dois arquivos estiverem lá, me avise: eu recorto, troco a arte provisória e as barras desenhadas por código, e mostro o antes e depois.

---

## 12. Kit de cenário completo (Capítulo 1 — Catacumbas de Rosalin)

**Por que o cenário atual está feio:** são só 5 objetos (rocha, tocha, pilha de ossos, cristal e cogumelos), todos desenhados em 80x80 mas cada um num nível de zoom diferente. A pilha de ossos fica da altura da heroína, a tocha fica minúscula e a rocha enorme; as cores são tão vivas quanto as dos monstros, e não há nada no chão para quebrar a repetição da textura.

**A regra que resolve:** tudo desenhado **na mesma densidade de pixels** e com **altura definida em relação à heroína** (que mede ~56 px de altura no jogo). Por isso cada peça abaixo diz o tamanho em "alturas de personagem".

São **3 imagens**: a folha A (objetos grandes), a folha B (detalhes do chão e entulho pequeno) e o piso. Gere sempre com o mesmo gerador e, se ele permitir, com a mesma *seed*, para as três terem a mesma cara.

### Bloco comum (cole no começo das folhas A e B)

```text
TOP-DOWN 3/4 VIEW ENVIRONMENT SPRITE SHEET for a dark gothic pixel art survival game, art
style of a premium 16-bit era action RPG. Canvas 2048x2048 px, solid flat magenta background
(#FF00FF) everywhere outside the art. Invisible 4x4 grid of 512x512 cells, exactly ONE asset
per cell, centered horizontally, standing on an invisible ground line at 85% of the cell
height, never touching or crossing another cell, at least 32 px of pure magenta margin.
No text, no letters, no UI, no characters, no creatures, no frames around the cells.

CRITICAL SCALE RULE: every asset uses the SAME pixel density, as if one art pixel equals
4 screen pixels everywhere (chunky, uniform pixel grid, no mixed resolutions, no tiny
detailed pixels next to big blocky pixels). Sizes are given relative to ONE HUMAN-SIZED
CHARACTER HEIGHT (call it 1 CH). Respect the stated size of each asset exactly; smaller
assets must look small in the cell, do not stretch them to fill.

CAMERA: top-down 3/4 view, about 45 degrees, the same angle for every asset: we see the top
surface AND the front face of objects. Light comes from the upper-left, so the right and
bottom faces are darker. Every grounded asset has a small, solid, dark purple-black contact
shadow (#14060c) directly under its base, slightly offset to the lower-right, fully inside
its cell.

PALETTE AND VALUE HIERARCHY (very important for gameplay readability): environment must be
MUTED and DARKER than characters. Use desaturated cold stone grays with a violet tint
(#2a2230, #3d3344, #5a4d63), aged bone ivory only as highlights (#cfc3a8, never pure white),
dried blood dark red (#5a0f1c), tarnished gold (#8a6a2a), and small warm accents only on
light sources (candle flame #ffb347, ember #ff5a1f). No neon, no saturated pinks or bright
reds except on flames and glowing runes. Hard 1-pixel dark outline (#0e0610) on every
asset, 3 to 4 shading steps per material, crisp clusters, no anti-aliasing, no blur, no
gradients, no dithering noise.

THEME: the catacombs of a decadent succubus empress: crimson rose vines, black thorns,
velvet, melted red candles, gothic arches, skulls arranged with care, ritual circles.
```

### Folha A — objetos grandes e fontes de luz

Cole o bloco comum e depois isto:

```text
Row 1 - large blockers (things the player walks around):
 Cell 1 - BROKEN GOTHIC PILLAR: a cracked carved stone column snapped at mid-height, the
   fallen top piece lying beside the base, thorned rose vines with a few small dark-red
   roses climbing it. Height 2.2 CH, base about 0.9 CH wide.
 Cell 2 - GOTHIC ARCH RUIN: a free-standing half-collapsed pointed stone arch (two uneven
   legs, the left taller), small skull keystone at the top. Height 2.5 CH, width 1.8 CH.
 Cell 3 - SUCCUBUS STATUE: a cracked statue of a winged woman with long hair and small
   horns on a square plinth, one wing broken off, a crown of thorns, muted gray stone with
   tarnished gold trims. Height 2.4 CH.
 Cell 4 - SARCOPHAGUS: a heavy stone sarcophagus seen from 3/4, the lid slid half open
   revealing darkness, carved rose pattern on the lid, a red velvet cloth hanging out.
   Length 1.6 CH, height 0.7 CH.

Row 2 - rocks and rubble, the SAME rock material in four sizes (so they can be mixed):
 Cell 5 - BOULDER LARGE: one big angular violet-gray rock with a flat top, a thin crack and
   a little moss of dark red lichen. Height 1.1 CH, width 1.4 CH.
 Cell 6 - BOULDER MEDIUM: two medium rocks leaning together. Height 0.7 CH.
 Cell 7 - ROCKS SMALL: a cluster of 4 small stones. Height 0.3 CH, width 0.8 CH.
 Cell 8 - RUBBLE PILE: broken brick and carved stone fragments with one skull among them.
   Height 0.4 CH, width 1.2 CH.

Row 3 - light sources (they will get a glow added in the game, so keep the flame compact):
 Cell 9 - STANDING IRON TORCH: a tall wrought-iron torch stand with a spiked bowl holding a
   compact orange flame. Height 1.5 CH (taller than the character).
 Cell 10 - CANDELABRA: a tall gothic iron candelabra with five melted red candles, wax
   dripping down to the floor, small flames. Height 1.4 CH.
 Cell 11 - CANDLE CLUSTER: a group of seven melted red candles of different heights on the
   floor, wax pooled together, tiny flames. Height 0.4 CH, width 0.8 CH.
 Cell 12 - RITUAL BRAZIER: a low black-iron bowl on three clawed legs with embers and a
   small crimson flame. Height 0.8 CH.

Row 4 - set dressing with personality:
 Cell 13 - SKULL ALTAR: a small stone table covered by a torn red cloth, three skulls and
   two candles on it neatly arranged. Height 0.9 CH, width 1.1 CH.
 Cell 14 - BONE PILE (SMALL, PROPORTIONATE): a modest heap of a few bones and two skulls,
   KNEE HIGH ONLY. Height 0.35 CH, width 0.7 CH.
 Cell 15 - IRON CAGE: an empty rusty hanging-style cage standing on the floor, door open,
   a few bones inside. Height 1.3 CH.
 Cell 16 - THORN BUSH: a dense cluster of black thorny branches with three small dark-red
   roses and a few fallen petals. Height 0.6 CH, width 1.0 CH.
```

### Folha B — detalhes de chão (quebram a repetição) e entulho pequeno

Cole o bloco comum, **trocando a frase da câmera** por esta: `CAMERA FOR DECALS: perfectly flat top-down decals painted ON the floor, no height, no front face, no contact shadow.` Depois cole:

```text
Row 1 - large floor decals (flat, semi-irregular silhouettes, darker than the floor):
 Cell 1 - CRACKED FLOOR PATCH: a broken flagstone area with dark deep cracks spreading out,
   2.0 CH wide.
 Cell 2 - OLD BLOOD POOL: a dried dark-red blood stain with splatter drops, 1.4 CH wide.
 Cell 3 - FADED RITUAL CIRCLE: an old chalk-and-blood summoning circle on the floor, partly
   erased, rose-shaped pentagram, very low contrast, 2.4 CH wide.
 Cell 4 - LAVA CRACK: a jagged crack in the floor with a thin glowing ember-orange line
   inside, the only bright decal, 1.8 CH long.

Row 2 - medium floor decals:
 Cell 5 - SCATTERED ROSE PETALS: a loose trail of dark-red petals, 1.0 CH wide.
 Cell 6 - WAX DRIPS: hardened red candle wax splashes, 0.8 CH wide.
 Cell 7 - SCORCH MARK: a burned black star-shaped mark, 1.2 CH wide.
 Cell 8 - MOSS AND LICHEN: dark purple moss growing between floor stones, 1.0 CH wide.

Row 3 - small clutter (with height and contact shadow, use the normal camera rule):
 Cell 9 - SINGLE SKULL lying on its side. 0.2 CH.
 Cell 10 - SCATTERED BONES: three loose bones. 0.15 CH tall, 0.6 CH wide.
 Cell 11 - BROKEN CHAIN with a shackle lying on the floor. 0.7 CH long.
 Cell 12 - FALLEN SWORD rusted, lying diagonally. 0.9 CH long.

Row 4 - small clutter:
 Cell 13 - BROKEN POTTERY: a cracked clay urn and shards. 0.4 CH.
 Cell 14 - SPIDER WEB stretched in a corner shape (to place at the base of walls). 0.8 CH.
 Cell 15 - GRASS OF THORNS: three small black thorn sprouts. 0.25 CH.
 Cell 16 - GLOWING RUNE STONE: a small flat stone with a faint red rune. 0.3 CH.
```

### Piso (imagem separada, sem magenta)

```text
Seamless tileable top-down floor texture for a dark gothic pixel art game, catacomb floor
made of irregular dark violet-gray flagstones (#1c1620 to #2e2634) with thin black mortar
lines, a few subtle cracks, very faint crimson veins, NO big landmarks, NO skulls, NO
bright spots, extremely low contrast so characters and enemies pop on top of it, uniform
chunky pixel grid matching 4 screen pixels per art pixel, 512x512, tiles perfectly on all
four sides with no visible seams.
```

### Capítulo 2 (Santuário Caído de Azazel)

Use os mesmos textos trocando o **THEME** por: `a fallen celestial cathedral: shattered pale marble, black feathers, broken golden halos, cold violet fire, angel statues missing their heads, thin violet lightning cracks`, e as cores de destaque por `#4b3f6b, #8f86b5, tarnished gold #8a6a2a, cold flame #9d7bff`. Troque as peças por equivalentes do tema (estátua de anjo sem cabeça, asa de pedra caída, auréola quebrada, braseiro de fogo violeta, penas pretas, rachaduras com raio violeta).

### Onde salvar e o que eu faço depois

Salve em `art-source/novos/cenario/ch1-props.png`, `ch1-decals.png` e `floor-ch1.png` (e `ch2-...` para o Capítulo 2). Ao receber, eu:

1. Recorto pelo magenta e reduzo tudo **com o mesmo fator**, para manter a proporção entre as peças.
2. Separo as peças em três camadas: decalques colados no chão, entulho que o jogador atravessa, e objetos grandes que bloqueiam a passagem (com colisão).
3. Ordeno a profundidade pela base de cada objeto, para a heroína passar atrás de pilares e estátuas em vez de por cima.
4. Monto composições em vez de espalhar objetos soltos: pilar + rosas + pétalas no chão; altar + velas + mancha de sangue; tocha com luz quente pulsando.
5. Espalho decalques aleatórios pelo mapa inteiro para o piso não parecer repetido, e coloco tudo no Editor de Mapas.

---

## 17. Cena final do Capítulo 2 (Azazel derrotado, 3 imagens)

O fim do Capítulo 2 usava as imagens do fim do Capítulo 1, que mostram a Rosalin. Agora usa um céu violeta provisório até estas 3 imagens existirem. Gere **uma imagem por vez** e **anexe `public/assets/scenes/chapter1/EndChap1_4.jpg` no ChatGPT como referência de estilo** (mesmo traço, mesma Nixy, mesmo enquadramento).

Bloco comum (cole no começo de cada um dos 3 prompts):

```text
Use the attached image as the exact STYLE and CHARACTER reference: same pixel art look,
same rendering, same lighting, same Nixy design (purple hair with antenna curl, white
striped horns, pointed ears, white mask with jagged teeth and X eyes, dark purple
high-collar cloak, white gloves). Same composition idea: Nixy close-up in the LEFT third,
the defeated boss in the RIGHT half in the background. Widescreen 1376x768, full scene,
no text, no letters, no UI, no watermark, no borders.
The boss is AZAZEL, a FALLEN ANGEL of the abyss: tall gaunt figure in a long tattered
black robe, pale bone-white skull-like face, long dark violet horns curving back, huge
torn BLACK FEATHERED wings, a broken tarnished-gold halo, crimson and violet energy.
Setting: AZAZEL'S CORRUPTED DIMENSION: a dark violet sky with swirling black clouds,
shattered crystal shards on cracked obsidian ground, floating black feathers, faint
violet light. Palette: deep violet, black, crimson accents, tarnished gold. NOT the red
sky of the reference: this place is violet and black.
```

Imagem 1 (`EndChap2_1.jpg`), cole o bloco comum e depois:

```text
SCENE: Azazel has just been defeated. He kneels on the cracked obsidian ground on the
right, one hand on the floor, his black wings torn and drooping, his broken halo split
in two pieces lying beside him, violet crystal shards scattered around him. Nixy in the
left foreground looks at him coldly, calm and confident.
```

Imagem 2 (`EndChap2_2.jpg`), cole o bloco comum e depois:

```text
SCENE: the final blow. Azazel on the right is dissolving into a storm of black feathers
and violet ash rising into the sky, his body half faded. Nixy in the left foreground has
one gloved hand raised toward him, absorbing a stream of violet soul energy into her palm.
```

Imagem 3 (`EndChap2_3.jpg`), cole o bloco comum e depois:

```text
SCENE: after the battle. On the right only remains are left: the broken golden halo on
the ground, a pile of black feathers and fading violet embers. Nixy in the left
foreground with eyes closed and a satisfied smirk behind the mask, cloak moving in the
wind, black feathers drifting around her.
```

Salve como `art-source/novos/EndChap2_1.jpg`, `EndChap2_2.jpg` e `EndChap2_3.jpg` e me avise. Eu coloco em `public/assets/scenes/chapter2/`, carrego no `BootScene` com as chaves `endchap2-1` a `endchap2-3` e a cena passa a usá-las sozinha (o fundo provisório só aparece enquanto essas chaves não existem).

---

## 16. Azazel: projéteis e efeitos das habilidades (8 peças)

Troca as orbes feias e os efeitos desenhados por código das habilidades do Azazel. Uma imagem, grade 4x2; eu recorto pelo magenta e ligo cada peça ao golpe dela.

| Célula | Peça | Onde aparece | Arquivo final |
|---|---|---|---|
| 1 | Orbe sombria | Disparo direcionado, teleporte, clones da escuridão | `azazel-orb.png` |
| 2 | Pena negra | Leque de Penas (novo) | `azazel-feather.png` |
| 3 | Raio vertical | Tempestade de Raios | `azazel-lightning-bolt.png` |
| 4 | Marca do impacto do raio | Chão onde o raio caiu | `azazel-lightning-scorch.png` |
| 5 | Auréola partida | Onda da Auréola Partida (nova) | `azazel-halo-ring.png` |
| 6 | Explosão de penas e fumaça | Teleporte e reaparições | `azazel-teleport-burst.png` |
| 7 | Sigilo de aviso no chão | Marcação antes do raio | `azazel-warning-sigil.png` |
| 8 | Orbe da espiral | Barragem em Espiral | `azazel-spiral-orb.png` |

Prompt único — copiar e colar inteiro:

```text
Create ONE image: a pixel art sprite sheet of 8 attack effects for a FALLEN ANGEL boss
(Azazel) in a dark gothic hell-themed 2D top-down action roguelite.

=== GLOBAL STYLE (applies to every piece) ===
16-bit pixel art, hand-placed pixels, crisp hard edges, NO anti-aliasing, NO blur, NO soft
airbrush gradients, NO photorealism, NO 3D render look. Theme: a fallen angel of the
abyss: black feathers, broken holy light turned corrupt, crimson and violet energy,
tarnished gold. Palette ONLY: near-black purple (#0b0208, #1a0a1f), deep violet (#4b1673,
#7b2cbf), neon magenta-violet glow (#c77dff, #e0aaff), crimson (#ff0044, #8a0f2a),
hot pink-white core highlights (#ffd6ff), tarnished gold (#8a6a2a, #c59b27), bone white
(#efe6d8). Strong 1-2 pixel near-black outline (#12020a) on solid shapes. Bright glowing
core, darker rim, high contrast so each piece reads at small size on a dark floor.
No text, no letters, no numbers, no watermark, no signature anywhere.

=== CANVAS AND BACKGROUND ===
Canvas 2048x1024 pixels, landscape. The ENTIRE background is solid flat pure magenta
#FF00FF, one single color, no texture, no vignette, no shadow on it, no glow bleeding onto
it, no transparency checkerboard. Invisible grid of 4 columns x 2 rows of 512x512 cells.
Exactly ONE piece per cell, centered in its cell, never touching or crossing into another
cell, at least 40 px of pure #FF00FF margin around every piece. Do not use magenta inside
the art itself (use violet #7b2cbf or pink-white #ffd6ff instead).

=== ROW 1 (left to right) ===
Cell 1 - DARK SOUL ORB (projectile, flies to the RIGHT): a round orb of swirling violet and
  crimson soul energy with a bright pink-white core, a tiny screaming skull face faintly
  visible inside, and a short wispy smoke tail trailing to the LEFT. Compact, fills about
  45% of the cell.
Cell 2 - BLACK FEATHER (projectile, points to the RIGHT): one long sharp black angel
  feather lying horizontal, quill on the LEFT and razor tip on the RIGHT, glowing crimson
  edge along the vane, two tiny violet sparks behind it. Fills about 70% of the cell width,
  thin height.
Cell 3 - LIGHTNING BOLT (vertical): a jagged corrupted lightning bolt falling straight down
  from the TOP edge of the art to the BOTTOM, crimson outer glow, violet body, pink-white
  core line, small branching forks. Tall and narrow: fills about 85% of the cell height.
Cell 4 - LIGHTNING SCORCH (top-down ground mark): a round blackened crater seen from above,
  cracked stone, glowing crimson-violet cracks radiating out, a few small embers. Flat on
  the ground, fills about 70% of the cell.

=== ROW 2 (left to right) ===
Cell 5 - BROKEN HALO RING (top-down): a big perfect CIRCLE ring seen from above, made of
  tarnished gold with violet corrupted energy, cracked into 5 segments with small gaps
  between them, tiny floating shards near each gap, faint crimson glow. The ring is THIN
  (about 6% of its diameter) and the CENTER IS EMPTY flat magenta #FF00FF. Fills about 90%
  of the cell.
Cell 6 - TELEPORT BURST: a round explosion of black feathers and violet smoke puffs
  bursting outward from the center, a pink-white flash in the middle. Fills about 75% of
  the cell.
Cell 7 - WARNING SIGIL (top-down ground marker): a circular demonic sigil drawn on the
  floor, thin crimson glowing lines: outer circle, inner circle, an inverted broken-halo
  symbol and small runes around the edge, everything thin and clean. The CENTER and the
  spaces between lines are EMPTY flat magenta #FF00FF. Fills about 85% of the cell.
Cell 8 - SPIRAL ORB (projectile, flies to the RIGHT): smaller than cell 1, a crimson-gold
  orb with a hot white core and a short curved spiral tail trailing to the LEFT. Fills about
  35% of the cell.

=== DO NOT ===
Do not add circles, frames or backgrounds behind the pieces. Do not merge or overlap
pieces. Do not draw the Azazel character itself. Do not add text or numbers.
```

**Se o gerador errar a grade:** gere em 2 imagens, uma por linha, pedindo `canvas 2048x512, 4 columns x 1 row of 512x512 cells`.

Salve como `art-source/novos/azazel-efeitos.png` e me avise.

---

## 15. Menu de pausa (moldura, placa do título e 3 botões)

O conteúdo do menu (tempo, abates, nível, almas, bônus, armas, volume) já é desenhado pelo jogo. Esta folha dá a **borda** em volta do painel, a **placa do título** e os **3 botões**, no mesmo estilo violeta do painel de status. Tudo vazio por dentro: o jogo escreve os textos.

Prompt único — copiar e colar inteiro:

```text
Create ONE image: a pixel art UI sprite sheet for the PAUSE MENU of a dark gothic
hell-themed 2D action roguelite game. Clean and elegant, NOT overloaded: few ornaments,
strong silhouette, lots of calm empty space inside.

=== GLOBAL STYLE (applies to everything) ===
16-bit pixel art, hand-placed pixels, crisp hard edges, NO anti-aliasing, NO blur, NO soft
airbrush gradients, NO photorealism, NO 3D render look. Dark gothic demonic fantasy, same
look as a violet obsidian-and-crystal relic. Strong 1-pixel near-black purple outline
(#12020a) around every shape. Palette ONLY: near-black purple (#0b0208, #12061a), dark
violet stone (#2a1238, #3d1a52), deep violet (#6a1fa0, #9b5de5), neon magenta glow
(#d61cff, #ff4df0), white-pink highlights (#ffd6ff), small crimson accents (#ff0055,
#8a0f2a), a little bone white (#efe6d8). No gold, no orange, no lava, no green.
No text, no letters, no numbers, no icons, no watermark, no signature anywhere.

=== CANVAS AND BACKGROUND ===
Canvas 1536x1024 pixels, landscape. The ENTIRE background is solid flat pure magenta
#FF00FF, one single color, no texture, no vignette, no shadow on it, no glow bleeding onto
it, no transparency checkerboard. Every piece is separate, never touching another piece,
with at least 40 px of pure #FF00FF around each one.

Layout:
- LEFT AREA (x from 0 to 1050): piece A, centered in that area.
- RIGHT COLUMN (x from 1090 to 1536): pieces B, C, D and E stacked from top to bottom,
  each centered horizontally in the column, evenly spaced.

=== PIECE A — PANEL BORDER FRAME (the main piece) ===
A rectangular ornate border frame. Its INNER OPENING is a clean rectangle with aspect
ratio exactly 1.37 : 1 (for example 900 x 657 px), with slightly rounded inner corners.
The inside of the opening is filled with solid flat pure magenta #FF00FF exactly like the
background (it will be cut out; the game draws the menu content there).
The border band itself is THIN: about 18-22 px thick, made of dark violet obsidian with a
1-2 px glowing magenta inner edge line all around the opening.
Ornaments, outside the opening only, never covering it:
- Four corners: each corner has a small cluster of 2-3 sharp violet crystals plus one
  short curved black horn pointing diagonally outward.
- Top center: a small crest sitting on the top edge: a tiny horned skull (bone white with
  glowing magenta eyes) with two small bat wings spread left and right, no wider than 20%
  of the frame width.
- Bottom center: a single downward crystal spike with a glowing magenta gem.
- Left and right edges: a thin thorny black vine running along the middle third of each
  side, with 2 tiny crimson rose buds.
Everything else on the band stays plain and calm. Symmetric left-right.

=== PIECE B — TITLE PLAQUE (about 420 x 90 px, aspect 4.6 : 1) ===
A horizontal plaque of dark violet obsidian with a thin glowing magenta border, small
pointed (hexagonal) ends, a tiny crystal on each end. Inside completely EMPTY, flat dark
(#12061a), no letters: the game writes "JOGO PAUSADO" on it.

=== PIECES C, D, E — BUTTONS (each about 400 x 86 px, aspect 4.6 : 1) ===
Three button plates with the same shape: horizontal plate with pointed hexagonal ends,
thin outer outline, a 2 px lighter bevel on top and a darker band at the bottom, small
crystal stud on each end. Inside EMPTY, no letters, no icons.
- C (CONTINUE): rich violet-purple plate (#4b1673 body, #d61cff glowing border).
- D (RESTART): deep crimson plate (#5a0f1f body, #ff4d6d border).
- E (MENU): dark violet-black plate (#241030 body, #9b5de5 border).

=== DO NOT ===
Do not write any text. Do not draw stats, sliders, icons or any content inside the frame
opening. Do not add statues, angels, gargoyles, big wings, chains everywhere, candles or
roses all over: keep it simple. Do not merge pieces.
```

**Se o gerador errar:** gere a peça A sozinha (apague as peças B a E e o "RIGHT COLUMN") e depois B, C, D e E numa segunda imagem. O importante é o fundo magenta liso e a abertura da moldura também magenta.

Salve como `art-source/novos/pausa-moldura.png` e me avise.

**Já gerado e no jogo** (`art-source/novos/pausa-moldura.jpg`). Para trocar: `python scripts/cut-pause-frame.py <imagem> public/assets/sprites/items`. A moldura é alargada repetindo trechos lisos da borda (colunas e linhas em `SEAM_COLS`/`SEAM_ROWS` no script); numa arte nova essas posições mudam.

---

## 14. Ícones das 8 cartas que ainda não têm ícone

Cartas de upgrade só mostram o ícone redondo do meio se tiverem arte própria ligada em `CARD_ICON_KEYS` (`src/systems/UpgradeCatalog.ts`). Estas 8 não tinham. Uma imagem só, grade 4x2; eu recorto pelo magenta e ligo cada ícone à sua carta.

| Célula | Carta | Arquivo final |
|---|---|---|
| 1 | Alma Extra (`multishot`) | `icon-card-multishot.png` |
| 2 | Perfuração Mística (`pierce`) | `icon-card-pierce.png` |
| 3 | Pulmões do Demônio (`stamina`) | `icon-card-stamina.png` |
| 4 | Olho do Abismo (`crit_chance`) | `icon-card-crit-chance.png` |
| 5 | Golpe Fatal (`crit_damage`) | `icon-card-crit-damage.png` |
| 6 | Passo Sombrio (`dash_mastery`) | `icon-card-dash.png` |
| 7 | Alma Instável (`corpse_explosion`) | `icon-card-corpse-explosion.png` |
| 8 | Sede de Sangue (`bloodthirst`) | `icon-card-bloodthirst.png` |

Prompt único — copiar e colar inteiro:

```text
Create ONE image: a sprite sheet of 8 game icons for upgrade cards of a dark gothic
hell-themed 2D pixel art action roguelite.

=== GLOBAL STYLE (applies to every icon) ===
16-bit pixel art, hand-placed pixels, crisp hard edges, NO anti-aliasing, NO blur, NO soft
airbrush gradients, NO photorealism, NO 3D render look. Dark gothic baroque demonic fantasy,
hell and catacombs theme. Strong 2-pixel near-black purple outline (#12020a) around every
icon. Palette: near-black purple shadows (#0b0208, #1a0a1f), crimson red (#ff0055, #d90429),
ember orange (#ff7a1a), deep violet (#6a1fa0, #9b5de5), neon magenta glow (#d61cff),
antique gold (#c59b27, #f3d17a), bone white (#efe6d8), soul cyan (#00f5d4) only where
stated. High contrast, dramatic rim light, one clear bright focal point per icon.
Icons must read instantly at very small size (52x52 px in game): ONE big simple central
object, bold chunky silhouette, few details, no tiny clutter.
Each icon will be shown inside a small dark CIRCLE in the game, so every icon must have a
compact roughly round or square silhouette that fits inside a circle, centered, filling
about 75% of its cell. Do NOT draw any circle, ring, frame, badge, card or background
behind the icons.
No text, no letters, no numbers, no watermark, no signature anywhere.

=== CANVAS AND BACKGROUND ===
Canvas 2048x1024 pixels, landscape. The ENTIRE background is solid flat pure magenta
#FF00FF, one single color, no texture, no vignette, no shadow on it, no glow bleeding onto
it, no transparency checkerboard. Invisible grid of 4 columns x 2 rows of 512x512 cells.
Exactly ONE icon per cell, centered in its cell, never touching or crossing into another
cell, at least 48 px of pure #FF00FF margin around every icon. All 8 icons share the same
pixel size, outline thickness, lighting direction (light from upper left) and palette so
they look like one set.

=== ROW 1 (left to right) ===
Cell 1 - EXTRA SOUL (more projectiles): three glowing violet-magenta soul orbs flying
  forward together in a fan shape, each with a short comet tail, the middle one biggest,
  small white-pink highlights.
Cell 2 - PIERCING (shots go through enemies): a long crimson-and-gold spectral arrow /
  bolt piercing straight through two small horned demon skulls lined up one behind the
  other, the arrow tip glowing white, a few bone chips flying.
Cell 3 - DEMON LUNGS (more stamina): a pair of dark red demonic lungs made of cracked
  stone and veins, with small curved horns on top, glowing ember-orange breath / heat
  wisps rising from them, a golden energy glow inside.
Cell 4 - EYE OF THE ABYSS (critical chance): a single huge demonic eye, vertical slit
  pupil, crimson-magenta iris, inside a dark violet stone socket with spiky lashes / thorns
  around it, a small golden 4-point sparkle on the pupil.

=== ROW 2 (left to right) ===
Cell 5 - FATAL STRIKE (critical damage): a heavy curved demon blade / cleaver striking
  diagonally, a big jagged crimson-and-gold impact burst star at the point of impact,
  blood droplets, the blade edge glowing white-hot.
Cell 6 - SHADOW STEP (dash that cuts enemies): a dark violet hooded shadow silhouette
  dashing to the right with 3 fading magenta afterimages behind it, a thin bright crimson
  slash line cutting across the afterimages.
Cell 7 - UNSTABLE SOUL (enemies explode on death): a cracked bone-white skull bursting
  apart from the inside, violet-magenta soul energy and ember-orange fire exploding out of
  its cracks and eye sockets, small skull fragments flying outward.
Cell 8 - BLOODTHIRST (combo lasts longer): an ornate gold chalice / goblet overflowing with
  thick glowing crimson blood dripping down its sides, two small curved fangs on the rim,
  a faint hourglass shape engraved on the cup.

=== DO NOT ===
Do not add circles, rings, frames or backgrounds behind icons. Do not merge or overlap
icons. Do not add any text or numbers. Do not make the icons thin, long or tiny: they must
be chunky and fill the cell.
```

**Se o gerador errar a grade** (ícones grudados ou de tamanhos diferentes): gere em 2 imagens, uma por linha, pedindo `canvas 2048x512, 4 columns x 1 row of 512x512 cells` e colando só as células daquela linha.

Salve como `art-source/novos/icones-cartas.png` (ou `icones-cartas-linha1.png` e `linha2.png`) e me avise.

**Já gerado e no jogo** (`art-source/novos/icones-cartas.jpg`). Para trocar, gere de novo na mesma ordem e rode `python scripts/cut-card-icons.py <imagem> public/assets/sprites/icons/blessings 96`.

---

## 13. Painel de status novo (moldura violeta com janelas para as barras)

Substitui o painel de pedra com lava do canto inferior direito. A moldura tem **duas janelas vazadas**: o jogo desenha vida e estamina **atrás** da moldura, e a borda da moldura cobre as pontas das barras, então tudo parece uma peça só. O nível continua escrito por código, em cima, à esquerda da barra de vida. O nome do personagem vem numa peça separada (para funcionar com outros personagens).

Prompt único (já inclui o bloco de estilo) — copiar e colar inteiro:

```text
Create ONE image: a pixel art UI sprite sheet for the player status HUD of a dark gothic
hell-themed 2D action roguelite game.

=== GLOBAL STYLE (applies to everything) ===
16-bit pixel art, hand-placed pixels, crisp hard edges, NO anti-aliasing, NO blur, NO soft
airbrush gradients, NO photorealism, NO 3D render look. Dark gothic baroque demonic fantasy,
hell and catacombs theme. Strong 1-pixel near-black purple outline (#12020a) around every
shape. Palette ONLY: near-black purple shadows (#0b0208, #1a0a1f), dark violet stone
(#2a1238, #3d1a52), deep violet (#6a1fa0, #9b5de5), hot neon magenta glow (#d61cff, #ff4df0),
white-pink highlights (#ffd6ff), small crimson accents (#ff0055). No gold, no orange, no lava.
High contrast, dramatic magenta rim light. No text, no letters, no numbers, no watermark,
no signature anywhere except the logo in piece B.

=== CANVAS AND BACKGROUND ===
Canvas 1536x1024 pixels, landscape. The ENTIRE background is solid flat pure magenta
#FF00FF, one single color, no texture, no vignette, no shadow on it, no glow bleeding onto it.
Every piece is separate, never touching another piece, with at least 40 px of pure #FF00FF
around each one.

Layout:
- TOP AREA (upper 640 px): piece A, centered horizontally.
- BOTTOM STRIP (lower 340 px), three pieces side by side from left to right: piece B,
  piece C, piece D.

=== PIECE A — STATUS PANEL FRAME (the main piece, about 1300 px wide x 605 px tall,
aspect ratio 2.15:1) ===
A wide horizontal ornate frame/plaque, symmetric left-right, in the style of a demonic
crystal-and-obsidian relic, glowing neon magenta and violet.
Shape and ornaments:
- Body: a horizontal plaque of dark violet obsidian stone with cracked texture, edged by a
  thick ornate border of jagged violet crystal and twisted thorny demonic filigree, with
  thin glowing magenta energy veins running inside the stone.
- Top edge: in the upper center a large EMPTY dark recessed banner area (about 55% of the
  width, from 4% to 38% of the height) where a character name logo will be placed later.
  Leave it plain dark stone with a soft magenta inner glow, NO letters.
- Left end: a large round demonic sigil medallion (circle about 32% of the panel height)
  centered at about 9% of the width and 62% of the height, with a glowing magenta eye /
  crystal core, framed by curved horns and small bat-wing / claw spikes sweeping outward.
- Right end: a mirrored set of curved horns and bat-wing spikes, simpler and smaller than
  the left side (the right 15% of the panel will be partly covered by a character portrait
  in game, so keep the detail there low).
- Bottom center: a downward-pointing crystal spike with a glowing magenta gem at its tip,
  hanging below the bottom edge.
- Small floating magenta sparks and violet smoke wisps around the outer silhouette only.

THE TWO WINDOWS (MOST IMPORTANT):
The frame must have two long horizontal rectangular openings that go all the way through
the art. Fill the inside of both openings with solid flat pure magenta #FF00FF exactly like
the background (they will be cut out to transparent so the game can draw the bars BEHIND
the frame).
- WINDOW 1 (health): from 22% to 84% of the panel width, from 46% to 57% of the panel
  height. Straight long edges, short ends slightly pointed (like an elongated hexagon).
- WINDOW 2 (stamina): same left and right limits as window 1 (22% to 84% of the width),
  from 62% to 69% of the height, thinner than window 1, same pointed ends.
- Around each window: a thin raised violet crystal lip 3-4 pixels thick with a magenta
  inner edge highlight, so the frame looks like it overlaps the edges of whatever is
  behind it. The lip must NOT intrude into the window and must NOT cast glow inside it.
- Between the two windows: a thin horizontal strip of frame stone (from 57% to 62% of the
  height), solid, not transparent.
- LEVEL SPOT: just above window 1, on its left end (from 22% to 38% of the width, from 38%
  to 45% of the height), keep a small flat smooth dark area with no ornaments, where the
  game will write the level number. No letters there.
- Nothing else inside the frame is transparent: only those two windows are #FF00FF.

=== PIECE B — CHARACTER NAME LOGO "NIXY" (about 560 x 250 px) ===
The word "NIXY" in large tall gothic blackletter / demonic display lettering, all
uppercase, pixel art, glowing neon magenta and violet with white-pink highlights, thick
near-black outline, small thorns and sharp serifs on the letters, a little magenta sparkle
on the dot area of the letter I. Letters must read clearly as N-I-X-Y. Same palette and
style as piece A so it sits naturally in A's top banner. Solid #FF00FF around it.

=== PIECE C — HEALTH BAR FILL (about 420 x 60 px) ===
A flat horizontal rectangle with straight square ends and no frame and no border: glossy
crimson blood liquid, base #d90429, a 2-pixel brighter band near the top (#ff4d6d),
a darker band at the bottom (#6a0010), a few tiny pixel bubbles. Perfectly rectangular
silhouette so it can be stretched horizontally.

=== PIECE D — STAMINA BAR FILL (about 420 x 40 px) ===
Same as piece C but thinner: flat rectangle, straight square ends, no frame: warm golden
energy, base #e0a96d, 2-pixel bright band on top #ffe3a8, darker band at the bottom
#8a5a1f, tiny bright pixel specks. Perfectly rectangular silhouette.

=== DO NOT ===
Do not draw any bar, liquid, number, text or "HP"/"STAMINA" words inside piece A's windows.
Do not put the NIXY letters inside piece A. Do not add a character portrait. Do not merge
pieces. Do not use transparency checkerboard; use flat #FF00FF only.
```

**Se o gerador errar** (janelas preenchidas, peças grudadas, letras dentro da moldura): gere a peça A sozinha (apague do prompt as peças B, C e D e o "BOTTOM STRIP"), depois peça B, C e D numa segunda imagem. O importante é: **fundo magenta liso** e **janelas magenta vazias**.

**Já gerado e no jogo** (`art-source/novos/hud-status-violeta.jpg`). Para trocar a arte, gere de novo e rode `python scripts/cut-hud-status.py <imagem> public/assets/sprites/items 460`. Se a moldura mudar de formato, ajuste as janelas em `FRAME_ART` (`src/ui/StatusPanelHud.ts`) com os números que o script imprime.

Salve como `art-source/novos/hud-status-violeta.png` e me avise. Eu recorto, deixo as janelas transparentes, encaixo vida e estamina atrás da moldura, coloco o nível no lugar reservado e ajusto o tamanho para o celular.

---

## 18. Folha de botões (teclado, mouse, toque e controles)

Hoje as dicas de controle são texto (`[Espaço] Esquiva`, `ENTER / A: JOGAR`, `ESPAÇO ▶`, a tecla `E` da suprema). Esta folha troca tudo por **ícones de botão** desenhados. O jogo já sabe se o jogador está no teclado ou no controle; com a folha ele também mostra os símbolos do controle certo (letras A/B/X/Y ou formas cruz/círculo/quadrado/triângulo).

Lista fechada (48 células, grade 8x6). As teclas largas ocupam 2 células.

| Linha | Peças |
|---|---|
| 1 | W, A, S, D, E, R, M, ESC |
| 2 | Seta cima, baixo, esquerda, direita, ESPAÇO (larga), ENTER (larga) |
| 3 | SHIFT (larga), tecla vazia, tecla larga vazia, grupo de setas, clique do mouse, toque do dedo |
| 4 | Controle tipo 1: A, B, X, Y, LB, RB, LT, RT |
| 5 | Controle tipo 2: cruz, círculo, quadrado, triângulo, L1, R1, L2, R2 |
| 6 | Menu/Start, Visualizar/Select, Options, Create/Share, analógico esquerdo, analógico direito, direcional, grupo WASD |

Prompt único — copiar e colar inteiro:

```text
Create ONE image: a pixel art BUTTON PROMPT ICON sprite sheet (input glyphs) for a dark
gothic hell-themed 2D action roguelite game. These icons replace on-screen hint text like
"press SPACE to dodge", so each one must be instantly readable at tiny size (shown in game
at 24 to 40 px tall).

=== GLOBAL STYLE (applies to every icon) ===
16-bit pixel art, hand-placed pixels, crisp hard edges, NO anti-aliasing, NO blur, NO soft
airbrush gradients, NO photorealism, NO 3D render look, NO glossy plastic. Dark gothic
demonic fantasy: every key and button looks like a small relic carved from dark violet
obsidian, with a thin glowing magenta rim. Strong 2-pixel near-black purple outline
(#12020a) around every icon. Light always from the upper left.
Palette: near-black purple (#0b0208, #12061a), dark violet stone (#2a1238, #3d1a52), deep
violet (#6a1fa0, #9b5de5), neon magenta glow (#d61cff, #ff4df0), white-pink highlight
(#ffd6ff), bone white for glyphs (#efe6d8), small crimson accents (#ff0055, #8a0f2a).
Extra colors ONLY on the face buttons where stated below.
CHUNKY UNIFORM PIXEL GRID: draw every small icon as if it were 32x32 art pixels scaled up
8 times (each art pixel = an 8x8 block of identical color), wide icons as 64x32 art pixels
scaled 8 times. Same pixel size on every icon, no fine detail mixed with big blocks.
Glyphs (letters, arrows, symbols) are BIG, bold, blocky, bone white with a 1-pixel dark
outline, centered on the button, filling about 55% of the button face. Use simple blocky
pixel letters, NOT decorative gothic letters: readability first.
NO brand logos, NO company names, NO trademarks anywhere. No watermark, no signature.
No text other than the exact glyph written for each cell.

=== TWO BASE SHAPES (keep them identical across the sheet) ===
KEYCAP (keyboard keys): a square keycap seen slightly from the front: flat top face of
dark violet stone (#3d1a52), a thicker darker front edge at the bottom (#12061a) showing
depth (about 3 art pixels tall), a 1-pixel magenta glowing line along the top-left edges,
tiny crack details. Square corners slightly cut (chamfered). Wide keycaps have the exact
same height, depth and style, just twice as wide.
ORB BUTTON (controller face buttons): a round button like a polished demonic gem set in a
thin dark obsidian ring with 4 tiny spikes at the diagonals, a 2x2 white-pink highlight on
the upper left, darker shade on the lower right.
SHOULDER BUTTONS: a short horizontal rounded bumper plate (bumpers LB/RB/L1/R1) or a taller
curved trigger shape (triggers LT/RT/L2/R2), same obsidian style with magenta rim.

=== CANVAS AND BACKGROUND ===
Canvas 2048x1536 pixels, landscape. The ENTIRE background is solid flat pure magenta
#FF00FF, one single color, no texture, no vignette, no shadow on it, no glow bleeding onto
it, no transparency checkerboard. Invisible grid of 8 columns x 6 rows of 256x256 cells.
Each icon centered in its cell, filling about 70% of the cell height, at least 32 px of
pure #FF00FF around every icon, never touching another cell. Wide icons span exactly 2
cells (512x256) and are centered on those two cells. All icons same baseline, same height
for same kind, same outline thickness, same lighting: they must look like ONE set.

=== ROW 1 — LETTER KEYCAPS (8 cells) ===
1 keycap "W"   2 keycap "A"   3 keycap "S"   4 keycap "D"
5 keycap "E" (this one has a faint magenta inner glow on the top face: it is the ultimate key)
6 keycap "R"   7 keycap "M"   8 keycap "ESC" (three small blocky letters, they must fit)

=== ROW 2 — ARROWS AND WIDE KEYS ===
cells 1-4: four keycaps with one thick blocky arrow each: UP, DOWN, LEFT, RIGHT.
cells 5-6: ONE WIDE keycap SPACE BAR: empty top face with only a small blocky
  "under-bracket" symbol (a horizontal line with short upturned ends) in the center.
cells 7-8: ONE WIDE keycap ENTER: a big blocky "return" arrow (line going down then
  pointing left) in the center, no letters.

=== ROW 3 — WIDE KEYS, BLANKS, MOUSE, TOUCH ===
cells 1-2: ONE WIDE keycap SHIFT: a big hollow blocky upward arrow (outlined arrow with a
  stem) in the center, no letters.
cell 3: EMPTY keycap, same as row 1 but with NOTHING on the top face (blank, for any key).
cells 4-5: EMPTY WIDE keycap, same as SPACE but completely blank.
cell 6: ARROW KEYS CLUSTER: four mini keycaps in an inverted T (one on top, three below),
  each with a tiny arrow, all together fitting in one cell.
cell 7: MOUSE LEFT CLICK: a small dark obsidian computer mouse seen from above, the LEFT
  button glowing neon magenta, the right button dark, a short magenta "click" spark of 3
  tiny lines next to the left button.
cell 8: TOUCH TAP: a bone-white pointing hand / index finger tapping down, with two thin
  magenta concentric ripple arcs under the fingertip.

=== ROW 4 — CONTROLLER TYPE 1 (letter face buttons) ===
1 orb "A" with emerald green gem (#1fbf5a, highlight #8affb0)
2 orb "B" with crimson red gem (#d90429, highlight #ff8095)
3 orb "X" with sapphire blue gem (#1f6fd6, highlight #8ac4ff)
4 orb "Y" with amber yellow gem (#e0a90f, highlight #ffe58a)
(Letters bone white with dark outline, gems still dark and gothic, not toy-like.)
5 bumper "LB"   6 bumper "RB"   7 trigger "LT"   8 trigger "RT"
(left ones tilt slightly left, right ones slightly right; glyphs bone white)

=== ROW 5 — CONTROLLER TYPE 2 (shape face buttons) ===
1 orb, dark obsidian gem, glyph: a CROSS "X" shape drawn as a symbol, light blue (#7fb2ff)
2 orb, dark obsidian gem, glyph: a hollow CIRCLE, light red (#ff6b6b)
3 orb, dark obsidian gem, glyph: a hollow SQUARE, pink (#ff8ad8)
4 orb, dark obsidian gem, glyph: a hollow TRIANGLE, teal green (#4fe0b0)
(Here the gem is dark and only the thick hollow symbol is colored.)
5 bumper "L1"   6 bumper "R1"   7 trigger "L2"   8 trigger "R2"

=== ROW 6 — SYSTEM BUTTONS, STICKS, D-PAD, WASD ===
1 MENU / START: small round-cornered pill button with three short horizontal lines.
2 VIEW / SELECT: small pill button with two overlapping small squares.
3 OPTIONS: small vertical pill button with three short horizontal lines, narrower than 1.
4 SHARE / CREATE: small vertical pill button with a tiny upward arrow above a short line.
5 LEFT STICK: a round thumbstick seen from above, concave top with a ring of grip dots,
  bone white letter "L" in the middle, four tiny magenta arrow marks around it.
6 RIGHT STICK: same as 5 with the letter "R".
7 D-PAD: a plus-shaped directional pad of dark obsidian with a small arrow notch on each
  arm and a tiny magenta gem in the center.
8 WASD CLUSTER: four mini keycaps in an inverted T with tiny letters W (top), A, S, D
  (bottom row), all fitting in one cell.

=== DO NOT ===
Do not draw a full controller or a full keyboard. Do not add hands (except the touch icon),
frames, cards, labels, captions or any text outside the buttons. Do not change the glyph
written for any cell. Do not use brand logos or the exact look of any real console
controller. Do not merge icons, do not let wide keys spill out of their two cells.
Do not use transparency checkerboard; use flat #FF00FF only.
```

**Se o gerador errar** (letras trocadas, células grudadas, tamanhos diferentes): gere em 3 imagens de `canvas 2048x512, 8 columns x 2 rows of 256x256 cells`, colando o estilo, as duas formas base e só duas linhas por vez (1–2, 3–4, 5–6). Letra torta numa tecla não é problema grave: as teclas vazias (linha 3) existem justamente para eu escrever a letra por cima com a fonte do jogo se precisar.

**Já gerado e no jogo** (`art-source/novos/botoes-controle.webp`). Para trocar, gere de novo na mesma ordem e rode `python scripts/cut-button-glyphs.py <imagem> public/assets/sprites/ui/buttons 48`. O script acha as peças sozinho e para com erro se a contagem por linha não bater com a lista acima. Qual ícone cada ação usa fica em `src/config/inputGlyphs.ts`.

## 19. Molduras de carta (uma por raridade)

Antes eram 8 molduras escolhidas carta por carta (gelo numa carta de velocidade, veneno numa de vida). Agora são **5, uma por raridade**, todas no tema inferno e catacumbas: a moldura diz o quão rara a carta é; o tema vem do ícone no encaixe do meio. Os talismãs usam as mesmas (Lendária = Suprema).

| Raridade | Moldura |
|---|---|
| Comum | Ossos e pedra de catacumba, sem brilho |
| Incomum | Ossos com bronze e fogo de alma verde |
| Rara | Ferro e correntes espectrais azuis, caveira encapuzada |
| Épica | Obsidiana com runas violeta e chifres |
| Suprema | Ouro barroco, rubis, asas e fogo do inferno |

Medidas que a arte precisa respeitar (unidade 120x200): pilares em x 0–24 e 96–120; janela de cima x 25–95, y 19–104, lisa e escura (raridade, nome, nível); faixa do meio y 105–127 com encaixe redondo vazio no centro (ícone); janela de baixo x 25–95, y 128–179, lisa e escura (descrição). As 5 com a mesma silhueta e o mesmo layout; fundo magenta `#ff00ff`; 5 lado a lado, da comum à suprema, sem texto.

**Já gerado e no jogo** (`art-source/novos/molduras-cartas.webp`). Para trocar, gere de novo na mesma ordem e rode `python scripts/cut-card-frames.py <imagem> public/assets/sprites/cards`. O script acha as 5 sozinho, reduz todas na mesma escala e centra pela janela, então o texto do jogo continua caindo no lugar. As posições do texto ficam em `UpgradeScene.createCard`; a raridade de cada carta, em `UpgradeCatalog.ts` (`rarity`); moldura, nome e cor de cada raridade, em `CARD_RARITY_THEME` (`theme.ts`).

---

## 20. Folha dos 5 pets dos talismãs (de lado, andar em 2 quadros)

Hoje os pets usam o sprite dos inimigos encolhido (morcego, slime, cão zumbi), e o jogador confunde aliado com monstro. Esta folha dá a cada pet uma cara própria de **aliado**: coleira ou marca dourada, olhos violeta, nada de vermelho-sangue.

**Uma direção só:** todos de perfil, virados para a **direita**. A esquerda o jogo faz espelhando.

**Grade:** 5 linhas (um pet por linha) e 2 colunas (passo A e passo B). Feito no ChatGPT, que já entrega fundo transparente. Se já houver uma versão anterior da folha, **anexe a imagem como referência** para manter o mesmo desenho dos pets.

```text
Create ONE image: a pixel art sprite sheet of 5 pet companions for a dark gothic 16-bit
survival game. TRANSPARENT BACKGROUND (no color, no checkerboard, no floor, no shadow shapes
except the small oval ground shadow under each pet).
If an image is attached, keep EXACTLY the same 5 character designs, colors and collars from
it; only change the camera angle and poses as described below.

LAYOUT: portrait canvas 1024x1536. Grid of exactly 5 ROWS x 2 COLUMNS of equal cells
(512 wide x 307 tall), no grid lines. One ROW = one pet. Column 1 = walk frame A,
column 2 = walk frame B. Each sprite centered in its cell, all feet on the same baseline
(about 85% down the cell), generous empty margin, nothing touches or crosses another cell.

CAMERA: every pet in pure SIDE VIEW (profile), facing and walking to the RIGHT, slight
top-down tilt like a 16-bit action RPG. All 10 sprites face RIGHT. Never front or back view.

ANIMATION: frames A and B of the same pet are identical in size, colors, outline and
position; only legs, wings and body bounce change, so A-B-A-B loops as a smooth walk.

STYLE: 16-bit pixel art, hand-placed pixels, crisp hard edges, NO anti-aliasing, NO blur,
same chunky pixel density for all 5 pets, hard 1-pixel near-black outline (#12020a),
upper-left light, subtle violet rim light (#c77dff). Friendly ALLIED familiars of a demon
heroine, cute-but-infernal, readable silhouettes, eyes glowing violet (never red), each with
an antique gold (#f3d17a) collar with a small violet gem. Palette: deep violet (#4b1673,
#7b2cbf, #9b5de5), antique gold, bone white (#efe6d8), near-black purple (#1a0a1f), ember
orange only inside mouths. No blood red on the bodies.

RELATIVE SIZE (same pixel density; the Shadow Twin is the size reference, filling about 85%
of its cell height):
 Row 1 - COLLECTOR BAT, small (about 35% of the Twin's height). Chubby dark violet bat with big
   ears, gold collar, glowing violet soul orb held in its feet, seen from the side flying
   right. Frame A wings raised up, frame B wings pushed down. It floats above its shadow.
 Row 2 - HOPPING SLIME, small (about 30% of the Twin's height). Translucent violet jelly blob,
   small bone skull inside, gold ring around it, two cute eyes on the right side of the body.
   Frame A squashed wide and low on the ground, frame B stretched tall and leaning right.
 Row 3 - GUARD HOUND, medium (about 50% of the Twin's height at the shoulder). Lean dark violet
   hellhound pup, bone-white muzzle, chest and paws, small curved horns, glowing mouth, spiked
   gold collar, tail up. Side-view trot: frame A front leg reaching forward and back leg
   pushing back, frame B legs passing under the body.
 Row 4 - CERBERUS PUP, medium-large (about 65% of the Twin's height at the shoulder). Same breed
   and colors as the Guard Hound but bigger and stockier, THREE heads seen in profile, one
   behind the other, staggered so all three snouts are visible pointing right; one gold
   collar. Same trot as row 3.
 Row 5 - SHADOW TWIN, a slim demon girl with small horns and long hair, whole body made of
   dark violet shadow with lighter violet edges, glowing violet eye, shadow smoke wisps
   trailing behind her, small gold rune on the chest. Profile walk to the right: frame A
   front leg forward, frame B legs together mid-step, arms swinging.

No text, labels, numbers, frames or backgrounds. Exactly 10 sprites, all facing right.
```

**Se o ChatGPT errar a grade ou virar algum pet de frente:** peça um pet por imagem (`canvas 1024x512, 1 row x 2 columns`), colando o bloco STYLE e a linha daquele pet.

**Gêmea Sombria (linha 5):** se ficar estranha, eu uso o sprite da própria Nixy pintado de sombra no jogo e essa linha não faz falta.

**Já gerado e no jogo** (`art-source/novos/pets-talismas.jpg`, feito no Gemini com fundo verde `#00FF00` e borda branca fina). Para trocar, gere de novo na mesma ordem (morcego, slime, cão, cérbero, gêmea; passo A à esquerda) e rode `python scripts/cut-pets.py <imagem> public/assets/sprites/pets`. O script tira o verde, acha as 5 linhas pelos espaços vazios e salva `pet-<nome>-0/1.png` no tamanho final; as alturas de cada pet ficam no topo do script. O contorno branco de 1 pixel em volta vem do código (`BasePet`).

