import Phaser from 'phaser';
import { ARENA_CONFIG, STORY_ARRIVAL_BALANCE as B } from '../config/balance';
import { COLORS, FONTS, PROLOGUE_THEME } from '../config/theme';
import {
  STORY_ARRIVAL_AFTER_BARK_TEXT,
  STORY_ARRIVAL_BARK_TEXT,
  STORY_ARRIVAL_DIALOGUE,
} from '../config/dialogues';
import type { DialogueLine } from './DialogueSystem';
import type { ICombatBubbleTarget } from './CombatBubbleSystem';
import { SoundManager } from './SoundManager';
import type { BaseCharacter } from '../entities/characters/BaseCharacter';

/** Textura do cão do encontro (scripts/cut-prologue-dog.py) e da porta (cut-prologue-door.py). */
export const ARRIVAL_TEXTURES = {
  dogIdle: 'prologue-dog-idle',
  dogBark: 'prologue-dog-bark',
  door: 'prologue-door-sheet',
} as const;

/** Quadro da tira da porta e onde fica o chão nele (px). */
export const ARRIVAL_DOOR_FRAME = { width: 172, height: 256, groundY: 210 } as const;

/** Animações da porta (quadros da tira: 0-7 subindo no fogo, 8-11 abrindo, 12-15 fechando). */
const DOOR_ANIMS = {
  rise: { key: 'prologue-door-rise', frames: [0, 1, 2, 3, 4, 5, 6, 7], frameRate: 10 },
  sink: { key: 'prologue-door-sink', frames: [7, 6, 5, 4, 3, 2, 1, 0], frameRate: 12 },
  open: { key: 'prologue-door-open', frames: [8, 9, 10, 11], frameRate: 10 },
  close: { key: 'prologue-door-close', frames: [12, 13, 14, 15], frameRate: 10 },
} as const;

/** O que a chegada precisa da cena da partida. */
export interface IStoryArrivalContext {
  readonly add: Phaser.GameObjects.GameObjectFactory;
  readonly tweens: Phaser.Tweens.TweenManager;
  readonly time: Phaser.Time.Clock;
  readonly cameras: Phaser.Cameras.Scene2D.CameraManager;
  readonly anims: Phaser.Animations.AnimationManager;
  readonly player: BaseCharacter & { updateNixy(dx: number, dy: number, sprint: boolean, delta: number): void };
  playDialogue(lines: DialogueLine[], onComplete: () => void): void;
  setHUDVisible(visible: boolean): void;
  showCombatSpeechBubble(target: ICombatBubbleTarget, text: string, durationMs: number, isNixy?: boolean): void;
  spawnZombieDogAt(x: number, y: number): void;
}

type Step = 'idle' | 'rising' | 'walking' | 'talking' | 'barking' | 'done';

/** Do centro do sprite da Nixy até os pés, em px do mundo (quadro de 64, pés em 60). */
const NIXY_FEET_BELOW_CENTER = 28;

/**
 * Começo do Capítulo I depois do corredor do prólogo: uma porta sobe do chão no fogo na borda de
 * cima do mapa e abre, a Nixy sai, a porta fecha e afunda, ela desce até um cão, conversa, o cão
 * late e a horda começa (os quatro cães de sempre + o próprio cão vira um inimigo).
 *
 * Enquanto `isActive`, a GameScene não roda armas, Suprema, monstros nem spawns: nada ataca
 * sozinho durante a cena.
 */
export class StoryArrivalSystem {
  private step: Step = 'idle';
  private walkLeft = 0;
  private door?: Phaser.GameObjects.Sprite;
  private dog?: Phaser.GameObjects.Image;
  private barkText?: Phaser.GameObjects.Text;
  private readonly timers: Phaser.Time.TimerEvent[] = [];

  constructor(private readonly ctx: IStoryArrivalContext, private readonly onCombatStart: (dogX: number, dogY: number) => void) {}

  public get isActive(): boolean {
    return this.step !== 'idle' && this.step !== 'done';
  }

