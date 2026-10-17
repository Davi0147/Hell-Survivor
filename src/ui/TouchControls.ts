import Phaser from 'phaser';

export interface TouchInputState {
  hasMovement: boolean;
  dx: number;
  dy: number;
  isSprint: boolean;
}

export class TouchControls {
  private scene: Phaser.Scene;
  private container: Phaser.GameObjects.Container;

  // Estados de Entrada
  public isActive: boolean = false;
  public forceEnabled: boolean = false;
  private dx: number = 0;
  private dy: number = 0;
  private isSprint: boolean = false;

  // Joystick Virtual (Lado Esquerdo)
  private joystickBase: Phaser.GameObjects.Graphics;
  private joystickKnob: Phaser.GameObjects.Graphics;
  private joystickPointer: Phaser.Input.Pointer | null = null;
  private baseX: number = 130;
  private baseY: number = 590;
  private knobX: number = 130;
  private knobY: number = 590;
  private readonly BASE_RADIUS: number = 58;
  private readonly KNOB_RADIUS: number = 24;
  private readonly MAX_DISTANCE: number = 50;
  private readonly DEADZONE: number = 8;

  // Botões de Ação (Lado Direito)
  private sprintBtnGraphics: Phaser.GameObjects.Graphics;
  private sprintBtnText: Phaser.GameObjects.Text;
  private sprintPointer: Phaser.Input.Pointer | null = null;
  private sprintBtnX: number = 0;
  private sprintBtnY: number = 0;
  private readonly SPRINT_RADIUS: number = 36;

  private ultBtnGraphics: Phaser.GameObjects.Graphics;
  private ultBtnText: Phaser.GameObjects.Text;
  private ultBtnX: number = 0;
  private ultBtnY: number = 0;
  private readonly ULT_RADIUS: number = 32;

  // Botão de Pausa Rápida (Canto Superior Direito)
  private pauseBtnGraphics: Phaser.GameObjects.Graphics;
  private pauseBtnText: Phaser.GameObjects.Text;

  // Visibilidade e Ciclo
  private isVisibleState: boolean = true;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    const { width, height } = scene.scale;

    this.container = scene.add.container(0, 0);
    this.container.setDepth(1200);

    // Detecção: ativa se o dispositivo suportar touch ou em mobile
    const hasTouch = scene.sys.game.device.input.touch || (typeof window !== 'undefined' && ('ontouchstart' in window || navigator.maxTouchPoints > 0));
    this.isActive = Boolean(hasTouch);

    // Posicionamento Ergonômico dos Botões
    this.baseX = Math.round(width * 0.14);
    this.baseY = Math.round(height * 0.81);
    this.knobX = this.baseX;
    this.knobY = this.baseY;

    this.sprintBtnX = width - 85;
    this.sprintBtnY = height - 85;

    this.ultBtnX = width - 165;
    this.ultBtnY = height - 130;

    // 1. Elementos Gráficos do Joystick
    this.joystickBase = scene.add.graphics();
    this.joystickKnob = scene.add.graphics();
    this.container.add(this.joystickBase);
    this.container.add(this.joystickKnob);

    // 2. Botão de Sprint
    this.sprintBtnGraphics = scene.add.graphics();
    this.container.add(this.sprintBtnGraphics);

