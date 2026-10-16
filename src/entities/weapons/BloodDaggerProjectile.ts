import Phaser from 'phaser';
import { BaseEnemy } from '../enemies/BaseEnemy';

export class BloodDaggerProjectile extends Phaser.Physics.Arcade.Sprite {
  public damage: number = 15;
  public pierce: number = 1;

  private hitEnemies: Set<BaseEnemy> = new Set();
  private lifespanMs: number = 0;
  private trailTimer: number = 0;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'blood-dagger');
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setDepth(25);
    this.setScale(0.78);

    const body = this.body as Phaser.Physics.Arcade.Body;
    if (body) {
      body.setCircle(8, 12, 12);
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
    this.setScale(0.78);
    this.damage = damage;
    this.pierce = pierce;
    this.lifespanMs = 1150; // Alcance médio-curto de alta velocidade
    this.trailTimer = 0;
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
    this.trailTimer += deltaMs;

    // Viewport Despawn imediato se sair da visão da câmera
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

    // Efeito vermelho leve saindo de trás da adaga ao ser lançada
    if (this.trailTimer >= 24) {
      this.trailTimer = 0;
      const backX = this.x - Math.cos(this.rotation) * 11 + Phaser.Math.Between(-2, 2);
      const backY = this.y - Math.sin(this.rotation) * 11 + Phaser.Math.Between(-2, 2);

      // Feixe/fumaça carmesim leve atrás do cabo
      const trailG = this.scene.add.graphics();
      trailG.setDepth(24);
      trailG.setBlendMode(Phaser.BlendModes.ADD);
      trailG.lineStyle(3, 0xff1e42, 0.55);
      trailG.lineBetween(
        backX,
        backY,
        backX - Math.cos(this.rotation) * 10,
        backY - Math.sin(this.rotation) * 10
      );
      trailG.fillStyle(0xff4d6d, 0.6);
      trailG.fillCircle(backX, backY, 2.2);

      this.scene.tweens.add({
        targets: trailG,
        alpha: 0,
        duration: 165,
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
