/**
 * Common filter and sort pieces, the same in every area:
 *   FilterSheet  — choices stay in a draft until «Aplicar»; «Cancelar» or the scrim change nothing;
 *                  «Limpar» clears the draft only. The main button says how many results the draft gives.
 *   OptionGroup  — 44 pt options; one choice (single) or several (multi, at least one of them must match).
 *   SortSheet    — sorting only, never mixed with filters; choosing applies and closes.
 *   ActiveFilters — what is applied, each removable at once, «Limpar tudo» from two on.
 *   ListToolbar  — «Filtros (n)» and «Ordenar: …» apart, with the result count.
 *   NoResults    — what is active, with «Ajustar» and «Limpar filtros».
 */
import { ReactNode, useEffect, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useTranslation } from "react-i18next";
import Sheet from "./Sheet";
import { Button, Card, Glyph, Row } from "./components";
import { colors, space, strong, touch, type } from "./theme";

export type Option<K> = { key: K; label: string };

export function OptionGroup<K extends string | number>({ title, options, selected, onChange, multi = false }:
  { title: string; options: Option<K>[]; selected: K[]; onChange: (next: K[]) => void; multi?: boolean }) {
  const toggle = (key: K) => {
    const on = selected.includes(key);
    onChange(multi ? (on ? selected.filter(k => k !== key) : [...selected, key]) : (on ? [] : [key]));
  };
  return <View style={s.group} accessibilityRole={multi ? undefined : "radiogroup"}>
    <Text style={[type.caption, strong]} accessibilityRole="header">{title}</Text>
    <View style={s.options}>
      {options.map(o => {
        const on = selected.includes(o.key);
        return <TouchableOpacity key={String(o.key)} style={[s.option, on && s.optionOn]} onPress={() => toggle(o.key)}
          accessibilityRole={multi ? "checkbox" : "radio"} accessibilityState={multi ? { checked: on } : { selected: on }} accessibilityLabel={`${title}: ${o.label}`}>
          <Text style={[type.body, on && s.optionTextOn]}>{o.label}</Text>
        </TouchableOpacity>;
      })}
    </View>
  </View>;
}

type SheetProps<T> = {
  visible: boolean;
  value: T;
  empty: T;
  onApply: (next: T) => void;
  onClose: () => void;
  /** How many choices the draft has (for «Limpar (n)»). */
  activeCount: (draft: T) => number;
  /** How many results the draft gives, when it is cheap to know. */
  resultCount?: (draft: T) => number;
  children: (draft: T, setDraft: (next: T) => void) => ReactNode;
};

export function FilterSheet<T>({ visible, value, empty, onApply, onClose, activeCount, resultCount, children }: SheetProps<T>) {
  const { t } = useTranslation("common");
  const [draft, setDraft] = useState<T>(value);
  useEffect(() => { if (visible) setDraft(value); }, [visible, value]);
  const n = activeCount(draft);
  const results = resultCount?.(draft);
  const apply = () => { onApply(draft); onClose(); };
  return <Sheet visible={visible} title={t("filters.title")} onClose={onClose} closeLabel={t("filters.cancel")}
    left={{ label: t("filters.cancel"), onPress: onClose }} right={{ label: t("filters.apply"), bold: true, onPress: apply }}>
    {children(draft, setDraft)}
    <View style={s.footer}>
      <TouchableOpacity style={s.clear} disabled={n === 0} onPress={() => setDraft(empty)} accessibilityRole="button" accessibilityState={{ disabled: n === 0 }}
        accessibilityLabel={n ? t("filters.clearCount", { count: n }) : t("filters.clear")}>
        <Text style={[type.body, strong, { color: n ? colors.primary : colors.muted }]}>{n ? t("filters.clearCount", { count: n }) : t("filters.clear")}</Text>
      </TouchableOpacity>
      <Button variant="primary" style={s.flex} onPress={apply}
        title={results == null ? t("filters.apply") : results === 0 ? t("filters.showNone") : t("filters.show", { count: results })} />
    </View>
  </Sheet>;
}

export function SortSheet<K extends string>({ visible, options, value, onSelect, onClose }: { visible: boolean; options: Option<K>[]; value: K; onSelect: (key: K) => void; onClose: () => void }) {
  const { t } = useTranslation("common");
  return <Sheet visible={visible} title={t("filters.sortTitle")} onClose={onClose} closeLabel={t("filters.cancel")} left={{ label: t("filters.cancel"), onPress: onClose }}>
    <Card>
      {options.map((o, i) => <Row key={o.key} first={i === 0} title={o.label} end="check" selected={o.key === value} strongTitle={o.key === value}
        onPress={() => { onSelect(o.key); onClose(); }} />)}
    </Card>
  </Sheet>;
}

export type ActiveFilter = { key: string; label: string; onRemove: () => void };