  /**
   * Monta a porta (encostada na borda de cima do mapa) e o cão, e começa a cena: a porta sobe do
   * chão no fogo, a Nixy sai por ela e desce até o cão.
   */
  public start(): void {
    const p = this.ctx.player;
    const doorX = p.x;
    const doorBaseY = ARENA_CONFIG.MIN_Y + B.doorTopMargin;
    const startY = doorBaseY - NIXY_FEET_BELOW_CENTER + 4;
    const stopY = startY + B.walkDistance;

    // A Nixy espera escondida na frente da porta e depois anda para baixo
    p.setPosition(doorX, startY);
    (p.body as Phaser.Physics.Arcade.Body | null)?.reset(doorX, startY);
    p.setAlpha(0);
    p.currentDirection = 'south';
    this.ctx.cameras.main.centerOn(doorX, stopY);

    this.createDoorAnims();
    this.door = this.ctx.add.sprite(doorX, doorBaseY, ARRIVAL_TEXTURES.door, 0)
      .setOrigin(0.5, ARRIVAL_DOOR_FRAME.groundY / ARRIVAL_DOOR_FRAME.height)
      .setScale(B.artScale)
      .setDepth(p.depth - 1)
      .setVisible(false);
    // O cão espera ao lado de onde ela para, olhando para ela (a arte olha para a direita)
    this.dog = this.ctx.add.image(doorX - B.dogGap, stopY + NIXY_FEET_BELOW_CENTER, ARRIVAL_TEXTURES.dogIdle)
      .setOrigin(0.5, 1)
      .setScale(B.artScale)
      .setDepth(p.depth - 1);

    this.ctx.setHUDVisible(false);
    this.ctx.cameras.main.fadeIn(B.fadeInMs, 0, 0, 0);
    this.step = 'rising';
    this.later(B.fadeInMs * 0.5, () => this.riseDoor());
  }

  private createDoorAnims(): void {
    for (const a of Object.values(DOOR_ANIMS)) {
      // Criada vazia (arte ainda não carregada)? Refaz
      const existing = this.ctx.anims.get(a.key);
      if (existing && existing.frames.length > 0) continue;
      if (existing) this.ctx.anims.remove(a.key);
      this.ctx.anims.create({
        key: a.key,
        frames: a.frames.map((frame) => ({ key: ARRIVAL_TEXTURES.door, frame })),
        frameRate: a.frameRate,
      });
    }
  }

  /**
   * Toca uma animação da porta e chama `then` quando ela acaba. Se a animação não rodar (arte
   * faltando), segue mesmo assim depois de um tempo: a cena nunca pode travar aqui.
   */
  private playDoor(anim: { key: string; frames: readonly number[]; frameRate: number }, then: () => void): void {
    const door = this.door;
    let done = false;
    const finish = (): void => {
      if (done) return;
      done = true;
      then();
    };
    if (!door || !this.ctx.anims.get(anim.key)?.frames.length) {
      finish();
      return;
    }
    door.once(Phaser.Animations.Events.ANIMATION_COMPLETE, finish);
    door.play(anim.key);
    this.later((anim.frames.length / anim.frameRate) * 1000 + 600, finish);
  }

  /** A porta sobe do chão no fogo, abre, a Nixy sai por ela e a porta fecha atrás dela. */
  private riseDoor(): void {
    // Sem a arte (não deveria acontecer), melhor sem porta do que o quadrado de textura faltando
    this.door?.setVisible(this.door.texture.key === ARRIVAL_TEXTURES.door);
    this.ctx.cameras.main.shake(B.doorRiseMs, B.barkShakeIntensity * 0.6);
    SoundManager.getInstance().playSmokePoof();
    this.playDoor(DOOR_ANIMS.rise, () => {
      SoundManager.getInstance().playTableKick();
      this.playDoor(DOOR_ANIMS.open, () => {
        this.ctx.tweens.add({ targets: this.ctx.player, alpha: 1, duration: 260 });
        this.walkLeft = B.walkDistance;
        this.step = 'walking';
        this.later(B.doorCloseDelayMs, () => this.playDoor(DOOR_ANIMS.close, () => undefined));
      });
    });
  }