    const pixelFont = "'Silkscreen', 'Press Start 2P', monospace";
    this.sprintBtnText = scene.add.text(this.sprintBtnX, this.sprintBtnY, 'SPRINT', {
      fontFamily: pixelFont,
      fontSize: '9px',
      fontStyle: 'bold',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5);
    this.container.add(this.sprintBtnText);

    // 3. Botão de Suprema
    this.ultBtnGraphics = scene.add.graphics();
    this.container.add(this.ultBtnGraphics);

    this.ultBtnText = scene.add.text(this.ultBtnX, this.ultBtnY, 'ULT', {
      fontFamily: pixelFont,
      fontSize: '11px',
      fontStyle: 'bold',
      color: '#ffd60a',
      stroke: '#000000',
      strokeThickness: 3.5
    }).setOrigin(0.5);
    this.container.add(this.ultBtnText);

    // 4. Botão de Pausa Rápida para Mobile (ao lado do medidor de almas)
    this.pauseBtnGraphics = scene.add.graphics();
    this.container.add(this.pauseBtnGraphics);

    const pauseX = width - 42;
    const pauseY = 135;
    this.pauseBtnText = scene.add.text(pauseX, pauseY, '||', {
      fontFamily: pixelFont,
      fontSize: '11px',
      fontStyle: 'bold',
      color: '#f3d17a',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5);
    this.container.add(this.pauseBtnText);

    // Desenha estado visual estático inicial
    this.drawJoystickBase();
    this.drawJoystickKnob();
    this.drawSprintButton(false);
    this.drawUltButton(false, false);
    this.drawPauseButton(pauseX, pauseY);

    // Registra listeners de ponteiros (Touch / Mouse)
    this.setupListeners(pauseX, pauseY);

    // Se não for touch nativo e nem forçado, oculta inicialmente
    this.container.setVisible(this.isActive || this.forceEnabled);
  }

  private drawJoystickBase(): void {
    const g = this.joystickBase;
    g.clear();

    // Círculo base gótico escuro translúcido
    g.fillStyle(0x0e0308, 0.45);
    g.fillCircle(this.baseX, this.baseY, this.BASE_RADIUS);

    // Anel externo em ouro envelhecido
    g.lineStyle(2, 0xc59b27, 0.7);
    g.strokeCircle(this.baseX, this.baseY, this.BASE_RADIUS);

    // Marcadores em cruz nos eixos principais
    g.lineStyle(1.5, 0xf3d17a, 0.4);
    g.lineBetween(this.baseX - 10, this.baseY, this.baseX + 10, this.baseY);
    g.lineBetween(this.baseX, this.baseY - 10, this.baseX, this.baseY + 10);
  }

  private drawJoystickKnob(): void {
    const g = this.joystickKnob;
    g.clear();

    // Sombra do manípulo
    g.fillStyle(0x000000, 0.35);
    g.fillCircle(this.knobX + 1, this.knobY + 2, this.KNOB_RADIUS);

    // Corpo carmesim / rubi do manípulo
    g.fillStyle(0x9d0208, 0.85);
    g.fillCircle(this.knobX, this.knobY, this.KNOB_RADIUS);

    // Brilho concêntrico superior
    g.fillStyle(0xd90429, 0.95);
    g.fillCircle(this.knobX, this.knobY - 3, this.KNOB_RADIUS * 0.65);

    // Borda fina dourada
    g.lineStyle(1.5, 0xffd60a, 0.8);
    g.strokeCircle(this.knobX, this.knobY, this.KNOB_RADIUS);
  }

  private drawSprintButton(isPressed: boolean): void {
    const g = this.sprintBtnGraphics;
    g.clear();

    // Fundo
    g.fillStyle(isPressed ? 0x00f5d4 : 0x140409, isPressed ? 0.9 : 0.65);
    g.fillCircle(this.sprintBtnX, this.sprintBtnY, this.SPRINT_RADIUS);

    // Borda Ciano / Dourado
    g.lineStyle(2, isPressed ? 0xffffff : 0x00f5d4, 0.9);
    g.strokeCircle(this.sprintBtnX, this.sprintBtnY, this.SPRINT_RADIUS);

    this.sprintBtnText.setColor(isPressed ? '#050106' : '#ffffff');
  }

  private drawUltButton(isPressed: boolean, isReady: boolean): void {
    const g = this.ultBtnGraphics;
    g.clear();

    const bgColor = isPressed ? 0xffd60a : (isReady ? 0xd90429 : 0x3d0014);
    g.fillStyle(bgColor, isReady ? 0.9 : 0.6);
    g.fillCircle(this.ultBtnX, this.ultBtnY, this.ULT_RADIUS);

    // Borda pulsante ou dourada viva
    const borderColor = isReady ? 0xffd60a : 0x6a040f;
    g.lineStyle(2.5, borderColor, isReady ? 1 : 0.6);
    g.strokeCircle(this.ultBtnX, this.ultBtnY, this.ULT_RADIUS);

    this.ultBtnText.setColor(isPressed ? '#000000' : (isReady ? '#ffd60a' : '#888888'));
  }

  private drawPauseButton(x: number, y: number): void {
    const g = this.pauseBtnGraphics;
    g.clear();
    g.fillStyle(0x140409, 0.65);
    g.fillCircle(x, y, 16);
    g.lineStyle(1.5, 0xc59b27, 0.8);
    g.strokeCircle(x, y, 16);
  }

  private setupListeners(pauseX: number, pauseY: number): void {
    const input = this.scene.input;
    const { width, height } = this.scene.scale;

    // Detecta primeiro toque na tela para habilitar imediatamente
    input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (!this.isActive) {
        this.isActive = true;
        this.container.setVisible(this.isVisibleState);
      }

      // Zona Esquerda: Joystick (Floating / Dinâmico)
      if (pointer.x < width * 0.45 && pointer.y > 100) {
        if (!this.joystickPointer) {
          this.joystickPointer = pointer;
          this.baseX = pointer.x;
          this.baseY = pointer.y;
          this.knobX = pointer.x;
          this.knobY = pointer.y;
          this.drawJoystickBase();
          this.drawJoystickKnob();
        }
      }

      // Zona Direita: Botão de Sprint
      const distSprint = Math.hypot(pointer.x - this.sprintBtnX, pointer.y - this.sprintBtnY);
      if (distSprint <= this.SPRINT_RADIUS + 15) {
        this.sprintPointer = pointer;
        this.isSprint = true;
        this.drawSprintButton(true);
      }

      // Zona Direita: Botão de Suprema
      const distUlt = Math.hypot(pointer.x - this.ultBtnX, pointer.y - this.ultBtnY);
      if (distUlt <= this.ULT_RADIUS + 15) {
        const gs = this.scene.scene.get('GameScene') as any;
        if (gs && gs.player && gs.player.isUltimateReady && !gs.isGameOver) {
          this.drawUltButton(true, true);
          gs.triggerUltimate();
        }
      }

      // Zona Topo: Botão de Pausa
      const distPause = Math.hypot(pointer.x - pauseX, pointer.y - pauseY);
      if (distPause <= 24) {
        const gs = this.scene.scene.get('GameScene') as any;
        const ui = this.scene as any;
        if (gs && ui && typeof ui.togglePause === 'function') {
          ui.togglePause(gs);
        }
      }
    });

