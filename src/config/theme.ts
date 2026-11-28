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
  dangerTint: 0xff0000,

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

/**
 * Identidade visual do chão de cada capítulo. Enquanto um capítulo não tem textura
 * própria, a cor (tint) é o que o diferencia dos outros.
 *  - `byTexture`: cor fixa para uma textura específica (vence o capítulo).
 *  - `byChapter`: cor do capítulo quando a textura é a padrão.
 */
export const ARENA_FLOOR_TINT = {
  fallback: 0x423232,
  byTexture: { 'floor-tile-2': 0x684b4b, 'floor-ch1': 0xffffff, 'floor-ch2': 0xffffff, 'floor-ch3': 0xffffff } as Record<string, number>,
  byChapter: {
    1: 0x423232, // Catacumbas de Rosalin: pedra quente e escura
    2: 0x2f3350, // Santuário caído de Azazel: pedra fria azul-violeta
  } as Record<number, number>,
} as const;

/**
 * Escala de cada textura de piso. As antigas (2048 px) são reduzidas a 10%; o piso novo do
 * Capítulo 1 vem em densidade 2x e usa 0.5 (um pixel da arte = um pixel de tela no zoom 2).
 */
export const ARENA_FLOOR_SCALE: Record<string, number> = {
  'floor-ch1': 0.5,
  'floor-ch2': 0.5,
  'floor-ch3': 0.5,
};
/** Pisos antigos (chao1/chao2) reduzidos de 2048 para 512 px: 0.4 mantém o mesmo tamanho na tela. */
export const ARENA_FLOOR_SCALE_DEFAULT = 0.4;

/** Piso com arte própria por capítulo (troca o piso padrão quando a arte existe). */
export const CHAPTER_FLOOR_TEXTURE: Record<number, string> = {
  1: 'floor-ch1',
  2: 'floor-ch2',
  3: 'floor-ch3',
};

/** Cor do halo das fontes de luz do cenário (sem cor = fogo laranja da textura). */
export const SCENERY_LIGHT_TINT = {
  /** Fogo frio do domínio do Azazel. */
  violet: 0x9d7bff,
} as const;

/** Faíscas do Altar de Invocação aceso, por capítulo (o 1 usa as brasas de fogo padrão). */
export const SUMMON_ALTAR_EMBERS: Record<number, number[]> = {
  2: [0x9d7bff, 0xc4b0ff, 0x6b4bd6, 0xe6dcff],
  3: [0xc0123a, 0xff5a1f, 0xffb347, 0xc9a14a],
};

export function getArenaFloorTint(textureKey: string, chapter: number): number {
  return ARENA_FLOOR_TINT.byTexture[textureKey] ?? ARENA_FLOOR_TINT.byChapter[chapter] ?? ARENA_FLOOR_TINT.fallback;
}

