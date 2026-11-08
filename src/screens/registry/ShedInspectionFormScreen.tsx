import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  Pressable,
  ActivityIndicator,
  TextInput,
  Switch,
  Image,
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../navigation/RootNavigator";
import { saveShedInspection } from "../../db/registryRepository";
import { ShedInspection } from "../../types/registry";
import { LocationSelector } from "../../components/LocationSelector";
import { v4 as uuidv4 } from "uuid";
import { useAuth } from "../../auth/AuthContext";
import * as ImagePicker from "expo-image-picker";
import { uploadToCloudinary } from "../../config/cloudinary";

type Props = NativeStackScreenProps<RootStackParamList, "ShedInspectionForm">;

const CONCLUSIONS = ["READY", "IMPROVEMENT_NEEDED", "NOT_READY"];

export default function ShedInspectionFormScreen({ route, navigation }: Props) {
  const { beneficiaryId, inspectionId } = route.params;
  const { profile } = useAuth();

  const [hasShed, setHasShed] = useState(false);
  const [isFirm, setIsFirm] = useState(false);
  const [isRoofed, setIsRoofed] = useState(false);
  const [hasEnoughSpace, setHasEnoughSpace] = useState(false);
  const [hasCement, setHasCement] = useState(false);
  const [photo1, setPhoto1] = useState<string | null>(null);
  const [photo2, setPhoto2] = useState<string | null>(null);
  const [conclusion, setConclusion] = useState<"READY" | "IMPROVEMENT_NEEDED" | "NOT_READY">("NOT_READY");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(!!inspectionId);
  const [saving, setSaving] = useState(false);

  React.useEffect(() => {
    if (inspectionId) {
      const { getShedInspection } = require("../../db/registryRepository");
      getShedInspection(inspectionId).then((data: ShedInspection | null) => {
        if (data) {
          setHasShed(data.hasShed);
          setIsFirm(data.isFirm);
          setIsRoofed(data.isRoofed);
          setHasEnoughSpace(data.hasEnoughSpace);
          setHasCement(data.hasCement);
          setPhoto1(data.photo1Uri || null);
          setPhoto2(data.photo2Uri || null);
          setConclusion(data.conclusion);
          setNotes(data.improvementNotes || "");
        }
        setLoading(false);
      });
    }
  }, [inspectionId]);

  const pickImage = async (setPhoto: (uri: string) => void) => {
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
    if (!photo1 || !photo2) {
      Alert.alert("Ikosa", "Ugomba gushyiraho amafoto abiri y'ikiraro.");
      return;
    }

    setSaving(true);
    try {
      // 1. Upload photos to Cloudinary (only if they are local URIs, not already URLs)
      let uri1 = photo1;
      let uri2 = photo2;

      if (photo1 && !photo1.startsWith("http")) {
        const upload1 = await uploadToCloudinary(photo1, "sheds");
        uri1 = upload1.secureUrl;
      }
      if (photo2 && !photo2.startsWith("http")) {
        const upload2 = await uploadToCloudinary(photo2, "sheds");
        uri2 = upload2.secureUrl;
      }

      const inspection: ShedInspection = {
        id: inspectionId || uuidv4(),
        beneficiaryId,
        hasShed,
        isFirm,
        isRoofed,
        hasEnoughSpace,
        hasCement,
        photo1Uri: uri1 || null,
        photo2Uri: uri2 || null,
        conclusion,
        improvementNotes: notes.trim() || null,
        reportedBy: profile?.fullName ?? "Unknown",
        createdAt: new Date().toISOString(),
        district: null,
        sector: null,
        cell: null,
        village: null,
      };

      await saveShedInspection(inspection);
      Alert.alert("Byagenze neza", inspectionId ? "Isuzumwa ryahinduwe." : "Isuzumwa ry'ikiraro ryabitswe.");
      navigation.goBack();
    } catch (e: any) {
      console.error(e);
      Alert.alert("Ikosa", e.message || "Ntibishoboye kubikwa.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <ActivityIndicator style={{ marginTop: 50 }} color="#1b6e3c" />;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Isuzumwa ry'ikiraro (Shed Inspection)</Text>

      <View style={[styles.field, styles.row]}>
        <Text style={styles.label}>Ese afite ikiraro? (Has Shed?)</Text>
        <Switch value={hasShed} onValueChange={setHasShed} />
      </View>

      <View style={[styles.field, styles.row]}>
        <Text style={styles.label}>Ese gikomeye? (Is Firm?)</Text>
        <Switch value={isFirm} onValueChange={setIsFirm} />
      </View>

      <View style={[styles.field, styles.row]}>
        <Text style={styles.label}>Ese kirasakaye? (Is Roofed?)</Text>
        <Switch value={isRoofed} onValueChange={setIsRoofed} />
      </View>

      <View style={[styles.field, styles.row]}>
        <Text style={styles.label}>Ese gifite imitambiko ihagije? (Space?)</Text>
        <Switch value={hasEnoughSpace} onValueChange={setHasEnoughSpace} />
      </View>

      <View style={[styles.field, styles.row]}>
        <Text style={styles.label}>Ese kirimo sima? (Has Cement?)</Text>
        <Switch value={hasCement} onValueChange={setHasCement} />
      </View>

      <View style={styles.photoContainer}>
        <Pressable style={styles.photoButton} onPress={() => pickImage(setPhoto1)}>
          {photo1 ? <Image source={{ uri: photo1 }} style={styles.photo} /> : <Text>Ifoto 1</Text>}
        </Pressable>
        <Pressable style={styles.photoButton} onPress={() => pickImage(setPhoto2)}>
          {photo2 ? <Image source={{ uri: photo2 }} style={styles.photo} /> : <Text>Ifoto 2</Text>}
        </Pressable>
      </View>

      <LocationSelector
        label="Umwanzuro (Conclusion)"
        value={conclusion}
        options={CONCLUSIONS}
        onSelect={(val) => setConclusion(val as any)}
      />

      <View style={styles.field}>
        <Text style={styles.label}>Icyo yanoza (Improvement Notes)</Text>
        <TextInput
          style={[styles.input, { height: 80 }]}
          value={notes}
          onChangeText={setNotes}
          multiline
        />
      </View>

      <Pressable style={styles.saveButton} onPress={onSave} disabled={saving}>
        {saving ? <ActivityIndicator color="white" /> : <Text style={styles.saveButtonText}>Bika Isuzuma</Text>}
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16 },
  title: { fontSize: 18, fontWeight: "700", marginBottom: 20, color: "#1b6e3c" },
  label: { fontSize: 13, color: "#333", marginBottom: 6, fontWeight: "600" },
  field: { marginBottom: 14 },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  input: { borderWidth: 1, borderColor: "#ccc", borderRadius: 8, padding: 10, backgroundColor: "white" },
  photoContainer: { flexDirection: "row", justifyContent: "space-between", marginBottom: 20 },
  photoButton: {
    width: "48%",
    height: 120,
    backgroundColor: "#eee",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  photo: { width: "100%", height: "100%" },
  saveButton: { backgroundColor: "#1b6e3c", borderRadius: 10, padding: 14, alignItems: "center", marginTop: 10 },
  saveButtonText: { color: "white", fontWeight: "700", fontSize: 16 },
});
