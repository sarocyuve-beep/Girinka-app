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
import { addBeneficiary } from '../../db/registryRepository';

type Props = NativeStackScreenProps<RootStackParamList, 'BeneficiaryForm'>;

export default function BeneficiaryFormScreen({ navigation }: Props) {
  const [fullName, setFullName] = React.useState('');
  const [nationalId, setNationalId] = React.useState('');
  const [sector, setSector] = React.useState('Cyuve');
  const [cell, setCell] = React.useState('');
  const [village, setVillage] = React.useState('');
  const [phone, setPhone] = React.useState('');
  const [cattleReceived, setCattleReceived] = React.useState('1');

  const handleSave = async () => {
    if (!fullName.trim() || !nationalId.trim()) {
      Alert.alert('Validation', 'Full name and national ID are required.');
      return;
    }

    try {
      await addBeneficiary({
        id: `${Date.now()}`,
        fullName: fullName.trim(),
        nationalId: nationalId.trim(),
        sector: sector.trim() || 'Cyuve',
        cell: cell.trim(),
        village: village.trim(),
        phone: phone.trim(),
        cattleReceived: Number(cattleReceived) || 0,
        distributionHistory: [],
        district: 'Musanze',
      });

      Alert.alert('Success', 'Beneficiary saved.');
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', 'Unable to save beneficiary.');
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>New beneficiary</Text>

      <Text style={styles.label}>Full name</Text>
      <TextInput style={styles.input} value={fullName} onChangeText={setFullName} />

      <Text style={styles.label}>National ID</Text>
      <TextInput
        style={styles.input}
        value={nationalId}
        onChangeText={setNationalId}
        keyboardType="numeric"
      />

      <Text style={styles.label}>Sector</Text>
      <TextInput style={styles.input} value={sector} onChangeText={setSector} />

      <Text style={styles.label}>Cell</Text>
      <TextInput style={styles.input} value={cell} onChangeText={setCell} />

      <Text style={styles.label}>Village</Text>
      <TextInput style={styles.input} value={village} onChangeText={setVillage} />

      <Text style={styles.label}>Phone</Text>
      <TextInput
        style={styles.input}
        value={phone}
        onChangeText={setPhone}
        keyboardType="phone-pad"
      />

      <Text style={styles.label}>Cattle received</Text>
      <TextInput
        style={styles.input}
        value={cattleReceived}
        onChangeText={setCattleReceived}
        keyboardType="numeric"
      />

      <Pressable style={styles.button} onPress={handleSave}>
        <Text style={styles.buttonText}>Save beneficiary</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#f3f4f6',
    padding: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 20,
  },
  label: {
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
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
    backgroundColor: '#15803d',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  buttonText: {
    color: '#ffffff',
    fontWeight: '700',
  },
});
