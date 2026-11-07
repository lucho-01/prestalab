import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TextInput } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { loginUser, sendPasswordReset } from '../services/authService';
import Brand from '../components/Brand';
import AppTextInput from '../components/AppTextInput';
import PrimaryButton from '../components/PrimaryButton';
import { COLORS } from '../theme/palette';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSignIn = async () => {
    const cleanEmail = email.trim();
    const cleanPassword = password.trim();

    if (!cleanEmail || !cleanPassword) {
      setError('Por favor completa todos los campos');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      setError('Ingresa un correo electrónico válido');
      return;
    }

    setLoading(true);
    setError('');

    const result = await loginUser(cleanEmail, cleanPassword);

    if (!result.success) {
      setError(result.error);
    }

    setLoading(false);
  };

  const handleForgotPassword = async () => {
    const cleanEmail = email.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(cleanEmail)) {
      setError('Ingresa tu correo en el primer campo para recuperar tu contraseña');
      return;
    }

    setError('');
    const result = await sendPasswordReset(cleanEmail);

    if (result.success) {
      Alert.alert(
        'Correo enviado',
        `Revisa ${cleanEmail} para restablecer tu contraseña.`
      );
    } else {
      setError(result.error);
    }
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
          <Brand style={styles.brand} />

          <View style={styles.hero}>
            <View style={styles.heroIcon} pointerEvents="none">
              <MaterialCommunityIcons
                name="flask-outline"
                size={30}
                color="rgba(255,255,255,0.9)"
              />
            </View>
            <View style={styles.heroTexts}>
              <Text style={styles.heroTitle}>
                El equipo que necesitas, a tu alcance.
              </Text>
              <Text style={styles.heroOverline}>PRÉSTAMOS DE LABORATORIO</Text>
            </View>
            <View style={styles.heroArcLarge} pointerEvents="none" />
            <View style={styles.heroArcSmall} pointerEvents="none" />
          </View>

          <Text style={styles.title}>Iniciar sesión</Text>
          <Text style={styles.subtitle}>Qué bueno tenerte de vuelta.</Text>

          <AppTextInput
            label="Correo"
            icon="email-outline"
            placeholder="alejandro.garcia@correo.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />

          <AppTextInput
            label="Contraseña"
            icon="lock-outline"
            placeholder="Ingresa tu contraseña"
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
          />

          <TouchableOpacity
            style={styles.forgotButton}
            onPress={handleForgotPassword}
          >
            <Text style={styles.forgotText}>¿Olvidaste tu contraseña?</Text>
          </TouchableOpacity>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <PrimaryButton
            label="Iniciar sesión"
            icon="arrow-right"
            onPress={handleSignIn}
            loading={loading}
            style={styles.submit}
          />

          <View style={styles.footer}>
            <Text style={styles.footerText}>¿No tienes una cuenta? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text style={styles.footerLink}>Crear cuenta</Text>
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
    paddingTop: 16,
    paddingBottom: 40,
  },
  brand: {
    marginBottom: 24,
  },
  hero: {
    backgroundColor: COLORS.primaryDark,
    borderRadius: 24,
    padding: 24,
    minHeight: 208,
    justifyContent: 'space-between',
    overflow: 'hidden',
    marginBottom: 28,
  },
  heroIcon: {
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  heroTexts: {
    paddingRight: 8,
  },
  heroTitle: {
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
    fontSize: 27,
    lineHeight: 34,
    color: COLORS.onPrimary,
    letterSpacing: -0.4,
  },
  heroOverline: {
    fontFamily: 'Inter_500Medium',
    fontWeight: '500',
    fontSize: 12,
    letterSpacing: 1.4,
    color: 'rgba(255,255,255,0.75)',
    marginTop: 18,
  },
  heroArcLarge: {
    position: 'absolute',
    right: -96,
    top: -76,
    width: 250,
    height: 250,
    borderRadius: 125,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  heroArcSmall: {
    position: 'absolute',
    right: -34,
    top: -18,
    width: 150,
    height: 150,
    borderRadius: 75,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
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
    color: COLORS.textMuted,
    marginBottom: 24,
  },
  forgotButton: {
    alignSelf: 'flex-end',
    marginTop: -4,
    marginBottom: 20,
    paddingVertical: 4,
  },
  forgotText: {
    fontFamily: 'Inter_600SemiBold',
    fontWeight: '600',
    fontSize: 14,
    color: COLORS.primary,
  },
  error: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: COLORS.error,
    textAlign: 'center',
    marginBottom: 14,
  },
  submit: {
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
