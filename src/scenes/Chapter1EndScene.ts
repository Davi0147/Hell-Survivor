import Phaser from 'phaser';
import { SoundManager } from '../systems/SoundManager';
import { enableCensoredTextHighlight } from '../systems/TextHighlight';
import { GamepadManager } from '../systems/GamepadManager';
import { MetaProgressManager } from '../systems/MetaProgressManager';

interface DialogueStep {
  bgKey: string;
  speaker: 'nixy' | 'succubus' | 'narrator';
  speakerName: string;
  text: string;
  action?: (scene: Chapter1EndScene) => void;
}

export class Chapter1EndScene extends Phaser.Scene {
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

  // Efeitos de Tela e Câmera
  private blackOverlay!: Phaser.GameObjects.Rectangle;
  private slashGraphics!: Phaser.GameObjects.Graphics;
  private skipBtnContainer!: Phaser.GameObjects.Container;
  private skipTxt!: Phaser.GameObjects.Text;

  // Caixa de Diálogo Estilo Persona 5 / Visual Novel
  private boxContainer!: Phaser.GameObjects.Container;
  private boxGraphics!: Phaser.GameObjects.Graphics;
  private nameplateGraphics!: Phaser.GameObjects.Graphics;
  private nameText!: Phaser.GameObjects.Text;
  private dialogueText!: Phaser.GameObjects.Text;
  private promptText!: Phaser.GameObjects.Text;

  private readonly BOX_W = 960;
  private readonly BOX_H = 150;

  // Controle de Sequência e Digitação
  private steps: DialogueStep[] = [];
  private currentStepIndex: number = 0;
  private isTyping: boolean = false;
  private fullText: string = '';
  private displayedText: string = '';
  private typeTimer?: Phaser.Time.TimerEvent;
  private isEnding: boolean = false;
  private isSlashCutPlaying: boolean = false;
  private lastAdvanceTime: number = 0;
  private currentControlScheme: 'keyboard' | 'gamepad' | 'touch' = 'keyboard';
  private wasKeyboardPressed: boolean = false;

  // Modal de Vitória Pós-Cena
  private victoryContainer?: Phaser.GameObjects.Container;
  private victorySelectedBtnIndex: number = 0;
  private victoryButtons: { render: (sel: boolean) => void; onClick: () => void }[] = [];

  constructor() {
    super('Chapter1EndScene');
  }

  init(data: { runStats?: { kills: number; level: number; timeSec: number; soulsEarned?: number } }): void {
    if (data && data.runStats) {
      this.runStats = data.runStats;
    }
    this.currentStepIndex = 0;
    this.isEnding = false;
    this.isSlashCutPlaying = false;
    this.isTyping = false;
    this.currentBgKey = 'endchap1-1';
    this.isBgAActive = true;
    this.victoryButtons = [];
  }

