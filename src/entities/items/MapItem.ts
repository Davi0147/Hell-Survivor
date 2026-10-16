import Phaser from 'phaser';
import { BaseCharacter } from '../characters/BaseCharacter';
import { SoundManager } from '../../systems/SoundManager';
import { SoulGem } from './SoulGem';
import { UpgradeScene } from '../../scenes/UpgradeScene';
import { UIScene } from '../../scenes/UIScene';

export type MapItemType = 'chalice' | 'magnet' | 'chest';

export class MapItem extends Phaser.Physics.Arcade.Sprite {
  public itemType: MapItemType;
  private bobTimer: number = 0;
  private baseY: number = 0;
  private shadow!: Phaser.GameObjects.Ellipse;

  constructor(scene: Phaser.Scene, x: number, y: number, type: MapItemType) {
    const textureKey = type === 'chalice' ? 'item-chalice' : type === 'magnet' ? 'item-magnet' : 'item-chest';
    super(scene, x, y, textureKey);
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
    this.shadow.setDepth(14);
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
  }

  public collect(player: BaseCharacter, gameScene: any): void {
    if (!this.active) return;
    this.setActive(false);
    this.setVisible(false);

    if (this.shadow && this.shadow.active) {
      this.shadow.destroy();
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
              if (s.active && typeof (s as any).isAttracted !== 'undefined') {
                (s as any).isAttracted = true;
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
    }

    // Efeito de partículas cintilantes ao coletar
    const particleColor = this.itemType === 'chalice' ? 0x00ff88 : this.itemType === 'magnet' ? 0x00d4ff : 0xffd700;
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

  public override destroy(fromScene?: boolean): void {
    if (this.shadow && this.shadow.active) {
      this.shadow.destroy();
    }
    super.destroy(fromScene);
  }
}
