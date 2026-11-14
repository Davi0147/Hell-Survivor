import Phaser from 'phaser';
import { SoundManager } from '../systems/SoundManager';

/**
 * Textos de impacto na tela da UIScene: frase de chefe no centro,
 * faixa de alerta de onda no topo e anúncio dourado de evento.
 */
export class ScreenAnnouncer {
  private readonly waveAlertBanner: Phaser.GameObjects.Text;
  private alertTimer?: Phaser.Time.TimerEvent;
  private alertTween?: Phaser.Tweens.Tween;

  constructor(private readonly ui: Phaser.Scene, pixelFont: string) {
    const { width } = ui.scale;
    this.waveAlertBanner = ui.add.text(width / 2, 60, '', {
      fontFamily: pixelFont,
      fontSize: '11px',
      fontStyle: 'bold',
      color: '#ff0055',
      backgroundColor: '#1a0208dd',
      padding: { x: 12, y: 5 },
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5).setDepth(120);
    this.waveAlertBanner.setVisible(false);
  }

  /** Faixa de onda: some junto com a HUD. */
  public getHudElement(): Phaser.GameObjects.Text {
    return this.waveAlertBanner;
  }

  public hideWaveAlert(): void {
    this.waveAlertBanner.setVisible(false);
  }

  public destroy(): void {
    if (this.alertTimer) {
      this.alertTimer.remove();
      this.alertTimer = undefined;
    }
  }

  /**
   * Exibe frase dramática de Azazel no centro da tela ("AQUI É O MEU MUNDO", "SUA POBRE ALMA FRÁGIL NÃO ENCONTRARÁ PAZ")
   */
  public showCenterBossPhrase(phrase: string, durationMs: number = 2200): void {
    const s = this.ui;
    const { width, height } = s.scale;
    const container = s.add.container(0, 0);
    container.setDepth(3600);

    const pixelFont = "'Silkscreen', 'Press Start 2P', monospace";
    const fontSize = phrase.length > 26 ? '20px' : '26px';

    // 1. Texto fantasma de choque (expande e desaparece)
    const shockGhost = s.add.text(width / 2, height / 2, phrase, {
      fontFamily: pixelFont,
      fontSize,
      fontStyle: 'bold',
      color: '#ffffff',
      stroke: '#ff0055',
      strokeThickness: 6,
      align: 'center',
      wordWrap: { width: width - 140 }
    }).setOrigin(0.5).setAlpha(0.9);
    container.add(shockGhost);

    s.tweens.add({
      targets: shockGhost,
      scaleX: 1.6,
      scaleY: 1.6,
      alpha: 0,
      duration: 380,
      ease: 'Quad.easeOut',
      onComplete: () => shockGhost.destroy()
    });

    // 2. Texto principal em destaque, totalmente sem moldura/fundo
    const text = s.add.text(width / 2, height / 2, phrase, {
      fontFamily: pixelFont,
      fontSize,
      fontStyle: 'bold',
      color: '#ffffff',
      stroke: '#3b0764',
      strokeThickness: 8,
      align: 'center',
      wordWrap: { width: width - 140 },
      shadow: {
        offsetX: 0,
        offsetY: 0,
        color: '#ff0055',
        blur: 24,
        stroke: true,
        fill: true
      }
    }).setOrigin(0.5).setScale(2.6).setAlpha(0);
    container.add(text);

    // Efeito de partículas/faíscas místicas flutuando ao redor das palavras
    for (let i = 0; i < 20; i++) {
      const px = width / 2 + Phaser.Math.Between(-280, 280);
      const py = height / 2 + Phaser.Math.Between(-35, 35);
      const spark = s.add.circle(px, py, Phaser.Math.Between(2, 4), Phaser.Math.RND.pick([0xff0055, 0xc084fc, 0x00f5d4]), 0.85);
      spark.setBlendMode(Phaser.BlendModes.ADD);
      container.add(spark);

      s.tweens.add({
        targets: spark,
        y: spark.y - Phaser.Math.Between(30, 70),
        alpha: 0,
        scale: 0.2,
        duration: Phaser.Math.Between(600, 1400),
        ease: 'Quad.easeOut',
        onComplete: () => spark.destroy()
      });
    }

    // Impacto do texto: cai da frente para o centro com som e tremor
    SoundManager.getInstance().playStampImpact();
    SoundManager.getInstance().playDialogueVoice('azazel');
    s.cameras.main.shake(320, 0.024);

    s.tweens.add({
      targets: text,
      scaleX: 1.0,
      scaleY: 1.0,
      alpha: 1,
      duration: 220,
      ease: 'Cubic.easeIn',
      onComplete: () => {
        // Vibração sutil e intimidadora contínua
        s.tweens.add({
          targets: text,
          x: { from: width / 2 - 2, to: width / 2 + 2 },
          duration: 45,
          yoyo: true,
          repeat: Math.floor(durationMs / 55)
        });
      }
    });

    s.time.delayedCall(Math.max(500, durationMs - 300), () => {
      if (!container.scene) return;
      s.tweens.add({
        targets: container,
        alpha: 0,
        scaleX: 1.12,
        scaleY: 1.12,
        duration: 280,
        ease: 'Quad.easeOut',
        onComplete: () => container.destroy()
      });
    });
  }

  public showWaveAlert(message: string, durationMs: number = 3000): void {
    const s = this.ui;
    if (!this.waveAlertBanner) return;

    if (this.alertTimer) {
      this.alertTimer.remove(false);
      this.alertTimer = undefined;
    }
    if (this.alertTween) {
      this.alertTween.stop();
      this.alertTween = undefined;
    }

    this.waveAlertBanner.setText(message);
    this.waveAlertBanner.setAlpha(1);
    this.waveAlertBanner.setScale(1.15);
    this.waveAlertBanner.setVisible(true);

    this.alertTween = s.tweens.add({
      targets: this.waveAlertBanner,
      scaleX: 1.0,
      scaleY: 1.0,
      duration: 220,
      ease: 'Back.easeOut'
    });

    this.alertTimer = s.time.delayedCall(durationMs, () => {
      if (this.waveAlertBanner) {
        this.alertTween = s.tweens.add({
          targets: this.waveAlertBanner,
          alpha: 0,
          duration: 350,
          ease: 'Linear',
          onComplete: () => {
            if (this.waveAlertBanner) {
              this.waveAlertBanner.setVisible(false);
            }
          }
        });
      }
    });
  }

  /**
   * Exibe uma notificação dramática no centro da tela (um pouco mais para cima),
   * sem fundo, com texto grande e efeito de flutuação suave.
   */
  public showCenterAnnouncement(title: string, subtitle?: string, durationMs: number = 4600): void {
    const s = this.ui;
    const { width, height } = s.scale;
    const centerY = Math.round(height * 0.32);

    // Remove qualquer anúncio anterior se ainda estiver na tela
    const existing = s.children.getByName('center-announcement-container');
    if (existing) {
      existing.destroy();
    }

    const container = s.add.container(width / 2, centerY);
    container.setName('center-announcement-container');
    container.setDepth(999);
    container.setAlpha(0);
    container.setScale(0.8);

    // 1. Título Principal em Letra Bem Grande, Dourada e com Contorno Forte (Sem nenhum fundo!)
    const titleText = s.add.text(0, subtitle ? -22 : 0, title, {
      fontFamily: 'Pixelzone, Silkscreen, monospace',
      fontSize: '36px',
      fontStyle: 'bold',
      color: '#ffe600',
      stroke: '#000000',
      strokeThickness: 7,
      align: 'center',
      shadow: {
        offsetX: 0,
        offsetY: 4,
        color: '#ff2200',
        blur: 14,
        stroke: true,
        fill: true
      }
    }).setOrigin(0.5);
    titleText.setResolution(2);
    container.add(titleText);

    // 2. Subtítulo em Letra Maior e Perfeitamente Legível
    if (subtitle) {
      const subText = s.add.text(0, 26, subtitle, {
        fontFamily: 'Pixelzone, Silkscreen, monospace',
        fontSize: '20px',
        fontStyle: 'bold',
        color: '#ffd166',
        stroke: '#000000',
        strokeThickness: 5,
        align: 'center',
        shadow: {
          offsetX: 0,
          offsetY: 3,
          color: '#000000',
          blur: 8,
          stroke: true,
          fill: true
        }
      }).setOrigin(0.5);
      subText.setResolution(2);
      container.add(subText);
    }

    // Toca som dramático de anúncio
    SoundManager.getInstance().playWeaponEvolve();

    // 3. Animação de entrada fluida (Bounce in)
    s.tweens.add({
      targets: container,
      alpha: 1,
      scaleX: 1,
      scaleY: 1,
      duration: 280,
      ease: 'Back.easeOut',
      onComplete: () => {
        // Efeito contínuo de flutuação suave (onda senoidal para cima e para baixo)
        s.tweens.add({
          targets: container,
          y: centerY - 10,
          duration: 1200,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut'
        });
      }
    });

    // 4. Animação de saída (Fade out e subida suave antes de destruir)
    s.time.delayedCall(durationMs, () => {
      if (container.scene) {
        s.tweens.add({
          targets: container,
          alpha: 0,
          y: container.y - 20,
          scaleX: 0.95,
          scaleY: 0.95,
          duration: 450,
          ease: 'Power2.easeIn',
          onComplete: () => {
            container.destroy();
          }
        });
      }
    });
  }
}
