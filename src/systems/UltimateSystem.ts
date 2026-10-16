import Phaser from 'phaser';
import { BaseEnemy } from '../entities/enemies/BaseEnemy';
import { Nixy } from '../entities/characters/Nixy';
import { DamageTextSystem } from './DamageTextSystem';

export class UltimateSystem {
  /**
   * Executa a Habilidade Suprema "Eternal Despair" da Nixy:
   * 1. Cut-In cinematográfico anime estilo Persona 5
   * 2. Time-stop de 5 segundos congelando os monstros
   * 3. 8 Detonações Carmesins sequenciais nos maiores aglomerados
   * 4. Desfecho, unfreeze e retomada fluida
   */
  public static execute(scene: Phaser.Scene, player: Nixy, enemiesGroup: Phaser.GameObjects.Group): void {
    if (player.isUltimateActive) return;

    player.isUltimateActive = true;
    player.ultimateCharge = 0;

    const { width, height } = scene.scale;
    const cameras = scene.cameras.main;

    // Oculta a HUD da UIScene durante a exibição da animação cinematográfica da Suprema
    const uiScene = scene.scene.get('UIScene') as any;
    if (uiScene && typeof uiScene.setHUDVisible === 'function') {
      uiScene.setHUDVisible(false);
    }

    // Purifica o campo de batalha dissipando quaisquer poças de veneno/gosma ativas
    if ((scene as any).clearAllPoisonPuddles) {
      (scene as any).clearAllPoisonPuddles();
    }

    // =========================================================================
    // ETAPA 1: ANIME CUT-IN CINEMATOGRÁFICO (PERSONA 5 COMIC NOIR)
    // =========================================================================
    // Container fixo na câmera para o Cut-In (ScrollFactor = 0, Depth 400)
    const cutInContainer = scene.add.container(0, 0);
    cutInContainer.setScrollFactor(0);
    cutInContainer.setDepth(400);

    // 1. Escurecimento global de fundo
    const darkBackdrop = scene.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.85);
    cutInContainer.add(darkBackdrop);

    // 2. Banner de Cut-In Oficial da Nixy (300x70px escalado em 3.15x para largura de ~945px)
    // Centralizado perfeitamente no meio da tela (y = 50% da altura)
    const bannerY = Math.round(height * 0.5);
    const bannerScale = 3.15;
    const cutInSprite = scene.add.sprite(width / 2, bannerY, 'nixy-ult-cutin-1');
    cutInSprite.setScale(bannerScale);
    cutInContainer.add(cutInSprite);

    // 3. Tipografia de Impacto: "ETERNAL DESPAIR" (FONTE: 50px, rebaixada e animada da esquerda ao centro e saída rápida à direita)
    const pixelFont = "'Pixelzone', 'Silkscreen', 'Press Start 2P', monospace";

    // Container dedicado aos textos para controlar movimento independente do fundo
    const textGroup = scene.add.container(-width * 0.75, 0);
    cutInContainer.add(textGroup);

    const titleText = scene.add.text(0, bannerY + 140, 'ETERNAL DESPAIR', {
      fontFamily: pixelFont,
      fontSize: '50px',
      fontStyle: 'bold',
      color: '#ffffff',
      stroke: '#4a0e17',
      strokeThickness: 8,
      align: 'center',
      shadow: {
        offsetX: 0,
        offsetY: 4,
        color: '#ff0055',
        blur: 16,
        stroke: true,
        fill: true
      }
    }).setOrigin(0.5);
    titleText.setResolution(2);

    const subText = scene.add.text(0, bannerY + 185, 'SUPREME PURIFICATION', {
      fontFamily: pixelFont,
      fontSize: '16px',
      fontStyle: 'bold',
      color: '#ffd166',
      stroke: '#000000',
      strokeThickness: 5,
      align: 'center',
      shadow: {
        offsetX: 0,
        offsetY: 2,
        color: '#000000',
        blur: 8,
        stroke: true,
        fill: true
      }
    }).setOrigin(0.5);
    subText.setResolution(2);

