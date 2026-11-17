# Nixy — prompts para refazer as folhas de sprite

O sprite atual não bate com a arte da HUD (`public/assets/sprites/nixy/UI/Idle UI.png`): não tem os chifres, não tem a máscara de sorriso, o cabelo está lilás claro em vez de roxo vivo e a capa de gola alta sumiu. Além disso, os arquivos têm tamanhos misturados (parado e dano em 64x64, corrida em 84x84) e o "parado" é uma imagem só, sem respiração.

Estas folhas resolvem tudo de uma vez.

---

## Como usar (leia antes de gerar)

1. **Use uma IA que aceite imagem de referência** (ChatGPT/GPT-Image, Gemini/Nano Banana, Midjourney com `--cref`, etc.). Anexe **sempre** estas 3 imagens junto com o prompt:
   - `public/assets/sprites/nixy/UI/Idle UI.png` (corpo, roupa, mão)
   - `public/assets/sprites/nixy/UI/Damage UI.png` (expressão de dor)
   - `public/assets/sprites/nixy/Ult Animation/UltNixy2.png` (olhos e máscara de perto)
2. **Gere a Folha 0 primeiro.** Ela é a "ficha do modelo". Depois anexe a Folha 0 aprovada também em todas as outras folhas — é isso que mantém a Nixy igual em todas.
3. **Só 5 direções.** Peça Sul, Sudeste, Leste, Nordeste, Norte. As 3 que faltam (Sudoeste, Oeste, Noroeste) eu gero espelhando no código. Menos trabalho para a IA = mais consistência.
4. **Fundo verde puro `#00FF00`.** Quase nenhuma IA faz transparência direito. A Nixy não tem verde nenhum, então eu recorto o fundo por script sem estragar o cabelo.
5. **Se a IA bagunçar a grade** (frames desalinhados, quantidade errada, personagem mudando de cara), use o **prompt de resgate** no final: ele gera uma linha (uma direção) por vez.
6. Me mande as imagens do jeito que saírem. Eu recorto, alinho os pés, reduzo para o tamanho do jogo, limpo as bordas e ligo no código.

### Tabela das folhas

| Folha | Conteúdo | Grade (colunas × linhas) | Tamanho final |
|---|---|---|---|
| 0 | Ficha do modelo (referência, não vai pro jogo) | livre | 1536×1024 |
| 1 | Parada respirando | 6 × 5 | 768×640 |
| 2 | Corrida normal | 8 × 5 | 1024×640 |
| 3 | Sprint (corrida máxima) | 8 × 5 | 1024×640 |
| 4 | Levando dano | 4 × 5 | 512×640 |
| 5 | Morte + pose de Suprema | 6 × 3 | 768×384 |

Cada célula tem **128×128 px**. As linhas, de cima para baixo, são sempre: **Sul (de frente) → Sudeste → Leste → Nordeste → Norte (de costas)**.

---

## BLOCO DE IDENTIDADE (vai colado dentro de todos os prompts)

Está em inglês porque as IAs de imagem entendem melhor. Não precisa mexer.

