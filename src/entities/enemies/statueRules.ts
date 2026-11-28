/**
 * Regras puras do Guardião de Mármore (sem Phaser, testadas em `statueGuardian.test.ts`).
 */

/** A heroína está dentro da área do martelo? */
export function isInsideSlam(px: number, py: number, cx: number, cy: number, radius: number): boolean {
  return Math.hypot(px - cx, py - cy) <= radius;
}

/**
 * Aparência da marcação no chão conforme o martelo sobe (0 = começou, 1 = vai bater):
 * o preenchimento cresce e a borda pisca cada vez mais rápido no fim, avisando a batida.
 */
export function statueSlamPhase(progress: number): { fillAlpha: number; edgeAlpha: number } {
  const p = Math.min(1, Math.max(0, progress));
  const blinkSpeed = p < 0.6 ? 10 : 28;
  const blink = 0.55 + 0.45 * Math.abs(Math.sin(p * blinkSpeed));
  return { fillAlpha: 0.35 + 0.65 * p, edgeAlpha: blink };
}
