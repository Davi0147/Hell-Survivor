import { STORAGE_KEYS } from '../config/storageKeys';

export type DebugLogCategory =
  | 'SYSTEM'
  | 'SANDBOX'
  | 'COMBAT'
  | 'WEAPON'
  | 'UPGRADE'
  | 'ITEM'
  | 'ALTAR'
  | 'BOSS'
  | 'AUDIO'
  | 'ANOMALY'
  | 'ERROR';

export interface DebugLogEntry {
  id: number;
  timeIso: string;
  elapsedSec: number;
  category: DebugLogCategory;
  severity: 'INFO' | 'WARN' | 'ERROR';
  message: string;
  details?: Record<string, any>;
}

export interface TelemetrySnapshot {
  fps: number;
  minFps: number;
  avgFps: number;
  enemiesActive: number;
  gemsActive: number;
  mapItemsActive: number;
  projectilesActive: number;
  playerHp: string;
  playerPos: string;
  playerLevel: number;
  equippedWeapons: string[];
  currentBgm: string;
  audioState: string;
  bossActive: boolean;
  bossHp?: string;
}

export class DebugSessionLogger {
  private static instance: DebugSessionLogger;

  private sessionStartMs: number = Date.now();
  private entries: DebugLogEntry[] = [];
  private nextId: number = 1;
  private readonly MAX_ENTRIES = 600;

  // Métricas de FPS e Telemetria
  private fpsSamples: number[] = [];
  private minFps: number = 60;
  private lastSampleTimeMs: number = 0;
  private lastFpsWarnTimeMs: number = 0;
  private hooksInstalled: boolean = false;

  // Métricas do Agente Autônomo de Testes [F3]
  private botLevelsGained: number = 0;
  private botCardsChosen: number = 0;

  private constructor() {
    this.sessionStartMs = Date.now();
    this.installGlobalErrorHooks();
    this.log('SYSTEM', 'INFO', 'Sessão de Debug iniciada (Flight Recorder ativo)', {
      userAgent: navigator.userAgent,
      screen: `${window.innerWidth}x${window.innerHeight}`
    });
  }

  public static getInstance(): DebugSessionLogger {
    if (!DebugSessionLogger.instance) {
      DebugSessionLogger.instance = new DebugSessionLogger();
    }
    return DebugSessionLogger.instance;
  }

  /**
   * Intercepta erros globais de runtime e rejeições de Promise para nunca perder um bug silencioso
   */
  private installGlobalErrorHooks(): void {
    if (this.hooksInstalled) return;
    this.hooksInstalled = true;

    window.addEventListener('error', (event) => {
      this.log('ERROR', 'ERROR', `Erro Global JS: ${event.message}`, {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: event.error?.stack ? String(event.error.stack).slice(0, 400) : undefined
      });
    });

    window.addEventListener('unhandledrejection', (event) => {
      this.log('ERROR', 'ERROR', `Promise Rejeitada: ${String(event.reason)}`, {});
    });
  }

  public startNewSession(mode: string): void {
    this.sessionStartMs = Date.now();
    this.fpsSamples = [];
    this.minFps = 60;
    this.log('SYSTEM', 'INFO', `Nova partida iniciada no modo: ${mode.toUpperCase()}`);
  }

  public log(
    category: DebugLogCategory,
    severity: 'INFO' | 'WARN' | 'ERROR',
    message: string,
    details?: Record<string, any>
  ): void {
    const now = Date.now();
    const elapsedSec = Number(((now - this.sessionStartMs) / 1000).toFixed(2));
    const date = new Date(now);
    const timeIso = date.toTimeString().split(' ')[0] + '.' + String(date.getMilliseconds()).padStart(3, '0');

    const entry: DebugLogEntry = {
      id: this.nextId++,
      timeIso,
      elapsedSec,
      category,
      severity,
      message,
      details
    };

    this.entries.push(entry);
    if (this.entries.length > this.MAX_ENTRIES) {
      this.entries.shift();
    }

    // Salva continuamente um backup leve no localStorage
    this.persistToStorage();
  }

