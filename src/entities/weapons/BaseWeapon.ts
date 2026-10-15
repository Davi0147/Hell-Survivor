import Phaser from 'phaser';
import { BaseEnemy } from '../enemies/BaseEnemy';

export abstract class BaseWeapon {
  public scene: Phaser.Scene;
  public name: string;
  public damage: number;
  public cooldownMs: number;
  public range: number;
  public projectileSpeed: number;
  public projectileCount: number;
  public pierce: number;

  protected currentCooldown: number = 0;

  constructor(
    scene: Phaser.Scene,
    name: string,
    damage: number,
    cooldownMs: number,
    range: number,
    projectileSpeed: number,
    projectileCount: number = 1,
    pierce: number = 1
  ) {
    this.scene = scene;
    this.name = name;
    this.damage = damage;
    this.cooldownMs = cooldownMs;
    this.range = range;
    this.projectileSpeed = projectileSpeed;
    this.projectileCount = projectileCount;
    this.pierce = pierce;
  }

  public update(
    deltaMs: number,
    originX: number,
    originY: number,
    enemies: Phaser.GameObjects.Group
  ): void {
    if (this.currentCooldown > 0) {
      this.currentCooldown -= deltaMs;
    }

    if (this.currentCooldown <= 0) {
      const target = this.findClosestEnemy(originX, originY, enemies);
      if (target) {
        this.fire(originX, originY, target);
        this.currentCooldown = this.cooldownMs;
      }
    }
  }

  public findClosestEnemy(
    originX: number,
    originY: number,
    enemies: Phaser.GameObjects.Group
  ): BaseEnemy | null {
    let closestEnemy: BaseEnemy | null = null;
    let closestDistSq = this.range * this.range;

    const camera = this.scene.cameras.main;
    const worldView = camera?.worldView;

    const children = enemies.getChildren() as BaseEnemy[];
    for (let i = 0; i < children.length; i++) {
      const enemy = children[i];
      if (!enemy.active || enemy.isDead) continue;

      // Dispara exclusivamente se o monstro estiver visível dentro da tela
      if (worldView && worldView.width > 0) {
        if (!worldView.contains(enemy.x, enemy.y)) {
          continue;
        }
      }

      const dx = enemy.x - originX;
      const dy = enemy.y - originY;
      const distSq = dx * dx + dy * dy;

      if (distSq < closestDistSq) {
        closestDistSq = distSq;
        closestEnemy = enemy;
      }
    }

    return closestEnemy;
  }

  public abstract fire(originX: number, originY: number, target: BaseEnemy): void;
}
