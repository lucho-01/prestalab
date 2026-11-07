/** Disparadores de sincronización: red, primer plano, 30s y acciones locales. */
import { AppState } from 'react-native';
import { on } from '../data/emit';
import { sincronizar } from './syncEngine';

let NetInfo = null;
try {
  NetInfo = require('@react-native-community/netinfo').default;
} catch (e) {
  console.warn('NetInfo no disponible:', e?.message);
}

let red = { conectado: true };

export function iniciarSync(uid) {
  if (!uid) return () => {};

  const correr = () => {
    if (!red.conectado) return;
    sincronizar(uid);
  };

  let unsubNet = () => {};
  if (NetInfo) {
    try {
      unsubNet = NetInfo.addEventListener((state) => {
        red = {
          conectado:
            state?.isConnected === true && state?.isInternetReachable !== false,
        };
        if (red.conectado) correr();
      });
    } catch (e) {
      console.warn('NetInfo no operativo:', e?.message);
    }
  }

  const subApp = AppState.addEventListener('change', (estado) => {
    if (estado === 'active') correr();
  });

  const timer = setInterval(correr, 30_000);
  const unsubSync = on('sync', correr);

  correr();

  return () => {
    try {
      unsubNet();
    } catch (e) {}
    subApp.remove();
    unsubSync();
    clearInterval(timer);
  };
}

export const estaConectado = () => red.conectado;
