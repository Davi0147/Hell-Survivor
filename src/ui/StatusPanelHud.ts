import Phaser from 'phaser';

/** O que o painel lê do personagem jogável a cada quadro. */
export interface IStatusPanelPlayer {
  characterId?: string;
  currentHp: number;
  maxHp: number;
  currentStamina: number;
  maxStamina: number;
  isSprinting: boolean;
  ultimateCharge: number;
  maxUltimateCharge: number;
  isUltimateReady: boolean;
  hurtTimer: number;
  currentLevel: number;
}

/**
 * Painel de status do canto inferior direito: retrato gigante, moldura com nome,
 * barras de vida e estamina, nível e medidor da Suprema.
 */
export class StatusPanelHud {
  private readonly portraitSize = 340;
  private readonly portraitBaseX: number;
  private readonly portraitBaseY: number;
  private readonly vialX: number;
  private readonly vialY: number;
  private readonly barsX: number;
  private readonly barsW = 230;
  private readonly hpBarY: number;
  private readonly stBarY: number;

  private readonly portraitImage: Phaser.GameObjects.Image;
  private readonly statusHudImage: Phaser.GameObjects.Image;
  private readonly charNameImage: Phaser.GameObjects.Image;
  private readonly baroquePanelGraphics: Phaser.GameObjects.Graphics;
  private readonly ultGaugeBg: Phaser.GameObjects.Image;
  private readonly vialGraphics: Phaser.GameObjects.Graphics;
  private readonly ultGaugeFrame: Phaser.GameObjects.Image;
  private readonly ultimatePctText: Phaser.GameObjects.Text;
  private readonly ultimateReadyBadge: Phaser.GameObjects.Text;
  private readonly hpBarFill: Phaser.GameObjects.Graphics;
  private readonly staminaBarFill: Phaser.GameObjects.Graphics;
  private readonly levelTag: Phaser.GameObjects.Text;
  private readonly levelIcon?: Phaser.GameObjects.Image;
  private readonly hpText: Phaser.GameObjects.Text;
  private readonly staminaText: Phaser.GameObjects.Text;

