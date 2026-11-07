import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { TextInput } from 'react-native-paper';
import { COLORS } from '../theme/palette';

export default function AppTextInput({ label, icon, style, ...props }) {
  return (
    <View style={[styles.field, style]}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <TextInput
        mode="outlined"
        style={styles.input}
        outlineColor={COLORS.borderInput}
        activeOutlineColor={COLORS.primary}
        outlineStyle={styles.outline}
        placeholderTextColor="#7E8A81"
        textColor={COLORS.text}
        left={icon ? <TextInput.Icon icon={icon} color="#3E4941" /> : undefined}
        {...props}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    marginBottom: 16,
  },
  label: {
    fontFamily: 'Inter_600SemiBold',
    fontWeight: '600',
    fontSize: 15,
    color: COLORS.text,
    marginBottom: 8,
    marginLeft: 4,
  },
  input: {
    backgroundColor: COLORS.surface,
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
  },
  outline: {
    borderRadius: 14,
    borderWidth: 1,
  },
});
