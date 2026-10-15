import Phaser from 'phaser';
import { BaseEnemy } from './BaseEnemy';
import { GemType } from '../items/SoulGem';

export class BloodBat extends BaseEnemy {
  private currentDir: 'east' | 'west' | 'north' | 'south' = 'south';
  private flightTime: number = 0;
  private waveSeed: number = 0;
  public customDrop?: GemType;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'blood-bat-idle-south');

    this.setScale(0.75); // Morcego pequeno e ágil
    this.setDepth(8);

    // Ajuste da caixa de colisão física (sprite 64x64)
    const body = this.body as Phaser.Physics.Arcade.Body;
    if (body) {
      body.setSize(22, 18);
      body.setOffset(21, 23);
    }

    this.waveSeed = Math.random() * Math.PI * 2;
  }

  public override spawn(
    x: number,
    y: number,
    hp: number = 14,
    speed: number = 155,
    damage: number = 4,
    customDrop?: GemType
  ): void {
    super.spawn(x, y, hp, speed, damage);
    this.setScale(0.75);
    this.customDrop = customDrop;
    this.flightTime = Math.random() * 1000;
    this.clearTint();
    this.play('blood-bat-fly-south', true);
  }

  public updateBat(targetX: number, targetY: number, deltaMs: number): void {
    if (this.isDead || !this.active) return;

    this.flightTime += deltaMs;

    // Gerenciar duração do flash branco de hit
    if (this.hitFlashTimer > 0) {
      this.hitFlashTimer -= deltaMs;
      if (this.hitFlashTimer <= 0) {
        this.clearTint();
      }
    }

    // Vetor direto até o jogador
    const dx = targetX - this.x;
    const dy = targetY - this.y;
    const dist = Math.hypot(dx, dy);

    if (dist > 6) {
      // Vetor normalizado
      const nx = dx / dist;
      const ny = dy / dist;

      // Vetor perpendicular para ondulação orgânica de voo em bando
      const perpX = -ny;
      const perpY = nx;
      const wave = Math.sin(this.flightTime * 0.007 + this.waveSeed) * 0.35;

      const finalVx = (nx + perpX * wave) * this.speed;
      const finalVy = (ny + perpY * wave) * this.speed;
      this.setVelocity(finalVx, finalVy);

      // Determinar direção cardinal
      const absX = Math.abs(dx);
      const absY = Math.abs(dy);
      let dir: 'east' | 'west' | 'north' | 'south' = 'south';

      if (absX > absY) {
        dir = dx > 0 ? 'east' : 'west';
      } else {
        dir = dy > 0 ? 'south' : 'north';
      }

      this.currentDir = dir;
      const flyAnim = `blood-bat-fly-${dir}`;
      if (this.anims.currentAnim?.key !== flyAnim) {
        this.play(flyAnim, true);
      }
    } else {
      this.setVelocity(0, 0);
      const idleAnim = `blood-bat-idle-${this.currentDir}`;
      if (this.anims.currentAnim?.key !== idleAnim) {
        this.play(idleAnim, true);
      }
    }
  }
}
