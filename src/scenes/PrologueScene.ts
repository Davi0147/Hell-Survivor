import Phaser from 'phaser';
import { Nixy } from '../entities/characters/Nixy';
import { PROLOGUE_BALANCE, isDevSandboxEnabled } from '../config/balance';
import { PROLOGUE_THEME, chapterUiKey } from '../config/theme';
import { getHudLayout } from '../config/hudLayout';
import {
  CORRIDOR_ROOMS,
  PROLOGUE_EXIT_DOOR_TOP,
  PROLOGUE_EXIT_ZONE,
  PROLOGUE_NPCS,
  PROLOGUE_PORTRAITS,
  PROLOGUE_START,
  ROOM_CONTENT,
  ROOM_EDGE,
  ROOM_EXPORT_SCALE,
  ROOM_IMAGE,
  npcTextureKey,
  type PrologueNpcDef,
} from '../config/prologueData';
import { PROLOGUE_GUARD_STOP_LINE, PROLOGUE_NPC_DIALOGUES } from '../config/dialogues';
import {
  clampToWalkBand,
  nearestInRange,
  rectContains,
  roomEntryX,
  roomExitAt,
  roomScale,
  roomWalls,
  roomsToKeep,
  scaleRect,
} from '../systems/prologueLogic';
import { DialogueSystem } from '../systems/DialogueSystem';
import { GamepadManager } from '../systems/GamepadManager';
import { SoundManager } from '../systems/SoundManager';
import { TouchControls } from '../ui/TouchControls';
import { InputHint } from '../ui/InputHint';
import { isTouchDevice } from '../ui/SkipButton';

/**
 * Caixa dos pés (só os pés colidem no prólogo), em px da textura. Os quadros da Nixy têm
 * tamanhos diferentes (64 parada, 84 correndo) com ela centralizada, então a caixa é medida a
 * partir do CENTRO do quadro: `belowCenter` = do centro até o topo da caixa.
 */
const FEET_BOX = { w: 28, h: 8, belowCenter: 20 } as const;
const ROOM_DEPTH = 0;
const ACTOR_DEPTH = 10;
/** Folga (px originais) ao encaixar os pés na faixa andável da sala nova. */
const WALK_BAND_MARGIN = 24;
/** Seta dourada da saída: px acima da porta e quanto ela balança. */
const EXIT_ARROW = { aboveDoor: 140, bob: 14, bobMs: 520, scale: 0.55 } as const;

interface NpcActor {
  def: PrologueNpcDef;
  sprite: Phaser.GameObjects.Image;
  /** Pés no mundo. */
  x: number;
  y: number;
}

/**
 * Prólogo do Capítulo I: a Nixy foge do setor dela por um corredor de escritório. Sem combate:
 * ela só anda (paredes de verdade), conversa com quem está parado no caminho e sai pela porta da
 * última sala, que leva à arena (GameScene + StoryArrivalSystem).
 *
 * Cada imagem do corredor é uma SALA que cobre a tela. Chegar na ponta esquerda/direita escurece
 * e passa para a sala vizinha (indo e voltando), então as imagens não precisam se encaixar.
 * Conversas na mesma tela de diálogo da história (Nixy na esquerda, o funcionário na direita).
 * O segurança (Léo) segura a porta até a Nixy falar com ele; aí aparece a seta da saída.
 */
export class PrologueScene extends Phaser.Scene {
  private player!: Nixy;
  /** Px de tela por px da arte original. */
  private s = 1;
  private roomIndex = 0;
  private roomImage?: Phaser.GameObjects.Image;
  private wallGroup!: Phaser.Physics.Arcade.StaticGroup;
  private npcs: NpcActor[] = [];
  private nearNpc: NpcActor | null = null;
  private dialogue!: DialogueSystem;
  /** Já conversou com o segurança: a porta de saída está liberada. */
  private exitUnlocked = false;
  /** Pés na porta no quadro anterior (atravessar = entrar na porta, não ficar parada nela). */
  private wasOnExit = false;
  private exitArrow?: Phaser.GameObjects.Image;
  private isLeaving = false;
  private isChangingRoom = false;
  private prompt!: Phaser.GameObjects.Container;
  private touch?: TouchControls;
  private debugGfx?: Phaser.GameObjects.Graphics;
  private keys!: Record<'w' | 'a' | 's' | 'd' | 'up' | 'left' | 'down' | 'right' | 'shift', Phaser.Input.Keyboard.Key | undefined>;

