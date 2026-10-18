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
  private joystickBase: Phaser.GameObjects.Image;
  private joystickKnob: Phaser.GameObjects.Image;
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
  private sprintBtn: Phaser.GameObjects.Image;
  private sprintPointer: Phaser.Input.Pointer | null = null;
  private sprintBtnX: number = 0;
  private sprintBtnY: number = 0;
  private readonly SPRINT_RADIUS: number = 36;

  private ultBtn: Phaser.GameObjects.Image;
  private ultBtnX: number = 0;
  private ultBtnY: number = 0;
  private readonly ULT_RADIUS: number = 32;
  private isUltReadyState: boolean = false;
  private ultPulseTween: Phaser.Tweens.Tween | null = null;

  // Botão de Pausa Rápida (Canto Superior Direito)
  private pauseBtn: Phaser.GameObjects.Image;
  private pauseBtnX: number = 0;
  private pauseBtnY: number = 0;

  // Visibilidade e Ciclo
  private isVisibleState: boolean = true;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    const { width, height } = scene.scale;

    this.container = scene.add.container(0, 0);
    this.container.setDepth(1200);

    // Ativa automaticamente apenas se for dispositivo mobile real (não desktop)
    const isDesktop = Boolean(scene.sys.game.device.os.desktop);
    this.isActive = !isDesktop;

    // Posicionamento Ergonômico dos Botões
    this.baseX = Math.round(width * 0.14);
    this.baseY = Math.round(height * 0.81);
    this.knobX = this.baseX;
    this.knobY = this.baseY;

    this.sprintBtnX = width - 85;
    this.sprintBtnY = height - 85;

    this.ultBtnX = width - 165;
    this.ultBtnY = height - 130;

    this.pauseBtnX = width - 42;
    this.pauseBtnY = 135;

    // 1. Elementos Gráficos do Joystick (Pixel Art)
    this.joystickBase = scene.add.image(this.baseX, this.baseY, 'touch-analog');
    this.joystickBase.setDisplaySize(this.BASE_RADIUS * 2, this.BASE_RADIUS * 2);
    this.joystickBase.setAlpha(0.7);
    this.container.add(this.joystickBase);

    this.joystickKnob = scene.add.image(this.knobX, this.knobY, 'touch-stick');
    this.joystickKnob.setDisplaySize(this.KNOB_RADIUS * 2, this.KNOB_RADIUS * 2);
    this.joystickKnob.setAlpha(0.95);
    this.container.add(this.joystickKnob);

    // 2. Botão de Sprint (Pixel Art)
    this.sprintBtn = scene.add.image(this.sprintBtnX, this.sprintBtnY, 'touch-sprint');
    this.sprintBtn.setDisplaySize(this.SPRINT_RADIUS * 2, this.SPRINT_RADIUS * 2);
    this.sprintBtn.setAlpha(0.85);
    this.container.add(this.sprintBtn);

    // 3. Botão de Suprema (Pixel Art)
    this.ultBtn = scene.add.image(this.ultBtnX, this.ultBtnY, 'touch-ult');
    this.ultBtn.setDisplaySize(this.ULT_RADIUS * 2, this.ULT_RADIUS * 2);
    this.ultBtn.setAlpha(0.45);
    this.ultBtn.setTint(0x777777);
    this.container.add(this.ultBtn);

    // 4. Botão de Pausa Rápida para Mobile (Pixel Art)
    this.pauseBtn = scene.add.image(this.pauseBtnX, this.pauseBtnY, 'touch-pause');
    this.pauseBtn.setDisplaySize(36, 36);
    this.pauseBtn.setAlpha(0.85);
    this.container.add(this.pauseBtn);

    // Desenha estado visual estático inicial
    this.drawJoystickBase();
    this.drawJoystickKnob();
    this.drawSprintButton(false);
    this.drawUltButton(false, false);
    this.drawPauseButton(false);

    // Registra listeners de ponteiros (Touch / Mouse)
    this.setupListeners();

    // Se não for touch nativo e nem forçado, oculta inicialmente
    this.container.setVisible(this.isActive || this.forceEnabled);
  }

  private drawJoystickBase(): void {
    this.joystickBase.setPosition(this.baseX, this.baseY);
  }

  private drawJoystickKnob(): void {
    this.joystickKnob.setPosition(this.knobX, this.knobY);
  }

  private drawSprintButton(isPressed: boolean): void {
    if (isPressed) {
      this.sprintBtn.setDisplaySize(
        Math.round(this.SPRINT_RADIUS * 2 * 0.9),
        Math.round(this.SPRINT_RADIUS * 2 * 0.9)
      );
      this.sprintBtn.setAlpha(1.0);
      this.sprintBtn.setTint(0xffd60a);
    } else {
      this.sprintBtn.setDisplaySize(this.SPRINT_RADIUS * 2, this.SPRINT_RADIUS * 2);
      this.sprintBtn.setAlpha(0.85);
      this.sprintBtn.clearTint();
    }
  }

  private drawUltButton(isPressed: boolean, isReady: boolean): void {
    if (isPressed) {
      this.ultBtn.setDisplaySize(
        Math.round(this.ULT_RADIUS * 2 * 0.9),
        Math.round(this.ULT_RADIUS * 2 * 0.9)
      );
      this.ultBtn.setAlpha(1.0);
      this.ultBtn.setTint(0xff0054);
      return;
    }

    if (isReady) {
      this.ultBtn.setAlpha(1.0);
      this.ultBtn.clearTint();

      if (!this.isUltReadyState && !this.ultPulseTween) {
        const baseScale = (this.ULT_RADIUS * 2) / 40;
        this.ultPulseTween = this.scene.tweens.add({
          targets: this.ultBtn,
          scaleX: baseScale * 1.08,
          scaleY: baseScale * 1.08,
          duration: 550,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut'
        });
      }
    } else {
      if (this.ultPulseTween) {
        this.ultPulseTween.stop();
        this.ultPulseTween = null;
      }
      this.ultBtn.setDisplaySize(this.ULT_RADIUS * 2, this.ULT_RADIUS * 2);
      this.ultBtn.setAlpha(0.45);
      this.ultBtn.setTint(0x777777);
    }

    this.isUltReadyState = isReady;
  }

  private drawPauseButton(isPressed: boolean = false): void {
    if (isPressed) {
      this.pauseBtn.setDisplaySize(32, 32);
      this.pauseBtn.setAlpha(1.0);
      this.pauseBtn.setTint(0xffa8ba);
    } else {
      this.pauseBtn.setDisplaySize(36, 36);
      this.pauseBtn.setAlpha(0.85);
      this.pauseBtn.clearTint();
    }
  }

  private setupListeners(): void {
    const input = this.scene.input;
    const { width } = this.scene.scale;

    // Detecta primeiro toque na tela para habilitar apenas se for touch real
    input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      const isRealTouch = Boolean(pointer.wasTouch || (pointer.event && (pointer.event as PointerEvent).pointerType === 'touch'));

      // Se estiver no desktop (PC), nunca ativa touch por clique de mouse
      if (!this.isActive && !this.forceEnabled) {
        if (isRealTouch) {
          this.isActive = true;
          this.container.setVisible(this.isVisibleState);
        } else {
          return;
        }
      }

      if (!this.isActive && !this.forceEnabled) return;
      if (!isRealTouch && !this.forceEnabled) return;

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
        const gs = this.scene.scene.get('GameScene') as { player?: { isUltimateReady?: boolean }; isGameOver?: boolean; triggerUltimate?: () => void } | null;
        if (gs && gs.player && gs.player.isUltimateReady && !gs.isGameOver) {
          this.drawUltButton(true, true);
          if (typeof gs.triggerUltimate === 'function') {
            gs.triggerUltimate();
          }
        }
      }

      // Zona Topo: Botão de Pausa
      const distPause = Math.hypot(pointer.x - this.pauseBtnX, pointer.y - this.pauseBtnY);
      if (distPause <= 24) {
        this.drawPauseButton(true);
        const gs = this.scene.scene.get('GameScene');
        const ui = this.scene as { togglePause?: (scene: unknown) => void };
        if (gs && ui && typeof ui.togglePause === 'function') {
          ui.togglePause(gs);
        }
        this.scene.time.delayedCall(120, () => {
          this.drawPauseButton(false);
        });
      }
    });

    input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (!this.isActive && !this.forceEnabled) return;

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
      if (!this.isActive && !this.forceEnabled) return;

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
      const gs = this.scene.scene.get('GameScene') as { player?: { isUltimateReady?: boolean } } | null;
      const ready = Boolean(gs && gs.player && gs.player.isUltimateReady);
      this.drawUltButton(false, ready);
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

    // Atualiza estado de prontidão do botão de Suprema se mudou
    if (this.isUltReadyState !== isUltimateReady) {
      this.drawUltButton(false, isUltimateReady);
    }
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
      if (this.ultPulseTween) {
        this.ultPulseTween.stop();
        this.ultPulseTween = null;
      }
    }
  }

  public setForceEnabled(enabled: boolean): void {
    this.forceEnabled = enabled;
    this.container.setVisible(this.isVisibleState && (this.isActive || this.forceEnabled));
  }
}
