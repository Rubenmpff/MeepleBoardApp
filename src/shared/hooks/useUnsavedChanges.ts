import { useRef, useState } from "react";
import { Alert } from "react-native";
import { useNavigation, useRouter } from "expo-router";
import { usePreventRemove } from "expo-router/react-navigation";
import { useTranslation } from "react-i18next";
import { ROUTES } from "@/src/constants/routes";

export function useUnsavedChanges(dirty: boolean, busy = false, fallback: string = ROUTES.HOME) {
  const router = useRouter();
  const navigation = useNavigation();
  const { t } = useTranslation("navigation");
  const [saved, setSaved] = useState(false);
  const prompting = useRef(false);
  const approved = useRef(false);
  function confirm(discard: () => void) {
    if (prompting.current) return;
    if (busy) {
      Alert.alert(t("leave.busyTitle"), t("leave.busyMessage"));
      return;
    }
    prompting.current = true;
    Alert.alert(t("leave.title"), t("leave.message"), [
      { text: t("leave.stay"), style: "cancel", onPress: () => { prompting.current = false; } },
      { text: t("leave.discard"), style: "destructive", onPress: () => { prompting.current = false; discard(); } },
    ], { cancelable: true, onDismiss: () => { prompting.current = false; } });
  }
  usePreventRemove(!saved && (dirty || busy), ({ data }) => {
    if (approved.current) navigation.dispatch(data.action);
    else confirm(() => navigation.dispatch(data.action));
  });
  function cancel() {
    if (router.canGoBack()) router.back();
    else if (!saved && (dirty || busy)) confirm(() => { approved.current = true; setSaved(true); router.replace(fallback as never); });
    else router.replace(fallback as never);
  }
  return {
    cancel,
    discard: (action: () => void) => dirty || busy ? confirm(action) : action(),
    allowExit: () => { approved.current = true; setSaved(true); },
    markUnsaved: () => { approved.current = false; setSaved(false); },
  };
}