  constructor(
    private readonly ui: Phaser.Scene,
    pixelFont: string,
    characterId: string,
    onUltimateClick: () => void
  ) {
    const { width, height } = ui.scale;

    // Retrato gigante em primeiro plano, sobrepondo a borda direita do painel
    this.portraitBaseX = width - this.portraitSize / 2 + 60;
    this.portraitBaseY = height - this.portraitSize / 2 + 15;
    this.portraitImage = ui.add.image(this.portraitBaseX, this.portraitBaseY, 'nixy-portrait-idle');
    this.portraitImage.setDisplaySize(this.portraitSize, this.portraitSize);
    this.portraitImage.setDepth(150);

    const hudScale = 1.6;
    const panelW = Math.round(280 * hudScale);
    const panelH = Math.round(131 * hudScale);
    const panelX = width - this.portraitSize - panelW + 225;
    const panelY = height - 14 - panelH;
    const hudCenterX = panelX + panelW / 2;
    const hudCenterY = panelY + panelH / 2;

    this.statusHudImage = ui.add.image(hudCenterX, hudCenterY, 'ui-status-hud');
    this.statusHudImage.setDisplaySize(panelW, panelH);
    this.statusHudImage.setDepth(30);

    const charNameTexture = ui.textures.exists(`ui-char-name-${characterId}`) ? `ui-char-name-${characterId}` : 'ui-char-name-nixy';
    this.charNameImage = ui.add.image(hudCenterX, panelY + 40, charNameTexture);
    this.charNameImage.setDisplaySize(220, 100);
    this.charNameImage.setDepth(62);

    // Medidor da Suprema no lado esquerdo da cavidade; barras à direita dele
    this.vialX = panelX + Math.round(36 * hudScale) + 40;
    this.vialY = panelY + 125;
    this.barsX = this.vialX + 56;
    this.hpBarY = this.vialY - 9;
    this.stBarY = this.hpBarY + 24;

    this.baroquePanelGraphics = ui.add.graphics();
    this.baroquePanelGraphics.setDepth(35);
    this.drawBaroqueFrame();

    this.ultGaugeBg = ui.add.image(this.vialX, this.vialY, 'ult-gauge-bg');
    this.ultGaugeBg.setScale(2.0).setOrigin(0.5).setDepth(48);

    this.vialGraphics = ui.add.graphics();
    this.vialGraphics.setDepth(50);
    this.drawUltimateOrb(0, false);

    this.ultGaugeFrame = ui.add.image(this.vialX, this.vialY, 'ult-gauge-frame');
    this.ultGaugeFrame.setScale(2.0).setOrigin(0.5).setDepth(52);

    this.ultimatePctText = ui.add.text(this.vialX, this.vialY, '0%', {
      fontFamily: pixelFont,
      fontSize: '13px',
      fontStyle: 'bold',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 3.5
    }).setOrigin(0.5).setDepth(60);

    this.ultimateReadyBadge = ui.add.text(this.vialX, this.vialY, '[E]', {
      fontFamily: pixelFont,
      fontSize: '18px',
      fontStyle: 'bold',
      color: '#ffd60a',
      stroke: '#000000',
      strokeThickness: 4,
      shadow: {
        offsetX: 0,
        offsetY: 0,
        color: '#ff0055',
        blur: 10,
        stroke: true,
        fill: true
      }
    }).setOrigin(0.5).setDepth(65);
    this.ultimateReadyBadge.setVisible(false);

    // Clique no frasco também ativa a Suprema
    const vialZone = ui.add.zone(this.vialX, this.vialY, 74, 74);
    vialZone.setOrigin(0.5);
    vialZone.setInteractive({ useHandCursor: true });
    vialZone.on('pointerdown', onUltimateClick);

    this.hpBarFill = ui.add.graphics();
    this.hpBarFill.setDepth(40);
    this.staminaBarFill = ui.add.graphics();
    this.staminaBarFill.setDepth(40);

    this.levelTag = ui.add.text(this.barsX, this.hpBarY - 18, 'LVL 1', {
      fontFamily: pixelFont,
      fontSize: '13px',
      fontStyle: 'bold',
      color: '#f3d17a',
      stroke: '#000000',
      strokeThickness: 3
    }).setDepth(60);
    if (ui.textures.exists('ui-icon-level')) {
      this.levelIcon = ui.add.image(this.barsX, this.hpBarY - 11, 'ui-icon-level').setDisplaySize(18, 18).setDepth(60);
    }

    this.hpText = ui.add.text(this.barsX + this.barsW / 2, this.hpBarY + 9, '100 / 100 HP', {
      fontFamily: pixelFont,
      fontSize: '11px',
      fontStyle: 'bold',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5).setDepth(60);

    this.staminaText = ui.add.text(this.barsX + this.barsW / 2, this.stBarY + 7, '100% STAMINA', {
      fontFamily: pixelFont,
      fontSize: '10px',
      fontStyle: 'bold',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5).setDepth(60);
  }

  public getHudElements(): Phaser.GameObjects.GameObject[] {
    return [
      this.portraitImage,
      this.statusHudImage,
      this.charNameImage,
      this.baroquePanelGraphics,
      this.ultGaugeBg,
      this.vialGraphics,
      this.ultGaugeFrame,
      this.ultimatePctText,
      this.ultimateReadyBadge,
      this.hpBarFill,
      this.staminaBarFill,
      this.levelTag,
      ...(this.levelIcon ? [this.levelIcon] : []),
      this.hpText,
      this.staminaText
    ];
  }

  public clearBars(): void {
    this.hpBarFill.clear();
    this.staminaBarFill.clear();
  }

  public update(p: IStatusPanelPlayer, controlScheme: 'keyboard' | 'gamepad'): void {
    this.updateUltimate(p, controlScheme);

    const hpRatio = Math.max(0, p.currentHp / p.maxHp);
    this.hpBarFill.clear();
    this.hpBarFill.fillStyle(0xd90429, 1);
    this.hpBarFill.fillRect(this.barsX + 2, this.hpBarY + 2, (this.barsW - 4) * hpRatio, 14);
    this.hpText.setText(`${Math.max(0, Math.round(p.currentHp))} / ${p.maxHp} HP`);

    // Ciano em sprint, magenta quase esgotada, dourado normal
    this.staminaBarFill.clear();
    const stRatio = Math.max(0, p.currentStamina / p.maxStamina);
    const stColor = p.isSprinting ? 0x00f5d4 : (stRatio < 0.2 ? 0xf72585 : 0xe0a96d);
    this.staminaBarFill.fillStyle(stColor, 1);
    this.staminaBarFill.fillRect(this.barsX + 2, this.stBarY + 2, (this.barsW - 4) * stRatio, 10);
    this.staminaText.setText(`${Math.round(p.currentStamina)}% STAMINA`);

    this.levelTag.setText(`LVL ${p.currentLevel}`);
    this.levelIcon?.setX(this.barsX + this.levelTag.width + 12);

    if (p.characterId) {
      const charNameKey = `ui-char-name-${p.characterId}`;
      if (this.ui.textures.exists(charNameKey) && this.charNameImage.texture.key !== charNameKey) {
        this.charNameImage.setTexture(charNameKey);
      }
    }

    this.updatePortrait(p.hurtTimer > 0);
  }

  private updateUltimate(p: IStatusPanelPlayer, controlScheme: 'keyboard' | 'gamepad'): void {
    const ultRatio = Phaser.Math.Clamp(p.ultimateCharge / p.maxUltimateCharge, 0, 1);
    const isReady = p.isUltimateReady;
    this.drawUltimateOrb(ultRatio, isReady);

    if (isReady) {
      this.ultimatePctText.setVisible(false);
      this.ultimateReadyBadge.setVisible(true);
      const promptLabel = controlScheme === 'gamepad' ? '[Y]' : '[E]';
      if (this.ultimateReadyBadge.text !== promptLabel) {
        this.ultimateReadyBadge.setText(promptLabel);
      }
      this.ultimateReadyBadge.setScale(1.0 + Math.sin(this.ui.time.now * 0.008) * 0.14);
    } else {
      this.ultimateReadyBadge.setVisible(false);
      this.ultimatePctText.setVisible(true);
      this.ultimatePctText.setText(`${Math.floor(ultRatio * 100)}%`);
    }
  }

  /** Retrato troca para a arte de dano e treme enquanto a heroína está ferida. */
  private updatePortrait(isHurt: boolean): void {
    const img = this.portraitImage;
    const key = isHurt ? 'nixy-portrait-damage' : 'nixy-portrait-idle';
    if (img.texture.key !== key) {
      img.setTexture(key);
      img.setDisplaySize(this.portraitSize, this.portraitSize);
    }
    if (isHurt) {
      img.setPosition(this.portraitBaseX + Phaser.Math.Between(-6, 6), this.portraitBaseY + Phaser.Math.Between(-6, 6));
      img.setTint(0xff4444);
    } else {
      img.setPosition(this.portraitBaseX, this.portraitBaseY);
      img.clearTint();
    }
  }

  /** Trilhos das barras de vida e estamina dentro da cavidade de pedra. */
  private drawBaroqueFrame(): void {
    const g = this.baroquePanelGraphics;
    g.clear();
    const bW = this.barsW;

    g.fillStyle(0x140104, 0.95);
    g.fillRect(this.barsX, this.hpBarY, bW, 18);
    g.lineStyle(1.5, 0xc59b27, 0.9);
    g.strokeRect(this.barsX, this.hpBarY, bW, 18);

    g.fillStyle(0x120a02, 0.95);
    g.fillRect(this.barsX, this.stBarY, bW, 14);
    g.lineStyle(1.5, 0xc59b27, 0.8);
    g.strokeRect(this.barsX, this.stBarY, bW, 14);
  }

  /**
   * Líquido do medidor da Suprema, entre o fundo e a moldura frontal.
   * Violeta enquanto carrega; carmesim com halo dourado pulsante quando pronta.
   */
  private drawUltimateOrb(chargeRatio: number, isReady: boolean): void {
    const g = this.vialGraphics;
    g.clear();
    const cx = this.vialX;
    const cy = this.vialY;

    // Janela interna da moldura (40x40 em escala 2.0)
    const winW = 46;
    const winH = 46;
    const winLeft = cx - winW / 2;
    const winBottom = cy + 22;
    const winTop = cy - 24;
    const ratio = Phaser.Math.Clamp(chargeRatio, 0, 1);

    if (isReady) {
      const pulse = Math.sin(this.ui.time.now * 0.008);
      g.lineStyle(3, 0xff0055, 0.7 + pulse * 0.3);
      g.strokeRoundedRect(cx - 40 - pulse, cy - 40 - pulse, 80 + pulse * 2, 80 + pulse * 2, 10);
      g.lineStyle(1.5, 0xffd60a, 0.9);
      g.strokeRoundedRect(cx - 38, cy - 38, 76, 76, 8);
    }

    if (ratio > 0.02) {
      const fillH = winH * ratio;
      const fillY = winBottom - fillH;

      g.fillStyle(isReady ? 0xd90429 : 0x7b2cbf, 0.95);
      g.fillRect(winLeft, fillY, winW, fillH);

      g.fillStyle(isReady ? 0xff0054 : 0x9d4edd, 0.65);
      g.fillRect(winLeft + 3, fillY + 2, winW - 6, Math.max(0, fillH - 4));

      // Menisco de energia na superfície
      const wave = isReady ? 0 : Math.sin(this.ui.time.now * 0.007) * 1.5;
      g.fillStyle(isReady ? 0xffd60a : 0x00f5d4, 1);
      g.fillRect(winLeft, Math.max(winTop, fillY + wave), winW, 3);
    }
  }
}