  create(): void {
    const { width, height } = this.scale;
    const pixelFont = "'Silkscreen', 'Press Start 2P', monospace";

    SoundManager.getInstance().setScene(this);
    SoundManager.getInstance().stopMusic(1000);
    // Toca a música da cena com fade-in suave bem baixinha de fundo
    SoundManager.getInstance().playSpookyMusic(2000);

    // 1. Camadas de Fundo (A e B) para transições suaves de cena
    this.bgImageA = this.add.image(width / 2, height / 2, 'endchap1-1').setDepth(0);
    this.fitBackground(this.bgImageA);

    this.bgImageB = this.add.image(width / 2, height / 2, 'endchap1-1').setDepth(1).setAlpha(0);
    this.fitBackground(this.bgImageB);

    // Efeito sutil de respiração da câmera
    this.tweens.add({
      targets: [this.bgImageA, this.bgImageB],
      scaleX: '+=0.015',
      scaleY: '+=0.015',
      duration: 12000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    // 2. Gráficos de Corte da Execução
    this.slashGraphics = this.add.graphics().setDepth(45);

    // 3. Overlay preto para escurecimentos e transições
    this.blackOverlay = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0);
    this.blackOverlay.setDepth(40);

    // 4. Caixa de Diálogo
    const boxX = (width - this.BOX_W) / 2;
    const boxY = height - this.BOX_H - 24;

    this.boxContainer = this.add.container(boxX, boxY).setDepth(50);

    this.boxGraphics = this.add.graphics();
    this.boxContainer.add(this.boxGraphics);

    this.nameplateGraphics = this.add.graphics();
    this.boxContainer.add(this.nameplateGraphics);

    this.nameText = this.add.text(48, -14, 'NIXY', {
      fontFamily: pixelFont,
      fontSize: '15px',
      fontStyle: 'bold',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0, 0.5);
    this.boxContainer.add(this.nameText);

    this.dialogueText = this.add.text(36, 32, '', {
      fontFamily: pixelFont,
      fontSize: '13px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 2,
      wordWrap: { width: this.BOX_W - 72, useAdvancedWrap: true },
      lineSpacing: 8
    });
    this.boxContainer.add(this.dialogueText);

    this.promptText = this.add.text(this.BOX_W - 28, this.BOX_H - 18, 'ESPAÇO ▶', {
      fontFamily: pixelFont,
      fontSize: '10px',
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

    // 5. Botão de Pular Cena
    this.setupSkipButton();

    // 6. Configurar Roteiro da Cena
    this.setupStorySteps();

    // 7. Inputs
    this.setupInputs();

    // Iniciar Primeiro Diálogo com Fade-in
    this.blackOverlay.setAlpha(1);
    this.tweens.add({
      targets: this.blackOverlay,
      alpha: 0,
      duration: 800,
      ease: 'Power2',
      onComplete: () => {
        this.startStep(0);
      }
    });
  }

  private fitBackground(img: Phaser.GameObjects.Image): void {
    const { width, height } = this.scale;
    img.setPosition(width / 2, height / 2);
    const scaleX = width / img.width;
    const scaleY = height / img.height;
    const maxScale = Math.max(scaleX, scaleY);
    img.setScale(maxScale);
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
    } else if (this.currentControlScheme === 'touch') {
      this.promptText.setText('TOQUE P/ AVANÇAR ▶');
      this.skipTxt.setText('PULAR CENA');
    } else {
      this.promptText.setText('ESPAÇO ▶');
      this.skipTxt.setText('[ESC] PULAR CENA');
    }
  }

  private setupInputs(): void {
    // Teclado
    this.input.keyboard?.on('keydown', (event: KeyboardEvent) => {
      if (this.currentControlScheme !== 'keyboard') {
        this.currentControlScheme = 'keyboard';
        this.updateControlPrompts();
      }

      if (this.isEnding || this.isSlashCutPlaying) return;

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

    // Se o modal de vitória estiver aberto, controla botões pelo gamepad
    if (this.victoryContainer && this.victoryButtons.length > 0) {
      if (nav.left || nav.up) {
        this.victorySelectedBtnIndex = 0;
        this.renderVictorySelection();
      } else if (nav.right || nav.down) {
        this.victorySelectedBtnIndex = 1;
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
    this.steps = [
      // ==================== IMAGEM 1 ====================
      {
        bgKey: 'endchap1-1',
        speaker: 'narrator',
        speakerName: '',
        text: '*(A Succubus cai de joelhos. Suas asas estão feridas, sua respiração é irregular e o brilho de seus olhos começa a enfraquecer. Nixy se aproxima, limpando o sangue das mãos.)*'
      },
      {
        bgKey: 'endchap1-1',
        speaker: 'succubus',
        speakerName: 'SUCCUBUS',
        text: 'Ah... Como assim?\n\nNão... Não pode ser...'
      },
      {
        bgKey: 'endchap1-1',
        speaker: 'nixy',
        speakerName: 'NIXY',
        text: 'Parece que você não é lá essas coisas, né, sua cachorra?'
      },
      {
        bgKey: 'endchap1-1',
        speaker: 'succubus',
        speakerName: 'SUCCUBUS',
        text: 'Sua...'
      },
      {
        bgKey: 'endchap1-1',
        speaker: 'nixy',
        speakerName: 'NIXY',
        text: 'Na-na-ni-na-não!\n\n*(Nixy ergue um dedo diante do rosto dela.)*'
      },
      {
        bgKey: 'endchap1-1',
        speaker: 'nixy',
        speakerName: 'NIXY',
        text: 'Você não está em posição de dizer absolutamente PORRA NENHUMA! Hahahaha!\n\n*(Ela ri por alguns segundos. Então, seu sorriso começa a desaparecer.)*',
        action: () => {
          this.cameras.main.shake(200, 0.008);
        }
      },

      // ==================== IMAGEM 2 ====================
      {
        bgKey: 'endchap1-2',
        speaker: 'nixy',
        speakerName: 'NIXY',
        text: 'Sabe o que é engraçado?\n\nDepois de tantos séculos aguentando tudo calada...'
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
        text: 'Enquanto você saía mais cedo para VIÇAR, seduzindo meio inferno e abanando essa bunda por aí...\n\nEU ficava com todo o trabalho pesado!'
      },
      {
        bgKey: 'endchap1-2',
        speaker: 'nixy',
        speakerName: 'NIXY',
        text: '*(Nixy aponta para ela, com a voz cada vez mais carregada.)*\n\nVocê sabe o quanto eu me sacrifiquei por aquele lugar?!\n\nSABE?!',
        action: () => {
          this.cameras.main.shake(250, 0.012);
          SoundManager.getInstance().playRageBoom();
        }
      },
      {
        bgKey: 'endchap1-2',
        speaker: 'nixy',
        speakerName: 'NIXY',
        text: '*(Silêncio.)*\n\nNão...\n\nÉ CLARO QUE NÃO!'
      },
      {
        bgKey: 'endchap1-2',
        speaker: 'nixy',
        speakerName: 'NIXY',
        text: 'Você nunca precisou saber! Nunca precisou se importar! Afinal, por que se preocupar com os outros quando o próprio umbigo é a coisa mais interessante do universo?!'
      },
      {
        bgKey: 'endchap1-2',
        speaker: 'succubus',
        speakerName: 'SUCCUBUS',
        text: 'Nixy...'
      },
      {
        bgKey: 'endchap1-2',
        speaker: 'nixy',
        speakerName: 'NIXY',
        text: 'NÃO! Agora você vai me ouvir!\n\nPassei séculos acreditando que, se trabalhasse duro o suficiente, se obedecesse a todas as regras imbecis e fizesse tudo exatamente como mandavam, um dia finalmente teria o direito de viver a minha própria vida!'
      },
      {
        bgKey: 'endchap1-2',
        speaker: 'nixy',
        speakerName: 'NIXY',
        text: 'E sabe o que eu ganhei?\n\nMAIS QUINHENTOS ANOS!\n\n*(Ela solta uma risada curta, amarga.)*'
      },
      {
        bgKey: 'endchap1-2',
        speaker: 'nixy',
        speakerName: 'NIXY',
        text: 'Hahaha... Meu Deus, eu sou uma idiota.\n\nMil anos da minha vida... jogados fora porque acreditei na palavra de um bando de demônios engravatados!'
      },
      {
        bgKey: 'endchap1-2',
        speaker: 'succubus',
        speakerName: 'SUCCUBUS',
        text: 'Nixy, escuta. Se você realmente acha que vai conseguir sair daqui sozinha...\n\nVocê está muito enganada.'
      },
      {
        bgKey: 'endchap1-2',
        speaker: 'succubus',
        speakerName: 'SUCCUBUS',
        text: 'Você não faz ideia do quanto eles são poderosos. O que aconteceu hoje não foi nada comparado ao que te espera quando descobrirem o que você planeja.'
      },
      {
        bgKey: 'endchap1-2',
        speaker: 'succubus',
        speakerName: 'SUCCUBUS',
        text: '*(A Succubus tenta se levantar, mas suas pernas cedem.)*\n\nPor favor... Volte para lá. Podemos esquecer o que aconteceu aqui. Eu posso tentar conversar com eles, conseguir que reduzam seu tempo aqui...\n\nAcredite em mim, eu posso ajudar você...'
      },
      {
        bgKey: 'endchap1-2',
        speaker: 'nixy',
        speakerName: 'NIXY',
        text: 'CALA A BOCA!\n\n*(A voz de Nixy ecoa pelo corredor. A Succubus se encolhe.)*',
        action: () => {
          this.cameras.main.shake(300, 0.015);
          SoundManager.getInstance().playRageBoom();
        }
      },
      {
        bgKey: 'endchap1-2',
        speaker: 'nixy',
        speakerName: 'NIXY',
        text: 'EU JÁ CANSEI DESSE PAPINHO DE PUTA!\n\nCansei de ouvir o que posso ou não posso fazer! Cansei de receber ordens! Cansei de gente que nunca esteve no meu lugar tentando decidir o que é melhor para mim!'
      },
      {
        bgKey: 'endchap1-2',
        speaker: 'nixy',
        speakerName: 'NIXY',
        text: 'VOCÊ NÃO SABE O QUE É MELHOR PRA MIM!\n\nNINGUÉM SABE!'
      },
      {
        bgKey: 'endchap1-2',
        speaker: 'nixy',
        speakerName: 'NIXY',
        text: '*(Nixy respira fundo. Seus punhos tremem, mas ela não desvia o olhar.)*\n\nPassei mil anos vivendo a vida que vocês escolheram para mim.\n\nMil anos obedecendo. Mil anos esperando. Mil anos acreditando que, se fosse uma boa funcionária, alguém finalmente cumpriria a porra da promessa!\n\n*(Ela se vira e começa a caminhar.)*'
      },

      // ==================== IMAGEM 3 ====================
      {
        bgKey: 'endchap1-3',
        speaker: 'nixy',
        speakerName: 'NIXY',
        text: 'Mas acabou.\n\nA partir de agora, eu faço as minhas próprias regras.\n\nSe o próximo andar está trancado, eu arrombo a porta.\n\nSe colocarem guardas no meu caminho, eu passo por cima deles.'
      },
      {
        bgKey: 'endchap1-3',
        speaker: 'nixy',
        speakerName: 'NIXY',
        text: 'Se os chefes desse inferno acham que podem me manter aqui para sempre...\n\n*(Nixy olha por cima do ombro, com um sorriso torto.)*\n\n...então eles que vão ter quinhentos anos de atraso para compensar.\n\nE eu pretendo cobrar cada segundo.'
      },
      {
        bgKey: 'endchap1-3',
        speaker: 'succubus',
        speakerName: 'SUCCUBUS',
        text: 'Nixy, espere!'
      },

      // ==================== TRANSIÇÃO DE EXECUÇÃO -> IMAGEM 4 ====================
      {
        bgKey: 'endchap1-4',
        speaker: 'nixy',
        speakerName: 'NIXY',
        text: 'Argh, sangue de demonio é nojento...\n\nSerá que meu sangue é assim também?'
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
          this.tweens.add({
            targets: this.cameras.main,
            zoom: 1.32,
            scrollX: -130,
            scrollY: 15,
            duration: 1200,
            ease: 'Cubic.easeOut'
          });
        }
      },
      {
        bgKey: 'endchap1-5',
        speaker: 'nixy',
        speakerName: 'NIXY',
        text: '"...então eles que vão ter quinhentos anos de atraso para compensar."\n\nhahaha essa frase farmou aura demais...',
        action: () => {
          // (camera fica escura)
          this.tweens.add({
            targets: this.blackOverlay,
            alpha: 0.78,
            duration: 900,
            ease: 'Power2'
          });
        }
      }
    ];
  }

  private startStep(index: number): void {
    if (index >= this.steps.length) {
      this.finishScene();
      return;
    }

    this.currentStepIndex = index;
    const step = this.steps[index];

    // Verifica se precisa acionar a transição cinematográfica especial de execução
    if (step.bgKey === 'endchap1-4' && this.currentBgKey === 'endchap1-3') {
      this.playSlashExecutionCut(() => {
        this.renderStepContent(step);
      });
      return;
    }

    // Troca de Fundo com Crossfade suave se for outra imagem
    if (step.bgKey !== this.currentBgKey) {
      this.crossfadeBackground(step.bgKey);
    }

    this.renderStepContent(step);
  }

  private renderStepContent(step: DialogueStep): void {
    this.boxContainer.setVisible(true);
    this.drawDialogueBox(step.speaker);

    if (step.speaker === 'narrator') {
      this.nameText.setText('');
      this.dialogueText.setColor('#ffd8a8');
      this.dialogueText.setFontStyle('italic');
    } else if (step.speaker === 'succubus') {
      this.nameText.setText(step.speakerName);
      this.dialogueText.setColor('#ffccd5');
      this.dialogueText.setFontStyle('normal');
    } else {
      this.nameText.setText(step.speakerName);
      this.dialogueText.setColor('#ffffff');
      this.dialogueText.setFontStyle('normal');
    }

    // Voz característica do personagem
    SoundManager.getInstance().playDialogueVoice(step.speaker);

    // Efeito de Digitação
    this.fullText = step.text;
    this.displayedText = '';
    this.dialogueText.setText('');
    this.isTyping = true;

    if (this.typeTimer) {
      this.typeTimer.remove();
    }

    let charIndex = 0;
    this.typeTimer = this.time.addEvent({
      delay: 22,
      repeat: this.fullText.length - 1,
      callback: () => {
        charIndex++;
        this.displayedText = this.fullText.substring(0, charIndex);
        this.dialogueText.setText(this.displayedText);
        enableCensoredTextHighlight(this.dialogueText);

        if (charIndex % 3 === 0) {
          SoundManager.getInstance().playDialogueTypewriter(this.fullText[charIndex - 1]);
        }

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
   * Transição dramática da execução: tela preta, treme, linha branca rápida e som de corte de lâmina
   */
  private playSlashExecutionCut(onComplete: () => void): void {
    this.isSlashCutPlaying = true;
    this.boxContainer.setVisible(false);

    // 1. Tela preta instantânea
    this.blackOverlay.setAlpha(1.0);

    // 2. Treme fortemente a câmera
    this.cameras.main.shake(450, 0.025);

    // 3. Som de corte cortante e sub-grave
    SoundManager.getInstance().playExecutionSlash();

    // 4. Linha branca atravessando a tela em diagonal
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
        const len = 350;

        // Brilho externo vermelho
        this.slashGraphics.lineStyle(8, 0xff0044, 0.8);
        this.slashGraphics.lineBetween(startX - len * 0.5, startY - len * 0.4, startX + len * 0.5, startY + len * 0.4);

        // Núcleo branco ofuscante
        this.slashGraphics.lineStyle(3, 0xffffff, 1.0);
        this.slashGraphics.lineBetween(startX - len * 0.5, startY - len * 0.4, startX + len * 0.5, startY + len * 0.4);
      },
      onComplete: () => {
        this.slashGraphics.clear();

        // 5. Flash vermelho de sangue rápido
        const bloodFlash = this.add.rectangle(width / 2, height / 2, width, height, 0x660011, 0.6).setDepth(42);
        this.tweens.add({
          targets: bloodFlash,
          alpha: 0,
          duration: 250,
          onComplete: () => bloodFlash.destroy()
        });

        // 6. Atualiza fundo para imagem 4 e revela suavemente
        this.crossfadeBackground('endchap1-4', 300);

        this.time.delayedCall(400, () => {
          this.tweens.add({
            targets: this.blackOverlay,
            alpha: 0,
            duration: 500,
            onComplete: () => {
              this.isSlashCutPlaying = false;
              onComplete();
            }
          });
        });
      }
    });
  }

  private drawDialogueBox(speaker: 'nixy' | 'succubus' | 'narrator'): void {
    this.boxGraphics.clear();
    this.nameplateGraphics.clear();

    const w = this.BOX_W;
    const h = this.BOX_H;

    // Fundo da caixa Persona 5 / Visual Novel
    this.boxGraphics.fillStyle(0x0e0207, 0.94);
    this.boxGraphics.fillRoundedRect(0, 0, w, h, 10);

    const borderColor = speaker === 'succubus' ? 0xd90429 : 0xff2a55;
    const innerBorder = speaker === 'succubus' ? 0x720026 : 0xf3d17a;

    this.boxGraphics.lineStyle(2.5, borderColor, 0.95);
    this.boxGraphics.strokeRoundedRect(0, 0, w, h, 10);

    this.boxGraphics.lineStyle(1.0, innerBorder, 0.4);
    this.boxGraphics.strokeRoundedRect(4, 4, w - 8, h - 8, 8);

    // Placa de Nome
    if (speaker !== 'narrator') {
      const plateW = 160;
      const plateH = 28;
      const plateX = 32;
      const plateY = -14;

      this.nameplateGraphics.fillStyle(speaker === 'succubus' ? 0x590d22 : 0x800f2f, 0.98);
      this.nameplateGraphics.fillRoundedRect(plateX, plateY, plateW, plateH, 6);
      this.nameplateGraphics.lineStyle(2, innerBorder, 1);
      this.nameplateGraphics.strokeRoundedRect(plateX, plateY, plateW, plateH, 6);
    }
  }

  private crossfadeBackground(newKey: string, duration: number = 700): void {
    this.currentBgKey = newKey;

    const activeBg = this.isBgAActive ? this.bgImageA : this.bgImageB;
    const nextBg = this.isBgAActive ? this.bgImageB : this.bgImageA;

    nextBg.setTexture(newKey);
    this.fitBackground(nextBg);
    nextBg.setAlpha(0);

    this.tweens.add({
      targets: nextBg,
      alpha: 1,
      duration,
      ease: 'Power2'
    });

    this.tweens.add({
      targets: activeBg,
      alpha: 0,
      duration,
      ease: 'Power2'
    });

    this.isBgAActive = !this.isBgAActive;
  }

  private handleAdvance(): void {
    const now = Date.now();
    if (now - this.lastAdvanceTime < 180) return;
    this.lastAdvanceTime = now;

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

    // Grava progresso da partida
    const soulsEarned = MetaProgressManager.getInstance().finalizeRunSouls();
    MetaProgressManager.getInstance().recordRun(
      this.runStats.timeSec,
      this.runStats.kills,
      true
    );
    this.runStats.soulsEarned = soulsEarned;

    // Fade para o modal de vitória
    this.tweens.add({
      targets: this.blackOverlay,
      alpha: 0.90,
      duration: 600,
      onComplete: () => {
        this.showVictoryModal();
      }
    });
  }

  /**
   * Tela de Vitória do Capítulo com informações da run e opções de avançar / menu
   */
  private showVictoryModal(): void {
    const { width, height } = this.scale;
    const pixelFont = "'Silkscreen', 'Press Start 2P', monospace";

    this.victoryContainer = this.add.container(0, 0).setDepth(100);

    const panelW = 580;
    const panelH = 370;
    const panelX = width / 2;
    const panelY = height / 2;

    const g = this.add.graphics();
    g.fillStyle(0x14030a, 0.98);
    g.fillRoundedRect(panelX - panelW / 2, panelY - panelH / 2, panelW, panelH, 14);
    g.lineStyle(3, 0xf3d17a, 1);
    g.strokeRoundedRect(panelX - panelW / 2, panelY - panelH / 2, panelW, panelH, 14);
    g.lineStyle(1.5, 0xff0055, 0.6);
    g.strokeRoundedRect(panelX - panelW / 2 + 5, panelY - panelH / 2 + 5, panelW - 10, panelH - 10, 10);
    this.victoryContainer.add(g);

    // Título Superior
    const title = this.add.text(panelX, panelY - 130, 'CAPÍTULO 1 CONCLUÍDO', {
      fontFamily: pixelFont,
      fontSize: '22px',
      fontStyle: 'bold',
      color: '#ffd60a',
      stroke: '#4a0e17',
      strokeThickness: 4
    }).setOrigin(0.5);
    this.victoryContainer.add(title);

    const subtitle = this.add.text(panelX, panelY - 95, 'A SUCCUBUS FOI DERROTADA', {
      fontFamily: pixelFont,
      fontSize: '11px',
      fontStyle: 'bold',
      color: '#ff7b95',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5);
    this.victoryContainer.add(subtitle);

    // Estatísticas da Partida
    const mins = Math.floor(this.runStats.timeSec / 60);
    const secs = this.runStats.timeSec % 60;
    const timeFormatted = `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
    const soulsInfo = typeof this.runStats.soulsEarned === 'number' ? `\nAlmas Corrompidas Resgatadas: +${this.runStats.soulsEarned}` : '';

    const statsText = this.add.text(panelX, panelY - 20,
      `Inimigos Abatidos: ${this.runStats.kills}\nNível Alcançado: ${this.runStats.level}\nTempo de Sobrevivência: ${timeFormatted}\nChefe do Círculo: Succubus (DERROTADA)${soulsInfo}`, {
      fontFamily: pixelFont,
      fontSize: '12px',
      color: '#ffffff',
      stroke: '#100306',
      strokeThickness: 2,
      align: 'center',
      lineSpacing: 10
    }).setOrigin(0.5);
    this.victoryContainer.add(statsText);

    // Mensagem de aviso flutuante para Próximo Capítulo
    const toastNotice = this.add.text(panelX, panelY + 52, '', {
      fontFamily: pixelFont,
      fontSize: '10px',
      color: '#f3d17a',
      stroke: '#000000',
      strokeThickness: 2
    }).setOrigin(0.5).setAlpha(0);
    this.victoryContainer.add(toastNotice);

    // Botões: PRÓXIMO CAPÍTULO e VOLTAR AO MENU
    const btnW = 220;
    const btnH = 42;
    const btnY = panelY + 115;
    const btn1X = panelX - 125;
    const btn2X = panelX + 125;

    // Botão 1: Próximo Capítulo
    const btn1Bg = this.add.graphics();
    const renderBtn1 = (selected: boolean) => {
      btn1Bg.clear();
      btn1Bg.fillStyle(selected ? 0x6a040f : 0x370617, 1);
      btn1Bg.fillRoundedRect(btn1X - btnW / 2, btnY - btnH / 2, btnW, btnH, 8);
      btn1Bg.lineStyle(2, selected ? 0xffd60a : 0x9d0208, 1);
      btn1Bg.strokeRoundedRect(btn1X - btnW / 2, btnY - btnH / 2, btnW, btnH, 8);
    };
    renderBtn1(false);
    this.victoryContainer.add(btn1Bg);

    const btn1Text = this.add.text(btn1X, btnY, 'PRÓXIMO CAPÍTULO', {
      fontFamily: pixelFont,
      fontSize: '11px',
      fontStyle: 'bold',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 2
    }).setOrigin(0.5);
    this.victoryContainer.add(btn1Text);

    const btn1Zone = this.add.zone(btn1X, btnY, btnW, btnH).setInteractive({ useHandCursor: true });
    this.victoryContainer.add(btn1Zone);

    const handleNextChapter = () => {
      SoundManager.getInstance().playMenuClick();
      toastNotice.setText('Capítulo 2 em desenvolvimento nas próximas atualizações!');
      toastNotice.setAlpha(1);
      this.tweens.killTweensOf(toastNotice);
      this.tweens.add({
        targets: toastNotice,
        alpha: 0,
        delay: 2500,
        duration: 800
      });
    };

    btn1Zone.on('pointerover', () => {
      this.victorySelectedBtnIndex = 0;
      this.renderVictorySelection();
    });
    btn1Zone.on('pointerdown', handleNextChapter);

    // Botão 2: Voltar ao Menu
    const btn2Bg = this.add.graphics();
    const renderBtn2 = (selected: boolean) => {
      btn2Bg.clear();
      btn2Bg.fillStyle(selected ? 0xff0055 : 0x720012, 1);
      btn2Bg.fillRoundedRect(btn2X - btnW / 2, btnY - btnH / 2, btnW, btnH, 8);
      btn2Bg.lineStyle(2, selected ? 0xffffff : 0xf3d17a, 1);
      btn2Bg.strokeRoundedRect(btn2X - btnW / 2, btnY - btnH / 2, btnW, btnH, 8);
    };
    renderBtn2(false);
    this.victoryContainer.add(btn2Bg);

    const btn2Text = this.add.text(btn2X, btnY, 'VOLTAR AO MENU', {
      fontFamily: pixelFont,
      fontSize: '11px',
      fontStyle: 'bold',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 2
    }).setOrigin(0.5);
    this.victoryContainer.add(btn2Text);

    const btn2Zone = this.add.zone(btn2X, btnY, btnW, btnH).setInteractive({ useHandCursor: true });
    this.victoryContainer.add(btn2Zone);

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

    btn2Zone.on('pointerover', () => {
      this.victorySelectedBtnIndex = 1;
      this.renderVictorySelection();
    });
    btn2Zone.on('pointerdown', handleReturnToMenu);

    this.victoryButtons = [
      { render: renderBtn1, onClick: handleNextChapter },
      { render: renderBtn2, onClick: handleReturnToMenu }
    ];

    this.victorySelectedBtnIndex = 1; // Foco inicial padrão em Voltar ao Menu
    this.renderVictorySelection();
  }
}
