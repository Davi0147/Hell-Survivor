import type Phaser from 'phaser';
import type { BaseWeapon } from '../entities/weapons/BaseWeapon';
import { BaseCharacter } from '../entities/characters/BaseCharacter';
import { SoulBoltWeapon } from '../entities/weapons/SoulBoltWeapon';
import { VoidScythesWeapon } from '../entities/weapons/VoidScythesWeapon';
import { HellfireAuraWeapon } from '../entities/weapons/HellfireAuraWeapon';
import { BloodDaggersWeapon } from '../entities/weapons/BloodDaggersWeapon';
import { AbyssalChainsWeapon } from '../entities/weapons/AbyssalChainsWeapon';
import { InfernalMeteorWeapon } from '../entities/weapons/InfernalMeteorWeapon';
import { COLORS, FX_COLORS, type CardRarity } from '../config/theme';
import { CRIT_BALANCE, DASH_BALANCE, CORPSE_EXPLOSION_BALANCE, BLOODTHIRST_BALANCE } from '../config/balance';

/**
 * Catálogo de cartas de upgrade: o que cada carta de Level Up e cada Evolução de Altar
 * oferece, quando fica disponível e o que faz ao ser escolhida.
 * A cena de upgrade (src/scenes/UpgradeScene.ts) só desenha e anima o que este arquivo devolve.
 */

/** O que as cartas usam da cena de jogo: a lista de armas equipadas e a própria cena (para criar armas novas). */
export type UpgradeGameScene = Phaser.Scene & { weapons: BaseWeapon[] };

export interface RichTextSegment {
  text: string;
  color: string;
}

export interface UpgradeCard {
  id: string;
  title: string;
  category: string;
  badgeColor: number;
  description: string;
  icon: string;
  isEvolution?: boolean;
  /** Raridade: decide a moldura, o nome e a cor da raridade (CARD_RARITY_THEME). */
  rarity: CardRarity;
  cardName?: string;
  cardNameColor?: string;
  levelLabel?: string;
  glowColor?: number;
  richLines?: RichTextSegment[][];
  apply: (player: BaseCharacter, gameScene: UpgradeGameScene) => void;
  isAvailable?: (player: BaseCharacter, gameScene: UpgradeGameScene) => boolean;
}

// Paleta semântica padronizada para leitura imediata nas cartas
export const C_WHITE   = '#ffffff';
export const C_WEAPON  = '#9b5de5'; // Roxo místico para nomes de armas/habilidades (idêntico ao exemplo FOICE)
export const C_DAMAGE  = '#ff3333'; // Vermelho vivo para informações de Dano / Ataque
export const C_LIFE    = '#2ecc71'; // Verde esmeralda para Vida / Cura / Regeneração / Roubo de Vida
export const C_SPEED   = '#38bdf8'; // Azul ciano para Velocidade / Estamina / Cadência / Controle
export const C_UTILITY = '#fbbf24'; // Dourado para Quantidades / Projéteis / Alcance / Perfuração
export const C_EVO     = '#ffe600'; // Ouro radiante para Evoluções Supremas

/** Ícone de arte de cada carta (pelo `id`). Cartas sem entrada ficam só com texto. */
export const CARD_ICON_KEYS: Record<string, string> = {
  soul_bolt_upgrade: 'icon-weapon-soulbolt',
  void_scythes: 'icon-weapon-scythes',
  void_scythes_upgrade: 'icon-weapon-scythes',
  hellfire_aura: 'icon-weapon-hellfire',
  hellfire_aura_upgrade: 'icon-weapon-hellfire',
  blood_daggers: 'icon-weapon-daggers',
  blood_daggers_upgrade: 'icon-weapon-daggers',
  abyssal_chains: 'icon-weapon-chains',
  abyssal_chains_upgrade: 'icon-weapon-chains',
  infernal_meteor: 'icon-weapon-meteor',
  infernal_meteor_upgrade: 'icon-weapon-meteor',
  evo_soul_bolt: 'icon-weapon-soulbolt-evo',
  evo_void_scythes: 'icon-weapon-scythes-evo',
  evo_hellfire_aura: 'icon-weapon-hellfire-evo',
  evo_blood_daggers: 'icon-weapon-daggers-evo',
  evo_abyssal_chains: 'icon-weapon-chains-evo',
  evo_infernal_meteor: 'icon-weapon-meteor-evo',
  damage: 'icon-blessing-might',
  speed: 'icon-blessing-agility',
  magnet: 'icon-blessing-magnetism',
  vitality: 'icon-blessing-vitality',
  hp_regen: 'icon-blessing-vitality',
  life_steal: 'icon-blessing-vitality',
  multishot: 'icon-card-multishot',
  pierce: 'icon-card-pierce',
  stamina: 'icon-card-stamina',
  crit_chance: 'icon-card-crit-chance',
  crit_damage: 'icon-card-crit-damage',
  dash_mastery: 'icon-card-dash',
  corpse_explosion: 'icon-card-corpse-explosion',
  bloodthirst: 'icon-card-bloodthirst',
};

/** Ícone de arte e nível de uma arma equipada (barra de armas da HUD). */
export function getWeaponIconInfo(weapon: BaseWeapon): { key: string; level: number; maxLevel: number; isEvolved: boolean } | undefined {
  const w = weapon as BaseWeapon & { isEvolved?: boolean; getLevel?(): number; getBladeCount?(): number };
  const isEvolved = w.isEvolved === true;
  let base: string | undefined;
  let level = w.getLevel?.() ?? 1;
  let maxLevel = 5;
  if (weapon instanceof SoulBoltWeapon) base = 'icon-weapon-soulbolt';
  else if (weapon instanceof VoidScythesWeapon) {
    base = 'icon-weapon-scythes';
    level = w.getBladeCount?.() ?? 1;
    maxLevel = 6;
  } else if (weapon instanceof HellfireAuraWeapon) base = 'icon-weapon-hellfire';
  else if (weapon instanceof BloodDaggersWeapon) base = 'icon-weapon-daggers';
  else if (weapon instanceof AbyssalChainsWeapon) base = 'icon-weapon-chains';
  else if (weapon instanceof InfernalMeteorWeapon) base = 'icon-weapon-meteor';
  if (!base) return undefined;
  return { key: isEvolved ? `${base}-evo` : base, level, maxLevel, isEvolved };
}

