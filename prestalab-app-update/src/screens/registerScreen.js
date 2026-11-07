import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TextInput } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { registerUser } from '../services/authService';
import Brand from '../components/Brand';
import AppTextInput from '../components/AppTextInput';
import PrimaryButton from '../components/PrimaryButton';
import { COLORS } from '../theme/palette';

const GENDERS = ['Masculino', 'Femenino', 'Otro'];

export default function RegisterScreen({ navigation }) {
  const [name, setName] = useState('');
  const [lastName, setLastName] = useState('');
  const [gender, setGender] = useState('Masculino');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSignUp = async () => {
    const cleanName = name.trim();
    const cleanLastName = lastName.trim();
    const cleanPhone = phone.trim();
    const cleanEmail = email.trim();
    const cleanPassword = password.trim();

    if (!cleanName || !cleanLastName || !cleanPhone || !cleanEmail || !cleanPassword) {
      setError('Por favor completa todos los campos');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      setError('Ingresa un correo electrónico válido');
      return;
    }

    const phoneDigits = cleanPhone.replace(/\D/g, '');
    if (phoneDigits.length < 10) {
      setError('Ingresa un número de teléfono colombiano válido (ej. +57 300 123 4567)');
      return;
    }

    setLoading(true);
    setError('');

    const result = await registerUser(cleanEmail, cleanPassword, cleanName, cleanLastName, cleanPhone, gender);

    if (!result.success) {
      setError(result.error);
    }

    setLoading(false);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.headerRow}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <MaterialCommunityIcons
                name="arrow-left"
                size={24}
                color={COLORS.text}
              />
            </TouchableOpacity>
            <Brand size="sm" />
          </View>

          <Text style={styles.title}>Crear cuenta</Text>
          <Text style={styles.subtitle}>
            Regístrate para solicitar y gestionar tus préstamos de laboratorio.
          </Text>

          <AppTextInput
            label="Nombre"
            icon="account-outline"
            placeholder="Alejandro"
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
            style={styles.field}
          />

          <AppTextInput
            label="Apellido"
            icon="account-outline"
            placeholder="García"
            value={lastName}
            onChangeText={setLastName}
            autoCapitalize="words"
            style={styles.field}
          />

          {/* Campo Sexo / Género */}
          <View style={styles.genderContainer}>
            <Text style={styles.genderLabel}>Sexo / Género *</Text>
            <View style={styles.genderRow}>
              {GENDERS.map((g) => {
                const isSelected = gender === g;
                return (
                  <TouchableOpacity
                    key={g}
                    onPress={() => setGender(g)}
                    style={[
                      styles.genderChip,
                      isSelected && styles.genderChipSelected,
                    ]}
                  >
                    <MaterialCommunityIcons
                      name={
                        g === 'Masculino'
                          ? 'gender-male'
                          : g === 'Femenino'
                          ? 'gender-female'
                          : 'gender-non-binary'
                      }
                      size={18}
                      color={isSelected ? '#FEFFFE' : '#4F6355'}
                    />
                    <Text
                      style={[
                        styles.genderChipText,
                        isSelected && styles.genderChipTextSelected,
                      ]}
                    >
                      {g}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <AppTextInput
            label="Teléfono"
            icon="phone-outline"
            placeholder="+57 300 123 4567"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            style={styles.field}
          />

          <AppTextInput
            label="Correo"
            icon="email-outline"
            placeholder="alejandro.garcia@correo.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            style={styles.field}
          />

          <AppTextInput
            label="Contraseña"
            icon="lock-outline"
            placeholder="Crea una contraseña"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            right={
              <TextInput.Icon
                icon={showPassword ? 'eye-outline' : 'eye-off-outline'}
                color="#3E4941"
                onPress={() => setShowPassword(!showPassword)}
              />
            }
            style={styles.field}
          />

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <PrimaryButton
            label="Crear cuenta"
            icon="arrow-right"
            onPress={handleSignUp}
            loading={loading}
            style={styles.submit}
          />

          <View style={styles.footer}>
            <Text style={styles.footerText}>¿Ya tienes una cuenta? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.footerLink}>Iniciar sesión</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  flex: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 48,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 28,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  title: {
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
    fontSize: 34,
    color: COLORS.text,
    letterSpacing: -0.6,
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
    lineHeight: 23,
    color: COLORS.textMuted,
    marginBottom: 26,
  },
  field: {
    marginBottom: 4,
  },
  genderContainer: {
    marginVertical: 8,
  },
  genderLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#3E4941',
    marginBottom: 8,
    fontFamily: 'Inter_500Medium',
  },
  genderRow: {
    flexDirection: 'row',
    gap: 8,
  },
  genderChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#EFF5F1',
    borderWidth: 1.5,
    borderColor: '#BDCAC0',
  },
  genderChipSelected: {
    backgroundColor: '#256B42',
    borderColor: '#256B42',
  },
  genderChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#3E4941',
  },
  genderChipTextSelected: {
    color: '#FEFFFE',
  },
  error: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: COLORS.error,
    textAlign: 'center',
    marginBottom: 14,
  },
  submit: {
    marginTop: 12,
    marginBottom: 24,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  footerText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
    color: COLORS.textMuted,
  },
  footerLink: {
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
    fontSize: 15,
    color: COLORS.primary,
  },
});
