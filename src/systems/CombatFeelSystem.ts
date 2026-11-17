import Phaser from 'phaser';
import type { BaseCharacter } from '../entities/characters/BaseCharacter';
import type { BaseEnemy, IEnemyCombatFeel } from '../entities/enemies/BaseEnemy';
import { ComboTracker } from './ComboTracker';
import { SoundManager } from './SoundManager';
import { DebugSessionLogger } from './DebugSessionLogger';
import {
  COMBO_BALANCE,
  CRIT_BALANCE,
  DASH_BALANCE,
  CORPSE_EXPLOSION_BALANCE,
  BLOODTHIRST_BALANCE,
  IMPACT_BALANCE,
} from '../config/balance';
import { FX_COLORS } from '../config/theme';

/** Contrato mínimo que a cena de jogo expõe para o CombatFeelSystem. */
export interface ICombatFeelContext {
  readonly player: BaseCharacter;
  readonly enemiesGroup: Phaser.GameObjects.Group;
  readonly isGameOver: boolean;
}

type Emitter = Phaser.GameObjects.Particles.ParticleEmitter;

/**
 * CombatFeelSystem — o "peso" do combate: combo de abates e Frenesi, golpes críticos,
 * faíscas e estouros de morte (emissor compartilhado), onda de choque de Level Up,
 * dano da esquiva e explosão de cadáveres.
 */
export class CombatFeelSystem implements IEnemyCombatFeel {
  public readonly combo = new ComboTracker();

  private sparks?: Emitter;
  private frenzyAura?: Emitter;
  private isFrenzyApplied = false;
  private isNovaQueued = false;
  private explosionsThisFrame = 0;
  private lastExplosionSfxAt = 0;
  private lastCritSfxAt = 0;
  private readonly dashHits = new Set<BaseEnemy>();

  private readonly onResume = (): void => this.fireQueuedNova();
  private readonly onDashed = (): void => this.handleDashStarted();

  constructor(private readonly scene: Phaser.Scene, private readonly ctx: ICombatFeelContext) {
    if (scene.textures.exists('particle-spark')) {
      this.sparks = scene.add.particles(0, 0, 'particle-spark', {
        speed: { min: 60, max: 190 },
        angle: { min: 0, max: 360 },
        scale: { start: 1.5, end: 0.1 },
        alpha: { start: 1, end: 0 },
        lifespan: { min: 180, max: 360 },
        blendMode: Phaser.BlendModes.ADD,
        emitting: false,
      });
      this.sparks.setDepth(150);

      this.frenzyAura = scene.add.particles(0, 0, 'particle-spark', {
        speed: { min: 20, max: 70 },
        angle: { min: 240, max: 300 },
        scale: { start: 1.7, end: 0 },
        alpha: { start: 0.9, end: 0 },
        lifespan: 420,
        frequency: 45,
        tint: FX_COLORS.frenzyAura,
        blendMode: Phaser.BlendModes.ADD,
        emitting: false,
      });
      this.frenzyAura.setDepth(19);
    }

    scene.events.on(Phaser.Scenes.Events.RESUME, this.onResume);
    ctx.player.on('player-dashed', this.onDashed);
  }

  public destroy(): void {
    this.scene.events.off(Phaser.Scenes.Events.RESUME, this.onResume);
    this.ctx.player?.off('player-dashed', this.onDashed);
    this.dashHits.clear();
  }

  /** Bônus de XP do degrau atual do combo (0.1 = +10%). */
  public get xpBonus(): number {
    return this.combo.xpBonus;
  }

  // ---------------------------------------------------------------------------
  // Contrato usado pelos inimigos
  // ---------------------------------------------------------------------------

  public rollCrit(amount: number): { amount: number; isCrit: boolean } {
    const player = this.ctx.player;
    if (amount >= CRIT_BALANCE.ignoreAbove || Math.random() >= player.critChance) {
      return { amount, isCrit: false };
    }
    const now = this.scene.time.now;
    if (now - this.lastCritSfxAt > 90) {
      this.lastCritSfxAt = now;
      SoundManager.getInstance().playCritHit();
    }
    return { amount: amount * player.critMultiplier, isCrit: true };
  }

