import Phaser from 'phaser';
import { SoundManager } from '../systems/SoundManager';

interface MenuItem {
  label: string;
  action: () => void;
}

export class MenuScene extends Phaser.Scene {
  private selectedIndex: number = 0;
  private menuItems: MenuItem[] = [];
  private textObjects: Phaser.GameObjects.Text[] = [];
  private leftIndicator?: Phaser.GameObjects.Text;
  private rightIndicator?: Phaser.GameObjects.Text;
  private isModalOpen: boolean = false;
  private modalContainer?: Phaser.GameObjects.Container;

  constructor() {
    super('MenuScene');
  }

  create(): void {
    const { width, height } = this.scale;
    const pixelFont = "'Silkscreen', 'Press Start 2P', monospace";

    SoundManager.getInstance().setScene(this);
    // Inicia a música tema oficial do jogo ("Hell Survivor") em loop a 10%
    SoundManager.getInstance().playMenuMusic(1500);

    // 1. Fundo Oficial de Alta Resolução das Catacumbas Infernais (main_menu_background.jpg)
    if (this.textures.exists('menu-background')) {
      const bg = this.add.image(width / 2, height / 2, 'menu-background');
      const scale = Math.max(width / bg.width, height / bg.height);
      bg.setScale(scale);
      bg.setDepth(0);
    } else {
      // Fallback escuro caso a textura ainda esteja carregando
      this.add.rectangle(width / 2, height / 2, width, height, 0x0a0305).setDepth(0);
    }

    // 2. Partículas incandescentes subindo suavemente através dos arcos de pedra
    const LAVA_COLORS = [0xff2200, 0xd00000, 0xff4500, 0xff7b00, 0xff9900, 0xffba08];
    for (let i = 0; i < 35; i++) {
      const ember = this.add.circle(
        Phaser.Math.Between(0, width),
        Phaser.Math.Between(height, height + 80),
        Phaser.Math.Between(1.2, 2.8),
        Phaser.Math.RND.pick(LAVA_COLORS),
        Phaser.Math.FloatBetween(0.35, 0.75)
      );
      ember.setBlendMode(Phaser.BlendModes.ADD);
      ember.setDepth(3);

      this.tweens.add({
        targets: ember,
        y: -40,
        x: ember.x + Phaser.Math.Between(-70, 70),
        alpha: 0,
        duration: Phaser.Math.Between(4000, 9000),
        repeat: -1,
        delay: Phaser.Math.Between(0, 3500)
      });
    }

    // 3. Reflexo avermelhado pulsante e sutil na base
    const bottomGlow = this.add.ellipse(width / 2, height + 30, width * 1.1, 160, 0x9d0208, 0.28);
    bottomGlow.setBlendMode(Phaser.BlendModes.ADD);
    bottomGlow.setDepth(2);

    this.tweens.add({
      targets: bottomGlow,
      alpha: { from: 0.18, to: 0.42 },
      duration: 2200,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    // 4. Logo Oficial Pixel Art Alado Centralizado no Topo: HELL SURVIVOR
    const titleY = 145;
    if (this.textures.exists('game-title-logo')) {
      const titleLogo = this.add.image(width / 2, titleY, 'game-title-logo');
      titleLogo.setScale(1.4);
      titleLogo.setOrigin(0.5);
      titleLogo.setDepth(10);

      // Flutuação mística suave
      this.tweens.add({
        targets: titleLogo,
        y: titleY - 6,
        duration: 2400,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
    } else {
      const fallback = this.add.text(width / 2, titleY, 'HELL SURVIVOR', {
        fontFamily: pixelFont,
        fontSize: '48px',
        fontStyle: 'bold',
        color: '#ff2200',
        stroke: '#ffd60a',
        strokeThickness: 3
      }).setOrigin(0.5).setDepth(10);

      this.tweens.add({
        targets: fallback,
        scale: 1.03,
        duration: 2000,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
    }

    // 5. Configuração dos Itens de Menu
    this.menuItems = [
      {
        label: 'JOGAR HISTÓRIA',
        action: () => this.startGame('story')
      },
      {
        label: 'MODO INFINITO',
        action: () => this.startGame('endless')
      },
      {
        label: 'CONFIGURAÇÕES',
        action: () => this.openSettingsModal()
      },
      {
        label: 'SAIR',
        action: () => this.openExitModal()
      }
    ];

    // 6. Construção Vertical dos Botões de Texto
    const startY = 380;
    const spacingY = 56;
    this.textObjects = [];

    this.menuItems.forEach((item, index) => {
      const itemY = startY + index * spacingY;

      const txt = this.add.text(width / 2, itemY, item.label, {
        fontFamily: pixelFont,
        fontSize: '20px',
        fontStyle: 'bold',
        color: '#d6c7b2',
        stroke: '#150508',
        strokeThickness: 3
      }).setOrigin(0.5).setDepth(15);

      // Zona interativa ampla para captura do mouse
      const hitZone = this.add.zone(width / 2, itemY, 460, 46);
      hitZone.setInteractive({ useHandCursor: true });

      hitZone.on('pointerover', () => {
        if (this.isModalOpen) return;
        if (this.selectedIndex !== index) {
          this.selectedIndex = index;
          SoundManager.getInstance().playMenuHover();
          this.updateMenuVisuals();
        }
      });

      hitZone.on('pointerdown', () => {
        if (this.isModalOpen) return;
        SoundManager.getInstance().playMenuClick();
        item.action();
      });

      this.textObjects.push(txt);
    });

    // 7. Indicadores Visuais da Opção Selecionada (> à esquerda e < à direita)
    this.leftIndicator = this.add.text(0, 0, '>', {
      fontFamily: pixelFont,
      fontSize: '20px',
      fontStyle: 'bold',
      color: '#ffa200',
      stroke: '#ff4500',
      strokeThickness: 3
    }).setOrigin(0.5).setDepth(16);

    this.rightIndicator = this.add.text(0, 0, '<', {
      fontFamily: pixelFont,
      fontSize: '20px',
      fontStyle: 'bold',
      color: '#ffa200',
      stroke: '#ff4500',
      strokeThickness: 3
    }).setOrigin(0.5).setDepth(16);

    // Efeito de pulso suave e rítmico dos indicadores
    this.tweens.add({
      targets: [this.leftIndicator, this.rightIndicator],
      alpha: { from: 0.65, to: 1.0 },
      duration: 420,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    this.updateMenuVisuals();

    // 8. Barra de Rodapé Estilizada em Pedra Gótica ("USE O TECLADO OU MOUSE PARA SELECIONAR")
    const bottomBarY = height - 42;
    const barW = 540;
    const barH = 34;

    const barG = this.add.graphics();
    barG.setDepth(20);

    // Fundo da barra
    barG.fillStyle(0x13070b, 0.88);
    barG.fillRoundedRect(width / 2 - barW / 2, bottomBarY - barH / 2, barW, barH, 8);

    // Borda dupla em bronze e dourado infernal
    barG.lineStyle(2, 0x6e2d1d, 0.9);
    barG.strokeRoundedRect(width / 2 - barW / 2, bottomBarY - barH / 2, barW, barH, 8);
    barG.lineStyle(1, 0xc59b27, 0.5);
    barG.strokeRoundedRect(width / 2 - barW / 2 + 2, bottomBarY - barH / 2 + 2, barW - 4, barH - 4, 6);

    this.add.text(width / 2, bottomBarY, 'USE O TECLADO (W/S/ENTER) OU MOUSE PARA SELECIONAR', {
      fontFamily: pixelFont,
      fontSize: '10px',
      fontStyle: 'bold',
      color: '#e2cfb4',
      stroke: '#000000',
      strokeThickness: 2
    }).setOrigin(0.5).setDepth(21);

    // 9. Suporte a Teclado (W/S, Cima/Baixo, Enter, Espaço, ESC)
    this.setupKeyboardInput();
  }

  /**
   * Atualiza o estado visual das opções (laranja brilhante + glow na selecionada, sem alterar escala)
   */
  private updateMenuVisuals(): void {
    const selected = this.selectedIndex;

    this.textObjects.forEach((txt, idx) => {
      if (idx === selected) {
        // Letra laranja brilhante com sombra incandescente ao passar o mouse ou selecionar
        txt.setStyle({
          color: '#ffa200',
          stroke: '#ff4500',
          strokeThickness: 3,
          shadow: {
            offsetX: 0,
            offsetY: 0,
            color: '#ff6600',
            blur: 14,
            stroke: true,
            fill: true
          }
        });
        txt.setScale(1.0); // FIX: Mantém escala estritamente 1.0 para evitar redimensionamento e jitter

        // Posiciona os ponteiros > e < flanking o texto selecionado
        const halfWidth = txt.width * 0.5;
        if (this.leftIndicator) {
          this.leftIndicator.setPosition(txt.x - halfWidth - 24, txt.y);
          this.leftIndicator.setVisible(true);
        }
        if (this.rightIndicator) {
          this.rightIndicator.setPosition(txt.x + halfWidth + 24, txt.y);
          this.rightIndicator.setVisible(true);
        }
      } else {
        // Estado inativo: osso / pergaminho escuro
        txt.setStyle({
          color: '#d6c7b2',
          stroke: '#150508',
          strokeThickness: 3,
          shadow: {
            offsetX: 0,
            offsetY: 0,
            color: '#000000',
            blur: 0,
            stroke: false,
            fill: false
          }
        });
        txt.setScale(1.0);
      }
    });
  }

  private setupKeyboardInput(): void {
    if (!this.input.keyboard) return;

    // Navegação para Cima
    const moveUp = () => {
      if (this.isModalOpen) return;
      this.selectedIndex = (this.selectedIndex - 1 + this.menuItems.length) % this.menuItems.length;
      SoundManager.getInstance().playMenuHover();
      this.updateMenuVisuals();
    };

    // Navegação para Baixo
    const moveDown = () => {
      if (this.isModalOpen) return;
      this.selectedIndex = (this.selectedIndex + 1) % this.menuItems.length;
      SoundManager.getInstance().playMenuHover();
      this.updateMenuVisuals();
    };

    // Confirmação
    const confirm = () => {
      if (this.isModalOpen) return;
      SoundManager.getInstance().playMenuClick();
      this.menuItems[this.selectedIndex].action();
    };

    this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.UP).on('down', moveUp);
    this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W).on('down', moveUp);

    this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.DOWN).on('down', moveDown);
    this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S).on('down', moveDown);

    this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER).on('down', confirm);
    this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE).on('down', confirm);

    this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC).on('down', () => {
      if (this.isModalOpen) {
        this.closeModal();
      }
    });
  }

  /**
   * Modal Interativo de Configurações de Áudio (Volume de Música e SFX)
   */
  private openSettingsModal(): void {
    if (this.isModalOpen) return;
    this.isModalOpen = true;

    const { width, height } = this.scale;
    const pixelFont = "'Silkscreen', 'Press Start 2P', monospace";

    this.modalContainer = this.add.container(0, 0);
    this.modalContainer.setDepth(100);

    // 1. Película escura de fundo (bloqueia cliques nos botões do menu)
    const overlay = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.78);
    overlay.setInteractive();
    this.modalContainer.add(overlay);

    // 2. Caixa do Painel Gótico
    const panelW = 620;
    const panelH = 430;
    const panelX = width / 2;
    const panelY = height / 2;

    const panelG = this.add.graphics();
    panelG.fillStyle(0x15050c, 0.96);
    panelG.fillRoundedRect(panelX - panelW / 2, panelY - panelH / 2, panelW, panelH, 14);

    panelG.lineStyle(3, 0xc59b27, 0.95);
    panelG.strokeRoundedRect(panelX - panelW / 2, panelY - panelH / 2, panelW, panelH, 14);

    panelG.lineStyle(1.5, 0xff4500, 0.6);
    panelG.strokeRoundedRect(panelX - panelW / 2 + 4, panelY - panelH / 2 + 4, panelW - 8, panelH - 8, 10);
    this.modalContainer.add(panelG);

    // 3. Título do Modal
    const titleTxt = this.add.text(panelX, panelY - panelH / 2 + 40, 'CONFIGURAÇÕES DE ÁUDIO', {
      fontFamily: pixelFont,
      fontSize: '20px',
      fontStyle: 'bold',
      color: '#ffa200',
      stroke: '#300207',
      strokeThickness: 3
    }).setOrigin(0.5);
    this.modalContainer.add(titleTxt);

    // Linha divisória ornamental
    const divider = this.add.graphics();
    divider.lineStyle(1.5, 0xc59b27, 0.4);
    divider.lineBetween(panelX - 220, panelY - panelH / 2 + 68, panelX + 220, panelY - panelH / 2 + 68);
    this.modalContainer.add(divider);

    // =========================================================================
    // CONTROLE 1: VOLUME DA MÚSICA (BGM)
    // =========================================================================
    const bgmRowY = panelY - 45;
    const bgmLabel = this.add.text(panelX, bgmRowY - 26, 'VOLUME DA MÚSICA', {
      fontFamily: pixelFont,
      fontSize: '13px',
      fontStyle: 'bold',
      color: '#f3d17a'
    }).setOrigin(0.5);
    this.modalContainer.add(bgmLabel);

    const bgmPercentTxt = this.add.text(panelX + 160, bgmRowY + 12, '', {
      fontFamily: pixelFont,
      fontSize: '13px',
      fontStyle: 'bold',
      color: '#ffffff'
    }).setOrigin(0, 0.5);
    this.modalContainer.add(bgmPercentTxt);

    const bgmBarGraphics = this.add.graphics();
    this.modalContainer.add(bgmBarGraphics);

    const updateBgmDisplay = () => {
      const vol = SoundManager.getInstance().getMusicVolume();
      const pct = Math.round(vol * 100);
      bgmPercentTxt.setText(`${pct}%`);

      bgmBarGraphics.clear();
      const barX = panelX - 110;
      const barY = bgmRowY + 4;
      const barW = 210;
      const barH = 16;

      // Fundo do slider
      bgmBarGraphics.fillStyle(0x280d15, 1);
      bgmBarGraphics.fillRoundedRect(barX, barY, barW, barH, 4);

      // Preenchimento proporcional
      const fillW = Math.max(0, barW * vol);
      if (fillW > 0) {
        bgmBarGraphics.fillStyle(0xff7700, 1);
        bgmBarGraphics.fillRoundedRect(barX, barY, fillW, barH, 4);
      }

      // Borda
      bgmBarGraphics.lineStyle(1.5, 0xc59b27, 0.8);
      bgmBarGraphics.strokeRoundedRect(barX, barY, barW, barH, 4);
    };
    updateBgmDisplay();

    // Botão [-] Música
    this.createStepperBtn(panelX - 140, bgmRowY + 12, '-', () => {
      const cur = SoundManager.getInstance().getMusicVolume();
      const next = Math.max(0, parseFloat((cur - 0.05).toFixed(2)));
      SoundManager.getInstance().setMusicVolume(next);
      updateBgmDisplay();
    });

    // Botão [+] Música
    this.createStepperBtn(panelX + 120, bgmRowY + 12, '+', () => {
      const cur = SoundManager.getInstance().getMusicVolume();
      const next = Math.min(1, parseFloat((cur + 0.05).toFixed(2)));
      SoundManager.getInstance().setMusicVolume(next);
      updateBgmDisplay();
    });

    // =========================================================================
    // CONTROLE 2: VOLUME DOS EFEITOS SONOROS (SFX)
    // =========================================================================
    const sfxRowY = panelY + 65;
    const sfxLabel = this.add.text(panelX, sfxRowY - 26, 'VOLUME DOS EFEITOS (SFX)', {
      fontFamily: pixelFont,
      fontSize: '13px',
      fontStyle: 'bold',
      color: '#f3d17a'
    }).setOrigin(0.5);
    this.modalContainer.add(sfxLabel);

    const sfxPercentTxt = this.add.text(panelX + 160, sfxRowY + 12, '', {
      fontFamily: pixelFont,
      fontSize: '13px',
      fontStyle: 'bold',
      color: '#ffffff'
    }).setOrigin(0, 0.5);
    this.modalContainer.add(sfxPercentTxt);

    const sfxBarGraphics = this.add.graphics();
    this.modalContainer.add(sfxBarGraphics);

    const updateSfxDisplay = () => {
      const vol = SoundManager.getInstance().getSfxVolume();
      const pct = Math.round(vol * 100);
      sfxPercentTxt.setText(`${pct}%`);

      sfxBarGraphics.clear();
      const barX = panelX - 110;
      const barY = sfxRowY + 4;
      const barW = 210;
      const barH = 16;

      sfxBarGraphics.fillStyle(0x280d15, 1);
      sfxBarGraphics.fillRoundedRect(barX, barY, barW, barH, 4);

      const fillW = Math.max(0, barW * vol);
      if (fillW > 0) {
        sfxBarGraphics.fillStyle(0x00f5d4, 1);
        sfxBarGraphics.fillRoundedRect(barX, barY, fillW, barH, 4);
      }

      sfxBarGraphics.lineStyle(1.5, 0xc59b27, 0.8);
      sfxBarGraphics.strokeRoundedRect(barX, barY, barW, barH, 4);
    };
    updateSfxDisplay();

    // Botão [-] SFX
    this.createStepperBtn(panelX - 140, sfxRowY + 12, '-', () => {
      const cur = SoundManager.getInstance().getSfxVolume();
      const next = Math.max(0, parseFloat((cur - 0.05).toFixed(2)));
      SoundManager.getInstance().setSfxVolume(next);
      updateSfxDisplay();
      SoundManager.getInstance().playEnemyHit();
    });

    // Botão [+] SFX
    this.createStepperBtn(panelX + 120, sfxRowY + 12, '+', () => {
      const cur = SoundManager.getInstance().getSfxVolume();
      const next = Math.min(1, parseFloat((cur + 0.05).toFixed(2)));
      SoundManager.getInstance().setSfxVolume(next);
      updateSfxDisplay();
      SoundManager.getInstance().playEnemyHit();
    });

    // =========================================================================
    // BOTÃO: VOLTAR / SALVAR
    // =========================================================================
    const closeBtnY = panelY + panelH / 2 - 46;
    const closeBtnG = this.add.graphics();
    const btnW = 260;
    const btnH = 38;

    const renderCloseBtn = (hover: boolean) => {
      closeBtnG.clear();
      closeBtnG.fillStyle(hover ? 0xff4500 : 0x3d0a15, 1);
      closeBtnG.fillRoundedRect(panelX - btnW / 2, closeBtnY - btnH / 2, btnW, btnH, 6);
      closeBtnG.lineStyle(1.5, hover ? 0xffffff : 0xc59b27, 1);
      closeBtnG.strokeRoundedRect(panelX - btnW / 2, closeBtnY - btnH / 2, btnW, btnH, 6);
    };
    renderCloseBtn(false);
    this.modalContainer.add(closeBtnG);

    const closeTxt = this.add.text(panelX, closeBtnY, 'FECHAR E SALVAR', {
      fontFamily: pixelFont,
      fontSize: '12px',
      fontStyle: 'bold',
      color: '#ffffff'
    }).setOrigin(0.5);
    this.modalContainer.add(closeTxt);

    const closeZone = this.add.zone(panelX, closeBtnY, btnW, btnH);
    closeZone.setInteractive({ useHandCursor: true });
    this.modalContainer.add(closeZone);

    closeZone.on('pointerover', () => {
      renderCloseBtn(true);
      SoundManager.getInstance().playMenuHover();
    });
    closeZone.on('pointerout', () => renderCloseBtn(false));
    closeZone.on('pointerdown', () => {
      SoundManager.getInstance().playMenuClick();
      this.closeModal();
    });
  }

