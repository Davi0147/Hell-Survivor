import { describe, it, expect } from 'vitest';
import { ComboTracker } from '../systems/ComboTracker';
import { getEligibleHordeEvents } from '../systems/hordeEventRules';
import { COMBO_BALANCE, HORDE_EVENT_BALANCE } from '../config/balance';

describe('ComboTracker (sequência de abates e Frenesi)', () => {
  it('conta abates seguidos e guarda o maior combo', () => {
    const combo = new ComboTracker();
    for (let i = 0; i < 7; i++) combo.registerKill();
    expect(combo.combo).toBe(7);
    expect(combo.maxCombo).toBe(7);
  });

  it('zera quando a janela passa sem abate, mas preserva o recorde', () => {
    const combo = new ComboTracker();
    for (let i = 0; i < 5; i++) combo.registerKill();
    const before = combo.update(COMBO_BALANCE.windowMs - 1);
    expect(before.comboBroken).toBe(0);
    expect(combo.combo).toBe(5);

    const after = combo.update(2);
    expect(after.comboBroken).toBe(5);
    expect(combo.combo).toBe(0);
    expect(combo.maxCombo).toBe(5);
  });

  it('cada abate renova a janela inteira', () => {
    const combo = new ComboTracker();
    combo.registerKill();
    combo.update(COMBO_BALANCE.windowMs - 100);
    combo.registerKill();
    combo.update(COMBO_BALANCE.windowMs - 100);
    expect(combo.combo).toBe(2);
    expect(combo.windowRatio).toBeGreaterThan(0);
  });

  it('avisa o degrau só no abate exato e aplica o bônus de XP dele', () => {
    const combo = new ComboTracker();
    const first = COMBO_BALANCE.tiers[0];
    let reached = 0;
    for (let i = 0; i < first.at + 3; i++) {
      if (combo.registerKill().tierReached) reached++;
    }
    expect(reached).toBe(1);
    expect(combo.currentTier?.label).toBe(first.label);
    expect(combo.xpBonus).toBe(first.xpBonus);
  });

  it('abaixo do primeiro degrau não há bônus de XP', () => {
    const combo = new ComboTracker();
    combo.registerKill();
    expect(combo.currentTier).toBeUndefined();
    expect(combo.xpBonus).toBe(0);
  });

  it('dispara o Frenesi a cada múltiplo de frenzyEvery e ele acaba sozinho', () => {
    const combo = new ComboTracker();
    let triggers = 0;
    for (let i = 0; i < COMBO_BALANCE.frenzyEvery * 2; i++) {
      if (combo.registerKill().frenzyTriggered) triggers++;
    }
    expect(triggers).toBe(2);
    expect(combo.isFrenzyActive).toBe(true);

    const ended = combo.update(COMBO_BALANCE.frenzyDurationMs + 1);
    expect(ended.frenzyEnded).toBe(true);
    expect(combo.isFrenzyActive).toBe(false);
  });

  it('Sede de Sangue aumenta a janela do combo e a duração do Frenesi', () => {
    const combo = new ComboTracker();
    combo.windowBonusMs = 900;
    combo.frenzyBonusMs = 2000;
    expect(combo.windowMs).toBe(COMBO_BALANCE.windowMs + 900);
    expect(combo.frenzyDurationMs).toBe(COMBO_BALANCE.frenzyDurationMs + 2000);

    combo.registerKill();
    combo.update(COMBO_BALANCE.windowMs + 100);
    expect(combo.combo).toBe(1);
  });
});

describe('getEligibleHordeEvents (o que o diretor pode sortear)', () => {
  it('no começo do Capítulo 1 só há Cerco e Ladrão', () => {
    expect(getEligibleHordeEvents('story', 1, 0.9, false, false)).toEqual(['siege', 'thief']);
  });

  it('Capítulo 1 nunca recebe Matilha Alfa nem Lua de Sangue', () => {
    const events = getEligibleHordeEvents('story', 1, 20, false, false);
    expect(events).not.toContain('elite_pack');
    expect(events).not.toContain('blood_moon');
    expect(events).toContain('ambush');
  });

  it('Capítulo 2 libera Matilha Alfa e Lua de Sangue depois do tempo mínimo', () => {
    const early = getEligibleHordeEvents('story', 2, 1.2, false, false);
    expect(early).not.toContain('elite_pack');
    expect(early).not.toContain('blood_moon');

    const late = getEligibleHordeEvents('story', 2, HORDE_EVENT_BALANCE.bloodMoon.minMinutes, false, false);
    expect(late).toContain('elite_pack');
    expect(late).toContain('blood_moon');
  });

  it('não repete Ladrão vivo nem Lua de Sangue em andamento', () => {
    const events = getEligibleHordeEvents('endless', 1, 10, true, true);
    expect(events).not.toContain('thief');
    expect(events).not.toContain('blood_moon');
    expect(events).toContain('siege');
  });
});
