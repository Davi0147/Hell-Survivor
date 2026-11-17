import Phaser from 'phaser';

/** O que o painel lê do personagem jogável a cada quadro. */
export interface IStatusPanelPlayer {
  characterId?: string;
  currentHp: number;
  maxHp: number;
  currentStamina: number;
  maxStamina: number;
  isSprinting: boolean;
  hurtTimer: number;
  currentLevel: number;
}

/**
 * Painel de status do canto inferior direito: retrato gigante, moldura com nome,
 * barras de vida e estamina e nível. A Suprema mora na barra de armas (WeaponSlotsHud).
 */
export class StatusPanelHud {
  private readonly portraitSize = 340;
  private readonly portraitBaseX: number;
  private readonly portraitBaseY: number;
  private readonly barsX: number;
  private readonly barsW: number;
  private readonly hpBarY: number;
  private readonly stBarY: number;

  private readonly portraitImage: Phaser.GameObjects.Image;
  private readonly statusHudImage: Phaser.GameObjects.Image;
  private readonly charNameImage: Phaser.GameObjects.Image;
  private readonly baroquePanelGraphics: Phaser.GameObjects.Graphics;
  private readonly hpBarFill: Phaser.GameObjects.Graphics;
  private readonly staminaBarFill: Phaser.GameObjects.Graphics;
  private readonly levelTag: Phaser.GameObjects.Text;
  private readonly levelIcon?: Phaser.GameObjects.Image;
  private readonly hpText: Phaser.GameObjects.Text;
  private readonly staminaText: Phaser.GameObjects.Text;

  constructor(
    private readonly ui: Phaser.Scene,
    pixelFont: string,
    characterId: string
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

    // Barras ocupam a cavidade inteira (a Suprema saiu daqui e foi para a barra de armas)
    this.barsX = panelX + 56;
    this.barsW = 328;
    this.hpBarY = panelY + 116;
    this.stBarY = this.hpBarY + 24;

    this.baroquePanelGraphics = ui.add.graphics();
    this.baroquePanelGraphics.setDepth(35);
    this.drawBaroqueFrame();

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

  public update(p: IStatusPanelPlayer): void {
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
}
