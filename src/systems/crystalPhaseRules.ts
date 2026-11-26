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

/** Quantas mãos descem por tapa: uma no começo, duas depois que a fase se arrasta. */
export function handSlamCount(elapsedInPhaseMs: number): number {
  return elapsedInPhaseMs >= C.handSlam.secondHandAfterMs ? 2 : 1;
}

/**
 * Onde cada mão vai bater: a primeira em cima da heroína; a segunda onde ela vai estar se
 * continuar andando (`leadMs` à frente), para não dar para fugir em linha reta.
 */
export function handSlamTargets(
  count: number,
  px: number,
  py: number,
  vx: number,
  vy: number
): { x: number; y: number }[] {
  const targets = [{ x: px, y: py }];
  if (count >= 2) {
    const lead = C.handSlam.leadMs / 1000;
    const moving = Math.hypot(vx, vy) > 1;
    // Parada, a segunda mão cai ao lado, com um vão entre as duas para dar onde ficar
    targets.push(moving ? { x: px + vx * lead, y: py + vy * lead } : { x: px + C.handSlam.hitbox.width * 1.5, y: py });
  }
  return targets;
}

/** Retângulo do golpe (mão + braço) para quem marcou o ponto (cx, cy). */
export function handSlamRect(cx: number, cy: number): { left: number; top: number; width: number; height: number } {
  const hb = C.handSlam.hitbox;
  return { left: cx - hb.width / 2, top: cy - hb.above, width: hb.width, height: hb.above + hb.below };
}

/** A mão acertou quem está dentro do retângulo da mão e do braço. */
export function isInsideHandSlam(px: number, py: number, cx: number, cy: number): boolean {
  const r = handSlamRect(cx, cy);
  return px >= r.left && px <= r.left + r.width && py >= r.top && py <= r.top + r.height;
}

/**
 * Folga (px) da borda. Sem ela, o ponto devolvido à borda às vezes ficava 1e-13 px do lado de
 * fora (arredondamento), a borda disparava em todo quadro e a heroína travava ali.
 */
const EDGE_SLACK_PX = 0.5;

/** Ponto dentro do círculo da fase: se a heroína passou da borda, volta para um pouco dentro dela. */
export function clampToCircle(x: number, y: number, cx: number, cy: number, radius: number): { x: number; y: number; clamped: boolean } {
  const dx = x - cx;
  const dy = y - cy;
  const dist = Math.hypot(dx, dy);
  if (dist <= radius || dist === 0) return { x, y, clamped: false };
  const r = radius - EDGE_SLACK_PX;
  return { x: cx + (dx / dist) * r, y: cy + (dy / dist) * r, clamped: true };
}
