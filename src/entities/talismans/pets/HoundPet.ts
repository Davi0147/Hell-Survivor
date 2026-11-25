import { TALISMAN_BALANCE } from '../../../config/balance';
import type { BaseEnemy } from '../../enemies/BaseEnemy';
import { BasePet } from './BasePet';
import { enemiesInRadius, hitEnemy, nearestEnemy, type ITalismanContext } from '../talismanContext';

type HoundConfig = (typeof TALISMAN_BALANCE.pets)['hound' | 'cerberus'];

/**
 * Cão de Guarda (raro) e Cérbero Filhote (épico): corre até o monstro mais perto da heroína
 * e morde. O Cérbero morde vários de uma vez e atordoa.
 */
export class HoundPet extends BasePet {
  private target: BaseEnemy | null = null;
  private biteTimer = 0;
  private seekTimer = 0;

  constructor(ctx: ITalismanContext, private readonly cfg: HoundConfig, pet: 'hound' | 'cerberus') {
    super(ctx, pet, cfg.scale);
  }

  public update(deltaMs: number): void {
    const cfg = this.cfg;
    this.biteTimer -= deltaMs;
    this.seekTimer -= deltaMs;

    // Monstro morreu, sumiu ou a heroína ficou longe demais: larga o alvo
    if (this.target && (!this.target.active || this.target.isDead || this.distanceToPlayer() > TALISMAN_BALANCE.pets.leashRange)) {
      this.target = null;
    }
    if (!this.target && this.seekTimer <= 0) {
      this.seekTimer = 250;
      this.target = nearestEnemy(this.ctx, this.ctx.player.x, this.ctx.player.y, cfg.seekRange);
    }

    if (this.target) {
      const arrived = this.moveToward(this.target.x, this.target.y, cfg.speed, deltaMs, cfg.biteRange * 0.6);
      if (arrived && this.biteTimer <= 0) {
        this.biteTimer = cfg.biteEveryMs;
        this.bite(this.target);
      }
    } else {
      const rest = this.restPoint(cfg.restAngle);
      this.moveToward(rest.x, rest.y, cfg.speed, deltaMs, 10);
    }
    this.syncOutline();
  }

  private bite(main: BaseEnemy): void {
    const cfg = this.cfg;
    const victims = cfg.targets > 1
      ? enemiesInRadius(this.ctx, this.x, this.y, cfg.biteRange * 1.6).slice(0, cfg.targets)
      : [main];
    for (const e of victims) {
      hitEnemy(this.ctx, e, cfg.biteDamage);
      if (cfg.stunMs > 0 && !e.isBoss) e.applyStun(cfg.stunMs);
    }
    // Pulinho de mordida
    this.sprite.scene.tweens.add({ targets: this.sprite, scaleY: this.sprite.scaleY * 0.82, duration: 70, yoyo: true });
  }
}
