import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('phaser', () => ({ default: { Math: { FloatBetween: () => 0 } } }));
vi.mock('../systems/SoundManager', () => ({ SoundManager: { getInstance: () => ({ playHordeEventAlarm: vi.fn() }) } }));
vi.mock('../systems/DebugSessionLogger', () => ({ DebugSessionLogger: { getInstance: () => ({ log: vi.fn() }) } }));

import { EncounterDirector, type IEncounterContext } from '../systems/EncounterDirector';
import type { EnemySpawnSystem } from '../systems/EnemySpawnSystem';
import { ENDLESS_SCHEDULE, FORMATION_BALANCE, STORY_SCHEDULE } from '../config/balance';

const FRAME = 100;

function makeWorld(gameMode: 'story' | 'endless') {
  const hud = { showWaveAlert: vi.fn(), showCenterAnnouncement: vi.fn() };
  const scene = { scene: { get: () => hud } };
  const spawner = {
    spawnBloodBatFlock: vi.fn(),
    spawnScaledDogAt: vi.fn(),
    spawnScaledMummyAt: vi.fn(),
    spawnSkullSlimeAt: vi.fn(),
    spawnArcherAt: vi.fn(),
    spawnColossusAt: vi.fn(),
    spawnColossusFormation: vi.fn(),
    offscreenDist: (_angle: number, dist: number) => dist,
    spawnGhoulDevourer: vi.fn(),
    spawnLyn: vi.fn(),
  };
  const ctx = {
    player: { x: 0, y: 0 },
    gameMode,
    currentChapter: 1,
    chapterPurifiedSouls: 0,
    chapterTargetSouls: 100,
    isBossFightActive: false,
    isHordeSpawningPaused: false,
    isGameOver: false,
    spawnEndlessBoss: vi.fn(() => {
      ctx.isBossFightActive = true;
    }),
    hasRoomForEnemies: () => true,
  };
  const director = new EncounterDirector(
    scene as unknown as Phaser.Scene,
    ctx as unknown as IEncounterContext,
    spawner as unknown as EnemySpawnSystem
  );
  const run = (ms: number) => {
    for (let t = 0; t < ms; t += FRAME) director.update(FRAME);
  };
  return { director, ctx, spawner, hud, run };
}

