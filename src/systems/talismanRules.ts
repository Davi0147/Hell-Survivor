import { TALISMAN_BALANCE } from '../config/balance';

/** Raridades do talismã, da mais fraca para a mais forte. */
export type TalismanRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

export const TALISMAN_RARITIES: readonly TalismanRarity[] = ['common', 'uncommon', 'rare', 'epic', 'legendary'];

export function rarityIndex(r: TalismanRarity): number {
  return TALISMAN_RARITIES.indexOf(r);
}

/** Sorteia a raridade pelo peso de `TALISMAN_BALANCE.rarityWeights` (`roll` de 0 a 1). */
export function rollTalismanRarity(roll: number): TalismanRarity {
  const w = TALISMAN_BALANCE.rarityWeights;
  const total = TALISMAN_RARITIES.reduce((sum, r) => sum + w[r], 0);
  let acc = 0;
  for (const r of TALISMAN_RARITIES) {
    acc += w[r] / total;
    if (roll < acc) return r;
  }
  return 'legendary';
}

/**
 * Ordem de busca quando a raridade sorteada já acabou (talismã não se repete na partida):
 * primeiro a sorteada, depois as abaixo (da mais próxima), depois as acima.
 * Assim a sorte nunca dá mais do que o sorteio, a não ser que só sobrem as melhores.
 */
export function rarityFallbackOrder(rolled: TalismanRarity): TalismanRarity[] {
  const i = rarityIndex(rolled);
  const below = TALISMAN_RARITIES.slice(0, i).reverse();
  const above = TALISMAN_RARITIES.slice(i + 1);
  return [rolled, ...below, ...above];
}

export interface TalismanPoolEntry {
  id: string;
  rarity: TalismanRarity;
}

/**
 * Escolhe um talismã que o jogador ainda não tem. `pickRoll` (0 a 1) escolhe dentro da raridade.
 * Devolve null quando o jogador já tem todos.
 */
export function pickTalisman<T extends TalismanPoolEntry>(
  catalog: readonly T[],
  owned: ReadonlySet<string>,
  rolled: TalismanRarity,
  pickRoll: number
): T | null {
  for (const rarity of rarityFallbackOrder(rolled)) {
    const pool = catalog.filter((t) => t.rarity === rarity && !owned.has(t.id));
    if (pool.length > 0) {
      const idx = Math.min(pool.length - 1, Math.floor(pickRoll * pool.length));
      return pool[idx];
    }
  }
  return null;
}

/**
 * Pêndulo do talismã: a amplitude de um empurrão volta ao balanço leve aos poucos.
 * Devolve a amplitude depois de `dtMs` (nunca abaixo do balanço leve).
 */
export function dampPendulum(ampDeg: number, idleAmpDeg: number, dampPerSec: number, dtMs: number): number {
  if (ampDeg <= idleAmpDeg) return idleAmpDeg;
  return idleAmpDeg + (ampDeg - idleAmpDeg) * Math.exp((-dampPerSec * dtMs) / 1000);
}

/** Ângulo do pêndulo (graus) no instante `timeMs`: vai e volta entre -amp e +amp. */
export function pendulumAngle(ampDeg: number, timeMs: number, periodMs: number): number {
  return ampDeg * Math.sin((2 * Math.PI * timeMs) / periodMs);
}

/** Empurrão do toque: mais forte quanto mais rara a raridade nova. */
export function pendulumKick(tier: number, kickAmpDeg: number, kickPerTierDeg: number): number {
  return kickAmpDeg + tier * kickPerTierDeg;
}

/**
 * Estado da carta durante a revelação. Cada toque sobe uma raridade até chegar na sorteada;
 * o toque seguinte abre a carta. Na lendária não há mais para onde subir, então o próximo toque abre.
 */
export interface RevealState {
  readonly target: TalismanRarity;
  current: TalismanRarity;
  opened: boolean;
}

export type RevealStep = 'tier-up' | 'open' | 'done';

export function createRevealState(target: TalismanRarity): RevealState {
  return { target, current: 'common', opened: false };
}

/** Aplica um toque e diz o que aconteceu. */
export function tapReveal(state: RevealState): RevealStep {
  if (state.opened) return 'done';
  if (rarityIndex(state.current) < rarityIndex(state.target)) {
    state.current = TALISMAN_RARITIES[rarityIndex(state.current) + 1];
    return 'tier-up';
  }
  state.opened = true;
  return 'open';
}
