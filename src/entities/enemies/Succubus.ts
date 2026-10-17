import Phaser from 'phaser';
import { BaseEnemy } from './BaseEnemy';

const OCTANT_DIRS = [
  'east',
  'south-east',
  'south',
  'south-west',
  'west',
  'north-west',
  'north',
  'north-east'
] as const;

type Direction8 = typeof OCTANT_DIRS[number];

export class Succubus extends BaseEnemy {
  private currentDir: Direction8 = 'south';
  private hoverTimer: number = 0;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'succubus-idle-south');

    // Atributos de Mini-Chefe / Inimigo de Alta Ameaça
    this.maxHp = 85;
    this.hp = 85;
    this.speed = 115; // Mais rápida que o Zombie Dog (85 px/s)
    this.damage = 18; // Causa dano proporcionalmente superior ao Zombie Dog
    this.setDepth(8); // Voando acima de inimigos terrestres (5), mas abaixo da heroína (20)

    // Corpo de colisão focado no torso humanoide (92x92 sprite)
    const body = this.body as Phaser.Physics.Arcade.Body;
    if (body) {
      body.setSize(38, 48);
      body.setOffset(27, 22);
    }
  }

  public spawn(x: number, y: number, hp: number = 85, speed: number = 115, damage: number = 18): void {
    super.spawn(x, y, hp, speed, damage);
    this.currentDir = 'south';
    this.play('succubus-fly-south', true);
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

    // Leve oscilação de flutuação no ar (hovering)
    this.hoverTimer += deltaMs * 0.005;

    // Vetor de perseguição até o jogador
    const dx = targetX - this.x;
    const dy = targetY - this.y;
    const dist = Math.hypot(dx, dy);

    if (dist > 12) {
      const vx = (dx / dist) * this.speed;
      const vy = (dy / dist) * this.speed;
      this.setVelocity(vx, vy);

      // Cálculo matemático preciso de 8 direções angulares
      const angle = Math.atan2(dy, dx);
      const octant = Math.round((8 * angle) / (2 * Math.PI) + 8) % 8;
      const dir = OCTANT_DIRS[octant];

      this.currentDir = dir;
      const flyAnim = `succubus-fly-${dir}`;
      if (this.anims.currentAnim?.key !== flyAnim) {
        this.play(flyAnim, true);
      }
    } else {
      this.setVelocity(0, 0);
      const idleAnim = `succubus-idle-${this.currentDir}`;
      if (this.anims.currentAnim?.key !== idleAnim) {
        this.play(idleAnim, true);
      }
    }
  }
}