  constructor() {
    super('PrologueScene');
  }

  init(): void {
    this.roomIndex = 0;
    this.roomImage = undefined;
    this.npcs = [];
    this.nearNpc = null;
    this.exitUnlocked = false;
    this.wasOnExit = false;
    this.exitArrow = undefined;
    this.isLeaving = false;
    this.isChangingRoom = false;
    this.touch = undefined;
    this.debugGfx = undefined;
  }

  preload(): void {
    // Só a primeira sala e a vizinha; as outras chegam conforme ela anda (memória do iPhone)
    for (const i of roomsToKeep(0, CORRIDOR_ROOMS.length)) this.queueRoomTexture(i);
    // Funcionários e retratos (pequenos: todos de uma vez)
    const smallArt = [...PROLOGUE_NPCS.filter((d) => d.hasArt).map((d) => npcTextureKey(d.id)), ...PROLOGUE_PORTRAITS];
    for (const key of smallArt) {
      if (this.textures.exists(key)) continue;
      this.load.image(key, `assets/sprites/prologue/${key}.png`);
      if (key.startsWith('npc-')) {
        this.load.once(`filecomplete-image-${key}`, () => {
          this.textures.get(key).setFilter(Phaser.Textures.FilterMode.LINEAR);
        });
      }
    }
  }

