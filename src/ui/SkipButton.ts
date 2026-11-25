import Phaser from 'phaser';
import { ActionKeyButton } from './ActionKeyButton';

/** Tamanho em pixels do jogo. No celular o jogo inteiro é encolhido para ~45%, então o botão cresce. */
const SIZE = {
  desktop: { w: 250, h: 40, font: 15, margin: 18 },
  // ~165 x 43 pt num iPhone deitado: o mínimo confortável para o dedo
  touch: { w: 340, h: 88, font: 24, margin: 22 },
} as const;

export function isTouchDevice(scene: Phaser.Scene): boolean {
  const d = scene.sys.game.device;
  return Boolean(d.input.touch && !d.os.desktop);
}

/**
 * Botão "PULAR" das cenas de história (intro, fim de capítulo, diálogos no meio da partida).
 * Só o nome e a tecla (sem moldura nem ícone, para não tapar a cena); no celular fica grande o bastante para o
 * dedo, e a cena deve ignorar toques que caem nele (`containsPointer`) para não avançar o texto.
 */
export class SkipButton {
  private readonly button: ActionKeyButton;
  private readonly bounds: Phaser.Geom.Rectangle;

  constructor(scene: Phaser.Scene, label: string, onSkip: () => void, depth: number) {
    const s = isTouchDevice(scene) ? SIZE.touch : SIZE.desktop;
    const x = scene.scale.width - s.margin - s.w / 2;
    const y = s.margin + s.h / 2;
    this.bounds = new Phaser.Geom.Rectangle(x - s.w / 2, y - s.h / 2, s.w, s.h);
    this.button = new ActionKeyButton(scene, {
      x,
      y,
      width: s.w,
      height: s.h,
      iconKey: 'ui-icon-skip',
      label,
      labelFontSize: s.font,
      bare: true,
      // ESC / B / círculo, conforme o aparelho; nenhum no toque
      action: 'skip',
      // O som do clique fica com a cena (o ESC e o botão B passam pelo mesmo caminho)
      onClick: onSkip,
    });
    this.button.container.setDepth(depth).setScrollFactor(0);
  }

  public get container(): Phaser.GameObjects.Container {
    return this.button.container;
  }

  public setVisible(visible: boolean): void {
    this.button.container.setVisible(visible);
  }

  /** O toque caiu no botão? (para a cena não tratar o mesmo toque como "avançar"). */
  public containsPointer(pointer: Phaser.Input.Pointer): boolean {
    return this.button.container.visible && this.bounds.contains(pointer.x, pointer.y);
  }

  public destroy(): void {
    this.button.container.destroy();
  }
}
