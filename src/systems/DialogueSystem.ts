import Phaser from 'phaser';
import { SoundManager } from './SoundManager';
import { enableCensoredTextHighlight } from './TextHighlight';
import { GamepadManager } from './GamepadManager';

export interface DialogueLine {
  speaker: string; // 'nixy', 'succubus', ou futuros NPCs
  speakerName: string;
  portraitKey: string;
  text: string;
}

export class DialogueSystem {
  private scene: Phaser.Scene;
  private lines: DialogueLine[] = [];
  private currentLineIndex: number = 0;
  private isTyping: boolean = false;
  private currentFullText: string = '';
  private currentDisplayedText: string = '';
  private typeTimer?: Phaser.Time.TimerEvent;
  private onCompleteCallback?: () => void;
  private lastAdvanceTime: number = 0;
  private currentControlScheme: 'keyboard' | 'gamepad' | 'touch' = 'keyboard';
  private wasKeyboardPressed: boolean = false;

  // Elementos Visuais Principais
  private container!: Phaser.GameObjects.Container;
  private leftBustImage!: Phaser.GameObjects.Image;
  private rightBustImage!: Phaser.GameObjects.Image;

  // Sub-container deslizante do balão de fala
  private balloonContainer!: Phaser.GameObjects.Container;
  private boxGraphics!: Phaser.GameObjects.Graphics;
  private nameplateGraphics!: Phaser.GameObjects.Graphics;
  private nameText!: Phaser.GameObjects.Text;
  private dialogueText!: Phaser.GameObjects.Text;
  private promptText!: Phaser.GameObjects.Text;

  // Posições dos balões
  private readonly BALLOON_W = 870;
  private readonly BALLOON_H = 135;
  private readonly BALLOON_LEFT_X = 40;   // Posição quando NPC/Boss fala na direita
  private readonly BALLOON_RIGHT_X = 370; // Posição quando Nixy fala na esquerda

  // Dimensões do busto dos personagens (+50%: 420x420px para presença de destaque estilo Persona)
  private readonly BUST_W = 420;
  private readonly BUST_H = 420;
  private readonly BUST_LEFT_X = 190;
  private readonly BUST_RIGHT_X = 1090;

