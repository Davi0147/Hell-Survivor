import type { IChestRouletteGameScene } from '../../ui/ChestRouletteModal';

/** O que um item de mapa usa da cena de jogo ao ser coletado. */
export type MapItemHostScene = IChestRouletteGameScene & {
  gemsGroup?: Phaser.GameObjects.Group;
  soulsGroup?: Phaser.GameObjects.Group;
  spawnSoulItem?(x: number, y: number, value?: number): void;
  /** Transforma em sprites as gemas guardadas fora da tela (antes de o ímã puxar tudo). */
  releaseStoredGems?(): void;
  enemiesGroup?: Phaser.GameObjects.Group;
  spawnGemAt?(x: number, y: number, type: GemType): void;
};
import Phaser from 'phaser';
import { BaseCharacter } from '../characters/BaseCharacter';
import { SoundManager } from '../../systems/SoundManager';
import { SoulGem, GemType } from './SoulGem';
import type { BaseEnemy } from '../enemies/BaseEnemy';
import { BALANCE } from '../../config/balance';
import { ITEM_COLORS } from '../../config/theme';
import { UpgradeScene } from '../../scenes/UpgradeScene';
import { UIScene } from '../../scenes/UIScene';

import { MAP_ITEM_TEXTURES, MapItemType } from '../../systems/mapItemRules';
export { MAP_ITEM_TYPES, MAP_ITEM_TEXTURES, pickWeightedMapItem } from '../../systems/mapItemRules';
export type { MapItemType };

export class MapItem extends Phaser.Physics.Arcade.Sprite {
  public itemType: MapItemType;
  private bobTimer: number = 0;
  private baseY: number = 0;
  private shadow!: Phaser.GameObjects.Ellipse;
  private greenGlow!: Phaser.GameObjects.Ellipse;

