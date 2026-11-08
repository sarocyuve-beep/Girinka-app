import React, { useState, useCallback } from "react";
import { View, Text, StyleSheet, FlatList, ActivityIndicator, Pressable, Alert, TextInput } from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { listPassOnAssessments, listBeneficiaries, deletePassOnAssessment } from "../../db/registryRepository";
import { listSelectionCampaigns, listCandidatesByCampaign } from "../../db/selectionRepository";
import { PassOnAssessment, Beneficiary } from "../../types/registry";
import { Candidate } from "../../types/selection";
import { generatePassOnAssessmentReport, exportPassOnAssessmentsToExcel, ReportMemoOptions } from "../../utils/reportGenerator";
import { useCanEditFieldData } from "../../auth/AuthContext";
import { MemoConfigModal } from "../../components/MemoConfigModal";

export default function PassOnAssessmentListScreen() {
  const navigation = useNavigation();
  const [assessments, setAssessments] = useState<PassOnAssessment[]>([]);
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
      const items = await listPassOnAssessments();
      const bens = await listBeneficiaries({ max: 2000 });

      // Also fetch candidates from all campaigns in scope
      const campaigns = await listSelectionCampaigns();
      let allCandidates: Candidate[] = [];
      for (const camp of campaigns) {
        const cands = await listCandidatesByCampaign(camp.id);
        allCandidates = [...allCandidates, ...cands];
      }

      setPeople([...bens, ...allCandidates]);
      setAssessments(items);
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
    if (!needle) return assessments;

    return assessments.filter(a => {
      const owner = peopleMap.get(a.beneficiaryId);
      return (
        owner?.fullName?.toLowerCase().includes(needle) ||
        owner?.nationalId?.includes(needle) ||
        a.earTag?.toLowerCase().includes(needle)
      );
    });
  }, [searchText, assessments, peopleMap]);

  const [isMemoModalVisible, setIsMemoModalVisible] = useState(false);
  const [memoOptions, setMemoOptions] = useState<ReportMemoOptions>({
    enabled: true,
    from: "Umukozi ushinzwe Ubworozi mu Murenge wa CYUVE",
    to: "Bwana Umunyamabanga Nshingwabikorwa w'Umurenge wa CYUVE",
    subject: "Gukurikirana imitangire n'imicungire y'inka zitangwa muri gahunda ya Girinka",
    ref: "SARO",
    authorName: "YABARAGIYE Bernard",
    authorTitle: "Umukozi ushinzwe Ubworozi mu Murenge wa CYUVE"
  });

  const handlePdf = () => {
    setIsMemoModalVisible(true);
  };

  const confirmPdfGeneration = async () => {
    setIsMemoModalVisible(false);
    await generatePassOnAssessmentReport(filtered, people, memoOptions);
  };
  const handleExcel = () => exportPassOnAssessmentsToExcel(filtered, people);

  const handleEdit = (item: PassOnAssessment) => {
    navigation.navigate("PassOnAssessmentForm" as any, {
      beneficiaryId: item.beneficiaryId,
      assessmentId: item.id
    });
  };

  const handleDelete = (id: string) => {
    Alert.alert("Gusiba", "Ese wizeye ko ushaka gusiba iri barura?", [
      { text: "Oya" },
      {
        text: "Yego",
        style: "destructive",
        onPress: async () => {
          try {
            await deletePassOnAssessment(id);
            loadData();
          } catch (e) {
            Alert.alert("Ikosa", "Ntibishoboye gusibwa.");
          }
        }
      }
    ]);
  };

  const handleNewAssessment = () => {
    navigation.navigate("BeneficiaryList" as any);
    Alert.alert("Guhitamo umugenerwabikorwa", "Hitamo umuryango ugiye gukorera ibarura mu rutonde rw'abafite inka.");
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
        <Text style={styles.title}>Ibarura ry'inka zo kwiturwa</Text>
        <View style={styles.actions}>
          <Pressable style={styles.btn} onPress={handlePdf}><Text style={styles.btnText}>PDF</Text></Pressable>
          <Pressable style={[styles.btn, { backgroundColor: '#2e7d32' }]} onPress={handleExcel}><Text style={styles.btnText}>Excel</Text></Pressable>
        </View>
      </View>

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Shaka izina, ID cyangwa Ear Tag..."
          value={searchText}
          onChangeText={setSearchText}
        />
      </View>

      <Pressable
        style={styles.newBtn}
        onPress={handleNewAssessment}
      >
        <Text style={styles.newBtnText}>+ KORA IBARURA RISHYA</Text>
      </Pressable>

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
                    navigation.navigate("CandidateDetail" as any, {
                      candidateId: item.beneficiaryId,
                      fullName: fullName
                    });
                  } else {
                    navigation.navigate("BeneficiaryDetail" as any, {
                      beneficiaryId: item.beneficiaryId,
                      fullName: fullName
                    });
                  }
                }}
              >
                <Text style={styles.owner}>{owner?.fullName || 'N/A'}</Text>
                <Text style={styles.loc}>
                  Aho aherereye: {owner?.cell || '...'} - {owner?.village || '...'}
                </Text>
                <View style={styles.divider} />
                <Text style={styles.detail}>Breed: {item.breed} | Sex: {item.sex === 'F' ? 'Female' : 'Male'}</Text>
                <Text style={styles.detail}>Ear Tag: {item.earTag} | Birth: {item.birthDate}</Text>
                <Text style={[styles.status, { color: item.isReadyForPassOn ? '#1b6e3c' : '#d97706' }]}>
                  Umwanzuro: {item.isReadyForPassOn ? 'YAKWITURWA' : 'NTIYAKWITURWA'}
                </Text>
                <Text style={styles.conclusion}>Kanda hano urebe umwirondoro arambuye</Text>
              </Pressable>

              <View style={styles.cardActions}>
                {canEdit && (
                  <>
                    <Pressable onPress={() => handleEdit(item)} style={styles.actionBtn}>
                      <Text style={styles.editText}>Edit</Text>
                    </Pressable>
                    <Pressable onPress={() => handleDelete(item.id)} style={styles.actionBtn}>
                      <Text style={styles.deleteText}>Delete</Text>
                    </Pressable>
                  </>
                )}
              </View>

              {item.isReadyForPassOn && (
                <Pressable
                  style={styles.passOnNowBtn}
                  onPress={() => {
                    navigation.navigate("PassOnForm", {
                      donorId: item.beneficiaryId,
                      animalId: "pending_calf_registration"
                    });
                  }}
                >
                  <Text style={styles.passOnNowBtnText}>KWITURA UBU →</Text>
                </Pressable>
              )}
            </View>
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.empty}>Nta barura rirakorwa.</Text>
            <Text style={styles.emptySub}>Kanda "+" hejuru utangire ibarura rishya uhereye ku mugenerwabikorwa.</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 15, backgroundColor: '#f5f5f5' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  title: { fontSize: 16, fontWeight: '700', color: '#1b6e3c' },
  actions: { flexDirection: 'row', gap: 8 },
  searchContainer: {
    marginBottom: 15,
  },
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
  newBtn: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#1b6e3c',
    padding: 15,
    borderRadius: 12,
    marginBottom: 20,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4
  },
  newBtnText: { color: '#1b6e3c', fontWeight: '800', fontSize: 15 },
  divider: { height: 1, backgroundColor: '#eee', marginVertical: 8 },
  owner: { fontWeight: '700', fontSize: 14, marginBottom: 4 },
  detail: { fontSize: 12, color: '#666' },
  status: { fontSize: 12, fontWeight: '600', color: '#1b6e3c', marginTop: 4 },
  passOnNowBtn: {
    marginTop: 10,
    backgroundColor: '#1b6e3c',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#14522d'
  },
  passOnNowBtnText: { color: 'white', fontSize: 13, fontWeight: '800' },
  emptyContainer: { alignItems: 'center', marginTop: 40 },
  empty: { textAlign: 'center', color: '#888', fontWeight: '600' },
  emptySub: { textAlign: 'center', color: '#aaa', fontSize: 12, marginTop: 8, paddingHorizontal: 20 },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    marginTop: 8,
    paddingTop: 8,
    gap: 15
  },
  actionBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5
  },
  editText: { color: '#1b6e3c', fontWeight: '600', fontSize: 13 },
  deleteText: { color: '#dc2626', fontWeight: '600', fontSize: 13 },

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
