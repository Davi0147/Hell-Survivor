import Phaser from 'phaser';
import { BaseCharacter } from '../entities/characters/BaseCharacter';
import { SoulBoltWeapon } from '../entities/weapons/SoulBoltWeapon';
import { VoidScythesWeapon } from '../entities/weapons/VoidScythesWeapon';
import { HellfireAuraWeapon } from '../entities/weapons/HellfireAuraWeapon';
import { BloodDaggersWeapon } from '../entities/weapons/BloodDaggersWeapon';
import { AbyssalChainsWeapon } from '../entities/weapons/AbyssalChainsWeapon';
import { InfernalMeteorWeapon } from '../entities/weapons/InfernalMeteorWeapon';
import { SoundManager } from '../systems/SoundManager';

export interface UpgradeCard {
  id: string;
  title: string;
  category: string;
  badgeColor: number;
  description: string;
  icon: string;
  isEvolution?: boolean;
  apply: (player: BaseCharacter, gameScene: any) => void;
  isAvailable?: (player: BaseCharacter, gameScene: any) => boolean;
}

export class UpgradeScene extends Phaser.Scene {
  private player!: BaseCharacter;
  private gameScene!: any;
  private cardContainers: Phaser.GameObjects.Container[] = [];
  private currentCardIds: string[] = [];
  private rerollBtnContainer?: Phaser.GameObjects.Container;
  private rerollText?: Phaser.GameObjects.Text;
  private rerollBg?: Phaser.GameObjects.Graphics;
  private isClosing: boolean = false;

  constructor() {
    super('UpgradeScene');
  }

  create(data: { player: BaseCharacter; gameScene: any }): void {
    this.player = data.player;
    this.gameScene = data.gameScene;
    this.cardContainers = [];
    this.currentCardIds = [];
    this.isClosing = false;

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
    const titleY = 58;
    const titleBox = this.add.graphics();
    titleBox.fillStyle(0x000000, 0.95);
    titleBox.fillRect(width / 2 - 280, titleY - 22, 560, 44);
    titleBox.lineStyle(2, 0xc59b27, 1);
    titleBox.strokeRect(width / 2 - 280, titleY - 22, 560, 44);
    titleBox.lineStyle(1, 0xffffff, 0.8);
    titleBox.strokeRect(width / 2 - 277, titleY - 19, 554, 38);

    this.add.text(width / 2, titleY, 'LEVEL UP! // ESCOLHA UMA BÊNÇÃO', {
      fontFamily: pixelFont,
      fontSize: '15px',
      fontStyle: 'bold',
      color: '#f3d17a',
      stroke: '#2b0914',
      strokeThickness: 3
    }).setOrigin(0.5);

    // 3. Renderização Inicial das 3 Cartas
    this.dealCards(false);

    // 4. Barra Tática Inferior: Botões de Re-rolar (Reroll) e Pular/Canalizar (Skip)
    this.createTacticalFooter(width, height, pixelFont);

    // 5. Atalhos de Teclado (R para Re-rolar, Espaço para Canalizar/Skip)
    if (this.input.keyboard) {
      this.input.keyboard.on('keydown-R', () => {
        this.handleReroll();
      });
      this.input.keyboard.on('keydown-SPACE', () => {
        this.handleSkipAndHeal();
      });
    }
  }

  private dealCards(isReroll: boolean): void {
    const { width, height } = this.scale;

    // Remove cartas anteriores caso seja um Reroll
    for (const c of this.cardContainers) {
      c.destroy();
    }
    this.cardContainers = [];

    const availableCards = this.getAvailableCards();
    const chosenCards = this.pickRandomCards(availableCards, 3, isReroll ? this.currentCardIds : []);
    this.currentCardIds = chosenCards.map((c) => c.id);

    const cardW = 260;
    const cardH = 350;
    const spacing = 36;
    const totalW = chosenCards.length * cardW + (chosenCards.length - 1) * spacing;
    const startX = width / 2 - totalW / 2 + cardW / 2;
    const cardY = height / 2 + 6;

    chosenCards.forEach((card, index) => {
      const cx = startX + index * (cardW + spacing);
      this.createCard(cx, cardY, cardW, cardH, card, index);
    });
  }

