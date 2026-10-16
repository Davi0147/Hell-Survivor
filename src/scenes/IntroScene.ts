import Phaser from 'phaser';
import { SoundManager } from '../systems/SoundManager';

interface IntroStep {
  bgKey?: string;
  speaker?: 'nixy' | 'chefe' | 'narrator';
  speakerName?: string;
  text: string;
  action?: (scene: IntroScene) => void;
}

export class IntroScene extends Phaser.Scene {
  // Camadas de fundo com suporte a transição suave (Crossfade)
  private currentBgKey: string = 'intro-1';
  private bgImageA!: Phaser.GameObjects.Image;
  private bgImageB!: Phaser.GameObjects.Image;
  private isBgAActive: boolean = true;

  // Efeitos de Luz e Partículas
  private flickerOverlay!: Phaser.GameObjects.Rectangle;
  private paperParticles!: Phaser.GameObjects.Group;
  private blackFadeOverlay!: Phaser.GameObjects.Rectangle;
  private skipBtnContainer!: Phaser.GameObjects.Container;

  // Bustos dos Personagens
  private leftBust!: Phaser.GameObjects.Image;
  private rightBust!: Phaser.GameObjects.Image;
  private readonly BUST_W = 430;
  private readonly BUST_H = 430;
  private readonly BUST_LEFT_X = 210;
  private readonly BUST_RIGHT_X = 1070;

  // Caixa de Diálogo Estilo Persona 5 / Visual Novel
  private boxContainer!: Phaser.GameObjects.Container;
  private boxGraphics!: Phaser.GameObjects.Graphics;
  private nameplateGraphics!: Phaser.GameObjects.Graphics;
  private nameText!: Phaser.GameObjects.Text;
  private dialogueText!: Phaser.GameObjects.Text;
  private promptText!: Phaser.GameObjects.Text;

  private readonly BOX_W = 920;
  private readonly BOX_H = 145;

  // Controle de Sequência e Digitação
  private steps: IntroStep[] = [];
  private currentStepIndex: number = 0;
  private isTyping: boolean = false;
  private fullText: string = '';
  private displayedText: string = '';
  private typeTimer?: Phaser.Time.TimerEvent;
  private isEnding: boolean = false;

  constructor() {
    super('IntroScene');
  }

