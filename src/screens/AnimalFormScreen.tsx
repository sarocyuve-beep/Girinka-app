import * as React from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  Alert,
  ScrollView,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/RootNavigator';
import { addAnimalRecord } from '../db/animalRepository';
import type { AnimalStatus } from '../types/animal';

type Props = NativeStackScreenProps<RootStackParamList, 'AnimalForm'>;

const statuses: AnimalStatus[] = ['Healthy', 'Sick', 'Pregnant', 'InRecovery', 'Transferred'];

export default function AnimalFormScreen({ route, navigation }: Props) {
  const beneficiaryId = route.params?.beneficiaryId ?? '';
  const [tagNumber, setTagNumber] = React.useState('');
  const [breed, setBreed] = React.useState('');
  const [birthDate, setBirthDate] = React.useState('');
  const [status, setStatus] = React.useState<AnimalStatus>('Healthy');
  const [healthNotes, setHealthNotes] = React.useState('');

  const handleSave = async () => {
    if (!beneficiaryId || !tagNumber.trim() || !breed.trim()) {
      Alert.alert('Validation', 'Beneficiary, tag number, and breed are required.');
      return;
    }

    try {
      await addAnimalRecord({
        id: `${Date.now()}`,
        beneficiaryId,
        tagNumber: tagNumber.trim(),
        breed: breed.trim(),
        birthDate: birthDate || '2025-01-01',
        status,
        healthNotes: healthNotes.trim(),
        createdAt: new Date().toISOString(),
      });

      Alert.alert('Success', 'Animal record saved.');
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', 'Unable to save animal record.');
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Register animal</Text>

      <Text style={styles.label}>Tag number</Text>
      <TextInput style={styles.input} value={tagNumber} onChangeText={setTagNumber} />

      <Text style={styles.label}>Breed</Text>
      <TextInput style={styles.input} value={breed} onChangeText={setBreed} />

      <Text style={styles.label}>Birth date</Text>
      <TextInput style={styles.input} value={birthDate} onChangeText={setBirthDate} placeholder="YYYY-MM-DD" />

      <Text style={styles.label}>Status</Text>
      <View style={styles.statusRow}>
        {statuses.map((item) => (
          <Pressable
            key={item}
            style={[styles.statusButton, status === item && styles.statusButtonSelected]}
            onPress={() => setStatus(item)}
          >
            <Text style={[styles.statusText, status === item && styles.statusTextSelected]}>{item}</Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.label}>Health notes</Text>
      <TextInput
        style={[styles.input, styles.multiLine]}
        value={healthNotes}
        onChangeText={setHealthNotes}
        multiline
      />

      <Pressable style={styles.saveButton} onPress={handleSave}>
        <Text style={styles.saveText}>Save animal</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: '#f3f4f6', padding: 24 },
  title: { fontSize: 24, fontWeight: '700', color: '#111827', marginBottom: 20 },
  label: { fontWeight: '700', color: '#111827', marginBottom: 8 },
  input: {
    backgroundColor: '#ffffff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#d1d5db',
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 18,
  },
  multiLine: { height: 100, textAlignVertical: 'top' },
  statusRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 18 },
  statusButton: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#d1d5db',
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
    marginBottom: 8,
  },
  statusButtonSelected: { backgroundColor: '#14532d', borderColor: '#14532d' },
  statusText: { color: '#111827', fontWeight: '600' },
  statusTextSelected: { color: '#ffffff' },
  saveButton: { backgroundColor: '#15803d', borderRadius: 10, paddingVertical: 14, alignItems: 'center' },
  saveText: { color: '#ffffff', fontWeight: '700', fontSize: 16 },
});
