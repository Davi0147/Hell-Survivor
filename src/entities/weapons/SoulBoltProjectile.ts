import Phaser from 'phaser';
import { BaseEnemy } from '../enemies/BaseEnemy';

export class SoulBoltProjectile extends Phaser.Physics.Arcade.Sprite {
  public damage: number = 25;
  public pierce: number = 1;

  private hitEnemies: Set<BaseEnemy> = new Set();
  private lifespanMs: number = 0;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'soul-bolt');
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setDepth(25);

    const body = this.body as Phaser.Physics.Arcade.Body;
    if (body) {
      body.setCircle(6, 2, 2);
    }
  }

  public fire(
    startX: number,
    startY: number,
    targetAngle: number,
    speed: number,
    damage: number,
    pierce: number
  ): void {
    this.setPosition(startX, startY);
    this.setRotation(targetAngle);
    this.damage = damage;
    this.pierce = pierce;
    this.lifespanMs = 2200; // 2.2 segundos de vida máxima
    this.hitEnemies.clear();

    this.setActive(true);
    this.setVisible(true);

    const body = this.body as Phaser.Physics.Arcade.Body;
    if (body) {
      body.enable = true;
      body.setVelocity(
        Math.cos(targetAngle) * speed,
        Math.sin(targetAngle) * speed
      );
    }
  }

  public updateProjectile(deltaMs: number): void {
    if (!this.active) return;

    this.lifespanMs -= deltaMs;
    if (this.lifespanMs <= 0) {
      this.deactivate();
    }
  }

  public onHit(enemy: BaseEnemy): void {
    if (!this.active || this.hitEnemies.has(enemy)) return;

    this.hitEnemies.add(enemy);
    enemy.takeDamage(this.damage);

    this.pierce--;
    if (this.pierce <= 0) {
      this.deactivate();
    }
  }

  public deactivate(): void {
    this.setActive(false);
    this.setVisible(false);

    const body = this.body as Phaser.Physics.Arcade.Body;
    if (body) {
      body.enable = false;
      body.setVelocity(0, 0);
    }
  }
}
