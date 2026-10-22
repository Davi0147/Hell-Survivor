import Phaser from 'phaser';
import { FONTS, COLORS, MODAL_THEME } from '../config/theme';
import { SoundManager } from '../systems/SoundManager';
import { MetaProgressManager } from '../systems/MetaProgressManager';
import { GamepadManager } from '../systems/GamepadManager';
import { createModalFrame } from './ModalFrame';

export interface IPauseGameScene {
  isGameOver?: boolean;
  isChapterCompleted?: boolean;
  survivalTimeMs: number;
  killCount: number;
  gameMode: 'story' | 'endless' | 'sandbox';
  player?: { currentLevel?: number };
  physics: {
    pause(): void;
    resume(): void;
  };
  scene: {
    pause(): void;
    resume(): void;
    restart(data?: { mode: 'story' | 'endless' | 'sandbox' }): void;
    stop(key?: string): void;
  };
}

export interface IPauseMenuHost extends Phaser.Scene {
  readonly isChestRouletteOpen: boolean;
  readonly isGameOverModalOpen: boolean;
  readonly sandboxPanel?: { isOpen: boolean; togglePanel(): void };
  readonly touchControls?: { setVisible(visible: boolean): void };
  isDialogueActive(): boolean;
  isHUDVisible(): boolean;
  formatTime(totalSec: number): string;
}

/**
 * Menu de Pausa (ESC / Start) extraído da UIScene (Pacote UI).
 * Gerencia congelamento de física/cena, sliders de volume de BGM e SFX ao vivo,
 * navegação por teclado/gamepad/mouse e ações de Continuar, Reiniciar e Menu Principal.
 */
export class PauseMenu {
  private host: IPauseMenuHost;
  public isPaused: boolean = false;
  public container?: Phaser.GameObjects.Container;

  private pauseZones: Phaser.GameObjects.Zone[] = [];
  private pauseSelectedRow: number = 2; // 0 = BGM, 1 = SFX, 2 = Action Buttons
  private pauseSelectedActionIdx: number = 0; // 0 = CONTINUAR, 1 = REINICIAR, 2 = MENU
  private pauseActionBtnRenders: ((h: boolean) => void)[] = [];
  private pauseActionBtnActions: (() => void)[] = [];
  private pauseRowIndicators: Phaser.GameObjects.Text[] = [];
  private updatePauseBgmDisplay?: () => void;
  private updatePauseSfxDisplay?: () => void;
  private prevPadCancelOrStart: boolean = false;
  private lastPauseToggleTime: number = 0;

  constructor(host: IPauseMenuHost) {
    this.host = host;
  }

  public togglePause(gameScene: IPauseGameScene): void {
    if (this.host.isDialogueActive()) return;
    if (this.host.scene.isActive('UpgradeScene')) return;
    if (this.host.isChestRouletteOpen) return;
    if (this.host.isGameOverModalOpen) return;
    if (gameScene.isGameOver || gameScene.isChapterCompleted) return;
    if (this.host.sandboxPanel && this.host.sandboxPanel.isOpen) {
      this.host.sandboxPanel.togglePanel();
      return;
    }

    const now = Date.now();
    if (now - this.lastPauseToggleTime < 320) return;
    this.lastPauseToggleTime = now;

    if (this.isPaused) {
      this.resumeGame(gameScene);
    } else {
      this.pauseGame(gameScene);
    }
  }

