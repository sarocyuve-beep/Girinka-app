import * as React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { beneficiaries as beneficiaryList } from '../../db/registryRepository';
import type { RootStackParamList } from '../../navigation/RootNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'BeneficiaryDetail'>;

export default function BeneficiaryDetailScreen({ route }: Props) {
  const beneficiary = beneficiaryList.find((item) => item.id === route.params.beneficiaryId);

  if (!beneficiary) {
    return (
      <View style={styles.container}>
        <Text>Beneficiary not found.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>{beneficiary.fullName}</Text>
      <Text style={styles.text}>National ID: {beneficiary.nationalId}</Text>
      <Text style={styles.text}>Location: {beneficiary.sector} / {beneficiary.cell} / {beneficiary.village}</Text>
      <Text style={styles.text}>Phone: {beneficiary.phone ?? 'Not provided'}</Text>
      <Text style={styles.text}>Cattle received: {beneficiary.cattleReceived}</Text>

      <Text style={styles.heading}>Distribution history</Text>
      {beneficiary.distributionHistory.map((entry) => (
        <View key={`${entry.year}-${entry.source}`} style={styles.historyItem}>
          <Text style={styles.historyTitle}>{entry.year} — {entry.source}</Text>
          <Text style={styles.text}>Status: {entry.status}</Text>
          <Text style={styles.text}>{entry.notes ?? 'No notes'}</Text>
        </View>
      ))}
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
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },
  text: {
    fontSize: 15,
    color: '#374151',
    marginBottom: 8,
  },
  heading: {
    marginTop: 18,
    marginBottom: 8,
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  historyItem: {
    backgroundColor: '#ffffff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    padding: 12,
    marginBottom: 10,
  },
  historyTitle: {
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
});
