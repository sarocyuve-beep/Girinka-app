import * as React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function ReportsScreen() {
  const stats = {
    campaigns: 8,
    beneficiaries: 814,
    animals: 1200,
    healthyAnimals: 910,
    pendingFollowUps: 32,
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Reports dashboard</Text>

      <View style={styles.grid}>
        <View style={styles.card}>
          <Text style={styles.label}>Campaigns</Text>
          <Text style={styles.value}>{stats.campaigns}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Beneficiaries</Text>
          <Text style={styles.value}>{stats.beneficiaries}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Animals</Text>
          <Text style={styles.value}>{stats.animals}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Healthy</Text>
          <Text style={styles.value}>{stats.healthyAnimals}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Pending follow-ups</Text>
          <Text style={styles.value}>{stats.pendingFollowUps}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, backgroundColor: '#f3f4f6' },
  title: { fontSize: 24, fontWeight: '700', color: '#111827', marginBottom: 20 },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  card: {
    width: '48%',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 18,
    marginBottom: 16,
  },
  label: { fontSize: 14, color: '#6b7280' },
  value: { fontSize: 30, fontWeight: '700', color: '#111827', marginTop: 8 },
});
