import React, { useCallback, useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../navigation/RootNavigator";
import {
  searchBeneficiariesByName,
  listAllDistributions,
  listAllIncidents,
  listAllShedInspections
} from "../../db/registryRepository";
import { listAnimals } from "../../db/animalRepository";
import { Beneficiary } from "../../types/registry";
import { generateBeneficiaryReport, exportBeneficiariesToExcel, ReportMemoOptions } from "../../utils/reportGenerator";
import { useCanManageRegistry, useAuth } from "../../auth/AuthContext";
import { LocationSelector } from "../../components/LocationSelector";
import { getSectors, getCells, getVillages } from "../../data/locations";
import { MemoConfigModal } from "../../components/MemoConfigModal";

type Props = NativeStackScreenProps<RootStackParamList, "BeneficiaryList">;

type BeneficiaryWithStatus = Beneficiary & { active: boolean };

export default function BeneficiaryListScreen({ navigation }: Props) {
  const { profile } = useAuth();
  const [all, setAll] = useState<BeneficiaryWithStatus[]>([]);
  const [filtered, setFiltered] = useState<BeneficiaryWithStatus[]>([]);
  const [searchText, setSearchText] = useState("");
  const [showOnlyActive, setShowOnlyActive] = useState(false);

  const [sector, setSector] = useState(profile?.sector || "");
  const [cell, setCell] = useState("");
  const [village, setVillage] = useState("");

  const [loading, setLoading] = useState(true);
  const canManageRegistry = useCanManageRegistry();

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

Mbandikiye iyi memo ngira ngo mbagezeho ku mugereka wayo raporo y'abagenerwabikorwa bahawe inka muri gahunda ya girinka.

Muri rusange amakuru yerekeye abagenerwabikorwa murayasanga ku mugereka w'iyi memo.`
  });

  useEffect(() => {
    if (profile?.sector) setSector(profile.sector.toUpperCase());
    if (profile?.cell) setCell(profile.cell.toUpperCase());
    if (profile?.village) setVillage(profile.village.toUpperCase());
  }, [profile]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const s = sector.toUpperCase();
      const c = cell.toUpperCase();
      const v = village.toUpperCase();

      const opts = { sector: s, cell: c, village: v, max: 2000 };
      const [rows, allDists, allIncidents] = await Promise.all([
        searchBeneficiariesByName(searchText || "", 2000, opts),
        listAllDistributions(opts),
        listAllIncidents(opts)
      ]);

      // Optimize: Index distributions and incidents by beneficiaryId for O(1) lookup
      const distsMap = new Map();
      allDists.forEach(d => {
        if (!distsMap.has(d.beneficiaryId)) distsMap.set(d.beneficiaryId, []);
        distsMap.get(d.beneficiaryId).push(d);
      });

      const incidentsMap = new Map();
      allIncidents.forEach(i => {
        if (!incidentsMap.has(i.beneficiaryId)) incidentsMap.set(i.beneficiaryId, []);
        incidentsMap.get(i.beneficiaryId).push(i);
      });

      const enriched = rows.map((b) => {
        const dists = (distsMap.get(b.id) || [])
          .sort((a, b) => (b.yearReceived ?? 0) - (a.yearReceived ?? 0));

        if (dists.length === 0) return { ...b, active: false };

        const latestDist = dists[0];
        const beneficiaryIncidents = incidentsMap.get(b.id) || [];
        const hasTerminalIncident = beneficiaryIncidents.some(i =>
          i.animalId === latestDist.animalId &&
          ["DEATH", "THEFT", "SALE", "GIFT", "SEIZURE", "VOLUNTARY_RETURN"].includes(i.type)
        );

        return { ...b, active: !hasTerminalIncident };
      });

      setAll(enriched);
      applyFilters(enriched, searchText, showOnlyActive, sector, cell, village);
    } catch (e) {
      console.error("Load failed", e);
    } finally {
      setLoading(false);
    }
  }, [sector, cell, village, searchText, showOnlyActive]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  // Explicitly reload when location filters change to ensure the UI feels responsive
  useEffect(() => {
    load();
  }, [sector, cell, village]);

  const applyFilters = (
    data: BeneficiaryWithStatus[],
    text: string,
    onlyActive: boolean,
    s: string,
    c: string,
    v: string
  ) => {
    const needle = text.trim().toUpperCase();
    let result = data;

    if (needle) {
      result = result.filter((b) =>
        (b.fullName ?? "").toUpperCase().includes(needle) ||
        (b.sector ?? "").toUpperCase().includes(needle) ||
        (b.cell ?? "").toUpperCase().includes(needle) ||
        (b.village ?? "").toUpperCase().includes(needle)
      );
    }
    if (onlyActive) {
      result = result.filter((b) => b.active);
    }
    const S = s.toUpperCase();
    const C = c.toUpperCase();
    const V = v.toUpperCase();

    if (S) {
      result = result.filter((b) => (b.sector ?? "").toUpperCase() === S);
    }
    if (C) {
      result = result.filter((b) => (b.cell ?? "").toUpperCase() === C);
    }
    if (V) {
      result = result.filter((b) => (b.village ?? "").toUpperCase() === V);
    }
    setFiltered(result);
  };

  const onSearch = (text: string) => {
    setSearchText(text);
    applyFilters(all, text, showOnlyActive, sector, cell, village);
  };

  const onToggleActive = (onlyActive: boolean) => {
    setShowOnlyActive(onlyActive);
    applyFilters(all, searchText, onlyActive, sector, cell, village);
  };

  const onLocationChange = (type: 'sector' | 'cell' | 'village', val: string) => {
    const normalized = val.toUpperCase();
    if (type === 'sector') {
      setSector(normalized);
      setCell("");
      setVillage("");
    } else if (type === 'cell') {
      setCell(normalized);
      setVillage("");
    } else {
      setVillage(normalized);
    }
  };

  const handleGeneratePDF = async () => {
    if (filtered.length === 0) {
      Alert.alert("Info", "Nta bagenerwabikorwa bahari.");
      return;
    }
    setIsMemoModalVisible(true);
  };

  const confirmPdfGeneration = async () => {
    setIsMemoModalVisible(false);
    setLoading(true);
    try {
      const distributions = await listAllDistributions({ sector, cell, village });
      const animals = await listAnimals();
      const shedInspections = await listAllShedInspections({ sector, cell, village });
      await generateBeneficiaryReport(filtered, distributions, animals, shedInspections, "Urutonde rw'Abagenerwabikorwa", memoOptions);
    } finally {
      setLoading(false);
    }
  };

  const handleExportExcel = async () => {
    if (filtered.length === 0) {
      Alert.alert("Info", "Nta bagenerwabikorwa bahari.");
      return;
    }
    setLoading(true);
    try {
      const distributions = await listAllDistributions({ sector, cell, village });
      const animals = await listAnimals();
      const shedInspections = await listAllShedInspections({ sector, cell, village });
      await exportBeneficiariesToExcel(filtered, distributions, animals, shedInspections, "Urutonde_rw_Abagenerwabikorwa");
    } finally {
      setLoading(false);
    }
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
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 20 }}
        ListHeaderComponent={
          <View style={styles.headerContainer}>
            <View style={styles.headerRow}>
              <TextInput
                style={styles.search}
                placeholder="Shakisha izina..."
                value={searchText}
                onChangeText={onSearch}
              />
              <View style={styles.buttonGroup}>
                <Pressable style={styles.reportButton} onPress={handleGeneratePDF}>
                  <Text style={styles.reportButtonText}>PDF</Text>
                </Pressable>
                <Pressable style={[styles.reportButton, { backgroundColor: '#1d6f42' }]} onPress={handleExportExcel}>
                  <Text style={styles.reportButtonText}>XL</Text>
                </Pressable>
              </View>
            </View>

            <View style={styles.locationFilters}>
              <View style={{ flex: 1, marginRight: 4 }}>
                <LocationSelector
                  label="Umurenge"
                  value={sector}
                  options={getSectors("MUSANZE")}
                  onSelect={(v) => onLocationChange('sector', v)}
                  disabled={!!profile?.sector}
                />
              </View>
              <View style={{ flex: 1, marginRight: 4 }}>
                <LocationSelector
                  label="Akagari"
                  value={cell}
                  options={sector ? getCells("MUSANZE", sector) : []}
                  onSelect={(v) => onLocationChange('cell', v)}
                />
              </View>
              <View style={{ flex: 1 }}>
                <LocationSelector
                  label="Umudugudu"
                  value={village}
                  options={(sector && cell) ? getVillages("MUSANZE", sector, cell) : []}
                  onSelect={(v) => onLocationChange('village', v)}
                />
              </View>
            </View>

            <View style={styles.filterRow}>
              <Pressable
                  style={[styles.filterChip, !showOnlyActive && styles.filterChipActive]}
                  onPress={() => onToggleActive(false)}
              >
                  <Text style={[styles.filterText, !showOnlyActive && styles.filterTextActive]}>Bose</Text>
              </Pressable>
              <Pressable
                  style={[styles.filterChip, showOnlyActive && styles.filterChipActive]}
                  onPress={() => onToggleActive(true)}
              >
                  <Text style={[styles.filterText, showOnlyActive && styles.filterTextActive]}>Abafite inka</Text>
              </Pressable>
            </View>

            <View style={styles.countRow}>
                <Text style={styles.count}>
                    {filtered.length} / {all.length} abagenerwabikorwa
                </Text>
                {canManageRegistry && (
                    <Pressable onPress={() => navigation.navigate("BeneficiaryForm")}>
                        <Text style={styles.newLink}>+ Mushya</Text>
                    </Pressable>
                )}
            </View>
            {loading && <ActivityIndicator style={{ marginTop: 10 }} color="#1b6e3c" />}
          </View>
        }
        renderItem={({ item }) => (
          <Pressable
            style={styles.row}
            onPress={() =>
              navigation.navigate("BeneficiaryDetail", {
                beneficiaryId: item.id,
                fullName: item.fullName,
              })
            }
          >
            <View style={styles.rowHeader}>
              <Text style={styles.rowTitle}>{item.fullName}</Text>
              {!item.isVerified && (
                <View style={styles.unverifiedBadge}>
                  <Text style={styles.unverifiedBadgeText}>BIRASABWA KWEMEZWA</Text>
                </View>
              )}
            </View>
            <View style={styles.rowStatusContainer}>
                <Text style={styles.rowSub}>
                {item.cell} · {item.village}
                {item.ubudeheCategory ? ` · Ubudehe ${item.ubudeheCategory}` : ""}
                </Text>
                <View style={[styles.statusBadge, { backgroundColor: item.active ? '#1b6e3c' : '#b3261e' }]}>
                    <Text style={styles.statusBadgeText}>{item.active ? 'AGIFITE INKA' : 'NTA NKA'}</Text>
                </View>
            </View>
          </Pressable>
        )}
        ListEmptyComponent={!loading ? <Text style={styles.empty}>Nta muntu wabonetse.</Text> : null}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  headerContainer: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    width: '100%',
  },
  search: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    marginRight: 8,
    backgroundColor: '#fff',
  },
  buttonGroup: {
    flexDirection: "row",
    alignItems: 'center',
  },
  reportButton: {
    backgroundColor: "#2c3e50",
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 10,
    marginLeft: 4,
    minWidth: 42,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reportButtonText: { color: "white", fontSize: 11, fontWeight: "700" },
  locationFilters: {
    flexDirection: 'row',
    marginBottom: 12,
    width: '100%',
  },
  filterRow: { flexDirection: 'row', marginBottom: 12 },
  filterChip: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 20, backgroundColor: '#eee', marginRight: 8 },
  filterChipActive: { backgroundColor: '#1b6e3c' },
  filterText: { fontSize: 12, color: '#666' },
  filterTextActive: { color: 'white', fontWeight: '600' },
  countRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  count: { fontSize: 12, color: "#666" },
  newLink: { color: '#1b6e3c', fontWeight: 'bold', fontSize: 13 },
  empty: { textAlign: "center", color: "#666", marginTop: 40 },
  row: {
    backgroundColor: "#f9f9f9",
    borderRadius: 10,
    padding: 14,
    marginHorizontal: 16,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#eee',
  },
  rowHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  rowTitle: { fontSize: 15, fontWeight: "600", flex: 1 },
  rowSub: { fontSize: 12, color: "#666", marginTop: 4, flex: 1 },
  rowStatusContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
  statusBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginLeft: 8 },
  statusBadgeText: { color: 'white', fontSize: 9, fontWeight: '700' },
  unverifiedBadge: {
    backgroundColor: '#fff3e0',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#ffb74d',
    marginLeft: 8,
  },
  unverifiedBadgeText: {
    color: '#e65100',
    fontSize: 8,
    fontWeight: '800',
  },
});
