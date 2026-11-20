/**
 * Ícones de arte (docs/ART_PROMPTS.md §1 a §3). A chave da textura é o nome do arquivo
 * (sem .png); a pasta fica em `public/assets/sprites/icons/<pasta>/`.
 */
export const GAME_ICON_FOLDERS: Record<string, 'weapons' | 'blessings' | 'ui'> = {
  'icon-ultimate': 'weapons',
  'icon-weapon-soulbolt': 'weapons',
  'icon-weapon-soulbolt-evo': 'weapons',
  'icon-weapon-scythes': 'weapons',
  'icon-weapon-scythes-evo': 'weapons',
  'icon-weapon-hellfire': 'weapons',
  'icon-weapon-hellfire-evo': 'weapons',
  'icon-weapon-daggers': 'weapons',
  'icon-weapon-daggers-evo': 'weapons',
  'icon-weapon-chains': 'weapons',
  'icon-weapon-chains-evo': 'weapons',
  'icon-weapon-meteor': 'weapons',
  'icon-weapon-meteor-evo': 'weapons',
  'icon-blessing-vitality': 'blessings',
  'icon-blessing-might': 'blessings',
  'icon-blessing-magnetism': 'blessings',
  'icon-blessing-agility': 'blessings',
  'icon-blessing-reroll': 'blessings',
  'icon-blessing-revival': 'blessings',
  // Ícones das cartas de upgrade (docs/ART_PROMPTS.md §14; recortados por scripts/cut-card-icons.py)
  'icon-card-multishot': 'blessings',
  'icon-card-pierce': 'blessings',
  'icon-card-stamina': 'blessings',
  'icon-card-crit-chance': 'blessings',
  'icon-card-crit-damage': 'blessings',
  'icon-card-dash': 'blessings',
  'icon-card-corpse-explosion': 'blessings',
  'icon-card-bloodthirst': 'blessings',
  'ui-icon-kills': 'ui',
  'ui-icon-souls': 'ui',
  'ui-icon-timer': 'ui',
  'ui-icon-level': 'ui',
  'ui-icon-reroll': 'ui',
  'ui-icon-skip': 'ui',
  'ui-icon-settings': 'ui',
  'ui-icon-sound-on': 'ui',
  'ui-icon-sound-off': 'ui',
  'ui-icon-chapter-lock': 'ui',
};

export const GAME_ICON_KEYS = Object.keys(GAME_ICON_FOLDERS);
