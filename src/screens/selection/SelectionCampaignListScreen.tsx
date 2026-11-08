import React, { useCallback, useState } from "react";
import { View, Text, FlatList, Pressable, StyleSheet } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../navigation/RootNavigator";
import { listSelectionCampaigns } from "../../db/selectionRepository";
import { SelectionCampaign } from "../../types/selection";
import { t } from "../../i18n/strings";
import { useCanWrite } from "../../auth/AuthContext";

type Props = NativeStackScreenProps<RootStackParamList, "SelectionCampaigns">;

export default function SelectionCampaignListScreen({ navigation }: Props) {
  const [campaigns, setCampaigns] = useState<SelectionCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const writable = useCanWrite();

  useFocusEffect(
    useCallback(() => {
      let active = true;
      setLoading(true);
      listSelectionCampaigns()
        .then((rows) => {
          if (active) {
            setCampaigns(rows);
            setLoading(false);
          }
        })
        .catch(() => active && setLoading(false));
      return () => {
        active = false;
      };
    }, [])
  );

  return (
    <View style={styles.container}>
      {writable && (
        <Pressable
          style={styles.newButton}
          onPress={() => navigation.navigate("SelectionCampaignForm")}
        >
          <Text style={styles.newButtonText}>+ {t("newCampaign")}</Text>
        </Pressable>
      )}

      {!loading && campaigns.length === 0 && (
        <Text style={styles.empty}>
          Nta gahunda yo gutoranya iraboneka. Tangira ukoreye "{t("newCampaign")}".
        </Text>
      )}

      <FlatList
        data={campaigns}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Pressable
            style={styles.row}
            onPress={() =>
              navigation.navigate("CandidateList", {
                campaignId: item.id,
                campaignLabel: `${item.village}, ${item.cell}, ${item.sector}`,
              })
            }
          >
            <Text style={styles.rowTitle}>
              {item.village}, {item.cell}, {item.sector} — {item.financialYear}
            </Text>
            <Text style={styles.rowSub}>{item.status}</Text>
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
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
  rowSub: { fontSize: 12, color: "#1b6e3c", marginTop: 4, fontWeight: "600" },
});
