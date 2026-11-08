import React, { useState, useEffect } from "react";
import { View, Text, TextInput, Pressable, StyleSheet, ScrollView, Alert } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../navigation/RootNavigator";
import { createCandidate } from "../../db/selectionRepository";
import { Sex } from "../../types/selection";
import { t } from "../../i18n/strings";
import { useAuth } from "../../auth/AuthContext";
import { LocationSelector } from "../../components/LocationSelector";
import { getSectors, getCells, getVillages } from "../../data/locations";
import { validateNationalId, validatePhone, ID_ERROR_MESSAGE, PHONE_ERROR_MESSAGE } from "../../utils/validation";

type Props = NativeStackScreenProps<RootStackParamList, "CandidateForm">;

export default function CandidateFormScreen({ route, navigation }: Props) {
  const { campaignId } = route.params;
  const [fullName, setFullName] = useState("");
  const [sex, setSex] = useState<Sex>("F");
  const [nationalId, setNationalId] = useState("");
  const [spouse, setSpouse] = useState("");
  const [phone, setPhone] = useState("");
  const [drawNumber, setDrawNumber] = useState("");
  const [graduationStatus, setGraduationStatus] = useState("");
  const [conclusion, setConclusion] = useState("");
  const { profile } = useAuth();
  // Levels fixed by the signed-in user's scope are pre-filled and locked.
  const [district, setDistrict] = useState(profile?.district ?? "Musanze");
  const [sector, setSector] = useState(profile?.sector ?? "");
  const [cell, setCell] = useState(profile?.cell ?? "");
  const [village, setVillage] = useState(profile?.village ?? "");
  const [saving, setSaving] = useState(false);



  async function onSave() {
    if (!fullName || !nationalId || !sector || !cell || !village) {
      Alert.alert(t("error"), t("fillCandidateFieldsError"));
      return;
    }
    if (!validateNationalId(nationalId)) {
      Alert.alert(t("error"), ID_ERROR_MESSAGE);
      return;
    }
    if (phone && !validatePhone(phone)) {
      Alert.alert(t("error"), PHONE_ERROR_MESSAGE);
      return;
    }
    setSaving(true);
    try {
      await createCandidate({
        campaignId,
        fullName: fullName.trim().toUpperCase(),
        sex,
        nationalId: nationalId.trim(),
        spouse: spouse.trim() || null,
        phone: phone.trim() || null,
        district: district.toUpperCase(),
        sector: sector.toUpperCase(),
        cell: cell.toUpperCase(),
        village: village.toUpperCase(),
        householdInfo: null,
        currentLivestock: null,
        landHouseholdInfo: null,
        economicSocialInfo: null,
        drawNumber: drawNumber.trim() || null,
        graduationStatus: graduationStatus.trim() || null,
        conclusion: conclusion.trim() || null,
      });
      navigation.goBack();
    } finally {
      setSaving(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Field label={t("fullName")} value={fullName} onChangeText={setFullName} />

      <Text style={styles.label}>{t("sex")}</Text>
      <View style={styles.sexRow}>
        <Pressable
          style={[styles.sexButton, sex === "F" && styles.sexButtonActive]}
          onPress={() => setSex("F")}
        >
          <Text style={sex === "F" ? styles.sexTextActive : styles.sexText}>{t("female")}</Text>
        </Pressable>
        <Pressable
          style={[styles.sexButton, sex === "M" && styles.sexButtonActive]}
          onPress={() => setSex("M")}
        >
          <Text style={sex === "M" ? styles.sexTextActive : styles.sexText}>{t("male")}</Text>
        </Pressable>
      </View>

      <Field label={t("nationalId")} value={nationalId} onChangeText={setNationalId} />
      <Field label={t("spouse")} value={spouse} onChangeText={setSpouse} />
      <Field label={t("phone")} value={phone} onChangeText={setPhone} />
      <Field label="Draw Number (No YATOMBOYE)" value={drawNumber} onChangeText={setDrawNumber} />
      <Field label="Graduation Status" value={graduationStatus} onChangeText={setGraduationStatus} />
      <Field label="Conclusion" value={conclusion} onChangeText={setConclusion} />

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
          setSector(v.toUpperCase());
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
          setCell(v.toUpperCase());
          setVillage("");
        }}
        disabled={!!profile?.cell || !sector}
      />
      <LocationSelector
        label={t("village")}
        value={village}
        options={cell ? getVillages(district, sector, cell) : []}
        onSelect={(v) => setVillage(v.toUpperCase())}
        disabled={!!profile?.village || !cell}
      />

      <Pressable style={styles.saveButton} onPress={onSave} disabled={saving}>
        <Text style={styles.saveButtonText}>{saving ? t("loading") : t("save")}</Text>
      </Pressable>
    </ScrollView>
  );
}

function Field(props: { label: string; value: string; onChangeText: (v: string) => void }) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{props.label}</Text>
      <TextInput style={styles.input} value={props.value} onChangeText={props.onChangeText} />
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
  sexRow: { flexDirection: "row", gap: 10, marginBottom: 14 },
  sexButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#1b6e3c",
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: "center",
  },
  sexButtonActive: { backgroundColor: "#1b6e3c" },
  sexText: { color: "#1b6e3c", fontWeight: "600" },
  sexTextActive: { color: "white", fontWeight: "600" },
  saveButton: {
    backgroundColor: "#1b6e3c",
    borderRadius: 10,
    padding: 14,
    alignItems: "center",
    marginTop: 8,
  },
  saveButtonText: { color: "white", fontWeight: "700", fontSize: 15 },
});
