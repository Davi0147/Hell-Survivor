import Phaser from 'phaser';
import { FX_COLORS, TOUCH_THEME } from '../config/theme';

/** Distância mínima dos controles até a borda da tela (px de jogo). */
const TOUCH_EDGE_MARGIN = 96;
/** Botão de pausa grande o bastante para o dedo. */
const PAUSE_SIZE = 66;
/**
 * Área do analógico: o dedo pode cair em qualquer ponto dela e o analógico nasce ali.
 * Fração da largura da tela a partir da esquerda e faixa de cima que fica de fora (radar).
 */
const JOYSTICK_ZONE_WIDTH = 0.5;
const JOYSTICK_ZONE_TOP = 170;

interface IRect { left: number; top: number; right: number; bottom: number }

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
  /** Posição de descanso do joystick (ele volta para cá ao soltar o dedo). */
  private homeX: number = 130;
  private homeY: number = 590;
  private baseX: number = 130;
  private baseY: number = 590;
  private knobX: number = 130;
  private knobY: number = 590;
  private readonly BASE_RADIUS: number = 58;
  // Stick.png possui 22px de arte central em um canvas de 40px; raio 50 (100px) resulta em ~55px úteis de diâmetro
  private readonly KNOB_RADIUS: number = 50;
  private readonly MAX_DISTANCE: number = 50;
  private readonly DEADZONE: number = 8;

  // Botões de Ação (Lado Direito)
  private sprintBtn: Phaser.GameObjects.Image;
  private sprintPointer: Phaser.Input.Pointer | null = null;
  private sprintBtnX: number = 0;
  private sprintBtnY: number = 0;
  private readonly SPRINT_RADIUS: number = 46;

  // Botão de Esquiva (usa o sprite do Sprint tingido até existir arte própria)
  private dashBtn: Phaser.GameObjects.Image;
  private dashBtnX: number = 0;
  private dashBtnY: number = 0;
  private readonly DASH_RADIUS: number = 40;
  private dashQueued: boolean = false;

  private ultBtn: Phaser.GameObjects.Image;
  private ultBtnX: number = 0;
  private ultBtnY: number = 0;
  private readonly ULT_RADIUS: number = 48;
  private isUltReadyState: boolean = false;
  private ultPulseTween: Phaser.Tweens.Tween | null = null;

  // Botão de Pausa Rápida (Canto Superior Direito)
  private pauseBtn: Phaser.GameObjects.Image;
  private pauseBtnX: number = 0;
  private pauseBtnY: number = 0;

  // Contorno branco dos botões (para enxergar em cima de qualquer chão)
  private rings: Phaser.GameObjects.Graphics;
  /** Onde o analógico não pode nascer (a barra de armas, no meio de baixo). */
  private blockedRect: IRect | null = null;

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

    // Posicionamento ergonômico: longe das bordas (cantos arredondados e recorte da câmera do celular).
    // A barra de armas foi para o meio de baixo, então o analógico descansa mais baixo.
    this.homeX = Math.max(TOUCH_EDGE_MARGIN + this.BASE_RADIUS, Math.round(width * 0.15));
    this.homeY = height - 170;
    this.baseX = this.homeX;
    this.baseY = this.homeY;
    this.knobX = this.baseX;
    this.knobY = this.baseY;

    // Corrida e esquiva ficam acima do retrato da Nixy (o retrato ocupa o canto inferior direito)
    const right = width - TOUCH_EDGE_MARGIN;
    this.sprintBtnX = right - 70;
    this.sprintBtnY = 330;

    this.dashBtnX = right + 10;
    this.dashBtnY = 262;

    // Suprema colada ao analógico (em cima e à direita dele): o polegar esquerdo alcança sem esticar
    this.ultBtnX = this.homeX + 128;
    this.ultBtnY = this.homeY - 100;

    this.pauseBtnX = right + 18;
    this.pauseBtnY = 150;

    // Contornos ficam atrás das artes dos botões
    this.rings = scene.add.graphics();
    this.container.add(this.rings);

    // 1. Elementos Gráficos do Joystick (Pixel Art)
    this.joystickBase = scene.add.image(this.baseX, this.baseY, 'touch-analog');
    this.joystickBase.setDisplaySize(this.BASE_RADIUS * 2, this.BASE_RADIUS * 2);
    this.joystickBase.setAlpha(TOUCH_THEME.joystickIdleAlpha);
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

    // 2.1. Botão de Esquiva
    this.dashBtn = scene.add.image(this.dashBtnX, this.dashBtnY, 'touch-sprint');
    this.dashBtn.setDisplaySize(this.DASH_RADIUS * 2, this.DASH_RADIUS * 2);
    this.dashBtn.setAlpha(0.85);
    this.dashBtn.setTint(FX_COLORS.dashButton);
    this.container.add(this.dashBtn);

    // 3. Botão de Suprema (Pixel Art)
    this.ultBtn = scene.add.image(this.ultBtnX, this.ultBtnY, 'touch-ult');
    this.ultBtn.setDisplaySize(this.ULT_RADIUS * 2, this.ULT_RADIUS * 2);
    this.ultBtn.setAlpha(0.45);
    this.ultBtn.setTint(0x777777);
    this.container.add(this.ultBtn);

    // 4. Botão de Pausa Rápida para Mobile (Pixel Art)
    this.pauseBtn = scene.add.image(this.pauseBtnX, this.pauseBtnY, 'touch-pause');
    this.pauseBtn.setDisplaySize(PAUSE_SIZE, PAUSE_SIZE);
    this.pauseBtn.setAlpha(0.85);
    this.container.add(this.pauseBtn);

    // Desenha estado visual estático inicial
    this.drawRings();
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

  /** Contorno branco em volta de cada botão de ação. */
  private drawRings(): void {
    const g = this.rings;
    g.clear();
    g.lineStyle(TOUCH_THEME.ringWidth, TOUCH_THEME.ring, TOUCH_THEME.ringAlpha);
    g.strokeCircle(this.sprintBtnX, this.sprintBtnY, this.SPRINT_RADIUS);
    g.strokeCircle(this.dashBtnX, this.dashBtnY, this.DASH_RADIUS);
    g.strokeCircle(this.ultBtnX, this.ultBtnY, this.ULT_RADIUS);
    g.strokeCircle(this.pauseBtnX, this.pauseBtnY, PAUSE_SIZE / 2);
  }

  /** O analógico fica apagado parado e acende enquanto o dedo está nele. */
  private drawJoystickBase(): void {
    this.joystickBase.setPosition(this.baseX, this.baseY);
    const alpha = this.joystickPointer ? TOUCH_THEME.joystickActiveAlpha : TOUCH_THEME.joystickIdleAlpha;
    this.joystickBase.setAlpha(alpha);
    this.joystickKnob?.setAlpha(Math.min(1, alpha + 0.2));
  }

  /** O dedo caiu na área do analógico (metade esquerda, fora do radar, da Suprema e da barra de armas)? */
  private isInJoystickZone(x: number, y: number): boolean {
    const { width } = this.scene.scale;
    if (x >= width * JOYSTICK_ZONE_WIDTH || y < JOYSTICK_ZONE_TOP) return false;
    if (Math.hypot(x - this.ultBtnX, y - this.ultBtnY) <= this.ULT_RADIUS + 15) return false;
    const b = this.blockedRect;
    if (b && x >= b.left && x <= b.right && y >= b.top && y <= b.bottom) return false;
    return true;
  }

  /** A barra de armas mudou de lugar: o analógico não nasce em cima dela. */
  public setBlockedRect(rect: IRect | null): void {
    this.blockedRect = rect;
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
      this.pauseBtn.setDisplaySize(PAUSE_SIZE * 0.9, PAUSE_SIZE * 0.9);
      this.pauseBtn.setAlpha(1.0);
      this.pauseBtn.setTint(0xffa8ba);
    } else {
      this.pauseBtn.setDisplaySize(PAUSE_SIZE, PAUSE_SIZE);
      this.pauseBtn.setAlpha(0.85);
      this.pauseBtn.clearTint();
    }
  }

  private setupListeners(): void {
    const input = this.scene.input;

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

      // Zona Esquerda: o analógico nasce onde o dedo tocou (dentro da área dele)
      if (this.isInJoystickZone(pointer.x, pointer.y) && !this.joystickPointer) {
        this.joystickPointer = pointer;
        // Nunca colado na borda (senão metade some atrás da moldura do celular)
        const minX = TOUCH_EDGE_MARGIN * 0.6 + this.BASE_RADIUS;
        const maxY = this.scene.scale.height - this.BASE_RADIUS - 24;
        this.baseX = Math.max(minX, pointer.x);
        this.baseY = Math.min(maxY, pointer.y);
        this.knobX = this.baseX;
        this.knobY = this.baseY;
        this.drawJoystickBase();
        this.drawJoystickKnob();
      }

      // Zona Direita: Botão de Sprint
      const distSprint = Math.hypot(pointer.x - this.sprintBtnX, pointer.y - this.sprintBtnY);
      if (distSprint <= this.SPRINT_RADIUS + 15) {
        this.sprintPointer = pointer;
        this.isSprint = true;
        this.drawSprintButton(true);
      }

      // Zona Direita: Botão de Esquiva (um toque = uma esquiva)
      const distDash = Math.hypot(pointer.x - this.dashBtnX, pointer.y - this.dashBtnY);
      if (distDash <= this.DASH_RADIUS + 12) {
        this.dashQueued = true;
        this.dashBtn.setAlpha(1.0);
        this.scene.time.delayedCall(120, () => this.dashBtn.setAlpha(0.85));
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
      if (distPause <= PAUSE_SIZE / 2 + 14) {
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
        // O joystick volta para a posição de descanso, longe da borda
        this.baseX = this.homeX;
        this.baseY = this.homeY;
        this.drawJoystickBase();
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

  /** Lê e limpa o pedido de esquiva do botão de toque. */
  public consumeDash(): boolean {
    const queued = this.dashQueued;
    this.dashQueued = false;
    return queued;
  }

  public setVisible(visible: boolean): void {
    this.isVisibleState = visible;
    this.container.setVisible(visible && (this.isActive || this.forceEnabled));
    if (!visible) {
      this.dx = 0;
      this.dy = 0;
      this.isSprint = false;
      this.dashQueued = false;
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
