import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, Alert, Pressable, ActivityIndicator, TextInput, Switch, Image } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../navigation/RootNavigator";
import { saveFollowUp } from "../../db/registryRepository";
import { FollowUp } from "../../types/registry";
import { LocationSelector } from "../../components/LocationSelector";
import { v4 as uuidv4 } from "uuid";
import { useAuth } from "../../auth/AuthContext";

import DateTimePicker from "@react-native-community/datetimepicker";
import * as ImagePicker from "expo-image-picker";
import { uploadToCloudinary } from "../../config/cloudinary";

type Props = NativeStackScreenProps<RootStackParamList, "FollowUpForm">;

const CONDITIONS = ["GOOD", "FAIR", "POOR"];
const NO_COW_REASONS = [
  { label: "INKA YARAPFUYE IRAHAMBWA", value: "DEATH" },
  { label: "INKA YARAGURISHIJWE", value: "SOLD" },
  { label: "INKA YARIBWE", value: "STOLEN" },
  { label: "KUYAMBURWA cg KUYISUBIZA", value: "RETURNED" },
  { label: "INDI MPAMVU", value: "OTHER" },
];
const NO_PASS_ON_REASONS = [
  { label: "Inka ntirabyara", value: "NOT_GIVEN_BIRTH" },
  { label: "Inka yarapfuye", value: "DIED" },
  { label: "Indi mpamvu", value: "OTHER" },
];

const BODY_CONDITION_OPTS = [
  { label: "IMEZE NEZA CYANE (EXCELLENT)", value: "EXCELLENT" },
  { label: "IMEZE NEZA BUHORO (GOOD)", value: "GOOD" },
  { label: "IMEZE NABI KU BURYO YAGIRWA INAMA (ADVICE)", value: "POOR_ADVICE" },
  { label: "IMEZE NABI KU BURYO YATABARIZWA (URGENT)", value: "POOR_URGENT" },
  { label: "IMEZE NABI KU BURYO YAHITA AYAMBURWA (REMOVAL)", value: "POOR_REMOVAL" },
];

