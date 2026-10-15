import Phaser from 'phaser';
import { BaseCharacter } from '../entities/characters/BaseCharacter';
import { VoidScythesWeapon } from '../entities/weapons/VoidScythesWeapon';
import { SoundManager } from '../systems/SoundManager';

export interface UpgradeCard {
  id: string;
  title: string;
  category: string;
  badgeColor: number;
  description: string;
  icon: string;
  apply: (player: BaseCharacter, gameScene: any) => void;
  isAvailable?: (player: BaseCharacter, gameScene: any) => boolean;
}

export class UpgradeScene extends Phaser.Scene {
  private player!: BaseCharacter;
  private gameScene!: any;

  constructor() {
    super('UpgradeScene');
  }

  create(data: { player: BaseCharacter; gameScene: any }): void {
    this.player = data.player;
    this.gameScene = data.gameScene;

    // Toca fanfarra mágica de Level Up
    SoundManager.getInstance().playLevelUp();

    const { width, height } = this.scale;
    const pixelFont = "'Silkscreen', 'Press Start 2P', monospace";

    // 1. Overlay sombrio de fundo com faixas angulares Persona 5
    const overlay = this.add.graphics();
    overlay.fillStyle(0x0a0205, 0.88);
    overlay.fillRect(0, 0, width, height);

    // Faixas estilizadas de quadrinhos no fundo
    overlay.fillStyle(0x20050e, 0.45);
    overlay.beginPath();
    overlay.moveTo(0, height * 0.2);
    overlay.lineTo(width, height * 0.1);
    overlay.lineTo(width, height * 0.4);
    overlay.lineTo(0, height * 0.5);
    overlay.closePath();
    overlay.fill();

    overlay.beginPath();
    overlay.moveTo(0, height * 0.65);
    overlay.lineTo(width, height * 0.55);
    overlay.lineTo(width, height * 0.85);
    overlay.lineTo(0, height * 0.95);
    overlay.closePath();
    overlay.fill();

    // 2. Banner de Título Superior
    const titleY = 70;
    const titleBox = this.add.graphics();
    titleBox.fillStyle(0x000000, 0.95);
    titleBox.fillRect(width / 2 - 280, titleY - 24, 560, 48);
    titleBox.lineStyle(2, 0xc59b27, 1);
    titleBox.strokeRect(width / 2 - 280, titleY - 24, 560, 48);
    titleBox.lineStyle(1, 0xffffff, 0.8);
    titleBox.strokeRect(width / 2 - 277, titleY - 21, 554, 42);

    this.add.text(width / 2, titleY, '★ LEVEL UP! // ESCOLHA UMA BÊNÇÃO ★', {
      fontFamily: pixelFont,
      fontSize: '15px',
      fontStyle: 'bold',
      color: '#f3d17a',
      stroke: '#2b0914',
      strokeThickness: 3
    }).setOrigin(0.5);

    // 3. Catálogo de Cartas Disponíveis
    const availableCards = this.getAvailableCards();
    const chosenCards = this.pickRandomCards(availableCards, 3);

    // 4. Renderização das 3 Cartas
    const cardW = 260;
    const cardH = 360;
    const spacing = 36;
    const totalW = chosenCards.length * cardW + (chosenCards.length - 1) * spacing;
    const startX = width / 2 - totalW / 2 + cardW / 2;
    const cardY = height / 2 + 25;

    chosenCards.forEach((card, index) => {
      const cx = startX + index * (cardW + spacing);
      this.createCard(cx, cardY, cardW, cardH, card, index);
    });
  }

