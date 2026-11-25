import Phaser from 'phaser';
import { TALISMAN_BALANCE } from '../../../config/balance';
import { TALISMAN_THEME } from '../../../config/theme';
import { SoundManager } from '../../../systems/SoundManager';
import type { BaseEnemy } from '../../enemies/BaseEnemy';
import { enemiesInRadius, enemiesOnScreen, hitEnemy } from '../talismanContext';
import { BaseActive } from './BaseActive';
import type { ITalismanContext } from '../talismanContext';

/**
 * Vórtice do Abismo (raro): com muitos monstros na tela, abre um buraco no meio deles
 * que suga todo mundo por perto e explode no fim.
 */
export class VortexActive extends BaseActive {
  private vortex: { x: number; y: number; t: number; g: Phaser.GameObjects.Graphics } | null = null;

  constructor(ctx: ITalismanContext) {
    super(ctx, 'VÓRTICE DO ABISMO!', TALISMAN_BALANCE.actives.vortex.cooldownMs);
  }

  protected shouldTrigger(): boolean {
    return !this.vortex && enemiesOnScreen(this.ctx).length >= TALISMAN_BALANCE.actives.vortex.triggerCount;
  }

  protected activate(): void {
    // Centro: média das posições dos monstros na tela (o meio da multidão)
    const list = enemiesOnScreen(this.ctx);
    const cx = list.reduce((s, e) => s + e.x, 0) / list.length;
    const cy = list.reduce((s, e) => s + e.y, 0) / list.length;
    const g = this.ctx.scene.add.graphics().setDepth(12).setBlendMode(Phaser.BlendModes.ADD);
    this.vortex = { x: cx, y: cy, t: 0, g };
    SoundManager.getInstance().playAzazelTeleport();
  }

  public override update(deltaMs: number): void {
    super.update(deltaMs);
    const v = this.vortex;
    if (!v) return;
    const cfg = TALISMAN_BALANCE.actives.vortex;
    v.t += deltaMs;

    // Puxa os monstros (chefes e pesados resistem)
    const step = cfg.pullSpeed * (deltaMs / 1000);
    for (const e of enemiesInRadius(this.ctx, v.x, v.y, cfg.radius)) this.pull(e, v.x, v.y, step);

    const fx = TALISMAN_THEME.fx;
    const spin = v.t * 0.008;
    v.g.clear();
    v.g.fillStyle(fx.vortex, 0.35);
    v.g.fillCircle(v.x, v.y, 26);
    for (let i = 0; i < 3; i++) {
      v.g.lineStyle(2, i === 0 ? fx.vortexCore : fx.vortex, 0.8);
      v.g.beginPath();
      v.g.arc(v.x, v.y, 30 + i * 18, spin + i * 2, spin + i * 2 + Math.PI * 1.2);
      v.g.strokePath();
    }

    if (v.t >= cfg.pullMs) this.explode(v);
  }

  private pull(e: BaseEnemy, x: number, y: number, step: number): void {
    if (e.isBoss || e.isHeavy) return;
    const dx = x - e.x;
    const dy = y - e.y;
    const d = Math.hypot(dx, dy);
    if (d < 6) return;
    e.x += (dx / d) * Math.min(step, d);
    e.y += (dy / d) * Math.min(step, d);
  }

  private explode(v: { x: number; y: number; g: Phaser.GameObjects.Graphics }): void {
    const cfg = TALISMAN_BALANCE.actives.vortex;
    for (const e of enemiesInRadius(this.ctx, v.x, v.y, cfg.radius * 0.6)) hitEnemy(this.ctx, e, cfg.damage);
    v.g.destroy();
    this.vortex = null;
    const scene = this.ctx.scene;
    const boom = scene.add.circle(v.x, v.y, cfg.radius * 0.6, TALISMAN_THEME.fx.vortexCore, 0.4).setDepth(26).setScale(0.1).setBlendMode(Phaser.BlendModes.ADD);
    scene.tweens.add({ targets: boom, scale: 1, alpha: 0, duration: 360, ease: 'Cubic.easeOut', onComplete: () => boom.destroy() });
    scene.cameras.main.shake(180, 0.007);
    SoundManager.getInstance().playEnemyExplosion();
  }

  public override destroy(): void {
    this.vortex?.g.destroy();
    this.vortex = null;
  }
}
