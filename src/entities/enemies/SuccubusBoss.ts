import Phaser from 'phaser';
import { BaseEnemy } from './BaseEnemy';
import { Nixy } from '../characters/Nixy';
import { DarkOrbProjectile } from '../weapons/DarkOrbProjectile';
import { DamageTextSystem } from '../../systems/DamageTextSystem';
import { SoundManager } from '../../systems/SoundManager';
import { BOSS_TELEGRAPH } from '../../config/theme';

type BossState =
  | 'INTRO'
  | 'CHASE'
  | 'TELEGRAPH_DASH'
  | 'DASHING'
  | 'SHOOTING'
  | 'AIR_JUMP'
  | 'SLAM_IMPACT'
  | 'SLAM_RECOVERY';

export class SuccubusBoss extends BaseEnemy {
  public maxHp: number = 9000;
  public hp: number = 9000;
  public speed: number = 125;
  public damage: number = 35;
  public isBoss: boolean = true;
  public isInvulnerable: boolean = false;

  private bossState: BossState = 'CHASE';
  private stateTimer: number = 0;

  // Cooldowns das Habilidades
  private dashCooldown: number = 4500;
  private shootCooldown: number = 3500;
  private airJumpCooldown: number = 13000;

  // Habilidade 1: Investida Telegrafada (Telegraphed Dash)
  private dashTargetVector: { x: number; y: number } = { x: 1, y: 0 };
  private dashLineGraphics!: Phaser.GameObjects.Graphics;
  private readonly DASH_SPEED = 620;
  private readonly DASH_DURATION = 420;

  // Habilidade 2: Disparo de Projéteis Sombrios
  public projectilesGroup!: Phaser.GameObjects.Group;

