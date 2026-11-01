import * as React from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/RootNavigator';
import { listSelectionCampaigns } from '../../db/selectionRepository';
import type { SelectionCampaign } from '../../types/selection';

type Props = NativeStackScreenProps<RootStackParamList, 'SelectionCampaignList'>;

export default function SelectionCampaignListScreen({}: Props) {
  const [campaigns, setCampaigns] = React.useState<SelectionCampaign[]>([]);

  React.useEffect(() => {
    const load = async () => {
      try {
        const data = await listSelectionCampaigns();
        setCampaigns(data);
      } catch (error) {
        Alert.alert('Error', 'Unable to load campaigns');
      }
    };

    load();
  }, []);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Selection campaigns</Text>

      {campaigns.length === 0 ? (
        <Text style={styles.empty}>No campaigns yet.</Text>
      ) : (
        campaigns.map((campaign) => (
          <View key={campaign.id} style={styles.card}>
            <Text style={styles.cardTitle}>{campaign.name}</Text>
            <Text style={styles.meta}>Sector: {campaign.sector}</Text>
            <Text style={styles.meta}>Open: {campaign.openDate}</Text>
            <Text style={styles.meta}>Close: {campaign.closeDate}</Text>
            <Text style={styles.meta}>Status: {campaign.status}</Text>
          </View>
        ))
      )}
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
  empty: {
    color: '#6b7280',
    fontSize: 16,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 18,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  meta: {
    fontSize: 14,
    color: '#4b5563',
    marginBottom: 4,
  },
});
