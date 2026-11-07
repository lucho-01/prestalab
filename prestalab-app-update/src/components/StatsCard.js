import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../theme/palette';

function Stat({ value, label }) {
  return (
    <View style={styles.item}>
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

export default function StatsCard({ totalLoans = 0, activeLoans = 0, sanctions = 0, style }) {
  return (
    <View style={[styles.card, style]}>
      <Stat value={totalLoans} label="Préstamos" />
      <Stat value={activeLoans} label="Activos" />
      <Stat value={sanctions} label="Sanciones" />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 18,
    paddingVertical: 18,
    paddingHorizontal: 8,
  },
  item: {
    alignItems: 'center',
    flex: 1,
  },
  value: {
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
    fontSize: 26,
    color: COLORS.primary,
    marginBottom: 4,
  },
  label: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: COLORS.textSoft,
  },
});