/** Cores dos efeitos de ritmo de combate: combo, Frenesi, críticos, esquiva e eventos de horda. */
export const FX_COLORS = {
  hitSpark: 0xffd166,
  deathBurst: 0xff5d73,
  deathBurstElite: 0xffd700,
  critText: '#ffbe0b',
  critStroke: '#7a1f00',
  damageText: '#ffffff',
  /** Cor do contador por "calor": índice 0 = antes do primeiro degrau, depois um por degrau. */
  comboHeat: ['#ffe600', '#ffb300', '#ff7b00', '#ff3d2e', '#ff2a9d', '#ffffff'] as string[],
  comboBroken: '#8b8b9a',
  comboBarUrgent: 0xffffff,
  /** Número de dano: branco comum; crítico com degradê do topo para a base. */
  damageHeavyText: '#ffd9a0',
  critTintTop: 0xfff3b0,
  // Laranja, não vermelho: o chão dos capítulos é vermelho e engolia a base do número
  critTintBottom: 0xff8a00,
  critFlash: 0xffe600,
  comboText: '#ffe600',
  comboStroke: '#3a0010',
  comboTierText: '#ff758f',
  comboBar: 0xff2a6d,
  comboBarBg: 0x1a0208,
  frenzyText: '#ff4500',
  frenzyAura: 0xff7b00,
  frenzyFlash: [255, 120, 0] as [number, number, number],
  dashGhost: 0x38bdf8,
  dashButton: 0x38bdf8,
  novaRing: 0xffd700,
  corpseExplosion: 0xc084fc,
  /** Colossus: botão do Modo de Teste (aço) e cor do aviso. */
  colossusButtonFill: 0x1e293b,
  colossusButtonBorder: 0x94a3b8,
  colossusToast: '#cbd5e1',
  /** Arqueira Demônia: botão do Modo de Teste e flecha (desenhada por código até ter arte). */
  archerButtonFill: 0x1c1917,
  archerButtonBorder: 0xe7e5e4,
  archerToast: '#e7e5e4',
  archerArrowShaft: 0x3f2a1d,
  archerArrowHead: 0xd6d3d1,
  archerArrowFletch: 0xf5f5f4,
  archerArrowGlow: 0xff3d5a,
  /** Ghoul Devorador: pisca nesta cor enquanto prepara o bote. */
  ghoulLungeTelegraph: 0xff3d2e,
  thiefSparkle: 0xfff3b0,
  /** Seta de borda e blip do radar do Ladrão de Almas. */
  thiefArrowFill: 0x2a1c00,
  thiefArrowBorder: 0xffd700,
  thiefBadgeFill: 0x1a1200,
  thiefText: '#ffe680',
  thiefBlipCore: 0xfff3b0,
  thiefBlipOutline: 0x000000,
  bloodMoonOverlay: 0x8a0018,
  /** Fúria do Inferno (Infinito): véu laranja-avermelhado e brasas subindo. */
  infernalFuryOverlay: 0xb31a00,
  infernalFuryEmber: 0xff7a1a,
  stormFlash: 0x9d7bff,
  // Suprema "Ascensão Infernal"
  ultAura: 0xff2a3d,
  ultAuraHot: 0xffb000,
  ultRune: 0xff0055,
  ultAfterimage: 0xff6a00,
  ultRing: 0xffd166,
  ultFlash: [255, 70, 30] as [number, number, number],
  ultTitle: '#ffffff',
  ultTitleStroke: '#4a0e17',
  ultTitleGlow: '#ff4500',
  ultSubtitle: '#ffd166',
  ultTimerText: '#ffb000',
  stormAnnounce: '#c4b5fd',
} as const;

/**
 * Itens de mapa: brilho no chão e faíscas de coleta, e as cores da arte provisória
 * desenhada por código para os itens novos (até chegar a sprite sheet de `docs/ART_PROMPTS.md` §11).
 */
export const ITEM_COLORS = {
  glow: { chalice: 0x10b981, magnet: 0x38bdf8, chest: 0xfbbf24, bomb: 0xff4500, hourglass: 0x00f5d4, fury: 0xff0055, relic: 0xffd700 } as Record<string, number>,
  spark: { chalice: 0x00ff88, magnet: 0x00d4ff, chest: 0xffd700, bomb: 0xff7b00, hourglass: 0x7df9ff, fury: 0xff2a6d, relic: 0xfff3b0 } as Record<string, number>,
  bombBlast: 0xff4500,
  hourglassOverlay: 0x00f5d4,
  placeholder: {
    outline: '#12020a',
    bombBody: '#2b2236',
    bombShine: '#6d5a85',
    fuse: '#c59b27',
    flame: '#ffb000',
    flameCore: '#fff3b0',
    glassFrame: '#c59b27',
    glass: '#bdf7ff',
    sand: '#00c2b8',
    flaskGlass: '#e8d9ff',
    flaskLiquid: '#ff0055',
    flaskLiquidLight: '#ff7b9c',
    flaskCork: '#7a4a1d',
    relicGold: '#ffd700',
    relicGoldDark: '#a8730a',
    relicGem: '#ff0055',
  },
};

/** Barra de armas equipadas da HUD (canto inferior esquerdo). */
export const WEAPON_SLOT_THEME = {
  fill: 0x12040a,
  fillAlpha: 0.88,
  border: 0xc59b27,
  innerBorder: 0x5a1020,
  evolvedBorder: 0xffe600,
  pipOn: 0xffd166,
  pipOff: 0x3b1a24,
  ultReadyBorder: 0xff0055,
  ultShade: 0x000000,
  ultShadeAlpha: 0.7,
  levelText: '#f3d17a',
} as const;

/**
 * Fundo provisório do fim do Capítulo 2 enquanto não existe arte própria (as imagens do
 * fim do Capítulo 1 mostram a Rosalin): céu violeta do abismo sobre chão escuro.
 */
export const CHAPTER2_END_FALLBACK = {
  skyTop: '#140321',
  skyMid: '#3c096c',
  horizon: '#7b2cbf',
  ground: '#07010c',
} as const;

