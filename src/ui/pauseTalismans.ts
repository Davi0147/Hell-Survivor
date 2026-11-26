import { TALISMAN_THEME } from '../config/theme';
import { TALISMAN_CATALOG } from '../systems/TalismanCatalog';
import { rarityIndex } from '../systems/talismanRules';
import type { IPauseTalismanInfo } from './PauseMenu';

const KIND_LABEL = { pet: 'PET AJUDANTE', weapon: 'ARMA ÚNICA', active: 'HABILIDADE' } as const;

/**
 * Talismãs que o jogador tem, prontos para o menu de pausa: do mais raro para o mais comum
 * (o que mais importa fica no começo), na ordem do catálogo dentro da mesma raridade.
 */
export function describeTalismansForPause(owned: ReadonlySet<string>): IPauseTalismanInfo[] {
  return TALISMAN_CATALOG
    .filter((def) => owned.has(def.id))
    .sort((a, b) => rarityIndex(b.rarity) - rarityIndex(a.rarity))
    .map((def) => {
      const look = TALISMAN_THEME.rarity[def.rarity];
      return {
        iconKey: def.icon,
        name: def.name,
        subtitle: `${look.label} · ${KIND_LABEL[def.kind]}`,
        description: def.description,
        rarityColor: look.color,
      };
    });
}
