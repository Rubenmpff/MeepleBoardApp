/**
 * Suggest a resource (pending until approved), or — for administrators — add one directly or edit it.
 * Routes: /games/resources/form?gameId&gameName[&admin=1][&resourceId]
 */
import { useEffect, useState } from "react";
import { Alert, StyleSheet, Text, TextInput, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import ScreenLayout from "@/src/ui/ScreenLayout";
import ScreenState from "@/src/ui/ScreenState";
import { Button, Card, FilterChips, Note, Row, Section } from "@/src/ui/components";
import { colors, radius, space, type } from "@/src/ui/theme";
import { useUnsavedChanges } from "@/src/shared/hooks/useUnsavedChanges";
import { languageName } from "../components/ResourceRow";
import resourceService from "../services/resourceService";
import { apiMessage } from "../utils/apiMessage";
import { GameResourceInput, PRINT_CATEGORIES, PrintCategory, ResourceKind } from "../types/GameResource";

const KINDS: ResourceKind[] = ["Rules", "HowToPlay", "Playthrough", "PrintModel", "Unboxing", "Material"];
const LANGUAGES = ["pt", "en", "es", "fr", "de", "it"];
type Price = "unknown" | "free" | "paid";

export default function ResourceFormScreen() {
  const { t, i18n } = useTranslation("games");
  const router = useRouter();
  const params = useLocalSearchParams<{ gameId: string; gameName?: string; admin?: string; resourceId?: string }>();
  const editing = !!params.resourceId;
  const administrator = editing || params.admin === "1";
  const [kind, setKind] = useState<ResourceKind>("HowToPlay");
  const [category, setCategory] = useState<PrintCategory | null>(null);
  const [language, setLanguage] = useState<string | null>((i18n?.language ?? "pt").slice(0, 2));
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [platform, setPlatform] = useState("");
  const [url, setUrl] = useState("");
  const [compatibility, setCompatibility] = useState("");
  const [official, setOfficial] = useState(false);
  const [price, setPrice] = useState<Price>("unknown");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(editing);
  const [submitted, setSubmitted] = useState(false);
  const [expansion, setExpansion] = useState("");
  const [thumbnail, setThumbnail] = useState("");
  const guard = useUnsavedChanges(!!(title || author || platform || url || compatibility || expansion || thumbnail) && !editing, saving, "/games/details/" + params.gameId);

  // Editing: read the current values from the administration list.
  useEffect(() => {
    if (!editing) return;
    resourceService.review(undefined, params.gameId).then(list => {
      const r = list.find(x => x.resource.id === params.resourceId)?.resource;
      if (!r) return;
      setKind(r.kind); setCategory(r.printCategory); setLanguage(r.language); setTitle(r.title); setAuthor(r.author ?? ""); setPlatform(r.platform);
      setUrl(r.url); setCompatibility(r.compatibility ?? ""); setOfficial(r.isOfficial); setPrice(r.isFree == null ? "unknown" : r.isFree ? "free" : "paid");
      setExpansion(r.expansion ?? ""); setThumbnail(r.thumbnailUrl ?? "");
    }).catch(() => Alert.alert(t("resources.form.error"))).finally(() => setLoading(false));
  }, [editing, params.gameId, params.resourceId]);

  const urlValid = /^https:\/\/[^\s/$.?#][^\s]*\.[^\s]+/i.test(url.trim());
  const thumbnailValid = !thumbnail.trim() || /^https:\/\/[^\s/$.?#][^\s]*\.[^\s]+/i.test(thumbnail.trim());
  const missing = !title.trim() || !platform.trim() || !urlValid || !thumbnailValid || (kind === "PrintModel" && !category);
  const chooseKind = (next: ResourceKind) => {
    setKind(next);
    if (next === "PrintModel") setLanguage(null); else setCategory(null);
  };

  async function submit() {
    setSubmitted(true);
    if (missing || saving) return;
    const input: GameResourceInput = { kind, printCategory: kind === "PrintModel" ? category : null, language, title: title.trim(), author: author.trim() || null,
      platform: platform.trim(), url: url.trim(), compatibility: compatibility.trim() || null, isOfficial: official, isFree: price === "unknown" ? null : price === "free",
      expansion: expansion.trim() || null, thumbnailUrl: thumbnail.trim() || null };
    setSaving(true);
    try {
      if (editing) await resourceService.update(params.resourceId!, input);
      else if (administrator) await resourceService.create(params.gameId, input);
      else await resourceService.suggest(params.gameId, input);
      guard.allowExit();
      Alert.alert(t(administrator ? "resources.form.saved" : "resources.form.sent"));
      router.back();
    } catch (error) {
      Alert.alert(t("resources.form.error"), apiMessage(error) ?? "");
    } finally { setSaving(false); }
  }

  const heading = t(editing ? "resources.form.titleEdit" : administrator ? "resources.form.titleCreate" : "resources.form.titleSuggest");
  if (loading) return <ScreenLayout title={heading}><ScreenState loading message={t("resources.loading")} /></ScreenLayout>;

  const field = (label: string, value: string, set: (v: string) => void, options: { required?: boolean; hint?: string; keyboard?: "url"; invalid?: boolean } = {}) =>
    <View style={styles.field}>
      <Text style={type.body}>{label}{options.required ? " *" : ""}</Text>
      <TextInput style={[styles.input, submitted && options.invalid && styles.invalid]} value={value} onChangeText={v => { set(v); guard.markUnsaved(); }}
        accessibilityLabel={label} autoCapitalize={options.keyboard ? "none" : "sentences"} autoCorrect={!options.keyboard} keyboardType={options.keyboard === "url" ? "url" : "default"}
        placeholderTextColor={colors.placeholder} />
      {!!options.hint && <Text style={type.caption}>{options.hint}</Text>}
    </View>;

  return <ScreenLayout title={heading} keyboard mode="cancel" onCancel={guard.cancel}>
    <View style={styles.content}>
      {!!params.gameName && <Note inset>{params.gameName}</Note>}
      {!administrator && <Note inset>{t("resources.form.pendingNote")}</Note>}

      <Section title={t("resources.form.kind")}>
        <Card>{KINDS.map((k, i) => <Row key={k} first={i === 0} title={t(`resources.kinds.${k}`)} end="check" selected={kind === k} onPress={() => chooseKind(k)} />)}</Card>
      </Section>
      {kind === "PrintModel" && <Section title={t("resources.form.category")}>
        <Card>{PRINT_CATEGORIES.map((c, i) => <Row key={c} first={i === 0} title={t(`resources.categories.${c}`)} end="check" selected={category === c} onPress={() => setCategory(c)} />)}</Card>
        {submitted && !category && <Text style={[type.caption, styles.error]}>{t("resources.form.categoryRequired")}</Text>}
      </Section>}

      <Section title={t("resources.form.language")}>
        <FilterChips items={[...LANGUAGES.map(code => ({ key: code, label: languageName(t, code) })), { key: "none", label: t("resources.languages.none") }]}
          value={language ?? "none"} onChange={key => setLanguage(key === "none" ? null : key)} />
      </Section>

      <Section title={t("resources.form.details")}>
        <Card padded style={styles.fields}>
          {field(t("resources.form.title"), title, setTitle, { required: true, invalid: !title.trim() })}
          {field(t("resources.form.url"), url, setUrl, { required: true, keyboard: "url", hint: t("resources.form.urlHint"), invalid: !urlValid })}
          {field(t("resources.form.platform"), platform, setPlatform, { required: true, hint: t("resources.form.platformHint"), invalid: !platform.trim() })}
          {field(t("resources.form.author"), author, setAuthor)}
          {field(t("resources.form.expansion"), expansion, setExpansion, { hint: t("resources.form.expansionHint") })}
          {field(t("resources.form.compatibility"), compatibility, setCompatibility, { hint: t("resources.form.compatibilityHint") })}
          {field(t("resources.form.thumbnail"), thumbnail, setThumbnail, { keyboard: "url", hint: t("resources.form.thumbnailHint"), invalid: !thumbnailValid })}
        </Card>
      </Section>

      <Section title={t("resources.form.more")}>
        <Card>
          <Row first title={t("resources.form.official")} end="check" selected={official} onPress={() => setOfficial(v => !v)} />
        </Card>
        <Text style={[type.caption, styles.pad]}>{t("resources.form.price")}</Text>
        <FilterChips items={(["unknown", "free", "paid"] as Price[]).map(key => ({ key, label: t(`resources.form.prices.${key}`) }))} value={price} onChange={setPrice} />
        <Note inset>{t("resources.form.priceHint")}</Note>
      </Section>

      {submitted && missing && <Text style={[type.body, styles.error]} accessibilityRole="alert">{t("resources.form.required")}</Text>}
      <Button variant="primary" title={t(administrator ? "resources.form.save" : "resources.form.submit")} disabled={saving} onPress={() => { void submit(); }} />
    </View>
  </ScreenLayout>;
}

const styles = StyleSheet.create({
  content: { padding: space.lg, paddingBottom: 32, gap: space.xl },
  fields: { gap: space.lg },
  field: { gap: space.xs },
  input: { minHeight: 44, borderRadius: radius.control, backgroundColor: colors.background, borderWidth: 1, borderColor: colors.line, paddingHorizontal: space.md, fontSize: 15, color: colors.text },
  invalid: { borderColor: colors.danger },
  error: { color: colors.danger, paddingHorizontal: space.lg },
  pad: { paddingHorizontal: space.lg },
});
