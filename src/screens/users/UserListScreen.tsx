import React, { useCallback, useState } from "react";
import { View, Text, FlatList, Switch, Pressable, StyleSheet, ActivityIndicator, Alert } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../navigation/RootNavigator";
import { useAuth } from "../../auth/AuthContext";
import { listStaffUsers, setUserActive } from "../../auth/userAdmin";
import { ROLE_LABEL } from "../../auth/scope";
import { backfillLocations } from "../../db/migration";
import { AppUser } from "../../types/core";

type Props = NativeStackScreenProps<RootStackParamList, "UserList">;

function where(u: AppUser) {
  return [u.district, u.sector, u.cell, u.village].filter(Boolean).join(" › ");
}

export default function UserListScreen({ navigation }: Props) {
  const { profile, user } = useAuth();
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [migrating, setMigrating] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    listStaffUsers()
      .then(setUsers)
      .catch(() => Alert.alert("Ikosa", "Ntibishoboye gusoma urutonde rw'abakoresha."))
      .finally(() => setLoading(false));
  }, []);

  useFocusEffect(load);

  async function toggle(u: AppUser, value: boolean) {
    setUsers((prev) => prev.map((x) => (x.id === u.id ? { ...x, active: value } : x)));
    try {
      await setUserActive(u.id, value);
    } catch {
      setUsers((prev) => prev.map((x) => (x.id === u.id ? { ...x, active: !value } : x)));
      Alert.alert("Ikosa", "Ntibishoboye guhindurwa (ushobora kuba udafite uburenganzira).");
    }
  }

  function confirmMigration() {
    Alert.alert(
      "Gusana amakuru ya kera",
      "Ibi bishyira aho bikorerwa (location) ku makuru yabitswe mbere. Bikorwa MBERE yo gushyiraho rules zisoza (firestore.rules). Ushaka gukomeza?",
      [
        { text: "Oya", style: "cancel" },
        {
          text: "Yego",
          onPress: async () => {
            setMigrating(true);
            try {
              const r = await backfillLocations();
              const lines = Object.entries(r).map(([k, v]) => `${k}: ${v.updated} zahinduwe, ${v.skipped} zasibwe`);
              Alert.alert("Birangiye", lines.join("\n"));
            } catch (e: any) {
              Alert.alert("Ikosa", e?.code ?? e?.message ?? "Byanze.");
            } finally {
              setMigrating(false);
            }
          },
        },
      ]
    );
  }

  return (
    <View style={styles.container}>
      <Pressable style={styles.newButton} onPress={() => navigation.navigate("UserForm")}>
        <Text style={styles.newButtonText}>+ Umukoresha mushya</Text>
      </Pressable>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 30 }} color="#1b6e3c" />
      ) : (
        <FlatList
          data={users}
          keyExtractor={(u) => u.id}
          ListEmptyComponent={<Text style={styles.empty}>Nta bakoresha baraboneka.</Text>}
          renderItem={({ item }) => (
            <View style={[styles.card, !item.active && styles.cardOff]}>
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>
                  {item.fullName}
                  {item.id === user?.uid ? "  (wowe)" : ""}
                </Text>
                <Text style={styles.meta}>
                  {item.username} · {ROLE_LABEL[item.role] ?? item.role}
                </Text>
                <Text style={styles.meta}>Tel: {item.phone}{item.email ? ` · ${item.email}` : ""}</Text>
                <Text style={styles.meta}>{where(item)}</Text>
              </View>
              {item.id !== user?.uid && (
                <Switch value={!!item.active} onValueChange={(v) => toggle(item, v)} />
              )}
            </View>
          )}
        />
      )}

      {profile?.role === "DISTRICT_ADMIN" && (
        <Pressable style={styles.migrateButton} onPress={confirmMigration} disabled={migrating}>
          {migrating ? (
            <ActivityIndicator color="#1b6e3c" />
          ) : (
            <Text style={styles.migrateText}>Gusana amakuru ya kera (migration)</Text>
          )}
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 14 },
  newButton: { backgroundColor: "#1b6e3c", borderRadius: 10, padding: 12, alignItems: "center", marginBottom: 12 },
  newButtonText: { color: "white", fontWeight: "700" },
  empty: { textAlign: "center", color: "#888", marginTop: 30 },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#e3e8e3",
  },
  cardOff: { opacity: 0.55 },
  name: { fontSize: 15, fontWeight: "700" },
  meta: { fontSize: 12, color: "#666", marginTop: 2 },
  migrateButton: { borderWidth: 1, borderColor: "#1b6e3c", borderRadius: 10, padding: 12, alignItems: "center", marginTop: 8 },
  migrateText: { color: "#1b6e3c", fontWeight: "600" },
});