describe('EncounterDirector — Infinito', () => {
  let w: ReturnType<typeof makeWorld>;
  beforeEach(() => {
    w = makeWorld('endless');
  });

  it('começa só com cães e apresenta a Arqueira no segundo dela', () => {
    expect(w.director.isUnlocked('dog')).toBe(true);
    expect(w.director.isUnlocked('archer')).toBe(false);
    w.run(ENDLESS_SCHEDULE.firstCircleUnlocksSec.archer * 1000 + FRAME);
    expect(w.director.isUnlocked('archer')).toBe(true);
    expect(w.spawner.spawnArcherAt).toHaveBeenCalledTimes(FORMATION_BALANCE.intro.archer!);
    expect(w.hud.showCenterAnnouncement).toHaveBeenCalledWith(expect.stringContaining('ARQUEIRAS'), expect.any(String), expect.any(Number));
  });

  it('Círculo 1: Ghoul no meio, avisos e chefe no fim; tudo apresentado antes', () => {
    w.run(ENDLESS_SCHEDULE.miniBossAtMs + FRAME);
    expect(w.spawner.spawnGhoulDevourer).toHaveBeenCalledTimes(1);
    expect(w.spawner.spawnLyn).not.toHaveBeenCalled();

    w.run(ENDLESS_SCHEDULE.circleMs - ENDLESS_SCHEDULE.miniBossAtMs);
    expect(w.ctx.spawnEndlessBoss).toHaveBeenCalledTimes(1);
    expect(w.ctx.spawnEndlessBoss).toHaveBeenCalledWith({ hp: ENDLESS_SCHEDULE.boss.hpBase, damage: ENDLESS_SCHEDULE.boss.damageBase });
    expect(w.spawner.spawnColossusFormation).toHaveBeenCalled();
    expect(w.spawner.spawnSkullSlimeAt).toHaveBeenCalled();
  });

  it('eventos de horda ficam quietos antes do chefe e durante ele', () => {
    w.run(ENDLESS_SCHEDULE.circleMs - ENDLESS_SCHEDULE.eventQuietBeforeBossMs - 1000);
    expect(w.director.isEventQuiet).toBe(false);
    w.run(2000);
    expect(w.director.isEventQuiet).toBe(true);
  });

  it('o relógio do Círculo para durante o chefe: nada de minichefe no meio da luta', () => {
    w.run(ENDLESS_SCHEDULE.circleMs + FRAME);
    expect(w.ctx.isBossFightActive).toBe(true);
    w.run(ENDLESS_SCHEDULE.circleMs); // luta muito longa
    expect(w.spawner.spawnLyn).not.toHaveBeenCalled();
    expect(w.ctx.spawnEndlessBoss).toHaveBeenCalledTimes(1);
  });

  it('chefe derrotado: calmaria sem hordas, depois Círculo 2 com tema, Lyn e chefe mais forte', () => {
    w.run(ENDLESS_SCHEDULE.circleMs + FRAME);
    w.ctx.isBossFightActive = false; // chefe caiu
    w.run(FRAME);
    expect(w.director.isCalm).toBe(true);
    w.run(ENDLESS_SCHEDULE.calmAfterBossMs + FRAME);
    expect(w.director.isCalm).toBe(false);
    expect(w.director.currentCircle).toBe(2);
    expect(w.hud.showCenterAnnouncement).toHaveBeenCalledWith('CÍRCULO 2', expect.stringContaining('MURALHA'), expect.any(Number));

    w.run(FORMATION_BALANCE.firstDelayMs + FRAME);
    expect(w.spawner.spawnColossusAt).toHaveBeenCalled(); // Muralha

    w.run(ENDLESS_SCHEDULE.miniBossAtMs);
    expect(w.spawner.spawnLyn).toHaveBeenCalledTimes(1);
    expect(w.spawner.spawnLyn.mock.calls[0][0]).toBeGreaterThan(1);

    w.run(ENDLESS_SCHEDULE.circleMs);
    expect(w.ctx.spawnEndlessBoss).toHaveBeenCalledTimes(2);
    const second = w.ctx.spawnEndlessBoss.mock.calls[1] as unknown as [{ hp: number; damage: number }];
    expect(second[0].hp).toBeGreaterThan(ENDLESS_SCHEDULE.boss.hpBase);
  });

  it('arena lotada: o tema espera e entra assim que abre espaço (não some por 35 s)', () => {
    w.run(ENDLESS_SCHEDULE.circleMs + FRAME);
    w.ctx.isBossFightActive = false;
    w.run(ENDLESS_SCHEDULE.calmAfterBossMs + FRAME * 2);
    expect(w.director.currentCircle).toBe(2);

    let room = false;
    w.ctx.hasRoomForEnemies = () => room;
    w.run(FORMATION_BALANCE.firstDelayMs + FRAME);
    expect(w.spawner.spawnColossusAt).not.toHaveBeenCalled();

    room = true;
    w.run(FORMATION_BALANCE.retryWhenFullMs + FRAME);
    expect(w.spawner.spawnColossusAt).toHaveBeenCalled();
  });

  it('cada inimigo é apresentado uma vez só', () => {
    w.run(ENDLESS_SCHEDULE.circleMs - FRAME);
    const archersAfterCircle = w.spawner.spawnArcherAt.mock.calls.length;
    expect(archersAfterCircle).toBe(FORMATION_BALANCE.intro.archer!);
  });
});

describe('EncounterDirector — História', () => {
  it('Capítulo 1: apresenta pela barra e solta a Lyn no meio, uma vez', () => {
    const w = makeWorld('story');
    const u = STORY_SCHEDULE[1].unlocks;
    w.ctx.chapterPurifiedSouls = u.bat! * 100;
    w.run(FRAME);
    expect(w.spawner.spawnBloodBatFlock).toHaveBeenCalledTimes(1);

    w.ctx.chapterPurifiedSouls = STORY_SCHEDULE[1].miniBoss!.atRatio * 100;
    w.run(FRAME * 5);
    expect(w.spawner.spawnLyn).toHaveBeenCalledTimes(1);
    expect(w.spawner.spawnGhoulDevourer).not.toHaveBeenCalled();
    expect(w.spawner.spawnArcherAt).not.toHaveBeenCalled();
    expect(w.ctx.spawnEndlessBoss).not.toHaveBeenCalled();
  });

  it('Capítulo 2: Ghoul no meio e a Muralha aparece depois do Colossus', () => {
    const w = makeWorld('story');
    w.ctx.currentChapter = 2;
    w.ctx.chapterPurifiedSouls = 60;
    w.run(FORMATION_BALANCE.firstDelayMs + FORMATION_BALANCE.storyIntervalMs + FRAME);
    expect(w.spawner.spawnGhoulDevourer).toHaveBeenCalledTimes(1);
    expect(w.spawner.spawnColossusAt).toHaveBeenCalled();
    expect(w.spawner.spawnScaledDogAt).toHaveBeenCalledWith(expect.any(Number), expect.any(Number), true); // Matilha
  });

  it('com o altar desperto (fim do capítulo), nada de novidade', () => {
    const w = makeWorld('story');
    w.ctx.isHordeSpawningPaused = true;
    w.ctx.chapterPurifiedSouls = 100;
    w.run(FRAME * 10);
    expect(w.spawner.spawnGhoulDevourer).not.toHaveBeenCalled();
    expect(w.hud.showCenterAnnouncement).not.toHaveBeenCalled();
  });
});
