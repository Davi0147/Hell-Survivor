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
  levelSpot: { x: 163, y: 63 },
  /** Centro da faixa escura do topo (x 148–319, y 16–42), onde o logo do nome se apoia. */
  nameCenter: { x: 233, y: 26 },
  /** Olho no meio da roda de espinhos à esquerda: vira o medalhão com o rosto da heroína. */
  medallion: { x: 82, y: 108, r: 28 },
  /** As texturas de preenchimento sobram 4 px de cada lado e a borda delas some sob a moldura. */
  fillBleed: 4,
} as const;

/**
 * Enquadramento do rosto nas artes de retrato (200x200): centro do rosto e quanto ampliar
 * para ele encher o medalhão.
 */
const PORTRAIT_FACE = { x: 100, y: 74, scale: 1.2 } as const;

/** Tamanho dos textos, em px da moldura (o painel inteiro é escalado). */
const TEXT_SIZE = {
  desktop: { hp: 15, stamina: 11, level: 14 },
  // No toque o painel vira ~45% no iPhone: textos maiores e sem o texto da estamina (a barra basta)
  touch: { hp: 24, stamina: 0, level: 20 },
} as const;

export interface StatusPanelLayout {
  x: number;
  y: number;
  scale: number;
}

/**
 * Painel de status no topo esquerdo: moldura violeta com janelas vazadas, barras de vida e
 * estamina atrás dela, nome, nível e o rosto da heroína no medalhão do olho.
 * A Suprema mora na barra de armas (WeaponSlotsHud).
 */
export class StatusPanelHud {
  private readonly container: Phaser.GameObjects.Container;
  private readonly hpRect: IRect;
  private readonly stRect: IRect;

  private readonly portrait: Phaser.GameObjects.Image;
  private readonly portraitMaskShape: Phaser.GameObjects.Graphics;
  private readonly portraitBase: { x: number; y: number };
  private readonly charNameImage: Phaser.GameObjects.Image;
  private readonly hpFill: Phaser.GameObjects.Image;
  private readonly staminaFill: Phaser.GameObjects.Image;
  private readonly levelPlaque: Phaser.GameObjects.Graphics;
  private lastLevelText = '';
  private readonly levelTag: Phaser.GameObjects.Text;
  private readonly levelIcon?: Phaser.GameObjects.Image;
  private readonly hpText: Phaser.GameObjects.Text;
  private readonly staminaText?: Phaser.GameObjects.Text;

  constructor(
    private readonly ui: Phaser.Scene,
    pixelFont: string,
    characterId: string,
    layout: StatusPanelLayout,
    isTouch: boolean
  ) {
    const sizes = isTouch ? TEXT_SIZE.touch : TEXT_SIZE.desktop;
    this.container = ui.add.container(layout.x, layout.y).setScale(layout.scale).setDepth(36);
    this.hpRect = { ...FRAME_ART.hpWindow };
    this.stRect = { ...FRAME_ART.staminaWindow };

    // Camadas, de trás para a frente: fundo das janelas e do medalhão, barras, moldura, rosto, textos
    const track = ui.add.graphics();
    track.fillStyle(STATUS_PANEL_THEME.track, STATUS_PANEL_THEME.trackAlpha);
    for (const r of [this.hpRect, this.stRect]) track.fillRect(r.x, r.y, r.w, r.h);

    const bleed = FRAME_ART.fillBleed;
    this.hpFill = ui.add.image(this.hpRect.x - bleed, this.hpRect.y - bleed, 'ui-hp-fill').setOrigin(0, 0);
    this.staminaFill = ui.add.image(this.stRect.x - bleed, this.stRect.y - bleed, 'ui-stamina-fill').setOrigin(0, 0);
    const frame = ui.add.image(0, 0, 'ui-status-hud').setOrigin(0, 0);

    // Rosto no medalhão: a arte do retrato recortada num círculo sobre o olho da moldura
    const m = FRAME_ART.medallion;
    const medallionBg = ui.add.graphics();
    medallionBg.fillStyle(STATUS_PANEL_THEME.medallionBg, 1);
    medallionBg.fillCircle(m.x, m.y, m.r);
    this.portraitBase = {
      x: m.x - (PORTRAIT_FACE.x - 100) * PORTRAIT_FACE.scale,
      y: m.y - (PORTRAIT_FACE.y - 100) * PORTRAIT_FACE.scale,
    };
    this.portrait = ui.add.image(this.portraitBase.x, this.portraitBase.y, 'nixy-portrait-idle').setScale(PORTRAIT_FACE.scale);
    // Máscara em coordenadas de tela (o painel não se move, então basta desenhar uma vez)
    this.portraitMaskShape = ui.make.graphics({}, false);
    this.portraitMaskShape.fillStyle(0xffffff, 1);
    this.portraitMaskShape.fillCircle(layout.x + m.x * layout.scale, layout.y + m.y * layout.scale, m.r * layout.scale);
    this.portrait.setMask(this.portraitMaskShape.createGeometryMask());
    const medallionRing = ui.add.graphics();
    medallionRing.lineStyle(3, STATUS_PANEL_THEME.medallionRing, 1);
    medallionRing.strokeCircle(m.x, m.y, m.r);

    const charNameTexture = ui.textures.exists(`ui-char-name-${characterId}`) ? `ui-char-name-${characterId}` : 'ui-char-name-nixy';
    this.charNameImage = ui.add.image(FRAME_ART.nameCenter.x, FRAME_ART.nameCenter.y, charNameTexture);

    const textStyle = (size: number, color: string): Phaser.Types.GameObjects.Text.TextStyle => ({
      fontFamily: pixelFont,
      fontSize: `${size}px`,
      fontStyle: 'bold',
      color,
      stroke: STATUS_PANEL_THEME.textStroke,
      strokeThickness: Math.max(3, Math.round(size / 5)),
    });

    this.levelPlaque = ui.add.graphics();
    this.levelTag = ui.add.text(FRAME_ART.levelSpot.x, FRAME_ART.levelSpot.y, 'LVL 1', textStyle(sizes.level, STATUS_PANEL_THEME.levelText))
      .setOrigin(0, 0.5);
    if (ui.textures.exists('ui-icon-level')) {
      this.levelIcon = ui.add.image(FRAME_ART.levelSpot.x, FRAME_ART.levelSpot.y, 'ui-icon-level').setDisplaySize(sizes.level + 4, sizes.level + 4);
    }

    this.hpText = ui.add.text(this.hpRect.x + this.hpRect.w / 2, this.hpRect.y + this.hpRect.h / 2, '100 / 100', textStyle(sizes.hp, STATUS_PANEL_THEME.valueText))
      .setOrigin(0.5);
    if (sizes.stamina > 0) {
      this.staminaText = ui.add.text(this.stRect.x + this.stRect.w / 2, this.stRect.y + this.stRect.h / 2, '100%', textStyle(sizes.stamina, STATUS_PANEL_THEME.valueText))
        .setOrigin(0.5);
    }

    this.container.add([
      track, this.hpFill, this.staminaFill, frame, medallionBg, this.portrait, medallionRing,
      this.charNameImage, this.levelPlaque, this.levelTag,
      ...(this.levelIcon ? [this.levelIcon] : []),
      this.hpText,
      ...(this.staminaText ? [this.staminaText] : []),
    ]);
  }