  private persistToStorage(): void {
    try {
      const recent = this.entries.slice(-150);
      localStorage.setItem(STORAGE_KEYS.DEBUG_SESSION_LOG, JSON.stringify(recent));
    } catch {}
  }

  public clearLogs(): void {
    this.entries = [];
    this.fpsSamples = [];
    this.minFps = 60;
    this.log('SANDBOX', 'INFO', 'Histórico de logs da sessão limpo pelo usuário.');
  }

  public getEntries(): DebugLogEntry[] {
    return this.entries;
  }

  public getRecentEntries(count: number = 14): DebugLogEntry[] {
    return this.entries.slice(-count);
  }

  /**
   * Coleta telemetria a cada 1s durante o jogo e verifica anomalias automaticamente
   */
  public sampleTelemetry(gameScene: any): void {
    const now = Date.now();
    if (now - this.lastSampleTimeMs < 1000) return;
    this.lastSampleTimeMs = now;

    if (!gameScene || !gameScene.game) return;

    const fps = Math.round(gameScene.game.loop.actualFps || 60);
    this.fpsSamples.push(fps);
    if (this.fpsSamples.length > 120) {
      this.fpsSamples.shift();
    }
    if (fps < this.minFps && this.fpsSamples.length > 3) {
      this.minFps = fps;
    }

    const snap = this.captureSnapshot(gameScene);

    // 1. Detector de Queda de FPS
    if (fps < 32 && now - this.lastFpsWarnTimeMs > 5000 && this.fpsSamples.length > 3) {
      this.lastFpsWarnTimeMs = now;
      this.log('ANOMALY', 'WARN', `Queda de performance detectada: ${fps} FPS`, {
        enemies: snap.enemiesActive,
        gems: snap.gemsActive,
        projectiles: snap.projectilesActive
      });
    }

    // 2. Detector de Saturação de Pool de Inimigos
    if (snap.enemiesActive >= 285) {
      this.log('ANOMALY', 'WARN', `Pool de inimigos próximo do limite máximo (${snap.enemiesActive}/300)`);
    }

    // 3. Detector de Coordenadas Inválidas (NaN) na Heroína
    if (gameScene.player && (isNaN(gameScene.player.x) || isNaN(gameScene.player.y))) {
      this.log('ANOMALY', 'ERROR', 'Coordenada NaN detectada na Nixy!', {
        x: gameScene.player.x,
        y: gameScene.player.y
      });
    }
  }

