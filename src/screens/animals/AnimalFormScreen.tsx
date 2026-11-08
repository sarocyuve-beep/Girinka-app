import React, { useState } from "react";
import { View, Text, TextInput, Pressable, StyleSheet, ScrollView, Alert, Image, ActivityIndicator } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import * as ImagePicker from "expo-image-picker";
import { RootStackParamList } from "../../navigation/RootNavigator";
import { createAnimal, updateAnimal } from "../../db/animalRepository";
import { linkAnimalToDistribution } from "../../db/registryRepository";
import { uploadToCloudinary } from "../../config/cloudinary";
import { Animal, AnimalBreed, AnimalStatus } from "../../types/animal";
import { t } from "../../i18n/strings";
import { LocationSelector } from "../../components/LocationSelector";
import DateTimePicker from "@react-native-community/datetimepicker";

type Props = NativeStackScreenProps<RootStackParamList, "AnimalForm">;

const BREEDS: AnimalBreed[] = ["Friesian", "Jersey", "Sahiwal", "Ankole", "Cross", "Other"];

export default function AnimalFormScreen({ route, navigation }: Props) {
  const { distributionId, beneficiaryId, animal } = route.params || {};
  const [earTag, setEarTag] = useState(animal?.earTag || "");
  const [breed, setBreed] = useState<AnimalBreed>(animal?.breed || "Cross");
  const [color, setColor] = useState(animal?.color || "");
  const [birthDate, setBirthDate] = useState(animal?.birthDate || new Date().toISOString().slice(0, 10));
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [origin, setOrigin] = useState(animal?.origin || "");
  const [healthStatus, setHealthStatus] = useState(animal?.healthStatus || "Nziza (Healthy)");
  const [photoUri, setPhotoUri] = useState<string | null>(animal?.photoUrl || null);
  const [saving, setSaving] = useState(false);

  async function pickImage() {
    Alert.alert(
      "Gufata Ifoto",
      "Hitamo aho ukura ifoto y'inka",
      [
        {
          text: "Gukoresha Camera",
          onPress: async () => {
            const { status } = await ImagePicker.requestCameraPermissionsAsync();
            if (status !== 'granted') {
              Alert.alert("Ikosa", "Ugomba kwemerera app gukoresha camera.");
              return;
            }
            const result = await ImagePicker.launchCameraAsync({
              allowsEditing: true,
              aspect: [4, 3],
              quality: 0.7,
            });
            if (!result.canceled) setPhotoUri(result.assets[0].uri);
          }
        },
        {
          text: "Kuyikura muri Gallery",
          onPress: async () => {
            const result = await ImagePicker.launchImageLibraryAsync({
              mediaTypes: ImagePicker.MediaTypeOptions.Images,
              allowsEditing: true,
              aspect: [4, 3],
              quality: 0.7,
            });
            if (!result.canceled) setPhotoUri(result.assets[0].uri);
          }
        },
        { text: "Hagarika", style: "cancel" }
      ]
    );
  }

  async function onSave() {
    if (!earTag || !color || !origin) {
      Alert.alert(t("error"), "Uzuza Ear Tag, ibara n'aho inka ituruka.");
      return;
    }

    setSaving(true);
    try {
      let photoUrl = animal?.photoUrl || null;
      if (photoUri && photoUri !== animal?.photoUrl) {
        const uploadResult = await uploadToCloudinary(photoUri, "cows");
        photoUrl = uploadResult.secureUrl;
      }

      const normalizedEarTag = earTag.trim().toUpperCase();
      const normalizedOrigin = origin.trim().toUpperCase();
      const normalizedColor = color.trim();

      if (animal?.id) {
        await updateAnimal(animal.id, {
          earTag: normalizedEarTag,
          breed,
          color: normalizedColor,
          birthDate,
          origin: normalizedOrigin,
          healthStatus,
          photoUrl,
        });
      } else {
        const animalId = await createAnimal({
          earTag: normalizedEarTag,
          breed,
          sex: "F", // Inka nyinshi za Girinka ni iz'ingore
          color: normalizedColor,
          birthDate,
          origin: normalizedOrigin,
          healthStatus,
          currentStatus: "HEALTHY",
          photoUrl,
          currentOwnerId: beneficiaryId || null, // Ihabwa owner iyo habaye Distribution
          district: null,
          sector: null,
          cell: null,
          village: null,
        });

        if (distributionId && beneficiaryId) {
          await linkAnimalToDistribution(distributionId, animalId, beneficiaryId);
        }
      }

      Alert.alert("Byagenze neza", animal?.id ? "Amakuru y'inka yavuguruwe." : (distributionId ? "Inka yahawe umugenerwabikorwa yasibuwe neza." : "Inka yanditswe muri sisitemu."));
      navigation.goBack();
    } catch (error) {
      console.error(error);
      Alert.alert("Ikosa", "Ntibishoboye kubikwa. Reba niba internet ikora.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.sectionTitle}>Ibiranga inka</Text>

      <Field label="Ear Tag Number" value={earTag} onChangeText={setEarTag} placeholder="Urugero: RW12345" />

      <LocationSelector
        label="Ubwoko (Breed)"
        value={breed}
        options={BREEDS}
        onSelect={(v) => setBreed(v as AnimalBreed)}
      />

      <Field label="Ibara ry'inka" value={color} onChangeText={setColor} placeholder="Urugero: Umukara n'umweru" />

      <View style={styles.field}>
        <Text style={styles.label}>Itariki yavutse (kigereranyo)</Text>
        <Pressable onPress={() => setShowDatePicker(true)}>
          <View pointerEvents="none">
            <TextInput style={styles.input} value={birthDate} editable={false} placeholder="YYYY-MM-DD" />
          </View>
        </Pressable>
        {showDatePicker && (
          <DateTimePicker
            value={new Date(birthDate)}
            mode="date"
            display="default"
            onChange={(event, selectedDate) => {
              setShowDatePicker(false);
              if (selectedDate) {
                setBirthDate(selectedDate.toISOString().split('T')[0]);
              }
            }}
          />
        )}
      </View>

      <Field label="Inkomoko (Origin)" value={origin} onChangeText={setOrigin} placeholder="Urugero: RAB, Pass-on..." />
      <Field label="Ubuzima (Health)" value={healthStatus} onChangeText={setHealthStatus} />

      <Text style={styles.label}>Ifoto y'inka</Text>
      <Pressable style={styles.imagePicker} onPress={pickImage}>
        {photoUri ? (
          <Image source={{ uri: photoUri }} style={styles.previewImage} />
        ) : (
          <Text style={styles.imagePickerText}>+ Kanda hano ufatireho ifoto</Text>
        )}
      </Pressable>

      <Pressable style={styles.saveButton} onPress={onSave} disabled={saving}>
        {saving ? <ActivityIndicator color="white" /> : <Text style={styles.saveButtonText}>{t("save")}</Text>}
      </Pressable>
    </ScrollView>
  );
}

function Field({ label, value, onChangeText, placeholder }: any) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16 },
  sectionTitle: { fontSize: 18, fontWeight: "700", marginBottom: 16, color: "#1b6e3c" },
  field: { marginBottom: 14 },
  label: { fontSize: 13, color: "#333", marginBottom: 6, fontWeight: "600" },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    backgroundColor: "white",
  },
  imagePicker: {
    height: 200,
    backgroundColor: "#eee",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#ccc",
    borderStyle: "dashed",
  },
  imagePickerText: { color: "#666" },
  previewImage: { width: "100%", height: "100%" },
  saveButton: {
    backgroundColor: "#1b6e3c",
    borderRadius: 10,
    padding: 14,
    alignItems: "center",
    marginTop: 10,
    marginBottom: 40,
  },
  saveButtonText: { color: "white", fontWeight: "700", fontSize: 16 },
});