export default function FollowUpFormScreen({ route, navigation }: Props) {
  const { beneficiaryId, animalId } = route.params;
  const { profile } = useAuth();

  // Section 1
  const [hasCowInShed, setHasCowInShed] = useState(true);
  const [hasShed, setHasShed] = useState(true);
  const [remembersYear, setRemembersYear] = useState(true);
  const [yearReceived, setYearReceived] = useState("");

  // Section 2
  const [noCowReason, setNoCowReason] = useState<any>(null);
  const [noCowNotes, setNoCowNotes] = useState("");

  // Section 3
  const [hasPassedOn, setHasPassedOn] = useState(false);
  const [noPassOnReason, setNoPassOnReason] = useState<any>(null);

  // Section 4: Cow management
  const [bodyCondition, setBodyCondition] = useState<any>(null);
  const [photo1, setPhoto1] = useState<string | null>(null);
  const [photo2, setPhoto2] = useState<string | null>(null);

  // Original Fields
  const [condition, setCondition] = useState<"GOOD" | "FAIR" | "POOR">("GOOD");
  const [milk, setMilk] = useState("");
  const [isPregnant, setIsPregnant] = useState(false);
  const [notes, setNotes] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [saving, setSaving] = useState(false);

  const pickImage = async (setter: (uri: string) => void) => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') return;
    const result = await ImagePicker.launchCameraAsync({ allowsEditing: true, aspect: [4, 3], quality: 0.5 });
    if (!result.canceled) setter(result.assets[0].uri);
  };

  async function onSave() {
    setSaving(true);
    try {
      let p1 = null, p2 = null;
      if (photo1) p1 = (await uploadToCloudinary(photo1, "followups")).secureUrl;
      if (photo2) p2 = (await uploadToCloudinary(photo2, "followups")).secureUrl;

      const followUp: FollowUp = {
        id: uuidv4(),
        beneficiaryId,
        animalId,
        date,
        // New fields
        hasCowInShed,
        hasShed,
        remembersYearReceived: remembersYear,
        yearReceivedInput: parseInt(yearReceived) || null,
        noCowReason: !hasCowInShed ? noCowReason : null,
        noCowNotes: !hasCowInShed ? noCowNotes : null,
        hasPassedOn,
        noPassOnReason: !hasPassedOn ? noPassOnReason : null,
        bodyCondition,
        photo1Uri: p1,
        photo2Uri: p2,

        // Existing fields
        cowCondition: condition,
        milkProductionPerDay: parseFloat(milk) || 0,
        isPregnant,
        notes: notes.trim() || "",
        reportedBy: profile?.fullName ?? "Unknown",
        createdAt: new Date().toISOString(),
        district: null,
        sector: null,
        cell: null,
        village: null,
      };

      await saveFollowUp(followUp);
      Alert.alert("Byagenze neza", "Ikurikirana ryanditswe.");
      navigation.goBack();
    } catch (e) {
      console.error(e);
      Alert.alert("Ikosa", "Ntibishoboye kubikwa.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.formTitle}>GUSURA UMURYANGO WAHAWE INKA MURI GAHUNDA YA GIRINKA</Text>

      {/* SECTION 1 */}
      <View style={styles.section}>
        <View style={[styles.field, styles.row]}>
          <Text style={styles.label}>* UMURYANGO UFITE INKA MU KIRARO?</Text>
          <View style={styles.switchGroup}>
            <Text style={styles.switchLabel}>{hasCowInShed ? "YEGO" : "OYA"}</Text>
            <Switch value={hasCowInShed} onValueChange={setHasCowInShed} />
          </View>
        </View>

        <View style={[styles.field, styles.row]}>
          <Text style={styles.label}>* UMURYANGO WUBATSE IKIRARO?</Text>
          <View style={styles.switchGroup}>
            <Text style={styles.switchLabel}>{hasShed ? "YEGO" : "OYA"}</Text>
            <Switch value={hasShed} onValueChange={setHasShed} />
          </View>
        </View>

        <View style={[styles.field, styles.row]}>
          <Text style={styles.label}>* UMURYANGO WIBUKA IGIHE WAHEREWE INKA</Text>
          <View style={styles.switchGroup}>
            <Text style={styles.switchLabel}>{remembersYear ? "YEGO" : "OYA"}</Text>
            <Switch value={remembersYear} onValueChange={setRemembersYear} />
          </View>
        </View>

        {remembersYear && (
          <View style={styles.field}>
            <Text style={styles.label}>Andika umwaka umuryango wakiriyemo inka</Text>
            <TextInput
              style={styles.input}
              value={yearReceived}
              onChangeText={setYearReceived}
              keyboardType="numeric"
              placeholder="Urugero: 2018"
            />
          </View>
        )}
      </View>

      {/* SECTION 2: Visible if no cow */}
      {!hasCowInShed && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>» NTA NKA IRI MU RUGO</Text>
          <LocationSelector
            label="* IMPAMVU UMURYANGO UDAFITE INKA MU KIRARO"
            value={NO_COW_REASONS.find(r => r.value === noCowReason)?.label || ""}
            options={NO_COW_REASONS.map(r => r.label)}
            onSelect={(label) => setNoCowReason(NO_COW_REASONS.find(r => r.label === label)?.value)}
          />
          <View style={styles.field}>
            <Text style={styles.label}>SHYIRAHO IBISOBANURO</Text>
            <TextInput
              style={styles.input}
              value={noCowNotes}
              onChangeText={setNoCowNotes}
              multiline
            />
          </View>
        </View>
      )}

      {/* SECTION 3: PASS ON */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>» KWITURA</Text>
        <View style={[styles.field, styles.row]}>
          <Text style={styles.label}>* UMURYANGO WARITUYE?</Text>
          <View style={styles.switchGroup}>
            <Text style={styles.switchLabel}>{hasPassedOn ? "YEGO" : "OYA"}</Text>
            <Switch value={hasPassedOn} onValueChange={setHasPassedOn} />
          </View>
        </View>

        {!hasPassedOn && (
          <LocationSelector
            label="IMPAMVU UMURYANGO UTARITURA NI IYIHE?"
            value={NO_PASS_ON_REASONS.find(r => r.value === noPassOnReason)?.label || ""}
            options={NO_PASS_ON_REASONS.map(r => r.label)}
            onSelect={(label) => setNoPassOnReason(NO_PASS_ON_REASONS.find(r => r.label === label)?.value)}
          />
        )}
      </View>

      {/* SECTION 4: ANIMAL CONDITION (Original fields) */}
      {hasCowInShed && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>» IMITERERE Y'INKA</Text>

          <LocationSelector
            label="UKO INKA WAYIBONYE IHAGAZE (Body weight appearance Appreciation)"
            value={BODY_CONDITION_OPTS.find(r => r.value === bodyCondition)?.label || ""}
            options={BODY_CONDITION_OPTS.map(r => r.label)}
            onSelect={(label) => setBodyCondition(BODY_CONDITION_OPTS.find(r => r.label === label)?.value)}
          />

          <LocationSelector
            label="Uko inka imeze (Condition - General)"
            value={condition}
            options={CONDITIONS}
            onSelect={(val) => setCondition(val as any)}
          />

          <View style={styles.field}>
            <Text style={styles.label}>Amata itanga ku munsi (Milk production L/day)</Text>
            <TextInput style={styles.input} value={milk} onChangeText={setMilk} keyboardType="numeric" />
          </View>

          <View style={[styles.field, styles.row]}>
            <Text style={styles.label}>Ese irahaka? (Is Pregnant?)</Text>
            <Switch value={isPregnant} onValueChange={setIsPregnant} />
          </View>

          <Text style={styles.label}>* AMAFOTO Y'INKA</Text>
          <View style={{ flexDirection: 'row', gap: 10, marginBottom: 10 }}>
             <Pressable style={styles.photoBox} onPress={() => pickImage(setPhoto1)}>
                {photo1 ? <Image source={{ uri: photo1 }} style={styles.photoThumb} /> : <Text style={styles.photoText}>Ifoto 1</Text>}
             </Pressable>
             <Pressable style={styles.photoBox} onPress={() => pickImage(setPhoto2)}>
                {photo2 ? <Image source={{ uri: photo2 }} style={styles.photoThumb} /> : <Text style={styles.photoText}>Ifoto 2</Text>}
             </Pressable>
          </View>
        </View>
      )}

      <View style={styles.section}>
        <View style={styles.field}>
          <Text style={styles.label}>Itariki yasuriweho (Date)</Text>
          <Pressable onPress={() => setShowDatePicker(true)}>
            <View pointerEvents="none">
              <TextInput style={styles.input} value={date} editable={false} />
            </View>
          </Pressable>
          {showDatePicker && (
            <DateTimePicker
              value={new Date(date)}
              mode="date"
              display="default"
              onChange={(event, selectedDate) => {
                setShowDatePicker(false);
                if (selectedDate) {
                  setDate(selectedDate.toISOString().split('T')[0]);
                }
              }}
            />
          )}
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Ibindi wagaragaza (Notes)</Text>
          <TextInput
            style={[styles.input, { height: 60 }]}
            value={notes}
            onChangeText={setNotes}
            multiline
          />
        </View>
      </View>

      <Pressable style={styles.saveButton} onPress={onSave} disabled={saving}>
        {saving ? <ActivityIndicator color="white" /> : <Text style={styles.saveButtonText}>Bika Ikurikirana</Text>}
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, backgroundColor: "#f5f5f5" },
  formTitle: { fontSize: 14, fontWeight: "800", color: "#2c3e50", marginBottom: 20, textTransform: "uppercase" },
  section: { backgroundColor: "white", padding: 12, borderRadius: 8, marginBottom: 16, elevation: 1 },
  sectionTitle: { fontSize: 13, fontWeight: "700", color: "#1b6e3c", marginBottom: 12, borderBottomWidth: 1, borderBottomColor: "#eee", paddingBottom: 4 },
  label: { fontSize: 12, color: "#333", marginBottom: 6, fontWeight: "700", flex: 1 },
  field: { marginBottom: 14 },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 10 },
  switchGroup: { flexDirection: "row", alignItems: "center", gap: 8 },
  switchLabel: { fontSize: 11, fontWeight: "600", color: "#666" },
  input: { borderWidth: 1, borderColor: "#ccc", borderRadius: 8, padding: 10, backgroundColor: "#fff", fontSize: 14 },
  photoBox: { flex: 1, height: 80, backgroundColor: '#eee', borderRadius: 8, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#ccc', borderStyle: 'dashed' },
  photoThumb: { width: '100%', height: '100%', borderRadius: 8 },
  photoText: { fontSize: 10, color: '#666' },
  saveButton: { backgroundColor: "#1b6e3c", borderRadius: 10, padding: 14, alignItems: "center", marginTop: 10, marginBottom: 30 },
  saveButtonText: { color: "white", fontWeight: "700", fontSize: 16 },
});
