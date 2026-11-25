import Phaser from 'phaser';
import { FONTS, COLORS, INPUT_HINT_THEME as T } from '../config/theme';
import { BUTTON_GLYPH_ATLAS, GLYPH_KEY_HEIGHT, glyphFramesFor, type InputAction } from '../config/inputGlyphs';
import { INPUT_DEVICE_CHANGED, InputDeviceTracker } from '../systems/InputDeviceTracker';

/** Um pedaço da dica: o ícone de uma ação (`'dash'`) ou um texto (`{ text: 'Esquiva' }`). */
export type HintPart = InputAction | { readonly text: string };

export interface InputHintOptions {
  /** Altura de uma tecla comum na tela, em pixels do jogo (padrão 24). */
  glyphHeight?: number;
  fontSize?: number;
  color?: string;
  /** Onde fica o ponto (x, y): na ponta esquerda, no meio ou na ponta direita da linha. */
  align?: 'left' | 'center' | 'right';
  /** Placa escura atrás (para ler por cima do mapa). */
  plate?: boolean;
  /** Espaço entre um ícone e o texto dele (padrão 6) e entre um texto e o próximo ícone (padrão 18). */
  innerGap?: number;
  outerGap?: number;
}

const PLATE_PAD_X = 10;
const PLATE_PAD_Y = 5;

/**
 * Linha de dica de controle feita de ícones de botão e textos, por exemplo
 * `[WASD] Mover  [Shift] Sprint`. Troca os ícones sozinha quando o jogador passa do
 * teclado para o controle (ou para um controle de outra marca). Ação sem ícone naquele
 * aparelho (ex.: esquiva no toque) some junto com o texto que vem logo depois.
 */
export class InputHint {
  public readonly container: Phaser.GameObjects.Container;
  private readonly plate?: Phaser.GameObjects.Graphics;
  private readonly texts = new Map<number, Phaser.GameObjects.Text>();
  private glyphs: Phaser.GameObjects.Image[] = [];
  private width = 0;

  constructor(
    private readonly scene: Phaser.Scene,
    x: number,
    y: number,
    private readonly parts: ReadonlyArray<HintPart>,
    private readonly opts: InputHintOptions = {}
  ) {
    this.container = scene.add.container(x, y);
    if (opts.plate) {
      this.plate = scene.add.graphics();
      this.container.add(this.plate);
    }
    parts.forEach((part, i) => {
      if (typeof part === 'string') return;
      const text = scene.add.text(0, 0, part.text, {
        fontFamily: FONTS.body,
        fontSize: `${opts.fontSize ?? 10}px`,
        color: opts.color ?? T.text,
        stroke: COLORS.strokeBlack,
        strokeThickness: 3,
      }).setOrigin(0, 0.5);
      this.texts.set(i, text);
      this.container.add(text);
    });

    const tracker = InputDeviceTracker.getInstance();
    tracker.on(INPUT_DEVICE_CHANGED, this.layout, this);
    this.container.once(Phaser.GameObjects.Events.DESTROY, () => tracker.off(INPUT_DEVICE_CHANGED, this.layout, this));
    this.layout();
  }

  /** Largura atual da linha (muda com o aparelho). */
  public get displayWidth(): number {
    return this.width;
  }

  /** Troca o texto de um pedaço já criado (índice na lista `parts`). */
  public setText(partIndex: number, text: string): void {
    const t = this.texts.get(partIndex);
    if (!t || t.text === text) return;
    t.setText(text);
    this.layout();
  }

  public destroy(): void {
    this.container.destroy();
  }

  private layout(): void {
    for (const g of this.glyphs) g.destroy();
    this.glyphs = [];
    const device = InputDeviceTracker.getInstance().device;
    const hasAtlas = this.scene.textures.exists(BUTTON_GLYPH_ATLAS);
    const scale = (this.opts.glyphHeight ?? 24) / GLYPH_KEY_HEIGHT;
    const innerGap = this.opts.innerGap ?? 6;
    const outerGap = this.opts.outerGap ?? 18;

    // Monta da esquerda para a direita a partir do zero; depois desloca conforme o alinhamento
    const placed: Array<{ obj: Phaser.GameObjects.Image | Phaser.GameObjects.Text; w: number }> = [];
    let x = 0;
    let hideNextText = false;
    let prevWasGlyph = false;
    this.parts.forEach((part, i) => {
      if (typeof part === 'string') {
        const frames = hasAtlas ? glyphFramesFor(part, device) : [];
        hideNextText = frames.length === 0;
        frames.forEach((frame, k) => {
          if (placed.length > 0) x += prevWasGlyph && k > 0 ? 4 : prevWasGlyph ? innerGap : outerGap;
          const img = this.scene.add.image(0, 0, BUTTON_GLYPH_ATLAS, frame).setScale(scale).setOrigin(0, 0.5);
          this.container.add(img);
          this.glyphs.push(img);
          placed.push({ obj: img, w: img.displayWidth });
          img.setX(x);
          x += img.displayWidth;
          prevWasGlyph = true;
        });
        return;
      }
      const t = this.texts.get(i);
      if (!t) return;
      const visible = !hideNextText && t.text !== '';
      t.setVisible(visible);
      hideNextText = false;
      if (!visible) return;
      if (placed.length > 0) x += prevWasGlyph ? innerGap : outerGap;
      t.setX(x);
      placed.push({ obj: t, w: t.width });
      x += t.width;
      prevWasGlyph = false;
    });

    this.width = x;
    const align = this.opts.align ?? 'left';
    const shift = align === 'center' ? -x / 2 : align === 'right' ? -x : 0;
    for (const p of placed) p.obj.setX(Math.round(p.obj.x + shift));

    // Visibilidade do container fica com quem usa (a HUD esconde e mostra tudo junto)
    if (this.plate) {
      const h = Math.max(this.opts.glyphHeight ?? 24, ...placed.map((p) => p.obj.displayHeight)) + PLATE_PAD_Y * 2;
      this.plate.clear();
      if (placed.length === 0) return;
      this.plate.fillStyle(T.plate, T.plateAlpha);
      this.plate.fillRect(shift - PLATE_PAD_X, -h / 2, x + PLATE_PAD_X * 2, h);
      this.plate.lineStyle(1, T.plateBorder, 1);
      this.plate.strokeRect(shift - PLATE_PAD_X, -h / 2, x + PLATE_PAD_X * 2, h);
    }
  }
}
