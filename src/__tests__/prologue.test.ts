import { describe, expect, it } from 'vitest';
import {
  CORRIDOR_IMAGE_HEIGHT,
  CORRIDOR_SEGMENTS,
  PROLOGUE_EXIT_ZONE,
  PROLOGUE_NPCS,
  PROLOGUE_START,
} from '../config/prologueData';
import { PROLOGUE_NPC_TALKS, STORY_ARRIVAL_DIALOGUE } from '../config/dialogues';
import {
  corridorWalls,
  corridorWidth,
  layoutCorridor,
  nearestInRange,
  nextTalkIndex,
  rectContains,
  segmentAt,
  shouldPlayStoryArrival,
} from '../systems/prologueLogic';

describe('corredor do prólogo: montagem', () => {
  it('coloca os pedaços lado a lado sem buraco', () => {
    const placed = layoutCorridor(CORRIDOR_SEGMENTS);
    expect(placed[0].x0).toBe(0);
    for (let i = 1; i < placed.length; i++) {
      expect(placed[i].x0).toBe(placed[i - 1].x0 + placed[i - 1].width);
    }
    expect(corridorWidth(CORRIDOR_SEGMENTS)).toBe(placed[placed.length - 1].x0 + placed[placed.length - 1].width);
  });

  it('acha o pedaço pelo x (e o último além do fim)', () => {
    const placed = layoutCorridor(CORRIDOR_SEGMENTS);
    expect(segmentAt(placed, 10).id).toBe('inicio');
    expect(segmentAt(placed, placed[1].x0 + 1).id).toBe(placed[1].id);
    expect(segmentAt(placed, 1e9).id).toBe('fim');
  });

  it('cada pedaço deixa uma faixa de chão andável dentro da imagem', () => {
    for (const s of CORRIDOR_SEGMENTS) {
      expect(s.walkTop).toBeGreaterThan(0);
      expect(s.walkBottom).toBeLessThan(CORRIDOR_IMAGE_HEIGHT);
      // Espaço para a Nixy passar (pés de ~16 px de altura e folga)
      expect(s.walkBottom - s.walkTop).toBeGreaterThanOrEqual(80);
    }
  });

  it('as paredes fecham o corredor: em cima, embaixo e nas duas pontas', () => {
    const placed = layoutCorridor(CORRIDOR_SEGMENTS);
    const walls = corridorWalls(placed, 80, 720);
    const blockers = CORRIDOR_SEGMENTS.reduce((n, s) => n + s.blockers.length, 0);
    expect(walls).toHaveLength(placed.length * 2 + blockers + 2);
    // Parede do fundo do primeiro pedaço termina exatamente no walkTop
    expect(walls[0]).toEqual({ x: 0, y: 0, w: placed[0].width, h: 80 + placed[0].walkTop });
    // Ponta esquerda antes do x = 0 e ponta direita depois do fim
    const total = corridorWidth(CORRIDOR_SEGMENTS);
    expect(walls.some((w) => w.x + w.w === 0)).toBe(true);
    expect(walls.some((w) => w.x === total)).toBe(true);
  });

  it('a Nixy começa no chão, longe dos móveis', () => {
    const start = CORRIDOR_SEGMENTS[0];
    expect(PROLOGUE_START.y).toBeGreaterThan(start.walkTop);
    expect(PROLOGUE_START.y).toBeLessThan(start.walkBottom);
    for (const b of start.blockers) expect(rectContains(b, PROLOGUE_START.x, PROLOGUE_START.y)).toBe(false);
  });

  it('a porta de saída fica no chão do último pedaço (dá para pisar nela)', () => {
    const end = CORRIDOR_SEGMENTS[CORRIDOR_SEGMENTS.length - 1];
    expect(PROLOGUE_EXIT_ZONE.x + PROLOGUE_EXIT_ZONE.w).toBeLessThanOrEqual(end.width);
    // A zona começa na parede e desce para dentro do chão
    expect(PROLOGUE_EXIT_ZONE.y + PROLOGUE_EXIT_ZONE.h).toBeGreaterThan(end.walkTop + 16);
  });
});

describe('funcionários do corredor', () => {
  it('cada um está num pedaço que existe, em cima do chão', () => {
    for (const npc of PROLOGUE_NPCS) {
      const seg = CORRIDOR_SEGMENTS.find((s) => s.id === npc.segment);
      expect(seg, npc.id).toBeDefined();
      if (!seg) continue;
      expect(npc.y).toBeGreaterThanOrEqual(seg.walkTop);
      expect(npc.y).toBeLessThanOrEqual(seg.walkBottom);
      expect(npc.x).toBeGreaterThan(0);
      expect(npc.x).toBeLessThan(seg.width);
    }
  });

  it('cada um tem pelo menos uma conversa, e toda conversa tem fala', () => {
    for (const npc of PROLOGUE_NPCS) {
      const talks = PROLOGUE_NPC_TALKS[npc.id];
      expect(talks?.length, npc.id).toBeGreaterThan(0);
      for (const talk of talks) {
        expect(talk.length).toBeGreaterThan(0);
        for (const line of talk) expect(line.text.trim()).not.toBe('');
      }
    }
  });

  it('o mais perto dentro do raio é quem responde', () => {
    const people = [{ x: 0, y: 0, id: 'a' }, { x: 50, y: 0, id: 'b' }, { x: 300, y: 0, id: 'c' }];
    expect(nearestInRange(people, 40, 0, 100)?.id).toBe('b');
    expect(nearestInRange(people, 200, 0, 50)).toBeNull();
  });

  it('as conversas rodam sem repetir a mesma em seguida', () => {
    expect(nextTalkIndex(0, undefined, 0.5)).toBe(-1);
    expect(nextTalkIndex(3, undefined, 0.99)).toBe(2);
    expect(nextTalkIndex(3, 2, 0)).toBe(0);
    expect(nextTalkIndex(3, 0, 0.7)).toBe(1);
    expect(nextTalkIndex(1, 0, 0.7)).toBe(0);
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
