import React from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { COLORS } from "@/src/constants/colors";
import {
  GameLibraryStatus,
  getStatusLabel,
} from "@/src/features/library/types/GameLibraryStatus";

type Props = {
  visible: boolean;
  onClose: () => void;

  // Entry data
  gameName: string;
  currentStatus: GameLibraryStatus;

  // Callbacks
  onRemove: () => void;
  onUpdateStatus: (newStatus: GameLibraryStatus) => void;
};

export default function ManageLibraryEntryModal({
  visible,
  onClose,
  gameName,
  currentStatus,
  onRemove,
  onUpdateStatus,
}: Props) {
  const renderOption = (label: string, status: GameLibraryStatus) => (
    <TouchableOpacity
      key={status}
      style={[
        styles.optionBtn,
        currentStatus === status && styles.optionActive,
      ]}
      onPress={() => onUpdateStatus(status)}
    >
      <Text
        style={[
          styles.optionTxt,
          currentStatus === status && { color: "#fff", fontWeight: "600" },
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.box}>
          <Text style={styles.title}>{gameName}</Text>
          <Text style={styles.subtitle}>
            Current status: {getStatusLabel(currentStatus)}
          </Text>

          {/* Status options */}
          {renderOption("✅ Owned", GameLibraryStatus.Owned)}
          {renderOption("🛒 Wishlist", GameLibraryStatus.Wishlist)}
          {renderOption("🎮 Played", GameLibraryStatus.Played)}

          {/* Remove button */}
          <TouchableOpacity style={styles.removeBtn} onPress={onRemove}>
            <Text style={styles.removeTxt}>❌ Remove from library</Text>
          </TouchableOpacity>

          {/* Close button */}
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Text style={styles.closeTxt}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
    paddingHorizontal: 20,
  },
  box: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 24,
    width: "100%",
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
    color: COLORS.primary,
  },
  subtitle: {
    textAlign: "center",
    marginVertical: 8,
    color: COLORS.onBackground,
  },
  optionBtn: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    marginTop: 8,
  },
  optionActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  optionTxt: {
    color: "#000",
    textAlign: "center",
  },
  removeBtn: {
    marginTop: 16,
  },
  removeTxt: {
    color: COLORS.error,
    textAlign: "center",
  },
  closeBtn: {
    marginTop: 16,
  },
  closeTxt: {
    textAlign: "center",
    color: "#888",
  },
});