```
CHARACTER IDENTITY — "NIXY" (must match the attached HUD portrait exactly):
- Species/vibe: young demon girl, menacing but cute, dark gothic anime style.
- HAIR: extremely long, thick, voluminous wavy hair reaching past the knees, saturated VIOLET-PURPLE (base #7A1FB8, highlights #C24BFF hot magenta-violet, deep shadows #2E0A4A). Heavy straight-cut bangs covering the forehead down to the eyebrows. ONE single curled ahoge strand sticking up on top of the head. Two long locks fall in front of the shoulders down the chest; the rest is a huge mass behind her that sways with movement. The hair is the biggest color shape of the sprite.
- HORNS: two IVORY / BONE-WHITE horns (#EDE6DA with grey #9C948A shading), growing from the sides of the head above the ears, curving outward then UPWARD like crescent bull horns, clearly visible from every angle, sticking out of the hair.
- EARS: long sharp pointed elf ears, pale skin, poking out of the hair horizontally.
- SKIN: pale ashen grey with a faint lavender tint (#C9C2D3, shadow #8E86A0).
- EYES: narrow, angry, predatory. Glowing pale-pink / white irises (#FFD6F5) with a dark X-shaped cross pupil, dark smoky eyeshadow. Even at small size the eyes must read as two bright glowing slits.
- MASK (ICONIC, NEVER OMIT): black cloth mask covering the face from the nose down to the chin and neck, printed with a huge WHITE jagged monster grin — a row of sharp triangular teeth, zig-zag mouth stretching almost ear to ear. At sprite scale this must read as a white zig-zag line across a black lower face.
- CLOAK: long BLACK cloak with a very tall stiff pointed collar that rises behind the head like a vampire collar, inner lining DEEP PURPLE-VIOLET (#4B1470). The cloak hangs from the shoulders to the ankles, hem cut into a few sharp tattered points. It is open in front, showing the bodysuit.
- BODYSUIT: skin-tight glossy black latex-like bodysuit (#141018 with violet specular highlights #5A2E80), high neck, thin vertical zipper/seam line down the center of the torso, seam lines on the sides.
- HANDS: pale grey hands with LONG SHARP BLACK CLAWS (pointed black nails, almost talon-like). No weapon in her hands — her weapons are separate magic effects.
- LEGS/FEET: the black glossy bodysuit continues down the legs into black pointed knee-high boots with a small heel.
- OPTIONAL TAIL: thin black demon tail with a small spade tip, curling behind her. (remove this line if not wanted)
- BODY: slim, athletic, about 3 heads tall (semi-chibi proportions) so the head, horns, glowing eyes and grin mask stay readable at small size.
- COLOR RULE: she is mostly black, so give her a thin 1px DARK PURPLE outline (#1A0826, not pure black) and a subtle magenta rim light (#FF2A9D) on the edges of hair, horns and cloak, so she stays readable over a dark hell floor.
- FORBIDDEN: no exposed mouth/nose/lips (the mask always covers them), no light lavender/pastel hair, no missing horns, no extra accessories, no jewelry, no weapons, no text, no logos.
```

## BLOCO TÉCNICO DE SPRITE (vai colado nas folhas 1 a 5)

```
SPRITE SHEET TECHNICAL RULES:
- Style: crisp PIXEL ART for a top-down 2D action roguelite (horde survivor), camera looking down at about 30–35 degrees (classic 3/4 top-down view, NOT pure side view, NOT isometric tiles). Limited palette, around 24 colors total, hard pixel edges, no anti-aliasing blur, no soft gradients, no painterly brush strokes, no 3D render look.
- Canvas: one single image laid out as a perfect GRID of equal square cells, 128x128 px per cell, no gaps, no borders, no grid lines drawn, no labels, no numbers, no text anywhere.
- Background: solid flat pure chroma green #00FF00 in every cell, absolutely uniform. No shadows on the ground, no floor, no props, no scenery, no glow spilling on the background.
- Character size: the character is about 96 px tall inside each 128 px cell (from boot sole to top of the horns/ahoge), horizontally centered.
- Anchor: the FEET are on the SAME BASELINE in every cell, 12 px above the bottom of the cell. The character must not drift up/down or left/right between frames except for intended motion (bounce, recoil).
- Consistency: identical character design, proportions, palette and outline in every single cell. Same hair length, same horn shape, same mask grin in every frame.
- Rows = directions, top to bottom: Row 1 = SOUTH (facing the camera), Row 2 = SOUTH-EAST (facing down-right), Row 3 = EAST (facing right, profile seen from above), Row 4 = NORTH-EAST (facing up-right, back three-quarters), Row 5 = NORTH (back to the camera).
- Columns = animation frames, left to right, in playback order, and the last frame must loop cleanly back into the first.
- Lighting: single light source from the top-left, consistent in all frames.
```

---

## FOLHA 0 — Ficha do modelo (referência)

Não vai para o jogo. Serve para você aprovar o visual antes de gastar tempo com animação, e depois para anexar nas outras folhas.

