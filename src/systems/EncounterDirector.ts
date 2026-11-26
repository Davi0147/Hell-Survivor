import Phaser from 'phaser';
import type { EnemySpawnSystem } from './EnemySpawnSystem';
import { DebugSessionLogger } from './DebugSessionLogger';
import { SoundManager } from './SoundManager';
import {
  ENDLESS_SCHEDULE,
  FORMATION_BALANCE,
  getStorySchedule,
  type EnemyKind,
  type FormationId,
  type MiniBossId,
} from '../config/balance';
import {
  endlessBossMultipliers,
  endlessBossWarnings,
  endlessIntroKinds,
  endlessMiniBoss,
  endlessMiniBossHpMultiplier,
  endlessTheme,
  isQuietBeforeBoss,
  isUnlockedInEndless,
  isUnlockedInStory,
  storyFormations,
  storyIntroKinds,
} from './encounterRules';

/** O que o diretor usa da HUD (a UIScene cumpre este contrato). */
interface IEncounterHud {
  showWaveAlert(message: string, durationMs?: number): void;
  showCenterAnnouncement(title: string, subtitle?: string, durationMs?: number): void;
}

/** Contrato mínimo que a cena expõe para o EncounterDirector. */
export interface IEncounterContext {
  readonly player: { x: number; y: number };
  readonly gameMode: 'story' | 'endless' | 'sandbox';
  readonly currentChapter: number;
  readonly chapterPurifiedSouls: number;
  readonly chapterTargetSouls: number;
  readonly isBossFightActive: boolean;
  readonly isHordeSpawningPaused: boolean;
  readonly isGameOver: boolean;
  /** Chefe do fim do Círculo (Infinito). */
  spawnEndlessBoss(scale: { hp: number; damage: number }): void;
  /** Cabe mais `count` monstros sem passar do limite de desempenho? */
  hasRoomForEnemies(count: number): boolean;
}

const ENEMY_NAMES: Record<EnemyKind, string> = {
  dog: 'CÃES ZUMBIS',
  elite: 'CÃES ALFA',
  bat: 'MORCEGOS DE SANGUE',
  mummy: 'MÚMIAS DO ABISMO',
  slime: 'SKULL SLIMES',
  archer: 'ARQUEIRAS DEMÔNIAS',
  colossus: 'COLOSSUS',
};

const ENEMY_HINTS: Record<EnemyKind, string> = {
  dog: '',
  elite: 'MAIS FORTES E MAIS RÁPIDOS',
  bat: 'RÁPIDOS E FRÁGEIS, EM BANDO',
  mummy: 'DEIXAM VENENO NO CHÃO',
  slime: 'EXPLODEM PERTO DE VOCÊ',
  archer: 'ATIRAM DE LONGE E FOGEM',
  colossus: 'ESCUDO: PERFURAÇÃO PARA NELE',
};

const FORMATION_NAMES: Record<FormationId, string> = {
  wall: 'MURALHA',
  pack: 'MATILHA',
  hunt: 'CAÇADA',
  swarm: 'ENXAME',
  swamp: 'PÂNTANO',
};

const MINIBOSS_NAMES: Record<MiniBossId, string> = {
  ghoul: 'GHOUL DEVORADOR',
  lyn: 'LYN, A SÚCUBO',
};

/**
 * EncounterDirector — o cronograma de inimigos da partida.
 *
 * História: libera cada inimigo pela barra de purificação, apresenta os novos, solta o minichefe
 * do meio da fase e as formações do capítulo (`STORY_SCHEDULE`).
 *
 * Infinito: Círculos de `circleMs`. O relógio do Círculo para durante o chefe e a calmaria.
 * Círculo 1 apresenta todo mundo; minichefe no meio; chefe no fim (avisado, vem até a heroína);
 * do Círculo 2 em diante, tudo liberado + um tema de formação por Círculo (`ENDLESS_SCHEDULE`).
 *
 * Modo de Teste: não faz nada (tudo liberado, controle manual pelo painel).
 */