    textGroup.add(titleText);
    textGroup.add(subText);

    // 4. Sequência Animada dos 3 Frames:
    // Frame 1 (0ms): Olhos fechados, concentração profunda
    // O texto vem rápido da esquerda e desacelera suavemente no centro
    scene.tweens.add({
      targets: textGroup,
      x: width / 2,
      duration: 260,
      ease: 'Cubic.easeOut'
    });

    // Transição para o Frame 2 (160ms): Os olhos da Nixy se abrem
    scene.time.delayedCall(160, () => {
      if (!cutInSprite.scene) return;
      cutInSprite.setTexture('nixy-ult-cutin-2');
      cameras.shake(100, 0.006);

      // Transição para o Frame 3 (360ms): Poder supremo liberado!
      scene.time.delayedCall(200, () => {
        if (!cutInSprite.scene) return;
        cutInSprite.setTexture('nixy-ult-cutin-3');
        cameras.shake(250, 0.018);
        cameras.flash(140, 255, 255, 255);

        // Pulso da tipografia acompanhando o pico de energia
        scene.tweens.add({
          targets: [titleText, subText],
          scaleX: 1.15,
          scaleY: 1.15,
          duration: 100,
          yoyo: true,
          ease: 'Quad.easeInOut'
        });

        // Hit-stop de 420ms no ápice do Frame 3 e depois saída rápida pela direita
        scene.time.delayedCall(420, () => {
          // O nome sai rapidamente pela direita
          scene.tweens.add({
            targets: textGroup,
            x: width + 600,
            duration: 160,
            ease: 'Quad.easeIn'
          });

          // O banner e o fundo esvanecem em corte cinematográfico
          scene.tweens.add({
            targets: cutInContainer,
            alpha: 0,
            duration: 160,
            ease: 'Quad.easeIn',
            onComplete: () => {
              cutInContainer.destroy();
              // Restaura a visualização da HUD limpa após a saída da animação
              if (uiScene && typeof uiScene.setHUDVisible === 'function') {
                uiScene.setHUDVisible(true);
              }
            }
          });
        });
      });
    });

    // =========================================================================
    // ETAPA 2: TIME-STOP DE 5 SEGUNDOS (MONSTROS CONGELADOS NO TEMPO)
    // =========================================================================
    // Congela imediatamente a física e animações dos inimigos
    const frozenEnemies = enemiesGroup.getChildren() as BaseEnemy[];
    for (const e of frozenEnemies) {
      if (e.active && !e.isDead) {
        if (e.body) {
          (e.body as Phaser.Physics.Arcade.Body).enable = false;
        }
        if (e.anims) {
          e.anims.pause();
        }
        e.setTint(0x665577); // Desaturação arroxeada do tempo parado
      }
    }

    // Vinheta etérea escura na arena do mundo
    const realmOverlay = scene.add.rectangle(0, 0, width * 4, height * 4, 0x0c0008, 0.52);
    realmOverlay.setScrollFactor(0);
    realmOverlay.setDepth(15);

    // Aura instável carmesim pulsando ao redor da Nixy durante o Time-Stop
    const auraEmitter = scene.time.addEvent({
      delay: 70,
      loop: true,
      callback: () => {
        if (!player.active || !player.isUltimateActive) return;
        const aura = scene.add.circle(player.x, player.y, Phaser.Math.Between(26, 42), 0xff0055, 0.35);
        aura.setDepth(player.depth - 1);
        aura.setBlendMode(Phaser.BlendModes.ADD);

        scene.tweens.add({
          targets: aura,
          scale: 1.8,
          alpha: 0,
          duration: 320,
          onComplete: () => aura.destroy()
        });
      }
    });

