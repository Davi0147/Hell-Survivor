import Phaser from 'phaser';
import { TALISMAN_BALANCE } from '../../../config/balance';
import { TALISMAN_THEME } from '../../../config/theme';
import { SoundManager } from '../../../systems/SoundManager';
import { BaseActive } from './BaseActive';
import type { ITalismanContext } from '../talismanContext';

/**
 * Escudo de Ossos (incomum): um escudo segura um golpe inteiro. Quando quebra, a heroína
 * fica intocável por um instante e o escudo volta depois da recarga.
 */
export class BoneShieldActive extends BaseActive {
  private readonly ring: Phaser.GameObjects.Arc;
  private readonly onBroken = (): void => this.shatter();

  constructor(ctx: ITalismanContext) {
    super(ctx, 'ESCUDO DE OSSOS!', TALISMAN_BALANCE.actives.boneShield.cooldownMs, 300);
    this.ring = ctx.scene.add.circle(ctx.player.x, ctx.player.y, 24).setDepth(24).setVisible(false);
    this.ring.setStrokeStyle(2, TALISMAN_THEME.fx.shield, 0.9).setFillStyle(TALISMAN_THEME.fx.shield, 0.08);
    ctx.player.on('shield-broken', this.onBroken);
  }

  protected shouldTrigger(): boolean {
    return this.ctx.player.damageShields <= 0;
  }

  protected activate(): void {
    this.ctx.player.damageShields = 1;
    this.ring.setVisible(true).setScale(1.6).setAlpha(0);
    this.ctx.scene.tweens.add({ targets: this.ring, scale: 1, alpha: 1, duration: 220, ease: 'Back.easeOut' });
    SoundManager.getInstance().playMenuClick();
  }

  public override update(deltaMs: number): void {
    super.update(deltaMs);
    const p = this.ctx.player;
    this.ring.setPosition(p.x, p.y - 4);
    if (this.ring.visible) this.ring.rotation += deltaMs * 0.003;
  }

  private shatter(): void {
    const cfg = TALISMAN_BALANCE.actives.boneShield;
    this.ctx.grantInvulnerability(cfg.invulnerableMs);
    this.restartCooldown();
    const scene = this.ctx.scene;
    this.ring.setVisible(false);
    const burst = scene.add.circle(this.ring.x, this.ring.y, 24).setDepth(24).setStrokeStyle(3, TALISMAN_THEME.fx.shield, 1);
    scene.tweens.add({ targets: burst, scale: 2.2, alpha: 0, duration: 300, onComplete: () => burst.destroy() });
    SoundManager.getInstance().playEnemyHit();
  }

  public override destroy(): void {
    this.ctx.player.off('shield-broken', this.onBroken);
    this.ctx.player.damageShields = 0;
    this.ring.destroy();
  }
}
