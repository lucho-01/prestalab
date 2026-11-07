import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { TextInput, Button, Checkbox } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useUser } from '../contexts/userContext';
import { createLoan, subscribeToSalas } from '../services/firestoreService';

export default function LoanRequestScreen({ navigation, route }) {
  const { user } = useUser();
  const { article } = route.params || {};

  const [salas, setSalas] = useState([]);
  const [selectedSala, setSelectedSala] = useState(null);
  const [loanType, setLoanType] = useState('interno');
  const [startDate, setStartDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [endDate, setEndDate] = useState('');
  const [purpose, setPurpose] = useState('');
  const [notes, setNotes] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const unsubscribe = subscribeToSalas((salasList) => {
      setSalas(salasList);
      if (article?.salaId) {
        const matching = salasList.find((s) => s.id === article.salaId);
        if (matching) setSelectedSala(matching);
        else if (salasList.length > 0) setSelectedSala(salasList[0]);
      } else if (salasList.length > 0 && !selectedSala) {
        setSelectedSala(salasList[0]);
      }
    });

    return () => unsubscribe();
  }, [article?.salaId]);

  const handleRequestLoan = async () => {
    if (!endDate || !purpose) {
      setError('Por favor completa todos los campos requeridos');
      return;
    }

    if (!termsAccepted) {
      setError('Debes aceptar los tÃ©rminos y condiciones');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const targetSala = selectedSala || salas[0];

      await createLoan({
        userId: user?.uid || 'usuario-anonimo',
        userNombre: user?.displayName || 'Estudiante',
        userEmail: user?.email || '',
        userRol: 'estudiante',
        userGenero: user?.genero || 'Otro',
        tipoRecurso: article ? 'mixto' : 'sala',
        articuloId: article?.id || null,
        articuloNombre: article?.nombre || null,
        salaId: targetSala?.id || 'sala-redes-201',
        salaNombre: targetSala?.nombre || 'Laboratorio',
        tipo: loanType,
        fechaInicio: startDate,
        fechaFin: endDate,
        motivo: purpose,
        observaciones: notes,
        cantidad: 1,
        estado: 'pendiente', // Se tramita para evaluaciÃ³n del Gestor
        fueReasignada: false,
      });

      Alert.alert(
        'Â¡Solicitud Tramitada!',
        `Tu solicitud ha sido enviada en tiempo real al panel del Gestor de ${targetSala?.nombre || 'Laboratorio'}. PodrÃ¡s seguir su estado en tu Historial.`,
        [
          {
            text: 'Ver en Historial',
            onPress: () => {
              navigation.goBack();
              navigation.navigate('LoanHistory');
            },
          },
          {
            text: 'Aceptar',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (err) {
      setError(err.message || 'Error al procesar la solicitud');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <MaterialCommunityIcons
            name="arrow-left"
            size={24}
            color="#181C1A"
          />
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>Solicitar PrÃ©stamo</Text>
          <Text style={styles.headerSubtitle}>TrÃ¡mite para evaluaciÃ³n de Gestor</Text>
        </View>
      </View>

      {/* Vista previa del artÃ­culo si fue seleccionado */}
      {article && (
        <View style={styles.articlePreview}>
          <View style={styles.articleImage}>
            <MaterialCommunityIcons
              name="package-variant"
              size={32}
              color="#256B42"
            />
          </View>
          <Text style={styles.articleName}>{article.nombre}</Text>
          <Text style={styles.articleCategory}>{article.categoria}</Text>
          <Text style={styles.articleStock}>
            {article.stock} unidades disponibles
          </Text>
        </View>
      )}

      {/* Selector de Laboratorio / Sala FÃ­sica */}
      <View style={styles.formSection}>
        <Text style={styles.sectionTitle}>
          Laboratorio / Sala de Destino *
        </Text>
        <Text style={styles.sectionHint}>
          Selecciona la sala acadÃ©mica donde se utilizarÃ¡ el recurso:
        </Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.salaScroll}
        >
          {salas.map((sala) => {
            const isSelected = selectedSala?.id === sala.id;
            return (
              <TouchableOpacity
                key={sala.id}
                onPress={() => setSelectedSala(sala)}
                style={[
                  styles.salaCard,
                  isSelected && styles.salaCardSelected,
                ]}
              >
                <View style={styles.salaHeader}>
                  <Text
                    style={[
                      styles.salaCode,
                      isSelected && styles.salaCodeSelected,
                    ]}
                  >
                    {sala.codigo}
                  </Text>
                  <Text
                    style={[
                      styles.salaStatus,
                      sala.estado === 'disponible'
                        ? styles.statusAvailable
                        : styles.statusBusy,
                    ]}
                  >
                    {sala.estado}
                  </Text>
                </View>
                <Text
                  style={[
                    styles.salaName,
                    isSelected && styles.salaNameSelected,
                  ]}
                  numberOfLines={2}
                >
                  {sala.nombre}
                </Text>
                <Text style={styles.salaCap}>
                  Capacidad: {sala.capacidad} puestos
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Tipo de PrÃ©stamo */}
      <View style={styles.formSection}>
        <Text style={styles.sectionTitle}>Tipo de PrÃ©stamo</Text>
        <View style={styles.loanTypeContainer}>
          <TouchableOpacity
            style={[
              styles.loanTypeButton,
              {
                backgroundColor: loanType === 'interno' ? '#ABF2C1' : '#EAEFEB',
                borderColor: loanType === 'interno' ? '#256B42' : '#BDCAC0',
              },
            ]}
            onPress={() => setLoanType('interno')}
          >
            <MaterialCommunityIcons
              name="school"
              size={24}
              color={loanType === 'interno' ? '#02210E' : '#3E4941'}
            />
            <Text
              style={[
                styles.loanTypeTitle,
                { color: loanType === 'interno' ? '#02210E' : '#181C1A' },
              ]}
            >
              Interno
            </Text>
            <Text
              style={[
                styles.loanTypeDescription,
                { color: loanType === 'interno' ? '#02210E' : '#3E4941' },
              ]}
            >
              Dentro del laboratorio
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.loanTypeButton,
              {
                backgroundColor: loanType === 'externo' ? '#ABF2C1' : '#EAEFEB',
                borderColor: loanType === 'externo' ? '#256B42' : '#BDCAC0',
              },
            ]}
            onPress={() => setLoanType('externo')}
          >
            <MaterialCommunityIcons
              name="home"
              size={24}
              color={loanType === 'externo' ? '#02210E' : '#3E4941'}
            />
            <Text
              style={[
                styles.loanTypeTitle,
                { color: loanType === 'externo' ? '#02210E' : '#181C1A' },
              ]}
            >
              Externo
            </Text>
            <Text
              style={[
                styles.loanTypeDescription,
                { color: loanType === 'externo' ? '#02210E' : '#3E4941' },
              ]}
            >
              PrÃ¡ctica de campo
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Fechas */}
      <View style={styles.formSection}>
        <Text style={styles.sectionTitle}>Fecha de Inicio *</Text>
        <TextInput
          mode="outlined"
          placeholder="YYYY-MM-DD"
          value={startDate}
          onChangeText={setStartDate}
          style={styles.input}
          outlineColor="#BDCAC0"
          activeOutlineColor="#256B42"
          theme={{ roundness: 14 }}
        />
      </View>

      <View style={styles.formSection}>
        <Text style={styles.sectionTitle}>Fecha de DevoluciÃ³n Estimada *</Text>
        <TextInput
          mode="outlined"
          placeholder="YYYY-MM-DD (ej: 2026-10-27)"
          value={endDate}
          onChangeText={setEndDate}
          style={styles.input}
          outlineColor="#BDCAC0"
          activeOutlineColor="#256B42"
          theme={{ roundness: 14 }}
        />
      </View>

      {/* Motivo */}
      <View style={styles.formSection}>
        <Text style={styles.sectionTitle}>Motivo AcadÃ©mico / PrÃ¡ctica *</Text>
        <TextInput
          mode="outlined"
          placeholder="Ej: MediciÃ³n de seÃ±ales para el proyecto final de Telecomunicaciones"
          value={purpose}
          onChangeText={setPurpose}
          style={styles.input}
          outlineColor="#BDCAC0"
          activeOutlineColor="#256B42"
          theme={{ roundness: 14 }}
        />
      </View>

      {/* Observaciones */}
      <View style={styles.formSection}>
        <Text style={styles.sectionTitle}>Observaciones / Requerimientos</Text>
        <TextInput
          mode="outlined"
          placeholder="Ej: Se requiere toma con conexiÃ³n a tierra o cables auxiliares"
          value={notes}
          onChangeText={setNotes}
          multiline
          numberOfLines={3}
          style={[styles.input, styles.textArea]}
          outlineColor="#BDCAC0"
          activeOutlineColor="#256B42"
          theme={{ roundness: 14 }}
        />
      </View>

      {/* TÃ©rminos y condiciones */}
      <View style={styles.termsContainer}>
        <Checkbox
          status={termsAccepted ? 'checked' : 'unchecked'}
          onPress={() => setTermsAccepted(!termsAccepted)}
          color="#256B42"
        />
        <Text style={styles.termsText}>
          Acepto los tÃ©rminos de uso responsable, custodia del equipo y horarios
          definidos por el Gestor del laboratorio.
        </Text>
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Button
        mode="contained"
        onPress={handleRequestLoan}
        disabled={loading || !termsAccepted}
        style={[styles.submitButton, { backgroundColor: '#256B42' }]}
        labelStyle={[styles.submitButtonText, { color: '#FEFFFE' }]}
        contentStyle={styles.submitButtonContent}
        theme={{ roundness: 18 }}
      >
        {loading ? 'Enviando solicitud...' : 'Enviar Solicitud al Gestor'}
      </Button>

      <View style={styles.bottomSpacing} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5FBF6',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 54,
    paddingHorizontal: 20,
    marginBottom: 16,
    gap: 14,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#EFF5F1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#181C1A',
  },
  headerSubtitle: {
    fontSize: 11,
    color: '#6E7A71',
    marginTop: 1,
  },
  articlePreview: {
    marginHorizontal: 16,
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 20,
    backgroundColor: '#EFF5F1',
    borderWidth: 1,
    borderColor: '#BDCAC0',
  },
  articleImage: {
    width: 60,
    height: 60,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    backgroundColor: '#ABF2C1',
  },
  articleName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#181C1A',
    marginBottom: 2,
    textAlign: 'center',
  },
  articleCategory: {
    fontSize: 12,
    color: '#3E4941',
    marginBottom: 6,
  },
  articleStock: {
    fontSize: 12,
    fontWeight: '700',
    color: '#256B42',
  },
  formSection: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#181C1A',
    marginBottom: 4,
  },
  sectionHint: {
    fontSize: 11,
    color: '#6E7A71',
    marginBottom: 8,
  },
  salaScroll: {
    gap: 10,
    paddingVertical: 4,
  },
  salaCard: {
    width: 170,
    padding: 12,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#DEE4E0',
    justifyContent: 'space-between',
    gap: 6,
  },
  salaCardSelected: {
    borderColor: '#256B42',
    backgroundColor: '#EFF5F1',
  },
  salaHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  salaCode: {
    fontSize: 11,
    fontWeight: '800',
    color: '#256B42',
  },
  salaCodeSelected: {
    color: '#02210E',
  },
  salaStatus: {
    fontSize: 9,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  statusAvailable: {
    color: '#256B42',
  },
  statusBusy: {
    color: '#B45309',
  },
  salaName: {
    fontSize: 11,
    fontWeight: '600',
    color: '#181C1A',
    lineHeight: 15,
  },
  salaNameSelected: {
    color: '#02210E',
  },
  salaCap: {
    fontSize: 9,
    color: '#6E7A71',
  },
  loanTypeContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  loanTypeButton: {
    flex: 1,
    padding: 12,
    borderRadius: 14,
    alignItems: 'center',
    borderWidth: 1.5,
  },
  loanTypeTitle: {
    fontSize: 13,
    fontWeight: '700',
    marginTop: 6,
    marginBottom: 2,
  },
  loanTypeDescription: {
    fontSize: 10,
    textAlign: 'center',
  },
  input: {
    backgroundColor: '#FFFFFF',
    fontSize: 13,
  },
  textArea: {
    height: 70,
  },
  termsContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 16,
    alignItems: 'flex-start',
  },
  termsText: {
    fontSize: 11,
    color: '#3E4941',
    flex: 1,
    marginTop: 6,
    lineHeight: 16,
  },
  error: {
    fontSize: 12,
    color: '#B3261E',
    marginHorizontal: 16,
    marginBottom: 16,
    textAlign: 'center',
    fontWeight: '600',
  },
  submitButton: {
    marginHorizontal: 16,
    borderRadius: 14,
  },
  submitButtonText: {
    fontSize: 15,
    fontWeight: '700',
  },
  submitButtonContent: {
    height: 52,
  },
  bottomSpacing: {
    height: 40,
  },
});
