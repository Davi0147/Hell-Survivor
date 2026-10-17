import Phaser from 'phaser';

export interface GamepadGameplayState {
  isActive: boolean;
  dx: number;
  dy: number;
  isSprint: boolean;
  isUltimate: boolean;
  isPause: boolean;
}

export interface GamepadMenuNavigation {
  up: boolean;
  down: boolean;
  left: boolean;
  right: boolean;
  confirm: boolean;
  cancel: boolean;
  reroll: boolean;
}

export class GamepadManager {
  private static instance: GamepadManager;

  // Estados de borda para botões (Just Down)
  private prevUltimateBtn: boolean = false;
  private prevPauseBtn: boolean = false;
  private prevConfirmBtn: boolean = false;
  private prevCancelBtn: boolean = false;
  private prevRerollBtn: boolean = false;

  // Debounce para navegação de menus (D-Pad e Analógico)
  private lastNavTime: number = 0;
  private readonly NAV_REPEAT_DELAY_MS: number = 190;

  // Zona morta para analógicos
  public readonly DEADZONE: number = 0.18;

  // Nome do controle ativo
  public padName: string = '';
  public isConnected: boolean = false;

  private constructor() {}

  public static getInstance(): GamepadManager {
    if (!GamepadManager.instance) {
      GamepadManager.instance = new GamepadManager();
    }
    return GamepadManager.instance;
  }

  /**
   * Obtém o primeiro gamepad conectado ativo na cena
   */
  public getActivePad(scene: Phaser.Scene): Phaser.Input.Gamepad.Gamepad | null {
    if (!scene.input || !scene.input.gamepad) return null;
    const pads = scene.input.gamepad.gamepads;
    for (let i = 0; i < pads.length; i++) {
      const p = pads[i];
      if (p && p.connected) {
        this.isConnected = true;
        this.padName = p.id || 'Controle';
        return p;
      }
    }
    this.isConnected = false;
    return null;
  }

  /**
   * Lê entradas de movimento e ações durante a partida (GameScene)
   */
  public getGameplayInput(scene: Phaser.Scene): GamepadGameplayState {
    const pad = this.getActivePad(scene);
    if (!pad) {
      this.prevUltimateBtn = false;
      this.prevPauseBtn = false;
      return {
        isActive: false,
        dx: 0,
        dy: 0,
        isSprint: false,
        isUltimate: false,
        isPause: false
      };
    }

    // 1. Vetor de Movimento (Analógico Esquerdo com Deadzone)
    let stickX = pad.leftStick.x;
    let stickY = pad.leftStick.y;

    if (Math.abs(stickX) < this.DEADZONE) stickX = 0;
    if (Math.abs(stickY) < this.DEADZONE) stickY = 0;

    // Normaliza se estiver além do círculo unitário
    const stickMag = Math.hypot(stickX, stickY);
    if (stickMag > 1) {
      stickX /= stickMag;
      stickY /= stickMag;
    }

    // 2. D-Pad (Direcionais Digitais)
    let dpadX = 0;
    let dpadY = 0;
    if (pad.left) dpadX -= 1;
    if (pad.right) dpadX += 1;
    if (pad.up) dpadY -= 1;
    if (pad.down) dpadY += 1;

    // Combina analógico e D-Pad (D-Pad tem prioridade máxima se pressionado)
    let finalDx = dpadX !== 0 ? dpadX : stickX;
    let finalDy = dpadY !== 0 ? dpadY : stickY;

    // 3. Sprint: Gatilhos (RT/R2, LT/L2) ou Botão B/Círculo (botão 1)
    const isR2 = pad.buttons[7] && pad.buttons[7].value > 0.15;
    const isL2 = pad.buttons[6] && pad.buttons[6].value > 0.15;
    const isB = pad.B || (pad.buttons[1] && pad.buttons[1].pressed);
    const isSprint = Boolean(isR2 || isL2 || isB);

    // 4. Suprema: Botão Y/Triângulo (3), X/Quadrado (2), ou R1/RB (5) (Edge Detection / Just Down)
    const ultBtnCurrent = Boolean(
      pad.Y ||
      pad.X ||
      (pad.buttons[3] && pad.buttons[3].pressed) ||
      (pad.buttons[2] && pad.buttons[2].pressed) ||
      (pad.buttons[5] && pad.buttons[5].pressed)
    );
    const isUltimate = ultBtnCurrent && !this.prevUltimateBtn;
    this.prevUltimateBtn = ultBtnCurrent;

    // 5. Pausa: Botão Start / Menu / Options (botão 9) (Edge Detection)
    const pauseBtnCurrent = Boolean(
      (pad.buttons[9] && pad.buttons[9].pressed) ||
      (pad.buttons[8] && pad.buttons[8].pressed)
    );
    const isPause = pauseBtnCurrent && !this.prevPauseBtn;
    this.prevPauseBtn = pauseBtnCurrent;

    return {
      isActive: true,
      dx: finalDx,
      dy: finalDy,
      isSprint,
      isUltimate,
      isPause
    };
  }

