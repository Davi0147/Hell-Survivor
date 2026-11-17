import Phaser from 'phaser';
import { DamageTextSystem } from '../../systems/DamageTextSystem';
import { IMPACT_BALANCE } from '../../config/balance';

/** O que um inimigo usa do sistema de impacto da cena (CombatFeelSystem cumpre este contrato). */
export interface IEnemyCombatFeel {
  rollCrit(amount: number): { amount: number; isCrit: boolean };
  hitSpark(x: number, y: number, isCrit: boolean): void;
  onEnemyDied(enemy: BaseEnemy): void;
}

type CombatFeelScene = Phaser.Scene & {
  combatFeel?: IEnemyCombatFeel;
  player?: { x: number; y: number };
};

export class BaseEnemy extends Phaser.Physics.Arcade.Sprite {
  public maxHp: number = 30;
  public hp: number = 30;
  public speed: number = 75;
  public damage: number = 11;
  public isDead: boolean = false;
  public stunTimer: number = 0;
  /** Chefes reduzem atordoamento e não piscam com o golpe (subclasses de chefe ligam isto). */
  public isBoss: boolean = false;
  /** Ignora dano (fases cinematográficas de chefe). */
  public isInvulnerable: boolean = false;

  protected hitFlashTimer: number = 0;

  constructor(scene: Phaser.Scene, x: number, y: number, texture: string = 'enemy-imp') {
    super(scene, x, y, texture);
    scene.add.existing(this);
    scene.physics.add.existing(this);

    // Ajuste da caixa de colisão física
    const body = this.body as Phaser.Physics.Arcade.Body;
    if (body) {
      body.setSize(22, 24);
      body.setOffset(5, 6);
    }
  }

  public spawn(x: number, y: number, hp: number = 30, speed: number = 75, damage: number = 11): void {
    this.setPosition(x, y);
    this.maxHp = hp;
    this.hp = hp;
    this.speed = speed;
    this.damage = damage;
    this.isDead = false;
    this.stunTimer = 0;
    this.clearTint();
    this.setActive(true);
    this.setVisible(true);

    const body = this.body as Phaser.Physics.Arcade.Body;
    if (body) {
      body.enable = true;
    }
  }

  public applyStun(durationMs: number): void {
    if (this.isDead || !this.active) return;
    const isBoss = this.isBoss === true;
    const effectiveDuration = isBoss ? durationMs * 0.35 : durationMs;
    this.stunTimer = Math.max(this.stunTimer, effectiveDuration);
    if (this.hitFlashTimer <= 0 && !isBoss) {
      this.setTint(0x9d4edd);
    }
  }

  protected updateStunState(deltaMs: number, defaultTint?: number): number {
    if (this.stunTimer > 0) {
      this.stunTimer -= deltaMs;
      if (this.stunTimer <= 0) {
        this.stunTimer = 0;
        if (this.hitFlashTimer <= 0) {
          if (defaultTint !== undefined) {
            this.setTint(defaultTint);
          } else {
            this.clearTint();
          }
        }
      } else if (this.hitFlashTimer <= 0 && !this.isBoss) {
        this.setTint(0x9d4edd);
      }
      return this.isBoss ? 0.65 : 0.15;
    }
    return 1.0;
  }

  public takeDamage(amount: number): void {
    if (this.isDead || !this.active || this.isInvulnerable) return;

    const world = this.scene as CombatFeelScene;
    const feel = world.combatFeel;
    let isCrit = false;
    if (feel) {
      const rolled = feel.rollCrit(amount);
      amount = rolled.amount;
      isCrit = rolled.isCrit;
    }

    this.hp -= amount;

    // Flash branco de impacto
    this.setTintFill(0xffffff);
    this.hitFlashTimer = 80;

    // Partículas de faísca (emissor compartilhado quando a cena tem o sistema de impacto)
    if (feel) {
      feel.hitSpark(this.x, this.y, isCrit);
    } else {
      this.emitHitSparks();
    }

    // Texto flutuante de dano
    DamageTextSystem.showDamage(this.scene, this.x, this.y, amount, isCrit);

    if (this.hp <= 0) {
      this.die();
      return;
    }

    // Recuo curto para o golpe "pesar" (chefes não recuam)
    const target = world.player;
    if (!this.isBoss && target) {
      const dx = this.x - target.x;
      const dy = this.y - target.y;
      const dist = Math.hypot(dx, dy);
      if (dist > 1) {
        const push = IMPACT_BALANCE.hitRecoilPx * (isCrit ? 2 : 1);
        this.x += (dx / dist) * push;
        this.y += (dy / dist) * push;
      }
    }
  }

  public updateEnemy(targetX: number, targetY: number, deltaMs: number): void {
    if (this.isDead || !this.active) return;

    // Gerenciar duração do flash branco
    if (this.hitFlashTimer > 0) {
      this.hitFlashTimer -= deltaMs;
      if (this.hitFlashTimer <= 0) {
        this.clearTint();
      }
    }

    const stunMult = this.updateStunState(deltaMs);

    // Perseguição ao alvo
    const dx = targetX - this.x;
    const dy = targetY - this.y;
    const dist = Math.hypot(dx, dy);

    if (dist > 5) {
      const vx = (dx / dist) * this.speed * stunMult;
      const vy = (dy / dist) * this.speed * stunMult;
      this.setVelocity(vx, vy);

      // Virar o sprite para a direção do movimento
      this.setFlipX(vx < 0);
    } else {
      this.setVelocity(0, 0);
    }
  }

  protected die(): void {
    this.isDead = true;

    const body = this.body as Phaser.Physics.Arcade.Body;
    if (body) {
      body.enable = false;
    }

    (this.scene as CombatFeelScene).combatFeel?.onEnemyDied(this);

    // Morte "esmagada": clarão branco, achata e some
    this.setTintFill(0xffffff);
    this.scene.tweens.add({
      targets: this,
      scaleX: this.scaleX * 1.45,
      scaleY: this.scaleY * 0.15,
      alpha: 0,
      duration: 170,
      ease: 'Quad.easeOut',
      onComplete: () => {
        this.emit('enemy-killed', this.x, this.y, this);
        this.setActive(false);
        this.setVisible(false);
        this.setScale(1);
        this.setAlpha(1);
      }
    });
  }

  private emitHitSparks(): void {
    for (let i = 0; i < 3; i++) {
      const spark = this.scene.add.image(this.x, this.y, 'particle-spark');
      spark.setDepth(150);
      spark.setTint(0xffd166);

      const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
      const dist = Phaser.Math.Between(15, 30);
      const destX = this.x + Math.cos(angle) * dist;
      const destY = this.y + Math.sin(angle) * dist;

      this.scene.tweens.add({
        targets: spark,
        x: destX,
        y: destY,
        alpha: 0,
        scale: 0.2,
        duration: 250,
        ease: 'Quad.easeOut',
        onComplete: () => {
          spark.destroy();
        }
      });
    }
  }
}
