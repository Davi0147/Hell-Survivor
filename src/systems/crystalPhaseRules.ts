import { AZAZEL_BOSS_BALANCE } from '../config/balance';

const C = AZAZEL_BOSS_BALANCE.crystalPhase;

/** Força da horda da fase dos cristais: 1 ao entrar, sobe com o tempo até o teto. */
export function getCrystalHordeStrength(elapsedMs: number): number {
  return Math.min(C.hordeStrengthMax, 1 + (Math.max(0, elapsedMs) / 1000) * C.hordeStrengthPerSec);
}

/** Multiplicadores de vida e dano dos monstros para uma dada força. */
export function getCrystalHordeScaling(strength: number): { hp: number; damage: number } {
  return { hp: strength, damage: 1 + (strength - 1) * C.hordeDamageShare };
}

/** Intervalo entre levas: encurta conforme a força sobe, sem passar do mínimo. */
export function getCrystalWaveIntervalMs(strength: number): number {
  return Math.max(C.minWaveIntervalMs, Math.round(AZAZEL_BOSS_BALANCE.dimensionWaveIntervalMs / strength));
}

/** Vida do Azazel depois de `deltaMs` recuperando, sem passar do teto (nem baixar quem já está acima). */
export function getBossRegenHp(hp: number, maxHp: number, deltaMs: number): number {
  const cap = maxHp * C.bossRegenCap;
  if (hp >= cap) return hp;
  return Math.min(cap, hp + maxHp * C.bossRegenPerSec * (deltaMs / 1000));
}

/** Ponto dentro do círculo da fase: se a heroína passou da borda, volta para ela. */
export function clampToCircle(x: number, y: number, cx: number, cy: number, radius: number): { x: number; y: number; clamped: boolean } {
  const dx = x - cx;
  const dy = y - cy;
  const dist = Math.hypot(dx, dy);
  if (dist <= radius || dist === 0) return { x, y, clamped: false };
  return { x: cx + (dx / dist) * radius, y: cy + (dy / dist) * radius, clamped: true };
}
