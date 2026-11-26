import Phaser from 'phaser';
import { FONTS, COLORS, MODAL_THEME } from '../config/theme';
import { SoundManager } from '../systems/SoundManager';
import { createGlowButton, type IGlowButton, type IGlowButtonStyle } from './pauseWidgets';

export interface IDialogButton extends IGlowButtonStyle {
  onClick: () => void;
}

/**
 * Janela por cima do menu de pausa: explicação de um bônus/arma ou confirmação de uma ação
 * (Reiniciar, Menu). Só existe uma aberta por vez. Fecha com o X, clicando fora ou com ESC.
 */
export class PauseDialog {
  private popup?: Phaser.GameObjects.Container;
  private buttons: IGlowButton[] = [];
  private actions: Array<() => void> = [];
  private selected = 0;

  constructor(
    private readonly host: Phaser.Scene,
    /** Chamado depois de fechar (o menu usa para segurar o ESC que fechou). */
    private readonly onClosed: () => void
  ) {}

  public get isOpen(): boolean {
    return this.popup !== undefined;
  }

  /** Ícone grande no topo, nome, valor e explicação. */
  public openInfo(parent: Phaser.GameObjects.Container, iconKey: string, title: string, subtitle: string, body: string): void {
    const t = MODAL_THEME.pause;
    const shell = this.openShell(parent, 440, 300);
    if (!shell) return;
    const { popup, cx, top } = shell;

    const iconY = top + 62;
    const ring = this.host.add.graphics();
    ring.fillStyle(t.cellFill, 1);
    ring.fillCircle(cx, iconY, 44);
    ring.lineStyle(2, t.innerBorderColor, 1);
    ring.strokeCircle(cx, iconY, 44);
    popup.add(ring);
    if (this.host.textures?.exists(iconKey)) {
      // Cabe em 72x72 sem esticar (os ícones dos talismãs não são quadrados)
      const icon = this.host.add.image(cx, iconY, iconKey);
      icon.setScale(Math.min(72 / icon.width, 72 / icon.height));
      popup.add(icon);
    }

    popup.add(this.text(cx, iconY + 66, title, 16, t.titleColor, t.titleStroke, 4));
    popup.add(this.text(cx, iconY + 92, subtitle, 12, t.subtitleColor));
    popup.add(this.text(cx, iconY + 134, body, 11, t.valueColor).setWordWrapWidth(370).setAlign('center'));
  }

  /** Pergunta com botões lado a lado; o primeiro (o seguro) começa selecionado. */
  public openConfirm(parent: Phaser.GameObjects.Container, title: string, body: string, buttons: IDialogButton[]): void {
    const t = MODAL_THEME.pause;
    const shell = this.openShell(parent, 480, 250);
    if (!shell) return;
    const { popup, cx, top } = shell;

    popup.add(this.text(cx, top + 52, title, 18, t.titleColor, t.titleStroke, 4));
    popup.add(this.text(cx, top + 108, body, 11, t.valueColor).setWordWrapWidth(400).setAlign('center'));

    const bw = 190;
    const bh = 54;
    const gap = 24;
    const startX = cx - ((buttons.length - 1) * (bw + gap)) / 2;
    buttons.forEach((b, i) => {
      const btn = createGlowButton(this.host, startX + i * (bw + gap), top + 190, bw, bh, b);
      btn.objects.forEach((o) => popup.add(o));
      btn.zone.on('pointerover', () => this.select(i));
      btn.zone.on('pointerdown', () => this.activate(i));
      this.buttons.push(btn);
      this.actions.push(b.onClick);
    });
    this.select(0);
  }

