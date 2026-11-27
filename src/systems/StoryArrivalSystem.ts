import Phaser from 'phaser';
import { ARENA_CONFIG, STORY_ARRIVAL_BALANCE as B } from '../config/balance';
import { AWAKENING_CARD_TEXT, DOG_PORTRAITS, STORY_ARRIVAL_DIALOGUE } from '../config/dialogues';
import type { DialogueLine } from './DialogueSystem';
import { SoundManager } from './SoundManager';
import { getAwakeningCard, type UpgradeCard } from './UpgradeCatalog';
import { arrivalChaseReachedCard } from './prologueLogic';
import type { BaseCharacter } from '../entities/characters/BaseCharacter';

/** Porta da chegada (scripts/cut-prologue-door.py). Os retratos do cão ficam em DOG_PORTRAITS. */
export const ARRIVAL_TEXTURES = {
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

/** Cão no mundo antes de virar inimigo: o sprite comum do Cão Zumbi, olhando para a Nixy. */
const WORLD_DOG_ANIM = 'zombie-dog-idle-east';

/** O cão do encontro, já inimigo (só o que a cena precisa saber dele). */
export interface IArrivalDog {
  x: number;
  y: number;
  active: boolean;
  isDead?: boolean;
}

/** O que a chegada precisa da cena da partida. */
export interface IStoryArrivalContext {
  readonly add: Phaser.GameObjects.GameObjectFactory;
  readonly tweens: Phaser.Tweens.TweenManager;
  readonly time: Phaser.Time.Clock;
  readonly cameras: Phaser.Cameras.Scene2D.CameraManager;
  readonly anims: Phaser.Animations.AnimationManager;
  readonly player: BaseCharacter & { updateNixy(dx: number, dy: number, sprint: boolean, delta: number): void };
  isPlayerMovementLocked: boolean;
  playDialogue(lines: DialogueLine[], onComplete: () => void): void;
  setHUDVisible(visible: boolean): void;
  spawnZombieDogAt(x: number, y: number, hp?: number): IArrivalDog;
  /** Congela o jogo e mostra só estas cartas; `onChosen` quando o jogador escolhe. */
  openForcedCards(cards: UpgradeCard[], title: string, hint: string, onChosen: () => void): void;
  grantInvulnerability(ms: number): void;
}

/**
 * Fases da chegada:
 * - rising/walking/talking: cena (a GameScene só roda isto);
 * - chase: o cão corre até ela (monstros rodam; armas, spawns e controle parados);
 * - card: jogo congelado na carta única do ataque;
 * - firstKill: o ataque liga e mata o cão; a horda ainda espera;
 * - done: partida normal.
 */
type Step = 'idle' | 'rising' | 'walking' | 'talking' | 'chase' | 'card' | 'firstKill' | 'done';

/** Do centro do sprite da Nixy até os pés, em px do mundo (quadro de 64, pés em 60). */
const NIXY_FEET_BELOW_CENTER = 28;

/**
 * Começo do Capítulo I depois do corredor do prólogo: uma porta sobe do chão no fogo na borda de
 * cima do mapa e abre, a Nixy sai, a porta fecha e afunda, ela desce até um cão e conversa com
 * ele (retratos detalhados na tela de diálogo). O cão vira inimigo e corre até ela; no meio do
 * caminho o jogo congela numa carta única que desperta o ataque dela; escolhida, ela mata o cão
 * sozinha e só então a horda começa.
 */
export class StoryArrivalSystem {
  private step: Step = 'idle';
  private walkLeft = 0;
  private door?: Phaser.GameObjects.Sprite;
  private dogSprite?: Phaser.GameObjects.Sprite;
  private dog?: IArrivalDog;
  private chaseStartDist = 0;
  private readonly timers: Phaser.Time.TimerEvent[] = [];

  constructor(private readonly ctx: IStoryArrivalContext, private readonly onCombatStart: () => void) {}

  /** A chegada ainda não acabou (a Suprema espera). */
  public get isActive(): boolean {
    return this.step !== 'idle' && this.step !== 'done';
  }

  /** Cena pura: a GameScene não roda nada além desta cena. */
  public get isCutscene(): boolean {
    return this.step === 'rising' || this.step === 'walking' || this.step === 'talking';
  }

  /** Armas paradas até o jogador escolher a carta (nada ataca sozinho antes). */
  public get weaponsLocked(): boolean {
    return this.isActive && this.step !== 'firstKill';
  }

  /** Horda, eventos e cronograma de inimigos só depois da primeira morte. */
  public get spawnsLocked(): boolean {
    return this.isActive;
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
    // O cão espera à esquerda de onde ela para (mesma posição em que o inimigo nasce depois)
    this.dogSprite = this.ctx.add.sprite(doorX - B.dogGap, stopY, WORLD_DOG_ANIM).setDepth(5);
    if (this.ctx.anims.exists(WORLD_DOG_ANIM)) this.dogSprite.play(WORLD_DOG_ANIM);

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

  /**
   * Chamado pela GameScene a cada quadro enquanto `isActive`. Na cena (`isCutscene`) a GameScene
   * não roda mais nada; nas outras fases o jogo roda junto, com as travas acima.
   */
  public update(delta: number): void {
    if (this.step === 'walking') {
      this.walkOut(delta);
      return;
    }
    if (this.isCutscene) {
      // Parada (porta, conversa): só respira no lugar
      this.ctx.player.updateNixy(0, 0, false, delta);
      return;
    }
    if (this.step === 'chase' && this.dog) {
      const p = this.ctx.player;
      if (arrivalChaseReachedCard(this.chaseStartDist, Math.hypot(this.dog.x - p.x, this.dog.y - p.y), B.cardAtChaseFraction)) {
        this.showAwakeningCard();
      }
      return;
    }
    if (this.step === 'firstKill' && (!this.dog || !this.dog.active || this.dog.isDead)) {
      this.finish();
    }
  }

  private walkOut(delta: number): void {
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
        this.ctx.playDialogue(this.dialogueWithBark(), () => this.startChase());
      });
    }
  }

  /** O roteiro com o latido (tela treme e o som) na fala do retrato de boca aberta. */
  private dialogueWithBark(): DialogueLine[] {
    return STORY_ARRIVAL_DIALOGUE.map((line) =>
      line.portraitKey === DOG_PORTRAITS.bark ? { ...line, onShow: () => this.barkFx() } : line
    );
  }

  private barkFx(): void {
    for (let i = 0; i < B.barkCount; i++) {
      this.later(i * B.barkIntervalMs, () => {
        this.ctx.cameras.main.shake(B.barkShakeMs, B.barkShakeIntensity);
        SoundManager.getInstance().playDogBark();
      });
    }
  }

  /** O cão vira inimigo e corre até ela; ela fica parada esperando. */
  private startChase(): void {
    const x = this.dogSprite?.x ?? this.ctx.player.x - B.dogGap;
    const y = this.dogSprite?.y ?? this.ctx.player.y;
    this.dogSprite?.destroy();
    this.dogSprite = undefined;
    this.dog = this.ctx.spawnZombieDogAt(x, y, B.dogHp);
    const p = this.ctx.player;
    this.chaseStartDist = Math.hypot(x - p.x, y - p.y);
    this.ctx.isPlayerMovementLocked = true;
    this.step = 'chase';
  }

  /** No meio do caminho do cão: o jogo congela e só existe uma carta, o ataque dela. */
  private showAwakeningCard(): void {
    this.step = 'card';
    this.ctx.openForcedCards([getAwakeningCard()], AWAKENING_CARD_TEXT.title, AWAKENING_CARD_TEXT.hint, () => {
      this.ctx.isPlayerMovementLocked = false;
      // O cão já está perto: o primeiro tiro precisa sair antes da mordida
      this.ctx.grantInvulnerability(B.firstKillGraceMs);
      this.step = 'firstKill';
    });
  }

  /** Cão do encontro morto: a partida começa de verdade. */
  private finish(): void {
    if (this.step === 'done') return;
    this.step = 'done';
    this.ctx.isPlayerMovementLocked = false;
    this.ctx.setHUDVisible(true);
    this.onCombatStart();
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
    this.dogSprite?.destroy();
    this.step = 'done';
  }
}
