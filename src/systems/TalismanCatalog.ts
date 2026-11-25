import type { TalismanRarity } from './talismanRules';

/**
 * Pet (ajudante que anda com a heroína), arma única (dispara o tempo todo) ou
 * habilidade (dispara sozinha quando a situação pede, com recarga longa).
 */
export type TalismanKind = 'pet' | 'weapon' | 'active';

export type TalismanId =
  | 'pet_bat'
  | 'pet_slime'
  | 'pet_hound'
  | 'pet_cerberus'
  | 'pet_twin'
  | 'wpn_chain_spark'
  | 'wpn_bone_spikes'
  | 'wpn_frost_ring'
  | 'wpn_abyss_eye'
  | 'wpn_hell_pillar'
  | 'act_shadow_burst'
  | 'act_bone_shield'
  | 'act_vortex'
  | 'act_blood_heart'
  | 'act_meteor_rain';

export interface TalismanDef {
  id: TalismanId;
  rarity: TalismanRarity;
  kind: TalismanKind;
  name: string;
  description: string;
  /** Textura mostrada na carta. */
  icon: string;
}

/**
 * Todos os talismãs. Adicionar um = uma linha aqui + a criação em `TalismanSystem.createEffect`.
 * Números em `TALISMAN_BALANCE` (src/config/balance.ts).
 */
export const TALISMAN_CATALOG: readonly TalismanDef[] = [
  { id: 'pet_bat', rarity: 'common', kind: 'pet', name: 'MORCEGO COLETOR', icon: 'blood-bat-idle-south',
    description: 'Voa ao seu redor, puxa as gemas de perto e bica os monstros.' },
  { id: 'wpn_chain_spark', rarity: 'common', kind: 'weapon', name: 'FAÍSCA ENCADEADA', icon: 'soul-shoot',
    description: 'Um raio acerta o monstro mais perto e pula para mais 3.' },
  { id: 'pet_slime', rarity: 'uncommon', kind: 'pet', name: 'SLIME SALTADOR', icon: 'skull-slime-idle-south',
    description: 'Pula em cima dos monstros e esmaga tudo em volta ao cair.' },
  { id: 'wpn_bone_spikes', rarity: 'uncommon', kind: 'weapon', name: 'ESPINHOS DE OSSO', icon: 'blood-dagger',
    description: 'Espinhos brotam do chão embaixo de 3 monstros de uma vez.' },
  { id: 'pet_hound', rarity: 'rare', kind: 'pet', name: 'CÃO DE GUARDA', icon: 'zombie-dog-idle-south',
    description: 'Corre atrás dos monstros perto de você e morde sem parar.' },
  { id: 'wpn_frost_ring', rarity: 'rare', kind: 'weapon', name: 'ANEL DE GELO NEGRO', icon: 'void-scythe',
    description: 'Uma onda de gelo congela os monstros ao seu redor por um instante.' },
  { id: 'pet_cerberus', rarity: 'epic', kind: 'pet', name: 'CÉRBERO FILHOTE', icon: 'zombie-dog-idle-south',
    description: 'Três cabeças: morde até 3 monstros de uma vez e os atordoa.' },
  { id: 'wpn_abyss_eye', rarity: 'epic', kind: 'weapon', name: 'OLHO DO ABISMO', icon: 'apocalypse-shoot',
    description: 'Um raio gira sem parar ao seu redor queimando quem tocar.' },
  { id: 'pet_twin', rarity: 'legendary', kind: 'pet', name: 'GÊMEA SOMBRIA', icon: 'nixy-idle-south',
    description: 'Uma sombra sua anda ao seu lado e copia os seus disparos.' },
  { id: 'wpn_hell_pillar', rarity: 'legendary', kind: 'weapon', name: 'PILAR DO INFERNO', icon: 'infernal-meteor',
    description: 'Colunas de fogo caem nos monstros mais fortes da tela.' },
  { id: 'act_shadow_burst', rarity: 'common', kind: 'active', name: 'EXPLOSÃO SOMBRIA', icon: 'item-bomb',
    description: 'Quando os monstros te cercam, explode e empurra todos para longe.' },
  { id: 'act_bone_shield', rarity: 'uncommon', kind: 'active', name: 'ESCUDO DE OSSOS', icon: 'item-hourglass',
    description: 'Um escudo segura um golpe inteiro. Depois de quebrar, volta sozinho.' },
  { id: 'act_vortex', rarity: 'rare', kind: 'active', name: 'VÓRTICE DO ABISMO', icon: 'item-magnet',
    description: 'Com muitos monstros na tela, um buraco suga todos para o meio e explode.' },
  { id: 'act_blood_heart', rarity: 'epic', kind: 'active', name: 'CORAÇÃO SANGRENTO', icon: 'item-chalice',
    description: 'Com a vida baixa, cura um terço da vida e solta uma onda de sangue.' },
  { id: 'act_meteor_rain', rarity: 'legendary', kind: 'active', name: 'CHUVA DE METEOROS', icon: 'infernal-meteor',
    description: 'Quando a horda cresce, 12 meteoros caem sobre os monstros da tela.' },
];

export function getTalismanDef(id: string): TalismanDef | undefined {
  return TALISMAN_CATALOG.find((t) => t.id === id);
}
