import React, { useEffect, useRef } from 'react';
import { Animated, Dimensions, Easing, StyleSheet, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '../theme/palette';

/**
 * Splash de inicio (4.5s):
 *  1. El logo aparece miniéndose con rotación   (0.35s - 1.0s)
 *  2. Aparece el texto "PrestaLab"              (1.6s  - 2.05s)
 *  3. Fundido de salida hacia la app            (4.5s, o cuando termina la carga)
 */

const LOGO_START = 350;
const LOGO_DURATION = 640;
const TEXT_START = 1600;
const TEXT_DURATION = 450;
const MIN_DURATION = 4500;
const FADE_DURATION = 280;

// Colores muestreados del video de referencia
const LOGO_BG = '#2F6346';
const WORD_COLOR = '#2B4E39';
const ICON_RATIO = 0.95;

export default function SplashScreen({ ready = true, onFinish }) {
  const { width } = Dimensions.get('window');
  const logoSize = Math.round(width * 0.38);

  const startedAt = useRef(Date.now()).current;
  const finishedRef = useRef(false);
  const fade = useRef(new Animated.Value(1)).current;
  const logoScale = useRef(new Animated.Value(0)).current;
  const logoRotate = useRef(new Animated.Value(35)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const textProgress = useRef(new Animated.Value(0)).current;

  // 1) Entrada del logo: escala con "rebote" y rotación que se asienta
  useEffect(() => {
    const anim = Animated.parallel([
      Animated.sequence([
        Animated.timing(logoScale, {
          toValue: 1.07,
          delay: LOGO_START,
          duration: Math.round(LOGO_DURATION * 0.66),
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(logoScale, {
          toValue: 1,
          duration: Math.round(LOGO_DURATION * 0.34),
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(logoRotate, {
        toValue: 0,
        delay: LOGO_START,
        duration: LOGO_DURATION,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(logoOpacity, {
        toValue: 1,
        delay: LOGO_START,
        duration: 260,
        useNativeDriver: true,
      }),
    ]);
    anim.start();
    return () => anim.stop();
  }, [logoScale, logoRotate, logoOpacity]);

  // 2) Aparición del texto "PrestaLab"
  useEffect(() => {
    const anim = Animated.timing(textProgress, {
      toValue: 1,
      delay: TEXT_START,
      duration: TEXT_DURATION,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    });
    anim.start();
    return () => anim.stop();
  }, [textProgress]);

  // 3) Salida: espera a que cargue (fuentes + sesión) y al tiempo mínimo
  useEffect(() => {
    if (!ready) return undefined;

    const remaining = Math.max(0, MIN_DURATION - (Date.now() - startedAt));
    const timer = setTimeout(() => {
      if (finishedRef.current) return;
      finishedRef.current = true;
      Animated.timing(fade, {
        toValue: 0,
        duration: FADE_DURATION,
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished && onFinish) onFinish();
      });
    }, remaining);

    return () => clearTimeout(timer);
  }, [ready, startedAt, fade, onFinish]);

  const logoRotateStr = logoRotate.interpolate({
    inputRange: [0, 35],
    outputRange: ['0deg', '35deg'],
  });

  const wordOpacity = textProgress.interpolate({ inputRange: [0, 1], outputRange: [0, 1] });
  const wordTranslateY = textProgress.interpolate({ inputRange: [0, 1], outputRange: [16, 0] });

  return (
    <Animated.View style={[styles.root, { opacity: fade }]}>
      <View style={styles.center}>
        <Animated.View
          style={[
            styles.logo,
            {
              width: logoSize,
              height: logoSize,
              borderRadius: Math.round(logoSize * 0.22),
              opacity: logoOpacity,
              transform: [{ scale: logoScale }, { rotate: logoRotateStr }],
            },
          ]}
        >
          <MaterialCommunityIcons
            name="flask-outline"
            size={Math.round(logoSize * ICON_RATIO)}
            color={COLORS.onPrimary}
          />
        </Animated.View>

        <Animated.Text
          style={[
            styles.word,
            {
              fontSize: Math.round(width * 0.132),
              marginTop: Math.round(width * 0.045),
              opacity: wordOpacity,
              transform: [{ translateY: wordTranslateY }],
            },
          ]}
        >
          PrestaLab
        </Animated.Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  center: {
    alignItems: 'center',
  },
  logo: {
    backgroundColor: LOGO_BG,
    alignItems: 'center',
    justifyContent: 'center',
  },
  word: {
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
    color: WORD_COLOR,
    letterSpacing: -0.5,
    textAlign: 'center',
  },
});
