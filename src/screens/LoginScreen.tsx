import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
} from "react-native";
import { useAuth } from "../auth/AuthContext";
import { t } from "../i18n/strings";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { AuthStackParamList } from "../navigation/AuthNavigator";

type Props = NativeStackScreenProps<AuthStackParamList, "Login">;

function errorMessage(e: any): string {
  switch (e?.code) {
    case "auth/invalid-credential":
    case "auth/invalid-email":
    case "auth/user-not-found":
    case "auth/wrong-password":
      return t("loginInvalid");
    case "auth/network-request-failed":
      return t("loginNetwork");
    case "auth/too-many-requests":
      return t("loginTooMany");
    case "auth/user-disabled":
      return t("loginDisabled");
    default:
      return t("loginUnknown");
  }
}

export default function LoginScreen({ navigation }: Props) {
  const { signIn } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (busy) return;
    if (!username.trim() || !password) {
      setError(t("loginFillError"));
      return;
    }
    setError(null);
    setBusy(true);
    try {
      await signIn(username, password);
      // On success onAuthStateChanged swaps this screen for the app.
    } catch (e: any) {
      setError(errorMessage(e));
      setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>{t("appName")}</Text>
        <Text style={styles.subtitle}>{t("loginSubtitle")}</Text>

        <Text style={styles.label}>{t("username")}</Text>
        <TextInput
          style={styles.input}
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="username"
          textContentType="username"
          returnKeyType="next"
          editable={!busy}
        />

        <Text style={styles.label}>{t("password")}</Text>
        <View style={styles.pwRow}>
          <TextInput
            style={[styles.input, styles.pwInput]}
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPw}
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="password"
            textContentType="password"
            returnKeyType="done"
            onSubmitEditing={submit}
            editable={!busy}
          />
          <Pressable onPress={() => setShowPw((v) => !v)} style={styles.pwToggle}>
            <Text style={styles.pwToggleText}>{showPw ? t("hidePassword") : t("showPassword")}</Text>
          </Pressable>
        </View>

        {error && <Text style={styles.error}>{error}</Text>}

        <Pressable style={[styles.button, busy && styles.buttonBusy]} onPress={submit} disabled={busy}>
          {busy ? <ActivityIndicator color="white" /> : <Text style={styles.buttonText}>{t("login")}</Text>}
        </Pressable>

        <View style={styles.registerWrap}>
          <Text style={styles.registerText}>{t("noAccount")}</Text>
          <Pressable onPress={() => navigation.navigate("Register")}>
            <Text style={styles.registerLink}>{t("register")}</Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: "white" },
  container: { flexGrow: 1, justifyContent: "center", padding: 24 },
  title: { fontSize: 30, fontWeight: "700", textAlign: "center", color: "#1b6e3c" },
  subtitle: { fontSize: 13, color: "#666", textAlign: "center", marginTop: 6, marginBottom: 32 },
  label: { fontSize: 13, fontWeight: "600", marginBottom: 6, color: "#333" },
  input: {
    borderWidth: 1,
    borderColor: "#c9d1c9",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 11,
    fontSize: 16,
    marginBottom: 16,
  },
  pwRow: { flexDirection: "row", alignItems: "flex-start", gap: 8 },
  pwInput: { flex: 1 },
  pwToggle: { paddingVertical: 13, paddingHorizontal: 6 },
  pwToggleText: { color: "#1b6e3c", fontWeight: "600" },
  error: { color: "#b3261e", marginBottom: 12, fontSize: 13 },
  button: { backgroundColor: "#1b6e3c", borderRadius: 10, paddingVertical: 14, alignItems: "center" },
  buttonBusy: { opacity: 0.7 },
  buttonText: { color: "white", fontSize: 16, fontWeight: "700" },
  registerWrap: { marginTop: 24, flexDirection: "row", justifyContent: "center", gap: 6 },
  registerText: { color: "#666" },
  registerLink: { color: "#1b6e3c", fontWeight: "700" },
});
