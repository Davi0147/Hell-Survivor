import Phaser from 'phaser';
import { Nixy } from '../entities/characters/Nixy';
import { BaseEnemy } from '../entities/enemies/BaseEnemy';
import { SoulGem } from '../entities/items/SoulGem';
import { MapItem } from '../entities/items/MapItem';
import type { UpgradeScene, UpgradeCard } from '../scenes/UpgradeScene';
import { DebugSessionLogger } from './DebugSessionLogger';

export interface TestRunReport {
  runId: number;
  timestamp: string;
  gameMode: string;
  survivalTimeSec: number;
  levelReached: number;
  kills: number;
  hpRemaining: number;
  equippedWeapons: string[];
  deathCause?: string;
}

export class AutoPlayTestAgent {
  private static instance: AutoPlayTestAgent;
  public isEnabled: boolean = false;
  private currentRunId: number = 0;
  private runHistory: TestRunReport[] = [];
  private upgradeDecisionTimer: number = 0;

  private constructor() {}

  public static getInstance(): AutoPlayTestAgent {
    if (!AutoPlayTestAgent.instance) {
      AutoPlayTestAgent.instance = new AutoPlayTestAgent();
    }
    return AutoPlayTestAgent.instance;
  }

  public toggle(): boolean {
    this.isEnabled = !this.isEnabled;
    DebugSessionLogger.getInstance().log(
      'SANDBOX',
      'INFO',
      `Agente de Teste Autônomo (Bot AI): ${this.isEnabled ? 'ATIVADO' : 'DESATIVADO'}`
    );
    return this.isEnabled;
  }

  /**
   * Pilota a heroína Nixy de forma autônoma a cada frame
   */
  public updateAgent(gameScene: any, deltaMs: number): { dx: number; dy: number; isSprint: boolean } {
    if (!this.isEnabled) return { dx: 0, dy: 0, isSprint: false };

    const player: Nixy = gameScene.player;
    if (!player || player.currentHp <= 0) return { dx: 0, dy: 0, isSprint: false };

    // 1. A resolução da tela de Upgrades é orientada pela própria UpgradeScene.update enquanto a GameScene fica pausada.

    // 2. Dispara Habilidade Suprema automaticamente quando carregada
    if (player.isUltimateReady && !player.isUltimateActive) {
      gameScene.triggerUltimate();
    }

    // 3. Vetor de Repulsão contra Inimigos Próximos (Kiting)
    let repulseX = 0;
    let repulseY = 0;
    let threatsNear = 0;

    const enemies = gameScene.enemiesGroup ? (gameScene.enemiesGroup.getChildren() as BaseEnemy[]) : [];
    for (let i = 0; i < enemies.length; i++) {
      const e = enemies[i];
      if (!e.active || e.isDead) continue;

      const dist = Math.hypot(e.x - player.x, e.y - player.y);
      if (dist < 180 && dist > 1) {
        threatsNear++;
        const weight = (180 - dist) / 180;
        repulseX += ((player.x - e.x) / dist) * weight * 2.5;
        repulseY += ((player.y - e.y) / dist) * weight * 2.5;
      }
    }

    // 4. Vetor de Atração para Itens e Gemas de Alma mais próximas
    let targetX = 0;
    let targetY = 0;
    let hasTarget = false;
    let bestDist = 320;

    // Prioridade 1: Itens de Mapa (Cálice de cura se vida < 75%, Ímã ou Baú)
    const mapItems = gameScene.mapItemsGroup ? (gameScene.mapItemsGroup.getChildren() as MapItem[]) : [];
    for (const item of mapItems) {
      if (item.active) {
        const dist = Math.hypot(item.x - player.x, item.y - player.y);
        if (dist < 500) {
          targetX = (item.x - player.x) / dist;
          targetY = (item.y - player.y) / dist;
          hasTarget = true;
          break;
        }
      }
    }

    // Prioridade 2: Gemas de XP próximas
    if (!hasTarget && gameScene.gemsGroup) {
      const gems = gameScene.gemsGroup.getChildren() as SoulGem[];
      for (let i = 0; i < gems.length; i++) {
        const g = gems[i];
        if (g.active && !g.isAttracted) {
          const dist = Math.hypot(g.x - player.x, g.y - player.y);
          if (dist < bestDist) {
            bestDist = dist;
            targetX = (g.x - player.x) / dist;
            targetY = (g.y - player.y) / dist;
            hasTarget = true;
          }
        }
      }
    }

    // Combinação dos vetores
    let totalX = repulseX * 1.5;
    let totalY = repulseY * 1.5;

    if (threatsNear < 3 && hasTarget) {
      totalX += targetX * 1.2;
      totalY += targetY * 1.2;
    } else if (threatsNear === 0) {
      // Movimentação orbital suave se o campo estiver vazio
      const time = gameScene.time.now * 0.001;
      totalX = Math.cos(time) * 0.8;
      totalY = Math.sin(time) * 0.8;
    }

    const len = Math.hypot(totalX, totalY);
    let dx = 0;
    let dy = 0;
    if (len > 0.05) {
      dx = totalX / len;
      dy = totalY / len;
    }

    // Aciona Sprint caso cercada ou vida baixa
    const isSprint = threatsNear >= 4 || (player.currentHp < player.maxHp * 0.4 && threatsNear >= 2);

    return { dx, dy, isSprint };
  }

  /**
   * Resolve a tela de upgrades de forma inteligente escolhendo sinergias e evoluções
   */
  public checkAndResolveUpgradeModal(upgradeScene: UpgradeScene, deltaMs: number): void {
    if (!this.isEnabled || !upgradeScene || upgradeScene.getIsClosing()) {
      this.upgradeDecisionTimer = 0;
      return;
    }

    this.upgradeDecisionTimer += deltaMs;
    // Aguarda 250ms simulando tempo de reação humano/IA
    if (this.upgradeDecisionTimer >= 250) {
      this.upgradeDecisionTimer = 0;

      const containers = upgradeScene.getCardContainers();
      if (containers.length === 0) return;

      // Pressiona o primeiro card prioritário ou evoluções
      let cardToPick = containers[0];
      for (let i = 0; i < containers.length; i++) {
        const c = containers[i];
        const card = c.getData ? (c.getData('upgradeCard') as UpgradeCard | undefined) : undefined;
        if (card && card.isEvolution) {
          cardToPick = c;
          break;
        }
      }

      if (cardToPick && typeof cardToPick.emit === 'function') {
        cardToPick.emit('pointerdown');
      }
    }
  }

  public recordRun(report: TestRunReport): void {
    this.currentRunId++;
    report.runId = this.currentRunId;
    this.runHistory.push(report);
    if (this.runHistory.length > 25) {
      this.runHistory.shift();
    }
    DebugSessionLogger.getInstance().log(
      'SANDBOX',
      'INFO',
      `Run #${report.runId} concluída: Sobreviveu ${report.survivalTimeSec}s | Nível ${report.levelReached} | ${report.kills} Abates`
    );
  }

  public getRunHistory(): TestRunReport[] {
    return this.runHistory;
  }
}
