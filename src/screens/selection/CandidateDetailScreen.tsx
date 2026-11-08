import React, { useCallback, useState } from "react";
import { View, Text, Switch, StyleSheet, ScrollView } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useCanWrite } from "../../auth/AuthContext";
import { RootStackParamList } from "../../navigation/RootNavigator";
import {
  getEligibilityChecklist,
  updateEligibilityChecklist,
  getCommitteeDecision,
  getCandidate,
} from "../../db/selectionRepository";
import { EligibilityChecklist, CommitteeDecision, Candidate } from "../../types/selection";
import { t } from "../../i18n/strings";
import { Pressable, ActivityIndicator, Alert } from "react-native";
import { useCanManageRegistry } from "../../auth/AuthContext";

type Props = NativeStackScreenProps<RootStackParamList, "CandidateDetail">;

const CHECKLIST_ITEMS: {
  key: keyof Omit<EligibilityChecklist, "id" | "candidateId" | "updatedAt">;
  label: string;
}[] = [
  { key: "householdIdentified", label: "Umuryango warabonetse" },
  { key: "eligibilityConditionsChecked", label: "Ibisabwa byagenzuwe" },
  { key: "locationVerified", label: "Aho atuye byagenzuwe" },
  { key: "requiredDocumentsAvailable", label: "Inyandiko zisabwa zirahari" },
  { key: "householdAssessed", label: "Umuryango warasuzumwe" },
  { key: "candidateAcceptedByCommittee", label: "Yemewe na komite" },
  { key: "communityVerificationCompleted", label: "Igenzura ry'abaturage ryarangiye" },
  { key: "finalApprovalCompleted", label: "Yemejwe burundu" },
];

export default function CandidateDetailScreen({ route, navigation }: Props) {
  const { candidateId, fullName } = route.params;
  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [checklist, setChecklist] = useState<EligibilityChecklist | null>(null);
  const [decision, setDecision] = useState<CommitteeDecision | null>(null);
  const [loading, setLoading] = useState(true);
  const writable = useCanWrite();
  const canDistribute = useCanManageRegistry();

  useFocusEffect(
    useCallback(() => {
      let active = true;
      setLoading(true);
      Promise.all([
        getCandidate(candidateId),
        getEligibilityChecklist(candidateId),
        getCommitteeDecision(candidateId)
      ]).then(([cand, c, d]) => {
        if (active) {
          setCandidate(cand);
          setChecklist(c);
          setDecision(d);
          setLoading(false);
        }
      });
      return () => {
        active = false;
      };
    }, [candidateId])
  );

  async function toggle(key: (typeof CHECKLIST_ITEMS)[number]["key"]) {
    if (!checklist) return;
    const nextValue = !checklist[key];
    setChecklist({ ...checklist, [key]: nextValue });
    await updateEligibilityChecklist(candidateId, { [key]: nextValue } as any);
  }

  const isApproved = candidate?.conclusion === "APPROVED" ||
                    candidate?.graduationStatus === "APPROVED" ||
                    (decision?.decision === "APPROVED" && checklist?.finalApprovalCompleted);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.name}>{fullName}</Text>

      {loading && <ActivityIndicator color="#1b6e3c" style={{ marginBottom: 20 }} />}

      {!loading && (
        <>
        <View style={styles.actionRow}>
          {writable && (
            <>
              <Pressable
                style={styles.actionButton}
                onPress={() => navigation.navigate("CandidateAssessment", { candidateId, fullName })}
              >
                <Text style={styles.actionButtonText}>Gusuzuma (Score)</Text>
              </Pressable>
              <Pressable
                style={styles.actionButton}
                onPress={() => navigation.navigate("CommitteeDecision", { candidateId, fullName })}
              >
                <Text style={styles.actionButtonText}>Icyemezo</Text>
              </Pressable>
            </>
          )}
        </View>

        {writable && (
          <View style={{ flexDirection: 'row', gap: 10, marginTop: 8 }}>
            {isApproved && canDistribute && (
              <Pressable
                style={[styles.actionButton, { backgroundColor: "#ff9800" }]}
                onPress={() => navigation.navigate("DistributionForm", { beneficiaryId: candidateId, candidateId: candidateId })}
              >
                <Text style={styles.actionButtonText}>Guhaba Inka (Distribute)</Text>
              </Pressable>
            )}

            <Pressable
              style={[styles.actionButton, { backgroundColor: "#673ab7" }]}
              onPress={() => navigation.navigate("ShedInspectionForm", { beneficiaryId: candidateId })}
            >
              <Text style={styles.actionButtonText}>Isuzumwa ry'ikiraro</Text>
            </Pressable>
          </View>
        )}

        {writable && (
          <Pressable
            style={[styles.actionButton, { backgroundColor: "#d32f2f", marginTop: 8 }]}
            onPress={() => navigation.navigate("Appeal", { candidateId, fullName })}
          >
            <Text style={styles.actionButtonText}>Kujurira (Appeal)</Text>
          </Pressable>
        )}
        </>
      )}

      <Text style={styles.sectionTitle}>{t("eligibilityChecklist")}</Text>

      {checklist &&
        CHECKLIST_ITEMS.map((item) => (
          <View key={item.key} style={styles.row}>
            <Text style={styles.rowLabel}>{item.label}</Text>
            <Switch value={!!checklist[item.key]} onValueChange={() => toggle(item.key)} disabled={!writable} />
          </View>
        ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16 },
  name: { fontSize: 20, fontWeight: "700", marginBottom: 12 },
  actionRow: { flexDirection: "row", gap: 10 },
  actionButton: {
    flex: 1,
    backgroundColor: "#1b6e3c",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  actionButtonText: { color: "white", fontWeight: "600", fontSize: 13 },
  sectionTitle: { fontSize: 14, fontWeight: "700", color: "#1b6e3c", marginTop: 24, marginBottom: 10 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  rowLabel: { flex: 1, fontSize: 14, marginRight: 10 },
});
