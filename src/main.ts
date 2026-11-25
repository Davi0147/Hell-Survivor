import Phaser from 'phaser';
import { createGameConfig } from './config/gameConfig';
import { getGameWidthForScreen } from './config/screenFit';
import { STORAGE_KEYS } from './config/storageKeys';
import { initPWAInstallPrompt } from './systems/PWAInstallPrompt';
import { installCrashGuard } from './systems/CrashGuard';

/**
 * Área onde o jogo cabe de verdade: o contêiner (já sem notch e cantos) ou, se ele ainda não
 * tem tamanho, a parte visível da janela (no iPhone a janela inteira inclui o que fica atrás das barras).
 */
function getVisibleArea(): [number, number] {
  const container = document.getElementById('game-container');
  if (container && container.clientWidth > 0 && container.clientHeight > 0) {
    const style = window.getComputedStyle(container);
    const padX = parseFloat(style.paddingLeft) + parseFloat(style.paddingRight);
    const padY = parseFloat(style.paddingTop) + parseFloat(style.paddingBottom);
    return [container.clientWidth - padX, container.clientHeight - padY];
  }
  const vv = window.visualViewport;
  return vv ? [vv.width, vv.height] : [window.innerWidth, window.innerHeight];
}

function readRenderMode(): string | null {
  try {
    // Escolha manual pelo link: ?render=canvas (modo compatível) ou ?render=webgl (volta ao normal)
    const forced = new URLSearchParams(window.location.search).get('render');
    if (forced === 'canvas') localStorage.setItem(STORAGE_KEYS.RENDER_MODE, 'canvas');
    if (forced === 'webgl') localStorage.removeItem(STORAGE_KEYS.RENDER_MODE);
    return localStorage.getItem(STORAGE_KEYS.RENDER_MODE);
  } catch {
    return null;
  }
}

/**
 * O Safari do iPhone às vezes descarta a memória de vídeo do jogo (falta de memória, app em
 * segundo plano). O WebGL volta pela metade: imagens aparecem, mas tudo que é desenhado por código
 * (barras, minimapa, molduras, menus) some. Nesse caso o aparelho passa a usar Canvas e o jogo recarrega.
 */
function watchWebglContextLoss(game: Phaser.Game): void {
  const canvas = game.canvas;
  if (!canvas || game.config.renderType === Phaser.CANVAS) return;
  canvas.addEventListener('webglcontextlost', () => {
    try {
      localStorage.setItem(STORAGE_KEYS.RENDER_MODE, 'canvas');
    } catch {
      // Sem armazenamento: recarrega mesmo assim e tenta o WebGL de novo
    }
  });
  canvas.addEventListener('webglcontextrestored', () => window.location.reload());
}

async function bootstrap() {
  if (document.fonts) {
    try {
      await Promise.all([
        document.fonts.load('20px Silkscreen'),
        document.fonts.load('bold 20px Silkscreen'),
        document.fonts.load('16px Silkscreen'),
        document.fonts.load('16px "Press Start 2P"'),
        document.fonts.ready
      ]);
    } catch (e) {
      console.warn('[main] PrÃ©-carregamento de fontes concluÃ­do com fallback:', e);
    }
  }

  // iPhone: as áreas seguras (notch, barra de início) e a altura visível só assentam alguns
  // quadros depois de abrir. Medir cedo demais escolhe um formato errado e sobra faixa preta.
  await waitForLayoutToSettle();

  // A largura do jogo acompanha o formato da tela (sem borda preta nos lados do celular)
  const startWidth = getGameWidthForScreen(...getVisibleArea());
  const useCanvas = readRenderMode() === 'canvas';
  const game = new Phaser.Game(createGameConfig(startWidth, useCanvas));
  installCrashGuard(game);
  watchWebglContextLoss(game);
  (window as Window & { __PHASER_GAME__?: Phaser.Game }).__PHASER_GAME__ = game;
  initPWAInstallPrompt();

  // Se a pÃ¡gina carrega com o contÃªiner ainda sem tamanho (aba em segundo plano, WebView
  // abrindo, painel recolhido), o Phaser calcula um canvas 0x0 e nÃ£o recalcula sozinho,
  // deixando a tela preta. Reajusta sempre que o contÃªiner mudar de tamanho.
  // Girou o celular, as barras do Safari sumiram ou a área segura mudou: se o formato da tela
  // ficou diferente do jogo e ainda estamos no menu (nada a perder), recarrega para o jogo
  // assumir a largura certa; no meio da partida só ajusta a escala.
  let refitTimer: number | undefined;
  const scheduleRefit = (): void => {
    game.scale.refresh();
    window.clearTimeout(refitTimer);
    refitTimer = window.setTimeout(() => refitIfInMenu(game), 450);
  };
  const container = document.getElementById('game-container');
  if (container && typeof ResizeObserver !== 'undefined') {
    new ResizeObserver(scheduleRefit).observe(container);
  }
  window.visualViewport?.addEventListener('resize', scheduleRefit);
  window.addEventListener('resize', scheduleRefit);
}

