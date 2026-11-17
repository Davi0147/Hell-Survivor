import Phaser from 'phaser';
import type { BaseEnemy } from '../entities/enemies/BaseEnemy';
import type { BaseCharacter } from '../entities/characters/BaseCharacter';
import { SoundManager } from './SoundManager';
import { DebugSessionLogger } from './DebugSessionLogger';
import { ULTIMATE_BALANCE } from '../config/balance';
import { FONTS, FX_COLORS, COLORS } from '../config/theme';

/** O que a Suprema usa da HUD (a UIScene cumpre este contrato). */
interface IUltimateHud {
  setHUDVisible(visible: boolean): void;
}

/** O que a Suprema precisa do personagem: qualquer BaseCharacter com rastro opcional. */
type UltimatePlayer = BaseCharacter & { afterimageTint?: number };

/** Contrato mínimo que a cena de jogo expõe para a Suprema. */
export interface IUltimateContext {
  readonly player: UltimatePlayer;
  readonly enemiesGroup: Phaser.GameObjects.Group;
  readonly isGameOver: boolean;
  clearAllPoisonPuddles(): void;
}

/**
 * UltimateSystem — Suprema "Ascensão Infernal".
 * 1. Cut-in cinematográfico (arte da Nixy) com a heroína intocável.
 * 2. Explosão de abertura que empurra e fere a horda ao redor.
 * 3. Modo de poder: armas aceleradas, +dano, +velocidade, aura de chamas, runa girando
 *    sob os pés, rastro fantasma e um pulso de fogo por segundo.
 * 4. Desfecho com uma explosão final.
 * Os números moram em `ULTIMATE_BALANCE` (src/config/balance.ts).
 */
export class UltimateSystem {
  private remainingMs = 0;
  private pulseTimer = 0;

  private aura?: Phaser.GameObjects.Particles.ParticleEmitter;
  private embers?: Phaser.GameObjects.Particles.ParticleEmitter;
  private rune?: Phaser.GameObjects.Image;
  private vignette?: Phaser.FX.Vignette;
  private timerText?: Phaser.GameObjects.Text;

  constructor(private readonly scene: Phaser.Scene, private readonly ctx: IUltimateContext) {}

  public get isActive(): boolean {
    return this.remainingMs > 0;
  }

  /** Fração (0 a 1) do poder que ainda resta. */
  public get remainingRatio(): number {
    return this.isActive ? this.remainingMs / ULTIMATE_BALANCE.durationMs : 0;
  }

  public activate(): void {
    const player = this.ctx.player;
    if (player.isUltimateActive || this.isActive) return;

    const cfg = ULTIMATE_BALANCE;
    player.isUltimateActive = true;
    player.ultimateCharge = player.maxUltimateCharge;
    player.grantIntangibility(cfg.castInvulnerableMs);

    player.bonusDamagePercent += cfg.damageBonusPercent;
    player.bonusSpeedPercent += cfg.speedBonusPercent;
    player.weaponHasteMultiplier *= cfg.weaponHasteMultiplier;
    player.afterimageTint = FX_COLORS.ultAfterimage;

    this.remainingMs = cfg.durationMs;
    this.pulseTimer = cfg.pulse.intervalMs;

    this.ctx.clearAllPoisonPuddles();
    this.playCutIn();
    this.startVisuals();
    this.blast(cfg.openingBlast.radius, cfg.openingBlast.damage, cfg.openingBlast.pushPx);

    DebugSessionLogger.getInstance().log('COMBAT', 'INFO', 'Suprema ativada: Ascensão Infernal');
  }

  public update(delta: number): void {
    if (!this.isActive) return;
    const player = this.ctx.player;

    this.remainingMs -= delta;
    // O frasco da HUD esvazia junto com o poder
    player.ultimateCharge = player.maxUltimateCharge * Math.max(0, this.remainingRatio);

    if (this.rune) {
      this.rune.setPosition(player.x, player.y + 14);
      this.rune.rotation += delta * 0.003;
      this.rune.setScale(1.25 + Math.sin(this.scene.time.now * 0.01) * 0.08);
    }
    if (this.timerText) {
      this.timerText.setPosition(player.x, player.y - 46);
      this.timerText.setText((Math.max(0, this.remainingMs) / 1000).toFixed(1));
      // Últimos 2 segundos: o número pisca para avisar que vai acabar
      this.timerText.setAlpha(this.remainingMs < 2000 && Math.floor(this.remainingMs / 120) % 2 === 0 ? 0.35 : 1);
    }

    this.pulseTimer -= delta;
    if (this.pulseTimer <= 0) {
      this.pulseTimer = ULTIMATE_BALANCE.pulse.intervalMs;
      this.blast(ULTIMATE_BALANCE.pulse.radius, ULTIMATE_BALANCE.pulse.damage, 0, true);
    }

    if (this.remainingMs <= 0) this.finish(true);
  }

