import Phaser from 'phaser';
import { BaseCharacter } from '../entities/characters/BaseCharacter';
import { SoulBoltWeapon } from '../entities/weapons/SoulBoltWeapon';
import { VoidScythesWeapon } from '../entities/weapons/VoidScythesWeapon';
import { HellfireAuraWeapon } from '../entities/weapons/HellfireAuraWeapon';
import { BloodDaggersWeapon } from '../entities/weapons/BloodDaggersWeapon';
import { AbyssalChainsWeapon } from '../entities/weapons/AbyssalChainsWeapon';
import { InfernalMeteorWeapon } from '../entities/weapons/InfernalMeteorWeapon';
import { SoundManager } from '../systems/SoundManager';
import { GamepadManager } from '../systems/GamepadManager';
import { AutoPlayTestAgent } from '../systems/AutoPlayTestAgent';

export interface RichTextSegment {
  text: string;
  color: string;
}

export interface UpgradeCard {
  id: string;
  title: string;
  category: string;
  badgeColor: number;
  description: string;
  icon: string;
  isEvolution?: boolean;
  // Novos campos visuais das Cartas Arcanas (120x200px)
  cardSpriteKey?: string;
  rarityLabel?: string;
  rarityColor?: string;
  cardName?: string;
  cardNameColor?: string;
  levelLabel?: string;
  glowColor?: number;
  richLines?: RichTextSegment[][];
  apply: (player: BaseCharacter, gameScene: any) => void;
  isAvailable?: (player: BaseCharacter, gameScene: any) => boolean;
}

// Paleta semântica padronizada para leitura imediata nas cartas
const C_WHITE   = '#ffffff';
const C_WEAPON  = '#9b5de5'; // Roxo místico para nomes de armas/habilidades (idêntico ao exemplo FOICE)
const C_DAMAGE  = '#ff3333'; // Vermelho vivo para informações de Dano / Ataque
const C_LIFE    = '#2ecc71'; // Verde esmeralda para Vida / Cura / Regeneração / Roubo de Vida
const C_SPEED   = '#38bdf8'; // Azul ciano para Velocidade / Estamina / Cadência / Controle
const C_UTILITY = '#fbbf24'; // Dourado para Quantidades / Projéteis / Alcance / Perfuração
const C_EVO     = '#ffe600'; // Ouro radiante para Evoluções Supremas

export interface UpgradeSceneData {
  player: BaseCharacter;
  gameScene: any;
  isAltar?: boolean;
  onAltarChosen?: () => void;
}

export class UpgradeScene extends Phaser.Scene {
  private player!: BaseCharacter;
  private gameScene!: any;
  private isAltar: boolean = false;
  private onAltarChosen?: () => void;
  private cardContainers: Phaser.GameObjects.Container[] = [];
  private currentCardIds: string[] = [];
  private selectedCardIndex: number = 0;
  private rerollBtnContainer?: Phaser.GameObjects.Container;
  private rerollText?: Phaser.GameObjects.Text;
  private rerollBg?: Phaser.GameObjects.Graphics;
  private isClosing: boolean = false;

  public getCardContainers(): Phaser.GameObjects.Container[] {
    return this.cardContainers;
  }

  public getIsClosing(): boolean {
    return this.isClosing;
  }

  public getPlayer(): BaseCharacter {
    return this.player;
  }

  public getGameScene(): any {
    return this.gameScene;
  }

  public getIsAltar(): boolean {
    return this.isAltar;
  }

  private readonly cardFont = "'Pixelzone', 'Silkscreen', monospace";
  private readonly uiFont = "'Silkscreen', 'Press Start 2P', monospace";

  constructor() {
    super('UpgradeScene');
  }

