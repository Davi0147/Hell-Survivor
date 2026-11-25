import { TALISMAN_BALANCE, BALANCE } from '../../../config/balance';
import { TWIN_BOLT_TEXTURE } from '../../../systems/TalismanCatalog';
import { SoulBoltWeapon } from '../../weapons/SoulBoltWeapon';
import { BasePet } from './BasePet';
import type { ITalismanContext } from '../talismanContext';

/**
 * Gêmea Sombria (lendária): uma sombra anda perto da heroína e dispara um Disparo de Almas
 * próprio (chama roxa), mais fraco, que copia os tiros extras e a perfuração dela.
 * O tiro sai do peito dela e ela se vira para o monstro a cada disparo.
 */
export class ShadowTwinPet extends BasePet {
  private readonly weapon: SoulBoltWeapon;

  constructor(ctx: ITalismanContext) {
    const cfg = TALISMAN_BALANCE.pets.twin;
    super(ctx, 'twin', cfg.scale);
    // A arte já é a sombra (não pinta por cima); logo abaixo da heroína na ordem de desenho
    this.sprite.setAlpha(cfg.alpha);
    // Já nasce no lugar dela ao lado da heroína (perto demais ela não anda e ficaria por trás)
    this.sprite.setPosition(ctx.player.x + cfg.offsetX, ctx.player.y + cfg.offsetY);
    this.sprite.setDepth(ctx.player.depth - 1);

    this.weapon = new SoulBoltWeapon(ctx.scene, ctx.player);
    this.weapon.damage = Math.round(BALANCE.SOUL_BOLT.damage * cfg.damageFraction);
    this.weapon.cooldownMs = Math.round(BALANCE.SOUL_BOLT.cooldownMs * cfg.cooldownFraction);
    this.weapon.skin = { texture: TWIN_BOLT_TEXTURE, ...cfg.bolt };
    this.weapon.onFire = (target) => this.faceToward(target.x);
    ctx.registerSoulBoltOverlap(this.weapon);
  }

  public update(deltaMs: number): void {
    const cfg = TALISMAN_BALANCE.pets.twin;
    const p = this.ctx.player;
    this.followLoose(p.x + cfg.offsetX, p.y + cfg.offsetY, cfg.followSpeed, deltaMs);
    this.weapon.updateWeapon(deltaMs, this.x, this.y + cfg.shootOffsetY, this.ctx.enemiesGroup);
    this.syncOutline();
  }

  public override destroy(): void {
    this.weapon.projectilesGroup.destroy(true);
    super.destroy();
  }
}
