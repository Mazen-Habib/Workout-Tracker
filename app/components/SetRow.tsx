import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

interface SetRowProps {
  setNumber: number;
  reps: number;
  weight: number;
  onRepsChange: (value: number) => void;
  onWeightChange: (value: number) => void;
  onDelete: () => void;
  onCopy: () => void;
  showDelete: boolean;
}

export default function SetRow({
  setNumber,
  reps,
  weight,
  onRepsChange,
  onWeightChange,
  onDelete,
  onCopy,
  showDelete,
}: SetRowProps) {
  const handleRepsChange = (text: string) => {
    const numValue = text === '' ? 0 : parseInt(text, 10);
    if (!isNaN(numValue)) {
      onRepsChange(numValue);
    }
  };

  const handleWeightChange = (text: string) => {
    const numValue = text === '' ? 0 : parseFloat(text);
    if (!isNaN(numValue)) {
      onWeightChange(numValue);
    }
  };

  return (
    <View style={styles.container}>
      {/* Set Number Label */}
      <Text style={styles.setLabel}>Set {setNumber}</Text>

      {/* Reps Input */}
      <TextInput
        style={styles.input}
        placeholder="10"
        placeholderTextColor="#6b7280"
        keyboardType="number-pad"
        value={reps === 0 ? '' : reps.toString()}
        onChangeText={handleRepsChange}
      />

      {/* Weight Input */}
      <TextInput
        style={styles.input}
        placeholder="135"
        placeholderTextColor="#6b7280"
        keyboardType="decimal-pad"
        value={weight === 0 ? '' : weight.toString()}
        onChangeText={handleWeightChange}
      />

      {/* Copy Button */}
      <TouchableOpacity
        style={styles.copyButton}
        onPress={onCopy}
        activeOpacity={0.7}
      >
        <Ionicons name="copy" size={20} color="#3b82f6" />
      </TouchableOpacity>

      {/* Delete Button - Only show if showDelete is true */}
      {showDelete && (
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={onDelete}
          activeOpacity={0.7}
        >
          <Ionicons name="trash" size={20} color="#ef4444" />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 56,
    backgroundColor: '#262626',
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    gap: 8,
    marginBottom: 12,
  },
  setLabel: {
    width: 60,
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
  input: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    borderColor: '#3b82f6',
    borderWidth: 1,
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 10,
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '500',
  },
  copyButton: {
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteButton: {
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
});