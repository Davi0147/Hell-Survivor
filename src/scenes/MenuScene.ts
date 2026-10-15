import Phaser from 'phaser';

export class MenuScene extends Phaser.Scene {
  constructor() {
    super('MenuScene');
  }

  create(): void {
    const { width, height } = this.scale;
    const pixelFont = "'Silkscreen', 'Press Start 2P', monospace";

    // 1. Fundo obsidiana profundo
    const bg = this.add.rectangle(width / 2, height / 2, width, height, 0x090205);

    // Grid e partículas de brasas infernais subindo
    for (let i = 0; i < 35; i++) {
      const ember = this.add.circle(
        Phaser.Math.Between(0, width),
        Phaser.Math.Between(height, height + 100),
        Phaser.Math.Between(1.5, 3.5),
        Phaser.Math.RND.pick([0xff0055, 0xffbe0b, 0x9d0208, 0x7209b7]),
        Phaser.Math.FloatBetween(0.4, 0.85)
      );
      ember.setBlendMode(Phaser.BlendModes.ADD);

      this.tweens.add({
        targets: ember,
        y: -50,
        x: ember.x + Phaser.Math.Between(-80, 80),
        alpha: 0,
        duration: Phaser.Math.Between(4000, 8500),
        repeat: -1,
        delay: Phaser.Math.Between(0, 3000)
      });
    }

    // 2. Título Central Oficial em Pixel Art: HELL SURVIVOR (Title.png)
    const titleY = 145;

    // Brilho infernal avermelhado pulsante atrás do logotipo
    const titleGlow = this.add.circle(width / 2, titleY + 10, 160, 0xd90429, 0.18);
    titleGlow.setBlendMode(Phaser.BlendModes.ADD);
    this.tweens.add({
      targets: titleGlow,
      scaleX: 1.15,
      scaleY: 1.15,
      alpha: 0.28,
      duration: 1800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    if (this.textures.exists('game-title-logo')) {
      const titleLogo = this.add.image(width / 2, titleY, 'game-title-logo');
      titleLogo.setScale(1.4); // 392 x 238 px em pixel-perfect
      titleLogo.setOrigin(0.5);

      // Flutuação mística sutil
      this.tweens.add({
        targets: titleLogo,
        y: titleY - 6,
        duration: 2200,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
    } else {
      // Fallback tipográfico caso a textura esteja carregando
      this.add.text(width / 2, titleY, 'HELL SURVIVOR', {
        fontFamily: pixelFont,
        fontSize: '52px',
        fontStyle: 'bold',
        color: '#ff0055',
        stroke: '#ffd60a',
        strokeThickness: 3
      }).setOrigin(0.5);
    }

    const subTitle = this.add.text(width / 2, titleY + 130, '— A SAGA DE NIXY —', {
      fontFamily: pixelFont,
      fontSize: '13px',
      fontStyle: 'bold',
      color: '#f3d17a',
      stroke: '#1a0308',
      strokeThickness: 2
    }).setOrigin(0.5);

    // 3. Cards de Seleção de Modo (Estilo Persona 5 Chanfrado)
    const cardW = 440;
    const cardH = 210;
    const cardY = height / 2 + 65;

    // CARD 1: MODO HISTÓRIA
    const storyCardX = width / 2 - cardW / 2 - 25;
    this.createModeCard(
      storyCardX,
      cardY,
      cardW,
      cardH,
      '📖 MODO HISTÓRIA',
      'Capítulo 1: As Catacumbas do Desespero',
      'Expurgue as almas da cripta até invocar a Chefe Succubus Imperial.',
      '⚔️ [ 1 ] JOGAR HISTÓRIA',
      0x9d0208,
      0xc59b27,
      () => this.startGame('story')
    );

    // CARD 2: MODO INFINITO
    const endlessCardX = width / 2 + cardW / 2 + 25;
    this.createModeCard(
      endlessCardX,
      cardY,
      cardW,
      cardH,
      '♾️ MODO INFINITO',
      'Sobrevivência Sem Fim',
      'Hordas crescentes. Mini-Chefes a cada 3 min e Chefes a cada 10 min.',
      '💀 [ 2 ] JOGAR INFINITO',
      0x3a0ca3,
      0x00f5d4,
      () => this.startGame('endless')
    );

    // 4. Rodapé de Instruções
    this.add.text(width / 2, height - 32, '💡 Use o Mouse ou [1] e [2] no teclado para selecionar o modo', {
      fontFamily: pixelFont,
      fontSize: '10px',
      color: '#a2a2a2',
      stroke: '#000000',
      strokeThickness: 2
    }).setOrigin(0.5);

    // 5. Atalhos de Teclado
    if (this.input.keyboard) {
      this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ONE).on('down', () => this.startGame('story'));
      this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.TWO).on('down', () => this.startGame('endless'));
    }
  }

  private createModeCard(
    x: number,
    y: number,
    w: number,
    h: number,
    title: string,
    subtitle: string,
    description: string,
    btnLabel: string,
    accentColor: number,
    goldColor: number,
    onClick: () => void
  ): void {
    const pixelFont = "'Silkscreen', 'Press Start 2P', monospace";
    const container = this.add.container(x, y);

    const bgG = this.add.graphics();
    const renderCard = (hover: boolean) => {
      bgG.clear();
      // Fundo chanfrado
      bgG.fillStyle(hover ? 0x220510 : 0x14030a, 0.96);
      bgG.fillRoundedRect(-w / 2, -h / 2, w, h, 12);

      // Borda com destaque
      bgG.lineStyle(hover ? 3 : 2, hover ? goldColor : accentColor, 1);
      bgG.strokeRoundedRect(-w / 2, -h / 2, w, h, 12);

      bgG.lineStyle(1, 0xffffff, hover ? 0.8 : 0.2);
      bgG.strokeRoundedRect(-w / 2 + 3, -h / 2 + 3, w - 6, h - 6, 9);
    };
    renderCard(false);
    container.add(bgG);

    // Título do Modo
    const titleTxt = this.add.text(0, -h / 2 + 30, title, {
      fontFamily: pixelFont,
      fontSize: '18px',
      fontStyle: 'bold',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5);
    container.add(titleTxt);

    // Subtítulo
    const subTxt = this.add.text(0, -h / 2 + 62, subtitle, {
      fontFamily: pixelFont,
      fontSize: '11px',
      fontStyle: 'bold',
      color: '#f3d17a',
      stroke: '#28040d',
      strokeThickness: 2
    }).setOrigin(0.5);
    container.add(subTxt);

    // Descrição
    const descTxt = this.add.text(0, -h / 2 + 104, description, {
      fontFamily: pixelFont,
      fontSize: '10px',
      color: '#d4c7b8',
      wordWrap: { width: w - 40, useAdvancedWrap: true },
      align: 'center',
      lineSpacing: 4
    }).setOrigin(0.5);
    container.add(descTxt);

    // Botão de Ação
    const btnBg = this.add.graphics();
    const renderBtn = (hover: boolean) => {
      btnBg.clear();
      btnBg.fillStyle(hover ? goldColor : 0x3d020d, 1);
      btnBg.fillRoundedRect(-140, h / 2 - 42, 280, 32, 6);
      btnBg.lineStyle(1.5, hover ? 0xffffff : goldColor, 1);
      btnBg.strokeRoundedRect(-140, h / 2 - 42, 280, 32, 6);
    };
    renderBtn(false);
    container.add(btnBg);

    const btnTxt = this.add.text(0, h / 2 - 26, btnLabel, {
      fontFamily: pixelFont,
      fontSize: '11px',
      fontStyle: 'bold',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 2
    }).setOrigin(0.5);
    container.add(btnTxt);

    // Interatividade
    const hitZone = this.add.zone(0, 0, w, h);
    hitZone.setInteractive({ useHandCursor: true });
    container.add(hitZone);

    hitZone.on('pointerover', () => {
      renderCard(true);
      renderBtn(true);
      btnTxt.setColor('#000000');
      this.tweens.add({
        targets: container,
        scaleX: 1.03,
        scaleY: 1.03,
        duration: 140,
        ease: 'Quad.easeOut'
      });
    });

    hitZone.on('pointerout', () => {
      renderCard(false);
      renderBtn(false);
      btnTxt.setColor('#ffffff');
      this.tweens.add({
        targets: container,
        scaleX: 1.0,
        scaleY: 1.0,
        duration: 140,
        ease: 'Quad.easeOut'
      });
    });

    hitZone.on('pointerdown', () => onClick());
  }

  private startGame(mode: 'story' | 'endless'): void {
    this.cameras.main.flash(200, 255, 255, 255);
    this.time.delayedCall(150, () => {
      this.scene.start('GameScene', { mode });
    });
  }
}
