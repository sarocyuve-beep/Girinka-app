import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, ScrollView, Alert, Pressable, ActivityIndicator, TextInput } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../navigation/RootNavigator";
import { getBeneficiary, savePassOnWithNewRecipient, listBeneficiaries } from "../../db/registryRepository";
import { listApprovedCandidates } from "../../db/selectionRepository";
import { Beneficiary, PassOn } from "../../types/registry";
import { Candidate } from "../../types/selection";
import { LocationSelector } from "../../components/LocationSelector";
import { getSectors, getCells, getVillages } from "../../data/locations";
import { v4 as uuidv4 } from "uuid";
import DateTimePicker from "@react-native-community/datetimepicker";

type Props = NativeStackScreenProps<RootStackParamList, "PassOnForm">;

export default function PassOnFormScreen({ route, navigation }: Props) {
  const { donorId, animalId } = route.params;
  const [donor, setDonor] = useState<Beneficiary | null>(null);

  // Receiver Data Entry
  const [receiverName, setReceiverName] = useState("");
  const [receiverId, setReceiverId] = useState("");
  const [receiverPhone, setReceiverPhone] = useState("");
  const [sector, setSector] = useState("");
  const [cell, setCell] = useState("");
  const [village, setVillage] = useState("");

  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Modal / Selection states
  const [showWaitingList, setShowWaitingList] = useState(false);
  const [waitingList, setWaitingList] = useState<Candidate[]>([]);
  const [showBeneficiaryList, setShowBeneficiaryList] = useState(false);
  const [beneficiaryList, setBeneficiaryList] = useState<Beneficiary[]>([]);

  // Search states for modals
  const [searchQuery, setSearchQuery] = useState("");
  const [modalSector, setModalSector] = useState("");
  const [modalCell, setModalCell] = useState("");
  const [modalVillage, setModalVillage] = useState("");

  const filteredItems = (showWaitingList ? waitingList : beneficiaryList).filter(item => {
    const matchesSearch = !searchQuery ||
      item.fullName.toUpperCase().includes(searchQuery.toUpperCase()) ||
      item.nationalId.includes(searchQuery);

    const matchesSector = !modalSector || item.sector.toUpperCase() === modalSector.toUpperCase();
    const matchesCell = !modalCell || item.cell.toUpperCase() === modalCell.toUpperCase();
    const matchesVillage = !modalVillage || item.village.toUpperCase() === modalVillage.toUpperCase();

    return matchesSearch && matchesSector && matchesCell && matchesVillage;
  });

  useEffect(() => {
    getBeneficiary(donorId).then(b => {
      setDonor(b);
      if (b) {
        setSector(b.sector); // Default to donor's location
      }
      setLoading(false);
    });
  }, [donorId]);

  const loadWaitingList = async () => {
    const list = await listApprovedCandidates();
    setWaitingList(list);
    setShowWaitingList(true);
  };

  const loadBeneficiaryList = async () => {
    const list = await listBeneficiaries();
    setBeneficiaryList(list);
    setShowBeneficiaryList(true);
  };

  const selectReceiver = (r: Candidate | Beneficiary) => {
    setReceiverName(r.fullName);
    setReceiverId(r.nationalId);
    setReceiverPhone(r.phone || "");
    setSector(r.sector);
    setCell(r.cell);
    setVillage(r.village);
    setShowWaitingList(false);
    setShowBeneficiaryList(false);
    setSearchQuery("");
    setModalSector("");
    setModalCell("");
    setModalVillage("");
  };

  async function onSave() {
    if (!receiverName || !receiverId || !sector || !cell || !village) {
      Alert.alert("Ikosa", "Uzuza imyanya yose y'uwakira inka (Receiver).");
      return;
    }

    if (receiverId.length < 16) {
      Alert.alert("Ikosa", "Numero y'indangamuntu igomba kuba ifite imibare 16.");
      return;
    }

    setSaving(true);
    try {
      const passOnId = uuidv4();
      const passOn: PassOn = {
        id: passOnId,
        donorBeneficiaryId: donorId,
        recipientBeneficiaryId: receiverId,
        animalId,
        date,
        status: "COMPLETED",
        notes: notes.trim() || null,
        createdAt: new Date().toISOString(),
      };

      const recipientData: Omit<Beneficiary, "createdAt" | "updatedAt"> = {
        id: receiverId,
        fullName: receiverName.trim().toUpperCase(),
        nationalId: receiverId,
        phone: receiverPhone,
        sex: "F",
        ubudeheCategory: null,
        district: (donor?.district || "MUSANZE").toUpperCase(),
        sector: sector.toUpperCase(),
        cell: cell.toUpperCase(),
        village: village.toUpperCase(),
        district: (donor?.district || "MUSANZE").toUpperCase(),
      };

      await savePassOnWithNewRecipient(passOn, recipientData);
      Alert.alert("Byagenze neza", "Inka yashyikirijwe umugenerwabikorwa mushya neza.");
      navigation.navigate("BeneficiaryList");
    } catch (e: any) {
      Alert.alert("Ikosa", e.message || "Ntibishoboye kubikwa.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <ActivityIndicator style={{ marginTop: 40 }} color="#1b6e3c" />;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Kwitura (Pass-on calf)</Text>

      <View style={styles.donorInfo}>
        <Text style={styles.donorLabel}>Uwituye (Donor):</Text>
        <Text style={styles.donorName}>{donor?.fullName}</Text>
      </View>

      <View style={styles.section}>
        <View style={styles.headerRow}>
          <Text style={styles.sectionTitle}>Amakuru y'Uwituwe (Recipient)</Text>
          <View style={styles.buttonRow}>
            <Pressable style={styles.listBtn} onPress={loadWaitingList}>
              <Text style={styles.listBtnText}>Kura kuri Waiting List</Text>
            </Pressable>
            <Pressable style={[styles.listBtn, { backgroundColor: '#555' }]} onPress={loadBeneficiaryList}>
              <Text style={styles.listBtnText}>Gushumbusha</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Amazina Yombi</Text>
          <TextInput style={styles.input} value={receiverName} onChangeText={setReceiverName} placeholder="Amazina y'uwakira" />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Numero y'Indangamuntu</Text>
          <TextInput style={styles.input} value={receiverId} onChangeText={setReceiverId} keyboardType="numeric" maxLength={16} placeholder="1 19XX ..." />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Telefone</Text>
          <TextInput style={styles.input} value={receiverPhone} onChangeText={setReceiverPhone} keyboardType="phone-pad" placeholder="078..." />
        </View>

        <LocationSelector
          label="Umurenge"
          value={sector}
          options={getSectors("MUSANZE")}
          onSelect={(v) => { setSector(v); setCell(""); setVillage(""); }}
        />

        <LocationSelector
          label="Akagari"
          value={cell}
          options={sector ? getCells("MUSANZE", sector) : []}
          onSelect={(v) => { setCell(v); setVillage(""); }}
        />

        <LocationSelector
          label="Umudugudu"
          value={village}
          options={(sector && cell) ? getVillages("MUSANZE", sector, cell) : []}
          onSelect={setVillage}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Amakuru y'itangwa</Text>
        <View style={styles.field}>
          <Text style={styles.label}>Itariki yo kwitura</Text>
          <Pressable onPress={() => setShowDatePicker(true)}>
            <View pointerEvents="none">
              <TextInput style={styles.input} value={date} editable={false} placeholder="YYYY-MM-DD" />
            </View>
          </Pressable>
          {showDatePicker && (
            <DateTimePicker
              value={new Date(date)}
              mode="date"
              display="default"
              onChange={(event, selectedDate) => {
                setShowDatePicker(false);
                if (selectedDate) {
                  setDate(selectedDate.toISOString().split('T')[0]);
                }
              }}
            />
          )}
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Ibindi wagaragaza (Notes)</Text>
          <TextInput
            style={[styles.input, { height: 60 }]}
            value={notes}
            onChangeText={setNotes}
            multiline
            placeholder="Urugero: Inyana ifite ubuzima bwiza..."
          />
        </View>
      </View>

      <Pressable style={styles.saveButton} onPress={onSave} disabled={saving}>
        {saving ? <ActivityIndicator color="white" /> : <Text style={styles.saveButtonText}>Emeza Kwitura</Text>}
      </Pressable>

      {/* Waiting List Modal */}
      {(showWaitingList || showBeneficiaryList) && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {showWaitingList ? "Hitamo kuri Waiting List" : "Hitamo mu Bagenerwabikorwa"}
              </Text>
              <Pressable onPress={() => { setShowWaitingList(false); setShowBeneficiaryList(false); setSearchQuery(""); setModalSector(""); setModalCell(""); setModalVillage(""); }}>
                <Text style={styles.closeBtn}>Funga</Text>
              </Pressable>
            </View>

            {/* Modal Search and Filters */}
            <View style={styles.modalSearchBox}>
              <TextInput
                style={styles.modalSearchInput}
                placeholder="Shakisha n'izina cyangwa ID..."
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              <View style={styles.modalFilterGrid}>
                <View style={styles.flex1}>
                  <LocationSelector
                    label="Umurenge"
                    value={modalSector}
                    options={getSectors("MUSANZE")}
                    onSelect={(v) => { setModalSector(v); setModalCell(""); setModalVillage(""); }}
                  />
                </View>
                <View style={styles.flex1}>
                  <LocationSelector
                    label="Akagari"
                    value={modalCell}
                    options={modalSector ? getCells("MUSANZE", modalSector) : []}
                    onSelect={(v) => { setModalCell(v); setModalVillage(""); }}
                  />
                </View>
              </View>
            </View>

            <ScrollView style={styles.modalList}>
              {filteredItems.map((item) => (
                <Pressable
                  key={item.id}
                  style={styles.listItem}
                  onPress={() => selectReceiver(item)}
                >
                  <Text style={styles.listItemName}>{item.fullName}</Text>
                  <Text style={styles.listItemSub}>{item.nationalId} • {item.sector}, {item.cell}, {item.village}</Text>
                </Pressable>
              ))}
              {filteredItems.length === 0 && (
                <Text style={styles.emptyText}>Nta bantu babonetse bihwanye n'ibyo ushakisha.</Text>
              )}
            </ScrollView>
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, backgroundColor: '#f8f9fa' },
  title: { fontSize: 20, fontWeight: "800", marginBottom: 15, color: "#1b6e3c", textAlign: 'center' },
  donorInfo: { backgroundColor: '#e8f5e9', padding: 12, borderRadius: 8, marginBottom: 20, borderWidth: 1, borderColor: '#c8e6c9' },
  donorLabel: { fontSize: 12, color: '#666', fontWeight: '600' },
  donorName: { fontSize: 16, fontWeight: '700', color: '#1b6e3c' },
  section: { backgroundColor: 'white', padding: 15, borderRadius: 10, marginBottom: 15, elevation: 2 },
  headerRow: { marginBottom: 15 },
  buttonRow: { flexDirection: 'row', gap: 8, marginTop: 8 },
  listBtn: { backgroundColor: '#2e7d32', paddingVertical: 6, paddingHorizontal: 10, borderRadius: 6 },
  listBtnText: { color: 'white', fontSize: 11, fontWeight: '700' },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: '#333', borderBottomWidth: 1, borderBottomColor: '#eee', paddingBottom: 4 },
  label: { fontSize: 13, color: "#333", marginBottom: 6, fontWeight: "600" },
  field: { marginBottom: 14 },
  input: { borderWidth: 1, borderColor: "#ccc", borderRadius: 8, padding: 10, backgroundColor: "#fff" },
  saveButton: { backgroundColor: "#1b6e3c", borderRadius: 10, padding: 16, alignItems: "center", marginTop: 10, marginBottom: 30 },
  saveButtonText: { color: "white", fontWeight: "800", fontSize: 16 },

  // Modal styles
  modalOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20, zIndex: 1000 },
  modalContent: { backgroundColor: 'white', borderRadius: 12, maxHeight: '80%', padding: 15 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15, borderBottomWidth: 1, borderBottomColor: '#eee', paddingBottom: 10 },
  modalTitle: { fontSize: 16, fontWeight: '700', color: '#1b6e3c' },
  closeBtn: { color: '#d32f2f', fontWeight: '700' },
  modalList: { flex: 0 },
  listItem: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  listItemName: { fontSize: 14, fontWeight: '600', color: '#333' },
  listItemSub: { fontSize: 12, color: '#666' },
  emptyText: { textAlign: 'center', padding: 20, color: '#999' },

  modalSearchBox: { marginBottom: 10, backgroundColor: '#f9f9f9', padding: 10, borderRadius: 8 },
  modalSearchInput: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 8, backgroundColor: '#fff', marginBottom: 8, fontSize: 14 },
  modalFilterGrid: { flexDirection: 'row', gap: 8 },
  flex1: { flex: 1 },
});
