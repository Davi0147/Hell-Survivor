import Phaser from 'phaser';
import { SoundManager } from '../systems/SoundManager';
import { enableCensoredTextHighlight } from '../systems/TextHighlight';
import { GamepadManager } from '../systems/GamepadManager';
import { MetaProgressManager } from '../systems/MetaProgressManager';

interface DialogueStep {
  bgKey: string;
  speaker: 'nixy' | 'rosalin' | 'azazel' | 'narrator';
  speakerName: string;
  text: string;
  action?: (scene: Chapter1EndScene) => void;
}

export class Chapter1EndScene extends Phaser.Scene {
  private chapter: number = 1;
  private runStats: { kills: number; level: number; timeSec: number; soulsEarned?: number } = {
    kills: 0,
    level: 1,
    timeSec: 0,
    soulsEarned: 0
  };

  // Camadas de fundo com suporte a transição suave (Crossfade)
  private currentBgKey: string = 'endchap1-1';
  private bgImageA!: Phaser.GameObjects.Image;
  private bgImageB!: Phaser.GameObjects.Image;
  private isBgAActive: boolean = true;

  // Bustos dos Personagens (Padrão Visual Novel idêntico à Intro)
  private leftBust!: Phaser.GameObjects.Image;
  private rightBust!: Phaser.GameObjects.Image;
  private readonly BUST_W = 430;
  private readonly BUST_H = 430;
  private readonly BUST_LEFT_X = 210;
  private readonly BUST_RIGHT_X = 1070;

  // Efeitos de Tela e Câmera
  private blackOverlay!: Phaser.GameObjects.Rectangle;
  private slashGraphics!: Phaser.GameObjects.Graphics;
  private cutPromptText!: Phaser.GameObjects.Text;
  private skipBtnContainer!: Phaser.GameObjects.Container;
  private skipTxt!: Phaser.GameObjects.Text;

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
  private steps: DialogueStep[] = [];
  private currentStepIndex: number = 0;
  private isTyping: boolean = false;
  private fullText: string = '';
  private displayedText: string = '';
  private typeTimer?: Phaser.Time.TimerEvent;
  private isEnding: boolean = false;
  private isSlashCutPlaying: boolean = false;
  private isWaitingAfterCut: boolean = false;
  private hasSlashExecuted: boolean = false;
  private lastAdvanceTime: number = 0;
  private currentControlScheme: 'keyboard' | 'gamepad' | 'touch' = 'keyboard';

  // Tela de Vitória Pós-Cena (Sem fundo, alinhada à direita)
  private victoryContainer?: Phaser.GameObjects.Container;
  private isVictoryButtonsReady: boolean = false;
  private victorySelectedBtnIndex: number = 1;
  private victoryButtons: { render: (sel: boolean) => void; onClick: () => void }[] = [];

  constructor() {
    super('Chapter1EndScene');
  }

  init(data: { runStats?: { kills: number; level: number; timeSec: number; soulsEarned?: number }; chapter?: number }): void {
    this.chapter = data?.chapter ?? 1;
    if (data && data.runStats) {
      this.runStats = data.runStats;
    }
    this.currentStepIndex = 0;
    this.isEnding = false;
    this.isSlashCutPlaying = false;
    this.isWaitingAfterCut = false;
    this.hasSlashExecuted = false;
    this.isTyping = false;
    this.currentBgKey = 'endchap1-1';
    this.isBgAActive = true;
    this.isVictoryButtonsReady = false;
    this.victoryButtons = [];
  }

  create(): void {
    const { width, height } = this.scale;
    const pixelFont = "'Silkscreen', 'Press Start 2P', monospace";

    SoundManager.getInstance().setScene(this);
    SoundManager.getInstance().stopMusic(1000);
    // Toca a trilha assombrosa bem baixinha de fundo com fade-in suave em loop
    SoundManager.getInstance().playSpookyMusic(2500);

    // 1. Camadas de Fundo (A e B) para transições sem bordas pretas
    this.bgImageA = this.add.image(width / 2, height / 2, 'endchap1-1').setDepth(0);
    this.fitBackground(this.bgImageA);

    this.bgImageB = this.add.image(width / 2, height / 2, 'endchap1-1').setDepth(1).setAlpha(0);
    this.fitBackground(this.bgImageB);

    // 2. Bustos dos Personagens ao lado do balão (Padrão Visual Novel igual à Intro)
    this.leftBust = this.add.image(this.BUST_LEFT_X, height + 10, 'chat-nixy-damage');
    this.leftBust.setOrigin(0.5, 1.0);
    this.leftBust.setDisplaySize(this.BUST_W, this.BUST_H);
    this.leftBust.setDepth(30);
    this.leftBust.setAlpha(0);

    const rightPortraitKey = this.chapter === 2 ? 'chat-azazel' : 'chat-rosalin-defeated';
    this.rightBust = this.add.image(this.BUST_RIGHT_X, height + 10, rightPortraitKey);
    this.rightBust.setOrigin(0.5, 1.0);
    this.rightBust.setDisplaySize(this.BUST_W, this.BUST_H);
    this.rightBust.setDepth(30);
    this.rightBust.setAlpha(0);

    // 3. Gráficos de Corte da Execução
    this.slashGraphics = this.add.graphics().setDepth(45);

    // 4. Overlay preto para escurecimentos e transições
    this.blackOverlay = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0);
    this.blackOverlay.setDepth(40);

