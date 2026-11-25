import Phaser from 'phaser';
import { TALISMAN_BALANCE } from '../../../config/balance';
import { TALISMAN_THEME } from '../../../config/theme';
import type { BaseEnemy } from '../../enemies/BaseEnemy';
import { hitEnemy, type ITalismanContext, type TalismanEffect } from '../talismanContext';

/** Olho do Abismo (épico): raio que gira sem parar em volta da heroína. */
export class AbyssEyeWeapon implements TalismanEffect {
  private angle = 0;
  private tickTimer = 0;
  private readonly g: Phaser.GameObjects.Graphics;

  constructor(private readonly ctx: ITalismanContext) {
    this.g = ctx.scene.add.graphics().setDepth(19).setBlendMode(Phaser.BlendModes.ADD);
  }

  public update(deltaMs: number): void {
    const cfg = TALISMAN_BALANCE.weapons.abyssEye;
    const { x, y } = this.ctx.player;
    this.angle = (this.angle + cfg.turnSpeed * (deltaMs / 1000)) % (Math.PI * 2);
    const ex = x + Math.cos(this.angle) * cfg.length;
    const ey = y + Math.sin(this.angle) * cfg.length;

    const fx = TALISMAN_THEME.fx;
    const flicker = 0.75 + Math.sin(this.ctx.scene.time.now * 0.03) * 0.15;
    this.g.clear();
    this.g.lineStyle(7, fx.eye, 0.45 * flicker);
    this.g.lineBetween(x, y, ex, ey);
    this.g.lineStyle(2, fx.eyeCore, flicker);
    this.g.lineBetween(x, y, ex, ey);
    this.g.fillStyle(fx.eyeCore, 0.9);
    this.g.fillCircle(ex, ey, 4);

    this.tickTimer -= deltaMs;
    if (this.tickTimer > 0) return;
    this.tickTimer = cfg.tickMs;
    for (const obj of this.ctx.enemiesGroup.getChildren()) {
      const e = obj as BaseEnemy;
      if (!e.active || e.isDead || e.isInvulnerable) continue;
      if (distanceToSegment(e.x, e.y, x, y, ex, ey) <= cfg.hitWidth) hitEnemy(this.ctx, e, cfg.damage);
    }
  }

  public destroy(): void {
    this.g.destroy();
  }
}

/** Distância do ponto (px, py) ao segmento A-B. */
export function distanceToSegment(px: number, py: number, ax: number, ay: number, bx: number, by: number): number {
  const abx = bx - ax;
  const aby = by - ay;
  const lenSq = abx * abx + aby * aby;
  const t = lenSq === 0 ? 0 : Math.max(0, Math.min(1, ((px - ax) * abx + (py - ay) * aby) / lenSq));
  return Math.hypot(px - (ax + abx * t), py - (ay + aby * t));
}
