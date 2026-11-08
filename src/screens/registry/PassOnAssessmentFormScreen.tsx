import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
  Alert,
  Switch,
  Image,
  ActivityIndicator,
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../navigation/RootNavigator";
import { getBeneficiary, savePassOnAssessment, getPassOnAssessment } from "../../db/registryRepository";
import { createAnimal } from "../../db/animalRepository";
import { Beneficiary, PassOnAssessment } from "../../types/registry";
import { getSessionProfile } from "../../auth/scope";
import { t } from "../../i18n/strings";
import DateTimePicker from "@react-native-community/datetimepicker";
import * as ImagePicker from "expo-image-picker";
import { uploadToCloudinary } from "../../config/cloudinary";
import { LocationSelector } from "../../components/LocationSelector";

type Props = NativeStackScreenProps<RootStackParamList, "PassOnAssessmentForm">;

const NO_PASS_ON_REASONS = [
  { label: "Umutavu ni muto", value: "TOO_YOUNG" },
  { label: "Umutavu urarwaye", value: "SICK" },
  { label: "Inka ntirabyara", value: "NOT_GIVEN_BIRTH" },
  { label: "Inka yarapfuye", value: "DIED" },
  { label: "Indi mpamvu", value: "OTHER" },
];

export default function PassOnAssessmentFormScreen({ route, navigation }: Props) {
  const { beneficiaryId, assessmentId } = route.params;
  const [beneficiary, setBeneficiary] = useState<Beneficiary | null>(null);

  const [breed, setBreed] = useState("");
  const [sex, setSex] = useState<"F" | "M">("F");
  const [birthDate, setBirthDate] = useState(new Date().toISOString().split('T')[0]);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [earTag, setEarTag] = useState("");
  const [isWellCaredFor, setIsWellCaredFor] = useState(true);
  const [isReadyForPassOn, setIsReadyForPassOn] = useState(false);

  const [plannedPassOnDate, setPlannedPassOnDate] = useState(new Date().toISOString().split('T')[0]);
  const [showPlannedDatePicker, setShowPlannedDatePicker] = useState(false);
  const [noPassOnReason, setNoPassOnReason] = useState<string | null>(null);
  const [noPassOnReasonNotes, setNoPassOnReasonNotes] = useState("");

  const [conclusion, setConclusion] = useState("");
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(!!assessmentId);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    getBeneficiary(beneficiaryId).then(setBeneficiary);

    if (assessmentId) {
      getPassOnAssessment(assessmentId).then((data) => {
        if (data) {
          setBreed(data.breed);
          setSex(data.sex);
          setBirthDate(data.birthDate);
          setEarTag(data.earTag);
          setIsWellCaredFor(data.isWellCaredFor);
          setIsReadyForPassOn(data.isReadyForPassOn);
          if (data.plannedPassOnDate) setPlannedPassOnDate(data.plannedPassOnDate);
          setNoPassOnReason(data.noPassOnReason || null);
          setNoPassOnReasonNotes(data.noPassOnReasonNotes || "");
          setConclusion(data.conclusion || "");
          setPhotoUri(data.photoUri || null);
        }
        setLoading(false);
      });
    }
  }, [beneficiaryId, assessmentId]);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert("Ikosa", "Tugukeneye uruhushya rwa camera.");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.5,
    });
    if (!result.canceled) {
      setPhotoUri(result.assets[0].uri);
    }
  };

  const handleSave = async () => {
    if (!breed) {
      Alert.alert("Ikibazo", "Tafadhali yuzuza ubwoko bw'umutavu.");
      return;
    }

    if (!isReadyForPassOn && !noPassOnReason) {
      Alert.alert("Ikibazo", "Hitamo impamvu umuryango utaritura.");
      return;
    }

    setSubmitting(true);
    try {
      let uploadedPhotoUrl = photoUri;
      if (photoUri && !photoUri.startsWith("http")) {
        const uploadRes = await uploadToCloudinary(photoUri, "passons");
        uploadedPhotoUrl = uploadRes.secureUrl;
      }

      const normalizedEarTag = earTag.trim().toUpperCase() || "-";

      let registeredAnimalId = null;
      // Note: In edit mode, we might need more complex logic for animal registration
      // For now, only create if ready and not already assigned (simple approach)
      if (isReadyForPassOn) {
        registeredAnimalId = await createAnimal({
          earTag: normalizedEarTag,
          breed: breed.trim().toUpperCase() as any,
          sex: sex,
          color: "N/A",
          birthDate,
          origin: `PASS-ON FROM ${beneficiary?.fullName?.toUpperCase()}`,
          healthStatus: isWellCaredFor ? "GOOD" : "FAIR",
          currentStatus: "HEALTHY",
          photoUrl: uploadedPhotoUrl,
          currentOwnerId: null,
          registrationDate: new Date().toISOString(),
          district: beneficiary?.district,
          sector: beneficiary?.sector,
          cell: beneficiary?.cell,
          village: beneficiary?.village,
        });
      }

      const assessment: PassOnAssessment = {
        id: assessmentId || Math.random().toString(36).substring(7),
        beneficiaryId,
        animalId: registeredAnimalId || null,
        breed: breed.trim().toUpperCase(),
        sex,
        birthDate,
        earTag: normalizedEarTag,
        isWellCaredFor,
        isReadyForPassOn,
        plannedPassOnDate: isReadyForPassOn ? plannedPassOnDate : null,
        noPassOnReason: !isReadyForPassOn ? noPassOnReason : null,
        noPassOnReasonNotes: (!isReadyForPassOn && noPassOnReason === "OTHER") ? noPassOnReasonNotes : null,
        conclusion: conclusion.trim() || null,
        photoUri: uploadedPhotoUrl,
        reportedBy: getSessionProfile()?.fullName || "Unknown",
        createdAt: new Date().toISOString(),
        district: beneficiary?.district?.toUpperCase(),
        sector: beneficiary?.sector?.toUpperCase(),
        cell: beneficiary?.cell?.toUpperCase(),
        village: beneficiary?.village?.toUpperCase(),
      };

      await savePassOnAssessment(assessment);
      if (isReadyForPassOn && registeredAnimalId) {
        Alert.alert("Byagenze neza", "Ibarura ryabitswe. Mushobora guhita mukomeza igikorwa cyo kwitura uyu mutavu.");
        navigation.replace("PassOnForm", {
          donorId: beneficiaryId,
          animalId: registeredAnimalId
        });
      } else {
        Alert.alert("Byagenze neza", "Ibarura ry'inka yo kwiturwa ryabitswe.");
        navigation.goBack();
      }
    } catch (error) {
      console.error(error);
      Alert.alert("Ikibazo", "Haje ikibazo mu kubika amakuru.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !beneficiary) return <ActivityIndicator style={{ marginTop: 50 }} color="#1b6e3c" />;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.header}>Ibarura ry'inka yo kwiturwa</Text>

      <View style={styles.infoBox}>
        <Text style={styles.infoText}>Uwituye: {beneficiary.fullName}</Text>
        <Text style={styles.infoText}>ID: {beneficiary.nationalId}</Text>
        <Text style={styles.infoText}>Aho atuye: {beneficiary.cell}, {beneficiary.village}</Text>
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Ifoto y'inka yo kwitura</Text>
        <Pressable style={styles.photoPicker} onPress={pickImage}>
          {photoUri ? (
            <Image source={{ uri: photoUri }} style={styles.previewImage} />
          ) : (
            <Text style={styles.photoPickerText}>Kanda hano ufate ifoto</Text>
          )}
        </Pressable>
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Ubwoko (Breed)</Text>
        <TextInput style={styles.input} value={breed} onChangeText={setBreed} placeholder="Urugero: Friesian, Cross..." />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Igitsina (Sex)</Text>
        <View style={styles.radioGroup}>
          <Pressable style={[styles.radio, sex === "F" && styles.radioActive]} onPress={() => setSex("F")}>
            <Text style={sex === "F" ? styles.radioTextActive : styles.radioText}>Female</Text>
          </Pressable>
          <Pressable style={[styles.radio, sex === "M" && styles.radioActive]} onPress={() => setSex("M")}>
            <Text style={sex === "M" ? styles.radioTextActive : styles.radioText}>Male</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Itariki y'amavuko (Birth Date)</Text>
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

      <View style={styles.formGroup}>
        <Text style={styles.label}>Iherena (Ear Tag)</Text>
        <TextInput style={styles.input} value={earTag} onChangeText={setEarTag} placeholder="Nimero y'iherena" />
      </View>

      <View style={styles.switchGroup}>
        <Text style={styles.label}>Ese yafashwe neza?</Text>
        <Switch value={isWellCaredFor} onValueChange={setIsWellCaredFor} />
      </View>

      <View style={styles.switchGroup}>
        <Text style={styles.label}>Ese yiteguye kwiturwa?</Text>
        <Switch value={isReadyForPassOn} onValueChange={setIsReadyForPassOn} />
      </View>

      {isReadyForPassOn ? (
        <View style={styles.formGroup}>
          <Text style={styles.label}>Ese yakiturwa ryari? (Itariki iteganyijwe)</Text>
          <Pressable onPress={() => setShowPlannedDatePicker(true)}>
            <View pointerEvents="none">
              <TextInput style={styles.input} value={plannedPassOnDate} editable={false} placeholder="YYYY-MM-DD" />
            </View>
          </Pressable>
          {showPlannedDatePicker && (
            <DateTimePicker
              value={new Date(plannedPassOnDate)}
              mode="date"
              display="default"
              onChange={(event, selectedDate) => {
                setShowPlannedDatePicker(false);
                if (selectedDate) {
                  setPlannedPassOnDate(selectedDate.toISOString().split('T')[0]);
                }
              }}
            />
          )}
        </View>
      ) : (
        <View style={styles.formGroup}>
          <LocationSelector
            label="Impamvu umuryango utaritura"
            value={NO_PASS_ON_REASONS.find(r => r.value === noPassOnReason)?.label || ""}
            options={NO_PASS_ON_REASONS.map(r => r.label)}
            onSelect={(label) => setNoPassOnReason(NO_PASS_ON_REASONS.find(r => r.label === label)?.value || null)}
          />
          {noPassOnReason === "OTHER" && (
            <View style={{ marginTop: 10 }}>
              <Text style={styles.label}>Andika iyo mpamvu:</Text>
              <TextInput
                style={styles.input}
                value={noPassOnReasonNotes}
                onChangeText={setNoPassOnReasonNotes}
                placeholder="Sobanura indi mpamvu..."
              />
            </View>
          )}
        </View>
      )}

      <View style={styles.formGroup}>
        <Text style={styles.label}>Icyongerwahaho (Conclusion)</Text>
        <TextInput
          style={[styles.input, { height: 80 }]}
          value={conclusion}
          onChangeText={setConclusion}
          multiline
          placeholder="Andika umwanzuro..."
        />
      </View>

      <Pressable style={styles.submitBtn} onPress={handleSave} disabled={submitting}>
        <Text style={styles.submitBtnText}>{submitting ? "Irimo kubikwa..." : "Bika Ibarura"}</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20 },
  header: { fontSize: 18, fontWeight: "700", marginBottom: 15, color: "#1b6e3c" },
  infoBox: { backgroundColor: "#f0f0f0", padding: 12, borderRadius: 8, marginBottom: 20 },
  infoText: { fontSize: 14, color: "#333", marginBottom: 2 },
  formGroup: { marginBottom: 15 },
  label: { fontSize: 14, fontWeight: "600", marginBottom: 5, color: "#444" },
  input: { borderWidth: 1, borderColor: "#ccc", borderRadius: 8, padding: 10, backgroundColor: "#fff" },
  photoPicker: { height: 150, backgroundColor: "#eee", borderRadius: 8, justifyContent: "center", alignItems: "center", borderWidth: 1, borderColor: "#ccc", borderStyle: "dashed" },
  photoPickerText: { color: "#666" },
  previewImage: { width: "100%", height: "100%", borderRadius: 8 },
  radioGroup: { flexDirection: "row", gap: 10 },
  radio: { flex: 1, padding: 10, borderWidth: 1, borderColor: "#ccc", borderRadius: 8, alignItems: "center" },
  radioActive: { backgroundColor: "#1b6e3c", borderColor: "#1b6e3c" },
  radioText: { color: "#333" },
  radioTextActive: { color: "#fff", fontWeight: "600" },
  switchGroup: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 15 },
  submitBtn: { backgroundColor: "#1b6e3c", padding: 15, borderRadius: 8, alignItems: "center", marginTop: 10, marginBottom: 40 },
  submitBtnText: { color: "#fff", fontWeight: "700", fontSize: 16 },
});
