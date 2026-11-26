/**
 * Ícones de botão (folha `public/assets/sprites/ui/buttons`, ver docs/ART_PROMPTS.md §18).
 * Cada ação do jogo diz qual ícone mostrar em cada aparelho. Mudou um atalho em
 * `GamepadManager` ou nas cenas? Mude aqui também, senão a dica mente.
 */

/** Chave do atlas carregado na BootScene. */
export const BUTTON_GLYPH_ATLAS = 'button-glyphs';
export const BUTTON_GLYPH_PATH = 'assets/sprites/ui/buttons/button-glyphs';
/**
 * Altura de uma tecla comum no atlas (o script de recorte usa a mesma). Todos os ícones
 * são reduzidos pela mesma conta, então uma tecla larga continua larga.
 */
export const GLYPH_KEY_HEIGHT = 48;

/** Aparelho que o jogador usou por último. */
export type InputDevice = 'keyboard' | 'xbox' | 'playstation' | 'touch';

/** Visão antiga, de três estados, usada por quem só precisa saber se é controle. */
export type ControlScheme = 'keyboard' | 'gamepad' | 'touch';

export type InputAction =
  | 'move'
  | 'sprint'
  | 'dash'
  | 'ultimate'
  | 'pause'
  | 'confirm'
  | 'back'
  | 'navigate'
  | 'reroll'
  | 'channel'
  | 'pick'
  | 'advance'
  | 'skip'
  | 'interact';

type GlyphRow = Readonly<Record<InputDevice, readonly string[]>>;

/** Nenhum ícone no toque: o próprio botão na tela já é o que se toca. */
const NONE: readonly string[] = [];

export const INPUT_GLYPHS: Readonly<Record<InputAction, GlyphRow>> = {
  move: { keyboard: ['key-wasd'], xbox: ['pad-ls'], playstation: ['pad-ls'], touch: NONE },
  sprint: { keyboard: ['key-shift'], xbox: ['pad-rt'], playstation: ['ps-r2'], touch: NONE },
  dash: { keyboard: ['key-space'], xbox: ['pad-a'], playstation: ['ps-cross'], touch: NONE },
  ultimate: { keyboard: ['key-e'], xbox: ['pad-y'], playstation: ['ps-triangle'], touch: NONE },
  pause: { keyboard: ['key-esc'], xbox: ['pad-start'], playstation: ['ps-options'], touch: NONE },
  confirm: { keyboard: ['key-enter'], xbox: ['pad-a'], playstation: ['ps-cross'], touch: ['touch-tap'] },
  back: { keyboard: ['key-esc'], xbox: ['pad-b'], playstation: ['ps-circle'], touch: NONE },
  navigate: { keyboard: ['key-arrows'], xbox: ['pad-dpad'], playstation: ['pad-dpad'], touch: NONE },
  reroll: { keyboard: ['key-r'], xbox: ['pad-x'], playstation: ['ps-square'], touch: NONE },
  // Canalizar (pular a carta e curar) no level-up
  channel: { keyboard: ['key-space'], xbox: ['pad-b'], playstation: ['ps-circle'], touch: NONE },
  // Escolher carta (no teclado as cartas são só no mouse)
  pick: { keyboard: ['mouse-left'], xbox: ['pad-a'], playstation: ['ps-cross'], touch: ['touch-tap'] },
  // Avançar fala de diálogo / história (o clique também avança)
  advance: { keyboard: ['key-space', 'mouse-left'], xbox: ['pad-a'], playstation: ['ps-cross'], touch: ['touch-tap'] },
  skip: { keyboard: ['key-esc'], xbox: ['pad-b'], playstation: ['ps-circle'], touch: NONE },
  // Falar com alguém no corredor do prólogo (E, Espaço ou Enter; A/cruz; tocar no aviso)
  interact: { keyboard: ['key-e'], xbox: ['pad-a'], playstation: ['ps-cross'], touch: ['touch-tap'] },
};

/** Quadros do atlas que mostram a ação no aparelho (vazio = não mostrar nada). */
export function glyphFramesFor(action: InputAction, device: InputDevice): readonly string[] {
  return INPUT_GLYPHS[action][device];
}

/** Controle da Sony (cruz/círculo/quadrado/triângulo) ou o resto (A/B/X/Y). */
export function padFamilyFromId(id: string): 'xbox' | 'playstation' {
  const s = id.toLowerCase();
  // "Xbox Wireless Controller" também tem "wireless controller" no nome: Microsoft (045e) vem antes
  if (s.includes('xbox') || s.includes('045e')) return 'xbox';
  // 054c é o código de fabricante da Sony; navegadores mostram nomes diferentes para o mesmo controle
  if (s.includes('054c') || /playstation|dualshock|dualsense|wireless controller|ps[345]\b/.test(s)) {
    return 'playstation';
  }
  return 'xbox';
}

export function schemeOf(device: InputDevice): ControlScheme {
  return device === 'xbox' || device === 'playstation' ? 'gamepad' : device;
}

/** Leitura mínima de um controle (o `Gamepad` do navegador encaixa nisto). */
export interface PadSnapshot {
  readonly id: string;
  readonly connected: boolean;
  readonly buttons: ReadonlyArray<{ readonly pressed: boolean }>;
  readonly axes: ReadonlyArray<number>;
}

/** Limite do analógico para contar como "o jogador mexeu no controle" (acima do ruído parado). */
export const PAD_ACTIVITY_AXIS = 0.5;

/** Primeiro controle com botão apertado ou analógico inclinado, ou null. */
export function findActivePad(pads: ReadonlyArray<PadSnapshot | null>): PadSnapshot | null {
  for (const p of pads) {
    if (!p || !p.connected) continue;
    if (p.buttons.some((b) => b.pressed)) return p;
    if (p.axes.some((a) => Math.abs(a) > PAD_ACTIVITY_AXIS)) return p;
  }
  return null;
}