export function getAvailableUpgrades(player: BaseCharacter, gameScene: UpgradeGameScene): UpgradeCard[] {
  const weapons: BaseWeapon[] = gameScene.weapons || [];
  const dmgMult = 1 + (player.bonusDamagePercent || 0) / 100;

  const soulBoltWeapon = weapons.find((w) => w instanceof SoulBoltWeapon) as SoulBoltWeapon | undefined;
  const scythesWeapon = weapons.find((w) => w instanceof VoidScythesWeapon) as VoidScythesWeapon | undefined;
  const hellfireWeapon = weapons.find((w) => w instanceof HellfireAuraWeapon) as HellfireAuraWeapon | undefined;
  const daggersWeapon = weapons.find((w) => w instanceof BloodDaggersWeapon) as BloodDaggersWeapon | undefined;
  const chainsWeapon = weapons.find((w) => w instanceof AbyssalChainsWeapon) as AbyssalChainsWeapon | undefined;
  const meteorWeapon = weapons.find((w) => w instanceof InfernalMeteorWeapon) as InfernalMeteorWeapon | undefined;

  const catalog: UpgradeCard[] = [
    {
      id: 'multishot',
      title: 'ALMA EXTRA',
      category: 'BÊNÇÃO DE TIRO',
      badgeColor: 0x00f5d4,
      icon: '+TIRO',
      rarity: 'rare',
      cardName: 'ALMA EXTRA',
      cardNameColor: C_UTILITY,
      levelLabel: `ATUAL: +${player.extraProjectiles}`,
      glowColor: 0xa855f7,
      description: '+1 Projétil Simultâneo\n\nDispara mais uma esfera ou lâmina a cada rajada.',
      richLines: [
        [{ text: 'ADICIONA ', color: C_WHITE }, { text: '+1 PROJÉTIL', color: C_UTILITY }],
        [{ text: 'EM TODAS AS RAJADAS', color: C_WHITE }],
        [{ text: 'DE ', color: C_WHITE }, { text: 'DISPAROS E ADAGAS', color: C_WEAPON }]
      ],
      apply: (p) => {
        p.extraProjectiles += 1;
      }
    },
    {
      id: 'pierce',
      title: 'PERFURAÇÃO MÍSTICA',
      category: 'BÊNÇÃO DE TIRO',
      badgeColor: 0x9b5de5,
      icon: 'PERF',
      rarity: 'uncommon',
      cardName: 'PERFURAÇÃO',
      cardNameColor: C_WEAPON,
      levelLabel: `ATUAL: +${player.extraPierce}`,
      glowColor: 0x9b5de5,
      description: '+1 Perfuração\n\nSeus tiros e adagas atravessam mais um monstro.',
      richLines: [
        [{ text: 'CONCEDE ', color: C_WHITE }, { text: '+1 PERFURAÇÃO', color: C_UTILITY }],
        [{ text: 'PARA ATRAVESSAR MAIS', color: C_WHITE }],
        [{ text: 'INIMIGOS COM ', color: C_WHITE }, { text: 'TIROS', color: C_WEAPON }]
      ],
      apply: (p) => {
        p.extraPierce += 1;
      }
    },
    {
      id: 'damage',
      title: 'FÚRIA INFERNAL',
      category: 'ATRIBUTO PASSIVO',
      badgeColor: 0xd90429,
      icon: 'FÚRIA',
      rarity: 'rare',
      cardName: 'FÚRIA',
      cardNameColor: C_DAMAGE,
      levelLabel: `BÔNUS: +${player.bonusDamagePercent + 25}%`,
      glowColor: 0xff4500,
      description: '+25% Dano Global\n\nAumenta a força destrutiva de todas as armas equipadas.',
      richLines: [
        [{ text: 'AUMENTA EM ', color: C_WHITE }, { text: '+25% O DANO', color: C_DAMAGE }],
        [{ text: 'DE TODAS AS SUAS', color: C_WHITE }],
        [{ text: 'ARMAS EQUIPADAS', color: C_WEAPON }]
      ],
      apply: (p) => {
        p.bonusDamagePercent += 25;
      }
    },
    {
      id: 'speed',
      title: 'CELERIDADE ABISSAL',
      category: 'MOBILIDADE',
      badgeColor: 0xffb703,
      icon: 'PASSOS',
      rarity: 'common',
      cardName: 'CELERIDADE',
      cardNameColor: C_SPEED,
      levelLabel: `BÔNUS: +${player.bonusSpeedPercent + 15}%`,
      glowColor: 0x38bdf8,
      description: '+15% Velocidade\n\nPassos e sprint acelerados para escapar de enxames.',
      richLines: [
        [{ text: 'GANHE ', color: C_WHITE }, { text: '+15% VELOCIDADE', color: C_SPEED }],
        [{ text: 'DE MOVIMENTO E CORRIDA', color: C_WHITE }],
        [{ text: 'CONTRA A HORDA', color: C_WHITE }]
      ],
      apply: (p) => {
        p.bonusSpeedPercent += 15;
      }
    },
    {
      id: 'stamina',
      title: 'PULMÕES DO DEMÔNIO',
      category: 'RESISTÊNCIA',
      badgeColor: 0x06d6a0,
      icon: 'VIGOR',
      rarity: 'common',
      cardName: 'VIGOR',
      cardNameColor: C_SPEED,
      levelLabel: `ESTAMINA: ${player.maxStamina + 30}`,
      glowColor: 0xa855f7,
      description: '+30 Estamina Máxima\n\nCorra por mais tempo e recarregue fôlego mais rápido.',
      richLines: [
        [{ text: 'RECEBA ', color: C_WHITE }, { text: '+30 ESTAMINA', color: C_SPEED }],
        [{ text: 'E ', color: C_WHITE }, { text: '+20% RECARGA', color: C_SPEED }, { text: ' DE', color: C_WHITE }],
        [{ text: 'FÔLEGO NO SPRINT', color: C_WHITE }]
      ],
      apply: (p) => {
        p.maxStamina += 30;
        p.cardBonusMaxStamina += 30;
        p.currentStamina = p.maxStamina;
        p.bonusStaminaPercent += 20;
      }
    },
    {
      id: 'magnet',
      title: 'ÍMÃ DE ALMAS',
      category: 'UTILIDADE',
      badgeColor: 0x3a86ff,
      icon: 'ÍMÃ',
      rarity: 'uncommon',
      cardName: 'ÍMÃ ASTRAL',
      cardNameColor: C_UTILITY,
      levelLabel: `RAIO: +${player.bonusPickupRadiusPercent + 50}%`,
      glowColor: 0x38bdf8,
      description: '+50% Raio de Coleta\n\nAtrai gemas de alma caídas a distâncias muito maiores.',
      richLines: [
        [{ text: 'AMPLIA ', color: C_WHITE }, { text: '+50% DO RAIO', color: C_UTILITY }],
        [{ text: 'PARA ATRAIR ', color: C_WHITE }, { text: 'GEMAS DE XP', color: C_SPEED }],
        [{ text: 'A LONGA DISTÂNCIA', color: C_WHITE }]
      ],
      apply: (p) => {
        p.bonusPickupRadiusPercent += 50;
      }
    },
    {
      id: 'vitality',
      title: 'VITALIDADE SANGRENTA',
      category: 'SOBREVIVÊNCIA',
      badgeColor: 0xff0054,
      icon: 'VIDA',
      rarity: 'uncommon',
      cardName: 'VITALIDADE',
      cardNameColor: C_LIFE,
      levelLabel: `HP MÁX: ${player.maxHp + 25}`,
      glowColor: 0x2ecc71,
      description: '+25 Vida Máxima\n\nCura 40 HP na hora e expande sua resistência vital.',
      richLines: [
        [{ text: 'CONCEDE ', color: C_WHITE }, { text: '+25 VIDA MÁX', color: C_LIFE }],
        [{ text: 'E RESTAURA ', color: C_WHITE }, { text: '40 DE VIDA', color: C_LIFE }],
        [{ text: 'IMEDIATAMENTE', color: C_WHITE }]
      ],
      apply: (p) => {
        p.maxHp += 25;
        p.cardBonusMaxHp += 25;
        p.heal(40);
      }
    }
  ];

  // Passiva 1: Regeneração de Vida contínua (0.2/s até 0.8/s)
  if (player.hpRegenPerSec < 0.8) {
    const nextRegen = Math.min(0.8, Number((player.hpRegenPerSec + 0.2).toFixed(1)));
    const level = Math.round(nextRegen / 0.2);
    catalog.push({
      id: 'hp_regen',
      title: 'REGENERAÇÃO SOMBRIA',
      category: `SOBREVIVÊNCIA // NÍVEL ${level}/4`,
      badgeColor: 0x2ec4b6,
      icon: 'REGEN',
      rarity: 'rare',
      cardName: 'REGENERAÇÃO',
      cardNameColor: C_LIFE,
      levelLabel: `NÍVEL ${level}/4`,
      glowColor: 0x10b981,
      description: `+0.2 HP por Segundo (${nextRegen.toFixed(1)}/0.8)\n\nCura contínua de sangue infernal restaurando sua vitalidade.`,
      richLines: [
        [{ text: 'REGENERA ', color: C_WHITE }, { text: '+0.2 VIDA/SEG', color: C_LIFE }],
        [{ text: 'DE FORMA CONTÍNUA', color: C_WHITE }],
        [{ text: 'TOTAL: ', color: C_WHITE }, { text: `${nextRegen.toFixed(1)} HP/SEG`, color: C_LIFE }]
      ],
      apply: (p) => {
        p.hpRegenPerSec = nextRegen;
      }
    });
  }

  // Passiva 2: Roubo de Vida por Acerto (0.1 até 0.3 HP)
  if (player.lifeStealPerHit < 0.3) {
    const nextSteal = Math.min(0.3, Number((player.lifeStealPerHit + 0.1).toFixed(1)));
    const level = Math.round(nextSteal / 0.1);
    catalog.push({
      id: 'life_steal',
      title: 'DRENO VITAL',
      category: `SOBREVIVÊNCIA // NÍVEL ${level}/3`,
      badgeColor: 0x8338ec,
      icon: 'DRENO',
      rarity: 'epic',
      cardName: 'DRENO VITAL',
      cardNameColor: C_LIFE,
      levelLabel: `NÍVEL ${level}/3`,
      glowColor: 0xef233c,
      description: `+0.1 HP Roubado por Golpe (${nextSteal.toFixed(1)}/0.3)\n\nRouba pequenas doses de vitalidade a cada acerto de suas armas.`,
      richLines: [
        [{ text: 'ROUBA ', color: C_WHITE }, { text: '+0.1 DE VIDA', color: C_LIFE }],
        [{ text: 'POR CADA GOLPE DAS', color: C_WHITE }],
        [{ text: 'ARMAS ', color: C_WEAPON }, { text: `(${nextSteal.toFixed(1)} HP/HIT)`, color: C_LIFE }]
      ],
      apply: (p) => {
        p.lifeStealPerHit = nextSteal;
      }
    });
  }

  // =========================================================================
  // RITMO DE COMBATE: CRÍTICOS, ESQUIVA, EXPLOSÃO DE CADÁVER E COMBO
  // =========================================================================

  const critChanceLevel = Math.round((player.critChance - CRIT_BALANCE.baseChance) / CRIT_BALANCE.chancePerCard);
  if (critChanceLevel < CRIT_BALANCE.maxChanceCards) {
    const nextChance = Math.round((player.critChance + CRIT_BALANCE.chancePerCard) * 100);
    catalog.push({
      id: 'crit_chance',
      title: 'OLHO DO ABISMO',
      category: `GOLPE CRÍTICO // NÍVEL ${critChanceLevel + 1}/${CRIT_BALANCE.maxChanceCards}`,
      badgeColor: COLORS.goldCrit,
      icon: 'CRIT',
      rarity: 'rare',
      cardName: 'OLHO ABISSAL',
      cardNameColor: C_DAMAGE,
      levelLabel: `NÍVEL ${critChanceLevel + 1}/${CRIT_BALANCE.maxChanceCards}`,
      glowColor: COLORS.goldCrit,
      description: `+${Math.round(CRIT_BALANCE.chancePerCard * 100)}% Chance de Crítico\n\nGolpes críticos causam dano multiplicado em qualquer arma.`,
      richLines: [
        [{ text: 'GANHE ', color: C_WHITE }, { text: `+${Math.round(CRIT_BALANCE.chancePerCard * 100)}% CRÍTICO`, color: C_DAMAGE }],
        [{ text: 'EM TODAS AS ', color: C_WHITE }, { text: 'ARMAS', color: C_WEAPON }],
        [{ text: 'TOTAL: ', color: C_WHITE }, { text: `${nextChance}% CHANCE`, color: C_UTILITY }]
      ],
      apply: (p) => {
        p.critChance = Number((p.critChance + CRIT_BALANCE.chancePerCard).toFixed(2));
      }
    });
  }

  const critDamageLevel = Math.round((player.critMultiplier - CRIT_BALANCE.baseMultiplier) / CRIT_BALANCE.multiplierPerCard);
  if (critDamageLevel < CRIT_BALANCE.maxMultiplierCards) {
    const nextMult = player.critMultiplier + CRIT_BALANCE.multiplierPerCard;
    catalog.push({
      id: 'crit_damage',
      title: 'GOLPE FATAL',
      category: `GOLPE CRÍTICO // NÍVEL ${critDamageLevel + 1}/${CRIT_BALANCE.maxMultiplierCards}`,
      badgeColor: COLORS.crimsonHp,
      icon: 'FATAL',
      rarity: 'epic',
      cardName: 'GOLPE FATAL',
      cardNameColor: C_DAMAGE,
      levelLabel: `NÍVEL ${critDamageLevel + 1}/${CRIT_BALANCE.maxMultiplierCards}`,
      glowColor: COLORS.crimsonHp,
      description: `Críticos causam x${nextMult.toFixed(1)} de dano\n\nCada golpe crítico fica ainda mais devastador.`,
      richLines: [
        [{ text: 'SEUS ', color: C_WHITE }, { text: 'CRÍTICOS', color: C_DAMAGE }, { text: ' PASSAM', color: C_WHITE }],
        [{ text: 'A CAUSAR ', color: C_WHITE }, { text: `x${nextMult.toFixed(1)} DANO`, color: C_DAMAGE }],
        [{ text: 'EM TODAS AS ', color: C_WHITE }, { text: 'ARMAS', color: C_WEAPON }]
      ],
      apply: (p) => {
        p.critMultiplier += CRIT_BALANCE.multiplierPerCard;
      }
    });
  }

  if (player.dashMasteryLevel < DASH_BALANCE.maxCards) {
    const nextLvl = player.dashMasteryLevel + 1;
    const dashDmg = Math.round(nextLvl * DASH_BALANCE.damagePerCard * dmgMult);
    catalog.push({
      id: 'dash_mastery',
      title: 'PASSO SOMBRIO',
      category: `MOBILIDADE // NÍVEL ${nextLvl}/${DASH_BALANCE.maxCards}`,
      badgeColor: FX_COLORS.dashGhost,
      icon: 'PASSO',
      rarity: 'rare',
      cardName: 'PASSO SOMBRIO',
      cardNameColor: C_SPEED,
      levelLabel: `NÍVEL ${nextLvl}/${DASH_BALANCE.maxCards}`,
      glowColor: FX_COLORS.dashGhost,
      description: `Esquiva que Corta\n\nA esquiva fere quem estiver no caminho (${dashDmg} de dano) e gasta menos fôlego.`,
      richLines: [
        [{ text: 'SUA ', color: C_WHITE }, { text: 'ESQUIVA', color: C_SPEED }, { text: ' CORTA', color: C_WHITE }],
        [{ text: 'CAUSANDO ', color: C_WHITE }, { text: `${dashDmg} DE DANO`, color: C_DAMAGE }],
        [{ text: 'E GASTA ', color: C_WHITE }, { text: `-${DASH_BALANCE.costReductionPerCard} FÔLEGO`, color: C_SPEED }]
      ],
      apply: (p) => {
        p.dashMasteryLevel += 1;
      }
    });
  }

  if (player.corpseExplosionLevel < CORPSE_EXPLOSION_BALANCE.maxCards) {
    const nextLvl = player.corpseExplosionLevel + 1;
    const boomDmg = Math.round((CORPSE_EXPLOSION_BALANCE.baseDamage + nextLvl * CORPSE_EXPLOSION_BALANCE.damagePerCard) * dmgMult);
    catalog.push({
      id: 'corpse_explosion',
      title: 'ALMA INSTÁVEL',
      category: `REAÇÃO EM CADEIA // NÍVEL ${nextLvl}/${CORPSE_EXPLOSION_BALANCE.maxCards}`,
      badgeColor: FX_COLORS.corpseExplosion,
      icon: 'BOOM',
      rarity: 'epic',
      cardName: 'ALMA INSTÁVEL',
      cardNameColor: C_WEAPON,
      levelLabel: `NÍVEL ${nextLvl}/${CORPSE_EXPLOSION_BALANCE.maxCards}`,
      glowColor: COLORS.corruptedSoulPurple,
      description: `Monstros Explodem ao Morrer\n\n${Math.round(nextLvl * CORPSE_EXPLOSION_BALANCE.chancePerCard * 100)}% de chance de explodir em área, podendo encadear.`,
      richLines: [
        [{ text: 'MONSTROS TÊM ', color: C_WHITE }, { text: `${Math.round(nextLvl * CORPSE_EXPLOSION_BALANCE.chancePerCard * 100)}%`, color: C_UTILITY }],
        [{ text: 'DE ', color: C_WHITE }, { text: 'EXPLODIR', color: C_WEAPON }, { text: ' AO MORRER', color: C_WHITE }],
        [{ text: `${boomDmg} DE DANO`, color: C_DAMAGE }, { text: ' EM ÁREA', color: C_WHITE }]
      ],
      apply: (p) => {
        p.corpseExplosionLevel += 1;
      }
    });
  }

  if (player.bloodthirstLevel < BLOODTHIRST_BALANCE.maxCards) {
    const nextLvl = player.bloodthirstLevel + 1;
    catalog.push({
      id: 'bloodthirst',
      title: 'SEDE DE SANGUE',
      category: `COMBO // NÍVEL ${nextLvl}/${BLOODTHIRST_BALANCE.maxCards}`,
      badgeColor: FX_COLORS.frenzyAura,
      icon: 'SEDE',
      rarity: 'uncommon',
      cardName: 'SEDE SANGUE',
      cardNameColor: C_DAMAGE,
      levelLabel: `NÍVEL ${nextLvl}/${BLOODTHIRST_BALANCE.maxCards}`,
      glowColor: FX_COLORS.frenzyAura,
      description: 'Combo e Frenesi Duram Mais\n\nMais tempo para manter a sequência de abates e Frenesi prolongado.',
      richLines: [
        [{ text: 'COMBO DURA ', color: C_WHITE }, { text: `+${(BLOODTHIRST_BALANCE.comboWindowBonusMs / 1000).toFixed(1)}s`, color: C_SPEED }],
        [{ text: 'E O ', color: C_WHITE }, { text: 'FRENESI', color: C_DAMAGE }, { text: ' GANHA', color: C_WHITE }],
        [{ text: `+${BLOODTHIRST_BALANCE.frenzyDurationBonusMs / 1000}s`, color: C_SPEED }, { text: ' DE DURAÇÃO', color: C_WHITE }]
      ],
      apply: (p) => {
        p.bloodthirstLevel += 1;
      }
    });
  }

  // =========================================================================
  // ARMAS ATIVAS E SUAS MELHORIAS (NÍVEL 1 A 5/6)
  // =========================================================================

  // 0. DISPARO DE ALMAS (Soul Bolt - Nível 2 ao 5)
  if (soulBoltWeapon && !soulBoltWeapon.isEvolved && !soulBoltWeapon.isMaxLevel()) {
    const nextLvl = soulBoltWeapon.getLevel() + 1;
    const nextDmg = Math.round((25 + (nextLvl - 1) * 6) * dmgMult);
    catalog.unshift({
      id: 'soul_bolt_upgrade',
      title: 'DISPARO DE ALMAS',
      category: `MELHORIA // NÍVEL ${nextLvl}/5`,
      badgeColor: 0x00f5d4,
      icon: 'ALMAS',
      rarity: 'rare',
      cardName: 'ALMAS',
      cardNameColor: C_WEAPON,
      levelLabel: `NÍVEL ${nextLvl}/5`,
      glowColor: 0x00f5d4,
      description: `+Dano Espiritual e +Cadência (Nív ${nextLvl}/5)\n\nAumenta a potência dos disparos astrais e a velocidade dos projéteis!`,
      richLines: [
        [{ text: 'POTENCIALIZA O ', color: C_WHITE }, { text: 'DISPARO DE ALMAS', color: C_WEAPON }],
        [{ text: 'CAUSANDO ', color: C_WHITE }, { text: `${nextDmg} DE DANO`, color: C_DAMAGE }],
        [{ text: 'E ', color: C_WHITE }, { text: '+VELOCIDADE', color: C_SPEED }, { text: ' DE PROJÉTIL', color: C_WHITE }]
      ],
      apply: () => {
        soulBoltWeapon.upgrade();
      }
    });
  }

  // 1. LÂMINAS ORBITAIS (Void Scythes / Foice)
  if (!scythesWeapon) {
    const scytheDmg = Math.round(28 * dmgMult);
    catalog.unshift({
      id: 'void_scythes',
      title: 'LÂMINAS ORBITAIS',
      category: 'NOVA ARMA // NÍVEL 1',
      badgeColor: 0xf72585,
      icon: 'FOICE',
      rarity: 'rare',
      cardName: 'FOICE',
      cardNameColor: C_WEAPON,
      levelLabel: 'NOVA ARMA',
      glowColor: 0xfacc15,
      description: `Foice Mística em Órbita\n\nVocê recebe uma foice que gira ao redor causando ${scytheDmg} de dano!`,
      richLines: [
        [{ text: 'VOCÊ RECEBE UMA ', color: C_WHITE }, { text: 'FOICE', color: C_WEAPON }],
        [{ text: 'QUE GIRA AO REDOR', color: C_WHITE }],
        [{ text: 'CAUSANDO ', color: C_WHITE }, { text: `${scytheDmg} DE DANO`, color: C_DAMAGE }]
      ],
      apply: (p, gs) => {
        gs.weapons.push(new VoidScythesWeapon(gs, p));
      }
    });
  } else if (!scythesWeapon.isEvolved && !scythesWeapon.isMaxBlades()) {
    const nextBlades = scythesWeapon.getBladeCount() + 1;
    const scytheDmg = Math.round(28 * dmgMult);
    catalog.unshift({
      id: 'void_scythes_upgrade',
      title: 'LÂMINAS ORBITAIS',
      category: `MELHORIA // ${nextBlades} LÂMINAS`,
      badgeColor: 0xf72585,
      icon: 'FOICE',
      rarity: 'rare',
      cardName: 'FOICE +1',
      cardNameColor: C_WEAPON,
      levelLabel: `${nextBlades}/6 FOICES`,
      glowColor: 0x9b5de5,
      description: `+1 Lâmina em Órbita (${nextBlades}/6)\n\nAdiciona mais uma foice girando e causando ${scytheDmg} de dano!`,
      richLines: [
        [{ text: 'ADICIONA ', color: C_WHITE }, { text: '+1 FOICE', color: C_WEAPON }],
        [{ text: 'EM ÓRBITA ', color: C_WHITE }, { text: `(${nextBlades}/6)`, color: C_UTILITY }],
        [{ text: 'CAUSANDO ', color: C_WHITE }, { text: `${scytheDmg} DE DANO`, color: C_DAMAGE }]
      ],
      apply: () => {
        scythesWeapon.addBlade();
      }
    });
  }

  // 2. CHAMAS DO PURGATÓRIO (Hellfire Aura)
  if (!hellfireWeapon) {
    const fireDmg = Math.round(22 * dmgMult);
    catalog.unshift({
      id: 'hellfire_aura',
      title: 'CHAMAS DO PURGATÓRIO',
      category: 'NOVA ARMA // NÍVEL 1',
      badgeColor: 0xff4500,
      icon: 'CHAMAS',
      rarity: 'rare',
      cardName: 'CHAMAS',
      cardNameColor: C_WEAPON,
      levelLabel: 'NOVA ARMA',
      glowColor: 0xff4500,
      description: 'Aura Vulcânica Devoradora\n\nEmite pulsos periódicos de fogo infernal calcinando monstros em área!',
      richLines: [
        [{ text: 'LIBERA ', color: C_WHITE }, { text: 'AURA DE FOGO', color: C_WEAPON }],
        [{ text: 'QUE QUEIMA EM ÁREA', color: C_WHITE }],
        [{ text: 'CAUSANDO ', color: C_WHITE }, { text: `${fireDmg} DE DANO`, color: C_DAMAGE }]
      ],
      apply: (p, gs) => {
        gs.weapons.push(new HellfireAuraWeapon(gs, p));
      }
    });
  } else if (!hellfireWeapon.isEvolved && !hellfireWeapon.isMaxLevel()) {
    const nextLvl = hellfireWeapon.getLevel() + 1;
    const nextDmg = Math.round((22 + (nextLvl - 1) * 7) * dmgMult);
    catalog.unshift({
      id: 'hellfire_aura_upgrade',
      title: 'CHAMAS DO PURGATÓRIO',
      category: `MELHORIA // NÍVEL ${nextLvl}/5`,
      badgeColor: 0xff4500,
      icon: 'CHAMAS',
      rarity: 'rare',
      cardName: 'CHAMAS',
      cardNameColor: C_WEAPON,
      levelLabel: `NÍVEL ${nextLvl}/5`,
      glowColor: 0xff4500,
      description: `+Raio e Dano Ígneo (Nív ${nextLvl}/5)\n\nExpande o raio da onda de chamas e intensifica o calor das cinzas!`,
      richLines: [
        [{ text: 'EXPANDE A ', color: C_WHITE }, { text: 'AURA DE FOGO', color: C_WEAPON }],
        [{ text: 'EM ', color: C_WHITE }, { text: '+18 RAIO', color: C_UTILITY }, { text: ' E CAUSA', color: C_WHITE }],
        [{ text: `${nextDmg} DE DANO`, color: C_DAMAGE }, { text: ' EM ÁREA', color: C_WHITE }]
      ],
      apply: () => {
        hellfireWeapon.upgrade();
      }
    });
  }

  // 3. ADAGAS DE SANGUE (Blood Daggers)
  if (!daggersWeapon) {
    const dagDmg = Math.round(15 * dmgMult);
    catalog.unshift({
      id: 'blood_daggers',
      title: 'ADAGAS DE SANGUE',
      category: 'NOVA ARMA // NÍVEL 1',
      badgeColor: 0xef233c,
      icon: 'ADAGAS',
      rarity: 'rare',
      cardName: 'ADAGAS',
      cardNameColor: C_WEAPON,
      levelLabel: 'NOVA ARMA',
      glowColor: 0xef233c,
      description: 'Leque Carmesim Frontal\n\nArremessa 3 adagas afiadas em alta velocidade na direção do olhar!',
      richLines: [
        [{ text: 'LANÇA ', color: C_WHITE }, { text: '3 ADAGAS', color: C_WEAPON }],
        [{ text: 'VELOZES À FRENTE', color: C_WHITE }],
        [{ text: 'CAUSANDO ', color: C_WHITE }, { text: `${dagDmg} DE DANO`, color: C_DAMAGE }]
      ],
      apply: (p, gs) => {
        gs.weapons.push(new BloodDaggersWeapon(gs, p));
      }
    });
  } else if (!daggersWeapon.isEvolved && !daggersWeapon.isMaxLevel()) {
    const nextLvl = daggersWeapon.getLevel() + 1;
    const nextCount = 3 + (nextLvl - 1);
    const nextDmg = Math.round((15 + (nextLvl - 1) * 4) * dmgMult);
    catalog.unshift({
      id: 'blood_daggers_upgrade',
      title: 'ADAGAS DE SANGUE',
      category: `MELHORIA // NÍVEL ${nextLvl}/5`,
      badgeColor: 0xef233c,
      icon: 'ADAGAS',
      rarity: 'rare',
      cardName: 'ADAGAS',
      cardNameColor: C_WEAPON,
      levelLabel: `NÍVEL ${nextLvl}/5`,
      glowColor: 0xef233c,
      description: `+1 Adaga no Leque e +Dano (Nív ${nextLvl}/5)\n\nAmplia a rajada carmesim e reduz o tempo entre arremessos!`,
      richLines: [
        [{ text: 'DISPARA ', color: C_WHITE }, { text: `${nextCount} ADAGAS`, color: C_WEAPON }],
        [{ text: 'NO LEQUE CAUSANDO', color: C_WHITE }],
        [{ text: `${nextDmg} DE DANO`, color: C_DAMAGE }, { text: ' CADA', color: C_WHITE }]
      ],
      apply: () => {
        daggersWeapon.upgrade();
      }
    });
  }

  // 4. CADEIAS ABISSAIS (Abyssal Chains)
  if (!chainsWeapon) {
    const chainDmg = Math.round(19 * dmgMult);
    catalog.unshift({
      id: 'abyssal_chains',
      title: 'CADEIAS ABISSAIS',
      category: 'NOVA ARMA // NÍVEL 1',
      badgeColor: 0x9d4edd,
      icon: 'GRILHÃO',
      rarity: 'epic',
      cardName: 'GRILHÃO',
      cardNameColor: C_WEAPON,
      levelLabel: 'NOVA ARMA',
      glowColor: 0x9d4edd,
      description: 'Correntes de Controle de Grupo\n\nChicoteia e prende grupos de inimigos próximos com grilhões sombrios!',
      richLines: [
        [{ text: 'INVOCA ', color: C_WHITE }, { text: 'CORRENTES', color: C_WEAPON }],
        [{ text: 'QUE APLICAM ', color: C_WHITE }, { text: 'LENTIDÃO', color: C_SPEED }],
        [{ text: 'E CAUSAM ', color: C_WHITE }, { text: `${chainDmg} DE DANO`, color: C_DAMAGE }]
      ],
      apply: (p, gs) => {
        gs.weapons.push(new AbyssalChainsWeapon(gs, p));
      }
    });
  } else if (!chainsWeapon.isEvolved && !chainsWeapon.isMaxLevel()) {
    const nextLvl = chainsWeapon.getLevel() + 1;
    const nextDmg = Math.round((19 + (nextLvl - 1) * 6) * dmgMult);
    catalog.unshift({
      id: 'abyssal_chains_upgrade',
      title: 'CADEIAS ABISSAIS',
      category: `MELHORIA // NÍVEL ${nextLvl}/5`,
      badgeColor: 0x9d4edd,
      icon: 'GRILHÃO',
      rarity: 'epic',
      cardName: 'GRILHÃO',
      cardNameColor: C_WEAPON,
      levelLabel: `NÍVEL ${nextLvl}/5`,
      glowColor: 0x9d4edd,
      description: `+1 Alvo, +Alcance e +Paralisia (Nív ${nextLvl}/5)\n\nEncadeia mais monstros e prolonga o tempo do grilhão!`,
      richLines: [
        [{ text: 'PRENDE ', color: C_WHITE }, { text: '+1 ALVO', color: C_UTILITY }, { text: ' COM', color: C_WHITE }],
        [{ text: 'CORRENTES', color: C_WEAPON }, { text: ' CAUSANDO', color: C_WHITE }],
        [{ text: `${nextDmg} DE DANO`, color: C_DAMAGE }, { text: ' E ', color: C_WHITE }, { text: 'PARALISIA', color: C_SPEED }]
      ],
      apply: () => {
        chainsWeapon.upgrade();
      }
    });
  }

  // 5. METEORO INFERNAL (Infernal Meteor)
  if (!meteorWeapon) {
    const metDmg = Math.round(46 * dmgMult);
    catalog.unshift({
      id: 'infernal_meteor',
      title: 'METEORO INFERNAL',
      category: 'NOVA ARMA // NÍVEL 1',
      badgeColor: 0xff7b00,
      icon: 'METEORO',
      rarity: 'epic',
      cardName: 'METEORO',
      cardNameColor: C_WEAPON,
      levelLabel: 'NOVA ARMA',
      glowColor: 0xff7b00,
      description: 'Bombardeio Vulcânico Celeste\n\nInvoca rochas incandescentes do céu que explodem sobre a horda!',
      richLines: [
        [{ text: 'INVOCA UM ', color: C_WHITE }, { text: 'METEORO', color: C_WEAPON }],
        [{ text: 'EXPLOSIVO DO CÉU', color: C_WHITE }],
        [{ text: 'CAUSANDO ', color: C_WHITE }, { text: `${metDmg} DE DANO`, color: C_DAMAGE }]
      ],
      apply: (p, gs) => {
        gs.weapons.push(new InfernalMeteorWeapon(gs, p));
      }
    });
  } else if (!meteorWeapon.isEvolved && !meteorWeapon.isMaxLevel()) {
    const nextLvl = meteorWeapon.getLevel() + 1;
    const nextDmg = Math.round((46 + (nextLvl - 1) * 10) * dmgMult);
    catalog.unshift({
      id: 'infernal_meteor_upgrade',
      title: 'METEORO INFERNAL',
      category: `MELHORIA // NÍVEL ${nextLvl}/5`,
      badgeColor: 0xff7b00,
      icon: 'METEORO',
      rarity: 'epic',
      cardName: 'METEORO',
      cardNameColor: C_WEAPON,
      levelLabel: `NÍVEL ${nextLvl}/5`,
      glowColor: 0xff7b00,
      description: `+Dano Explosivo e +Meteoros (Nív ${nextLvl}/5)\n\nAumenta o poder da cratera e a cadência do bombardeio!`,
      richLines: [
        [{ text: 'FORTALECE O ', color: C_WHITE }, { text: 'METEORO', color: C_WEAPON }],
        [{ text: 'EM ', color: C_WHITE }, { text: '+ÁREA', color: C_UTILITY }, { text: ' CAUSANDO', color: C_WHITE }],
        [{ text: `${nextDmg} DE DANO`, color: C_DAMAGE }, { text: ' EM ÁREA', color: C_WHITE }]
      ],
      apply: () => {
        meteorWeapon.upgrade();
      }
    });
  }

  return catalog;
}

