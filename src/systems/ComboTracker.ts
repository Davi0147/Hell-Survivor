import { COMBO_BALANCE, ComboTier } from '../config/balance';

/** O que aconteceu com o combo depois de um abate. */
export interface ComboKillResult {
  combo: number;
  /** Degrau recém-alcançado (só no abate exato em que ele é atingido). */
  tierReached?: ComboTier;
  /** O abate disparou o Frenesi. */
  frenzyTriggered: boolean;
}

/**
 * ComboTracker — conta abates em sequência. Lógica pura (sem Phaser) para ser testável.
 * O combo zera se a janela de tempo passar sem nenhum abate.
 */
export class ComboTracker {
  public combo = 0;
  public maxCombo = 0;
  /** Tempo que falta para o combo zerar. */
  public timeLeftMs = 0;
  public frenzyTimeLeftMs = 0;
  /** Bônus somados por cartas (Sede de Sangue). */
  public windowBonusMs = 0;
  public frenzyBonusMs = 0;

  public get windowMs(): number {
    return COMBO_BALANCE.windowMs + this.windowBonusMs;
  }

  public get frenzyDurationMs(): number {
    return COMBO_BALANCE.frenzyDurationMs + this.frenzyBonusMs;
  }

  public get isFrenzyActive(): boolean {
    return this.frenzyTimeLeftMs > 0;
  }

  /** Fração (0 a 1) da janela que ainda resta, para a barra da HUD. */
  public get windowRatio(): number {
    return this.combo > 0 ? Math.max(0, Math.min(1, this.timeLeftMs / this.windowMs)) : 0;
  }

  /** Degrau atual do combo, ou `undefined` abaixo do primeiro. */
  public get currentTier(): ComboTier | undefined {
    let tier: ComboTier | undefined;
    for (const t of COMBO_BALANCE.tiers) {
      if (this.combo >= t.at) tier = t;
    }
    return tier;
  }

  public get xpBonus(): number {
    return this.currentTier?.xpBonus ?? 0;
  }

  public registerKill(): ComboKillResult {
    this.combo += 1;
    this.timeLeftMs = this.windowMs;
    if (this.combo > this.maxCombo) this.maxCombo = this.combo;

    const tierReached = COMBO_BALANCE.tiers.find((t) => t.at === this.combo);
    const frenzyTriggered = this.combo % COMBO_BALANCE.frenzyEvery === 0;
    if (frenzyTriggered) this.frenzyTimeLeftMs = this.frenzyDurationMs;

    return { combo: this.combo, tierReached, frenzyTriggered };
  }

  /**
   * Avança o relógio. Devolve o que terminou neste quadro, para a cena reagir.
   */
  public update(deltaMs: number): { comboBroken: number; frenzyEnded: boolean } {
    let comboBroken = 0;
    let frenzyEnded = false;

    if (this.combo > 0) {
      this.timeLeftMs -= deltaMs;
      if (this.timeLeftMs <= 0) {
        comboBroken = this.combo;
        this.combo = 0;
        this.timeLeftMs = 0;
      }
    }

    if (this.frenzyTimeLeftMs > 0) {
      this.frenzyTimeLeftMs -= deltaMs;
      if (this.frenzyTimeLeftMs <= 0) {
        this.frenzyTimeLeftMs = 0;
        frenzyEnded = true;
      }
    }

    return { comboBroken, frenzyEnded };
  }
}
