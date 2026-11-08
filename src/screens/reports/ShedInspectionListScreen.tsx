import React, { useState, useCallback } from "react";
import { View, Text, StyleSheet, FlatList, ActivityIndicator, Pressable, Alert, TextInput, Image } from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { getDb, COLLECTIONS } from "../../config/firebase";
import { collection, getDocs, query } from "firebase/firestore";
import { scopeConstraints } from "../../auth/scope";
import { listBeneficiaries, deleteShedInspection } from "../../db/registryRepository";
import { listSelectionCampaigns, listCandidatesByCampaign } from "../../db/selectionRepository";
import { ShedInspection } from "../../types/registry";
import { Candidate } from "../../types/selection";
import { generateShedInspectionReport, exportShedInspectionsToExcel, ReportMemoOptions } from "../../utils/reportGenerator";
import { useCanEditFieldData } from "../../auth/AuthContext";
import { MemoConfigModal } from "../../components/MemoConfigModal";

export default function ShedInspectionListScreen() {
  const navigation = useNavigation();
  const [inspections, setInspections] = useState<ShedInspection[]>([]);
  const [people, setPeople] = useState<any[]>([]);
  const [searchText, setSearchText] = useState("");
  const [loading, setLoading] = useState(true);
  const canEdit = useCanEditFieldData();

  const peopleMap = React.useMemo(() => {
    const map = new Map<string, any>();
    people.forEach(p => map.set(p.id, p));
    return map;
  }, [people]);

  const loadData = async () => {
    setLoading(true);
    try {
      const db = getDb();
      const snap = await getDocs(query(collection(db, COLLECTIONS.shedInspections), ...scopeConstraints()));
      const items = snap.docs.map(d => d.data() as ShedInspection);

      // Fetch both beneficiaries and candidates
      const bens = await listBeneficiaries({ max: 2000 });

      // Also fetch candidates from all campaigns in scope
      const campaigns = await listSelectionCampaigns();
      let allCandidates: Candidate[] = [];
      for (const camp of campaigns) {
        const cands = await listCandidatesByCampaign(camp.id);
        allCandidates = [...allCandidates, ...cands];
      }

      setPeople([...bens, ...allCandidates]);
      setInspections(items);
    } catch (e) {
      console.error(e);
      Alert.alert("Ikosa", "Ntibishoboye gufata amakuru.");
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const filtered = React.useMemo(() => {
    const needle = searchText.trim().toLowerCase();
    if (!needle) return inspections;

    return inspections.filter(i => {
      const owner = peopleMap.get(i.beneficiaryId);
      return (
        owner?.fullName?.toLowerCase().includes(needle) ||
        owner?.nationalId?.includes(needle)
      );
    });
  }, [searchText, inspections, peopleMap]);

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

Mbandikiye iyi memo ngira ngo mbagezeho ku mugereka wayo raporo y'isuzuma ry'ibiraro by'imiryango yateganyijwe guhabwa inka muri gahunda ya girinka 2025-2026.

Muri rusange amakuru yerekeye uko ibiraro byubatse murayasanga ku mugereka w'iyi memo.`
  });

  const handlePdf = () => {
    setIsMemoModalVisible(true);
  };

  const confirmPdfGeneration = async () => {
    setIsMemoModalVisible(false);
    await generateShedInspectionReport(filtered, people, memoOptions);
  };
  const handleExcel = () => exportShedInspectionsToExcel(filtered, people);

  const handleDelete = (id: string) => {
    Alert.alert("Gusiba", "Ese wizeye ko ushaka gusiba iyi raporo?", [
      { text: "Oya" },
      {
        text: "Yego",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteShedInspection(id);
            loadData();
          } catch (e) {
            Alert.alert("Ikosa", "Ntibishoboye gusibwa.");
          }
        },
      },
    ]);
  };

  const handleEdit = (item: ShedInspection) => {
    navigation.navigate("ShedInspectionForm" as any, {
      beneficiaryId: item.beneficiaryId,
      inspectionId: item.id,
    });
  };

  if (loading) return <ActivityIndicator style={{ marginTop: 40 }} color="#1b6e3c" />;

  return (
    <View style={styles.container}>
      <MemoConfigModal
        visible={isMemoModalVisible}
        onClose={() => setIsMemoModalVisible(false)}
        onConfirm={confirmPdfGeneration}
        options={memoOptions}
        setOptions={setMemoOptions}
      />

      <View style={styles.header}>
        <Text style={styles.title}>Raporo y'Isuzumwa ry'Ibiraro</Text>
        <View style={styles.actions}>
          <Pressable style={styles.btn} onPress={handlePdf}><Text style={styles.btnText}>PDF</Text></Pressable>
          <Pressable style={[styles.btn, { backgroundColor: '#2e7d32' }]} onPress={handleExcel}><Text style={styles.btnText}>Excel</Text></Pressable>
        </View>
      </View>

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Shaka izina cyangwa ID..."
          value={searchText}
          onChangeText={setSearchText}
        />
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const owner = peopleMap.get(item.beneficiaryId);
          return (
            <View style={styles.card}>
              <Pressable
                onPress={() => {
                  const fullName = owner?.fullName || "N/A";
                  if (owner?.campaignId) {
                    // It's a candidate
                    navigation.navigate("CandidateDetail" as any, {
                      candidateId: item.beneficiaryId,
                      fullName: fullName
                    });
                  } else {
                    // It's a beneficiary
                    navigation.navigate("BeneficiaryDetail" as any, {
                      beneficiaryId: item.beneficiaryId,
                      fullName: fullName
                    });
                  }
                }}
              >
                <View style={styles.cardHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.owner}>{owner?.fullName || "N/A"}</Text>
                    <Text style={styles.loc}>
                      {owner?.sector || item.sector} · {owner?.cell || item.cell} · {owner?.village || item.village}
                    </Text>
                  </View>
                  <View style={styles.cardActions}>
                    {canEdit && (
                      <>
                        <Pressable onPress={() => handleEdit(item)} style={styles.iconBtn}>
                          <Text style={{ color: "#1b6e3c", fontSize: 12, fontWeight: "600" }}>Edit</Text>
                        </Pressable>
                        <Pressable onPress={() => handleDelete(item.id)} style={styles.iconBtn}>
                          <Text style={{ color: "#dc2626", fontSize: 12, fontWeight: "600" }}>Delete</Text>
                        </Pressable>
                      </>
                    )}
                  </View>
                </View>

                <View style={styles.photoPreview}>
                  {item.photo1Uri && <Image source={{ uri: item.photo1Uri }} style={styles.thumb} />}
                  {item.photo2Uri && <Image source={{ uri: item.photo2Uri }} style={styles.thumb} />}
                </View>

                <View style={styles.detailsPreview}>
                  <Text style={styles.detailText}>• Has Shed: {item.hasShed ? "✅" : "❌"}</Text>
                  <Text style={styles.detailText}>• Firm: {item.isFirm ? "✅" : "❌"}</Text>
                  <Text style={styles.detailText}>• Roofed: {item.isRoofed ? "✅" : "❌"}</Text>
                  <Text style={styles.detailText}>• Space: {item.hasEnoughSpace ? "✅" : "❌"}</Text>
                  <Text style={styles.detailText}>• Cement: {item.hasCement ? "✅" : "❌"}</Text>
                </View>

                <Text style={[styles.status, { color: item.conclusion === "READY" ? "#1b6e3c" : "#d97706" }]}>
                  Umwanzuro: {item.conclusion}
                </Text>
                {item.improvementNotes && <Text style={styles.notes}>Notes: {item.improvementNotes}</Text>}
                <Text style={styles.meta}>
                  Yanditswe na: {item.reportedBy} ({new Date(item.createdAt).toLocaleDateString()})
                </Text>
              </Pressable>
            </View>
          );
        }}
        ListEmptyComponent={<Text style={styles.empty}>Nta suzuma ryabonetse.</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 15, backgroundColor: '#f5f5f5' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  title: { fontSize: 16, fontWeight: '700', color: '#1b6e3c' },
  actions: { flexDirection: 'row', gap: 8 },
  searchContainer: { marginBottom: 15 },
  searchInput: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
  btn: { backgroundColor: '#1b6e3c', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 12 },
  card: { backgroundColor: '#fff', padding: 12, borderRadius: 8, marginBottom: 10, elevation: 1 },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 },
  cardActions: { flexDirection: "row", gap: 10 },
  iconBtn: { padding: 4 },
  owner: { fontWeight: '700', fontSize: 14, marginBottom: 2 },
  loc: { fontSize: 11, color: "#666", marginBottom: 4 },
  photoPreview: { flexDirection: "row", gap: 8, marginVertical: 8 },
  thumb: { width: 60, height: 45, borderRadius: 4, backgroundColor: "#eee" },
  detail: { fontSize: 12, color: '#666' },
  status: { fontSize: 12, fontWeight: '600', marginTop: 4 },
  notes: { fontSize: 11, color: '#444', fontStyle: 'italic', marginTop: 4 },
  meta: { fontSize: 10, color: '#888', marginTop: 6 },
  empty: { textAlign: 'center', color: '#888', marginTop: 40 },

  // Modal Styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: 'white', borderRadius: 15, padding: 20, elevation: 5 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  modalTitle: { fontSize: 16, fontWeight: '700', color: '#1b6e3c' },
  memoSwitchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#eee' },
  memoLabel: { fontSize: 14, fontWeight: '600' },
  memoFields: { marginTop: 15 },
  fieldLabel: { fontSize: 12, color: '#666', marginBottom: 4, marginTop: 10 },
  modalInput: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 10, fontSize: 13, backgroundColor: '#fafafa' },
  confirmBtn: { backgroundColor: '#1b6e3c', padding: 15, borderRadius: 10, alignItems: 'center', marginTop: 20 },
  confirmBtnText: { color: 'white', fontWeight: '800', fontSize: 14 },
});
