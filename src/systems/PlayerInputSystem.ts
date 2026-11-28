import Phaser from 'phaser';
import { GamepadManager } from './GamepadManager';
import { AutoPlayTestAgent, IAutoPlayWorld } from './AutoPlayTestAgent';
import type { TouchControls } from '../ui/TouchControls';

/** Intenção de movimento do jogador neste quadro. */
export interface MoveInput {
  dx: number;
  dy: number;
  isSprint: boolean;
  /** Esquiva pedida neste quadro (um toque = uma esquiva). */
  isDash: boolean;
}

/** Ações que o gamepad pode disparar fora do movimento. */
export interface IPlayerInputActions {
  /** Botão da Suprema (a cena decide se pode usar agora). */
  onUltimatePressed(): void;
  /** Botão Start/pausa (a cena decide se pode pausar agora). */
  onPausePressed(): void;
}

/**
 * PlayerInputSystem — junta teclado (WASD/setas + Shift para correr, Espaço para esquivar), gamepad,
 * controles de toque e o bot de testes [F3] em um único vetor de movimento.
 * Ordem de prioridade: bot > toque > gamepad > teclado.
 */
/**
 * Se a partida ficou este tempo sem ler os controles (diálogo, roleta de baú, cut-in), o primeiro
 * quadro de volta não vale como toque novo: o A/Espaço que fechou o diálogo não pode virar esquiva.
 */
export const RESUME_GAP_MS = 120;

/** O quadro atual é o primeiro depois de a partida ficar congelada? */
export function isResumeFrame(lastReadAt: number | undefined, now: number): boolean {
  return lastReadAt !== undefined && now - lastReadAt > RESUME_GAP_MS;
}

export class PlayerInputSystem {
  private readonly keys: Record<'w' | 'a' | 's' | 'd' | 'up' | 'left' | 'down' | 'right' | 'shift' | 'space', Phaser.Input.Keyboard.Key | undefined>;
  private lastReadAt?: number;

  constructor(private readonly scene: Phaser.Scene & IAutoPlayWorld, private readonly actions: IPlayerInputActions) {
    const kb = scene.input.keyboard;
    const add = (code: number): Phaser.Input.Keyboard.Key | undefined => kb?.addKey(code);
    const K = Phaser.Input.Keyboard.KeyCodes;
    this.keys = {
      w: add(K.W), a: add(K.A), s: add(K.S), d: add(K.D),
      up: add(K.UP), left: add(K.LEFT), down: add(K.DOWN), right: add(K.RIGHT),
      shift: add(K.SHIFT), space: add(K.SPACE)
    };
  }

  public read(delta: number, isMovementLocked: boolean): MoveInput {
    const now = this.scene.time.now;
    const resumed = isResumeFrame(this.lastReadAt, now);
    this.lastReadAt = now;
    const input = this.readRaw(delta, resumed);
    // Travas cinematográficas (ex.: transição de Azazel) zeram o movimento
    if (isMovementLocked) return { dx: 0, dy: 0, isSprint: false, isDash: false };
    return input;
  }

  /** @param resumed primeiro quadro depois de um congelamento: lê tudo (para sincronizar), mas ignora toques */
  private readRaw(delta: number, resumed: boolean): MoveInput {
    const bot = AutoPlayTestAgent.getInstance();
    if (bot.isEnabled) {
      const ai = bot.updateAgent(this.scene, delta);
      return { dx: ai.dx, dy: ai.dy, isSprint: ai.isSprint, isDash: false };
    }

    const k = this.keys;
    let dx = 0;
    let dy = 0;
    if (k.a?.isDown || k.left?.isDown) dx -= 1;
    if (k.d?.isDown || k.right?.isDown) dx += 1;
    if (k.w?.isDown || k.up?.isDown) dy -= 1;
    if (k.s?.isDown || k.down?.isDown) dy += 1;
    let isSprint = Boolean(k.shift?.isDown);
    let isDash = Boolean(k.space && Phaser.Input.Keyboard.JustDown(k.space));

    const pad = GamepadManager.getInstance().getGameplayInput(this.scene);
    if (pad.isActive) {
      // Zona morta pequena para o analógico não sobrescrever o teclado parado
      if (Math.abs(pad.dx) > 0.05 || Math.abs(pad.dy) > 0.05) {
        dx = pad.dx;
        dy = pad.dy;
      }
      if (pad.isSprint) isSprint = true;
      if (!resumed) {
        if (pad.isDash) isDash = true;
        if (pad.isUltimate) this.actions.onUltimatePressed();
        if (pad.isPause) this.actions.onPausePressed();
      }
    }

    const ui = this.scene.scene.get('UIScene') as { touchControls?: TouchControls } | null;
    const touch = ui?.touchControls;
    if (touch && (touch.isActive || touch.forceEnabled)) {
      const t = touch.getInput();
      if (t.hasMovement) {
        dx = t.dx;
        dy = t.dy;
      }
      if (t.isSprint) isSprint = true;
      if (touch.consumeDash()) isDash = true;
    }

    // O toque que fechou o diálogo já foi consumido acima; aqui ele só é descartado
    if (resumed) isDash = false;
    return { dx, dy, isSprint, isDash };
  }
}
