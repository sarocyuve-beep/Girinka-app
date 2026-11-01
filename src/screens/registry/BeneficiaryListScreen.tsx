import * as React from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/RootNavigator';
import { listBeneficiaries, searchBeneficiaries } from '../../db/registryRepository';
import type { Beneficiary } from '../../types/registry';

type Props = NativeStackScreenProps<RootStackParamList, 'BeneficiaryList'>;

export default function BeneficiaryListScreen({ navigation }: Props) {
  const [query, setQuery] = React.useState('');
  const [beneficiaries, setBeneficiaries] = React.useState<Beneficiary[]>([]);

  React.useEffect(() => {
    const load = async () => {
      try {
        const data = await listBeneficiaries();
        setBeneficiaries(data);
      } catch (error) {
        Alert.alert('Error', 'Unable to load beneficiaries');
      }
    };

    load();
  }, []);

  React.useEffect(() => {
    const search = async () => {
      try {
        const data = await searchBeneficiaries(query);
        setBeneficiaries(data);
      } catch (error) {
        Alert.alert('Error', 'Unable to search beneficiaries');
      }
    };

    search();
  }, [query]);

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.search}
        value={query}
        onChangeText={setQuery}
        placeholder="Search by name, sector, village or national ID"
      />

      <ScrollView contentContainerStyle={styles.list}>
        {beneficiaries.length === 0 ? (
          <Text style={styles.empty}>No beneficiaries found.</Text>
        ) : (
          beneficiaries.map((beneficiary) => (
            <Pressable
              key={beneficiary.id}
              onPress={() => navigation.navigate('BeneficiaryDetail', { beneficiaryId: beneficiary.id })}
              style={styles.card}
            >
              <Text style={styles.name}>{beneficiary.fullName}</Text>
              <Text style={styles.meta}>{beneficiary.sector} • {beneficiary.village}</Text>
              <Text style={styles.meta}>{beneficiary.nationalId}</Text>
            </Pressable>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    padding: 12,
  },
  search: {
    backgroundColor: '#ffffff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#d1d5db',
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
  },
  list: {
    paddingBottom: 20,
  },
  empty: {
    color: '#6b7280',
    fontSize: 16,
    marginTop: 20,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  name: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  meta: {
    fontSize: 14,
    color: '#4b5563',
  },
});
