import Phaser from 'phaser';
import { STATUS_PANEL_THEME } from '../config/theme';

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

interface IRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

/**
 * Medidas da arte `HudStatusFrame.png` (460x218), em pixels da textura, tiradas pelo
 * scripts/cut-hud-status.py. As janelas são vazadas: as barras ficam atrás da moldura.
 */
const FRAME_ART = {
  width: 460,
  height: 218,
  hpWindow: { x: 151, y: 86, w: 252, h: 31 },
  staminaWindow: { x: 156, y: 137, w: 241, h: 19 },
  /** Placa lisa acima da janela de vida, à esquerda, para o nível. */
  levelSpot: { x: 163, y: 61 },
  /** Centro do logo do nome: sobe além da borda de cima para não cobrir o nível. */
  nameCenter: { x: 277, y: 8 },
  /** As texturas de preenchimento sobram 4 px de cada lado e a borda delas some sob a moldura. */
  fillBleed: 4,
} as const;

/**
 * Painel de status do canto inferior direito: retrato gigante, moldura violeta com
 * janelas vazadas, barras de vida e estamina atrás dela, nome e nível.
 * A Suprema mora na barra de armas (WeaponSlotsHud).
 */
export class StatusPanelHud {
  private readonly portraitSize = 340;
  private readonly portraitBaseX: number;
  private readonly portraitBaseY: number;
  private readonly hpRect: IRect;
  private readonly stRect: IRect;

  private readonly portraitImage: Phaser.GameObjects.Image;
  private readonly statusHudImage: Phaser.GameObjects.Image;
  private readonly charNameImage: Phaser.GameObjects.Image;
  private readonly trackGraphics: Phaser.GameObjects.Graphics;
  private readonly hpFill: Phaser.GameObjects.Image;
  private readonly staminaFill: Phaser.GameObjects.Image;
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

    // Arte em escala 1:1 (pixelArt ligado: esticar deixaria os pixels tortos)
    // Recuado para a mão do retrato não esconder o fim das barras
    const panelX = width - this.portraitSize - FRAME_ART.width + 150;
    const panelY = height - 10 - FRAME_ART.height;

    const win = (r: IRect): IRect => ({ x: panelX + r.x, y: panelY + r.y, w: r.w, h: r.h });
    this.hpRect = win(FRAME_ART.hpWindow);
    this.stRect = win(FRAME_ART.staminaWindow);

    // Camadas, de trás para a frente: fundo das janelas, barras, moldura, textos
    this.trackGraphics = ui.add.graphics().setDepth(33);
    this.trackGraphics.fillStyle(STATUS_PANEL_THEME.track, STATUS_PANEL_THEME.trackAlpha);
    for (const r of [this.hpRect, this.stRect]) this.trackGraphics.fillRect(r.x, r.y, r.w, r.h);

    const bleed = FRAME_ART.fillBleed;
    this.hpFill = ui.add.image(this.hpRect.x - bleed, this.hpRect.y - bleed, 'ui-hp-fill').setOrigin(0, 0).setDepth(34);
    this.staminaFill = ui.add.image(this.stRect.x - bleed, this.stRect.y - bleed, 'ui-stamina-fill').setOrigin(0, 0).setDepth(34);

    this.statusHudImage = ui.add.image(panelX, panelY, 'ui-status-hud').setOrigin(0, 0).setDepth(36);

    const charNameTexture = ui.textures.exists(`ui-char-name-${characterId}`) ? `ui-char-name-${characterId}` : 'ui-char-name-nixy';
    this.charNameImage = ui.add.image(panelX + FRAME_ART.nameCenter.x, panelY + FRAME_ART.nameCenter.y, charNameTexture);
    this.charNameImage.setDepth(62);

    const textStyle = (size: number, color: string): Phaser.Types.GameObjects.Text.TextStyle => ({
      fontFamily: pixelFont,
      fontSize: `${size}px`,
      fontStyle: 'bold',
      color,
      stroke: STATUS_PANEL_THEME.textStroke,
      strokeThickness: 3
    });

    const levelX = panelX + FRAME_ART.levelSpot.x;
    const levelY = panelY + FRAME_ART.levelSpot.y;
    this.levelTag = ui.add.text(levelX, levelY, 'LVL 1', textStyle(13, STATUS_PANEL_THEME.levelText))
      .setOrigin(0, 0.5).setDepth(60);
    if (ui.textures.exists('ui-icon-level')) {
      this.levelIcon = ui.add.image(levelX, levelY, 'ui-icon-level').setDisplaySize(18, 18).setDepth(60);
    }

    this.hpText = ui.add.text(this.hpRect.x + this.hpRect.w / 2, this.hpRect.y + this.hpRect.h / 2, '100 / 100 HP', textStyle(12, STATUS_PANEL_THEME.valueText))
      .setOrigin(0.5).setDepth(60);
    this.staminaText = ui.add.text(this.stRect.x + this.stRect.w / 2, this.stRect.y + this.stRect.h / 2, '100% STAMINA', textStyle(10, STATUS_PANEL_THEME.valueText))
      .setOrigin(0.5).setDepth(60);
  }

  public getHudElements(): Phaser.GameObjects.GameObject[] {
    return [
      this.portraitImage,
      this.statusHudImage,
      this.charNameImage,
      this.trackGraphics,
      this.hpFill,
      this.staminaFill,
      this.levelTag,
      ...(this.levelIcon ? [this.levelIcon] : []),
      this.hpText,
      this.staminaText
    ];
  }

  public clearBars(): void {
    this.setFillRatio(this.hpFill, this.hpRect, 0);
    this.setFillRatio(this.staminaFill, this.stRect, 0);
  }

  public update(p: IStatusPanelPlayer): void {
    const hpRatio = Phaser.Math.Clamp(p.currentHp / p.maxHp, 0, 1);
    this.setFillRatio(this.hpFill, this.hpRect, hpRatio);
    this.hpText.setText(`${Math.max(0, Math.round(p.currentHp))} / ${p.maxHp} HP`);

    // Ciano em sprint, rosa quase esgotada, dourado normal
    const stRatio = Phaser.Math.Clamp(p.currentStamina / p.maxStamina, 0, 1);
    this.setFillRatio(this.staminaFill, this.stRect, stRatio);
    if (p.isSprinting) this.staminaFill.setTint(STATUS_PANEL_THEME.staminaSprintTint);
    else if (stRatio < 0.2) this.staminaFill.setTint(STATUS_PANEL_THEME.staminaLowTint);
    else this.staminaFill.clearTint();
    this.staminaText.setText(`${Math.round(p.currentStamina)}% STAMINA`);

    this.levelTag.setText(`LVL ${p.currentLevel}`);
    this.levelIcon?.setX(this.levelTag.x + this.levelTag.width + 12);

    if (p.characterId) {
      const charNameKey = `ui-char-name-${p.characterId}`;
      if (this.ui.textures.exists(charNameKey) && this.charNameImage.texture.key !== charNameKey) {
        this.charNameImage.setTexture(charNameKey);
      }
    }

    this.updatePortrait(p.hurtTimer > 0);
  }

  /** Mostra só a parte cheia da barra: a sobra à esquerda fica sob a moldura, o resto é cortado. */
  private setFillRatio(fill: Phaser.GameObjects.Image, rect: IRect, ratio: number): void {
    const bleed = FRAME_ART.fillBleed;
    const visible = ratio <= 0 ? 0 : Math.round(bleed + rect.w * ratio);
    fill.setCrop(0, 0, visible, fill.height);
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
}
