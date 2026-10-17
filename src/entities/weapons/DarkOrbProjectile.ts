import Phaser from 'phaser';
import { Nixy } from '../characters/Nixy';

export class DarkOrbProjectile extends Phaser.Physics.Arcade.Sprite {
  public damage: number = 18;
  private lifespanMs: number = 0;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    const textureKey = scene.textures.exists('projectile-heart-attack') ? 'projectile-heart-attack' : 'dark-orb';
    super(scene, x, y, textureKey);
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setDepth(26);

    const body = this.body as Phaser.Physics.Arcade.Body;
    if (body) {
      body.setCircle(11, 9, 9);
    }
  }

  public fire(startX: number, startY: number, angle: number, speed: number = 220, damage: number = 18): void {
    this.setPosition(startX, startY);
    this.setRotation(angle);
    this.damage = damage;
    this.lifespanMs = 3200;
    this.setActive(true);
    this.setVisible(true);

    const body = this.body as Phaser.Physics.Arcade.Body;
    if (body) {
      body.enable = true;
      body.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);
    }
  }

  public updateProjectile(deltaMs: number): void {
    if (!this.active) return;
    this.lifespanMs -= deltaMs;
    if (this.lifespanMs <= 0) {
      this.deactivate();
    }
  }

  public onHitPlayer(player: Nixy): void {
    if (!this.active) return;
    player.takeDamage(this.damage);
    this.scene.cameras.main.shake(100, 0.008);
    this.deactivate();
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
