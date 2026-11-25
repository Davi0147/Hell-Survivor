import Phaser from 'phaser';
import { TALISMAN_BALANCE } from '../../../config/balance';
import { TALISMAN_THEME } from '../../../config/theme';
import { SoundManager } from '../../../systems/SoundManager';
import { enemiesInRadius, enemiesOnScreen, hitEnemy, type ITalismanContext, type TalismanEffect } from '../talismanContext';

/** Pilar do Inferno (lendário): colunas de fogo nos monstros com mais vida da tela. */
export class HellPillarWeapon implements TalismanEffect {
  private timer = 1200;
  private readonly pending: Phaser.Time.TimerEvent[] = [];

  constructor(private readonly ctx: ITalismanContext) {}

  public update(deltaMs: number): void {
    this.timer -= deltaMs;
    if (this.timer > 0) return;
    const cfg = TALISMAN_BALANCE.weapons.hellPillar;
    const p = this.ctx.player;
    const rangeSq = cfg.range * cfg.range;
    const targets = enemiesOnScreen(this.ctx)
      .filter((e) => (e.x - p.x) ** 2 + (e.y - p.y) ** 2 <= rangeSq)
      .sort((a, b) => b.hp - a.hp)
      .slice(0, cfg.targets);
    if (targets.length === 0) {
      this.timer = 300;
      return;
    }
    this.timer = cfg.everyMs;
    for (const t of targets) this.telegraph(t.x, t.y);
  }

  private telegraph(x: number, y: number): void {
    const cfg = TALISMAN_BALANCE.weapons.hellPillar;
    const scene = this.ctx.scene;
    const fx = TALISMAN_THEME.fx;
    const warn = scene.add.circle(x, y, cfg.radius, fx.pillar, 0.15).setDepth(12);
    warn.setStrokeStyle(2, fx.pillarCore, 0.9);
    scene.tweens.add({ targets: warn, alpha: { from: 0.4, to: 1 }, duration: cfg.warnMs / 3, yoyo: true, repeat: 1 });
    const ev = scene.time.delayedCall(cfg.warnMs, () => {
      warn.destroy();
      this.strike(x, y);
      const i = this.pending.indexOf(ev);
      if (i >= 0) this.pending.splice(i, 1);
    });
    this.pending.push(ev);
  }

  private strike(x: number, y: number): void {
    const cfg = TALISMAN_BALANCE.weapons.hellPillar;
    for (const e of enemiesInRadius(this.ctx, x, y, cfg.radius)) hitEnemy(this.ctx, e, cfg.damage);

    const scene = this.ctx.scene;
    const fx = TALISMAN_THEME.fx;
    const column = scene.add.rectangle(x, y, cfg.radius * 0.9, 260, fx.pillar, 0.75).setOrigin(0.5, 1).setDepth(27);
    column.setBlendMode(Phaser.BlendModes.ADD).setScale(0.2, 1);
    const core = scene.add.rectangle(x, y, cfg.radius * 0.35, 260, fx.pillarCore, 0.9).setOrigin(0.5, 1).setDepth(27);
    core.setBlendMode(Phaser.BlendModes.ADD).setScale(0.2, 1);
    scene.tweens.add({ targets: [column, core], scaleX: 1, duration: 90, ease: 'Quad.easeOut' });
    scene.tweens.add({ targets: [column, core], alpha: 0, scaleX: 0.1, delay: 220, duration: 260, onComplete: () => { column.destroy(); core.destroy(); } });

    if (scene.textures.exists('explosion-1') && scene.anims.exists('anim-explosion')) {
      const boom = scene.add.sprite(x, y, 'explosion-1').setDepth(27).setScale(1.6);
      boom.play('anim-explosion');
      boom.once('animationcomplete', () => boom.destroy());
    }
    scene.cameras.main.shake(140, 0.006);
    SoundManager.getInstance().playMeteorImpact();
  }

  public destroy(): void {
    for (const ev of this.pending) ev.remove(false);
    this.pending.length = 0;
  }
}
