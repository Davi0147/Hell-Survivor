import { INFERNAL_FURY_BALANCE } from '../config/balance';

interface FuryConfig {
  baseChance: number;
  chanceStepPerLevel: number;
  cooldownLevels: number;
  minLevel: number;
}

/**
 * Sorteio da Fúria do Inferno a cada nível ganho. Sem Phaser, para dar para testar.
 *
 * - Antes de `minLevel` não sorteia.
 * - Depois de uma fúria no nível N, a próxima só a partir do nível N + `cooldownLevels`.
 * - A chance começa em `baseChance` e sobe `chanceStepPerLevel` a cada nível elegível sem fúria.
 */
export class InfernalFuryRoller {
  private lastFuryLevel = -Infinity;
  private missedLevels = 0;

  constructor(private readonly cfg: FuryConfig = INFERNAL_FURY_BALANCE) {}

  /** Chance (0 a 1) de o próximo nível elegível trazer a fúria. */
  public get currentChance(): number {
    return Math.min(1, this.cfg.baseChance + this.missedLevels * this.cfg.chanceStepPerLevel);
  }

  public isEligible(level: number): boolean {
    return level >= this.cfg.minLevel && level >= this.lastFuryLevel + this.cfg.cooldownLevels;
  }

  /**
   * Chamar uma vez por nível ganho. `roll` é um número de 0 a 1 (Math.random no jogo).
   * @returns true se a fúria deve começar
   */
  public onLevelUp(level: number, roll: number): boolean {
    if (!this.isEligible(level)) return false;
    if (roll < this.currentChance) {
      this.markTriggered(level);
      return true;
    }
    this.missedLevels++;
    return false;
  }

  /** Fúria começou (sorteio ou Modo de Teste): zera a chance e conta o intervalo daqui. */
  public markTriggered(level: number): void {
    this.lastFuryLevel = level;
    this.missedLevels = 0;
  }
}
