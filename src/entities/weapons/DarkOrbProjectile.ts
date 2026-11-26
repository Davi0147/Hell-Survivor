import Phaser from 'phaser';
import type { BaseCharacter } from '../characters/BaseCharacter';

/** Como o projétil aparece: textura, tamanho, onde fica a cabeça e se gira em voo. */
export interface ProjectileLook {
  texture: string;
  scale: number;
  /** 0 = cauda, 1 = ponta; o acerto é medido nesse ponto. */
  originX: number;
  /** Radianos por ms (0 = aponta para onde vai). */
  spinPerMs: number;
}

export class DarkOrbProjectile extends Phaser.Physics.Arcade.Sprite {
  public damage: number = 18;
  private lifespanMs: number = 0;
  private spinPerMs: number = 0;

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

  public fire(
    startX: number,
    startY: number,
    angle: number,
    speed: number = 220,
    damage: number = 18,
    customTextureKey?: string,
    look?: Omit<ProjectileLook, 'texture'>
  ): void {
    if (customTextureKey && this.scene.textures.exists(customTextureKey)) {
      this.setTexture(customTextureKey);
    }
    // Vem do pool: sempre redefine, senão herda o visual do disparo anterior
    this.setScale(look?.scale ?? 1);
    this.setOrigin(look?.originX ?? 0.5, 0.5);
    this.spinPerMs = look?.spinPerMs ?? 0;
    this.setPosition(startX, startY);
    this.setRotation(angle);
    this.damage = damage;
    this.lifespanMs = 3400;
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
    if (this.spinPerMs !== 0) this.rotation += this.spinPerMs * deltaMs;
    this.lifespanMs -= deltaMs;
    if (this.lifespanMs <= 0) {
      this.deactivate();
    }
  }

  public onHitPlayer(player: BaseCharacter): void {
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
