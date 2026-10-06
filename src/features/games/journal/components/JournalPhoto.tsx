import { useEffect, useState } from "react";
import { ActivityIndicator, Image, ImageStyle, StyleProp, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import api from "@/src/services/api";
import { tokenService } from "@/src/services/tokenService";

export function journalPhotoSource(uri: string, base: string, token: string) {
  if (!/^\/MeepleBoard\/campaigns\/matches\/[\da-f-]+\/journal\/photos\/[\da-f-]+\/[\da-f]{64}$/i.test(uri) || !token) return undefined;
  return { uri: new URL(uri, base).toString(), headers: { Authorization: `Bearer ${token}` }, cache: "reload" as const };
}

/** Journal media is fetched only from the authenticated API, never a public storage URL. */
export default function JournalPhoto({ uri, style }: { uri: string; style?: StyleProp<ImageStyle> }) {
  const { t } = useTranslation("matches");
  const [source, setSource] = useState<{ uri: string; headers: Record<string, string>; cache: "reload" }>();
  const [unavailable, setUnavailable] = useState(false);
  useEffect(() => {
    let mounted = true;
    setSource(undefined);
    setUnavailable(false);
    async function load() {
      const base = api.defaults.baseURL;
      if (!base) { if (mounted) setUnavailable(true); return; }
      const token = await tokenService.getValidToken();
      if (mounted) {
        const next = journalPhotoSource(uri, base, token ?? "");
        setSource(next);
        setUnavailable(!next);
      }
    }
    void load().catch(() => { if (mounted) { setSource(undefined); setUnavailable(true); } });
    return () => { mounted = false; };
  }, [uri]);
  return source && !unavailable ? <Image source={source} style={style} onError={() => setUnavailable(true)} /> : <View style={style}>{unavailable ? <Text>{t("photos.unavailable")}</Text> : <ActivityIndicator />}</View>;
}
