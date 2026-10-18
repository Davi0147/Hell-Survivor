/**
 * statusEffects.ts
 * Módulo puro responsável pelas regras de controle de grupo (CC),
 * contagem regressiva de timers e cálculo de prioridade de tints visuais.
 */

export interface StatusEffectsState {
  rootTimer: number;
  slowTimer: number;
  knockbackTimer: number;
  isRooted: boolean;
  speedDebuffMultiplier: number;
}

export const STATUS_TINTS = {
  ROOT: 0x55ff77, // Verde ácido do enraizamento
  SLOW: 0x70e000, // Verde tóxico do lodo
} as const;

/**
 * Retorna a coloração visual baseada na prioridade estrita:
 * Root (0x55ff77) > Slow (0x70e000) > Normal (null).
 */
export function getStatusEffectTint(
  state: Partial<Pick<StatusEffectsState, 'isRooted' | 'rootTimer' | 'slowTimer'>>
): number | null {
  if (state.isRooted || (state.rootTimer !== undefined && state.rootTimer > 0)) {
    return STATUS_TINTS.ROOT;
  }
  if (state.slowTimer !== undefined && state.slowTimer > 0) {
    return STATUS_TINTS.SLOW;
  }
  return null;
}

/**
 * Aplica o efeito de enraizamento ácido na máquina de status.
 */
export function applyAcidRoot(
  state: StatusEffectsState,
  durationMs: number = 1000
): number {
  state.isRooted = true;
  state.rootTimer = durationMs;
  return STATUS_TINTS.ROOT;
}

/**
 * Aplica o efeito de lentidão na máquina de status.
 */
export function applySlow(
  state: StatusEffectsState,
  multiplier: number = 0.60,
  durationMs: number = 600
): number | null {
  state.speedDebuffMultiplier = Math.min(state.speedDebuffMultiplier, multiplier);
  state.slowTimer = Math.max(state.slowTimer, durationMs);
  return getStatusEffectTint(state);
}

/**
 * Aplica o efeito de knockback na máquina de status.
 */
export function applyKnockback(
  state: StatusEffectsState,
  durationMs: number = 220
): void {
  state.knockbackTimer = durationMs;
}

/**
 * Atualiza os timers dos efeitos decrementando deltaMs.
 * Slow e Root continuam decrementando mesmo durante Knockback (evita congelamento de debuffs).
 * Se um efeito expirar mas outro permanecer ativo, o tint restante é mantido.
 */
export function updateStatusEffects(
  state: StatusEffectsState,
  deltaMs: number
): {
  activeTint: number | null;
  isKnockbackActive: boolean;
  isRooted: boolean;
  isSlowed: boolean;
} {
  // 1. Knockback timer
  if (state.knockbackTimer > 0) {
    state.knockbackTimer = Math.max(0, state.knockbackTimer - deltaMs);
  }

  // 2. Slow timer (decrementa mesmo durante knockback)
  if (state.slowTimer > 0) {
    state.slowTimer = Math.max(0, state.slowTimer - deltaMs);
    if (state.slowTimer === 0) {
      state.speedDebuffMultiplier = 1.0;
    }
  }

  // 3. Root timer (decrementa mesmo durante knockback)
  if (state.rootTimer > 0) {
    state.rootTimer = Math.max(0, state.rootTimer - deltaMs);
    if (state.rootTimer === 0) {
      state.isRooted = false;
    }
  } else if (!state.rootTimer) {
    state.isRooted = false;
  }

  const activeTint = getStatusEffectTint(state);

  return {
    activeTint,
    isKnockbackActive: state.knockbackTimer > 0,
    isRooted: state.isRooted,
    isSlowed: state.slowTimer > 0,
  };
}
