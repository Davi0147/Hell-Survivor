import { TALISMAN_BALANCE } from '../../../config/balance';
import { TALISMAN_THEME } from '../../../config/theme';
import { SoundManager } from '../../../systems/SoundManager';
import { enemiesInRadius, hitEnemy, type ITalismanContext, type TalismanEffect } from '../talismanContext';

/** Anel de Gelo Negro (raro): onda em volta da heroína que fere e congela por um instante. */
export class FrostRingWeapon implements TalismanEffect {
  private timer = 1500;

  constructor(private readonly ctx: ITalismanContext) {}

  public update(deltaMs: number): void {
    this.timer -= deltaMs;
    if (this.timer > 0) return;
    const cfg = TALISMAN_BALANCE.weapons.frostRing;
    const { x, y } = this.ctx.player;
    const hits = enemiesInRadius(this.ctx, x, y, cfg.radius);
    if (hits.length === 0) {
      this.timer = 300;
      return;
    }
    this.timer = cfg.everyMs;
    for (const e of hits) {
      hitEnemy(this.ctx, e, cfg.damage);
      // Chefes não congelam (quebraria as fases da luta), só levam o dano
      if (!e.isBoss) e.applyStun(cfg.stunMs);
    }
    this.drawRing(x, y, cfg.radius);
    SoundManager.getInstance().playAzazelTeleport();
  }

  private drawRing(x: number, y: number, radius: number): void {
    const scene = this.ctx.scene;
    const fx = TALISMAN_THEME.fx;
    const ring = scene.add.circle(x, y, radius, fx.frost, 0.22).setDepth(18).setScale(0.1);
    ring.setStrokeStyle(4, fx.frostCore, 0.95);
    scene.tweens.add({ targets: ring, scale: 1, alpha: 0, duration: 420, ease: 'Cubic.easeOut', onComplete: () => ring.destroy() });
  }

  public destroy(): void {
    // Sem objetos persistentes
  }
}
