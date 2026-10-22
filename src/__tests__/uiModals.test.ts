import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('phaser', () => ({
  default: {
    Scene: class {},
    Input: {
      Keyboard: {
        KeyCodes: {
          ESC: 27,
          UP: 38,
          DOWN: 40,
          LEFT: 37,
          RIGHT: 39,
          W: 87,
          S: 83,
          A: 65,
          D: 68,
          SPACE: 32,
          ENTER: 13
        },
        JustDown: vi.fn(() => false)
      }
    }
  }
}));

vi.mock('../systems/SoundManager', () => {
  let musicVol = 0.5;
  let sfxVol = 0.5;
  const instance = {
    playMenuClick: vi.fn(),
    playMenuHover: vi.fn(),
    playEnemyHit: vi.fn(),
    stopMusic: vi.fn(),
    getMusicVolume: vi.fn(() => musicVol),
    setMusicVolume: vi.fn((v: number) => {
      musicVol = v;
    }),
    getSfxVolume: vi.fn(() => sfxVol),
    setSfxVolume: vi.fn((v: number) => {
      sfxVol = v;
    })
  };
  return {
    SoundManager: {
      getInstance: () => instance
    }
  };
});

vi.mock('../systems/MetaProgressManager', () => {
  const instance = {
    runSoulsCollected: 42,
    finalizeRunSouls: vi.fn(() => 42)
  };
  return {
    MetaProgressManager: {
      getInstance: () => instance
    }
  };
});

vi.mock('../systems/GamepadManager', () => {
  const navState = {
    up: false,
    down: false,
    left: false,
    right: false,
    confirm: false,
    cancel: false
  };
  const instance = {
    getMenuNavigation: vi.fn(() => navState),
    getActivePad: vi.fn(() => null)
  };
  return {
    GamepadManager: {
      getInstance: () => instance
    }
  };
});

import { createModalFrame } from '../ui/ModalFrame';
import { PauseMenu, IPauseGameScene, IPauseMenuHost } from '../ui/PauseMenu';
import { GameOverModal, IGameOverModalHost } from '../ui/GameOverModal';
import { ChapterVictoryModal, IChapterVictoryModalHost } from '../ui/ChapterVictoryModal';
import { MODAL_THEME } from '../config/theme';
import { SoundManager } from '../systems/SoundManager';
import { GamepadManager } from '../systems/GamepadManager';

interface FakeZone {
  x: number;
  y: number;
  w: number;
  h: number;
  handlers: Record<string, () => void>;
  setInteractive: ReturnType<typeof vi.fn>;
  on: (event: string, cb: () => void) => FakeZone;
}

