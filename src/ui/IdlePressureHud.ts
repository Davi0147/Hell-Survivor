import Phaser from 'phaser';
import { FONTS, IDLE_PRESSURE_THEME as T } from '../config/theme';
import { IDLE_PRESSURE_BALANCE } from '../config/balance';

/** O que o aviso precisa saber da Pressão do Abismo. */
export interface IIdlePressureView {
  readonly bonus: number;
  readonly secondsStill: number;
}

/** A partir de quantos segundos parado o aviso amarelo aparece (antes do 1º degrau). */
const WARN_AFTER_SEC = 5;

/**
 * Aviso no topo da tela, abaixo do cronômetro: primeiro amarelo ("mexa-se, faltam Xs"),
 * depois vermelho pulsando com a força extra dos monstros.
 */
export class IdlePressureHud {
  private readonly text: Phaser.GameObjects.Text;
  private pulse = 0;

  constructor(ui: Phaser.Scene) {
    this.text = ui.add.text(ui.scale.width / 2, 58, '', {
      fontFamily: FONTS.body,
      fontSize: '11px',
      fontStyle: 'bold',
      color: T.warnText,
      stroke: T.stroke,
      strokeThickness: 3
    }).setOrigin(0.5).setDepth(117).setVisible(false);
  }

  /** `view` indefinido = sem aviso (fora do Infinito ou HUD escondida). */
  public update(view: IIdlePressureView | undefined, deltaMs: number): void {
    if (!view || view.secondsStill < WARN_AFTER_SEC) {
      this.text.setVisible(false);
      return;
    }
    this.text.setVisible(true);
    if (view.bonus <= 0) {
      const left = Math.max(1, Math.ceil(IDLE_PRESSURE_BALANCE.stepMs / 1000 - view.secondsStill));
      this.text.setColor(T.warnText).setAlpha(1).setScale(1);
      this.text.setText(`PARADA DEMAIS! O ABISMO REAGE EM ${left}s`);
      return;
    }
    this.pulse += deltaMs;
    const wave = 0.5 + 0.5 * Math.sin(this.pulse / 140);
    this.text.setColor(T.dangerText).setAlpha(0.65 + 0.35 * wave).setScale(1 + 0.06 * wave);
    this.text.setText(`ABISMO AGITADO: MONSTROS +${Math.round(view.bonus * 100)}%  -  SAIA DO LUGAR!`);
  }

  public destroy(): void {
    this.text.destroy();
  }
}
