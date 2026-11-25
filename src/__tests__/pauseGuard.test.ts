import { describe, it, expect } from 'vitest';
import { isOrphanPause, tickPauseGuard, STUCK_PAUSE_MS, type PauseGuardState } from '../systems/pauseGuard';

const base: PauseGuardState = {
  gamePaused: true,
  upgradeScreenActive: false,
  rewardModalOpen: false,
  pauseMenuOpen: false,
  dialogueActive: false,
  gameOverOrChapterEnd: false,
};

describe('Guarda anti-travamento', () => {
  it('pausado sem nenhuma tela é pausa órfã', () => {
    expect(isOrphanPause(base)).toBe(true);
  });

  it('qualquer tela aberta justifica a pausa', () => {
    expect(isOrphanPause({ ...base, upgradeScreenActive: true })).toBe(false);
    expect(isOrphanPause({ ...base, rewardModalOpen: true })).toBe(false);
    expect(isOrphanPause({ ...base, pauseMenuOpen: true })).toBe(false);
    expect(isOrphanPause({ ...base, dialogueActive: true })).toBe(false);
    expect(isOrphanPause({ ...base, gameOverOrChapterEnd: true })).toBe(false);
    expect(isOrphanPause({ ...base, gamePaused: false })).toBe(false);
  });

  it('retoma só depois do tempo de folga, e zera quando uma tela aparece', () => {
    let r = tickPauseGuard(0, base, STUCK_PAUSE_MS - 100);
    expect(r.recover).toBe(false);
    r = tickPauseGuard(r.orphanMs, { ...base, upgradeScreenActive: true }, 16);
    expect(r.orphanMs).toBe(0);
    r = tickPauseGuard(0, base, STUCK_PAUSE_MS);
    expect(r.recover).toBe(true);
  });
});