  public getHudElements(): Phaser.GameObjects.GameObject[] {
    return [this.container];
  }

  public clearBars(): void {
    this.setFillRatio(this.hpFill, this.hpRect, 0);
    this.setFillRatio(this.staminaFill, this.stRect, 0);
  }

  public update(p: IStatusPanelPlayer): void {
    const hpRatio = Phaser.Math.Clamp(p.currentHp / p.maxHp, 0, 1);
    this.setFillRatio(this.hpFill, this.hpRect, hpRatio);
    this.hpText.setText(`${Math.max(0, Math.round(p.currentHp))} / ${p.maxHp}`);

    // Ciano em sprint, rosa quase esgotada, dourado normal
    const stRatio = Phaser.Math.Clamp(p.currentStamina / p.maxStamina, 0, 1);
    this.setFillRatio(this.staminaFill, this.stRect, stRatio);
    if (p.isSprinting) this.staminaFill.setTint(STATUS_PANEL_THEME.staminaSprintTint);
    else if (stRatio < 0.2) this.staminaFill.setTint(STATUS_PANEL_THEME.staminaLowTint);
    else this.staminaFill.clearTint();
    this.staminaText?.setText(`${Math.round(stRatio * 100)}%`);

    const levelText = `LVL ${p.currentLevel}`;
    if (levelText !== this.lastLevelText) {
      this.lastLevelText = levelText;
      this.levelTag.setText(levelText);
      this.levelIcon?.setX(this.levelTag.x + this.levelTag.width + this.levelIcon.displayWidth / 2 + 4);
      this.drawLevelPlaque();
    }

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

  /** Placa escura sob o nível, crescendo com o texto para "LVL 100" não vazar da arte. */
  private drawLevelPlaque(): void {
    const t = this.levelTag;
    const right = this.levelIcon ? this.levelIcon.x + this.levelIcon.displayWidth / 2 + 2 : t.x + t.width + 2;
    const h = t.height + 2;
    const x = t.x - 6;
    const y = t.y - h / 2;
    const w = right - x + 4;
    const g = this.levelPlaque;
    g.clear();
    g.fillStyle(STATUS_PANEL_THEME.levelPlaque, 1);
    g.fillRoundedRect(x, y, w, h, 4);
    g.lineStyle(1, STATUS_PANEL_THEME.levelPlaqueBorder, 1);
    g.strokeRoundedRect(x, y, w, h, 4);
  }

  /** Rosto troca para a arte de dano, fica vermelho e treme enquanto a heroína está ferida. */
  private updatePortrait(isHurt: boolean): void {
    const img = this.portrait;
    const key = isHurt && this.ui.textures.exists('nixy-portrait-damage') ? 'nixy-portrait-damage' : 'nixy-portrait-idle';
    if (img.texture.key !== key) {
      img.setTexture(key);
      img.setScale(PORTRAIT_FACE.scale);
    }
    if (isHurt) {
      img.setPosition(this.portraitBase.x + Phaser.Math.Between(-3, 3), this.portraitBase.y + Phaser.Math.Between(-3, 3));
      img.setTint(STATUS_PANEL_THEME.hurtTint);
    } else {
      img.setPosition(this.portraitBase.x, this.portraitBase.y);
      img.clearTint();
    }
  }
}