export class EncounterDirector {
  private readonly introduced = new Set<EnemyKind>();
  private circle = 1;
  private circleClockMs = 0;
  private miniBossDone = false;
  private bossWarned = false;
  private bossFinalWarned = false;
  private bossActive = false;
  private calmMs = 0;
  private formationTimer: number = FORMATION_BALANCE.firstDelayMs;
  private formationIndex = 0;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly ctx: IEncounterContext,
    private readonly spawner: EnemySpawnSystem
  ) {}

  private get hud(): IEncounterHud | undefined {
    return this.scene.scene.get('UIScene') as unknown as IEncounterHud | undefined;
  }

  private get storyRatio(): number {
    return this.ctx.chapterTargetSouls > 0 ? this.ctx.chapterPurifiedSouls / this.ctx.chapterTargetSouls : 0;
  }

  // ---------------------------------------------------------------------------
  // Consulta (spawner, eventos de horda, HUD)
  // ---------------------------------------------------------------------------

  public isUnlocked(kind: EnemyKind): boolean {
    if (this.ctx.gameMode === 'story') return isUnlockedInStory(this.ctx.currentChapter, this.storyRatio, kind);
    if (this.ctx.gameMode === 'endless') return isUnlockedInEndless(this.circle, this.circleClockMs, kind);
    return true;
  }

  /** Calmaria depois do chefe do Infinito: sem hordas novas. */
  public get isCalm(): boolean {
    return this.calmMs > 0;
  }

  /** Eventos de horda ficam quietos na calmaria e perto do chefe. */
  public get isEventQuiet(): boolean {
    if (this.ctx.gameMode !== 'endless') return false;
    return this.isCalm || this.bossActive || isQuietBeforeBoss(this.circleClockMs);
  }

  public get currentCircle(): number {
    return this.circle;
  }

  /** Texto curto do estado do cronograma (painel de teste e registro). */
  public describe(): string {
    if (this.ctx.gameMode === 'endless') {
      const s = Math.floor(this.circleClockMs / 1000);
      return `CÍRCULO ${this.circle} • ${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
    }
    if (this.ctx.gameMode === 'story') return `BARRA ${Math.round(this.storyRatio * 100)}%`;
    return 'MODO DE TESTE';
  }

  /**
   * Ferramenta de teste: avança o relógio do Círculo (Infinito). Na História não faz nada:
   * lá o cronograma segue a barra de purificação.
   */
  public debugAdvance(ms: number): void {
    if (this.ctx.gameMode !== 'endless' || this.bossActive || this.calmMs > 0) return;
    this.circleClockMs = Math.min(ENDLESS_SCHEDULE.circleMs, this.circleClockMs + ms);
    this.log(`Teste: relógio do Círculo avançado ${Math.round(ms / 1000)}s (${this.describe()})`);
  }

  // ---------------------------------------------------------------------------
  // Atualização por quadro
  // ---------------------------------------------------------------------------

  public update(delta: number): void {
    if (this.ctx.isGameOver) return;
    if (this.ctx.gameMode === 'endless') this.updateEndless(delta);
    else if (this.ctx.gameMode === 'story') this.updateStory(delta);
  }

  // ---------------------------------------------------------------------------
  // História
  // ---------------------------------------------------------------------------

  private updateStory(delta: number): void {
    // Altar desperto ou chefe em campo: o capítulo está no fim, nada de novidade
    if (this.ctx.isBossFightActive || this.ctx.isHordeSpawningPaused) return;
    const ratio = this.storyRatio;
    const chapter = this.ctx.currentChapter;

    for (const kind of storyIntroKinds(chapter)) {
      if (!this.introduced.has(kind) && isUnlockedInStory(chapter, ratio, kind)) this.introduce(kind);
    }

    const mini = getStorySchedule(chapter).miniBoss;
    if (mini && !this.miniBossDone && ratio >= mini.atRatio) {
      this.miniBossDone = true;
      this.spawnMiniBoss(mini.id, 1);
    }

    const available = storyFormations(chapter, ratio);
    if (available.length === 0) return;
    this.formationTimer -= delta;
    if (this.formationTimer <= 0) {
      if (this.spawnFormation(available[this.formationIndex % available.length], true)) {
        this.formationTimer = FORMATION_BALANCE.storyIntervalMs;
        this.formationIndex++;
      } else {
        this.formationTimer = FORMATION_BALANCE.retryWhenFullMs;
      }
    }
  }

  // ---------------------------------------------------------------------------
  // Infinito (Círculos)
  // ---------------------------------------------------------------------------

  private updateEndless(delta: number): void {
    // Chefe do Círculo em campo: espera ele cair e começa a calmaria
    if (this.bossActive) {
      if (!this.ctx.isBossFightActive) {
        this.bossActive = false;
        this.calmMs = ENDLESS_SCHEDULE.calmAfterBossMs;
      }
      return;
    }
    if (this.calmMs > 0) {
      this.calmMs -= delta;
      if (this.calmMs <= 0) this.startNextCircle();
      return;
    }
    if (this.ctx.isBossFightActive) return;

    this.circleClockMs += delta;

    if (this.circle === 1) {
      for (const kind of endlessIntroKinds()) {
        if (!this.introduced.has(kind) && isUnlockedInEndless(1, this.circleClockMs, kind)) this.introduce(kind);
      }
    }

    if (!this.miniBossDone && this.circleClockMs >= ENDLESS_SCHEDULE.miniBossAtMs) {
      this.miniBossDone = true;
      this.spawnMiniBoss(endlessMiniBoss(this.circle), endlessMiniBossHpMultiplier(this.circle));
    }

    const theme = endlessTheme(this.circle);
    if (theme && !isQuietBeforeBoss(this.circleClockMs)) {
      this.formationTimer -= delta;
      if (this.formationTimer <= 0) {
        // Arena lotada: tenta de novo logo, senão o tema some no Infinito tardio
        this.formationTimer = this.spawnFormation(theme, true) ? FORMATION_BALANCE.endlessIntervalMs : FORMATION_BALANCE.retryWhenFullMs;
      }
    }

    const w = endlessBossWarnings(this.circleClockMs);
    if (w.warning && !this.bossWarned) {
      this.bossWarned = true;
      this.hud?.showCenterAnnouncement('A ROSALIN SE APROXIMA', `CHEGA EM ${Math.round(ENDLESS_SCHEDULE.bossWarningMs / 1000)} SEGUNDOS`, 3200);
      SoundManager.getInstance().playHordeEventAlarm();
    }
    if (w.final && !this.bossFinalWarned) {
      this.bossFinalWarned = true;
      this.hud?.showWaveAlert(`ROSALIN EM ${Math.round(ENDLESS_SCHEDULE.bossFinalWarningMs / 1000)} SEGUNDOS!`, 2600);
    }
    if (w.due) {
      this.bossActive = true;
      const scale = endlessBossMultipliers(this.circle);
      this.hud?.showWaveAlert(`ROSALIN CHEGOU! (CÍRCULO ${this.circle})`, 3500);
      this.log(`Chefe do Círculo ${this.circle} (vida x${scale.hp.toFixed(2)}, dano x${scale.damage.toFixed(2)})`);
      this.ctx.spawnEndlessBoss(scale);
    }
  }

  private startNextCircle(): void {
    this.circle++;
    this.circleClockMs = 0;
    this.miniBossDone = false;
    this.bossWarned = false;
    this.bossFinalWarned = false;
    this.formationTimer = FORMATION_BALANCE.firstDelayMs;
    const theme = endlessTheme(this.circle);
    const themeLabel = theme ? `TEMA: ${FORMATION_NAMES[theme]}` : '';
    this.hud?.showCenterAnnouncement(`CÍRCULO ${this.circle}`, themeLabel, 3200);
    this.log(`Início do Círculo ${this.circle} ${themeLabel}`);
  }

  // ---------------------------------------------------------------------------
  // Apresentações, minichefes e formações
  // ---------------------------------------------------------------------------

  /** Primeira vez de um inimigo na partida: aviso + grupinho só dele. */
  private introduce(kind: EnemyKind): void {
    this.introduced.add(kind);
    const count = FORMATION_BALANCE.intro[kind] ?? 0;
    if (count <= 0) return;
    this.hud?.showCenterAnnouncement(`NOVO: ${ENEMY_NAMES[kind]}`, ENEMY_HINTS[kind], 2800);
    this.log(`Apresentação: ${kind}`);
    if (!this.ctx.hasRoomForEnemies(count)) return;
    const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
    this.spawnGroup(kind, count, angle);
  }

  private spawnMiniBoss(id: MiniBossId, hpMultiplier: number): void {
    this.hud?.showWaveAlert(`MINICHEFE: ${MINIBOSS_NAMES[id]}!`, 4000);
    this.log(`Minichefe ${id} (vida x${hpMultiplier.toFixed(2)})`);
    if (id === 'ghoul') this.spawner.spawnGhoulDevourer(hpMultiplier);
    else this.spawner.spawnLyn(hpMultiplier);
  }

  private at(angle: number, baseDist: number, side: number = 0): { x: number; y: number } {
    const p = this.ctx.player;
    // Nasce fora da tela em qualquer zoom (a formação inteira recua junto)
    const dist = this.spawner.offscreenDist(angle, baseDist);
    const px = -Math.sin(angle);
    const py = Math.cos(angle);
    return { x: p.x + Math.cos(angle) * dist + px * side, y: p.y + Math.sin(angle) * dist + py * side };
  }

  /** `count` inimigos de um tipo, chegando do mesmo lado (`angle`). */
  private spawnGroup(kind: EnemyKind, count: number, angle: number): void {
    const d = FORMATION_BALANCE.distance;
    if (kind === 'bat') {
      this.spawner.spawnBloodBatFlock(count, angle);
      return;
    }
    for (let i = 0; i < count; i++) {
      const pos = this.at(angle, d + (i % 2) * 40, (i - (count - 1) / 2) * 60);
      if (kind === 'dog' || kind === 'elite') this.spawner.spawnScaledDogAt(pos.x, pos.y, kind === 'elite');
      else if (kind === 'mummy') this.spawner.spawnScaledMummyAt(pos.x, pos.y);
      else if (kind === 'slime') this.spawner.spawnSkullSlimeAt(pos.x, pos.y);
      else if (kind === 'archer') this.spawner.spawnArcherAt(pos.x, pos.y);
      else if (kind === 'colossus') this.spawner.spawnColossusFormation(angle, d);
    }
  }

  /** @returns false se a arena estava cheia demais (quem chamou tenta de novo em breve) */
  private spawnFormation(id: FormationId, announce: boolean): boolean {
    if (!this.ctx.hasRoomForEnemies(8)) return false;
    const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
    const d = FORMATION_BALANCE.distance;
    this.log(`Formação: ${id}`);
    if (announce) this.hud?.showWaveAlert(`${FORMATION_NAMES[id]}!`, 2400);

    switch (id) {
      case 'wall': {
        const f = FORMATION_BALANCE.wall;
        // Colossus lado a lado na frente; Arqueiras logo atrás deles, protegidas da perfuração
        for (let i = 0; i < f.colossi; i++) {
          const p = this.at(angle, d, (i - (f.colossi - 1) / 2) * f.sidePx * 1.6);
          this.spawner.spawnColossusAt(p.x, p.y);
        }
        for (let i = 0; i < f.archers; i++) {
          const p = this.at(angle, d + f.backPx, (i - (f.archers - 1) / 2) * f.sidePx);
          this.spawner.spawnArcherAt(p.x, p.y);
        }
        break;
      }
      case 'pack':
        this.spawnGroup('elite', FORMATION_BALANCE.pack.elites, angle);
        break;
      case 'hunt': {
        const n = FORMATION_BALANCE.hunt.archers;
        for (let i = 0; i < n; i++) {
          const p = this.at(angle + (i / n) * Math.PI * 2, d);
          this.spawner.spawnArcherAt(p.x, p.y);
        }
        break;
      }
      case 'swarm': {
        const f = FORMATION_BALANCE.swarm;
        for (let i = 0; i < f.flocks; i++) this.spawner.spawnBloodBatFlock(f.batsPerFlock, angle + (i / f.flocks) * Math.PI * 2);
        break;
      }
      case 'swamp':
        this.spawnGroup('mummy', FORMATION_BALANCE.swamp.mummies, angle);
        this.spawnGroup('slime', FORMATION_BALANCE.swamp.slimes, angle);
        break;
    }
    return true;
  }

  private log(message: string): void {
    DebugSessionLogger.getInstance().log('COMBAT', 'INFO', `[Cronograma] ${message}`);
  }
}
