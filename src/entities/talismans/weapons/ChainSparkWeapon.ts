import Phaser from 'phaser';
import { TALISMAN_BALANCE } from '../../../config/balance';
import { TALISMAN_THEME } from '../../../config/theme';
import { SoundManager } from '../../../systems/SoundManager';
import type { BaseEnemy } from '../../enemies/BaseEnemy';
import { enemiesInRadius, hitEnemy, nearestEnemy, type ITalismanContext, type TalismanEffect } from '../talismanContext';

/** Faísca Encadeada (comum): raio no monstro mais perto que pula para os vizinhos. */
export class ChainSparkWeapon implements TalismanEffect {
  private timer = 600;

  constructor(private readonly ctx: ITalismanContext) {}

  public update(deltaMs: number): void {
    this.timer -= deltaMs;
    if (this.timer > 0) return;
    const cfg = TALISMAN_BALANCE.weapons.chainSpark;
    const p = this.ctx.player;
    const first = nearestEnemy(this.ctx, p.x, p.y, cfg.range);
    if (!first) {
      this.timer = 200;
      return;
    }
    this.timer = cfg.everyMs;

    const chain: BaseEnemy[] = [first];
    let current = first;
    for (let i = 0; i < cfg.jumps; i++) {
      const next = enemiesInRadius(this.ctx, current.x, current.y, cfg.jumpRange).find((e) => !chain.includes(e));
      if (!next) break;
      chain.push(next);
      current = next;
    }

    const points = [{ x: p.x, y: p.y }, ...chain.map((e) => ({ x: e.x, y: e.y }))];
    for (const e of chain) hitEnemy(this.ctx, e, cfg.damage);
    this.drawBolt(points);
    SoundManager.getInstance().playEnemyHit();
  }

  private drawBolt(points: { x: number; y: number }[]): void {
    const scene = this.ctx.scene;
    const g = scene.add.graphics().setDepth(26).setBlendMode(Phaser.BlendModes.ADD);
    const fx = TALISMAN_THEME.fx;
    const zigzag = (width: number, color: number): void => {
      g.lineStyle(width, color, 1);
      g.beginPath();
      g.moveTo(points[0].x, points[0].y);
      for (let i = 1; i < points.length; i++) {
        const a = points[i - 1];
        const b = points[i];
        // Um ponto torto no meio de cada trecho, para parecer raio
        const mx = (a.x + b.x) / 2 + Phaser.Math.Between(-8, 8);
        const my = (a.y + b.y) / 2 + Phaser.Math.Between(-8, 8);
        g.lineTo(mx, my);
        g.lineTo(b.x, b.y);
      }
      g.strokePath();
    };
    zigzag(4, fx.spark);
    zigzag(1.5, fx.sparkCore);
    scene.tweens.add({ targets: g, alpha: 0, duration: 160, onComplete: () => g.destroy() });
  }

  public destroy(): void {
    // Nada persistente: cada raio se apaga sozinho
  }
}
