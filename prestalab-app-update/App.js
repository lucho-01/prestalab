import { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { NavigationContainer } from "@react-navigation/native";
import { PaperProvider, MD3LightTheme } from "react-native-paper";
import { SafeAreaProvider } from "react-native-safe-area-context";
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from "@expo-google-fonts/inter";
import { UserProvider, useUser } from "./src/contexts/userContext";
import SplashScreen from "./src/components/SplashScreen";
import AuthStack from "./src/navegations/authStack";
import MainStack from "./src/navegations/mainStack";
import { initDb } from "./src/data/localDb";
import { iniciarSync } from "./src/sync/connectivity";

// SQLite es la fuente de lectura: se inicializa antes del primer render.
// Si el binario no trae el módulo nativo, la app sigue funcionando (sin caché).
try {
  initDb();
} catch (e) {
  console.warn("SQLite no disponible:", e?.message);
}

const theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#256B42',
    onPrimary: '#FEFFFE',
    primaryContainer: '#ABF2C1',
    onPrimaryContainer: '#02210E',
    secondary: '#4F6355',
    secondaryContainer: '#D1E8D7',
    onSecondaryContainer: '#0E1F14',
    tertiaryContainer: '#B6ECF4',
    onTertiaryContainer: '#031F23',
    surface: '#F5FBF6',
    surfaceContainerLow: '#EFF5F1',
    surfaceContainer: '#EAEFEB',
    surfaceContainerHigh: '#E4EAE5',
    surfaceContainerHighest: '#DEE4E0',
    onSurface: '#181C1A',
    onSurfaceVariant: '#3E4941',
    outline: '#6E7A71',
    outlineVariant: '#BDCAC0',
    error: '#B3261E',
    onError: '#FFFFFF',
    errorContainer: '#F9DEDC',
    onErrorContainer: '#410E0B',
  },
  fonts: {
    ...MD3LightTheme.fonts,
    regular: { fontFamily: 'Inter_400Regular', fontWeight: '400' },
    medium: { fontFamily: 'Inter_500Medium', fontWeight: '500' },
    mediumLarge: { fontFamily: 'Inter_500Medium', fontWeight: '500' },
    bold: { fontFamily: 'Inter_700Bold', fontWeight: '700' },
    titleLarge: { fontFamily: 'Inter_700Bold', fontWeight: '700' },
    titleMedium: { fontFamily: 'Inter_500Medium', fontWeight: '500' },
    titleSmall: { fontFamily: 'Inter_500Medium', fontWeight: '500' },
    labelLarge: { fontFamily: 'Inter_500Medium', fontWeight: '500' },
    labelMedium: { fontFamily: 'Inter_500Medium', fontWeight: '500' },
    labelSmall: { fontFamily: 'Inter_500Medium', fontWeight: '500' },
    bodyLarge: { fontFamily: 'Inter_400Regular', fontWeight: '400' },
    bodyMedium: { fontFamily: 'Inter_400Regular', fontWeight: '400' },
    bodySmall: { fontFamily: 'Inter_400Regular', fontWeight: '400' },
  },
};

function AppContent() {
  const { user, loading } = useUser();
  const [splashDone, setSplashDone] = useState(false);

  // Offline-first: push de la outbox + pull de catálogo/salas/préstamos
  useEffect(() => {
    if (!user?.uid) return undefined;
    return iniciarSync(user.uid);
  }, [user?.uid]);

  // Splash animado: cubre la carga de fuentes + sesión (mín. 4.5s)
  if (!splashDone) {
    return <SplashScreen ready={!loading} onFinish={() => setSplashDone(true)} />;
  }

  return (
    <NavigationContainer>
      {user ? <MainStack /> : <AuthStack />}
    </NavigationContainer>
  );
}

export default function App() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  // Fondo neutro mientras cargan las fuentes (evita parpadeo de tipografía)
  if (!fontsLoaded) {
    return <View style={[styles.loadingContainer, { backgroundColor: "#F5FBF6" }]} />;
  }

  return (
    <SafeAreaProvider>
      <PaperProvider theme={theme}>
        <UserProvider>
          <StatusBar style="dark" />
          <AppContent />
        </UserProvider>
      </PaperProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
