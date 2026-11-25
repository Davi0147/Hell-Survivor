/**
 * Seguir com folga: começa a andar só quando o ponto passa de `startPx` e continua andando
 * até chegar a `stopPx`. Entre os dois, mantém o que estava fazendo (evita liga-desliga).
 */
export function shouldFollow(following: boolean, dist: number, startPx: number, stopPx: number): boolean {
  if (following) return dist > stopPx;
  return dist > startPx;
}
