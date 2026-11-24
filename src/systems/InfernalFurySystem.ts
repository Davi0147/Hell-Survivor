import Phaser from 'phaser';
import type { BaseEnemy } from '../entities/enemies/BaseEnemy';
import { INFERNAL_FURY_BALANCE } from '../config/balance';
import { FX_COLORS } from '../config/theme';
import { InfernalFuryRoller } from './infernalFuryRules';
import { SoundManager } from './SoundManager';
import { DebugSessionLogger } from './DebugSessionLogger';

/** O que o sistema usa da HUD (a UIScene cumpre este contrato). */
interface IFuryHud {
  showWaveAlert(message: string, durationMs?: number): void;
  showCenterAnnouncement(title: string, subtitle?: string, durationMs?: number): void;
}

/** Contrato mínimo que a cena de jogo expõe para a Fúria do Inferno. */
export interface IInfernalFuryContext {
  readonly player: { readonly currentLevel: number; readonly pendingLevelUps: number };
  readonly enemiesGroup: Phaser.GameObjects.Group;
  readonly gameMode: 'story' | 'endless' | 'sandbox';
  readonly isBossFightActive: boolean;
  readonly isEncounterQuiet?: boolean;
  readonly isGameOver: boolean;
}

interface SpeedBoost {
  original: number;
  boosted: number;
}

/**
 * Fúria do Inferno (Infinito): sorteada a cada nível ganho. Por 30 s a horda bate e aguenta mais,
 * corre mais e dá mais XP; a tela fica avermelhada, brasas sobem e a câmera dá tremidas curtas.
 * Chefes e minichefes não mudam, e a fúria se apaga se um chefe entrar em campo.
 */
export class InfernalFurySystem {
  private readonly roller = new InfernalFuryRoller();
  private timerMs = 0;
  private shakeTimerMs = 0;
  /** Sorteada no level up; começa quando a tela de cartas fechar. */
  private pendingStart = false;
  private overlay?: Phaser.GameObjects.Rectangle;
  private embers?: Phaser.GameObjects.Particles.ParticleEmitter;
  private readonly boosts = new Map<BaseEnemy, SpeedBoost>();

  constructor(private readonly scene: Phaser.Scene, private readonly ctx: IInfernalFuryContext) {}

  private get hud(): IFuryHud | undefined {
    return this.scene.scene.get('UIScene') as unknown as IFuryHud | undefined;
  }

  public get isActive(): boolean {
    return this.timerMs > 0;
  }

  public get timeLeftMs(): number {
    return Math.max(0, this.timerMs);
  }

  public get xpBonus(): number {
    return this.isActive ? INFERNAL_FURY_BALANCE.xpBonus : 0;
  }

  /** Multiplica com a Pressão do Abismo em `GameScene.enemyStrengthMultiplier`. */
  public get strengthMultiplier(): number {
    return this.isActive ? INFERNAL_FURY_BALANCE.strengthMultiplier : 1;
  }

  /** Chamar a cada nível ganho (evento 'player-level-up'). */
  public onLevelUp(level: number): void {
    if (this.ctx.gameMode !== 'endless' || this.ctx.isGameOver) return;
    // Chefe, calmaria ou fúria em andamento: este nível não sorteia (nem conta para a chance)
    if (this.isActive || this.pendingStart || this.ctx.isBossFightActive || this.ctx.isEncounterQuiet) return;
    const chance = this.roller.currentChance;
    if (this.roller.onLevelUp(level, Math.random())) {
      this.pendingStart = true;
      DebugSessionLogger.getInstance().log('COMBAT', 'INFO', `Fúria do Inferno sorteada no nível ${level} (chance ${Math.round(chance * 100)}%)`);
    }
  }

  /** Começa agora (também usado pelo Modo de Teste, em qualquer modo). */
  public start(): void {
    this.pendingStart = false;
    this.roller.markTriggered(this.ctx.player.currentLevel);
    this.timerMs = INFERNAL_FURY_BALANCE.durationMs;
    this.shakeTimerMs = 0;
    this.showVisuals();
    SoundManager.getInstance().playHordeEventAlarm();
    this.scene.cameras.main.flash(220, 200, 40, 0);
    this.hud?.showCenterAnnouncement(
      'FÚRIA DO INFERNO',
      `MONSTROS MAIS FORTES E RÁPIDOS - +${Math.round(INFERNAL_FURY_BALANCE.xpBonus * 100)}% XP`,
      3200
    );
    DebugSessionLogger.getInstance().log('COMBAT', 'INFO', `Fúria do Inferno começou (${INFERNAL_FURY_BALANCE.durationMs / 1000}s)`);
  }

