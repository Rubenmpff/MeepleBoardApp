import { ReactNode, useState } from "react";
import { StyleProp, StyleSheet, Text, TextInput, TouchableOpacity, View, ViewStyle, useWindowDimensions } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { colors, isLarge, radius, space, strong, touch, type } from "./theme";
import AvatarPhoto from "./AvatarPhoto";

type Icon = keyof typeof MaterialCommunityIcons.glyphMap;
export type { Icon };

export function Glyph({ name, size = 20, color = colors.chevron }: { name: Icon; size?: number; color?: string }) {
 return <MaterialCommunityIcons name={name} size={size} color={color} accessible={false} importantForAccessibility="no" />;
}
export const Chevron = () => <Glyph name="chevron-right" />;
export const Expander = ({ open }: { open: boolean }) => <Glyph name={open ? "chevron-up" : "chevron-down"} size={22} />;

// Section title sits outside the card; optional trailing note on the same baseline.
export function Section({ title, note, children }: { title?: string; note?: string; children: ReactNode }) {
 return <View style={s.section}>
  {!!title && <View style={s.sectionHead}>
   <Text style={[type.head, s.flex]} accessibilityRole="header">{title}</Text>
   {!!note && <Text style={[type.caption, s.sectionNote]}>{note}</Text>}
  </View>}
  {children}
 </View>;
}

export function Card({ children, style, padded = false }: { children: ReactNode; style?: StyleProp<ViewStyle>; padded?: boolean }) {
 return <View style={[s.card, padded && s.padded, style]}>{children}</View>;
}

