import React, { useState } from "react";
import { View, Text, Pressable, Modal, FlatList, StyleSheet, SafeAreaView } from "react-native";

interface Props {
  label: string;
  value: string;
  options: string[];
  onSelect: (val: string) => void;
  disabled?: boolean;
}

export function LocationSelector({ label, value, options, onSelect, disabled }: Props) {
  const [visible, setVisible] = useState(false);

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <Pressable
        style={[styles.pickerTrigger, disabled && styles.disabled]}
        onPress={() => !disabled && setVisible(true)}
      >
        <Text style={[styles.valueText, !value && styles.placeholder, disabled && styles.disabledText]}>
          {(options.find(o => o.toUpperCase() === value?.toUpperCase()) || value) || `Hitamo ${label.toLowerCase()}...`}
        </Text>
      </Pressable>

      <Modal visible={visible} animationType="slide" transparent={false}>
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>{label}</Text>
            <Pressable onPress={() => setVisible(false)} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>Funga</Text>
            </Pressable>
          </View>
          <FlatList
            data={options}
            keyExtractor={(item) => item}
            renderItem={({ item }) => (
              <Pressable
                style={styles.optionItem}
                onPress={() => {
                  onSelect(item);
                  setVisible(false);
                }}
              >
                <Text style={styles.optionText}>{item}</Text>
                {value?.toUpperCase() === item?.toUpperCase() && <Text style={styles.selectedCheck}>✓</Text>}
              </Pressable>
            )}
            ListEmptyComponent={
              <Text style={styles.emptyText}>Nta makuru aboneka hano.</Text>
            }
          />
        </SafeAreaView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 14 },
  label: { fontSize: 13, color: "#333", marginBottom: 6, fontWeight: "600" },
  pickerTrigger: {
    borderWidth: 1.5,
    borderColor: "#444",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 10,
    backgroundColor: "white",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  disabled: { backgroundColor: "#f9f9f9", borderColor: "#eee" },
  disabledText: { color: "#666" },
  valueText: { fontSize: 15, color: "#000" },
  placeholder: { color: "#999" },
  modalContainer: { flex: 1, backgroundColor: "white" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  headerTitle: { fontSize: 18, fontWeight: "700" },
  closeButton: { padding: 4 },
  closeButtonText: { color: "#1b6e3c", fontWeight: "600" },
  optionItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f9f9f9",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  optionText: { fontSize: 16 },
  selectedCheck: { color: "#1b6e3c", fontWeight: "bold" },
  emptyText: { padding: 20, textAlign: "center", color: "#999" },
});
