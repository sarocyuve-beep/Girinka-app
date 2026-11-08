import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, Alert, Pressable, ActivityIndicator, TextInput } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../navigation/RootNavigator";
import { saveBeneficiary, getBeneficiaryByNationalId } from "../../db/registryRepository";
import { Beneficiary, UbudeheCategory } from "../../types/registry";
import { LocationSelector } from "../../components/LocationSelector";
import { v4 as uuidv4 } from "uuid";
import { useAuth } from "../../auth/AuthContext";

type Props = NativeStackScreenProps<RootStackParamList, "BeneficiaryForm">;

const UBUDEHE_OPTS: UbudeheCategory[] = ["1", "2", "3", "4"];

export default function BeneficiaryFormScreen({ route, navigation }: Props) {
  const { profile } = useAuth();
  const existingBeneficiary = route.params?.beneficiary;

  const [fullName, setFullName] = useState(existingBeneficiary?.fullName || "");
  const [nationalId, setNationalId] = useState(existingBeneficiary?.nationalId || "");
  const [sex, setSex] = useState<"M" | "F">(existingBeneficiary?.sex || "F");
  const [ubudehe, setUbudehe] = useState<UbudeheCategory>(existingBeneficiary?.ubudeheCategory || null);
  const [phone, setPhone] = useState(existingBeneficiary?.phone || "");
  const [lat, setLat] = useState(existingBeneficiary?.latitude?.toString() || "");
  const [lng, setLng] = useState(existingBeneficiary?.longitude?.toString() || "");

  const [district, setDistrict] = useState(existingBeneficiary?.district || profile?.district || "");
  const [sector, setSector] = useState(existingBeneficiary?.sector || profile?.sector || "");
  const [cell, setCell] = useState(existingBeneficiary?.cell || profile?.cell || "");
  const [village, setVillage] = useState(existingBeneficiary?.village || profile?.village || "");

  const [saving, setSaving] = useState(false);

  const checkDuplicate = async () => {
    if (existingBeneficiary) return false;
    if (nationalId.length >= 16) {
      const existing = await getBeneficiaryByNationalId(nationalId);
      if (existing) {
        Alert.alert(
          "Umugenerwabikorwa asanzwe ari muri sisitemu",
          `Izina: ${existing.fullName}\nUmudugudu: ${existing.village}\n\nNtushobora kwandika umuntu inshuro ebyiri.`
        );
        return true;
      }
    }
    return false;
  };

  async function onSave() {
    if (!fullName || nationalId.length < 16 || !village) {
      Alert.alert("Ikosa", "Uzuza amazina, indangamuntu (imibare 16), n'aho atuye.");
      return;
    }

    if (!existingBeneficiary) {
      const isDup = await checkDuplicate();
      if (isDup) return;
    }

    setSaving(true);
    try {
      const ben: Beneficiary = {
        id: existingBeneficiary?.id || nationalId.trim(),
        fullName: fullName.trim().toUpperCase(),
        nationalId: nationalId.trim(),
        sex,
        ubudeheCategory: ubudehe,
        district: district.toUpperCase(),
        sector: sector.toUpperCase(),
        cell: cell.trim().toUpperCase(),
        village: village.trim().toUpperCase(),
        phone: phone.trim() || null,
        latitude: lat ? parseFloat(lat) : null,
        longitude: lng ? parseFloat(lng) : null,
        createdAt: existingBeneficiary?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await saveBeneficiary(ben);

      if (existingBeneficiary) {
        Alert.alert("Byagenze neza", "Amakuru yavuguruwe.");
        navigation.goBack();
      } else {
        Alert.alert("Byagenze neza", "Umugenerwabikorwa yanditswe. Urashaka guhita wandika inka yahawe?", [
          { text: "Oya", onPress: () => navigation.goBack() },
          { text: "Yego", onPress: () => navigation.replace("DistributionForm", { beneficiaryId: ben.id }) }
        ]);
      }
    } catch (e) {
      Alert.alert("Ikosa", "Ntibishoboye kubikwa.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>{existingBeneficiary ? "Kuvugurura Amakuru" : "Kwandika Umugenerwabikorwa Udahuye na Sisitemu"}</Text>

      <View style={styles.field}>
        <Text style={styles.label}>Amazina Yombi</Text>
        <TextInput style={styles.input} value={fullName} onChangeText={setFullName} placeholder="Urugero: MUHIZI Jean" />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Indangamuntu (ID Number)</Text>
        <TextInput
          style={styles.input}
          value={nationalId}
          onChangeText={setNationalId}
          keyboardType="numeric"
          maxLength={16}
          onBlur={checkDuplicate}
        />
      </View>

      <LocationSelector
        label="Igitsina"
        value={sex === "M" ? "Gabo" : "Gore"}
        options={["Gabo", "Gore"]}
        onSelect={(val) => setSex(val === "Gabo" ? "M" : "F")}
      />

      <LocationSelector
        label="Icyiciro cy'Ubudehe"
        value={ubudehe || "Hitamo..."}
        options={UBUDEHE_OPTS.map(String)}
        onSelect={(val) => setUbudehe(val as UbudeheCategory)}
      />

      <View style={styles.field}>
        <Text style={styles.label}>Telefone</Text>
        <TextInput style={styles.input} value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholder="078..." />
      </View>

      <Text style={styles.section}>Geo-Location (Coordinates)</Text>
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <View style={[styles.field, { flex: 1 }]}>
          <Text style={styles.label}>Latitude</Text>
          <TextInput style={styles.input} value={lat} onChangeText={setLat} keyboardType="numeric" placeholder="-1.5..." />
        </View>
        <View style={[styles.field, { flex: 1 }]}>
          <Text style={styles.label}>Longitude</Text>
          <TextInput style={styles.input} value={lng} onChangeText={setLng} keyboardType="numeric" placeholder="29.7..." />
        </View>
      </View>

      <Text style={styles.section}>Aho atuye</Text>

      <View style={styles.field}><Text style={styles.label}>Akarere</Text><TextInput style={[styles.input, styles.disabled]} value={district} editable={false} /></View>
      <View style={styles.field}><Text style={styles.label}>Umurenge</Text><TextInput style={[styles.input, styles.disabled]} value={sector} editable={false} /></View>
      <View style={styles.field}><Text style={styles.label}>Akagari</Text><TextInput style={styles.input} value={cell} onChangeText={(v) => setCell(v.toUpperCase())} /></View>
      <View style={styles.field}><Text style={styles.label}>Umudugudu</Text><TextInput style={styles.input} value={village} onChangeText={(v) => setVillage(v.toUpperCase())} /></View>

      <Pressable style={styles.saveButton} onPress={onSave} disabled={saving}>
        {saving ? <ActivityIndicator color="white" /> : <Text style={styles.saveButtonText}>Bika Umugenerwabikorwa</Text>}
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16 },
  title: { fontSize: 18, fontWeight: "700", marginBottom: 20, color: "#1b6e3c" },
  section: { fontSize: 16, fontWeight: "600", marginTop: 10, marginBottom: 10, borderBottomWidth: 1, borderBottomColor: '#eee' },
  label: { fontSize: 13, color: "#333", marginBottom: 6, fontWeight: "600" },
  field: { marginBottom: 14 },
  input: { borderWidth: 1, borderColor: "#ccc", borderRadius: 8, padding: 10, backgroundColor: "white" },
  disabled: { backgroundColor: '#f0f0f0', color: '#888' },
  saveButton: { backgroundColor: "#1b6e3c", borderRadius: 10, padding: 14, alignItems: "center", marginTop: 10 },
  saveButtonText: { color: "white", fontWeight: "700", fontSize: 16 },
});
