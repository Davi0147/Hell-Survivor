import { IDLE_PRESSURE_BALANCE, getIdlePressureBonus } from '../config/balance';

/**
 * Pressão do Abismo: conta quanto tempo o jogador está "plantado" num lugar e devolve o
 * bônus de força dos monstros. Plantado = não se afastou mais que `leashRadius` do ponto
 * onde parou; sair desse círculo zera tudo e o ponto passa a ser a posição nova.
 * Sem Phaser, para dar para testar.
 */
export class IdlePressureSystem {
  private anchorX = 0;
  private anchorY = 0;
  private hasAnchor = false;
  private stillMs = 0;

  /** Bônus atual (0 = monstros normais; 0.25 = +25% de força). */
  public get bonus(): number {
    return getIdlePressureBonus(this.stillMs);
  }

  /** Multiplicador de força dos monstros (1 + bônus). */
  public get multiplier(): number {
    return 1 + this.bonus;
  }

  public get secondsStill(): number {
    return this.stillMs / 1000;
  }

  /** Chamar a cada quadro de jogo (não roda com o jogo pausado). */
  public update(deltaMs: number, x: number, y: number): void {
    if (!this.hasAnchor) {
      this.setAnchor(x, y);
      return;
    }
    const dx = x - this.anchorX;
    const dy = y - this.anchorY;
    if (dx * dx + dy * dy > IDLE_PRESSURE_BALANCE.leashRadius ** 2) {
      this.setAnchor(x, y);
      this.stillMs = 0;
      return;
    }
    this.stillMs += deltaMs;
  }

  public reset(): void {
    this.hasAnchor = false;
    this.stillMs = 0;
  }

  private setAnchor(x: number, y: number): void {
    this.anchorX = x;
    this.anchorY = y;
    this.hasAnchor = true;
  }
}
