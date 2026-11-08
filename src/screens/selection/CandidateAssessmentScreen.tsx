import React, { useState } from "react";
import { View, Text, TextInput, Pressable, StyleSheet, ScrollView, Alert, ActivityIndicator } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../navigation/RootNavigator";
import { saveAssessment } from "../../db/selectionRepository";
import { t } from "../../i18n/strings";

type Props = NativeStackScreenProps<RootStackParamList, "CandidateAssessment">;

export default function CandidateAssessmentScreen({ route, navigation }: Props) {
  const { candidateId, fullName } = route.params;
  const [criterion, setCriterion] = useState("Ubudehe / Imibereho");
  const [score, setScore] = useState("");
  const [totalScore, setTotalScore] = useState("");
  const [recommendation, setRecommendation] = useState("");
  const [saving, setSaving] = useState(false);

  async function onSave() {
    if (!score || !totalScore) {
      Alert.alert("Ikosa", "Uzuza amanota.");
      return;
    }

    setSaving(true);
    try {
      await saveAssessment({
        candidateId,
        criterion: criterion.trim(),
        score: Number(score),
        totalScore: Number(totalScore),
        recommendation: recommendation.trim() || null,
        assessmentOfficer: "Field Officer", // Ibi bizava muri Auth nyuma
        assessmentDate: new Date().toISOString(),
      });
      Alert.alert("Byagenze neza", "Amanota yishyizwe muri sisitemu.");
      navigation.goBack();
    } catch (e) {
      Alert.alert("Ikosa", "Ntibishoboye kubikwa.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Gusuzuma: {fullName}</Text>

      <View style={styles.field}>
        <Text style={styles.label}>Ikigenderwaho (Criterion)</Text>
        <TextInput style={styles.input} value={criterion} onChangeText={setCriterion} />
      </View>

      <View style={styles.row}>
        <View style={[styles.field, { flex: 1, marginRight: 10 }]}>
          <Text style={styles.label}>Amanota yabonye</Text>
          <TextInput
            style={styles.input}
            value={score}
            onChangeText={setScore}
            keyboardType="numeric"
            placeholder="0"
          />
        </View>
        <View style={[styles.field, { flex: 1 }]}>
          <Text style={styles.label}>Amanota yose</Text>
          <TextInput
            style={styles.input}
            value={totalScore}
            onChangeText={setTotalScore}
            keyboardType="numeric"
            placeholder="100"
          />
        </View>
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Icyifuzo (Recommendation)</Text>
        <TextInput
          style={[styles.input, { height: 80 }]}
          value={recommendation}
          onChangeText={setRecommendation}
          multiline
        />
      </View>

      <Pressable style={styles.saveButton} onPress={onSave} disabled={saving}>
        {saving ? <ActivityIndicator color="white" /> : <Text style={styles.saveButtonText}>Bika Amanota</Text>}
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16 },
  title: { fontSize: 18, fontWeight: "700", marginBottom: 20, color: "#1b6e3c" },
  field: { marginBottom: 16 },
  row: { flexDirection: "row" },
  label: { fontSize: 13, color: "#333", marginBottom: 6, fontWeight: "600" },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 10,
    fontSize: 15,
    backgroundColor: "white",
  },
  saveButton: {
    backgroundColor: "#1b6e3c",
    borderRadius: 10,
    padding: 14,
    alignItems: "center",
    marginTop: 10,
  },
  saveButtonText: { color: "white", fontWeight: "700", fontSize: 16 },
});
