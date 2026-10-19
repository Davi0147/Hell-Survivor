/**
 * theme.ts
 * Centralização semântica de fontes, tokens de cor e telegrafia de chefes.
 * Conforme Regra 5 do AGENTS.md e especificações do docs/DESIGN_SYSTEM.md.
 */

export const FONTS = {
  /** Papel display: títulos monumentais, cartas arcanas, números de dano flutuantes e anúncios de chefes */
  display: "'Pixelzone', 'Silkscreen', 'Press Start 2P', monospace",
  /** Papel body: texto corrido, diálogos, lore, descrições ricas de upgrades e rótulos de botões */
  body: "'Silkscreen', 'Press Start 2P', monospace",
  /** Pilha puramente monoespacial para logs de debug e métricas técnicas */
  fallback: "monospace"
} as const;

export const COLORS = {
  // --- Ouro e Destaque (Gold / Accent) ---
  goldBright: 0xffd700,
  goldCrit: 0xffbe0b,
  goldFrame: 0xc59b27,
  goldCardCommon: 0xfacc15,
  goldChest: 0xfbbf24,
  goldTextCrit: '#ffbe0b',
  goldTextAccent: '#ffd700',

  // --- Carmesim, Sangue e Perigo (Danger / Crimson) ---
  crimsonTelegraph: 0xff0055,
  crimsonAzazelTelegraph: 0xff0044,
  crimsonAlert: 0xff2255,
  crimsonHp: 0xe11d48,
  crimsonBloodDeep: 0x990022,
  crimsonBeam: 0xff2a5f,
  crimsonTextTelegraph: '#ff0055',
  crimsonTextAlert: '#ff2255',

  // --- Neutros, Textos e Contornos (Neutrals) ---
  white: 0xffffff,
  textWhite: '#ffffff',
  grayLight: 0xcbd5e1,
  textGrayLight: '#cbd5e1',
  grayMedium: 0x94a3b8,
  textGrayMedium: '#94a3b8',
  grayDark: 0x64748b,
  black: 0x000000,
  strokeBlack: '#000000',

  // --- Fundos, Superfícies e Veludo Abissal (Surfaces) ---
  velvetNixy: 0x180309,
  velvetBoss: 0x14011c,
  obsidianRadar: 0x0b0205,
  bgDark: 0x0a0a0f,
  purpleBorderPhrase: '#3b0764',
  purpleBorderPhraseNum: 0x3b0764,

  // --- Utilidades, Magia e Recursos (Utility) ---
  staminaGreen: 0x10b981,
  staminaTextGreen: '#10b981',
  cyanMarker: 0x00f5d4,
  soulMagnetBlue: 0x38bdf8,
  corruptedSoulPurple: 0xa855f7,

  // --- Falas de Combate (Combat Bubbles) ---
  phraseNixy: '#ff758f',
  phraseSuccubus: '#c084fc'
} as const;

export const BOSS_TELEGRAPH = {
  /** Cor carmesim principal de advertência (valor padrão Succubus: 0xff0055) */
  color: 0xff0055,
  /** Miolo incandescente de alta precisão */
  innerColor: 0xffffff,
  /** Fórmula de espessura do feixe principal: 3 + progress * 9 */
  lineThickness: (progress: number): number => 3 + progress * 9,
  /** Espessura do miolo branco */
  innerThickness: 2,
  /** Transparência progressiva do feixe principal: 0.7 + progress * 0.3 */
  alpha: (progress: number): number => 0.7 + progress * 0.3,
  /** Transparência do miolo branco: progress */
  innerAlpha: (progress: number): number => progress,

  /** Borda do círculo de impacto em área: 0xff2266 */
  circleBorderColor: 0xff2266,
  /** Espessura da borda circular: 2 + progress * 3 */
  circleBorderThickness: (progress: number): number => 2 + progress * 3,
  /** Preenchimento do círculo de impacto: 0xff0055 */
  circleFillColor: 0xff0055,
  /** Transparência de preenchimento do círculo: 0.15 + progress * 0.3 */
  circleFillAlpha: (progress: number): number => 0.15 + progress * 0.3,
  /** Espessura do retículo em cruz central */
  crosshairThickness: 1.5
} as const;