  public pauseGame(gameScene: IPauseGameScene): void {
    if (this.isPaused || gameScene.isGameOver || gameScene.isChapterCompleted) return;
    this.isPaused = true;
    SoundManager.getInstance().playMenuClick();
    gameScene.physics.pause();
    gameScene.scene.pause();
    if (this.host.touchControls) {
      this.host.touchControls.setVisible(false);
    }

    const pixelFont = FONTS.body;
    const t = MODAL_THEME.pause;

    this.cleanupCursor();
    this.pauseSelectedRow = 2;
    this.pauseSelectedActionIdx = 0;
    this.prevPadCancelOrStart = true;

    const frame = createModalFrame(this.host, {
      depth: 3500,
      backdropAlpha: t.backdropAlpha,
      panelWidth: 540,
      panelHeight: 390,
      panelFill: t.panelFill,
      panelAlpha: t.panelAlpha,
      outerBorderColor: t.outerBorderColor,
      outerBorderWidth: t.outerBorderWidth,
      outerRadius: t.outerRadius,
      innerBorderColor: t.innerBorderColor,
      innerBorderWidth: t.innerBorderWidth,
      innerBorderAlpha: t.innerBorderAlpha,
      innerRadius: t.innerRadius
    });

    this.container = frame.container;
    const { panelX, panelY, panelH } = frame;

    // Título
    const title = this.host.add.text(panelX, panelY - panelH / 2 + 38, 'JOGO PAUSADO', {
      fontFamily: pixelFont,
      fontSize: '20px',
      fontStyle: 'bold',
      color: t.titleColor,
      stroke: t.titleStroke,
      strokeThickness: 3
    }).setOrigin(0.5);
    this.container.add(title);

    // Estatísticas da Partida Atual
    const sec = Math.floor(gameScene.survivalTimeMs / 1000);
    const runSouls = MetaProgressManager.getInstance().runSoulsCollected;
    const statsText = this.host.add.text(
      panelX,
      panelY - 95,
      `TEMPO: ${this.host.formatTime(sec)}   |   ABATES: ${gameScene.killCount}   |   NÍVEL: ${gameScene.player?.currentLevel || 1}   |   ALMAS: ${runSouls}`,
      {
        fontFamily: pixelFont,
        fontSize: '11px',
        color: t.statsTextColor
      }
    ).setOrigin(0.5);
    this.container.add(statsText);

    // Divisória sutil
    const div = this.host.add.graphics();
    div.lineStyle(1.5, t.outerBorderColor, 0.35);
    div.lineBetween(panelX - 200, panelY - 75, panelX + 200, panelY - 75);
    this.container.add(div);

    // Volume de Música (BGM)
    const bgmRowY = panelY - 30;
    const bgmIndicator = this.host.add.text(panelX - 118, bgmRowY - 18, '▶', {
      fontFamily: pixelFont,
      fontSize: '12px',
      fontStyle: 'bold',
      color: t.bgmColorHex
    }).setOrigin(1, 0.5).setVisible(false);
    this.container.add(bgmIndicator);
    this.pauseRowIndicators.push(bgmIndicator);

    const bgmLabel = this.host.add.text(panelX, bgmRowY - 18, 'VOLUME DA MÚSICA', {
      fontFamily: pixelFont,
      fontSize: '11px',
      fontStyle: 'bold',
      color: COLORS.textWhite
    }).setOrigin(0.5);
    this.container.add(bgmLabel);

    const bgmPct = this.host.add.text(panelX + 138, bgmRowY + 10, '', {
      fontFamily: pixelFont,
      fontSize: '12px',
      fontStyle: 'bold',
      color: t.statsTextColor
    }).setOrigin(0, 0.5);
    this.container.add(bgmPct);

    const bgmBarGraphics = this.host.add.graphics();
    this.container.add(bgmBarGraphics);

    const updateBgmDisplay = () => {
      const vol = SoundManager.getInstance().getMusicVolume();
      bgmPct.setText(`${Math.round(vol * 100)}%`);

      bgmBarGraphics.clear();
      const barX = panelX - 98;
      const barY = bgmRowY + 3;
      const barW = 188;
      const barH = 14;

      bgmBarGraphics.fillStyle(t.barTrackFill, 1);
      bgmBarGraphics.fillRoundedRect(barX, barY, barW, barH, 4);

      const fillW = Math.max(0, barW * vol);
      if (fillW > 0) {
        bgmBarGraphics.fillStyle(t.bgmColorNum, 1);
        bgmBarGraphics.fillRoundedRect(barX, barY, fillW, barH, 4);
      }

      const isSelected = this.pauseSelectedRow === 0;
      bgmBarGraphics.lineStyle(isSelected ? 2.5 : 1.5, isSelected ? COLORS.white : t.outerBorderColor, 1);
      bgmBarGraphics.strokeRoundedRect(barX, barY, barW, barH, 4);
    };
    this.updatePauseBgmDisplay = updateBgmDisplay;
    updateBgmDisplay();

    this.createStepperBtn(panelX - 125, bgmRowY + 10, '-', 0, () => {
      const cur = SoundManager.getInstance().getMusicVolume();
      SoundManager.getInstance().setMusicVolume(Math.max(0, parseFloat((cur - 0.05).toFixed(2))));
      updateBgmDisplay();
    });

    this.createStepperBtn(panelX + 112, bgmRowY + 10, '+', 0, () => {
      const cur = SoundManager.getInstance().getMusicVolume();
      SoundManager.getInstance().setMusicVolume(Math.min(1, parseFloat((cur + 0.05).toFixed(2))));
      updateBgmDisplay();
    });

    // Volume de SFX
    const sfxRowY = panelY + 40;
    const sfxIndicator = this.host.add.text(panelX - 148, sfxRowY - 18, '▶', {
      fontFamily: pixelFont,
      fontSize: '12px',
      fontStyle: 'bold',
      color: t.sfxColorHex
    }).setOrigin(1, 0.5).setVisible(false);
    this.container.add(sfxIndicator);
    this.pauseRowIndicators.push(sfxIndicator);

    const sfxLabel = this.host.add.text(panelX, sfxRowY - 18, 'VOLUME DE EFEITOS (SFX)', {
      fontFamily: pixelFont,
      fontSize: '11px',
      fontStyle: 'bold',
      color: COLORS.textWhite
    }).setOrigin(0.5);
    this.container.add(sfxLabel);

    const sfxPct = this.host.add.text(panelX + 138, sfxRowY + 10, '', {
      fontFamily: pixelFont,
      fontSize: '12px',
      fontStyle: 'bold',
      color: t.sfxColorHex
    }).setOrigin(0, 0.5);
    this.container.add(sfxPct);

    const sfxBarGraphics = this.host.add.graphics();
    this.container.add(sfxBarGraphics);

    const updateSfxDisplay = () => {
      const vol = SoundManager.getInstance().getSfxVolume();
      sfxPct.setText(`${Math.round(vol * 100)}%`);

      sfxBarGraphics.clear();
      const barX = panelX - 98;
      const barY = sfxRowY + 3;
      const barW = 188;
      const barH = 14;

      sfxBarGraphics.fillStyle(t.barTrackFill, 1);
      sfxBarGraphics.fillRoundedRect(barX, barY, barW, barH, 4);

      const fillW = Math.max(0, barW * vol);
      if (fillW > 0) {
        sfxBarGraphics.fillStyle(t.sfxColorNum, 1);
        sfxBarGraphics.fillRoundedRect(barX, barY, fillW, barH, 4);
      }

      const isSelected = this.pauseSelectedRow === 1;
      sfxBarGraphics.lineStyle(isSelected ? 2.5 : 1.5, isSelected ? COLORS.white : t.outerBorderColor, 1);
      sfxBarGraphics.strokeRoundedRect(barX, barY, barW, barH, 4);
    };
    this.updatePauseSfxDisplay = updateSfxDisplay;
    updateSfxDisplay();

    this.createStepperBtn(panelX - 125, sfxRowY + 10, '-', 1, () => {
      const cur = SoundManager.getInstance().getSfxVolume();
      SoundManager.getInstance().setSfxVolume(Math.max(0, parseFloat((cur - 0.05).toFixed(2))));
      updateSfxDisplay();
      SoundManager.getInstance().playEnemyHit();
    });

    this.createStepperBtn(panelX + 112, sfxRowY + 10, '+', 1, () => {
      const cur = SoundManager.getInstance().getSfxVolume();
      SoundManager.getInstance().setSfxVolume(Math.min(1, parseFloat((cur + 0.05).toFixed(2))));
      updateSfxDisplay();
      SoundManager.getInstance().playEnemyHit();
    });

    // Botões Inferiores: CONTINUAR | REINICIAR | MENU
    const btnY = panelY + panelH / 2 - 42;
    const bW = 150;
    const bH = 34;
    const bSpacing = 16;
    const bTotalW = 3 * bW + 2 * bSpacing;
    const bStartX = panelX - bTotalW / 2 + bW / 2;

    this.createActionBtn(bStartX, btnY, bW, bH, 'CONTINUAR', t.btnResumeBg, t.btnResumeBorder, () => {
      this.resumeGame(gameScene);
    });

    this.createActionBtn(bStartX + (bW + bSpacing), btnY, bW, bH, 'REINICIAR', t.btnRestartBg, t.btnRestartBorder, () => {
      MetaProgressManager.getInstance().finalizeRunSouls();
      this.isPaused = false;
      this.cleanupCursor();
      if (this.container) {
        this.container.destroy();
        this.container = undefined;
      }
      this.host.scene.stop('UIScene');
      gameScene.scene.restart({ mode: gameScene.gameMode });
    });

    this.createActionBtn(bStartX + 2 * (bW + bSpacing), btnY, bW, bH, 'MENU', t.btnMenuBg, t.btnMenuBorder, () => {
      MetaProgressManager.getInstance().finalizeRunSouls();
      SoundManager.getInstance().stopMusic();
      this.isPaused = false;
      this.cleanupCursor();
      if (this.container) {
        this.container.destroy();
        this.container = undefined;
      }
      this.host.scene.stop('UIScene');
      gameScene.scene.stop('GameScene');
      this.host.scene.start('MenuScene');
    });

    this.updateVisualSelection();
  }

