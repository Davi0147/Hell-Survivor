import Phaser from 'phaser';
import { BaseEnemy } from './BaseEnemy';
import { Nixy } from '../characters/Nixy';
import { GemType } from '../items/SoulGem';
import { SoundManager } from '../../systems/SoundManager';

export class PoisonPuddle extends Phaser.GameObjects.Sprite {
  public radiusPx: number;
  public lifespanMs: number;
  public maxLifespanMs: number;
  public damagePerTick: number = 5;
  public lastDamageTime: number = 0;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    radius: number = 18,
    lifespanMs: number = 6000
  ) {
    super(scene, x, y, 'mummy-poison-gosma');
    scene.add.existing(this);
    this.setDepth(4); // Fica sobre o chão e abaixo de Nixy/inimigos
    this.radiusPx = radius;
    this.lifespanMs = lifespanMs;
    this.maxLifespanMs = lifespanMs;
    this.setScale(1.0);
    this.setAlpha(0.92);
  }

  public updatePuddle(deltaMs: number, player: Nixy, timeNow: number): void {
    if (!this.active) return;
    this.lifespanMs -= deltaMs;

    if (this.lifespanMs <= 0) {
      this.destroy();
      return;
    }

    // Fade out nos últimos 1.5s de vida
    const fadeRatio = Math.min(1, this.lifespanMs / 1500);
    this.setAlpha(0.75 * fadeRatio);

    // Efeito sutil de borbulhamento
    const pulse = 1 + Math.sin(timeNow * 0.008 + this.x) * 0.08;
    this.setScale(pulse, pulse);

    // Detecção de colisão com a heroína
    const dist = Math.hypot(player.x - this.x, player.y - this.y);
    if (dist <= this.radiusPx + 14 && player.currentHp > 0) {
      // 1. Aplica Lentidão (Slow de 40%)
      player.applySlow(0.60, 450);

      // 2. Dano contínuo de veneno a cada 450ms
      if (timeNow - this.lastDamageTime >= 450) {
        this.lastDamageTime = timeNow;
        SoundManager.getInstance().playPlayerHurt();
        player.takeDamage(this.damagePerTick);
      }
    }
  }
}

export class MummyEnemy extends BaseEnemy {
  private currentDir: 'east' | 'west' | 'north' | 'south' = 'south';
  private zigzagTimer: number = 0;
  private puddleTimer: number = 0;
  private readonly PUDDLE_INTERVAL_MS = 220;
  public puddles: PoisonPuddle[] = [];
  public customDrop?: GemType;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'mummy-idle-south');

    const body = this.body as Phaser.Physics.Arcade.Body;
    if (body) {
      body.setSize(30, 38);
      body.setOffset(17, 22);
    }
  }

  public override spawn(
    x: number,
    y: number,
    hp: number = 130,
    speed: number = 58,
    damage: number = 15,
    customDrop?: GemType
  ): void {
    super.spawn(x, y, hp, speed, damage);
    this.customDrop = customDrop;
    this.zigzagTimer = Math.random() * 1000;
    this.puddleTimer = 0;
    this.puddles = [];
    this.setScale(1.05);
    this.clearTint();
    this.play('mummy-idle-south', true);
  }

  public updateMummy(player: Nixy, deltaMs: number, timeNow: number): void {
    if (this.isDead || !this.active) return;

    // Efeito de stun / hit flash
    if (this.hitFlashTimer > 0) {
      this.hitFlashTimer -= deltaMs;
      if (this.hitFlashTimer <= 0) {
        this.clearTint();
      }
    }

    const stunMult = this.updateStunState(deltaMs);

    const dx = player.x - this.x;
    const dy = player.y - this.y;
    const dist = Math.hypot(dx, dy);

    if (dist > 8) {
      this.zigzagTimer += deltaMs;

      // Movimentação em zigue-zague sinoidal na direção da heroína
      const dirX = dx / dist;
      const dirY = dy / dist;

      // Vetor perpendicular para o desvio lateral
      const perpX = -dirY;
      const perpY = dirX;

      // Frequência e amplitude do zigue-zague
      const zigzagFactor = Math.sin(this.zigzagTimer * 0.005) * 0.9;
      let moveX = dirX + perpX * zigzagFactor;
      let moveY = dirY + perpY * zigzagFactor;
      const moveLen = Math.hypot(moveX, moveY);
      if (moveLen > 0.001) {
        moveX /= moveLen;
        moveY /= moveLen;
      }

      const vx = moveX * this.speed * stunMult;
      const vy = moveY * this.speed * stunMult;
      this.setVelocity(vx, vy);

      // Direção da animação
      const absX = Math.abs(dx);
      const absY = Math.abs(dy);
      let targetDir: 'east' | 'west' | 'north' | 'south' = 'south';

      if (absX > absY) {
        targetDir = dx > 0 ? 'east' : 'west';
      } else {
        targetDir = dy > 0 ? 'south' : 'north';
      }

      if (this.currentDir !== targetDir || !this.anims.isPlaying) {
        this.currentDir = targetDir;
        this.play(`mummy-walk-${targetDir}`, true);
      }

      // 2. Deixar rastro verde periódico (Poison Puddle)
      this.puddleTimer += deltaMs;
      if (this.puddleTimer >= this.PUDDLE_INTERVAL_MS && dist > 20) {
        this.puddleTimer = 0;
        this.dropPoisonPuddle();
      }
    } else {
      this.setVelocity(0, 0);
      this.play(`mummy-idle-${this.currentDir}`, true);
    }
  }

  private dropPoisonPuddle(): void {
    // Limita máximo de 18 poças ativas simultâneas por múmia para proteger a performance
    if (this.puddles.length >= 18) {
      const oldest = this.puddles.shift();
      if (oldest && oldest.active) {
        oldest.destroy();
      }
    }

    const puddle = new PoisonPuddle(this.scene, this.x, this.y + 14, 18, 6500);
    this.puddles.push(puddle);
    if ((this.scene as any).registerPoisonPuddle) {
      (this.scene as any).registerPoisonPuddle(puddle);
    }
  }

  /**
   * Remove e dissolve suavemente todas as poças geradas por esta múmia ao morrer
   */
  public clearAllPuddles(): void {
    for (const p of this.puddles) {
      if (p && p.active) {
        this.scene.tweens.add({
          targets: p,
          alpha: 0,
          scale: 0.1,
          duration: 350,
          ease: 'Power2',
          onComplete: () => {
            p.destroy();
          }
        });
      }
    }
    this.puddles = [];
  }

  /**
   * Aciona o ataque de contato e empurra a heroína para trás (Knockback)
   */
  public onPlayerCollide(player: Nixy): void {
    const kAngle = Math.atan2(player.y - this.y, player.x - this.x);
    const knockbackForce = 290;
    const kx = Math.cos(kAngle) * knockbackForce;
    const ky = Math.sin(kAngle) * knockbackForce;

    player.applyKnockback(kx, ky, 240);
  }

  public override takeDamage(amount: number): void {
    super.takeDamage(amount);

    if (this.isDead) {
      this.clearAllPuddles();
    }
  }
}