  /**
   * Lê comandos de navegação para menus e modais (MenuScene, UpgradeScene, Pause)
   */
  public getMenuNavigation(scene: Phaser.Scene): GamepadMenuNavigation {
    const pad = this.getActivePad(scene);
    if (!pad) {
      this.prevConfirmBtn = false;
      this.prevCancelBtn = false;
      this.prevRerollBtn = false;
      return {
        up: false,
        down: false,
        left: false,
        right: false,
        confirm: false,
        cancel: false,
        reroll: false
      };
    }

    const now = scene.time ? scene.time.now : Date.now();

    // Direções com Debounce de Repetição
    let navUp = false;
    let navDown = false;
    let navLeft = false;
    let navRight = false;

    const stickY = pad.leftStick.y;
    const stickX = pad.leftStick.x;

    const rawUp = pad.up || stickY < -0.55;
    const rawDown = pad.down || stickY > 0.55;
    const rawLeft = pad.left || stickX < -0.55;
    const rawRight = pad.right || stickX > 0.55;

    const isDirectionActive = rawUp || rawDown || rawLeft || rawRight;

    if (isDirectionActive && now - this.lastNavTime > this.NAV_REPEAT_DELAY_MS) {
      navUp = rawUp;
      navDown = rawDown;
      navLeft = rawLeft;
      navRight = rawRight;
      this.lastNavTime = now;
    } else if (!isDirectionActive) {
      this.lastNavTime = 0; // Reset imediato quando o jogador solta o direcional
    }

    // Ações com Edge Detection (Just Down)
    // Confirmação: Botão A / Cruz (botão 0) ou Start (9)
    const confirmCurrent = Boolean(pad.A || (pad.buttons[0] && pad.buttons[0].pressed));
    const confirm = confirmCurrent && !this.prevConfirmBtn;
    this.prevConfirmBtn = confirmCurrent;

    // Cancelamento / Voltar: Botão B / Círculo (botão 1)
    const cancelCurrent = Boolean(pad.B || (pad.buttons[1] && pad.buttons[1].pressed));
    const cancel = cancelCurrent && !this.prevCancelBtn;
    this.prevCancelBtn = cancelCurrent;

    // Reroll em cartas: Botão X / Quadrado (2) ou Y / Triângulo (3)
    const rerollCurrent = Boolean(
      pad.X ||
      pad.Y ||
      (pad.buttons[2] && pad.buttons[2].pressed) ||
      (pad.buttons[3] && pad.buttons[3].pressed)
    );
    const reroll = rerollCurrent && !this.prevRerollBtn;
    this.prevRerollBtn = rerollCurrent;

    return {
      up: navUp,
      down: navDown,
      left: navLeft,
      right: navRight,
      confirm,
      cancel,
      reroll
    };
  }

  /**
   * Vibração tátil no controle físico (Dual-Rumble / Haptic Feedback)
   */
  public vibrate(
    scene: Phaser.Scene,
    durationMs: number = 220,
    weakMagnitude: number = 0.4,
    strongMagnitude: number = 0.6
  ): void {
    const pad = this.getActivePad(scene);
    if (!pad || !pad.vibration) return;

    try {
      (pad.vibration as any).playEffect('dual-rumble', {
        startDelay: 0,
        duration: durationMs,
        weakMagnitude: Phaser.Math.Clamp(weakMagnitude, 0, 1),
        strongMagnitude: Phaser.Math.Clamp(strongMagnitude, 0, 1)
      });
    } catch {
      // Ignora silenciosamente se o browser ou gamepad não suportar rumble
    }
  }
}
