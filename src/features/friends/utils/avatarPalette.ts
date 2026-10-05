/**
 * avatarPalette.ts
 *
 * Cor determinística para avatares "letra" (sem foto de perfil) — a mesma
 * pessoa fica sempre com a mesma cor em todos os ecrãs de Amigos, em vez do
 * azul plano repetido em todo o lado. Não mexe em COLORS (que é partilhado
 * por toda a app) — é só uma paleta pequena, local a esta funcionalidade.
 */

export type AvatarColor = { bg: string; fg: string };

const AVATAR_PALETTE: AvatarColor[] = [
  { bg: "#E3F2FD", fg: "#1E88E5" }, // azul
  { bg: "#FFF3E0", fg: "#FB8C00" }, // laranja
  { bg: "#E8F5E9", fg: "#43A047" }, // verde
  { bg: "#F3E5F5", fg: "#8E24AA" }, // roxo
  { bg: "#FCE4EC", fg: "#D81B60" }, // rosa
  { bg: "#FFFDE7", fg: "#F9A825" }, // dourado
  { bg: "#E0F2F1", fg: "#00897B" }, // verde-água
];

export function avatarColors(seed: string): AvatarColor {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return AVATAR_PALETTE[hash % AVATAR_PALETTE.length];
}