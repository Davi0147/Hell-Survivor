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

    // 2. Faixa angular cortando a tela (inclinação -6 graus)
    const stripH = 160;
    const stripY = height / 2 - 10;
    const stripGraphics = scene.add.graphics();

    // Desenha o polígono chanfrado de quadrinhos
    stripGraphics.fillStyle(0x720012, 0.95);
    stripGraphics.beginPath();
    stripGraphics.moveTo(-50, stripY - stripH / 2 - 25);
    stripGraphics.lineTo(width + 50, stripY - stripH / 2 + 15);
    stripGraphics.lineTo(width + 50, stripY + stripH / 2 + 35);
    stripGraphics.lineTo(-50, stripY + stripH / 2 - 5);
    stripGraphics.closePath();
    stripGraphics.fill();

    // Borda preta e branca grossa de quadrinhos
    stripGraphics.lineStyle(6, 0xffffff, 1);
    stripGraphics.stroke();
    stripGraphics.lineStyle(2, 0x000000, 1);
    stripGraphics.stroke();

    cutInContainer.add(stripGraphics);

    // 3. Close-up dramático nos olhos/rosto da Nixy
    const portrait = scene.add.image(width / 2 - 110, stripY, 'nixy-portrait-idle');
    portrait.setDisplaySize(240, 240);
    portrait.setTint(0xff3355);
    cutInContainer.add(portrait);

    // 4. Tipografia de Impacto: "ETERNAL DESPAIR"
    const pixelFont = "'Silkscreen', 'Press Start 2P', monospace";

    const titleText = scene.add.text(width / 2 + 10, stripY - 22, 'ETERNAL DESPAIR', {
      fontFamily: pixelFont,
      fontSize: '34px',
      fontStyle: 'bold',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 8
    }).setOrigin(0, 0.5);
    titleText.setAngle(-2);

    const subText = scene.add.text(width / 2 + 15, stripY + 24, '★ SUPREME PURIFICATION ★', {
      fontFamily: pixelFont,
      fontSize: '13px',
      fontStyle: 'bold',
      color: '#f3d17a',
      stroke: '#4a0e17',
      strokeThickness: 4
    }).setOrigin(0, 0.5);
    subText.setAngle(-2);

    cutInContainer.add(titleText);
    cutInContainer.add(subText);

    // Animação de entrada do Cut-In: Slide lateral rápido + Shake
    cutInContainer.setX(-width);
    scene.tweens.add({
      targets: cutInContainer,
      x: 0,
      duration: 180,
      ease: 'Back.easeOut',
      onComplete: () => {
        cameras.shake(200, 0.015);
        cameras.flash(120, 255, 255, 255);

        // Hit-stop de 480ms e depois saída cortada
        scene.time.delayedCall(480, () => {
          scene.tweens.add({
            targets: cutInContainer,
            x: width * 1.2,
            alpha: 0,
            duration: 160,
            ease: 'Quad.easeIn',
            onComplete: () => {
              cutInContainer.destroy();
            }
          });
        });
      }
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

    // 2. Anéis concêntricos de choque expandindo rapidamente
    const shockwave = scene.add.circle(x, y, 15, 0xff0055, 0.9);
    shockwave.setDepth(25);
    shockwave.setBlendMode(Phaser.BlendModes.ADD);

    scene.tweens.add({
      targets: shockwave,
      radius: aoeRadius,
      alpha: 0,
      duration: 260,
      ease: 'Quad.easeOut',
      onComplete: () => shockwave.destroy()
    });

    const shockwave2 = scene.add.circle(x, y, 8, 0xffd60a, 0.95);
    shockwave2.setDepth(26);
    shockwave2.setBlendMode(Phaser.BlendModes.ADD);

    scene.tweens.add({
      targets: shockwave2,
      radius: aoeRadius * 0.65,
      alpha: 0,
      duration: 200,
      ease: 'Quad.easeOut',
      onComplete: () => shockwave2.destroy()
    });

    // 3. Estouro central em formato de estrela / faíscas infernais
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

    // 5. Feedback com texto de dano crítico gigante
    if (hitCount > 0) {
      DamageTextSystem.showDamage(scene, x, y - 20, damage * hitCount);
    }
  }
}
