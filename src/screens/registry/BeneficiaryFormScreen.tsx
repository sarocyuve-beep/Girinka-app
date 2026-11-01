import * as React from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, Alert, ScrollView } from 'react-native';
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
  const [cattleReceived, setCattleReceived] = React.useState('0');

  const handleSave = () => {
    if (!fullName.trim() || !nationalId.trim()) {
      Alert.alert('Validation', 'Full name and National ID are required.');
      return;
    }

    addBeneficiary({
      id: `b-${Date.now()}`,
      fullName: fullName.trim(),
      nationalId: nationalId.trim(),
      sector: sector.trim() || 'Cyuve',
      cell: cell.trim() || 'Unknown',
      village: village.trim() || 'Unknown',
      phone: phone.trim() || undefined,
      cattleReceived: Number(cattleReceived) || 0,
      distributionHistory: [
        {
          year: new Date().getFullYear(),
          source: 'Manual registration',
          status: 'Pending',
          notes: 'Created through the mobile app',
        },
      ],
    });

    Alert.alert('Success', 'Beneficiary saved successfully.');
    navigation.goBack();
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.label}>Full name</Text>
      <TextInput style={styles.input} value={fullName} onChangeText={setFullName} placeholder="John Doe" />

      <Text style={styles.label}>National ID</Text>
      <TextInput style={styles.input} value={nationalId} onChangeText={setNationalId} placeholder="1198..." />

      <Text style={styles.label}>Sector</Text>
      <TextInput style={styles.input} value={sector} onChangeText={setSector} />

      <Text style={styles.label}>Cell</Text>
      <TextInput style={styles.input} value={cell} onChangeText={setCell} placeholder="Ruhanga" />

      <Text style={styles.label}>Village</Text>
      <TextInput style={styles.input} value={village} onChangeText={setVillage} placeholder="Kigarama" />

      <Text style={styles.label}>Phone</Text>
      <TextInput style={styles.input} value={phone} onChangeText={setPhone} placeholder="+2507..." keyboardType="phone-pad" />

      <Text style={styles.label}>Cattle received</Text>
      <TextInput style={styles.input} value={cattleReceived} onChangeText={setCattleReceived} keyboardType="numeric" />

      <Pressable style={styles.button} onPress={handleSave}>
        <Text style={styles.buttonText}>Save beneficiary</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  content: {
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
    backgroundColor: '#15803d',
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
