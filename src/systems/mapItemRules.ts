import { BALANCE } from '../config/balance';

export type MapItemType = 'chalice' | 'magnet' | 'chest' | 'bomb' | 'hourglass' | 'fury' | 'relic';

export const MAP_ITEM_TYPES: MapItemType[] = ['chalice', 'magnet', 'chest', 'bomb', 'hourglass', 'fury', 'relic'];

/** Chave da textura de cada item (os novos usam arte provisória até a sprite sheet chegar). */
export const MAP_ITEM_TEXTURES: Record<MapItemType, string> = {
  chalice: 'item-chalice',
  magnet: 'item-magnet',
  chest: 'item-chest',
  bomb: 'item-bomb',
  hourglass: 'item-hourglass',
  fury: 'item-fury',
  relic: 'item-relic',
};

/** Sorteia um item pelo peso de `BALANCE.MAP_ITEMS.weights` (`roll` de 0 a 1). Função pura. */
export function pickWeightedMapItem(roll: number): MapItemType {
  const weights = BALANCE.MAP_ITEMS.weights;
  const total = MAP_ITEM_TYPES.reduce((sum, t) => sum + weights[t], 0);
  let acc = 0;
  for (const t of MAP_ITEM_TYPES) {
    acc += weights[t] / total;
    if (roll < acc) return t;
  }
  return MAP_ITEM_TYPES[MAP_ITEM_TYPES.length - 1];
}
