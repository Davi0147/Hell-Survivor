import Phaser from 'phaser';
import { Nixy } from '../entities/characters/Nixy';
import { PROLOGUE_BALANCE, isDevSandboxEnabled } from '../config/balance';
import { PROLOGUE_THEME } from '../config/theme';
import { getHudLayout } from '../config/hudLayout';
import { STORAGE_KEYS } from '../config/storageKeys';
import {
  CORRIDOR_IMAGE_HEIGHT,
  CORRIDOR_SEGMENTS,
  PROLOGUE_EXIT_ZONE,
  PROLOGUE_NPCS,
  PROLOGUE_START,
  type PrologueNpcDef,
} from '../config/prologueData';
import { PROLOGUE_NPC_TALKS, type PrologueTalkLine } from '../config/dialogues';
import {
  corridorWalls,
  corridorWidth,
  layoutCorridor,
  nearestInRange,
  nextTalkIndex,
  rectContains,
  type PlacedSegment,
} from '../systems/prologueLogic';
import { GamepadManager } from '../systems/GamepadManager';
import { SoundManager } from '../systems/SoundManager';
import { TouchControls } from '../ui/TouchControls';
import { InputHint } from '../ui/InputHint';
import { SkipButton, isTouchDevice } from '../ui/SkipButton';
import { WorldTalkBubble } from '../ui/WorldTalkBubble';

/** Pés da Nixy na textura de 64 px (a caixa de colisão do prólogo é só os pés). */
const FEET_BOX = { offsetX: 18, offsetY: 52, w: 28, h: 8 } as const;
const TEXTURE_HALF = 32;
const CORRIDOR_DEPTH = 0;
const ACTOR_DEPTH = 10;

interface NpcActor {
  def: PrologueNpcDef;
  sprite: Phaser.GameObjects.Image;
  /** Pés no mundo. */
  x: number;
  y: number;
  talkIndex?: number;
}

interface ActiveTalk {
  npc: NpcActor;
  lines: PrologueTalkLine[];
  index: number;
}

/**
 * Prólogo do Capítulo I: a Nixy foge do setor dela por um corredor de escritório. Sem combate:
 * ela só anda (paredes de verdade), conversa com quem está parado no caminho e sai pela porta do
 * fim, que leva à arena (GameScene + StoryArrivalSystem).
 *
 * A cena não tem zoom: o corredor é desenhado 1:1 e a Nixy é ampliada pelo zoom da arena, então
 * os botões de toque e as falas vivem na própria cena.
 */
export class PrologueScene extends Phaser.Scene {
  private player!: Nixy;
  private placed: PlacedSegment[] = [];
  private offsetY = 0;
  private npcs: NpcActor[] = [];
  private nearNpc: NpcActor | null = null;
  private talk: ActiveTalk | null = null;
  private lastAdvanceAt = 0;
  private isLeaving = false;
  private bubble!: WorldTalkBubble;
  private prompt!: Phaser.GameObjects.Container;
  private touch?: TouchControls;
  private skipButton?: SkipButton;
  private debugGfx?: Phaser.GameObjects.Graphics;
  private walls: Phaser.Geom.Rectangle[] = [];
  private keys!: Record<'w' | 'a' | 's' | 'd' | 'up' | 'left' | 'down' | 'right' | 'shift', Phaser.Input.Keyboard.Key | undefined>;

  constructor() {
    super('PrologueScene');
  }

  init(): void {
    this.placed = [];
    this.npcs = [];
    this.nearNpc = null;
    this.talk = null;
    this.lastAdvanceAt = 0;
    this.isLeaving = false;
    this.touch = undefined;
    this.skipButton = undefined;
    this.debugGfx = undefined;
    this.walls = [];
  }

  preload(): void {
    // Carregado só aqui (e solto no fim): o corredor não ocupa memória de vídeo durante a partida
    for (const seg of CORRIDOR_SEGMENTS) {
      const key = corridorKey(seg.id);
      if (!this.textures.exists(key)) this.load.image(key, `assets/sprites/prologue/corridor-${seg.id}.jpg`);
    }
  }

