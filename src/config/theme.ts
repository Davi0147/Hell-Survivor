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

export const MODAL_THEME = {
  backdropColor: 0x000000,
  pause: {
    backdropAlpha: 0.82,
    panelFill: 0x150308,
    panelAlpha: 0.98,
    outerBorderColor: 0xc59b27,
    outerBorderWidth: 3,
    outerRadius: 14,
    innerBorderColor: 0xff4500,
    innerBorderWidth: 1.5,
    innerBorderAlpha: 0.6,
    innerRadius: 10,
    titleColor: '#ffa200',
    titleStroke: '#300207',
    statsTextColor: '#f3d17a',
    bgmColorHex: '#ff7700',
    bgmColorNum: 0xff7700,
    sfxColorHex: '#00f5d4',
    sfxColorNum: 0x00f5d4,
    barTrackFill: 0x280d15,
    stepperHoverFill: 0xff4500,
    stepperIdleFill: 0x22050e,
    btnResumeBg: 0x225522,
    btnResumeBorder: 0x00ff88,
    btnRestartBg: 0x553311,
    btnRestartBorder: 0xffaa00,
    btnMenuBg: 0x551122,
    btnMenuBorder: 0xff0055
  },
  gameOver: {
    backdropAlpha: 0.90,
    panelFill: 0x180208,
    panelAlpha: 0.98,
    outerBorderColor: 0xff0055,
    outerBorderWidth: 3,
    outerRadius: 14,
    innerBorderColor: 0xf3d17a,
    innerBorderWidth: 1.5,
    innerBorderAlpha: 0.7,
    innerRadius: 11,
    titleColor: '#ff0055',
    subtitleColor: '#e0aaff',
    subtitleStroke: '#100306',
    newRecordColor: '#ffd60a',
    btnRetryHoverFill: 0xff0055,
    btnRetryIdleFill: 0x720012,
    btnRetryIdleBorder: 0xf3d17a,
    btnMenuHoverFill: 0x240046,
    btnMenuIdleFill: 0x10002b,
    btnMenuHoverBorder: 0x00f5d4,
    btnMenuIdleBorder: 0x7b2cbf
  },
  victory: {
    backdropAlpha: 0.88,
    panelFill: 0x180309,
    panelAlpha: 0.98,
    outerBorderColor: 0xf3d17a,
    outerBorderWidth: 3,
    outerRadius: 14,
    innerBorderColor: 0xffffff,
    innerBorderWidth: 1.5,
    innerBorderAlpha: 0.6,
    innerRadius: 11,
    titleColor: '#ffd60a',
    titleStroke: '#4a0e17',
    subtitleColor: '#ff7b95',
    statsStroke: '#100306',
    btnNextHoverFill: 0x6a040f,
    btnNextIdleFill: 0x370617,
    btnNextHoverBorder: 0xffd60a,
    btnNextIdleBorder: 0x9d0208,
    btnMenuHoverFill: 0xff0055,
    btnMenuIdleFill: 0x720012,
    btnMenuIdleBorder: 0xf3d17a
  }
} as const;