  private getAvailableCards(): UpgradeCard[] {
    const hasVoidScythes = this.gameScene.weapons && this.gameScene.weapons.some(
      (w: any) => w instanceof VoidScythesWeapon
    );

    const catalog: UpgradeCard[] = [
      {
        id: 'multishot',
        title: 'ALMA EXTRA',
        category: 'BÊNÇÃO DE TIRO',
        badgeColor: 0x00f5d4,
        icon: '🔮',
        description: '+1 Projétil Simultâneo\n\nDispara mais uma esfera mística a cada rajada.',
        apply: (player) => {
          player.extraProjectiles += 1;
        }
      },
      {
        id: 'pierce',
        title: 'PERFURAÇÃO MÍSTICA',
        category: 'BÊNÇÃO DE TIRO',
        badgeColor: 0x9b5de5,
        icon: '⚡',
        description: '+1 Perfuração\n\nSeus tiros atravessam mais um monstro antes de dissipar.',
        apply: (player) => {
          player.extraPierce += 1;
        }
      },
      {
        id: 'damage',
        title: 'FÚRIA INFERNAL',
        category: 'ATRIBUTO PASSIVO',
        badgeColor: 0xd90429,
        icon: '🔥',
        description: '+25% Dano Global\n\nAumenta a força destrutiva de todas as armas equipadas.',
        apply: (player) => {
          player.bonusDamagePercent += 25;
        }
      },
      {
        id: 'speed',
        title: 'CELERIDADE ABISSAL',
        category: 'MOBILIDADE',
        badgeColor: 0xffb703,
        icon: '👟',
        description: '+15% Velocidade\n\nPassos e sprint acelerados para escapar de enxames.',
        apply: (player) => {
          player.bonusSpeedPercent += 15;
        }
      },
      {
        id: 'stamina',
        title: 'PULMÕES DO DEMÔNIO',
        category: 'RESISTÊNCIA',
        badgeColor: 0x06d6a0,
        icon: '🫁',
        description: '+30 Estamina Máxima\n\nCorra por mais tempo e recarregue fôlego mais rápido.',
        apply: (player) => {
          player.maxStamina += 30;
          player.currentStamina = player.maxStamina;
          player.bonusStaminaPercent += 20;
        }
      },
      {
        id: 'magnet',
        title: 'ÍMÃ DE ALMAS',
        category: 'UTILIDADE',
        badgeColor: 0x3a86ff,
        icon: '🧲',
        description: '+50% Raio de Coleta\n\nAtrai gemas de alma caídas a distâncias muito maiores.',
        apply: (player) => {
          player.bonusPickupRadiusPercent += 50;
        }
      },
      {
        id: 'vitality',
        title: 'VITALIDADE SANGRENTA',
        category: 'SOBREVIVÊNCIA',
        badgeColor: 0xff0054,
        icon: '🩸',
        description: '+25 Vida Máxima\n\nCura 40 HP na hora e expande sua resistência vital.',
        apply: (player) => {
          player.maxHp += 25;
          player.heal(40);
        }
      }
    ];

    // Adiciona a arma nova "LÂMINAS ORBITAIS" se ainda não foi escolhida
    if (!hasVoidScythes) {
      catalog.unshift({
        id: 'void_scythes',
        title: 'LÂMINAS ORBITAIS',
        category: 'NOVA ARMA SECUNDÁRIA',
        badgeColor: 0xf72585,
        icon: '⚔️',
        description: 'Foices Místicas em Órbita\n\nDuas foices giram ao redor da Nixy fatiando monstros!',
        apply: (player, gameScene) => {
          const scythes = new VoidScythesWeapon(gameScene, player);
          gameScene.weapons.push(scythes);
        }
      });
    }

    return catalog;
  }

  private pickRandomCards(cards: UpgradeCard[], count: number): UpgradeCard[] {
    const shuffled = [...cards].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  }

