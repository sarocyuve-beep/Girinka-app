import React, { useState, useEffect } from "react";
import { View, Text, FlatList, Pressable, StyleSheet, Image, ActivityIndicator } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useCanWrite } from "../../auth/AuthContext";
import { RootStackParamList } from "../../navigation/RootNavigator";
import { listAnimals } from "../../db/animalRepository";
import { Animal } from "../../types/animal";
import { t } from "../../i18n/strings";

type Props = NativeStackScreenProps<RootStackParamList, "AnimalList">;

export default function AnimalListScreen({ navigation }: Props) {
  const [animals, setAnimals] = useState<Animal[]>([]);
  const [loading, setLoading] = useState(true);
  const writable = useCanWrite();

  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      loadAnimals();
    });
    return unsubscribe;
  }, [navigation]);

  async function loadAnimals() {
    try {
      setLoading(true);
      const data = await listAnimals();
      setAnimals(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  const handleEdit = (animal: Animal) => {
    navigation.navigate("AnimalForm", { animal });
  };

  return (
    <View style={styles.container}>
      {loading ? (
        <ActivityIndicator size="large" color="#1b6e3c" style={styles.loader} />
      ) : (
        <FlatList
          data={animals}
          keyExtractor={(item) => item.id || item.earTag}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <Pressable
              style={styles.card}
              onPress={() => {
                // If it's linked to a distribution, we can find the owner.
                // For now, let's navigate to a detail view if we had one,
                // or show a preview of who it belongs to.
                Alert.alert(
                  "Umwirondoro w'Inka",
                  `Ear Tag: ${item.earTag}\nUbwoko: ${item.breed}\nIbara: ${item.color}\nStatus: ${item.currentStatus}\n\nKanda kuri raporo y'itangwa (Distributions) urebe nyirayo n'aho aherereye.`
                );
              }}
            >
              {item.photoUrl ? (
                <Image source={{ uri: item.photoUrl }} style={styles.cowImage} />
              ) : (
                <View style={styles.noImagePlaceholder}>
                  <Text style={styles.noImageText}>Nta Foto</Text>
                </View>
              )}
              <View style={styles.info}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={styles.earTag}>Ear Tag: {item.earTag}</Text>
                  {writable && (
                    <Pressable onPress={() => handleEdit(item)} style={styles.editBtn}>
                      <Text style={styles.editBtnText}>Edit</Text>
                    </Pressable>
                  )}
                </View>
                <Text style={styles.breed}>Ubwoko: {item.breed}</Text>
                <Text style={styles.color}>Ibara: {item.color}</Text>
                <Text style={styles.status}>Status: {item.currentStatus}</Text>
              </View>
            </Pressable>
          )}
          ListEmptyComponent={
            <Text style={styles.emptyText}>Nta nka n'imwe irandikwa muri sisitemu.</Text>
          }
        />
      )}

      {writable && (
        <Pressable style={styles.fab} onPress={() => navigation.navigate("AnimalForm")}>
          <Text style={styles.fabText}>+</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9f9f9" },
  loader: { flex: 1, justifyContent: "center", alignItems: "center" },
  list: { padding: 16 },
  card: {
    flexDirection: "row",
    backgroundColor: "white",
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#eee",
    alignItems: "center",
  },
  cowImage: { width: 70, height: 70, borderRadius: 6, marginRight: 12 },
  noImagePlaceholder: {
    width: 70,
    height: 70,
    borderRadius: 6,
    backgroundColor: "#eee",
    marginRight: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  noImageText: { fontSize: 11, color: "#999" },
  info: { flex: 1 },
  earTag: { fontSize: 16, fontWeight: "700", color: "#333", marginBottom: 2 },
  breed: { fontSize: 14, color: "#666" },
  color: { fontSize: 14, color: "#666" },
  status: { fontSize: 12, fontWeight: "600", color: "#1b6e3c", marginTop: 4 },
  editBtn: { backgroundColor: '#f0f0f0', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  editBtnText: { fontSize: 12, color: '#005fb8', fontWeight: '700' },
  emptyText: { textAlign: "center", color: "#999", marginTop: 40, fontSize: 15 },
  fab: {
    position: "absolute",
    right: 20,
    bottom: 20,
    backgroundColor: "#1b6e3c",
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  fabText: { color: "white", fontSize: 28, fontWeight: "600", marginTop: -2 },
});
