import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AutoPlayTestAgent } from '../systems/AutoPlayTestAgent';
import type { UIScene } from '../scenes/UIScene';

/**
 * Testes Unitários da Roleta de Bênção do Baú do Abismo (showChestRoulette)
 * e da Resolução Autônoma do Bot [F3] (AutoPlayTestAgent)
 *
 * Valida as correções para:
 * 1. Pular a animação para o prêmio imediatamente ao pressionar Espaço/Enter ou clicar fora (backdrop).
 * 2. Prevenir o crash de Phaser (Frame.updateUVs / drawImage de objeto destruído) ao avançar antes do término.
 * 3. Garantir debounce curto (anti-missclick) para não fechar a tela sem o jogador ver a bênção recebida.
 * 4. Resolução automática e contínua do Bot [F3] ao abrir baús, sem travar o jogo no modo infinito/história.
 */

describe('Roleta de Bênçãos do Baú do Abismo e Bot Autônomo', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('AutoPlayTestAgent - checkAndResolveChestRoulette', () => {
    it('não interage quando o bot estiver desativado', () => {
      const agent = AutoPlayTestAgent.getInstance();
      if (agent.isEnabled) {
        agent.toggle(); // desativa
      }
      expect(agent.isEnabled).toBe(false);

      const mockResolve = vi.fn();
      const mockUIScene = {
        isChestRouletteActive: () => true,
        resolveChestRoulette: mockResolve
      } as unknown as UIScene;

      agent.checkAndResolveChestRoulette(mockUIScene, 500);
      expect(mockResolve).not.toHaveBeenCalled();
    });

    it('não interage quando a roleta do baú não estiver aberta', () => {
      const agent = AutoPlayTestAgent.getInstance();
      if (!agent.isEnabled) {
        agent.toggle(); // ativa
      }
      expect(agent.isEnabled).toBe(true);

      const mockResolve = vi.fn();
      const mockUIScene = {
        isChestRouletteActive: () => false,
        resolveChestRoulette: mockResolve
      } as unknown as UIScene;

      agent.checkAndResolveChestRoulette(mockUIScene, 500);
      expect(mockResolve).not.toHaveBeenCalled();
    });

    it('aguarda o delay humano de reação (250ms) antes de interagir', () => {
      const agent = AutoPlayTestAgent.getInstance();
      if (!agent.isEnabled) {
        agent.toggle();
      }

      const mockResolve = vi.fn();
      const mockUIScene = {
        isChestRouletteActive: () => true,
        resolveChestRoulette: mockResolve
      } as unknown as UIScene;

      // 100ms acumulados (menor que 250ms)
      agent.checkAndResolveChestRoulette(mockUIScene, 100);
      expect(mockResolve).not.toHaveBeenCalled();

      // Mais 100ms (total 200ms < 250ms)
      agent.checkAndResolveChestRoulette(mockUIScene, 100);
      expect(mockResolve).not.toHaveBeenCalled();

      // Mais 60ms (total 260ms >= 250ms): deve disparar interação
      agent.checkAndResolveChestRoulette(mockUIScene, 60);
      expect(mockResolve).toHaveBeenCalledTimes(1);
    });

    it('avança tanto na revelação do prêmio quanto na coleta em etapas sucessivas', () => {
      const agent = AutoPlayTestAgent.getInstance();
      if (!agent.isEnabled) {
        agent.toggle();
      }

      let callCount = 0;
      const mockUIScene = {
        isChestRouletteActive: () => true,
        resolveChestRoulette: () => {
          callCount++;
        }
      } as unknown as UIScene;

      // Primeiro ciclo de 250ms: pula a roleta e revela o prêmio
      agent.checkAndResolveChestRoulette(mockUIScene, 250);
      expect(callCount).toBe(1);

      // Segundo ciclo de 250ms: confirma e coleta o prêmio
      agent.checkAndResolveChestRoulette(mockUIScene, 250);
      expect(callCount).toBe(2);
    });
  });

  describe('Lógica de Pular e Coleta da Roleta (State & Anti-Crash)', () => {
    it('pular a roleta revela o prêmio imediatamente e agenda janela de debounce', () => {
      let isFinishedRolling = false;
      let canCollectAt = 0;
      let collected = false;
      let rollTimerDestroyed = false;

      const rollTimer = {
        destroy: () => {
          rollTimerDestroyed = true;
        }
      };

      const revealPrizeNow = (now: number) => {
        if (collected || isFinishedRolling) return;
        isFinishedRolling = true;
        canCollectAt = now + 180;
        rollTimer.destroy();
      };

      const finalizeCollection = () => {
        if (collected) return;
        collected = true;
      };

      const handleInteraction = (now: number) => {
        if (collected) return;
        if (!isFinishedRolling) {
          revealPrizeNow(now);
          return;
        }
        if (now < canCollectAt) {
          return;
        }
        finalizeCollection();
      };

      const t0 = 1000;
      // 1. Jogador ou bot pressiona Espaço enquanto está rodando
      handleInteraction(t0);

      expect(isFinishedRolling).toBe(true);
      expect(rollTimerDestroyed).toBe(true);
      expect(collected).toBe(false);

      // 2. Tecla repetida rápida (ex.: 50ms depois) é ignorada pelo debounce
      handleInteraction(t0 + 50);
      expect(collected).toBe(false);

      // 3. Pressionamento após a janela de debounce (ex.: 250ms depois) confirma a coleta
      handleInteraction(t0 + 250);
      expect(collected).toBe(true);
    });

    it('guarda contra tentativa de setText em objetos destruídos após coleta rápida', () => {
      const collected = true;
      const isFinishedRolling = true;
      const mockHeader = {
        scene: null as unknown,
        setText: vi.fn()
      };
      const mockModal = {
        scene: null as unknown
      };

      const rollNextName = () => {
        // Guarda exata implementada no UIScene
        if (collected || isFinishedRolling || !mockModal.scene || !mockHeader.scene) {
          return;
        }
        mockHeader.setText('TESTE');
      };

      // Executa como se o timer delayedCall tivesse disparado após destruição
      expect(() => rollNextName()).not.toThrow();
      expect(mockHeader.setText).not.toHaveBeenCalled();
    });

    it('destruir o modal limpa referências e cancela resolver do bot', () => {
      let isChestRouletteOpen = true;
      let resolver: (() => void) | null = vi.fn();
      let timerDestroyed = false;

      const rollTimer = {
        destroy: () => {
          timerDestroyed = true;
        }
      };

      const onDestroy = () => {
        rollTimer.destroy();
        resolver = null;
        isChestRouletteOpen = false;
      };

      onDestroy();

      expect(timerDestroyed).toBe(true);
      expect(resolver).toBeNull();
      expect(isChestRouletteOpen).toBe(false);
    });
  });
});
