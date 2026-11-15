import Phaser from 'phaser';
import { SoulGem, GemType } from '../entities/items/SoulGem';
import { CorruptedSoulItem } from '../entities/items/CorruptedSoulItem';
import { MapItem, MapItemType } from '../entities/items/MapItem';
import { EvolutionAltar } from '../entities/items/EvolutionAltar';
import type { BaseCharacter } from '../entities/characters/BaseCharacter';
import { getAltarEvolutionCards, UpgradeGameScene } from './UpgradeCatalog';
import { DebugSessionLogger } from './DebugSessionLogger';
import { BALANCE, PERFORMANCE_LIMITS, getChapterConfig } from '../config/balance';

/** Contrato mínimo que a cena de jogo expõe para o PickupSpawnSystem. */
export interface IPickupSpawnContext {
  readonly player: BaseCharacter;
  readonly gemsGroup: Phaser.GameObjects.Group;
  readonly soulsGroup: Phaser.GameObjects.Group;
  readonly mapItemsGroup: Phaser.GameObjects.Group;
  readonly currentChapter: number;
  readonly isGameOver: boolean;
  readonly isChapterCompleted: boolean;
  readonly gameMode: 'story' | 'endless' | 'sandbox';
  readonly sandboxAutoSpawn: boolean;
  altarInstance: EvolutionAltar | null;
  clampToArena(x: number, y: number, margin?: number): { x: number; y: number };
}

const GEM_XP: Record<GemType, number> = BALANCE.XP.gemValues;

/** Retângulo do mundo considerado "na tela" (câmera + margem de culling). */
interface ViewBounds {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

/**
 * PickupSpawnSystem — cria (com pooling) o que o jogador recolhe no chão:
 * gemas de XP, almas corrompidas, itens de mapa e o Altar de Ascensão periódico.
 */
export class PickupSpawnSystem {
  private altarSpawnTimer = 0;
  private mapItemSpawnTimer = 0;

  constructor(private readonly scene: UpgradeGameScene, private readonly ctx: IPickupSpawnContext) {}

  /**
   * Atualização por quadro: esconde o que está fora da câmera, atrai/coleta
   * gemas e almas, anima itens, cuida do relógio de itens de mapa e do altar.
   */
  public update(delta: number): void {
    const view = this.getViewBounds();
    const inView = (o: { x: number; y: number }): boolean =>
      o.x >= view.left && o.x <= view.right && o.y >= view.top && o.y <= view.bottom;
    const player = this.ctx.player;

    const gems = this.ctx.gemsGroup.getChildren() as SoulGem[];
    for (let i = 0; i < gems.length; i++) {
      const g = gems[i];
      if (!g.active) continue;
      const visible = inView(g);
      g.setVisible(visible);
      // Gema já atraída continua vindo mesmo fora da tela
      if (g.isAttracted || visible) g.updateGem(player, delta);
    }

    const souls = this.ctx.soulsGroup.getChildren() as CorruptedSoulItem[];
    for (let i = 0; i < souls.length; i++) {
      const s = souls[i];
      if (!s.active) continue;
      const visible = inView(s);
      s.setVisible(visible);
      if (s.isAttracted || visible) s.updateSoul(player, delta);
    }

    const items = this.ctx.mapItemsGroup.getChildren() as MapItem[];
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (!item.active) continue;
      const visible = inView(item);
      item.setVisible(visible);
      if (visible) item.updateItem(delta);
    }

    if (this.ctx.gameMode !== 'sandbox' || this.ctx.sandboxAutoSpawn) {
      this.mapItemSpawnTimer += delta;
      if (this.mapItemSpawnTimer >= BALANCE.MAP_ITEMS.spawnIntervalMs) {
        this.mapItemSpawnTimer = 0;
        if (this.ctx.mapItemsGroup.countActive() < BALANCE.MAP_ITEMS.maxActive) {
          this.spawnRandomMapItem();
        }
      }
    }

    const altar = this.ctx.altarInstance;
    if (altar && altar.active && !altar.isDestroyed) {
      altar.updateAltar(player, delta);
    } else {
      this.updateAltarSpawning(delta);
    }
  }

  private getViewBounds(): ViewBounds {
    const wv = this.scene.cameras.main.worldView;
    const m = PERFORMANCE_LIMITS.VIEWPORT_CULLING_MARGIN;
    return { left: wv.x - m, right: wv.right + m, top: wv.y - m, bottom: wv.bottom + m };
  }

