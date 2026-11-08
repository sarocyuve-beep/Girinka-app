import React from "react";
import { View, Text, StyleSheet, Pressable, ScrollView } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/RootNavigator";
import { t } from "../i18n/strings";
import { useAuth } from "../auth/AuthContext";
import { ROLE_LABEL, canManageUsers } from "../auth/scope";
import { importCyuveBeneficiariesIfNeeded } from "../db/registryRepository";
import { seedCyuveWaitingListIfNeeded } from "../db/selectionRepository";

type Props = NativeStackScreenProps<RootStackParamList, "Home">;

const MODULES: { label: keyof typeof import("../i18n/strings").strings; route: keyof RootStackParamList | null }[] = [
  { label: "selection", route: "SelectionCampaigns" },
  { label: "beneficiaries", route: "BeneficiaryList" },
  { label: "animals", route: "AnimalList" },
  { label: "distribution", route: "DistributionList" },
  { label: "followUp", route: "FollowUpList" },
  { label: "kwitura", route: "PassOnList" },
  { label: "incidents", route: "IncidentList" },
  { label: "shedInspection", route: "ShedInspectionList" },
  { label: "reports", route: "ReportSelection" },
  { label: "waitingList", route: "WaitingList" },
  { label: "passOnAssessment", route: "PassOnAssessmentList" },
];

export default function HomeScreen({ navigation }: Props) {
  const { profile } = useAuth();

  React.useEffect(() => {
    if (profile) {
      importCyuveBeneficiariesIfNeeded().catch(console.error);
      seedCyuveWaitingListIfNeeded().catch(console.error);
    }
  }, [profile]);

  const where = [profile?.district, profile?.sector, profile?.cell, profile?.village].filter(Boolean).join(" › ");
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>{t("appName")}</Text>
      <Text style={styles.subtitle}>{t("appSubtitle")}</Text>

      {profile && (
        <View style={styles.userBox}>
          <Text style={styles.userName}>{profile.fullName}</Text>
          <Text style={styles.userMeta}>
            {ROLE_LABEL[profile.role] ?? profile.role} · {where}
          </Text>
        </View>
      )}

      <View style={styles.grid}>
        {MODULES.map((m) => (
          <Pressable
            key={m.label}
            style={[styles.card, !m.route && styles.cardDisabled]}
            disabled={!m.route}
            onPress={() => m.route && navigation.navigate(m.route as any)}
          >
            <Text style={styles.cardText}>{t(m.label)}</Text>
            {!m.route && <Text style={styles.soon}>{t("comingSoon")}</Text>}
          </Pressable>
        ))}
        {canManageUsers(profile?.role) && (
          <Pressable style={styles.card} onPress={() => navigation.navigate("UserList")}>
            <Text style={styles.cardText}>Abakoresha</Text>
          </Pressable>
        )}
      </View>

      <Pressable onPress={() => navigation.navigate("ChangePassword")} style={{ marginTop: 8 }}>
        <Text style={styles.link}>Guhindura ijambobanga</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingTop: 60 },
  title: { fontSize: 28, fontWeight: "700", textAlign: "center" },
  subtitle: { fontSize: 12, color: "#666", textAlign: "center", marginTop: 6, marginBottom: 24 },
  userBox: { backgroundColor: "#eef5ef", borderRadius: 10, padding: 10, marginBottom: 18 },
  userName: { fontWeight: "700", fontSize: 14, textAlign: "center" },
  userMeta: { fontSize: 12, color: "#555", textAlign: "center", marginTop: 2 },
  link: { color: "#1b6e3c", textAlign: "center", fontWeight: "600", padding: 8 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12, justifyContent: "space-between" },
  card: {
    width: "47%",
    backgroundColor: "#1b6e3c",
    borderRadius: 14,
    paddingVertical: 22,
    marginBottom: 12,
    alignItems: "center",
  },
  cardDisabled: { backgroundColor: "#9aa39a" },
  cardText: { color: "white", fontSize: 16, fontWeight: "600" },
  soon: { color: "#eee", fontSize: 11, marginTop: 4 },
});
