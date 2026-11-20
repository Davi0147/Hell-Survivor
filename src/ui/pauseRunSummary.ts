import { CRIT_BALANCE, LIFE_STEAL_BALANCE } from '../config/balance';

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
  /** Nome e explicação mostrados ao clicar no bônus. */
  title: string;
  description: string;
}

const fmt1 = (n: number): string => (Math.round(n * 10) / 10).toString();

/**
 * Bônus ganhos nesta partida, na ordem em que aparecem no menu de pausa.
 * Só entra o que já mudou: uma partida nova mostra a lista vazia.
 */
export function buildRunBonuses(p: IRunBonusSource): IRunBonusEntry[] {
  const out: IRunBonusEntry[] = [];
  const add = (cond: boolean, iconKey: string, value: string, label: string, title: string, description: string): void => {
    if (cond) out.push({ iconKey, value, label, title, description });
  };
  const pct = (n: number): string => `${Math.round(n)}%`;

  add(p.bonusDamagePercent > 0, 'icon-blessing-might', `+${pct(p.bonusDamagePercent)}`, 'DANO', 'FÚRIA',
    `Todas as armas causam +${pct(p.bonusDamagePercent)} de dano.`);
  add(p.bonusSpeedPercent > 0, 'icon-blessing-agility', `+${pct(p.bonusSpeedPercent)}`, 'VELOCIDADE', 'CELERIDADE',
    `A Nixy anda e corre ${pct(p.bonusSpeedPercent)} mais rápido.`);
  add(p.cardBonusMaxHp > 0, 'icon-blessing-vitality', `+${p.cardBonusMaxHp}`, 'VIDA MÁX', 'VITALIDADE',
    `A vida máxima aumentou ${p.cardBonusMaxHp} pontos nesta partida.`);
  add(p.cardBonusMaxStamina > 0, 'icon-card-stamina', `+${p.cardBonusMaxStamina}`, 'FÔLEGO', 'VIGOR',
    `A estamina máxima aumentou ${p.cardBonusMaxStamina} pontos: dá para correr por mais tempo.`);
  add(p.bonusPickupRadiusPercent > 0, 'icon-blessing-magnetism', `+${pct(p.bonusPickupRadiusPercent)}`, 'COLETA', 'ÍMÃ ASTRAL',
    `Gemas e almas são puxadas de ${pct(p.bonusPickupRadiusPercent)} mais longe.`);
  add(p.extraProjectiles > 0, 'icon-card-multishot', `+${p.extraProjectiles}`, 'PROJÉTEIS', 'ALMA EXTRA',
    `Cada rajada solta ${p.extraProjectiles} projétil(eis) a mais.`);
  add(p.extraPierce > 0, 'icon-card-pierce', `+${p.extraPierce}`, 'PERFURAÇÃO', 'PERFURAÇÃO',
    `Tiros e adagas atravessam ${p.extraPierce} monstro(s) a mais antes de sumir.`);
  add(p.critChance > CRIT_BALANCE.baseChance, 'icon-card-crit-chance', pct(p.critChance * 100), 'CRÍTICO', 'OLHO ABISSAL',
    `Cada golpe tem ${pct(p.critChance * 100)} de chance de ser crítico (dano multiplicado).`);
  add(p.critMultiplier > CRIT_BALANCE.baseMultiplier, 'icon-card-crit-damage', `x${fmt1(p.critMultiplier)}`, 'DANO CRÍTICO', 'GOLPE FATAL',
    `Golpes críticos causam ${fmt1(p.critMultiplier)} vezes o dano normal.`);
  add(p.hpRegenPerSec > 0, 'icon-blessing-vitality', `${fmt1(p.hpRegenPerSec)}/s`, 'REGENERAÇÃO', 'REGENERAÇÃO',
    `A Nixy recupera ${fmt1(p.hpRegenPerSec)} de vida por segundo, sem parar.`);
  add(p.lifeStealPerHit > 0, 'icon-blessing-vitality', `${fmt1(p.lifeStealPerHit)}`, 'ROUBO VIDA', 'DRENO VITAL',
    `Cada acerto das armas devolve ${fmt1(p.lifeStealPerHit)} de vida, até ${LIFE_STEAL_BALANCE.maxHealPerSec} de vida por segundo.`);
  add(p.dashMasteryLevel > 0, 'icon-card-dash', `NV ${p.dashMasteryLevel}`, 'PASSO SOMBRIO', 'PASSO SOMBRIO',
    'A esquiva corta os monstros no caminho e gasta menos fôlego. Cada nível aumenta o dano do corte.');
  add(p.corpseExplosionLevel > 0, 'icon-card-corpse-explosion', `NV ${p.corpseExplosionLevel}`, 'ALMA INSTÁVEL', 'ALMA INSTÁVEL',
    'Monstros podem explodir ao morrer, ferindo os vizinhos (e as explosões podem encadear). Cada nível aumenta a chance.');
  add(p.bloodthirstLevel > 0, 'icon-card-bloodthirst', `NV ${p.bloodthirstLevel}`, 'SEDE SANGUE', 'SEDE DE SANGUE',
    'O combo de abates e o Frenesi duram mais antes de acabar.');
  return out;
}

/** Linha de baixo do título: em que modo e capítulo a partida está. */
export function describeRunMode(mode: 'story' | 'endless' | 'sandbox', chapter: number): string {
  if (mode === 'endless') return 'MODO INFINITO';
  if (mode === 'sandbox') return 'MODO DE TESTE';
  return `HISTÓRIA  ·  CAPÍTULO ${chapter}`;
}
