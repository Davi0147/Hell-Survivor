import { describe, it, expect } from 'vitest';
import {
  getStatusEffectTint,
  applyAcidRoot,
  applySlow,
  applyKnockback,
  updateStatusEffects,
  STATUS_TINTS,
  StatusEffectsState,
} from '../systems/statusEffects';

describe('statusEffects (Módulo Puro de Efeitos de Status e Controle de Grupo)', () => {
  const createInitialState = (): StatusEffectsState => ({
    rootTimer: 0,
    slowTimer: 0,
    knockbackTimer: 0,
    isRooted: false,
    speedDebuffMultiplier: 1.0,
  });

  describe('Prioridade de Cor / Tint', () => {
    it('retorna null quando nenhum efeito está ativo', () => {
      const state = createInitialState();
      expect(getStatusEffectTint(state)).toBeNull();
    });

    it('retorna verde tóxico (0x70e000) quando apenas Slow está ativo', () => {
      const state = createInitialState();
      applySlow(state, 0.60, 600);
      expect(getStatusEffectTint(state)).toBe(STATUS_TINTS.SLOW);
    });

    it('retorna verde ácido (0x55ff77) quando apenas Root está ativo', () => {
      const state = createInitialState();
      applyAcidRoot(state, 1000);
      expect(getStatusEffectTint(state)).toBe(STATUS_TINTS.ROOT);
    });

    it('Root tem precedência estrita sobre Slow quando ambos estão ativos simultaneamente', () => {
      const state = createInitialState();
      applySlow(state, 0.60, 600);
      applyAcidRoot(state, 1000);

      // Root tem prioridade visual superior a Slow
      expect(getStatusEffectTint(state)).toBe(STATUS_TINTS.ROOT);
    });
  });

  describe('Sobreposição de Efeitos e Expiração Parcial', () => {
    it('ao expirar Root mantendo Slow ativo, o tint restante de Slow é preservado (não chama clear)', () => {
      const state = createInitialState();
      applyAcidRoot(state, 300); // Root curto de 300ms
      applySlow(state, 0.50, 800); // Slow longo de 800ms

      expect(getStatusEffectTint(state)).toBe(STATUS_TINTS.ROOT);

      // Avança 300ms: Root expira, mas Slow ainda possui 500ms
      const updateResult = updateStatusEffects(state, 300);
      expect(state.isRooted).toBe(false);
      expect(state.rootTimer).toBe(0);
      expect(state.slowTimer).toBe(500);
      expect(updateResult.activeTint).toBe(STATUS_TINTS.SLOW); // Preservou o tint do Slow!

      // Avança mais 500ms: Slow agora expira
      const finalResult = updateStatusEffects(state, 500);
      expect(state.slowTimer).toBe(0);
      expect(state.speedDebuffMultiplier).toBe(1.0);
      expect(finalResult.activeTint).toBeNull();
    });

    it('ao expirar Slow mantendo Root ativo, o tint de Root permanece intacto', () => {
      const state = createInitialState();
      applySlow(state, 0.50, 200); // Slow curto de 200ms
      applyAcidRoot(state, 1000); // Root longo de 1000ms

      const updateResult = updateStatusEffects(state, 200);
      expect(state.slowTimer).toBe(0);
      expect(state.isRooted).toBe(true);
      expect(state.rootTimer).toBe(800);
      expect(updateResult.activeTint).toBe(STATUS_TINTS.ROOT);
    });
  });

  describe('Decremento Contínuo Durante Knockback (Anti-Congelamento de Timers)', () => {
    it('Slow e Root continuam decrementando durante Knockback', () => {
      const state = createInitialState();
      applyKnockback(state, 220);
      applySlow(state, 0.60, 500);
      applyAcidRoot(state, 400);

      expect(state.knockbackTimer).toBe(220);
      expect(state.slowTimer).toBe(500);
      expect(state.rootTimer).toBe(400);

      // Avança 100ms enquanto Nixy é empurrada pelo knockback
      const res1 = updateStatusEffects(state, 100);
      expect(res1.isKnockbackActive).toBe(true);
      expect(state.knockbackTimer).toBe(120);
      expect(state.slowTimer).toBe(400); // Decrementou! Não congelou em 500ms
      expect(state.rootTimer).toBe(300); // Decrementou! Não congelou em 400ms

      // Avança mais 120ms (terminando o knockback)
      const res2 = updateStatusEffects(state, 120);
      expect(res2.isKnockbackActive).toBe(false);
      expect(state.knockbackTimer).toBe(0);
      expect(state.slowTimer).toBe(280);
      expect(state.rootTimer).toBe(180);
    });
  });
});
