import "react-native-get-random-values";
import React, { useEffect, useState, useRef } from "react";
import { View, ActivityIndicator, Text, StyleSheet, PanResponder } from "react-native";
import { StatusBar } from "expo-status-bar";
import { NavigationContainer } from "@react-navigation/native";
import RootNavigator from "./src/navigation/RootNavigator";
import AuthNavigator from "./src/navigation/AuthNavigator";
import NoAccessScreen from "./src/screens/NoAccessScreen";
import { AuthProvider, useAuth } from "./src/auth/AuthContext";
import { importCyuveBeneficiariesIfNeeded } from "./src/db/registryRepository";
import { seedCyuveWaitingListIfNeeded } from "./src/db/selectionRepository";
import { t } from "./src/i18n/strings";

const INACTIVITY_CHECK_INTERVAL = 10 * 60 * 1000; // 10 minutes

function Main({ uid }: { uid: string }) {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { signOut } = useAuth();
  const timerId = useRef<NodeJS.Timeout | null>(null);

  const resetTimer = () => {
    if (timerId.current) clearTimeout(timerId.current);
    timerId.current = setTimeout(() => {
      signOut();
    }, INACTIVITY_CHECK_INTERVAL);
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponderCapture: () => {
        resetTimer();
        return false;
      },
      onMoveShouldSetPanResponderCapture: () => {
        resetTimer();
        return false;
      },
    })
  ).current;

  useEffect(() => {
    resetTimer();
    (async () => {
      try {
        await Promise.all([
          importCyuveBeneficiariesIfNeeded(),
          seedCyuveWaitingListIfNeeded()
        ]);
      } catch (e: any) {
        setError(e?.message ?? String(e));
      } finally {
        setReady(true);
      }
    })();
    return () => {
      if (timerId.current) clearTimeout(timerId.current);
    };
  }, [uid]);

  if (!ready) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#1b6e3c" />
        <Text style={styles.loadingText}>Gutegura GirinkaApp...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }} {...panResponder.panHandlers}>
      <StatusBar style="dark" />
      {error && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>⚠ {error}</Text>
        </View>
      )}
      <RootNavigator />
    </View>
  );
}

function Gate() {
  const { user, initializing, profileStatus } = useAuth();

  if (initializing) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#1b6e3c" />
        <Text style={styles.loadingText}>{t("checkingSession")}</Text>
      </View>
    );
  }
  if (!user) {
    return (
      <>
        <StatusBar style="dark" />
        <NavigationContainer>
          <AuthNavigator />
        </NavigationContainer>
      </>
    );
  }
  if (profileStatus !== "ok") return <NoAccessScreen />;
  return <Main uid={user.uid} />;
}

export default function App() {
  return (
    <AuthProvider>
      <Gate />
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: "center", justifyContent: "center" },
  loadingText: { marginTop: 12, color: "#666" },
  errorBanner: { backgroundColor: "#fdecea", padding: 8 },
  errorText: { color: "#b3261e", fontSize: 12, textAlign: "center" },
});
