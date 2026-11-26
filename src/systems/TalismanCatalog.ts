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

/** Pets com sprite próprio (de lado, virados para a direita; a esquerda é espelhada). */
export const PET_SPRITES = ['bat', 'slime', 'hound', 'cerberus', 'twin'] as const;
export type PetSprite = (typeof PET_SPRITES)[number];

/** Tiro próprio da Gêmea Sombria (chama roxa com rastro, cabeça para a direita). */
export const TWIN_BOLT_TEXTURE = 'twin-bolt';

const range = (prefix: string, n: number): string[] => Array.from({ length: n }, (_, i) => `${prefix}-${i}`);

/**
 * Quadros de cada animação (chave de textura = nome do arquivo em `assets/sprites/pets/`).
 * Os 4 pets da folha comum têm 2 quadros de andar e ficam parados no primeiro;
 * a Gêmea tem folha própria com 4 quadros de parada e 4 de andar.
 */
export const PET_ANIM_FRAMES: Record<PetSprite, { idle: string[]; walk: string[] }> = {
  bat: { idle: ['pet-bat-0'], walk: range('pet-bat', 2) },
  slime: { idle: ['pet-slime-0'], walk: range('pet-slime', 2) },
  hound: { idle: ['pet-hound-0'], walk: range('pet-hound', 2) },
  cerberus: { idle: ['pet-cerberus-0'], walk: range('pet-cerberus', 2) },
  twin: { idle: range('pet-twin-idle', 4), walk: range('pet-twin-walk', 4) },
};

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
  { id: 'pet_bat', rarity: 'common', kind: 'pet', name: 'MORCEGO COLETOR', icon: 'talisman-icon-pet_bat',
    description: 'Voa ao seu redor, puxa as gemas de perto e bica os monstros.' },
  { id: 'wpn_chain_spark', rarity: 'common', kind: 'weapon', name: 'FAÍSCA ENCADEADA', icon: 'talisman-icon-wpn_chain_spark',
    description: 'Um raio acerta o monstro mais perto e pula para mais 3.' },
  { id: 'pet_slime', rarity: 'uncommon', kind: 'pet', name: 'SLIME SALTADOR', icon: 'talisman-icon-pet_slime',
    description: 'Pula em cima dos monstros e esmaga tudo em volta ao cair.' },
  { id: 'wpn_bone_spikes', rarity: 'uncommon', kind: 'weapon', name: 'ESPINHOS DE OSSO', icon: 'talisman-icon-wpn_bone_spikes',
    description: 'Espinhos brotam do chão embaixo de 3 monstros de uma vez.' },
  { id: 'pet_hound', rarity: 'rare', kind: 'pet', name: 'CÃO DE GUARDA', icon: 'talisman-icon-pet_hound',
    description: 'Corre atrás dos monstros perto de você e morde sem parar.' },
  { id: 'wpn_frost_ring', rarity: 'rare', kind: 'weapon', name: 'ANEL DE GELO NEGRO', icon: 'talisman-icon-wpn_frost_ring',
    description: 'Uma onda de gelo congela os monstros ao seu redor por um instante.' },
  { id: 'pet_cerberus', rarity: 'epic', kind: 'pet', name: 'CÉRBERO FILHOTE', icon: 'talisman-icon-pet_cerberus',
    description: 'Três cabeças: morde até 3 monstros de uma vez e os atordoa.' },
  { id: 'wpn_abyss_eye', rarity: 'epic', kind: 'weapon', name: 'OLHO DO ABISMO', icon: 'talisman-icon-wpn_abyss_eye',
    description: 'Um raio gira sem parar ao seu redor queimando quem tocar.' },
  { id: 'pet_twin', rarity: 'legendary', kind: 'pet', name: 'GÊMEA SOMBRIA', icon: 'talisman-icon-pet_twin',
    description: 'Uma sombra sua anda ao seu lado e copia os seus disparos.' },
  { id: 'wpn_hell_pillar', rarity: 'legendary', kind: 'weapon', name: 'PILAR DO INFERNO', icon: 'talisman-icon-wpn_hell_pillar',
    description: 'Colunas de fogo caem nos monstros mais fortes da tela.' },
  { id: 'act_shadow_burst', rarity: 'common', kind: 'active', name: 'EXPLOSÃO SOMBRIA', icon: 'talisman-icon-act_shadow_burst',
    description: 'Quando os monstros te cercam, explode e empurra todos para longe.' },
  { id: 'act_bone_shield', rarity: 'uncommon', kind: 'active', name: 'ESCUDO DE OSSOS', icon: 'talisman-icon-act_bone_shield',
    description: 'Um escudo segura um golpe inteiro. Depois de quebrar, volta sozinho.' },
  { id: 'act_vortex', rarity: 'rare', kind: 'active', name: 'VÓRTICE DO ABISMO', icon: 'talisman-icon-act_vortex',
    description: 'Com muitos monstros na tela, um buraco suga todos para o meio e explode.' },
  { id: 'act_blood_heart', rarity: 'epic', kind: 'active', name: 'CORAÇÃO SANGRENTO', icon: 'talisman-icon-act_blood_heart',
    description: 'Com a vida baixa, cura um terço da vida e solta uma onda de sangue.' },
  { id: 'act_meteor_rain', rarity: 'legendary', kind: 'active', name: 'CHUVA DE METEOROS', icon: 'talisman-icon-act_meteor_rain',
    description: 'Quando a horda cresce, 12 meteoros caem sobre os monstros da tela.' },
];

export function getTalismanDef(id: string): TalismanDef | undefined {
  return TALISMAN_CATALOG.find((t) => t.id === id);
}
