import React, { useCallback, useState, useEffect } from "react";
import { View, Text, StyleSheet, FlatList, ActivityIndicator, Pressable, Alert } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../navigation/RootNavigator";
import { listAllIncidents, listBeneficiaries } from "../../db/registryRepository";
import { Incident } from "../../types/registry";
import { TimePeriod, TimePeriodFilter } from "../../components/TimePeriodFilter";
import { isWithinInterval, startOfDay, startOfWeek, startOfMonth, startOfYear, parseISO } from "date-fns";
import { generateIncidentReport, exportIncidentToExcel, ReportMemoOptions } from "../../utils/reportGenerator";
import { useCanEditFieldData } from "../../auth/AuthContext";
import { deleteIncident } from "../../db/registryRepository";
import { MemoConfigModal } from "../../components/MemoConfigModal";

type Props = NativeStackScreenProps<RootStackParamList, "IncidentList">;

export default function IncidentListScreen({ navigation }: Props) {
  const [allIncidents, setAllIncidents] = useState<Incident[]>([]);
  const [filteredIncidents, setFilteredIncidents] = useState<Incident[]>([]);
  const [period, setPeriod] = useState<TimePeriod>("ALL");
  const [loading, setLoading] = useState(true);
  const canEdit = useCanEditFieldData();

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

Mbandikiye iyi memo ngira ngo mbagezeho ku mugereka wayo raporo y'ibibazo byagaragaye ku nka zitangwa muri gahunda ya girinka.

Muri rusange amakuru yerekeye ibyo bibazo murayasanga ku mugereka w'iyi memo.`
  });

  const loadIncidents = useCallback(() => {
    setLoading(true);
    listAllIncidents().then((data) => {
      const sorted = data.sort((a, b) => b.date.localeCompare(a.date));
      setAllIncidents(sorted);
      setFilteredIncidents(sorted);
      setLoading(false);
    });
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadIncidents();
    }, [loadIncidents])
  );

  useEffect(() => {
    if (period === "ALL") {
      setFilteredIncidents(allIncidents);
      return;
    }

    const now = new Date();
    let start: Date;
    if (period === "DAY") start = startOfDay(now);
    else if (period === "WEEK") start = startOfWeek(now);
    else if (period === "MONTH") start = startOfMonth(now);
    else start = startOfYear(now);

    const filtered = allIncidents.filter(i => {
      try {
        const d = parseISO(i.date);
        return d >= start && d <= now;
      } catch {
        return false;
      }
    });
    setFilteredIncidents(filtered);
  }, [period, allIncidents]);

  if (loading) return <ActivityIndicator style={{ marginTop: 40 }} color="#1b6e3c" />;

  const handleExportPDF = async () => {
    if (filteredIncidents.length === 0) {
      Alert.alert("Info", "Nta makuru ahari yo gukorera raporo.");
      return;
    }
    setIsMemoModalVisible(true);
  };

  const confirmPdfGeneration = async () => {
    setIsMemoModalVisible(false);
    const beneficiaries = await listBeneficiaries({ max: 5000 });
    await generateIncidentReport(filteredIncidents, beneficiaries, memoOptions);
  };

  const handleExportExcel = async () => {
    if (filteredIncidents.length === 0) {
      Alert.alert("Info", "Nta makuru ahari yo gukorera raporo.");
      return;
    }
    const beneficiaries = await listBeneficiaries({ max: 5000 });
    await exportIncidentToExcel(filteredIncidents, beneficiaries);
  };

  const handleDelete = (id: string) => {
    Alert.alert("Gusiba", "Ese wizeye ko ushaka gusiba iki kibazo cyanditswe?", [
      { text: "Oya" },
      {
        text: "Yego",
        style: "destructive",
        onPress: async () => {
          await deleteIncident(id);
          loadIncidents();
        },
      },
    ]);
  };

  const handleEdit = (item: Incident) => {
    navigation.navigate("IncidentForm", {
      beneficiaryId: item.beneficiaryId,
      animalId: item.animalId,
      incident: item
    });
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
        <View style={{ flex: 1 }}>
          <TimePeriodFilter selected={period} onSelect={setPeriod} />
        </View>
        <View style={styles.buttonGroup}>
          <Pressable style={styles.reportButton} onPress={handleExportPDF}>
            <Text style={styles.reportButtonText}>PDF</Text>
          </Pressable>
          <Pressable style={[styles.reportButton, { backgroundColor: '#1d6f42', marginLeft: 8 }]} onPress={handleExportExcel}>
            <Text style={styles.reportButtonText}>Excel</Text>
          </Pressable>
        </View>
      </View>
      <FlatList
        data={filteredIncidents}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={styles.type}>{item.type}</Text>
                <Text style={styles.date}>{item.date}</Text>
              </View>
              {canEdit && (
                <View style={styles.cardActions}>
                  <Pressable onPress={() => handleEdit(item)} style={styles.iconBtn}>
                    <Text style={{ color: "#1b6e3c", fontSize: 12, fontWeight: "600" }}>Edit</Text>
                  </Pressable>
                  <Pressable onPress={() => handleDelete(item.id)} style={styles.iconBtn}>
                    <Text style={{ color: "#dc2626", fontSize: 12, fontWeight: "600" }}>Delete</Text>
                  </Pressable>
                </View>
              )}
            </View>
            <Text style={styles.desc}>{item.description}</Text>
            <Text style={styles.meta}>Byanditswe na: {item.reportedBy}</Text>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.empty}>Nta bibazo byigeze byandikwa.</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    backgroundColor: "#f9f9f9",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  buttonGroup: {
    flexDirection: "row",
    paddingRight: 8,
  },
  reportButton: {
    backgroundColor: "#2c3e50",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
  },
  reportButtonText: { color: "white", fontSize: 11, fontWeight: "600" },
  card: { padding: 16, borderBottomWidth: 1, borderBottomColor: "#eee" },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 },
  cardActions: { flexDirection: "row", gap: 12 },
  iconBtn: { padding: 4 },
  type: { fontSize: 16, fontWeight: "700", color: "#b3261e" },
  date: { fontSize: 12, color: "#666" },
  desc: { fontSize: 14, color: "#333", marginTop: 4 },
  meta: { fontSize: 11, color: "#888", marginTop: 6 },
  empty: { textAlign: "center", marginTop: 40, color: "#999" },
});
