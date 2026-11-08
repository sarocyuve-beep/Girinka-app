import React, { useState } from "react";
import { View, Text, TextInput, Pressable, StyleSheet, ScrollView, Alert, ActivityIndicator } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/RootNavigator";
import { useAuth } from "../auth/AuthContext";

type Props = NativeStackScreenProps<RootStackParamList, "ChangePassword">;

export default function ChangePasswordScreen({ navigation }: Props) {
  const { changePassword } = useAuth();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSave() {
    if (!current || !next) return Alert.alert("Ikosa", "Uzuza ibisabwa byose.");
    if (next.length < 8) return Alert.alert("Ikosa", "Ijambobanga rishya rigomba kuba rifite nibura inyuguti 8.");
    if (next !== confirm) return Alert.alert("Ikosa", "Amajambobanga mashya ntabwo ahura.");
    setBusy(true);
    try {
      await changePassword(current, next);
      Alert.alert("Byagenze neza", "Ijambobanga ryahinduwe.");
      navigation.goBack();
    } catch (e: any) {
      const wrong = e?.code === "auth/invalid-credential" || e?.code === "auth/wrong-password";
      Alert.alert("Ikosa", wrong ? "Ijambobanga rya none si ryo." : "Ntibishoboye guhindurwa. Ongera ugerageze.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <Text style={styles.label}>Ijambobanga rya none</Text>
      <TextInput style={styles.input} value={current} onChangeText={setCurrent} secureTextEntry autoCapitalize="none" />
      <Text style={styles.label}>Ijambobanga rishya (nibura 8)</Text>
      <TextInput style={styles.input} value={next} onChangeText={setNext} secureTextEntry autoCapitalize="none" />
      <Text style={styles.label}>Subiramo ijambobanga rishya</Text>
      <TextInput style={styles.input} value={confirm} onChangeText={setConfirm} secureTextEntry autoCapitalize="none" />
      <Pressable style={styles.button} onPress={onSave} disabled={busy}>
        {busy ? <ActivityIndicator color="white" /> : <Text style={styles.buttonText}>Bika</Text>}
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16 },
  label: { fontSize: 13, fontWeight: "600", color: "#333", marginBottom: 6 },
  input: { borderWidth: 1, borderColor: "#ccc", borderRadius: 8, padding: 10, backgroundColor: "white", marginBottom: 14 },
  button: { backgroundColor: "#1b6e3c", borderRadius: 10, padding: 14, alignItems: "center", marginTop: 6 },
  buttonText: { color: "white", fontWeight: "700", fontSize: 16 },
});
