import React, { useCallback, useState, useEffect } from "react";
import { View, Text, StyleSheet, FlatList, ActivityIndicator, Pressable, Alert } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../navigation/RootNavigator";
import { listAllFollowUps, listBeneficiaries } from "../../db/registryRepository";
import { FollowUp } from "../../types/registry";
import { TimePeriod, TimePeriodFilter } from "../../components/TimePeriodFilter";
import { startOfDay, startOfWeek, startOfMonth, startOfYear, parseISO } from "date-fns";
import { generateFollowUpReport, exportFollowUpToExcel, ReportMemoOptions } from "../../utils/reportGenerator";
import { useCanEditFieldData } from "../../auth/AuthContext";
import { MemoConfigModal } from "../../components/MemoConfigModal";

type Props = NativeStackScreenProps<RootStackParamList, "FollowUpList">;

export default function FollowUpListScreen({ navigation }: Props) {
  const [allFollowUps, setAllFollowUps] = useState<FollowUp[]>([]);
  const [followUps, setFollowUps] = useState<FollowUp[]>([]);
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

Mbandikiye iyi memo ngira ngo mbagezeho ku mugereka wayo raporo y'ikurikirana ry'uko inka zimeze mu bagenerwabikorwa.

Muri rusange amakuru yerekeye uko inka zifashwe murayasanga ku mugereka w'iyi memo.`
  });

  const loadFollowUps = useCallback(() => {
    setLoading(true);
    listAllFollowUps().then((data) => {
      const sorted = data.sort((a, b) => b.date.localeCompare(a.date));
      setAllFollowUps(sorted);
      setFollowUps(sorted);
      setLoading(false);
    });
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadFollowUps();
    }, [loadFollowUps])
  );

  useEffect(() => {
    if (period === "ALL") {
      setFollowUps(allFollowUps);
      return;
    }
    const now = new Date();
    let start: Date;
    if (period === "DAY") start = startOfDay(now);
    else if (period === "WEEK") start = startOfWeek(now);
    else if (period === "MONTH") start = startOfMonth(now);
    else start = startOfYear(now);

    const filtered = allFollowUps.filter(i => {
      try {
        const d = parseISO(i.date);
        return d >= start && d <= now;
      } catch {
        return false;
      }
    });
    setFollowUps(filtered);
  }, [period, allFollowUps]);

  if (loading) return <ActivityIndicator style={{ marginTop: 40 }} color="#1b6e3c" />;

  const handleExportPDF = async () => {
    if (followUps.length === 0) {
      Alert.alert("Info", "Nta makuru ahari yo gukorera raporo.");
      return;
    }
    setIsMemoModalVisible(true);
  };

  const confirmPdfGeneration = async () => {
    setIsMemoModalVisible(false);
    const beneficiaries = await listBeneficiaries({ max: 5000 });
    await generateFollowUpReport(followUps, beneficiaries, memoOptions);
  };

  const handleExportExcel = async () => {
    if (followUps.length === 0) {
      Alert.alert("Info", "Nta makuru ahari yo gukorera raporo.");
      return;
    }
    const beneficiaries = await listBeneficiaries({ max: 5000 });
    await exportFollowUpToExcel(followUps, beneficiaries);
  };

  const handleDelete = (id: string) => {
    Alert.alert("Gusiba", "Ese wizeye ko ushaka gusiba iki gikorwa cy'ikurikirana?", [
      { text: "Oya" },
      {
        text: "Yego",
        style: "destructive",
        onPress: async () => {
          // Note: deleteFollowUp needs to be added to repository
          const { deleteFollowUp } = require("../../db/registryRepository");
          await deleteFollowUp(id);
          loadFollowUps();
        },
      },
    ]);
  };

  const handleEdit = (item: FollowUp) => {
    navigation.navigate("FollowUpForm", {
      beneficiaryId: item.beneficiaryId,
      animalId: item.animalId,
      followUp: item
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
          <Pressable
            style={[styles.reportButton, { backgroundColor: '#1b6e3c', marginRight: 8 }]}
            onPress={() => {
              navigation.navigate("BeneficiaryList");
              Alert.alert("Gusura Inka", "Hitamo umugenerwabikorwa ugiye gusura mu rutonde.");
            }}
          >
            <Text style={styles.reportButtonText}>+ Mushya</Text>
          </Pressable>
          <Pressable style={styles.reportButton} onPress={handleExportPDF}>
            <Text style={styles.reportButtonText}>PDF</Text>
          </Pressable>
          <Pressable style={[styles.reportButton, { backgroundColor: '#1d6f42', marginLeft: 8 }]} onPress={handleExportExcel}>
            <Text style={styles.reportButtonText}>XL</Text>
          </Pressable>
        </View>
      </View>
      <FlatList
        data={followUps}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={styles.date}>{item.date}</Text>
                <View style={[styles.badge, { alignSelf: 'flex-start', backgroundColor: item.cowCondition === 'GOOD' ? '#1b6e3c' : item.cowCondition === 'FAIR' ? '#d97706' : '#b3261e' }]}>
                  <Text style={styles.badgeText}>{item.cowCondition}</Text>
                </View>
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
            <Text style={styles.sub}>Umukozi: {item.reportedBy}</Text>
            <Text style={styles.notes} numberOfLines={2}>{item.notes}</Text>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.empty}>Nta bikorwa by'ikurikirana birandikwa.</Text>}
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
  date: { fontSize: 16, fontWeight: "700" },
  sub: { fontSize: 12, color: "#666" },
  notes: { fontSize: 14, color: "#333", marginTop: 4 },
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  badgeText: { color: "white", fontSize: 10, fontWeight: "700" },
  empty: { textAlign: "center", marginTop: 40, color: "#999" },
});
