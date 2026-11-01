import * as React from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Alert,
  ScrollView,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/RootNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'DocumentUpload'>;

export default function DocumentUploadScreen({ route }: Props) {
  const beneficiaryId = route.params?.beneficiaryId ?? '';
  const [selectedFile, setSelectedFile] = React.useState<any>(null);
  const [uploading, setUploading] = React.useState(false);

  const pickDocument = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: ['application/pdf', 'image/*'],
      copyToCacheDirectory: true,
    });

    if (!result.canceled && result.assets?.[0]) {
      setSelectedFile(result.assets[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !beneficiaryId) {
      Alert.alert('Validation', 'Select a document first.');
      return;
    }

    try {
      setUploading(true);

      const cloudName = process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME ?? '';
      const uploadPreset = process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET ?? 'girinka_unsigned';

      if (!cloudName || !uploadPreset) {
        throw new Error('Cloudinary configuration missing');
      }

      const formData = new FormData();
      formData.append('file', {
        uri: selectedFile.uri,
        name: selectedFile.name || 'document.pdf',
        type: selectedFile.mimeType || 'application/pdf',
      } as any);
      formData.append('upload_preset', uploadPreset);

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`,
        {
          method: 'POST',
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error('Document upload failed');
      }

      const uploaded = await response.json();
      Alert.alert('Success', `Uploaded: ${uploaded.secure_url}`);
    } catch (error) {
      Alert.alert('Upload failed', error instanceof Error ? error.message : 'Error');
    } finally {
      setUploading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Upload document</Text>

      <Pressable style={styles.button} onPress={pickDocument}>
        <Text style={styles.buttonText}>Choose file</Text>
      </Pressable>

      {selectedFile ? (
        <View style={styles.fileCard}>
          <Text style={styles.fileName}>{selectedFile.name}</Text>
          <Text style={styles.fileType}>{selectedFile.mimeType ?? 'Document'}</Text>
        </View>
      ) : null}

      <Pressable style={styles.primaryButton} onPress={handleUpload} disabled={uploading}>
        <Text style={styles.primaryButtonText}>
          {uploading ? 'Uploading...' : 'Upload document'}
        </Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6', padding: 24 },
  title: { fontSize: 24, fontWeight: '700', color: '#111827', marginBottom: 20 },
  button: {
    backgroundColor: '#dbeafe',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 20,
  },
  buttonText: { color: '#111827', fontWeight: '700' },
  fileCard: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  fileName: { fontWeight: '700', color: '#111827', marginBottom: 4 },
  fileType: { color: '#6b7280' },
  primaryButton: {
    backgroundColor: '#2563eb',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryButtonText: { color: '#ffffff', fontWeight: '700' },
});