  /** Chamado pela GameScene a cada quadro enquanto `isActive`. */
  public update(delta: number): void {
    if (this.step !== 'walking') {
      // Parada (conversa, latidos): só respira no lugar
      this.ctx.player.updateNixy(0, 0, false, delta);
      return;
    }
    const step = Math.min(this.walkLeft, (B.walkSpeed * delta) / 1000);
    this.walkLeft -= step;
    const p = this.ctx.player;
    // Anda pela física desligada da velocidade normal: posição direta, animação de corrida
    p.updateNixy(0, 1, false, delta);
    const body = p.body as Phaser.Physics.Arcade.Body | null;
    body?.setVelocity(0, 0);
    p.y += step;
    body?.reset(p.x, p.y);

    if (this.walkLeft <= 0) {
      this.step = 'talking';
      // Para virada para o cão (que está à esquerda)
      p.currentDirection = 'west';
      p.updateNixy(0, 0, false, 0);
      this.sinkDoor();
      this.later(B.beforeDialogueMs, () => {
        this.ctx.playDialogue(STORY_ARRIVAL_DIALOGUE, () => this.barkSequence());
      });
    }
  }

  private barkSequence(): void {
    this.step = 'barking';
    for (let i = 0; i < B.barkCount; i++) {
      this.later(i * B.barkIntervalMs, () => this.bark());
    }
    const end = B.barkCount * B.barkIntervalMs;
    this.later(end, () => {
      this.dog?.setTexture(ARRIVAL_TEXTURES.dogIdle);
      this.barkText?.destroy();
      this.barkText = undefined;
      this.ctx.showCombatSpeechBubble(this.ctx.player, STORY_ARRIVAL_AFTER_BARK_TEXT, 2600, true);
    });
    this.later(end + B.afterBarkMs, () => this.finish());
  }

  private bark(): void {
    const dog = this.dog;
    if (!dog) return;
    dog.setTexture(ARRIVAL_TEXTURES.dogBark);
    this.later(B.barkIntervalMs * 0.55, () => {
      if (dog.active) dog.setTexture(ARRIVAL_TEXTURES.dogIdle);
    });
    this.ctx.cameras.main.shake(B.barkShakeMs, B.barkShakeIntensity);
    SoundManager.getInstance().playDogBark();
    if (!this.barkText) {
      this.barkText = this.ctx.add.text(dog.x, dog.y - dog.displayHeight - 4, STORY_ARRIVAL_BARK_TEXT, {
        fontFamily: FONTS.display,
        fontSize: '16px',
        fontStyle: 'bold',
        color: PROLOGUE_THEME.barkText,
        stroke: COLORS.strokeBlack,
        strokeThickness: 4,
      }).setOrigin(0.5, 1).setDepth(1500).setResolution(2);
    }
    this.ctx.tweens.add({ targets: this.barkText, scale: { from: 1.25, to: 1 }, duration: 160 });
  }

  /** Fim da cena: o cão vira um inimigo de verdade e a partida começa. */
  private finish(): void {
    if (this.step === 'done') return;
    this.step = 'done';
    const x = this.dog?.x ?? this.ctx.player.x;
    const y = this.dog ? this.dog.y - this.dog.displayHeight / 2 : this.ctx.player.y;
    this.dog?.destroy();
    this.dog = undefined;
    this.ctx.spawnZombieDogAt(x, y);
    this.ctx.setHUDVisible(true);
    this.onCombatStart(x, y);
  }

  /** A porta (já fechada) volta a afundar no chão em brasa e some. */
  private sinkDoor(): void {
    const door = this.door;
    if (!door) return;
    SoundManager.getInstance().playSmokePoof();
    // A subida de trás para frente: volta para o fogo e some
    this.door = undefined;
    this.playDoorThen(door, DOOR_ANIMS.sink, () => door.destroy());
  }

  /** Como `playDoor`, para uma porta que já saiu de `this.door` (afundando). */
  private playDoorThen(door: Phaser.GameObjects.Sprite, anim: { key: string; frames: readonly number[]; frameRate: number }, then: () => void): void {
    const previous = this.door;
    this.door = door;
    this.playDoor(anim, then);
    this.door = previous;
  }

  private later(ms: number, fn: () => void): void {
    this.timers.push(this.ctx.time.delayedCall(ms, fn));
  }

  public destroy(): void {
    for (const t of this.timers) t.remove();
    this.timers.length = 0;
    this.door?.destroy();
    this.dog?.destroy();
    this.barkText?.destroy();
    this.step = 'done';
  }
}