  public captureSnapshot(gameScene?: any): TelemetrySnapshot {
    if (!gameScene) {
      return {
        fps: 60,
        minFps: this.minFps,
        avgFps: 60,
        enemiesActive: 0,
        gemsActive: 0,
        mapItemsActive: 0,
        projectilesActive: 0,
        playerHp: 'N/A',
        playerPos: '0, 0',
        playerLevel: 1,
        equippedWeapons: [],
        currentBgm: 'N/A',
        audioState: 'N/A',
        bossActive: false
      };
    }

    const fps = Math.round(gameScene.game?.loop?.actualFps || 60);
    const avgFps =
      this.fpsSamples.length > 0
        ? Math.round(this.fpsSamples.reduce((a, b) => a + b, 0) / this.fpsSamples.length)
        : fps;

    const enemiesActive = gameScene.enemiesGroup ? gameScene.enemiesGroup.countActive() : 0;
    const gemsActive = gameScene.gemsGroup ? gameScene.gemsGroup.countActive() : 0;
    const mapItemsActive = gameScene.mapItemsGroup ? gameScene.mapItemsGroup.countActive() : 0;

    let projectilesActive = 0;
    const equippedWeapons: string[] = [];
    if (Array.isArray(gameScene.weapons)) {
      for (const w of gameScene.weapons) {
        const lvlInfo =
          typeof w.getLevel === 'function'
            ? ` (Nív ${w.getLevel()})`
            : typeof w.getBladeCount === 'function'
              ? ` (${w.getBladeCount()} lâminas)`
              : '';
        const evoInfo = w.isEvolved ? ' [EVOLUÍDA]' : '';
        equippedWeapons.push(`${w.name}${lvlInfo}${evoInfo}`);

        if (w.projectilesGroup && typeof w.projectilesGroup.countActive === 'function') {
          projectilesActive += w.projectilesGroup.countActive();
        }
      }
    }

    const p = gameScene.player;
    const playerHp = p ? `${Math.ceil(p.currentHp)}/${p.maxHp}` : 'N/A';
    const playerPos = p ? `(${Math.round(p.x)}, ${Math.round(p.y)})` : '(0, 0)';
    const playerLevel = p ? p.currentLevel : 1;

    const boss = gameScene.bossInstance;
    const bossActive = Boolean(boss && boss.active && !boss.isDead);
    const bossHp = bossActive ? `${Math.ceil(boss.hp)}/${boss.maxHp}` : undefined;

    let currentBgm = 'Nenhuma';
    let audioState = 'OK';
    try {
      const sm = (window as any).__hellSurvivorSoundManager;
      if (sm) {
        currentBgm = sm.currentBgmKey || 'Nenhuma';
        audioState = sm.audioCtx?.state || 'OK';
      }
    } catch {}

    return {
      fps,
      minFps: this.minFps,
      avgFps,
      enemiesActive,
      gemsActive,
      mapItemsActive,
      projectilesActive,
      playerHp,
      playerPos,
      playerLevel,
      equippedWeapons,
      currentBgm,
      audioState,
      bossActive,
      bossHp
    };
  }

  public recordBotUpgrade(
    cardTitle: string,
    level: number,
    timeSec: number,
    details?: Record<string, unknown>
  ): void {
    this.botCardsChosen++;
    this.log(
      'UPGRADE',
      'INFO',
      `[BOT F3] Carta Escolhida: "${cardTitle}" | Nível: ${level} | Tempo: ${timeSec.toFixed(1)}s`,
      { card: cardTitle, level, timeSec, botCardsTotal: this.botCardsChosen, ...details }
    );
  }

  public recordBotLevelUp(newLevel: number): void {
    this.botLevelsGained++;
    this.log(
      'UPGRADE',
      'INFO',
      `[BOT F3] Nível Subido: ${newLevel} (Total pelo Bot: ${this.botLevelsGained})`,
      { newLevel, botLevelsTotal: this.botLevelsGained }
    );
  }

  public getBotCardsChosen(): number {
    return this.botCardsChosen;
  }

  public getBotLevelsGained(): number {
    return this.botLevelsGained;
  }

