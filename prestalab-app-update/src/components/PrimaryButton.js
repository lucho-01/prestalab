import React from 'react';
import { Text, ActivityIndicator, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '../theme/palette';

const VARIANTS = {
  solid: { bg: COLORS.primary, fg: COLORS.onPrimary, border: 'transparent' },
  brown: { bg: COLORS.warningText, fg: COLORS.onPrimary, border: 'transparent' },
  soft: { bg: COLORS.greenSoft, fg: COLORS.primary, border: 'transparent' },
  outline: { bg: COLORS.surface, fg: COLORS.primary, border: COLORS.borderInput },
};

export default function PrimaryButton({
  label,
  icon,
  onPress,
  variant = 'solid',
  size = 'md',
  loading = false,
  disabled = false,
  style,
}) {
  const v = VARIANTS[variant] || VARIANTS.solid;
  const isDisabled = disabled || loading;
  const height = size === 'sm' ? 48 : 56;
  const fontSize = size === 'sm' ? 15 : 16;
  const iconSize = size === 'sm' ? 18 : 20;

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      disabled={isDisabled}
      style={[
        styles.base,
        {
          height,
          backgroundColor: v.bg,
          borderColor: v.border,
          opacity: isDisabled ? 0.55 : 1,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={v.fg} />
      ) : (
        <>
          {icon ? (
            <MaterialCommunityIcons name={icon} size={iconSize} color={v.fg} />
          ) : null}
          <Text style={[styles.label, { color: v.fg, fontSize }]}>{label}</Text>
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 20,
  },
  label: {
    fontFamily: 'Inter_600SemiBold',
    fontWeight: '600',
    letterSpacing: 0,
    textAlign: 'center',
  },
});
