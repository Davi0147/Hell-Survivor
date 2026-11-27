import { describe, expect, it } from 'vitest';
import {
  CORRIDOR_ROOMS,
  PROLOGUE_EXIT_ZONE,
  PROLOGUE_NPCS,
  PROLOGUE_PORTRAITS,
  PROLOGUE_START,
  ROOM_CONTENT,
  ROOM_EDGE,
  ROOM_IMAGE,
} from '../config/prologueData';
import { PROLOGUE_GUARD_STOP_LINE, PROLOGUE_NPC_DIALOGUES, STORY_ARRIVAL_DIALOGUE } from '../config/dialogues';
import {
  clampToWalkBand,
  nearestInRange,
  rectContains,
  roomEntryX,
  roomExitAt,
  roomScale,
  roomWalls,
  roomsToKeep,
  scaleRect,
  shouldPlayStoryArrival,
} from '../systems/prologueLogic';

describe('salas do corredor', () => {
  it('a sala sempre cobre a tela (altura e largura), em 16:9 e no celular largo', () => {
    for (const [w, h] of [[1280, 720], [1558, 720], [1680, 720]]) {
      const s = roomScale(w, h);
      expect((ROOM_CONTENT.bottom - ROOM_CONTENT.top) * s).toBeGreaterThanOrEqual(h - 0.001);
      expect(ROOM_IMAGE.width * s).toBeGreaterThanOrEqual(w - 0.001);
    }
  });

  it('cada sala deixa uma faixa de chão andável dentro da imagem', () => {
    for (const r of CORRIDOR_ROOMS) {
      expect(r.walkTop).toBeGreaterThan(ROOM_CONTENT.top);
      expect(r.walkBottom).toBeLessThan(ROOM_CONTENT.bottom);
      expect(r.walkBottom - r.walkTop).toBeGreaterThanOrEqual(160);
    }
  });

  it('as paredes fecham a sala: fundo, frente, móveis e as duas pontas', () => {
    const room = CORRIDOR_ROOMS[0];
    const walls = roomWalls(room);
    expect(walls).toHaveLength(4 + room.blockers.length);
    expect(walls[0]).toEqual({ x: 0, y: 0, w: ROOM_IMAGE.width, h: room.walkTop });
    expect(walls[1].y).toBe(room.walkBottom);
    expect(walls.some((w) => w.x + w.w === 0)).toBe(true);
    expect(walls.some((w) => w.x === ROOM_IMAGE.width)).toBe(true);
  });

  it('a ponta leva à sala vizinha, menos antes da primeira e depois da última', () => {
    const t = ROOM_EDGE.trigger;
    expect(roomExitAt(10, t, true, true)).toBe('prev');
    expect(roomExitAt(10, t, false, true)).toBeNull();
    expect(roomExitAt(ROOM_IMAGE.width - 10, t, true, true)).toBe('next');
    expect(roomExitAt(ROOM_IMAGE.width - 10, t, true, false)).toBeNull();
    expect(roomExitAt(ROOM_IMAGE.width / 2, t, true, true)).toBeNull();
  });

  it('ao entrar, ela aparece longe da faixa de troca (não volta sem querer)', () => {
    const t = ROOM_EDGE.trigger;
    const fromLeft = roomEntryX('prev', ROOM_EDGE.entry);
    const fromRight = roomEntryX('next', ROOM_EDGE.entry);
    expect(roomExitAt(fromLeft, t, true, true)).toBeNull();
    expect(roomExitAt(fromRight, t, true, true)).toBeNull();
    expect(fromLeft).toBeLessThan(fromRight);
  });

  it('os pés entram na faixa andável da sala nova, com o corpo inteiro fora da parede', () => {
    const room = CORRIDOR_ROOMS[1];
    // Pés de 32 px de altura: a base fica pelo menos 32 abaixo da parede do fundo
    expect(clampToWalkBand(room, 0, 32, 10)).toBe(room.walkTop + 42);
    expect(clampToWalkBand(room, 5000, 32, 10)).toBe(room.walkBottom - 10);
    expect(clampToWalkBand(room, 800, 32, 10)).toBe(800);
    // Caso do defeito: vinha colada no alto da sala anterior (acima do walkTop desta)
    expect(clampToWalkBand(room, room.walkTop + 24, 32) - 32).toBeGreaterThanOrEqual(room.walkTop);
  });

  it('guarda só a sala atual e as vizinhas na memória', () => {
    expect(roomsToKeep(0, 5)).toEqual([0, 1]);
    expect(roomsToKeep(2, 5)).toEqual([1, 2, 3]);
    expect(roomsToKeep(4, 5)).toEqual([3, 4]);
  });

  it('escala retângulos da arte para o mundo', () => {
    expect(scaleRect({ x: 10, y: 20, w: 30, h: 40 }, 0.5, 100)).toEqual({ x: 105, y: 10, w: 15, h: 20 });
  });

  it('a Nixy começa no chão, longe dos móveis', () => {
    const start = CORRIDOR_ROOMS[0];
    expect(PROLOGUE_START.y).toBeGreaterThan(start.walkTop);
    expect(PROLOGUE_START.y).toBeLessThan(start.walkBottom);
    for (const b of start.blockers) expect(rectContains(b, PROLOGUE_START.x, PROLOGUE_START.y)).toBe(false);
  });

  it('a porta de saída fica no chão da última sala, longe da ponta', () => {
    const end = CORRIDOR_ROOMS[CORRIDOR_ROOMS.length - 1];
    expect(PROLOGUE_EXIT_ZONE.x + PROLOGUE_EXIT_ZONE.w).toBeLessThan(ROOM_IMAGE.width - ROOM_EDGE.trigger);
    expect(PROLOGUE_EXIT_ZONE.y + PROLOGUE_EXIT_ZONE.h).toBeGreaterThan(end.walkTop + 32);
  });
});