/** Aviso discreto que desliza da esquerda ("Novo: Morcegos"). Sem fundo: só texto com contorno. */
export const SIDE_NOTICE_THEME = {
  label: '#ffd166',
  text: '#ffffff',
  stroke: '#000000',
} as const;

/** Clarões dos cortes secos da cinemática de fim do Capítulo 2 (derrota do Azazel). */
export const CHAPTER2_ENDING_FX = {
  /** Quadro de impacto nos cortes com batida. */
  impactFlash: 0xffffff,
  impactFlashAlpha: 0.55,
  /** Clarão violeta quando a imagem final (cabeça arrancada) aparece. */
  finaleFlash: 0xc77dff,
  finaleFlashAlpha: 0.85,
} as const;

/** Controles de toque (celular): contorno dos botões e transparência do analógico. */
export const TOUCH_THEME = {
  ring: 0xffffff,
  ringAlpha: 0.85,
  ringWidth: 3,
  joystickIdleAlpha: 0.4,
  joystickActiveAlpha: 0.85,
} as const;

/** Aviso da Pressão do Abismo (Infinito): ficou parado, os monstros se fortalecem. */
export const IDLE_PRESSURE_THEME = {
  warnText: '#ffb703',
  dangerText: '#ff2255',
  stroke: '#12020a',
} as const;

/** Painel de status (vida, estamina, nível) do canto inferior direito. */
export const STATUS_PANEL_THEME = {
  /** Fundo das janelas da moldura, visível onde a barra já esvaziou. */
  track: 0x0b0208,
  trackAlpha: 0.92,
  /** Tons aplicados sobre a arte dourada da estamina. */
  staminaSprintTint: 0x9ffff0,
  staminaLowTint: 0xff5c9a,
  levelText: '#f3d17a',
  /** Placa do nível, desenhada do tamanho do texto (a da arte só cabe "LVL 9"). */
  levelPlaque: 0x140818,
  levelPlaqueBorder: 0x6a1fa0,
  valueText: '#ffffff',
  textStroke: '#12020a',
  /** Aro do medalhão com o rosto da heroína (no olho da moldura). */
  medallionRing: 0xd946ef,
  medallionBg: 0x12020a,
  hurtTint: 0xff4444,
} as const;

/** Topo da HUD: abates/almas (sem placa) e barra fina de experiência. */
export const HUD_COUNTER_THEME = {
  border: 0xc59b27,
  stroke: '#000000',
  kills: '#ffffff',
  souls: '#c084fc',
  xpTrack: 0x0c0407,
  xpFill: 0x00f5d4,
  xpShine: 0xb8fff3,
} as const;

/**
 * Objetivo no topo central da HUD (purificação, relógio do Infinito, vida do chefe),
 * direto sobre o jogo, sem placa; `border` é o contorno das barras.
 */
export const OBJECTIVE_THEME = {
  border: 0xc59b27,
  label: '#f3d17a',
  labelStroke: '#0e0208',
  timer: '#ffffff',
  timerStroke: '#3a0812',
  barTrack: 0x1a0208,
  purifyFill: 0xff0055,
  purifyShine: 0xff7aa8,
  bossFill: 0xd90429,
  bossShine: 0xff4d6d,
  bossName: '#ff2255',
} as const;

/** Dicas de controle com ícone de botão (barra da partida, diálogos, menus). */
export const INPUT_HINT_THEME = {
  text: '#e0aaff',
  /** "AVANÇAR ▶" dos diálogos e cenas de história. */
  prompt: '#f3d17a',
} as const;

/** Tela de diálogo da história. */
export const DIALOGUE_THEME = {
  /** Retrato apagado de quem NÃO está falando numa dupla (ex.: Lina e Gina). */
  duoDimTint: 0x4a4a55,
} as const;

/** Prólogo (corredor do RH e chegada na arena). */
export const PROLOGUE_THEME = {
  /** Fundo fora do corredor e cor do escurecer. */
  background: 0x000000,
  /** "FALAR" em cima do NPC. */
  promptText: '#f3d17a',
  /** Brilho da carta que desperta o ataque da Nixy (a mesma do Disparo de Almas). */
  awakeningCardGlow: 0x00f5d4,
  /** Colisões visíveis (Modo de Teste). */
  debugWall: 0xff0055,
  debugFeet: 0x00e5ff,
} as const;

/**
 * Botões de ação com tecla (Re-rolar e Canalizar na tela de cartas): ícone, nome e uma
 * "tecla" desenhada que muda com o controle em uso.
 */
