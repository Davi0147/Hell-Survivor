/**
 * PWAInstallPrompt.ts
 * Sistema responsável por detectar dispositivos móveis e exibir um aviso
 * elegante para instalar o jogo diretamente na tela inicial do celular.
 */

import { STORAGE_KEYS } from '../config/storageKeys';

let deferredPrompt: any = null;
let bannerElement: HTMLElement | null = null;

export function initPWAInstallPrompt(): void {
  // 1. Se já estiver rodando instalado como App (Standalone), não faz nada
  const isStandalone = 
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true ||
    document.referrer.includes('android-app://');

  if (isStandalone) {
    return;
  }

  // 2. Verifica se o usuário já dispensou nesta sessão
  if (sessionStorage.getItem(STORAGE_KEYS.PWA_DISMISSED) === '1') {
    return;
  }

  const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent) && !(window as any).MSStream;
  const isMobile = /Android|iPhone|iPad|iPod|webOS|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
    (window.matchMedia('(pointer: coarse)').matches && window.innerWidth <= 1024);

  // 3. Captura o evento nativo de instalação do Chrome / Android
  window.addEventListener('beforeinstallprompt', (e: Event) => {
    e.preventDefault();
    deferredPrompt = e;
    // Exibe banner nativo após um breve delay para a página carregar suavemente
    setTimeout(() => {
      createAndShowBanner('native');
    }, 1200);
  });

  // 4. Se for iOS Mobile (Safari não tem beforeinstallprompt), exibe instrução após carregar
  if (isIOS && isMobile) {
    setTimeout(() => {
      createAndShowBanner('ios');
    }, 2000);
  }

  // 5. Ouve quando a instalação for concluída com sucesso
  window.addEventListener('appinstalled', () => {
    hideBanner();
    deferredPrompt = null;
  });
}

function createAndShowBanner(type: 'native' | 'ios'): void {
  if (bannerElement || sessionStorage.getItem(STORAGE_KEYS.PWA_DISMISSED) === '1') return;

  const banner = document.createElement('div');
  banner.id = 'pwa-install-banner';
  banner.style.cssText = `
    position: fixed;
    top: 14px;
    left: 50%;
    transform: translateX(-50%) translateY(-120%);
    width: calc(100% - 28px);
    max-width: 440px;
    background: linear-gradient(135deg, rgba(24, 4, 10, 0.96) 0%, rgba(10, 1, 4, 0.98) 100%);
    border: 2px solid #ff2a55;
    box-shadow: 0 0 24px rgba(255, 42, 85, 0.45), 0 10px 30px rgba(0, 0, 0, 0.8);
    border-radius: 10px;
    padding: 12px 14px;
    display: flex;
    align-items: center;
    gap: 12px;
    z-index: 1000000;
    color: #ffffff;
    font-family: 'Silkscreen', monospace, sans-serif;
    transition: transform 0.35s cubic-bezier(0.18, 0.89, 0.32, 1.28);
    box-sizing: border-box;
  `;

  // Ícone da Nixy
  const iconImg = document.createElement('img');
  iconImg.src = './icons/icon-192.png';
  iconImg.alt = 'Hell Survivor Icon';
  iconImg.style.cssText = `
    width: 46px;
    height: 46px;
    border-radius: 8px;
    border: 1px solid #f3d17a;
    flex-shrink: 0;
    box-shadow: 0 0 10px rgba(243, 209, 122, 0.3);
  `;

  // Textos explicativos
  const textContainer = document.createElement('div');
  textContainer.style.cssText = `
    flex: 1;
    min-width: 0;
  `;

  const title = document.createElement('div');
  title.innerText = 'INSTALAR HELL SURVIVOR';
  title.style.cssText = `
    font-size: 11px;
    font-weight: bold;
    color: #f3d17a;
    letter-spacing: 0.5px;
    margin-bottom: 2px;
  `;

  const desc = document.createElement('div');
  desc.style.cssText = `
    font-size: 8px;
    color: #d8c2c8;
    line-height: 1.25;
    font-family: 'Silkscreen', sans-serif;
  `;

  if (type === 'ios') {
    desc.innerHTML = `Toque em <b>Compartilhar ⎋</b> e selecione <b>'Adicionar à Tela de Início'</b>!`;
  } else {
    desc.innerText = 'Instale o app para jogar em tela cheia sem barras e com melhor resposta!';
  }

  textContainer.appendChild(title);
  textContainer.appendChild(desc);

  // Botão de ação (Instalar ou Entendi)
  const actionBtn = document.createElement('button');
  actionBtn.style.cssText = `
    background: linear-gradient(180deg, #ff2a55 0%, #aa002b 100%);
    border: 1px solid #ff7b95;
    color: #ffffff;
    font-family: 'Silkscreen', monospace;
    font-size: 9px;
    font-weight: bold;
    padding: 8px 10px;
    border-radius: 6px;
    cursor: pointer;
    flex-shrink: 0;
    box-shadow: 0 2px 8px rgba(255, 42, 85, 0.4);
    letter-spacing: 0.5px;
  `;
  actionBtn.innerText = type === 'ios' ? 'ENTENDI' : 'INSTALAR';

  actionBtn.onclick = async () => {
    if (type === 'native' && deferredPrompt) {
      deferredPrompt.prompt();
      try {
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
          hideBanner();
        }
      } catch (err) {
        console.warn('[PWA] Prompt error:', err);
      }
      deferredPrompt = null;
    } else {
      hideBanner();
      sessionStorage.setItem(STORAGE_KEYS.PWA_DISMISSED, '1');
    }
  };

  // Botão de Fechar discreto
  const closeBtn = document.createElement('button');
  closeBtn.innerText = '✕';
  closeBtn.style.cssText = `
    background: transparent;
    border: none;
    color: #887;
    font-size: 13px;
    cursor: pointer;
    padding: 2px 4px;
    margin-left: -4px;
    line-height: 1;
  `;
  closeBtn.onclick = () => {
    hideBanner();
    sessionStorage.setItem(STORAGE_KEYS.PWA_DISMISSED, '1');
  };

  banner.appendChild(iconImg);
  banner.appendChild(textContainer);
  banner.appendChild(actionBtn);
  banner.appendChild(closeBtn);

  document.body.appendChild(banner);
  bannerElement = banner;

  // Animação de entrada
  requestAnimationFrame(() => {
    banner.style.transform = 'translateX(-50%) translateY(0)';
  });
}

function hideBanner(): void {
  if (!bannerElement) return;
  bannerElement.style.transform = 'translateX(-50%) translateY(-140%)';
  setTimeout(() => {
    if (bannerElement && bannerElement.parentNode) {
      bannerElement.parentNode.removeChild(bannerElement);
    }
    bannerElement = null;
  }, 400);
}
