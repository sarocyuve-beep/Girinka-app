import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  Pressable,
  ActivityIndicator,
  TextInput,
  Image,
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../navigation/RootNavigator";
import { getBeneficiary, saveIncident, listDistributionsForBeneficiary } from "../../db/registryRepository";
import { Incident, IncidentType } from "../../types/registry";
import { LocationSelector } from "../../components/LocationSelector";
import { v4 as uuidv4 } from "uuid";
import { useAuth } from "../../auth/AuthContext";
import * as ImagePicker from "expo-image-picker";
import { uploadToCloudinary } from "../../config/cloudinary";
import DateTimePicker from "@react-native-community/datetimepicker";

type Props = NativeStackScreenProps<RootStackParamList, "IncidentForm">;

const INCIDENT_TYPES: { label: string; value: IncidentType }[] = [
  { label: "Gupfa (Death)", value: "DEATH" },
  { label: "Kwibwa (Theft)", value: "THEFT" },
  { label: "Kugurisha (Sale)", value: "SALE" },
  { label: "Gutanga (Gift)", value: "GIFT" },
  { label: "Kurwara (Illness)", value: "ILLNESS" },
  { label: "Kwamburwa (Seizure)", value: "SEIZURE" },
  { label: "Kugarura ku bushake (Voluntary Return)", value: "VOLUNTARY_RETURN" },
  { label: "Inka ifashwe nabi (Poor Management)", value: "POOR_MANAGEMENT" },
];

export default function IncidentFormScreen({ route, navigation }: Props) {
  const params = route.params;
  const beneficiaryId = params?.beneficiaryId;
  const animalId = params?.animalId;
  const existingIncident = params?.incident;
  const { profile } = useAuth();

  const [type, setType] = useState<IncidentType>(existingIncident?.type || "DEATH");
  const [date, setDate] = useState(existingIncident?.date || new Date().toISOString().split('T')[0]);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [description, setDescription] = useState(existingIncident?.description || "");
  const [photo, setPhoto] = useState<string | null>(existingIncident?.photoUri || null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!beneficiaryId || !animalId) {
      Alert.alert("Ikosa", "Amakuru y'inka ntabonetse.");
      navigation.goBack();
    }
  }, [beneficiaryId, animalId]);

  const pickImage = async () => {
    Alert.alert(
      "Gufata ifoto",
      "Hitamo aho ukura ifoto",
      [
        {
          text: "Kamera (Camera)",
          onPress: async () => {
            const { status } = await ImagePicker.requestCameraPermissionsAsync();
            if (status !== "granted") {
              Alert.alert("Ikosa", "Ugomba kwemerera porogaramu gukoresha kamera.");
              return;
            }
            const result = await ImagePicker.launchCameraAsync({
              allowsEditing: true,
              aspect: [4, 3],
              quality: 0.5,
            });
            if (!result.canceled) {
              setPhoto(result.assets[0].uri);
            }
          },
        },
        {
          text: "Gahunda y'amafoto (Gallery)",
          onPress: async () => {
            const result = await ImagePicker.launchImageLibraryAsync({
              mediaTypes: ImagePicker.MediaTypeOptions.Images,
              allowsEditing: true,
              aspect: [4, 3],
              quality: 0.5,
            });
            if (!result.canceled) {
              setPhoto(result.assets[0].uri);
            }
          },
        },
        { text: "Cancel", style: "cancel" },
      ]
    );
  };

  async function onSave() {
    if (!beneficiaryId || !animalId) return;

    if (!description || description.trim().length < 5) {
      Alert.alert("Ikosa", "Tanga ibisobanuro birambuye (nibura amagambo make).");
      return;
    }

    Alert.alert(
      "Kwememeza",
      "Ese wizeye ko ushaka kubika aya makuru y'ikibazo cyabaye?",
      [
        { text: "Hagarika", style: "cancel" },
        {
          text: "Yego, Bika",
          onPress: async () => {
            setSaving(true);
            try {
              let uploadedPhotoUri = existingIncident?.photoUri || null;
              if (photo && photo !== existingIncident?.photoUri) {
                const upload = await uploadToCloudinary(photo, "incidents");
                uploadedPhotoUri = upload.secureUrl;
              }

              const incident: Incident = {
                id: existingIncident?.id || uuidv4(),
                beneficiaryId,
                animalId,
                type,
                date,
                description: description.trim(),
                photoUri: uploadedPhotoUri,
                reportedBy: existingIncident?.reportedBy || profile?.fullName || "Unknown",
                createdAt: existingIncident?.createdAt || new Date().toISOString(),
                district: null,
                sector: null,
                cell: null,
                village: null,
              };

              await saveIncident(incident);

              Alert.alert("Byagenze neza", existingIncident ? "Icyavuguruwe cyabitswe." : "Ibibazo byabaye ku nka byanditswe.");
              navigation.goBack();
            } catch (e) {
              Alert.alert("Ikosa", "Ntibishoboye kubikwa.");
            } finally {
              setSaving(false);
            }
          },
        },
      ]
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Kwandika ikibazo cyabaye ku nka</Text>

      <LocationSelector
        label="Uburemere bw'ikibazo (Incident Type)"
        value={INCIDENT_TYPES.find(t => t.value === type)?.label ?? ""}
        options={INCIDENT_TYPES.map(t => t.label)}
        onSelect={(val) => {
          const found = INCIDENT_TYPES.find(t => t.label === val);
          if (found) setType(found.value);
        }}
      />

      <View style={styles.field}>
        <Text style={styles.label}>Itariki byabereyeho (Date)</Text>
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
        <Text style={styles.label}>Ibisobanuro (Description)</Text>
        <TextInput
          style={[styles.input, { height: 100, textAlignVertical: 'top' }]}
          value={description}
          onChangeText={setDescription}
          multiline
          placeholder="Sobanura uko byagenze..."
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Ifoto (Photo - Ihitamo)</Text>
        <Pressable style={styles.photoButton} onPress={pickImage}>
          {photo ? (
            <Image source={{ uri: photo }} style={styles.photo} />
          ) : (
            <View style={styles.placeholder}>
              <Text style={styles.placeholderText}>Kanda hano ufate ifoto</Text>
            </View>
          )}
        </Pressable>
      </View>

      <Pressable style={styles.saveButton} onPress={onSave} disabled={saving}>
        {saving ? <ActivityIndicator color="white" /> : <Text style={styles.saveButtonText}>Bika Ibibazo</Text>}
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16 },
  title: { fontSize: 18, fontWeight: "700", marginBottom: 20, color: "#b3261e" },
  label: { fontSize: 13, color: "#333", marginBottom: 6, fontWeight: "600" },
  field: { marginBottom: 14 },
  input: { borderWidth: 1, borderColor: "#ccc", borderRadius: 8, padding: 10, backgroundColor: "white" },
  photoButton: {
    height: 150,
    backgroundColor: "#eee",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#ccc",
    borderStyle: "dashed",
  },
  photo: { width: "100%", height: "100%" },
  placeholder: { alignItems: "center" },
  placeholderText: { color: "#666", fontSize: 14 },
  saveButton: { backgroundColor: "#b3261e", borderRadius: 10, padding: 14, alignItems: "center", marginTop: 10 },
  saveButtonText: { color: "white", fontWeight: "700", fontSize: 16 },
});
