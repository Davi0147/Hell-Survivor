import Phaser from 'phaser';
import { BaseWeapon } from './BaseWeapon';
import { SoulBoltProjectile } from './SoulBoltProjectile';
import { BaseEnemy } from '../enemies/BaseEnemy';
import { BALANCE } from '../../config/balance';
import { SoundManager } from '../../systems/SoundManager';

import { BaseCharacter } from '../characters/BaseCharacter';

export class SoulBoltWeapon extends BaseWeapon {
  public projectilesGroup: Phaser.GameObjects.Group;
  public isEvolved: boolean = false;
  public level: number = 1;
  public readonly maxLevel: number = 5;
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

  public getLevel(): number {
    return this.level;
  }

  public isMaxLevel(): boolean {
    return this.isEvolved || this.level >= this.maxLevel;
  }

  public upgrade(): boolean {
    if (this.level >= this.maxLevel) return false;
    this.level++;
    this.damage += 6;
    this.cooldownMs = Math.max(550, this.cooldownMs - 60);
    this.projectileSpeed += 25;
    return true;
  }

  /**
   * Evolução Suprema: transforma o Disparo de Almas no Raio do Apocalipse
   */
  public evolve(): void {
    if (this.isEvolved) return;
    this.isEvolved = true;
    this.level = this.maxLevel;
    this.name = 'Raio do Apocalipse';
    this.damage = 46;
    this.cooldownMs = 520;
    this.projectileSpeed = 580;
    this.pierce = 3;
    SoundManager.getInstance().playWeaponEvolve();
  }

  public fire(originX: number, originY: number, target: BaseEnemy): void {
    const baseAngle = Math.atan2(target.y - originY, target.x - originX);
    const extraCount = this.player ? this.player.extraProjectiles : 0;
    const count = this.projectileCount + extraCount + (this.isEvolved ? 1 : 0);
    const spreadStep = this.isEvolved ? 0.14 : 0.18;
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
        effectivePierce,
        this.isEvolved
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
    const color = this.isEvolved ? 0x43e97b : 0xd946ef;
    const flash = this.scene.add.circle(x, y, this.isEvolved ? 14 : 10, color, 0.75);
    flash.setDepth(15);
    this.scene.tweens.add({
      targets: flash,
      radius: this.isEvolved ? 22 : 18,
      alpha: 0,
      duration: 120,
      ease: 'Power1',
      onComplete: () => {
        flash.destroy();
      }
    });
  }
}
