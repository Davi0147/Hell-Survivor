import Phaser from 'phaser';
import { FONTS, COLORS, MODAL_THEME } from '../config/theme';
import { SoundManager } from '../systems/SoundManager';
import { MetaProgressManager } from '../systems/MetaProgressManager';
import { GamepadManager } from '../systems/GamepadManager';
import { createModalFrame } from './ModalFrame';
import { buildRunBonuses, describeRunMode, type IRunBonusSource } from './pauseRunSummary';
import { WEAPON_INFO } from '../config/pauseInfo';
import { PauseDialog } from './PauseDialog';
import { createGlowButton } from './pauseWidgets';

/** Arma equipada como o menu de pausa a vê (ícone e nível vêm do catálogo). */
export interface IPauseWeaponInfo {
  key: string;
  level: number;
  maxLevel: number;
  isEvolved: boolean;
}

export interface IPauseGameScene {
  isGameOver?: boolean;
  isChapterCompleted?: boolean;
  survivalTimeMs: number;
  killCount: number;
  gameMode: 'story' | 'endless' | 'sandbox';
  currentChapter?: number;
  player?: { currentLevel?: number } & Partial<IRunBonusSource>;
  /** Armas equipadas já traduzidas para ícone e nível (UIScene monta com o catálogo). */
  getPauseWeapons?(): IPauseWeaponInfo[];
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

/** Medidas do painel (1280x720 lógico). Topo = 0; tudo é relativo a ele. */
const LAYOUT = {
  panelW: 820,
  panelH: 600,
  contentW: 756,
  titleY: 46,
  titlePlaqueW: 320,
  titleFontSize: 19,
  titlePlaqueH: 80,
  modeY: 96,
  statsY: 140,
  statsCellH: 58,
  bonusHeaderY: 192,
  bonusGridY: 216,
  bonusCols: 5,
  bonusChipH: 36,
  bonusGap: 4,
  bonusMaxRows: 3,
  weaponsHeaderY: 350,
  weaponsY: 386,
  volumeHeaderY: 428,
  bgmY: 460,
  sfxY: 494,
  buttonsY: 552,
  buttonW: 220,
  buttonH: 63,
  /** Centro da abertura na arte da moldura (impresso por scripts/cut-pause-frame.py). */
  frameOriginX: 0.5,
  frameOriginY: 0.4935,
} as const;

/** Arte do menu (docs/ART_PROMPTS.md §15). Sem ela, o menu desenha tudo por código. */
const ART = {
  frame: 'ui-pause-frame',
  title: 'ui-pause-title',
  resume: 'ui-pause-btn-resume',
  restart: 'ui-pause-btn-restart',
  menu: 'ui-pause-btn-menu',
} as const;

/**
 * Menu de Pausa (ESC / Start): resumo da partida (tempo, abates, nível, almas, bônus das
 * cartas e armas), volume de música e efeitos ao vivo e Continuar / Reiniciar / Menu.
 * Navegação por teclado, controle e toque.
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
  /** Janela por cima do menu: explicação de bônus/arma ou confirmação de sair. */
  private readonly dialog: PauseDialog;

  constructor(host: IPauseMenuHost) {
    this.host = host;
    // O mesmo ESC que fecha a janela passa pelo atalho da UIScene e por updateControls:
    // marcar o horário impede que ele também tire o jogo da pausa
    this.dialog = new PauseDialog(host, () => { this.lastPauseToggleTime = Date.now(); });
  }

