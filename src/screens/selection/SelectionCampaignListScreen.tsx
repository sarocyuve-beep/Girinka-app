import * as React from 'react';
import { View, Text, FlatList, Pressable, StyleSheet } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { listSelectionCampaigns } from '../../db/selectionRepository';
import type { RootStackParamList } from '../../navigation/RootNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'SelectionCampaignList'>;

export default function SelectionCampaignListScreen({ navigation }: Props) {
  const campaigns = listSelectionCampaigns();

  return (
    <View style={styles.container}>
      <Pressable style={styles.newButton} onPress={() => navigation.navigate('SelectionCampaignForm')}>
        <Text style={styles.newButtonText}>+ New campaign</Text>
      </Pressable>

      <FlatList
        data={campaigns}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.name}>{item.name}</Text>
            <Text style={styles.text}>Sector: {item.sector}</Text>
            <Text style={styles.text}>Status: {item.status}</Text>
            <Text style={styles.text}>Window: {item.openDate} → {item.closeDate}</Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    padding: 16,
  },
  newButton: {
    backgroundColor: '#15803d',
    padding: 14,
    borderRadius: 10,
    marginBottom: 16,
  },
  newButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  name: {
    fontWeight: '700',
    fontSize: 18,
    marginBottom: 8,
    color: '#111827',
  },
  text: {
    color: '#374151',
    marginBottom: 4,
  },
});
