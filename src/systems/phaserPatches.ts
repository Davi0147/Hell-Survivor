import Phaser from 'phaser';

/**
 * Remendos em defeitos do próprio Phaser (3.90). Instalados uma vez, antes de criar o jogo.
 *
 * Controle num "buraco" da lista: o Phaser guarda cada controle na posição do índice que o
 * navegador informa. Um controle no índice 1 (comum no Windows com controle de Xbox, ou depois
 * de reconectar) deixa a posição 0 vazia, e `stopListeners`/`disconnectAll` percorrem a lista
 * sem pular vazios. Ao fechar a cena (Reiniciar, voltar ao menu, nova partida) o erro cortava a
 * limpeza no meio: a física ficava com colisões de grupos já destruídos e, na partida seguinte,
 * quebrava a cada quadro, com a heroína parada sem conseguir andar.
 */

/** Roda `fn` vendo só os controles que existem (sem os vazios) e devolve a lista como estava. */
export function withoutEmptyPadSlots<T>(plugin: { gamepads: unknown[] }, fn: () => T): T {
  const original = plugin.gamepads;
  plugin.gamepads = original.filter((pad) => pad !== undefined && pad !== null);
  try {
    return fn();
  } finally {
    plugin.gamepads = original;
  }
}

let installed = false;

export function installPhaserPatches(): void {
  if (installed) return;
  installed = true;

  type PadPlugin = Phaser.Input.Gamepad.GamepadPlugin & { gamepads: unknown[]; stopListeners(): void; disconnectAll(): void };
  const proto = Phaser.Input.Gamepad.GamepadPlugin.prototype as unknown as PadPlugin;
  for (const method of ['stopListeners', 'disconnectAll'] as const) {
    const original = proto[method];
    if (typeof original !== 'function') continue;
    proto[method] = function patched(this: PadPlugin): void {
      withoutEmptyPadSlots(this, () => original.call(this));
    };
  }
}
