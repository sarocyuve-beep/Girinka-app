import * as React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/RootNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

const quickActions = [
  { title: 'Selection campaigns', route: 'SelectionCampaignList' as const, description: 'Create and review candidate campaigns' },
  { title: 'Beneficiary registry', route: 'BeneficiaryList' as const, description: 'Search and view beneficiary profiles' },
  { title: 'New campaign', route: 'SelectionCampaignForm' as const, description: 'Create a selection form and checklist' },
];

export default function HomeScreen({ navigation }: Props) {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>GirinkaApp</Text>
      <Text style={styles.subtitle}>Digital registry for selection, beneficiary tracking, and cattle distribution.</Text>

      {quickActions.map((action) => (
        <Pressable
          key={action.title}
          onPress={() => navigation.navigate(action.route)}
          style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
        >
          <Text style={styles.cardTitle}>{action.title}</Text>
          <Text style={styles.cardText}>{action.description}</Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 24,
    backgroundColor: '#f3f4f6',
  },
  title: {
    fontSize: 30,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#4b5563',
    lineHeight: 24,
    marginBottom: 24,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 18,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
  cardPressed: {
    opacity: 0.9,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 6,
  },
  cardText: {
    fontSize: 14,
    color: '#6b7280',
  },
});
