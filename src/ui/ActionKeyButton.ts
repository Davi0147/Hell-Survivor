import Phaser from 'phaser';
import { FONTS, COLORS, ACTION_BUTTON_THEME as T } from '../config/theme';
import type { InputAction } from '../config/inputGlyphs';
import { INPUT_DEVICE_CHANGED, InputDeviceTracker } from '../systems/InputDeviceTracker';
import { InputHint } from './InputHint';

const GLYPH_H = 26;
const GLYPH_H_BARE = 32;

export interface ActionKeyButtonOptions {
  x: number;
  y: number;
  width: number;
  height: number;
  iconKey: string;
  label: string;
  /** Ação do atalho: o ícone do botão certo aparece à direita (some no toque). */
  action: InputAction;
  /** Número pequeno no canto do ícone (cargas, cura). */
  badge?: string;
  badgeColor?: string;
  onClick: () => void;
  onHover?: () => void;
  /** Tamanho da fonte do nome (padrão 15). Maior no celular, onde o jogo é encolhido. */
  labelFontSize?: number;
  /** Sem moldura e sem ícone: só o nome e o botão, alinhados à direita (ex.: PULAR nas cutscenes). */
  bare?: boolean;
}

/**
 * Botão de ação minimalista: ícone, nome e, à direita, o ícone do botão do aparelho em
 * uso (R, X, quadrado...). No toque o ícone some (o próprio botão é o toque).
 */
export class ActionKeyButton {
  public readonly container: Phaser.GameObjects.Container;
  private readonly bg: Phaser.GameObjects.Graphics;
  private readonly icon?: Phaser.GameObjects.Image;
  private readonly labelText: Phaser.GameObjects.Text;
  private readonly badgeText: Phaser.GameObjects.Text;
  private readonly glyph: InputHint;
  private hovered = false;
  private enabled = true;

  constructor(scene: Phaser.Scene, private readonly opts: ActionKeyButtonOptions) {
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

    // Sem moldura o botão encosta na borda; com moldura fica um pouco para dentro
    this.glyph = new InputHint(scene, w / 2 - (opts.bare ? 0 : 10), 0, [opts.action], {
      glyphHeight: opts.bare ? GLYPH_H_BARE : GLYPH_H,
      align: 'right',
    });
    this.container.add(this.glyph.container);

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

    // O ícone muda de largura com o aparelho (ESC x círculo): o nome acompanha
    const tracker = InputDeviceTracker.getInstance();
    tracker.on(INPUT_DEVICE_CHANGED, this.redraw, this);
    this.container.once(Phaser.GameObjects.Events.DESTROY, () => tracker.off(INPUT_DEVICE_CHANGED, this.redraw, this));

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

    const glyphW = this.glyph.displayWidth;
    const showGlyph = glyphW > 0 && this.enabled;
    this.glyph.container.setAlpha(showGlyph ? 1 : 0);
    // Aceso no hover, como a tecla desenhada fazia
    this.glyph.container.setScale(this.hovered ? 1.08 : 1);
    if (this.opts.bare) this.labelText.setX(showGlyph ? w / 2 - glyphW - 12 : w / 2);
  }
}