  // Habilidade 3: Salto Aéreo Esmagador (Meteor Dive Slam)
  private slamTargetPos: { x: number; y: number } = { x: 0, y: 0 };
  private slamCircleGraphics!: Phaser.GameObjects.Graphics;
  private readonly SLAM_CHARGE_DURATION = 3600; // ~3.6s de tensão com círculo crescendo
  private readonly SLAM_MAX_RADIUS = 190;
  private readonly SLAM_RECOVERY_DURATION = 2000; // Janela de dano livre

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'succubus-idle-south');

    // Porte visual imponente de Chefe (1.65x escala)
    this.setScale(1.65);
    this.setDepth(22);

    // Ajuste da caixa de colisão física proporcional
    const body = this.body as Phaser.Physics.Arcade.Body;
    if (body) {
      body.setSize(44, 52);
      body.setOffset(24, 20);
    }

    // Gráficos dedicados para telegrafia
    this.dashLineGraphics = scene.add.graphics();
    this.dashLineGraphics.setDepth(19);

    this.slamCircleGraphics = scene.add.graphics();
    this.slamCircleGraphics.setDepth(18);

    // Grupo de Projéteis Sombrios da Chefe
    this.projectilesGroup = scene.add.group({
      classType: DarkOrbProjectile,
      maxSize: 30,
      runChildUpdate: false
    });
  }

  public override spawn(
    x: number,
    y: number,
    hp: number = 9000,
    speed: number = 125,
    damage: number = 35,
    customScale: number = 1.75,
    isCinematicIntro: boolean = false
  ): void {
    super.spawn(x, y, hp, speed, damage);
    this.setScale(customScale);
    this.bossState = isCinematicIntro ? 'INTRO' : 'CHASE';
    this.isInvulnerable = isCinematicIntro;
    this.stateTimer = 0;
    this.dashCooldown = 4500;
    this.shootCooldown = 3500;
    this.airJumpCooldown = 13000;
    this.play('succubus-fly-south', true);

    const body = this.body as Phaser.Physics.Arcade.Body;
    if (body) {
      body.enable = !isCinematicIntro;
      body.setVelocity(0, 0);
    }

    if (!this.dashLineGraphics || !this.dashLineGraphics.scene) {
      this.dashLineGraphics = this.scene.add.graphics();
      this.dashLineGraphics.setDepth(19);
    }
    if (!this.slamCircleGraphics || !this.slamCircleGraphics.scene) {
      this.slamCircleGraphics = this.scene.add.graphics();
      this.slamCircleGraphics.setDepth(18);
    }

    if (!isCinematicIntro) {
      this.emit('boss-spawned', this.hp, this.maxHp);
    }
  }

  /**
   * Ativa Rosalin para o combate real após o término do diálogo introdutório
   */
  public startCombat(): void {
    this.isInvulnerable = false;
    this.bossState = 'CHASE';
    this.clearTint();
    const body = this.body as Phaser.Physics.Arcade.Body;
    if (body) {
      body.enable = true;
    }
    this.emit('boss-spawned', this.hp, this.maxHp);
  }

  public updateBoss(player: Nixy, deltaMs: number): void {
    if (this.isDead || !this.active) return;

    if (this.bossState === 'INTRO' || this.isInvulnerable) {
      const body = this.body as Phaser.Physics.Arcade.Body;
      if (body) {
        body.setVelocity(0, 0);
      }
      return;
    }

    // Atualiza projéteis disparados
    const projs = this.projectilesGroup.getChildren() as DarkOrbProjectile[];
    for (let i = 0; i < projs.length; i++) {
      const p = projs[i];
      if (p.active) {
        p.updateProjectile(deltaMs);
        // Colisão com o jogador
        if (Math.hypot(p.x - player.x, p.y - player.y) <= 24) {
          p.onHitPlayer(player);
        }
      }
    }

    // Gerenciar duração do flash branco de hit
    if (this.hitFlashTimer > 0) {
      this.hitFlashTimer -= deltaMs;
      if (this.hitFlashTimer <= 0) {
        this.clearTint();
      }
    }

    // Redução contínua dos cooldowns
    if (this.bossState === 'CHASE') {
      this.dashCooldown -= deltaMs;
      this.shootCooldown -= deltaMs;
      this.airJumpCooldown -= deltaMs;

      // Prioridade 1: Salto Aéreo Esmagador (a cada ~16-18s)
      if (this.airJumpCooldown <= 0) {
        this.startAirJump(player);
        return;
      }

      // Prioridade 2: Investida Telegrafada (a cada ~6s)
      if (this.dashCooldown <= 0) {
        this.startTelegraphDash(player);
        return;
      }

      // Prioridade 3: Disparo de Projéteis Sombrios (a cada ~4s)
      if (this.shootCooldown <= 0) {
        this.fireDarkProjectiles(player);
        return;
      }

      // Movimentação padrão de perseguição aérea
      this.chasePlayer(player, deltaMs);
    } else if (this.bossState === 'TELEGRAPH_DASH') {
      this.updateTelegraphDash(player, deltaMs);
    } else if (this.bossState === 'DASHING') {
      this.updateDashing(player, deltaMs);
    } else if (this.bossState === 'AIR_JUMP') {
      this.updateAirJump(player, deltaMs);
    } else if (this.bossState === 'SLAM_RECOVERY') {
      this.updateSlamRecovery(deltaMs);
    }
  }

  // =========================================================================
  // ESTADO 1: CHASE (PERSEGUIÇÃO FLUIDA)
  // =========================================================================
  private chasePlayer(player: Nixy, deltaMs: number): void {
    const stunMult = this.updateStunState(deltaMs);
    const dx = player.x - this.x;
    const dy = player.y - this.y;
    const dist = Math.hypot(dx, dy);

    if (dist > 10) {
      const angle = Math.atan2(dy, dx);
      const body = this.body as Phaser.Physics.Arcade.Body;
      if (body) {
        body.setVelocity(
          Math.cos(angle) * this.speed * stunMult,
          Math.sin(angle) * this.speed * stunMult
        );
      }
      this.updateFacingAnimation(angle);
    }
  }

  // =========================================================================
  // HABILIDADE 1: INVESTIDA EM LINHA TELEGRAFADA (TELEGRAPHED DASH)
  // =========================================================================
  private startTelegraphDash(player: Nixy): void {
    this.bossState = 'TELEGRAPH_DASH';
    this.stateTimer = 1000; // 1.0 segundo de mira e carregamento da linha (mais rápido e tenso)

    // Para imediatamente a velocidade
    const body = this.body as Phaser.Physics.Arcade.Body;
    if (body) body.setVelocity(0, 0);

    // Trava vetor na direção da Nixy
    const dx = player.x - this.x;
    const dy = player.y - this.y;
    const angle = Math.atan2(dy, dx);
    this.dashTargetVector = { x: Math.cos(angle), y: Math.sin(angle) };

    this.setTint(0xff2244);
  }

  private updateTelegraphDash(player: Nixy, deltaMs: number): void {
    this.stateTimer -= deltaMs;

    // Atualiza suavemente a mira nos primeiros 450ms
    if (this.stateTimer > 450) {
      const dx = player.x - this.x;
      const dy = player.y - this.y;
      const angle = Math.atan2(dy, dx);
      this.dashTargetVector = { x: Math.cos(angle), y: Math.sin(angle) };
      this.updateFacingAnimation(angle);
    }

    // Desenha a linha telegrafada crescendo em largura e brilho
    const progress = 1 - Math.max(0, this.stateTimer / 1000);
    const g = this.dashLineGraphics;
    g.clear();

    const lineLength = 650;
    const endX = this.x + this.dashTargetVector.x * lineLength;
    const endY = this.y + this.dashTargetVector.y * lineLength;

    // Linha de advertência carmesim
    g.lineStyle(BOSS_TELEGRAPH.lineThickness(progress), BOSS_TELEGRAPH.color, BOSS_TELEGRAPH.alpha(progress));
    g.lineBetween(this.x, this.y, endX, endY);

    // Centro brilhante
    g.lineStyle(BOSS_TELEGRAPH.innerThickness, BOSS_TELEGRAPH.innerColor, BOSS_TELEGRAPH.innerAlpha(progress));
    g.lineBetween(this.x, this.y, endX, endY);

    // Quando termina de carregar: dispara em alta velocidade!
    if (this.stateTimer <= 0) {
      g.clear();
      this.bossState = 'DASHING';
      this.stateTimer = this.DASH_DURATION;

      SoundManager.getInstance().playBossDash();

      const body = this.body as Phaser.Physics.Arcade.Body;
      if (body) {
        body.setVelocity(
          this.dashTargetVector.x * this.DASH_SPEED,
          this.dashTargetVector.y * this.DASH_SPEED
        );
      }

      this.scene.cameras.main.shake(140, 0.012);
    }
  }

  private updateDashing(player: Nixy, deltaMs: number): void {
    this.stateTimer -= deltaMs;

    // Rastro fantasma vermelho de alta velocidade
    if (Math.random() < 0.5) {
      const ghost = this.scene.add.image(this.x, this.y, this.texture.key);
      ghost.setScale(this.scaleX, this.scaleY);
      ghost.setTint(0xff0033);
      ghost.setAlpha(0.7);
      ghost.setDepth(this.depth - 1);
      this.scene.tweens.add({
        targets: ghost,
        alpha: 0,
        scale: this.scaleX * 0.9,
        duration: 220,
        onComplete: () => ghost.destroy()
      });
    }

    // Checa colisão destrutiva com a Nixy durante a investida
    const distToPlayer = Math.hypot(this.x - player.x, this.y - player.y);
    if (distToPlayer <= 44) {
      player.takeDamage(53); // Dano pesado de investida proporcional
      this.scene.cameras.main.shake(180, 0.018);
      this.endDash();
      return;
    }

    if (this.stateTimer <= 0) {
      this.endDash();
    }
  }

  private endDash(): void {
    this.dashLineGraphics.clear();
    this.clearTint();
    this.dashCooldown = 4800;
    this.bossState = 'CHASE';

    const body = this.body as Phaser.Physics.Arcade.Body;
    if (body) body.setVelocity(0, 0);
  }

  // =========================================================================
  // HABILIDADE 2: DISPARO DE PROJÉTEIS SOMBRIOS
  // =========================================================================
  private fireDarkProjectiles(player: Nixy): void {
    this.shootCooldown = 3800;

    const dx = player.x - this.x;
    const dy = player.y - this.y;
    const baseAngle = Math.atan2(dy, dx);

    // Leque expandido de 6 projéteis sombrios em arco
    const angles = [-0.45, -0.27, -0.09, 0.09, 0.27, 0.45];

    angles.forEach((offset, idx) => {
      this.scene.time.delayedCall(idx * 65, () => {
        if (!this.active || this.isDead) return;

        let proj = this.projectilesGroup.getChildren().find(
          (child) => !child.active
        ) as DarkOrbProjectile | undefined;

        if (!proj) {
          proj = new DarkOrbProjectile(this.scene, this.x, this.y);
          this.projectilesGroup.add(proj);
        }

        proj.fire(this.x, this.y, baseAngle + offset, 275, 26);
      });
    });
  }

  // =========================================================================
  // HABILIDADE 3: SALTO AÉREO ESMAGADOR (METEOR DIVE SLAM)
  // =========================================================================
  private startAirJump(player: Nixy): void {
    this.bossState = 'AIR_JUMP';
    this.stateTimer = this.SLAM_CHARGE_DURATION; // 4.8s no máximo
    this.slamTargetPos = { x: player.x, y: player.y };

    // Para e desativa corpo físico durante o salto
    const body = this.body as Phaser.Physics.Arcade.Body;
    if (body) {
      body.setVelocity(0, 0);
      body.enable = false;
    }

    // Sobe rapidamente para fora da tela (Salto Aéreo)
    this.scene.tweens.add({
      targets: this,
      y: this.y - 450,
      alpha: 0.1,
      duration: 380,
      ease: 'Quad.easeIn'
    });
  }

  private updateAirJump(player: Nixy, deltaMs: number): void {
    this.stateTimer -= deltaMs;

    const elapsed = this.SLAM_CHARGE_DURATION - this.stateTimer;
    const progress = Phaser.Math.Clamp(elapsed / this.SLAM_CHARGE_DURATION, 0, 1);
    const currentRadius = 30 + progress * (this.SLAM_MAX_RADIUS - 30);

    // Desenha o círculo vermelho crescente no chão na posição alvo
    const g = this.slamCircleGraphics;
    g.clear();

    const tx = this.slamTargetPos.x;
    const ty = this.slamTargetPos.y;

    // Fundo translúcido avermelhado pulsante
    const alphaFill = BOSS_TELEGRAPH.circleFillAlpha(progress) + Math.sin(this.scene.time.now * 0.01) * 0.08;
    g.fillStyle(BOSS_TELEGRAPH.circleFillColor, alphaFill);
    g.fillCircle(tx, ty, currentRadius);

    // Borda vermelha forte de perigo
    g.lineStyle(BOSS_TELEGRAPH.circleBorderThickness(progress), BOSS_TELEGRAPH.circleBorderColor, 0.9);
    g.strokeCircle(tx, ty, currentRadius);

    // Cruz central de mira
    g.lineStyle(BOSS_TELEGRAPH.crosshairThickness, BOSS_TELEGRAPH.circleBorderColor, 0.9);
    g.lineBetween(tx - 15, ty, tx + 15, ty);
    g.lineBetween(tx, ty - 15, tx, ty + 15);

    // Quando completa os 4.8 segundos: a Boss cai no centro e descarrega a onda!
    if (this.stateTimer <= 0) {
      this.executeDiveSlam(player);
    }
  }

  private executeDiveSlam(player: Nixy): void {
    this.slamCircleGraphics.clear();
    const tx = this.slamTargetPos.x;
    const ty = this.slamTargetPos.y;

    // Teleporta a Boss acima do centro e faz ela cair estrondosamente
    this.setPosition(tx, ty - 300);
    this.setAlpha(1);

    this.scene.tweens.add({
      targets: this,
      y: ty,
      duration: 180,
      ease: 'Quad.easeIn',
      onComplete: () => {
        // Impacto violento!
        SoundManager.getInstance().playBossSlam();
        this.scene.cameras.main.shake(250, 0.02);

        // Reativa física
        const body = this.body as Phaser.Physics.Arcade.Body;
        if (body) {
          body.enable = true;
          body.setVelocity(0, 0);
        }

        // Onda de choque circular partindo do centro até o final do círculo
        const shockwave = this.scene.add.circle(tx, ty, 10, 0xff0055, 0.95);
        shockwave.setDepth(21);
        shockwave.setBlendMode(Phaser.BlendModes.ADD);

        this.scene.tweens.add({
          targets: shockwave,
          radius: this.SLAM_MAX_RADIUS,
          alpha: 0,
          duration: 480,
          ease: 'Quad.easeOut',
          onComplete: () => shockwave.destroy()
        });

        // Aplicação do dano massivo se a Nixy for pega pelo círculo
        const distToNixy = Math.hypot(tx - player.x, ty - player.y);
        if (distToNixy <= this.SLAM_MAX_RADIUS) {
          player.takeDamage(77);
        }

        // Fica parada e vulnerável no centro até a recuperação
        this.bossState = 'SLAM_RECOVERY';
        this.stateTimer = this.SLAM_RECOVERY_DURATION;
        this.setTint(0xaaaaaa); // Atordoada/exausta
      }
    });
  }

  private updateSlamRecovery(deltaMs: number): void {
    this.stateTimer -= deltaMs;

    const body = this.body as Phaser.Physics.Arcade.Body;
    if (body) body.setVelocity(0, 0);

    // Quando termina a janela de recuperação, volta a se mover normalmente
    if (this.stateTimer <= 0) {
      this.clearTint();
      this.airJumpCooldown = 19000;
      this.bossState = 'CHASE';
    }
  }

  // =========================================================================
  // GESTÃO DE DANO E MORTE DA CHEFE COM RESISTÊNCIA PROPORCIONAL
  // =========================================================================
  public override takeDamage(amount: number): void {
    if (this.isDead || !this.active || this.isInvulnerable || this.bossState === 'INTRO') return;

    let finalDamage = amount;

    // 1. Janela de vulnerabilidade: durante a recuperação do Salto Esmagador (SLAM_RECOVERY), recebe +25% de dano
    if (this.bossState === 'SLAM_RECOVERY') {
      finalDamage = Math.round(amount * 1.25);
    }
    // 2. Barreira Mística Demoníaca: durante canalização da investida ou salto aéreo, mitiga 35% do dano
    else if (this.bossState === 'TELEGRAPH_DASH' || this.bossState === 'AIR_JUMP') {
      finalDamage = Math.max(1, Math.round(amount * 0.65));
    }
    // 3. Couraça Infernal: resistência passiva de 15% contra disparos contínuos e foices
    else {
      finalDamage = Math.max(1, Math.round(amount * 0.85));
    }

    super.takeDamage(finalDamage);
    this.emit('boss-hp-changed', this.hp, this.maxHp);
  }

  public override die(): void {
    if (this.isDead) return;
    this.isDead = true;

    if (this.dashLineGraphics && this.dashLineGraphics.scene) {
      this.dashLineGraphics.destroy();
    }
    if (this.slamCircleGraphics && this.slamCircleGraphics.scene) {
      this.slamCircleGraphics.destroy();
    }

    const body = this.body as Phaser.Physics.Arcade.Body;
    if (body) body.enable = false;

    // Explosão épica de morte com camera shake
    this.scene.cameras.main.shake(350, 0.025);
    this.scene.cameras.main.flash(250, 255, 255, 255);

    this.setTint(0xff0055);
    this.scene.tweens.add({
      targets: this,
      scaleX: 2.2,
      scaleY: 2.2,
      alpha: 0,
      duration: 650,
      ease: 'Quad.easeOut',
      onComplete: () => {
        this.setActive(false);
        this.setVisible(false);
        this.emit('boss-defeated');
      }
    });
  }

  private updateFacingAnimation(angleRad: number): void {
    let deg = (angleRad * 180) / Math.PI;
    if (deg < 0) deg += 360;

    let dir = 'south';
    if (deg >= 337.5 || deg < 22.5) dir = 'east';
    else if (deg >= 22.5 && deg < 67.5) dir = 'south-east';
    else if (deg >= 67.5 && deg < 112.5) dir = 'south';
    else if (deg >= 112.5 && deg < 157.5) dir = 'south-west';
    else if (deg >= 157.5 && deg < 202.5) dir = 'west';
    else if (deg >= 202.5 && deg < 247.5) dir = 'north-west';
    else if (deg >= 247.5 && deg < 292.5) dir = 'north';
    else dir = 'north-east';

    const animKey = `succubus-fly-${dir}`;
    if (this.anims.currentAnim?.key !== animKey) {
      this.play(animKey, true);
    }
  }
}
