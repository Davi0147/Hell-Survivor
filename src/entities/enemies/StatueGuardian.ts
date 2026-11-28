import Phaser from 'phaser';
import { BaseEnemy } from './BaseEnemy';
import type { BaseCharacter } from '../characters/BaseCharacter';
import { ENEMY_BALANCE } from '../../config/balance';
import { STATUE_GUARDIAN_THEME as T } from '../../config/theme';
import { SoundManager } from '../../systems/SoundManager';
import { DebugSessionLogger } from '../../systems/DebugSessionLogger';
import { STATUE_ANIMS, STATUE_SHEET, STATUE_TEXTURE } from '../../systems/Chapter3EnemyAssets';
import { statueSlamPhase, isInsideSlam } from './statueRules';

type StatueState = 'walk' | 'telegraph' | 'recover';

/** O que a estátua usa da cena para ferir a heroína (a GameScene cumpre). */
interface StatueScene {
  player?: BaseCharacter;
  isPlayerInvulnerable?: boolean;
  grantInvulnerability?: (ms: number) => void;
}

/** Imunidade depois do martelo: a mesma dos golpes de chefe (golpes não se somam). */
const HIT_COOLDOWN_MS = 500;

/**
 * Guardião de Mármore (minichefe do Capítulo 3): estátua grega enorme com martelo de ouro.
 * Muita vida, anda devagar em passos duros (para entre um passo e outro) e é sólida (a heroína
 * não atravessa). Perto da heroína para, ergue o martelo com um círculo marcado no chão e bate:
 * quem estiver dentro do círculo leva dano e é empurrado. Depois fica um instante parado com o
 * martelo no chão. Números em `ENEMY_BALANCE.statueGuardian`.
 */
