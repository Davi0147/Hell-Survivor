import Phaser from 'phaser';
import { enableCensoredTextHighlight } from './TextHighlight';
import { COLORS } from '../config/theme';

/**
 * Alvo genérico para exibição de balões de fala em combate.
 * Respeita a Regra 18: não assume que o jogador é Nixy e aceita chefes ou entidades mockadas.
 */
export interface ICombatBubbleTarget {
  x: number;
  y: number;
  active?: boolean;
  isDead?: boolean;
  currentHp?: number;
}

/**
 * Representação interna de um balão de fala ativo e seu vínculo com o alvo.
 */
export interface IActiveCombatBubble {
  container: Phaser.GameObjects.Container;
  target: ICombatBubbleTarget;
  offsetY: number;
}

/**
 * Contexto mínimo necessário para a operação do CombatBubbleSystem.
 */
export interface ICombatBubbleContext {
  readonly player?: ICombatBubbleTarget | null;
  readonly bossInstance?: ICombatBubbleTarget | null;
  readonly isBossFightActive?: boolean;
  readonly isGameOver?: boolean;

  add: Phaser.GameObjects.GameObjectFactory;
  time: Phaser.Time.Clock;
  tweens: Phaser.Tweens.TweenManager;
  events: Phaser.Events.EventEmitter;
}

/**
 * Sistema autônomo responsável pelos balões de fala e provocações em combate (Pacote 3 — Etapa 2).
 */
export class CombatBubbleSystem {
  private context: ICombatBubbleContext;
  private activeCombatBubbles: IActiveCombatBubble[] = [];
  private combatBanterTimers: Phaser.Time.TimerEvent[] = [];
  private preRenderListener?: () => void;
  private isDestroyed: boolean = false;

  constructor(context: ICombatBubbleContext) {
    this.context = context;

    // Rastreamento suave e estável dos balões de combate no PRE_RENDER (elimina tremor durante movimento)
    this.preRenderListener = () => this.updateBubblePositions();
    if (this.context.events) {
      this.context.events.on(Phaser.Scenes.Events.PRE_RENDER, this.preRenderListener);
    }
  }

  /**
   * Atualiza a posição de cada balão ativo para acompanhar seu alvo. Remove automaticamente balões de alvos mortos.
   */
  public updateBubblePositions(): void {
    for (let i = this.activeCombatBubbles.length - 1; i >= 0; i--) {
      const bubble = this.activeCombatBubbles[i];
      const target = bubble.target;
      const isAlive = target && target.active && !('isDead' in target && target.isDead) && !('currentHp' in target && target.currentHp !== undefined && target.currentHp <= 0);
      if (isAlive) {
        bubble.container.setPosition(target.x, target.y + bubble.offsetY);
      } else {
        bubble.container.destroy();
        this.activeCombatBubbles.splice(i, 1);
      }
    }
  }

  /**
   * Inicia o diálogo de provocações automáticas da batalha contra a Succubus.
   */
  public startBossCombatBanter(): void {
    this.clearCombatSpeechBubbles();

    // 1. Nixy: "Só pra deixar claro:" (1.2s após início do combate)
    const t1 = this.context.time.delayedCall(1200, () => {
      if (this.isDestroyed || !this.context.player || (this.context.player.currentHp !== undefined && this.context.player.currentHp <= 0) || !this.context.isBossFightActive || this.context.isGameOver) return;
      this.showCombatSpeechBubble(this.context.player, 'Só pra deixar claro:', 1900, true);
    });
    this.combatBanterTimers.push(t1);

    // 2. Nixy: "se você sobreviver..." (3.3s após início do combate)
    const t2 = this.context.time.delayedCall(3300, () => {
      if (this.isDestroyed || !this.context.player || (this.context.player.currentHp !== undefined && this.context.player.currentHp <= 0) || !this.context.isBossFightActive || this.context.isGameOver) return;
      this.showCombatSpeechBubble(this.context.player, 'se você sobreviver...', 2000, true);
    });
    this.combatBanterTimers.push(t2);

    // 3. Nixy: "eu ainda vou terminar o que comecei com essas asas!" (5.5s após início do combate)
    const t3 = this.context.time.delayedCall(5500, () => {
      if (this.isDestroyed || !this.context.player || (this.context.player.currentHp !== undefined && this.context.player.currentHp <= 0) || !this.context.isBossFightActive || this.context.isGameOver) return;
      this.showCombatSpeechBubble(this.context.player, 'eu ainda vou terminar o que comecei com essas asas!', 3000, true);
    });
    this.combatBanterTimers.push(t3);

    // 4. Succubus: "E se você sobreviver..." (8.8s após início do combate)
    const t4 = this.context.time.delayedCall(8800, () => {
      if (this.isDestroyed || !this.context.bossInstance || this.context.bossInstance.isDead || !this.context.isBossFightActive || this.context.isGameOver) return;
      this.showCombatSpeechBubble(this.context.bossInstance, 'E se você sobreviver...', 2200, false);
    });
    this.combatBanterTimers.push(t4);

    // 5. Succubus: "eu arranco sua língua!" (11.2s após início do combate)
    const t5 = this.context.time.delayedCall(11200, () => {
      if (this.isDestroyed || !this.context.bossInstance || this.context.bossInstance.isDead || !this.context.isBossFightActive || this.context.isGameOver) return;
      this.showCombatSpeechBubble(this.context.bossInstance, 'eu arranco sua língua!', 2600, false);
    });
    this.combatBanterTimers.push(t5);

    // 6. Nixy: "Olha só!" (14.1s após início do combate)
    const t6 = this.context.time.delayedCall(14100, () => {
      if (this.isDestroyed || !this.context.player || (this.context.player.currentHp !== undefined && this.context.player.currentHp <= 0) || !this.context.isBossFightActive || this.context.isGameOver) return;
      this.showCombatSpeechBubble(this.context.player, 'Olha só!', 1600, true);
    });
    this.combatBanterTimers.push(t6);

    // 7. Nixy: "Finalmente encontramos algo em que concordamos." (15.9s após início do combate)
    const t7 = this.context.time.delayedCall(15900, () => {
      if (this.isDestroyed || !this.context.player || (this.context.player.currentHp !== undefined && this.context.player.currentHp <= 0) || !this.context.isBossFightActive || this.context.isGameOver) return;
      this.showCombatSpeechBubble(this.context.player, 'Finalmente encontramos algo em que concordamos.', 3000, true);
    });
    this.combatBanterTimers.push(t7);
  }

