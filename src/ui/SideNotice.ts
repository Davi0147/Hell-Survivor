import Phaser from 'phaser';
import { SIDE_NOTICE_THEME } from '../config/theme';

/** Tempos e posição do aviso lateral. */
const NOTICE = {
  x: 22,
  /** Logo abaixo da HUD de status (retrato, vida e armas). */
  y: 285,
  rowGap: 26,
  slideMs: 280,
  holdMs: 3000,
  fontSize: '15px',
} as const;

/**
 * Aviso pequeno e discreto que desliza da borda esquerda, fica alguns segundos e volta por onde
 * veio ("Novo: Morcegos"). Vários ao mesmo tempo empilham em linhas, sem sobrepor.
 */
export class SideNotice {
  private readonly rows: (Phaser.GameObjects.Container | null)[] = [];

  constructor(private readonly ui: Phaser.Scene, private readonly font: string) {}

  public show(label: string, text: string): void {
    const s = this.ui;
    let row = this.rows.indexOf(null);
    if (row === -1) row = this.rows.length;

    const container = s.add.container(0, NOTICE.y + row * NOTICE.rowGap).setDepth(130);
    const style = {
      fontFamily: this.font,
      fontSize: NOTICE.fontSize,
      fontStyle: 'bold',
      stroke: SIDE_NOTICE_THEME.stroke,
      strokeThickness: 4,
    };
    const labelText = s.add.text(0, 0, label, { ...style, color: SIDE_NOTICE_THEME.label }).setOrigin(0, 0.5);
    const bodyText = s.add.text(labelText.width + 6, 0, text, { ...style, color: SIDE_NOTICE_THEME.text }).setOrigin(0, 0.5);
    container.add([labelText, bodyText]);

    const hiddenX = -(labelText.width + bodyText.width + 30);
    container.x = hiddenX;
    this.rows[row] = container;

    s.tweens.add({ targets: container, x: NOTICE.x, duration: NOTICE.slideMs, ease: 'Cubic.easeOut' });
    s.time.delayedCall(NOTICE.slideMs + NOTICE.holdMs, () => {
      if (!container.scene) return;
      s.tweens.add({
        targets: container,
        x: hiddenX,
        duration: NOTICE.slideMs,
        ease: 'Cubic.easeIn',
        onComplete: () => {
          container.destroy();
          if (this.rows[row] === container) this.rows[row] = null;
        },
      });
    });
  }
}
