import * as React from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/RootNavigator';
import { listFollowUpsByBeneficiary } from '../db/followUpRepository';
import type { FollowUpRecord } from '../types/followUp';

type Props = NativeStackScreenProps<RootStackParamList, 'FollowUpList'>;

export default function FollowUpListScreen({ route }: Props) {
  const beneficiaryId = route.params?.beneficiaryId ?? '';
  const [items, setItems] = React.useState<FollowUpRecord[]>([]);

  React.useEffect(() => {
    if (!beneficiaryId) return;

    const load = async () => {
      try {
        const rows = await listFollowUpsByBeneficiary(beneficiaryId);
        setItems(rows);
      } catch (error) {
        Alert.alert('Error', 'Unable to load follow-ups');
      }
    };

    load();
  }, [beneficiaryId]);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Follow-up records</Text>

      {items.length === 0 ? (
        <Text style={styles.empty}>No follow-up history found.</Text>
      ) : (
        items.map((item) => (
          <View key={item.id} style={styles.card}>
            <Text style={styles.cardTitle}>{item.type}</Text>
            <Text style={styles.meta}>Date: {item.date}</Text>
            <Text style={styles.meta}>Status: {item.status}</Text>
            <Text style={styles.meta}>Notes: {item.notes}</Text>
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