  /**
   * Gera um Relatório Completo e estruturado pronto para colar no chat da IA
   */
  public generateAIReport(gameScene?: any): string {
    const snap = this.captureSnapshot(gameScene);
    const p = gameScene?.player;
    const anomalies = this.entries.filter((e) => e.severity !== 'INFO' || e.category === 'ANOMALY');

    const lines: string[] = [
      '=== RELATÓRIO DE DIAGNÓSTICO & SESSÃO (HELL SURVIVOR) ===',
      `Data/Hora: ${new Date().toLocaleString('pt-BR')}`,
      `Modo de Jogo: ${gameScene?.gameMode?.toUpperCase() || 'MENU'}`,
      `Tempo de Sobrevivência: ${gameScene ? (gameScene.survivalTimeMs / 1000).toFixed(1) + 's' : '0s'}`,
      `Performance: FPS Atual=${snap.fps} | FPS Médio=${snap.avgFps} | FPS Mínimo=${snap.minFps}`,
      `Entidades Ativas: Inimigos=${snap.enemiesActive} | Gemas=${snap.gemsActive} | ItensMapa=${snap.mapItemsActive} | Projéteis=${snap.projectilesActive}`,
      `Boss Ativa: ${snap.bossActive ? 'SIM (HP: ' + snap.bossHp + ')' : 'NÃO'}`,
      '',
      '--- ESTADO DA NIXY & ATRIBUTOS ---',
      p
        ? `Nível: ${p.currentLevel} (XP: ${p.currentXp}/${p.xpToNextLevel}) | HP: ${snap.playerHp} | Pos: ${snap.playerPos}`
        : 'Nixy não instanciada',
      p
        ? `Dano Bônus: +${p.bonusDamagePercent}% | Velocidade Bônus: +${p.bonusSpeedPercent}% | Tiros Extras: +${p.extraProjectiles} | Perfuração Extra: +${p.extraPierce}`
        : '',
      p
        ? `Regen HP: ${p.hpRegenPerSec}/s | Roubo de Vida: ${p.lifeStealPerHit}/hit | Raio Coleta: +${p.bonusPickupRadiusPercent}% | Rerolls: ${p.rerollsRemaining}`
        : '',
      p
        ? `Trapaças Sandbox: GodMode=${Boolean(gameScene?.sandboxGodMode)} | UltInfinita=${Boolean(gameScene?.sandboxInfiniteUlt)} | EstaminaInfinita=${Boolean(gameScene?.sandboxInfiniteStamina)} | AutoSpawn=${Boolean(gameScene?.sandboxAutoSpawn)}`
        : '',
      `Armas Equipadas (${snap.equippedWeapons.length}): ${snap.equippedWeapons.join(' | ') || 'Nenhuma'}`,
      `Bot de Teste Autônomo [F3]: Níveis Subidos: ${this.botLevelsGained} | Cartas Escolhidas: ${this.botCardsChosen}`,
      '',
      `--- ALERTAS E ANOMALIAS DETECTADAS (${anomalies.length}) ---`
    ];

    if (anomalies.length === 0) {
      lines.push('Nenhuma anomalia, queda severa ou erro de código detectado na sessão.');
    } else {
      for (const a of anomalies.slice(-25)) {
        const det = a.details ? ` -> ${JSON.stringify(a.details)}` : '';
        lines.push(`[${a.timeIso} | +${a.elapsedSec}s] [${a.severity}/${a.category}] ${a.message}${det}`);
      }
    }

    lines.push('');
    lines.push(`--- ÚLTIMOS 40 EVENTOS DA SESSÃO (Total: ${this.entries.length}) ---`);
    for (const e of this.entries.slice(-40)) {
      const det = e.details ? ` ${JSON.stringify(e.details)}` : '';
      lines.push(`[+${e.elapsedSec}s] [${e.category}] ${e.message}${det}`);
    }
    lines.push('=== FIM DO RELATÓRIO ===');

    return lines.filter((l) => l !== undefined).join('\n');
  }

  public async copyReportToClipboard(gameScene?: any): Promise<boolean> {
    const report = this.generateAIReport(gameScene);
    try {
      await navigator.clipboard.writeText(report);
      this.log('SANDBOX', 'INFO', 'Relatório de Debug copiado para a Área de Transferência.');
      return true;
    } catch {
      try {
        const ta = document.createElement('textarea');
        ta.value = report;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        this.log('SANDBOX', 'INFO', 'Relatório de Debug copiado (fallback).');
        return true;
      } catch {
        return false;
      }
    }
  }

  public downloadJsonLog(gameScene?: any): void {
    const payload = {
      generatedAt: new Date().toISOString(),
      snapshot: this.captureSnapshot(gameScene),
      aiReportText: this.generateAIReport(gameScene),
      events: this.entries
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `hell-survivor-debug-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    this.log('SANDBOX', 'INFO', 'Arquivo JSON de diagnóstico exportado.');
  }
}