  /** Teclado e controle com a janela aberta. Devolve true se a janela tratou a tecla. */
  public handleInput(left: boolean, right: boolean, confirm: boolean, cancel: boolean): boolean {
    if (!this.popup) return false;
    if (cancel) {
      this.close();
    } else if (this.buttons.length > 0) {
      if (left) this.select((this.selected - 1 + this.buttons.length) % this.buttons.length);
      else if (right) this.select((this.selected + 1) % this.buttons.length);
      else if (confirm) this.activate(this.selected);
    } else if (confirm) {
      this.close();
    }
    return true;
  }

  public close(): void {
    if (!this.popup) return;
    SoundManager.getInstance().playMenuClick();
    this.popup.destroy();
    this.reset();
    this.onClosed();
  }

  /** O container pai foi destruído junto com o menu: só esquece a referência. */
  public reset(): void {
    this.popup = undefined;
    this.buttons = [];
    this.actions = [];
    this.selected = 0;
  }

  private select(i: number): void {
    if (i !== this.selected) SoundManager.getInstance().playMenuHover();
    this.selected = i;
    this.buttons.forEach((b, j) => b.render(j === i));
  }

  private activate(i: number): void {
    const action = this.actions[i];
    this.close();
    action?.();
  }

  /** Fundo escuro, caixa com borda dupla e o X do canto. */
  private openShell(parent: Phaser.GameObjects.Container, w: number, h: number):
    { popup: Phaser.GameObjects.Container; cx: number; top: number } | undefined {
    if (this.popup) return undefined;
    const t = MODAL_THEME.pause;
    const { width, height } = this.host.scale;
    const cx = width / 2;
    const cy = height / 2;
    const top = cy - h / 2;
    const popup = this.host.add.container(0, 0);
    this.popup = popup;
    parent.add(popup);

    // Fundo bloqueia cliques no menu; clicar fora fecha
    const shade = this.host.add.rectangle(cx, cy, width, height, MODAL_THEME.backdropColor, 0.6);
    shade.setInteractive();
    shade.on('pointerdown', () => this.close());
    popup.add(shade);

    const box = this.host.add.graphics();
    box.fillStyle(t.panelFill, 1);
    box.fillRoundedRect(cx - w / 2, top, w, h, 12);
    box.lineStyle(3, t.outerBorderColor, 1);
    box.strokeRoundedRect(cx - w / 2, top, w, h, 12);
    box.lineStyle(1.5, t.innerBorderColor, 0.6);
    box.strokeRoundedRect(cx - w / 2 + 5, top + 5, w - 10, h - 10, 9);
    popup.add(box);
    popup.add(this.host.add.zone(cx, cy, w, h).setInteractive()); // clicar na caixa não fecha

    const xx = cx + w / 2 - 26;
    const xy = top + 26;
    const xBg = this.host.add.graphics();
    const drawX = (hover: boolean): void => {
      xBg.clear();
      xBg.fillStyle(hover ? t.btnRestartBorder : t.btnRestartBg, 1);
      xBg.fillCircle(xx, xy, 15);
      xBg.lineStyle(2, hover ? t.btnHoverBorder : t.btnRestartBorder, 1);
      xBg.strokeCircle(xx, xy, 15);
    };
    drawX(false);
    popup.add(xBg);
    popup.add(this.text(xx, xy, 'X', 14, COLORS.textWhite));
    const xZone = this.host.add.zone(xx, xy, 40, 40).setInteractive({ useHandCursor: true });
    xZone.on('pointerover', () => drawX(true));
    xZone.on('pointerout', () => drawX(false));
    xZone.on('pointerdown', () => this.close());
    popup.add(xZone);
    return { popup, cx, top };
  }

  private text(x: number, y: number, value: string, size: number, color: string,
    stroke: string = MODAL_THEME.pause.textStroke, thickness = 3): Phaser.GameObjects.Text {
    return this.host.add.text(x, y, value, {
      fontFamily: FONTS.body,
      fontSize: `${size}px`,
      fontStyle: 'bold',
      color,
      stroke,
      strokeThickness: thickness
    }).setOrigin(0.5, 0.5);
  }
}
