import Phaser from 'phaser';
import { TALISMAN_BALANCE } from '../../../config/balance';
import { TALISMAN_THEME } from '../../../config/theme';
import { SoundManager } from '../../../systems/SoundManager';
import { enemiesInRadius, hitEnemy, pushEnemyFrom } from '../talismanContext';
import { BaseActive } from './BaseActive';
import type { ITalismanContext } from '../talismanContext';

/** Coração Sangrento (épico): com a vida baixa, cura de uma vez e solta uma onda de sangue. */
export class BloodHeartActive extends BaseActive {
  constructor(ctx: ITalismanContext) {
    super(ctx, 'CORAÇÃO SANGRENTO!', TALISMAN_BALANCE.actives.bloodHeart.cooldownMs, 0);
  }

  protected shouldTrigger(): boolean {
    const p = this.ctx.player;
    return p.currentHp / p.maxHp <= TALISMAN_BALANCE.actives.bloodHeart.hpFraction;
  }

  protected activate(): void {
    const cfg = TALISMAN_BALANCE.actives.bloodHeart;
    const p = this.ctx.player;
    p.heal(Math.round(p.maxHp * cfg.healFraction));
    for (const e of enemiesInRadius(this.ctx, p.x, p.y, cfg.radius)) {
      hitEnemy(this.ctx, e, cfg.damage);
      pushEnemyFrom(e, p.x, p.y, 40);
    }
    const scene = this.ctx.scene;
    const fx = TALISMAN_THEME.fx;
    const wave = scene.add.circle(p.x, p.y, cfg.radius, fx.blood, 0.3).setDepth(26).setScale(0.1).setBlendMode(Phaser.BlendModes.ADD);
    wave.setStrokeStyle(4, fx.bloodCore, 1);
    scene.tweens.add({ targets: wave, scale: 1, alpha: 0, duration: 520, ease: 'Cubic.easeOut', onComplete: () => wave.destroy() });
    scene.cameras.main.flash(220, (fx.blood >> 16) & 255, (fx.blood >> 8) & 255, fx.blood & 255);
    SoundManager.getInstance().playLevelUp();
  }
}