  private createStepperBtn(x: number, y: number, symbol: string, onClick: () => void): void {
    if (!this.modalContainer) return;
    const pixelFont = "'Silkscreen', 'Press Start 2P', monospace";

    const bg = this.add.graphics();
    const render = (hover: boolean) => {
      bg.clear();
      bg.fillStyle(hover ? 0xff4500 : 0x22050e, 1);
      bg.fillCircle(x, y, 16);
      bg.lineStyle(1.5, hover ? 0xffffff : 0xc59b27, 1);
      bg.strokeCircle(x, y, 16);
    };
    render(false);
    this.modalContainer.add(bg);

    const txt = this.add.text(x, y, symbol, {
      fontFamily: pixelFont,
      fontSize: '14px',
      fontStyle: 'bold',
      color: '#ffffff'
    }).setOrigin(0.5);
    this.modalContainer.add(txt);

    const zone = this.add.zone(x, y, 34, 34);
    zone.setInteractive({ useHandCursor: true });
    this.modalContainer.add(zone);

    zone.on('pointerover', () => {
      render(true);
      SoundManager.getInstance().playMenuHover();
    });
    zone.on('pointerout', () => render(false));
    zone.on('pointerdown', () => {
      onClick();
    });
  }

  /**
   * Modal amigável de confirmação ao clicar em Sair
   */
  private openExitModal(): void {
    if (this.isModalOpen) return;
    this.isModalOpen = true;

    const { width, height } = this.scale;
    const pixelFont = "'Silkscreen', 'Press Start 2P', monospace";

    this.modalContainer = this.add.container(0, 0);
    this.modalContainer.setDepth(100);

    const overlay = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.78);
    overlay.setInteractive();
    this.modalContainer.add(overlay);