  /** Encerra o modo de poder (com explosão final, ou em silêncio se a partida acabou). */
  public finish(withFinale: boolean): void {
    if (!this.isActive && !this.ctx.player.isUltimateActive) return;
    const cfg = ULTIMATE_BALANCE;
    const player = this.ctx.player;

    if (withFinale && !this.ctx.isGameOver) {
      this.blast(cfg.finale.radius, cfg.finale.damage, cfg.finale.pushPx);
      const [r, g, b] = FX_COLORS.ultFlash;
      this.scene.cameras.main.flash(220, r, g, b);
    }

    this.remainingMs = 0;
    player.isUltimateActive = false;
    player.ultimateCharge = 0;
    player.bonusDamagePercent = Math.max(0, player.bonusDamagePercent - cfg.damageBonusPercent);
    player.bonusSpeedPercent = Math.max(0, player.bonusSpeedPercent - cfg.speedBonusPercent);
    player.weaponHasteMultiplier = Math.max(1, player.weaponHasteMultiplier / cfg.weaponHasteMultiplier);
    player.afterimageTint = undefined;
    this.stopVisuals();
  }

  public destroy(): void {
    this.stopVisuals();
    this.remainingMs = 0;
  }

  // ---------------------------------------------------------------------------
  // Golpes de área (abertura, pulsos e desfecho)
  // ---------------------------------------------------------------------------

  private blast(radius: number, damage: number, pushPx: number, isPulse: boolean = false): void {
    const player = this.ctx.player;
    const x = player.x;
    const y = player.y;

    const ring = this.scene.add.circle(x, y, radius, isPulse ? FX_COLORS.ultAura : FX_COLORS.ultRing, isPulse ? 0.12 : 0.28);
    ring.setStrokeStyle(isPulse ? 2 : 4, isPulse ? FX_COLORS.ultAuraHot : FX_COLORS.ultRing, 0.95);
    ring.setBlendMode(Phaser.BlendModes.ADD).setDepth(18).setScale(0.1);
    this.scene.tweens.add({
      targets: ring,
      scale: 1,
      alpha: 0,
      duration: isPulse ? 360 : 520,
      ease: 'Cubic.easeOut',
      onComplete: () => ring.destroy(),
    });

    if (!isPulse) {
      this.scene.cameras.main.shake(220, 0.012);
      SoundManager.getInstance().playMeteorImpact();
      this.embers?.explode(36, x, y);
      if (this.scene.textures.exists('explosion-1') && this.scene.anims.exists('anim-explosion')) {
        const boom = this.scene.add.sprite(x, y, 'explosion-1');
        boom.setDepth(25).setScale((radius * 1.6) / 200).setBlendMode(Phaser.BlendModes.ADD);
        boom.play('anim-explosion');
        boom.once('animationcomplete', () => boom.destroy());
      }
    } else {
      SoundManager.getInstance().playHellfireBurst();
    }

    const dmg = damage * (1 + player.bonusDamagePercent / 100);
    for (const enemy of this.ctx.enemiesGroup.getChildren() as BaseEnemy[]) {
      if (!enemy.active || enemy.isDead) continue;
      const dx = enemy.x - x;
      const dy = enemy.y - y;
      const dist = Math.hypot(dx, dy);
      if (dist > radius) continue;
      enemy.takeDamage(dmg);
      if (pushPx > 0 && !enemy.isBoss && !enemy.isDead && dist > 1) {
        const push = pushPx * (1 - dist / radius) + 12;
        enemy.x += (dx / dist) * push;
        enemy.y += (dy / dist) * push;
        enemy.applyStun(400);
      }
    }
  }

  // ---------------------------------------------------------------------------
  // Efeitos contínuos do modo de poder
  // ---------------------------------------------------------------------------

  private startVisuals(): void {
    const player = this.ctx.player;
    const hasSpark = this.scene.textures.exists('particle-spark');

    if (hasSpark) {
      // Chamas subindo do corpo
      this.aura = this.scene.add.particles(0, 0, 'particle-spark', {
        speed: { min: 30, max: 90 },
        angle: { min: 245, max: 295 },
        scale: { start: 2.2, end: 0 },
        alpha: { start: 0.95, end: 0 },
        lifespan: { min: 320, max: 560 },
        frequency: 22,
        tint: [FX_COLORS.ultAura, FX_COLORS.ultAuraHot],
        emitZone: { type: 'random', source: new Phaser.Geom.Circle(0, 0, 16), quantity: 1 } as Phaser.Types.GameObjects.Particles.EmitZoneData,
        blendMode: Phaser.BlendModes.ADD,
      });
      this.aura.setDepth(player.depth - 1);
      this.aura.startFollow(player, 0, 6);

      // Faíscas das explosões (usadas por abertura e desfecho)
      this.embers = this.scene.add.particles(0, 0, 'particle-spark', {
        speed: { min: 120, max: 340 },
        angle: { min: 0, max: 360 },
        scale: { start: 2, end: 0 },
        alpha: { start: 1, end: 0 },
        lifespan: { min: 260, max: 520 },
        tint: [FX_COLORS.ultAuraHot, FX_COLORS.ultRing],
        blendMode: Phaser.BlendModes.ADD,
        emitting: false,
      });
      this.embers.setDepth(150);
    }

    // Runa de invocação girando sob os pés
    const runeKey = this.scene.textures.exists('respawn-star-6') ? 'respawn-star-6' : undefined;
    if (runeKey) {
      this.rune = this.scene.add.image(player.x, player.y + 14, runeKey);
      this.rune.setBlendMode(Phaser.BlendModes.ADD).setDepth(player.depth - 2).setTint(FX_COLORS.ultRune).setAlpha(0.85);
    }

    // Contador do tempo restante sobre a cabeça
    this.timerText = this.scene.add.text(player.x, player.y - 46, '', {
      fontFamily: FONTS.display,
      fontSize: '14px',
      fontStyle: 'bold',
      color: FX_COLORS.ultTimerText,
      stroke: COLORS.strokeBlack,
      strokeThickness: 4,
    }).setOrigin(0.5).setDepth(205);

    // Bordas da tela escurecem (só funciona no WebGL; no Canvas segue sem)
    try {
      this.vignette = this.scene.cameras.main.postFX?.addVignette(0.5, 0.5, 0.82, 0.38);
    } catch {
      this.vignette = undefined;
    }
  }

