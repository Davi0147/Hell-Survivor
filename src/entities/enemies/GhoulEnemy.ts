import Phaser from 'phaser';
import { BaseEnemy } from './BaseEnemy';
import { ENEMY_BALANCE } from '../../config/balance';
import { FX_COLORS } from '../../config/theme';

type Cardinal = 'east' | 'west' | 'north' | 'south';
type GhoulState = 'chase' | 'telegraph' | 'lunge';

/** Caixa de colisão (px do quadro, antes da escala). Os quadros têm 64px (parado) e 84px (correndo). */
const BODY_W = 30;
const BODY_H = 34;
const BODY_DROP = 4;

/**
 * Ghoul Devorador — minichefe do Modo Infinito (3:00), substituto do Titã Cerberus.
 * Persegue a heroína e, de tempos em tempos, para, pisca em vermelho e dá um bote rápido
 * em linha reta (mais dano no contato durante o bote). Números em `ENEMY_BALANCE.ghoulDevourer`.
 */
export class GhoulEnemy extends BaseEnemy {
  /** Lido pelo CombatFeelSystem para a explosão de morte "grande". */
  public readonly isElite: boolean = true;
  private currentDir: Cardinal = 'south';
  private ghoulState: GhoulState = 'chase';
  private stateTimer: number = 0;
  private lungeCooldown: number = 0;
  private lungeDirX: number = 0;
  private lungeDirY: number = 0;
  private baseDamage: number = 0;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'ghoul-idle-south');
    this.isBoss = true;
    this.fitBody();
  }

  public override spawn(x: number, y: number, hp: number, speed: number, damage: number): void {
    super.spawn(x, y, hp, speed, damage);
    const cfg = ENEMY_BALANCE.ghoulDevourer;
    this.baseDamage = damage;
    this.ghoulState = 'chase';
    this.stateTimer = 0;
    this.lungeCooldown = cfg.lunge.firstCooldownMs;
    this.setScale(cfg.scale);
    this.play('ghoul-idle-south', true);
    this.fitBody();
  }

  /** Recentraliza a colisão: os quadros parado/correndo têm tamanhos diferentes. */
  private fitBody(): void {
    const body = this.body as Phaser.Physics.Arcade.Body | null;
    if (!body) return;
    body.setSize(BODY_W, BODY_H, false);
    body.setOffset((this.width - BODY_W) / 2, (this.height - BODY_H) / 2 + BODY_DROP);
  }

  private playDir(prefix: 'run' | 'idle', dir: Cardinal): void {
    const key = `ghoul-${prefix}-${dir}`;
    if (this.anims.currentAnim?.key !== key) {
      this.play(key, true);
      this.fitBody();
    }
  }

  private static cardinalOf(dx: number, dy: number): Cardinal {
    if (Math.abs(dx) > Math.abs(dy)) return dx > 0 ? 'east' : 'west';
    return dy > 0 ? 'south' : 'north';
  }

  /** Golpe de contato: empurra a heroína para longe (bem mais forte se acertar durante o bote). */
  public onPlayerCollide(player: { x: number; y: number; applyKnockback(vx: number, vy: number, durationMs?: number): void }): void {
    const kb = ENEMY_BALANCE.ghoulDevourer.knockback;
    const isLunge = this.ghoulState === 'lunge';
    const force = isLunge ? kb.lungeForce : kb.force;
    const angle = Math.atan2(player.y - this.y, player.x - this.x);
    player.applyKnockback(Math.cos(angle) * force, Math.sin(angle) * force, isLunge ? kb.lungeDurationMs : kb.durationMs);
    if (isLunge) this.scene.cameras.main.shake(160, 0.008);
  }

  public override updateEnemy(targetX: number, targetY: number, deltaMs: number): void {
    if (this.isDead || !this.active) return;
    const lunge = ENEMY_BALANCE.ghoulDevourer.lunge;

    if (this.hitFlashTimer > 0) {
      this.hitFlashTimer -= deltaMs;
      if (this.hitFlashTimer <= 0) this.clearTint();
    }
    const stunMult = this.updateStunState(deltaMs);

    const dx = targetX - this.x;
    const dy = targetY - this.y;
    const dist = Math.hypot(dx, dy);

    if (this.ghoulState === 'telegraph') {
      this.stateTimer -= deltaMs;
      this.setVelocity(0, 0);
      // Pisca em vermelho enquanto se prepara (sem atrapalhar o flash branco do golpe)
      if (this.hitFlashTimer <= 0) {
        if (Math.floor(this.stateTimer / 90) % 2 === 0) this.setTint(FX_COLORS.ghoulLungeTelegraph);
        else this.clearTint();
      }
      if (this.stateTimer <= 0) {
        const len = dist || 1;
        this.lungeDirX = dx / len;
        this.lungeDirY = dy / len;
        this.ghoulState = 'lunge';
        this.stateTimer = lunge.durationMs;
        this.damage = lunge.damage;
        if (this.hitFlashTimer <= 0) this.setTint(FX_COLORS.ghoulLungeTelegraph);
        this.playDir('run', GhoulEnemy.cardinalOf(dx, dy));
      }
      return;
    }

    if (this.ghoulState === 'lunge') {
      this.stateTimer -= deltaMs;
      this.setVelocity(this.lungeDirX * lunge.speed * stunMult, this.lungeDirY * lunge.speed * stunMult);
      if (this.stateTimer <= 0) {
        this.ghoulState = 'chase';
        this.damage = this.baseDamage;
        this.lungeCooldown = lunge.cooldownMs;
        if (this.hitFlashTimer <= 0) this.clearTint();
      }
      return;
    }

    // Perseguição
    this.lungeCooldown -= deltaMs;
    if (this.lungeCooldown <= 0 && this.stunTimer <= 0 && dist >= lunge.minRange && dist <= lunge.maxRange) {
      this.ghoulState = 'telegraph';
      this.stateTimer = lunge.telegraphMs;
      this.setVelocity(0, 0);
      return;
    }

    if (dist > 8) {
      this.setVelocity((dx / dist) * this.speed * stunMult, (dy / dist) * this.speed * stunMult);
      this.currentDir = GhoulEnemy.cardinalOf(dx, dy);
      this.playDir('run', this.currentDir);
    } else {
      this.setVelocity(0, 0);
      this.playDir('idle', this.currentDir);
    }
  }
}
