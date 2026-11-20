import Phaser from 'phaser';
import { BaseEnemy } from './BaseEnemy';
import { ARENA_CONFIG, HORDE_EVENT_BALANCE } from '../../config/balance';

type Cardinal = 'east' | 'west' | 'north' | 'south';

/** Caixa de colisão (px do quadro, antes da escala). Os quadros têm 48px (parado) e 68px (correndo). */
const BODY_W = 24;
const BODY_H = 26;
const BODY_DROP = 3;

/**
 * Transportador — diabrete com um saco de gemas nas costas (evento de horda).
 * Não ataca: foge da heroína e, quando abre distância, desacelera para a caçada ser possível.
 * Quem o abate antes do tempo acabar leva o saco. Números em `HORDE_EVENT_BALANCE.thief`.
 */
export class TransporterEnemy extends BaseEnemy {
  private currentDir: Cardinal = 'south';

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'transporter-idle-south');
    this.fitBody();
  }

  public override spawn(x: number, y: number, hp: number, speed: number, damage: number): void {
    super.spawn(x, y, hp, speed, damage);
    this.setScale(HORDE_EVENT_BALANCE.thief.scale);
    this.play('transporter-idle-south', true);
    this.fitBody();
  }

  /** Recentraliza a colisão: os quadros parado/correndo têm tamanhos diferentes. */
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

    // Vetor de fuga (oposto à heroína)
    let dx = this.x - targetX;
    let dy = this.y - targetY;
    const dist = Math.hypot(dx, dy);

    // Perto da borda da arena, desliza de lado em vez de travar no canto
    const m = 140;
    if (this.x < ARENA_CONFIG.MIN_X + m || this.x > ARENA_CONFIG.MAX_X - m) dx = -dx * 0.4;
    if (this.y < ARENA_CONFIG.MIN_Y + m || this.y > ARENA_CONFIG.MAX_Y - m) dy = -dy * 0.4;
    const cfg = HORDE_EVENT_BALANCE.thief;
    const paceMult = dist > cfg.fleeRelaxDistance ? cfg.relaxedPace : 1;

    const len = Math.hypot(dx, dy);
    if (len < 1) {
      this.setVelocity(0, 0);
      this.playAnim(`transporter-idle-${this.currentDir}`);
      return;
    }
    this.setVelocity((dx / len) * this.speed * stunMult * paceMult, (dy / len) * this.speed * stunMult * paceMult);
    this.currentDir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'east' : 'west') : (dy > 0 ? 'south' : 'north');
    this.playAnim(`transporter-run-${this.currentDir}`);
  }
}
