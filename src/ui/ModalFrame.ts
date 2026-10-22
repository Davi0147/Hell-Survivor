import Phaser from 'phaser';
import { MODAL_THEME } from '../config/theme';

export interface ModalFrameOptions {
  depth: number;
  backdropAlpha: number;
  panelWidth: number;
  panelHeight: number;
  panelFill: number;
  panelAlpha?: number;
  outerBorderColor: number;
  outerBorderWidth?: number;
  outerRadius?: number;
  innerBorderColor: number;
  innerBorderWidth?: number;
  innerBorderAlpha?: number;
  innerRadius?: number;
}

export interface ModalFrameResult {
  container: Phaser.GameObjects.Container;
  backdrop: Phaser.GameObjects.Rectangle;
  panelGraphics: Phaser.GameObjects.Graphics;
  panelX: number;
  panelY: number;
  panelW: number;
  panelH: number;
}

/**
 * Constrói a moldura gótica compartilhada (container + backdrop bloqueante + painel de borda dupla)
 * usada pelos modais da UIScene (PauseMenu, GameOverModal, ChapterVictoryModal).
 * Mantém um único ponto de estilo lendo de MODAL_THEME em src/config/theme.ts.
 */
export function createModalFrame(
  scene: Phaser.Scene,
  options: ModalFrameOptions
): ModalFrameResult {
  const { width, height } = scene.scale;
  const panelW = options.panelWidth;
  const panelH = options.panelHeight;
  const panelX = width / 2;
  const panelY = height / 2;

  const container = scene.add.container(0, 0);
  container.setDepth(options.depth);

  const backdrop = scene.add.rectangle(
    panelX,
    panelY,
    width,
    height,
    MODAL_THEME.backdropColor,
    options.backdropAlpha
  );
  backdrop.setInteractive();
  container.add(backdrop);

  const g = scene.add.graphics();
  g.fillStyle(options.panelFill, options.panelAlpha ?? 0.98);
  g.fillRoundedRect(
    panelX - panelW / 2,
    panelY - panelH / 2,
    panelW,
    panelH,
    options.outerRadius ?? 14
  );
  g.lineStyle(options.outerBorderWidth ?? 3, options.outerBorderColor, 1);
  g.strokeRoundedRect(
    panelX - panelW / 2,
    panelY - panelH / 2,
    panelW,
    panelH,
    options.outerRadius ?? 14
  );
  g.lineStyle(
    options.innerBorderWidth ?? 1.5,
    options.innerBorderColor,
    options.innerBorderAlpha ?? 0.6
  );
  g.strokeRoundedRect(
    panelX - panelW / 2 + 4,
    panelY - panelH / 2 + 4,
    panelW - 8,
    panelH - 8,
    options.innerRadius ?? 11
  );
  container.add(g);

  return {
    container,
    backdrop,
    panelGraphics: g,
    panelX,
    panelY,
    panelW,
    panelH
  };
}
