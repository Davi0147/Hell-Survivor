import { describe, it, expect } from 'vitest';
import { getSkipLockRemainingMs, formatSkipLockBadge } from '../systems/UpgradeSkipLock';
import { UPGRADE_SKIP_BALANCE } from '../config/balance';

describe('Trava do CANALIZAR na tela de cartas', () => {
  const lock = UPGRADE_SKIP_BALANCE.lockMs;

  it('dura 5 segundos', () => {
    expect(lock).toBe(5000);
  });

  it('fica travado logo ao abrir e até o fim do tempo', () => {
    expect(getSkipLockRemainingMs(1000, 1000)).toBe(lock);
    expect(getSkipLockRemainingMs(1000, 1000 + lock - 1)).toBe(1);
  });

  it('libera depois do tempo e nunca fica negativo', () => {
    expect(getSkipLockRemainingMs(1000, 1000 + lock)).toBe(0);
    expect(getSkipLockRemainingMs(1000, 1000 + lock * 3)).toBe(0);
  });

  it('a contagem do botão arredonda para cima', () => {
    expect(formatSkipLockBadge(5000)).toBe('5s');
    expect(formatSkipLockBadge(4001)).toBe('5s');
    expect(formatSkipLockBadge(1)).toBe('1s');
  });
});
