import Phaser from 'phaser';
import type { ComboTracker } from '../systems/ComboTracker';
import { COMBO_BALANCE } from '../config/balance';
import { FONTS, FX_COLORS } from '../config/theme';

/** Abaixo disto o contador nem aparece, para não poluir a tela no começo. */
const MIN_COMBO_TO_SHOW = 3;
const BAR_WIDTH = 170;
const BAR_HEIGHT = 8;
/** Combo em que o número chega ao tamanho máximo. */
const FULL_SIZE_COMBO = 200;
/** Posição (distância da borda direita e altura): normal e no celular, longe dos botões de toque. */
const COMBO_OFFSET_X = 200;
const COMBO_Y = 210;
const COMBO_TOUCH_OFFSET_X = 340;
const COMBO_TOUCH_Y = 150;

/**
 * Contador de combo da HUD. Quanto maior a sequência, mais "quente" ele fica:
 * cresce, muda de cor, treme, balança e solta faíscas. Cada degrau novo entra com
 * um carimbo do nome e uma explosão de partículas.
 */
export class ComboHud {
  private readonly container: Phaser.GameObjects.Container;
  private readonly countText: Phaser.GameObjects.Text;
  private readonly echoText: Phaser.GameObjects.Text;
  private readonly tierText: Phaser.GameObjects.Text;
  private readonly frenzyText: Phaser.GameObjects.Text;
  private readonly bar: Phaser.GameObjects.Graphics;
  private readonly sparks?: Phaser.GameObjects.Particles.ParticleEmitter;

  private originX: number;
  private originY: number;
  private touchLayout = false;

  private lastCombo = 0;
  private lastHeat = -1;
  private lastTierLabel = '';
  private wasFrenzy = false;
  /** Multiplicador de escala do "pulo" a cada abate (volta a 1 sozinho). */
  private pop = { scale: 1 };
  private popTween?: Phaser.Tweens.Tween;

  constructor(private readonly ui: Phaser.Scene) {
    const { width } = ui.scale;
    this.originX = width - COMBO_OFFSET_X;
    this.originY = COMBO_Y;

    if (ui.textures.exists('particle-spark')) {
      this.sparks = ui.add.particles(0, 0, 'particle-spark', {
        speed: { min: 80, max: 260 },
        angle: { min: 200, max: 340 },
        gravityY: 320,
        scale: { start: 2.4, end: 0.2 },
        alpha: { start: 1, end: 0 },
        lifespan: { min: 300, max: 650 },
        blendMode: Phaser.BlendModes.ADD,
        emitting: false,
      });
      this.sparks.setDepth(60);
    }

    this.container = ui.add.container(this.originX, this.originY);
    this.container.setDepth(61);
    this.container.setAlpha(0);

    const countStyle: Phaser.Types.GameObjects.Text.TextStyle = {
      fontFamily: FONTS.display,
      fontSize: '64px',
      fontStyle: 'bold',
      color: FX_COLORS.comboHeat[0],
      stroke: FX_COLORS.comboStroke,
      strokeThickness: 9,
    };
    // Eco: cópia do número que expande e some a cada degrau
    this.echoText = ui.add.text(0, 0, '', countStyle).setOrigin(0.5).setAlpha(0);
    this.countText = ui.add.text(0, 0, '', countStyle).setOrigin(0.5);

    this.tierText = ui.add.text(0, 50, '', {
      fontFamily: FONTS.body,
      fontSize: '15px',
      fontStyle: 'bold',
      color: FX_COLORS.comboTierText,
      stroke: FX_COLORS.comboStroke,
      strokeThickness: 4,
    }).setOrigin(0.5);

    this.bar = ui.add.graphics();

    this.frenzyText = ui.add.text(0, 104, 'FRENESI!', {
      fontFamily: FONTS.display,
      fontSize: '34px',
      fontStyle: 'bold',
      color: FX_COLORS.frenzyText,
      stroke: FX_COLORS.comboStroke,
      strokeThickness: 7,
    }).setOrigin(0.5).setVisible(false);

    this.container.add([this.echoText, this.countText, this.tierText, this.bar, this.frenzyText]);
  }