  /**
   * Exibe a fala de combate limpa sobre a cabeça da heroína ou de Rosalin sem caixa/fundo ou nome.
   */
  public showCombatSpeechBubble(
    target: ICombatBubbleTarget,
    text: string,
    durationMs: number,
    isNixy: boolean = true
  ): void {
    if (!target || !target.active) return;
    if ('isDead' in target && target.isDead) return;
    if ('currentHp' in target && target.currentHp !== undefined && target.currentHp <= 0) return;

    // Remove fala anterior do mesmo alvo, se existir
    for (let i = this.activeCombatBubbles.length - 1; i >= 0; i--) {
      if (this.activeCombatBubbles[i].target === target) {
        this.activeCombatBubbles[i].container.destroy();
        this.activeCombatBubbles.splice(i, 1);
      }
    }

    const offsetY = isNixy ? -34 : -50;

    const container = this.context.add.container(target.x, target.y + offsetY);
    container.setDepth(1500);
    container.setAlpha(0);

    // Texto limpo da fala com a cor do personagem e contorno preto de alta legibilidade (sem caixa de fundo e sem nome em cima!)
    const phraseColor = isNixy ? COLORS.phraseNixy : COLORS.phraseSuccubus;
    const bodyText = this.context.add.text(0, 0, text, {
      fontFamily: 'Pixelzone, Silkscreen, monospace',
      fontSize: '11px',
      fontStyle: 'bold',
      color: phraseColor,
      align: 'center',
      stroke: COLORS.strokeBlack,
      strokeThickness: 3.5,
      wordWrap: { width: 180 },
      shadow: {
        offsetX: 0,
        offsetY: 2,
        color: COLORS.strokeBlack,
        blur: 4,
        stroke: true,
        fill: true
      }
    }).setOrigin(0.5);
    bodyText.setResolution(2);
    enableCensoredTextHighlight(bodyText, COLORS.goldTextAccent);

    container.add(bodyText);

    // Animação de entrada suave
    this.context.tweens.add({
      targets: container,
      alpha: 1,
      duration: 150,
      ease: 'Linear'
    });

    this.activeCombatBubbles.push({
      container,
      target,
      offsetY
    });

    // Fade-out suave antes de desaparecer
    const fadeDelay = Math.max(100, durationMs - 250);
    const fadeTimer = this.context.time.delayedCall(fadeDelay, () => {
      if (container.active) {
        this.context.tweens.add({
          targets: container,
          alpha: 0,
          duration: 220,
          onComplete: () => {
            container.destroy();
            const idx = this.activeCombatBubbles.findIndex(b => b.container === container);
            if (idx !== -1) {
              this.activeCombatBubbles.splice(idx, 1);
            }
          }
        });
      }
    });
    this.combatBanterTimers.push(fadeTimer);
  }

  /**
   * Limpa todos os balões de fala e timers de provocação do combate.
   */
  public clearCombatSpeechBubbles(): void {
    for (const timer of this.combatBanterTimers) {
      if (timer) timer.remove();
    }
    this.combatBanterTimers = [];

    for (const item of this.activeCombatBubbles) {
      if (item.container) {
        item.container.destroy();
      }
    }
    this.activeCombatBubbles = [];
  }

  /**
   * Limpa ouvintes de eventos e cancela todos os balões ativos no shutdown da cena.
   */
  public destroy(): void {
    this.isDestroyed = true;
    if (this.preRenderListener && this.context.events) {
      this.context.events.off(Phaser.Scenes.Events.PRE_RENDER, this.preRenderListener);
      this.preRenderListener = undefined;
    }
    this.clearCombatSpeechBubbles();
  }

  /**
   * Retorna os balões ativos (somente leitura para testes).
   */
  public getActiveBubbles(): readonly IActiveCombatBubble[] {
    return this.activeCombatBubbles;
  }

  /**
   * Retorna os timers de banter ativos (somente leitura para testes).
   */
  public getBanterTimers(): readonly Phaser.Time.TimerEvent[] {
    return this.combatBanterTimers;
  }
}