  public togglePause(gameScene: IPauseGameScene): void {
    // ESC com a explicação aberta fecha só a janela, sem sair da pausa
    if (this.isPaused && this.dialog.isOpen) {
      this.dialog.close();
      return;
    }
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

    const t = MODAL_THEME.pause;

    this.cleanupCursor();
    this.pauseSelectedRow = 2;
    this.pauseSelectedActionIdx = 0;
    this.prevPadCancelOrStart = true;

    // Com a moldura de arte, o painel só pinta o fundo (a borda vem da imagem)
    const hasFrameArt = this.hasTexture(ART.frame);
    const frame = createModalFrame(this.host, {
      depth: 3500,
      backdropAlpha: t.backdropAlpha,
      panelWidth: LAYOUT.panelW,
      panelHeight: LAYOUT.panelH,
      panelFill: t.panelFill,
      panelAlpha: t.panelAlpha,
      outerBorderColor: t.outerBorderColor,
      outerBorderWidth: hasFrameArt ? 0 : t.outerBorderWidth,
      outerRadius: t.outerRadius,
      innerBorderColor: t.innerBorderColor,
      innerBorderWidth: t.innerBorderWidth,
      innerBorderAlpha: hasFrameArt ? 0 : t.innerBorderAlpha,
      innerRadius: t.innerRadius
    });

    this.container = frame.container;
    const cx = frame.panelX;
    const top = frame.panelY - frame.panelH / 2;
    if (hasFrameArt) {
      this.add(this.host.add.image(cx, frame.panelY, ART.frame).setOrigin(LAYOUT.frameOriginX, LAYOUT.frameOriginY));
    }

    this.buildHeader(cx, top, gameScene);
    this.buildStatsRow(cx, top, gameScene);
    this.buildBonuses(cx, top, gameScene);
    this.buildWeapons(cx, top, gameScene);
    this.buildVolumeRows(cx, top);
    this.buildActionButtons(cx, top, gameScene);

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

    // Com uma janela aberta, as teclas vão para ela
    if (this.dialog.isOpen) {
      const just = (code: number): boolean => Boolean(k && Phaser.Input.Keyboard.JustDown(k.addKey(code)));
      const codes = Phaser.Input.Keyboard.KeyCodes;
      this.dialog.handleInput(
        nav.left || just(codes.LEFT) || just(codes.A),
        nav.right || just(codes.RIGHT) || just(codes.D),
        nav.confirm || just(codes.SPACE) || just(codes.ENTER),
        escPressed || nav.cancel || padStartJustDown
      );
      return;
    }

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
        this.stepMusic(-0.05);
        SoundManager.getInstance().playMenuHover();
      } else if (rightPressed) {
        this.stepMusic(0.05);
        SoundManager.getInstance().playMenuHover();
      }
    } else if (this.pauseSelectedRow === 1) {
      if (leftPressed) {
        this.stepSfx(-0.05);
      } else if (rightPressed) {
        this.stepSfx(0.05);
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
    this.dialog.reset(); // a janela é filha do container: some junto com ele
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

  // ---------------------------------------------------------------- seções

  private buildHeader(cx: number, top: number, gameScene: IPauseGameScene): void {
    const t = MODAL_THEME.pause;
    const pw = LAYOUT.titlePlaqueW;
    const ph = LAYOUT.titlePlaqueH;
    if (this.hasTexture(ART.title)) {
      this.add(this.host.add.image(cx, top + LAYOUT.titleY, ART.title).setDisplaySize(pw, ph));
    } else {
      const plaque = this.host.add.graphics();
      plaque.fillStyle(t.titlePlaqueFill, 1);
      plaque.fillRoundedRect(cx - pw / 2, top + LAYOUT.titleY - ph / 2, pw, ph, 10);
      plaque.lineStyle(2, t.innerBorderColor, 0.9);
      plaque.strokeRoundedRect(cx - pw / 2, top + LAYOUT.titleY - ph / 2, pw, ph, 10);
      this.add(plaque);
    }

    // Fonte menor que a placa: o texto fica entre as pontas, sem encostar nos cristais
    this.add(this.text(cx, top + LAYOUT.titleY, 'JOGO PAUSADO', LAYOUT.titleFontSize, t.titleColor, 0.5, FONTS.body, 4, t.titleStroke));
    const mode = describeRunMode(gameScene.gameMode, gameScene.currentChapter ?? 1);
    this.add(this.text(cx, top + LAYOUT.modeY, mode, 12, t.subtitleColor, 0.5));
  }

  private buildStatsRow(cx: number, top: number, gameScene: IPauseGameScene): void {
    const sec = Math.floor(gameScene.survivalTimeMs / 1000);
    const cells: Array<[string, string, string]> = [
      ['ui-icon-timer', 'TEMPO', this.host.formatTime(sec)],
      ['ui-icon-kills', 'ABATES', `${gameScene.killCount}`],
      ['ui-icon-level', 'NÍVEL', `${gameScene.player?.currentLevel ?? 1}`],
      ['ui-icon-souls', 'ALMAS', `${MetaProgressManager.getInstance().runSoulsCollected}`],
    ];
    const gap = 12;
    const w = (LAYOUT.contentW - gap * (cells.length - 1)) / cells.length;
    const left = cx - LAYOUT.contentW / 2;
    const y = top + LAYOUT.statsY;
    cells.forEach(([icon, label, value], i) => {
      const x = left + i * (w + gap);
      this.add(this.cellBox(x, y - LAYOUT.statsCellH / 2, w, LAYOUT.statsCellH));
      this.addIcon(x + 30, y, icon, 34);
      this.add(this.text(x + 56, y - 11, label, 9, MODAL_THEME.pause.labelColor, 0));
      this.add(this.text(x + 56, y + 9, value, 16, MODAL_THEME.pause.valueColor, 0));
    });
  }

  private buildBonuses(cx: number, top: number, gameScene: IPauseGameScene): void {
    const t = MODAL_THEME.pause;
    this.sectionHeader(cx, top + LAYOUT.bonusHeaderY, 'BÔNUS DA PARTIDA');

    const p = gameScene.player;
    const bonuses = p && typeof p.bonusDamagePercent === 'number' ? buildRunBonuses(p as IRunBonusSource) : [];
    const gridTop = top + LAYOUT.bonusGridY;
    if (bonuses.length === 0) {
      this.add(this.text(cx, gridTop + 30, 'NENHUM BÔNUS AINDA: SUBA DE NÍVEL E ESCOLHA CARTAS', 10, t.emptyText, 0.5));
      return;
    }

    const cols = LAYOUT.bonusCols;
    const gap = LAYOUT.bonusGap;
    const w = (LAYOUT.contentW - gap * (cols - 1)) / cols;
    const h = LAYOUT.bonusChipH;
    const left = cx - LAYOUT.contentW / 2;
    bonuses.slice(0, cols * LAYOUT.bonusMaxRows).forEach((b, i) => {
      const x = left + (i % cols) * (w + gap);
      const y = gridTop + Math.floor(i / cols) * (h + gap);
      this.add(this.cellBox(x, y, w, h));
      this.addIcon(x + 20, y + h / 2, b.iconKey, 28);
      this.add(this.text(x + 40, y + 11, b.value, 12, t.valueColor, 0));
      this.add(this.text(x + 40, y + 26, b.label, 8, t.labelColor, 0));
      this.addInfoHotspot(x + w / 2, y + h / 2, w, h, (c) => this.dialog.openInfo(c, b.iconKey, b.title, b.value, b.description));
    });
  }

  private buildWeapons(cx: number, top: number, gameScene: IPauseGameScene): void {
    const t = MODAL_THEME.pause;
    this.sectionHeader(cx, top + LAYOUT.weaponsHeaderY, 'ARMAS');
    const weapons = gameScene.getPauseWeapons?.() ?? [];
    const y = top + LAYOUT.weaponsY;
    if (weapons.length === 0) {
      this.add(this.text(cx, y, 'NENHUMA ARMA EQUIPADA', 10, t.emptyText, 0.5));
      return;
    }
    const slotW = 120;
    const left = cx - (weapons.length * slotW) / 2;
    weapons.forEach((wpn, i) => {
      const x = left + i * slotW;
      this.add(this.cellBox(x + 4, y - 22, slotW - 8, 44));
      this.addIcon(x + 28, y, wpn.key, 36);
      const lvl = wpn.isEvolved ? 'EVOLUÍDA' : `NV ${wpn.level}/${wpn.maxLevel}`;
      this.add(this.text(x + 50, y, lvl, 9, wpn.isEvolved ? t.evolvedText : t.valueColor, 0));
      const info = WEAPON_INFO[wpn.key];
      if (info) {
        this.addInfoHotspot(x + slotW / 2, y, slotW - 8, 44, (c) => this.dialog.openInfo(c, wpn.key, info.name, lvl, info.text));
      }
    });
  }

  private buildVolumeRows(cx: number, top: number): void {
    const t = MODAL_THEME.pause;
    this.sectionHeader(cx, top + LAYOUT.volumeHeaderY, 'VOLUME');
    this.updatePauseBgmDisplay = this.volumeRow(cx, top + LAYOUT.bgmY, 0, 'MÚSICA', t.bgmColorHex, t.bgmColorNum,
      () => SoundManager.getInstance().getMusicVolume(), (d) => this.stepMusic(d));
    this.updatePauseSfxDisplay = this.volumeRow(cx, top + LAYOUT.sfxY, 1, 'EFEITOS', t.sfxColorHex, t.sfxColorNum,
      () => SoundManager.getInstance().getSfxVolume(), (d) => this.stepSfx(d));
  }

  private buildActionButtons(cx: number, top: number, gameScene: IPauseGameScene): void {
    const t = MODAL_THEME.pause;
    const y = top + LAYOUT.buttonsY;
    const bW = LAYOUT.buttonW;
    const bH = LAYOUT.buttonH;
    const gap = 18;
    const startX = cx - (3 * bW + 2 * gap) / 2 + bW / 2;

    this.createActionBtn(startX, y, bW, bH, 'CONTINUAR', t.btnResumeBg, t.btnResumeBorder, ART.resume, () => {
      this.resumeGame(gameScene);
    });

    const restart = (): void => {
      MetaProgressManager.getInstance().finalizeRunSouls();
      this.closeMenuForExit();
      gameScene.scene.restart({ mode: gameScene.gameMode });
    };
    const toMenu = (): void => {
      MetaProgressManager.getInstance().finalizeRunSouls();
      SoundManager.getInstance().stopMusic();
      this.closeMenuForExit();
      gameScene.scene.stop('GameScene');
      this.host.scene.start('MenuScene');
    };

    this.createActionBtn(startX + (bW + gap), y, bW, bH, 'REINICIAR', t.btnRestartBg, t.btnRestartBorder, ART.restart, () => {
      this.confirmExit('REINICIAR A PARTIDA?', 'SIM, REINICIAR', ART.restart, t.btnRestartBg, t.btnRestartBorder, restart);
    });

    this.createActionBtn(startX + 2 * (bW + gap), y, bW, bH, 'MENU', t.btnMenuBg, t.btnMenuBorder, ART.menu, () => {
      this.confirmExit('VOLTAR AO MENU?', 'SIM, SAIR', ART.menu, t.btnMenuBg, t.btnMenuBorder, toMenu);
    });
  }

  /** Pergunta antes de sair: tempo, nível, bônus e armas da partida se perdem. */
  private confirmExit(title: string, yesLabel: string, yesArt: string, yesBg: number, yesBorder: number, onYes: () => void): void {
    if (!this.container) return;
    const t = MODAL_THEME.pause;
    this.dialog.openConfirm(
      this.container,
      title,
      'VOCÊ VAI PERDER O PROGRESSO DESTA PARTIDA: TEMPO, NÍVEL, BÔNUS E ARMAS. AS ALMAS COLETADAS FICAM GUARDADAS.',
      [
        { label: 'VOLTAR', artKey: ART.resume, bgCol: t.btnResumeBg, borderCol: t.btnResumeBorder, onClick: () => undefined },
        { label: yesLabel, artKey: yesArt, bgCol: yesBg, borderCol: yesBorder, onClick: onYes },
      ]
    );
  }

  private closeMenuForExit(): void {
    this.isPaused = false;
    this.cleanupCursor();
    if (this.container) {
      this.container.destroy();
      this.container = undefined;
    }
    this.host.scene.stop('UIScene');
  }

  // ---------------------------------------------------------------- explicação

  /** Área clicável sobre um bônus ou arma; acende uma borda com o mouse em cima. */
  private addInfoHotspot(cx: number, cy: number, w: number, h: number, onClick: (parent: Phaser.GameObjects.Container) => void): void {
    const t = MODAL_THEME.pause;
    const hl = this.host.add.graphics();
    this.add(hl);
    const zone = this.host.add.zone(cx, cy, w, h);
    zone.setInteractive({ useHandCursor: true });
    this.add(zone);
    zone.on('pointerover', () => {
      if (this.dialog.isOpen) return;
      hl.clear();
      hl.lineStyle(2, t.innerBorderColor, 1);
      hl.strokeRoundedRect(cx - w / 2, cy - h / 2, w, h, 6);
    });
    zone.on('pointerout', () => hl.clear());
    zone.on('pointerdown', () => {
      if (this.dialog.isOpen || !this.container) return;
      hl.clear();
      SoundManager.getInstance().playMenuClick();
      onClick(this.container);
    });
    this.pauseZones.push(zone);
  }

  // ---------------------------------------------------------------- peças

  private add(obj: Phaser.GameObjects.GameObject): void {
    this.container?.add(obj);
  }

  private text(
    x: number, y: number, value: string, size: number, color: string, originX: number,
    font: string = FONTS.body, stroke: number = 3, strokeColor: string = MODAL_THEME.pause.textStroke
  ): Phaser.GameObjects.Text {
    return this.host.add.text(x, y, value, {
      fontFamily: font,
      fontSize: `${size}px`,
      fontStyle: 'bold',
      color,
      stroke: strokeColor,
      strokeThickness: stroke
    }).setOrigin(originX, 0.5);
  }

  private hasTexture(key: string): boolean {
    return Boolean(this.host.textures?.exists(key));
  }

  private addIcon(x: number, y: number, key: string, size: number): void {
    if (!this.hasTexture(key)) return;
    this.add(this.host.add.image(x, y, key).setDisplaySize(size, size));
  }

  private cellBox(x: number, y: number, w: number, h: number): Phaser.GameObjects.Graphics {
    const t = MODAL_THEME.pause;
    const g = this.host.add.graphics();
    g.fillStyle(t.cellFill, 0.95);
    g.fillRoundedRect(x, y, w, h, 6);
    g.lineStyle(1, t.cellBorder, 1);
    g.strokeRoundedRect(x, y, w, h, 6);
    return g;
  }

  /** Título de seção com uma linha fina de cada lado. */
  private sectionHeader(cx: number, y: number, label: string): void {
    const t = MODAL_THEME.pause;
    const txt = this.text(cx, y, label, 11, t.sectionText, 0.5);
    this.add(txt);
    const half = LAYOUT.contentW / 2;
    const pad = (txt.width ?? 120) / 2 + 14;
    const g = this.host.add.graphics();
    g.lineStyle(1.5, t.sectionLine, 0.8);
    g.lineBetween(cx - half, y, cx - pad, y);
    g.lineBetween(cx + pad, y, cx + half, y);
    this.add(g);
  }

  /** Linha de volume: rótulo, [-], barra, [+], porcentagem. Devolve quem redesenha a barra. */
  private volumeRow(
    cx: number, y: number, rowIndex: number, label: string, colorHex: string, colorNum: number,
    read: () => number, step: (delta: number) => void
  ): () => void {
    const t = MODAL_THEME.pause;
    const left = cx - LAYOUT.contentW / 2;

    const indicator = this.text(left + 2, y, '▶', 12, colorHex, 0).setVisible(false);
    this.add(indicator);
    this.pauseRowIndicators.push(indicator);
    this.add(this.text(left + 24, y, label, 11, t.valueColor, 0));

    const barX = cx - 150;
    const barW = 300;
    const barH = 14;
    const pct = this.text(cx + 210, y, '', 12, colorHex, 0);
    this.add(pct);

    const bar = this.host.add.graphics();
    this.add(bar);
    const redraw = (): void => {
      const vol = read();
      pct.setText(`${Math.round(vol * 100)}%`);
      bar.clear();
      bar.fillStyle(t.barTrackFill, 1);
      bar.fillRoundedRect(barX, y - barH / 2, barW, barH, 4);
      if (vol > 0) {
        bar.fillStyle(colorNum, 1);
        bar.fillRoundedRect(barX, y - barH / 2, Math.max(8, barW * vol), barH, 4);
      }
      const selected = this.pauseSelectedRow === rowIndex;
      bar.lineStyle(selected ? 2.5 : 1.5, selected ? COLORS.white : t.cellBorder, 1);
      bar.strokeRoundedRect(barX, y - barH / 2, barW, barH, 4);
    };
    redraw();

    this.createStepperBtn(barX - 26, y, '-', rowIndex, () => step(-0.05));
    this.createStepperBtn(barX + barW + 26, y, '+', rowIndex, () => step(0.05));
    return redraw;
  }

  private static stepVolume(current: number, delta: number): number {
    return Math.min(1, Math.max(0, parseFloat((current + delta).toFixed(2))));
  }

  private stepMusic(delta: number): void {
    const sm = SoundManager.getInstance();
    sm.setMusicVolume(PauseMenu.stepVolume(sm.getMusicVolume(), delta));
    this.updatePauseBgmDisplay?.();
  }

  private stepSfx(delta: number): void {
    const sm = SoundManager.getInstance();
    sm.setSfxVolume(PauseMenu.stepVolume(sm.getSfxVolume(), delta));
    this.updatePauseSfxDisplay?.();
    sm.playEnemyHit();
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
    const t = MODAL_THEME.pause;

    const bg = this.host.add.graphics();
    const render = (hover: boolean) => {
      bg.clear();
      bg.fillStyle(hover ? t.stepperHoverFill : t.stepperIdleFill, 1);
      bg.fillCircle(x, y, 13);
      bg.lineStyle(1.5, hover ? COLORS.white : t.outerBorderColor, 1);
      bg.strokeCircle(x, y, 13);
    };
    render(false);
    this.add(bg);
    this.add(this.text(x, y, symbol, 13, COLORS.textWhite, 0.5));

    const zone = this.host.add.zone(x, y, 36, 36);
    zone.setInteractive({ useHandCursor: true });
    this.add(zone);

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

  /** Botão de ação (Continuar / Reiniciar / Menu). Visual em pauseWidgets.createGlowButton. */
  private createActionBtn(
    x: number,
    y: number,
    w: number,
    h: number,
    label: string,
    bgCol: number,
    borderCol: number,
    artKey: string,
    onClick: () => void
  ): void {
    if (!this.container) return;
    const btnIndex = this.pauseActionBtnRenders.length;
    const btn = createGlowButton(this.host, x, y, w, h, { label, artKey, bgCol, borderCol });
    btn.objects.forEach((o) => this.add(o));
    this.pauseActionBtnRenders.push(btn.render);
    this.pauseActionBtnActions.push(onClick);
    const zone = btn.zone;

    zone.on('pointerover', () => {
      if (this.dialog.isOpen) return;
      this.pauseSelectedRow = 2;
      this.pauseSelectedActionIdx = btnIndex;
      this.updateVisualSelection();
      SoundManager.getInstance().playMenuHover();
    });
    zone.on('pointerdown', () => {
      if (this.dialog.isOpen) return;
      SoundManager.getInstance().playMenuClick();
      onClick();
    });

    this.pauseZones.push(zone);
  }
}
