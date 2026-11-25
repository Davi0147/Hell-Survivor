import Phaser from 'phaser';
import { FONTS, COLORS, ACTION_BUTTON_THEME as T } from '../config/theme';

import { drawPixelFrame } from './pixelFrame';

const KEYCAP_H = 24;
const KEYCAP_H_BARE = 32;

export interface ActionKeyButtonOptions {
  x: number;
  y: number;
  width: number;
  height: number;
  iconKey: string;
  label: string;
  /** Número pequeno no canto do ícone (cargas, cura). */
  badge?: string;
  badgeColor?: string;
  onClick: () => void;
  onHover?: () => void;
  /** Tamanho da fonte do nome (padrão 15). Maior no celular, onde o jogo é encolhido. */
  labelFontSize?: number;
  /** Sem moldura e sem ícone: só o nome e a tecla, alinhados à direita (ex.: PULAR nas cutscenes). */
  bare?: boolean;
}

/**
 * Botão de ação minimalista: ícone, nome e uma "tecla" desenhada à direita que mostra
 * o atalho do controle em uso (R / X / ...). No toque a tecla some (o próprio botão é o toque).
 */
export class ActionKeyButton {
  public readonly container: Phaser.GameObjects.Container;
  private readonly bg: Phaser.GameObjects.Graphics;
  private readonly icon?: Phaser.GameObjects.Image;
  private readonly labelText: Phaser.GameObjects.Text;
  private readonly badgeText: Phaser.GameObjects.Text;
  private readonly keyCap: Phaser.GameObjects.Graphics;
  private readonly keyText: Phaser.GameObjects.Text;
  private hovered = false;
  private enabled = true;
  private keyLabel = '';

  constructor(private readonly scene: Phaser.Scene, private readonly opts: ActionKeyButtonOptions) {
    const { width: w, height: h } = opts;
    this.container = scene.add.container(opts.x, opts.y);
    this.bg = scene.add.graphics();
    this.container.add(this.bg);

    const iconX = -w / 2 + h / 2 + 2;
    if (!opts.bare && scene.textures.exists(opts.iconKey)) {
      this.icon = scene.add.image(iconX, 0, opts.iconKey).setDisplaySize(h - 6, h - 6);
      this.container.add(this.icon);
    }
    this.badgeText = scene.add.text(iconX + h / 2 - 6, h / 2 - 4, opts.badge ?? '', {
      fontFamily: FONTS.body,
      fontSize: '12px',
      fontStyle: 'bold',
      color: opts.badgeColor ?? T.count,
      stroke: COLORS.strokeBlack,
      strokeThickness: 3,
    }).setOrigin(1, 1);
    this.container.add(this.badgeText);

    this.labelText = scene.add.text(iconX + h / 2 + 8, 0, opts.label, {
      fontFamily: FONTS.body,
      fontSize: `${opts.labelFontSize ?? 15}px`,
      fontStyle: 'bold',
      color: T.label,
      stroke: COLORS.strokeBlack,
      strokeThickness: 3,
    }).setOrigin(opts.bare ? 1 : 0, 0.5);
    this.container.add(this.labelText);

    this.keyCap = scene.add.graphics();
    this.keyText = scene.add.text(0, -1, '', {
      fontFamily: FONTS.body,
      fontSize: opts.bare ? '16px' : '12px',
      fontStyle: 'bold',
      color: T.keyCapText,
      stroke: COLORS.strokeBlack,
      strokeThickness: 2,
    }).setOrigin(0.5);
    this.container.add([this.keyCap, this.keyText]);

    this.container.setSize(w, h);
    // A área de toque de um Container conta a partir do canto de cima à esquerda (o Phaser soma
    // metade do tamanho ao ponto). Com (-w/2, -h/2) só o quarto de cima à esquerda respondia.
    this.container.setInteractive(new Phaser.Geom.Rectangle(0, 0, w, h), Phaser.Geom.Rectangle.Contains);
    if (this.container.input) this.container.input.cursor = 'pointer';
    this.container.on('pointerover', () => {
      if (!this.enabled) return;
      this.hovered = true;
      opts.onHover?.();
      this.redraw();
    });
    this.container.on('pointerout', () => {
      this.hovered = false;
      this.redraw();
    });
    this.container.on('pointerdown', () => {
      if (this.enabled) opts.onClick();
    });

    this.redraw();
  }

  /** Atalho mostrado na tecla ('' esconde). */
  public setKey(label: string): void {
    if (label === this.keyLabel) return;
    this.keyLabel = label;
    this.redraw();
  }

  public setBadge(text: string): void {
    this.badgeText.setText(text);
  }

  public setEnabled(enabled: boolean): void {
    if (enabled === this.enabled) return;
    this.enabled = enabled;
    if (!enabled) this.hovered = false;
    this.redraw();
  }

  private redraw(): void {
    const { width: w, height: h } = this.opts;
    const border = !this.enabled ? T.borderDisabled : this.hovered ? T.borderHover : T.border;
    const g = this.bg;
    g.clear();
    if (!this.opts.bare) {
      // Moldura dupla com cantos reforçados (mesma linguagem da barra de armas)
      g.fillStyle(!this.enabled ? T.fillDisabled : this.hovered ? T.fillHover : T.fill, 0.94);
      g.fillRect(-w / 2, -h / 2, w, h);
      g.lineStyle(1, T.innerBorder, this.enabled ? 1 : 0.4);
      g.strokeRect(-w / 2 + 3, -h / 2 + 3, w - 6, h - 6);
      g.lineStyle(2, border, 1);
      g.strokeRect(-w / 2, -h / 2, w, h);
      g.fillStyle(border, 1);
      for (const [cx, cy] of [[-w / 2, -h / 2], [w / 2, -h / 2], [-w / 2, h / 2], [w / 2, h / 2]]) {
        g.fillRect(cx - 3, cy - 3, 6, 6);
      }
    }

    this.labelText.setColor(!this.enabled ? T.labelDisabled : this.hovered ? T.labelHover : T.label);
    this.icon?.setAlpha(this.enabled ? 1 : 0.35);
    this.badgeText.setAlpha(this.enabled ? 1 : 0.5);

    // Tecla: largura acompanha o texto (R, X, ESPAÇO...)
    this.keyText.setText(this.keyLabel);
    const showKey = this.keyLabel !== '' && this.enabled;
    this.keyCap.setVisible(showKey);
    this.keyText.setVisible(showKey);
    this.keyCap.clear();
    // Sem moldura a tecla é o único destaque, então fica maior para ler de longe
    const capH = this.opts.bare ? KEYCAP_H_BARE : KEYCAP_H;
    const px = this.opts.bare ? 4 : 2;
    const capW = Math.max(capH, Math.ceil((this.keyText.width + 16) / px) * px);
    // Sem moldura a tecla encosta na borda; o nome fica logo à esquerda dela
    const capX = w / 2 - (this.opts.bare ? 0 : 10) - capW / 2;
    if (this.opts.bare) this.labelText.setX(showKey ? capX - capW / 2 - 12 : w / 2);
    if (!showKey) return;
    this.keyText.setX(capX);
    const left = Math.round(capX - capW / 2);
    const top = Math.round(-capH / 2);
    // Tecla em pixel art: sombra em bloco por baixo e moldura em degrau
    drawPixelFrame(this.keyCap, left, top + px, capW, capH, { fill: T.keyCapShadow, border: T.keyCapShadow, px });
    drawPixelFrame(this.keyCap, left, top, capW, capH, {
      fill: T.keyCapFill,
      border: this.hovered ? T.borderHover : T.border,
      px
    });
  }
}
