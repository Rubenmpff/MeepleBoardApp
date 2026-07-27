/**
 * StarRating.tsx
 * src/features/games/components/StarRating.tsx
 *
 * Componente de avaliação com estrelas e meias estrelas.
 * Escala 0–10 com incrementos de 0.5 (20 opções).
 * Representado visualmente em 10 estrelas.
 *
 * Exemplos:
 *   7.5 → ★★★★★★★½☆☆
 *   10  → ★★★★★★★★★★
 *   0   → ☆☆☆☆☆☆☆☆☆☆
 */

import React from "react";
import { View, TouchableOpacity, Text, StyleSheet } from "react-native";

interface StarRatingProps {
  value?: number | null;       // 0–10, incrementos de 0.5
  onChange?: (value: number) => void;
  readonly?: boolean;
  size?: number;
  showLabel?: boolean;
}

const STAR_COLOR = "#F9A825";
const STAR_EMPTY = "#E0E0E0";

function getRatingLabel(value: number): string {
  if (value === 0)  return "Sem avaliação";
  if (value <= 1)   return "😞 Terrível";
  if (value <= 2)   return "😟 Muito fraco";
  if (value <= 3)   return "😕 Fraco";
  if (value <= 4)   return "😐 Abaixo do esperado";
  if (value <= 5)   return "🙂 Ok";
  if (value <= 6)   return "😊 Razoável";
  if (value <= 7)   return "😄 Bom";
  if (value <= 8)   return "😁 Muito bom";
  if (value <= 9)   return "🤩 Excelente!";
  return "💯 Obra-prima!";
}

/**
 * Uma estrela pode estar: vazia, meia, ou cheia.
 * Quando o utilizador prime a metade esquerda → meia estrela (n - 0.5)
 * Quando prime a metade direita → estrela cheia (n)
 */
function Star({
  index,
  value,
  size,
  onChange,
  readonly,
}: {
  index: number;    // 1-based (1 a 10)
  value: number;
  size: number;
  onChange?: (v: number) => void;
  readonly?: boolean;
}) {
  const full = value >= index;
  const half = !full && value >= index - 0.5;

  const handlePressLeft = () => {
    if (readonly || !onChange) return;
    const newVal = index - 0.5;
    // toggle: se já está neste valor, limpa para 0
    onChange(value === newVal ? 0 : newVal);
  };

  const handlePressRight = () => {
    if (readonly || !onChange) return;
    const newVal = index;
    onChange(value === newVal ? 0 : newVal);
  };

  return (
    <View style={{ width: size, height: size, position: "relative" }}>
      {/* Estrela base (vazia ou cheia) */}
      <Text style={[
        styles.starBase,
        { fontSize: size, color: full ? STAR_COLOR : STAR_EMPTY },
      ]}>
        ★
      </Text>

      {/* Meia estrela por cima (clip da metade esquerda) */}
      {half && (
        <View style={[styles.halfClip, { width: size / 2 }]}>
          <Text style={[styles.starBase, { fontSize: size, color: STAR_COLOR }]}>
            ★
          </Text>
        </View>
      )}

      {/* Áreas de toque — metade esquerda e direita */}
      {!readonly && (
        <>
          <TouchableOpacity
            style={[styles.touchHalf, { width: size / 2, height: size, left: 0 }]}
            onPress={handlePressLeft}
            activeOpacity={0.7}
          />
          <TouchableOpacity
            style={[styles.touchHalf, { width: size / 2, height: size, right: 0 }]}
            onPress={handlePressRight}
            activeOpacity={0.7}
          />
        </>
      )}
    </View>
  );
}

export function StarRating({
  value,
  onChange,
  readonly = false,
  size = 32,
  showLabel = true,
}: StarRatingProps) {
  const current = value ?? 0;

  return (
    <View style={styles.container}>
      <View style={styles.starsRow}>
        {Array.from({ length: 10 }, (_, i) => (
          <Star
            key={i}
            index={i + 1}
            value={current}
            size={size}
            onChange={onChange}
            readonly={readonly}
          />
        ))}
      </View>

      {showLabel && current > 0 && (
        <View style={styles.labelRow}>
          <Text style={styles.labelValue}>{current.toFixed(1)}/10</Text>
          <Text style={styles.labelText}>{getRatingLabel(current)}</Text>
        </View>
      )}

      {showLabel && current === 0 && !readonly && (
        <Text style={styles.labelEmpty}>Toca nas estrelas para avaliar</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: "flex-start" },
  starsRow: { flexDirection: "row", gap: 4 },
  starBase: { lineHeight: undefined },
  halfClip: { position: "absolute", top: 0, left: 0, overflow: "hidden" },
  touchHalf: { position: "absolute", top: 0 },
  labelRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 6 },
  labelValue: { fontSize: 15, fontWeight: "800", color: "#F9A825" },
  labelText: { fontSize: 13, color: "#666", fontWeight: "600" },
  labelEmpty: { fontSize: 12, color: "#bbb", marginTop: 6 },
});