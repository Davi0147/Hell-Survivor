import Phaser from 'phaser';
import { BaseEnemy } from './BaseEnemy';
import { GemType } from '../items/SoulGem';

export class ZombieDog extends BaseEnemy {
  private currentDir: 'east' | 'west' | 'north' | 'south' = 'south';
  public isElite: boolean = false;
  public eliteScale: number = 1.0;
  public customDrop?: GemType;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'zombie-dog-idle-south');

    // Corpo de colisão ajustado para o sprite do Zombie Dog (72x72)
    const body = this.body as Phaser.Physics.Arcade.Body;
    if (body) {
      body.setSize(38, 28);
      body.setOffset(17, 22);
    }
  }

  public override spawn(
    x: number,
    y: number,
    hp: number = 35,
    speed: number = 85,
    damage: number = 9,
    isElite: boolean = false,
    eliteScale: number = 1.0,
    customDrop?: GemType
  ): void {
    super.spawn(x, y, hp, speed, damage);
    this.isElite = isElite;
    this.eliteScale = eliteScale;
    this.customDrop = customDrop;
    this.setScale(eliteScale);
    if (isElite) {
      this.setTint(0xff4455);
    } else {
      this.clearTint();
    }
    this.play('zombie-dog-idle-south', true);
  }

  public override updateEnemy(targetX: number, targetY: number, deltaMs: number): void {
    if (this.isDead || !this.active) return;

    // Gerenciar duração do flash branco de hit
    if (this.hitFlashTimer > 0) {
      this.hitFlashTimer -= deltaMs;
      if (this.hitFlashTimer <= 0) {
        if (this.isElite) {
          this.setTint(0xff4455);
        } else {
          this.clearTint();
        }
      }
    }

    const stunMult = this.updateStunState(deltaMs, this.isElite ? 0xff4455 : undefined);

    // Vetor de perseguição até o jogador
    const dx = targetX - this.x;
    const dy = targetY - this.y;
    const dist = Math.hypot(dx, dy);

    if (dist > 8) {
      const vx = (dx / dist) * this.speed * stunMult;
      const vy = (dy / dist) * this.speed * stunMult;
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
