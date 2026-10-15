import { useTranslation } from "react-i18next";
import React, { useState } from "react";
import { StyleSheet, TouchableOpacity } from "react-native";
import Sheet from "@/src/ui/Sheet";
import { Card, Glyph, Row } from "@/src/ui/components";
import { colors, touch } from "@/src/ui/theme";

// «…» on a friend's profile: the common sheet with the risky action in red text.
export function FriendActionsMenu({ onRemove }: { onRemove: () => void }) {
  const { t } = useTranslation("friends");
  const { t: tc } = useTranslation("common");
  const [open, setOpen] = useState(false);

  return (
    <>
      <TouchableOpacity accessibilityRole="button" accessibilityLabel={t("text.moreOptions")} style={styles.trigger} onPress={() => setOpen(true)}>
        <Glyph name="dots-horizontal" size={20} color={colors.muted} />
      </TouchableOpacity>
      <Sheet visible={open} title={t("text.moreOptions")} onClose={() => setOpen(false)} closeLabel={tc("filters.cancel")}
        left={{ label: tc("filters.cancel"), onPress: () => setOpen(false) }}>
        <Card>
          <Row first title={t("text.removeFriendAction")} tone="danger" end="none" inset={52}
            lead={<Glyph name="account-remove-outline" size={20} color={colors.danger} />}
            onPress={() => { setOpen(false); onRemove(); }} />
        </Card>
      </Sheet>
    </>
  );
}

const styles = StyleSheet.create({
  trigger: { width: touch, height: touch, alignItems: "center", justifyContent: "center" },
});
