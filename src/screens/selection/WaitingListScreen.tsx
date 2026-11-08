import React, { useCallback, useState, useEffect } from "react";
import { View, Text, FlatList, Pressable, StyleSheet, ActivityIndicator } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../navigation/RootNavigator";
import { listApprovedCandidates, seedCyuveWaitingListIfNeeded } from "../../db/selectionRepository";
import { Candidate } from "../../types/selection";
import { useCanManageRegistry, useAuth } from "../../auth/AuthContext";
import { LocationSelector } from "../../components/LocationSelector";
import { getSectors, getCells, getVillages } from "../../data/locations";

type Props = NativeStackScreenProps<RootStackParamList, "WaitingList">;

export default function WaitingListScreen({ navigation }: Props) {
  const { profile } = useAuth();
  const [allCandidates, setAllCandidates] = useState<Candidate[]>([]);
  const [filtered, setFiltered] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);

  const [sector, setSector] = useState(profile?.sector || "");
  const [cell, setCell] = useState("");
  const [village, setVillage] = useState("");

  const canDistribute = useCanManageRegistry();

  // Sync state with profile once it loads
  useEffect(() => {
    if (profile?.sector) setSector(profile.sector.toUpperCase());
    if (profile?.cell) setCell(profile.cell.toUpperCase());
    if (profile?.village) setVillage(profile.village.toUpperCase());
  }, [profile]);

  const load = useCallback(async () => {
    setLoading(true);
    // Optimization: Use server-side filtering for approved candidates
    const rows = await listApprovedCandidates({
      sector: sector.toUpperCase(),
      cell: cell.toUpperCase(),
      village: village.toUpperCase()
    });
    setFiltered(rows);
    setLoading(false);
  }, [sector, cell, village]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  useEffect(() => {
    load();
  }, [sector, cell, village]);

  const onLocationChange = (type: 'sector' | 'cell' | 'village', val: string) => {
    const normalized = val.toUpperCase();
    if (type === 'sector') {
      setSector(normalized); setCell(""); setVillage("");
    } else if (type === 'cell') {
      setCell(normalized); setVillage("");
    } else {
      setVillage(normalized);
    }
  };

  if (loading) return <ActivityIndicator style={{ marginTop: 40 }} color="#1b6e3c" />;

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Abategereje guhabwa inka (Waiting List)</Text>
      <Text style={styles.subHeader}>Aba ni abakandida bamaze kwemezwa n'akarere.</Text>

      <View style={styles.locationFilters}>
        <View style={{ flex: 1 }}>
          <LocationSelector
            label="Umurenge"
            value={sector}
            options={getSectors("MUSANZE")}
            onSelect={(v) => onLocationChange('sector', v)}
            disabled={!!profile?.sector}
          />
        </View>
        <View style={{ flex: 1 }}>
          <LocationSelector
            label="Akagari"
            value={cell}
            options={sector ? getCells("MUSANZE", sector) : []}
            onSelect={(v) => onLocationChange('cell', v)}
            disabled={!!profile?.cell}
          />
        </View>
        <View style={{ flex: 1 }}>
          <LocationSelector
            label="Umudugudu"
            value={village}
            options={(sector && cell) ? getVillages("MUSANZE", sector, cell) : []}
            onSelect={(v) => onLocationChange('village', v)}
            disabled={!!profile?.village}
          />
        </View>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Pressable
            style={styles.row}
            onPress={() =>
              navigation.navigate("CandidateDetail", { candidateId: item.id, fullName: item.fullName })
            }
          >
            <View style={{ flex: 1, marginRight: 10 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={styles.drawNumber}>#{item.drawNumber}</Text>
                <Text style={styles.rowTitle}>{item.fullName}</Text>
              </View>
              <Text style={styles.rowSub}>{item.nationalId}</Text>
              <Text style={styles.rowSub}>{item.sector} › {item.cell} › {item.village}</Text>
            </View>

            {canDistribute && (
              <Pressable
                style={styles.distButton}
                onPress={() => navigation.navigate("DistributionForm", { beneficiaryId: item.id, candidateId: item.id })}
              >
                <Text style={styles.distButtonText}>Tanga Inka</Text>
              </Pressable>
            )}
          </Pressable>
        )}
        ListEmptyComponent={<Text style={styles.empty}>Nta mukandida wemewe utegereje inka uhari muri kano gace.</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#fff' },
  header: { fontSize: 18, fontWeight: "700", color: '#1b6e3c' },
  subHeader: { fontSize: 12, color: '#666', marginBottom: 16 },
  locationFilters: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  row: {
    backgroundColor: "#f9f9f9",
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#eee'
  },
  drawNumber: {
    backgroundColor: '#e8f5e9',
    color: '#1b6e3c',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    fontSize: 12,
    fontWeight: '800'
  },
  rowTitle: { fontSize: 15, fontWeight: "700", color: '#333' },
  rowSub: { fontSize: 11, color: "#666", marginTop: 2 },
  distButton: {
    backgroundColor: '#ff9800',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    elevation: 2
  },
  distButtonText: { color: 'white', fontSize: 12, fontWeight: '800' },
  empty: { textAlign: "center", color: "#999", marginTop: 40 },
});
