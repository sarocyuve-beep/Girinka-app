import React, { useState } from "react";
import { View, Text, TextInput, Pressable, StyleSheet, ScrollView, Alert, ActivityIndicator } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../navigation/RootNavigator";
import { LocationSelector } from "../../components/LocationSelector";
import { getSectors, getCells, getVillages } from "../../data/locations";
import { useAuth } from "../../auth/AuthContext";
import { createStaffUser } from "../../auth/userAdmin";
import { assignableRoles, requiredLevel, ROLE_LABEL } from "../../auth/scope";
import { Role } from "../../types/core";

type Props = NativeStackScreenProps<RootStackParamList, "UserForm"> | NativeStackScreenProps<any, "Register">;

export default function UserFormScreen({ navigation, route }: Props) {
  const { profile, user } = useAuth();
  const isRegister = route.name === "Register";
  const allRoles = assignableRoles(profile?.role);

  // Group roles by their required level
  const availableLevels = Array.from(new Set(allRoles.map(requiredLevel))).sort((a, b) => a - b);

  const district = isRegister ? "Musanze" : (profile?.district ?? "");
  const lockSector = !isRegister && !!profile?.sector;
  const lockCell = !isRegister && !!profile?.cell;
  const lockVillage = !isRegister && !!profile?.village;

  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");

  // New State: Selected Level (0: District, 1: Sector, 2: Cell, 3: Village)
  const [selectedLevel, setSelectedLevel] = useState<number>(availableLevels[0] ?? 0);

  // Filter roles based on selected level
  const filteredRoles = allRoles.filter((r) => requiredLevel(r) === selectedLevel);
  const [role, setRole] = useState<Role>(filteredRoles[0] || allRoles[0]);

  const [sector, setSector] = useState(profile?.sector ?? "");
  const [cell, setCell] = useState(profile?.cell ?? "");
  const [village, setVillage] = useState(profile?.village ?? "");
  const [busy, setBusy] = useState(false);

  // Update role when level changes
  const handleLevelChange = (lv: number) => {
    setSelectedLevel(lv);
    const firstRoleForLevel = allRoles.find((r) => requiredLevel(r) === lv);
    if (firstRoleForLevel) setRole(firstRoleForLevel);

    // Clear sub-locations if level is higher
    if (lv < 3) setVillage("");
    if (lv < 2) setCell("");
    if (lv < 1) setSector("");
  };

  const LEVEL_NAMES: Record<number, string> = {
    0: "Akarere",
    1: "Umurenge",
    2: "Akagari",
    3: "Umudugudu",
  };

  async function onSave() {
    const uname = username.trim().toLowerCase();
    if (!fullName.trim()) return Alert.alert("Ikosa", "Andika amazina yombi.");
    if (!/^[a-z0-9._-]{3,30}$/.test(uname)) {
      return Alert.alert("Ikosa", "Izina ry'ukoresha rigomba kuba inyuguti nto, imibare, '.', '_' cyangwa '-' (3–30).");
    }
    if (password.length < 8) return Alert.alert("Ikosa", "Ijambobanga rigomba kuba rifite nibura inyuguti 8.");
    if (!/^07[2389][0-9]{7}$/.test(phone.trim())) {
      return Alert.alert("Ikosa", "Numero ya telefone ntago yuzuye (Urugero: 078XXXXXXX).");
    }

    if (selectedLevel >= 1 && !sector) return Alert.alert("Ikosa", "Hitamo Umurenge.");
    if (selectedLevel >= 2 && !cell) return Alert.alert("Ikosa", "Hitamo Akagari.");
    if (selectedLevel >= 3 && !village) return Alert.alert("Ikosa", "Hitamo Umudugudu.");

    let s: string | null = sector || null;
    let c: string | null = cell || null;
    let v: string | null = village || null;

    if (selectedLevel === 0) s = c = v = null;
    else if (selectedLevel > 0) {
      if (selectedLevel < 2) c = null;
      if (selectedLevel < 3) v = null;
    }

    setBusy(true);
    try {
      await createStaffUser({
        fullName,
        username: uname,
        password,
        role,
        district: district.toUpperCase(),
        sector: s ? s.toUpperCase() : null,
        cell: c ? c.toUpperCase() : null,
        village: v ? v.toUpperCase() : null,
        phone: phone.trim(),
        email: email.trim() || null,
        createdBy: user?.uid ?? "SELF_REGISTER",
      });
      if (isRegister) {
        Alert.alert("Byagenze neza", `Konti ya ${uname} yasabwe. Tegereza umuyobozi ayemeze (Activate).`);
      } else {
        Alert.alert("Byagenze neza", `Konti ya ${uname} yakozwe. Uyihe ijambobanga ryayo.`);
      }
      navigation.goBack();
    } catch (e: any) {
      const msg =
        e?.code === "auth/email-already-in-use"
          ? "Iri zina ry'ukoresha risanzwe rikoreshwa."
          : e?.code === "auth/weak-password"
          ? "Ijambobanga ni ryoroshye cyane."
          : e?.message ?? "Ntibishoboye kubikwa.";
      Alert.alert("Ikosa", msg);
    } finally {
      setBusy(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <Text style={styles.headerLabel}>1. Amakuru rusange</Text>

      <Text style={styles.label}>Amazina yombi</Text>
      <TextInput style={styles.input} value={fullName} onChangeText={setFullName} />

      <Text style={styles.label}>Izina ry'ukoresha (username)</Text>
      <TextInput style={styles.input} value={username} autoCapitalize="none" autoCorrect={false} onChangeText={setUsername} />

      <Text style={styles.label}>Ijambobanga (nibura 8)</Text>
      <TextInput style={styles.input} value={password} secureTextEntry autoCapitalize="none" autoCorrect={false} onChangeText={setPassword} />

      <Text style={styles.label}>Numero ya Telefone</Text>
      <TextInput style={styles.input} value={phone} keyboardType="phone-pad" placeholder="078..." onChangeText={setPhone} />

      <View style={styles.divider} />
      <Text style={styles.headerLabel}>2. Urwego n'aho ukorera</Text>

      <Text style={styles.label}>Hitamo Urwego rw'imikorere</Text>
      <View style={styles.roleWrap}>
        {availableLevels.map((lv) => (
          <Pressable key={lv} style={[styles.chip, selectedLevel === lv && styles.chipOn]} onPress={() => handleLevelChange(lv)}>
            <Text style={[styles.chipText, selectedLevel === lv && styles.chipTextOn]}>{LEVEL_NAMES[lv]}</Text>
          </Pressable>
        ))}
      </View>

      <LocationSelector label="Akarere" value={district} options={[district]} onSelect={() => {}} disabled />

      {selectedLevel >= 1 && (
        <LocationSelector
          label="Umurenge"
          value={sector}
          options={getSectors(district)}
          onSelect={(v) => {
            setSector(v);
            setCell("");
            setVillage("");
          }}
          disabled={lockSector}
        />
      )}

      {selectedLevel >= 2 && (
        <LocationSelector
          label="Akagari"
          value={cell}
          options={sector ? getCells(district, sector) : []}
          onSelect={(v) => {
            setCell(v);
            setVillage("");
          }}
          disabled={lockCell || !sector}
        />
      )}

      {selectedLevel >= 3 && (
        <LocationSelector
          label="Umudugudu"
          value={village}
          options={cell ? getVillages(district, sector, cell) : []}
          onSelect={setVillage}
          disabled={lockVillage || !cell}
        />
      )}

      {filteredRoles.length > 0 && (
        <>
          <Text style={[styles.label, { marginTop: 10 }]}>Uruhare (Role) kuri uru rwego</Text>
          <View style={styles.roleWrap}>
            {filteredRoles.map((r) => (
              <Pressable key={r} style={[styles.chip, role === r && styles.chipOn]} onPress={() => setRole(r)}>
                <Text style={[styles.chipText, role === r && styles.chipTextOn]}>{ROLE_LABEL[r]}</Text>
              </Pressable>
            ))}
          </View>
        </>
      )}

      <Pressable style={styles.button} onPress={onSave} disabled={busy}>
        {busy ? <ActivityIndicator color="white" /> : <Text style={styles.buttonText}>Kora konti</Text>}
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, paddingBottom: 40 },
  headerLabel: { fontSize: 16, fontWeight: "800", color: "#1b6e3c", marginBottom: 12, marginTop: 8 },
  label: { fontSize: 13, fontWeight: "600", color: "#333", marginBottom: 6 },
  input: { borderWidth: 1, borderColor: "#ccc", borderRadius: 8, padding: 10, backgroundColor: "white", marginBottom: 14 },
  roleWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 16 },
  chip: { borderWidth: 1, borderColor: "#1b6e3c", borderRadius: 16, paddingVertical: 8, paddingHorizontal: 14 },
  chipOn: { backgroundColor: "#1b6e3c" },
  chipText: { color: "#1b6e3c", fontSize: 12, fontWeight: "600" },
  chipTextOn: { color: "white", fontWeight: "700" },
  divider: { height: 1, backgroundColor: "#eee", marginVertical: 15 },
  button: { backgroundColor: "#1b6e3c", borderRadius: 10, padding: 14, alignItems: "center", marginTop: 20 },
  buttonText: { color: "white", fontWeight: "700", fontSize: 16 },
});
