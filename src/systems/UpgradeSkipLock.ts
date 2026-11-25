import { UPGRADE_SKIP_BALANCE } from '../config/balance';

/** Quanto falta para CANALIZAR destravar (0 = liberado). */
export function getSkipLockRemainingMs(openedAtMs: number, nowMs: number): number {
  return Math.max(0, UPGRADE_SKIP_BALANCE.lockMs - (nowMs - openedAtMs));
}

/** Quanto falta para escolher carta / re-rolar destravar (0 = liberado). */
export function getPickLockRemainingMs(openedAtMs: number, nowMs: number): number {
  return Math.max(0, UPGRADE_SKIP_BALANCE.pickLockMs - (nowMs - openedAtMs));
}

/** Contagem mostrada no botão enquanto ele está travado ("5s", "4s"...). */
export function formatSkipLockBadge(remainingMs: number): string {
  return `${Math.ceil(remainingMs / 1000)}s`;
}
