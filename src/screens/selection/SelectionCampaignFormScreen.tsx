import * as React from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, Alert } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/RootNavigator';
import { createSelectionCampaign } from '../../db/selectionRepository';

type Props = NativeStackScreenProps<RootStackParamList, 'SelectionCampaignForm'>;

export default function SelectionCampaignFormScreen({ navigation }: Props) {
  const [name, setName] = React.useState('');
  const [sector, setSector] = React.useState('Cyuve');
  const [openDate, setOpenDate] = React.useState('2025-03-01');
  const [closeDate, setCloseDate] = React.useState('2025-03-12');

  const handleSave = () => {
    if (!name.trim()) {
      Alert.alert('Validation', 'Campaign name is required.');
      return;
    }

    createSelectionCampaign({
      id: `campaign-${Date.now()}`,
      name: name.trim(),
      sector,
      openDate,
      closeDate,
      status: 'Open',
      candidates: [],
    });

    Alert.alert('Success', 'Selection campaign created.');
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Campaign name</Text>
      <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="e.g. Cyuve 2025" />

      <Text style={styles.label}>Sector</Text>
      <TextInput style={styles.input} value={sector} onChangeText={setSector} />

      <Text style={styles.label}>Open date</Text>
      <TextInput style={styles.input} value={openDate} onChangeText={setOpenDate} />

      <Text style={styles.label}>Close date</Text>
      <TextInput style={styles.input} value={closeDate} onChangeText={setCloseDate} />

      <Pressable style={styles.button} onPress={handleSave}>
        <Text style={styles.buttonText}>Save campaign</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    padding: 20,
  },
  label: {
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 18,
  },
  button: {
    backgroundColor: '#2563eb',
    padding: 14,
    borderRadius: 10,
    marginTop: 8,
  },
  buttonText: {
    color: '#ffffff',
    textAlign: 'center',
    fontWeight: '700',
  },
});
