import { CRIT_BALANCE } from '../config/balance';

/** O que o resumo lê do personagem (só números; nada de Phaser, para dar para testar). */
export interface IRunBonusSource {
  bonusDamagePercent: number;
  bonusSpeedPercent: number;
  bonusPickupRadiusPercent: number;
  cardBonusMaxHp: number;
  cardBonusMaxStamina: number;
  extraProjectiles: number;
  extraPierce: number;
  critChance: number;
  critMultiplier: number;
  hpRegenPerSec: number;
  lifeStealPerHit: number;
  dashMasteryLevel: number;
  corpseExplosionLevel: number;
  bloodthirstLevel: number;
}

export interface IRunBonusEntry {
  /** Mesma arte do ícone da carta que dá o bônus. */
  iconKey: string;
  value: string;
  label: string;
}

const fmt1 = (n: number): string => (Math.round(n * 10) / 10).toString();

/**
 * Bônus ganhos nesta partida, na ordem em que aparecem no menu de pausa.
 * Só entra o que já mudou: uma partida nova mostra a lista vazia.
 */
export function buildRunBonuses(p: IRunBonusSource): IRunBonusEntry[] {
  const out: IRunBonusEntry[] = [];
  const add = (cond: boolean, iconKey: string, value: string, label: string): void => {
    if (cond) out.push({ iconKey, value, label });
  };

  add(p.bonusDamagePercent > 0, 'icon-blessing-might', `+${Math.round(p.bonusDamagePercent)}%`, 'DANO');
  add(p.bonusSpeedPercent > 0, 'icon-blessing-agility', `+${Math.round(p.bonusSpeedPercent)}%`, 'VELOCIDADE');
  add(p.cardBonusMaxHp > 0, 'icon-blessing-vitality', `+${p.cardBonusMaxHp}`, 'VIDA MÁX');
  add(p.cardBonusMaxStamina > 0, 'icon-card-stamina', `+${p.cardBonusMaxStamina}`, 'FÔLEGO');
  add(p.bonusPickupRadiusPercent > 0, 'icon-blessing-magnetism', `+${Math.round(p.bonusPickupRadiusPercent)}%`, 'COLETA');
  add(p.extraProjectiles > 0, 'icon-card-multishot', `+${p.extraProjectiles}`, 'PROJÉTEIS');
  add(p.extraPierce > 0, 'icon-card-pierce', `+${p.extraPierce}`, 'PERFURAÇÃO');
  add(p.critChance > CRIT_BALANCE.baseChance, 'icon-card-crit-chance', `${Math.round(p.critChance * 100)}%`, 'CRÍTICO');
  add(p.critMultiplier > CRIT_BALANCE.baseMultiplier, 'icon-card-crit-damage', `x${fmt1(p.critMultiplier)}`, 'DANO CRÍTICO');
  add(p.hpRegenPerSec > 0, 'icon-blessing-vitality', `${fmt1(p.hpRegenPerSec)}/s`, 'REGENERAÇÃO');
  add(p.lifeStealPerHit > 0, 'icon-blessing-vitality', `${fmt1(p.lifeStealPerHit)}`, 'ROUBO VIDA');
  add(p.dashMasteryLevel > 0, 'icon-card-dash', `NV ${p.dashMasteryLevel}`, 'PASSO SOMBRIO');
  add(p.corpseExplosionLevel > 0, 'icon-card-corpse-explosion', `NV ${p.corpseExplosionLevel}`, 'ALMA INSTÁVEL');
  add(p.bloodthirstLevel > 0, 'icon-card-bloodthirst', `NV ${p.bloodthirstLevel}`, 'SEDE SANGUE');
  return out;
}

/** Linha de baixo do título: em que modo e capítulo a partida está. */
export function describeRunMode(mode: 'story' | 'endless' | 'sandbox', chapter: number): string {
  if (mode === 'endless') return 'MODO INFINITO';
  if (mode === 'sandbox') return 'MODO DE TESTE';
  return `HISTÓRIA  ·  CAPÍTULO ${chapter}`;
}
