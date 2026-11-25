import Phaser from 'phaser';
import { TALISMAN_BALANCE } from '../../../config/balance';
import { TALISMAN_THEME } from '../../../config/theme';
import { SoundManager } from '../../../systems/SoundManager';
import { enemiesInRadius, hitEnemy, pushEnemyFrom } from '../talismanContext';
import { BaseActive } from './BaseActive';
import type { ITalismanContext } from '../talismanContext';

/** Explosão Sombria (comum): quando os monstros cercam a heroína, explode e empurra todos. */
export class ShadowBurstActive extends BaseActive {
  constructor(ctx: ITalismanContext) {
    super(ctx, 'EXPLOSÃO SOMBRIA!', TALISMAN_BALANCE.actives.shadowBurst.cooldownMs);
  }

  protected shouldTrigger(): boolean {
    const cfg = TALISMAN_BALANCE.actives.shadowBurst;
    const { x, y } = this.ctx.player;
    return enemiesInRadius(this.ctx, x, y, cfg.triggerRadius).length >= cfg.triggerCount;
  }

  protected activate(): void {
    const cfg = TALISMAN_BALANCE.actives.shadowBurst;
    const { x, y } = this.ctx.player;
    for (const e of enemiesInRadius(this.ctx, x, y, cfg.radius)) {
      hitEnemy(this.ctx, e, cfg.damage);
      pushEnemyFrom(e, x, y, cfg.pushPx);
    }
    const scene = this.ctx.scene;
    const fx = TALISMAN_THEME.fx;
    const ring = scene.add.circle(x, y, cfg.radius, fx.shadowBurst, 0.35).setDepth(26).setScale(0.1).setBlendMode(Phaser.BlendModes.ADD);
    ring.setStrokeStyle(5, fx.shadowBurstCore, 1);
    scene.tweens.add({ targets: ring, scale: 1, alpha: 0, duration: 380, ease: 'Cubic.easeOut', onComplete: () => ring.destroy() });
    scene.cameras.main.shake(160, 0.006);
    SoundManager.getInstance().playRageBoom();
  }
}
