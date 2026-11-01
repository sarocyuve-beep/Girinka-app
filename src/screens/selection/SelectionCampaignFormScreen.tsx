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
import type { RootStackParamList } from '../../navigation/RootNavigator';
import { createSelectionCampaign } from '../../db/selectionRepository';

type Props = NativeStackScreenProps<RootStackParamList, 'SelectionCampaignForm'>;

export default function SelectionCampaignFormScreen({ navigation }: Props) {
  const [name, setName] = React.useState('');
  const [sector, setSector] = React.useState('Cyuve');
  const [openDate, setOpenDate] = React.useState('2025-01-01');
  const [closeDate, setCloseDate] = React.useState('2025-01-30');

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Validation', 'Campaign name is required.');
      return;
    }

    try {
      await createSelectionCampaign({
        id: `${Date.now()}`,
        name: name.trim(),
        sector: sector.trim() || 'Cyuve',
        openDate,
        closeDate,
        status: 'Open',
        candidates: [],
      });

      Alert.alert('Success', 'Campaign saved.');
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', 'Unable to save campaign.');
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>New campaign</Text>

      <Text style={styles.label}>Campaign name</Text>
      <TextInput style={styles.input} value={name} onChangeText={setName} />

      <Text style={styles.label}>Sector</Text>
      <TextInput style={styles.input} value={sector} onChangeText={setSector} />

      <Text style={styles.label}>Open date</Text>
      <TextInput style={styles.input} value={openDate} onChangeText={setOpenDate} />

      <Text style={styles.label}>Close date</Text>
      <TextInput style={styles.input} value={closeDate} onChangeText={setCloseDate} />

      <Pressable style={styles.button} onPress={handleSave}>
        <Text style={styles.buttonText}>Save campaign</Text>
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
  button: {
    backgroundColor: '#2563eb',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  buttonText: {
    color: '#ffffff',
    fontWeight: '700',
  },
});