  create(): void {
    const { width, height } = this.scale;
    this.cameras.main.setBackgroundColor(PROLOGUE_THEME.background);
    this.input.keyboard?.resetKeys();
    SoundManager.getInstance().setScene(this);
    SoundManager.getInstance().playIntroMusic(1500);

    // 1. Corredor: pedaços lado a lado, no meio da altura da tela
    this.placed = layoutCorridor(CORRIDOR_SEGMENTS);
    this.offsetY = Math.round((height - CORRIDOR_IMAGE_HEIGHT) / 2);
    for (const seg of this.placed) {
      this.add.image(seg.x0, this.offsetY, corridorKey(seg.id)).setOrigin(0, 0).setDepth(CORRIDOR_DEPTH);
    }
    const totalW = corridorWidth(CORRIDOR_SEGMENTS);

    // 2. Paredes sólidas (fundo, frente, móveis e as duas pontas)
    const wallGroup = this.physics.add.staticGroup();
    this.walls = corridorWalls(this.placed, this.offsetY, height).map((r) => new Phaser.Geom.Rectangle(r.x, r.y, r.w, r.h));
    for (const r of this.walls) {
      const zone = this.add.zone(r.centerX, r.centerY, r.width, r.height);
      wallGroup.add(zone);
    }

    // 3. Funcionários parados (cada um também é um obstáculo nos pés)
    for (const def of PROLOGUE_NPCS) this.spawnNpc(def, wallGroup);

    // 4. A Nixy, do mesmo tamanho e no mesmo ritmo da arena
    const start = this.placed[0];
    this.player = new Nixy(this, 0, 0);
    this.player.setScale(PROLOGUE_BALANCE.actorScale);
    this.player.baseSpeed *= PROLOGUE_BALANCE.speedMultiplier;
    this.player.sprintSpeed *= PROLOGUE_BALANCE.speedMultiplier;
    const body = this.player.body as Phaser.Physics.Arcade.Body;
    body.setSize(FEET_BOX.w, FEET_BOX.h).setOffset(FEET_BOX.offsetX, FEET_BOX.offsetY);
    this.placeFeet(start.x0 + PROLOGUE_START.x, this.offsetY + PROLOGUE_START.y);
    this.physics.add.collider(this.player, wallGroup);

    // 5. Câmera: segue só na horizontal (a altura do mundo é a da tela)
    this.physics.world.setBounds(0, 0, totalW, height);
    this.cameras.main.setBounds(0, 0, totalW, height);
    this.cameras.main.startFollow(this.player, true, PROLOGUE_BALANCE.cameraLerp, PROLOGUE_BALANCE.cameraLerp);
    this.cameras.main.setRoundPixels(true);
    this.cameras.main.fadeIn(PROLOGUE_BALANCE.fadeInMs, 0, 0, 0);

    // 6. Falas, aviso de "falar", controles e botão de pular
    const touchDevice = isTouchDevice(this);
    // Grandes de propósito: no iPhone o jogo inteiro é encolhido para ~48%
    this.bubble = new WorldTalkBubble(this, touchDevice ? 36 : 28, touchDevice ? 620 : 520);
    this.prompt = this.createPrompt(touchDevice);
    this.setupKeyboard();
    this.setupPointer();
    this.touch = new TouchControls(this, getHudLayout(width, height, touchDevice).touch);
    this.touch.setMovementOnly();
    if (hasSeenPrologue()) {
      this.skipButton = new SkipButton(this, 'PULAR', () => this.leave(true), 1500);
    }

    // Modo de Teste: tecla C mostra as paredes e os pés (para ajustar config/prologueData.ts)
    if (isDevSandboxEnabled()) {
      this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.C).on('down', () => this.toggleDebug());
    }

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.cleanup());
  }

  update(_time: number, delta: number): void {
    if (this.isLeaving) return;
    this.bubble.follow();

    const pad = GamepadManager.getInstance().getGameplayInput(this);
    if (pad.isPause && this.skipButton) {
      this.leave(true);
      return;
    }

    // Conversando: parada, cada aperto avança uma fala
    if (this.talk) {
      this.player.updateNixy(0, 0, false, delta);
      if (pad.isDash) this.advanceTalk();
      return;
    }

    const move = this.readMove(pad);
    this.player.updateNixy(move.dx, move.dy, move.isSprint, delta);
    this.player.setDepth(ACTOR_DEPTH + this.feetY() / 1000);

    // Perto de alguém: aviso de "falar" em cima da cabeça
    this.nearNpc = nearestInRange(this.npcs, this.feetX(), this.feetY(), PROLOGUE_BALANCE.interactRadius);
    this.updatePrompt();
    if (pad.isDash && this.nearNpc) this.startTalk(this.nearNpc);

    // Pisou na frente da porta de saída: atravessa
    const end = this.placed[this.placed.length - 1];
    if (rectContains(
      { ...PROLOGUE_EXIT_ZONE, x: end.x0 + PROLOGUE_EXIT_ZONE.x, y: this.offsetY + PROLOGUE_EXIT_ZONE.y },
      this.feetX(),
      this.feetY()
    )) {
      this.leave(false);
    }

    if (this.debugGfx) this.drawDebug();
  }

  // --- Personagens ----------------------------------------------------------------------------

  private spawnNpc(def: PrologueNpcDef, wallGroup: Phaser.Physics.Arcade.StaticGroup): void {
    const seg = this.placed.find((s) => s.id === def.segment);
    if (!seg) return;
    const x = seg.x0 + def.x;
    const y = this.offsetY + def.y;
    const hasArt = this.textures.exists(def.texture);
    const sprite = this.add.image(x, y, hasArt ? def.texture : def.placeholderTexture);
    if (hasArt) {
      sprite.setOrigin(0.5, 1).setScale(def.displayHeight / sprite.height);
    } else {
      // Sprite provisório (inimigo parado) com os pés perto da base: mesma escala da Nixy
      sprite.setOrigin(0.5, 0.94).setScale(PROLOGUE_BALANCE.actorScale);
    }
    sprite.setDepth(ACTOR_DEPTH + y / 1000);
    const feet = this.add.zone(x, y - 6, 44, 16);
    wallGroup.add(feet);
    this.npcs.push({ def, sprite, x, y });
  }

  /** Põe os pés da Nixy em (x, y) do mundo. */
  private placeFeet(x: number, y: number): void {
    const s = PROLOGUE_BALANCE.actorScale;
    const feetBottom = (FEET_BOX.offsetY + FEET_BOX.h - TEXTURE_HALF) * s;
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
    for (const code of [K.E, K.SPACE, K.ENTER]) {
      add(code)?.on('down', () => this.onInteractPressed());
    }
    add(K.ESC)?.on('down', () => {
      if (this.skipButton) this.leave(true);
    });
  }

  private setupPointer(): void {
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (this.isLeaving || this.skipButton?.containsPointer(pointer)) return;
      if (this.talk) {
        this.advanceTalk();
        return;
      }
      // Tocar/clicar no aviso ou na pessoa começa a conversa
      const npc = this.nearNpc;
      if (!npc) return;
      const hitPrompt = Math.hypot(pointer.worldX - this.prompt.x, pointer.worldY - this.prompt.y) < 70;
      if (hitPrompt || npc.sprite.getBounds().contains(pointer.worldX, pointer.worldY)) this.startTalk(npc);
    });
  }

  private onInteractPressed(): void {
    if (this.isLeaving) return;
    if (this.talk) this.advanceTalk();
    else if (this.nearNpc) this.startTalk(this.nearNpc);
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

  private startTalk(npc: NpcActor): void {
    const talks = PROLOGUE_NPC_TALKS[npc.def.id] ?? [];
    const idx = nextTalkIndex(talks.length, npc.talkIndex, Math.random());
    if (idx < 0) return;
    npc.talkIndex = idx;
    this.talk = { npc, lines: talks[idx], index: 0 };
    this.prompt.setVisible(false);
    this.player.currentDirection = npc.x < this.player.x ? 'west' : 'east';
    this.lastAdvanceAt = this.time.now;
    this.showTalkLine();
  }

  private advanceTalk(): void {
    if (!this.talk) return;
    if (this.time.now - this.lastAdvanceAt < PROLOGUE_BALANCE.talkAdvanceCooldownMs) return;
    this.lastAdvanceAt = this.time.now;
    this.talk.index++;
    if (this.talk.index >= this.talk.lines.length) {
      this.talk = null;
      this.bubble.hide();
      return;
    }
    this.showTalkLine();
  }

  private showTalkLine(): void {
    if (!this.talk) return;
    const line = this.talk.lines[this.talk.index];
    if (line.who === 'nixy') {
      const headOffset = -(TEXTURE_HALF + 4) * PROLOGUE_BALANCE.actorScale + 8;
      this.bubble.show(this.player, headOffset, line.text, PROLOGUE_THEME.nixyText);
      SoundManager.getInstance().playDialogueVoice('nixy');
    } else {
      const npc = this.talk.npc;
      this.bubble.show(npc, npc.sprite.getBounds().top - npc.y - 8, line.text, PROLOGUE_THEME.npcText);
      SoundManager.getInstance().playDialogueVoice('npc');
    }
  }

  // --- Saída ----------------------------------------------------------------------------------

  /** Atravessa a porta (ou pula o corredor) e vai para a arena. */
  private leave(skipped: boolean): void {
    if (this.isLeaving) return;
    this.isLeaving = true;
    this.talk = null;
    this.bubble.hide();
    this.prompt.setVisible(false);
    this.skipButton?.setVisible(false);
    this.touch?.setVisible(false);
    markPrologueSeen();

    if (!skipped) {
      // Entra na porta: um passo para cima e o estrondo dela batendo
      const body = this.player.body as Phaser.Physics.Arcade.Body;
      body.setVelocity(0, 0);
      body.enable = false;
      this.player.play('nixy-run-north', true);
      this.tweens.add({ targets: this.player, y: this.player.y - 26, alpha: 0, duration: PROLOGUE_BALANCE.exitWalkMs });
      SoundManager.getInstance().playTableKick();
    }
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
    g.clear();
    g.lineStyle(2, PROLOGUE_THEME.debugWall, 0.9);
    for (const r of this.walls) g.strokeRectShape(r);
    const end = this.placed[this.placed.length - 1];
    g.strokeRect(end.x0 + PROLOGUE_EXIT_ZONE.x, this.offsetY + PROLOGUE_EXIT_ZONE.y, PROLOGUE_EXIT_ZONE.w, PROLOGUE_EXIT_ZONE.h);
    const b = this.player.body as Phaser.Physics.Arcade.Body;
    g.lineStyle(2, PROLOGUE_THEME.debugFeet, 1);
    g.strokeRect(b.x, b.y, b.width, b.height);
    for (const n of this.npcs) g.strokeCircle(n.x, n.y, PROLOGUE_BALANCE.interactRadius);
  }

  private cleanup(): void {
    this.bubble?.destroy();
    this.skipButton?.destroy();
    this.input.removeAllListeners();
    this.input.keyboard?.removeAllKeys(true);
    this.time.removeAllEvents();
    // Solta a arte do corredor da memória de vídeo (o iPhone tem pouca)
    for (const seg of CORRIDOR_SEGMENTS) {
      const key = corridorKey(seg.id);
      if (this.textures.exists(key)) this.textures.remove(key);
    }
  }
}

function corridorKey(id: string): string {
  return `prologue-corridor-${id}`;
}

function hasSeenPrologue(): boolean {
  try {
    return window.localStorage.getItem(STORAGE_KEYS.PROLOGUE_SEEN) === '1';
  } catch {
    return false;
  }
}

function markPrologueSeen(): void {
  try {
    window.localStorage.setItem(STORAGE_KEYS.PROLOGUE_SEEN, '1');
  } catch {
    // Sem localStorage (aba privada): o botão PULAR só não aparece na próxima vez
  }
}