describe('funcionários do corredor', () => {
  it('cada um está numa sala que existe, em cima do chão, fora das pontas', () => {
    for (const npc of PROLOGUE_NPCS) {
      const room = CORRIDOR_ROOMS.find((r) => r.id === npc.room);
      expect(room, npc.id).toBeDefined();
      if (!room) continue;
      expect(npc.y).toBeGreaterThanOrEqual(room.walkTop);
      expect(npc.y).toBeLessThanOrEqual(room.walkBottom);
      expect(npc.x).toBeGreaterThan(ROOM_EDGE.entry);
      expect(npc.x).toBeLessThan(ROOM_IMAGE.width - ROOM_EDGE.entry);
    }
  });

  it('cada um tem conversa, e todo retrato usado existe na lista de retratos', () => {
    const known = new Set<string>([...PROLOGUE_PORTRAITS, 'chat-nixy']);
    for (const npc of PROLOGUE_NPCS) {
      const lines = PROLOGUE_NPC_DIALOGUES[npc.id];
      expect(lines?.length, npc.id).toBeGreaterThan(0);
      for (const line of lines) {
        expect(line.text.trim()).not.toBe('');
        if (line.duo) for (const p of line.duo.portraits) expect(known.has(p), p).toBe(true);
        else expect(known.has(line.portraitKey), line.portraitKey).toBe(true);
      }
    }
  });

  it('Lina e Gina: só acende quem fala (uma ou as duas)', () => {
    const lines = PROLOGUE_NPC_DIALOGUES['lina-gina'].filter((l) => l.duo);
    expect(lines.length).toBeGreaterThan(0);
    for (const l of lines) {
      const lit = l.duo?.speaking ?? [];
      expect(lit.length).toBeGreaterThanOrEqual(1);
      expect(lit.every((i) => i === 0 || i === 1)).toBe(true);
      if (l.speakerName === 'Lina') expect(lit).toEqual([0]);
      if (l.speakerName === 'Gina') expect(lit).toEqual([1]);
    }
  });

  it('só um segurança segura a porta, e ele fica na última sala', () => {
    const guards = PROLOGUE_NPCS.filter((n) => n.guardsExit);
    expect(guards).toHaveLength(1);
    expect(guards[0].room).toBe(CORRIDOR_ROOMS[CORRIDOR_ROOMS.length - 1].id);
    expect(PROLOGUE_GUARD_STOP_LINE.speaker).toBe(guards[0].id);
  });

  it('o mais perto dentro do raio é quem responde', () => {
    const people = [{ x: 0, y: 0, id: 'a' }, { x: 50, y: 0, id: 'b' }, { x: 300, y: 0, id: 'c' }];
    expect(nearestInRange(people, 40, 0, 100)?.id).toBe('b');
    expect(nearestInRange(people, 200, 0, 50)).toBeNull();
  });

});

describe('chegada na arena', () => {
  it('só no Capítulo I do Modo História, e nunca ao ressurgir', () => {
    expect(shouldPlayStoryArrival({ mode: 'story', chapter: 1, isRevival: false })).toBe(true);
    expect(shouldPlayStoryArrival({ mode: 'story', chapter: 1, isRevival: true })).toBe(false);
    expect(shouldPlayStoryArrival({ mode: 'story', chapter: 2, isRevival: false })).toBe(false);
    expect(shouldPlayStoryArrival({ mode: 'endless', chapter: 1, isRevival: false })).toBe(false);
    expect(shouldPlayStoryArrival({ mode: 'sandbox', chapter: 1, isRevival: false })).toBe(false);
  });

  it('o diálogo com o cão é só da Nixy (o cão não tem retrato)', () => {
    expect(STORY_ARRIVAL_DIALOGUE.length).toBeGreaterThan(0);
    for (const line of STORY_ARRIVAL_DIALOGUE) expect(line.speaker).toBe('nixy');
  });
});
