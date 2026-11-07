import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useUser } from '../contexts/userContext';
import { subscribeToLoans } from '../services/firestoreService';
import { articleIconName, formatLongDate } from '../components/articleIcon';
import { COLORS } from '../theme/palette';

const FILTERS = ['Todos', 'Pendientes', 'Activos', 'Devueltos', 'Rechazados'];

export default function LoanHistoryScreen({ navigation }) {
  const { user } = useUser();
  const [loans, setLoans] = useState([]);
  const [filteredLoans, setFilteredLoans] = useState([]);
  const [selectedFilter, setSelectedFilter] = useState('Todos');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (!user?.uid) return;

    const unsubscribe = subscribeToLoans(user.uid, (data) => {
      setLoans(data);
    });

    return () => unsubscribe();
  }, [user?.uid]);

  useEffect(() => {
    let result = loans;

    if (selectedFilter === 'Pendientes') {
      result = loans.filter((l) => l.estado === 'pendiente');
    } else if (selectedFilter === 'Activos') {
      result = loans.filter((l) => l.estado === 'activo');
    } else if (selectedFilter === 'Devueltos') {
      result = loans.filter((l) => l.estado === 'devuelto');
    } else if (selectedFilter === 'Rechazados') {
      result = loans.filter((l) => l.estado === 'rechazado');
    }

    setFilteredLoans(result);
  }, [selectedFilter, loans]);

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 800);
  };

  const getStatusStyle = (estado) => {
    switch (estado) {
      case 'pendiente':
        return {
          bg: '#FEF3C7',
          text: '#92400E',
          icon: 'clock-outline',
          label: 'En Revisión',
        };
      case 'activo':
        return {
          bg: '#D1FAE5',
          text: '#065F46',
          icon: 'check-circle-outline',
          label: 'Préstamo Activo',
        };
      case 'devuelto':
        return {
          bg: '#DBEAFE',
          text: '#1E40AF',
          icon: 'keyboard-return',
          label: 'Devuelto',
        };
      case 'rechazado':
        return {
          bg: '#FEE2E2',
          text: '#991B1B',
          icon: 'close-circle-outline',
          label: 'Rechazado',
        };
      default:
        return {
          bg: '#F3F4F6',
          text: '#4B5563',
          icon: 'help-circle-outline',
          label: estado || 'Desconocido',
        };
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <MaterialCommunityIcons name="arrow-left" size={24} color="#181C1A" />
        </TouchableOpacity>
        <View style={styles.headerTitleWrap}>
          <Text style={styles.headerTitle}>Historial de Préstamos</Text>
          <Text style={styles.headerSubtitle}>Trazabilidad de tus solicitudes académicas</Text>
        </View>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterWrap}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScroll}
        >
          {FILTERS.map((f) => {
            const isSelected = selectedFilter === f;
            return (
              <TouchableOpacity
                key={f}
                onPress={() => setSelectedFilter(f)}
                style={[styles.filterChip, isSelected && styles.filterChipActive]}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    isSelected && styles.filterChipTextActive,
                  ]}
                >
                  {f}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* List of Interactions */}
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {filteredLoans.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons
              name="history"
              size={54}
              color="#CBD5E1"
            />
            <Text style={styles.emptyTitle}>Sin registros encontrados</Text>
            <Text style={styles.emptySubtitle}>
              {selectedFilter === 'Todos'
                ? 'No tienes solicitudes de préstamo registradas en tu historial.'
                : `No tienes préstamos con estado "${selectedFilter.toLowerCase()}".`}
            </Text>
          </View>
        ) : (
          filteredLoans.map((loan) => {
            const status = getStatusStyle(loan.estado);
            return (
              <View key={loan.id} style={styles.loanCard}>
                {/* Card Top */}
                <View style={styles.cardHeader}>
                  <View style={styles.resourceHeader}>
                    <View style={styles.iconThumb}>
                      <MaterialCommunityIcons
                        name={articleIconName(loan.articuloNombre ? 'Dispositivos' : 'Redes')}
                        size={22}
                        color={COLORS.primary}
                      />
                    </View>
                    <View style={styles.resourceTexts}>
                      <Text style={styles.resourceName} numberOfLines={1}>
                        {loan.articuloNombre || 'Reserva de Espacio'}
                      </Text>
                      <Text style={styles.loanType}>
                        {loan.tipo === 'externo' ? 'Préstamo Externo' : 'Préstamo Interno'} • {loan.cantidad || 1} unidad
                      </Text>
                    </View>
                  </View>

                  <View
                    style={[
                      styles.statusBadge,
                      { backgroundColor: status.bg },
                    ]}
                  >
                    <MaterialCommunityIcons
                      name={status.icon}
                      size={13}
                      color={status.text}
                    />
                    <Text style={[styles.statusText, { color: status.text }]}>
                      {status.label}
                    </Text>
                  </View>
                </View>

                {/* Sala Info */}
                <View style={styles.roomRow}>
                  <MaterialCommunityIcons
                    name="door-open"
                    size={16}
                    color="#256B42"
                  />
                  <Text style={styles.roomText}>
                    Sala: <Text style={styles.roomName}>{loan.salaNombre || 'Laboratorio'}</Text>
                  </Text>
                </View>

                {/* Notificación de Reasignación de Sala */}
                {loan.fueReasignada && (
                  <View style={styles.reassignedBanner}>
                    <View style={styles.reassignedHeader}>
                      <MaterialCommunityIcons
                        name="swap-horizontal-bold"
                        size={15}
                        color="#4338CA"
                      />
                      <Text style={styles.reassignedTitle}>
                        Sala Reasignada por el Gestor
                      </Text>
                    </View>
                    <Text style={styles.reassignedDetails}>
                      Solicitada originalmente: {loan.salaOriginalNombre || 'Sala previa'}
                    </Text>
                    {loan.motivoReasignacion ? (
                      <Text style={styles.reassignedReason}>
                        "{loan.motivoReasignacion}"
                      </Text>
                    ) : null}
                  </View>
                )}

                {/* Motivo de Rechazo (si aplica) */}
                {loan.estado === 'rechazado' && loan.motivoRechazo && (
                  <View style={styles.rejectedBanner}>
                    <View style={styles.reassignedHeader}>
                      <MaterialCommunityIcons
                        name="alert-circle-outline"
                        size={15}
                        color="#991B1B"
                      />
                      <Text style={styles.rejectedTitle}>Motivo Justificativo de Denegación:</Text>
                    </View>
                    <Text style={styles.rejectedText}>"{loan.motivoRechazo}"</Text>
                  </View>
                )}

                {/* Fechas y Motivo */}
                <View style={styles.cardDates}>
                  <View style={styles.dateBlock}>
                    <Text style={styles.dateLabel}>Desde</Text>
                    <Text style={styles.dateValue}>{loan.fechaInicio || 'N/A'}</Text>
                  </View>
                  <MaterialCommunityIcons
                    name="arrow-right"
                    size={14}
                    color="#94A3B8"
                  />
                  <View style={styles.dateBlock}>
                    <Text style={styles.dateLabel}>Hasta</Text>
                    <Text style={styles.dateValue}>{loan.fechaFin || 'N/A'}</Text>
                  </View>
                </View>

                {loan.motivo ? (
                  <Text style={styles.purposeText} numberOfLines={2}>
                    <Text style={styles.purposeLabel}>Motivo: </Text>
                    {loan.motivo}
                  </Text>
                ) : null}
              </View>
            );
          })
        )}
        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAF8',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    gap: 12,
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleWrap: {
    flex: 1,
  },
  headerTitle: {
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
    fontSize: 18,
    color: '#0F172A',
  },
  headerSubtitle: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  filterWrap: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingVertical: 10,
  },
  filterScroll: {
    paddingHorizontal: 18,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
  },
  filterChipActive: {
    backgroundColor: '#256B42',
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  content: {
    padding: 18,
    gap: 12,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
    paddingHorizontal: 24,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#334155',
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 18,
  },
  loanCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
    gap: 10,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'between',
  },
  resourceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  iconThumb: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#EBF5EE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  resourceTexts: {
    flex: 1,
  },
  resourceName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  loanType: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  roomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#DCFCE7',
  },
  roomText: {
    fontSize: 12,
    color: '#166534',
  },
  roomName: {
    fontWeight: '700',
  },
  reassignedBanner: {
    backgroundColor: '#EEF2FF',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#C7D2FE',
    gap: 3,
  },
  reassignedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  reassignedTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#3730A3',
  },
  reassignedDetails: {
    fontSize: 11,
    color: '#4F46E5',
  },
  reassignedReason: {
    fontSize: 11,
    fontStyle: 'italic',
    color: '#4338CA',
    marginTop: 2,
  },
  rejectedBanner: {
    backgroundColor: '#FEF2F2',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#FECACA',
    gap: 3,
  },
  rejectedTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#991B1B',
  },
  rejectedText: {
    fontSize: 11,
    fontStyle: 'italic',
    color: '#B91C1C',
  },
  cardDates: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  dateBlock: {
    alignItems: 'center',
  },
  dateLabel: {
    fontSize: 9,
    color: '#94A3B8',
    textTransform: 'uppercase',
    fontWeight: '700',
  },
  dateValue: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
    marginTop: 1,
  },
  purposeText: {
    fontSize: 11,
    color: '#64748B',
    lineHeight: 16,
  },
  purposeLabel: {
    fontWeight: '600',
    color: '#334155',
  },
  bottomSpacer: {
    height: 24,
  },
});

