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
import { addFollowUp } from '../db/followUpRepository';
import type { FollowUpType } from '../types/followUp';

type Props = NativeStackScreenProps<RootStackParamList, 'FollowUpForm'>;

const types: FollowUpType[] = ['Health', 'Breeding', 'Production', 'Vaccination', 'Inspection'];

export default function FollowUpFormScreen({ route, navigation }: Props) {
  const beneficiaryId = route.params?.beneficiaryId ?? '';
  const [type, setType] = React.useState<FollowUpType>('Health');
  const [date, setDate] = React.useState(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = React.useState('');
  const [status, setStatus] = React.useState<'Scheduled' | 'Completed' | 'Pending'>('Scheduled');

  const handleSave = async () => {
    if (!beneficiaryId || !notes.trim()) {
      Alert.alert('Validation', 'Beneficiary and notes are required.');
      return;
    }

    try {
      await addFollowUp({
        id: `${Date.now()}`,
        beneficiaryId,
        type,
        date,
        notes: notes.trim(),
        status,
      });

      Alert.alert('Success', 'Follow-up record saved.');
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', 'Unable to save follow-up.');
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Add follow-up</Text>

      <Text style={styles.label}>Type</Text>
      <View style={styles.typeRow}>
        {types.map((item) => (
          <Pressable
            key={item}
            style={[styles.typeButton, type === item && styles.typeButtonSelected]}
            onPress={() => setType(item)}
          >
            <Text style={[styles.typeText, type === item && styles.typeTextSelected]}>{item}</Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.label}>Date</Text>
      <TextInput style={styles.input} value={date} onChangeText={setDate} placeholder="YYYY-MM-DD" />

      <Text style={styles.label}>Status</Text>
      <View style={styles.statusRow}>
        {(['Scheduled', 'Completed', 'Pending'] as const).map((item) => (
          <Pressable
            key={item}
            style={[styles.statusButton, status === item && styles.statusButtonSelected]}
            onPress={() => setStatus(item)}
          >
            <Text style={[styles.statusText, status === item && styles.statusTextSelected]}>{item}</Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.label}>Notes</Text>
      <TextInput
        style={[styles.input, styles.multiLine]}
        value={notes}
        onChangeText={setNotes}
        multiline
      />

      <Pressable style={styles.saveButton} onPress={handleSave}>
        <Text style={styles.saveText}>Save follow-up</Text>
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
  typeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 18 },
  typeButton: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#d1d5db',
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
    marginBottom: 8,
  },
  typeButtonSelected: { backgroundColor: '#2563eb', borderColor: '#2563eb' },
  typeText: { color: '#111827', fontWeight: '600' },
  typeTextSelected: { color: '#ffffff' },
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
  statusButtonSelected: { backgroundColor: '#15803d', borderColor: '#15803d' },
  statusText: { color: '#111827', fontWeight: '600' },
  statusTextSelected: { color: '#ffffff' },
  saveButton: { backgroundColor: '#16a34a', borderRadius: 10, paddingVertical: 14, alignItems: 'center' },
  saveText: { color: '#ffffff', fontWeight: '700', fontSize: 16 },
});
