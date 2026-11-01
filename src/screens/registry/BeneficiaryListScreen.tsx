import * as React from 'react';
import { View, Text, FlatList, Pressable, StyleSheet, TextInput } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { searchBeneficiaries } from '../../db/registryRepository';
import type { RootStackParamList } from '../../navigation/RootNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'BeneficiaryList'>;

export default function BeneficiaryListScreen({ navigation }: Props) {
  const [query, setQuery] = React.useState('');
  const beneficiaries = searchBeneficiaries(query);

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.search}
        placeholder="Search by name, village, or ID"
        value={query}
        onChangeText={setQuery}
      />

      <FlatList
        data={beneficiaries}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Pressable
            style={styles.card}
            onPress={() => navigation.navigate('BeneficiaryDetail', { beneficiaryId: item.id })}
          >
            <Text style={styles.name}>{item.fullName}</Text>
            <Text style={styles.meta}>{item.sector} / {item.village}</Text>
            <Text style={styles.meta}>Cattle received: {item.cattleReceived}</Text>
          </Pressable>
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
  search: {
    backgroundColor: '#ffffff',
    borderColor: '#d1d5db',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 16,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    padding: 14,
    marginBottom: 12,
  },
  name: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  meta: {
    color: '#4b5563',
    marginBottom: 2,
  },
});