    // =========================================================================
    // ETAPA 3: 8 DETONAÇÕES CARMESINS SEQUENCIAIS (CLUSTER-TARGETING)
    // =========================================================================
    const detonationTimes = [650, 1150, 1650, 2150, 2650, 3150, 3650, 4150];

    detonationTimes.forEach((delayMs, index) => {
      scene.time.delayedCall(delayMs, () => {
        if (!player.active) return;

        // 1. Algoritmo de Cluster-Targeting: Encontra o maior grupo de monstros
        const targetPos = this.findBestClusterCenter(player, enemiesGroup);

        // 2. Telegrafia mágica no chão 120ms antes da explosão
        this.spawnTelegraphRune(scene, targetPos.x, targetPos.y);

        // 3. Detonação devastadora
        scene.time.delayedCall(120, () => {
          this.executeDetonation(scene, targetPos.x, targetPos.y, enemiesGroup, index + 1);
        });
      });
    });

    // =========================================================================
    // ETAPA 4: DESFECHO AOS 5 SEGUNDOS (UNFREEZE E RETOMADA)
    // =========================================================================
    scene.time.delayedCall(5000, () => {
      auraEmitter.remove();
      realmOverlay.destroy();
      cameras.flash(180, 255, 255, 255);

      // Descongela todos os monstros sobreviventes
      const currentEnemies = enemiesGroup.getChildren() as BaseEnemy[];
      for (const e of currentEnemies) {
        if (e.active && !e.isDead) {
          if (e.body) {
            (e.body as Phaser.Physics.Arcade.Body).enable = true;
          }
          if (e.anims) {
            e.anims.resume();
          }
          e.clearTint();
        }
      }

      player.isUltimateActive = false;
    });
  }

  /**
   * Encontra a posição do maior aglomerado de monstros vivos próximos à heroína
   */
  private static findBestClusterCenter(
    player: Nixy,
    enemiesGroup: Phaser.GameObjects.Group
  ): { x: number; y: number } {
    const enemies = enemiesGroup.getChildren().filter(
      (child) => (child as any).active && !(child as any).isDead
    ) as BaseEnemy[];

    if (enemies.length === 0) {
      // Se não houver inimigos, detona em ponto aleatório ao redor do jogador
      const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
      const dist = Phaser.Math.Between(60, 140);
      return {
        x: player.x + Math.cos(angle) * dist,
        y: player.y + Math.sin(angle) * dist
      };
    }

    let bestEnemy = enemies[0];
    let maxNeighbors = -1;
    const clusterRadius = 150;

    // Avalia a densidade de cada monstro
    for (let i = 0; i < enemies.length; i++) {
      const e1 = enemies[i];
      let neighborCount = 0;

      for (let j = 0; j < enemies.length; j++) {
        if (i === j) continue;
        const e2 = enemies[j];
        const d = Math.hypot(e1.x - e2.x, e1.y - e2.y);
        if (d <= clusterRadius) {
          neighborCount++;
        }
      }

      // Prioriza alvos com mais vizinhos e que estejam a menos de 500px da Nixy
      const distToPlayer = Math.hypot(e1.x - player.x, e1.y - player.y);
      const score = neighborCount * 20 - distToPlayer * 0.05;

      if (score > maxNeighbors) {
        maxNeighbors = score;
        bestEnemy = e1;
      }
    }

    return { x: bestEnemy.x, y: bestEnemy.y };
  }

  /**
   * Telegrafia com runas no chão alertando o ponto de impacto iminente
   */
  private static spawnTelegraphRune(scene: Phaser.Scene, x: number, y: number): void {
    const rune = scene.add.graphics();
    rune.setDepth(18);

    const radius = 95;
    rune.lineStyle(2, 0xff0055, 0.85);
    rune.strokeCircle(x, y, radius);
    rune.lineStyle(1, 0xffd60a, 0.7);
    rune.strokeCircle(x, y, radius * 0.6);

    // Cruz interna
    rune.lineBetween(x - radius, y, x + radius, y);
    rune.lineBetween(x, y - radius, x, y + radius);

    scene.tweens.add({
      targets: rune,
      scaleX: 0.85,
      scaleY: 0.85,
      alpha: 1,
      duration: 120,
      ease: 'Quad.easeIn',
      onComplete: () => {
        rune.destroy();
      }
    });
  }

  /**
   * Executa a explosão de impacto: ondas de choque, partículas, screen shake e dano massivo em área
   */
  private static executeDetonation(
    scene: Phaser.Scene,
    x: number,
    y: number,
    enemiesGroup: Phaser.GameObjects.Group,
    explosionIndex: number
  ): void {
    const aoeRadius = 115;
    const damage = 140;

    // 1. Tremor de câmera contundente sincronizado
    scene.cameras.main.shake(140, 0.012);

    // 2. Iluminação de fundo carmesim no chão (luz ambiente da detonação da Suprema)
    const ultIllum = scene.add.circle(x, y, aoeRadius * 0.95, 0xff0055, 0.62);
    ultIllum.setDepth(17);
    ultIllum.setBlendMode(Phaser.BlendModes.ADD);

    scene.tweens.add({
      targets: ultIllum,
      scale: 1.5,
      alpha: 0,
      duration: 380,
      ease: 'Quad.easeOut',
      onComplete: () => ultIllum.destroy()
    });

    // 3. Sprite de Explosão Oficial Animado (Explosion 1 a 5)
    const explosionScale = (aoeRadius * 2.3) / 200;
    const explosionSprite = scene.add.sprite(x, y, 'explosion-1');
    explosionSprite.setDepth(25);
    explosionSprite.setScale(explosionScale);
    explosionSprite.play('anim-explosion');

    explosionSprite.once('animationcomplete', () => {
      explosionSprite.destroy();
    });

    // 4. Estouro central em formato de faíscas infernais carmesins
    for (let i = 0; i < 14; i++) {
      const spark = scene.add.circle(x, y, Phaser.Math.Between(2, 5), 0xff2a6d, 1);
      spark.setDepth(27);
      spark.setBlendMode(Phaser.BlendModes.ADD);

      const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
      const speed = Phaser.Math.Between(50, 160);

      scene.tweens.add({
        targets: spark,
        x: x + Math.cos(angle) * speed,
        y: y + Math.sin(angle) * speed,
        alpha: 0,
        scale: 0.2,
        duration: Phaser.Math.Between(220, 360),
        ease: 'Quad.easeOut',
        onComplete: () => spark.destroy()
      });
    }

    // 4. Aplicação do Dano Massivo em Área (AoE)
    const enemies = enemiesGroup.getChildren() as BaseEnemy[];
    let hitCount = 0;

    for (let i = 0; i < enemies.length; i++) {
      const e = enemies[i];
      if (!e.active || e.isDead) continue;

      const dist = Math.hypot(e.x - x, e.y - y);
      if (dist <= aoeRadius) {
        e.takeDamage(damage);
        hitCount++;
      }
    }

    // Dissipa poças de veneno/gosma atingidas pela detonação da Suprema
    const gameScene = scene as any;
    if (gameScene.poisonPuddles) {
      for (let i = gameScene.poisonPuddles.length - 1; i >= 0; i--) {
        const p = gameScene.poisonPuddles[i];
        if (p && p.active) {
          const d = Math.hypot(p.x - x, p.y - y);
          if (d <= aoeRadius + 30) {
            scene.tweens.add({
              targets: p,
              alpha: 0,
              scale: 0.1,
              duration: 220,
              onComplete: () => p.destroy()
            });
            gameScene.poisonPuddles.splice(i, 1);
          }
        }
      }
    }

    // 5. Feedback com texto de dano crítico gigante
    if (hitCount > 0) {
      DamageTextSystem.showDamage(scene, x, y - 20, damage * hitCount);
    }
  }
}
