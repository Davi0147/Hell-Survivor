import Phaser from 'phaser';
import { COLORS, FONTS } from '../config/theme';
import { enableCensoredTextHighlight } from '../systems/TextHighlight';

export interface TalkAnchor {
  x: number;
  y: number;
}

/**
 * Fala curta escrita em cima de um personagem no mundo (sem caixa nem retrato, como os balões
 * de combate). Segue quem fala até ser trocada ou escondida. Usada no corredor do prólogo.
 */
export class WorldTalkBubble {
  private readonly text: Phaser.GameObjects.Text;
  private anchor: TalkAnchor | null = null;
  private offsetY = 0;

  constructor(private readonly scene: Phaser.Scene, fontSize: number, wrapWidth: number) {
    this.text = scene.add.text(0, 0, '', {
      fontFamily: FONTS.display,
      fontSize: `${fontSize}px`,
      fontStyle: 'bold',
      align: 'center',
      stroke: COLORS.strokeBlack,
      strokeThickness: 5,
      wordWrap: { width: wrapWidth },
    }).setOrigin(0.5, 1).setDepth(2000).setVisible(false);
    enableCensoredTextHighlight(this.text, COLORS.goldTextAccent);
  }

  /** Mostra `text` em cima de `anchor`, `offsetY` px acima do ponto dele. */
  public show(anchor: TalkAnchor, offsetY: number, text: string, color: string): void {
    this.anchor = anchor;
    this.offsetY = offsetY;
    this.scene.tweens.killTweensOf(this.text);
    this.text.setText(text).setColor(color).setVisible(true).setAlpha(0);
    this.follow();
    this.text.y += 6;
    this.scene.tweens.add({ targets: this.text, alpha: 1, y: this.text.y - 6, duration: 140, ease: 'Quad.easeOut' });
  }

  public hide(): void {
    this.anchor = null;
    this.scene.tweens.killTweensOf(this.text);
    this.text.setVisible(false);
  }

  public get isVisible(): boolean {
    return this.text.visible;
  }

  /** Chamar a cada quadro para acompanhar quem está falando. */
  public follow(): void {
    if (!this.anchor) return;
    this.text.setPosition(Math.round(this.anchor.x), Math.round(this.anchor.y + this.offsetY));
  }

  public destroy(): void {
    this.text.destroy();
  }
}