```
Create a CHARACTER MODEL SHEET / turnaround for a 2D pixel art game sprite, based on the attached HUD portrait of the character. Image size 1536x1024, plain flat light grey background (#D9D9D9).

[PASTE THE CHARACTER IDENTITY BLOCK HERE]

LAYOUT:
- Top row: the full-body character in IN-GAME SPRITE STYLE (pixel art, semi-chibi 3 heads tall, top-down 3/4 camera at ~30 degrees), shown 5 times side by side at the same size and same baseline, standing in a neutral relaxed pose: facing SOUTH (front), SOUTH-EAST, EAST (right profile), NORTH-EAST, NORTH (back). Each figure about 300 px tall, pixel art upscaled with hard nearest-neighbor pixels (each art pixel = 3x3 screen pixels, so the true sprite is ~100 px tall).
- Bottom left: a large clean close-up of the HEAD in pixel art (front view) showing how the horns, ahoge, bangs, pointed ears, glowing X-pupil eyes and the white jagged grin mask are simplified at sprite resolution.
- Bottom middle: close-up of one clawed hand and of the boot.
- Bottom right: a COLOR PALETTE strip of flat squares with every color used (hair 3 tones, horn 2 tones, skin 2 tones, eye glow, mask black + grin white, cloak black + lining purple, bodysuit black + violet highlight, outline dark purple, magenta rim light).
- No text, no labels, no names, no watermark.

Goal: a faithful pixel-art translation of the HUD portrait — same horns, same mask with teeth, same huge violet hair, same tall-collar black cloak with purple lining, same glossy black bodysuit with zipper, same black claws.
```

---

## FOLHA 1 — Parada respirando (idle)

6 quadros × 5 direções. No jogo hoje ela fica congelada quando para; com isso ela respira.

```
Create a PIXEL ART SPRITE SHEET of the attached character "Nixy" doing an IDLE BREATHING loop. Use the attached model sheet and HUD portrait as the exact design reference.

[PASTE THE CHARACTER IDENTITY BLOCK HERE]

[PASTE THE SPRITE SHEET TECHNICAL RULES BLOCK HERE]

GRID: 6 columns x 5 rows of 128x128 cells → final image 768x640.

ANIMATION — IDLE (6 frames, slow calm loop, menacing confidence):
- Pose: standing, feet slightly apart, weight on one leg, shoulders relaxed, arms hanging slightly away from the body with the clawed fingers loosely curled, chin slightly down so she looks up through the bangs with glowing eyes (predator stare).
- Frame 1: neutral.
- Frame 2: chest rises 1 px, shoulders up 1 px, hair mass starts to sway.
- Frame 3: top of inhale, cloak hem flares outward 1–2 px, ahoge bounces up.
- Frame 4: hold, eyes glow slightly brighter (one extra highlight pixel).
- Frame 5: exhale, body back down, hair tips swing the other way.
- Frame 6: settle, transition back to frame 1.
- Motion is SUBTLE: total vertical body movement max 2 px. Hair and cloak tips have the most motion (secondary animation, delayed by one frame). Feet never move.
- Row 1 SOUTH: facing camera, mask grin fully visible, both horns visible.
- Row 2 SOUTH-EAST: 3/4 front facing down-right, grin visible, one ear visible.
- Row 3 EAST: profile facing right seen from above, horn curve and pointed ear clearly visible, cloak collar visible behind the head, hair mass hanging behind.
- Row 4 NORTH-EAST: 3/4 back facing up-right, we see the purple lining edge of the collar, the hair mass and both horns, face barely visible (only one horn tip and ear edge on the face side).
- Row 5 NORTH: back fully to camera, huge hair mass and tall collar dominate, both horn tips stick out on the sides, cloak covers the back.
```

---

## FOLHA 2 — Corrida normal (run)

8 quadros × 5 direções. Toca a 11 quadros por segundo no jogo.

```
Create a PIXEL ART SPRITE SHEET of the attached character "Nixy" doing a RUN CYCLE. Use the attached model sheet and HUD portrait as the exact design reference.

[PASTE THE CHARACTER IDENTITY BLOCK HERE]

[PASTE THE SPRITE SHEET TECHNICAL RULES BLOCK HERE]

GRID: 8 columns x 5 rows of 128x128 cells → final image 1024x640.

ANIMATION — RUN (8 frames, standard full run cycle, looping, played at 11 fps):
- Body leaning slightly forward (about 10 degrees) in the movement direction, determined and aggressive.
- Classic 8-frame run: 1 contact (right foot forward) → 2 down (lowest point, knee bent) → 3 passing → 4 up (highest point, both feet slightly off the ground) → 5 contact (left foot forward) → 6 down → 7 passing → 8 up.
- Arms swing opposite to the legs, hands open with claws spread, not fists.
- Body bounce: up/down 2–3 px following the cycle (lowest on frames 2 and 6, highest on 4 and 8).
- Cloak: trails behind her and ripples, hem points flicking. Inner purple lining visible when it flips.
- Hair: big mass streams backward and bounces with a one-frame delay; the two front locks swing; ahoge wobbles.
- Head stays mostly level and the glowing eyes stay locked forward (predator chasing prey).
- The feet stay on the baseline on contact frames; the shadowless background stays pure #00FF00.
- Row 1 SOUTH: running toward the camera, legs alternate in depth, grin mask visible.
- Row 2 SOUTH-EAST: running down-right.
- Row 3 EAST: running right in profile, clear stride with wide leg separation, cloak and hair flowing to the left.
- Row 4 NORTH-EAST: running up-right, back 3/4, cloak billowing toward the camera.
- Row 5 NORTH: running away from the camera, hair and cloak swinging side to side.
```

