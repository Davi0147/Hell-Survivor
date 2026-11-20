import Phaser from 'phaser';
import { BaseEnemy } from './BaseEnemy';
import { ENEMY_BALANCE } from '../../config/balance';

type Cardinal = 'east' | 'west' | 'north' | 'south';

/** Caixa de colisão (px do quadro, antes da escala). Os quadros têm 48px (parado) e 68px (andando). */
const BODY_W = 28;
const BODY_H = 30;
const BODY_DROP = 3;

/**
 * Colossus — tanque de armadura. Anda devagar na frente da horda e serve de escudo:
 * projéteis que perfuram param nele (`blocksPierce`) e ele não recua com os golpes (`isHeavy`).
 * Muita vida, dano de contato comum. Números em `ENEMY_BALANCE.colossus`.
 */
export class ColossusEnemy extends BaseEnemy {
  /** Lido pelo CombatFeelSystem para a explosão de morte "grande". */
  public readonly isElite: boolean = true;
  private currentDir: Cardinal = 'south';

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'colossus-idle-south');
    this.blocksPierce = true;
    this.isHeavy = true;
    this.fitBody();
  }

  public override spawn(x: number, y: number, hp: number, speed: number, damage: number): void {
    super.spawn(x, y, hp, speed, damage);
    this.setScale(ENEMY_BALANCE.colossus.scale);
    this.play('colossus-idle-south', true);
    this.fitBody();
  }

  /** Recentraliza a colisão: os quadros parado/andando têm tamanhos diferentes. */
  private fitBody(): void {
    const body = this.body as Phaser.Physics.Arcade.Body | null;
    if (!body) return;
    body.setSize(BODY_W, BODY_H, false);
    body.setOffset((this.width - BODY_W) / 2, (this.height - BODY_H) / 2 + BODY_DROP);
  }

  private playAnim(key: string): void {
    if (this.anims.currentAnim?.key === key) return;
    this.play(key, true);
    this.fitBody();
  }

  public override updateEnemy(targetX: number, targetY: number, deltaMs: number): void {
    if (this.isDead || !this.active) return;

    if (this.hitFlashTimer > 0) {
      this.hitFlashTimer -= deltaMs;
      if (this.hitFlashTimer <= 0) this.clearTint();
    }
    const stunMult = this.updateStunState(deltaMs);

    const dx = targetX - this.x;
    const dy = targetY - this.y;
    const dist = Math.hypot(dx, dy);
    if (dist <= 8) {
      this.setVelocity(0, 0);
      this.playAnim(`colossus-idle-${this.currentDir}`);
      return;
    }
    this.setVelocity((dx / dist) * this.speed * stunMult, (dy / dist) * this.speed * stunMult);
    this.currentDir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'east' : 'west') : (dy > 0 ? 'south' : 'north');
    this.playAnim(`colossus-walk-${this.currentDir}`);
  }
}
