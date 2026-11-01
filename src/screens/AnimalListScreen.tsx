import * as React from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/RootNavigator';
import { listAnimalsByBeneficiary } from '../db/animalRepository';
import type { AnimalRecord } from '../types/animal';

type Props = NativeStackScreenProps<RootStackParamList, 'AnimalList'>;

export default function AnimalListScreen({ route }: Props) {
  const beneficiaryId = route.params?.beneficiaryId ?? '';
  const [animals, setAnimals] = React.useState<AnimalRecord[]>([]);

  React.useEffect(() => {
    if (!beneficiaryId) return;

    const load = async () => {
      try {
        const rows = await listAnimalsByBeneficiary(beneficiaryId);
        setAnimals(rows);
      } catch (error) {
        Alert.alert('Error', 'Unable to load animals');
      }
    };

    load();
  }, [beneficiaryId]);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Livestock records</Text>

      {animals.length === 0 ? (
        <Text style={styles.empty}>No animal registered for this beneficiary.</Text>
      ) : (
        animals.map((animal) => (
          <View key={animal.id} style={styles.card}>
            <Text style={styles.cardTitle}>{animal.tagNumber}</Text>
            <Text style={styles.meta}>Breed: {animal.breed}</Text>
            <Text style={styles.meta}>Birth date: {animal.birthDate}</Text>
            <Text style={styles.meta}>Status: {animal.status}</Text>
            {animal.healthNotes ? <Text style={styles.meta}>Notes: {animal.healthNotes}</Text> : null}
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: '#f3f4f6', padding: 24 },
  title: { fontSize: 24, fontWeight: '700', color: '#111827', marginBottom: 20 },
  empty: { color: '#6b7280', fontSize: 16 },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 18,
    marginBottom: 16,
  },
  cardTitle: { fontSize: 18, fontWeight: '700', color: '#111827', marginBottom: 8 },
  meta: { fontSize: 14, color: '#4b5563', marginBottom: 4 },
});
