import Phaser from 'phaser';
import { SoulGem, GemType } from '../entities/items/SoulGem';
import { CorruptedSoulItem } from '../entities/items/CorruptedSoulItem';
import { MapItem, MapItemType } from '../entities/items/MapItem';
import { EvolutionAltar } from '../entities/items/EvolutionAltar';
import type { BaseCharacter } from '../entities/characters/BaseCharacter';
import { getAltarEvolutionCards, UpgradeGameScene } from './UpgradeCatalog';
import { DebugSessionLogger } from './DebugSessionLogger';
import { GemReserve } from './GemReserve';
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
  private gemSyncTimer = 0;
  private readonly gemReserve = new GemReserve(PERFORMANCE_LIMITS.MAX_STORED_GEMS);

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

    this.gemSyncTimer += delta;
    if (this.gemSyncTimer >= PERFORMANCE_LIMITS.GEM_PARK_INTERVAL_MS) {
      this.gemSyncTimer = 0;
      this.syncGemReserve();
    }

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
    this.placeGem(x, y, type, GEM_XP[type] ?? GEM_XP.green);
  }

  /** Quantas gemas existem ao todo (na tela + guardadas fora dela). */
  public get storedGemCount(): number {
    return this.gemReserve.count;
  }

  public clearStoredGems(): void {
    this.gemReserve.clear();
  }

  /**
   * Ímã de Almas: as gemas guardadas voltam como sprites (agrupadas, com o XP somado)
   * para serem puxadas junto com as que já estão na tela.
   */
  public releaseStoredGems(): void {
    for (const g of this.gemReserve.takeAllGrouped(PERFORMANCE_LIMITS.MAGNET_MAX_STORED_GROUPS)) {
      this.createGemSprite(g.x, g.y, g.type as GemType, g.xp);
    }
  }

  /**
   * Toda gema sempre existe: fora da câmera ela vira um registro leve no depósito;
   * na tela vira sprite. Só quando a própria tela está lotada o XP entra na gema vizinha,
   * que cresce à vista do jogador.
   */
  private placeGem(x: number, y: number, type: GemType, xp: number): void {
    const park = this.getParkBounds();
    if (x < park.left || x > park.right || y < park.top || y > park.bottom) {
      this.gemReserve.store(x, y, type, xp);
      return;
    }

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
        closestGem.addBonusXp(xp);
        return;
      }
    }

    this.createGemSprite(x, y, type, xp);
  }

  private createGemSprite(x: number, y: number, type: GemType, xp: number): SoulGem {
    let gem = this.ctx.gemsGroup.getChildren().find((child) => !child.active) as SoulGem | undefined;
    if (!gem) {
      gem = new SoulGem(this.scene, x, y);
      this.ctx.gemsGroup.add(gem);
    }
    gem.spawn(x, y, type);
    // Gema que já tinha XP acumulado volta com o valor (e o tamanho) que tinha
    if (xp > gem.xpValue) gem.addBonusXp(xp - gem.xpValue);
    return gem;
  }

  private getParkBounds(): ViewBounds {
    const wv = this.scene.cameras.main.worldView;
    const m = PERFORMANCE_LIMITS.GEM_PARK_MARGIN;
    return { left: wv.x - m, right: wv.right + m, top: wv.y - m, bottom: wv.bottom + m };
  }

  /**
   * Sincroniza o depósito com a câmera: gema parada que ficou longe vira dado guardado;
   * gema guardada que entrou na área da câmera volta a ser sprite.
   */
  private syncGemReserve(): void {
    const park = this.getParkBounds();
    const gems = this.ctx.gemsGroup.getChildren() as SoulGem[];
    let active = 0;
    for (let i = 0; i < gems.length; i++) {
      const g = gems[i];
      if (!g.active) continue;
      // Gema já sendo puxada continua viva até chegar ao jogador
      if (!g.isAttracted && (g.x < park.left || g.x > park.right || g.y < park.top || g.y > park.bottom)) {
        this.gemReserve.store(g.x, g.restY, g.gemType, g.xpValue);
        g.deactivate();
        continue;
      }
      active++;
    }

    const room = PERFORMANCE_LIMITS.MAX_ACTIVE_GEMS - active;
    for (const g of this.gemReserve.takeWithin(park, room)) {
      this.createGemSprite(g.x, g.y, g.type as GemType, g.xp);
    }
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
