import React, { useState, useEffect } from "react";
import { View, Text, TextInput, Pressable, StyleSheet, ScrollView, Alert } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../navigation/RootNavigator";
import { createSelectionCampaign } from "../../db/selectionRepository";
import { t } from "../../i18n/strings";
import { useAuth } from "../../auth/AuthContext";
import { LocationSelector } from "../../components/LocationSelector";
import { getSectors, getCells, getVillages } from "../../data/locations";

type Props = NativeStackScreenProps<RootStackParamList, "SelectionCampaignForm">;

export default function SelectionCampaignFormScreen({ navigation }: Props) {
  const [program, setProgram] = useState("Girinka");
  const [financialYear, setFinancialYear] = useState("");
  const { profile } = useAuth();
  // Levels fixed by the signed-in user's scope are pre-filled and locked.
  const [district, setDistrict] = useState(profile?.district ?? "Musanze");
  const [sector, setSector] = useState(profile?.sector ?? "");
  const [cell, setCell] = useState(profile?.cell ?? "");
  const [village, setVillage] = useState(profile?.village ?? "");
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [saving, setSaving] = useState(false);



  async function onSave() {
    if (!financialYear || !sector || !cell || !village) {
      Alert.alert(t("error"), t("fillCampaignFieldsError"));
      return;
    }
    setSaving(true);
    try {
      await createSelectionCampaign({
        program,
        financialYear: financialYear.trim(),
        district: district.toUpperCase(),
        sector: sector.toUpperCase(),
        cell: cell.toUpperCase(),
        village: village.toUpperCase(),
        startDate,
        endDate: null,
        responsibleCommittee: "VILLAGE",
      });
      navigation.goBack();
    } finally {
      setSaving(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Field label={t("program")} value={program} onChangeText={setProgram} />
      <Field
        label={t("financialYear")}
        value={financialYear}
        onChangeText={setFinancialYear}
        placeholder={t("financialYearPlaceholder")}
      />

      <LocationSelector
        label={t("district")}
        value={district}
        options={["Musanze"]}
        onSelect={setDistrict}
        disabled
      />
      <LocationSelector
        label={t("sector")}
        value={sector}
        options={getSectors(district)}
        onSelect={(v) => {
          setSector(v);
          setCell("");
          setVillage("");
        }}
        disabled={!!profile?.sector}
      />
      <LocationSelector
        label={t("cell")}
        value={cell}
        options={sector ? getCells(district, sector) : []}
        onSelect={(v) => {
          setCell(v);
          setVillage("");
        }}
        disabled={!!profile?.cell || !sector}
      />
      <LocationSelector
        label={t("village")}
        value={village}
        options={cell ? getVillages(district, sector, cell) : []}
        onSelect={setVillage}
        disabled={!!profile?.village || !cell}
      />

      <Field label={t("startDate")} value={startDate} onChangeText={setStartDate} />

      <Pressable style={styles.saveButton} onPress={onSave} disabled={saving}>
        <Text style={styles.saveButtonText}>{saving ? t("loading") : t("save")}</Text>
      </Pressable>
    </ScrollView>
  );
}

function Field(props: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{props.label}</Text>
      <TextInput
        style={styles.input}
        value={props.value}
        onChangeText={props.onChangeText}
        placeholder={props.placeholder}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16 },
  field: { marginBottom: 14 },
  label: { fontSize: 13, color: "#333", marginBottom: 6, fontWeight: "600" },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
  },
  saveButton: {
    backgroundColor: "#1b6e3c",
    borderRadius: 10,
    padding: 14,
    alignItems: "center",
    marginTop: 8,
  },
  saveButtonText: { color: "white", fontWeight: "700", fontSize: 15 },
});
