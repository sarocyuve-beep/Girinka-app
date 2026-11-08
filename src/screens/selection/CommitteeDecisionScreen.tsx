import React, { useState } from "react";
import { View, Text, TextInput, Pressable, StyleSheet, ScrollView, Alert, ActivityIndicator } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../navigation/RootNavigator";
import { saveCommitteeDecision, getCandidate } from "../../db/selectionRepository";
import { saveBeneficiary } from "../../db/registryRepository";
import { CommitteeDecisionValue } from "../../types/selection";

type Props = NativeStackScreenProps<RootStackParamList, "CommitteeDecision">;

export default function CommitteeDecisionScreen({ route, navigation }: Props) {
  const { candidateId, fullName } = route.params;
  const [decision, setDecision] = useState<CommitteeDecisionValue>("APPROVED");
  const [decisionBy, setDecisionBy] = useState("Komite y'Umurenge");
  const [reason, setReason] = useState("");
  const [comments, setComments] = useState("");
  const [minutesRef, setMinutesRef] = useState("");
  const [saving, setSaving] = useState(false);

  async function onSave() {
    setSaving(true);
    try {
      await saveCommitteeDecision({
        candidateId,
        decision,
        decisionDate: new Date().toISOString(),
        decisionBy: decisionBy.trim(),
        reason: reason.trim() || null,
        comments: comments.trim() || null,
        minutesReference: minutesRef.trim() || null,
        supportingDocument: null,
      });

      Alert.alert("Byagenze neza", "Icyemezo cya komite cyabitswe neza.");
      navigation.goBack();
    } catch (e) {
      Alert.alert("Ikosa", "Ntibishoboye kubikwa.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Icyemezo cya Komite: {fullName}</Text>

      <Text style={styles.label}>Icyemezo (Decision)</Text>
      <View style={styles.decisionRow}>
        <Pressable
          style={[styles.decisionButton, decision === "APPROVED" && styles.btnApproved]}
          onPress={() => setDecision("APPROVED")}
        >
          <Text style={decision === "APPROVED" ? styles.txtActive : styles.txtInactive}>EMERWA (APPROVED)</Text>
        </Pressable>
        <Pressable
          style={[styles.decisionButton, decision === "REJECTED" && styles.btnRejected]}
          onPress={() => setDecision("REJECTED")}
        >
          <Text style={decision === "REJECTED" ? styles.txtActive : styles.txtInactive}>GUKURAMO (REJECTED)</Text>
        </Pressable>
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Urwego rwafashe icyemezo (Decision By)</Text>
        <TextInput style={styles.input} value={decisionBy} onChangeText={setDecisionBy} />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Impamvu / Ibyashingiweho (Reason)</Text>
        <TextInput style={styles.input} value={reason} onChangeText={setReason} placeholder="Urugero: Nta kiraro cyiza afite" />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Inyandiko y'Inama / Imyanzuro (Minutes Ref)</Text>
        <TextInput style={styles.input} value={minutesRef} onChangeText={setMinutesRef} placeholder="Urugero: MIN-2025-04" />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Ibitekerezo bindi (Comments)</Text>
        <TextInput style={[styles.input, { height: 60 }]} value={comments} onChangeText={setComments} multiline />
      </View>

      <Pressable style={styles.saveButton} onPress={onSave} disabled={saving}>
        {saving ? <ActivityIndicator color="white" /> : <Text style={styles.saveButtonText}>Bika Icyemezo</Text>}
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16 },
  title: { fontSize: 18, fontWeight: "700", marginBottom: 20, color: "#1b6e3c" },
  label: { fontSize: 13, color: "#333", marginBottom: 6, fontWeight: "600" },
  decisionRow: { flexDirection: "row", gap: 10, marginBottom: 16 },
  decisionButton: { flex: 1, borderWidth: 1, borderColor: "#ccc", borderRadius: 8, padding: 12, alignItems: "center" },
  btnApproved: { backgroundColor: "#1b6e3c", borderColor: "#1b6e3c" },
  btnRejected: { backgroundColor: "#d32f2f", borderColor: "#d32f2f" },
  txtActive: { color: "white", fontWeight: "700" },
  txtInactive: { color: "#555" },
  field: { marginBottom: 14 },
  input: { borderWidth: 1, borderColor: "#ccc", borderRadius: 8, padding: 10, backgroundColor: "white" },
  saveButton: { backgroundColor: "#1b6e3c", borderRadius: 10, padding: 14, alignItems: "center", marginTop: 10 },
  saveButtonText: { color: "white", fontWeight: "700", fontSize: 16 },
});
