/** Gema de XP guardada só como dado (sem sprite), esperando a câmera voltar a ela. */
export interface StoredGem {
  x: number;
  y: number;
  /** Cor original (GemType); a aparência final é recalculada pelo XP ao reaparecer. */
  type: string;
  xp: number;
}

export interface GemBounds {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

/**
 * GemReserve — depósito de gemas que ficaram fora da tela. Em vez de fundir ou sumir
 * com o XP quando há gemas demais, a gema vira um registro leve (posição + XP) e volta
 * a ser um sprite quando o jogador passa por ali. Lógica pura (sem Phaser), testável.
 */
export class GemReserve {
  private gems: StoredGem[] = [];

  constructor(private readonly maxStored: number) {}

  public get count(): number {
    return this.gems.length;
  }

  public get totalXp(): number {
    let sum = 0;
    for (const g of this.gems) sum += g.xp;
    return sum;
  }

  /** Guarda uma gema. Com o depósito cheio, o XP entra na guardada mais próxima (nada se perde). */
  public store(x: number, y: number, type: string, xp: number): void {
    if (this.gems.length < this.maxStored) {
      this.gems.push({ x, y, type, xp });
      return;
    }
    let nearest = this.gems[0];
    let best = Infinity;
    for (const g of this.gems) {
      const d = (g.x - x) * (g.x - x) + (g.y - y) * (g.y - y);
      if (d < best) {
        best = d;
        nearest = g;
      }
    }
    nearest.xp += xp;
  }

  /** Retira (até `limit`) as gemas guardadas dentro do retângulo, para virarem sprites de novo. */
  public takeWithin(bounds: GemBounds, limit: number): StoredGem[] {
    const taken: StoredGem[] = [];
    if (limit <= 0) return taken;
    for (let i = this.gems.length - 1; i >= 0 && taken.length < limit; i--) {
      const g = this.gems[i];
      if (g.x >= bounds.left && g.x <= bounds.right && g.y >= bounds.top && g.y <= bounds.bottom) {
        taken.push(g);
        this.gems.splice(i, 1);
      }
    }
    return taken;
  }

  /**
   * Esvazia o depósito agrupando tudo em no máximo `maxGroups` gemas (XP somado),
   * para o Ímã puxar o mapa inteiro sem criar centenas de sprites.
   */
  public takeAllGrouped(maxGroups: number): StoredGem[] {
    const all = this.gems;
    this.gems = [];
    if (all.length <= maxGroups) return all;

    const groups: StoredGem[] = [];
    const perGroup = Math.ceil(all.length / maxGroups);
    for (let i = 0; i < all.length; i += perGroup) {
      const head = { ...all[i] };
      for (let j = i + 1; j < Math.min(all.length, i + perGroup); j++) head.xp += all[j].xp;
      groups.push(head);
    }
    return groups;
  }

  public clear(): void {
    this.gems = [];
  }
}