  public spawnGemAt(x: number, y: number, type: GemType): void {
    const gemXpValue = GEM_XP[type] ?? GEM_XP.green;

    // Acima do limite de gemas, o XP é fundido na gema ativa mais próxima
    const activeGems = (this.ctx.gemsGroup.getChildren() as SoulGem[]).filter((g) => g.active);
    if (activeGems.length >= PERFORMANCE_LIMITS.MAX_ACTIVE_GEMS) {
      let closestGem: SoulGem | undefined;
      let closestDist = Infinity;
      for (const g of activeGems) {
        const d = Math.hypot(g.x - x, g.y - y);
        if (d < closestDist) {
          closestDist = d;
          closestGem = g;
        }
      }
      if (closestGem) {
        closestGem.addBonusXp(gemXpValue);
        return;
      }
    }

    let gem = this.ctx.gemsGroup.getChildren().find((child) => !child.active) as SoulGem | undefined;
    if (!gem) {
      gem = new SoulGem(this.scene, x, y);
      this.ctx.gemsGroup.add(gem);
    }
    gem.spawn(x, y, type);
  }

  public spawnSoulItem(x: number, y: number, value: number = 1): void {
    const clamped = this.ctx.clampToArena(x, y, 60);
    let soul = this.ctx.soulsGroup.getChildren().find((child) => !child.active) as CorruptedSoulItem | undefined;
    if (!soul) {
      soul = new CorruptedSoulItem(this.scene, clamped.x, clamped.y);
      this.ctx.soulsGroup.add(soul);
    }
    soul.spawn(clamped.x, clamped.y, value);
  }

  public spawnMapItem(x: number, y: number, type?: MapItemType): MapItem {
    const clamped = this.ctx.clampToArena(x, y, 160);
    const types: MapItemType[] = ['chalice', 'magnet', 'chest'];
    const item = new MapItem(this.scene, clamped.x, clamped.y, type ?? Phaser.Math.RND.pick(types));
    this.ctx.mapItemsGroup.add(item);
    return item;
  }

  /** Item de mapa aleatório a 450–750px do jogador. */
  public spawnRandomMapItem(): void {
    const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
    const dist = Phaser.Math.Between(450, 750);
    this.spawnMapItem(this.ctx.player.x + Math.cos(angle) * dist, this.ctx.player.y + Math.sin(angle) * dist);
  }

  private hasActiveAltar(): boolean {
    const altar = this.ctx.altarInstance;
    return !!altar && altar.active && !altar.isDestroyed;
  }

  /** Altar de Ascensão periódico, só enquanto houver arma para evoluir. */
  public updateAltarSpawning(delta: number): void {
    if (this.ctx.isGameOver || this.ctx.isChapterCompleted) return;
    if (this.hasActiveAltar()) return;
    if (getAltarEvolutionCards(this.ctx.player, this.scene).length === 0) return;

    this.altarSpawnTimer += delta;
    if (this.altarSpawnTimer >= getChapterConfig(this.ctx.currentChapter).altarSpawnIntervalMs) {
      this.altarSpawnTimer = 0;
      this.spawnEvolutionAltar();
    }
  }

  /** Cria o Altar de Ascensão (posição informada ou 320–460px do jogador). */
  public spawnEvolutionAltar(customX?: number, customY?: number): EvolutionAltar | null {
    if (this.hasActiveAltar()) return this.ctx.altarInstance;

    if (getAltarEvolutionCards(this.ctx.player, this.scene).length === 0) {
      DebugSessionLogger.getInstance().log('ALTAR', 'INFO', 'Tentativa de spawnar altar ignorada: todas as armas já evoluídas');
      return null;
    }

    let spawnX = customX;
    let spawnY = customY;
    if (spawnX === undefined || spawnY === undefined) {
      const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
      const dist = Phaser.Math.Between(320, 460);
      spawnX = this.ctx.player.x + Math.cos(angle) * dist;
      spawnY = this.ctx.player.y + Math.sin(angle) * dist;
    }
    const clamped = this.ctx.clampToArena(spawnX, spawnY, 200);

    const altar = new EvolutionAltar(this.scene, clamped.x, clamped.y);
    this.ctx.altarInstance = altar;
    altar.on('altar-completed', (done: EvolutionAltar) => this.handleAltarCompleted(done));

    DebugSessionLogger.getInstance().log(
      'ALTAR',
      'INFO',
      `Altar de Ascensão rúnico surgiu em (${Math.round(clamped.x)}, ${Math.round(clamped.y)})`
    );
    return altar;
  }

  /** Altar carregado a 100%: pausa o jogo e abre a escolha de evolução. */
  private handleAltarCompleted(altar: EvolutionAltar): void {
    if (this.ctx.isGameOver || this.ctx.isChapterCompleted) return;
    if (this.scene.scene.isActive('UpgradeScene')) return;

    DebugSessionLogger.getInstance().log('ALTAR', 'INFO', 'Altar de Ascensão completado 100%! Abrindo seleção suprema...');
    this.scene.cameras.main.flash(300, 255, 230, 0);
    this.scene.physics.pause();
    this.scene.scene.pause();

    this.scene.scene.launch('UpgradeScene', {
      player: this.ctx.player,
      gameScene: this.scene,
      isAltar: true,
      onAltarChosen: () => {
        altar.explodeAndDestroy();
        if (this.ctx.altarInstance === altar) {
          this.ctx.altarInstance = null;
        }
      }
    });
  }
}
