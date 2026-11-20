import Phaser from 'phaser';
import type { BaseCharacter } from '../entities/characters/BaseCharacter';
import type { BaseEnemy } from '../entities/enemies/BaseEnemy';
import type { TransporterEnemy } from '../entities/enemies/TransporterEnemy';
import type { EnemySpawnSystem } from './EnemySpawnSystem';
import { SoundManager } from './SoundManager';
import { DebugSessionLogger } from './DebugSessionLogger';
import { HORDE_EVENT_BALANCE, STORM_BALANCE, PERFORMANCE_LIMITS } from '../config/balance';
import { getEligibleHordeEvents, HordeEventType } from './hordeEventRules';
import { BOSS_TELEGRAPH, FX_COLORS } from '../config/theme';

export type { HordeEventType };

/** O que o sistema usa da HUD (a UIScene cumpre este contrato). */
interface IHordeEventHud {
  showWaveAlert(message: string, durationMs?: number): void;
  showCenterAnnouncement(title: string, subtitle?: string, durationMs?: number): void;
}

/** Contrato mínimo que a cena de jogo expõe para o HordeEventSystem. */
export interface IHordeEventContext {
  readonly player: BaseCharacter;
  readonly enemiesGroup: Phaser.GameObjects.Group;
  readonly gameMode: 'story' | 'endless' | 'sandbox';
  readonly currentChapter: number;
  readonly survivalTimeMs: number;
  readonly isBossFightActive: boolean;
  readonly isHordeSpawningPaused: boolean;
  readonly isGameOver: boolean;
  readonly sandboxAutoSpawn: boolean;
  clampToArena(x: number, y: number, margin?: number): { x: number; y: number };
}

interface StormMarker {
  x: number;
  y: number;
  timer: number;
}

/**
 * HordeEventSystem — o "diretor" da partida: de tempos em tempos quebra a rotina da horda
 * com um evento (Cerco, Emboscada, Transportador, Matilha Alfa, Lua de Sangue) e cuida da
 * Tempestade de Azazel, o perigo ambiental do Capítulo 2.
 */
export class HordeEventSystem {
  private eventTimer: number = HORDE_EVENT_BALANCE.firstEventMs;
  private lastEvent?: HordeEventType;

  /** Transportador vivo (o id interno do evento continua 'thief'). */
  private thief?: TransporterEnemy;
  private thiefTimer = 0;

  private bloodMoonTimer = 0;
  private bloodMoonOverlay?: Phaser.GameObjects.Rectangle;