  /**
   * Toque: sobe e vai para a esquerda, para não ficar atrás dos botões de corrida e esquiva
   * (que ocupam a lateral direita no celular).
   */
  public setTouchLayout(isTouch: boolean): void {
    if (this.touchLayout === isTouch) return;
    this.touchLayout = isTouch;
    const { width } = this.ui.scale;
    this.originX = isTouch ? width - COMBO_TOUCH_OFFSET_X : width - COMBO_OFFSET_X;
    this.originY = isTouch ? COMBO_TOUCH_Y : COMBO_Y;
    this.container.setPosition(this.originX, this.originY);
  }

  /** Some junto com o resto da HUD. */
  public getHudElement(): Phaser.GameObjects.Container {
    return this.container;
  }

  /** "Calor" do combo: 0 antes do primeiro degrau, depois 1 por degrau alcançado. */
  private getHeat(combo: ComboTracker): number {
    const tier = combo.currentTier;
    return tier ? COMBO_BALANCE.tiers.indexOf(tier) + 1 : 0;
  }

  public update(combo: ComboTracker): void {
    const count = combo.combo;
    const isFrenzy = combo.isFrenzyActive;
    const shouldShow = count >= MIN_COMBO_TO_SHOW || isFrenzy;
    const heat = this.getHeat(combo);
    const now = this.ui.time.now;

    // Aparece na hora, some devagar quando o combo quebra
    const targetAlpha = shouldShow ? 1 : 0;
    this.container.setAlpha(Phaser.Math.Linear(this.container.alpha, targetAlpha, shouldShow ? 0.5 : 0.06));

    if (count !== this.lastCombo) {
      if (count > this.lastCombo && count >= MIN_COMBO_TO_SHOW) {
        this.countText.setText(`x${count}`);
        this.kick(count % 10 === 0 ? 1.55 : 1.22 + heat * 0.03);
        // A partir do segundo degrau, cada abate solta faíscas do número
        if (heat >= 2 && this.sparks) {
          this.sparks.setParticleTint(Phaser.Display.Color.HexStringToColor(this.heatColor(heat)).color);
          this.sparks.explode(heat, this.originX, this.originY);
        }
      } else if (count === 0 && this.lastCombo >= MIN_COMBO_TO_SHOW) {
        // Combo quebrado: o número "esfria" antes de sumir
        this.countText.setColor(FX_COLORS.comboBroken);
        this.lastHeat = -1;
      }
      this.lastCombo = count;
    }

    if (count > 0 && heat !== this.lastHeat) {
      const isTierUp = heat > this.lastHeat && this.lastHeat >= 0 && heat > 0;
      this.lastHeat = heat;
      this.countText.setColor(this.heatColor(heat));
      if (isTierUp) this.celebrateTier(heat);
    }

    const tierLabel = combo.currentTier?.label ?? 'COMBO';
    if (tierLabel !== this.lastTierLabel) {
      this.lastTierLabel = tierLabel;
      const bonus = combo.currentTier ? `  +${Math.round(combo.currentTier.xpBonus * 100)}% XP` : '';
      this.tierText.setText(`${tierLabel}${bonus}`);
      this.tierText.setColor(this.heatColor(heat));
    }

    // Tamanho, tremor e balanço crescem com o combo; no Frenesi tudo fica mais violento
    const growth = 1 + Math.min(1, count / FULL_SIZE_COMBO) * 0.75;
    const fury = heat + (isFrenzy ? 2 : 0);
    const pulse = 1 + Math.sin(now * 0.012) * 0.025 * fury;
    this.countText.setScale(growth * pulse * this.pop.scale);
    const shake = fury * 1.15;
    this.countText.setPosition(
      shake > 0 ? Phaser.Math.FloatBetween(-shake, shake) : 0,
      shake > 0 ? Phaser.Math.FloatBetween(-shake, shake) : 0
    );
    this.countText.setAngle(Math.sin(now * (0.006 + fury * 0.0018)) * fury * 1.8);

    // O resto do bloco desce conforme o número cresce
    const below = 34 * growth + 18;
    this.tierText.setY(below);
    this.frenzyText.setY(below + 52);

    this.bar.clear();
    if (count > 0) {
      const by = below + 16;
      this.bar.fillStyle(FX_COLORS.comboBarBg, 0.9);
      this.bar.fillRect(-BAR_WIDTH / 2 - 2, by - 2, BAR_WIDTH + 4, BAR_HEIGHT + 4);
      // A barra pisca quando o tempo está acabando
      const isUrgent = combo.windowRatio < 0.3 && Math.floor(now / 90) % 2 === 0;
      this.bar.fillStyle(isUrgent ? FX_COLORS.comboBarUrgent : FX_COLORS.comboBar, 1);
      this.bar.fillRect(-BAR_WIDTH / 2, by, BAR_WIDTH * combo.windowRatio, BAR_HEIGHT);
    }

    // Brasas contínuas a partir do terceiro degrau
    if (this.sparks && fury >= 3 && count > 0 && Math.random() < 0.08 * fury) {
      this.sparks.setParticleTint(Phaser.Display.Color.HexStringToColor(this.heatColor(heat)).color);
      this.sparks.explode(1, this.originX + Phaser.Math.Between(-50, 50), this.originY + 10);
    }

    if (isFrenzy !== this.wasFrenzy) {
      this.wasFrenzy = isFrenzy;
      this.frenzyText.setVisible(isFrenzy);
      this.ui.tweens.killTweensOf(this.frenzyText);
      this.frenzyText.setScale(1);
      if (isFrenzy) {
        this.frenzyText.setScale(2.4);
        this.ui.tweens.add({
          targets: this.frenzyText,
          scaleX: 1,
          scaleY: 1,
          duration: 220,
          ease: 'Back.easeOut',
          onComplete: () => {
            this.ui.tweens.add({
              targets: this.frenzyText,
              scaleX: 1.2,
              scaleY: 1.2,
              duration: 220,
              yoyo: true,
              repeat: -1,
              ease: 'Sine.easeInOut',
            });
          },
        });
      }
    }
  }

