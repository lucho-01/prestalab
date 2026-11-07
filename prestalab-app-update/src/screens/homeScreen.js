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
import { subscribeToLoans, returnLoan } from '../services/firestoreService';
import Brand from '../components/Brand';
import StatsCard from '../components/StatsCard';
import PrimaryButton from '../components/PrimaryButton';
import {
  articleIconName,
  getInitials,
  formatLongDate,
  getDaysRemaining,
  formatDueDate,
} from '../components/articleIcon';
import { COLORS } from '../theme/palette';

function plural(n, word) {
  return `${n} ${word}${n === 1 ? '' : 's'}`;
}

export default function HomeScreen({ navigation }) {
  const { user } = useUser();
  const [loans, setLoans] = useState([]);
  const [activeLoans, setActiveLoans] = useState([]);
  const [pendingLoans, setPendingLoans] = useState([]);

  useEffect(() => {
    const unsubscribe = subscribeToLoans(user?.uid, (loansData) => {
      setLoans(loansData);
      setActiveLoans(loansData.filter((loan) => loan.estado === 'activo'));
      setPendingLoans(loansData.filter((loan) => loan.estado === 'pendiente'));
    });

    return () => unsubscribe();
  }, [user?.uid]);

  const stats = {
    totalLoans: loans.length,
    activeLoans: activeLoans.length,
    sanctions: loans.filter((loan) => loan.estado === 'sancionado').length,
  };

  const firstName = user?.displayName?.split(' ')[0] || 'estudiante';

  const handleReturn = (loan) => {
    Alert.alert(
      'Devolver equipo',
      `¿Confirmas la devolución de ${loan.articuloNombre || 'este préstamo'}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Devolver',
          onPress: async () => {
            try {
              await returnLoan(loan.id);
            } catch (err) {
              Alert.alert('Error', 'No se pudo registrar la devolución. Intenta de nuevo.');
            }
          },
        },
      ]
    );
  };

  const renderDueStatus = (loan) => {
    const days = getDaysRemaining(loan.fechaFin);
    if (days === null) return null;

    const overdue = days < 0;
    const iconName = overdue
      ? 'alert-outline'
      : days === 0
        ? 'calendar-clock'
        : 'calendar-check-outline';

    let text;
    if (overdue) {
      const abs = Math.abs(days);
      text = `Vencido hace ${abs} ${abs === 1 ? 'día' : 'días'}`;
    } else if (days === 0) {
      text = 'Vence hoy';
    } else {
      text = `Vence en ${days} ${days === 1 ? 'día' : 'días'}`;
    }

    return (
      <View style={[styles.dueStrip, overdue ? styles.dueStripOverdue : styles.dueStripOk]}>
        <MaterialCommunityIcons
          name={iconName}
          size={18}
          color={overdue ? COLORS.warningText : COLORS.primary}
        />
        <Text style={[styles.dueStripText, overdue && styles.dueStripTextOverdue]}>
          {text}
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerRow}>
          <Brand />
          <TouchableOpacity
            style={styles.avatar}
            onPress={() => navigation.navigate('Perfil')}
          >
            <Text style={styles.avatarText}>{getInitials(user?.displayName)}</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.date}>{formatLongDate()}</Text>
        <Text style={styles.greeting}>Hola, {firstName}</Text>
        <Text style={styles.tagline}>Tu laboratorio, un poco más cerca.</Text>

        <StatsCard
          totalLoans={stats.totalLoans}
          activeLoans={stats.activeLoans}
          sanctions={stats.sanctions}
          style={styles.stats}
        />

        {/* Banner de Solicitudes Pendientes (Comunicación proactiva de estado) */}
        {pendingLoans.length > 0 && (
          <TouchableOpacity
            style={styles.pendingBanner}
            activeOpacity={0.85}
            onPress={() => navigation.navigate('LoanHistory')}
          >
            <View style={styles.pendingLeft}>
              <View style={styles.pendingIconWrap}>
                <MaterialCommunityIcons
                  name="clock-time-four-outline"
                  size={20}
                  color="#92400E"
                />
              </View>
              <View style={styles.pendingTexts}>
                <Text style={styles.pendingTitle}>
                  {pendingLoans.length} {pendingLoans.length === 1 ? 'solicitud en revisión' : 'solicitudes en revisión'}
                </Text>
                <Text style={styles.pendingSubtitle}>
                  En evaluación por el Gestor del laboratorio
                </Text>
              </View>
            </View>
            <MaterialCommunityIcons
              name="chevron-right"
              size={22}
              color="#92400E"
            />
          </TouchableOpacity>
        )}

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Mi préstamo activo</Text>
          <Text style={styles.sectionMeta}>{plural(activeLoans.length, 'activo')}</Text>
        </View>

        {activeLoans.length === 0 ? (
          <View style={styles.emptyCard}>
            <MaterialCommunityIcons
              name="package-variant"
              size={44}
              color={COLORS.textSoft}
            />
            <Text style={styles.emptyText}>No tienes préstamos activos en este momento</Text>
          </View>
        ) : (
          activeLoans.map((loan) => (
            <View key={loan.id} style={styles.loanCard}>
              {renderDueStatus(loan)}

              {/* Notificación de Reasignación si el Gestor cambió la sala */}
              {loan.fueReasignada && (
                <View style={styles.reassignedTag}>
                  <MaterialCommunityIcons
                    name="swap-horizontal-bold"
                    size={14}
                    color="#4338CA"
                  />
                  <Text style={styles.reassignedTagText}>
                    Sala reasignada a: {loan.salaNombre}
                  </Text>
                </View>
              )}

              <View style={styles.loanRow}>
                <View style={styles.loanThumb}>
                  <MaterialCommunityIcons
                    name={articleIconName(loan.categoria || loan.articuloCategoria || 'Dispositivos')}
                    size={30}
                    color={COLORS.primary}
                  />
                </View>
                <View style={styles.loanInfo}>
                  <Text style={styles.loanName}>{loan.articuloNombre || 'Reserva de Sala'}</Text>
                  <Text style={styles.loanRoom}>
                    Ubicación: <Text style={styles.loanRoomBold}>{loan.salaNombre || 'Laboratorio'}</Text>
                  </Text>
                  <Text style={styles.loanDue}>
                    Vencimiento: {formatDueDate(loan.fechaFin)}
                  </Text>
                </View>
              </View>

              <PrimaryButton
                label="Devolver equipo"
                icon="keyboard-return"
                variant="brown"
                onPress={() => handleReturn(loan)}
                style={styles.returnButton}
              />
            </View>
          ))
        )}

        <Text style={styles.ctaTitle}>¿Listo para tu próximo proyecto?</Text>
        <PrimaryButton
          label="Solicitar préstamo"
          icon="plus"
          onPress={() => navigation.navigate('Articulos')}
          style={styles.ctaButton}
        />
        <Text style={styles.ctaHint}>
          Consulta los equipos e inventario disponible en Artículos.
        </Text>

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
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.greenSoftStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
    fontSize: 13,
    color: COLORS.primaryDark,
  },
  date: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: COLORS.textSoft,
    marginBottom: 6,
  },
  greeting: {
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
    fontSize: 34,
    color: COLORS.text,
    letterSpacing: -0.6,
    marginBottom: 6,
  },
  tagline: {
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
    color: COLORS.textMuted,
    marginBottom: 22,
  },
  stats: {
    marginBottom: 20,
  },
  pendingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FCD34D',
    borderRadius: 16,
    padding: 14,
    marginBottom: 22,
  },
  pendingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  pendingIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#FDE68A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pendingTexts: {
    flex: 1,
  },
  pendingTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#92400E',
  },
  pendingSubtitle: {
    fontSize: 11,
    color: '#B45309',
    marginTop: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: {
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
    fontSize: 20,
    color: COLORS.text,
    letterSpacing: -0.3,
  },
  sectionMeta: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: COLORS.textSoft,
  },
  emptyCard: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 18,
    alignItems: 'center',
    paddingVertical: 32,
    marginBottom: 8,
  },
  emptyText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: COLORS.textMuted,
    marginTop: 10,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  loanCard: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.warningBorder,
    borderRadius: 18,
    padding: 14,
    marginBottom: 12,
  },
  reassignedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  reassignedTagText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#4338CA',
  },
  dueStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 14,
  },
  dueStripOverdue: {
    backgroundColor: COLORS.warningBg,
  },
  dueStripOk: {
    backgroundColor: COLORS.greenSoft,
  },
  dueStripText: {
    fontFamily: 'Inter_600SemiBold',
    fontWeight: '600',
    fontSize: 14,
    color: COLORS.primary,
  },
  dueStripTextOverdue: {
    color: COLORS.warningText,
  },
  loanRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 14,
  },
  loanThumb: {
    width: 62,
    height: 62,
    borderRadius: 14,
    backgroundColor: COLORS.greenSoftStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loanInfo: {
    flex: 1,
  },
  loanName: {
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
    fontSize: 18,
    color: COLORS.text,
    marginBottom: 2,
  },
  loanRoom: {
    fontSize: 12,
    color: '#256B42',
    marginBottom: 3,
  },
  loanRoomBold: {
    fontWeight: '700',
  },
  loanDue: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: COLORS.textMuted,
  },
  returnButton: {
    width: '100%',
  },
  ctaTitle: {
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
    fontSize: 20,
    color: COLORS.text,
    letterSpacing: -0.3,
    marginTop: 26,
    marginBottom: 14,
  },
  ctaButton: {
    width: '100%',
    marginBottom: 12,
  },
  ctaHint: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: COLORS.textSoft,
    textAlign: 'center',
  },
  bottomSpacing: {
    height: 110,
  },
});
