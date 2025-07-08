import React, { useEffect, useState } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
} from "react-native";
import { GameLibraryStatus } from "@/src/features/library/types/GameLibraryStatus";
import { COLORS } from "@/src/constants/colors";

type Props = {
  visible: boolean;
  onClose: () => void;
  onSubmit: (status: GameLibraryStatus, pricePaid?: number) => void;
  alreadyAdded?: boolean;
  currentStatus?: GameLibraryStatus;
};

export default function AddToLibraryModal({
  visible,
  onClose,
  onSubmit,
  alreadyAdded = false,
  currentStatus,
}: Props) {
  const [status, setStatus] = useState(GameLibraryStatus.Owned);
  const [price, setPrice] = useState("");

  useEffect(() => {
    if (visible) {
      setStatus(GameLibraryStatus.Owned);
      setPrice("");
    }
  }, [visible]);

  const handleAdd = () => {
    if (alreadyAdded) return;

    const trimmed = price.trim();
    const priceValue =
      status === GameLibraryStatus.Owned && trimmed !== ""
        ? Number(trimmed)
        : undefined;

    if (trimmed !== "" && isInvalidPrice(priceValue)) {
      alert("❌ Price must be a valid number.");
      return;
    }

    onSubmit(status, priceValue);
    onClose();
  };

  function isInvalidPrice(val: number | undefined): boolean {
    return typeof val !== "number" || isNaN(val);
  }

  function label(s: GameLibraryStatus) {
    switch (s) {
      case GameLibraryStatus.Owned: return "Owned";
      case GameLibraryStatus.Wishlist: return "Wishlist";
      case GameLibraryStatus.Played: return "Played";
      default: return s;
    }
  }

  function option(text: string, value: GameLibraryStatus) {
    const active = status === value;
    return (
      <TouchableOpacity
        onPress={() => setStatus(value)}
        style={[styles.statusOption, active && styles.active]}
      >
        <Text style={[styles.optionText, active && styles.activeText]}>
          {text}
        </Text>
      </TouchableOpacity>
    );
  }

  return (
    <Modal visible={visible} transparent animationType="slide">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.overlay}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.box}>
            <Text style={styles.title}>Add to Library</Text>

            {alreadyAdded ? (
              <>
                <Text style={styles.warning}>
                  This game is already in your library
                  {currentStatus && ` (Status: ${label(currentStatus)})`}.
                </Text>
                <TouchableOpacity style={styles.singleBtn} onPress={onClose}>
                  <Text style={styles.singleBtnText}>Close</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Text style={styles.label}>Select status</Text>
                <View style={styles.statusBox}>
                  {option("✅ Owned", GameLibraryStatus.Owned)}
                  {option("🛒 Wishlist", GameLibraryStatus.Wishlist)}
                  {option("🎮 Played", GameLibraryStatus.Played)}
                </View>

                {status === GameLibraryStatus.Owned && (
                  <>
                    <Text style={styles.label}>Price paid (€)</Text>
                    <TextInput
                      style={styles.input}
                      keyboardType="numeric"
                      placeholder="Ex: 30"
                      value={price}
                      onChangeText={setPrice}
                    />
                  </>
                )}

                <View style={styles.actions}>
                  <TouchableOpacity onPress={onClose}>
                    <Text style={{ color: "#888" }}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={handleAdd}>
                    <Text style={styles.addText}>Add</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

/* ─────────── STYLES ─────────── */
const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  box: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 16,
    color: COLORS.primary,
    textAlign: "center",
  },
  warning: {
    color: COLORS.error,
    fontSize: 16,
    textAlign: "center",
    marginVertical: 12,
  },
  label: {
    fontWeight: "600",
    marginTop: 12,
    color: COLORS.onBackground,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 10,
    marginTop: 4,
  },
  statusBox: { flexDirection: "row", marginTop: 8 },
  statusOption: {
    flex: 1,
    padding: 10,
    marginRight: 8,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 6,
    alignItems: "center",
  },
  active: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  optionText: { color: "#000" },
  activeText: { color: "#fff", fontWeight: "bold" },
  actions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
  },
  addText: { color: COLORS.primary, fontWeight: "bold" },
  singleBtn: {
    marginTop: 16,
    alignSelf: "center",
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: COLORS.primary,
    borderRadius: 6,
  },
  singleBtnText: { color: "#fff", fontWeight: "600" },
});