---

## FOLHA 3 — Sprint (corrida máxima)

8 quadros × 5 direções. Toca a 14 quadros por segundo e o jogo põe um rastro fantasma rosa atrás dela, então o desenho tem que ser bem diferente da corrida normal.

```
Create a PIXEL ART SPRITE SHEET of the attached character "Nixy" doing a FULL SPRINT / DEMON DASH cycle. Use the attached model sheet and HUD portrait as the exact design reference.

[PASTE THE CHARACTER IDENTITY BLOCK HERE]

[PASTE THE SPRITE SHEET TECHNICAL RULES BLOCK HERE]

GRID: 8 columns x 5 rows of 128x128 cells → final image 1024x640.

ANIMATION — SPRINT (8 frames, looping, played at 14 fps, must look clearly FASTER and more feral than a normal run):
- Strong forward lean (about 30 degrees), head low and forward, glowing eyes leaving the impression of speed (make the eye glow 1 px longer, like a streak).
- Arms swept BACK behind the body like a ninja run, claws pointing backward, OR alternating big aggressive arm pumps — keep it the same choice in all directions.
- Very long strides: legs fully extended, airborne frames on 4 and 8 with both feet off the ground (body 4 px above the baseline).
- Cloak blown fully horizontal behind her, wide open, purple lining very visible, tattered hem points snapping.
- Hair whipped straight back in a long streaming mass, strands separating at the tips.
- Body bounce 3–4 px. Same 8-frame structure as a run cycle: contact, down, passing, up (airborne), contact, down, passing, up (airborne).
- Row 1 SOUTH: sprinting toward the camera, head low, horns pointing forward, grin mask visible below the eyes.
- Row 2 SOUTH-EAST: sprinting down-right.
- Row 3 EAST: sprinting right in profile, maximum stretch, the most dynamic row.
- Row 4 NORTH-EAST: sprinting up-right, cloak flaring toward the camera.
- Row 5 NORTH: sprinting away, cloak and hair flying toward the camera.
```

---

## FOLHA 4 — Levando dano (hurt)

4 quadros × 5 direções. Hoje é 1 imagem congelada; com 4 quadros o golpe "pesa".

```
Create a PIXEL ART SPRITE SHEET of the attached character "Nixy" TAKING A HIT. Use the attached model sheet, HUD portrait and the attached DAMAGE portrait (eyes squeezed in pain, red scratches) as the exact design reference.

[PASTE THE CHARACTER IDENTITY BLOCK HERE]

[PASTE THE SPRITE SHEET TECHNICAL RULES BLOCK HERE]

GRID: 4 columns x 5 rows of 128x128 cells → final image 512x640.

ANIMATION — HURT (4 frames, short, NOT looping, played fast ~12 fps):
- Frame 1 IMPACT: whole body jolts backward (opposite to the facing direction) by 3 px, head snaps back, eyes squeezed shut in pain (eye glow becomes two thin bent lines), shoulders hunched, one arm raised defensively with claws spread.
- Frame 2 RECOIL PEAK: maximum lean back, hair and cloak thrown forward by inertia, mask slightly crooked, 2–3 small dark red scratch marks (#B0123A) on the cheek/arm like in the damage portrait.
- Frame 3 RECOVER: body coming back up, one eye opening, angry glare starting.
- Frame 4 FURY: back to near-idle stance but more aggressive — eyes wide and glowing brighter, claws flexed, ready to fight back. (The game returns to idle/run after this.)
- No blood splatter on the background, no white flash (the game adds the flash by code).
- Rows: SOUTH, SOUTH-EAST, EAST, NORTH-EAST, NORTH as defined. In the NORTH row the hit is shown through the hunch, the hair whip and the raised arm silhouette.
```

