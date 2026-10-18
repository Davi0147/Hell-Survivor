import Phaser from 'phaser';
import { BaseCharacter } from './BaseCharacter';
import { BALANCE } from '../../config/balance';
import { MetaProgressManager } from '../../systems/MetaProgressManager';
import {
  getStatusEffectTint,
  applyAcidRoot as applyAcidRootPure,
  applySlow as applySlowPure,
  applyKnockback as applyKnockbackPure,
  updateStatusEffects,
  StatusEffectsState,
} from '../../systems/statusEffects';

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

  // Pool de Rastro Fantasma de Sprint (reaproveitamento com teto máximo de 10 sprites)
  private ghostPool: Phaser.GameObjects.Sprite[] = [];
  private readonly MAX_GHOST_POOL_SIZE = 10;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'nixy-idle-south', BALANCE.NIXY);
    this.characterId = 'nixy';
    this.characterName = 'NIXY';
    this.applyMetaProgressBlessings();
    this.play('nixy-idle-south');

    this.scene.events.once(Phaser.Scenes.Events.SHUTDOWN, this.cleanupGhostPool, this);
    this.scene.events.once(Phaser.Scenes.Events.DESTROY, this.cleanupGhostPool, this);
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

  private getStatusState(): StatusEffectsState {
    return {
      rootTimer: this.rootTimer,
      slowTimer: this.slowTimer,
      knockbackTimer: this.knockbackTimer,
      isRooted: this.isRooted,
      speedDebuffMultiplier: this.speedDebuffMultiplier,
    };
  }

  private syncStatusState(state: StatusEffectsState): void {
    this.rootTimer = state.rootTimer;
    this.slowTimer = state.slowTimer;
    this.knockbackTimer = state.knockbackTimer;
    this.isRooted = state.isRooted;
    this.speedDebuffMultiplier = state.speedDebuffMultiplier;
  }

  private updateStatusTint(): void {
    const tint = getStatusEffectTint({
      isRooted: this.isRooted,
      rootTimer: this.rootTimer,
      slowTimer: this.slowTimer,
    });
    if (tint !== null) {
      this.setTint(tint);
    } else {
      this.clearTint();
    }
  }

  public applyAcidRoot(durationMs: number = 1000): void {
    const state = this.getStatusState();
    applyAcidRootPure(state, durationMs);
    this.syncStatusState(state);
    this.updateStatusTint();
    const body = this.body as Phaser.Physics.Arcade.Body;
    if (body) {
      body.setVelocity(0, 0);
    }
  }

  public applySlow(multiplier: number = 0.60, durationMs: number = 600): void {
    const state = this.getStatusState();
    applySlowPure(state, multiplier, durationMs);
    this.syncStatusState(state);
    this.updateStatusTint();
  }

  public applyKnockback(vx: number, vy: number, durationMs: number = 220): void {
    this.knockbackVelocity = { x: vx, y: vy };
    const state = this.getStatusState();
    applyKnockbackPure(state, durationMs);
    this.syncStatusState(state);
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
    // 1. Atualiza timers de controle de grupo via módulo puro
    const statusState = this.getStatusState();
    updateStatusEffects(statusState, deltaMs);
    this.syncStatusState(statusState);
    this.updateStatusTint();

    // 2. Gerenciamento de Knockback (não bloqueia mais o decremento de slow e root)
    if (this.knockbackTimer > 0) {
      const body = this.body as Phaser.Physics.Arcade.Body;
      if (body) {
        body.setVelocity(this.knockbackVelocity.x, this.knockbackVelocity.y);
      }
      this.updateAnimation();
      return;
    }

    // 3. Gerenciamento de Prisão Ácida: bloqueia movimentação e sprint
    if (this.isRooted) {
      dx = 0;
      dy = 0;
      isSprintRequested = false;
    }

    // 4. Atualiza física vetorial e estamina da classe base
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
    let ghost = this.ghostPool.find(g => !g.active);

    if (!ghost) {
      if (this.ghostPool.length < this.MAX_GHOST_POOL_SIZE) {
        ghost = this.scene.add.sprite(this.x, this.y, this.texture.key, this.frame.name);
        this.ghostPool.push(ghost);
      } else {
        // Reaproveita o sprite mais antigo quando a pool atinge a capacidade máxima
        ghost = this.ghostPool[0];
        this.ghostPool.push(this.ghostPool.shift()!);
      }
    }

    if (this.scene?.tweens) {
      this.scene.tweens.killTweensOf(ghost);
    }

    ghost.setTexture(this.texture.key, this.frame.name);
    ghost.setPosition(this.x, this.y);
    ghost.setFlipX(this.flipX);
    ghost.setFlipY(this.flipY);
    ghost.setScale(this.scaleX, this.scaleY);
    ghost.setTint(0xff2a6d);
    ghost.setAlpha(0.85);
    ghost.setBlendMode(Phaser.BlendModes.ADD);
    ghost.setDepth(this.depth - 1);
    ghost.setActive(true);
    ghost.setVisible(true);

    this.scene.tweens.add({
      targets: ghost,
      alpha: 0,
      scaleX: this.scaleX * 0.94,
      scaleY: this.scaleY * 0.94,
      duration: 360,
      ease: 'Quad.easeOut',
      onComplete: () => {
        ghost.setActive(false);
        ghost.setVisible(false);
      }
    });
  }

  public cleanupGhostPool(): void {
    if (this.scene?.events) {
      this.scene.events.off(Phaser.Scenes.Events.SHUTDOWN, this.cleanupGhostPool, this);
      this.scene.events.off(Phaser.Scenes.Events.DESTROY, this.cleanupGhostPool, this);
    }
    for (const ghost of this.ghostPool) {
      if (this.scene?.tweens) {
        this.scene.tweens.killTweensOf(ghost);
      }
      ghost.destroy();
    }
    this.ghostPool = [];
  }

  public destroy(fromScene?: boolean): void {
    this.cleanupGhostPool();
    super.destroy(fromScene);
  }
}