export function ActiveFilters({ items, onClearAll }: { items: ActiveFilter[]; onClearAll: () => void }) {
  const { t } = useTranslation("common");
  if (!items.length) return null;
  return <View style={s.active}>
    {items.map(f => <TouchableOpacity key={f.key} style={s.chipTouch} onPress={f.onRemove} accessibilityRole="button" accessibilityLabel={t("filters.remove", { label: f.label })}>
      <View style={s.chip}>
        <Text style={[type.caption, strong, { color: colors.primary }]}>{f.label}</Text>
        <Glyph name="close" size={16} color={colors.primary} />
      </View>
    </TouchableOpacity>)}
    {items.length > 1 && <TouchableOpacity style={s.clearAll} onPress={onClearAll} accessibilityRole="button" accessibilityLabel={t("filters.clearAll")}>
      <Text style={[type.caption, strong, { color: colors.muted }]}>{t("filters.clearAll")}</Text>
    </TouchableOpacity>}
  </View>;
}

export function ListToolbar({ count, filterCount, onFilters, sortLabel, onSort, end }:
  { count?: string; filterCount: number; onFilters?: () => void; sortLabel?: string; onSort?: () => void; end?: ReactNode }) {
  const { t } = useTranslation("common");
  return <View style={s.toolbar}>
    {onFilters && <TouchableOpacity style={s.action} onPress={onFilters} accessibilityRole="button"
      accessibilityLabel={filterCount ? t("filters.openCount", { count: filterCount }) : t("filters.open")}>
      <Glyph name="tune-variant" size={20} color={colors.primary} />
      <Text style={[type.body, strong, { color: colors.primary }]}>{t("filters.title")}</Text>
      {filterCount > 0 && <View style={s.badge}><Text style={s.badgeText}>{filterCount}</Text></View>}
    </TouchableOpacity>}
    {!!count && <Text style={[type.caption, s.count]} numberOfLines={2}>{count}</Text>}
    {onSort && sortLabel && <TouchableOpacity style={[s.action, s.sort]} onPress={onSort} accessibilityRole="button" accessibilityLabel={t("filters.sort", { label: sortLabel })}>
      <Glyph name="sort-variant" size={20} color={colors.primary} />
      <Text style={[type.body, strong, s.shrink, { color: colors.primary }]} numberOfLines={1}>{sortLabel}</Text>
      <Glyph name="chevron-down" size={18} color={colors.primary} />
    </TouchableOpacity>}
    {end}
  </View>;
}

export function NoResults({ detail, onAdjust, onClear }: { detail?: string; onAdjust?: () => void; onClear: () => void }) {
  const { t } = useTranslation("common");
  return <Card padded style={s.empty}>
    <Text style={type.head} accessibilityRole="header">{t("filters.noResultsTitle")}</Text>
    {!!detail && <Text style={type.caption}>{detail}</Text>}
    <View style={s.emptyActions}>
      {onAdjust && <Button style={s.flex} title={t("filters.adjust")} onPress={onAdjust} />}
      <Button style={s.flex} variant="primary" title={t("filters.clearFilters")} onPress={onClear} />
    </View>
  </Card>;
}

const s = StyleSheet.create({
  flex: { flex: 1 },
  shrink: { flexShrink: 1 },
  group: { gap: space.sm },
  options: { flexDirection: "row", flexWrap: "wrap", gap: space.sm },
  option: { minHeight: touch, minWidth: touch, paddingHorizontal: space.md, borderRadius: touch / 2, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.card, alignItems: "center", justifyContent: "center" },
  optionOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  optionTextOn: { color: colors.onPrimary, fontWeight: "600" },
  footer: { flexDirection: "row", alignItems: "center", gap: space.md, paddingTop: space.sm },
  clear: { minHeight: touch, justifyContent: "center", paddingHorizontal: space.sm },
  active: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", columnGap: space.sm },
  chipTouch: { minHeight: touch, justifyContent: "center" },
  chip: { minHeight: 36, flexDirection: "row", alignItems: "center", gap: 4, paddingLeft: space.md, paddingRight: space.sm, borderRadius: 18, backgroundColor: colors.primarySoft },
  clearAll: { minHeight: touch, justifyContent: "center", paddingHorizontal: space.xs },
  toolbar: { flexDirection: "row", alignItems: "center", flexWrap: "wrap", columnGap: space.md },
  action: { minHeight: touch, flexDirection: "row", alignItems: "center", gap: 6 },
  sort: { marginLeft: "auto", flexShrink: 1, minWidth: 0 },
  count: { flexShrink: 1 },
  badge: { minWidth: 20, height: 20, borderRadius: 10, paddingHorizontal: 6, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center" },
  badgeText: { fontSize: 12, lineHeight: 16, fontWeight: "600", color: colors.onPrimary },
  empty: { gap: space.sm },
  emptyActions: { flexDirection: "row", gap: space.md, marginTop: space.xs },
});