  public update(delta: number): void {
    if (this.ctx.isGameOver) return;

    if (this.pendingStart && this.ctx.player.pendingLevelUps <= 0) {
      if (this.ctx.isBossFightActive || this.ctx.isEncounterQuiet) this.pendingStart = false;
      else this.start();
    }
    if (!this.isActive) return;

    if (this.ctx.isBossFightActive) {
      this.end('A FÚRIA SE APAGOU COM A CHEGADA DO CHEFE');
      return;
    }

    this.timerMs -= delta;
    if (this.timerMs <= 0) {
      this.end('A FÚRIA DO INFERNO SE APAGOU');
      return;
    }

    this.shakeTimerMs -= delta;
    if (this.shakeTimerMs <= 0) {
      this.shakeTimerMs = INFERNAL_FURY_BALANCE.shakeEveryMs;
      this.scene.cameras.main.shake(INFERNAL_FURY_BALANCE.shakeDurationMs, INFERNAL_FURY_BALANCE.shakeIntensity);
    }

    this.applySpeedBoosts();
  }

  public destroy(): void {
    this.restoreSpeeds();
    this.overlay?.destroy();
    this.overlay = undefined;
    this.embers?.destroy();
    this.embers = undefined;
    this.timerMs = 0;
    this.pendingStart = false;
  }

  private end(message: string): void {
    this.timerMs = 0;
    this.restoreSpeeds();
    this.hideVisuals();
    this.hud?.showWaveAlert(message, 2200);
    DebugSessionLogger.getInstance().log('COMBAT', 'INFO', 'Fúria do Inferno terminou');
  }

  /**
   * Cada monstro escolhe a própria velocidade (e alguns a trocam no bote), então em vez de mexer no
   * corpo a cada quadro guardamos a velocidade base e aplicamos o multiplicador nela. Se o monstro
   * renascer do pool (spawn() regrava `speed`), o valor novo vira a base.
   */
  private applySpeedBoosts(): void {
    const mult = INFERNAL_FURY_BALANCE.speedMultiplier;
    for (const e of this.ctx.enemiesGroup.getChildren() as BaseEnemy[]) {
      // isBoss também marca os minichefes (Ghoul e Lyn)
      if (!e.active || e.isDead || e.isBoss) continue;
      const b = this.boosts.get(e);
      if (b && e.speed === b.boosted) continue;
      const boosted = e.speed * mult;
      this.boosts.set(e, { original: e.speed, boosted });
      e.speed = boosted;
    }
  }

  private restoreSpeeds(): void {
    for (const [e, b] of this.boosts) {
      if (e.speed === b.boosted) e.speed = b.original;
    }
    this.boosts.clear();
  }

  private showVisuals(): void {
    const { width, height } = this.scene.scale;
    if (!this.overlay) {
      // Fixo na tela; a câmera amplia a partir do centro, então cobre a visão em qualquer zoom >= 1
      this.overlay = this.scene.add.rectangle(width / 2, height / 2, width, height, FX_COLORS.infernalFuryOverlay, 1);
      this.overlay.setScrollFactor(0).setDepth(95).setAlpha(0);
    }
    this.scene.tweens.killTweensOf(this.overlay);
    this.scene.tweens.add({ targets: this.overlay, alpha: INFERNAL_FURY_BALANCE.overlayAlpha, duration: 700, ease: 'Sine.easeOut' });

    // Recria a cada fúria: o zoom da câmera pode ter mudado desde a última
    this.embers?.destroy();
    this.embers = undefined;
    if (this.scene.textures.exists('particle-spark')) {
      // Objetos fixos na tela também sofrem o zoom da câmera (ampliado a partir do centro):
      // só a faixa central de largura/zoom aparece, então as brasas nascem dentro dela
      const zoom = Math.max(1, this.scene.cameras.main.zoom);
      const halfW = width / (2 * zoom);
      const halfH = height / (2 * zoom);
      this.embers = this.scene.add.particles(0, 0, 'particle-spark', {
        x: { min: width / 2 - halfW, max: width / 2 + halfW },
        y: { min: height / 2 - halfH * 0.2, max: height / 2 + halfH },
        speedY: { min: -75, max: -35 },
        speedX: { min: -12, max: 12 },
        scale: { start: 1.4, end: 0 },
        alpha: { start: 0.95, end: 0 },
        lifespan: { min: 1400, max: 2400 },
        frequency: 1000 / INFERNAL_FURY_BALANCE.embersPerSecond,
        tint: FX_COLORS.infernalFuryEmber,
        blendMode: Phaser.BlendModes.ADD,
        emitting: false,
      });
      this.embers.setScrollFactor(0).setDepth(96);
    }
    this.embers?.start();
  }

  private hideVisuals(): void {
    this.embers?.stop();
    if (this.overlay) {
      this.scene.tweens.killTweensOf(this.overlay);
      this.scene.tweens.add({ targets: this.overlay, alpha: 0, duration: 1200 });
    }
  }
}
