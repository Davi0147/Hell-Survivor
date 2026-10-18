import { describe, it, expect } from 'vitest';
import { FONTS, COLORS, BOSS_TELEGRAPH } from '../config/theme';

describe('Theme Configuration (theme.ts)', () => {
  describe('FONTS Roles', () => {
    it('defines display font role with Pixelzone and retro fallbacks', () => {
      expect(FONTS.display).toContain('Pixelzone');
      expect(FONTS.display).toContain('Silkscreen');
      expect(FONTS.display).toContain('Press Start 2P');
      expect(FONTS.display).toContain('monospace');
    });

    it('defines body font role with Silkscreen for running text and descriptions', () => {
      expect(FONTS.body).toContain('Silkscreen');
      expect(FONTS.body).toContain('Press Start 2P');
      expect(FONTS.body).toContain('monospace');
      expect(FONTS.body).not.toContain('Pixelzone');
    });

    it('defines fallback font role for technical logs', () => {
      expect(FONTS.fallback).toBe('monospace');
    });
  });

  describe('COLORS Tokens', () => {
    it('contains valid numeric color values within 24-bit RGB range', () => {
      const numericTokens = [
        COLORS.goldBright,
        COLORS.goldCrit,
        COLORS.goldFrame,
        COLORS.goldCardCommon,
        COLORS.goldChest,
        COLORS.crimsonTelegraph,
        COLORS.crimsonAzazelTelegraph,
        COLORS.crimsonAlert,
        COLORS.crimsonHp,
        COLORS.crimsonBloodDeep,
        COLORS.crimsonBeam,
        COLORS.white,
        COLORS.grayLight,
        COLORS.grayMedium,
        COLORS.grayDark,
        COLORS.black,
        COLORS.velvetNixy,
        COLORS.velvetBoss,
        COLORS.obsidianRadar,
        COLORS.bgDark,
        COLORS.purpleBorderPhraseNum,
        COLORS.staminaGreen,
        COLORS.cyanMarker,
        COLORS.soulMagnetBlue,
        COLORS.corruptedSoulPurple
      ];

      for (const val of numericTokens) {
        expect(typeof val).toBe('number');
        expect(val).toBeGreaterThanOrEqual(0);
        expect(val).toBeLessThanOrEqual(16777215); // 24-bit max RGB
      }
    });

    it('contains valid CSS hex string tokens with correct format', () => {
      const stringTokens = [
        COLORS.goldTextCrit,
        COLORS.goldTextAccent,
        COLORS.crimsonTextTelegraph,
        COLORS.crimsonTextAlert,
        COLORS.textWhite,
        COLORS.textGrayLight,
        COLORS.textGrayMedium,
        COLORS.strokeBlack,
        COLORS.purpleBorderPhrase,
        COLORS.staminaTextGreen
      ];

      const hexPattern = new RegExp('^' + '#' + '[0-9a-fA-F]{6}$');
      for (const str of stringTokens) {
        expect(typeof str).toBe('string');
        expect(str).toMatch(hexPattern);
      }
    });

    it('matches exact semantic token values', () => {
      expect(COLORS.crimsonTelegraph.toString(16).toLowerCase()).toBe('ff0055');
      expect(COLORS.goldBright.toString(16).toLowerCase()).toBe('ffd700');
      expect(COLORS.goldCrit.toString(16).toLowerCase()).toBe('ffbe0b');
      expect(COLORS.staminaGreen.toString(16).toLowerCase()).toBe('10b981');
      expect(COLORS.white).toBe(16777215);
      expect(COLORS.black).toBe(0);
      expect(COLORS.strokeBlack).toBe('#' + '000000');
      expect(COLORS.textWhite).toBe('#' + 'ffffff');
    });
  });

  describe('BOSS_TELEGRAPH Formulas and Constants', () => {
    it('uses unified crimson telegraph color from Succubus template', () => {
      expect(BOSS_TELEGRAPH.color).toBe(COLORS.crimsonTelegraph);
      expect(BOSS_TELEGRAPH.innerColor).toBe(COLORS.white);
      expect(BOSS_TELEGRAPH.circleBorderColor.toString(16).toLowerCase()).toBe('ff2266');
      expect(BOSS_TELEGRAPH.circleFillColor).toBe(COLORS.crimsonTelegraph);
      expect(BOSS_TELEGRAPH.crosshairThickness).toBe(1.5);
      expect(BOSS_TELEGRAPH.innerThickness).toBe(2);
    });

    it('calculates lineThickness dynamically according to 3 + progress * 9', () => {
      expect(BOSS_TELEGRAPH.lineThickness(0)).toBe(3);
      expect(BOSS_TELEGRAPH.lineThickness(0.5)).toBe(7.5);
      expect(BOSS_TELEGRAPH.lineThickness(1)).toBe(12);
    });

    it('calculates alpha dynamically according to 0.7 + progress * 0.3', () => {
      expect(BOSS_TELEGRAPH.alpha(0)).toBeCloseTo(0.7);
      expect(BOSS_TELEGRAPH.alpha(0.5)).toBeCloseTo(0.85);
      expect(BOSS_TELEGRAPH.alpha(1)).toBeCloseTo(1.0);
    });

    it('calculates innerAlpha directly from progress', () => {
      expect(BOSS_TELEGRAPH.innerAlpha(0)).toBe(0);
      expect(BOSS_TELEGRAPH.innerAlpha(0.6)).toBe(0.6);
      expect(BOSS_TELEGRAPH.innerAlpha(1)).toBe(1);
    });

    it('calculates circleBorderThickness dynamically according to 2 + progress * 3', () => {
      expect(BOSS_TELEGRAPH.circleBorderThickness(0)).toBe(2);
      expect(BOSS_TELEGRAPH.circleBorderThickness(0.5)).toBe(3.5);
      expect(BOSS_TELEGRAPH.circleBorderThickness(1)).toBe(5);
    });

    it('calculates circleFillAlpha dynamically according to 0.15 + progress * 0.3', () => {
      expect(BOSS_TELEGRAPH.circleFillAlpha(0)).toBeCloseTo(0.15);
      expect(BOSS_TELEGRAPH.circleFillAlpha(0.5)).toBeCloseTo(0.3);
      expect(BOSS_TELEGRAPH.circleFillAlpha(1)).toBeCloseTo(0.45);
    });
  });
});