---

## FOLHA 5 — Morte + pose da Suprema

Só de frente (Sul). Hoje o jogo não tem animação de morte nem de ativar a Suprema — eu ligo as duas no código quando a arte chegar.

```
Create a PIXEL ART SPRITE SHEET of the attached character "Nixy" with a DEATH animation and an ULTIMATE CAST animation, all facing SOUTH (toward the camera). Use the attached model sheet, HUD portrait, damage portrait and ultimate close-up as the exact design reference.

[PASTE THE CHARACTER IDENTITY BLOCK HERE]

[PASTE THE SPRITE SHEET TECHNICAL RULES BLOCK HERE]
(Exception for this sheet: all rows face SOUTH; rows are animations, not directions.)

GRID: 6 columns x 3 rows of 128x128 cells → final image 768x384.

ROWS 1 and 2 — DEATH (12 frames, read left to right, row 1 then row 2, NOT looping, ~10 fps):
1. Final hit: body jolts back, eyes shut, like the damage portrait.
2. Staggers, one knee bending, one hand pressing the chest.
3. Drops to one knee, head down, hair falling forward over the face.
4. Both knees on the ground, arms hanging, claws touching the floor.
5. Looks up one last time: eyes glowing faintly, mask grin cracked (one broken line through the teeth).
6. Eye glow fades to dark.
7. Starts to collapse sideways to her right.
8. Lying on her side, hair spread on the ground, cloak draped over her.
9. Body starts dissolving from the edges into small purple-black square pixel embers rising upward.
10. Half dissolved, horns and hair still visible, embers rising.
11. Only the cloak shape and a few horn pixels left, many embers.
12. Last few embers in the air, nothing else (almost empty cell).
- Feet/body contact stays on the same baseline while she is on the ground.

ROW 3 — ULTIMATE CAST (6 frames, NOT looping, ~12 fps):
1. Crouched charge: body low, arms crossed in front of the chest, claws glowing magenta (#FF2A9D).
2. Power building: magenta aura pixels flicker around her, hair lifting upward as if in an updraft, cloak rising.
3. Rising: standing up straight, arms spreading out, eyes blazing white-pink with X pupils very bright.
4. PEAK POSE: arms thrown wide open, claws spread, head tilted back slightly, cloak fully opened like bat wings showing the purple lining, hair floating in a huge halo shape, mask grin shining white.
5. Hold peak with stronger aura (a few more magenta pixels).
6. Release: arms coming down, aura fading, ready stance.
- Glow effects stay small and pixel-art (a few bright pixels), not big soft blooms, and must not touch the cell borders.
```

---

## PROMPT DE RESGATE (uma direção por vez)

Use se a IA errar a grade. Gera só uma linha. Troque os campos entre `< >`.

```
Create a single horizontal PIXEL ART sprite strip of the attached character "Nixy", <NUMBER> frames side by side, each frame a 128x128 cell, final image <NUMBER x 128>x128. Facing <SOUTH / SOUTH-EAST / EAST / NORTH-EAST / NORTH>. Animation: <IDLE / RUN / SPRINT / HURT>, exactly as described below.

[PASTE THE CHARACTER IDENTITY BLOCK HERE]

[PASTE THE SPRITE SHEET TECHNICAL RULES BLOCK HERE]
(Ignore the 5-row rule: this image has only ONE row.)

<PASTE HERE THE "ANIMATION" PART OF THE SHEET YOU ARE REDOING>

Keep the exact same character as the attached model sheet and the attached previous strip (same size, same baseline, same palette).
```

Dica: ao refazer uma linha, anexe também uma linha que já ficou boa, para a IA copiar o tamanho e a posição dos pés.

---

## Depois que a arte chegar (parte técnica, comigo)

- Recorte do fundo verde, redução para o tamanho do jogo (provavelmente 96×96 por quadro, para a Nixy ficar com a mesma altura de hoje), limpeza de pixels soltos e alinhamento dos pés.
- Espelhar Sudeste/Leste/Nordeste para gerar Sudoeste/Oeste/Noroeste.
- Juntar tudo em uma única folha (atlas) em vez das ~150 imagens soltas de hoje: carrega mais rápido no celular.
- Idle e dano passam a ser animados; morte e pose da Suprema ganham ligação nova no código.
- Os arquivos antigos ficam guardados até você aprovar a nova Nixy jogando.
