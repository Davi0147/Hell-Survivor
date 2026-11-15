import Phaser from 'phaser';
import { SoundManager } from '../systems/SoundManager';
import type { UpgradeCard, UpgradeGameScene } from '../systems/UpgradeCatalog';
import type { BaseCharacter } from '../entities/characters/BaseCharacter';

/** O que a roleta usa da GameScene: pausar/retomar e dar a imunidade de saída. */
export type IChestRouletteGameScene = UpgradeGameScene & {
  isGameOver?: boolean;
  isChapterCompleted?: boolean;
  grantChestSafetyGrace?: () => void;
};

/** Modal da roleta de bênção do Baú do Abismo (instância por UIScene). */
export class ChestRouletteModal {
  /** Verdadeiro enquanto a roleta está na tela (bloqueia pausa e level up). */
  public isOpen = false;
  /** Ação de "pular/coletar" usada pelo bot [F3]; nula quando fechada. */
  public resolver: (() => void) | null = null;

  constructor(private readonly ui: Phaser.Scene) {}

  public resolve(): void {
    if (this.resolver) this.resolver();
  }

  /**
   * Roleta Minimalista de Bênçãos do Baú do Abismo:
   * Sem painéis pesados, caixas ou bordas geométricas.
   * Os nomes sobem continuamente na vertical com estalos satisfatórios (playRouletteTick),
   * desaceleram, e revelam a bênção com fanfarra de prêmio (playRouletteJackpot),
   * "BÊNÇÃO CONCEDIDA" no topo, descrição limpa e prompt sutil de coleta.
   */
  public show(availableCards: UpgradeCard[], player: BaseCharacter, gameScene: IChestRouletteGameScene | null): void {
    const s = this.ui;
    const { width, height } = s.scale;
    const pixelFont = "'Silkscreen', 'Press Start 2P', monospace";

    // 1. Pausa total do GameScene (física e loop de atualização para impedir spawns acumulados)
    this.isOpen = true;
    if (gameScene) {
      if (gameScene.physics) gameScene.physics.pause();
      if (gameScene.scene) gameScene.scene.pause();
    }

    const modal = s.add.container(0, 0);
    modal.setDepth(3400);

    // 2. Fundo escuro suave translúcido (sem caixas ou molduras)
    const backdrop = s.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.78);
    backdrop.setInteractive({ useHandCursor: true });
    modal.add(backdrop);

    const centerX = width / 2;
    const centerY = height / 2;

