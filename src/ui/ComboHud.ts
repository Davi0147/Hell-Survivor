import Phaser from 'phaser';
import type { ComboTracker } from '../systems/ComboTracker';
import { FONTS, FX_COLORS } from '../config/theme';

/** Abaixo disto o contador nem aparece, para não poluir a tela no começo. */
const MIN_COMBO_TO_SHOW = 3;
const BAR_WIDTH = 96;

/**
 * Contador de combo no canto direito da HUD: número de abates seguidos, nome do degrau,
 * barra do tempo que resta e o aviso de Frenesi.
 */
export class ComboHud {
  private readonly container: Phaser.GameObjects.Container;
  private readonly countText: Phaser.GameObjects.Text;
  private readonly tierText: Phaser.GameObjects.Text;
  private readonly frenzyText: Phaser.GameObjects.Text;
  private readonly bar: Phaser.GameObjects.Graphics;

  private lastCombo = 0;
  private lastTierLabel = '';
  private wasFrenzy = false;
  private popTween?: Phaser.Tweens.Tween;

  constructor(private readonly ui: Phaser.Scene) {
    const { width } = ui.scale;
    this.container = ui.add.container(width - 150, 168);
    this.container.setDepth(61);
    this.container.setAlpha(0);

    this.countText = ui.add.text(0, 0, '', {
      fontFamily: FONTS.display,
      fontSize: '34px',
      fontStyle: 'bold',
      color: FX_COLORS.comboText,
      stroke: FX_COLORS.comboStroke,
      strokeThickness: 6
    }).setOrigin(0.5);

    this.tierText = ui.add.text(0, 26, '', {
      fontFamily: FONTS.body,
      fontSize: '10px',
      fontStyle: 'bold',
      color: FX_COLORS.comboTierText,
      stroke: FX_COLORS.comboStroke,
      strokeThickness: 3
    }).setOrigin(0.5);

    this.bar = ui.add.graphics();

    this.frenzyText = ui.add.text(0, 58, 'FRENESI!', {
      fontFamily: FONTS.display,
      fontSize: '22px',
      fontStyle: 'bold',
      color: FX_COLORS.frenzyText,
      stroke: FX_COLORS.comboStroke,
      strokeThickness: 5
    }).setOrigin(0.5).setVisible(false);

    this.container.add([this.countText, this.tierText, this.bar, this.frenzyText]);
  }

  /** Some junto com o resto da HUD. */
  public getHudElement(): Phaser.GameObjects.Container {
    return this.container;
  }

  public update(combo: ComboTracker): void {
    const count = combo.combo;
    const isFrenzy = combo.isFrenzyActive;
    const shouldShow = count >= MIN_COMBO_TO_SHOW || isFrenzy;

    // Aparece na hora, some devagar quando o combo quebra
    const targetAlpha = shouldShow ? 1 : 0;
    this.container.setAlpha(Phaser.Math.Linear(this.container.alpha, targetAlpha, shouldShow ? 0.5 : 0.08));

    if (count !== this.lastCombo) {
      if (count > this.lastCombo && count >= MIN_COMBO_TO_SHOW) {
        this.countText.setText(`x${count}`);
        this.pop(count % 10 === 0 ? 1.6 : 1.28);
      }
      this.lastCombo = count;
    }

    const tierLabel = combo.currentTier?.label ?? 'ABATES';
    if (tierLabel !== this.lastTierLabel) {
      this.lastTierLabel = tierLabel;
      const bonus = combo.currentTier ? `  +${Math.round(combo.currentTier.xpBonus * 100)}% XP` : '';
      this.tierText.setText(`${tierLabel}${bonus}`);
    }

    this.bar.clear();
    if (count > 0) {
      this.bar.fillStyle(FX_COLORS.comboBarBg, 0.85);
      this.bar.fillRect(-BAR_WIDTH / 2, 38, BAR_WIDTH, 5);
      this.bar.fillStyle(FX_COLORS.comboBar, 1);
      this.bar.fillRect(-BAR_WIDTH / 2, 38, BAR_WIDTH * combo.windowRatio, 5);
    }

    if (isFrenzy !== this.wasFrenzy) {
      this.wasFrenzy = isFrenzy;
      this.frenzyText.setVisible(isFrenzy);
      this.ui.tweens.killTweensOf(this.frenzyText);
      this.frenzyText.setScale(1);
      if (isFrenzy) {
        this.ui.tweens.add({
          targets: this.frenzyText,
          scaleX: 1.18,
          scaleY: 1.18,
          duration: 260,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut'
        });
      }
    }
  }

  private pop(scale: number): void {
    this.popTween?.stop();
    this.countText.setScale(scale);
    this.popTween = this.ui.tweens.add({
      targets: this.countText,
      scaleX: 1,
      scaleY: 1,
      duration: 160,
      ease: 'Back.easeOut'
    });
  }
}