function createFakeHost() {
  const zones: FakeZone[] = [];
  const texts: Array<{ text: string; setText: ReturnType<typeof vi.fn>; setColor: ReturnType<typeof vi.fn>; setVisible: ReturnType<typeof vi.fn> }> = [];
  const containers: Array<{ depth: number; destroyed: boolean; children: unknown[]; add: ReturnType<typeof vi.fn>; setDepth: ReturnType<typeof vi.fn>; destroy: ReturnType<typeof vi.fn> }> = [];

  let hudVisible = true;
  let bestRecord = 120;

  const host = {
    scale: { width: 1280, height: 720 },
    isChestRouletteOpen: false,
    isGameOverModalOpen: false,
    sandboxPanel: { isOpen: false, togglePanel: vi.fn() },
    touchControls: { setVisible: vi.fn() },
    input: {
      keyboard: {
        addKey: vi.fn(() => ({}))
      }
    },
    scene: {
      isActive: vi.fn(() => false),
      stop: vi.fn(),
      start: vi.fn()
    },
    add: {
      container: vi.fn(() => {
        const c = {
          depth: 0,
          destroyed: false,
          children: [] as unknown[],
          add: vi.fn((item: unknown) => {
            c.children.push(item);
            return c;
          }),
          setDepth: vi.fn((d: number) => {
            c.depth = d;
            return c;
          }),
          destroy: vi.fn(() => {
            c.destroyed = true;
          })
        };
        containers.push(c);
        return c;
      }),
      rectangle: vi.fn(() => ({
        setInteractive: vi.fn().mockReturnThis()
      })),
      graphics: vi.fn(() => ({
        clear: vi.fn().mockReturnThis(),
        fillStyle: vi.fn().mockReturnThis(),
        fillRoundedRect: vi.fn().mockReturnThis(),
        lineStyle: vi.fn().mockReturnThis(),
        strokeRoundedRect: vi.fn().mockReturnThis(),
        lineBetween: vi.fn().mockReturnThis(),
        fillCircle: vi.fn().mockReturnThis(),
        strokeCircle: vi.fn().mockReturnThis()
      })),
      text: vi.fn((_x: number, _y: number, initialText: string) => {
        const t = {
          text: initialText,
          setOrigin: vi.fn().mockReturnThis(),
          setVisible: vi.fn().mockReturnThis(),
          setText: vi.fn((val: string) => {
            t.text = val;
            return t;
          }),
          setColor: vi.fn().mockReturnThis()
        };
        texts.push(t);
        return t;
      }),
      zone: vi.fn((x: number, y: number, w: number, h: number) => {
        const z: FakeZone = {
          x,
          y,
          w,
          h,
          handlers: {},
          setInteractive: vi.fn().mockReturnThis(),
          on: (ev: string, cb: () => void) => {
            z.handlers[ev] = cb;
            return z;
          }
        };
        zones.push(z);
        return z;
      })
    },
    isDialogueActive: vi.fn(() => false),
    isHUDVisible: vi.fn(() => hudVisible),
    setHUDVisible: vi.fn((v: boolean) => {
      hudVisible = v;
    }),
    formatTime: vi.fn((sec: number) => `${Math.floor(sec / 60)}:${sec % 60}`),
    getBestRecordValue: vi.fn(() => bestRecord),
    updateBestRecordIfHigher: vi.fn((sec: number) => {
      if (sec > bestRecord) {
        bestRecord = sec;
        return true;
      }
      return false;
    }),
    onCleanupPauseCursor: vi.fn(),
    showWaveAlert: vi.fn()
  };

  return {
    host: host as unknown as IPauseMenuHost & IGameOverModalHost & IChapterVictoryModalHost,
    rawHost: host,
    zones,
    texts,
    containers
  };
}

function createFakeGameScene(): IPauseGameScene {
  return {
    isGameOver: false,
    isChapterCompleted: false,
    survivalTimeMs: 95000,
    killCount: 77,
    gameMode: 'story',
    player: { currentLevel: 5 },
    physics: {
      pause: vi.fn(),
      resume: vi.fn()
    },
    scene: {
      pause: vi.fn(),
      resume: vi.fn(),
      restart: vi.fn(),
      stop: vi.fn()
    }
  };
}