  private stopVisuals(): void {
    this.aura?.destroy();
    this.aura = undefined;
    const embers = this.embers;
    this.embers = undefined;
    // Deixa as últimas faíscas terminarem antes de destruir o emissor
    if (embers) this.scene.time.delayedCall(600, () => embers.destroy());
    this.rune?.destroy();
    this.rune = undefined;
    this.timerText?.destroy();
    this.timerText = undefined;
    if (this.vignette) {
      try {
        this.scene.cameras.main.postFX?.remove(this.vignette);
      } catch {
        // Câmera já destruída na troca de cena
      }
      this.vignette = undefined;
    }
  }

  // ---------------------------------------------------------------------------
  // Cut-in cinematográfico (arte em 3 quadros da Nixy)
  // ---------------------------------------------------------------------------

  private playCutIn(): void {
    const scene = this.scene;
    const { width, height } = scene.scale;
    const cameras = scene.cameras.main;
    const hud = scene.scene.get('UIScene') as unknown as IUltimateHud | undefined;
    hud?.setHUDVisible(false);
    SoundManager.getInstance().playFrenzyStart();

    const cutIn = scene.add.container(0, 0);
    cutIn.setScrollFactor(0).setDepth(400);

    const backdrop = scene.add.rectangle(width / 2, height / 2, width, height, COLORS.black, 0.8);
    cutIn.add(backdrop);

    const bannerY = Math.round(height * 0.5);
    const hasBanner = scene.textures.exists('nixy-ult-cutin-1');
    const banner = hasBanner ? scene.add.sprite(width / 2, bannerY, 'nixy-ult-cutin-1').setScale(3.15) : undefined;
    if (banner) cutIn.add(banner);

    const textGroup = scene.add.container(-width * 0.75, 0);
    cutIn.add(textGroup);

    const title = scene.add.text(0, bannerY + 140, 'ASCENSÃO INFERNAL', {
      fontFamily: FONTS.display,
      fontSize: '48px',
      fontStyle: 'bold',
      color: FX_COLORS.ultTitle,
      stroke: FX_COLORS.ultTitleStroke,
      strokeThickness: 8,
      align: 'center',
      shadow: { offsetX: 0, offsetY: 4, color: FX_COLORS.ultTitleGlow, blur: 16, stroke: true, fill: true },
    }).setOrigin(0.5).setResolution(2);

    const sub = scene.add.text(0, bannerY + 184, 'ARMAS ACELERADAS  •  +DANO  •  +VELOCIDADE', {
      fontFamily: FONTS.display,
      fontSize: '16px',
      fontStyle: 'bold',
      color: FX_COLORS.ultSubtitle,
      stroke: COLORS.strokeBlack,
      strokeThickness: 5,
      align: 'center',
    }).setOrigin(0.5).setResolution(2);
    textGroup.add([title, sub]);

    scene.tweens.add({ targets: textGroup, x: width / 2, duration: 240, ease: 'Cubic.easeOut' });

    scene.time.delayedCall(160, () => {
      if (!cutIn.scene) return;
      banner?.setTexture('nixy-ult-cutin-2');
      cameras.shake(100, 0.006);

      scene.time.delayedCall(200, () => {
        if (!cutIn.scene) return;
        banner?.setTexture('nixy-ult-cutin-3');
        cameras.shake(250, 0.018);
        cameras.flash(140, 255, 255, 255);
        scene.tweens.add({ targets: [title, sub], scaleX: 1.15, scaleY: 1.15, duration: 100, yoyo: true });

        scene.time.delayedCall(380, () => {
          scene.tweens.add({ targets: textGroup, x: width + 600, duration: 160, ease: 'Quad.easeIn' });
          scene.tweens.add({
            targets: cutIn,
            alpha: 0,
            duration: 160,
            ease: 'Quad.easeIn',
            onComplete: () => {
              cutIn.destroy();
              hud?.setHUDVisible(true);
            },
          });
        });
      });
    });
  }
}