export const ACTION_BUTTON_THEME = {
  /** Traço embaixo do nome quando selecionado (o botão não tem caixa de fundo). */
  borderHover: 0xffe600,
  label: '#f3d17a',
  labelHover: '#ffffff',
  labelDisabled: '#55555f',
  count: '#00f5d4',
  heal: '#4ade80',
} as const;

export type CardRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'supreme';

/**
 * Raridade das cartas: moldura (uma por raridade, docs/ART_PROMPTS.md §19), nome e cor do nome.
 * A cor segue a moldura: cinza osso, verde alma, azul espectral, violeta abissal, ouro.
 */
export const CARD_RARITY_THEME: Record<CardRarity, { frame: string; label: string; text: string; color: number }> = {
  common: { frame: 'card-frame-common', label: 'COMUM', text: '#e2e8f0', color: 0xcbd5e1 },
  uncommon: { frame: 'card-frame-uncommon', label: 'INCOMUM', text: '#4ade80', color: 0x4ade80 },
  rare: { frame: 'card-frame-rare', label: 'RARO', text: '#38bdf8', color: 0x38bdf8 },
  epic: { frame: 'card-frame-epic', label: 'ÉPICO', text: '#c084fc', color: 0xc084fc },
  supreme: { frame: 'card-frame-supreme', label: 'SUPREMO', text: '#ffd700', color: 0xffd700 },
};

/** Todas as molduras, na ordem de raridade (carga, galeria). */
export const CARD_FRAME_KEYS = (Object.keys(CARD_RARITY_THEME) as CardRarity[]).map((r) => CARD_RARITY_THEME[r].frame);

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

/** Shylph, a Serafim Caída (Capítulo 3): vento, sangue e clarões da morte falsa. */
export const SHYLPH_THEME = {
  /** Pena cravada piscando antes de voltar. */
  featherWarn: 0xff0055,
  /** Clarão vermelho quando ela levanta para a fase 2. */
  riseFlash: { r: 180, g: 0, b: 30 },
  /** Penas que giram em volta dela na fase final. */
  orbitTint: 0xffd0dc,
  /** Branco da transformação em Serafim (o mesmo do golpe recebido). */
  transformWhite: 0xffffff,
  /** Botões do Modo de Teste. */
  buttonFill: 0x4a0a1a,
  buttonBorder: 0xffd0dc,
  buttonText: '#ffe4ec',
} as const;

/** Borda da área da fase dos cristais do Azazel (blocos de pixel carmesim com miolo claro). */
export const CRYSTAL_ARENA_THEME = {
  ring: 0xff0055,
  ringCore: 0xffb3c8
} as const;

/**
 * Correntes Abissais: aura grossa + fio central + elos, e o grilhão em volta do monstro preso.
 * Evoluída (Grilhões do Tartarus) troca o roxo/ciano por verde espectral, para a evolução
 * não parecer só "a mesma arma com mais alvos" (pedido do dono em 2026-11-25).
 */
export const CHAINS_THEME = {
  normal: { aura: 0x9d4edd, core: 0x00f5d4 },
  tartarus: { aura: 0x1fa85a, core: 0xb8ff6a },
} as const;

/**
 * Tela de escolha de capítulo (painéis lado a lado que abrem no foco). Artes opcionais (seção 24
 * do ART_PROMPTS): sem elas, molduras e cadeado são desenhados por código com estas cores.
 */
export const CHAPTER_SELECT_THEME = {
  backdrop: 0x07020b,
  backdropAlpha: 0.96,
  /** Fundo do painel atrás da arte (e dos não lançados). */
  panelFill: 0x12061b,
  panelBorder: 0x4a2066,
  panelBorderFocus: 0xffd60a,
  panelGlowFocus: 0xff2a55,
  panelHighlight: 0x6b2f8f,
  panelShade: 0x05010a,
  /** Faixa escura atrás dos textos (sobe do pé do painel). */
  textBand: 0x05010a,
  lockedTint: 0x6a6470,
  /** Moldura de arte fora de foco: levemente apagada. */
  frameIdleTint: 0xc8c0d0,
  numeral: '#f3d17a',
  numeralLocked: '#6f6878',
  title: '#ffffff',
  titleFocus: '#ffd60a',
  boss: '#ff4d6d',
  summary: '#e9dcf5',
  bestLabel: '#c9a8e0',
  bestValue: '#ffd60a',
  lockedText: '#a59cb0',
  textStroke: '#12020a',
  hint: '#c9a8e0',
} as const;