export function Hero({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
 return <View style={[s.hero, style]}>{children}</View>;
}

type RowProps = {
 title: string; subtitle?: string; detail?: ReactNode; lead?: ReactNode; value?: string; end?: "chevron" | "expand" | "collapse" | "check" | "none";
 onPress?: () => void; accessibilityLabel?: string; accessibilityHint?: string; selected?: boolean; first?: boolean; inset?: number; strongTitle?: boolean; tone?: "default" | "link" | "danger";
};
// List row: ≥ 52 pt, hairline separator inset to the text column.
export function Row({ title, subtitle, detail, lead, value, end: endProp, onPress, accessibilityLabel, accessibilityHint, selected, first, inset = space.lg, strongTitle, tone = "default" }: RowProps) {
 // Only rows that do something show a chevron by default.
 const end = endProp ?? (onPress ? "chevron" : "none");
 const content = <>
  {!first && <View style={[s.separator, { left: inset }]} />}
  {lead}
  <View style={s.rowMain}>
   <Text style={[type.body, strongTitle && strong, tone === "link" && { color: colors.primary, fontWeight: "600" }, tone === "danger" && { color: colors.danger }]}>{title}</Text>
   {!!subtitle && <Text style={type.caption}>{subtitle}</Text>}
   {detail}
  </View>
  {value != null && <Text style={/^[-+−–—\d\s.,:%/]*$/.test(value) ? s.rowValue : s.rowText}>{value}</Text>}
  {end === "chevron" && <Glyph name="chevron-right" color={tone === "link" ? colors.primary : colors.chevron} />}
  {(end === "expand" || end === "collapse") && <Expander open={end === "collapse"} />}
  {end === "check" && (selected ? <Glyph name="check" size={22} color={colors.primary} /> : <View style={{ width: 22 }} />)}
 </>;
 if (!onPress) return <View style={s.row} accessible accessibilityLabel={accessibilityLabel}>{content}</View>;
 return <TouchableOpacity style={s.row} onPress={onPress} accessibilityRole="button" accessibilityLabel={accessibilityLabel ?? (value != null ? `${title}: ${value}` : title)}
  accessibilityHint={accessibilityHint} accessibilityState={end === "check" ? { selected: !!selected } : end === "expand" || end === "collapse" ? { expanded: end === "collapse" } : undefined}>{content}</TouchableOpacity>;
}

// Expands in place; the body keeps the card padding.
export function Disclosure({ title, first, children, accessibilityLabel, flush }: { title: string; first?: boolean; children: ReactNode; accessibilityLabel?: string; flush?: boolean }) {
 const [open, setOpen] = useState(false);
 return <View>
  <Row title={title} first={first} end={open ? "collapse" : "expand"} onPress={() => setOpen(v => !v)} accessibilityLabel={accessibilityLabel ?? title} />
  {open && <View style={flush ? s.disclosureFlush : s.disclosureBody}>{children}</View>}
 </View>;
}

// Caption aligned with row text (x = 32 inside a card).
export function Note({ children, inset }: { children: ReactNode; inset?: boolean }) { return <Text style={[type.caption, inset && s.inset]}>{children}</Text>; }

export function SearchField({ value, onChangeText, placeholder }: { value: string; onChangeText: (text: string) => void; placeholder: string }) {
 return <View style={s.search}>
  <Glyph name="magnify" size={20} color={colors.placeholder} />
  <TextInput style={[type.body, s.searchInput]} placeholderTextColor={colors.muted} keyboardAppearance="light" value={value} onChangeText={onChangeText} placeholder={placeholder} accessibilityLabel={placeholder} autoCorrect={false} returnKeyType="search" clearButtonMode="while-editing" />
 </View>;
}

export function Segmented<T extends string>({ items, value, onChange, role = "tab" }: { items: { key: T; label: string; count?: string }[]; value: T; onChange: (key: T) => void; role?: "tab" | "button" }) {
 return <View style={s.segmented} accessibilityRole={role === "tab" ? "tablist" : undefined}>
  {items.map(item => {
   const on = item.key === value;
   return <TouchableOpacity key={item.key} style={s.segmentTouch} accessibilityRole={role} accessibilityLabel={item.label} accessibilityState={{ selected: on }} onPress={() => onChange(item.key)}>
    <View style={[s.segment, on && s.segmentOn]}>
     <Text style={[type.body, s.center, on && strong]}>{item.label}</Text>
     {item.count != null && <Text style={[type.caption, s.center]}>{item.count}</Text>}
    </View>
   </TouchableOpacity>;
  })}
 </View>;
}

// Filter chips with optional counts; wrap onto a second line instead of scrolling sideways.
export function FilterChips<T extends string>({ items, value, onChange }: { items: { key: T; label: string; count?: number }[]; value: T; onChange: (key: T) => void }) {
 return <View style={s.chips}>
  {items.map(item => {
   const on = item.key === value;
   return <TouchableOpacity key={item.key} style={s.chipTouch} accessibilityRole="tab" accessibilityLabel={item.count != null ? `${item.label}, ${item.count}` : item.label} accessibilityState={{ selected: on }} onPress={() => onChange(item.key)}>
    <Text style={[s.chip, on && s.chipOn]}>{item.label}{item.count != null ? ` ${item.count}` : ""}</Text>
   </TouchableOpacity>;
  })}
 </View>;
}

export type TrioItem = { icon: Icon; color: string; value: string; label: string; accessibilityLabel: string; onPress: () => void };
// Three results with equal columns; with large text they become rows.
export function ResultsTrio({ items }: { items: TrioItem[] }) {
 const { width, fontScale } = useWindowDimensions();
 const large = isLarge(width, fontScale);
 return <View style={[s.trio, large && s.trioLarge]}>
  {items.map((item, index) => <TouchableOpacity key={item.label} style={[s.trioItem, !large && index > 0 && s.trioDivider, large && s.trioItemLarge, !large && index === 0 && { paddingLeft: 0 }]}
   accessibilityRole="button" accessibilityLabel={item.accessibilityLabel} onPress={item.onPress}>
   <View style={s.trioTop}><Glyph name={item.icon} size={18} color={item.color} /><Text style={type.title}>{item.value}</Text></View>
   <Text style={type.caption}>{item.label}</Text>
  </TouchableOpacity>)}
 </View>;
}

// Proportions only; values and access live in the labelled controls next to it.
export function ProportionBar({ parts, height = 8 }: { parts: { value: number; color: string }[]; height?: number }) {
 const visible = parts.filter(p => p.value > 0);
 if (!visible.length) return <View style={[s.bar, { height, backgroundColor: colors.track }]} accessible={false} />;
 return <View style={[s.bar, { height }]} accessible={false} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
  {visible.map((p, i) => <View key={i} style={{ flex: p.value, backgroundColor: p.color }} />)}
 </View>;
}

// Relative size within a list (e.g. most played); the number beside it carries the value.
export function RankBar({ value, max }: { value: number; max: number }) {
 return <View style={s.rank} accessible={false}><View style={[s.rankFill, { width: `${Math.round(100 * value / Math.max(1, max))}%` }]} /></View>;
}

// The only gold surface: results that are still awaiting confirmation.
export function PendingNotice({ label, onPress, accessibilityLabel, style }: { label: string; onPress: () => void; accessibilityLabel?: string; style?: StyleProp<ViewStyle> }) {
 return <TouchableOpacity style={[s.pending, style]} accessibilityRole="button" accessibilityLabel={accessibilityLabel ?? label} onPress={onPress}>
  <Glyph name="help-circle-outline" color={colors.pendingIcon} />
  <Text style={[type.body, s.flex, { color: colors.pendingText }]}>{label}</Text>
  <Glyph name="chevron-right" color={colors.pendingIcon} />
 </TouchableOpacity>;
}

export function Button({ title, onPress, variant = "secondary", icon, iconEnd, disabled, accessibilityLabel, style }: { title: string; onPress: () => void; variant?: "primary" | "secondary" | "plain"; icon?: Icon; iconEnd?: Icon; disabled?: boolean; accessibilityLabel?: string; style?: StyleProp<ViewStyle> }) {
 const fg = variant === "primary" ? colors.onPrimary : colors.primary;
 return <TouchableOpacity style={[s.button, variant === "primary" && s.buttonPrimary, variant === "secondary" && s.buttonSecondary, disabled && { opacity: 0.4 }, style]} disabled={disabled}
  accessibilityRole="button" accessibilityLabel={accessibilityLabel ?? title} accessibilityState={{ disabled: !!disabled }} onPress={onPress}>
  {icon && <Glyph name={icon} size={18} color={fg} />}
  <Text style={[type.body, strong, s.center, { color: fg, flexShrink: 1 }]}>{title}</Text>
  {iconEnd && <Glyph name={iconEnd} size={18} color={fg} />}
 </TouchableOpacity>;
}

export function EmptyState({ title, message, action }: { title: string; message: string; action?: ReactNode }) {
 return <Card style={s.empty}>
  <Glyph name="dice-multiple-outline" size={32} color={colors.icon} />
  <Text style={type.head} accessibilityRole="header">{title}</Text>
  <Text style={[type.body, { color: colors.muted }]}>{message}</Text>
  {action && <View style={s.emptyAction}>{action}</View>}
 </Card>;
}

// The person's photo when there is one (and it loads); otherwise their initial. tint = [background, initial colour].
export function Avatar({ name, size = 40, uri, tint }: { name: string; size?: number; uri?: string | null; tint?: readonly [string, string] }) {
 return <View style={[s.avatar, { width: size, height: size, borderRadius: size / 2 }, tint && { backgroundColor: tint[0] }]} accessible={false}>
  {uri ? <AvatarPhoto name={name} uri={uri} size={size} color={tint?.[1]} />
   : <Text style={[type.body, strong, { color: tint?.[1] ?? colors.primary }, size > 48 && { fontSize: 20, lineHeight: 24 }]}>{name.slice(0, 1).toLocaleUpperCase() || "?"}</Text>}
 </View>;
}

export const s = StyleSheet.create({
 flex: { flex: 1, minWidth: 0 },
 center: { textAlign: "center" },
 section: { gap: space.sm },
 sectionHead: { flexDirection: "row", alignItems: "flex-end", gap: space.md, paddingHorizontal: space.lg },
 sectionNote: { flexShrink: 1, textAlign: "right" },
 card: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.line, borderRadius: radius.card, borderCurve: "continuous", overflow: "hidden" },
 padded: { padding: space.lg },
 hero: { backgroundColor: colors.hero, borderRadius: radius.hero, borderCurve: "continuous", padding: space.lg, gap: space.md },
 row: { flexDirection: "row", alignItems: "center", gap: space.md, minHeight: 52, paddingVertical: space.sm, paddingHorizontal: space.lg },
 rowMain: { flex: 1, minWidth: 0, gap: 2 },
 rowText: { ...type.body, color: colors.muted, textAlign: "right", flexShrink: 1, maxWidth: "55%" },
 rowValue: { fontSize: 17, lineHeight: 22, fontWeight: "600", color: colors.text, fontVariant: ["tabular-nums"], textAlign: "right", flexShrink: 0 },
 separator: { position: "absolute", top: 0, right: 0, height: StyleSheet.hairlineWidth * 2, backgroundColor: colors.hair },
 disclosureBody: { paddingHorizontal: space.lg, paddingBottom: space.md, gap: space.sm },
 disclosureFlush: { paddingBottom: space.xs },
 inset: { paddingHorizontal: space.lg },
 segmented: { flexDirection: "row", paddingHorizontal: 3, gap: 2, borderRadius: radius.control, backgroundColor: colors.track, minHeight: touch },
 segmentTouch: { flex: 1, minWidth: 0, minHeight: touch, paddingVertical: 3, justifyContent: "center" },
 segment: { flexGrow: 1, minHeight: 38, paddingVertical: space.xs, paddingHorizontal: 6, borderRadius: 9, alignItems: "center", justifyContent: "center" },
 segmentOn: { backgroundColor: colors.card, shadowColor: "#30283D", shadowOpacity: 0.16, shadowRadius: 2, shadowOffset: { width: 0, height: 1 } },
 trio: { flexDirection: "row" },
 trioLarge: { flexDirection: "column", gap: space.xs },
 trioItem: { flex: 1, minWidth: 0, minHeight: touch, gap: 2, paddingHorizontal: space.md, justifyContent: "center" },
 trioItemLarge: { flex: 0, paddingHorizontal: 0 },
 trioDivider: { borderLeftWidth: 1, borderLeftColor: colors.hair },
 trioTop: { flexDirection: "row", alignItems: "center", gap: 6 },
 bar: { flexDirection: "row", gap: 2, borderRadius: 4, overflow: "hidden" },
 rank: { height: 4, borderRadius: 2, backgroundColor: colors.hair, overflow: "hidden", marginTop: 4 },
 rankFill: { height: "100%", borderRadius: 2, backgroundColor: "#BFAFDD" },
 pending: { flexDirection: "row", alignItems: "center", gap: 10, minHeight: touch, paddingVertical: 10, paddingHorizontal: space.md, borderRadius: radius.control, backgroundColor: colors.pendingSoft },
 button: { minHeight: touch, borderRadius: radius.control, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: space.sm, paddingVertical: 10, paddingHorizontal: space.lg },
 buttonPrimary: { backgroundColor: colors.primary },
 buttonSecondary: { backgroundColor: colors.primarySoft },
 empty: { padding: space.lg, paddingTop: 20, gap: space.sm, alignItems: "flex-start" },
 emptyAction: { alignSelf: "stretch", marginTop: space.sm },
 search: { flexDirection: "row", alignItems: "center", gap: space.sm, minHeight: touch, paddingLeft: space.md, borderWidth: 1, borderColor: "#E1DBE7", borderRadius: radius.control, backgroundColor: colors.card },
 searchInput: { flex: 1, minWidth: 0, minHeight: touch, paddingVertical: 10, paddingRight: space.md, color: colors.text },
 chips: { flexDirection: "row", flexWrap: "wrap", columnGap: space.sm },
 chipTouch: { minHeight: touch, minWidth: touch, justifyContent: "center" },
 chip: { minHeight: 36, minWidth: touch, textAlign: "center", paddingHorizontal: space.md, paddingVertical: space.sm, borderRadius: 18, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.card, color: colors.text, fontSize: 15, lineHeight: 20, overflow: "hidden" },
 chipOn: { backgroundColor: colors.primary, borderColor: colors.primary, color: colors.onPrimary, fontWeight: "600" },
 avatar: { backgroundColor: colors.primarySoft, alignItems: "center", justifyContent: "center", flexShrink: 0, overflow: "hidden" },
});
