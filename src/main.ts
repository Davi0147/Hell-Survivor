import Phaser from 'phaser';
import { GAME_CONFIG } from './config/gameConfig';
import { initPWAInstallPrompt } from './systems/PWAInstallPrompt';

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
      console.warn('[main] Pré-carregamento de fontes concluído com fallback:', e);
    }
  }

  new Phaser.Game(GAME_CONFIG);
  initPWAInstallPrompt();
}

if (document.readyState === 'loading') {
  window.addEventListener('DOMContentLoaded', bootstrap);
} else {
  bootstrap();
}

// Registro de PWA Service Worker (Instalação no celular e cache de performance)
if ('serviceWorker' in navigator && (import.meta.env.PROD || window.location.protocol === 'https:')) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  });
}
