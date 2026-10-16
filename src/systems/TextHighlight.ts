import Phaser from 'phaser';

/**
 * Habilita destaque visual em cor dourada (#ffd700) para qualquer ocorrência de [CENSURADO]
 * em um objeto Phaser.GameObjects.Text, com suporte em tempo real ao efeito de digitação (typewriter).
 */
export function enableCensoredTextHighlight(
  textObj: Phaser.GameObjects.Text,
  highlightColor: string = '#ffd700'
): void {
  const ctx = textObj.context;
  if (!ctx || (ctx as any).__censorHighlightAttached) return;
  (ctx as any).__censorHighlightAttached = true;

  const origFillText = ctx.fillText;
  ctx.fillText = function (text: string, x: number, y: number, maxWidth?: number) {
    if (typeof text === 'string' && text.includes('[')) {
      // Regex que reconhece [CENSURADO] completo ou fragmentos parciais enquanto é digitado
      const regex = /(\[CENSURADO\]|\[CENSURAD|\[CENSURA|\[CENSUR|\[CENSU|\[CENS|\[CEN|\[CE|\[C|\[)/g;
      const parts = text.split(regex);
      const origStyle = this.fillStyle;
      let curX = x;
      for (const part of parts) {
        if (!part) continue;
        if (part.startsWith('[')) {
          this.fillStyle = highlightColor;
        } else {
          this.fillStyle = origStyle;
        }
        origFillText.call(this, part, curX, y);
        curX += this.measureText(part).width;
      }
      this.fillStyle = origStyle;
    } else {
      origFillText.call(this, text, x, y, maxWidth);
    }
  };
}
