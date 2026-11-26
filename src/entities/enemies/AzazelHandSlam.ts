import Phaser from 'phaser';
import type { BaseCharacter } from '../characters/BaseCharacter';
import { SoundManager } from '../../systems/SoundManager';
import { DebugSessionLogger } from '../../systems/DebugSessionLogger';
import { BOSS_TELEGRAPH } from '../../config/theme';
import { AZAZEL_BOSS_BALANCE } from '../../config/balance';
import { handSlamCount, handSlamRect, handSlamTargets, isInsideHandSlam } from '../../systems/crystalPhaseRules';

export const HAND_SLAM_TEXTURE = 'azazel-hand-slam';

interface SlamMark {
  x: number;
  y: number;
  timerMs: number;
  /** Mão esquerda (desenho espelhado): a segunda mão do par, para não ficarem duas iguais. */
  mirrored: boolean;
}

/**
 * Tapa da Mão — golpe do Azazel na fase dos cristais (ele está banido, só a mão aparece).
 * Marca um círculo no chão e, depois do aviso, a mão gigante desce do alto e bate ali.
 * Quem estiver dentro leva o golpe; a dica é sair do cristal por um instante e voltar.
 */
export class AzazelHandSlam {
  private marks: SlamMark[] = [];
  private hands: Phaser.GameObjects.Image[] = [];
  private cooldownMs = 0;
  private elapsedMs = 0;
  private running = false;
  private player?: BaseCharacter;
  private graphics?: Phaser.GameObjects.Graphics;

  /**
   * @param hit aplica o dano na heroína (respeita esquiva e imunidade curta); `true` se acertou
   */
  constructor(
    private readonly scene: Phaser.Scene,
    private readonly hit: (player: BaseCharacter, damage: number) => boolean
  ) {}

  public start(): void {
    this.clear();
    this.running = true;
    this.elapsedMs = 0;
    this.cooldownMs = AZAZEL_BOSS_BALANCE.crystalPhase.handSlam.firstDelayMs;
  }

  /** Para de marcar e some com marcas e mãos (fim da fase, morte, troca de cena). */
  public stop(): void {
    this.running = false;
    this.clear();
  }

  public get isRunning(): boolean {
    return this.running;
  }

  public get pendingMarks(): number {
    return this.marks.length;
  }

  public update(player: BaseCharacter, deltaMs: number): void {
    if (!this.running) return;
    const cfg = AZAZEL_BOSS_BALANCE.crystalPhase.handSlam;
    this.player = player;
    this.elapsedMs += deltaMs;
    this.cooldownMs -= deltaMs;

    if (this.cooldownMs <= 0) {
      this.cooldownMs = cfg.everyMs;
      const body = player.body as Phaser.Physics.Arcade.Body | null;
      const targets = handSlamTargets(
        handSlamCount(this.elapsedMs),
        player.x,
        player.y,
        body?.velocity.x ?? 0,
        body?.velocity.y ?? 0
      );
      targets.forEach((t, i) => this.marks.push({ x: t.x, y: t.y, timerMs: cfg.telegraphMs, mirrored: i % 2 === 1 }));
      SoundManager.getInstance().playAzazelTeleport();
    }

    for (let i = this.marks.length - 1; i >= 0; i--) {
      const m = this.marks[i];
      m.timerMs -= deltaMs;
      if (m.timerMs <= 0) {
        this.marks.splice(i, 1);
        this.dropHand(m);
      }
    }
    this.drawMarks();
  }

  private ensureGraphics(): Phaser.GameObjects.Graphics {
    if (!this.graphics || !this.graphics.scene) {
      // No chão: abaixo dos monstros (5–15) e da heroína
      this.graphics = this.scene.add.graphics().setDepth(4);
    }
    return this.graphics;
  }

  private drawMarks(): void {
    const g = this.ensureGraphics();
    g.clear();
    const cfg = AZAZEL_BOSS_BALANCE.crystalPhase.handSlam;
    for (const m of this.marks) {
      const progress = Phaser.Math.Clamp(1 - m.timerMs / cfg.telegraphMs, 0, 1);
      const r = handSlamRect(m.x, m.y);
      // Enche da largura do braço para fora, como o círculo dos raios enche do centro
      const fillW = r.width * progress;
      g.fillStyle(BOSS_TELEGRAPH.circleFillColor, BOSS_TELEGRAPH.circleFillAlpha(progress));
      g.fillRect(m.x - fillW / 2, r.top, fillW, r.height);
      g.lineStyle(BOSS_TELEGRAPH.circleBorderThickness(progress), BOSS_TELEGRAPH.circleBorderColor, 0.9);
      g.strokeRect(r.left, r.top, r.width, r.height);
    }
  }

  /** A mão desce do alto, bate (dano e tremor) e sobe sumindo. */
  private dropHand(mark: SlamMark): void {
    const { x, y } = mark;
    const cfg = AZAZEL_BOSS_BALANCE.crystalPhase.handSlam;
    if (!this.scene.textures.exists(HAND_SLAM_TEXTURE)) {
      this.impact(x, y);
      return;
    }
    const hand = this.scene.add.image(x, y - cfg.dropFromPx, HAND_SLAM_TEXTURE);
    hand.setOrigin(0.5, cfg.palmOriginY).setScale(cfg.scale).setDepth(28).setAlpha(0).setFlipX(mark.mirrored);
    this.hands.push(hand);

    this.scene.tweens.add({
      targets: hand,
      y,
      alpha: 1,
      duration: cfg.dropMs,
      ease: 'Quad.easeIn',
      onComplete: () => {
        this.impact(x, y);
        this.scene.tweens.add({
          targets: hand,
          y: y - cfg.dropFromPx * 0.45,
          alpha: 0,
          delay: cfg.holdMs,
          duration: cfg.riseMs,
          ease: 'Quad.easeIn',
          onComplete: () => this.removeHand(hand),
        });
      },
    });
  }

  private impact(x: number, y: number): void {
    const cfg = AZAZEL_BOSS_BALANCE.crystalPhase.handSlam;
    SoundManager.getInstance().playBossSlam();
    this.scene.cameras.main.shake(220, 0.016);

    // Clarão no chão do tamanho da área atingida (mão + braço), abrindo para os lados
    const r = handSlamRect(x, y);
    const flash = this.scene.add.rectangle(x, r.top + r.height / 2, r.width, r.height);
    flash.setStrokeStyle(4, BOSS_TELEGRAPH.circleBorderColor, 0.9).setDepth(5);
    this.scene.tweens.add({
      targets: flash,
      scaleX: 1.35,
      alpha: 0,
      duration: 320,
      ease: 'Cubic.easeOut',
      onComplete: () => flash.destroy(),
    });

    const p = this.player;
    if (this.running && p && p.active && isInsideHandSlam(p.x, p.y, x, y) && this.hit(p, cfg.damage)) {
      DebugSessionLogger.getInstance().log('BOSS', 'INFO', `Tapa da Mão do Azazel acertou a heroína em (${Math.round(x)}, ${Math.round(y)}).`);
    }
  }

  private removeHand(hand: Phaser.GameObjects.Image): void {
    this.hands = this.hands.filter((h) => h !== hand);
    if (hand.scene) hand.destroy();
  }

  private clear(): void {
    this.marks = [];
    this.graphics?.clear();
    for (const h of this.hands) {
      this.scene.tweens.killTweensOf(h);
      if (h.scene) h.destroy();
    }
    this.hands = [];
  }

  public destroy(): void {
    this.stop();
    if (this.graphics?.scene) this.graphics.destroy();
    this.graphics = undefined;
  }
}