export class StatueGuardian extends BaseEnemy {
  /** Lido pelo CombatFeelSystem para a explosão de morte "grande". */
  public readonly isElite: boolean = true;
  private statueState: StatueState = 'walk';
  private stateTimer = 0;
  private stepClock = 0;
  private slamCooldown = 0;
  private slamCenter = { x: 0, y: 0 };
  private readonly telegraph: Phaser.GameObjects.Graphics;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, STATUE_TEXTURE);
    this.isBoss = true;
    this.isHeavy = true;
    this.isSolid = true;
    this.setDepth(14);
    // Abaixo de todos os personagens (o círculo é no chão)
    this.telegraph = scene.add.graphics().setDepth(3);
    this.fitBody();
  }

  public override spawn(x: number, y: number, hp: number, speed: number, damage: number): void {
    super.spawn(x, y, hp, speed, damage);
    const cfg = ENEMY_BALANCE.statueGuardian;
    this.setScale(cfg.scale);
    this.setAngle(0);
    this.statueState = 'walk';
    this.stateTimer = 0;
    this.stepClock = 0;
    this.slamCooldown = cfg.slam.firstCooldownMs;
    this.telegraph.clear();
    this.setFrame(STATUE_SHEET.walk.start);
    this.fitBody();
  }

  /** Caixa de colisão só nos pés e no corpo (o martelo e o pedestal não contam). */
  private fitBody(): void {
    const body = this.body as Phaser.Physics.Arcade.Body | null;
    if (!body) return;
    const w = STATUE_SHEET.body.width;
    const h = STATUE_SHEET.body.height;
    body.setSize(w, h, false);
    body.setOffset((this.width - w) / 2, this.height - h - STATUE_SHEET.body.bottomGap);
  }

  /** Arte desenhada virada para um lado: espelha para olhar para a heroína. */
  private face(dx: number): void {
    if (Math.abs(dx) < 2) return;
    const towardRight = dx > 0;
    this.setFlipX(STATUE_SHEET.facesRight ? !towardRight : towardRight);
  }

  public override updateEnemy(targetX: number, targetY: number, deltaMs: number): void {
    if (this.isDead || !this.active) return;
    if (this.hitFlashTimer > 0) {
      this.hitFlashTimer -= deltaMs;
      if (this.hitFlashTimer <= 0) this.clearTint();
    }
    const stunMult = this.updateStunState(deltaMs);
    const cfg = ENEMY_BALANCE.statueGuardian;
    const dx = targetX - this.x;
    const dy = targetY - this.y;
    const dist = Math.hypot(dx, dy);

    if (this.statueState === 'telegraph') {
      this.setVelocity(0, 0);
      this.stateTimer -= deltaMs;
      const progress = 1 - Math.max(0, this.stateTimer / cfg.slam.telegraphMs);
      this.drawTelegraph(progress);
      // Firma o martelo no ombro esperando a batida (a marcação no chão é o aviso)
      const slam = STATUE_SHEET.slam;
      this.setFrame(slam.start + (progress < 0.25 ? slam.raised - 1 : slam.raised));
      // Treme de leve no fim, como quem vai descer o martelo
      if (progress > 0.7) this.setFrame(slam.start + slam.raised).setAngle(Math.sin(progress * 90) * 1.5);
      if (this.stateTimer <= 0) this.slamImpact();
      return;
    }

    if (this.statueState === 'recover') {
      this.setVelocity(0, 0);
      this.stateTimer -= deltaMs;
      // Batida (4) → faíscas e lascas (5 a 7), com o martelo no chão
      const slam = STATUE_SHEET.slam;
      const since = ENEMY_BALANCE.statueGuardian.slam.recoverMs - this.stateTimer;
      this.setFrame(slam.start + Math.min(slam.count - 1, slam.impact + Math.floor(since / 110)));
      if (this.stateTimer <= 0) {
        this.statueState = 'walk';
        this.slamCooldown = cfg.slam.cooldownMs;
      }
      return;
    }

    // Andando: começa o golpe quando a heroína chega perto
    this.slamCooldown -= deltaMs;
    if (this.slamCooldown <= 0 && this.stunTimer <= 0 && dist <= cfg.slam.triggerRange) {
      this.startSlam(targetX, targetY);
      return;
    }

    this.face(dx);
    this.stepClock = (this.stepClock + deltaMs) % (cfg.stepMs + cfg.pauseMs);
    const moving = this.stepClock < cfg.stepMs && dist > 10;
    if (moving) {
      this.setVelocity((dx / dist) * this.speed * stunMult, (dy / dist) * this.speed * stunMult);
      if (this.anims.currentAnim?.key !== STATUE_ANIMS.walk || !this.anims.isPlaying) this.play(STATUE_ANIMS.walk, true);
    } else {
      // Pausa entre passos: parada dura de estátua
      this.setVelocity(0, 0);
      this.anims.pause();
    }
  }

  private startSlam(targetX: number, targetY: number): void {
    const cfg = ENEMY_BALANCE.statueGuardian.slam;
    this.statueState = 'telegraph';
    this.stateTimer = cfg.telegraphMs;
    this.setVelocity(0, 0);
    this.anims.stop();
    this.face(targetX - this.x);
    // A área fica entre a estátua e a heroína (o martelo bate na frente dele)
    const reach = Math.min(Math.hypot(targetX - this.x, targetY - this.y), cfg.radius * 0.45);
    const a = Math.atan2(targetY - this.y, targetX - this.x);
    this.slamCenter = { x: this.x + Math.cos(a) * reach, y: this.y + Math.sin(a) * reach };
  }

  private drawTelegraph(progress: number): void {
    const r = ENEMY_BALANCE.statueGuardian.slam.radius;
    const { fillAlpha, edgeAlpha } = statueSlamPhase(progress);
    const g = this.telegraph;
    g.clear();
    g.fillStyle(T.telegraphFill, T.telegraphFillAlpha * fillAlpha);
    g.fillCircle(this.slamCenter.x, this.slamCenter.y, r * progress);
    g.lineStyle(4, T.telegraphEdge, edgeAlpha);
    g.strokeCircle(this.slamCenter.x, this.slamCenter.y, r);
  }

  private slamImpact(): void {
    const cfg = ENEMY_BALANCE.statueGuardian.slam;
    this.telegraph.clear();
    this.setAngle(0);
    this.statueState = 'recover';
    this.stateTimer = cfg.recoverMs;
    this.setFrame(STATUE_SHEET.slam.start + STATUE_SHEET.slam.impact);

    const scene = this.scene;
    scene.cameras.main.shake(260, 0.018);
    SoundManager.getInstance().playBossSlam();
    this.spawnImpactRing();

    const s = scene as Phaser.Scene & StatueScene;
    const player = s.player;
    if (!player || !isInsideSlam(player.x, player.y, this.slamCenter.x, this.slamCenter.y, cfg.radius)) return;
    if (player.isDashInvulnerable || s.isPlayerInvulnerable) return;
    const dmg = this.damageScale(cfg.damage);
    player.takeDamage(dmg);
    DebugSessionLogger.getInstance().log('COMBAT', 'INFO', `Guardião de Mármore: martelo acertou a Nixy (${dmg} de dano)`);
    s.grantInvulnerability?.(HIT_COOLDOWN_MS);
    const a = Math.atan2(player.y - this.slamCenter.y, player.x - this.slamCenter.x);
    (player as BaseCharacter & { applyKnockback?(vx: number, vy: number, ms?: number): void })
      .applyKnockback?.(Math.cos(a) * cfg.pushForce, Math.sin(a) * cfg.pushForce, cfg.pushMs);
  }

  /** O martelo segue a mesma força do contato (capítulo e Infinito mexem nos dois juntos). */
  private damageScale(base: number): number {
    return Math.round(base * (this.damage / ENEMY_BALANCE.statueGuardian.damage));
  }

  private spawnImpactRing(): void {
    const r = ENEMY_BALANCE.statueGuardian.slam.radius;
    const ring = this.scene.add.circle(this.slamCenter.x, this.slamCenter.y, r * 0.3).setDepth(4);
    ring.setStrokeStyle(6, T.impactRing, 0.9);
    this.scene.tweens.add({
      targets: ring,
      radius: r,
      alpha: 0,
      duration: 380,
      ease: 'Quad.easeOut',
      onComplete: () => ring.destroy(),
    });
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2;
      const dust = this.scene.add.circle(this.slamCenter.x, this.slamCenter.y, Phaser.Math.Between(4, 8), T.impactDust, 0.8).setDepth(4);
      this.scene.tweens.add({
        targets: dust,
        x: this.slamCenter.x + Math.cos(a) * r * 0.9,
        y: this.slamCenter.y + Math.sin(a) * r * 0.9,
        alpha: 0,
        duration: 450,
        ease: 'Quad.easeOut',
        onComplete: () => dust.destroy(),
      });
    }
  }

  protected override die(): void {
    this.telegraph.clear();
    super.die();
  }

  public override destroy(fromScene?: boolean): void {
    if (this.telegraph.scene) this.telegraph.destroy();
    super.destroy(fromScene);
  }
}
