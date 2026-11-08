import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, ScrollView, Alert, Pressable, ActivityIndicator, TextInput } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../navigation/RootNavigator";
import { getBeneficiary, saveDistribution, hasActiveCow, linkAnimalToDistribution } from "../../db/registryRepository";
import { getCandidate } from "../../db/selectionRepository";
import { listAnimals } from "../../db/animalRepository";
import { Beneficiary, Distribution } from "../../types/registry";
import { Candidate } from "../../types/selection";
import { Animal } from "../../types/animal";
import { LocationSelector } from "../../components/LocationSelector";
import { v4 as uuidv4 } from "uuid";
import DateTimePicker from "@react-native-community/datetimepicker";

type Props = NativeStackScreenProps<RootStackParamList, "DistributionForm">;

export default function DistributionFormScreen({ route, navigation }: Props) {
  const { beneficiaryId, candidateId, distributionId } = route.params;
  const [beneficiary, setBeneficiary] = useState<Beneficiary | Candidate | null>(null);
  const [animals, setAnimals] = useState<Animal[]>([]);
  const [selectedAnimalId, setSelectedAnimalId] = useState<string>("");
  const [source, setSource] = useState("RAB");
  const [type, setType] = useState<"NEW" | "REPLACEMENT">("NEW");
  const [dateReceived, setDateReceived] = useState(new Date().toISOString().split('T')[0]);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [earTag, setEarTag] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const [person, aList] = await Promise.all([
          candidateId ? getCandidate(candidateId) : getBeneficiary(beneficiaryId),
          listAnimals(),
        ]);
        setBeneficiary(person);
        // Filter only available animals (not yet assigned)
        setAnimals(aList.filter(a => !a.currentOwnerId || a.currentStatus === 'HEALTHY' && !a.currentOwnerId));
      } catch (e) {
        Alert.alert("Error", "Could not load data.");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [beneficiaryId, candidateId]);

  async function onSave() {
    if (!selectedAnimalId || !source || !dateReceived) {
      Alert.alert("Ikosa", "Uzuza imyanya yose ikenewe.");
      return;
    }

    if (!candidateId && !distributionId) {
        const hasCow = await hasActiveCow(beneficiaryId);
        if (type === "NEW" && hasCow) {
            Alert.alert("Ikosa", "Uyu mugenerwabikorwa asanzwe afite inka. Ntiwahabwa indi nshya, keretse hashumbushijwe (Replacement).");
            return;
        }
    }

    setSaving(true);
    try {
      if (distributionId) {
        await linkAnimalToDistribution(distributionId, selectedAnimalId, beneficiaryId);
        Alert.alert("Byagenze neza", "Inka yahawe umugenerwabikorwa yasibuwe neza.");
      } else {
        const distribution: Distribution = {
          id: uuidv4(),
          beneficiaryId,
          animalId: selectedAnimalId,
          type,
          yearReceived: parseInt(dateReceived.split('-')[0]),
          dateReceived: dateReceived,
          source: source.trim().toUpperCase(),
          passedOnCow: false,
          notes: earTag ? `Ear Tag: ${earTag.trim().toUpperCase()}` : null,
          createdAt: new Date().toISOString(),
          district: null,
          sector: null,
          cell: null,
          village: null,
        };
        await saveDistribution(distribution, candidateId);
        Alert.alert("Byagenze neza", candidateId ? "Umukandida yahawe inka kandi yimuriwe mu bagenarwabikorwa." : "Inka yahawe umugenerwabikorwa.");
      }

      if (candidateId) {
          navigation.navigate("BeneficiaryList");
      } else {
          navigation.goBack();
      }
    } catch (e) {
      Alert.alert("Ikosa", "Ntibishoboye kubikwa.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <ActivityIndicator style={{ marginTop: 40 }} color="#1b6e3c" />;
  if (!beneficiary) return <View style={styles.container}><Text>Beneficiary not found.</Text></View>;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>
        {distributionId ? "Guhuza Inka n'Itangwa" : "Guhaba Inka"}: {beneficiary.fullName}
      </Text>

      <LocationSelector
        label="Hitamo Inka (Select Animal)"
        value={selectedAnimalId ? animals.find(a => a.id === selectedAnimalId)?.earTag || "" : ""}
        options={animals.map(a => `${a.earTag} (${a.breed})`)}
        onSelect={(val) => {
            const found = animals.find(a => `${a.earTag} (${a.breed})` === val);
            if (found) setSelectedAnimalId(found.id!);
        }}
      />

      {animals.length === 0 && !loading && (
        <Pressable
          style={styles.newAnimalBtn}
          onPress={() => navigation.navigate("AnimalForm", { beneficiaryId, distributionId })}
        >
          <Text style={styles.newAnimalBtnText}>+ Kwandika inka nshya itari muri sisitemu</Text>
        </Pressable>
      )}

      {!distributionId && (
        <>
          <LocationSelector
            label="Ubwoko bw'itangwa (Distribution Type)"
            value={type === "NEW" ? "Guhabwa inka bwa mbere (NEW)" : "Gushumbusha (REPLACEMENT)"}
            options={["Guhabwa inka bwa mbere (NEW)", "Gushumbusha (REPLACEMENT)"]}
            onSelect={(val) => setType(val.includes("NEW") ? "NEW" : "REPLACEMENT")}
          />

          <View style={styles.field}>
            <Text style={styles.label}>Inkomoko (Source)</Text>
            <TextInput style={styles.input} value={source} onChangeText={setSource} placeholder="Urugero: RAB, FARG, RARDA..." />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Itariki yayihaweho (Date)</Text>
            <Pressable onPress={() => setShowDatePicker(true)}>
              <View pointerEvents="none">
                <TextInput style={styles.input} value={dateReceived} editable={false} placeholder="YYYY-MM-DD" />
              </View>
            </Pressable>
            {showDatePicker && (
              <DateTimePicker
                value={new Date(dateReceived)}
                mode="date"
                display="default"
                onChange={(event, selectedDate) => {
                  setShowDatePicker(false);
                  if (selectedDate) {
                    setDateReceived(selectedDate.toISOString().split('T')[0]);
                  }
                }}
              />
            )}
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Numero y'Iherena (Ear Tag)</Text>
            <TextInput style={styles.input} value={earTag} onChangeText={setEarTag} placeholder="Urugero: RW123456" />
          </View>
        </>
      )}

      <Pressable style={styles.saveButton} onPress={onSave} disabled={saving}>
        {saving ? <ActivityIndicator color="white" /> : <Text style={styles.saveButtonText}>{distributionId ? "Huza Inka" : "Bika Itangwa"}</Text>}
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16 },
  title: { fontSize: 18, fontWeight: "700", marginBottom: 20, color: "#1b6e3c" },
  label: { fontSize: 13, color: "#333", marginBottom: 6, fontWeight: "600" },
  field: { marginBottom: 14 },
  input: { borderWidth: 1, borderColor: "#ccc", borderRadius: 8, padding: 10, backgroundColor: "white" },
  saveButton: { backgroundColor: "#1b6e3c", borderRadius: 10, padding: 14, alignItems: "center", marginTop: 10 },
  saveButtonText: { color: "white", fontWeight: "700", fontSize: 16 },
  newAnimalBtn: {
    marginTop: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: "#1b6e3c",
    borderRadius: 8,
    borderStyle: "dashed",
    alignItems: "center",
  },
  newAnimalBtnText: {
    color: "#1b6e3c",
    fontWeight: "600",
    fontSize: 13,
  },
});