  create(): void {
    const { width, height } = this.scale;
    const pixelFont = "'Silkscreen', 'Press Start 2P', monospace";

    SoundManager.getInstance().setScene(this);
    // Toca a trilha de Halloween bem baixinha de fundo com fade-in suave em loop
    SoundManager.getInstance().playIntroMusic(2500);

    // 1. Camadas de Fundo (A e B) para transições suaves de cena
    this.bgImageA = this.add.image(width / 2, height / 2, 'intro-1').setDepth(0);
    this.fitBackground(this.bgImageA);

    this.bgImageB = this.add.image(width / 2, height / 2, 'intro-1').setDepth(1).setAlpha(0);
    this.fitBackground(this.bgImageB);

    // Efeito cinematográfico suave de respiração da câmera (Slow drift)
    this.tweens.add({
      targets: [this.bgImageA, this.bgImageB],
      scaleX: '+=0.02',
      scaleY: '+=0.02',
      duration: 10000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    // 2. Camada de Overlay de Escurecimento e Relâmpagos / Piscadas
    this.flickerOverlay = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0);
    this.flickerOverlay.setDepth(20);

    // 3. Grupo de Partículas de Papéis Voando
    this.paperParticles = this.add.group();

    // 4. Bustos dos Personagens
    this.leftBust = this.add.image(this.BUST_LEFT_X, height + 10, 'chat-nixy');
    this.leftBust.setOrigin(0.5, 1.0);
    this.leftBust.setDisplaySize(this.BUST_W, this.BUST_H);
    this.leftBust.setDepth(30);
    this.leftBust.setAlpha(0);

    this.rightBust = this.add.image(this.BUST_RIGHT_X, height + 10, 'chat-boss');
    this.rightBust.setOrigin(0.5, 1.0);
    this.rightBust.setDisplaySize(this.BUST_W, this.BUST_H);
    this.rightBust.setDepth(30);
    this.rightBust.setAlpha(0);

    // 5. Caixa de Diálogo
    const boxX = (width - this.BOX_W) / 2;
    const boxY = height - this.BOX_H - 24;

    this.boxContainer = this.add.container(boxX, boxY).setDepth(50);

    this.boxGraphics = this.add.graphics();
    this.boxContainer.add(this.boxGraphics);

    this.nameplateGraphics = this.add.graphics();
    this.boxContainer.add(this.nameplateGraphics);

    this.nameText = this.add.text(35, -24, 'NIXY', {
      fontFamily: pixelFont,
      fontSize: '16px',
      fontStyle: 'bold',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 4
    });
    this.boxContainer.add(this.nameText);

    this.dialogueText = this.add.text(35, 26, '', {
      fontFamily: pixelFont,
      fontSize: '18px',
      color: '#f8f9fa',
      stroke: '#0a0104',
      strokeThickness: 3.5,
      wordWrap: { width: this.BOX_W - 70, useAdvancedWrap: true },
      lineSpacing: 10
    });
    this.boxContainer.add(this.dialogueText);

    this.promptText = this.add.text(this.BOX_W - 30, this.BOX_H - 18, '▶ ESPAÇO / CLIQUE', {
      fontFamily: pixelFont,
      fontSize: '11px',
      fontStyle: 'bold',
      color: '#f3d17a',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(1, 0.5);
    this.boxContainer.add(this.promptText);

    this.tweens.add({
      targets: this.promptText,
      alpha: 0.35,
      duration: 500,
      yoyo: true,
      repeat: -1
    });

    // 6. Botão de Pular no Canto Superior Direito: [ESC] PULAR INTRO
    const skipBtn = this.add.container(width - 130, 36).setDepth(100);
    const skipG = this.add.graphics();
    const btnW = 190;
    const btnH = 34;

    const renderSkip = (hover: boolean) => {
      skipG.clear();
      skipG.fillStyle(hover ? 0x9d0208 : 0x180309, 0.85);
      skipG.fillRoundedRect(-btnW / 2, -btnH / 2, btnW, btnH, 6);
      skipG.lineStyle(1.5, hover ? 0xffffff : 0xc59b27, 0.9);
      skipG.strokeRoundedRect(-btnW / 2, -btnH / 2, btnW, btnH, 6);
    };
    renderSkip(false);
    skipBtn.add(skipG);

    const skipTxt = this.add.text(0, 0, '[ESC] PULAR INTRO', {
      fontFamily: pixelFont,
      fontSize: '11px',
      fontStyle: 'bold',
      color: '#f3d17a',
      stroke: '#000000',
      strokeThickness: 2
    }).setOrigin(0.5);
    skipBtn.add(skipTxt);

    const skipZone = this.add.zone(0, 0, btnW, btnH).setInteractive({ useHandCursor: true });
    skipBtn.add(skipZone);

    skipZone.on('pointerover', () => {
      renderSkip(true);
      SoundManager.getInstance().playMenuHover();
    });
    skipZone.on('pointerout', () => renderSkip(false));
    skipZone.on('pointerdown', () => this.skipIntro());

    this.skipBtnContainer = skipBtn;

    // 7. Controles de Avanço (Clique, Espaço, Enter, ESC)
    this.input.on('pointerdown', (_pointer: Phaser.Input.Pointer, gameObjects: Phaser.GameObjects.GameObject[]) => {
      if (gameObjects.includes(skipZone)) return;
      this.handleAdvance();
    });

    if (this.input.keyboard) {
      this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE).on('down', () => this.handleAdvance());
      this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER).on('down', () => this.handleAdvance());
      this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC).on('down', () => this.skipIntro());
    }

    // 8. Construir a Lista Completa de Cenas e Diálogos
    this.buildIntroScript();

    // 9. Overlay preto de transição (Inicia cobrindo 100% da tela)
    this.blackFadeOverlay = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 1.0);
    this.blackFadeOverlay.setDepth(2000);

    // Ocultar balão e botão enquanto a tela está preta nos 2 segundos iniciais
    this.boxContainer.setVisible(false);
    this.skipBtnContainer.setVisible(false);