  private createCard(
    x: number,
    y: number,
    w: number,
    h: number,
    card: UpgradeCard,
    index: number
  ): void {
    const pixelFont = "'Silkscreen', 'Press Start 2P', monospace";

    const container = this.add.container(x, y + 40);
    container.setAlpha(0);

    // Animação de entrada suave com delay cascata
    this.tweens.add({
      targets: container,
      y: y,
      alpha: 1,
      duration: 260,
      delay: index * 90,
      ease: 'Back.easeOut'
    });

    const bg = this.add.graphics();
    const drawCardBg = (hover: boolean) => {
      bg.clear();

      // Fundo principal estilo Persona Noir (preto com veludo)
      bg.fillStyle(hover ? 0x22050f : 0x110207, 0.96);
      bg.fillRoundedRect(-w / 2, -h / 2, w, h, 10);

      // Borda Chanfrada Externa
      bg.lineStyle(hover ? 3 : 2, hover ? 0xffffff : 0xc59b27, 1);
      bg.strokeRoundedRect(-w / 2, -h / 2, w, h, 10);

      // Filete Interno Dourado
      bg.lineStyle(1, hover ? 0xf3d17a : 0x7a5b18, 0.8);
      bg.strokeRoundedRect(-w / 2 + 4, -h / 2 + 4, w - 8, h - 8, 8);

      // Tag de Categoria
      bg.fillStyle(card.badgeColor, hover ? 1 : 0.85);
      bg.fillRoundedRect(-w / 2 + 16, -h / 2 + 16, w - 32, 24, 4);
    };
    drawCardBg(false);
    container.add(bg);

    // Texto da Categoria
    const categoryText = this.add.text(0, -h / 2 + 28, card.category, {
      fontFamily: pixelFont,
      fontSize: '9px',
      fontStyle: 'bold',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 2
    }).setOrigin(0.5);
    container.add(categoryText);

    // Ícone da Carta
    const iconText = this.add.text(0, -h / 2 + 85, card.icon, {
      fontSize: '44px'
    }).setOrigin(0.5);
    container.add(iconText);

    // Título da Carta
    const titleText = this.add.text(0, -h / 2 + 145, card.title, {
      fontFamily: pixelFont,
      fontSize: '13px',
      fontStyle: 'bold',
      color: '#ffffff',
      align: 'center',
      wordWrap: { width: w - 30 }
    }).setOrigin(0.5);
    container.add(titleText);

    // Divisória Dourada
    const divider = this.add.graphics();
    divider.lineStyle(1, 0xc59b27, 0.8);
    divider.lineBetween(-w / 2 + 25, -h / 2 + 172, w / 2 - 25, -h / 2 + 172);
    container.add(divider);

    // Descrição
    const descText = this.add.text(0, -h / 2 + 235, card.description, {
      fontFamily: pixelFont,
      fontSize: '10px',
      color: '#e2d4c9',
      align: 'center',
      lineSpacing: 5,
      wordWrap: { width: w - 36 }
    }).setOrigin(0.5);
    container.add(descText);

    // Botão de Selecionar Inferior
    const btnBg = this.add.graphics();
    const drawBtn = (hover: boolean) => {
      btnBg.clear();
      btnBg.fillStyle(hover ? 0xc59b27 : 0x2b0610, 1);
      btnBg.fillRoundedRect(-w / 2 + 20, h / 2 - 50, w - 40, 32, 6);
      btnBg.lineStyle(1.5, hover ? 0xffffff : 0xf3d17a, 1);
      btnBg.strokeRoundedRect(-w / 2 + 20, h / 2 - 50, w - 40, 32, 6);
    };
    drawBtn(false);
    container.add(btnBg);

    const btnText = this.add.text(0, h / 2 - 34, 'ESCOLHER', {
      fontFamily: pixelFont,
      fontSize: '11px',
      fontStyle: 'bold',
      color: '#f3d17a'
    }).setOrigin(0.5);
    container.add(btnText);

    // Interatividade da Carta
    const hitArea = new Phaser.Geom.Rectangle(-w / 2, -h / 2, w, h);
    container.setInteractive(hitArea, Phaser.Geom.Rectangle.Contains);

    container.on('pointerover', () => {
      SoundManager.getInstance().playMenuHover();
      drawCardBg(true);
      drawBtn(true);
      btnText.setColor('#000000');
      titleText.setColor('#f3d17a');
      this.tweens.add({
        targets: container,
        scaleX: 1.04,
        scaleY: 1.04,
        duration: 120,
        ease: 'Quad.easeOut'
      });
    });

    container.on('pointerout', () => {
      drawCardBg(false);
      drawBtn(false);
      btnText.setColor('#f3d17a');
      titleText.setColor('#ffffff');
      this.tweens.add({
        targets: container,
        scaleX: 1.0,
        scaleY: 1.0,
        duration: 120,
        ease: 'Quad.easeOut'
      });
    });

    container.on('pointerdown', () => {
      SoundManager.getInstance().playMenuClick();
      // 1. Aplica o upgrade
      card.apply(this.player, this.gameScene);

      // 2. Feedback visual de flash branco
      bg.fillStyle(0xffffff, 1);
      bg.fillRoundedRect(-w / 2, -h / 2, w, h, 10);

      this.time.delayedCall(120, () => {
        // 3. Fecha a tela de upgrade e despausa o jogo
        this.scene.stop('UpgradeScene');
        this.gameScene.scene.resume();
      });
    });
  }
}
