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
| Moldura de carta | 120x200 |

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