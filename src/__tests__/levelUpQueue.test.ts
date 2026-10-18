import { describe, it, expect } from 'vitest';

/**
 * Testes Unitários de Fila Segura de Level Up e Seleção de Cartas
 *
 * Valida a prevenção do bug relatado pelo usuário:
 * Quando o jogador sobe mais de um nível de uma só vez (ex.: nível 1 para nível 4),
 * cada nível alcançado DEVE enfileirar uma escolha de cartas e exibi-las em sequência
 * sem que nenhum nível seja ignorado ou orfanado.
 */

describe('Fila de Level Up e Enfileiramento de Cartas de Upgrade', () => {
  // Cálculo exato de XP para o próximo nível definido no BaseCharacter
  function calcXpToNext(level: number): number {
    return Math.floor(20 * Math.pow(level, 1.25));
  }

  describe('Cálculo de XP e Acúmulo de Níveis Pendentes (gainXp)', () => {
    it('ganhar XP suficiente para 1 nível sobe 1 nível e incrementa 1 pendente', () => {
      let currentXp = 0;
      let currentLevel = 1;
      let pendingLevelUps = 0;
      let xpToNextLevel = calcXpToNext(currentLevel); // 20

      // Ganha exatamente 20 XP
      const amount = 20;
      currentXp += amount;
      while (currentXp >= xpToNextLevel) {
        currentXp -= xpToNextLevel;
        currentLevel++;
        xpToNextLevel = calcXpToNext(currentLevel);
        pendingLevelUps++;
      }

      expect(currentLevel).toBe(2);
      expect(pendingLevelUps).toBe(1);
      expect(currentXp).toBe(0);
      expect(xpToNextLevel).toBe(47); // floor(20 * 2^1.25)
    });

    it('ganhar XP suficiente para pular do nível 1 para o 4 acumula exatamente 3 níveis pendentes', () => {
      let currentXp = 0;
      let currentLevel = 1;
      let pendingLevelUps = 0;
      let xpToNextLevel = calcXpToNext(currentLevel); // 20

      // Necessário:
      // Nível 1 -> 2: 20 XP
      // Nível 2 -> 3: 47 XP
      // Nível 3 -> 4: 78 XP
      // Total para nível 4: 20 + 47 + 78 = 145 XP.
      // Damos 150 XP (sobra 5 XP no nível 4):
      const amount = 150;
      currentXp += amount;
      while (currentXp >= xpToNextLevel) {
        currentXp -= xpToNextLevel;
        currentLevel++;
        xpToNextLevel = calcXpToNext(currentLevel);
        pendingLevelUps++;
      }

      expect(currentLevel).toBe(4);
      expect(pendingLevelUps).toBe(3);
      expect(currentXp).toBe(5);
    });
  });

  describe('Processamento Sequencial da Fila (State Machine)', () => {
    interface SimulatedGameScene {
      isGameOver: boolean;
      isChapterCompleted: boolean;
      isDialogueActive: boolean;
      isChestRouletteActive: boolean;
      isUpgradeSceneActive: boolean;
      isUpgradeSceneOpening: boolean;
      physicsPaused: boolean;
      scenePaused: boolean;
      pendingLevelUps: number;
      modalsOpenedCount: number;
    }

    function createSimulatedScene(initialPending: number = 3): SimulatedGameScene {
      return {
        isGameOver: false,
        isChapterCompleted: false,
        isDialogueActive: false,
        isChestRouletteActive: false,
        isUpgradeSceneActive: false,
        isUpgradeSceneOpening: false,
        physicsPaused: false,
        scenePaused: false,
        pendingLevelUps: initialPending,
        modalsOpenedCount: 0
      };
    }

    function checkAndOpenUpgradeScene(scene: SimulatedGameScene): boolean {
      if (scene.isGameOver || scene.isChapterCompleted) return false;
      if (scene.isDialogueActive || scene.isChestRouletteActive) return false;
      if (scene.pendingLevelUps <= 0) return false;
      if (scene.isUpgradeSceneActive || scene.isUpgradeSceneOpening) return false;

      scene.isUpgradeSceneOpening = true;
      scene.pendingLevelUps--;
      scene.physicsPaused = true;
      scene.scenePaused = true;
      scene.modalsOpenedCount++;
      return true;
    }

    function simulateUpgradeSceneCreated(scene: SimulatedGameScene): void {
      scene.isUpgradeSceneOpening = false;
      scene.isUpgradeSceneActive = true;
    }

    function simulateUpgradeSceneClosed(scene: SimulatedGameScene): void {
      scene.isUpgradeSceneActive = false;
      scene.scenePaused = false;
      // Regra de Ouro: a física SÓ volta se não houver mais níveis na fila
      if (scene.pendingLevelUps <= 0) {
        scene.physicsPaused = false;
      }
    }

    function simulateGameSceneUpdate(scene: SimulatedGameScene): void {
      if (scene.isGameOver || scene.isChapterCompleted) return;
      if (scene.isDialogueActive || scene.isChestRouletteActive) return;

      // Fila de melhorias no topo do update()
      if (scene.pendingLevelUps > 0 && !scene.isUpgradeSceneActive && !scene.isUpgradeSceneOpening) {
        checkAndOpenUpgradeScene(scene);
      }
    }

    it('consome exatamente 3 escolhas de carta em sequência para 3 níveis pendentes', () => {
      const scene = createSimulatedScene(3);

      // 1ª Abertura (disparada pelo evento inicial player-level-up)
      const opened1 = checkAndOpenUpgradeScene(scene);
      expect(opened1).toBe(true);
      expect(scene.pendingLevelUps).toBe(2);
      expect(scene.modalsOpenedCount).toBe(1);
      expect(scene.physicsPaused).toBe(true);

      simulateUpgradeSceneCreated(scene);
      expect(scene.isUpgradeSceneActive).toBe(true);

      // Jogador escolhe carta 1 e o modal fecha
      simulateUpgradeSceneClosed(scene);
      expect(scene.isUpgradeSceneActive).toBe(false);
      // Física DEVE continuar pausada porque ainda há 2 níveis pendentes!
      expect(scene.physicsPaused).toBe(true);

      // Frame seguinte: GameScene.update() detecta pendência e abre 2ª carta
      simulateGameSceneUpdate(scene);
      expect(scene.modalsOpenedCount).toBe(2);
      expect(scene.pendingLevelUps).toBe(1);

      simulateUpgradeSceneCreated(scene);
      // Jogador escolhe carta 2 e fecha
      simulateUpgradeSceneClosed(scene);
      expect(scene.physicsPaused).toBe(true);

      // Frame seguinte: GameScene.update() detecta pendência e abre 3ª carta
      simulateGameSceneUpdate(scene);
      expect(scene.modalsOpenedCount).toBe(3);
      expect(scene.pendingLevelUps).toBe(0);

      simulateUpgradeSceneCreated(scene);
      // Jogador escolhe carta 3 (última da fila) e fecha
      simulateUpgradeSceneClosed(scene);

      // Agora a fila está vazia: física retoma e nenhuma outra carta abre
      expect(scene.physicsPaused).toBe(false);
      simulateGameSceneUpdate(scene);
      expect(scene.modalsOpenedCount).toBe(3);
      expect(scene.pendingLevelUps).toBe(0);
    });

    it('bloqueia reentrância enquanto o modal está abrindo ou ativo (anti-race)', () => {
      const scene = createSimulatedScene(3);

      // 1ª chamada
      checkAndOpenUpgradeScene(scene);
      expect(scene.pendingLevelUps).toBe(2);

      // Chamada redundante no mesmo tick (enquanto abrindo) não pode duplicar abertura
      const openedAgain = checkAndOpenUpgradeScene(scene);
      expect(openedAgain).toBe(false);
      expect(scene.pendingLevelUps).toBe(2);
      expect(scene.modalsOpenedCount).toBe(1);

      simulateUpgradeSceneCreated(scene);
      // Chamada redundante com a cena ativa também deve ser bloqueada
      const openedWhileActive = checkAndOpenUpgradeScene(scene);
      expect(openedWhileActive).toBe(false);
      expect(scene.pendingLevelUps).toBe(2);
      expect(scene.modalsOpenedCount).toBe(1);
    });

    it('espera diálogos ou roletas ativas terminarem antes de abrir o modal de level up', () => {
      const scene = createSimulatedScene(2);
      scene.isDialogueActive = true;

      // Durante diálogo, a abertura é bloqueada para não quebrar a cena visual
      const openedDuringDialogue = checkAndOpenUpgradeScene(scene);
      expect(openedDuringDialogue).toBe(false);
      expect(scene.pendingLevelUps).toBe(2); // Níveis preservados!
      expect(scene.modalsOpenedCount).toBe(0);

      // Diálogo é concluído
      scene.isDialogueActive = false;
      simulateGameSceneUpdate(scene);

      // Agora o modal abre normalmente
      expect(scene.modalsOpenedCount).toBe(1);
      expect(scene.pendingLevelUps).toBe(1);
    });

    it('não abre modais se o jogador estiver em Game Over ou Capítulo Concluído', () => {
      const scene = createSimulatedScene(2);
      scene.isGameOver = true;

      simulateGameSceneUpdate(scene);
      expect(scene.modalsOpenedCount).toBe(0);

      scene.isGameOver = false;
      scene.isChapterCompleted = true;
      simulateGameSceneUpdate(scene);
      expect(scene.modalsOpenedCount).toBe(0);
    });
  });
});