/** Espera dois quadros e um instante: tempo para o navegador aplicar áreas seguras e altura visível. */
function waitForLayoutToSettle(): Promise<void> {
  return new Promise((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(() => window.setTimeout(resolve, 120)));
    // Aba em segundo plano não desenha quadros: não espera mais que isto
    window.setTimeout(resolve, 400);
  });
}

/** Diferença mínima (px de jogo) que justifica recarregar; e no máximo 2 recargas por sessão. */
const REFIT_MIN_DIFF = 40;
const REFIT_MAX_RELOADS = 2;

function refitIfInMenu(game: Phaser.Game): void {
  const wanted = getGameWidthForScreen(...getVisibleArea());
  if (Math.abs(wanted - game.scale.gameSize.width) < REFIT_MIN_DIFF) return;
  const inMenu = game.scene.isActive('MenuScene') && !game.scene.isActive('GameScene');
  if (!inMenu) return;
  try {
    const reloads = Number(sessionStorage.getItem(STORAGE_KEYS.SCREEN_REFIT_RELOADS) ?? '0');
    // Teto evita ficar recarregando sem parar se o aparelho oscilar entre dois tamanhos
    if (reloads >= REFIT_MAX_RELOADS) return;
    sessionStorage.setItem(STORAGE_KEYS.SCREEN_REFIT_RELOADS, String(reloads + 1));
  } catch {
    return;
  }
  window.location.reload();
}

if (document.readyState === 'loading') {
  window.addEventListener('DOMContentLoaded', bootstrap);
} else {
  bootstrap();
}

// Registro de PWA Service Worker com atualizaÃ§Ã£o confiÃ¡vel e banner seguro
let userRequestedReload = false;

if ('serviceWorker' in navigator && (import.meta.env.PROD || window.location.protocol === 'https:')) {
  let refreshing = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    // Recarrega SOMENTE se o jogador solicitou a recarga ativamente via clique no banner.
    // Evita recargas inesperadas na primeira visita (quando o SW recÃ©m-instalado chama clients.claim())
    // e na migraÃ§Ã£o silenciosa do cache legado v1.
    if (!userRequestedReload) return;
    if (refreshing) return;
    refreshing = true;
    window.location.reload();
  });

  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('./sw.js', { updateViaCache: 'none' })
      .then((registration) => {
        // 1. Checa se jÃ¡ hÃ¡ um worker esperando na fila
        if (registration.waiting) {
          handleWaitingWorker(registration.waiting);
        }

        // 2. Escuta quando um novo worker Ã© detectado
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (!newWorker) return;

          newWorker.addEventListener('statechange', () => {
            // Se foi instalado e jÃ¡ temos um controller anterior ativo, Ã© uma atualizaÃ§Ã£o
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              handleWaitingWorker(newWorker);
            }
          });
        });

        // 3. Checa atualizaÃ§Ãµes ao focar a aba (visibilitychange)
        document.addEventListener('visibilitychange', () => {
          if (document.visibilityState === 'visible') {
            registration.update().catch(() => {
              // Silencia erros de rede transitÃ³rios na revalidaÃ§Ã£o em background
            });
          }
        });

        // 4. Checagem periÃ³dica a cada 30 minutos em segundo plano
        window.setInterval(() => {
          registration.update().catch(() => {
            // Silencia erros de rede transitÃ³rios na checagem periÃ³dica
          });
        }, 30 * 60 * 1000);
      })
      .catch((err) => {
        console.warn('[sw] Falha ao registrar Service Worker:', err);
      });
  });
}

function isCombatActive(): boolean {
  const game = (window as unknown as { __PHASER_GAME__?: Phaser.Game }).__PHASER_GAME__;
  if (!game || !game.scene) return false;
  if (!game.scene.isActive('GameScene')) return false;
  if (game.scene.isPaused('GameScene')) return false;

  const uiScene = game.scene.getScene('UIScene') as { isPaused?: boolean } | undefined;
  if (uiScene?.isPaused) return false;

  const gameScene = game.scene.getScene('GameScene') as { isGameOver?: boolean; isChapterCompleted?: boolean } | undefined;
  if (gameScene?.isGameOver || gameScene?.isChapterCompleted) {
    return false;
  }

  return true;
}