  public hitSpark(x: number, y: number, isCrit: boolean): void {
    if (!this.sparks) return;
    this.sparks.setParticleTint(isCrit ? FX_COLORS.deathBurstElite : FX_COLORS.hitSpark);
    this.sparks.explode(isCrit ? 6 : 2, x, y);
  }

  public onEnemyDied(enemy: BaseEnemy): void {
    const isBig = enemy.isBoss || (enemy as { isElite?: boolean }).isElite === true;
    if (this.sparks) {
      this.sparks.setParticleTint(isBig ? FX_COLORS.deathBurstElite : FX_COLORS.deathBurst);
      this.sparks.explode(isBig ? 22 : 7, enemy.x, enemy.y);
    }
    if (isBig) this.scene.cameras.main.shake(140, 0.006);
    if (enemy.isBoss) return;

    const result = this.combo.registerKill();
    if (result.tierReached) {
      SoundManager.getInstance().playComboTier(COMBO_BALANCE.tiers.indexOf(result.tierReached));
      this.scene.cameras.main.shake(110, 0.004);
      DebugSessionLogger.getInstance().log('COMBAT', 'INFO', `Combo ${result.combo}: ${result.tierReached.label}`);
    }
    if (result.frenzyTriggered) this.startFrenzy();

    this.tryCorpseExplosion(enemy.x, enemy.y);
  }

  // ---------------------------------------------------------------------------
  // Atualização por quadro
  // ---------------------------------------------------------------------------

  public update(delta: number): void {
    const player = this.ctx.player;
    this.explosionsThisFrame = 0;

    this.combo.windowBonusMs = player.bloodthirstLevel * BLOODTHIRST_BALANCE.comboWindowBonusMs;
    this.combo.frenzyBonusMs = player.bloodthirstLevel * BLOODTHIRST_BALANCE.frenzyDurationBonusMs;

    const ended = this.combo.update(delta);
    if (ended.frenzyEnded) this.endFrenzy();

    if (player.isDashing && player.dashMasteryLevel > 0) this.applyDashDamage();
  }

  // ---------------------------------------------------------------------------
  // Frenesi
  // ---------------------------------------------------------------------------

  private startFrenzy(): void {
    const player = this.ctx.player;
    if (!this.isFrenzyApplied) {
      this.isFrenzyApplied = true;
      player.bonusDamagePercent += COMBO_BALANCE.frenzyDamageBonusPercent;
      player.bonusSpeedPercent += COMBO_BALANCE.frenzySpeedBonusPercent;
      this.frenzyAura?.startFollow(player, 0, 14);
      this.frenzyAura?.start();
    }
    const [r, g, b] = FX_COLORS.frenzyFlash;
    this.scene.cameras.main.flash(260, r, g, b);
    this.scene.cameras.main.shake(220, 0.008);
    SoundManager.getInstance().playFrenzyStart();
    DebugSessionLogger.getInstance().log('COMBAT', 'INFO', `Frenesi ativado no combo ${this.combo.combo}`);
  }

  private endFrenzy(): void {
    if (!this.isFrenzyApplied) return;
    this.isFrenzyApplied = false;
    const player = this.ctx.player;
    // Nunca abaixo de zero: o Modo de Teste pode ter zerado as bênçãos no meio do Frenesi
    player.bonusDamagePercent = Math.max(0, player.bonusDamagePercent - COMBO_BALANCE.frenzyDamageBonusPercent);
    player.bonusSpeedPercent = Math.max(0, player.bonusSpeedPercent - COMBO_BALANCE.frenzySpeedBonusPercent);
    this.frenzyAura?.stop();
  }

  // ---------------------------------------------------------------------------
  // Onda de choque de Level Up
  // ---------------------------------------------------------------------------

  /** Pede a onda de choque para quando a tela de cartas fechar. */
  public queueLevelUpNova(): void {
    this.isNovaQueued = true;
  }