describe('Pacote UI — ModalFrame, PauseMenu, GameOverModal e ChapterVictoryModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    const nav = GamepadManager.getInstance().getMenuNavigation({} as never);
    nav.up = false;
    nav.down = false;
    nav.left = false;
    nav.right = false;
    nav.confirm = false;
    nav.cancel = false;
  });

  it('ModalFrame: cria container na profundidade pedida, backdrop interativo e painel de borda dupla', () => {
    const { host, containers } = createFakeHost();
    const frame = createModalFrame(host, {
      depth: 3500,
      backdropAlpha: MODAL_THEME.pause.backdropAlpha,
      panelWidth: 540,
      panelHeight: 390,
      panelFill: MODAL_THEME.pause.panelFill,
      outerBorderColor: MODAL_THEME.pause.outerBorderColor,
      innerBorderColor: MODAL_THEME.pause.innerBorderColor
    });

    expect(frame.panelX).toBe(640);
    expect(frame.panelY).toBe(360);
    expect(frame.panelW).toBe(540);
    expect(frame.panelH).toBe(390);
    expect(containers[0].depth).toBe(3500);
    expect(containers[0].children.length).toBe(2); // backdrop + panelGraphics
  });

  it('PauseMenu: pausa física e cena ao abrir, oculta touchControls e retoma tudo ao fechar', () => {
    const { host, rawHost } = createFakeHost();
    const gameScene = createFakeGameScene();
    const pauseMenu = new PauseMenu(host);

    pauseMenu.pauseGame(gameScene);
    expect(pauseMenu.isPaused).toBe(true);
    expect(gameScene.physics.pause).toHaveBeenCalledTimes(1);
    expect(gameScene.scene.pause).toHaveBeenCalledTimes(1);
    expect(rawHost.touchControls.setVisible).toHaveBeenCalledWith(false);

    pauseMenu.resumeGame(gameScene);
    expect(pauseMenu.isPaused).toBe(false);
    expect(gameScene.physics.resume).toHaveBeenCalledTimes(1);
    expect(gameScene.scene.resume).toHaveBeenCalledTimes(1);
    expect(rawHost.touchControls.setVisible).toHaveBeenCalledWith(true);
  });

  it('PauseMenu: navega entre linhas (BGM, SFX, Ações) e ajusta volume ou confirma ação via controles', () => {
    const { host } = createFakeHost();
    const gameScene = createFakeGameScene();
    const pauseMenu = new PauseMenu(host);

    pauseMenu.pauseGame(gameScene);
    const nav = GamepadManager.getInstance().getMenuNavigation(host);

    // Sobe da linha 2 (Ações) para linha 1 (SFX) e ajusta volume para a direita
    nav.up = true;
    pauseMenu.updateControls(gameScene);
    nav.up = false;

    nav.right = true;
    pauseMenu.updateControls(gameScene);
    expect(SoundManager.getInstance().setSfxVolume).toHaveBeenCalled();
    nav.right = false;

    // Sobe para linha 0 (BGM) e ajusta volume para a esquerda
    nav.up = true;
    pauseMenu.updateControls(gameScene);
    nav.up = false;

    nav.left = true;
    pauseMenu.updateControls(gameScene);
    expect(SoundManager.getInstance().setMusicVolume).toHaveBeenCalled();
    nav.left = false;

    // Volta até a linha 2 (Ações) e confirma CONTINUAR (índice 0)
    nav.down = true;
    pauseMenu.updateControls(gameScene);
    pauseMenu.updateControls(gameScene);
    nav.down = false;

    nav.confirm = true;
    pauseMenu.updateControls(gameScene);
    expect(pauseMenu.isPaused).toBe(false);
  });

  it('GameOverModal: exibe estatísticas, atualiza recorde no modo endless e dispara callbacks nos botões', () => {
    const { host, rawHost } = createFakeHost();
    const modal = new GameOverModal(host);
    const onRetry = vi.fn();
    const onMenu = vi.fn();

    modal.show(
      { kills: 150, level: 12, timeSec: 240, mode: 'endless', soulsEarned: 55 },
      onRetry,
      onMenu
    );

    expect(modal.isOpen).toBe(true);
    expect(rawHost.setHUDVisible).toHaveBeenCalledWith(false);
    expect(rawHost.updateBestRecordIfHigher).toHaveBeenCalledWith(240);

    // Seleciona botão 1 (MENU PRINCIPAL) e confirma via controles
    const nav = GamepadManager.getInstance().getMenuNavigation(host);
    nav.right = true;
    modal.updateControls();
    nav.right = false;

    nav.confirm = true;
    modal.updateControls();

    expect(modal.isOpen).toBe(false);
    expect(onMenu).toHaveBeenCalledTimes(1);
    expect(onRetry).not.toHaveBeenCalled();
  });

  it('ChapterVictoryModal: oculta HUD, exibe alerta no botão Próximo Capítulo e aciona callback de Voltar ao Menu', () => {
    const { host, rawHost, zones } = createFakeHost();
    const modal = new ChapterVictoryModal(host);
    const onMenu = vi.fn();

    modal.show({ kills: 200, level: 14, timeSec: 420, soulsEarned: 75 }, onMenu);

    expect(rawHost.setHUDVisible).toHaveBeenCalledWith(false);
    expect(zones.length).toBe(2);

    // Clique no botão 1 (Próximo Capítulo)
    zones[0].handlers.pointerdown();
    expect(rawHost.showWaveAlert).toHaveBeenCalledWith(
      'Capítulo 2 em desenvolvimento nas próximas atualizações!',
      3000
    );

    // Clique no botão 2 (Voltar ao Menu)
    zones[1].handlers.pointerdown();
    expect(onMenu).toHaveBeenCalledTimes(1);

    modal.destroy();
    expect(modal.container).toBeUndefined();
  });
});