    input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (this.joystickPointer && pointer.id === this.joystickPointer.id) {
        const diffX = pointer.x - this.baseX;
        const diffY = pointer.y - this.baseY;
        const dist = Math.hypot(diffX, diffY);

        if (dist >= this.DEADZONE) {
          const clampedDist = Math.min(dist, this.MAX_DISTANCE);
          this.knobX = this.baseX + (diffX / dist) * clampedDist;
          this.knobY = this.baseY + (diffY / dist) * clampedDist;

          this.dx = (diffX / dist) * (clampedDist / this.MAX_DISTANCE);
          this.dy = (diffY / dist) * (clampedDist / this.MAX_DISTANCE);
        } else {
          this.knobX = pointer.x;
          this.knobY = pointer.y;
          this.dx = 0;
          this.dy = 0;
        }
        this.drawJoystickKnob();
      }
    });

    const onPointerUp = (pointer: Phaser.Input.Pointer) => {
      // Libera Joystick
      if (this.joystickPointer && pointer.id === this.joystickPointer.id) {
        this.joystickPointer = null;
        this.dx = 0;
        this.dy = 0;
        // Retorna manípulo para o centro com amortecimento suave
        this.scene.tweens.add({
          targets: this,
          knobX: this.baseX,
          knobY: this.baseY,
          duration: 120,
          ease: 'Back.easeOut',
          onUpdate: () => this.drawJoystickKnob()
        });
      }

      // Libera Sprint
      if (this.sprintPointer && pointer.id === this.sprintPointer.id) {
        this.sprintPointer = null;
        this.isSprint = false;
        this.drawSprintButton(false);
      }

      // Restaura visual do botão de Ult
      const gs = this.scene.scene.get('GameScene') as any;
      const ready = gs && gs.player && gs.player.isUltimateReady;
      this.drawUltButton(false, Boolean(ready));
    };

    input.on('pointerup', onPointerUp);
    input.on('pointerout', onPointerUp);
  }

  /**
   * Atualização contínua (sincronizada com o loop de update da UIScene)
   */
  public update(isUltimateReady: boolean): void {
    if (!this.isActive && !this.forceEnabled) return;
    if (!this.isVisibleState) return;

    // Atualiza estado de prontidão do botão de Suprema
    this.drawUltButton(false, isUltimateReady);
  }

  public getInput(): TouchInputState {
    const hasMovement = Math.abs(this.dx) > 0.05 || Math.abs(this.dy) > 0.05;
    return {
      hasMovement,
      dx: this.dx,
      dy: this.dy,
      isSprint: this.isSprint
    };
  }

  public setVisible(visible: boolean): void {
    this.isVisibleState = visible;
    this.container.setVisible(visible && (this.isActive || this.forceEnabled));
    if (!visible) {
      this.dx = 0;
      this.dy = 0;
      this.isSprint = false;
      this.joystickPointer = null;
      this.sprintPointer = null;
    }
  }

  public setForceEnabled(enabled: boolean): void {
    this.forceEnabled = enabled;
    this.container.setVisible(this.isVisibleState && (this.isActive || this.forceEnabled));
  }
}