    // Ícone do Baú flutuante no topo
    let chestSprite: Phaser.GameObjects.Image | undefined;
    if (s.textures.exists('item-chest')) {
      chestSprite = s.add.image(centerX, centerY - 82, 'item-chest');
      chestSprite.setScale(1.4);
      modal.add(chestSprite);

      s.tweens.add({
        targets: chestSprite,
        y: chestSprite.y - 6,
        duration: 480,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
    }

    // Texto superior de status ("BÊNÇÃO CONCEDIDA" ou "SORTEANDO BÊNÇÃO...")
    const headerText = s.add.text(centerX, centerY - 40, 'SORTEANDO BÊNÇÃO...', {
      fontFamily: pixelFont,
      fontSize: '11px',
      fontStyle: 'bold',
      color: '#ff4d6d',
      letterSpacing: 2
    }).setOrigin(0.5);
    modal.add(headerText);

    // Container dedicado onde os nomes vão subir
    const reelContainer = s.add.container(centerX, centerY);
    modal.add(reelContainer);

    // Texto descritivo breve
    const descText = s.add.text(centerX, centerY + 40, '', {
      fontFamily: pixelFont,
      fontSize: '10px',
      color: '#e2e8f0',
      align: 'center',
      wordWrap: { width: Math.min(width - 60, 460) }
    }).setOrigin(0.5).setVisible(false);
    modal.add(descText);

    // Texto minimalista de coleta (sem formas nem quadrados ao redor!)
    const collectPrompt = s.add.text(centerX, centerY + 86, '[ COLETAR BÊNÇÃO ]', {
      fontFamily: pixelFont,
      fontSize: '12px',
      fontStyle: 'bold',
      color: '#f3d17a',
      stroke: '#000000',
      strokeThickness: 2
    }).setOrigin(0.5).setVisible(false);
    collectPrompt.setInteractive({ useHandCursor: true });
    modal.add(collectPrompt);

    const keyHint = s.add.text(centerX, centerY + 106, '(ou pressione Espaço)', {
      fontFamily: pixelFont,
      fontSize: '8px',
      color: '#64748b'
    }).setOrigin(0.5).setVisible(false);
    modal.add(keyHint);

    // Animação de pulso suave no texto de coleta
    s.tweens.add({
      targets: collectPrompt,
      alpha: 0.6,
      duration: 550,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    collectPrompt.on('pointerover', () => {
      collectPrompt.setColor('#ffffff');
      SoundManager.getInstance().playMenuHover();
    });
    collectPrompt.on('pointerout', () => {
      collectPrompt.setColor('#f3d17a');
    });

    // Lista de nomes para a animação da roleta
    const dummyNames = [
      'LÂMINAS ORBITAIS',
      'ADAGAS DE SANGUE',
      'CADEIAS ABISSAIS',
      'METEORO INFERNAL',
      'FÚRIA INFERNAL',
      'PULMÕES DO DEMÔNIO',
      'ALMA EXTRA',
      'PERFURAÇÃO MÍSTICA',
      'CELERIDADE ABISSAL',
      'ÍMÃ DE ALMAS',
      'VITALIDADE SANGRENTA',
      'DRENO VITAL',
      'REGENERAÇÃO SOMBRIA'
    ];

    const pool = availableCards.length > 0 ? availableCards : [];
    const evoCards = pool.filter((c) => c.isEvolution);
    const chosenCard =
      evoCards.length > 0
        ? Phaser.Math.RND.pick(evoCards)
        : pool.length > 0
          ? Phaser.Math.RND.pick(pool)
          : null;

    // Curva de desaceleração (14 passos progressivos simulando carretel de slot)
    const stepDelays = [40, 45, 50, 55, 65, 75, 90, 110, 140, 180, 230, 290, 370, 480];
    let stepIndex = 0;
    let currentSlotText: Phaser.GameObjects.Text | null = null;
    let rollTimer: Phaser.Time.TimerEvent | null = null;
    let isFinishedRolling = false;
    let canCollectAt = 0;
    let collected = false;

    const revealPrizeNow = () => {
      if (collected || isFinishedRolling) return;
      isFinishedRolling = true;
      canCollectAt = Date.now() + 180;

      if (rollTimer) {
        rollTimer.destroy();
        rollTimer = null;
      }

      // Interrompe tweens e limpa textos anteriores da roleta
      s.tweens.killTweensOf(reelContainer);
      if (currentSlotText && currentSlotText.scene) {
        s.tweens.killTweensOf(currentSlotText);
      }
      reelContainer.removeAll(true);
      currentSlotText = null;

      // Cria o texto definitivo no centro (0, 0)
      const finalDisplayName = chosenCard ? chosenCard.title : 'RESTAURAÇÃO TOTAL';
      const prizeText = s.add.text(0, 0, finalDisplayName, {
        fontFamily: pixelFont,
        fontSize: '18px',
        fontStyle: 'bold',
        color: '#ffe600',
        stroke: '#000000',
        strokeThickness: 4
      }).setOrigin(0.5);
      reelContainer.add(prizeText);

      // Fanfarra triunfante e flash de câmera
      SoundManager.getInstance().playRouletteJackpot();
      if (s.cameras && s.cameras.main) {
        s.cameras.main.flash(220, 255, 215, 0);
      }

      // Altera o cabeçalho superior para "BÊNÇÃO CONCEDIDA"
      if (headerText.scene) {
        headerText.setText('BÊNÇÃO CONCEDIDA').setColor('#00f5d4');
      }

      // Formata descrição limpa
      let cleanDesc: string;
      if (chosenCard) {
        cleanDesc = chosenCard.description
          .replace(/\n\n/g, ' — ')
          .replace(/\n/g, ' ');
      } else {
        cleanDesc = 'Sua vitalidade foi 100% regenerada pelo fogo abissal.';
      }
      if (descText.scene) {
        descText.setText(cleanDesc).setVisible(true).setAlpha(1).setY(centerY + 36);
      }

      // Exibe botões/prompts de confirmação e coleta
      if (collectPrompt.scene) {
        collectPrompt.setVisible(true).setAlpha(1);
      }
      if (keyHint.scene) {
        keyHint.setText('(ou pressione Espaço / clique na tela)').setVisible(true).setAlpha(1);
      }
    };

    const rollNextName = () => {
      if (collected || isFinishedRolling || !modal.scene || !headerText.scene) return;

      const isFinal = stepIndex >= stepDelays.length;
      if (isFinal) {
        revealPrizeNow();
        return;
      }

      // Nome a ser exibido neste passo
      const displayName = pool.length > 0
        ? Phaser.Math.RND.pick(pool).title
        : Phaser.Math.RND.pick(dummyNames);

      // Novo texto nascendo de baixo (+28px)
      const nextSlotText = s.add.text(0, 28, displayName, {
        fontFamily: pixelFont,
        fontSize: '15px',
        fontStyle: 'bold',
        color: '#ffd700',
        stroke: '#000000',
        strokeThickness: 3
      }).setOrigin(0.5);
      nextSlotText.setAlpha(0);
      reelContainer.add(nextSlotText);

      const animDuration = Math.max(30, stepDelays[stepIndex] * 0.75);

      // O texto atual sobe (-28px) e desaparece
      if (currentSlotText && currentSlotText.active) {
        const oldText = currentSlotText;
        s.tweens.add({
          targets: oldText,
          y: -28,
          alpha: 0,
          duration: animDuration,
          ease: 'Quad.easeOut',
          onComplete: () => {
            if (oldText.scene) oldText.destroy();
          }
        });
      }

      // O novo texto sobe para o centro (0) e ganha opacidade
      s.tweens.add({
        targets: nextSlotText,
        y: 0,
        alpha: 1,
        duration: animDuration,
        ease: 'Quad.easeOut'
      });

      currentSlotText = nextSlotText;

      // Toca o barulhinho satisfatório de clique místico
      const pitchProgress = 0.95 + (stepIndex / stepDelays.length) * 0.35;
      SoundManager.getInstance().playRouletteTick(pitchProgress);

      const delay = stepDelays[stepIndex];
      stepIndex++;
      rollTimer = s.time.delayedCall(delay, rollNextName);
    };

    // Finalização e Coleta com suporte a pular (skip) e confirmação em qualquer área
    const finalizeCollection = () => {
      if (collected) return;
      collected = true;

      if (rollTimer) {
        rollTimer.destroy();
        rollTimer = null;
      }

      window.removeEventListener('keydown', onKey);
      this.resolver = null;
      SoundManager.getInstance().playMenuClick();

      // Aplica a bênção
      if (chosenCard && gameScene) {
        chosenCard.apply(player, gameScene);
      } else {
        player.heal(player.maxHp);
      }

      // Fecha o modal e retoma o jogo com imunidade de proteção
      this.isOpen = false;
      modal.destroy();
      if (gameScene && !gameScene.isGameOver && !gameScene.isChapterCompleted) {
        if (gameScene.scene) gameScene.scene.resume();
        if (gameScene.physics) gameScene.physics.resume();
        if (typeof gameScene.grantChestSafetyGrace === 'function') {
          gameScene.grantChestSafetyGrace();
        }
      }
    };

    const handleInteraction = () => {
      if (collected) return;
      if (!isFinishedRolling) {
        // Se ainda estiver girando, pula a animação diretamente para o prêmio sorteado
        revealPrizeNow();
        return;
      }
      // Anti-missclick / debounce curto para não coletar sem o jogador ver
      if (Date.now() < canCollectAt) {
        return;
      }
      finalizeCollection();
    };

    // Interações: botão dedicado, clique no fundo escuro (fora), e bot autônomo [F3]
    collectPrompt.on('pointerdown', handleInteraction);
    backdrop.on('pointerdown', handleInteraction);
    this.resolver = handleInteraction;

    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'Enter') {
        handleInteraction();
      }
    };
    window.addEventListener('keydown', onKey);

    // Garante limpeza caso o modal seja destruído por shutdown da cena
    modal.once(Phaser.GameObjects.Events.DESTROY, () => {
      window.removeEventListener('keydown', onKey);
      if (rollTimer) {
        rollTimer.destroy();
        rollTimer = null;
      }
      if (this.resolver === handleInteraction) {
        this.resolver = null;
      }
      this.isOpen = false;
    });

    // Inicia o primeiro giro após breve suspense (100ms)
    rollTimer = s.time.delayedCall(100, rollNextName);
  }
}