    // Texto de prompt no escuro após o corte
    this.cutPromptText = this.add.text(width / 2, height - 70, 'ESPAÇO P/ CONTINUAR ▶', {
      fontFamily: pixelFont,
      fontSize: '13px',
      fontStyle: 'bold',
      color: '#ffd60a',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5).setDepth(46).setVisible(false);

    this.tweens.add({
      targets: this.cutPromptText,
      alpha: 0.35,
      duration: 550,
      yoyo: true,
      repeat: -1
    });

    // 5. Caixa de Diálogo Visual Novel Persona 5
    const boxX = (width - this.BOX_W) / 2;
    const boxY = height - this.BOX_H - 24;

    this.boxContainer = this.add.container(boxX, boxY).setDepth(50);

    this.boxGraphics = this.add.graphics();
    this.boxContainer.add(this.boxGraphics);

    this.nameplateGraphics = this.add.graphics();
    this.boxContainer.add(this.nameplateGraphics);

    this.nameText = this.add.text(35, -22, 'NIXY', {
      fontFamily: pixelFont,
      fontSize: '16px',
      fontStyle: 'bold',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0, 0);
    this.boxContainer.add(this.nameText);

    this.dialogueText = this.add.text(35, 24, '', {
      fontFamily: pixelFont,
      fontSize: '17px',
      color: '#f8f9fa',
      stroke: '#0a0104',
      strokeThickness: 3,
      wordWrap: { width: this.BOX_W - 75, useAdvancedWrap: true },
      lineSpacing: 6
    });
    this.boxContainer.add(this.dialogueText);

    this.promptText = this.add.text(this.BOX_W - 25, this.BOX_H - 18, 'ESPAÇO ▶', {
      fontFamily: pixelFont,
      fontSize: '11px',
      color: '#f3d17a',
      stroke: '#000000',
      strokeThickness: 2
    }).setOrigin(1, 0.5);
    this.boxContainer.add(this.promptText);

    this.tweens.add({
      targets: this.promptText,
      alpha: 0.3,
      duration: 500,
      yoyo: true,
      repeat: -1
    });

    // 6. Botão de Pular Cena
    this.setupSkipButton();

    // 7. Configurar Roteiro da Cena e Paginação Automática Anti-Vazamento
    this.setupStorySteps();
    this.paginateStorySteps();

    // 8. Inputs
    this.setupInputs();

    // Iniciar Primeiro Diálogo com Fade-in
    this.blackOverlay.setAlpha(1);
    this.tweens.add({
      targets: this.blackOverlay,
      alpha: 0,
      duration: 700,
      ease: 'Power2',
      onComplete: () => {
        this.startStep(0);
      }
    });
  }

  /**
   * Garante que a imagem preencha 100% da tela sem esticar e sem bordas pretas
   */
  private fitBackground(img: Phaser.GameObjects.Image): void {
    const { width, height } = this.scale;
    this.tweens.killTweensOf(img);
    const scale = Math.max(width / img.width, height / img.height);
    img.setScale(scale);
    img.setPosition(width / 2, height / 2);
  }

  /**
   * Dá o zoom cinematográfico na esquerda da Imagem 5 (onde a Nixy está)
   * aplicando na própria imagem para não distorcer a interface
   */
  private zoomBackgroundLeftOnNixy(duration: number = 1200): void {
    const { width, height } = this.scale;
    const activeBg = this.isBgAActive ? this.bgImageA : this.bgImageB;
    this.tweens.killTweensOf(activeBg);

    const baseScale = Math.max(width / activeBg.width, height / activeBg.height);
    const targetScale = baseScale * 1.28;
    const targetX = width / 2 + 165;
    const targetY = height / 2 - 10;

    if (duration <= 0) {
      activeBg.setScale(targetScale);
      activeBg.setPosition(targetX, targetY);
      return;
    }

    this.tweens.add({
      targets: activeBg,
      scaleX: targetScale,
      scaleY: targetScale,
      x: targetX,
      y: targetY,
      duration,
      ease: 'Cubic.easeOut'
    });
  }

  private setupSkipButton(): void {
    const { width } = this.scale;
    const pixelFont = "'Silkscreen', 'Press Start 2P', monospace";

    this.skipBtnContainer = this.add.container(width - 120, 36).setDepth(60);

    const bg = this.add.graphics();
    bg.fillStyle(0x0f0308, 0.85);
    bg.fillRoundedRect(-85, -16, 170, 32, 6);
    bg.lineStyle(1.5, 0xff0055, 0.8);
    bg.strokeRoundedRect(-85, -16, 170, 32, 6);
    this.skipBtnContainer.add(bg);

    this.skipTxt = this.add.text(0, 0, '[ESC] PULAR CENA', {
      fontFamily: pixelFont,
      fontSize: '10px',
      color: '#ffd8a8',
      stroke: '#000000',
      strokeThickness: 2
    }).setOrigin(0.5);
    this.skipBtnContainer.add(this.skipTxt);

    const hit = this.add.zone(0, 0, 170, 32);
    hit.setInteractive({ useHandCursor: true });
    this.skipBtnContainer.add(hit);

    hit.on('pointerover', () => {
      bg.clear();
      bg.fillStyle(0x280410, 0.95);
      bg.fillRoundedRect(-85, -16, 170, 32, 6);
      bg.lineStyle(2, 0xff2a55, 1);
      bg.strokeRoundedRect(-85, -16, 170, 32, 6);
      this.skipTxt.setColor('#ffffff');
    });

    hit.on('pointerout', () => {
      bg.clear();
      bg.fillStyle(0x0f0308, 0.85);
      bg.fillRoundedRect(-85, -16, 170, 32, 6);
      bg.lineStyle(1.5, 0xff0055, 0.8);
      bg.strokeRoundedRect(-85, -16, 170, 32, 6);
      this.skipTxt.setColor('#ffd8a8');
    });

    hit.on('pointerdown', () => {
      this.skipScene();
    });
  }

  private updateControlPrompts(): void {
    if (this.currentControlScheme === 'gamepad') {
      this.promptText.setText('(A) AVANÇAR ▶');
      this.skipTxt.setText('[(B)] PULAR CENA');
      this.cutPromptText.setText('(A) AVANÇAR ▶');
    } else if (this.currentControlScheme === 'touch') {
      this.promptText.setText('TOQUE P/ AVANÇAR ▶');
      this.skipTxt.setText('PULAR CENA');
      this.cutPromptText.setText('TOQUE P/ AVANÇAR ▶');
    } else {
      this.promptText.setText('ESPAÇO ▶');
      this.skipTxt.setText('[ESC] PULAR CENA');
      this.cutPromptText.setText('ESPAÇO P/ CONTINUAR ▶');
    }
  }

  private setupInputs(): void {
    // Teclado
    this.input.keyboard?.on('keydown', (event: KeyboardEvent) => {
      if (this.currentControlScheme !== 'keyboard') {
        this.currentControlScheme = 'keyboard';
        this.updateControlPrompts();
      }

      if (this.isEnding) {
        if (this.isVictoryButtonsReady && this.victoryButtons.length > 0) {
          if (event.code === 'ArrowLeft' || event.code === 'KeyA' || event.code === 'ArrowUp' || event.code === 'KeyW') {
            this.victorySelectedBtnIndex = 0;
            SoundManager.getInstance().playMenuHover();
            this.renderVictorySelection();
          } else if (event.code === 'ArrowRight' || event.code === 'KeyD' || event.code === 'ArrowDown' || event.code === 'KeyS') {
            this.victorySelectedBtnIndex = 1;
            SoundManager.getInstance().playMenuHover();
            this.renderVictorySelection();
          } else if (event.code === 'Space' || event.code === 'Enter') {
            this.victoryButtons[this.victorySelectedBtnIndex]?.onClick();
          }
        }
        return;
      }

      if (this.isSlashCutPlaying) return;

      if (event.code === 'Escape') {
        this.skipScene();
        return;
      }

      if (['Space', 'Enter', 'KeyE', 'KeyZ'].includes(event.code)) {
        this.handleAdvance();
      }
    });

    // Touch / Clique
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (pointer.wasTouch && this.currentControlScheme !== 'touch') {
        this.currentControlScheme = 'touch';
        this.updateControlPrompts();
      }

      if (this.isEnding || this.isSlashCutPlaying) return;

      // Se clicar no canto superior direito do botão pular, deixa o evento do botão lidar
      if (pointer.x > this.scale.width - 210 && pointer.y < 70) {
        return;
      }

      this.handleAdvance();
    });
  }

  update(): void {
    const pad = GamepadManager.getInstance().getActivePad(this);
    const isTouch = Boolean(this.sys.game.device.input.touch && !this.sys.game.device.os.desktop);

    if (pad && pad.connected) {
      let btnActive = false;
      for (let i = 0; i < pad.buttons.length; i++) {
        if (pad.buttons[i] && pad.buttons[i].pressed) {
          btnActive = true;
          break;
        }
      }
      if (btnActive || Math.abs(pad.leftStick.x) > 0.15 || Math.abs(pad.leftStick.y) > 0.15) {
        if (this.currentControlScheme !== 'gamepad') {
          this.currentControlScheme = 'gamepad';
          this.updateControlPrompts();
        }
      }
    } else if (isTouch && this.currentControlScheme !== 'touch') {
      this.currentControlScheme = 'touch';
      this.updateControlPrompts();
    }

    const nav = GamepadManager.getInstance().getMenuNavigation(this);
    if (!this.isEnding && !this.isSlashCutPlaying) {
      if (nav.confirm) {
        this.handleAdvance();
      } else if (nav.cancel) {
        this.skipScene();
      }
    }

    // Se as opções de vitória estiverem prontas, controla pelo gamepad
    if (this.isVictoryButtonsReady && this.victoryButtons.length > 0) {
      if (nav.left || nav.up) {
        this.victorySelectedBtnIndex = 0;
        SoundManager.getInstance().playMenuHover();
        this.renderVictorySelection();
      } else if (nav.right || nav.down) {
        this.victorySelectedBtnIndex = 1;
        SoundManager.getInstance().playMenuHover();
        this.renderVictorySelection();
      } else if (nav.confirm) {
        this.victoryButtons[this.victorySelectedBtnIndex]?.onClick();
      }
    }
  }

  private renderVictorySelection(): void {
    this.victoryButtons.forEach((btn, idx) => {
      btn.render(idx === this.victorySelectedBtnIndex);
    });
  }

  private setupStorySteps(): void {
    if (this.chapter === 2) {
      this.steps = [
        {
          bgKey: 'endchap1-3',
          speaker: 'narrator',
          speakerName: '',
          text: '*(Os cristais despedaçados ecoam pelo vazio enquanto o domínio de sombras de Azazel se desfaz em cinzas. O senhor da mente cai de joelhos diante de Nixy.)*'
        },
        {
          bgKey: 'endchap1-3',
          speaker: 'azazel',
          speakerName: 'AZAZEL',
          text: 'Impossível... Minha escuridão... Meus espelhos de sangue... Como uma simples alma condenada pôde rasgar o meu mundo?!'
        },
        {
          bgKey: 'endchap1-3',
          speaker: 'nixy',
          speakerName: 'NIXY',
          text: 'Simples, seu mágico de circo: quem trabalha mil anos no escuro daquele escritório não tem medo de luz apagada!'
        },
        {
          bgKey: 'endchap1-3',
          speaker: 'azazel',
          speakerName: 'AZAZEL',
          text: 'Você não faz ideia do que está despertando nos círculos superiores, Nixy... A minha queda é apenas o começo do seu tormento!'
        },
        {
          bgKey: 'endchap1-3',
          speaker: 'nixy',
          speakerName: 'NIXY',
          text: 'Ótimo. Manda lembranças pros seus chefes quando chegar no fundo do abismo!'
        },
        {
          bgKey: 'endchap1-4',
          speaker: 'narrator',
          speakerName: '',
          text: '*(Com um golpe implacável, Nixy dissipa a essência sombria de Azazel e absorve o poder do Segundo Círculo.)*'
        },
        {
          bgKey: 'endchap1-5',
          speaker: 'nixy',
          speakerName: 'NIXY',
          text: 'Dois já foram. E a minha lista de demissões ainda tá longe de acabar.',
          action: (scene) => {
            scene.zoomBackgroundLeftOnNixy(1200);
          }
        }
      ];
      return;
    }

    this.steps = [
      // ==================== IMAGEM 1 ====================
      {
        bgKey: 'endchap1-1',
        speaker: 'narrator',
        speakerName: '',
        text: '*(Rosalin cai de joelhos. Suas asas estão feridas, sua respiração é irregular e o brilho de seus olhos começa a enfraquecer. Nixy se aproxima, limpando o sangue das mãos.)*'
      },
      {
        bgKey: 'endchap1-1',
        speaker: 'rosalin',
        speakerName: 'ROSALIN',
        text: 'Ah... Como assim?\nNão... Não pode ser...'
      },
      {
        bgKey: 'endchap1-1',
        speaker: 'nixy',
        speakerName: 'NIXY',
        text: 'Parece que você não é lá essas coisas, né, sua cachorra?'
      },
      {
        bgKey: 'endchap1-1',
        speaker: 'rosalin',
        speakerName: 'ROSALIN',
        text: 'Sua...'
      },
      {
        bgKey: 'endchap1-1',
        speaker: 'nixy',
        speakerName: 'NIXY',
        text: 'Na-na-ni-na-não!\n*(Nixy ergue um dedo diante do rosto dela.)*'
      },
      {
        bgKey: 'endchap1-1',
        speaker: 'nixy',
        speakerName: 'NIXY',
        text: 'Você não está em posição de dizer absolutamente PORRA NENHUMA! Hahahaha!\n*(Ela ri por alguns segundos. Então, seu sorriso começa a desaparecer.)*',
        action: () => {
          this.cameras.main.shake(200, 0.008);
        }
      },

      // ==================== IMAGEM 2 ====================
      {
        bgKey: 'endchap1-2',
        speaker: 'nixy',
        speakerName: 'NIXY',
        text: 'Sabe o que é engraçado?\nDepois de tantos séculos aguentando tudo calada...'
      },
      {
        bgKey: 'endchap1-2',
        speaker: 'nixy',
        speakerName: 'NIXY',
        text: 'Todas as humilhações. Todas as ordens. Todas as noites em claro preenchendo documentos de almas que eu nem sequer conhecia...'
      },
      {
        bgKey: 'endchap1-2',
        speaker: 'nixy',
        speakerName: 'NIXY',
        text: 'Enquanto você saía mais cedo para VIÇAR, seduzindo meio inferno e abanando essa bunda por aí...\nEU ficava com todo o trabalho pesado!'
      },
      {
        bgKey: 'endchap1-2',
        speaker: 'nixy',
        speakerName: 'NIXY',
        text: '*(Nixy aponta para ela, com a voz cada vez mais carregada.)*\nVocê sabe o quanto eu me sacrifiquei por aquele lugar?!\nSABE?!',
        action: () => {
          this.cameras.main.shake(250, 0.012);
          SoundManager.getInstance().playRageBoom();
        }
      },
      {
        bgKey: 'endchap1-2',
        speaker: 'nixy',
        speakerName: 'NIXY',
        text: '*(Silêncio.)*\nNão...\nÉ CLARO QUE NÃO!'
      },
      {
        bgKey: 'endchap1-2',
        speaker: 'nixy',
        speakerName: 'NIXY',
        text: 'Você nunca precisou saber! Nunca precisou se importar! Afinal, por que se preocupar com os outros quando o próprio umbigo é a coisa mais interessante do universo?!'
      },
      {
        bgKey: 'endchap1-2',
        speaker: 'rosalin',
        speakerName: 'ROSALIN',
        text: 'Nixy...'
      },
      {
        bgKey: 'endchap1-2',
        speaker: 'nixy',
        speakerName: 'NIXY',
        text: 'NÃO! Agora você vai me ouvir!'
      },
      {
        bgKey: 'endchap1-2',
        speaker: 'nixy',
        speakerName: 'NIXY',
        text: 'Passei séculos acreditando que, se trabalhasse duro o suficiente, se obedecesse a todas as regras imbecis e fizesse tudo exatamente como mandavam, um dia finalmente teria o direito de viver a minha própria vida!'
      },
      {
        bgKey: 'endchap1-2',
        speaker: 'nixy',
        speakerName: 'NIXY',
        text: 'E sabe o que eu ganhei?\nMAIS QUINHENTOS ANOS!\n*(Ela solta uma risada curta, amarga.)*'
      },
      {
        bgKey: 'endchap1-2',
        speaker: 'nixy',
        speakerName: 'NIXY',
        text: 'Hahaha... Meu Deus, eu sou uma idiota.\nMil anos da minha vida... jogados fora porque acreditei na palavra de um bando de demônios engravatados!'
      },
      {
        bgKey: 'endchap1-2',
        speaker: 'rosalin',
        speakerName: 'ROSALIN',
        text: 'Nixy, escuta. Se você realmente acha que vai conseguir sair daqui sozinha...\nVocê está muito enganada.'
      },
      {
        bgKey: 'endchap1-2',
        speaker: 'rosalin',
        speakerName: 'ROSALIN',
        text: 'Você não faz ideia do quanto eles são poderosos. O que aconteceu hoje não foi nada comparado ao que te espera quando descobrirem o que você planeja.'
      },
      {
        bgKey: 'endchap1-2',
        speaker: 'narrator',
        speakerName: '',
        text: '*(Rosalin tenta se levantar, mas suas pernas cedem.)*'
      },
      {
        bgKey: 'endchap1-2',
        speaker: 'rosalin',
        speakerName: 'ROSALIN',
        text: 'Por favor... Volte para lá. Podemos esquecer o que aconteceu aqui. Eu posso tentar conversar com eles, conseguir que reduzam seu tempo aqui...\nAcredite em mim, eu posso ajudar você...'
      },
      {
        bgKey: 'endchap1-2',
        speaker: 'nixy',
        speakerName: 'NIXY',
        text: 'CALA A BOCA!\n*(A voz de Nixy ecoa no ambiente. Rosalin se encolhe.)*',
        action: () => {
          this.cameras.main.shake(300, 0.015);
          SoundManager.getInstance().playRageBoom();
        }
      },
      {
        bgKey: 'endchap1-2',
        speaker: 'nixy',
        speakerName: 'NIXY',
        text: 'EU JÁ CANSEI DESSE PAPINHO DE PUTA!\nCansei de ouvir o que posso ou não posso fazer! Cansei de receber ordens! Cansei de gente que nunca esteve no meu lugar tentando decidir o que é melhor para mim!'
      },
      {
        bgKey: 'endchap1-2',
        speaker: 'nixy',
        speakerName: 'NIXY',
        text: 'VOCÊ NÃO SABE O QUE É MELHOR PRA MIM!\nNINGUÉM SABE!'
      },
      {
        bgKey: 'endchap1-2',
        speaker: 'narrator',
        speakerName: '',
        text: '*(Nixy respira fundo. Seus punhos tremem, mas ela não desvia o olhar.)*'
      },
      {
        bgKey: 'endchap1-2',
        speaker: 'nixy',
        speakerName: 'NIXY',
        text: 'Passei mil anos vivendo a vida que vocês escolheram para mim.\nMil anos obedecendo. Mil anos esperando. Mil anos acreditando que, se fosse uma boa funcionária, alguém finalmente cumpriria a porra da promessa!'
      },
      {
        bgKey: 'endchap1-2',
        speaker: 'narrator',
        speakerName: '',
        text: '*(Ela se vira e começa a caminhar.)*'
      },

      // ==================== IMAGEM 3 ====================
      {
        bgKey: 'endchap1-3',
        speaker: 'nixy',
        speakerName: 'NIXY',
        text: 'Mas acabou.\nA partir de agora, eu faço as minhas próprias regras.'
      },
      {
        bgKey: 'endchap1-3',
        speaker: 'nixy',
        speakerName: 'NIXY',
        text: 'Se o próximo andar está trancado, eu arrombo a porta.\nSe colocarem guardas no meu caminho, eu passo por cima deles.'
      },
      {
        bgKey: 'endchap1-3',
        speaker: 'nixy',
        speakerName: 'NIXY',
        text: 'Se os chefes desse inferno acham que podem me manter aqui para sempre...\n*(Nixy olha por cima do ombro, com um sorriso torto.)*'
      },
      {
        bgKey: 'endchap1-3',
        speaker: 'nixy',
        speakerName: 'NIXY',
        text: '...então eles que vão ter quinhentos anos de atraso para compensar.\nE eu pretendo cobrar cada segundo.'
      },
      {
        bgKey: 'endchap1-3',
        speaker: 'rosalin',
        speakerName: 'ROSALIN',
        text: 'Nixy, espere!'
      },

      // ==================== TRANSIÇÃO DE EXECUÇÃO -> IMAGEM 4 ====================
      {
        bgKey: 'endchap1-4',
        speaker: 'nixy',
        speakerName: 'NIXY',
        text: 'Argh, sangue de demônio é nojento...\nSerá que meu sangue é assim também?'
      },

      // ==================== IMAGEM 5 ====================
      {
        bgKey: 'endchap1-5',
        speaker: 'nixy',
        speakerName: 'NIXY',
        text: 'Cara isso foi tão irado!'
      },
      {
        bgKey: 'endchap1-5',
        speaker: 'nixy',
        speakerName: 'NIXY',
        text: 'Como eu sou foda!',
        action: () => {
          // (camera da um zoom mais pra esquerda da imagem onde ela ta)
          this.zoomBackgroundLeftOnNixy(1200);
        }
      },
      {
        bgKey: 'endchap1-5',
        speaker: 'nixy',
        speakerName: 'NIXY',
        text: '"...então eles que vão ter quinhentos anos de atraso para compensar."\nhahaha essa frase farmou aura demais...',
        action: () => {
          // (camera fica escura)
          this.tweens.add({
            targets: this.blackOverlay,
            alpha: 0.48,
            duration: 900,
            ease: 'Power2'
          });
        }
      }
    ];
  }

  /**
   * Garante que nenhuma palavra jamais vaze da caixa de diálogo:
   * mede a altura real renderizada e corta qualquer excesso para a próxima caixa de texto!
   */
  private paginateStorySteps(): void {
    const paginated: DialogueStep[] = [];
    const maxTextHeight = 84; // Limite seguro de 3 linhas antes do prompt ESPAÇO ▶

    for (const step of this.steps) {
      this.dialogueText.setText(step.text);
      if (this.dialogueText.height <= maxTextHeight) {
        paginated.push(step);
        continue;
      }

      const tokens = step.text.split(/(\s+)/);
      let currentChunk = '';
      let isFirstChunk = true;

      for (const token of tokens) {
        const candidate = currentChunk ? currentChunk + token : token.trimStart();
        if (!candidate) continue;

        this.dialogueText.setText(candidate);
        if (this.dialogueText.height > maxTextHeight && currentChunk.trim().length > 0) {
          paginated.push({
            ...step,
            text: currentChunk.trim(),
            action: isFirstChunk ? step.action : undefined
          });
          isFirstChunk = false;
          currentChunk = token.trimStart();
        } else {
          currentChunk = candidate;
        }
      }

      if (currentChunk.trim().length > 0) {
        paginated.push({
          ...step,
          text: currentChunk.trim(),
          action: isFirstChunk ? step.action : undefined
        });
      }
    }

    this.dialogueText.setText('');
    this.steps = paginated;
  }

  /**
   * Atualiza os bustos laterais seguindo o padrão Visual Novel da Intro
   */
  private updateBusts(speaker: 'nixy' | 'rosalin' | 'azazel' | 'narrator', bgKey: string): void {
    const { width, height } = this.scale;
    const isAfterSlash = this.hasSlashExecuted || bgKey === 'endchap1-4' || bgKey === 'endchap1-5';

    if (isAfterSlash) {
      // Após o corte de execução, o boss foi abatido; esconde o busto dele(a)
      this.tweens.killTweensOf(this.rightBust);
      this.rightBust.setAlpha(0);
    }

    if (speaker === 'nixy') {
      // Destaca Nixy na esquerda (usando o sprite Damage UI)
      this.leftBust.setTexture('chat-nixy-damage');
      this.leftBust.setDisplaySize(this.BUST_W, this.BUST_H);
      this.leftBust.clearTint();
      this.leftBust.setDepth(35);

      if (this.leftBust.alpha < 0.95) {
        this.tweens.killTweensOf(this.leftBust);
        this.leftBust.setPosition(80, height + 10);
        this.tweens.add({
          targets: this.leftBust,
          x: this.BUST_LEFT_X,
          alpha: 1,
          duration: 250,
          ease: 'Back.easeOut'
        });
      }

      // Diminui Boss se visível antes do corte
      if (!isAfterSlash && this.rightBust.alpha > 0) {
        this.rightBust.setTint(0x554455);
        this.rightBust.setDepth(30);
      }
    } else if ((speaker === 'rosalin' || speaker === 'azazel') && !isAfterSlash) {
      // Destaca Rosalin ou Azazel derrotado na direita
      this.rightBust.setTexture(speaker === 'azazel' ? 'chat-azazel' : 'chat-rosalin-defeated');
      this.rightBust.setDisplaySize(this.BUST_W, this.BUST_H);
      this.rightBust.clearTint();
      this.rightBust.setDepth(35);

      if (this.rightBust.alpha < 0.95) {
        this.tweens.killTweensOf(this.rightBust);
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
      // Narrador: ambos levemente atenuados
      if (this.leftBust.alpha > 0) this.leftBust.setTint(0x554455);
      if (!isAfterSlash && this.rightBust.alpha > 0) this.rightBust.setTint(0x554455);
    }
  }

  private startStep(index: number): void {
    if (index >= this.steps.length) {
      this.finishScene();
      return;
    }

    this.currentStepIndex = index;
    const step = this.steps[index];

    // Se estiver saindo da imagem 3 para a imagem 4, dispara o corte dramático de anime
    if (step.bgKey === 'endchap1-4' && this.currentBgKey === 'endchap1-3') {
      this.playSlashExecutionCut(() => {
        this.renderStepContent(step);
      });
      return;
    }

    // Troca de Fundo com Crossfade suave sem bordas vazias
    if (step.bgKey !== this.currentBgKey) {
      this.crossfadeBackground(step.bgKey);
    }

    this.renderStepContent(step);
  }

  private renderStepContent(step: DialogueStep): void {
    this.boxContainer.setVisible(true);
    this.drawSlantedBox(step.speaker);
    this.drawNameplate(step.speaker, step.speakerName);
    this.updateBusts(step.speaker, step.bgKey);

    if (step.speaker === 'narrator') {
      this.dialogueText.setColor('#ffd8a8');
      this.dialogueText.setFontStyle('italic');
    } else if (step.speaker === 'rosalin') {
      this.dialogueText.setColor('#ffccd5');
      this.dialogueText.setFontStyle('normal');
    } else if (step.speaker === 'azazel') {
      this.dialogueText.setColor('#e0aaff');
      this.dialogueText.setFontStyle('normal');
    } else {
      this.dialogueText.setColor('#ffffff');
      this.dialogueText.setFontStyle('normal');
    }

    // Voz característica do personagem
    SoundManager.getInstance().playDialogueVoice(step.speaker);

    // Efeito de Digitação com barulho de máquina de escrever em cada letra
    this.fullText = step.text;
    this.displayedText = '';
    this.dialogueText.setText('');
    this.isTyping = true;

    if (this.typeTimer) {
      this.typeTimer.remove();
    }

    let charIndex = 0;
    this.typeTimer = this.time.addEvent({
      delay: 20,
      repeat: this.fullText.length - 1,
      callback: () => {
        charIndex++;
        this.displayedText = this.fullText.substring(0, charIndex);
        this.dialogueText.setText(this.displayedText);
        enableCensoredTextHighlight(this.dialogueText);

        SoundManager.getInstance().playDialogueTypewriter(this.fullText[charIndex - 1]);

        if (charIndex >= this.fullText.length) {
          this.isTyping = false;
        }
      }
    });

    if (step.action) {
      step.action(this);
    }
  }

  /**
   * Transição dramática de anime: escurece a tela, passa a linha cortante com som de lâmina e trepidação,
   * permanece no escuro em suspense até o jogador apertar para avançar e revelar a próxima cena!
   */
  private playSlashExecutionCut(onContinueToNextScene: () => void): void {
    this.isSlashCutPlaying = true;
    this.hasSlashExecuted = true;
    this.boxContainer.setVisible(false);
    this.tweens.killTweensOf(this.leftBust);
    this.tweens.killTweensOf(this.rightBust);
    this.leftBust.setAlpha(0);
    this.rightBust.setAlpha(0);

    // 1. Tela escurece instantaneamente (Fade to Black)
    this.blackOverlay.setAlpha(1.0);

    // 2. Câmera treme com grande intensidade
    this.cameras.main.shake(450, 0.026);

    // 3. Som de corte metálico e sub-grave
    SoundManager.getInstance().playExecutionSlash();

    // 4. Linha branca e vermelha rasga a tela na escuridão
    const { width, height } = this.scale;
    this.slashGraphics.clear();

    const slashProgress = { t: 0 };
    this.tweens.add({
      targets: slashProgress,
      t: 1,
      duration: 180,
      ease: 'Power3.easeOut',
      onUpdate: () => {
        this.slashGraphics.clear();
        const startX = width * 0.85 - slashProgress.t * width * 0.7;
        const startY = height * 0.15 + slashProgress.t * height * 0.7;
        const len = 380;

        // Brilho exterior vermelho carmesim
        this.slashGraphics.lineStyle(9, 0xff0044, 0.85);
        this.slashGraphics.lineBetween(startX - len * 0.5, startY - len * 0.4, startX + len * 0.5, startY + len * 0.4);

        // Lâmina branca afiada central
        this.slashGraphics.lineStyle(3.5, 0xffffff, 1.0);
        this.slashGraphics.lineBetween(startX - len * 0.5, startY - len * 0.4, startX + len * 0.5, startY + len * 0.4);
      },
      onComplete: () => {
        this.slashGraphics.clear();

        // 5. Flash suave de sangue que logo se apaga
        const bloodFlash = this.add.rectangle(width / 2, height / 2, width, height, 0x660011, 0.65).setDepth(42);
        this.tweens.add({
          targets: bloodFlash,
          alpha: 0,
          duration: 300,
          onComplete: () => bloodFlash.destroy()
        });

        // 6. Atualiza o fundo por baixo da escuridão para a imagem 4 (com escala perfeita sem bordas vazias)
        this.crossfadeBackground('endchap1-4', 0);

        // 7. Permanece no escuro dramático e aguarda o jogador apertar para avançar!
        this.time.delayedCall(450, () => {
          this.isSlashCutPlaying = false;
          this.isWaitingAfterCut = true;
          this.cutPromptText.setVisible(true);

          // Função que será chamada quando o jogador apertar
          this.onCutConfirmed = () => {
            this.isWaitingAfterCut = false;
            this.cutPromptText.setVisible(false);

            // Abre a imagem 4 com transição suave da escuridão
            this.tweens.add({
              targets: this.blackOverlay,
              alpha: 0,
              duration: 650,
              ease: 'Power2',
              onComplete: () => {
                onContinueToNextScene();
              }
            });
          };
        });
      }
    });
  }

  private onCutConfirmed?: () => void;

  /**
   * Caixa Angular Estilo Persona 5 / Mangá (idêntica ao padrão de qualidade da Intro)
   */
  private drawSlantedBox(speaker: 'nixy' | 'rosalin' | 'azazel' | 'narrator'): void {
    const g = this.boxGraphics;
    g.clear();

    const boxW = this.BOX_W;
    const boxH = this.BOX_H;
    const isBoss = speaker === 'rosalin' || speaker === 'azazel';
    const slant = isBoss ? -12 : (speaker === 'narrator' ? 0 : 12);

    // 1. Sombra projetada preta
    g.fillStyle(0x000000, 0.78);
    g.beginPath();
    g.moveTo(6, 6 - slant);
    g.lineTo(boxW + 6, 6);
    g.lineTo(boxW + 6, boxH + 6);
    g.lineTo(6, boxH + 6 - slant);
    g.closePath();
    g.fill();

    // 2. Fundo interno
    let bgColor = 0x160207;
    let accentColor = 0xc59b27;
    if (speaker === 'rosalin') {
      bgColor = 0x180214;
      accentColor = 0xff0055;
    } else if (speaker === 'azazel') {
      bgColor = 0x11031c;
      accentColor = 0x9d4edd;
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

    // 3. Moldura Branca Estilo Persona 5
    g.lineStyle(3.0, 0xffffff, 1);
    g.stroke();

    // 4. Filete interno chanfrado dourado/carmesim
    g.lineStyle(1.5, accentColor, 0.85);
    g.beginPath();
    g.moveTo(4, -slant + 4);
    g.lineTo(boxW - 4, 4);
    g.lineTo(boxW - 4, boxH - 4);
    g.lineTo(4, boxH - 4 - slant);
    g.closePath();
    g.stroke();
  }

  /**
   * Plaqueta de Nome Recortada e Alinhada com Perfeição
   */
  private drawNameplate(speaker: 'nixy' | 'rosalin' | 'azazel' | 'narrator', name: string): void {
    const g = this.nameplateGraphics;
    g.clear();

    if (speaker === 'narrator' || !name) {
      this.nameText.setText('');
      return;
    }

    const isBoss = speaker === 'rosalin' || speaker === 'azazel';
    const nW = Math.max(160, name.length * 15 + 40);
    const nH = 34;
    const nX = isBoss ? this.BOX_W - nW - 25 : 25;
    const nY = -28;

    const plateColor = speaker === 'azazel' ? 0x3c096c : (speaker === 'rosalin' ? 0x6a0056 : 0x9d0208);
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
    this.nameText.setPosition(nX + 16, nY + 6);
  }

  private crossfadeBackground(newKey: string, duration: number = 700): void {
    this.currentBgKey = newKey;

    const activeBg = this.isBgAActive ? this.bgImageA : this.bgImageB;
    const nextBg = this.isBgAActive ? this.bgImageB : this.bgImageA;

    this.tweens.killTweensOf(nextBg);
    this.tweens.killTweensOf(activeBg);

    nextBg.setTexture(newKey);
    this.fitBackground(nextBg);
    nextBg.setAlpha(0);
    nextBg.setDepth(2);
    activeBg.setDepth(1);

    if (duration <= 0) {
      nextBg.setAlpha(1);
      activeBg.setAlpha(0);
      this.isBgAActive = !this.isBgAActive;
      return;
    }

    this.tweens.add({
      targets: nextBg,
      alpha: 1,
      duration,
      ease: 'Cubic.easeInOut',
      onComplete: () => {
        activeBg.setAlpha(0);
        this.isBgAActive = !this.isBgAActive;
      }
    });
  }

  private handleAdvance(): void {
    const now = Date.now();
    if (now - this.lastAdvanceTime < 180) return;
    this.lastAdvanceTime = now;

    // Se estiver aguardando após o corte na escuridão, confirma e revela a cena seguinte!
    if (this.isWaitingAfterCut && this.onCutConfirmed) {
      this.onCutConfirmed();
      this.onCutConfirmed = undefined;
      return;
    }

    // Se estiver digitando, completa a frase imediatamente
    if (this.isTyping) {
      if (this.typeTimer) this.typeTimer.remove();
      this.dialogueText.setText(this.fullText);
      enableCensoredTextHighlight(this.dialogueText);
      this.isTyping = false;
      return;
    }

    // Avança para o próximo passo
    this.startStep(this.currentStepIndex + 1);
  }

  private skipScene(): void {
    if (this.isEnding) return;
    this.finishScene();
  }

  private finishScene(): void {
    if (this.isEnding) return;
    this.isEnding = true;

    if (this.typeTimer) this.typeTimer.remove();
    this.boxContainer.setVisible(false);
    this.skipBtnContainer.setVisible(false);
    this.cutPromptText.setVisible(false);
    this.tweens.killTweensOf(this.leftBust);
    this.tweens.killTweensOf(this.rightBust);
    this.leftBust.setAlpha(0);
    this.rightBust.setAlpha(0);

    // Garante que o fundo final (endchap1-5 com zoom na Nixy à esquerda) esteja posicionado
    if (this.currentBgKey !== 'endchap1-5') {
      this.crossfadeBackground('endchap1-5', 0);
      this.zoomBackgroundLeftOnNixy(0);
    }

    // Grava progresso da partida
    const soulsEarned = MetaProgressManager.getInstance().finalizeRunSouls();
    MetaProgressManager.getInstance().recordRun(
      this.runStats.timeSec,
      this.runStats.kills,
      true
    );
    this.runStats.soulsEarned = soulsEarned;

    // Escurecimento leve atmosférico mantendo a Nixy visível à esquerda
    this.tweens.add({
      targets: this.blackOverlay,
      alpha: 0.45,
      duration: 450,
      onComplete: () => {
        this.showVictorySequence();
      }
    });
  }

  /**
   * Calcula a quantidade de estrelas (1 a 5) com base no tempo do Capítulo 1:
   * <= 7 min (420s): 5 estrelas | <= 8 min: 4 | <= 9 min: 3 | <= 10 min: 2 | > 10 min: 1
   */
  private calculateChapter1Stars(timeSec: number): number {
    if (timeSec <= 7 * 60) return 5;
    if (timeSec <= 8 * 60) return 4;
    if (timeSec <= 9 * 60) return 3;
    if (timeSec <= 10 * 60) return 2;
    return 1;
  }

  /**
   * Digita um texto letra por letra com som de máquina de escrever e chama onDone ao concluir
   */
  private typeTextLine(
    textObj: Phaser.GameObjects.Text,
    fullString: string,
    charDelayMs: number,
    onDone: () => void
  ): void {
    textObj.setText('');
    textObj.setVisible(true);
    let idx = 0;

    if (fullString.length === 0) {
      onDone();
      return;
    }

    this.time.addEvent({
      delay: charDelayMs,
      repeat: fullString.length - 1,
      callback: () => {
        idx++;
        textObj.setText(fullString.substring(0, idx));
        const ch = fullString[idx - 1];
        SoundManager.getInstance().playDialogueTypewriter(ch);

        if (idx >= fullString.length) {
          onDone();
        }
      }
    });
  }

  /**
   * Sequência de Conclusão do Capítulo 1 ou 2
   */
  private showVictorySequence(): void {
    const { width, height } = this.scale;
    const pixelFont = "'Silkscreen', 'Press Start 2P', monospace";

    this.victoryContainer = this.add.container(0, 0).setDepth(100);

    // Eixo alinhado à direita da tela (deixando o rosto da Nixy livre na esquerda)
    const rightCenterX = Math.round(width * 0.68); // ~870px em 1280px
    const titleY = 140;
    const chapterTitleText = this.chapter === 2 ? 'CAPÍTULO 2 CONCLUÍDO' : 'CAPÍTULO 1 CONCLUÍDO';

    // 1. TÍTULO: "CAPÍTULO X CONCLUÍDO" (Vem da frente e cola na tela com impacto!)
    const title = this.add.text(rightCenterX, titleY, chapterTitleText, {
      fontFamily: pixelFont,
      fontSize: '26px',
      fontStyle: 'bold',
      color: '#ffd60a',
      stroke: '#000000',
      strokeThickness: 6,
      shadow: {
        offsetX: 0,
        offsetY: 4,
        color: '#ff0044',
        blur: 12,
        stroke: true,
        fill: true
      }
    }).setOrigin(0.5);
    title.setScale(3.8);
    title.setAlpha(0);
    title.setAngle(-4);
    this.victoryContainer.add(title);

    this.tweens.add({
      targets: title,
      scaleX: 1.0,
      scaleY: 1.0,
      alpha: 1,
      angle: 0,
      duration: 240,
      ease: 'Cubic.easeIn',
      onComplete: () => {
        // Barulhinho de carimbo/batida na tela + tremor
        SoundManager.getInstance().playStampImpact();
        this.cameras.main.shake(230, 0.018);

        // Onda fantasma de impacto do título
        const titleGhost = this.add.text(rightCenterX, titleY, chapterTitleText, {
          fontFamily: pixelFont,
          fontSize: '26px',
          fontStyle: 'bold',
          color: '#ffffff',
          stroke: '#ffd60a',
          strokeThickness: 4
        }).setOrigin(0.5).setDepth(99);
        this.victoryContainer?.add(titleGhost);

        this.tweens.add({
          targets: titleGhost,
          scaleX: 1.35,
          scaleY: 1.35,
          alpha: 0,
          duration: 280,
          ease: 'Quad.easeOut',
          onComplete: () => titleGhost.destroy()
        });

        // 2. Após o impacto do título, digita as estatísticas uma por uma!
        this.time.delayedCall(320, () => {
          this.typeStatsSequentially(rightCenterX, pixelFont);
        });
      }
    });
  }

  private typeStatsSequentially(rightCenterX: number, pixelFont: string): void {
    if (!this.victoryContainer) return;

    const mins = Math.floor(this.runStats.timeSec / 60);
    const secs = this.runStats.timeSec % 60;
    const timeFormatted = `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
    const soulsEarned = this.runStats.soulsEarned ?? 0;

    const statLines = [
      { text: `NÍVEL: ${this.runStats.level}`, color: '#ffffff', y: 215 },
      { text: `MONSTROS DERROTADOS: ${this.runStats.kills}`, color: '#ffffff', y: 255 },
      { text: `ALMAS PEGAS: +${soulsEarned}`, color: '#c084fc', y: 295 },
      { text: `TEMPO: ${timeFormatted}`, color: '#00f5d4', y: 335 }
    ];

    const stepStat = (idx: number) => {
      if (!this.victoryContainer) return;
      if (idx >= statLines.length) {
        // Terminou os textos de status -> Inicia a batida das estrelas (STAR)!
        this.time.delayedCall(220, () => {
          this.slamStarsSequentially(rightCenterX, 405, pixelFont);
        });
        return;
      }

      const item = statLines[idx];
      const lineText = this.add.text(rightCenterX, item.y, '', {
        fontFamily: pixelFont,
        fontSize: '16px',
        fontStyle: 'bold',
        color: item.color,
        stroke: '#000000',
        strokeThickness: 5,
        shadow: {
          offsetX: 0,
          offsetY: 3,
          color: '#000000',
          blur: 6,
          stroke: true,
          fill: true
        }
      }).setOrigin(0.5);
      this.victoryContainer.add(lineText);

      this.typeTextLine(lineText, item.text, 24, () => {
        this.time.delayedCall(160, () => {
          stepStat(idx + 1);
        });
      });
    };

    stepStat(0);
  }

  private slamStarsSequentially(rightCenterX: number, starsY: number, pixelFont: string): void {
    if (!this.victoryContainer) return;

    const starsEarned = this.calculateChapter1Stars(this.runStats.timeSec);
    const spacing = 58;
    const startX = rightCenterX - ((starsEarned - 1) * spacing) / 2;

    const slamNextStar = (starIdx: number) => {
      if (!this.victoryContainer) return;
      if (starIdx >= starsEarned) {
        // Todas as estrelas bateram -> Exibe as opções finais sem fundo!
        this.time.delayedCall(320, () => {
          this.showFramelessVictoryOptions(rightCenterX, starsY + 115, pixelFont);
        });
        return;
      }

      const starX = startX + starIdx * spacing;

      // Sombra preta projetada da estrela para contraste
      const starShadow = this.add.image(starX + 3, starsY + 4, 'ui-star');
      starShadow.setDisplaySize(46, 46);
      starShadow.setTint(0x000000);
      starShadow.setAlpha(0);
      this.victoryContainer.add(starShadow);

      // Sprite oficial STAR
      const starSprite = this.add.image(starX, starsY, 'ui-star');
      starSprite.setTint(0xffd60a);
      starSprite.setScale(3.4);
      starSprite.setAlpha(0);
      starSprite.setAngle(-22);
      this.victoryContainer.add(starSprite);

      this.tweens.add({
        targets: starSprite,
        scaleX: 1.15,
        scaleY: 1.15,
        alpha: 1,
        angle: 0,
        duration: 170,
        ease: 'Cubic.easeIn',
        onComplete: () => {
          starShadow.setAlpha(0.75);

          // Som de batida da estrela + tremor na tela a cada estrela que bate!
          SoundManager.getInstance().playStarSlam(starIdx);
          this.cameras.main.shake(170, 0.012 + starIdx * 0.0025);

          // Efeito fantasma de impacto da estrela
          const burstStar = this.add.image(starX, starsY, 'ui-star');
          burstStar.setTint(0xffffff);
          burstStar.setScale(1.2);
          burstStar.setAlpha(0.9);
          this.victoryContainer?.add(burstStar);

          this.tweens.add({
            targets: burstStar,
            scaleX: 2.1,
            scaleY: 2.1,
            alpha: 0,
            duration: 240,
            ease: 'Quad.easeOut',
            onComplete: () => burstStar.destroy()
          });

          this.time.delayedCall(190, () => {
            slamNextStar(starIdx + 1);
          });
        }
      });
    };

    slamNextStar(0);
  }

  /**
   * Exibe as opções "PRÓXIMO CAPÍTULO" e "VOLTAR AO MENU" sem nenhuma forma de fundo,
   * digitadas com barulho de máquina de escrever!
   */
  private showFramelessVictoryOptions(rightCenterX: number, optionsY: number, pixelFont: string): void {
    if (!this.victoryContainer) return;

    // Aviso flutuante caso clique em Próximo Capítulo
    const toastNotice = this.add.text(rightCenterX, optionsY - 46, '', {
      fontFamily: pixelFont,
      fontSize: '11px',
      fontStyle: 'bold',
      color: '#ffd60a',
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0.5).setAlpha(0);
    this.victoryContainer.add(toastNotice);

    const btn1X = rightCenterX - 155;
    const btn2X = rightCenterX + 155;

    const btn1Text = this.add.text(btn1X, optionsY, '', {
      fontFamily: pixelFont,
      fontSize: '15px',
      fontStyle: 'bold',
      color: '#d8d8e8',
      stroke: '#000000',
      strokeThickness: 5,
      shadow: {
        offsetX: 0,
        offsetY: 3,
        color: '#000000',
        blur: 6,
        stroke: true,
        fill: true
      }
    }).setOrigin(0.5);
    this.victoryContainer.add(btn1Text);

    const btn2Text = this.add.text(btn2X, optionsY, '', {
      fontFamily: pixelFont,
      fontSize: '15px',
      fontStyle: 'bold',
      color: '#d8d8e8',
      stroke: '#000000',
      strokeThickness: 5,
      shadow: {
        offsetX: 0,
        offsetY: 3,
        color: '#000000',
        blur: 6,
        stroke: true,
        fill: true
      }
    }).setOrigin(0.5);
    this.victoryContainer.add(btn2Text);

    // Digita a opção 1 e depois a opção 2 com barulho de máquina de escrever
    this.typeTextLine(btn1Text, 'PRÓXIMO CAPÍTULO', 22, () => {
      this.typeTextLine(btn2Text, 'VOLTAR AO MENU', 22, () => {
        if (!this.victoryContainer) return;

        const renderBtn1 = (selected: boolean) => {
          btn1Text.setText(selected ? '▸ PRÓXIMO CAPÍTULO ◂' : 'PRÓXIMO CAPÍTULO');
          btn1Text.setColor(selected ? '#ffd60a' : '#c8c8d8');
          btn1Text.setScale(selected ? 1.10 : 1.0);
        };

        const renderBtn2 = (selected: boolean) => {
          btn2Text.setText(selected ? '▸ VOLTAR AO MENU ◂' : 'VOLTAR AO MENU');
          btn2Text.setColor(selected ? '#ff2a55' : '#c8c8d8');
          btn2Text.setScale(selected ? 1.10 : 1.0);
        };

        const handleNextChapter = () => {
          SoundManager.getInstance().playMenuClick();
          if (this.chapter === 1) {
            SoundManager.getInstance().stopMusic(600);
            this.cameras.main.fadeOut(500, 0, 0, 0);
            this.cameras.main.once('camerafadeoutcomplete', () => {
              this.scene.stop('Chapter1EndScene');
              this.scene.stop('UIScene');
              this.scene.start('GameScene', { mode: 'story', chapter: 2 });
            });
            return;
          }

          toastNotice.setText('');
          toastNotice.setAlpha(1);
          this.tweens.killTweensOf(toastNotice);
          this.typeTextLine(toastNotice, 'CAPÍTULO 3 EM BREVE NAS PRÓXIMAS ATUALIZAÇÕES!', 18, () => {
            this.tweens.add({
              targets: toastNotice,
              alpha: 0,
              delay: 2200,
              duration: 700
            });
          });
        };

        const handleReturnToMenu = () => {
          SoundManager.getInstance().playMenuClick();
          SoundManager.getInstance().stopMusic(800);
          this.cameras.main.fadeOut(500, 0, 0, 0);
          this.cameras.main.once('camerafadeoutcomplete', () => {
            this.scene.stop('Chapter1EndScene');
            this.scene.stop('GameScene');
            this.scene.stop('UIScene');
            this.scene.start('MenuScene');
          });
        };

        const btn1Zone = this.add.zone(btn1X, optionsY, 260, 44).setInteractive({ useHandCursor: true });
        this.victoryContainer.add(btn1Zone);
        btn1Zone.on('pointerover', () => {
          if (this.victorySelectedBtnIndex !== 0) {
            SoundManager.getInstance().playMenuHover();
          }
          this.victorySelectedBtnIndex = 0;
          this.renderVictorySelection();
        });
        btn1Zone.on('pointerdown', handleNextChapter);

        const btn2Zone = this.add.zone(btn2X, optionsY, 260, 44).setInteractive({ useHandCursor: true });
        this.victoryContainer.add(btn2Zone);
        btn2Zone.on('pointerover', () => {
          if (this.victorySelectedBtnIndex !== 1) {
            SoundManager.getInstance().playMenuHover();
          }
          this.victorySelectedBtnIndex = 1;
          this.renderVictorySelection();
        });
        btn2Zone.on('pointerdown', handleReturnToMenu);

        this.victoryButtons = [
          { render: renderBtn1, onClick: handleNextChapter },
          { render: renderBtn2, onClick: handleReturnToMenu }
        ];

        this.isVictoryButtonsReady = true;
        this.victorySelectedBtnIndex = 1;
        this.renderVictorySelection();
      });
    });
  }
}
