import Phaser from 'phaser';
import { BaseEnemy } from '../enemies/BaseEnemy';

export class SoulBoltProjectile extends Phaser.Physics.Arcade.Sprite {
  public damage: number = 25;
  public pierce: number = 1;
  public isEvolved: boolean = false;

  private hitEnemies: Set<BaseEnemy> = new Set();
  private lifespanMs: number = 0;
  private trailTimer: number = 0;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    const initialKey = scene.textures.exists('soul-shoot') ? 'soul-shoot' : 'soul-bolt';
    super(scene, x, y, initialKey);
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setDepth(25);

    const body = this.body as Phaser.Physics.Arcade.Body;
    if (body) {
      body.setCircle(9, 11, 11);
    }
  }

  public fire(
    startX: number,
    startY: number,
    targetAngle: number,
    speed: number,
    damage: number,
    pierce: number,
    isEvolved: boolean = false
  ): void {
    this.setPosition(startX, startY);
    this.setRotation(targetAngle);
    this.damage = damage;
    this.pierce = pierce;
    this.isEvolved = isEvolved;
    this.lifespanMs = 2200; // 2.2 segundos de vida máxima
    this.trailTimer = 0;
    this.hitEnemies.clear();

    const textureKey = isEvolved ? 'apocalypse-shoot' : 'soul-shoot';
    if (this.scene.textures.exists(textureKey)) {
      this.setTexture(textureKey);
    }

    this.clearTint();
    if (isEvolved) {
      this.setScale(0.85);
    } else {
      this.setScale(0.68);
    }

    this.setActive(true);
    this.setVisible(true);

    const body = this.body as Phaser.Physics.Arcade.Body;
    if (body) {
      body.enable = true;
      if (isEvolved) {
        body.setCircle(12, 8, 8);
      } else {
        body.setCircle(9, 11, 11);
      }
      body.setVelocity(
        Math.cos(targetAngle) * speed,
        Math.sin(targetAngle) * speed
      );
    }
  }

  public updateProjectile(deltaMs: number): void {
    if (!this.active) return;

    this.lifespanMs -= deltaMs;
    this.trailTimer += deltaMs;

    // Viewport Culling / Despawn imediato ao sair da tela para poupar CPU e física
    const cam = this.scene.cameras?.main;
    if (cam) {
      const margin = 280;
      if (
        this.x < cam.worldView.x - margin ||
        this.x > cam.worldView.right + margin ||
        this.y < cam.worldView.y - margin ||
        this.y > cam.worldView.bottom + margin
      ) {
        this.deactivate();
        return;
      }
    }

    // Rastro visual suave atrás do projétil
    if (this.trailTimer >= 30) {
      this.trailTimer = 0;
      const backDist = this.isEvolved ? 14 : 10;
      const backX = this.x - Math.cos(this.rotation) * backDist + Phaser.Math.Between(-2, 2);
      const backY = this.y - Math.sin(this.rotation) * backDist + Phaser.Math.Between(-2, 2);

      const trailG = this.scene.add.graphics();
      trailG.setDepth(24);
      trailG.setBlendMode(Phaser.BlendModes.ADD);

      if (this.isEvolved) {
        // Chamas místicas verde-esmeralda apocalípticas
        trailG.fillStyle(0x43e97b, 0.65);
        trailG.fillCircle(backX, backY, 2.5);
        trailG.lineStyle(2, 0x38f9d7, 0.45);
        trailG.lineBetween(
          backX,
          backY,
          backX - Math.cos(this.rotation) * 8,
          backY - Math.sin(this.rotation) * 8
        );
      } else {
        // Brilho espiritual violeta/ciano
        trailG.fillStyle(0xd946ef, 0.6);
        trailG.fillCircle(backX, backY, 2);
        trailG.lineStyle(1.8, 0x00f5d4, 0.4);
        trailG.lineBetween(
          backX,
          backY,
          backX - Math.cos(this.rotation) * 6,
          backY - Math.sin(this.rotation) * 6
        );
      }

      this.scene.tweens.add({
        targets: trailG,
        alpha: 0,
        duration: 150,
        ease: 'Quad.easeOut',
        onComplete: () => trailG.destroy()
      });
    }

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