  create(data: UpgradeSceneData): void {
    this.player = data.player;
    this.gameScene = data.gameScene;
    this.isAltar = !!data.isAltar;
    this.onAltarChosen = data.onAltarChosen;
    this.cardContainers = [];
    this.currentCardIds = [];
    this.isClosing = false;

    // Toca fanfarra viciante estilo Cassino / Arcade Slot ao abrir as cartas
    SoundManager.getInstance().playCasinoLevelUp();

    const { width, height } = this.scale;

    // 1. Overlay sombrio de fundo com vinheta dramática
    const overlay = this.add.graphics();
    overlay.fillStyle(0x060205, 0.86);
    overlay.fillRect(0, 0, width, height);

    // Faixas diagonais sutis no fundo
    overlay.fillStyle(0x1c040d, 0.4);
    overlay.beginPath();
    overlay.moveTo(0, height * 0.18);
    overlay.lineTo(width, height * 0.08);
    overlay.lineTo(width, height * 0.36);
    overlay.lineTo(0, height * 0.46);
    overlay.closePath();
    overlay.fill();

    overlay.beginPath();
    overlay.moveTo(0, height * 0.64);
    overlay.lineTo(width, height * 0.54);
    overlay.lineTo(width, height * 0.84);
    overlay.lineTo(0, height * 0.94);
    overlay.closePath();
    overlay.fill();

    // 2. Banner de Título Superior
    const titleY = 46;
    const titleBox = this.add.graphics();
    titleBox.fillStyle(0x080206, 0.95);
    titleBox.fillRoundedRect(width / 2 - 270, titleY - 20, 540, 40, 6);
    titleBox.lineStyle(2, this.isAltar ? 0xff4500 : 0xc59b27, 1);
    titleBox.strokeRoundedRect(width / 2 - 270, titleY - 20, 540, 40, 6);

    const titleText = this.isAltar
      ? 'ALTAR DOS ANCESTRAIS // ASCENSÃO SUPREMA'
      : 'LEVEL UP! // ESCOLHA SUA CARTA';
    const titleColor = this.isAltar ? '#ffe600' : '#f3d17a';

    this.add.text(width / 2, titleY, titleText, {
      fontFamily: this.uiFont,
      fontSize: '14px',
      fontStyle: 'bold',
      color: titleColor,
      stroke: '#2b0914',
      strokeThickness: 3
    }).setOrigin(0.5);

    // 3. Renderização das Cartas Flutuantes
    this.dealCards(false);

    // 4. Barra Tática Inferior: Botões de Re-rolar e Pular (apenas no Level-Up)
    this.createTacticalFooter(width, height, this.uiFont);

    // 5. Atalhos de Teclado (R para Re-rolar, Espaço para Canalizar/Skip)
    const onKeyDownR = () => {
      this.handleReroll();
    };
    const onKeyDownSpace = () => {
      this.handleSkipAndHeal();
    };

    if (!this.isAltar && this.input.keyboard) {
      this.input.keyboard.on('keydown-R', onKeyDownR);
      this.input.keyboard.on('keydown-SPACE', onKeyDownSpace);
    }

    // 6. Limpeza no Desligamento da Cena (DEC-006 / Anti-Leak)
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      if (this.input.keyboard) {
        this.input.keyboard.off('keydown-R', onKeyDownR);
        this.input.keyboard.off('keydown-SPACE', onKeyDownSpace);
        this.input.keyboard.removeAllListeners();
      }
    });
  }

  private dealCards(isReroll: boolean): void {
    const { width, height } = this.scale;

    for (const c of this.cardContainers) {
      c.destroy();
    }
    this.cardContainers = [];

    let chosenCards: UpgradeCard[] = [];
    if (this.isAltar) {
      const availableCards = UpgradeScene.getAltarEvolutionCards(this.player, this.gameScene);
      const shuffled = [...availableCards].sort(() => 0.5 - Math.random());
      chosenCards = shuffled.slice(0, Math.min(3, shuffled.length));
    } else {
      const availableCards = this.getAvailableCards();
      chosenCards = this.pickRandomCards(availableCards, 3, isReroll ? this.currentCardIds : []);
    }
    this.currentCardIds = chosenCards.map((c) => c.id);

    // Cada carta 120x200 escalada em 2.2x = 264x440
    const cardScale = 2.2;
    const cardW = Math.round(120 * cardScale); // 264px
    const cardH = Math.round(200 * cardScale); // 440px
    const spacing = 52;
    const totalW = chosenCards.length * cardW + (chosenCards.length - 1) * spacing;
    const startX = width / 2 - totalW / 2 + cardW / 2;
    const cardY = Math.round(height / 2 + 2);

    chosenCards.forEach((card, index) => {
      const cx = Math.round(startX + index * (cardW + spacing));
      this.createCard(cx, cardY, cardW, cardH, cardScale, card, index);
    });

    this.selectedCardIndex = 0;
    if (this.cardContainers[0]) {
      this.cardContainers[0].emit('pointerover');
    }
  }

  private createTacticalFooter(width: number, height: number, pixelFont: string): void {
    const footerY = height - 36;

    if (this.isAltar) {
      this.add.text(width / 2, footerY, '[ TOQUE OU CLIQUE EM UMA DAS CARTAS PARA DESPERTAR SEU PODER MÁXIMO ]', {
        fontFamily: pixelFont,
        fontSize: '10px',
        fontStyle: 'bold',
        color: '#ffe600',
        stroke: '#000000',
        strokeThickness: 2.5
      }).setOrigin(0.5);
      return;
    }

    // --- BOTÃO 1: RE-ROLAR BÊNÇÃOS ---
    const rerollW = 270;
    const rerollH = 34;
    const rerollX = width / 2 - 155;

    this.rerollBtnContainer = this.add.container(rerollX, footerY);
    this.rerollBg = this.add.graphics();
    this.rerollBtnContainer.add(this.rerollBg);

    this.rerollText = this.add.text(0, 0, '', {
      fontFamily: pixelFont,
      fontSize: '10px',
      fontStyle: 'bold',
      color: '#00f5d4',
      stroke: '#000000',
      strokeThickness: 2
    }).setOrigin(0.5);
    this.rerollBtnContainer.add(this.rerollText);

    this.updateRerollButtonVisual(false);

    const rerollHit = new Phaser.Geom.Rectangle(-rerollW / 2, -rerollH / 2, rerollW, rerollH);
    this.rerollBtnContainer.setInteractive(rerollHit, Phaser.Geom.Rectangle.Contains);

    this.rerollBtnContainer.on('pointerover', () => {
      if (this.player.rerollsRemaining <= 0 || this.isClosing) return;
      SoundManager.getInstance().playCardHover();
      this.updateRerollButtonVisual(true);
    });

    this.rerollBtnContainer.on('pointerout', () => {
      this.updateRerollButtonVisual(false);
    });

    this.rerollBtnContainer.on('pointerdown', () => {
      this.handleReroll();
    });

    // --- BOTÃO 2: PULAR / CANALIZAR ALMAS (+20 HP) ---
    const skipW = 270;
    const skipH = 34;
    const skipX = width / 2 + 155;

    const skipContainer = this.add.container(skipX, footerY);
    const skipBg = this.add.graphics();

    const drawSkipBg = (hover: boolean) => {
      skipBg.clear();
      skipBg.fillStyle(hover ? 0x3b0918 : 0x16040a, 0.95);
      skipBg.fillRoundedRect(-skipW / 2, -skipH / 2, skipW, skipH, 6);
      skipBg.lineStyle(1.5, hover ? 0xff4d6d : 0x9d0208, 1);
      skipBg.strokeRoundedRect(-skipW / 2, -skipH / 2, skipW, skipH, 6);
    };
    drawSkipBg(false);
    skipContainer.add(skipBg);

    const skipText = this.add.text(0, 0, '[ESPAÇO / (B)] CANALIZAR (+20 HP)', {
      fontFamily: pixelFont,
      fontSize: '10px',
      fontStyle: 'bold',
      color: '#ffb3c1',
      stroke: '#000000',
      strokeThickness: 2
    }).setOrigin(0.5);
    skipContainer.add(skipText);

    const skipHit = new Phaser.Geom.Rectangle(-skipW / 2, -skipH / 2, skipW, skipH);
    skipContainer.setInteractive(skipHit, Phaser.Geom.Rectangle.Contains);

    skipContainer.on('pointerover', () => {
      if (this.isClosing) return;
      SoundManager.getInstance().playCardHover();
      drawSkipBg(true);
      skipText.setColor('#ffffff');
    });

    skipContainer.on('pointerout', () => {
      drawSkipBg(false);
      skipText.setColor('#ffb3c1');
    });

    skipContainer.on('pointerdown', () => {
      this.handleSkipAndHeal();
    });
  }

  private updateRerollButtonVisual(hover: boolean): void {
    if (!this.rerollBg || !this.rerollText) return;
    const rerollW = 270;
    const rerollH = 34;
    const hasCharges = this.player.rerollsRemaining > 0;

    this.rerollBg.clear();
    if (hasCharges) {
      this.rerollBg.fillStyle(hover ? 0x093145 : 0x051923, 0.95);
      this.rerollBg.fillRoundedRect(-rerollW / 2, -rerollH / 2, rerollW, rerollH, 6);
      this.rerollBg.lineStyle(1.5, hover ? 0xffffff : 0x00f5d4, 1);
      this.rerollBg.strokeRoundedRect(-rerollW / 2, -rerollH / 2, rerollW, rerollH, 6);
      this.rerollText.setText(`[R / (X)] RE-ROLAR CARTAS (${this.player.rerollsRemaining})`);
      this.rerollText.setColor(hover ? '#ffffff' : '#00f5d4');
    } else {
      this.rerollBg.fillStyle(0x111115, 0.75);
      this.rerollBg.fillRoundedRect(-rerollW / 2, -rerollH / 2, rerollW, rerollH, 6);
      this.rerollBg.lineStyle(1, 0x333340, 0.7);
      this.rerollBg.strokeRoundedRect(-rerollW / 2, -rerollH / 2, rerollW, rerollH, 6);
      this.rerollText.setText('RE-ROLAGENS ESGOTADAS (0)');
      this.rerollText.setColor('#555566');
    }
  }

  private handleReroll(): void {
    if (this.isClosing || this.player.rerollsRemaining <= 0) return;
    this.player.rerollsRemaining--;
    SoundManager.getInstance().playCasinoLevelUp();
    this.updateRerollButtonVisual(false);
    this.dealCards(true);
  }

  private handleSkipAndHeal(): void {
    if (this.isClosing) return;
    this.isClosing = true;
    SoundManager.getInstance().playMenuClick();
    this.player.heal(20);
    this.time.delayedCall(100, () => {
      this.scene.stop('UpgradeScene');
      this.gameScene.scene.resume();
      this.gameScene.physics.resume();
      if (typeof this.gameScene.checkAndOpenUpgradeScene === 'function') {
        this.gameScene.checkAndOpenUpgradeScene();
      }
    });
  }

  public static getAvailableUpgrades(player: BaseCharacter, gameScene: any): UpgradeCard[] {
    const weapons: any[] = gameScene.weapons || [];
    const dmgMult = 1 + (player.bonusDamagePercent || 0) / 100;

    const soulBoltWeapon = weapons.find((w) => w instanceof SoulBoltWeapon) as SoulBoltWeapon | undefined;
    const scythesWeapon = weapons.find((w) => w instanceof VoidScythesWeapon) as VoidScythesWeapon | undefined;
    const hellfireWeapon = weapons.find((w) => w instanceof HellfireAuraWeapon) as HellfireAuraWeapon | undefined;
    const daggersWeapon = weapons.find((w) => w instanceof BloodDaggersWeapon) as BloodDaggersWeapon | undefined;
    const chainsWeapon = weapons.find((w) => w instanceof AbyssalChainsWeapon) as AbyssalChainsWeapon | undefined;
    const meteorWeapon = weapons.find((w) => w instanceof InfernalMeteorWeapon) as InfernalMeteorWeapon | undefined;

    const catalog: UpgradeCard[] = [
      {
        id: 'multishot',
        title: 'ALMA EXTRA',
        category: 'BÊNÇÃO DE TIRO',
        badgeColor: 0x00f5d4,
        icon: '+TIRO',
        cardSpriteKey: 'card-mystic',
        rarityLabel: 'RARO',
        rarityColor: '#facc15',
        cardName: 'ALMA EXTRA',
        cardNameColor: C_UTILITY,
        levelLabel: `ATUAL: +${player.extraProjectiles}`,
        glowColor: 0xa855f7,
        description: '+1 Projétil Simultâneo\n\nDispara mais uma esfera ou lâmina a cada rajada.',
        richLines: [
          [{ text: 'ADICIONA ', color: C_WHITE }, { text: '+1 PROJÉTIL', color: C_UTILITY }],
          [{ text: 'EM TODAS AS RAJADAS', color: C_WHITE }],
          [{ text: 'DE ', color: C_WHITE }, { text: 'DISPAROS E ADAGAS', color: C_WEAPON }]
        ],
        apply: (p) => {
          p.extraProjectiles += 1;
        }
      },
      {
        id: 'pierce',
        title: 'PERFURAÇÃO MÍSTICA',
        category: 'BÊNÇÃO DE TIRO',
        badgeColor: 0x9b5de5,
        icon: 'PERF',
        cardSpriteKey: 'card-obsidian',
        rarityLabel: 'INCOMUM',
        rarityColor: '#c084fc',
        cardName: 'PERFURAÇÃO',
        cardNameColor: C_WEAPON,
        levelLabel: `ATUAL: +${player.extraPierce}`,
        glowColor: 0x9b5de5,
        description: '+1 Perfuração\n\nSeus tiros e adagas atravessam mais um monstro.',
        richLines: [
          [{ text: 'CONCEDE ', color: C_WHITE }, { text: '+1 PERFURAÇÃO', color: C_UTILITY }],
          [{ text: 'PARA ATRAVESSAR MAIS', color: C_WHITE }],
          [{ text: 'INIMIGOS COM ', color: C_WHITE }, { text: 'TIROS', color: C_WEAPON }]
        ],
        apply: (p) => {
          p.extraPierce += 1;
        }
      },
      {
        id: 'damage',
        title: 'FÚRIA INFERNAL',
        category: 'ATRIBUTO PASSIVO',
        badgeColor: 0xd90429,
        icon: 'FÚRIA',
        cardSpriteKey: 'card-fire',
        rarityLabel: 'RARO',
        rarityColor: '#facc15',
        cardName: 'FÚRIA',
        cardNameColor: C_DAMAGE,
        levelLabel: `BÔNUS: +${player.bonusDamagePercent + 25}%`,
        glowColor: 0xff4500,
        description: '+25% Dano Global\n\nAumenta a força destrutiva de todas as armas equipadas.',
        richLines: [
          [{ text: 'AUMENTA EM ', color: C_WHITE }, { text: '+25% O DANO', color: C_DAMAGE }],
          [{ text: 'DE TODAS AS SUAS', color: C_WHITE }],
          [{ text: 'ARMAS EQUIPADAS', color: C_WEAPON }]
        ],
        apply: (p) => {
          p.bonusDamagePercent += 25;
        }
      },
      {
        id: 'speed',
        title: 'CELERIDADE ABISSAL',
        category: 'MOBILIDADE',
        badgeColor: 0xffb703,
        icon: 'PASSOS',
        cardSpriteKey: 'card-ice',
        rarityLabel: 'COMUM',
        rarityColor: '#38bdf8',
        cardName: 'CELERIDADE',
        cardNameColor: C_SPEED,
        levelLabel: `BÔNUS: +${player.bonusSpeedPercent + 15}%`,
        glowColor: 0x38bdf8,
        description: '+15% Velocidade\n\nPassos e sprint acelerados para escapar de enxames.',
        richLines: [
          [{ text: 'GANHE ', color: C_WHITE }, { text: '+15% VELOCIDADE', color: C_SPEED }],
          [{ text: 'DE MOVIMENTO E CORRIDA', color: C_WHITE }],
          [{ text: 'CONTRA A HORDA', color: C_WHITE }]
        ],
        apply: (p) => {
          p.bonusSpeedPercent += 15;
        }
      },
      {
        id: 'stamina',
        title: 'PULMÕES DO DEMÔNIO',
        category: 'RESISTÊNCIA',
        badgeColor: 0x06d6a0,
        icon: 'VIGOR',
        cardSpriteKey: 'card-base',
        rarityLabel: 'COMUM',
        rarityColor: '#e2e8f0',
        cardName: 'VIGOR',
        cardNameColor: C_SPEED,
        levelLabel: `ESTAMINA: ${player.maxStamina + 30}`,
        glowColor: 0xa855f7,
        description: '+30 Estamina Máxima\n\nCorra por mais tempo e recarregue fôlego mais rápido.',
        richLines: [
          [{ text: 'RECEBA ', color: C_WHITE }, { text: '+30 ESTAMINA', color: C_SPEED }],
          [{ text: 'E ', color: C_WHITE }, { text: '+20% RECARGA', color: C_SPEED }, { text: ' DE', color: C_WHITE }],
          [{ text: 'FÔLEGO NO SPRINT', color: C_WHITE }]
        ],
        apply: (p) => {
          p.maxStamina += 30;
          p.currentStamina = p.maxStamina;
          p.bonusStaminaPercent += 20;
        }
      },
      {
        id: 'magnet',
        title: 'ÍMÃ DE ALMAS',
        category: 'UTILIDADE',
        badgeColor: 0x3a86ff,
        icon: 'ÍMÃ',
        cardSpriteKey: 'card-ice',
        rarityLabel: 'INCOMUM',
        rarityColor: '#38bdf8',
        cardName: 'ÍMÃ ASTRAL',
        cardNameColor: C_UTILITY,
        levelLabel: `RAIO: +${player.bonusPickupRadiusPercent + 50}%`,
        glowColor: 0x38bdf8,
        description: '+50% Raio de Coleta\n\nAtrai gemas de alma caídas a distâncias muito maiores.',
        richLines: [
          [{ text: 'AMPLIA ', color: C_WHITE }, { text: '+50% DO RAIO', color: C_UTILITY }],
          [{ text: 'PARA ATRAIR ', color: C_WHITE }, { text: 'GEMAS DE XP', color: C_SPEED }],
          [{ text: 'A LONGA DISTÂNCIA', color: C_WHITE }]
        ],
        apply: (p) => {
          p.bonusPickupRadiusPercent += 50;
        }
      },
      {
        id: 'vitality',
        title: 'VITALIDADE SANGRENTA',
        category: 'SOBREVIVÊNCIA',
        badgeColor: 0xff0054,
        icon: 'VIDA',
        cardSpriteKey: 'card-green',
        rarityLabel: 'INCOMUM',
        rarityColor: '#4ade80',
        cardName: 'VITALIDADE',
        cardNameColor: C_LIFE,
        levelLabel: `HP MÁX: ${player.maxHp + 25}`,
        glowColor: 0x2ecc71,
        description: '+25 Vida Máxima\n\nCura 40 HP na hora e expande sua resistência vital.',
        richLines: [
          [{ text: 'CONCEDE ', color: C_WHITE }, { text: '+25 VIDA MÁX', color: C_LIFE }],
          [{ text: 'E RESTAURA ', color: C_WHITE }, { text: '40 DE VIDA', color: C_LIFE }],
          [{ text: 'IMEDIATAMENTE', color: C_WHITE }]
        ],
        apply: (p) => {
          p.maxHp += 25;
          p.heal(40);
        }
      }
    ];

    // Passiva 1: Regeneração de Vida contínua (0.2/s até 0.8/s)
    if (player.hpRegenPerSec < 0.8) {
      const nextRegen = Math.min(0.8, Number((player.hpRegenPerSec + 0.2).toFixed(1)));
      const level = Math.round(nextRegen / 0.2);
      catalog.push({
        id: 'hp_regen',
        title: 'REGENERAÇÃO SOMBRIA',
        category: `SOBREVIVÊNCIA // NÍVEL ${level}/4`,
        badgeColor: 0x2ec4b6,
        icon: 'REGEN',
        cardSpriteKey: 'card-green',
        rarityLabel: 'RARO',
        rarityColor: '#4ade80',
        cardName: 'REGENERAÇÃO',
        cardNameColor: C_LIFE,
        levelLabel: `NÍVEL ${level}/4`,
        glowColor: 0x10b981,
        description: `+0.2 HP por Segundo (${nextRegen.toFixed(1)}/0.8)\n\nCura contínua de sangue infernal restaurando sua vitalidade.`,
        richLines: [
          [{ text: 'REGENERA ', color: C_WHITE }, { text: '+0.2 VIDA/SEG', color: C_LIFE }],
          [{ text: 'DE FORMA CONTÍNUA', color: C_WHITE }],
          [{ text: 'TOTAL: ', color: C_WHITE }, { text: `${nextRegen.toFixed(1)} HP/SEG`, color: C_LIFE }]
        ],
        apply: (p) => {
          p.hpRegenPerSec = nextRegen;
        }
      });
    }

    // Passiva 2: Roubo de Vida por Acerto (0.1 até 0.3 HP)
    if (player.lifeStealPerHit < 0.3) {
      const nextSteal = Math.min(0.3, Number((player.lifeStealPerHit + 0.1).toFixed(1)));
      const level = Math.round(nextSteal / 0.1);
      catalog.push({
        id: 'life_steal',
        title: 'DRENO VITAL',
        category: `SOBREVIVÊNCIA // NÍVEL ${level}/3`,
        badgeColor: 0x8338ec,
        icon: 'DRENO',
        cardSpriteKey: 'card-inferno',
        rarityLabel: 'ÉPICO',
        rarityColor: '#ff4d6d',
        cardName: 'DRENO VITAL',
        cardNameColor: C_LIFE,
        levelLabel: `NÍVEL ${level}/3`,
        glowColor: 0xef233c,
        description: `+0.1 HP Roubado por Golpe (${nextSteal.toFixed(1)}/0.3)\n\nRouba pequenas doses de vitalidade a cada acerto de suas armas.`,
        richLines: [
          [{ text: 'ROUBA ', color: C_WHITE }, { text: '+0.1 DE VIDA', color: C_LIFE }],
          [{ text: 'POR CADA GOLPE DAS', color: C_WHITE }],
          [{ text: 'ARMAS ', color: C_WEAPON }, { text: `(${nextSteal.toFixed(1)} HP/HIT)`, color: C_LIFE }]
        ],
        apply: (p) => {
          p.lifeStealPerHit = nextSteal;
        }
      });
    }

    // =========================================================================
    // ARMAS ATIVAS E SUAS MELHORIAS (NÍVEL 1 A 5/6)
    // =========================================================================

    // 0. DISPARO DE ALMAS (Soul Bolt - Nível 2 ao 5)
    if (soulBoltWeapon && !soulBoltWeapon.isEvolved && !soulBoltWeapon.isMaxLevel()) {
      const nextLvl = soulBoltWeapon.getLevel() + 1;
      const nextDmg = Math.round((25 + (nextLvl - 1) * 6) * dmgMult);
      catalog.unshift({
        id: 'soul_bolt_upgrade',
        title: 'DISPARO DE ALMAS',
        category: `MELHORIA // NÍVEL ${nextLvl}/5`,
        badgeColor: 0x00f5d4,
        icon: 'ALMAS',
        cardSpriteKey: 'card-mystic',
        rarityLabel: 'RARO',
        rarityColor: '#facc15',
        cardName: 'ALMAS',
        cardNameColor: C_WEAPON,
        levelLabel: `NÍVEL ${nextLvl}/5`,
        glowColor: 0x00f5d4,
        description: `+Dano Espiritual e +Cadência (Nív ${nextLvl}/5)\n\nAumenta a potência dos disparos astrais e a velocidade dos projéteis!`,
        richLines: [
          [{ text: 'POTENCIALIZA O ', color: C_WHITE }, { text: 'DISPARO DE ALMAS', color: C_WEAPON }],
          [{ text: 'CAUSANDO ', color: C_WHITE }, { text: `${nextDmg} DE DANO`, color: C_DAMAGE }],
          [{ text: 'E ', color: C_WHITE }, { text: '+VELOCIDADE', color: C_SPEED }, { text: ' DE PROJÉTIL', color: C_WHITE }]
        ],
        apply: () => {
          soulBoltWeapon.upgrade();
        }
      });
    }

    // 1. LÂMINAS ORBITAIS (Void Scythes / Foice)
    if (!scythesWeapon) {
      const scytheDmg = Math.round(28 * dmgMult);
      catalog.unshift({
        id: 'void_scythes',
        title: 'LÂMINAS ORBITAIS',
        category: 'NOVA ARMA // NÍVEL 1',
        badgeColor: 0xf72585,
        icon: 'FOICE',
        cardSpriteKey: 'card-gold',
        rarityLabel: 'RARO',
        rarityColor: '#facc15',
        cardName: 'FOICE',
        cardNameColor: C_WEAPON,
        levelLabel: 'NOVA ARMA',
        glowColor: 0xfacc15,
        description: `Foice Mística em Órbita\n\nVocê recebe uma foice que gira ao redor causando ${scytheDmg} de dano!`,
        richLines: [
          [{ text: 'VOCÊ RECEBE UMA ', color: C_WHITE }, { text: 'FOICE', color: C_WEAPON }],
          [{ text: 'QUE GIRA AO REDOR', color: C_WHITE }],
          [{ text: 'CAUSANDO ', color: C_WHITE }, { text: `${scytheDmg} DE DANO`, color: C_DAMAGE }]
        ],
        apply: (p, gs) => {
          gs.weapons.push(new VoidScythesWeapon(gs, p));
        }
      });
    } else if (!scythesWeapon.isEvolved && !scythesWeapon.isMaxBlades()) {
      const nextBlades = scythesWeapon.getBladeCount() + 1;
      const scytheDmg = Math.round(28 * dmgMult);
      catalog.unshift({
        id: 'void_scythes_upgrade',
        title: 'LÂMINAS ORBITAIS',
        category: `MELHORIA // ${nextBlades} LÂMINAS`,
        badgeColor: 0xf72585,
        icon: 'FOICE',
        cardSpriteKey: 'card-mystic',
        rarityLabel: 'RARO',
        rarityColor: '#facc15',
        cardName: 'FOICE +1',
        cardNameColor: C_WEAPON,
        levelLabel: `${nextBlades}/6 FOICES`,
        glowColor: 0x9b5de5,
        description: `+1 Lâmina em Órbita (${nextBlades}/6)\n\nAdiciona mais uma foice girando e causando ${scytheDmg} de dano!`,
        richLines: [
          [{ text: 'ADICIONA ', color: C_WHITE }, { text: '+1 FOICE', color: C_WEAPON }],
          [{ text: 'EM ÓRBITA ', color: C_WHITE }, { text: `(${nextBlades}/6)`, color: C_UTILITY }],
          [{ text: 'CAUSANDO ', color: C_WHITE }, { text: `${scytheDmg} DE DANO`, color: C_DAMAGE }]
        ],
        apply: () => {
          scythesWeapon.addBlade();
        }
      });
    }

    // 2. CHAMAS DO PURGATÓRIO (Hellfire Aura)
    if (!hellfireWeapon) {
      const fireDmg = Math.round(22 * dmgMult);
      catalog.unshift({
        id: 'hellfire_aura',
        title: 'CHAMAS DO PURGATÓRIO',
        category: 'NOVA ARMA // NÍVEL 1',
        badgeColor: 0xff4500,
        icon: 'CHAMAS',
        cardSpriteKey: 'card-fire',
        rarityLabel: 'RARO',
        rarityColor: '#facc15',
        cardName: 'CHAMAS',
        cardNameColor: C_WEAPON,
        levelLabel: 'NOVA ARMA',
        glowColor: 0xff4500,
        description: 'Aura Vulcânica Devoradora\n\nEmite pulsos periódicos de fogo infernal calcinando monstros em área!',
        richLines: [
          [{ text: 'LIBERA ', color: C_WHITE }, { text: 'AURA DE FOGO', color: C_WEAPON }],
          [{ text: 'QUE QUEIMA EM ÁREA', color: C_WHITE }],
          [{ text: 'CAUSANDO ', color: C_WHITE }, { text: `${fireDmg} DE DANO`, color: C_DAMAGE }]
        ],
        apply: (p, gs) => {
          gs.weapons.push(new HellfireAuraWeapon(gs, p));
        }
      });
    } else if (!hellfireWeapon.isEvolved && !hellfireWeapon.isMaxLevel()) {
      const nextLvl = hellfireWeapon.getLevel() + 1;
      const nextDmg = Math.round((22 + (nextLvl - 1) * 7) * dmgMult);
      catalog.unshift({
        id: 'hellfire_aura_upgrade',
        title: 'CHAMAS DO PURGATÓRIO',
        category: `MELHORIA // NÍVEL ${nextLvl}/5`,
        badgeColor: 0xff4500,
        icon: 'CHAMAS',
        cardSpriteKey: 'card-fire',
        rarityLabel: 'RARO',
        rarityColor: '#facc15',
        cardName: 'CHAMAS',
        cardNameColor: C_WEAPON,
        levelLabel: `NÍVEL ${nextLvl}/5`,
        glowColor: 0xff4500,
        description: `+Raio e Dano Ígneo (Nív ${nextLvl}/5)\n\nExpande o raio da onda de chamas e intensifica o calor das cinzas!`,
        richLines: [
          [{ text: 'EXPANDE A ', color: C_WHITE }, { text: 'AURA DE FOGO', color: C_WEAPON }],
          [{ text: 'EM ', color: C_WHITE }, { text: '+18 RAIO', color: C_UTILITY }, { text: ' E CAUSA', color: C_WHITE }],
          [{ text: `${nextDmg} DE DANO`, color: C_DAMAGE }, { text: ' EM ÁREA', color: C_WHITE }]
        ],
        apply: () => {
          hellfireWeapon.upgrade();
        }
      });
    }

    // 3. ADAGAS DE SANGUE (Blood Daggers)
    if (!daggersWeapon) {
      const dagDmg = Math.round(15 * dmgMult);
      catalog.unshift({
        id: 'blood_daggers',
        title: 'ADAGAS DE SANGUE',
        category: 'NOVA ARMA // NÍVEL 1',
        badgeColor: 0xef233c,
        icon: 'ADAGAS',
        cardSpriteKey: 'card-inferno',
        rarityLabel: 'RARO',
        rarityColor: '#facc15',
        cardName: 'ADAGAS',
        cardNameColor: C_WEAPON,
        levelLabel: 'NOVA ARMA',
        glowColor: 0xef233c,
        description: 'Leque Carmesim Frontal\n\nArremessa 3 adagas afiadas em alta velocidade na direção do olhar!',
        richLines: [
          [{ text: 'LANÇA ', color: C_WHITE }, { text: '3 ADAGAS', color: C_WEAPON }],
          [{ text: 'VELOZES À FRENTE', color: C_WHITE }],
          [{ text: 'CAUSANDO ', color: C_WHITE }, { text: `${dagDmg} DE DANO`, color: C_DAMAGE }]
        ],
        apply: (p, gs) => {
          gs.weapons.push(new BloodDaggersWeapon(gs, p));
        }
      });
    } else if (!daggersWeapon.isEvolved && !daggersWeapon.isMaxLevel()) {
      const nextLvl = daggersWeapon.getLevel() + 1;
      const nextCount = 3 + (nextLvl - 1);
      const nextDmg = Math.round((15 + (nextLvl - 1) * 4) * dmgMult);
      catalog.unshift({
        id: 'blood_daggers_upgrade',
        title: 'ADAGAS DE SANGUE',
        category: `MELHORIA // NÍVEL ${nextLvl}/5`,
        badgeColor: 0xef233c,
        icon: 'ADAGAS',
        cardSpriteKey: 'card-inferno',
        rarityLabel: 'RARO',
        rarityColor: '#facc15',
        cardName: 'ADAGAS',
        cardNameColor: C_WEAPON,
        levelLabel: `NÍVEL ${nextLvl}/5`,
        glowColor: 0xef233c,
        description: `+1 Adaga no Leque e +Dano (Nív ${nextLvl}/5)\n\nAmplia a rajada carmesim e reduz o tempo entre arremessos!`,
        richLines: [
          [{ text: 'DISPARA ', color: C_WHITE }, { text: `${nextCount} ADAGAS`, color: C_WEAPON }],
          [{ text: 'NO LEQUE CAUSANDO', color: C_WHITE }],
          [{ text: `${nextDmg} DE DANO`, color: C_DAMAGE }, { text: ' CADA', color: C_WHITE }]
        ],
        apply: () => {
          daggersWeapon.upgrade();
        }
      });
    }

    // 4. CADEIAS ABISSAIS (Abyssal Chains)
    if (!chainsWeapon) {
      const chainDmg = Math.round(19 * dmgMult);
      catalog.unshift({
        id: 'abyssal_chains',
        title: 'CADEIAS ABISSAIS',
        category: 'NOVA ARMA // NÍVEL 1',
        badgeColor: 0x9d4edd,
        icon: 'GRILHÃO',
        cardSpriteKey: 'card-obsidian',
        rarityLabel: 'ÉPICO',
        rarityColor: '#c084fc',
        cardName: 'GRILHÃO',
        cardNameColor: C_WEAPON,
        levelLabel: 'NOVA ARMA',
        glowColor: 0x9d4edd,
        description: 'Correntes de Controle de Grupo\n\nChicoteia e prende grupos de inimigos próximos com grilhões sombrios!',
        richLines: [
          [{ text: 'INVOCA ', color: C_WHITE }, { text: 'CORRENTES', color: C_WEAPON }],
          [{ text: 'QUE APLICAM ', color: C_WHITE }, { text: 'LENTIDÃO', color: C_SPEED }],
          [{ text: 'E CAUSAM ', color: C_WHITE }, { text: `${chainDmg} DE DANO`, color: C_DAMAGE }]
        ],
        apply: (p, gs) => {
          gs.weapons.push(new AbyssalChainsWeapon(gs, p));
        }
      });
    } else if (!chainsWeapon.isEvolved && !chainsWeapon.isMaxLevel()) {
      const nextLvl = chainsWeapon.getLevel() + 1;
      const nextDmg = Math.round((19 + (nextLvl - 1) * 6) * dmgMult);
      catalog.unshift({
        id: 'abyssal_chains_upgrade',
        title: 'CADEIAS ABISSAIS',
        category: `MELHORIA // NÍVEL ${nextLvl}/5`,
        badgeColor: 0x9d4edd,
        icon: 'GRILHÃO',
        cardSpriteKey: 'card-obsidian',
        rarityLabel: 'ÉPICO',
        rarityColor: '#c084fc',
        cardName: 'GRILHÃO',
        cardNameColor: C_WEAPON,
        levelLabel: `NÍVEL ${nextLvl}/5`,
        glowColor: 0x9d4edd,
        description: `+1 Alvo, +Alcance e +Paralisia (Nív ${nextLvl}/5)\n\nEncadeia mais monstros e prolonga o tempo do grilhão!`,
        richLines: [
          [{ text: 'PRENDE ', color: C_WHITE }, { text: '+1 ALVO', color: C_UTILITY }, { text: ' COM', color: C_WHITE }],
          [{ text: 'CORRENTES', color: C_WEAPON }, { text: ' CAUSANDO', color: C_WHITE }],
          [{ text: `${nextDmg} DE DANO`, color: C_DAMAGE }, { text: ' E ', color: C_WHITE }, { text: 'PARALISIA', color: C_SPEED }]
        ],
        apply: () => {
          chainsWeapon.upgrade();
        }
      });
    }

    // 5. METEORO INFERNAL (Infernal Meteor)
    if (!meteorWeapon) {
      const metDmg = Math.round(46 * dmgMult);
      catalog.unshift({
        id: 'infernal_meteor',
        title: 'METEORO INFERNAL',
        category: 'NOVA ARMA // NÍVEL 1',
        badgeColor: 0xff7b00,
        icon: 'METEORO',
        cardSpriteKey: 'card-fire',
        rarityLabel: 'ÉPICO',
        rarityColor: '#ff7b00',
        cardName: 'METEORO',
        cardNameColor: C_WEAPON,
        levelLabel: 'NOVA ARMA',
        glowColor: 0xff7b00,
        description: 'Bombardeio Vulcânico Celeste\n\nInvoca rochas incandescentes do céu que explodem sobre a horda!',
        richLines: [
          [{ text: 'INVOCA UM ', color: C_WHITE }, { text: 'METEORO', color: C_WEAPON }],
          [{ text: 'EXPLOSIVO DO CÉU', color: C_WHITE }],
          [{ text: 'CAUSANDO ', color: C_WHITE }, { text: `${metDmg} DE DANO`, color: C_DAMAGE }]
        ],
        apply: (p, gs) => {
          gs.weapons.push(new InfernalMeteorWeapon(gs, p));
        }
      });
    } else if (!meteorWeapon.isEvolved && !meteorWeapon.isMaxLevel()) {
      const nextLvl = meteorWeapon.getLevel() + 1;
      const nextDmg = Math.round((46 + (nextLvl - 1) * 10) * dmgMult);
      catalog.unshift({
        id: 'infernal_meteor_upgrade',
        title: 'METEORO INFERNAL',
        category: `MELHORIA // NÍVEL ${nextLvl}/5`,
        badgeColor: 0xff7b00,
        icon: 'METEORO',
        cardSpriteKey: 'card-fire',
        rarityLabel: 'ÉPICO',
        rarityColor: '#ff7b00',
        cardName: 'METEORO',
        cardNameColor: C_WEAPON,
        levelLabel: `NÍVEL ${nextLvl}/5`,
        glowColor: 0xff7b00,
        description: `+Dano Explosivo e +Meteoros (Nív ${nextLvl}/5)\n\nAumenta o poder da cratera e a cadência do bombardeio!`,
        richLines: [
          [{ text: 'FORTALECE O ', color: C_WHITE }, { text: 'METEORO', color: C_WEAPON }],
          [{ text: 'EM ', color: C_WHITE }, { text: '+ÁREA', color: C_UTILITY }, { text: ' CAUSANDO', color: C_WHITE }],
          [{ text: `${nextDmg} DE DANO`, color: C_DAMAGE }, { text: ' EM ÁREA', color: C_WHITE }]
        ],
        apply: () => {
          meteorWeapon.upgrade();
        }
      });
    }

    return catalog;
  }

  /**
   * Retorna até 3 cartas de Evolução Suprema das armas equipadas e ainda não evoluídas.
   * Concedido exclusivamente ao capturar 100% de um Altar de Ascensão.
   */
  public static getAltarEvolutionCards(player: BaseCharacter, gameScene: any): UpgradeCard[] {
    const weapons: any[] = gameScene.weapons || [];
    const dmgMult = 1 + (player.bonusDamagePercent || 0) / 100;
    const cards: UpgradeCard[] = [];

    const soulBoltWeapon = weapons.find((w) => w instanceof SoulBoltWeapon) as SoulBoltWeapon | undefined;
    const scythesWeapon = weapons.find((w) => w instanceof VoidScythesWeapon) as VoidScythesWeapon | undefined;
    const hellfireWeapon = weapons.find((w) => w instanceof HellfireAuraWeapon) as HellfireAuraWeapon | undefined;
    const daggersWeapon = weapons.find((w) => w instanceof BloodDaggersWeapon) as BloodDaggersWeapon | undefined;
    const chainsWeapon = weapons.find((w) => w instanceof AbyssalChainsWeapon) as AbyssalChainsWeapon | undefined;
    const meteorWeapon = weapons.find((w) => w instanceof InfernalMeteorWeapon) as InfernalMeteorWeapon | undefined;

    // 1. RAIO DO APOCALIPSE (Evolução de SoulBolt - Exige Nível 5 Máximo)
    if (soulBoltWeapon && !soulBoltWeapon.isEvolved && soulBoltWeapon.isMaxLevel()) {
      const evoDmg = Math.round(46 * dmgMult);
      cards.push({
        id: 'evo_soul_bolt',
        title: 'RAIO DO APOCALIPSE',
        category: 'EVOLUÇÃO SUPREMA // ASCENSÃO',
        badgeColor: 0xffba08,
        icon: 'ASCENSÃO',
        isEvolution: true,
        cardSpriteKey: 'card-gold',
        rarityLabel: 'SUPREMO',
        rarityColor: C_EVO,
        cardName: 'APOCALIPSE',
        cardNameColor: C_EVO,
        levelLabel: 'DISPARO DE ALMAS',
        glowColor: 0xffe600,
        description: 'Disparos convertidos em raios astrais dourados de alta cadência e perfuração massiva.',
        richLines: [
          [{ text: 'EVOLUI PARA ', color: C_WHITE }, { text: 'RAIO ASTRAL', color: C_WEAPON }],
          [{ text: 'DE ALTA CADÊNCIA COM', color: C_WHITE }],
          [{ text: `${evoDmg} DE DANO`, color: C_DAMAGE }, { text: ' E ', color: C_WHITE }, { text: '3 PERFURAÇÕES', color: C_UTILITY }]
        ],
        apply: () => {
          soulBoltWeapon.evolve();
        }
      });
    }

    // 2. CEIFADORA DO VAZIO (Evolução de VoidScythes - Exige 6 Lâminas Máximas)
    if (scythesWeapon && !scythesWeapon.isEvolved && scythesWeapon.isMaxBlades()) {
      const evoDmg = Math.round(22 * dmgMult);
      cards.push({
        id: 'evo_void_scythes',
        title: 'CEIFADORA DO VAZIO',
        category: 'EVOLUÇÃO SUPREMA // ASCENSÃO',
        badgeColor: 0xffba08,
        icon: 'ASCENSÃO',
        isEvolution: true,
        cardSpriteKey: 'card-gold',
        rarityLabel: 'SUPREMO',
        rarityColor: C_EVO,
        cardName: 'CEIFADORA',
        cardNameColor: C_EVO,
        levelLabel: 'LÂMINAS ORBITAIS',
        glowColor: 0xffe600,
        description: 'Funde as foices em um vórtice carmesim hiper-veloz de corte letal contínuo.',
        richLines: [
          [{ text: 'FUNDE AS FOICES EM', color: C_WHITE }],
          [{ text: 'VÓRTICE DO VAZIO', color: C_WEAPON }, { text: ' ULTRA-VELOZ', color: C_SPEED }],
          [{ text: 'CAUSANDO ', color: C_WHITE }, { text: `${evoDmg} DE DANO`, color: C_DAMAGE }, { text: ' CONTÍNUO', color: C_WHITE }]
        ],
        apply: () => {
          scythesWeapon.evolve();
        }
      });
    }

    // 3. SUPERNOVA ABISSAL (Evolução de HellfireAura - Exige Nível 5 Máximo)
    if (hellfireWeapon && !hellfireWeapon.isEvolved && hellfireWeapon.isMaxLevel()) {
      const evoDmg = Math.round(78 * dmgMult);
      cards.push({
        id: 'evo_hellfire_aura',
        title: 'SUPERNOVA ABISSAL',
        category: 'EVOLUÇÃO SUPREMA // ASCENSÃO',
        badgeColor: 0xffba08,
        icon: 'ASCENSÃO',
        isEvolution: true,
        cardSpriteKey: 'card-gold',
        rarityLabel: 'SUPREMO',
        rarityColor: C_EVO,
        cardName: 'SUPERNOVA',
        cardNameColor: C_EVO,
        levelLabel: 'CHAMAS DO PURGATÓRIO',
        glowColor: 0xffe600,
        description: 'Ondas estelares azuis e douradas calcinando área colossal e restaurando vida.',
        richLines: [
          [{ text: 'CRIA UMA ', color: C_WHITE }, { text: 'SUPERNOVA GIGANTE', color: C_WEAPON }],
          [{ text: 'CAUSANDO ', color: C_WHITE }, { text: `${evoDmg} DE DANO`, color: C_DAMAGE }],
          [{ text: 'E ', color: C_WHITE }, { text: 'CURA +3 VIDA', color: C_LIFE }, { text: '/PULSO', color: C_WHITE }]
        ],
        apply: () => {
          hellfireWeapon.evolve();
        }
      });
    }

    // 4. CHUVA DE SANGUE CARMESIM (Evolução de BloodDaggers - Exige Nível 5 Máximo)
    if (daggersWeapon && !daggersWeapon.isEvolved && daggersWeapon.isMaxLevel()) {
      const evoDmg = Math.round(38 * dmgMult);
      cards.push({
        id: 'evo_blood_daggers',
        title: 'CHUVA CARMESIM',
        category: 'EVOLUÇÃO SUPREMA // ASCENSÃO',
        badgeColor: 0xffba08,
        icon: 'ASCENSÃO',
        isEvolution: true,
        cardSpriteKey: 'card-gold',
        rarityLabel: 'SUPREMO',
        rarityColor: C_EVO,
        cardName: 'CHUVA SANGUE',
        cardNameColor: C_EVO,
        levelLabel: 'ADAGAS DE SANGUE',
        glowColor: 0xffe600,
        description: 'Dispara 8 adagas espectrais de alta perfuração em leque quase ininterrupto.',
        richLines: [
          [{ text: 'DISPARA ', color: C_WHITE }, { text: '8 ADAGAS VELOZES', color: C_WEAPON }],
          [{ text: 'EM LEQUE QUASE CONTÍNUO', color: C_WHITE }],
          [{ text: `${evoDmg} DE DANO`, color: C_DAMAGE }, { text: ' E ', color: C_WHITE }, { text: '3 PERFURAÇÕES', color: C_UTILITY }]
        ],
        apply: () => {
          daggersWeapon.evolve();
        }
      });
    }

    // 5. GRILHÕES DO TARTARUS (Evolução de AbyssalChains - Exige Nível 5 Máximo)
    if (chainsWeapon && !chainsWeapon.isEvolved && chainsWeapon.isMaxLevel()) {
      const evoDmg = Math.round(54 * dmgMult);
      cards.push({
        id: 'evo_abyssal_chains',
        title: 'GRILHÕES TARTARUS',
        category: 'EVOLUÇÃO SUPREMA // ASCENSÃO',
        badgeColor: 0xffba08,
        icon: 'ASCENSÃO',
        isEvolution: true,
        cardSpriteKey: 'card-gold',
        rarityLabel: 'SUPREMO',
        rarityColor: C_EVO,
        cardName: 'TARTARUS',
        cardNameColor: C_EVO,
        levelLabel: 'CADEIAS ABISSAIS',
        glowColor: 0xffe600,
        description: 'Prende até 8 alvos em estacas abissais com atordoamento prolongado de 1.8s.',
        richLines: [
          [{ text: 'PRENDE ATÉ ', color: C_WHITE }, { text: '8 MONSTROS', color: C_UTILITY }],
          [{ text: 'EM ', color: C_WHITE }, { text: 'ESTACAS ABISSAIS', color: C_WEAPON }],
          [{ text: `${evoDmg} DE DANO`, color: C_DAMAGE }, { text: ' E ', color: C_WHITE }, { text: 'PARALISIA 1.8s', color: C_SPEED }]
        ],
        apply: () => {
          chainsWeapon.evolve();
        }
      });
    }

    // 6. CATACLISMO SOLAR (Evolução de InfernalMeteor - Exige Nível 5 Máximo)
    if (meteorWeapon && !meteorWeapon.isEvolved && meteorWeapon.isMaxLevel()) {
      const evoDmg = Math.round(95 * dmgMult);
      cards.push({
        id: 'evo_infernal_meteor',
        title: 'CATACLISMO SOLAR',
        category: 'EVOLUÇÃO SUPREMA // ASCENSÃO',
        badgeColor: 0xffba08,
        icon: 'ASCENSÃO',
        isEvolution: true,
        cardSpriteKey: 'card-gold',
        rarityLabel: 'SUPREMO',
        rarityColor: C_EVO,
        cardName: 'CATACLISMO',
        cardNameColor: C_EVO,
        levelLabel: 'METEORO INFERNAL',
        glowColor: 0xffe600,
        description: 'Bombardeio estelar massivo de 5 meteoros gigantes destruindo a horda.',
        richLines: [
          [{ text: 'BOMBARDEIA O MAPA COM', color: C_WHITE }],
          [{ text: '5 METEOROS GIGANTES', color: C_WEAPON }],
          [{ text: `${evoDmg} DE DANO`, color: C_DAMAGE }, { text: ' EM ÁREA COLOSSAL', color: C_WHITE }]
        ],
        apply: () => {
          meteorWeapon.evolve();
        }
      });
    }

    return cards;
  }

  private getAvailableCards(): UpgradeCard[] {
    return UpgradeScene.getAvailableUpgrades(this.player, this.gameScene);
  }

  private pickRandomCards(cards: UpgradeCard[], count: number, excludeIds: string[] = []): UpgradeCard[] {
    const evolutions = cards.filter((c) => c.isEvolution && !excludeIds.includes(c.id));
    const regularPool = cards.filter((c) => !c.isEvolution && !excludeIds.includes(c.id));
    const fallbackPool = cards.filter((c) => !c.isEvolution);

    const poolToUse = regularPool.length >= count ? regularPool : fallbackPool;
    const shuffled = [...poolToUse].sort(() => 0.5 - Math.random());

    if (evolutions.length > 0) {
      const chosenEvo = Phaser.Math.RND.pick(evolutions);
      return [chosenEvo, ...shuffled.slice(0, count - 1)];
    }

    return shuffled.slice(0, count);
  }

  /**
   * Constrói uma carta usando as molduras em pixel-art (120x200px escaladas)
   * com a fonte Pixelzone, brilho traseiro, flutuação e explosão de cash ao clicar.
   */
  private createCard(
    x: number,
    y: number,
    w: number,
    h: number,
    cardScale: number,
    card: UpgradeCard,
    index: number
  ): void {
    // Container raiz posicionado na coluna da carta
    const rootContainer = this.add.container(x, y + 70);
    rootContainer.setAlpha(0);
    rootContainer.setScale(0.75);
    rootContainer.setData('upgradeCard', card);
    this.cardContainers.push(rootContainer);

    // Sub-container interno dedicado à flutuação contínua
    const floatContainer = this.add.container(0, 0);
    rootContainer.add(floatContainer);

    // Animação de entrada estilo cassino (cascata elástica)
    this.tweens.add({
      targets: rootContainer,
      y: y,
      alpha: 1,
      scaleX: 1,
      scaleY: 1,
      duration: 300,
      delay: index * 90,
      ease: 'Back.easeOut'
    });

    // Tween infinito de levitação / flutuação suave
    const floatTween = this.tweens.add({
      targets: floatContainer,
      y: -8,
      duration: 1300 + index * 190,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    const glowColor = card.glowColor ?? card.badgeColor ?? 0xfacc15;
    const isEvo = card.isEvolution === true;

    // 1. Sprite da Moldura da Carta (120x200px escalada por cardScale = 2.2 -> 264x440)
    // Sem formas semitransparentes ou bordas brancas atrás, destacando a arte da moldura
    const spriteKey = card.cardSpriteKey && this.textures.exists(card.cardSpriteKey)
      ? card.cardSpriteKey
      : 'card-base';

    if (this.textures.exists(spriteKey)) {
      const cardSprite = this.add.image(0, 0, spriteKey);
      cardSprite.setScale(cardScale);
      floatContainer.add(cardSprite);
    } else {
      // Fallback caso alguma textura ainda não tenha carregado
      const fallbackBg = this.add.graphics();
      fallbackBg.fillStyle(0x16061c, 0.96);
      fallbackBg.fillRoundedRect(-w / 2, -h / 2, w, h, 12);
      fallbackBg.lineStyle(3, glowColor, 1);
      fallbackBg.strokeRoundedRect(-w / 2, -h / 2, w, h, 12);
      floatContainer.add(fallbackBg);
    }

    // Largura interna estritamente segura (evita invadir as colunas de ossos e correntes laterais)
    // Na imagem 120x200, o vão livre vai de X=25 até X=95 (70px * 2.2 = 154px -> usamos 134px com folga)
    const SAFE_INNER_WIDTH = 134;

    // =========================================================================
    // JANELA SUPERIOR DA CARTA (Y entre -120px e +8px)
    // Contém: RARIDADE no topo superior + NOME DA CARTA central ampliado + NÍVEL discreto abaixo
    // =========================================================================
    const rarityStr = (card.rarityLabel || 'RARO').toUpperCase();
    const rarityCol = card.rarityColor || '#facc15';

    const rarityText = this.add.text(0, -112, rarityStr, {
      fontFamily: this.cardFont,
      fontSize: '26px',
      color: rarityCol,
      stroke: '#000000',
      strokeThickness: 4,
      align: 'center'
    }).setOrigin(0.5);
    rarityText.setResolution(2);
    if (rarityText.width > SAFE_INNER_WIDTH) {
      rarityText.setScale(SAFE_INNER_WIDTH / rarityText.width);
    }
    floatContainer.add(rarityText);

    const cardTitleStr = (card.cardName || card.icon || card.title).toUpperCase();
    const cardTitleCol = card.cardNameColor || C_WEAPON;

    const nameText = this.add.text(0, -64, cardTitleStr, {
      fontFamily: this.cardFont,
      fontSize: '38px',
      color: cardTitleCol,
      stroke: '#000000',
      strokeThickness: 4.5,
      align: 'center'
    }).setOrigin(0.5);
    nameText.setResolution(2);
    if (nameText.width > SAFE_INNER_WIDTH) {
      nameText.setScale(SAFE_INNER_WIDTH / nameText.width);
    }
    floatContainer.add(nameText);

    if (card.levelLabel) {
      const lvlText = this.add.text(0, -18, card.levelLabel.toUpperCase(), {
        fontFamily: this.cardFont,
        fontSize: '16px',
        color: '#cbd5e1',
        stroke: '#000000',
        strokeThickness: 3,
        align: 'center'
      }).setOrigin(0.5);
      lvlText.setResolution(2);
      if (lvlText.width > SAFE_INNER_WIDTH) {
        lvlText.setScale(SAFE_INNER_WIDTH / lvlText.width);
      }
      floatContainer.add(lvlText);
    }

    // =========================================================================
    // JANELA INFERIOR DA CARTA (Y entre +62px e +156px, centro em Y = +109px)
    // Contém: Descrição em linhas com palavras-chave coloridas (Dano, Arma, Vida, etc.)
    // =========================================================================
    const richLines: RichTextSegment[][] = card.richLines || [
      [{ text: card.description.toUpperCase(), color: C_WHITE }]
    ];

    this.renderRichDescriptionBox(floatContainer, richLines, 109, SAFE_INNER_WIDTH, 92);

    // =========================================================================
    // INTERATIVIDADE: HOVER (FLUTUAÇÃO E ESCALA) & CLICK (CASH + EXPLOSÃO)
    // =========================================================================
    const hitArea = new Phaser.Geom.Rectangle(-w / 2, -h / 2, w, h);
    rootContainer.setInteractive(hitArea, Phaser.Geom.Rectangle.Contains);
    if (rootContainer.input) {
      rootContainer.input.cursor = 'pointer';
    }

    rootContainer.on('pointerover', () => {
      if (this.isClosing) return;
      SoundManager.getInstance().playCardHover();
      rootContainer.setDepth(50);

      this.tweens.add({
        targets: rootContainer,
        scaleX: 1.09,
        scaleY: 1.09,
        y: y - 12,
        duration: 150,
        ease: 'Back.easeOut'
      });
    });

    rootContainer.on('pointerout', () => {
      if (this.isClosing) return;
      rootContainer.setDepth(10);

      this.tweens.add({
        targets: rootContainer,
        scaleX: 1.0,
        scaleY: 1.0,
        y: y,
        duration: 160,
        ease: 'Quad.easeOut'
      });
    });

    rootContainer.on('pointerdown', () => {
      if (this.isClosing) return;
      this.isClosing = true;

      // 1. Som viciante de Cash / Prêmio ("KA-CHING!")
      SoundManager.getInstance().playCardCashSelect();

      // 2. Aplica o benefício da carta na heroína Nixy
      card.apply(this.player, this.gameScene);

      // 3. Notifica o Altar no mundo para explodir e se desintegrar
      if (this.isAltar && typeof this.onAltarChosen === 'function') {
        this.onAltarChosen();
      }

      // 3. As outras duas cartas não escolhidas descem para baixo da tela!
      this.cardContainers.forEach((otherContainer, otherIdx) => {
        if (otherIdx !== index) {
          this.tweens.killTweensOf(otherContainer);
          this.tweens.add({
            targets: otherContainer,
            y: y + 520,
            alpha: 0,
            rotation: otherIdx < index ? -0.18 : 0.18,
            scaleX: 0.85,
            scaleY: 0.85,
            duration: 360,
            ease: 'Back.easeIn'
          });
        }
      });

      // 4. A carta escolhida brilha, infla e EXPLODE em partículas!
      floatTween.stop();
      this.tweens.killTweensOf(rootContainer);
      rootContainer.setDepth(100);

      // Flash intenso e expansão antes da explosão
      this.tweens.add({
        targets: rootContainer,
        scaleX: 1.24,
        scaleY: 1.24,
        duration: 130,
        ease: 'Quad.easeOut',
        onComplete: () => {
          // Dispara explosão de partículas douradas e da cor da carta
          this.spawnCardExplosionParticles(rootContainer.x, rootContainer.y, glowColor);

          // Desintegra a carta em um clarão
          this.tweens.add({
            targets: rootContainer,
            scaleX: 1.62,
            scaleY: 1.62,
            alpha: 0,
            duration: 230,
            ease: 'Cubic.easeOut'
          });
        }
      });

      // 5. Fecha a cena após a celebração de partículas e retoma a partida
      this.time.delayedCall(520, () => {
        this.scene.stop('UpgradeScene');
        this.gameScene.scene.resume();
        this.gameScene.physics.resume();
        if (typeof this.gameScene.checkAndOpenUpgradeScene === 'function') {
          this.gameScene.checkAndOpenUpgradeScene();
        }
      });
    });
  }

  /**
   * Renderiza linhas de descrição multicoloridas perfeitamente centralizadas e contidas
   * dentro da janela inferior da moldura da carta, impedindo qualquer vazamento.
   */
  private renderRichDescriptionBox(
    parent: Phaser.GameObjects.Container,
    lines: RichTextSegment[][],
    centerY: number,
    maxWidth: number,
    maxHeight: number
  ): void {
    const boxContainer = this.add.container(0, centerY);
    parent.add(boxContainer);

    const lineSpacing = 24;
    const totalH = (lines.length - 1) * lineSpacing;
    const startY = -totalH / 2;

    lines.forEach((segments, lineIdx) => {
      const lineContainer = this.add.container(0, startY + lineIdx * lineSpacing);
      boxContainer.add(lineContainer);

      const textObjs: Phaser.GameObjects.Text[] = [];
      let totalLineW = 0;

      for (const seg of segments) {
        const t = this.add.text(0, 0, seg.text.toUpperCase(), {
          fontFamily: this.cardFont,
          fontSize: '21px',
          color: seg.color,
          stroke: '#000000',
          strokeThickness: 3.5
        }).setOrigin(0, 0.5);
        t.setResolution(2);
        textObjs.push(t);
        lineContainer.add(t);
        totalLineW += t.width;
      }

      // Posiciona cada segmento lado a lado centralizando a linha inteira em X = 0
      let curX = -totalLineW / 2;
      for (const t of textObjs) {
        t.setX(Math.round(curX));
        curX += t.width;
      }

      // Garantia absoluta contra vazamento horizontal nos ossos laterais
      if (totalLineW > maxWidth) {
        const scaleFit = maxWidth / totalLineW;
        lineContainer.setScale(scaleFit);
      }
    });

    // Garantia absoluta contra vazamento vertical
    const estimatedBoxH = lines.length * lineSpacing;
    if (estimatedBoxH > maxHeight) {
      boxContainer.setScale(maxHeight / estimatedBoxH);
    }
  }

  /**
   * Cria a explosão satisfatória de partículas, moedas e ondas de choque quando a carta é escolhida
   */
  private spawnCardExplosionParticles(cx: number, cy: number, themeColor: number): void {
    this.cameras.main.shake(140, 0.006);

    // 1. Onda de choque expansiva
    const ring = this.add.graphics();
    ring.setDepth(120);
    ring.setBlendMode(Phaser.BlendModes.ADD);

    this.tweens.addCounter({
      from: 20,
      to: 240,
      duration: 340,
      ease: 'Cubic.easeOut',
      onUpdate: (tw) => {
        const r = tw.getValue() ?? 20;
        const alpha = Math.max(0, 1 - (r - 20) / 220);
        ring.clear();
        ring.lineStyle(5, 0xffe600, alpha);
        ring.strokeCircle(cx, cy, r);
        ring.lineStyle(3, themeColor, alpha * 0.8);
        ring.strokeCircle(cx, cy, r * 0.78);
      },
      onComplete: () => ring.destroy()
    });

    // 2. Explosão de 40 partículas (faíscas douradas, cristais e fragmentos da cor da carta)
    const palette = [themeColor, 0xffe600, 0xffffff, 0x00f5d4, 0xff4d6d];
    for (let i = 0; i < 40; i++) {
      const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
      const speedDist = Phaser.Math.Between(70, 260);
      const startX = cx + Phaser.Math.Between(-50, 50);
      const startY = cy + Phaser.Math.Between(-80, 80);
      const color = Phaser.Math.RND.pick(palette);
      const size = Phaser.Math.Between(3, 8);

      const spark = this.add.rectangle(startX, startY, size, size, color, 1);
      spark.setDepth(125);
      spark.setBlendMode(Phaser.BlendModes.ADD);
      spark.setRotation(Phaser.Math.FloatBetween(0, Math.PI));

      this.tweens.add({
        targets: spark,
        x: startX + Math.cos(angle) * speedDist,
        y: startY + Math.sin(angle) * speedDist,
        rotation: spark.rotation + Phaser.Math.FloatBetween(2, 6),
        scaleX: 0.1,
        scaleY: 0.1,
        alpha: 0,
        duration: Phaser.Math.Between(240, 420),
        ease: 'Cubic.easeOut',
        onComplete: () => spark.destroy()
      });
    }
  }

  update(_time: number, delta: number): void {
    if (this.isClosing) return;

    if (AutoPlayTestAgent.getInstance().isEnabled) {
      AutoPlayTestAgent.getInstance().checkAndResolveUpgradeModal(this, delta);
      return;
    }

    const nav = GamepadManager.getInstance().getMenuNavigation(this);
    if (this.cardContainers.length > 0) {
      if (nav.left) {
        const prev = this.selectedCardIndex;
        this.selectedCardIndex = (this.selectedCardIndex - 1 + this.cardContainers.length) % this.cardContainers.length;
        if (this.cardContainers[prev]) this.cardContainers[prev].emit('pointerout');
        if (this.cardContainers[this.selectedCardIndex]) this.cardContainers[this.selectedCardIndex].emit('pointerover');
      } else if (nav.right) {
        const prev = this.selectedCardIndex;
        this.selectedCardIndex = (this.selectedCardIndex + 1) % this.cardContainers.length;
        if (this.cardContainers[prev]) this.cardContainers[prev].emit('pointerout');
        if (this.cardContainers[this.selectedCardIndex]) this.cardContainers[this.selectedCardIndex].emit('pointerover');
      }
      if (nav.confirm) {
        if (this.cardContainers[this.selectedCardIndex]) {
          this.cardContainers[this.selectedCardIndex].emit('pointerdown');
        }
      }
    }
    if (!this.isAltar) {
      if (nav.reroll) {
        this.handleReroll();
      } else if (nav.cancel) {
        this.handleSkipAndHeal();
      }
    }
  }
}

