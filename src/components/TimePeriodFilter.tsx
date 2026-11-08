import React from "react";
import { View, Text, StyleSheet, Pressable, ScrollView } from "react-native";

export type TimePeriod = "ALL" | "DAY" | "WEEK" | "MONTH" | "YEAR";

interface Props {
  selected: TimePeriod;
  onSelect: (period: TimePeriod) => void;
}

export function TimePeriodFilter({ selected, onSelect }: Props) {
  const periods: { label: string; value: TimePeriod }[] = [
    { label: "Byose", value: "ALL" },
    { label: "Uyu munsi", value: "DAY" },
    { label: "Icyumweru", value: "WEEK" },
    { label: "Ukwezi", value: "MONTH" },
    { label: "Umwaka", value: "YEAR" },
  ];

  return (
    <View style={styles.container}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {periods.map((p) => (
          <Pressable
            key={p.value}
            style={[styles.chip, selected === p.value && styles.chipActive]}
            onPress={() => onSelect(p.value)}
          >
            <Text style={[styles.chipText, selected === p.value && styles.chipTextActive]}>
              {p.label}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingVertical: 10, backgroundColor: "#f9f9f9", borderBottomWidth: 1, borderBottomColor: "#eee" },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ddd",
    marginHorizontal: 6,
  },
  chipActive: {
    backgroundColor: "#1b6e3c",
    borderColor: "#1b6e3c",
  },
  chipText: { fontSize: 13, color: "#666" },
  chipTextActive: { color: "#fff", fontWeight: "600" },
});
