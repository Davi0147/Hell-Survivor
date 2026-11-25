import Phaser from 'phaser';
import {
  findActivePad,
  padFamilyFromId,
  schemeOf,
  type ControlScheme,
  type InputDevice,
  type PadSnapshot,
} from '../config/inputGlyphs';

export const INPUT_DEVICE_CHANGED = 'input-device-changed';

/**
 * Fonte única de "qual aparelho o jogador está usando agora": teclado/mouse, controle
 * (tipo Xbox ou PlayStation) ou toque. As dicas de botão escutam a troca e mudam o ícone.
 * Escuta o navegador direto (teclado e ponteiro) e olha os controles uma vez por quadro,
 * então vale para todas as cenas sem cada uma repetir a detecção.
 */
export class InputDeviceTracker extends Phaser.Events.EventEmitter {
  private static instance?: InputDeviceTracker;
  private current: InputDevice = 'keyboard';
  private game?: Phaser.Game;

  public static getInstance(): InputDeviceTracker {
    if (!InputDeviceTracker.instance) InputDeviceTracker.instance = new InputDeviceTracker();
    return InputDeviceTracker.instance;
  }

  public get device(): InputDevice {
    return this.current;
  }

  public get scheme(): ControlScheme {
    return schemeOf(this.current);
  }

  /** Chamado uma vez na BootScene. Repetir não duplica nada. */
  public attach(game: Phaser.Game): void {
    if (this.game) return;
    this.game = game;
    const d = game.device;
    this.current = d.input.touch && !d.os.desktop ? 'touch' : 'keyboard';

    window.addEventListener('keydown', this.onKeyDown, true);
    window.addEventListener('pointerdown', this.onPointerDown, true);
    game.events.on(Phaser.Core.Events.PRE_STEP, this.pollPads);
    game.events.once(Phaser.Core.Events.DESTROY, () => this.detach());
  }

  public detach(): void {
    window.removeEventListener('keydown', this.onKeyDown, true);
    window.removeEventListener('pointerdown', this.onPointerDown, true);
    this.game?.events.off(Phaser.Core.Events.PRE_STEP, this.pollPads);
    this.game = undefined;
  }

  /** Troca o aparelho (público para testes e para o Modo de Teste). */
  public setDevice(device: InputDevice): void {
    if (device === this.current) return;
    this.current = device;
    this.emit(INPUT_DEVICE_CHANGED, device);
  }

  private readonly onKeyDown = (): void => this.setDevice('keyboard');

  private readonly onPointerDown = (e: PointerEvent): void => {
    if (e.pointerType === 'touch' || e.pointerType === 'pen') this.setDevice('touch');
    // Clique de mouse só volta para o teclado se não estava no controle (o mouse se mexe sozinho na mesa)
    else if (e.pointerType === 'mouse' && this.current === 'touch') this.setDevice('keyboard');
  };

  private readonly pollPads = (): void => {
    if (typeof navigator === 'undefined' || !navigator.getGamepads) return;
    let pads: ReadonlyArray<PadSnapshot | null>;
    try {
      pads = Array.from(navigator.getGamepads());
    } catch {
      return; // Alguns navegadores bloqueiam a API fora de contexto seguro
    }
    const active = findActivePad(pads);
    if (active) this.setDevice(padFamilyFromId(active.id));
  };
}