  private currentSpeakerSide?: 'left' | 'right';

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.createDialogueUI();
  }

  private createDialogueUI(): void {
    const { width, height } = this.scene.scale;
    const pixelFont = "'Silkscreen', 'Press Start 2P', monospace";

    this.container = this.scene.add.container(0, 0);
    this.container.setScrollFactor(0);
    this.container.setDepth(3000);
    this.container.setVisible(false);

    // 1. Escurecimento cinematográfico translúcido de fundo
    const dimBg = this.scene.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.70);
    dimBg.setInteractive(); // Bloqueia cliques no jogo de fundo
    this.container.add(dimBg);

    // 2. Sprite de busto da heroína (Lado Esquerdo, ancorado no rodapé absoluto sem corte visível)
    this.leftBustImage = this.scene.add.image(this.BUST_LEFT_X, height + 8, 'chat-nixy');
    this.leftBustImage.setOrigin(0.5, 1.0);
    this.leftBustImage.setDisplaySize(this.BUST_W, this.BUST_H);
    this.leftBustImage.setDepth(3010);
    this.leftBustImage.setAlpha(0);
    this.container.add(this.leftBustImage);

    // 3. Sprite de busto do Chefe / NPC (Lado Direito, ancorado no rodapé absoluto)
    this.rightBustImage = this.scene.add.image(this.BUST_RIGHT_X, height + 8, 'chat-succubus');
    this.rightBustImage.setOrigin(0.5, 1.0);
    this.rightBustImage.setDisplaySize(this.BUST_W, this.BUST_H);
    this.rightBustImage.setDepth(3010);
    this.rightBustImage.setAlpha(0);
    this.container.add(this.rightBustImage);

    // 4. Sub-container deslizante do balão de fala
    this.balloonContainer = this.scene.add.container(this.BALLOON_RIGHT_X, height - 155);
    this.balloonContainer.setDepth(3020);
    this.container.add(this.balloonContainer);

    // 4.1 Gráficos da Caixa Angular Estilo Persona 5
    this.boxGraphics = this.scene.add.graphics();
    this.balloonContainer.add(this.boxGraphics);

    // 4.2 Gráficos da Plaqueta de Nome
    this.nameplateGraphics = this.scene.add.graphics();
    this.balloonContainer.add(this.nameplateGraphics);

    // 4.3 Texto do Nome
    this.nameText = this.scene.add.text(35, -22, 'NIXY', {
      fontFamily: pixelFont,
      fontSize: '16px',
      fontStyle: 'bold',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 4
    });
    this.balloonContainer.add(this.nameText);

    // 4.4 Texto do Diálogo (Fonte maior: 18px e excelente legibilidade)
    this.dialogueText = this.scene.add.text(30, 24, '', {
      fontFamily: pixelFont,
      fontSize: '18px',
      color: '#f8f9fa',
      stroke: '#0a0104',
      strokeThickness: 3.5,
      wordWrap: { width: this.BALLOON_W - 60, useAdvancedWrap: true },
      lineSpacing: 10
    });
    enableCensoredTextHighlight(this.dialogueText, '#ffd700');
    this.balloonContainer.add(this.dialogueText);

    // 4.5 Prompt de Avançar [ESPAÇO / CLIQUE]
    this.promptText = this.scene.add.text(this.BALLOON_W - 25, this.BALLOON_H - 16, '▶ ESPAÇO / CLIQUE', {
      fontFamily: pixelFont,
      fontSize: '11px',
      fontStyle: 'bold',
      color: '#f3d17a',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(1, 0.5);
    this.balloonContainer.add(this.promptText);

    // Efeito de pulso no prompt
    this.scene.tweens.add({
      targets: this.promptText,
      alpha: 0.35,
      duration: 500,
      yoyo: true,
      repeat: -1
    });

    // 5. Controles de Teclado, Toque e Clique
    dimBg.on('pointerdown', () => this.handleAdvance());

    this.scene.input.on('pointerdown', () => {
      if (this.container.visible) this.handleAdvance();
    });

    if (this.scene.input.keyboard) {
      this.scene.input.keyboard.on('keydown', () => {
        this.wasKeyboardPressed = true;
      });
      this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE).on('down', () => {
        if (this.container.visible) this.handleAdvance();
      });
      this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER).on('down', () => {
        if (this.container.visible) this.handleAdvance();
      });
      this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC).on('down', () => {
        if (this.container.visible) this.skipAll();
      });
    }
  }

  public startDialogue(lines: DialogueLine[], onComplete: () => void): void {
    if (!lines || lines.length === 0) {
      onComplete();
      return;
    }

    this.lines = this.paginateDialogueLines(lines);
    this.currentLineIndex = 0;
    this.onCompleteCallback = onComplete;
    this.currentSpeakerSide = undefined;

    // Cancela quaisquer tweens em andamento
    this.scene.tweens.killTweensOf(this.leftBustImage);
    this.scene.tweens.killTweensOf(this.rightBustImage);
    this.scene.tweens.killTweensOf(this.balloonContainer);

    // Reseta estado dos bustos
    this.leftBustImage.setAlpha(0);
    this.rightBustImage.setAlpha(0);

    this.container.setVisible(true);
    this.displayLine(0);
  }

  /**
   * Corta automaticamente palavras/frases que passarem da altura segura da caixa de diálogo
   * enviando o excedente para a próxima caixa de texto!
   */
  private paginateDialogueLines(rawLines: DialogueLine[]): DialogueLine[] {
    const result: DialogueLine[] = [];
    const maxTextHeight = 82;

    for (const line of rawLines) {
      this.dialogueText.setText(line.text);
      if (this.dialogueText.height <= maxTextHeight) {
        result.push(line);
        continue;
      }

      const tokens = line.text.split(/(\s+)/);
      let currentChunk = '';

      for (const token of tokens) {
        const candidate = currentChunk ? currentChunk + token : token.trimStart();
        if (!candidate) continue;

        this.dialogueText.setText(candidate);
        if (this.dialogueText.height > maxTextHeight && currentChunk.trim().length > 0) {
          result.push({
            ...line,
            text: currentChunk.trim()
          });
          currentChunk = token.trimStart();
        } else {
          currentChunk = candidate;
        }
      }

      if (currentChunk.trim().length > 0) {
        result.push({
          ...line,
          text: currentChunk.trim()
        });
      }
    }

    this.dialogueText.setText('');
    return result;
  }

  private displayLine(index: number): void {
    const line = this.lines[index];
    if (!line) {
      this.finishDialogue();
      return;
    }

    const { width, height } = this.scene.scale;
    const isPlayer = line.speaker.toLowerCase() === 'nixy';
    const newSide: 'left' | 'right' = isPlayer ? 'left' : 'right';

    // Resolver textura adequada (prioriza Chat<Nome> se existir)
    const textureKey = this.resolvePortraitTexture(line.speaker, line.portraitKey);

    const isSpeakerChanged = this.currentSpeakerSide !== newSide;

    if (!isSpeakerChanged) {
      // 1. Mesmo personagem falando: NÃO reinicia a animação de entrada nem mexe no balão!
      if (newSide === 'left') {
        this.leftBustImage.setTexture(textureKey);
        this.leftBustImage.setDisplaySize(this.BUST_W, this.BUST_H);
        this.drawNameplate(line.speakerName, true);
      } else {
        this.rightBustImage.setTexture(textureKey);
        this.rightBustImage.setDisplaySize(this.BUST_W, this.BUST_H);
        this.drawNameplate(line.speakerName, false);
      }
    } else {
      // 2. Mudança de personagem (ou primeiro balão): executa a transição entre lados
      this.scene.tweens.killTweensOf(this.leftBustImage);
      this.scene.tweens.killTweensOf(this.rightBustImage);
      this.scene.tweens.killTweensOf(this.balloonContainer);

      if (newSide === 'left') {
        // Desliza para fora o busto anterior da direita (se estiver visível)
        if (this.rightBustImage.alpha > 0) {
          this.scene.tweens.add({
            targets: this.rightBustImage,
            x: width - 70,
            alpha: 0,
            duration: 200,
            ease: 'Quad.easeIn'
          });
        }

        this.leftBustImage.setTexture(textureKey);
        this.leftBustImage.setDisplaySize(this.BUST_W, this.BUST_H);
        this.leftBustImage.clearTint();
        this.leftBustImage.setPosition(70, height + 8);
        this.leftBustImage.setAlpha(0);

        this.scene.tweens.add({
          targets: this.leftBustImage,
          x: this.BUST_LEFT_X,
          alpha: 1,
          duration: 260,
          ease: 'Back.easeOut'
        });

        // Balão de fala desliza para a DIREITA
        this.scene.tweens.add({
          targets: this.balloonContainer,
          x: this.BALLOON_RIGHT_X,
          duration: 240,
          ease: 'Cubic.easeOut'
        });

        // Desenha caixa estilizada para Nixy
        this.drawSlantedBox(true);
        this.drawNameplate(line.speakerName, true);
      } else {
        // Desliza para fora o busto anterior da esquerda (se estiver visível)
        if (this.leftBustImage.alpha > 0) {
          this.scene.tweens.add({
            targets: this.leftBustImage,
            x: 70,
            alpha: 0,
            duration: 200,
            ease: 'Quad.easeIn'
          });
        }

        this.rightBustImage.setTexture(textureKey);
        this.rightBustImage.setDisplaySize(this.BUST_W, this.BUST_H);
        this.rightBustImage.clearTint();
        this.rightBustImage.setPosition(width - 70, height + 8);
        this.rightBustImage.setAlpha(0);

        this.scene.tweens.add({
          targets: this.rightBustImage,
          x: this.BUST_RIGHT_X,
          alpha: 1,
          duration: 260,
          ease: 'Back.easeOut'
        });

        // Balão de fala desliza para a ESQUERDA
        this.scene.tweens.add({
          targets: this.balloonContainer,
          x: this.BALLOON_LEFT_X,
          duration: 240,
          ease: 'Cubic.easeOut'
        });

        // Desenha caixa estilizada para o Chefe/NPC
        this.drawSlantedBox(false);
        this.drawNameplate(line.speakerName, false);
      }

      this.currentSpeakerSide = newSide;
    }

    // Inicia efeito de máquina de escrever com áudio característico de voz e digitação
    this.currentFullText = line.text;
    this.currentDisplayedText = '';
    this.dialogueText.setText('');
    this.isTyping = true;

    // Toca som de voz do personagem no início do balão
    SoundManager.getInstance().playDialogueVoice(line.speaker);

    if (this.typeTimer) {
      this.typeTimer.remove();
    }

    let charIndex = 0;
    this.typeTimer = this.scene.time.addEvent({
      delay: 24,
      repeat: this.currentFullText.length - 1,
      callback: () => {
        charIndex++;
        this.currentDisplayedText = this.currentFullText.substring(0, charIndex);
        this.dialogueText.setText(this.currentDisplayedText);

        // Barulhinho sutil de digitação por caractere
        const char = this.currentFullText[charIndex - 1];
        SoundManager.getInstance().playDialogueTypewriter(char);

        if (charIndex >= this.currentFullText.length) {
          this.isTyping = false;
        }
      }
    });
  }

  private resolvePortraitTexture(speaker: string, requestedKey: string): string {
    const sLower = speaker.toLowerCase();

    // 1. Tenta carregar chat-<nome> (ex: 'chat-succubus', 'chat-nixy')
    const chatKey = `chat-${sLower}`;
    if (this.scene.textures.exists(chatKey)) {
      return chatKey;
    }

    // 2. Se a chave solicitada existir no cache do Phaser
    if (requestedKey && this.scene.textures.exists(requestedKey)) {
      return requestedKey;
    }

    // 3. Fallbacks seguros
    if (sLower === 'nixy') {
      return 'nixy-portrait-idle';
    }
    return 'succubus-idle-south';
  }

  private drawSlantedBox(isLeft: boolean): void {
    const g = this.boxGraphics;
    g.clear();

    const boxW = this.BALLOON_W;
    const boxH = this.BALLOON_H;
    const slant = isLeft ? 14 : -14;

    // 1. Sombra preta chanfrada
    g.fillStyle(0x000000, 0.75);
    g.beginPath();
    g.moveTo(6, 6 - slant);
    g.lineTo(boxW + 6, 6);
    g.lineTo(boxW + 6, boxH + 6);
    g.lineTo(6, boxH + 6 - slant);
    g.closePath();
    g.fill();

    // 2. Fundo interno (Veludo Carmesim para Nixy / Roxo Abissal para Inimigo)
    const bgColor = isLeft ? 0x180309 : 0x14011c;
    g.fillStyle(bgColor, 0.96);
    g.beginPath();
    g.moveTo(0, -slant);
    g.lineTo(boxW, 0);
    g.lineTo(boxW, boxH);
    g.lineTo(0, boxH - slant);
    g.closePath();
    g.fill();

    // 3. Moldura Externa Branca Grossa Estilo Mangá/Persona 5
    g.lineStyle(3.5, 0xffffff, 1);
    g.stroke();

    // 4. Filete interno em Dourado Antigo (Nixy) ou Magenta Neon (Inimigo)
    const accentColor = isLeft ? 0xc59b27 : 0xff0066;
    g.lineStyle(1.5, accentColor, 0.85);
    g.beginPath();
    g.moveTo(4, -slant + 4);
    g.lineTo(boxW - 4, 4);
    g.lineTo(boxW - 4, boxH - 4);
    g.lineTo(4, boxH - slant - 4);
    g.closePath();
    g.stroke();
  }

  private drawNameplate(name: string, isLeft: boolean): void {
    const g = this.nameplateGraphics;
    g.clear();

    const nW = Math.max(160, name.length * 15 + 40);
    const nH = 34;

    // Plaqueta no lado esquerdo do balão (ou no lado direito se o falante estiver na direita)
    const nX = isLeft ? 25 : this.BALLOON_W - nW - 25;
    const nY = -28;

    const plateColor = isLeft ? 0x9d0208 : 0x6a0056;
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

  public handleAdvance(): void {
    if (!this.container.visible) return;

    const now = Date.now();
    if (now - this.lastAdvanceTime < 180) return;
    this.lastAdvanceTime = now;

    SoundManager.getInstance().playMenuClick();

    if (this.isTyping) {
      // Se ainda estiver digitando, completa a frase imediatamente
      if (this.typeTimer) this.typeTimer.remove();
      this.isTyping = false;
      this.currentDisplayedText = this.currentFullText;
      this.dialogueText.setText(this.currentFullText);
    } else {
      // Avança para a próxima fala
      this.currentLineIndex++;
      if (this.currentLineIndex < this.lines.length) {
        this.displayLine(this.currentLineIndex);
      } else {
        this.finishDialogue();
      }
    }
  }

  public update(_delta: number): void {
    if (!this.container.visible) return;

    const pad = GamepadManager.getInstance().getActivePad(this.scene);
    const isTouch = Boolean(this.scene.sys.game.device.input.touch && !this.scene.sys.game.device.os.desktop);

    if (pad && pad.connected) {
      const stickActive =
        Math.abs(pad.leftStick.x) > 0.15 ||
        Math.abs(pad.leftStick.y) > 0.15 ||
        pad.left || pad.right || pad.up || pad.down;

      let btnActive = false;
      for (let i = 0; i < pad.buttons.length; i++) {
        if (pad.buttons[i] && pad.buttons[i].pressed) {
          btnActive = true;
          break;
        }
      }

      if (stickActive || btnActive) {
        if (this.currentControlScheme !== 'gamepad') {
          this.currentControlScheme = 'gamepad';
          if (this.promptText) this.promptText.setText('▶ (A) AVANÇAR  |  (B) PULAR');
        }
      }
    } else if (isTouch && this.currentControlScheme !== 'touch') {
      this.currentControlScheme = 'touch';
      if (this.promptText) this.promptText.setText('▶ TOQUE P/ AVANÇAR');
    }

    if (this.wasKeyboardPressed && this.currentControlScheme !== 'keyboard') {
      this.currentControlScheme = 'keyboard';
      this.wasKeyboardPressed = false;
      if (this.promptText) this.promptText.setText('▶ ESPAÇO / CLIQUE  |  [ESC] PULAR');
    }

    const nav = GamepadManager.getInstance().getMenuNavigation(this.scene);
    if (nav.confirm) {
      this.handleAdvance();
    } else if (nav.cancel) {
      this.skipAll();
    }
  }

  public skipAll(): void {
    if (!this.container.visible) return;
    if (this.typeTimer) this.typeTimer.remove();
    this.isTyping = false;
    this.finishDialogue();
  }

  private finishDialogue(): void {
    this.scene.tweens.killTweensOf(this.leftBustImage);
    this.scene.tweens.killTweensOf(this.rightBustImage);
    this.scene.tweens.killTweensOf(this.balloonContainer);

    this.container.setVisible(false);
    this.leftBustImage.setAlpha(0);
    this.rightBustImage.setAlpha(0);
    this.currentSpeakerSide = undefined;

    if (this.onCompleteCallback) {
      const cb = this.onCompleteCallback;
      this.onCompleteCallback = undefined;
      cb();
    }
  }

  public isDialogueActive(): boolean {
    return this.container.visible;
  }
}
