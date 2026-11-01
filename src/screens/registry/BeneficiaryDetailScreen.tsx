import * as React from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, Pressable } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/RootNavigator';
import { getBeneficiaryById } from '../../db/registryRepository';
import type { Beneficiary } from '../../types/registry';

type Props = NativeStackScreenProps<RootStackParamList, 'BeneficiaryDetail'>;

export default function BeneficiaryDetailScreen({ route, navigation }: Props) {
  const beneficiaryId = route.params?.beneficiaryId ?? '';
  const [beneficiary, setBeneficiary] = React.useState<Beneficiary | null>(null);

  React.useEffect(() => {
    const load = async () => {
      try {
        const data = await getBeneficiaryById(beneficiaryId);
        setBeneficiary(data);
      } catch (error) {
        Alert.alert('Error', 'Unable to load beneficiary details');
      }
    };

    if (beneficiaryId) load();
  }, [beneficiaryId]);

  if (!beneficiary) {
    return (
      <View style={styles.container}>
        <Text style={styles.empty}>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>{beneficiary.fullName}</Text>

      <Text style={styles.label}>National ID</Text>
      <Text style={styles.value}>{beneficiary.nationalId}</Text>

      <Text style={styles.label}>Location</Text>
      <Text style={styles.value}>{beneficiary.sector} / {beneficiary.cell} / {beneficiary.village}</Text>

      <Text style={styles.label}>Phone</Text>
      <Text style={styles.value}>{beneficiary.phone ?? 'N/A'}</Text>

      <Text style={styles.label}>Cattle received</Text>
      <Text style={styles.value}>{beneficiary.cattleReceived}</Text>

      <View style={styles.actionRow}>
        <Pressable
          style={styles.actionButton}
          onPress={() => navigation.navigate('AnimalList', { beneficiaryId: beneficiary.id })}
        >
          <Text style={styles.actionText}>View animals</Text>
        </Pressable>

        <Pressable
          style={styles.actionButton}
          onPress={() => navigation.navigate('AnimalForm', { beneficiaryId: beneficiary.id })}
        >
          <Text style={styles.actionText}>Add animal</Text>
        </Pressable>
      </View>

      <View style={styles.actionRow}>
        <Pressable
          style={styles.actionButton}
          onPress={() => navigation.navigate('FollowUpList', { beneficiaryId: beneficiary.id })}
        >
          <Text style={styles.actionText}>View follow-ups</Text>
        </Pressable>

        <Pressable
          style={styles.actionButton}
          onPress={() => navigation.navigate('FollowUpForm', { beneficiaryId: beneficiary.id })}
        >
          <Text style={styles.actionText}>Add follow-up</Text>
        </Pressable>
      </View>

      <Pressable
        style={styles.actionButtonPrimary}
        onPress={() => navigation.navigate('DocumentUpload', { beneficiaryId: beneficiary.id })}
      >
        <Text style={styles.actionTextPrimary}>Upload document</Text>
      </Pressable>

      <Text style={styles.label}>Distribution history</Text>
      {beneficiary.distributionHistory.length === 0 ? (
        <Text style={styles.value}>No history yet.</Text>
      ) : (
        beneficiary.distributionHistory.map((item, index) => (
          <View key={`${item.year}-${index}`} style={styles.historyCard}>
            <Text style={styles.historyTitle}>{item.year}</Text>
            <Text style={styles.historyMeta}>Source: {item.source}</Text>
            <Text style={styles.historyMeta}>Status: {item.status}</Text>
            {item.notes ? <Text style={styles.historyMeta}>Note: {item.notes}</Text> : null}
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: '#f3f4f6', padding: 24 },
  title: { fontSize: 28, fontWeight: '700', color: '#111827', marginBottom: 12 },
  label: { fontSize: 14, fontWeight: '700', color: '#4b5563', marginTop: 12 },
  value: { fontSize: 16, color: '#111827', marginTop: 4 },
  empty: { color: '#6b7280', fontSize: 16 },
  actionRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 14 },
  actionButton: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 10,
    paddingVertical: 12,
    marginHorizontal: 6,
    alignItems: 'center',
  },
  actionButtonPrimary: {
    backgroundColor: '#2563eb',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 18,
  },
  actionText: { color: '#111827', fontWeight: '700' },
  actionTextPrimary: { color: '#ffffff', fontWeight: '700' },
  historyCard: {
    backgroundColor: '#ffffff',
    borderRadius: 10,
    padding: 12,
    marginTop: 12,
  },
  historyTitle: { fontSize: 16, fontWeight: '700', color: '#111827' },
  historyMeta: { fontSize: 14, color: '#4b5563', marginTop: 4 },
});
