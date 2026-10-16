import Phaser from 'phaser';
import { BaseCharacter } from '../entities/characters/BaseCharacter';
import { VoidScythesWeapon } from '../entities/weapons/VoidScythesWeapon';
import { HellfireAuraWeapon } from '../entities/weapons/HellfireAuraWeapon';
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

    this.add.text(width / 2, titleY, 'LEVEL UP! // ESCOLHA UMA BÊNÇÃO', {
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

  public static getAvailableUpgrades(player: BaseCharacter, gameScene: any): UpgradeCard[] {
    const hasVoidScythes = gameScene.weapons && gameScene.weapons.some(
      (w: any) => w instanceof VoidScythesWeapon
    );

    const catalog: UpgradeCard[] = [
      {
        id: 'multishot',
        title: 'ALMA EXTRA',
        category: 'BÊNÇÃO DE TIRO',
        badgeColor: 0x00f5d4,
        icon: '+TIRO',
        description: '+1 Projétil Simultâneo\n\nDispara mais uma esfera mística a cada rajada.',
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
        description: '+1 Perfuração\n\nSeus tiros atravessam mais um monstro antes de dissipar.',
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

    // Novo Upgrade 1: Regeneração de Vida contínua (0.5/s até 3.0/s)
    if (player.hpRegenPerSec < 3.0) {
      const nextRegen = Math.min(3.0, Number((player.hpRegenPerSec + 0.5).toFixed(1)));
      const level = Math.round(nextRegen / 0.5);
      catalog.push({
        id: 'hp_regen',
        title: 'REGENERAÇÃO SOMBRIA',
        category: `SOBREVIVÊNCIA // NÍVEL ${level}/6`,
        badgeColor: 0x2ec4b6,
        icon: 'REGEN',
        description: `+0.5 HP por Segundo (${nextRegen.toFixed(1)}/3.0)\n\nCura contínua de sangue infernal regenerando suas feridas em combate.`,
        apply: (p) => {
          p.hpRegenPerSec = nextRegen;
        }
      });
    }

    // Novo Upgrade 2: Roubo de Vida por Acerto (0.5 até 1.5 HP)
    if (player.lifeStealPerHit < 1.5) {
      const nextSteal = Math.min(1.5, Number((player.lifeStealPerHit + 0.5).toFixed(1)));
      const level = Math.round(nextSteal / 0.5);
      catalog.push({
        id: 'life_steal',
        title: 'DRENO VITAL',
        category: `SOBREVIVÊNCIA // NÍVEL ${level}/3`,
        badgeColor: 0x8338ec,
        icon: 'DRENO',
        description: `+0.5 HP Roubado por Golpe (${nextSteal.toFixed(1)}/1.5)\n\nRouba a vitalidade dos monstros a cada acerto de suas armas.`,
        apply: (p) => {
          p.lifeStealPerHit = nextSteal;
        }
      });
    }

    // Adiciona a arma "LÂMINAS ORBITAIS" ou sua evolução até 6 lâminas
    if (!hasVoidScythes) {
      catalog.unshift({
        id: 'void_scythes',
        title: 'LÂMINAS ORBITAIS',
        category: 'NOVA ARMA // NÍVEL 1',
        badgeColor: 0xf72585,
        icon: 'FOICE',
        description: 'Foice Mística em Órbita\n\n1 foice espectral veloz gira ao redor da Nixy retalhando monstros!',
        apply: (p, gs) => {
          const scythes = new VoidScythesWeapon(gs, p);
          gs.weapons.push(scythes);
        }
      });
    } else {
      const scythesWeapon = gameScene.weapons && gameScene.weapons.find(
        (w: any) => w instanceof VoidScythesWeapon
      ) as VoidScythesWeapon | undefined;

      if (scythesWeapon && !scythesWeapon.isMaxBlades()) {
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
    }

    // Adiciona a arma "CHAMAS DO PURGATÓRIO" ou sua evolução até Nível 5
    const hasHellfire = gameScene.weapons && gameScene.weapons.some(
      (w: any) => w instanceof HellfireAuraWeapon
    );

    if (!hasHellfire) {
      catalog.unshift({
        id: 'hellfire_aura',
        title: 'CHAMAS DO PURGATÓRIO',
        category: 'NOVA ARMA // NÍVEL 1',
        badgeColor: 0xff4500,
        icon: 'CHAMAS',
        description: 'Aura Vulcânica Devoradora\n\nEmite pulsos periódicos de fogo infernal calcinando monstros em área!',
        apply: (p, gs) => {
          const hellfire = new HellfireAuraWeapon(gs, p);
          gs.weapons.push(hellfire);
        }
      });
    } else {
      const hellfireWeapon = gameScene.weapons && gameScene.weapons.find(
        (w: any) => w instanceof HellfireAuraWeapon
      ) as HellfireAuraWeapon | undefined;

      if (hellfireWeapon && !hellfireWeapon.isMaxLevel()) {
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
    }

    return catalog;
  }

  private getAvailableCards(): UpgradeCard[] {
    return UpgradeScene.getAvailableUpgrades(this.player, this.gameScene);
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

    // Insígnia / Brasão da Carta (Badge estilizado gótico)
    const iconBox = this.add.graphics();
    iconBox.fillStyle(0x0a0105, 0.92);
    iconBox.fillRoundedRect(-44, -h / 2 + 62, 88, 44, 8);
    iconBox.lineStyle(2, card.badgeColor, 0.95);
    iconBox.strokeRoundedRect(-44, -h / 2 + 62, 88, 44, 8);
    iconBox.lineStyle(1, 0xffffff, 0.35);
    iconBox.strokeRoundedRect(-41, -h / 2 + 65, 82, 38, 6);
    container.add(iconBox);

    const iconText = this.add.text(0, -h / 2 + 84, card.icon, {
      fontFamily: pixelFont,
      fontSize: '11px',
      fontStyle: 'bold',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 3
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