  public resumeGame(gameScene: IPauseGameScene): void {
    if (!this.isPaused) return;
    SoundManager.getInstance().playMenuClick();
    this.cleanupCursor();
    if (this.container) {
      this.container.destroy();
      this.container = undefined;
    }
    gameScene.physics.resume();
    gameScene.scene.resume();
    this.isPaused = false;
    if (this.host.touchControls) {
      this.host.touchControls.setVisible(this.host.isHUDVisible());
    }
  }

  public updateControls(gameScene: IPauseGameScene): void {
    if (!this.isPaused || !this.container) return;

    const nav = GamepadManager.getInstance().getMenuNavigation(this.host);
    const k = this.host.input.keyboard;
    const now = Date.now();

    const escPressed = Boolean(k && Phaser.Input.Keyboard.JustDown(k.addKey(Phaser.Input.Keyboard.KeyCodes.ESC)));
    const pad = GamepadManager.getInstance().getActivePad(this.host);
    const padStartCurrent = Boolean(pad && (
      (pad.buttons[9] && pad.buttons[9].pressed) ||
      (pad.buttons[8] && pad.buttons[8].pressed)
    ));
    const padStartJustDown = padStartCurrent && !this.prevPadCancelOrStart;
    this.prevPadCancelOrStart = padStartCurrent;

    if (escPressed || nav.cancel || padStartJustDown) {
      if (now - this.lastPauseToggleTime > 250) {
        this.lastPauseToggleTime = now;
        this.resumeGame(gameScene);
        return;
      }
    }

    const upPressed = nav.up || Boolean(k && (
      Phaser.Input.Keyboard.JustDown(k.addKey(Phaser.Input.Keyboard.KeyCodes.UP)) ||
      Phaser.Input.Keyboard.JustDown(k.addKey(Phaser.Input.Keyboard.KeyCodes.W))
    ));
    const downPressed = nav.down || Boolean(k && (
      Phaser.Input.Keyboard.JustDown(k.addKey(Phaser.Input.Keyboard.KeyCodes.DOWN)) ||
      Phaser.Input.Keyboard.JustDown(k.addKey(Phaser.Input.Keyboard.KeyCodes.S))
    ));

    if (upPressed && this.pauseSelectedRow > 0) {
      this.pauseSelectedRow--;
      SoundManager.getInstance().playMenuHover();
      this.updateVisualSelection();
    } else if (downPressed && this.pauseSelectedRow < 2) {
      this.pauseSelectedRow++;
      SoundManager.getInstance().playMenuHover();
      this.updateVisualSelection();
    }

    const leftPressed = nav.left || Boolean(k && (
      Phaser.Input.Keyboard.JustDown(k.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT)) ||
      Phaser.Input.Keyboard.JustDown(k.addKey(Phaser.Input.Keyboard.KeyCodes.A))
    ));
    const rightPressed = nav.right || Boolean(k && (
      Phaser.Input.Keyboard.JustDown(k.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT)) ||
      Phaser.Input.Keyboard.JustDown(k.addKey(Phaser.Input.Keyboard.KeyCodes.D))
    ));

    if (this.pauseSelectedRow === 0) {
      if (leftPressed) {
        const cur = SoundManager.getInstance().getMusicVolume();
        const next = Math.max(0, parseFloat((cur - 0.05).toFixed(2)));
        SoundManager.getInstance().setMusicVolume(next);
        if (this.updatePauseBgmDisplay) this.updatePauseBgmDisplay();
        SoundManager.getInstance().playMenuHover();
      } else if (rightPressed) {
        const cur = SoundManager.getInstance().getMusicVolume();
        const next = Math.min(1, parseFloat((cur + 0.05).toFixed(2)));
        SoundManager.getInstance().setMusicVolume(next);
        if (this.updatePauseBgmDisplay) this.updatePauseBgmDisplay();
        SoundManager.getInstance().playMenuHover();
      }
    } else if (this.pauseSelectedRow === 1) {
      if (leftPressed) {
        const cur = SoundManager.getInstance().getSfxVolume();
        const next = Math.max(0, parseFloat((cur - 0.05).toFixed(2)));
        SoundManager.getInstance().setSfxVolume(next);
        if (this.updatePauseSfxDisplay) this.updatePauseSfxDisplay();
        SoundManager.getInstance().playEnemyHit();
      } else if (rightPressed) {
        const cur = SoundManager.getInstance().getSfxVolume();
        const next = Math.min(1, parseFloat((cur + 0.05).toFixed(2)));
        SoundManager.getInstance().setSfxVolume(next);
        if (this.updatePauseSfxDisplay) this.updatePauseSfxDisplay();
        SoundManager.getInstance().playEnemyHit();
      }
    } else if (this.pauseSelectedRow === 2) {
      if (leftPressed) {
        this.pauseSelectedActionIdx = (this.pauseSelectedActionIdx - 1 + 3) % 3;
        SoundManager.getInstance().playMenuHover();
        this.updateVisualSelection();
      } else if (rightPressed) {
        this.pauseSelectedActionIdx = (this.pauseSelectedActionIdx + 1) % 3;
        SoundManager.getInstance().playMenuHover();
        this.updateVisualSelection();
      }
    }

    const confirmPressed = nav.confirm || Boolean(k && (
      Phaser.Input.Keyboard.JustDown(k.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE)) ||
      Phaser.Input.Keyboard.JustDown(k.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER))
    ));

    if (confirmPressed && this.pauseSelectedRow === 2) {
      SoundManager.getInstance().playMenuClick();
      const action = this.pauseActionBtnActions[this.pauseSelectedActionIdx];
      if (action) action();
    }
  }

  public cleanupCursor(): void {
    this.pauseZones = [];
    this.pauseActionBtnRenders = [];
    this.pauseActionBtnActions = [];
    this.pauseRowIndicators = [];
    this.updatePauseBgmDisplay = undefined;
    this.updatePauseSfxDisplay = undefined;
  }

  public destroy(): void {
    this.cleanupCursor();
    if (this.container) {
      this.container.destroy();
      this.container = undefined;
    }
    this.isPaused = false;
  }

  private updateVisualSelection(): void {
    if (this.pauseRowIndicators.length >= 2) {
      this.pauseRowIndicators[0].setVisible(this.pauseSelectedRow === 0);
      this.pauseRowIndicators[1].setVisible(this.pauseSelectedRow === 1);
    }

    if (this.updatePauseBgmDisplay) this.updatePauseBgmDisplay();
    if (this.updatePauseSfxDisplay) this.updatePauseSfxDisplay();

    for (let i = 0; i < this.pauseActionBtnRenders.length; i++) {
      const isSelected = this.pauseSelectedRow === 2 && this.pauseSelectedActionIdx === i;
      this.pauseActionBtnRenders[i](isSelected);
    }
  }

  private createStepperBtn(
    x: number,
    y: number,
    symbol: string,
    rowIndex: number,
    onClick: () => void
  ): void {
    if (!this.container) return;
    const pixelFont = FONTS.body;
    const t = MODAL_THEME.pause;

    const bg = this.host.add.graphics();
    const render = (hover: boolean) => {
      bg.clear();
      bg.fillStyle(hover ? t.stepperHoverFill : t.stepperIdleFill, 1);
      bg.fillCircle(x, y, 14);
      bg.lineStyle(1.5, hover ? COLORS.white : t.outerBorderColor, 1);
      bg.strokeCircle(x, y, 14);
    };
    render(false);
    this.container.add(bg);

    const txt = this.host.add.text(x, y, symbol, {
      fontFamily: pixelFont,
      fontSize: '13px',
      fontStyle: 'bold',
      color: COLORS.textWhite
    }).setOrigin(0.5);
    this.container.add(txt);

    const zone = this.host.add.zone(x, y, 36, 36);
    zone.setInteractive({ useHandCursor: true });
    this.container.add(zone);

    zone.on('pointerover', () => {
      render(true);
      if (this.pauseSelectedRow !== rowIndex) {
        this.pauseSelectedRow = rowIndex;
        this.updateVisualSelection();
      }
      SoundManager.getInstance().playMenuHover();
    });
    zone.on('pointerout', () => render(false));
    zone.on('pointerdown', () => onClick());

    this.pauseZones.push(zone);
  }

  private createActionBtn(
    x: number,
    y: number,
    w: number,
    h: number,
    label: string,
    bgCol: number,
    borderCol: number,
    onClick: () => void
  ): void {
    if (!this.container) return;
    const pixelFont = FONTS.body;
    const btnIndex = this.pauseActionBtnRenders.length;

    const bg = this.host.add.graphics();
    const txt = this.host.add.text(x, y, label, {
      fontFamily: pixelFont,
      fontSize: '10px',
      fontStyle: 'bold',
      color: COLORS.textWhite,
      stroke: COLORS.strokeBlack,
      strokeThickness: 2
    }).setOrigin(0.5);

    const render = (hover: boolean) => {
      bg.clear();
      bg.fillStyle(hover ? borderCol : bgCol, 1);
      bg.fillRoundedRect(x - w / 2, y - h / 2, w, h, 6);
      bg.lineStyle(hover ? 2.5 : 1.5, hover ? COLORS.white : borderCol, 1);
      bg.strokeRoundedRect(x - w / 2, y - h / 2, w, h, 6);
      txt.setColor(hover ? COLORS.strokeBlack : COLORS.textWhite);
    };
    render(false);
    this.container.add(bg);
    this.container.add(txt);

    this.pauseActionBtnRenders.push(render);
    this.pauseActionBtnActions.push(onClick);

    const zone = this.host.add.zone(x, y, w, h);
    zone.setInteractive({ useHandCursor: true });
    this.container.add(zone);

    zone.on('pointerover', () => {
      this.pauseSelectedRow = 2;
      this.pauseSelectedActionIdx = btnIndex;
      this.updateVisualSelection();
      SoundManager.getInstance().playMenuHover();
    });
    zone.on('pointerdown', () => {
      SoundManager.getInstance().playMenuClick();
      onClick();
    });

    this.pauseZones.push(zone);
  }
}