/**
 * Peças da tela de capítulos (scripts/cut-chapter-ui.py -> public/assets/sprites/chapters/ui/).
 * Textura = `chui-<nome do arquivo>`. Sem a peça (ou no modo Canvas, sem NineSlice) a tela
 * desenha a versão por código.
 */
export const CHAPTER_UI_PIECES = [
  'frame-normal', 'frame-selected', 'frame-locked', 'coming-soon-bg', 'sealed-chains',
  'title-plaque', 'heading-ribbon', 'best-time-plate', 'text-panel', 'button-normal',
  'button-selected', 'badge-unlocked', 'badge-locked', 'padlock', 'cleared-seal', 'arrow',
  'hourglass', 'chain-strip', 'chain-lock',
] as const;
export type ChapterUiPiece = typeof CHAPTER_UI_PIECES[number];
export const chapterUiKey = (piece: ChapterUiPiece): string => `chui-${piece}`;

/** Lyn (minichefe súcubo): rosa para separar dela os avisos carmesim da Rosalin. */
export const LYN_THEME = {
  tellTint: 0xff7ad9,
  ghostTint: 0xff4fd8,
  windedTint: 0xaaaaaa,
  deathTint: 0xff0055,
  swoopLine: 0xff4fd8,
  swoopLineInner: 0xffffff
} as const;

/** Tela de cartas: as cartas fora de foco ficam um pouco escurecidas, então a selecionada se destaca. */
export const CARD_FOCUS_THEME = {
  unfocusedTint: 0xb8b8b8
} as const;

/** Barrinha da tela de cartas que enche enquanto a escolha está travada. */
export const PICK_LOCK_BAR_THEME = {
  track: 0x0b0208,
  fill: 0xf3d17a,
  border: 0x6e2d1d
} as const;