  create(): void {
    const { width, height } = this.scale;
    this.cameras.main.setBackgroundColor(PROLOGUE_THEME.background);
    this.input.keyboard?.resetKeys();
    SoundManager.getInstance().setScene(this);
    SoundManager.getInstance().playIntroMusic(1500);
    this.s = roomScale(width, height);

    // 1. Nixy, na escala da sala (do tamanho certo perto das portas)
    const actorScale = PROLOGUE_BALANCE.actorScalePerRoomScale * this.s;
    this.player = new Nixy(this, 0, 0);
    this.player.setScale(actorScale);
    const speedMult = PROLOGUE_BALANCE.speedPerRoomScale * this.s;
    this.player.baseSpeed *= speedMult;
    this.player.sprintSpeed *= speedMult;
    const body = this.player.body as Phaser.Physics.Arcade.Body;
    body.setSize(FEET_BOX.w, FEET_BOX.h);
    this.syncFeetBox();
    // Troca de quadro (parada 64 px / correndo 84 px): a caixa volta para os pés na hora
    this.player.on(Phaser.Animations.Events.ANIMATION_UPDATE, this.syncFeetBox, this);
    this.player.on(Phaser.Animations.Events.ANIMATION_START, this.syncFeetBox, this);

    // 2. Paredes da sala atual (refeitas a cada troca de sala)
    this.wallGroup = this.physics.add.staticGroup();
    this.physics.add.collider(this.player, this.wallGroup);
    // Rede de segurança: a física do Phaser para de empurrar um corpo que já entrou numa parede
    // (canto entre dois obstáculos, troca de sala). A cada passo, os pés voltam para o chão.
    this.physics.world.on(Phaser.Physics.Arcade.Events.WORLD_STEP, this.keepFeetOnFloor, this);
    this.buildRoom(0);
    this.placeFeet(PROLOGUE_START.x * this.s, PROLOGUE_START.y * this.s);
    this.snapCamera();
    this.cameras.main.startFollow(this.player, true, PROLOGUE_BALANCE.cameraLerp, PROLOGUE_BALANCE.cameraLerp);
    this.cameras.main.setRoundPixels(true);
    this.cameras.main.fadeIn(PROLOGUE_BALANCE.fadeInMs, 0, 0, 0);

    // 3. Tela de diálogo ANTES dos atalhos da cena: ela ouve Espaço/Enter/clique primeiro, então
    // o mesmo aperto que abre a conversa não pula a primeira fala
    this.dialogue = new DialogueSystem(this);
    const touchDevice = isTouchDevice(this);
    this.prompt = this.createPrompt(touchDevice);
    this.setupKeyboard();
    this.setupPointer();
    this.touch = new TouchControls(this, getHudLayout(width, height, touchDevice).touch);
    this.touch.setMovementOnly();

    // Modo de Teste: tecla C mostra as paredes e os pés (para ajustar config/prologueData.ts)
    if (isDevSandboxEnabled()) {
      this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.C).on('down', () => this.toggleDebug());
    }

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.cleanup());
  }

  update(_time: number, delta: number): void {
    if (this.isLeaving) return;

    if (this.isChangingRoom) {
      this.player.updateNixy(0, 0, false, delta);
      return;
    }

    // Conversando: parada; a tela de diálogo cuida do controle (A avança, B pula)
    if (this.dialogue.isDialogueActive()) {
      this.player.updateNixy(0, 0, false, delta);
      this.dialogue.update(delta);
      return;
    }

    const pad = GamepadManager.getInstance().getGameplayInput(this);
    const move = this.readMove(pad);
    this.player.updateNixy(move.dx, move.dy, move.isSprint, delta);
    this.syncFeetBox();
    this.player.setDepth(ACTOR_DEPTH + this.feetY() / 10000);

    // Perto de alguém: aviso de "falar" em cima da cabeça
    this.nearNpc = nearestInRange(this.npcs, this.feetX(), this.feetY(), PROLOGUE_BALANCE.interactRadius * this.s);
    this.updatePrompt();
    if (pad.isDash && this.nearNpc) {
      this.startTalk(this.nearNpc);
      return;
    }

    // Ponta da sala: passa para a vizinha
    const last = CORRIDOR_ROOMS.length - 1;
    const exit = roomExitAt(this.feetX() / this.s, ROOM_EDGE.trigger, this.roomIndex > 0, this.roomIndex < last);
    if (exit === 'prev' && move.dx < 0) this.changeRoom(-1);
    else if (exit === 'next' && move.dx > 0) this.changeRoom(1);

    // Última sala: entrou na porta de saída. Sem ter falado com o segurança, ele segura ela.
    const onExit = this.roomIndex === last && rectContains(scaleRect(PROLOGUE_EXIT_ZONE, this.s), this.feetX(), this.feetY());
    if (onExit && !this.wasOnExit) {
      if (this.exitUnlocked) {
        this.leave();
      } else {
        const guard = this.npcs.find((n) => n.def.guardsExit);
        if (guard) this.startTalk(guard, true);
        else this.leave();
      }
    }
    this.wasOnExit = onExit;

    if (this.debugGfx) this.drawDebug();
  }

  // --- Salas ----------------------------------------------------------------------------------

  /** Monta a sala `index`: imagem, paredes, funcionários, limites da câmera. */
  private buildRoom(index: number): void {
    const room = CORRIDOR_ROOMS[index];
    const s = this.s;
    this.roomIndex = index;

    this.roomImage?.destroy();
    this.roomImage = this.add.image(0, 0, roomKey(room.id))
      .setOrigin(0, 0)
      .setScale(s / ROOM_EXPORT_SCALE)
      .setDepth(ROOM_DEPTH);

    this.wallGroup.clear(true, true);
    for (const r of roomWalls(room)) {
      const w = scaleRect(r, s);
      this.wallGroup.add(this.add.zone(w.x + w.w / 2, w.y + w.h / 2, w.w, w.h));
    }

    for (const npc of this.npcs) npc.sprite.destroy();
    this.npcs = [];
    for (const def of PROLOGUE_NPCS) {
      if (def.room === room.id) this.spawnNpc(def);
    }
    this.updateExitArrow();

    const roomW = ROOM_IMAGE.width * s;
    this.physics.world.setBounds(0, 0, roomW, ROOM_IMAGE.height * s);
    this.cameras.main.setBounds(0, ROOM_CONTENT.top * s, roomW, (ROOM_CONTENT.bottom - ROOM_CONTENT.top) * s);

    // Vizinhas já na memória; as distantes saem
    for (let i = 0; i < CORRIDOR_ROOMS.length; i++) {
      if (roomsToKeep(index, CORRIDOR_ROOMS.length).includes(i)) this.queueRoomTexture(i);
      else this.releaseRoomTexture(i);
    }
    if (!this.load.isLoading()) this.load.start();
  }

  /** Escurece, troca para a sala ao lado e aparece na ponta de onde veio. */
  private changeRoom(step: -1 | 1): void {
    if (this.isChangingRoom) return;
    const target = this.roomIndex + step;
    if (target < 0 || target >= CORRIDOR_ROOMS.length) return;
    this.isChangingRoom = true;
    this.prompt.setVisible(false);
    const feetYOrig = this.feetY() / this.s;
    const cam = this.cameras.main;
    cam.fadeOut(PROLOGUE_BALANCE.roomFadeMs, 0, 0, 0);
    cam.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      this.whenRoomReady(target, () => {
        this.buildRoom(target);
        const room = CORRIDOR_ROOMS[target];
        const x = roomEntryX(step > 0 ? 'prev' : 'next', ROOM_EDGE.entry);
        const bodyH = (this.player.body as Phaser.Physics.Arcade.Body).height / this.s;
        this.placeFeet(x * this.s, clampToWalkBand(room, feetYOrig, bodyH, WALK_BAND_MARGIN) * this.s);
        this.wasOnExit = false;
        this.snapCamera();
        cam.fadeIn(PROLOGUE_BALANCE.roomFadeMs, 0, 0, 0);
        this.isChangingRoom = false;
      });
    });
  }

  private queueRoomTexture(index: number): void {
    const room = CORRIDOR_ROOMS[index];
    const key = roomKey(room.id);
    if (this.textures.exists(key)) return;
    this.load.image(key, `assets/sprites/prologue/corridor-${room.id}.jpg`);
    // A sala é ampliada/reduzida: filtro suave em vez de pixel duro, sem serrilhado
    this.load.once(`filecomplete-image-${key}`, () => {
      this.textures.get(key).setFilter(Phaser.Textures.FilterMode.LINEAR);
    });
  }

  private releaseRoomTexture(index: number): void {
    const key = roomKey(CORRIDOR_ROOMS[index].id);
    if (this.textures.exists(key) && this.roomImage?.texture.key !== key) this.textures.remove(key);
  }

  /** Chama `fn` quando a imagem da sala estiver carregada (normalmente já está). */
  private whenRoomReady(index: number, fn: () => void): void {
    const key = roomKey(CORRIDOR_ROOMS[index].id);
    if (this.textures.exists(key)) {
      fn();
      return;
    }
    this.queueRoomTexture(index);
    this.load.once(`filecomplete-image-${key}`, () => fn());
    if (!this.load.isLoading()) this.load.start();
  }

  private snapCamera(): void {
    this.cameras.main.centerOn(this.player.x, this.player.y);
  }

  // --- Personagens ----------------------------------------------------------------------------

  private spawnNpc(def: PrologueNpcDef): void {
    const x = def.x * this.s;
    const y = def.y * this.s;
    const artKey = npcTextureKey(def.id);
    const hasArt = def.hasArt && this.textures.exists(artKey);
    const sprite = this.add.image(x, y, hasArt ? artKey : def.placeholderTexture);
    if (hasArt) {
      sprite.setOrigin(0.5, 1).setScale((def.displayHeight * this.s) / sprite.height);
    } else {
      // Sprite provisório (inimigo parado) com os pés perto da base: mesma escala da Nixy
      sprite.setOrigin(0.5, 0.94).setScale(PROLOGUE_BALANCE.actorScalePerRoomScale * this.s);
    }
    sprite.setDepth(ACTOR_DEPTH + y / 10000);
    // Obstáculo nos pés, da largura de quem está ali (a dupla ocupa mais)
    this.wallGroup.add(this.add.zone(x, y - 6 * this.s, sprite.displayWidth * 0.7, 32 * this.s));
    this.npcs.push({ def, sprite, x, y });
  }

  /** Recoloca a caixa dos pés no quadro atual (os quadros têm tamanhos diferentes). */
  private syncFeetBox(): void {
    const body = this.player?.body as Phaser.Physics.Arcade.Body | null;
    const frame = this.player?.frame;
    if (!body || !frame) return;
    const offX = (frame.width - FEET_BOX.w) / 2;
    const offY = frame.height / 2 + FEET_BOX.belowCenter;
    if (body.offset.x !== offX || body.offset.y !== offY) body.setOffset(offX, offY);
  }

  /** Prende a caixa dos pés dentro da faixa do chão e da largura da sala. */
  private keepFeetOnFloor(): void {
    const body = this.player?.body as Phaser.Physics.Arcade.Body | null;
    if (!body || !body.enable) return;
    const room = CORRIDOR_ROOMS[this.roomIndex];
    const top = room.walkTop * this.s;
    const bottom = room.walkBottom * this.s;
    if (body.y < top) body.y = top;
    else if (body.bottom > bottom) body.y = bottom - body.height;
    const right = ROOM_IMAGE.width * this.s;
    if (body.x < 0) body.x = 0;
    else if (body.right > right) body.x = right - body.width;
  }

  /** Põe os pés da Nixy em (x, y) do mundo. */
  private placeFeet(x: number, y: number): void {
    this.syncFeetBox();
    const feetBottom = (FEET_BOX.belowCenter + FEET_BOX.h) * this.player.scaleY;
    this.player.setPosition(x, y - feetBottom);
    (this.player.body as Phaser.Physics.Arcade.Body).reset(this.player.x, this.player.y);
  }

  private feetX(): number {
    return (this.player.body as Phaser.Physics.Arcade.Body).center.x;
  }

  private feetY(): number {
    return (this.player.body as Phaser.Physics.Arcade.Body).bottom;
  }

  // --- Controles ------------------------------------------------------------------------------

  private setupKeyboard(): void {
    const kb = this.input.keyboard;
    const K = Phaser.Input.Keyboard.KeyCodes;
    const add = (code: number): Phaser.Input.Keyboard.Key | undefined => kb?.addKey(code);
    this.keys = {
      w: add(K.W), a: add(K.A), s: add(K.S), d: add(K.D),
      up: add(K.UP), left: add(K.LEFT), down: add(K.DOWN), right: add(K.RIGHT),
      shift: add(K.SHIFT),
    };
    // Espaço/Enter avançam a conversa pela própria tela de diálogo; o E também avança
    add(K.E)?.on('down', () => {
      if (this.dialogue.isDialogueActive()) this.dialogue.handleAdvance();
      else this.onInteractPressed();
    });
    for (const code of [K.SPACE, K.ENTER]) {
      add(code)?.on('down', () => {
        if (!this.dialogue.isDialogueActive()) this.onInteractPressed();
      });
    }
  }

  private setupPointer(): void {
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (this.isLeaving || this.isChangingRoom || this.dialogue.isDialogueActive()) return;
      // Tocar/clicar no aviso ou na pessoa começa a conversa
      const npc = this.nearNpc;
      if (!npc) return;
      const hitPrompt = Math.hypot(pointer.worldX - this.prompt.x, pointer.worldY - this.prompt.y) < 70;
      if (hitPrompt || npc.sprite.getBounds().contains(pointer.worldX, pointer.worldY)) this.startTalk(npc);
    });
  }

  private onInteractPressed(): void {
    if (this.isLeaving || this.isChangingRoom) return;
    if (this.nearNpc) this.startTalk(this.nearNpc);
  }

  private readMove(pad: { isActive: boolean; dx: number; dy: number; isSprint: boolean }): { dx: number; dy: number; isSprint: boolean } {
    const k = this.keys;
    let dx = 0;
    let dy = 0;
    if (k.a?.isDown || k.left?.isDown) dx -= 1;
    if (k.d?.isDown || k.right?.isDown) dx += 1;
    if (k.w?.isDown || k.up?.isDown) dy -= 1;
    if (k.s?.isDown || k.down?.isDown) dy += 1;
    let isSprint = Boolean(k.shift?.isDown);
    if (pad.isActive && (Math.abs(pad.dx) > 0.05 || Math.abs(pad.dy) > 0.05)) {
      dx = pad.dx;
      dy = pad.dy;
    }
    if (pad.isSprint) isSprint = true;
    const t = this.touch?.getInput();
    if (t?.hasMovement) {
      dx = t.dx;
      dy = t.dy;
    }
    return { dx, dy, isSprint };
  }

  // --- Conversa -------------------------------------------------------------------------------

  private createPrompt(touchDevice: boolean): Phaser.GameObjects.Container {
    const hint = new InputHint(this, 0, 0, ['interact', { text: 'FALAR' }], {
      glyphHeight: touchDevice ? 44 : 32,
      fontSize: touchDevice ? 30 : 22,
      color: PROLOGUE_THEME.promptText,
      align: 'center',
    });
    hint.container.setDepth(1900).setVisible(false);
    this.tweens.add({ targets: hint.container, alpha: 0.55, duration: 520, yoyo: true, repeat: -1 });
    return hint.container;
  }

  private updatePrompt(): void {
    const npc = this.nearNpc;
    this.prompt.setVisible(npc !== null);
    if (npc) this.prompt.setPosition(Math.round(npc.x), Math.round(npc.sprite.getBounds().top) - 26);
  }

  /**
   * Abre a conversa com o funcionário na tela de diálogo. `stopped`: ela tentou passar pela porta
   * sem falar com o segurança, então ele começa com "Ei, espera aí!".
   */
  private startTalk(npc: NpcActor, stopped: boolean = false): void {
    const script = PROLOGUE_NPC_DIALOGUES[npc.def.id] ?? [];
    const lines = stopped ? [PROLOGUE_GUARD_STOP_LINE, ...script] : script;
    if (lines.length === 0) return;
    this.prompt.setVisible(false);
    this.nearNpc = null;
    (this.player.body as Phaser.Physics.Arcade.Body).setVelocity(0, 0);
    this.player.currentDirection = npc.x < this.player.x ? 'west' : 'east';
    this.dialogue.startDialogue(lines, () => this.onTalkDone(npc, stopped));
    // O A do controle que abriu a conversa não pode avançar a primeira fala no mesmo aperto
    GamepadManager.getInstance().getMenuNavigation(this);
  }

  private onTalkDone(npc: NpcActor, stopped: boolean): void {
    if (!npc.def.guardsExit) return;
    this.exitUnlocked = true;
    this.updateExitArrow();
    // Parada na porta quando ele a segurou: dá um passo para trás, para entrar nela de novo
    if (stopped) {
      const zone = scaleRect(PROLOGUE_EXIT_ZONE, this.s);
      this.placeFeet(this.feetX(), zone.y + zone.h + 30 * this.s);
      this.player.currentDirection = 'north';
      this.wasOnExit = false;
    }
  }

  /** Seta dourada balançando em cima da porta de saída, depois que o segurança libera. */
  private updateExitArrow(): void {
    const onLastRoom = this.roomIndex === CORRIDOR_ROOMS.length - 1;
    if (!this.exitUnlocked || !onLastRoom) {
      this.exitArrow?.destroy();
      this.exitArrow = undefined;
      return;
    }
    if (this.exitArrow?.active) return;
    const zone = scaleRect(PROLOGUE_EXIT_ZONE, this.s);
    const x = zone.x + zone.w / 2;
    const y = (PROLOGUE_EXIT_DOOR_TOP - EXIT_ARROW.aboveDoor) * this.s;
    // A seta da tela de capítulos aponta para a direita: girada, aponta para baixo
    this.exitArrow = this.add.image(x, y, chapterUiKey('arrow'))
      .setAngle(90)
      .setScale(EXIT_ARROW.scale)
      .setDepth(1800);
    this.tweens.add({
      targets: this.exitArrow,
      y: y + EXIT_ARROW.bob,
      duration: EXIT_ARROW.bobMs,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  // --- Saída ----------------------------------------------------------------------------------

  /** Atravessa a porta de saída e vai para a arena (o corredor não tem PULAR, decisão do dono). */
  private leave(): void {
    if (this.isLeaving) return;
    this.isLeaving = true;
    this.prompt.setVisible(false);
    this.exitArrow?.setVisible(false);
    this.touch?.setVisible(false);

    // Entra na porta: um passo para cima e o estrondo dela batendo
    const body = this.player.body as Phaser.Physics.Arcade.Body;
    body.setVelocity(0, 0);
    body.enable = false;
    this.player.play('nixy-run-north', true);
    this.tweens.add({ targets: this.player, y: this.player.y - 40 * this.s, alpha: 0, duration: PROLOGUE_BALANCE.exitWalkMs });
    SoundManager.getInstance().playTableKick();
    SoundManager.getInstance().stopMusic(PROLOGUE_BALANCE.exitFadeMs);
    this.cameras.main.fadeOut(PROLOGUE_BALANCE.exitFadeMs, 0, 0, 0);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      this.scene.start('GameScene', { mode: 'story', chapter: 1 });
    });
  }

  // --- Modo de Teste --------------------------------------------------------------------------

  private toggleDebug(): void {
    if (this.debugGfx) {
      this.debugGfx.destroy();
      this.debugGfx = undefined;
      return;
    }
    this.debugGfx = this.add.graphics().setDepth(2500);
    this.drawDebug();
  }

  private drawDebug(): void {
    const g = this.debugGfx;
    if (!g) return;
    const s = this.s;
    g.clear();
    g.lineStyle(2, PROLOGUE_THEME.debugWall, 0.9);
    for (const r of roomWalls(CORRIDOR_ROOMS[this.roomIndex])) {
      const w = scaleRect(r, s);
      g.strokeRect(w.x, w.y, w.w, w.h);
    }
    if (this.roomIndex === CORRIDOR_ROOMS.length - 1) {
      const z = scaleRect(PROLOGUE_EXIT_ZONE, s);
      g.strokeRect(z.x, z.y, z.w, z.h);
    }
    g.lineStyle(2, PROLOGUE_THEME.debugFeet, 1);
    const b = this.player.body as Phaser.Physics.Arcade.Body;
    g.strokeRect(b.x, b.y, b.width, b.height);
    for (const n of this.npcs) g.strokeCircle(n.x, n.y, PROLOGUE_BALANCE.interactRadius * s);
    g.lineBetween(ROOM_EDGE.trigger * s, 0, ROOM_EDGE.trigger * s, ROOM_IMAGE.height * s);
    g.lineBetween((ROOM_IMAGE.width - ROOM_EDGE.trigger) * s, 0, (ROOM_IMAGE.width - ROOM_EDGE.trigger) * s, ROOM_IMAGE.height * s);
  }

  private cleanup(): void {
    // No SHUTDOWN o mundo da física pode já ter sido desligado (e leva o ouvinte junto)
    this.physics.world?.off(Phaser.Physics.Arcade.Events.WORLD_STEP, this.keepFeetOnFloor, this);
    this.input.removeAllListeners();
    this.input.keyboard?.removeAllKeys(true);
    this.time.removeAllEvents();
    this.load.reset();
    // Solta a arte do corredor da memória de vídeo (o iPhone tem pouca)
    this.roomImage?.destroy();
    this.roomImage = undefined;
    for (const room of CORRIDOR_ROOMS) {
      const key = roomKey(room.id);
      if (this.textures.exists(key)) this.textures.remove(key);
    }
    for (const npc of this.npcs) npc.sprite.destroy();
    this.npcs = [];
    for (const key of [...PROLOGUE_NPCS.map((d) => npcTextureKey(d.id)), ...PROLOGUE_PORTRAITS]) {
      if (this.textures.exists(key)) this.textures.remove(key);
    }
  }
}

function roomKey(id: string): string {
  return `prologue-corridor-${id}`;
}