  private heatColor(heat: number): string {
    const colors = FX_COLORS.comboHeat;
    return colors[Math.max(0, Math.min(colors.length - 1, heat))];
  }

  /** Pulo do número a cada abate. */
  private kick(scale: number): void {
    this.popTween?.stop();
    this.pop.scale = scale;
    this.popTween = this.ui.tweens.add({
      targets: this.pop,
      scale: 1,
      duration: 190,
      ease: 'Back.easeOut',
    });
  }

  /** Degrau novo: eco do número, carimbo do nome e chuva de faíscas. */
  private celebrateTier(heat: number): void {
    this.kick(2.1);

    this.echoText.setText(this.countText.text);
    this.echoText.setColor(this.heatColor(heat));
    this.echoText.setScale(this.countText.scaleX);
    this.echoText.setAlpha(0.85);
    this.ui.tweens.killTweensOf(this.echoText);
    this.ui.tweens.add({
      targets: this.echoText,
      scaleX: this.countText.scaleX * 2.6,
      scaleY: this.countText.scaleY * 2.6,
      alpha: 0,
      duration: 480,
      ease: 'Cubic.easeOut',
    });

    this.ui.tweens.killTweensOf(this.tierText);
    this.tierText.setScale(3);
    this.ui.tweens.add({
      targets: this.tierText,
      scaleX: 1,
      scaleY: 1,
      duration: 300,
      ease: 'Back.easeOut',
    });

    if (this.sparks) {
      this.sparks.setParticleTint(Phaser.Display.Color.HexStringToColor(this.heatColor(heat)).color);
      this.sparks.explode(14 + heat * 8, this.originX, this.originY);
    }
  }
}