    const panelW = 480;
    const panelH = 260;
    const panelX = width / 2;
    const panelY = height / 2;

    const panelG = this.add.graphics();
    panelG.fillStyle(0x15050c, 0.96);
    panelG.fillRoundedRect(panelX - panelW / 2, panelY - panelH / 2, panelW, panelH, 12);
    panelG.lineStyle(2, 0xc59b27, 1);
    panelG.strokeRoundedRect(panelX - panelW / 2, panelY - panelH / 2, panelW, panelH, 12);
    this.modalContainer.add(panelG);

    const title = this.add.text(panelX, panelY - 60, 'ENCERRAR JOGO', {
      fontFamily: pixelFont,
      fontSize: '18px',
      fontStyle: 'bold',
      color: '#ffa200'
    }).setOrigin(0.5);
    this.modalContainer.add(title);

    const msg = this.add.text(
      panelX,
      panelY - 12,
      'Para sair completamente do Hell Survivor,\nbasta fechar esta aba do seu navegador.',
      {
        fontFamily: pixelFont,
        fontSize: '11px',
        color: '#d4c7b8',
        align: 'center',
        lineSpacing: 6
      }
    ).setOrigin(0.5);
    this.modalContainer.add(msg);

    const btnY = panelY + 65;
    const btnG = this.add.graphics();
    const btnW = 200;
    const btnH = 34;

