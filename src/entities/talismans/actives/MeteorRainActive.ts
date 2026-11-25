import Phaser from 'phaser';
import { TALISMAN_BALANCE } from '../../../config/balance';
import { TALISMAN_THEME } from '../../../config/theme';
import { SoundManager } from '../../../systems/SoundManager';
import { enemiesInRadius, enemiesOnScreen, hitEnemy } from '../talismanContext';
import { BaseActive } from './BaseActive';
import type { ITalismanContext } from '../talismanContext';

/** Chuva de Meteoros (lendária): com a horda grande, meteoros caem nos monstros da tela. */
export class MeteorRainActive extends BaseActive {
  private readonly pending: Phaser.Time.TimerEvent[] = [];

  constructor(ctx: ITalismanContext) {
    super(ctx, 'CHUVA DE METEOROS!', TALISMAN_BALANCE.actives.meteorRain.cooldownMs);
  }

  protected shouldTrigger(): boolean {
    return enemiesOnScreen(this.ctx).length >= TALISMAN_BALANCE.actives.meteorRain.triggerCount;
  }

  protected activate(): void {
    const cfg = TALISMAN_BALANCE.actives.meteorRain;
    const scene = this.ctx.scene;
    for (let i = 0; i < cfg.meteors; i++) {
      const ev = scene.time.delayedCall((i / cfg.meteors) * cfg.spanMs, () => {
        const i2 = this.pending.indexOf(ev);
        if (i2 >= 0) this.pending.splice(i2, 1);
        // Escolhe o alvo na hora da queda: o monstro pode já ter morrido
        const targets = enemiesOnScreen(this.ctx);
        if (targets.length > 0) this.drop(Phaser.Utils.Array.GetRandom(targets));
      });
      this.pending.push(ev);
    }
  }

  private drop(target: { x: number; y: number }): void {
    const cfg = TALISMAN_BALANCE.actives.meteorRain;
    const scene = this.ctx.scene;
    const { x, y } = target;
    const hasArt = scene.textures.exists('infernal-meteor');
    const rock = hasArt
      ? scene.add.image(x + 60, y - 160, 'infernal-meteor').setScale(0.8)
      : scene.add.circle(x + 60, y - 160, 9, TALISMAN_THEME.fx.meteor, 1);
    rock.setDepth(28);
    scene.tweens.add({
      targets: rock, x, y, duration: 260, ease: 'Quad.easeIn',
      onComplete: () => {
        rock.destroy();
        for (const e of enemiesInRadius(this.ctx, x, y, cfg.radius)) hitEnemy(this.ctx, e, cfg.damage);
        if (scene.textures.exists('explosion-1') && scene.anims.exists('anim-explosion')) {
          const boom = scene.add.sprite(x, y, 'explosion-1').setDepth(27).setScale(1.3);
          boom.play('anim-explosion');
          boom.once('animationcomplete', () => boom.destroy());
        }
        SoundManager.getInstance().playMeteorImpact();
      },
    });
  }

  public override destroy(): void {
    for (const ev of this.pending) ev.remove(false);
    this.pending.length = 0;
  }
}
