import Phaser from 'phaser';
import { BaseWeapon } from './BaseWeapon';
import { SoulBoltProjectile } from './SoulBoltProjectile';
import { BaseEnemy } from '../enemies/BaseEnemy';
import { BALANCE } from '../../config/balance';
import { SoundManager } from '../../systems/SoundManager';

import { BaseCharacter } from '../characters/BaseCharacter';

export class SoulBoltWeapon extends BaseWeapon {
  public projectilesGroup: Phaser.GameObjects.Group;
  private player?: BaseCharacter;

  constructor(scene: Phaser.Scene, player?: BaseCharacter) {
    const cfg = BALANCE.SOUL_BOLT;
    super(
      scene,
      'Disparo de Almas',
      cfg.damage,
      cfg.cooldownMs,
      cfg.range,
      cfg.speed,
      1,
      cfg.pierce
    );
    this.player = player;

    // Pool de projéteis (reutilização eficiente em memória)
    this.projectilesGroup = scene.add.group({
      classType: SoulBoltProjectile,
      maxSize: 60,
      runChildUpdate: false
    });
  }

  public fire(originX: number, originY: number, target: BaseEnemy): void {
    const baseAngle = Math.atan2(target.y - originY, target.x - originX);
    const extraCount = this.player ? this.player.extraProjectiles : 0;
    const count = this.projectileCount + extraCount;
    const spreadStep = 0.18; // Leve leque de dispersão angular quando houver múltiplos tiros
    const startAngle = baseAngle - ((count - 1) * spreadStep) / 2;

    const damageBonus = this.player ? this.player.bonusDamagePercent : 0;
    const effectiveDamage = Math.round(this.damage * (1 + damageBonus / 100));
    const extraPierce = this.player ? this.player.extraPierce : 0;
    const effectivePierce = this.pierce + extraPierce;

    for (let i = 0; i < count; i++) {
      const angle = startAngle + i * spreadStep;

      let projectile = this.projectilesGroup.getFirstDead(false) as SoulBoltProjectile;
      if (!projectile) {
        projectile = new SoulBoltProjectile(this.scene, originX, originY);
        this.projectilesGroup.add(projectile);
      }

      projectile.fire(
        originX,
        originY,
        angle,
        this.projectileSpeed,
        effectiveDamage,
        effectivePierce
      );
    }

    // Efeito sonoro procedural retrô de disparo de magia espiritual
    SoundManager.getInstance().playSoulBoltFire();

    // Efeito visual sutil de clarão de disparo (muzzle glow)
    this.createMuzzleFlash(originX, originY);
  }

  public updateWeapon(
    deltaMs: number,
    originX: number,
    originY: number,
    enemies: Phaser.GameObjects.Group
  ): void {
    // Atualiza lógica de recarga e disparo automático
    this.update(deltaMs, originX, originY, enemies);

    // Atualiza vida útil e movimento dos projéteis ativos
    const activeProjectiles = this.projectilesGroup.getChildren() as SoulBoltProjectile[];
    for (let i = 0; i < activeProjectiles.length; i++) {
      const p = activeProjectiles[i];
      if (p.active) {
        p.updateProjectile(deltaMs);
      }
    }
  }

  private createMuzzleFlash(x: number, y: number): void {
    const flash = this.scene.add.circle(x, y, 10, 0x00f5d4, 0.7);
    flash.setDepth(15);
    this.scene.tweens.add({
      targets: flash,
      radius: 18,
      alpha: 0,
      duration: 120,
      ease: 'Power1',
      onComplete: () => {
        flash.destroy();
      }
    });
  }
}
