import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useUser } from '../contexts/userContext';
import { subscribeToLoans } from '../services/firestoreService';
import { logoutUser } from '../services/authService';
import StatsCard from '../components/StatsCard';
import { getInitials } from '../components/articleIcon';
import { COLORS } from '../theme/palette';

function MenuRow({ icon, title, subtitle, onPress, divider }) {
  return (
    <TouchableOpacity
      style={[styles.menuRow, divider && styles.menuRowDivider]}
      activeOpacity={0.7}
      onPress={onPress}
    >
      <MaterialCommunityIcons name={icon} size={22} color={COLORS.primary} />
      <View style={styles.menuTexts}>
        <Text style={styles.menuTitle}>{title}</Text>
        <Text style={styles.menuSubtitle}>{subtitle}</Text>
      </View>
      <MaterialCommunityIcons
        name="chevron-right"
        size={24}
        color={COLORS.textSoft}
      />
    </TouchableOpacity>
  );
}

export default function ProfileScreen({ navigation }) {
  const { user } = useUser();
  const [stats, setStats] = useState({
    totalLoans: 0,
    activeLoans: 0,
    sanctions: 0,
  });

  useEffect(() => {
    const unsubscribe = subscribeToLoans(user?.uid, (loans) => {
      setStats({
        totalLoans: loans.length,
        activeLoans: loans.filter((loan) => loan.estado === 'activo').length,
        sanctions: loans.filter((loan) => loan.estado === 'sancionado').length,
      });
    });

    return () => unsubscribe();
  }, [user?.uid]);

  const handleSignOut = () => {
    Alert.alert('Cerrar sesión', '¿Quieres cerrar tu sesión de PrestaLab?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Cerrar sesión',
        style: 'destructive',
        onPress: async () => {
          const result = await logoutUser();
          if (!result.success) {
            Alert.alert('Error', 'No se pudo cerrar la sesión. Intenta de nuevo.');
          }
        },
      },
    ]);
  };

  const showSoon = () => {
    Alert.alert('Próximamente', 'Esta sección estará disponible muy pronto.');
  };

  const sanctionsSubtitle =
    stats.sanctions === 0
      ? 'No tienes sanciones'
      : `${stats.sanctions} ${stats.sanctions === 1 ? 'sanción activa' : 'sanciones activas'}`;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Mi perfil</Text>

        <View style={styles.identity}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{getInitials(user?.displayName)}</Text>
          </View>
          <View style={styles.identityTexts}>
            <Text style={styles.name} numberOfLines={1}>
              {user?.displayName || 'Usuario'}
            </Text>
            <Text style={styles.identitySubtitle}>Tu cuenta de PrestaLab</Text>
          </View>
        </View>

        <StatsCard
          totalLoans={stats.totalLoans}
          activeLoans={stats.activeLoans}
          sanctions={stats.sanctions}
          style={styles.stats}
        />

        <Text style={styles.sectionTitle}>Mis préstamos</Text>
        <View style={styles.menuCard}>
          <MenuRow
            icon="history"
            title="Historial de préstamos"
            subtitle="Consulta tu historial y solicitudes"
            onPress={() => navigation.navigate('LoanHistory')}
            divider
          />
          <MenuRow
            icon="shield-check-outline"
            title="Sanciones"
            subtitle={sanctionsSubtitle}
            onPress={showSoon}
          />
        </View>

        <Text style={styles.sectionTitle}>Mi cuenta</Text>
        <View style={styles.menuCard}>
          <MenuRow
            icon="account-edit-outline"
            title="Editar perfil"
            subtitle="Actualiza tus datos personales"
            onPress={showSoon}
          />
        </View>

        <TouchableOpacity
          style={styles.logoutButton}
          activeOpacity={0.8}
          onPress={handleSignOut}
        >
          <MaterialCommunityIcons name="logout" size={22} color={COLORS.primary} />
          <Text style={styles.logoutText}>Cerrar sesión</Text>
        </TouchableOpacity>

        <View style={styles.bottomSpacing} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 14,
  },
  title: {
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
    fontSize: 34,
    color: COLORS.text,
    letterSpacing: -0.6,
    marginBottom: 26,
  },
  identity: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 24,
  },
  avatar: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: COLORS.greenSoftStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
    fontSize: 24,
    color: COLORS.primaryDark,
  },
  identityTexts: {
    flex: 1,
  },
  name: {
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
    fontSize: 22,
    color: COLORS.text,
    letterSpacing: -0.3,
    marginBottom: 4,
  },
  identitySubtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
    color: COLORS.textSoft,
  },
  stats: {
    marginBottom: 28,
  },
  sectionTitle: {
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
    fontSize: 20,
    color: COLORS.text,
    letterSpacing: -0.3,
    marginBottom: 12,
  },
  menuCard: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 18,
    marginBottom: 24,
    overflow: 'hidden',
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  menuRowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  menuTexts: {
    flex: 1,
  },
  menuTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontWeight: '600',
    fontSize: 16,
    color: COLORS.text,
    marginBottom: 3,
  },
  menuSubtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: COLORS.textSoft,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    height: 56,
    borderRadius: 14,
    backgroundColor: COLORS.greenSoft,
    marginTop: 4,
  },
  logoutText: {
    fontFamily: 'Inter_600SemiBold',
    fontWeight: '600',
    fontSize: 16,
    color: COLORS.primary,
  },
  bottomSpacing: {
    height: 110,
  },
});
