import Phaser from 'phaser';
import { BaseEnemy } from './BaseEnemy';

export class ZombieDog extends BaseEnemy {
  private currentDir: 'east' | 'west' | 'north' | 'south' = 'south';

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'zombie-dog-idle-south');

    // Corpo de colisão ajustado para o sprite do Zombie Dog (72x72)
    const body = this.body as Phaser.Physics.Arcade.Body;
    if (body) {
      body.setSize(38, 28);
      body.setOffset(17, 22);
    }
  }

  public spawn(x: number, y: number, hp: number = 35, speed: number = 85, damage: number = 8): void {
    super.spawn(x, y, hp, speed, damage);
    this.play('zombie-dog-idle-south', true);
  }

  public updateEnemy(targetX: number, targetY: number, deltaMs: number): void {
    if (this.isDead || !this.active) return;

    // Gerenciar duração do flash branco de hit
    if (this.hitFlashTimer > 0) {
      this.hitFlashTimer -= deltaMs;
      if (this.hitFlashTimer <= 0) {
        this.clearTint();
      }
    }

    // Vetor de perseguição até o jogador
    const dx = targetX - this.x;
    const dy = targetY - this.y;
    const dist = Math.hypot(dx, dy);

    if (dist > 8) {
      const vx = (dx / dist) * this.speed;
      const vy = (dy / dist) * this.speed;
      this.setVelocity(vx, vy);

      // Determinar direção cardinal predominante (east, west, north, south)
      const absX = Math.abs(dx);
      const absY = Math.abs(dy);
      let dir: 'east' | 'west' | 'north' | 'south' = 'south';

      if (absX > absY) {
        dir = dx > 0 ? 'east' : 'west';
      } else {
        dir = dy > 0 ? 'south' : 'north';
      }

      this.currentDir = dir;
      const runAnim = `zombie-dog-run-${dir}`;
      if (this.anims.currentAnim?.key !== runAnim) {
        this.play(runAnim, true);
      }
    } else {
      this.setVelocity(0, 0);
      const idleAnim = `zombie-dog-idle-${this.currentDir}`;
      if (this.anims.currentAnim?.key !== idleAnim) {
        this.play(idleAnim, true);
      }
    }
  }
}
