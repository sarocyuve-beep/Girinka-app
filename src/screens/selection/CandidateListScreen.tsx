import React, { useCallback, useState } from "react";
import { View, Text, FlatList, Pressable, StyleSheet, Alert } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../navigation/RootNavigator";
import { listCandidatesByCampaign } from "../../db/selectionRepository";
import { Candidate } from "../../types/selection";
import { t } from "../../i18n/strings";
import { useCanWrite } from "../../auth/AuthContext";
import { generateCandidateReport, exportCandidatesToExcel, ReportMemoOptions } from "../../utils/reportGenerator";
import { MemoConfigModal } from "../../components/MemoConfigModal";

type Props = NativeStackScreenProps<RootStackParamList, "CandidateList">;

export default function CandidateListScreen({ route, navigation }: Props) {
  const { campaignId, campaignLabel } = route.params;
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const writable = useCanWrite();

  const [isMemoModalVisible, setIsMemoModalVisible] = useState(false);
  const [memoOptions, setMemoOptions] = useState<ReportMemoOptions>({
    enabled: true,
    from: "Umukozi ushinzwe Ubworozi mu Murenge wa CYUVE",
    to: "Bwana Umunyamabanga Nshingwabikorwa w'Umurenge wa CYUVE",
    subject: "Gukurikirana imitangire n'imicungire y'inka zitangwa muri gahunda ya Girinka",
    ref: "SARO",
    authorName: "YABARAGIYE Bernard",
    authorTitle: "Umukozi ushinzwe Ubworozi mu Murenge wa CYUVE",
    content: `Mu rwego rwo gukurikirana imitangire n'imicungire y'inka zitangwa muri gahunda ya girinka.

Mbandikiye iyi memo ngira ngo mbagezeho ku mugereka wayo raporo y'abakandida batoranyijwe guhabwa inka muri gahunda ya girinka.

Muri rusange amakuru yerekeye abo bakandida murayasanga ku mugereka w'iyi memo.`
  });

  useFocusEffect(
    useCallback(() => {
      let active = true;
      listCandidatesByCampaign(campaignId).then((rows) => {
        if (active) setCandidates(rows);
      });
      return () => {
        active = false;
      };
    }, [campaignId])
  );

  const handleGenerateReport = async () => {
    if (candidates.length === 0) {
      Alert.alert("Info", "Nta mukandida bahari bo gukorera raporo.");
      return;
    }
    setIsMemoModalVisible(true);
  };

  const confirmPdfGeneration = async () => {
    setIsMemoModalVisible(false);
    await generateCandidateReport(candidates, campaignLabel, memoOptions);
  };

  const handleExportExcel = async () => {
    if (candidates.length === 0) {
      Alert.alert("Info", "Nta mukandida bahari bo gukorera raporo.");
      return;
    }
    await exportCandidatesToExcel(candidates, campaignLabel);
  };

  return (
    <View style={styles.container}>
      <MemoConfigModal
        visible={isMemoModalVisible}
        onClose={() => setIsMemoModalVisible(false)}
        onConfirm={confirmPdfGeneration}
        options={memoOptions}
        setOptions={setMemoOptions}
      />
      <View style={styles.headerRow}>
        <Text style={styles.header}>{campaignLabel}</Text>
        <View style={styles.buttonGroup}>
          <Pressable style={styles.reportButton} onPress={handleGenerateReport}>
            <Text style={styles.reportButtonText}>PDF</Text>
          </Pressable>
          <Pressable style={[styles.reportButton, { backgroundColor: '#1d6f42', marginLeft: 8 }]} onPress={handleExportExcel}>
            <Text style={styles.reportButtonText}>Excel</Text>
          </Pressable>
        </View>
      </View>

      {writable && (
        <Pressable
          style={styles.newButton}
          onPress={() => navigation.navigate("CandidateForm", { campaignId })}
        >
          <Text style={styles.newButtonText}>+ {t("newCandidate")}</Text>
        </Pressable>
      )}

      {candidates.length === 0 && (
        <Text style={styles.empty}>Nta mukandida urabaho kuri iyi gahunda.</Text>
      )}

      <FlatList
        data={candidates}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Pressable
            style={styles.row}
            onPress={() =>
              navigation.navigate("CandidateDetail", { candidateId: item.id, fullName: item.fullName })
            }
          >
            <Text style={styles.rowTitle}>{item.fullName}</Text>
            <Text style={styles.rowSub}>{item.nationalId}</Text>
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  header: { fontSize: 16, fontWeight: "700", flex: 1 },
  reportButton: {
    backgroundColor: "#2c3e50",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  reportButtonText: { color: "white", fontSize: 12, fontWeight: "600" },
  newButton: {
    backgroundColor: "#1b6e3c",
    borderRadius: 10,
    padding: 14,
    alignItems: "center",
    marginBottom: 16,
  },
  newButtonText: { color: "white", fontWeight: "700", fontSize: 15 },
  empty: { textAlign: "center", color: "#666", marginTop: 24 },
  row: {
    backgroundColor: "#f2f4f2",
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
  },
  rowTitle: { fontSize: 15, fontWeight: "600" },
  rowSub: { fontSize: 12, color: "#666", marginTop: 4 },
});
