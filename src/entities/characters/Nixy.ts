import Phaser from 'phaser';
import { BaseCharacter } from './BaseCharacter';
import { BALANCE } from '../../config/balance';

export class Nixy extends BaseCharacter {
  private trailTimer: number = 0;
  private readonly TRAIL_INTERVAL_MS = 40;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'nixy-idle-south', BALANCE.NIXY);
    this.play('nixy-idle-south');
  }

  public updateNixy(
    dx: number,
    dy: number,
    isSprintRequested: boolean,
    deltaMs: number
  ): void {
    // Atualiza lógica central de física e estamina
    this.updateMovement(dx, dy, isSprintRequested, deltaMs);

    // Efeito visual de rastro (ghost trail / sombra fantasma) durante o Full Sprint
    if (this.isSprinting && this.isMoving) {
      this.trailTimer += deltaMs;
      if (this.trailTimer >= this.TRAIL_INTERVAL_MS) {
        this.trailTimer = 0;
        this.createSprintGhost();
      }
    } else {
      this.trailTimer = 0;
    }
  }

  protected updateAnimation(): void {
    const dir = this.currentDirection;

    // 1. Prioridade máxima: Pose de reação a dano (taking_damage)
    if (this.hurtTimer > 0) {
      const hurtKey = `nixy-hurt-${dir}`;
      if (this.anims.currentAnim?.key !== hurtKey) {
        this.play(hurtKey, true);
        this.anims.timeScale = 1.0;
      }
      return;
    }

    // 2. Movimentação (Sprint ou Corrida Normal)
    if (this.isMoving) {
      if (this.isSprinting) {
        this.playPreservingFrame(`nixy-sprint-${dir}`);
      } else {
        this.playPreservingFrame(`nixy-run-${dir}`);
      }
    } else {
      // 3. Pose de Idle estática atualizada
      const idleKey = `nixy-idle-${dir}`;
      if (this.anims.currentAnim?.key !== idleKey) {
        this.play(idleKey, true);
        this.anims.timeScale = 1.0;
      }
    }
  }

  private playPreservingFrame(targetKey: string): void {
    if (this.anims.currentAnim?.key === targetKey) return;

    const prevAnim = this.anims.currentAnim;
    const prevFrameIndex = this.anims.currentFrame?.index || 0;

    this.play(targetKey);

    // Se estava correndo/sprintando e mudou de direção, preserva o frame das pernas para não resetar o ciclo
    const newAnim = this.anims.currentAnim;
    if (prevAnim && newAnim && newAnim.frames.length > 1) {
      const frameToSet = newAnim.frames[prevFrameIndex % newAnim.frames.length];
      if (frameToSet) {
        this.anims.setCurrentFrame(frameToSet);
      }
    }
  }

  private createSprintGhost(): void {
    const ghost = this.scene.add.sprite(this.x, this.y, this.texture.key, this.frame.name);
    ghost.setFlipX(this.flipX);
    ghost.setFlipY(this.flipY);
    ghost.setScale(this.scaleX, this.scaleY);
    ghost.setTint(0xff2a6d);
    ghost.setAlpha(0.85);
    ghost.setBlendMode(Phaser.BlendModes.ADD);
    ghost.setDepth(this.depth - 1);

    this.scene.tweens.add({
      targets: ghost,
      alpha: 0,
      scaleX: this.scaleX * 0.94,
      scaleY: this.scaleY * 0.94,
      duration: 360,
      ease: 'Quad.easeOut',
      onComplete: () => {
        ghost.destroy();
      }
    });
  }
}
