import Phaser from 'phaser';
import { STORY_ARRIVAL_BALANCE as B } from '../config/balance';
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

/** Textura do cão do encontro (scripts/cut-prologue-dog.py) e da porta (cut-prologue-corridor.py). */
export const ARRIVAL_TEXTURES = {
  dogIdle: 'prologue-dog-idle',
  dogBark: 'prologue-dog-bark',
  door: 'prologue-door',
} as const;

/** O que a chegada precisa da cena da partida. */
export interface IStoryArrivalContext {
  readonly add: Phaser.GameObjects.GameObjectFactory;
  readonly tweens: Phaser.Tweens.TweenManager;
  readonly time: Phaser.Time.Clock;
  readonly cameras: Phaser.Cameras.Scene2D.CameraManager;
  readonly player: BaseCharacter & { updateNixy(dx: number, dy: number, sprint: boolean, delta: number): void };
  playDialogue(lines: DialogueLine[], onComplete: () => void): void;
  setHUDVisible(visible: boolean): void;
  showCombatSpeechBubble(target: ICombatBubbleTarget, text: string, durationMs: number, isNixy?: boolean): void;
  spawnZombieDogAt(x: number, y: number): void;
}

type Step = 'idle' | 'walking' | 'talking' | 'barking' | 'done';

/**
 * Começo do Capítulo I depois do corredor do prólogo: a Nixy sai por uma porta à direita do
 * ponto de nascimento, anda sozinha para a esquerda, dá de cara com um cão, conversa, o cão late
 * e a horda começa (os quatro cães de sempre + o próprio cão vira um inimigo).
 *
 * Enquanto `isActive`, a GameScene não roda armas, Suprema, monstros nem spawns: nada ataca
 * sozinho durante a cena.
 */
export class StoryArrivalSystem {
  private step: Step = 'idle';
  private walkLeft = 0;
  private door?: Phaser.GameObjects.Image;
  private dog?: Phaser.GameObjects.Image;
  private barkText?: Phaser.GameObjects.Text;
  private readonly timers: Phaser.Time.TimerEvent[] = [];

  constructor(private readonly ctx: IStoryArrivalContext, private readonly onCombatStart: (dogX: number, dogY: number) => void) {}

  public get isActive(): boolean {
    return this.step !== 'idle' && this.step !== 'done';
  }

  /** Monta a porta e o cão e começa a cena. A Nixy já está no ponto de nascimento. */
  public start(): void {
    const p = this.ctx.player;
    const startX = p.x;
    const startY = p.y;
    const doorX = startX + B.doorOffsetX;
    const stopX = startX - B.walkDistance + B.doorOffsetX;

    // A Nixy nasce na porta, de costas para ela, e anda para a esquerda
    p.setPosition(doorX, startY);
    (p.body as Phaser.Physics.Arcade.Body | null)?.reset(doorX, startY);
    p.setAlpha(0);
    p.currentDirection = 'west';

    this.door = this.ctx.add.image(doorX, startY + 28, ARRIVAL_TEXTURES.door)
      .setOrigin(0.5, 1)
      .setScale(B.artScale)
      .setDepth(p.depth - 1);
    this.dog = this.ctx.add.image(stopX - B.dogGap, startY + 20, ARRIVAL_TEXTURES.dogIdle)
      .setOrigin(0.5, 1)
      .setScale(B.artScale)
      .setDepth(p.depth - 1);

    this.ctx.setHUDVisible(false);
    this.ctx.cameras.main.fadeIn(B.fadeInMs, 0, 0, 0);

    // Porta abre: clarão laranja, ela aparece e começa a andar
    this.door.setTint(PROLOGUE_THEME.doorGlow);
    this.later(500, () => this.door?.clearTint());
    SoundManager.getInstance().playTableKick();
    this.ctx.tweens.add({ targets: p, alpha: 1, duration: 260 });
    this.walkLeft = B.walkDistance;
    this.step = 'walking';
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
    p.updateNixy(-1, 0, false, delta);
    const body = p.body as Phaser.Physics.Arcade.Body | null;
    body?.setVelocity(0, 0);
    p.x -= step;
    body?.reset(p.x, p.y);

    if (this.walkLeft <= 0) {
      this.step = 'talking';
      p.updateNixy(0, 0, false, 0);
      this.vanishDoor();
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

  /** A porta se desfaz em fumaça (não fica atrapalhando a arena). */
  private vanishDoor(): void {
    const door = this.door;
    if (!door) return;
    SoundManager.getInstance().playSmokePoof();
    door.setTint(PROLOGUE_THEME.doorSmoke);
    this.ctx.tweens.add({
      targets: door,
      alpha: 0,
      scaleY: door.scaleY * 0.2,
      duration: B.doorVanishMs,
      ease: 'Quad.easeIn',
      onComplete: () => door.destroy(),
    });
    this.door = undefined;
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
