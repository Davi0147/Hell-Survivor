/** Destino comum dos efeitos sonoros procedurais. */
export interface SfxOutput {
  ctx: AudioContext;
  /** Nó de saída (canal de SFX com volume). */
  out: AudioNode;
  /** Volume de SFX (0..1) já aplicado nos ganhos de cada som. */
  volume: number;
}
