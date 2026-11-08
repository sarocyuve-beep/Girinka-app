import React from "react";
import { View, Text, StyleSheet, Pressable, ScrollView } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../navigation/RootNavigator";
import { t } from "../../i18n/strings";

type Props = NativeStackScreenProps<RootStackParamList, "ReportSelection">;

export default function ReportSelectionScreen({ navigation }: Props) {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Raporo za Sisitemu</Text>

      <ReportCard
        title="Raporo y'Abagenerwabikorwa"
        desc="Urutonde rw'abahawe inka n'aho baherereye."
        onPress={() => navigation.navigate("BeneficiaryList")}
      />

      <ReportCard
        title="Raporo y'Isuzumwa ry'Ibiraro"
        desc="Urutonde rw'abakandida n'abagenerwabikorwa basuriwe ibiraro."
        onPress={() => navigation.navigate("ShedInspectionList")}
      />

      <ReportCard
        title="Raporo y'Itangwa ry'Inka"
        desc="Deta y'itangwa ry'inka (2026-2027)."
        onPress={() => navigation.navigate("DistributionList")}
      />

      <ReportCard
        title="Raporo y'Ikurikirana"
        desc="Uko inka zahawe abaturage zimeze."
        onPress={() => navigation.navigate("FollowUpList")}
      />

      <ReportCard
        title="Raporo y'Ibibazo n'Impamvu"
        desc="Inka zapfuye, izibwe, cyangwa izindi mpamvu."
        onPress={() => navigation.navigate("IncidentList")}
      />

      <ReportCard
        title="Raporo yo Kwitura (Pass-on)"
        desc="Urutonde rw'abatuwe n'abaturage bishyuye inka (Donor & Receiver)."
        onPress={() => navigation.navigate("PassOnList")}
      />

      <ReportCard
        title="Ibarura ry'Inka zo kwiturwa"
        desc="Ifishi yo gukusanya amakuru ku bagenerwabikorwa bafite inka zo kwiturwa."
        onPress={() => navigation.navigate("PassOnAssessmentList")}
      />

      <ReportCard
        title="Raporo y'Isuzumwa ry'Ibiraro"
        desc="Urutonde rw'abakandida n'abagenerwabikorwa basuriwe ibiraro."
        onPress={() => navigation.navigate("ShedInspectionList")}
      />
    </ScrollView>
  );
}

function ReportCard({ title, desc, onPress }: { title: string, desc: string, onPress: () => void }) {
  return (
    <Pressable style={styles.card} onPress={onPress}>
      <Text style={styles.cardTitle}>{title}</Text>
      <Text style={styles.cardDesc}>{desc}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20 },
  title: { fontSize: 22, fontWeight: "700", marginBottom: 20, color: "#1b6e3c" },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#eee",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardTitle: { fontSize: 16, fontWeight: "700", color: "#333" },
  cardDesc: { fontSize: 13, color: "#666", marginTop: 4 },
});