  private stormTimer: number = STORM_BALANCE.startsAfterMs;
  private stormAnnounced = false;
  private readonly stormMarkers: StormMarker[] = [];
  private stormGraphics?: Phaser.GameObjects.Graphics;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly ctx: IHordeEventContext,
    private readonly spawner: EnemySpawnSystem
  ) {}

  private get hud(): IHordeEventHud | undefined {
    return this.scene.scene.get('UIScene') as unknown as IHordeEventHud | undefined;
  }

  private get minutes(): number {
    return this.ctx.survivalTimeMs / 60000;
  }

  /** Transportador vivo (para o radar e a seta de borda), ou undefined. */
  public get activeThief(): { x: number; y: number; timeLeftMs: number } | undefined {
    const t = this.thief;
    if (!t || !t.active || t.isDead) return undefined;
    return { x: t.x, y: t.y, timeLeftMs: Math.max(0, this.thiefTimer) };
  }

  public get isBloodMoonActive(): boolean {
    return this.bloodMoonTimer > 0;
  }

  /** Multiplicador do intervalo de spawn da horda (menor = mais monstros). */
  public get spawnIntervalMultiplier(): number {
    return this.isBloodMoonActive ? HORDE_EVENT_BALANCE.bloodMoon.spawnIntervalMultiplier : 1;
  }

  /** Bônus de XP do evento em andamento (1 = +100%). */
  public get xpBonus(): number {
    return this.isBloodMoonActive ? HORDE_EVENT_BALANCE.bloodMoon.xpBonus : 0;
  }

  public get hasStorm(): boolean {
    return this.ctx.gameMode === 'story' && STORM_BALANCE.chapters.includes(this.ctx.currentChapter);
  }

  public destroy(): void {
    this.stormMarkers.length = 0;
    this.stormGraphics?.destroy();
    this.stormGraphics = undefined;
    this.bloodMoonOverlay?.destroy();
    this.bloodMoonOverlay = undefined;
    this.thief = undefined;
  }

  public update(delta: number): void {
    if (this.ctx.isGameOver) return;

    this.updateThief(delta);
    this.updateBloodMoon(delta);
    this.updateStormMarkers(delta);

    // Chefe em campo ou altar desperto: nada de evento novo nem raio novo
    const isQuietMoment = this.ctx.isBossFightActive || this.ctx.isHordeSpawningPaused;
    if (isQuietMoment) return;
    if (this.ctx.gameMode === 'sandbox' && !this.ctx.sandboxAutoSpawn) return;

    this.eventTimer -= delta;
    if (this.eventTimer <= 0) {
      this.eventTimer = Phaser.Math.Between(HORDE_EVENT_BALANCE.intervalMinMs, HORDE_EVENT_BALANCE.intervalMaxMs);
      this.triggerRandom();
    }

    if (this.hasStorm) {
      this.stormTimer -= delta;
      if (this.stormTimer <= 0) {
        this.stormTimer = Phaser.Math.Between(STORM_BALANCE.intervalMinMs, STORM_BALANCE.intervalMaxMs);
        this.startStormVolley();
      }
    }
  }

  private triggerRandom(): void {
    const isThiefAlive = !!this.thief && this.thief.active && !this.thief.isDead;
    let pool = getEligibleHordeEvents(this.ctx.gameMode, this.ctx.currentChapter, this.minutes, isThiefAlive, this.isBloodMoonActive);
    // Evita repetir o mesmo evento duas vezes seguidas
    if (pool.length > 1) pool = pool.filter((e) => e !== this.lastEvent);
    this.trigger(Phaser.Math.RND.pick(pool));
  }

  /** Dispara um evento agora (também usado pelo Modo de Teste). */
  public trigger(type: HordeEventType): void {
    this.lastEvent = type;
    SoundManager.getInstance().playHordeEventAlarm();
    DebugSessionLogger.getInstance().log('COMBAT', 'INFO', `Evento de horda: ${type}`);

    switch (type) {
      case 'siege':
        this.startSiege();
        break;
      case 'ambush':
        this.startAmbush();
        break;
      case 'thief':
        this.startThief();
        break;
      case 'elite_pack':
        this.startElitePack();
        break;
      case 'blood_moon':
        this.startBloodMoon();
        break;
    }
  }

  private freeEnemySlots(): number {
    return Math.max(0, PERFORMANCE_LIMITS.MAX_ACTIVE_ENEMIES - this.ctx.enemiesGroup.countActive());
  }

  // ---------------------------------------------------------------------------
  // Cerco: anel de cães fechando sobre o jogador
  // ---------------------------------------------------------------------------
  private startSiege(): void {
    const cfg = HORDE_EVENT_BALANCE.siege;
    const wanted = Math.min(cfg.maxDogs, Math.floor(cfg.baseDogs + this.minutes * cfg.dogsPerMinute));
    const count = Math.min(wanted, this.freeEnemySlots());
    const offset = Phaser.Math.FloatBetween(0, Math.PI * 2);
    const p = this.ctx.player;
    for (let i = 0; i < count; i++) {
      const a = offset + (i / count) * Math.PI * 2;
      this.spawner.spawnScaledDogAt(p.x + Math.cos(a) * cfg.radius, p.y + Math.sin(a) * cfg.radius);
    }
    this.scene.cameras.main.shake(260, 0.008);
    this.hud?.showWaveAlert('CERCO INFERNAL! ROMPA O CÍRCULO!', 3200);
  }

  // ---------------------------------------------------------------------------
  // Emboscada: tudo vem do mesmo lado, em onda
  // ---------------------------------------------------------------------------
  private startAmbush(): void {
    const cfg = HORDE_EVENT_BALANCE.ambush;
    const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
    const p = this.ctx.player;
    for (let i = 0; i < cfg.batFlocks; i++) {
      if (this.freeEnemySlots() < cfg.batsPerFlock) break;
      this.spawner.spawnBloodBatFlock(cfg.batsPerFlock, angle + (i - 1) * 0.28);
    }
    const dogs = Math.min(cfg.dogs, this.freeEnemySlots());
    for (let i = 0; i < dogs; i++) {
      const a = angle + Phaser.Math.FloatBetween(-0.4, 0.4);
      const d = cfg.distance + Phaser.Math.Between(-40, 60);
      this.spawner.spawnScaledDogAt(p.x + Math.cos(a) * d, p.y + Math.sin(a) * d);
    }
    this.hud?.showWaveAlert('EMBOSCADA! ELES VÊM DE UM LADO SÓ!', 3200);
  }

  // ---------------------------------------------------------------------------
  // Transportador: foge com o saco; abater antes do tempo rende uma chuva de recompensas
  // ---------------------------------------------------------------------------
  private startThief(): void {
    if (this.thief && this.thief.active && !this.thief.isDead) return;
    const thief = this.spawner.spawnSoulThief();
    this.thief = thief;
    this.thiefTimer = HORDE_EVENT_BALANCE.thief.lifetimeMs;
    thief.once('enemy-killed', () => {
      if (this.thief === thief) this.thief = undefined;
      this.hud?.showWaveAlert('TRANSPORTADOR ABATIDO! O SACO SE ABRIU!', 2600);
    });
    this.hud?.showCenterAnnouncement('TRANSPORTADOR', 'PEGUE O SACO! SIGA A SETA DOURADA', 2600);
  }

  private updateThief(delta: number): void {
    const thief = this.thief;
    if (!thief) return;
    if (!thief.active || thief.isDead) {
      if (!thief.active) this.thief = undefined;
      return;
    }
    this.thiefTimer -= delta;
    if (this.thiefTimer > 0) return;

    // Tempo esgotado: some numa nuvem, sem recompensa
    this.thief = undefined;
    const ring = this.scene.add.circle(thief.x, thief.y, 30, FX_COLORS.thiefSparkle, 0.6);
    ring.setBlendMode(Phaser.BlendModes.ADD).setDepth(18);
    this.scene.tweens.add({ targets: ring, scale: 2.2, alpha: 0, duration: 320, onComplete: () => ring.destroy() });
    thief.removeAllListeners('enemy-killed');
    this.ctx.enemiesGroup.remove(thief, true, true);
    this.hud?.showWaveAlert('O TRANSPORTADOR ESCAPOU...', 2400);
  }

  // ---------------------------------------------------------------------------
  // Matilha Alfa: elites juntos
  // ---------------------------------------------------------------------------
  private startElitePack(): void {
    const count = Math.min(HORDE_EVENT_BALANCE.elitePack.count, this.freeEnemySlots());
    const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
    const p = this.ctx.player;
    for (let i = 0; i < count; i++) {
      const a = angle + (i - 1) * 0.3;
      this.spawner.spawnScaledDogAt(p.x + Math.cos(a) * 400, p.y + Math.sin(a) * 400, true);
    }
    this.scene.cameras.main.shake(220, 0.01);
    this.hud?.showWaveAlert('MATILHA ALFA NA CAÇADA!', 3000);
  }

  // ---------------------------------------------------------------------------
  // Lua de Sangue: horda mais densa, XP em dobro
  // ---------------------------------------------------------------------------
  private startBloodMoon(): void {
    this.bloodMoonTimer = HORDE_EVENT_BALANCE.bloodMoon.durationMs;
    if (!this.bloodMoonOverlay) {
      const { width, height } = this.scene.scale;
      // Fixo na tela; a câmera amplia a partir do centro, então cobre a visão em qualquer zoom >= 1
      this.bloodMoonOverlay = this.scene.add.rectangle(width / 2, height / 2, width, height, FX_COLORS.bloodMoonOverlay, 1);
      this.bloodMoonOverlay.setScrollFactor(0).setDepth(95).setAlpha(0);
    }
    this.scene.tweens.killTweensOf(this.bloodMoonOverlay);
    this.scene.tweens.add({ targets: this.bloodMoonOverlay, alpha: 0.13, duration: 900, ease: 'Sine.easeOut' });
    this.scene.cameras.main.flash(300, 160, 0, 30);
    this.hud?.showCenterAnnouncement('LUA DE SANGUE', 'HORDA EM DOBRO - XP EM DOBRO', 3200);
  }

  private updateBloodMoon(delta: number): void {
    if (this.bloodMoonTimer <= 0) return;
    this.bloodMoonTimer -= delta;
    if (this.bloodMoonTimer > 0) return;
    this.bloodMoonTimer = 0;
    if (this.bloodMoonOverlay) {
      this.scene.tweens.killTweensOf(this.bloodMoonOverlay);
      this.scene.tweens.add({ targets: this.bloodMoonOverlay, alpha: 0, duration: 1200 });
    }
    this.hud?.showWaveAlert('A LUA DE SANGUE SE PÔS', 2200);
  }

  // ---------------------------------------------------------------------------
  // Tempestade de Azazel (Capítulo 2): raios telegrafados que ferem jogador e monstros
  // ---------------------------------------------------------------------------

  /** Marca uma rajada de raios ao redor do jogador (também usado pelo Modo de Teste). */
  public startStormVolley(): void {
    if (!this.stormAnnounced) {
      this.stormAnnounced = true;
      this.hud?.showCenterAnnouncement('TEMPESTADE DE AZAZEL', 'OS RAIOS TAMBÉM FEREM OS MONSTROS', 3600);
    }
    const p = this.ctx.player;
    const body = p.body as Phaser.Physics.Arcade.Body | null;
    const strikes = Phaser.Math.Between(STORM_BALANCE.strikesMin, STORM_BALANCE.strikesMax);
    for (let i = 0; i < strikes; i++) {
      let x: number;
      let y: number;
      if (i === 0) {
        // O primeiro mira onde o jogador vai estar, para obrigar a mudar de rumo
        const lead = STORM_BALANCE.telegraphMs / 1000 * 0.6;
        x = p.x + (body?.velocity.x ?? 0) * lead;
        y = p.y + (body?.velocity.y ?? 0) * lead;
      } else {
        const a = Phaser.Math.FloatBetween(0, Math.PI * 2);
        const r = Phaser.Math.Between(90, STORM_BALANCE.spread);
        x = p.x + Math.cos(a) * r;
        y = p.y + Math.sin(a) * r;
      }
      const pos = this.ctx.clampToArena(x, y, 60);
      this.stormMarkers.push({ x: pos.x, y: pos.y, timer: STORM_BALANCE.telegraphMs + i * 140 });
    }
  }

  private updateStormMarkers(delta: number): void {
    if (this.stormMarkers.length === 0) {
      this.stormGraphics?.clear();
      return;
    }
    if (!this.stormGraphics) {
      this.stormGraphics = this.scene.add.graphics();
      this.stormGraphics.setDepth(12);
    }
    const g = this.stormGraphics;
    g.clear();
    const radius = STORM_BALANCE.radius;

    for (let i = this.stormMarkers.length - 1; i >= 0; i--) {
      const m = this.stormMarkers[i];
      m.timer -= delta;
      if (m.timer <= 0) {
        this.stormMarkers.splice(i, 1);
        this.strikeLightning(m.x, m.y);
        continue;
      }
      const progress = Phaser.Math.Clamp(1 - m.timer / STORM_BALANCE.telegraphMs, 0, 1);
      g.fillStyle(BOSS_TELEGRAPH.circleFillColor, BOSS_TELEGRAPH.circleFillAlpha(progress));
      g.fillCircle(m.x, m.y, radius * progress);
      g.lineStyle(BOSS_TELEGRAPH.circleBorderThickness(progress), BOSS_TELEGRAPH.circleBorderColor, 0.85);
      g.strokeCircle(m.x, m.y, radius);
      g.lineStyle(BOSS_TELEGRAPH.crosshairThickness, BOSS_TELEGRAPH.innerColor, 0.5 + progress * 0.5);
      g.lineBetween(m.x - 14, m.y, m.x + 14, m.y);
      g.lineBetween(m.x, m.y - 14, m.x, m.y + 14);
    }
  }

  private strikeLightning(x: number, y: number): void {
    const radius = STORM_BALANCE.radius;
    SoundManager.getInstance().playAzazelLightningStrike();
    this.scene.cameras.main.shake(130, 0.009);

    if (this.scene.textures.exists('azazel-lightning-bolt')) {
      const bolt = this.scene.add.image(x, y - 110, 'azazel-lightning-bolt');
      bolt.setDepth(28).setScale(1.25, 1.35).setBlendMode(Phaser.BlendModes.ADD);
      this.scene.tweens.add({ targets: bolt, alpha: 0, scaleX: 0.3, duration: 260, ease: 'Quad.easeOut', onComplete: () => bolt.destroy() });
    }
    const flash = this.scene.add.circle(x, y, radius, FX_COLORS.stormFlash, 0.85);
    flash.setDepth(20).setBlendMode(Phaser.BlendModes.ADD);
    this.scene.tweens.add({ targets: flash, scale: 1.25, alpha: 0, duration: 280, onComplete: () => flash.destroy() });

    const p = this.ctx.player;
    if (Math.hypot(p.x - x, p.y - y) <= radius) {
      p.takeDamage(STORM_BALANCE.playerDamage);
    }

    const enemyDamage = STORM_BALANCE.enemyDamage + this.minutes * STORM_BALANCE.enemyDamagePerMinute;
    for (const enemy of this.ctx.enemiesGroup.getChildren() as BaseEnemy[]) {
      if (!enemy.active || enemy.isDead || enemy.isBoss) continue;
      if (Math.hypot(enemy.x - x, enemy.y - y) <= radius) enemy.takeDamage(enemyDamage);
    }
  }
}
