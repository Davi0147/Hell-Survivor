import Phaser from 'phaser';
import { TALISMAN_BALANCE } from '../../../config/balance';
import { TALISMAN_THEME } from '../../../config/theme';
import { SoundManager } from '../../../systems/SoundManager';
import { enemiesInRadius, enemiesOnScreen, hitEnemy, type ITalismanContext, type TalismanEffect } from '../talismanContext';

/** Espinhos de Osso (incomum): marca o chão embaixo de monstros e espinhos brotam logo depois. */
export class BoneSpikesWeapon implements TalismanEffect {
  private timer = 900;
  private readonly pending: Phaser.Time.TimerEvent[] = [];

  constructor(private readonly ctx: ITalismanContext) {}

  public update(deltaMs: number): void {
    this.timer -= deltaMs;
    if (this.timer > 0) return;
    const cfg = TALISMAN_BALANCE.weapons.boneSpikes;
    const targets = Phaser.Utils.Array.Shuffle(enemiesOnScreen(this.ctx)).slice(0, cfg.targets);
    if (targets.length === 0) {
      this.timer = 250;
      return;
    }
    this.timer = cfg.everyMs;
    for (const t of targets) this.telegraph(t.x, t.y);
  }

  private telegraph(x: number, y: number): void {
    const cfg = TALISMAN_BALANCE.weapons.boneSpikes;
    const scene = this.ctx.scene;
    const warn = scene.add.circle(x, y, cfg.radius, TALISMAN_THEME.fx.boneWarn, 0.18).setDepth(12);
    warn.setStrokeStyle(2, TALISMAN_THEME.fx.boneWarn, 0.8);
    const ev = scene.time.delayedCall(cfg.warnMs, () => {
      warn.destroy();
      this.erupt(x, y);
      const i = this.pending.indexOf(ev);
      if (i >= 0) this.pending.splice(i, 1);
    });
    this.pending.push(ev);
  }

  private erupt(x: number, y: number): void {
    const cfg = TALISMAN_BALANCE.weapons.boneSpikes;
    for (const e of enemiesInRadius(this.ctx, x, y, cfg.radius)) hitEnemy(this.ctx, e, cfg.damage);
    const scene = this.ctx.scene;
    const g = scene.add.graphics().setDepth(17);
    g.fillStyle(TALISMAN_THEME.fx.bone, 1);
    const spikes = 6;
    for (let i = 0; i < spikes; i++) {
      const a = (i / spikes) * Math.PI * 2;
      const bx = x + Math.cos(a) * cfg.radius * 0.45;
      const by = y + Math.sin(a) * cfg.radius * 0.3;
      g.fillTriangle(bx - 4, by, bx + 4, by, bx, by - 22);
    }
    g.fillTriangle(x - 6, y + 2, x + 6, y + 2, x, y - 30);
    g.setScale(1, 0.1);
    scene.tweens.add({ targets: g, scaleY: 1, duration: 90, ease: 'Back.easeOut' });
    scene.tweens.add({ targets: g, alpha: 0, delay: 260, duration: 220, onComplete: () => g.destroy() });
    SoundManager.getInstance().playEnemyHit();
  }

  public destroy(): void {
    for (const ev of this.pending) ev.remove(false);
    this.pending.length = 0;
  }
}
