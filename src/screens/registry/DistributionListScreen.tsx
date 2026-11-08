import React, { useCallback, useState, useEffect } from "react";
import { View, Text, StyleSheet, FlatList, ActivityIndicator, Pressable, Alert } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../navigation/RootNavigator";
import { listAllDistributions, listBeneficiaries, getAnimalById } from "../../db/registryRepository";
import { Distribution } from "../../types/registry";
import { Animal } from "../../types/animal";
import { t } from "../../i18n/strings";
import { TimePeriod, TimePeriodFilter } from "../../components/TimePeriodFilter";
import { startOfDay, startOfWeek, startOfMonth, startOfYear, parseISO, getYear } from "date-fns";
import { generateDistributionReport, exportDistributionToExcel, ReportMemoOptions } from "../../utils/reportGenerator";
import { MemoConfigModal } from "../../components/MemoConfigModal";

type Props = NativeStackScreenProps<RootStackParamList, "DistributionList">;

export default function DistributionListScreen({ navigation }: Props) {
  const [allDists, setAllDists] = useState<Distribution[]>([]);
  const [distributions, setDistributions] = useState<Distribution[]>([]);
  const [animals, setAnimals] = useState<Record<string, Animal>>({});
  const [period, setPeriod] = useState<TimePeriod>("ALL");
  const [loading, setLoading] = useState(true);

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

Mbandikiye iyi memo ngira ngo mbagezeho ku mugereka wayo raporo y'itangwa ry'inka muri gahunda ya girinka.

Muri rusange amakuru yerekeye itangwa ry'inka murayasanga ku mugereka w'iyi memo.`
  });

  useFocusEffect(
    useCallback(() => {
      listAllDistributions().then(async (data) => {
        const sorted = data.sort((a, b) => b.yearReceived - a.yearReceived);
        setAllDists(sorted);
        setDistributions(sorted);

        // Fetch animal details for tags
        const animalMap: Record<string, Animal> = {};
        for (const d of sorted) {
          if (d.animalId && !animalMap[d.animalId]) {
            const a = await getAnimalById(d.animalId);
            if (a) animalMap[d.animalId] = a;
          }
        }
        setAnimals(animalMap);
        setLoading(false);
      });
    }, [])
  );

  useEffect(() => {
    if (period === "ALL") {
      setDistributions(allDists);
      return;
    }
    const now = new Date();
    const currentYear = getYear(now);

    const filtered = allDists.filter(d => {
      if (period === "YEAR") return d.yearReceived === currentYear;
      // For distributions, we mostly have yearReceived.
      // If we have createdAt, we can be more precise for DAY/WEEK/MONTH
      if (d.createdAt) {
        let start: Date;
        if (period === "DAY") start = startOfDay(now);
        else if (period === "WEEK") start = startOfWeek(now);
        else if (period === "MONTH") start = startOfMonth(now);
        else start = startOfYear(now);

        try {
          const date = parseISO(d.createdAt);
          return date >= start && date <= now;
        } catch {
          return d.yearReceived === currentYear;
        }
      }
      return d.yearReceived === currentYear;
    });
    setDistributions(filtered);
  }, [period, allDists]);

  if (loading) return <ActivityIndicator style={{ marginTop: 40 }} color="#1b6e3c" />;

  const handleExportPDF = async () => {
    if (distributions.length === 0) {
      Alert.alert("Info", "Nta makuru ahari yo gukorera raporo.");
      return;
    }
    setIsMemoModalVisible(true);
  };

  const confirmPdfGeneration = async () => {
    setIsMemoModalVisible(false);
    const beneficiaries = await listBeneficiaries({ max: 5000 });
    await generateDistributionReport(distributions, beneficiaries, memoOptions);
  };

  const handleExportExcel = async () => {
    if (distributions.length === 0) {
      Alert.alert("Info", "Nta makuru ahari yo gukorera raporo.");
      return;
    }
    const beneficiaries = await listBeneficiaries({ max: 5000 });
    await exportDistributionToExcel(distributions, beneficiaries);
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
        data={distributions}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Pressable
            style={styles.card}
            onPress={() => navigation.navigate("BeneficiaryDetail", {
              beneficiaryId: item.beneficiaryId,
              fullName: "Umugenerwabikorwa"
            })}
          >
            <View style={styles.row}>
              <Text style={styles.year}>{item.yearReceived}</Text>
              <View style={[styles.badge, { backgroundColor: item.type === 'REPLACEMENT' ? '#d97706' : '#1b6e3c' }]}>
                <Text style={styles.badgeText}>{item.type === 'REPLACEMENT' ? 'GUSHUMBUSHWA' : 'BWA MBERE'}</Text>
              </View>
            </View>
            <Text style={styles.sub}>Inkomoko: {item.source}</Text>
            <Text style={styles.sub}>
              Inka (Tag): {item.animalId && animals[item.animalId] ? animals[item.animalId].earTag : 'Legacy/Ntabwo izwi'}
            </Text>
            <Text style={[styles.sub, { color: item.passedOnCow ? '#1b6e3c' : '#d97706', fontWeight: '600' }]}>
              Status yo kwitura: {item.passedOnCow ? `YARAKWITUYE (${item.passOnDate || '—'})` : 'NTAKOZE'}
            </Text>
            <Text style={styles.meta}>Kanda hano urebe umwirondoro arambuye</Text>
          </Pressable>
        )}
        ListEmptyComponent={<Text style={styles.empty}>Nta nka zirandikwa ko zahawe abagenerwabikorwa.</Text>}
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
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 },
  year: { fontSize: 18, fontWeight: "700", color: "#1b6e3c" },
  sub: { fontSize: 14, color: "#666" },
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  badgeText: { color: "white", fontSize: 10, fontWeight: "700" },
  empty: { textAlign: "center", marginTop: 40, color: "#999" },
});
