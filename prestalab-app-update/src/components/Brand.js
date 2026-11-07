import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '../theme/palette';

export default function Brand({ size = 'md', style }) {
  const markSize = size === 'sm' ? 36 : 44;
  const fontSize = size === 'sm' ? 19 : 22;

  return (
    <View style={[styles.row, style]}>
      <View
        style={[
          styles.mark,
          { width: markSize, height: markSize, borderRadius: markSize * 0.3 },
        ]}
      >
        <MaterialCommunityIcons
          name="flask-outline"
          size={markSize * 0.55}
          color={COLORS.onPrimary}
        />
      </View>
      <Text style={[styles.word, { fontSize }]}>PrestaLab</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  mark: {
    backgroundColor: COLORS.primaryDark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  word: {
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
    color: COLORS.primaryDark,
    letterSpacing: -0.3,
  },
});
