import * as React from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, Alert, ScrollView } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/RootNavigator';
import { addCandidateToCampaign, listSelectionCampaigns } from '../../db/selectionRepository';

type Props = NativeStackScreenProps<RootStackParamList, 'CandidateForm'>;

export default function CandidateFormScreen({ navigation }: Props) {
  const campaigns = listSelectionCampaigns();
  const [selectedCampaignId, setSelectedCampaignId] = React.useState(campaigns[0]?.id ?? '');
  const [fullName, setFullName] = React.useState('');
  const [sector, setSector] = React.useState('Cyuve');
  const [village, setVillage] = React.useState('');
  const [score, setScore] = React.useState('85');
  const [eligibility, setEligibility] = React.useState({
    hasLand: true,
    hasHousehold: true,
    priorityFamily: false,
    noCattle: true,
    verified: true,
  });

  const handleToggle = (key: keyof typeof eligibility) => {
    setEligibility((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = () => {
    if (!fullName.trim() || !selectedCampaignId) {
      Alert.alert('Validation', 'Please fill in candidate name and select a campaign.');
      return;
    }

    const saved = addCandidateToCampaign(selectedCampaignId, {
      id: `candidate-${Date.now()}`,
      fullName: fullName.trim(),
      sector,
      village: village.trim() || 'Unknown',
      score: Number(score) || 0,
      status: 'Pending',
      eligibility,
    });

    if (!saved) {
      Alert.alert('Error', 'Campaign not found.');
      return;
    }

    Alert.alert('Success', 'Candidate added to campaign.');
    navigation.goBack();
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.label}>Campaign</Text>
      <View style={styles.campaignList}>
        {campaigns.map((campaign) => (
          <Pressable
            key={campaign.id}
            onPress={() => setSelectedCampaignId(campaign.id)}
            style={[styles.campaignButton, selectedCampaignId === campaign.id && styles.campaignButtonSelected]}
          >
            <Text style={[styles.campaignText, selectedCampaignId === campaign.id && styles.campaignTextSelected]}>
              {campaign.name}
            </Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.label}>Full name</Text>
      <TextInput style={styles.input} value={fullName} onChangeText={setFullName} placeholder="Candidate name" />

      <Text style={styles.label}>Sector</Text>
      <TextInput style={styles.input} value={sector} onChangeText={setSector} />

      <Text style={styles.label}>Village</Text>
      <TextInput style={styles.input} value={village} onChangeText={setVillage} placeholder="Village" />

      <Text style={styles.label}>Score</Text>
      <TextInput style={styles.input} value={score} onChangeText={setScore} keyboardType="numeric" />

      <Text style={styles.heading}>Eligibility checklist</Text>
      {Object.entries(eligibility).map(([key, value]) => (
        <Pressable key={key} onPress={() => handleToggle(key as keyof typeof eligibility)} style={styles.checkRow}>
          <Text style={styles.checkLabel}>{key.replace(/([A-Z])/g, ' $1').trim()}</Text>
          <View style={[styles.checkbox, value && styles.checkboxChecked]}>
            {value ? <Text style={styles.checkMark}>✓</Text> : null}
          </View>
        </Pressable>
      ))}

      <Pressable style={styles.button} onPress={handleSave}>
        <Text style={styles.buttonText}>Save candidate</Text>
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
  campaignList: {
    marginBottom: 16,
  },
  campaignButton: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 8,
  },
  campaignButtonSelected: {
    backgroundColor: '#14532d',
    borderColor: '#14532d',
  },
  campaignText: {
    color: '#111827',
    fontWeight: '600',
  },
  campaignTextSelected: {
    color: '#ffffff',
  },
  heading: {
    marginTop: 8,
    marginBottom: 12,
    fontWeight: '700',
    color: '#111827',
    fontSize: 16,
  },
  checkRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  checkLabel: {
    color: '#374151',
    textTransform: 'capitalize',
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#94a3b8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    borderColor: '#15803d',
    backgroundColor: '#dcfce7',
  },
  checkMark: {
    color: '#15803d',
    fontWeight: '700',
  },
  button: {
    backgroundColor: '#2563eb',
    padding: 14,
    borderRadius: 10,
    marginTop: 20,
  },
  buttonText: {
    color: '#ffffff',
    textAlign: 'center',
    fontWeight: '700',
  },
});