  private createTacticalFooter(width: number, height: number, pixelFont: string): void {
    const footerY = height - 42;

    // --- BOTÃO 1: RE-ROLAR BÊNÇÃOS ---
    const rerollW = 270;
    const rerollH = 36;
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
      SoundManager.getInstance().playMenuHover();
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
    const skipH = 36;
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

    const skipText = this.add.text(0, 0, '[ESPAÇO] CANALIZAR (+20 HP)', {
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
      SoundManager.getInstance().playMenuHover();
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
    const rerollH = 36;
    const hasCharges = this.player.rerollsRemaining > 0;

    this.rerollBg.clear();
    if (hasCharges) {
      this.rerollBg.fillStyle(hover ? 0x093145 : 0x051923, 0.95);
      this.rerollBg.fillRoundedRect(-rerollW / 2, -rerollH / 2, rerollW, rerollH, 6);
      this.rerollBg.lineStyle(1.5, hover ? 0xffffff : 0x00f5d4, 1);
      this.rerollBg.strokeRoundedRect(-rerollW / 2, -rerollH / 2, rerollW, rerollH, 6);
      this.rerollText.setText(`[R] RE-ROLAR BÊNÇÃOS (${this.player.rerollsRemaining})`);
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
    SoundManager.getInstance().playRouletteTick(1.18);
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
    });
  }

  public static getAvailableUpgrades(player: BaseCharacter, gameScene: any): UpgradeCard[] {
    const weapons: any[] = gameScene.weapons || [];

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
        description: '+1 Projétil Simultâneo\n\nDispara mais uma esfera ou lâmina a cada rajada.',
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
        description: '+1 Perfuração\n\nSeus tiros e adagas atravessam mais um monstro.',
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
        description: '+25% Dano Global\n\nAumenta a força destrutiva de todas as armas equipadas.',
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
        description: '+15% Velocidade\n\nPassos e sprint acelerados para escapar de enxames.',
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
        description: '+30 Estamina Máxima\n\nCorra por mais tempo e recarregue fôlego mais rápido.',
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
        description: '+50% Raio de Coleta\n\nAtrai gemas de alma caídas a distâncias muito maiores.',
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
        description: '+25 Vida Máxima\n\nCura 40 HP na hora e expande sua resistência vital.',
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
        description: `+0.2 HP por Segundo (${nextRegen.toFixed(1)}/0.8)\n\nCura contínua de sangue infernal restaurando sua vitalidade.`,
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
        description: `+0.1 HP Roubado por Golpe (${nextSteal.toFixed(1)}/0.3)\n\nRouba pequenas doses de vitalidade a cada acerto de suas armas.`,
        apply: (p) => {
          p.lifeStealPerHit = nextSteal;
        }
      });
    }

    // =========================================================================
    // ARMAS ATIVAS E SUAS MELHORIAS (NÍVEL 1 A 5/6)
    // =========================================================================

    // 1. LÂMINAS ORBITAIS (Void Scythes)
    if (!scythesWeapon) {
      catalog.unshift({
        id: 'void_scythes',
        title: 'LÂMINAS ORBITAIS',
        category: 'NOVA ARMA // NÍVEL 1',
        badgeColor: 0xf72585,
        icon: 'FOICE',
        description: 'Foice Mística em Órbita\n\n1 foice espectral veloz gira ao redor da Nixy retalhando monstros!',
        apply: (p, gs) => {
          gs.weapons.push(new VoidScythesWeapon(gs, p));
        }
      });
    } else if (!scythesWeapon.isMaxBlades()) {
      const nextBlades = scythesWeapon.getBladeCount() + 1;
      catalog.unshift({
        id: 'void_scythes_upgrade',
        title: 'LÂMINAS ORBITAIS',
        category: `MELHORIA // ${nextBlades} LÂMINAS`,
        badgeColor: 0xf72585,
        icon: 'FOICE',
        description: `+1 Lâmina em Órbita (${nextBlades}/6)\n\nAdiciona mais uma foice mística veloz girando ao redor da Nixy!`,
        apply: () => {
          scythesWeapon.addBlade();
        }
      });
    }

    // 2. CHAMAS DO PURGATÓRIO (Hellfire Aura)
    if (!hellfireWeapon) {
      catalog.unshift({
        id: 'hellfire_aura',
        title: 'CHAMAS DO PURGATÓRIO',
        category: 'NOVA ARMA // NÍVEL 1',
        badgeColor: 0xff4500,
        icon: 'CHAMAS',
        description: 'Aura Vulcânica Devoradora\n\nEmite pulsos periódicos de fogo infernal calcinando monstros em área!',
        apply: (p, gs) => {
          gs.weapons.push(new HellfireAuraWeapon(gs, p));
        }
      });
    } else if (!hellfireWeapon.isMaxLevel()) {
      const nextLvl = hellfireWeapon.getLevel() + 1;
      catalog.unshift({
        id: 'hellfire_aura_upgrade',
        title: 'CHAMAS DO PURGATÓRIO',
        category: `MELHORIA // NÍVEL ${nextLvl}/5`,
        badgeColor: 0xff4500,
        icon: 'CHAMAS',
        description: `+Raio e Dano Ígneo (Nív ${nextLvl}/5)\n\nExpande o raio da onda de chamas e intensifica o calor das cinzas!`,
        apply: () => {
          hellfireWeapon.upgrade();
        }
      });
    }

    // 3. ADAGAS DE SANGUE (Blood Daggers)
    if (!daggersWeapon) {
      catalog.unshift({
        id: 'blood_daggers',
        title: 'ADAGAS DE SANGUE',
        category: 'NOVA ARMA // NÍVEL 1',
        badgeColor: 0xef233c,
        icon: 'ADAGAS',
        description: 'Leque Carmesim Frontal\n\nArremessa 3 adagas afiadas em alta velocidade na direção do olhar!',
        apply: (p, gs) => {
          gs.weapons.push(new BloodDaggersWeapon(gs, p));
        }
      });
    } else if (!daggersWeapon.isMaxLevel()) {
      const nextLvl = daggersWeapon.getLevel() + 1;
      catalog.unshift({
        id: 'blood_daggers_upgrade',
        title: 'ADAGAS DE SANGUE',
        category: `MELHORIA // NÍVEL ${nextLvl}/5`,
        badgeColor: 0xef233c,
        icon: 'ADAGAS',
        description: `+1 Adaga no Leque e +Dano (Nív ${nextLvl}/5)\n\nAmplia a rajada carmesim e reduz o tempo entre arremessos!`,
        apply: () => {
          daggersWeapon.upgrade();
        }
      });
    }

    // 4. CADEIAS ABISSAIS (Abyssal Chains)
    if (!chainsWeapon) {
      catalog.unshift({
        id: 'abyssal_chains',
        title: 'CADEIAS ABISSAIS',
        category: 'NOVA ARMA // NÍVEL 1',
        badgeColor: 0x9d4edd,
        icon: 'GRILHÃO',
        description: 'Correntes de Controle de Grupo\n\nChicoteia e prende grupos de inimigos próximos com grilhões sombrios!',
        apply: (p, gs) => {
          gs.weapons.push(new AbyssalChainsWeapon(gs, p));
        }
      });
    } else if (!chainsWeapon.isMaxLevel()) {
      const nextLvl = chainsWeapon.getLevel() + 1;
      catalog.unshift({
        id: 'abyssal_chains_upgrade',
        title: 'CADEIAS ABISSAIS',
        category: `MELHORIA // NÍVEL ${nextLvl}/5`,
        badgeColor: 0x9d4edd,
        icon: 'GRILHÃO',
        description: `+1 Alvo, +Alcance e +Paralisia (Nív ${nextLvl}/5)\n\nEncadeia mais monstros e prolonga o tempo do grilhão!`,
        apply: () => {
          chainsWeapon.upgrade();
        }
      });
    }

    // 5. METEORO INFERNAL (Infernal Meteor)
    if (!meteorWeapon) {
      catalog.unshift({
        id: 'infernal_meteor',
        title: 'METEORO INFERNAL',
        category: 'NOVA ARMA // NÍVEL 1',
        badgeColor: 0xff7b00,
        icon: 'METEORO',
        description: 'Bombardeio Vulcânico Celeste\n\nInvoca rochas incandescentes do céu que explodem sobre a horda!',
        apply: (p, gs) => {
          gs.weapons.push(new InfernalMeteorWeapon(gs, p));
        }
      });
    } else if (!meteorWeapon.isMaxLevel()) {
      const nextLvl = meteorWeapon.getLevel() + 1;
      catalog.unshift({
        id: 'infernal_meteor_upgrade',
        title: 'METEORO INFERNAL',
        category: `MELHORIA // NÍVEL ${nextLvl}/5`,
        badgeColor: 0xff7b00,
        icon: 'METEORO',
        description: `+Dano Explosivo e +Meteoros (Nív ${nextLvl}/5)\n\nAumenta o poder da cratera e a cadência do bombardeio!`,
        apply: () => {
          meteorWeapon.upgrade();
        }
      });
    }

    // =========================================================================
    // EVOLUÇÕES SUPREMAS DE ARMAS (WEAPON FUSION / ASCENSÃO)
    // =========================================================================

    // Evolução 1: RAIO DO APOCALIPSE (Disparo de Almas + Alma Extra/Perfuração + Fúria Infernal)
    if (
      soulBoltWeapon &&
      !soulBoltWeapon.isEvolved &&
      (player.extraProjectiles >= 1 || player.extraPierce >= 1) &&
      player.bonusDamagePercent >= 25
    ) {
      catalog.unshift({
        id: 'evo_soul_bolt',
        title: 'RAIO DO APOCALIPSE',
        category: 'EVOLUÇÃO SUPREMA // FUSÃO',
        badgeColor: 0xffba08,
        icon: 'ASCENSÃO',
        isEvolution: true,
        description: 'Disparo de Almas + Fúria Infernal\n\nTransforma seus disparos em raios astrais dourados de alta cadência e perfuração massiva!',
        apply: () => {
          soulBoltWeapon.evolve();
        }
      });
    }

    // Evolução 2: CEIFADORA DO VAZIO (6 Lâminas Orbitais + Celeridade Abissal)
    if (
      scythesWeapon &&
      scythesWeapon.isMaxBlades() &&
      !scythesWeapon.isEvolved &&
      player.bonusSpeedPercent >= 15
    ) {
      catalog.unshift({
        id: 'evo_void_scythes',
        title: 'CEIFADORA DO VAZIO',
        category: 'EVOLUÇÃO SUPREMA // FUSÃO',
        badgeColor: 0xffba08,
        icon: 'ASCENSÃO',
        isEvolution: true,
        description: '6 Lâminas Orbitais + Celeridade Abissal\n\nFunde as 6 foices em um vórtice carmesim hiper-veloz de raio expandido e corte letal!',
        apply: () => {
          scythesWeapon.evolve();
        }
      });
    }

    // Evolução 3: SUPERNOVA ABISSAL (Chamas do Purgatório Nív 5 + Vitalidade Sangrenta)
    if (
      hellfireWeapon &&
      hellfireWeapon.isMaxLevel() &&
      !hellfireWeapon.isEvolved &&
      player.maxHp > 100
    ) {
      catalog.unshift({
        id: 'evo_hellfire_aura',
        title: 'SUPERNOVA ABISSAL',
        category: 'EVOLUÇÃO SUPREMA // FUSÃO',
        badgeColor: 0xffba08,
        icon: 'ASCENSÃO',
        isEvolution: true,
        description: 'Chamas Nív 5 + Vitalidade Sangrenta\n\nEmite ondas estrelares azuis e douradas que incineram uma área colossal e curam a Nixy!',
        apply: () => {
          hellfireWeapon.evolve();
        }
      });
    }

    return catalog;
  }

  private getAvailableCards(): UpgradeCard[] {
    return UpgradeScene.getAvailableUpgrades(this.player, this.gameScene);
  }

  private pickRandomCards(cards: UpgradeCard[], count: number, excludeIds: string[] = []): UpgradeCard[] {
    // Se houver uma Evolução Suprema disponível, garante que ao menos 1 apareça na mão!
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
    this.cardContainers.push(container);

    // Animação de entrada suave com delay cascata
    this.tweens.add({
      targets: container,
      y: y,
      alpha: 1,
      duration: 240,
      delay: index * 80,
      ease: 'Back.easeOut'
    });

    const isEvo = card.isEvolution === true;
    const bg = this.add.graphics();
    const drawCardBg = (hover: boolean) => {
      bg.clear();

      // Fundo principal (dourado imperial escuro se for Evolução Suprema)
      if (isEvo) {
        bg.fillStyle(hover ? 0x3b1d06 : 0x241004, 0.98);
      } else {
        bg.fillStyle(hover ? 0x22050f : 0x110207, 0.96);
      }
      bg.fillRoundedRect(-w / 2, -h / 2, w, h, 10);

      // Borda Chanfrada Externa
      const borderColor = isEvo ? 0xffe600 : hover ? 0xffffff : 0xc59b27;
      bg.lineStyle(hover || isEvo ? 3 : 2, borderColor, 1);
      bg.strokeRoundedRect(-w / 2, -h / 2, w, h, 10);

      // Filete Interno Dourado
      bg.lineStyle(1, hover ? 0xf3d17a : 0x7a5b18, 0.8);
      bg.strokeRoundedRect(-w / 2 + 4, -h / 2 + 4, w - 8, h - 8, 8);

      // Tag de Categoria
      bg.fillStyle(card.badgeColor, hover ? 1 : 0.9);
      bg.fillRoundedRect(-w / 2 + 16, -h / 2 + 16, w - 32, 24, 4);
    };
    drawCardBg(false);
    container.add(bg);

    // Texto da Categoria
    const categoryText = this.add.text(0, -h / 2 + 28, card.category, {
      fontFamily: pixelFont,
      fontSize: '9px',
      fontStyle: 'bold',
      color: isEvo ? '#1a0500' : '#ffffff',
      stroke: isEvo ? '#ffe600' : '#000000',
      strokeThickness: isEvo ? 1 : 2
    }).setOrigin(0.5);
    container.add(categoryText);

    // Insígnia / Brasão da Carta (Badge estilizado gótico)
    const iconBox = this.add.graphics();
    iconBox.fillStyle(0x0a0105, 0.92);
    iconBox.fillRoundedRect(-48, -h / 2 + 58, 96, 42, 8);
    iconBox.lineStyle(2, card.badgeColor, 0.95);
    iconBox.strokeRoundedRect(-48, -h / 2 + 58, 96, 42, 8);
    iconBox.lineStyle(1, 0xffffff, 0.35);
    iconBox.strokeRoundedRect(-45, -h / 2 + 61, 90, 36, 6);
    container.add(iconBox);

    const iconText = this.add.text(0, -h / 2 + 79, card.icon, {
      fontFamily: pixelFont,
      fontSize: '11px',
      fontStyle: 'bold',
      color: isEvo ? '#ffe600' : '#ffffff',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5);
    container.add(iconText);

    // Título da Carta
    const titleText = this.add.text(0, -h / 2 + 138, card.title, {
      fontFamily: pixelFont,
      fontSize: '13px',
      fontStyle: 'bold',
      color: isEvo ? '#ffe600' : '#ffffff',
      align: 'center',
      wordWrap: { width: w - 30 }
    }).setOrigin(0.5);
    container.add(titleText);

    // Divisória Dourada
    const divider = this.add.graphics();
    divider.lineStyle(1, 0xc59b27, 0.8);
    divider.lineBetween(-w / 2 + 25, -h / 2 + 165, w / 2 - 25, -h / 2 + 165);
    container.add(divider);

    // Descrição
    const descText = this.add.text(0, -h / 2 + 228, card.description, {
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
      btnBg.fillStyle(hover ? 0xc59b27 : isEvo ? 0x6b3e00 : 0x2b0610, 1);
      btnBg.fillRoundedRect(-w / 2 + 20, h / 2 - 48, w - 40, 32, 6);
      btnBg.lineStyle(1.5, hover ? 0xffffff : 0xf3d17a, 1);
      btnBg.strokeRoundedRect(-w / 2 + 20, h / 2 - 48, w - 40, 32, 6);
    };
    drawBtn(false);
    container.add(btnBg);

    const btnText = this.add.text(0, h / 2 - 32, isEvo ? 'ASCENDER ARMA' : 'ESCOLHER', {
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
      if (this.isClosing) return;
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
      titleText.setColor(isEvo ? '#ffe600' : '#ffffff');
      this.tweens.add({
        targets: container,
        scaleX: 1.0,
        scaleY: 1.0,
        duration: 120,
        ease: 'Quad.easeOut'
      });
    });

    container.on('pointerdown', () => {
      if (this.isClosing) return;
      this.isClosing = true;
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
