import { useTranslation } from "react-i18next";
import React, { useState } from "react";
import { StyleSheet, TouchableOpacity } from "react-native";
import Sheet from "@/src/ui/Sheet";
import { Card, Glyph, Row } from "@/src/ui/components";
import { colors, touch } from "@/src/ui/theme";

// «…» on a person's profile or search result: the common sheet with the risky actions in red text.
// «Remover amigo» only for friends; «Denunciar» and «Bloquear» for anyone else.
export function FriendActionsMenu({ onRemove, onReport, onBlock }: { onRemove?: () => void; onReport: () => void; onBlock: () => void }) {
  const { t } = useTranslation("friends");
  const { t: tc } = useTranslation("common");
  const [open, setOpen] = useState(false);
  const run = (action: () => void) => () => { setOpen(false); action(); };

  return (
    <>
      <TouchableOpacity accessibilityRole="button" accessibilityLabel={t("text.moreOptions")} style={styles.trigger} onPress={() => setOpen(true)}>
        <Glyph name="dots-horizontal" size={20} color={colors.muted} />
      </TouchableOpacity>
      <Sheet visible={open} title={t("text.moreOptions")} onClose={() => setOpen(false)} closeLabel={tc("filters.cancel")}
        left={{ label: tc("filters.cancel"), onPress: () => setOpen(false) }}>
        <Card>
          {onRemove && <Row first title={t("text.removeFriendAction")} tone="danger" end="none" inset={52}
            lead={<Glyph name="account-remove-outline" size={20} color={colors.danger} />}
            onPress={run(onRemove)} />}
          <Row first={!onRemove} title={t("community.report")} end="none" inset={52}
            lead={<Glyph name="flag-outline" size={20} color={colors.icon} />}
            onPress={run(onReport)} />
          <Row title={t("community.block")} tone="danger" end="none" inset={52}
            lead={<Glyph name="account-cancel-outline" size={20} color={colors.danger} />}
            onPress={run(onBlock)} />
        </Card>
      </Sheet>
    </>
  );
}

const styles = StyleSheet.create({
  trigger: { width: touch, height: touch, alignItems: "center", justifyContent: "center" },
});