    // Fica na escuridão por exatamente 2 segundos enquanto a música faz o fade-in suave em loop
    this.time.delayedCall(2000, () => {
      this.tweens.add({
        targets: this.blackFadeOverlay,
        alpha: 0,
        duration: 800,
        ease: 'Linear',
        onComplete: () => {
          this.boxContainer.setVisible(true);
          this.skipBtnContainer.setVisible(true);
          this.displayStep(0);
        }
      });
    });
  }

  private fitBackground(img: Phaser.GameObjects.Image): void {
    const { width, height } = this.scale;
    const scale = Math.max(width / img.width, height / img.height);
    img.setScale(scale);
    img.setPosition(width / 2, height / 2);
  }

  public switchBackground(key: string, duration: number = 700): void {
    if (this.currentBgKey === key) return;
    this.currentBgKey = key;

    const nextImg = this.isBgAActive ? this.bgImageB : this.bgImageA;
    const prevImg = this.isBgAActive ? this.bgImageA : this.bgImageB;

    nextImg.setTexture(key);
    this.fitBackground(nextImg);
    nextImg.setAlpha(0);
    nextImg.setDepth(2);
    prevImg.setDepth(1);

    this.tweens.add({
      targets: nextImg,
      alpha: 1,
      duration,
      ease: 'Cubic.easeInOut',
      onComplete: () => {
        prevImg.setAlpha(0);
        this.isBgAActive = !this.isBgAActive;
      }
    });
  }

  private drawSlantedBox(speaker: 'nixy' | 'chefe' | 'narrator'): void {
    const g = this.boxGraphics;
    g.clear();

    const boxW = this.BOX_W;
    const boxH = this.BOX_H;
    const slant = speaker === 'chefe' ? -12 : (speaker === 'narrator' ? 0 : 12);

    // 1. Sombra projetada
    g.fillStyle(0x000000, 0.78);
    g.beginPath();
    g.moveTo(6, 6 - slant);
    g.lineTo(boxW + 6, 6);
    g.lineTo(boxW + 6, boxH + 6);
    g.lineTo(6, boxH + 6 - slant);
    g.closePath();
    g.fill();

    // 2. Fundo interno (Carmesim para Nixy / Roxo Abissal para Chefe / Ônix Escuro para Narrador)
    let bgColor = 0x160207;
    let accentColor = 0xc59b27;
    if (speaker === 'chefe') {
      bgColor = 0x12011a;
      accentColor = 0xff0055;
    } else if (speaker === 'narrator') {
      bgColor = 0x0c070e;
      accentColor = 0x887799;
    }

    g.fillStyle(bgColor, 0.96);
    g.beginPath();
    g.moveTo(0, -slant);
    g.lineTo(boxW, 0);
    g.lineTo(boxW, boxH);
    g.lineTo(0, boxH - slant);
    g.closePath();
    g.fill();

    // 3. Moldura Branca Estilo Persona / Mangá
    g.lineStyle(3.5, 0xffffff, 1);
    g.stroke();

    // 4. Filete interno chanfrado
    g.lineStyle(1.5, accentColor, 0.85);
    g.beginPath();
    g.moveTo(4, -slant + 4);
    g.lineTo(boxW - 4, 4);
    g.lineTo(boxW - 4, boxH - 4);
    g.lineTo(4, boxH - slant - 4);
    g.closePath();
    g.stroke();
  }

  private drawNameplate(name: string, speaker: 'nixy' | 'chefe' | 'narrator'): void {
    const g = this.nameplateGraphics;
    g.clear();

    if (speaker === 'narrator' || !name) {
      this.nameText.setText('');
      return;
    }

    const isChefe = speaker === 'chefe';
    const nW = Math.max(160, name.length * 15 + 40);
    const nH = 34;
    const nX = isChefe ? this.BOX_W - nW - 25 : 25;
    const nY = -28;

    const plateColor = isChefe ? 0x6a0056 : 0x9d0208;
    g.fillStyle(plateColor, 1);
    g.beginPath();
    g.moveTo(nX, nY);
    g.lineTo(nX + nW, nY - 4);
    g.lineTo(nX + nW - 12, nY + nH);
    g.lineTo(nX - 10, nY + nH);
    g.closePath();
    g.fill();

    g.lineStyle(2.5, 0xffffff, 1);
    g.stroke();

    this.nameText.setText(name.toUpperCase());
    this.nameText.setPosition(nX + 14, nY + 6);
  }

  private updateBusts(speaker: 'nixy' | 'chefe' | 'narrator'): void {
    const { width, height } = this.scale;

    if (speaker === 'nixy') {
      // Destaca Nixy na esquerda
      this.leftBust.setTexture('chat-nixy');
      this.leftBust.clearTint();
      this.leftBust.setDepth(35);

      if (this.leftBust.alpha < 0.95) {
        this.leftBust.setPosition(80, height + 10);
        this.tweens.add({
          targets: this.leftBust,
          x: this.BUST_LEFT_X,
          alpha: 1,
          duration: 250,
          ease: 'Back.easeOut'
        });
      }

      // Diminui Chefe se presente
      if (this.rightBust.alpha > 0) {
        this.rightBust.setTint(0x554455);
        this.rightBust.setDepth(30);
      }
    } else if (speaker === 'chefe') {
      // Destaca Chefe na direita
      this.rightBust.setTexture('chat-boss');
      this.rightBust.clearTint();
      this.rightBust.setDepth(35);

      if (this.rightBust.alpha < 0.95) {
        this.rightBust.setPosition(width - 80, height + 10);
        this.tweens.add({
          targets: this.rightBust,
          x: this.BUST_RIGHT_X,
          alpha: 1,
          duration: 250,
          ease: 'Back.easeOut'
        });
      }

      // Diminui Nixy
      if (this.leftBust.alpha > 0) {
        this.leftBust.setTint(0x554455);
        this.leftBust.setDepth(30);
      }
    } else {
      // Narrador / Direção de Cena: Ambos levemente atenuados
      if (this.leftBust.alpha > 0) this.leftBust.setTint(0x554455);
      if (this.rightBust.alpha > 0) this.rightBust.setTint(0x554455);
    }
  }

  private displayStep(index: number): void {
    if (index >= this.steps.length) {
      this.finishIntro();
      return;
    }

    this.currentStepIndex = index;
    const step = this.steps[index];

    // Troca de fundo se especificado
    if (step.bgKey) {
      this.switchBackground(step.bgKey);
    }

    const speaker = step.speaker ?? 'narrator';
    const speakerName = step.speakerName ?? (speaker === 'nixy' ? 'Nixy' : (speaker === 'chefe' ? 'Chefe' : ''));

    this.drawSlantedBox(speaker);
    this.drawNameplate(speakerName, speaker);
    this.updateBusts(speaker);

    // Formatação de cor e estilo do texto
    if (speaker === 'narrator') {
      this.dialogueText.setColor('#e2cfb4');
      this.dialogueText.setFontStyle('italic');
    } else if (step.text.includes('!!!') || step.text === 'O QUÊ?!' || step.text.startsWith('DESISTO') || step.text.startsWith('ENTÃO')) {
      this.dialogueText.setColor('#ffaa00');
      this.dialogueText.setFontStyle('bold');
    } else {
      this.dialogueText.setColor('#f8f9fa');
      this.dialogueText.setFontStyle('normal');
    }

    // Executa ação especial de tela vinculada a este passo (shake, zoom, sons)
    if (step.action) {
      step.action(this);
    }

    // Inicia efeito de máquina de escrever
    this.fullText = step.text;
    this.displayedText = '';
    this.dialogueText.setText('');
    this.isTyping = true;

    if (speaker === 'nixy' || speaker === 'chefe') {
      SoundManager.getInstance().playDialogueVoice(speaker);
    }

    if (this.typeTimer) {
      this.typeTimer.remove();
    }

    let charIdx = 0;
    this.typeTimer = this.time.addEvent({
      delay: 22,
      repeat: this.fullText.length - 1,
      callback: () => {
        charIdx++;
        this.displayedText = this.fullText.substring(0, charIdx);
        this.dialogueText.setText(this.displayedText);

        const ch = this.fullText[charIdx - 1];
        SoundManager.getInstance().playDialogueTypewriter(ch);

        if (charIdx >= this.fullText.length) {
          this.isTyping = false;
        }
      }
    });
  }

  public handleAdvance(): void {
    if (this.isEnding) return;

    SoundManager.getInstance().playMenuClick();

    if (this.isTyping) {
      // Conclui o texto imediatamente
      if (this.typeTimer) this.typeTimer.remove();
      this.isTyping = false;
      this.displayedText = this.fullText;
      this.dialogueText.setText(this.fullText);
    } else {
      // Avança para o próximo passo
      this.displayStep(this.currentStepIndex + 1);
    }
  }

  public spawnPaperStorm(): void {
    const { width, height } = this.scale;
    SoundManager.getInstance().playPaperRustle();

    for (let i = 0; i < 40; i++) {
      const x = Phaser.Math.Between(width * 0.2, width * 0.8);
      const y = height * 0.6;
      const paper = this.add.rectangle(x, y, Phaser.Math.Between(18, 30), Phaser.Math.Between(26, 40), 0xfafafa, 0.95);
      paper.setStrokeStyle(1, 0xcccccc);
      paper.setDepth(45);
      paper.setRotation(Phaser.Math.FloatBetween(-1, 1));
      this.paperParticles.add(paper);

      const targetX = x + Phaser.Math.Between(-350, 350);
      const targetY = -100;
      const duration = Phaser.Math.Between(1800, 3200);

      this.tweens.add({
        targets: paper,
        x: targetX,
        y: targetY,
        rotation: paper.rotation + Phaser.Math.FloatBetween(-4, 4),
        alpha: { from: 1, to: 0 },
        duration,
        ease: 'Cubic.easeOut',
        onComplete: () => paper.destroy()
      });
    }
  }

  public triggerLightFlicker(): void {
    SoundManager.getInstance().playLightFlicker();
    this.tweens.add({
      targets: this.flickerOverlay,
      alpha: 0.75,
      duration: 60,
      yoyo: true,
      repeat: 6,
      ease: 'Stepped'
    });
  }

  private skipIntro(): void {
    if (this.isEnding) return;
    SoundManager.getInstance().playMenuClick();
    this.finishIntro();
  }

  private finishIntro(): void {
    if (this.isEnding) return;
    this.isEnding = true;

    if (this.typeTimer) this.typeTimer.remove();
    this.isTyping = false;

    // Fade out suave da música da intro
    SoundManager.getInstance().stopMusic(1000);

    // Oculta caixa de diálogo e botão para focar na transição escura
    this.boxContainer.setVisible(false);
    if (this.skipBtnContainer) this.skipBtnContainer.setVisible(false);

    // A tela escurece para preto (600ms) e permanece na escuridão por exatamente 2 segundos
    this.tweens.add({
      targets: this.blackFadeOverlay,
      alpha: 1,
      duration: 600,
      ease: 'Linear',
      onComplete: () => {
        // Fica preto por mais 2 segundos antes de iniciar o jogo
        this.time.delayedCall(2000, () => {
          this.scene.start('GameScene', { mode: 'story', fromIntro: true });
        });
      }
    });
  }

  // =========================================================================
  // ROTEIRO COMPLETO DA VISUAL NOVEL (CONFORME SOLICITADO PELO USUÁRIO)
  // =========================================================================
  private buildIntroScript(): void {
    this.steps = [
      // -----------------------------------------------------------------------
      // CENA 1: Purgatório e a Mesa de Papelada (Intro 1)
      // -----------------------------------------------------------------------
      {
        bgKey: 'intro-1',
        speaker: 'nixy',
        text: 'Séculos de trabalho... séculos de tortura... Quanto mais tempo eu passo neste purgatório, mais trabalho aparece.'
      },
      {
        speaker: 'nixy',
        text: 'Isso...'
      },
      {
        speaker: 'narrator',
        text: '(Pausa.)',
        action: (s) => {
          s.cameras.main.zoomTo(1.03, 500);
        }
      },
      {
        speaker: 'nixy',
        text: 'É...'
      },
      {
        speaker: 'narrator',
        text: '(Pausa dramática.)',
        action: (s) => {
          s.cameras.main.zoomTo(1.06, 600);
        }
      },
      {
        speaker: 'nixy',
        text: 'UM INFERNO!!!',
        action: (s) => {
          SoundManager.getInstance().playRageBoom();
          s.cameras.main.shake(350, 0.02);
          s.cameras.main.flash(200, 255, 60, 0);
          s.cameras.main.zoomTo(1.0, 300);
        }
      },
      {
        speaker: 'nixy',
        text: '...Tecnicamente, é o purgatório. Mas, sinceramente, vai tomar no cu.'
      },
      {
        speaker: 'nixy',
        text: 'Felizmente, essa tortura está prestes a acabar.'
      },
      {
        speaker: 'nixy',
        text: 'Depois de exatos 999 anos, finalmente vou me livrar dessa papelada infernal. Daqui a cinco minutos, completo mil anos neste buraco e conquisto meu direito de ascender ao próximo estágio do julgamento.'
      },
      {
        speaker: 'nixy',
        text: 'Não faço a menor ideia de para onde vou.'
      },
      {
        speaker: 'nixy',
        text: 'Mas qualquer lugar é melhor do que esta merda.'
      },
      {
        speaker: 'narrator',
        text: '(Um demônio misterioso, de silhueta completamente negra e olhos vermelhos brilhantes, surge ao lado da mesa de Nixy.)',
        action: (s) => {
          s.cameras.main.flash(250, 180, 0, 50);
          s.switchBackground('intro-2', 800);
        }
      },

      // -----------------------------------------------------------------------
      // CENA 2: A Chegada do Chefe (Intro 2)
      // -----------------------------------------------------------------------
      {
        bgKey: 'intro-2',
        speaker: 'chefe',
        speakerName: 'Chefe',
        text: 'NIIIIXYYY!!!',
        action: (s) => {
          s.cameras.main.shake(200, 0.012);
        }
      },
      {
        speaker: 'nixy',
        text: '...'
      },
      {
        speaker: 'chefe',
        speakerName: 'Chefe',
        text: 'Como vai a minha demônia favorita?!'
      },
      {
        speaker: 'chefe',
        speakerName: 'Chefe',
        text: 'Muita papelada por aí? Hahaha! Essa é a minha garota!'
      },
      {
        speaker: 'chefe',
        speakerName: 'Chefe',
        text: 'Sério, não sei o que faríamos sem você. Sua produtividade é uma inspiração para toda a administração infernal!'
      },
      {
        speaker: 'nixy',
        text: 'Que honra. Vou mandar emoldurar meu próximo colapso nervoso.'
      },
      {
        speaker: 'chefe',
        speakerName: 'Chefe',
        text: 'Hahaha! Adoro esse seu senso de humor!'
      },
      {
        speaker: 'chefe',
        speakerName: 'Chefe',
        text: 'Ah! E não conta para a Karen, mas amanhã teremos carne de [CENSURADO], acompanhada de [CENSURADO] e uma pitada bem grande e grossa de [CENSURADO]!'
      },
      {
        speaker: 'chefe',
        speakerName: 'Chefe',
        text: 'Você não pode perder! Vai ser uma delícia!'
      },
      {
        speaker: 'nixy',
        text: 'Obrigada pelo convite...'
      },
      {
        speaker: 'narrator',
        text: '(Ela força um sorriso.)'
      },
      {
        speaker: 'nixy',
        text: 'É realmente difícil recusar uma proposta tão tentadora.'
      },
      {
        speaker: 'narrator',
        text: '(O sorriso desaparece.)'
      },
      {
        speaker: 'nixy',
        text: 'Mas, daqui a exatos...'
      },
      {
        speaker: 'narrator',
        text: '(Ela consulta o relógio.)'
      },
      {
        speaker: 'nixy',
        text: 'DOIS MINUTOS!',
        action: (s) => {
          s.cameras.main.shake(180, 0.012);
        }
      },
      {
        speaker: 'nixy',
        text: 'Dois minutos e completo minha carga horária de mil anos! Aí ganho o direito de ascender ao próximo andar do meu julgamento e nunca mais preciso olhar para a cara de nenhum de vocês!'
      },
      {
        speaker: 'nixy',
        text: 'Finalmente vou conhecer a liberdade...'
      },
      {
        speaker: 'chefe',
        speakerName: 'Chefe',
        text: 'Ohhh...'
      },
      {
        speaker: 'narrator',
        text: '(O demônio coça a nuca. Seus olhos vermelhos se estreitam.)'
      },
      {
        speaker: 'chefe',
        speakerName: 'Chefe',
        text: 'Hehehe... Então... Sobre isso...'
      },
      {
        speaker: 'nixy',
        text: '...'
      },
      {
        speaker: 'chefe',
        speakerName: 'Chefe',
        text: 'Acho que não vai rolar, gatinha.'
      },
      {
        speaker: 'nixy',
        text: '...'
      },
      {
        speaker: 'nixy',
        text: 'O QUÊ?!',
        action: (s) => {
          SoundManager.getInstance().playRageBoom();
          s.cameras.main.shake(250, 0.018);
          s.cameras.main.flash(180, 255, 255, 255);
        }
      },
      {
        speaker: 'nixy',
        text: 'COMO ASSIM NÃO VAI ROLAR?!'
      },
      {
        speaker: 'nixy',
        text: 'EU ESTOU A DOIS MINUTOS DE COMPLETAR MIL ANOS NESSA PORRA!',
        action: (s) => {
          s.cameras.main.shake(300, 0.02);
        }
      },
      {
        speaker: 'chefe',
        speakerName: 'Chefe',
        text: 'Calma, calma! Não precisa fazer escândalo. Você está assustando o pessoal do financeiro.'
      },
      {
        speaker: 'nixy',
        text: 'VOCÊS PROMETERAM! MIL ANOS! FOI O ACORDO!'
      },
      {
        speaker: 'chefe',
        speakerName: 'Chefe',
        text: 'E continua sendo! Tecnicamente...'
      },
      {
        speaker: 'nixy',
        text: 'TECNICAMENTE O QUÊ?!'
      },
      {
        speaker: 'chefe',
        speakerName: 'Chefe',
        text: 'Bom, Nixy, infelizmente, com o aumento do número de almas que estão chegando ao inferno, estamos enfrentando uma pequena escassez de mão de obra.'
      },
      {
        speaker: 'nixy',
        text: '...'
      },
      {
        speaker: 'chefe',
        speakerName: 'Chefe',
        text: 'Então precisamos manter nossos funcionários mais experientes por um pouquinho mais de tempo.'
      },
      {
        speaker: 'nixy',
        text: 'Funcionários?'
      },
      {
        speaker: 'chefe',
        speakerName: 'Chefe',
        text: 'Sim! Você não é uma funcionária qualquer. Você é um patrimônio da empresa!'
      },
      {
        speaker: 'nixy',
        text: 'Eu sou uma DEMÔNIA!'
      },
      {
        speaker: 'chefe',
        speakerName: 'Chefe',
        text: 'E que demônia produtiva!'
      },
      {
        speaker: 'nixy',
        text: 'EU PASSEI MIL ANOS CARIMBANDO DOCUMENTOS DE ALMAS CONDENADAS!'
      },
      {
        speaker: 'chefe',
        speakerName: 'Chefe',
        text: 'E nunca perdeu um prazo! Isso é que chamamos de excelência operacional!'
      },
      {
        speaker: 'nixy',
        text: 'EU JÁ PREENCHI A MESMA MERDA DE FORMULÁRIO MAIS VEZES DO QUE EXISTEM GRÃOS DE AREIA NO DESERTO!'
      },
      {
        speaker: 'chefe',
        speakerName: 'Chefe',
        text: 'E sempre com uma caligrafia impecável!'
      },
      {
        speaker: 'nixy',
        text: 'EU JÁ ASSINEI MINHA PRÓPRIA CERTIDÃO DE ÓBITO QUARENTA E SETE VEZES PORQUE O SISTEMA NÃO ACEITAVA A VERSÃO ANTERIOR!'
      },
      {
        speaker: 'chefe',
        speakerName: 'Chefe',
        text: 'A burocracia pode ser complicada mesmo. Por isso valorizamos tanto você!'
      },
      {
        speaker: 'nixy',
        text: 'EU VOU MATAR ALGUÉM.'
      },
      {
        speaker: 'chefe',
        speakerName: 'Chefe',
        text: 'Hahaha! Todos nós temos dias difíceis, e 500 anos é tranquilo demais!'
      },
      {
        speaker: 'nixy',
        text: 'QUINHENTOS ANOS EXTRAS?!',
        action: (s) => {
          s.cameras.main.shake(250, 0.02);
        }
      },
      {
        speaker: 'chefe',
        speakerName: 'Chefe',
        text: 'Só quinhentos! Passam num piscar de olhos!'
      },
      {
        speaker: 'nixy',
        text: 'QUINHENTOS ANOS NÃO PASSAM NUM PISCAR DE OLHOS!'
      },
      {
        speaker: 'chefe',
        speakerName: 'Chefe',
        text: 'Para quem trabalha com eternidade, isso é praticamente um estágio remunerado!'
      },
      {
        speaker: 'nixy',
        text: 'REMUNERADO COM O QUÊ?! EXPOSIÇÃO PROFISSIONAL?!'
      },
      {
        speaker: 'chefe',
        speakerName: 'Chefe',
        text: 'Olha, eu adoraria continuar essa conversa, mas tenho uma reunião importantíssima com o conselho administrativo.'
      },
      {
        speaker: 'narrator',
        text: '(O demônio confere um relógio que não possui ponteiros.)'
      },
      {
        speaker: 'chefe',
        speakerName: 'Chefe',
        text: 'Vamos discutir a redução de custos com os carrascos do nono círculo. Um assunto delicado.'
      },
      {
        speaker: 'nixy',
        text: 'Você vai embora?'
      },
      {
        speaker: 'chefe',
        speakerName: 'Chefe',
        text: 'Infelizmente! Mas não se preocupe. Seu trabalho é muito apreciado por mim!'
      },
      {
        speaker: 'narrator',
        text: '(Ele começa a desaparecer numa nuvem de fumaça negra.)',
        action: (s) => {
          SoundManager.getInstance().playSmokePoof();
          s.tweens.add({
            targets: s.rightBust,
            alpha: 0.3,
            scaleX: 0.8,
            duration: 500
          });
        }
      },
      {
        speaker: 'chefe',
        speakerName: 'Chefe',
        text: 'Continue dando o seu melhor, gatinha! O inferno conta com você!'
      },
      {
        speaker: 'nixy',
        text: '...'
      },
      {
        speaker: 'chefe',
        speakerName: 'Chefe',
        text: 'Beijos!'
      },
      {
        speaker: 'narrator',
        text: '(O demônio desaparece.)',
        action: (s) => {
          s.tweens.add({
            targets: s.rightBust,
            alpha: 0,
            duration: 350
          });
        }
      },
      {
        speaker: 'nixy',
        text: '...'
      },
      {
        speaker: 'nixy',
        text: 'He...'
      },
      {
        speaker: 'narrator',
        text: '(Ela aperta a caneta entre os dedos.)'
      },
      {
        speaker: 'nixy',
        text: 'Hehehe...'
      },
      {
        speaker: 'narrator',
        text: '(A caneta quebra.)',
        action: (s) => {
          SoundManager.getInstance().playPenSnap();
          s.cameras.main.shake(220, 0.02);
          s.cameras.main.flash(180, 255, 255, 255);
          s.switchBackground('intro-3', 700);
        }
      },

      // -----------------------------------------------------------------------
      // CENA 3: O Colapso Mental e a Risada Histérica (Intro 3)
      // -----------------------------------------------------------------------
      {
        bgKey: 'intro-3',
        speaker: 'nixy',
        text: 'HAHAHAHAHAHAHAHAHA!',
        action: (s) => {
          SoundManager.getInstance().playRageBoom();
          s.cameras.main.shake(500, 0.025);
        }
      },
      {
        speaker: 'narrator',
        text: '(Ela começa a rir descontroladamente. A mesa treme. As lâmpadas piscam. Uma pilha de documentos cai no chão.)',
        action: (s) => {
          s.triggerLightFlicker();
          s.cameras.main.shake(800, 0.015);
        }
      },
      {
        speaker: 'nixy',
        text: 'QUINHENTOS ANOS?!'
      },
      {
        speaker: 'nixy',
        text: 'QUINHENTOS ANOS DESTA PORRA?!',
        action: (s) => {
          s.cameras.main.shake(300, 0.02);
        }
      },
      {
        speaker: 'nixy',
        text: 'EU VOU PASSAR MAIS MEIO MILÊNIO CARIMBANDO PAPEL ENQUANTO AQUELE FILHO DA PUTA COME CARNE DE [CENSURADO] COM A PORRA DA KAREN?!',
        action: (s) => {
          SoundManager.getInstance().playRageBoom();
          s.cameras.main.shake(400, 0.025);
          s.cameras.main.flash(200, 255, 50, 0);
        }
      },
      {
        speaker: 'narrator',
        text: '(Silêncio.)',
        action: (s) => {
          s.switchBackground('intro-4', 900);
        }
      },
      {
        speaker: 'nixy',
        text: '...'
      },

      // -----------------------------------------------------------------------
      // CENA 4: A Decisão da Rebelião (Intro 4)
      // -----------------------------------------------------------------------
      {
        bgKey: 'intro-4',
        speaker: 'narrator',
        text: '(Ela olha para a pilha de documentos sobre a mesa.)'
      },
      {
        speaker: 'nixy',
        text: 'Sabe de uma coisa?'
      },
      {
        speaker: 'narrator',
        text: '(Nixy se levanta lentamente.)'
      },
      {
        speaker: 'nixy',
        text: 'Eu desisto.'
      },
      {
        speaker: 'narrator',
        text: '(Ela pega um documento, amassa e joga para o alto.)',
        action: () => {
          SoundManager.getInstance().playPaperRustle();
        }
      },
      {
        speaker: 'nixy',
        text: 'Desisto da empresa.'
      },
      {
        speaker: 'narrator',
        text: '(Pega outro.)',
        action: () => {
          SoundManager.getInstance().playPaperRustle();
        }
      },
      {
        speaker: 'nixy',
        text: 'Desisto do contrato.'
      },
      {
        speaker: 'narrator',
        text: '(Pega a pilha inteira.)',
        action: (s) => {
          s.switchBackground('intro-5', 600);
        }
      },

      // -----------------------------------------------------------------------
      // CENA 5: A Fúria e a Tempestade de Papéis (Intro 5)
      // -----------------------------------------------------------------------
      {
        bgKey: 'intro-5',
        speaker: 'nixy',
        text: 'DESISTO DESTE EMPREGO DE MERDA!',
        action: (s) => {
          SoundManager.getInstance().playRageBoom();
          s.cameras.main.shake(400, 0.03);
          s.cameras.main.flash(250, 255, 200, 100);
        }
      },
      {
        speaker: 'narrator',
        text: '(Ela arremessa todos os documentos para o alto. As folhas flutuam pela sala como uma tempestade branca.)',
        action: (s) => {
          s.spawnPaperStorm();
        }
      },
      {
        speaker: 'nixy',
        text: 'QUEREM MÃO DE OBRA?!'
      },
      {
        speaker: 'nixy',
        text: 'CONTRATEM OUTRA DESGRAÇADA!'
      },
      {
        speaker: 'narrator',
        text: '(Ela chuta a mesa. Os documentos e o tinteiro voam para todos os lados.)',
        action: (s) => {
          SoundManager.getInstance().playTableKick();
          s.cameras.main.shake(500, 0.035);
          s.cameras.main.flash(300, 255, 0, 50);
          s.switchBackground('intro-6', 600);
        }
      },

      // -----------------------------------------------------------------------
      // CENA 6: O Ultimato Final (Intro 6)
      // -----------------------------------------------------------------------
      {
        bgKey: 'intro-6',
        speaker: 'nixy',
        text: 'QUEREM QUE EU FIQUE MAIS QUINHENTOS ANOS?!',
        action: (s) => {
          s.cameras.main.shake(300, 0.02);
        }
      },
      {
        speaker: 'nixy',
        text: 'ENTÃO VÃO TER QUE ME OBRIGAR!',
        action: (s) => {
          SoundManager.getInstance().playRageBoom();
          s.cameras.main.shake(600, 0.04);
          s.cameras.main.flash(400, 255, 60, 0);
        }
      }
    ];
  }
}