/**
 * Retorna até 3 cartas de Evolução Suprema das armas equipadas e ainda não evoluídas.
 * Concedido exclusivamente ao capturar 100% de um Altar de Ascensão.
 */
export function getAltarEvolutionCards(player: BaseCharacter, gameScene: UpgradeGameScene): UpgradeCard[] {
  const weapons: BaseWeapon[] = gameScene.weapons || [];
  const dmgMult = 1 + (player.bonusDamagePercent || 0) / 100;
  const cards: UpgradeCard[] = [];

  const soulBoltWeapon = weapons.find((w) => w instanceof SoulBoltWeapon) as SoulBoltWeapon | undefined;
  const scythesWeapon = weapons.find((w) => w instanceof VoidScythesWeapon) as VoidScythesWeapon | undefined;
  const hellfireWeapon = weapons.find((w) => w instanceof HellfireAuraWeapon) as HellfireAuraWeapon | undefined;
  const daggersWeapon = weapons.find((w) => w instanceof BloodDaggersWeapon) as BloodDaggersWeapon | undefined;
  const chainsWeapon = weapons.find((w) => w instanceof AbyssalChainsWeapon) as AbyssalChainsWeapon | undefined;
  const meteorWeapon = weapons.find((w) => w instanceof InfernalMeteorWeapon) as InfernalMeteorWeapon | undefined;

  // 1. RAIO DO APOCALIPSE (Evolução de SoulBolt - Exige Nível 5 Máximo)
  if (soulBoltWeapon && !soulBoltWeapon.isEvolved && soulBoltWeapon.isMaxLevel()) {
    const evoDmg = Math.round(46 * dmgMult);
    cards.push({
      id: 'evo_soul_bolt',
      title: 'RAIO DO APOCALIPSE',
      category: 'EVOLUÇÃO SUPREMA // ASCENSÃO',
      badgeColor: 0xffba08,
      icon: 'ASCENSÃO',
      isEvolution: true,
      rarity: 'supreme',
      cardName: 'APOCALIPSE',
      cardNameColor: C_EVO,
      levelLabel: 'DISPARO DE ALMAS',
      glowColor: 0xffe600,
      description: 'Disparos convertidos em raios astrais dourados de alta cadência e perfuração massiva.',
      richLines: [
        [{ text: 'EVOLUI PARA ', color: C_WHITE }, { text: 'RAIO ASTRAL', color: C_WEAPON }],
        [{ text: 'DE ALTA CADÊNCIA COM', color: C_WHITE }],
        [{ text: `${evoDmg} DE DANO`, color: C_DAMAGE }, { text: ' E ', color: C_WHITE }, { text: '3 PERFURAÇÕES', color: C_UTILITY }]
      ],
      apply: () => {
        soulBoltWeapon.evolve();
      }
    });
  }

  // 2. CEIFADORA DO VAZIO (Evolução de VoidScythes - Exige 6 Lâminas Máximas)
  if (scythesWeapon && !scythesWeapon.isEvolved && scythesWeapon.isMaxBlades()) {
    const evoDmg = Math.round(22 * dmgMult);
    cards.push({
      id: 'evo_void_scythes',
      title: 'CEIFADORA DO VAZIO',
      category: 'EVOLUÇÃO SUPREMA // ASCENSÃO',
      badgeColor: 0xffba08,
      icon: 'ASCENSÃO',
      isEvolution: true,
      rarity: 'supreme',
      cardName: 'CEIFADORA',
      cardNameColor: C_EVO,
      levelLabel: 'LÂMINAS ORBITAIS',
      glowColor: 0xffe600,
      description: 'Funde as foices em um vórtice carmesim hiper-veloz de corte letal contínuo.',
      richLines: [
        [{ text: 'FUNDE AS FOICES EM', color: C_WHITE }],
        [{ text: 'VÓRTICE DO VAZIO', color: C_WEAPON }, { text: ' ULTRA-VELOZ', color: C_SPEED }],
        [{ text: 'CAUSANDO ', color: C_WHITE }, { text: `${evoDmg} DE DANO`, color: C_DAMAGE }, { text: ' CONTÍNUO', color: C_WHITE }]
      ],
      apply: () => {
        scythesWeapon.evolve();
      }
    });
  }

  // 3. SUPERNOVA ABISSAL (Evolução de HellfireAura - Exige Nível 5 Máximo)
  if (hellfireWeapon && !hellfireWeapon.isEvolved && hellfireWeapon.isMaxLevel()) {
    const evoDmg = Math.round(78 * dmgMult);
    cards.push({
      id: 'evo_hellfire_aura',
      title: 'SUPERNOVA ABISSAL',
      category: 'EVOLUÇÃO SUPREMA // ASCENSÃO',
      badgeColor: 0xffba08,
      icon: 'ASCENSÃO',
      isEvolution: true,
      rarity: 'supreme',
      cardName: 'SUPERNOVA',
      cardNameColor: C_EVO,
      levelLabel: 'CHAMAS DO PURGATÓRIO',
      glowColor: 0xffe600,
      description: 'Ondas estelares azuis e douradas calcinando área colossal e restaurando vida.',
      richLines: [
        [{ text: 'CRIA UMA ', color: C_WHITE }, { text: 'SUPERNOVA GIGANTE', color: C_WEAPON }],
        [{ text: 'CAUSANDO ', color: C_WHITE }, { text: `${evoDmg} DE DANO`, color: C_DAMAGE }],
        [{ text: 'E ', color: C_WHITE }, { text: 'CURA +3 VIDA', color: C_LIFE }, { text: '/PULSO', color: C_WHITE }]
      ],
      apply: () => {
        hellfireWeapon.evolve();
      }
    });
  }

  // 4. CHUVA DE SANGUE CARMESIM (Evolução de BloodDaggers - Exige Nível 5 Máximo)
  if (daggersWeapon && !daggersWeapon.isEvolved && daggersWeapon.isMaxLevel()) {
    const evoDmg = Math.round(38 * dmgMult);
    cards.push({
      id: 'evo_blood_daggers',
      title: 'CHUVA CARMESIM',
      category: 'EVOLUÇÃO SUPREMA // ASCENSÃO',
      badgeColor: 0xffba08,
      icon: 'ASCENSÃO',
      isEvolution: true,
      rarity: 'supreme',
      cardName: 'CHUVA SANGUE',
      cardNameColor: C_EVO,
      levelLabel: 'ADAGAS DE SANGUE',
      glowColor: 0xffe600,
      description: 'Dispara 8 adagas espectrais de alta perfuração em leque quase ininterrupto.',
      richLines: [
        [{ text: 'DISPARA ', color: C_WHITE }, { text: '8 ADAGAS VELOZES', color: C_WEAPON }],
        [{ text: 'EM LEQUE QUASE CONTÍNUO', color: C_WHITE }],
        [{ text: `${evoDmg} DE DANO`, color: C_DAMAGE }, { text: ' E ', color: C_WHITE }, { text: '3 PERFURAÇÕES', color: C_UTILITY }]
      ],
      apply: () => {
        daggersWeapon.evolve();
      }
    });
  }

  // 5. GRILHÕES DO TARTARUS (Evolução de AbyssalChains - Exige Nível 5 Máximo)
  if (chainsWeapon && !chainsWeapon.isEvolved && chainsWeapon.isMaxLevel()) {
    const evoDmg = Math.round(54 * dmgMult);
    cards.push({
      id: 'evo_abyssal_chains',
      title: 'GRILHÕES TARTARUS',
      category: 'EVOLUÇÃO SUPREMA // ASCENSÃO',
      badgeColor: 0xffba08,
      icon: 'ASCENSÃO',
      isEvolution: true,
      rarity: 'supreme',
      cardName: 'TARTARUS',
      cardNameColor: C_EVO,
      levelLabel: 'CADEIAS ABISSAIS',
      glowColor: 0xffe600,
      description: 'Prende até 8 alvos em estacas abissais com atordoamento prolongado de 1.8s.',
      richLines: [
        [{ text: 'PRENDE ATÉ ', color: C_WHITE }, { text: '8 MONSTROS', color: C_UTILITY }],
        [{ text: 'EM ', color: C_WHITE }, { text: 'ESTACAS ABISSAIS', color: C_WEAPON }],
        [{ text: `${evoDmg} DE DANO`, color: C_DAMAGE }, { text: ' E ', color: C_WHITE }, { text: 'PARALISIA 1.8s', color: C_SPEED }]
      ],
      apply: () => {
        chainsWeapon.evolve();
      }
    });
  }

  // 6. CATACLISMO SOLAR (Evolução de InfernalMeteor - Exige Nível 5 Máximo)
  if (meteorWeapon && !meteorWeapon.isEvolved && meteorWeapon.isMaxLevel()) {
    const evoDmg = Math.round(95 * dmgMult);
    cards.push({
      id: 'evo_infernal_meteor',
      title: 'CATACLISMO SOLAR',
      category: 'EVOLUÇÃO SUPREMA // ASCENSÃO',
      badgeColor: 0xffba08,
      icon: 'ASCENSÃO',
      isEvolution: true,
      rarity: 'supreme',
      cardName: 'CATACLISMO',
      cardNameColor: C_EVO,
      levelLabel: 'METEORO INFERNAL',
      glowColor: 0xffe600,
      description: 'Bombardeio estelar massivo de 5 meteoros gigantes destruindo a horda.',
      richLines: [
        [{ text: 'BOMBARDEIA O MAPA COM', color: C_WHITE }],
        [{ text: '5 METEOROS GIGANTES', color: C_WEAPON }],
        [{ text: `${evoDmg} DE DANO`, color: C_DAMAGE }, { text: ' EM ÁREA COLOSSAL', color: C_WHITE }]
      ],
      apply: () => {
        meteorWeapon.evolve();
      }
    });
  }

  return cards;
}