let pendingWorker: ServiceWorker | null = null;
let combatSafetyCheckTimer: number | null = null;

function handleWaitingWorker(worker: ServiceWorker): void {
  if (isCombatActive()) {
    pendingWorker = worker;
    if (combatSafetyCheckTimer === null) {
      combatSafetyCheckTimer = window.setInterval(() => {
        if (!isCombatActive()) {
          if (combatSafetyCheckTimer !== null) {
            window.clearInterval(combatSafetyCheckTimer);
            combatSafetyCheckTimer = null;
          }
          if (pendingWorker) {
            showUpdateBanner(pendingWorker);
            pendingWorker = null;
          }
        }
      }, 1000);
    }
  } else {
    showUpdateBanner(worker);
  }
}

function showUpdateBanner(worker: ServiceWorker): void {
  if (document.getElementById('pwa-update-banner')) return;

  const banner = document.createElement('div');
  banner.id = 'pwa-update-banner';
  banner.style.cssText = `
    position: fixed;
    top: 16px;
    right: 16px;
    left: auto;
    transform: none;
    width: calc(100% - 32px);
    max-width: 330px;
    background: rgba(24, 2, 8, 0.96);
    border: 2px solid #ff0055;
    box-shadow: 0 0 24px rgba(255, 0, 85, 0.45), 0 0 10px rgba(243, 209, 122, 0.3), 0 8px 32px rgba(0, 0, 0, 0.85);
    border-radius: 8px;
    padding: 14px 18px;
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    gap: 8px;
    z-index: 1000002;
    font-family: 'Silkscreen', monospace, sans-serif;
    color: #ffffff;
    box-sizing: border-box;
    backdrop-filter: blur(4px);
  `;

  const title = document.createElement('div');
  title.innerText = 'NOVA VERSÃƒO DISPONÃVEL';
  title.style.cssText = `
    font-size: 12px;
    font-weight: bold;
    color: #f3d17a;
    letter-spacing: 1px;
    margin-bottom: 2px;
  `;

  const subtitle = document.createElement('div');
  subtitle.innerText = 'Atualize para receber correÃ§Ãµes e novidades.';
  subtitle.style.cssText = `
    font-size: 9px;
    color: #d8c2c8;
    line-height: 1.35;
    margin-bottom: 6px;
  `;

  const buttonContainer = document.createElement('div');
  buttonContainer.style.cssText = `
    display: flex;
    gap: 12px;
    justify-content: center;
    width: 100%;
  `;

  const reloadButton = document.createElement('button');
  reloadButton.innerText = 'RECARREGAR';
  reloadButton.style.cssText = `
    flex: 1;
    max-width: 140px;
    background: linear-gradient(180deg, #ff0055 0%, #720012 100%);
    border: 1px solid #f3d17a;
    color: #ffffff;
    font-family: 'Silkscreen', monospace;
    font-size: 9px;
    font-weight: bold;
    padding: 8px 12px;
    border-radius: 6px;
    cursor: pointer;
    letter-spacing: 0.5px;
  `;

  reloadButton.addEventListener('click', () => {
    userRequestedReload = true;
    reloadButton.disabled = true;
    reloadButton.innerText = 'RECARREGANDO...';
    reloadButton.style.opacity = '0.7';
    worker.postMessage({ type: 'SKIP_WAITING' });
  });

  const dismissButton = document.createElement('button');
  dismissButton.innerText = 'DEPOIS';
  dismissButton.style.cssText = `
    flex: 1;
    max-width: 110px;
    background: linear-gradient(180deg, #3b0764 0%, #240046 100%);
    border: 1px solid rgba(243, 209, 122, 0.45);
    color: #e2d9f3;
    font-family: 'Silkscreen', monospace;
    font-size: 9px;
    font-weight: bold;
    padding: 8px 12px;
    border-radius: 6px;
    cursor: pointer;
    letter-spacing: 0.5px;
  `;

  dismissButton.addEventListener('click', () => {
    banner.remove();
  });

  buttonContainer.appendChild(reloadButton);
  buttonContainer.appendChild(dismissButton);

  banner.appendChild(title);
  banner.appendChild(subtitle);
  banner.appendChild(buttonContainer);

  document.body.appendChild(banner);
}

