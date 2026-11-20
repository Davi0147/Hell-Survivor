import { HORDE_EVENT_BALANCE } from '../config/balance';
import { storyHasElites } from './encounterRules';

export type HordeEventType = 'siege' | 'ambush' | 'thief' | 'elite_pack' | 'blood_moon';

/**
 * Quais eventos de horda podem acontecer agora. Função pura (sem Phaser), para ser testável.
 * `minutes` é o tempo de partida.
 */
export function getEligibleHordeEvents(
  gameMode: 'story' | 'endless' | 'sandbox',
  chapter: number,
  minutes: number,
  isThiefAlive: boolean,
  isBloodMoonActive: boolean
): HordeEventType[] {
  const events: HordeEventType[] = ['siege'];
  if (minutes >= 1) events.push('ambush');
  if (!isThiefAlive) events.push('thief');

  const isLateRealm = gameMode === 'endless' || chapter >= 2;
  const hasElites = gameMode === 'endless' || storyHasElites(chapter);
  if (hasElites && minutes >= HORDE_EVENT_BALANCE.elitePack.minMinutes) events.push('elite_pack');
  if (isLateRealm && !isBloodMoonActive && minutes >= HORDE_EVENT_BALANCE.bloodMoon.minMinutes) events.push('blood_moon');
  return events;
}
