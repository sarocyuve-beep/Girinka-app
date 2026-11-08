import React from "react";
import { View, Text, Pressable, StyleSheet, ActivityIndicator } from "react-native";
import { useAuth } from "../auth/AuthContext";

export default function NoAccessScreen() {
  const { profileStatus, user, reloadProfile, signOut } = useAuth();

  if (profileStatus === "loading") {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#1b6e3c" />
      </View>
    );
  }

  const messages: Record<string, { title: string; body: string }> = {
    missing: {
      title: "Nta burenganzira uragira",
      body: "Konti yawe yabonetse ariko ntiraherwa uburenganzira muri GirinkaApp. Saba umuyobozi wawe kuyikorera profile.",
    },
    inactive: {
      title: "Konti iracyategereje kwemezwa",
      body: "Konti yawe yashyizeho ariko ntiremezwa n'umuyobozi. Tegereza gato cyangwa uvugane n'ushinzwe Girinka ku rwego rw'Akarere cyangwa Umurenge.",
    },
    error: {
      title: "Ntibishobotse gusoma profile",
      body: "Reba internet maze wongere ugerageze. Niba bikomeje, birashoboka ko Firestore rules zitarashyirwaho neza.",
    },
  };
  const m = messages[profileStatus] ?? messages.error;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{m.title}</Text>
      <Text style={styles.body}>{m.body}</Text>
      {user?.email && <Text style={styles.email}>{user.email}</Text>}
      <Pressable style={styles.button} onPress={() => reloadProfile()}>
        <Text style={styles.buttonText}>Ongera ugerageze</Text>
      </Pressable>
      <Pressable style={[styles.button, styles.outline]} onPress={() => signOut()}>
        <Text style={[styles.buttonText, { color: "#1b6e3c" }]}>Sohoka</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", padding: 24, backgroundColor: "white" },
  title: { fontSize: 20, fontWeight: "700", textAlign: "center", color: "#b3261e", marginBottom: 12 },
  body: { fontSize: 14, textAlign: "center", color: "#444", marginBottom: 12 },
  email: { fontSize: 12, textAlign: "center", color: "#888", marginBottom: 24 },
  button: { backgroundColor: "#1b6e3c", borderRadius: 10, paddingVertical: 13, alignItems: "center", marginTop: 10 },
  outline: { backgroundColor: "white", borderWidth: 1, borderColor: "#1b6e3c" },
  buttonText: { color: "white", fontWeight: "700", fontSize: 15 },
});