export const MODAL_THEME = {
  backdropColor: 0x000000,
  /** Menu de pausa: mesma linguagem violeta do painel de status (obsidiana + magenta). */
  pause: {
    backdropAlpha: 0.84,
    panelFill: 0x120616,
    panelAlpha: 0.97,
    outerBorderColor: 0x9b5de5,
    outerBorderWidth: 3,
    outerRadius: 14,
    innerBorderColor: 0xd61cff,
    innerBorderWidth: 1.5,
    innerBorderAlpha: 0.45,
    innerRadius: 10,
    titleColor: '#ffd6ff',
    titleStroke: '#3d0a52',
    titlePlaqueFill: 0x1f0a2b,
    subtitleColor: '#f3d17a',
    statsTextColor: '#f3d17a',
    labelColor: '#c9a8e0',
    valueColor: '#ffffff',
    textStroke: '#12020a',
    cellFill: 0x1c0b26,
    cellBorder: 0x4a2066,
    sectionLine: 0x6a1fa0,
    sectionText: '#e08cff',
    emptyText: '#8f7aa3',
    evolvedText: '#ffd60a',
    bgmColorHex: '#ff4d6d',
    bgmColorNum: 0xff4d6d,
    sfxColorHex: '#c77dff',
    sfxColorNum: 0xc77dff,
    barTrackFill: 0x0b0208,
    stepperHoverFill: 0x6a1fa0,
    stepperIdleFill: 0x1c0b26,
    btnResumeBg: 0x4b1673,
    btnResumeBorder: 0xd61cff,
    btnRestartBg: 0x5a0f1f,
    btnRestartBorder: 0xff4d6d,
    btnMenuBg: 0x241030,
    btnMenuBorder: 0x9b5de5,
    btnHoverBorder: 0xffffff
  },
  /** Seleção de capítulo do Modo História (menu principal): cartas lado a lado com o retrato do chefe. */
  chapterSelect: {
    backdropAlpha: 0.86,
    panelFill: 0x120616,
    panelAlpha: 0.97,
    titleColor: '#ffd6ff',
    titleStroke: '#3d0a52',
    cardFill: 0x1c0b26,
    cardFillFocus: 0x2b1040,
    cardHighlight: 0x3a1a52,
    cardShade: 0x0b0410,
    cardBorderFocus: 0xffd60a,
    portraitBackdrop: 0x0b0208,
    portraitBorder: 0x4a2066,
    nameColor: '#ffffff',
    nameColorFocus: '#ffd60a',
    infoLabelColor: '#c9a8e0',
    infoValueColor: '#f3d17a',
    textStroke: '#12020a',
    hintColor: '#c9a8e0',
    accentCh1: 0xff2a55,
    accentCh1Text: '#ff4d6d',
    accentCh2: 0x9d4edd,
    accentCh2Text: '#c77dff',
    btnTextColor: '#ffffff',
    btnTextFocus: '#ffd60a',
    btnFocusOutline: 0xffd60a
  },
  /** Fim da Jornada: sem painel; véu escuro com vinheta carmesim e conteúdo solto. */
  gameOver: {
    veil: 0x07010a,
    veilAlpha: 0.9,
    vignette: 0x5a0014,
    titleColor: '#ff0055',
    titleStroke: '#2a0010',
    subtitleColor: '#e0aaff',
    subtitleStroke: '#100306',
    statValue: '#ffffff',
    statLabel: '#c59b27',
    statSub: '#a78bba',
    newRecordColor: '#ffd60a',
    optionIdle: '#8a7a96',
    optionActive: '#ffd60a',
    optionUnderline: 0xffd60a,
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

/** Aviso de erro na tela (CrashGuard): texto solto no canto, sem caixa. */
export const CRASH_THEME = {
  text: '#ff4d6d',
  detail: '#f3d17a',
  shadow: '#000000',
} as const;

/** Roleta do Baú do Abismo: só ícones correndo da direita para a esquerda e duas setas no centro. */
export const CHEST_ROULETTE_THEME = {
  backdrop: 0x000000,
  backdropAlpha: 0.8,
  pointer: 0xffd700,
  header: '#ff4d6d',
  headerDone: '#00f5d4',
  prizeName: '#ffe600',
  desc: '#e2e8f0',
  collect: '#f3d17a',
  collectHover: '#ffffff',
  stroke: '#000000',
} as const;

/**
 * Talismãs (prêmio do minichefe): cor de cada raridade, moldura da carta, item no chão,
 * contorno branco dos pets e efeitos das armas únicas.
 */
export const TALISMAN_THEME = {
  /**
   * Cor de cada raridade (a mesma das cartas; a lendária usa o ouro do Supremo) e a arte do
   * talismã da revelação: inteiro (`art`) e rachando (`openArt`), em public/assets/sprites/talismans.
   */
  rarity: {
    common: { color: CARD_RARITY_THEME.common.color, text: CARD_RARITY_THEME.common.text, art: 'talisman-common', openArt: 'talisman-common-open', label: 'COMUM' },
    uncommon: { color: CARD_RARITY_THEME.uncommon.color, text: CARD_RARITY_THEME.uncommon.text, art: 'talisman-uncommon', openArt: 'talisman-uncommon-open', label: 'INCOMUM' },
    rare: { color: CARD_RARITY_THEME.rare.color, text: CARD_RARITY_THEME.rare.text, art: 'talisman-rare', openArt: 'talisman-rare-open', label: 'RARA' },
    epic: { color: CARD_RARITY_THEME.epic.color, text: CARD_RARITY_THEME.epic.text, art: 'talisman-epic', openArt: 'talisman-epic-open', label: 'ÉPICA' },
    legendary: { color: CARD_RARITY_THEME.supreme.color, text: CARD_RARITY_THEME.supreme.text, art: 'talisman-legendary', openArt: 'talisman-legendary-open', label: 'LENDÁRIA' },
  },
  textStroke: '#0e0208',
  hint: '#94a3b8',
  kindText: '#f3d17a',
  backdrop: 0x000000,
  /** Item no chão: feixe e brilho violeta-dourado (a raridade só aparece ao abrir). */
  dropBeam: 0xffd700,
  dropGlow: 0xd946ef,
  dropSpark: 0xfff3b0,
  /** Radar e seta de borda. */
  radarFill: 0xffd700,
  radarRing: 0xd946ef,
  edgeBadge: 0x1f0a2b,
  edgeText: '#ffd700',
  petOutline: 0xffffff,
  fx: {
    spark: 0x7df9ff,
    sparkCore: 0xffffff,
    bone: 0xf5f0e1,
    boneWarn: 0xff7b00,
    frost: 0x93c5fd,
    frostCore: 0xe0f2fe,
    eye: 0xd946ef,
    eyeCore: 0xffd6ff,
    pillar: 0xff4500,
    pillarCore: 0xffe600,
    slimeSplash: 0x4ade80,
    shadowBurst: 0x7c3aed,
    shadowBurstCore: 0xe9d5ff,
    shield: 0xf5f0e1,
    vortex: 0x6d28d9,
    vortexCore: 0x00f5d4,
    blood: 0xe11d48,
    bloodCore: 0xffb3c8,
    meteor: 0xff7b00,
  },
} as const;

