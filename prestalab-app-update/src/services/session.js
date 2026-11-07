import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Sesión local de la app: token JWT + perfil.
 * Se guarda en AsyncStorage para entrar sin conexión y sobrevivir reinicios.
 */
const STORAGE_KEY = 'prestalab.session.v1';

let cache; // undefined = todavía no se leyó
const listeners = new Set();

function notify() {
  for (const fn of listeners) {
    try {
      fn(cache ?? null);
    } catch (e) {
      // un listener roto no debe tumbar la app
    }
  }
}

async function persist() {
  try {
    if (cache) {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(cache));
    } else {
      await AsyncStorage.removeItem(STORAGE_KEY);
    }
  } catch (e) {
    console.warn('No se pudo guardar la sesión:', e?.message);
  }
}

export function subscribeSession(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function getSession() {
  return cache ?? null;
}

export function getToken() {
  return cache?.token || null;
}

export async function loadSession() {
  if (cache !== undefined) return cache;
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    cache = raw ? JSON.parse(raw) : null;
  } catch (e) {
    console.warn('No se pudo leer la sesión:', e?.message);
    cache = null;
  }
  return cache;
}

export async function saveSession(token, user) {
  cache = { token, user };
  await persist();
  notify();
  return cache;
}

export async function updateSessionUser(user) {
  if (!cache) return null;
  cache = { ...cache, user };
  await persist();
  notify();
  return cache;
}

export async function clearSession() {
  cache = null;
  await persist();
  notify();
}