    const renderBtn = (hover: boolean) => {
      btnG.clear();
      btnG.fillStyle(hover ? 0xff4500 : 0x3d0a15, 1);
      btnG.fillRoundedRect(panelX - btnW / 2, btnY - btnH / 2, btnW, btnH, 6);
      btnG.lineStyle(1.5, hover ? 0xffffff : 0xc59b27, 1);
      btnG.strokeRoundedRect(panelX - btnW / 2, btnY - btnH / 2, btnW, btnH, 6);
    };
    renderBtn(false);
    this.modalContainer.add(btnG);

    const btnTxt = this.add.text(panelX, btnY, 'VOLTAR AO MENU', {
      fontFamily: pixelFont,
      fontSize: '11px',
      fontStyle: 'bold',
      color: '#ffffff'
    }).setOrigin(0.5);
    this.modalContainer.add(btnTxt);

    const zone = this.add.zone(panelX, btnY, btnW, btnH);
    zone.setInteractive({ useHandCursor: true });
    this.modalContainer.add(zone);

    zone.on('pointerover', () => {
      renderBtn(true);
      SoundManager.getInstance().playMenuHover();
    });
    zone.on('pointerout', () => renderBtn(false));
    zone.on('pointerdown', () => {
      SoundManager.getInstance().playMenuClick();
      this.closeModal();
    });
  }

  private closeModal(): void {
    if (this.modalContainer) {
      this.modalContainer.destroy();
      this.modalContainer = undefined;
    }
    this.isModalOpen = false;
  }

  private startGame(mode: 'story' | 'endless'): void {
    SoundManager.getInstance().playMenuClick();
    this.cameras.main.flash(200, 255, 255, 255);
    this.time.delayedCall(160, () => {
      if (mode === 'story') {
        SoundManager.getInstance().stopMusic(300);
        this.scene.start('IntroScene');
      } else {
        this.scene.start('GameScene', { mode });
      }
    });
  }
}
