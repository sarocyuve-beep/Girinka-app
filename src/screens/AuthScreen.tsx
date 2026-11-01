import * as React from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, Alert } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { signIn } from '../services/authService';
import { saveUserProfile } from '../services/userProfileService';
import type { RootStackParamList } from '../navigation/RootNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'Auth'>;

export default function AuthScreen({ navigation }: Props) {
  const [email, setEmail] = React.useState('admin@girinka.app');
  const [password, setPassword] = React.useState('123456');
  const [district, setDistrict] = React.useState('Musanze');
  const [sector, setSector] = React.useState('Cyuve');
  const [cell, setCell] = React.useState('Ruhanga');
  const [village, setVillage] = React.useState('Kigarama');
  const [role, setRole] = React.useState<
    'DISTRICT_ADMIN' | 'SECTOR' | 'CELL' | 'VILLAGE' | 'FIELD_OFFICER' | 'VIEWER'
  >('DISTRICT_ADMIN');
  const [loading, setLoading] = React.useState(false);

  const handleLogin = async () => {
    try {
      setLoading(true);
      const result = await signIn(email.trim(), password);

      const profile = {
        uid: result.user.uid,
        email: result.user.email ?? email.trim(),
        role,
        district,
        sector: role === 'DISTRICT_ADMIN' ? undefined : sector,
        cell: role === 'CELL' || role === 'VILLAGE' ? cell : undefined,
        village: role === 'VILLAGE' ? village : undefined,
      };

      await saveUserProfile(profile);

      navigation.replace('Home', {
        userName: result.user.email?.split('@')[0] ?? 'Admin',
        role,
        district,
        sector,
        cell,
        village,
      });
    } catch (error) {
      Alert.alert('Login failed', error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>GirinkaApp</Text>

      <TextInput style={styles.input} value={email} onChangeText={setEmail} placeholder="Email" />
      <TextInput
        style={styles.input}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        placeholder="Password"
      />

      <Text style={styles.label}>Role</Text>
      <View style={styles.roleRow}>
        {['DISTRICT_ADMIN', 'SECTOR', 'CELL', 'VILLAGE', 'FIELD_OFFICER', 'VIEWER'].map((item) => (
          <Pressable
            key={item}
            onPress={() => setRole(item as any)}
            style={[styles.roleButton, role === item && styles.roleButtonSelected]}
          >
            <Text style={[styles.roleText, role === item && styles.roleTextSelected]}>{item}</Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.label}>District</Text>
      <TextInput style={styles.input} value={district} onChangeText={setDistrict} />

      {role !== 'DISTRICT_ADMIN' && (
        <>
          <Text style={styles.label}>Sector</Text>
          <TextInput style={styles.input} value={sector} onChangeText={setSector} />
        </>
      )}

      {(role === 'CELL' || role === 'VILLAGE') && (
        <>
          <Text style={styles.label}>Cell</Text>
          <TextInput style={styles.input} value={cell} onChangeText={setCell} />
        </>
      )}

      {role === 'VILLAGE' && (
        <>
          <Text style={styles.label}>Village</Text>
          <TextInput style={styles.input} value={village} onChangeText={setVillage} />
        </>
      )}

      <Pressable style={styles.button} onPress={handleLogin} disabled={loading}>
        <Text style={styles.buttonText}>{loading ? 'Signing in...' : 'Login'}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    padding: 24,
    justifyContent: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 18,
  },
  label: {
    fontWeight: '700',
    color: '#111827',
    marginTop: 12,
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#ffffff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#d1d5db',
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 10,
  },
  roleRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  roleButton: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  roleButtonSelected: {
    backgroundColor: '#14532d',
    borderColor: '#14532d',
  },
  roleText: {
    color: '#111827',
    fontWeight: '600',
  },
  roleTextSelected: {
    color: '#ffffff',
  },
  button: {
    backgroundColor: '#2563eb',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 16,
  },
  buttonText: {
    color: '#ffffff',
    fontWeight: '700',
  },
});
