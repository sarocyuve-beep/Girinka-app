import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Modal, ScrollView, Switch, TextInput, Pressable, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ReportMemoOptions } from '../utils/reportGenerator';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';

const STORAGE_KEY = '@report_memo_metadata';

interface Props {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
  options: ReportMemoOptions;
  setOptions: React.Dispatch<React.SetStateAction<ReportMemoOptions>>;
}

export const MemoConfigModal = ({ visible, onClose, onConfirm, options, setOptions }: Props) => {
  const [showDatePicker, setShowDatePicker] = useState(false);

  useEffect(() => {
    const loadStoredMetadata = async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored) {
          const metadata = JSON.parse(stored);
          setOptions(prev => ({
            ...prev,
            memoNo: metadata.memoNo || prev.memoNo,
            ref: metadata.ref || prev.ref,
            authorName: metadata.authorName || prev.authorName,
            authorTitle: metadata.authorTitle || prev.authorTitle,
            from: metadata.from || prev.from,
            to: metadata.to || prev.to,
          }));
        }
      } catch (e) {
        console.error('Failed to load memo metadata', e);
      }
    };
    if (visible) {
      loadStoredMetadata();
    }
  }, [visible]);

  const handleConfirm = async () => {
    try {
      const metadata = {
        memoNo: options.memoNo,
        ref: options.ref,
        authorName: options.authorName,
        authorTitle: options.authorTitle,
        from: options.from,
        to: options.to,
      };
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(metadata));
    } catch (e) {
      console.error('Failed to save memo metadata', e);
    }
    onConfirm();
  };

  const onDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      const formatted = selectedDate.toLocaleDateString('fr-FR');
      setOptions(prev => ({ ...prev, date: formatted }));
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Hitamo uko PDF isohoka</Text>
            <Pressable onPress={onClose}>
              <Ionicons name="close" size={24} color="#333" />
            </Pressable>
          </View>

          <ScrollView style={{ maxHeight: 450 }}>
            <View style={styles.memoSwitchRow}>
              <Text style={styles.memoLabel}>Shyiraho Ibaruwa (MEMO)</Text>
              <Switch
                value={options.enabled}
                onValueChange={(val) => setOptions(prev => ({...prev, enabled: val}))}
                trackColor={{ false: "#767577", true: "#1b6e3c" }}
              />
            </View>

            {options.enabled && (
              <View style={styles.memoFields}>
                <Text style={styles.fieldLabel}>Nomero ya Memo (Memo No):</Text>
                <TextInput
                  style={styles.modalInput}
                  value={options.memoNo}
                  onChangeText={(val) => setOptions(prev => ({...prev, memoNo: val}))}
                  placeholder="Hagaragaramo: MEMO INTERNE No ..."
                />

                <Text style={styles.fieldLabel}>Nomero ya Referansi (Ref):</Text>
                <TextInput
                  style={styles.modalInput}
                  value={options.ref}
                  onChangeText={(val) => setOptions(prev => ({...prev, ref: val}))}
                />

                <Text style={styles.fieldLabel}>Kuva kuri:</Text>
                <TextInput
                  style={styles.modalInput}
                  multiline
                  value={options.from}
                  onChangeText={(val) => setOptions(prev => ({...prev, from: val}))}
                />

                <Text style={styles.fieldLabel}>Kujya kuri:</Text>
                <TextInput
                  style={styles.modalInput}
                  multiline
                  value={options.to}
                  onChangeText={(val) => setOptions(prev => ({...prev, to: val}))}
                />

                <Text style={styles.fieldLabel}>Itariki (Date):</Text>
                <Pressable onPress={() => setShowDatePicker(true)} style={styles.datePickerBtn}>
                  <Text style={{ fontSize: 13, color: options.date ? '#000' : '#999' }}>
                    {options.date || 'Hitamo itariki...'}
                  </Text>
                  <Ionicons name="calendar-outline" size={18} color="#1b6e3c" />
                </Pressable>

                {showDatePicker && (
                  <DateTimePicker
                    value={new Date()}
                    mode="date"
                    display="default"
                    onChange={onDateChange}
                  />
                )}

                <Text style={styles.fieldLabel}>Impamvu (Subject):</Text>
                <TextInput
                  style={styles.modalInput}
                  multiline
                  value={options.subject}
                  onChangeText={(val) => setOptions(prev => ({...prev, subject: val}))}
                />

                <Text style={styles.fieldLabel}>Amagambo agize Memo (Body Content):</Text>
                <TextInput
                  style={[styles.modalInput, { height: 120, textAlignVertical: 'top' }]}
                  multiline
                  value={options.content}
                  onChangeText={(val) => setOptions(prev => ({...prev, content: val}))}
                />

                <Text style={styles.fieldLabel}>Amazina y'uwanditse:</Text>
                <TextInput
                  style={styles.modalInput}
                  value={options.authorName}
                  onChangeText={(val) => setOptions(prev => ({...prev, authorName: val}))}
                />

                <Text style={styles.fieldLabel}>Icyivugo/Umwanya (Title):</Text>
                <TextInput
                  style={styles.modalInput}
                  value={options.authorTitle}
                  onChangeText={(val) => setOptions(prev => ({...prev, authorTitle: val}))}
                />
              </View>
            )}
          </ScrollView>

          <Pressable style={styles.confirmBtn} onPress={handleConfirm}>
            <Text style={styles.confirmBtnText}>EMEZA UKORE PDF</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: 'white', borderRadius: 15, padding: 20, elevation: 5 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  modalTitle: { fontSize: 16, fontWeight: '700', color: '#1b6e3c' },
  memoSwitchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#eee' },
  memoLabel: { fontSize: 14, fontWeight: '600' },
  memoFields: { marginTop: 15 },
  fieldLabel: { fontSize: 12, color: '#666', marginBottom: 4, marginTop: 10 },
  modalInput: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 10, fontSize: 13, backgroundColor: '#fafafa' },
  datePickerBtn: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 10,
    backgroundColor: '#fafafa'
  },
  confirmBtn: { backgroundColor: '#1b6e3c', padding: 15, borderRadius: 10, alignItems: 'center', marginTop: 20 },
  confirmBtnText: { color: 'white', fontWeight: '800', fontSize: 14 },
});
