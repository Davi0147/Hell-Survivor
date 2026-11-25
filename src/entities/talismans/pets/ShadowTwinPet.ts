import { TALISMAN_BALANCE, BALANCE } from '../../../config/balance';
import { TALISMAN_THEME } from '../../../config/theme';
import { SoulBoltWeapon } from '../../weapons/SoulBoltWeapon';
import { BasePet } from './BasePet';
import type { ITalismanContext } from '../talismanContext';

/**
 * Gêmea Sombria (lendária): uma sombra da heroína anda ao lado dela e dispara um
 * Disparo de Almas próprio, mais fraco, que copia os tiros extras e a perfuração dela.
 */
export class ShadowTwinPet extends BasePet {
  private readonly weapon: SoulBoltWeapon;

  constructor(ctx: ITalismanContext) {
    const cfg = TALISMAN_BALANCE.pets.twin;
    const prefix = ctx.player.characterId;
    super(ctx, { run: `${prefix}-run`, idle: `${prefix}-idle`, runCardinalOnly: false }, cfg.scale);
    // Mesmo tamanho da heroína; logo abaixo dela na ordem de desenho
    this.sprite.setTint(TALISMAN_THEME.twinTint).setAlpha(cfg.alpha).setScale(ctx.player.scaleX * cfg.scale);
    this.sprite.setDepth(ctx.player.depth - 1);

    this.weapon = new SoulBoltWeapon(ctx.scene, ctx.player);
    this.weapon.damage = Math.round(BALANCE.SOUL_BOLT.damage * cfg.damageFraction);
    this.weapon.cooldownMs = Math.round(BALANCE.SOUL_BOLT.cooldownMs * cfg.cooldownFraction);
    ctx.registerSoulBoltOverlap(this.weapon);
  }

  public update(deltaMs: number): void {
    const cfg = TALISMAN_BALANCE.pets.twin;
    const p = this.ctx.player;
    this.moveToward(p.x + cfg.offsetX, p.y + cfg.offsetY, 320, deltaMs, 3);
    this.weapon.updateWeapon(deltaMs, this.x, this.y, this.ctx.enemiesGroup);
    this.syncOutline();
  }

  public override destroy(): void {
    this.weapon.projectilesGroup.destroy(true);
    super.destroy();
  }
}
