import Phaser from 'phaser';
import { BaseEnemy } from './BaseEnemy';
import { GemType } from '../items/SoulGem';
import { ARENA_CONFIG } from '../../config/balance';

const ELITE_TINT = 0xff4455;
/** Distância a partir da qual quem foge desacelera, para a perseguição ser possível. */
const FLEE_RELAX_DISTANCE = 380;

export class ZombieDog extends BaseEnemy {
  private currentDir: 'east' | 'west' | 'north' | 'south' = 'south';
  public isElite: boolean = false;
  /** Titã Cerberus do Modo Infinito: não volta para o pool de cães comuns. */
  public isSpecialMiniBoss: boolean = false;
  public eliteScale: number = 1.0;
  public customDrop?: GemType;
  /** Foge do jogador em vez de perseguir (Ladrão de Almas). */
  public isFleeing: boolean = false;
  /** Cor de repouso (elite, ladrão); undefined = sem tinta. */
  public idleTint?: number;

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
    this.isFleeing = false;
    this.setIdleTint(isElite ? ELITE_TINT : undefined);
    this.play('zombie-dog-idle-south', true);
  }

  public setIdleTint(tint?: number): void {
    this.idleTint = tint;
    this.applyIdleTint();
  }

  private applyIdleTint(): void {
    if (this.idleTint !== undefined) {
      this.setTint(this.idleTint);
    } else {
      this.clearTint();
    }
  }

  public override updateEnemy(targetX: number, targetY: number, deltaMs: number): void {
    if (this.isDead || !this.active) return;

    // Gerenciar duração do flash branco de hit
    if (this.hitFlashTimer > 0) {
      this.hitFlashTimer -= deltaMs;
      if (this.hitFlashTimer <= 0) this.applyIdleTint();
    }

    const stunMult = this.updateStunState(deltaMs, this.idleTint);

    // Vetor de perseguição até o jogador
    let dx = targetX - this.x;
    let dy = targetY - this.y;
    const dist = Math.hypot(dx, dy);
    let paceMult = 1;

    if (this.isFleeing) {
      // Corre para longe; perto da borda da arena, desliza de lado em vez de travar no canto
      dx = -dx;
      dy = -dy;
      const m = 140;
      if (this.x < ARENA_CONFIG.MIN_X + m || this.x > ARENA_CONFIG.MAX_X - m) dx = -dx * 0.4;
      if (this.y < ARENA_CONFIG.MIN_Y + m || this.y > ARENA_CONFIG.MAX_Y - m) dy = -dy * 0.4;
      if (dist > FLEE_RELAX_DISTANCE) paceMult = 0.35;
    }

    if (dist > 8) {
      const len = Math.hypot(dx, dy) || 1;
      const vx = (dx / len) * this.speed * stunMult * paceMult;
      const vy = (dy / len) * this.speed * stunMult * paceMult;
      this.setVelocity(vx, vy);

      // Determinar direção cardinal predominante (east, west, north, south)
      const absX = Math.abs(dx);
      const absY = Math.abs(dy);
      let dir: 'east' | 'west' | 'north' | 'south';

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
