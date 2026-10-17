/**
 * «Eliminar conta» (docs/proposta-eliminacao-conta.md): what is deleted and what stays without the person's name,
 * what happens to the sessions they organize and the campaigns they created (a new manager may be chosen among the
 * active members; none leaves management read-only), then the password and a final confirmation. Works whatever is
 * running: nothing has to be resolved by hand first. On success the device forgets the account.
 */
import React, { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Linking, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import Toast from "react-native-toast-message";
import ScreenLayout from "@/src/ui/ScreenLayout";
import Sheet from "@/src/ui/Sheet";
import PrimaryButton from "@/src/ui/PrimaryButton";
import { Card, Note, Row, Section } from "@/src/ui/components";
import { colors, space, type } from "@/src/ui/theme";
import { UI_STYLES } from "@/src/styles/uiStyles";
import { LEGAL_URLS } from "@/src/constants/legal";
import { ROUTES } from "@/src/constants/routes";
import { authService } from "@/src/features/auth/services/authService";
import { DeletionCampaign, DeletionSummary, deleteOwnAccount, getDeletionSummary } from "@/src/features/users/services/userService";
import { forgetAccountOnDevice, rememberDeletionResume } from "../services/accountDeletion";
import { RootState } from "@/src/store/store";

export default function DeleteAccountScreen() {
  const { t, i18n } = useTranslation("settings");
  const router = useRouter();
  const account = useSelector((state: RootState) => state.auth.user);
  const [summary, setSummary] = useState<DeletionSummary | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [managers, setManagers] = useState<Record<string, string | null>>({});
  const [choosing, setChoosing] = useState<DeletionCampaign | null>(null);
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [resetSent, setResetSent] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(() => {
    setLoadError(false);
    getDeletionSummary().then(setSummary).catch(() => setLoadError(true));
  }, []);
  // Again on return: a campaign's notes may have been edited meanwhile.
  useFocusEffect(load);
  useEffect(() => { if (resetSent) setError(null); }, [resetSent]);

  const managerName = (campaign: DeletionCampaign) => {
    const id = managers[campaign.id];
    return id ? campaign.members.find(m => m.id === id)?.userName ?? "" : null;
  };

  const sendReset = async () => {
    if (!account?.email) return;
    await rememberDeletionResume();
    const result = await authService.forgotPassword(account.email);
    if (result.success) setResetSent(true);
    else setError(result.message ?? t("deleteAccount.resetError"));
  };

  const remove = async () => {
    setDeleting(true); setError(null);
    try {
      const transfers = Object.entries(managers).filter(([, id]) => !!id).map(([campaignId, id]) => ({ campaignId, newManagerId: id! }));
      await deleteOwnAccount(password, transfers);
      await forgetAccountOnDevice(account?.id);
      setConfirming(false);
      Toast.show({ type: "success", text1: t("deleteAccount.doneTitle"), text2: t("deleteAccount.done") });
      router.replace("/welcome");
    } catch (err: any) {
      setConfirming(false);
      // The API client already turned the answer into a message for people (the server's own, in Portuguese).
      const status = err?.response?.status;
      setError(status === 400 && !i18n.language.startsWith("pt") ? t("deleteAccount.wrongPassword") : err?.message || t("deleteAccount.error"));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <ScreenLayout title={t("deleteAccount.title")} keyboard>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Section title={t("deleteAccount.whatTitle")}>
          <Card>
            <Row first title={t("deleteAccount.deletedTitle")} subtitle={t("deleteAccount.deleted")} end="none" />
            <Row title={t("deleteAccount.keptTitle")} subtitle={t("deleteAccount.kept")} end="none" />
            <Row title={t("deleteAccount.neutralTitle")} subtitle={t("deleteAccount.neutral")} end="none" />
          </Card>
          <Note inset>{t("deleteAccount.providers")}</Note>
        </Section>

        {!summary && !loadError && <ActivityIndicator color={colors.primary} accessibilityLabel={t("deleteAccount.loading")} />}
        {loadError && <Section>
          <Card><Row first title={t("deleteAccount.loadError")} subtitle={t("deleteAccount.retry")} tone="link" onPress={load} /></Card>
        </Section>}

        {summary && (summary.scheduledSessions > 0 || summary.runningSessions > 0) && <Section title={t("deleteAccount.sessionsTitle")}>
          <Card>
            {summary.scheduledSessions > 0 && <Row first title={t("deleteAccount.scheduled", { count: summary.scheduledSessions })} subtitle={t("deleteAccount.scheduledHint")} end="none" />}
            {summary.runningSessions > 0 && <Row first={summary.scheduledSessions === 0} title={t("deleteAccount.running", { count: summary.runningSessions })} subtitle={t("deleteAccount.runningHint")} end="none" />}
          </Card>
        </Section>}

        {summary && (summary.campaignsWithMembers.length > 0 || summary.campaignsOnlyYours > 0) && <Section title={t("deleteAccount.campaignsTitle")}>
          {summary.campaignsWithMembers.length > 0 && <Card>
            {summary.campaignsWithMembers.map((campaign, index) => <Row key={campaign.id} first={index === 0} title={campaign.name}
              subtitle={[campaign.gameName, managerName(campaign) ? t("deleteAccount.newManager", { name: managerName(campaign) }) : t("deleteAccount.noManager")].filter(Boolean).join(" · ")}
              accessibilityLabel={`${campaign.name}. ${managerName(campaign) ? t("deleteAccount.newManager", { name: managerName(campaign) }) : t("deleteAccount.noManager")}. ${t("deleteAccount.chooseManager")}`}
              onPress={() => setChoosing(campaign)} />)}
          </Card>}
          {summary.campaignsWithMembers.length > 0 && <Note inset>{t("deleteAccount.campaignsHint")}</Note>}
          {summary.campaignsWithMembers.filter(c => c.hasNotes).map(campaign => <Card key={"notes-" + campaign.id}>
            <Row first title={t("deleteAccount.notesTitle", { name: campaign.name })} subtitle={t("deleteAccount.notes")} tone="link"
              onPress={() => router.push({ pathname: ROUTES.CAMPAIGN_DETAIL, params: { id: campaign.id } } as never)} />
          </Card>)}
          {summary.campaignsOnlyYours > 0 && <Note inset>{t("deleteAccount.onlyYours", { count: summary.campaignsOnlyYours })}</Note>}
        </Section>}

        <Section title={t("deleteAccount.confirmTitle")}>
          <View style={styles.field}>
            <Text style={styles.label}>{t("deleteAccount.password")}</Text>
            <TextInput value={password} onChangeText={value => { setPassword(value); setError(null); }} secureTextEntry autoCapitalize="none" autoCorrect={false}
              autoComplete="current-password" textContentType="password" style={[UI_STYLES.field, error && styles.fieldError]}
              accessibilityLabel={t("deleteAccount.password")} selectionColor={colors.primary} />
            {!!error && <Text style={styles.error} accessibilityRole="alert" accessibilityLiveRegion="polite">{error}</Text>}
          </View>
          <Card>
            <Row first title={t("deleteAccount.forgot")} subtitle={resetSent ? t("deleteAccount.resetSent", { email: account?.email ?? "" }) : t("deleteAccount.forgotHint")}
              tone="link" onPress={() => { void sendReset(); }} />
            <Row title={t("deleteAccount.privacy")} tone="link" onPress={() => Linking.openURL(LEGAL_URLS.privacy)} />
          </Card>
          <PrimaryButton variant="danger" title={t("deleteAccount.button")} disabled={!password || !summary} onPress={() => setConfirming(true)} />
        </Section>
      </ScrollView>

      {choosing && <Sheet visible title={t("deleteAccount.chooseManager")} onClose={() => setChoosing(null)} closeLabel={t("deleteAccount.close")}
        right={{ label: t("deleteAccount.close"), onPress: () => setChoosing(null) }}>
        <Note inset>{choosing.name}</Note>
        <Card>
          {choosing.members.map((member, index) => <Row key={member.id} first={index === 0} title={member.userName} end="check" selected={managers[choosing.id] === member.id}
            onPress={() => { setManagers(m => ({ ...m, [choosing.id]: member.id })); setChoosing(null); }} />)}
          <Row title={t("deleteAccount.nobody")} subtitle={t("deleteAccount.nobodyHint")} end="check" selected={!managers[choosing.id]}
            onPress={() => { setManagers(m => ({ ...m, [choosing.id]: null })); setChoosing(null); }} />
        </Card>
      </Sheet>}

      <Sheet visible={confirming} title={t("deleteAccount.title")} onClose={() => !deleting && setConfirming(false)} closeLabel={t("deleteAccount.cancel")}
        left={{ label: t("deleteAccount.cancel"), onPress: () => !deleting && setConfirming(false) }}>
        <Note inset>{t("deleteAccount.final")}</Note>
        <View style={styles.sheetActions}>
          <PrimaryButton variant="danger" title={t("deleteAccount.confirm")} loading={deleting} disabled={deleting} onPress={() => { void remove(); }} />
        </View>
      </Sheet>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  container: { padding: space.lg, paddingTop: space.xs, paddingBottom: 32, gap: space.xl },
  field: { gap: space.sm },
  label: { ...type.body, fontWeight: "700", color: colors.text },
  fieldError: { borderColor: colors.danger },
  error: { ...type.caption, color: colors.danger },
  sheetActions: { paddingHorizontal: space.lg, paddingBottom: space.lg },
});