  constructor(scene: Phaser.Scene, x: number, y: number, type: MapItemType) {
    super(scene, x, y, MAP_ITEM_TEXTURES[type]);
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.baseY = y;
    this.itemType = type;
    this.bobTimer = Math.random() * Math.PI * 2;
    this.setDepth(15);
    this.setScale(0.85); // 40px -> ~34px

    const body = this.body as Phaser.Physics.Arcade.Body;
    if (body) {
      body.setCircle(18, 2, 2);
    }

    // Sombra oval escura no chão que se ajusta com a levitação
    this.shadow = scene.add.ellipse(x, y + 18, 26, 12, 0x000000, 0.45);
    this.shadow.setDepth(13);

    // Brilho suave de fundo, na cor do item, para destacá-lo no cenário
    this.greenGlow = scene.add.ellipse(x, y + 4, 38, 26, ITEM_COLORS.glow[type], 0.42);
    this.greenGlow.setDepth(14);
    scene.tweens.add({
      targets: this.greenGlow,
      alpha: { from: 0.28, to: 0.58 },
      scaleX: { from: 0.92, to: 1.15 },
      scaleY: { from: 0.92, to: 1.15 },
      duration: 1000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
  }

  public updateItem(deltaMs: number): void {
    if (!this.active) return;

    // Efeito suave de levitação
    this.bobTimer += deltaMs * 0.0035;
    const offset = Math.sin(this.bobTimer) * 6;
    this.y = this.baseY + offset;

    if (this.shadow && this.shadow.active) {
      const shadowScale = 1 - (offset / 18);
      this.shadow.setScale(shadowScale, shadowScale);
    }

    if (this.greenGlow && this.greenGlow.active) {
      this.greenGlow.setPosition(this.x, this.y + 4);
    }
  }

  public collect(player: BaseCharacter, gameScene: MapItemHostScene): void {
    if (!this.active) return;
    this.setActive(false);
    this.setVisible(false);

    if (this.shadow && this.shadow.active) {
      this.shadow.destroy();
    }
    if (this.greenGlow && this.greenGlow.active) {
      this.greenGlow.destroy();
    }

    const uiScene = this.scene.scene.get('UIScene') as UIScene;

    switch (this.itemType) {
      case 'chalice': {
        // Taça de vinho: recupera 50% do HP total
        const healAmount = Math.max(1, Math.round(player.maxHp * 0.5));
        player.heal(healAmount);
        SoundManager.getInstance().playLevelUp();
        this.scene.cameras.main.flash(200, 0, 255, 128);
        if (uiScene) {
          uiScene.showWaveAlert(`CÁLICE DE SANGUE INFERNAL!\n+${healAmount} HP RECUPERADO!`, 2500);
        }
        break;
      }

      case 'magnet': {
        // Ímã: atrai todos os XPs e almas espalhados no mapa até o jogador
        SoundManager.getInstance().playLevelUp();
        this.scene.cameras.main.flash(220, 0, 220, 255);
        if (gameScene.gemsGroup) {
          // Primeiro traz de volta as gemas guardadas fora da tela, para o ímã puxar o mapa inteiro
          gameScene.releaseStoredGems?.();
          const gems = gameScene.gemsGroup.getChildren() as SoulGem[];
          let pulledCount = 0;
          for (const g of gems) {
            if (g.active) {
              g.forceMagnetPull();
              pulledCount++;
            }
          }
          if (gameScene.soulsGroup) {
            const souls = gameScene.soulsGroup.getChildren();
            for (const s of souls) {
              const soul = s as Phaser.GameObjects.GameObject & { isAttracted?: boolean };
              if (soul.active && typeof soul.isAttracted !== 'undefined') {
                soul.isAttracted = true;
              }
            }
          }
          if (uiScene) {
            uiScene.showWaveAlert(`ÍMÃ DE ALMAS ATIVADO!\n${pulledCount} GEMAS ATRAÍDAS!`, 2500);
          }
        }
        break;
      }

      case 'chest': {
        // Drop garantido de 10 a 20 Almas Corrompidas ao abrir o Baú
        if (typeof gameScene.spawnSoulItem === 'function') {
          const soulsDrop = Phaser.Math.Between(10, 20);
          gameScene.spawnSoulItem(this.x, this.y, soulsDrop);
        }

        // Baú do Abismo: aciona a roleta animada no centro da tela
        const availableCards = UpgradeScene.getAvailableUpgrades(player, gameScene);
        if (uiScene && typeof uiScene.showChestRoulette === 'function') {
          uiScene.showChestRoulette(availableCards, player, gameScene);
        } else {
          // Fallback seguro caso a UIScene não esteja acoplada
          if (availableCards.length > 0) {
            const randomCard = Phaser.Math.RND.pick(availableCards);
            randomCard.apply(player, gameScene);
          } else {
            player.heal(player.maxHp);
          }
        }
        break;
      }

      case 'bomb':
        this.detonateBomb(player, gameScene, uiScene);
        break;

      case 'hourglass':
        this.shatterHourglass(player, gameScene, uiScene);
        break;

      case 'fury': {
        // Frasco de Fúria: enche a Suprema na hora
        const filled = !player.isUltimateActive;
        if (filled) player.gainUltimateCharge(player.maxUltimateCharge * 4);
        SoundManager.getInstance().playFrenzyStart();
        this.scene.cameras.main.flash(220, 255, 0, 85);
        uiScene?.showWaveAlert(filled ? 'FRASCO DE FÚRIA!\nSUPREMA PRONTA!' : 'FRASCO DE FÚRIA!\nA SUPREMA JÁ ESTÁ ATIVA', 2500);
        break;
      }

      case 'relic':
        this.openRelic(gameScene, uiScene);
        break;
    }

    // Efeito de partículas cintilantes ao coletar
    const particleColor = ITEM_COLORS.spark[this.itemType];
    for (let i = 0; i < 8; i++) {
      const spark = this.scene.add.circle(
        this.x,
        this.y,
        Phaser.Math.Between(2, 4),
        particleColor,
        1
      );
      spark.setDepth(100);
      const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
      const dist = Phaser.Math.Between(15, 35);
      this.scene.tweens.add({
        targets: spark,
        x: this.x + Math.cos(angle) * dist,
        y: this.y + Math.sin(angle) * dist,
        alpha: 0,
        scale: 0.1,
        duration: Phaser.Math.Between(300, 500),
        onComplete: () => spark.destroy()
      });
    }

    this.destroy();
  }

  /** Bomba Infernal: explosão gigante centrada no jogador. */
  private detonateBomb(player: BaseCharacter, gameScene: MapItemHostScene, uiScene?: UIScene): void {
    const cfg = BALANCE.MAP_ITEMS.bomb;
    const scene = this.scene;
    const minutes = ((gameScene as { survivalTimeMs?: number }).survivalTimeMs ?? 0) / 60000;
    const damage = cfg.damage + minutes * cfg.damagePerMinute;

    SoundManager.getInstance().playMeteorImpact();
    scene.cameras.main.shake(380, 0.02);
    scene.cameras.main.flash(260, 255, 120, 0);
    const ring = scene.add.circle(player.x, player.y, cfg.radius, ITEM_COLORS.bombBlast, 0.3);
    ring.setStrokeStyle(5, ITEM_COLORS.spark.bomb, 1).setBlendMode(Phaser.BlendModes.ADD).setDepth(26).setScale(0.05);
    scene.tweens.add({ targets: ring, scale: 1, alpha: 0, duration: 520, ease: 'Cubic.easeOut', onComplete: () => ring.destroy() });
    if (scene.textures.exists('explosion-1') && scene.anims.exists('anim-explosion')) {
      const boom = scene.add.sprite(player.x, player.y, 'explosion-1').setDepth(27).setScale(2.2);
      boom.play('anim-explosion');
      boom.once('animationcomplete', () => boom.destroy());
    }

    let hits = 0;
    for (const enemy of (gameScene.enemiesGroup?.getChildren() ?? []) as BaseEnemy[]) {
      if (!enemy.active || enemy.isDead) continue;
      if (Math.hypot(enemy.x - player.x, enemy.y - player.y) > cfg.radius) continue;
      enemy.takeDamage(enemy.isBoss ? cfg.bossDamage : damage);
      hits++;
    }
    uiScene?.showWaveAlert(`BOMBA INFERNAL!\n${hits} MONSTROS ATINGIDOS`, 2500);
  }

  /** Ampulheta Partida: paralisa a horda ao redor. */
  private shatterHourglass(player: BaseCharacter, gameScene: MapItemHostScene, uiScene?: UIScene): void {
    const cfg = BALANCE.MAP_ITEMS.hourglass;
    const scene = this.scene;
    SoundManager.getInstance().playAzazelTeleport();
    scene.cameras.main.flash(300, 0, 245, 212);
    const { width, height } = scene.scale;
    const veil = scene.add.rectangle(width / 2, height / 2, width, height, ITEM_COLORS.hourglassOverlay, 0.16);
    veil.setScrollFactor(0).setDepth(96);
    scene.tweens.add({ targets: veil, alpha: 0, duration: cfg.stunMs, ease: 'Quad.easeIn', onComplete: () => veil.destroy() });

    let frozen = 0;
    for (const enemy of (gameScene.enemiesGroup?.getChildren() ?? []) as BaseEnemy[]) {
      if (!enemy.active || enemy.isDead) continue;
      if (Math.hypot(enemy.x - player.x, enemy.y - player.y) > cfg.radius) continue;
      enemy.applyStun(cfg.stunMs);
      frozen++;
    }
    uiScene?.showWaveAlert(`AMPULHETA PARTIDA!\n${frozen} MONSTROS PARALISADOS`, 2500);
  }

  /** Relíquia Dourada: anel de gemas e um punhado de almas. */
  private openRelic(gameScene: MapItemHostScene, uiScene?: UIScene): void {
    const cfg = BALANCE.MAP_ITEMS.relic;
    SoundManager.getInstance().playRouletteJackpot();
    this.scene.cameras.main.flash(200, 255, 215, 0);
    for (let i = 0; i < cfg.gems; i++) {
      const a = (i / cfg.gems) * Math.PI * 2;
      const r = Phaser.Math.Between(34, 80);
      gameScene.spawnGemAt?.(this.x + Math.cos(a) * r, this.y + Math.sin(a) * r, i % 5 === 0 ? 'red' : 'blue');
    }
    gameScene.spawnSoulItem?.(this.x, this.y, Phaser.Math.Between(cfg.soulsMin, cfg.soulsMax));
    uiScene?.showWaveAlert('RELÍQUIA DOURADA!\nTESOURO ESPALHADO', 2400);
  }

  public override destroy(fromScene?: boolean): void {
    if (this.shadow && this.shadow.active) {
      this.shadow.destroy();
    }
    if (this.greenGlow && this.greenGlow.active) {
      this.greenGlow.destroy();
    }
    super.destroy(fromScene);
  }
}