  private fireQueuedNova(): void {
    if (!this.isNovaQueued || this.ctx.isGameOver) return;
    // Vários níveis de uma vez: a onda sai só depois da última escolha
    if (this.ctx.player.pendingLevelUps > 0) return;
    this.isNovaQueued = false;

    const player = this.ctx.player;
    const radius = IMPACT_BALANCE.levelUpNovaRadius;
    this.spawnRing(player.x, player.y, radius, FX_COLORS.novaRing, 420);
    this.sparks?.setParticleTint(FX_COLORS.novaRing);
    this.sparks?.explode(26, player.x, player.y);
    this.scene.cameras.main.shake(160, 0.007);

    const dmg = IMPACT_BALANCE.levelUpNovaDamage * (1 + player.bonusDamagePercent / 100);
    for (const enemy of this.ctx.enemiesGroup.getChildren() as BaseEnemy[]) {
      if (!enemy.active || enemy.isDead) continue;
      const dx = enemy.x - player.x;
      const dy = enemy.y - player.y;
      const dist = Math.hypot(dx, dy);
      if (dist > radius) continue;
      enemy.takeDamage(dmg);
      if (enemy.isBoss || enemy.isDead || dist < 1) continue;
      enemy.applyStun(350);
      const push = (1 - dist / radius) * 46 + 14;
      enemy.x += (dx / dist) * push;
      enemy.y += (dy / dist) * push;
    }
  }

  // ---------------------------------------------------------------------------
  // Esquiva
  // ---------------------------------------------------------------------------

  private handleDashStarted(): void {
    this.dashHits.clear();
    const player = this.ctx.player;
    SoundManager.getInstance().playDash();
    this.sparks?.setParticleTint(FX_COLORS.dashGhost);
    this.sparks?.explode(8, player.x, player.y + 10);
  }

  private applyDashDamage(): void {
    const player = this.ctx.player;
    const dmg = player.dashMasteryLevel * DASH_BALANCE.damagePerCard * (1 + player.bonusDamagePercent / 100);
    for (const enemy of this.ctx.enemiesGroup.getChildren() as BaseEnemy[]) {
      if (!enemy.active || enemy.isDead || this.dashHits.has(enemy)) continue;
      if (Math.hypot(enemy.x - player.x, enemy.y - player.y) > DASH_BALANCE.hitRadius) continue;
      this.dashHits.add(enemy);
      enemy.takeDamage(dmg);
    }
  }

  // ---------------------------------------------------------------------------
  // Explosão de cadáver (carta Alma Instável)
  // ---------------------------------------------------------------------------

  private tryCorpseExplosion(x: number, y: number): void {
    const player = this.ctx.player;
    const level = player.corpseExplosionLevel;
    if (level <= 0) return;
    if (this.explosionsThisFrame >= CORPSE_EXPLOSION_BALANCE.maxPerFrame) return;
    if (Math.random() >= level * CORPSE_EXPLOSION_BALANCE.chancePerCard) return;
    this.explosionsThisFrame++;

    const cfg = CORPSE_EXPLOSION_BALANCE;
    this.spawnRing(x, y, cfg.radius, FX_COLORS.corpseExplosion, 260);
    const now = this.scene.time.now;
    if (now - this.lastExplosionSfxAt > 140) {
      this.lastExplosionSfxAt = now;
      SoundManager.getInstance().playEnemyExplosion();
    }

    const dmg = (cfg.baseDamage + level * cfg.damagePerCard) * (1 + player.bonusDamagePercent / 100);
    for (const enemy of this.ctx.enemiesGroup.getChildren() as BaseEnemy[]) {
      if (!enemy.active || enemy.isDead) continue;
      if (Math.hypot(enemy.x - x, enemy.y - y) > cfg.radius) continue;
      enemy.takeDamage(dmg);
    }
  }

  private spawnRing(x: number, y: number, radius: number, color: number, durationMs: number): void {
    const ring = this.scene.add.circle(x, y, radius, color, 0.22);
    ring.setStrokeStyle(3, color, 0.95);
    ring.setBlendMode(Phaser.BlendModes.ADD);
    ring.setDepth(18);
    ring.setScale(0.15);
    this.scene.tweens.add({
      targets: ring,
      scale: 1,
      alpha: 0,
      duration: durationMs,
      ease: 'Cubic.easeOut',
      onComplete: () => ring.destroy(),
    });
  }
}
