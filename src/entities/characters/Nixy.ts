import Phaser from 'phaser';
import { BaseCharacter } from './BaseCharacter';
import { BALANCE } from '../../config/balance';
import { MetaProgressManager } from '../../systems/MetaProgressManager';

export class Nixy extends BaseCharacter {
  private trailTimer: number = 0;
  private readonly TRAIL_INTERVAL_MS = 40;

  // Estado de Prisão Ácida (Skull Slime Root)
  public isRooted: boolean = false;
  private rootTimer: number = 0;

  // Estado de Lentidão (Rastro Tóxico da Múmia)
  public speedDebuffMultiplier: number = 1.0;
  private slowTimer: number = 0;

  // Estado de Knockback (Impacto da Múmia)
  private knockbackTimer: number = 0;
  private knockbackVelocity: { x: number; y: number } = { x: 0, y: 0 };

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'nixy-idle-south', BALANCE.NIXY);
    this.applyMetaProgressBlessings();
    this.play('nixy-idle-south');
  }

  public applyMetaProgressBlessings(): void {
    const meta = MetaProgressManager.getInstance();
    const mods = meta.getModifiers();
    if (mods.bonusMaxHp > 0) {
      this.maxHp += mods.bonusMaxHp;
      this.currentHp = this.maxHp;
    }
    if (mods.bonusDamagePercent > 0) {
      this.bonusDamagePercent += mods.bonusDamagePercent;
    }
    if (mods.bonusPickupRadiusMultiplier > 1) {
      this.bonusPickupRadiusPercent += (mods.bonusPickupRadiusMultiplier - 1) * 100;
    }
    if (mods.bonusSpeedMultiplier > 1) {
      this.bonusSpeedPercent += (mods.bonusSpeedMultiplier - 1) * 100;
    }
    if (mods.bonusMaxStamina > 0) {
      this.maxStamina += mods.bonusMaxStamina;
      this.currentStamina = this.maxStamina;
    }
    if (mods.rerollsAvailable > 0) {
      this.rerollsRemaining = 2 + mods.rerollsAvailable;
    }
  }

  public applyAcidRoot(durationMs: number = 1000): void {
    this.isRooted = true;
    this.rootTimer = durationMs;
    this.setTint(0x55ff77); // Sprite esverdeado do ácido
    const body = this.body as Phaser.Physics.Arcade.Body;
    if (body) {
      body.setVelocity(0, 0);
    }
  }

  public applySlow(multiplier: number = 0.60, durationMs: number = 600): void {
    this.speedDebuffMultiplier = Math.min(this.speedDebuffMultiplier, multiplier);
    this.slowTimer = Math.max(this.slowTimer, durationMs);
    if (!this.isRooted) {
      this.setTint(0x70e000); // Verde tóxico do lodo
    }
  }

  public applyKnockback(vx: number, vy: number, durationMs: number = 220): void {
    this.knockbackVelocity = { x: vx, y: vy };
    this.knockbackTimer = durationMs;
    const body = this.body as Phaser.Physics.Arcade.Body;
    if (body) {
      body.setVelocity(vx, vy);
    }
    this.camerasShake(durationMs);
  }

  private camerasShake(durationMs: number): void {
    try {
      this.scene.cameras.main.shake(durationMs, 0.008);
    } catch {}
  }

  public updateNixy(
    dx: number,
    dy: number,
    isSprintRequested: boolean,
    deltaMs: number
  ): void {
    // Gerenciamento de Knockback
    if (this.knockbackTimer > 0) {
      this.knockbackTimer -= deltaMs;
      const body = this.body as Phaser.Physics.Arcade.Body;
      if (body) {
        body.setVelocity(this.knockbackVelocity.x, this.knockbackVelocity.y);
      }
      this.updateAnimation();
      return;
    }

    // Gerenciamento de Lentidão (Rastro da Múmia)
    if (this.slowTimer > 0) {
      this.slowTimer -= deltaMs;
      if (this.slowTimer <= 0) {
        this.speedDebuffMultiplier = 1.0;
        if (!this.isRooted && this.hurtTimer <= 0) {
          this.clearTint();
        }
      }
    }

    // Gerenciamento de Prisão Ácida
    if (this.isRooted) {
      this.rootTimer -= deltaMs;
      if (this.rootTimer <= 0) {
        this.isRooted = false;
        this.clearTint();
      } else {
        // Bloqueia movimentação física e sprint enquanto enraizada
        dx = 0;
        dy = 0;
        isSprintRequested = false;
        this.setTint(0x55ff77);
      }
    }

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
