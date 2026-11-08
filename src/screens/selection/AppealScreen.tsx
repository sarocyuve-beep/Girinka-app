import React, { useState } from "react";
import { View, Text, TextInput, Pressable, StyleSheet, ScrollView, Alert, ActivityIndicator } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../navigation/RootNavigator";
import { submitAppeal } from "../../db/selectionRepository";
import { useAuth } from "../../auth/AuthContext";

type Props = NativeStackScreenProps<RootStackParamList, "Appeal">;

export default function AppealScreen({ route, navigation }: Props) {
  const { candidateId, fullName } = route.params;
  const { profile } = useAuth();
  const [reason, setReason] = useState("");
  const [submittedBy, setSubmittedBy] = useState("");
  const [saving, setSaving] = useState(false);

  async function onSave() {
    if (!reason || !submittedBy) {
      Alert.alert("Ikosa", "Uzuza impamvu n'uwajuririye.");
      return;
    }

    setSaving(true);
    try {
      await submitAppeal({
        candidateId,
        dateSubmitted: new Date().toISOString(),
        reason: reason.trim(),
        submittedBy: submittedBy.trim(),
        decision: "PENDING",
        decisionDate: null,
        decisionOfficer: null,
        document: null,
        district: profile?.district?.toUpperCase() || "MUSANZE",
        sector: profile?.sector?.toUpperCase() || null,
        cell: profile?.cell?.toUpperCase() || null,
        village: profile?.village?.toUpperCase() || null,
      });
      Alert.alert("Byagenze neza", "Ubujurire bwoherejwe.");
      navigation.goBack();
    } catch (e) {
      Alert.alert("Ikosa", "Ntibishoboye koherezwa.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Kujurira: {fullName}</Text>

      <View style={styles.field}>
        <Text style={styles.label}>Uwajuririye (Submitted By)</Text>
        <TextInput style={styles.input} value={submittedBy} onChangeText={setSubmittedBy} placeholder="Amazina yombi" />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Impamvu y'ubujurire (Reason)</Text>
        <TextInput
          style={[styles.input, { height: 100 }]}
          value={reason}
          onChangeText={setReason}
          multiline
          placeholder="Sobanura ikibazo..."
        />
      </View>

      <Pressable style={styles.saveButton} onPress={onSave} disabled={saving}>
        {saving ? <ActivityIndicator color="white" /> : <Text style={styles.saveButtonText}>Kohereza Ubujurire</Text>}
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16 },
  title: { fontSize: 18, fontWeight: "700", marginBottom: 20, color: "#1b6e3c" },
  label: { fontSize: 13, color: "#333", marginBottom: 6, fontWeight: "600" },
  field: { marginBottom: 14 },
  input: { borderWidth: 1, borderColor: "#ccc", borderRadius: 8, padding: 10, backgroundColor: "white" },
  saveButton: { backgroundColor: "#1b6e3c", borderRadius: 10, padding: 14, alignItems: "center", marginTop: 10 },
  saveButtonText: { color: "white", fontWeight: "700", fontSize: 16 },
});
