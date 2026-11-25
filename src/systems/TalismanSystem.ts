import { TALISMAN_BALANCE } from '../config/balance';
import { DebugSessionLogger } from './DebugSessionLogger';
import { TALISMAN_CATALOG, getTalismanDef, type TalismanDef, type TalismanId } from './TalismanCatalog';
import { pickTalisman, rollTalismanRarity, type TalismanRarity } from './talismanRules';
import { TalismanDrop } from '../entities/talismans/TalismanDrop';
import type { ITalismanContext, TalismanEffect } from '../entities/talismans/talismanContext';
import { BatPet } from '../entities/talismans/pets/BatPet';
import { SlimePet } from '../entities/talismans/pets/SlimePet';
import { HoundPet } from '../entities/talismans/pets/HoundPet';
import { ShadowTwinPet } from '../entities/talismans/pets/ShadowTwinPet';
import { ChainSparkWeapon } from '../entities/talismans/weapons/ChainSparkWeapon';
import { BoneSpikesWeapon } from '../entities/talismans/weapons/BoneSpikesWeapon';
import { FrostRingWeapon } from '../entities/talismans/weapons/FrostRingWeapon';
import { AbyssEyeWeapon } from '../entities/talismans/weapons/AbyssEyeWeapon';
import { HellPillarWeapon } from '../entities/talismans/weapons/HellPillarWeapon';

/** O que o sistema precisa da cena: o contexto dos efeitos e a tela da carta. */
export interface ITalismanSystemContext extends ITalismanContext {
  readonly isGameOver: boolean;
  /** Abre a tela da carta; `onCollected` roda quando o jogador recebe o prêmio. */
  openTalismanReveal(def: TalismanDef, onCollected: () => void): void;
}

/**
 * Talismãs da partida: prêmio do minichefe (pets e armas únicas). Valem só nesta partida,
 * não se repetem, e o jogador pode ter quantos conseguir.
 */
export class TalismanSystem {
  private readonly owned = new Set<TalismanId>();
  private readonly effects: TalismanEffect[] = [];
  private readonly dropsList: TalismanDrop[] = [];
  /** Carta aberta esperando o jogador receber (conta como "já tem" para o próximo sorteio). */
  private reserved: TalismanId | null = null;

  constructor(private readonly ctx: ITalismanSystemContext) {}

  /** Talismãs no chão (radar e seta de borda). */
  public get drops(): readonly TalismanDrop[] {
    return this.dropsList;
  }

  public get ownedIds(): ReadonlySet<TalismanId> {
    return this.owned;
  }

  /** Ainda existe talismã para ganhar, contando os que já estão no chão? */
  public canDropMore(): boolean {
    return this.owned.size + this.dropsList.length + (this.reserved ? 1 : 0) < TALISMAN_CATALOG.length;
  }

  /** Solta um talismã no chão. Devolve false se o jogador já vai ter todos. */
  public dropAt(x: number, y: number): boolean {
    if (!this.canDropMore()) return false;
    this.dropsList.push(new TalismanDrop(this.ctx.scene, x, y));
    DebugSessionLogger.getInstance().log('ITEM', 'INFO', `Talismã solto no chão em (${Math.round(x)}, ${Math.round(y)}).`);
    return true;
  }

  public update(deltaMs: number): void {
    const p = this.ctx.player;
    for (let i = this.dropsList.length - 1; i >= 0; i--) {
      const d = this.dropsList[i];
      d.update(deltaMs);
      if (!this.ctx.isGameOver && d.isTouching(p.x, p.y)) {
        d.destroy();
        this.dropsList.splice(i, 1);
        this.openNext();
      }
    }
    for (const e of this.effects) e.update(deltaMs);
  }

  /** Sorteia raridade e talismã e abre a carta. `forced` escolhe a raridade (Modo de Teste). */
  public openNext(forced?: TalismanRarity): void {
    const def = this.rollNext(forced);
    if (!def) return;
    this.reserved = def.id;
    DebugSessionLogger.getInstance().log('ITEM', 'INFO', `Talismã sorteado: ${def.name} (${def.rarity}).`);
    this.ctx.openTalismanReveal(def, () => {
      this.reserved = null;
      this.grant(def.id);
    });
  }

  private rollNext(forced?: TalismanRarity): TalismanDef | null {
    const taken = new Set<string>(this.owned);
    if (this.reserved) taken.add(this.reserved);
    return pickTalisman(TALISMAN_CATALOG, taken, forced ?? rollTalismanRarity(Math.random()), Math.random());
  }

  /** Liga o talismã na heroína (sem tela; usado pela carta e pelo Modo de Teste). */
  public grant(id: TalismanId): void {
    if (this.owned.has(id) || !getTalismanDef(id)) return;
    this.owned.add(id);
    this.effects.push(this.createEffect(id));
    DebugSessionLogger.getInstance().log('ITEM', 'INFO', `Talismã recebido: ${id}. Total: ${this.owned.size}.`);
  }

  private createEffect(id: TalismanId): TalismanEffect {
    const c = this.ctx;
    switch (id) {
      case 'pet_bat': return new BatPet(c);
      case 'pet_slime': return new SlimePet(c);
      case 'pet_hound': return new HoundPet(c, TALISMAN_BALANCE.pets.hound);
      case 'pet_cerberus': return new HoundPet(c, TALISMAN_BALANCE.pets.cerberus);
      case 'pet_twin': return new ShadowTwinPet(c);
      case 'wpn_chain_spark': return new ChainSparkWeapon(c);
      case 'wpn_bone_spikes': return new BoneSpikesWeapon(c);
      case 'wpn_frost_ring': return new FrostRingWeapon(c);
      case 'wpn_abyss_eye': return new AbyssEyeWeapon(c);
      case 'wpn_hell_pillar': return new HellPillarWeapon(c);
    }
  }

  public destroy(): void {
    for (const d of this.dropsList) d.destroy();
    this.dropsList.length = 0;
    for (const e of this.effects) e.destroy();
    this.effects.length = 0;
    this.owned.clear();
    this.reserved = null;
  }
}
