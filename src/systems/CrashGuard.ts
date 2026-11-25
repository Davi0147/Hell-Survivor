import Phaser from 'phaser';
import { CRASH_THEME } from '../config/theme';
import { DebugSessionLogger } from './DebugSessionLogger';

const MAX_SHOWN = 3;
const HIDE_AFTER_MS = 20000;

/**
 * Escudo contra congelamento. O Phaser roda cada quadro dentro de uma função só: se qualquer
 * cena lançar um erro ali, o navegador não agenda o próximo quadro e o jogo para de vez
 * (a tela fica parada no último clarão). Aqui o quadro é embrulhado: o erro é registrado,
 * aparece escrito no canto da tela (para o dono mandar um print) e o jogo segue rodando.
 */
export function installCrashGuard(game: Phaser.Game): void {
  const wrap = (): void => {
    const loop = game.loop as Phaser.Core.TimeStep & { callback: (time: number, delta: number) => void };
    const original = loop.callback;
    if (!original || (original as { __guarded?: boolean }).__guarded) return;
    const guarded = (time: number, delta: number): void => {
      try {
        original(time, delta);
      } catch (err) {
        reportCrash(err);
      }
    };
    (guarded as { __guarded?: boolean }).__guarded = true;
    loop.callback = guarded;
  };
  // O Phaser avisa READY e só depois liga o laço (game.start): embrulha no instante seguinte
  game.events.once(Phaser.Core.Events.READY, () => queueMicrotask(wrap));
}

const seen = new Set<string>();

function reportCrash(err: unknown): void {
  const e = err instanceof Error ? err : new Error(String(err));
  const firstFrame = (e.stack ?? '').split('\n').find((l) => /\d+:\d+/.test(l))?.trim() ?? '';
  const key = `${e.message}|${firstFrame}`;
  if (seen.has(key)) return;
  seen.add(key);
  console.error('[CrashGuard] Erro no quadro (jogo continua):', e);
  DebugSessionLogger.getInstance().log('ERROR', 'ERROR', `CrashGuard: ${e.message} @ ${firstFrame}`);
  if (seen.size <= MAX_SHOWN) showOnScreen(e.message, firstFrame);
}

function showOnScreen(message: string, where: string): void {
  try {
    const build = document.getElementById('build-version')?.textContent?.trim() ?? '';
    const el = document.createElement('div');
    el.style.cssText = [
      'position:fixed', 'left:8px', `bottom:${8 + (seen.size - 1) * 34}px`, 'z-index:100000',
      'font-family:monospace', 'font-size:11px', 'line-height:1.35', 'pointer-events:none',
      `color:${CRASH_THEME.text}`, `text-shadow:1px 1px 0 ${CRASH_THEME.shadow},-1px -1px 0 ${CRASH_THEME.shadow}`,
      'max-width:70vw', 'white-space:nowrap', 'overflow:hidden', 'text-overflow:ellipsis',
    ].join(';');
    el.textContent = `ERRO: ${message}`;
    const detail = document.createElement('div');
    detail.style.color = CRASH_THEME.detail;
    detail.textContent = `${where.replace(/^at\s+/, '')} [${build}]`;
    el.appendChild(detail);
    document.body.appendChild(el);
    window.setTimeout(() => el.remove(), HIDE_AFTER_MS);
  } catch {
    // Sem DOM (testes): só o log
  }
}
