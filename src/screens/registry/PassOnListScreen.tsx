import React, { useCallback, useState, useEffect } from "react";
import { View, Text, StyleSheet, FlatList, ActivityIndicator, ScrollView, Pressable, Alert, TextInput } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../navigation/RootNavigator";
import { listAllPassOns, getBeneficiary, listBeneficiaries } from "../../db/registryRepository";
import { PassOn, Beneficiary } from "../../types/registry";
import { getDb, COLLECTIONS } from "../../config/firebase";
import { doc, getDoc, getDocs, collection } from "firebase/firestore";
import { Animal } from "../../types/animal";
import { TimePeriod, TimePeriodFilter } from "../../components/TimePeriodFilter";
import { startOfDay, startOfWeek, startOfMonth, startOfYear, parseISO } from "date-fns";
import { generatePassOnReport, exportPassOnToExcel, ReportMemoOptions } from "../../utils/reportGenerator";
import { MemoConfigModal } from "../../components/MemoConfigModal";

type Props = NativeStackScreenProps<RootStackParamList, "PassOnList">;

interface PassOnReportData extends PassOn {
  donor?: Beneficiary;
  recipient?: Beneficiary;
  animal?: Animal;
}

export default function PassOnListScreen({ navigation }: Props) {
  const [allData, setAllData] = useState<PassOnReportData[]>([]);
  const [reportData, setReportData] = useState<PassOnReportData[]>([]);
  const [searchText, setSearchText] = useState("");
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

Mbandikiye iyi memo ngira ngo mbagezeho ku mugereka wayo raporo y'igikorwa cyo kwitura (Pass-on) mu bagenerwabikorwa ba Girinka.

Muri rusange amakuru yerekeye abamaze kwitura n'abahawe inka murayasanga ku mugereka w'iyi memo.`
  });

  useFocusEffect(
    useCallback(() => {
      async function fetchData() {
        setLoading(true);
        try {
          const passOns = await listAllPassOns();

          // Optimization: Fetch all needed data in bulk instead of per-row queries
          const beneficiaries = await listBeneficiaries({ max: 5000 });
          const benMap = new Map(beneficiaries.map(b => [b.id, b]));

          const animalsSnap = await getDocs(collection(getDb(), COLLECTIONS.animals));
          const animalMap = new Map(animalsSnap.docs.map(d => [d.id, d.data() as Animal]));

          const enriched = passOns.map(po => ({
            ...po,
            donor: benMap.get(po.donorBeneficiaryId),
            recipient: benMap.get(po.recipientBeneficiaryId),
            animal: animalMap.get(po.animalId),
          }));

          const sorted = enriched.sort((a, b) => (b.date || "").localeCompare(a.date || ""));
          setAllData(sorted);
          setReportData(sorted);
        } catch (error) {
          console.error("Error fetching pass-ons:", error);
          Alert.alert("Ikosa", "Ntibishoboye gufungura urutonde rw'abaturiye.");
        } finally {
          setLoading(false);
        }
      }
      fetchData();
    }, [])
  );

  useEffect(() => {
    let filtered = allData;

    // Filter by period
    if (period !== "ALL") {
      const now = new Date();
      let start: Date;
      if (period === "DAY") start = startOfDay(now);
      else if (period === "WEEK") start = startOfWeek(now);
      else if (period === "MONTH") start = startOfMonth(now);
      else start = startOfYear(now);

      filtered = filtered.filter(i => {
        try {
          const d = parseISO(i.date);
          return d >= start && d <= now;
        } catch {
          return false;
        }
      });
    }

    // Filter by name (Search)
    const needle = searchText.trim().toLowerCase();
    if (needle) {
      filtered = filtered.filter(item =>
        item.donor?.fullName.toLowerCase().includes(needle) ||
        item.recipient?.fullName.toLowerCase().includes(needle) ||
        item.animal?.earTag.toLowerCase().includes(needle) ||
        item.donor?.nationalId.includes(needle) ||
        item.recipient?.nationalId.includes(needle)
      );
    }

    setReportData(filtered);
  }, [period, allData, searchText]);

  if (loading) return <ActivityIndicator style={{ marginTop: 40 }} color="#1b6e3c" />;

  const handleExportPDF = async () => {
    if (reportData.length === 0) {
      Alert.alert("Info", "Nta makuru ahari yo gukorera raporo.");
      return;
    }
    setIsMemoModalVisible(true);
  };

  const confirmPdfGeneration = async () => {
    setIsMemoModalVisible(false);
    const beneficiaries = await listBeneficiaries({ max: 5000 });
    const animalsSnap = await getDocs(collection(getDb(), COLLECTIONS.animals));
    const animals = animalsSnap.docs.map(d => d.data() as Animal);
    await generatePassOnReport(reportData, beneficiaries, animals, memoOptions);
  };

  const handleExportExcel = async () => {
    if (reportData.length === 0) {
      Alert.alert("Info", "Nta makuru ahari yo gukorera raporo.");
      return;
    }
    const beneficiaries = await listBeneficiaries({ max: 5000 });
    const animalsSnap = await getDocs(collection(getDb(), COLLECTIONS.animals));
    const animals = animalsSnap.docs.map(d => d.data() as Animal);
    await exportPassOnToExcel(reportData, beneficiaries, animals);
  };

  const Header = () => (
    <View style={styles.headerRow}>
      <Text style={[styles.headerCell, { width: 40 }]}>NO</Text>
      <View style={styles.verticalGroup}>
        <Text style={styles.groupTitle}>Uwituye (Donor / Original Recipient)</Text>
        <View style={styles.subHeaderRow}>
          <Text style={[styles.headerCell, { width: 120 }]}>NAME OF THE FARMER</Text>
          <Text style={[styles.headerCell, { width: 100 }]}>ID</Text>
          <Text style={[styles.headerCell, { width: 40 }]}>Sex</Text>
          <Text style={[styles.headerCell, { width: 80 }]}>SECTOR</Text>
          <Text style={[styles.headerCell, { width: 80 }]}>CELL</Text>
          <Text style={[styles.headerCell, { width: 80 }]}>VILLAGE</Text>
        </View>
      </View>
      <View style={styles.verticalGroup}>
        <Text style={styles.groupTitle}>Uwituwe (Recipient of PoG)</Text>
        <View style={styles.subHeaderRow}>
          <Text style={[styles.headerCell, { width: 120 }]}>NAME OF THE FARMER</Text>
          <Text style={[styles.headerCell, { width: 100 }]}>ID</Text>
          <Text style={[styles.headerCell, { width: 40 }]}>Sex</Text>
          <Text style={[styles.headerCell, { width: 80 }]}>CELL</Text>
          <Text style={[styles.headerCell, { width: 80 }]}>VILLAGE</Text>
        </View>
      </View>
      <View style={styles.verticalGroup}>
        <Text style={styles.groupTitle}>Received cow</Text>
        <View style={styles.subHeaderRow}>
          <Text style={[styles.headerCell, { width: 80 }]}>BREED</Text>
          <Text style={[styles.headerCell, { width: 80 }]}>EAR TAG</Text>
        </View>
      </View>
      <Text style={[styles.headerCell, { width: 100 }]}>DATE OF POG</Text>
      <Text style={[styles.headerCell, { width: 120 }]}>comment</Text>
    </View>
  );

  const RenderItem = ({ item, index }: { item: PassOnReportData; index: number }) => (
    <View style={styles.dataRow}>
      <View style={[styles.cell, { width: 40 }]}><Text style={styles.cellText}>{index + 1}</Text></View>

      {/* Donor */}
      <View style={[styles.cell, { width: 120 }]}><Text style={styles.cellText}>{item.donor?.fullName || "-"}</Text></View>
      <View style={[styles.cell, { width: 100 }]}><Text style={styles.cellText}>{item.donor?.nationalId || "-"}</Text></View>
      <View style={[styles.cell, { width: 40 }]}><Text style={styles.cellText}>{item.donor?.sex || "-"}</Text></View>
      <View style={[styles.cell, { width: 80 }]}><Text style={styles.cellText}>{item.donor?.sector || "-"}</Text></View>
      <View style={[styles.cell, { width: 80 }]}><Text style={styles.cellText}>{item.donor?.cell || "-"}</Text></View>
      <View style={[styles.cell, { width: 80 }]}><Text style={styles.cellText}>{item.donor?.village || "-"}</Text></View>

      {/* Receiver */}
      <View style={[styles.cell, { width: 120 }]}><Text style={styles.cellText}>{item.recipient?.fullName || "-"}</Text></View>
      <View style={[styles.cell, { width: 100 }]}><Text style={styles.cellText}>{item.recipient?.nationalId || "-"}</Text></View>
      <View style={[styles.cell, { width: 40 }]}><Text style={styles.cellText}>{item.recipient?.sex || "-"}</Text></View>
      <View style={[styles.cell, { width: 80 }]}><Text style={styles.cellText}>{item.recipient?.cell || "-"}</Text></View>
      <View style={[styles.cell, { width: 80 }]}><Text style={styles.cellText}>{item.recipient?.village || "-"}</Text></View>

      {/* Cow */}
      <View style={[styles.cell, { width: 80 }]}><Text style={styles.cellText}>{item.animal?.breed || "-"}</Text></View>
      <View style={[styles.cell, { width: 80 }]}><Text style={styles.cellText}>{item.animal?.earTag || "-"}</Text></View>

      {/* Meta */}
      <View style={[styles.cell, { width: 100 }]}><Text style={styles.cellText}>{item.date}</Text></View>
      <View style={[styles.cell, { width: 120 }]}><Text style={styles.cellText}>{item.notes || "-"}</Text></View>
    </View>
  );

  return (
    <View style={styles.container}>
      <MemoConfigModal
        visible={isMemoModalVisible}
        onClose={() => setIsMemoModalVisible(false)}
        onConfirm={confirmPdfGeneration}
        options={memoOptions}
        setOptions={setMemoOptions}
      />
      <View style={styles.topHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>KWITURA (UWITUYE N'UWITUWE)</Text>
          <Pressable
            style={{
              backgroundColor: "#1b6e3c",
              paddingVertical: 6,
              paddingHorizontal: 12,
              borderRadius: 6,
              marginTop: 6,
              alignSelf: "flex-start",
            }}
            onPress={() => navigation.navigate("BeneficiaryList")}
          >
            <Text style={{ color: "white", fontSize: 12, fontWeight: "700" }}>
              Andika igikorwa cyo kwitura
            </Text>
          </Pressable>
        </View>
        <View style={styles.buttonGroup}>
          <Pressable style={styles.reportButton} onPress={handleExportPDF}>
            <Text style={styles.reportButtonText}>PDF</Text>
          </Pressable>
          <Pressable
            style={[styles.reportButton, { backgroundColor: "#1d6f42", marginLeft: 8 }]}
            onPress={handleExportExcel}
          >
            <Text style={styles.reportButtonText}>Excel</Text>
          </Pressable>
        </View>
      </View>
      <View style={styles.searchSection}>
        <TextInput
          style={styles.searchInput}
          placeholder="Shaka izina ry'utanga cyangwa uhabwa inka..."
          value={searchText}
          onChangeText={setSearchText}
        />
      </View>
      <TimePeriodFilter selected={period} onSelect={setPeriod} />
      <ScrollView horizontal>
        <View>
          <Header />
          <FlatList
            data={reportData}
            keyExtractor={(item) => item.id}
            renderItem={RenderItem}
            ListEmptyComponent={<Text style={styles.empty}>Nta bikorwa byo kwitura birandikwa.</Text>}
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  topHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 10,
    backgroundColor: "#f0f0f0",
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
  },
  buttonGroup: {
    flexDirection: "row",
  },
  reportButton: {
    backgroundColor: "#2c3e50",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
  },
  reportButtonText: { color: "white", fontSize: 11, fontWeight: "600" },
  title: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#1b6e3c",
    flex: 1,
  },
  searchSection: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: "#f9f9f9",
  },
  searchInput: {
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
  },
  headerRow: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderBottomWidth: 2,
    borderBottomColor: "#000",
  },
  subHeaderRow: {
    flexDirection: "row",
  },
  verticalGroup: {
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: "#ccc",
  },
  groupTitle: {
    fontSize: 12,
    fontWeight: "bold",
    textAlign: "center",
    paddingVertical: 4,
    backgroundColor: "#f9f9f9",
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
  },
  headerCell: {
    fontSize: 10,
    fontWeight: "bold",
    padding: 8,
    textAlign: "center",
    borderRightWidth: 1,
    borderRightColor: "#ccc",
    justifyContent: "center",
  },
  dataRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  cell: {
    fontSize: 11,
    padding: 8,
    textAlign: "left",
    borderRightWidth: 1,
    borderRightColor: "#eee",
    minHeight: 40,
    justifyContent: "center",
  },
  cellText: {
    fontSize: 10,
    color: "#333",
  },
  empty: { textAlign: "center", marginTop: 40, color: "#999", padding: 20 },
});
