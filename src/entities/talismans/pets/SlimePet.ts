import Phaser from 'phaser';
import { TALISMAN_BALANCE } from '../../../config/balance';
import { TALISMAN_THEME } from '../../../config/theme';
import { SoundManager } from '../../../systems/SoundManager';
import { BasePet } from './BasePet';
import { enemiesInRadius, hitEnemy, nearestEnemy, type ITalismanContext } from '../talismanContext';

/** Slime Saltador (incomum): pula em cima do monstro mais perto e esmaga tudo em volta. */
export class SlimePet extends BasePet {
  private jumpTimer = 1200;
  private jump: { fromX: number; fromY: number; toX: number; toY: number; t: number } | null = null;
  private readonly baseScale: number;

  constructor(ctx: ITalismanContext) {
    const scale = TALISMAN_BALANCE.pets.slime.scale;
    super(ctx, { run: 'skull-slime-run', idle: 'skull-slime-idle', runCardinalOnly: true }, scale);
    this.baseScale = scale;
  }

  public update(deltaMs: number): void {
    const cfg = TALISMAN_BALANCE.pets.slime;
    if (this.jump) {
      this.updateJump(deltaMs);
    } else {
      const rest = this.restPoint(Math.PI * 0.8);
      this.moveToward(rest.x, rest.y, 200, deltaMs, 8);
      this.jumpTimer -= deltaMs;
      if (this.jumpTimer <= 0) {
        const target = nearestEnemy(this.ctx, this.x, this.y, cfg.jumpRange);
        if (target) {
          this.jumpTimer = cfg.jumpEveryMs;
          this.jump = { fromX: this.x, fromY: this.y, toX: target.x, toY: target.y, t: 0 };
        } else {
          this.jumpTimer = 300;
        }
      }
    }
    this.syncOutline();
  }

  private updateJump(deltaMs: number): void {
    const cfg = TALISMAN_BALANCE.pets.slime;
    const j = this.jump!;
    j.t = Math.min(1, j.t + deltaMs / cfg.jumpMs);
    const arc = Math.sin(j.t * Math.PI);
    const x = Phaser.Math.Linear(j.fromX, j.toX, j.t);
    const y = Phaser.Math.Linear(j.fromY, j.toY, j.t) - arc * 46;
    this.placeAt(x, y, true, j.toX - j.fromX, j.toY - j.fromY);
    this.sprite.setScale(this.baseScale * (1 + arc * 0.35));
    if (j.t >= 1) {
      this.sprite.setScale(this.baseScale);
      this.jump = null;
      this.land(j.toX, j.toY, cfg.splashRadius, cfg.splashDamage);
    }
  }

  private land(x: number, y: number, radius: number, damage: number): void {
    for (const e of enemiesInRadius(this.ctx, x, y, radius)) hitEnemy(this.ctx, e, damage);
    SoundManager.getInstance().playSlimeExplode();
    const scene = this.ctx.scene;
    const ring = scene.add.circle(x, y, radius, TALISMAN_THEME.fx.slimeSplash, 0.28).setDepth(18).setScale(0.2);
    ring.setStrokeStyle(3, TALISMAN_THEME.fx.slimeSplash, 0.9);
    scene.tweens.add({ targets: ring, scale: 1, alpha: 0, duration: 280, ease: 'Quad.easeOut', onComplete: () => ring.destroy() });
  }
}
