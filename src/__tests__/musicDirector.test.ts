import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { MusicDirector } from '../systems/MusicDirector';

describe('MusicDirector (MusicDirector.ts)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('provides a singleton instance', () => {
    const d1 = MusicDirector.getInstance();
    const d2 = MusicDirector.getInstance();
    expect(d1).toBe(d2);
  });

  it('starts in SILENCE state with default volume', () => {
    const director = MusicDirector.getInstance();
    expect(director.getCurrentState()).toBe('SILENCE');
    expect(director.getMusicVolume()).toBeGreaterThanOrEqual(0);
    expect(director.getMusicVolume()).toBeLessThanOrEqual(1);
  });

  it('transitions state to SILENCE and logs reason without error when no scene attached', () => {
    const director = MusicDirector.getInstance();
    director.setMusicState('SILENCE', 'Teste unitário sem cena');
    expect(director.getCurrentState()).toBe('SILENCE');
  });

  it('updates master volume with clamp between 0 and 1', () => {
    const director = MusicDirector.getInstance();
    director.setMusicVolume(0.5);
    expect(director.getMusicVolume()).toBe(0.5);

    director.setMusicVolume(1.8);
    expect(director.getMusicVolume()).toBe(1.0);

    director.setMusicVolume(-0.3);
    expect(director.getMusicVolume()).toBe(0.0);

    // Restaura para 0.10
    director.setMusicVolume(0.10);
    expect(director.getMusicVolume()).toBe(0.10);
  });

  it('updates boost multiplier when calling boostCurrentMusicVolume', () => {
    const director = MusicDirector.getInstance();
    expect(director.getBoostMultiplier()).toBe(1.0);
    director.boostCurrentMusicVolume(1.3);
    expect(director.getBoostMultiplier()).toBe(1.3);
    director.boostCurrentMusicVolume(1.0);
    expect(director.getBoostMultiplier()).toBe(1.0);
  });
});
