/**
 * Autenticación contra la API de PrestaLab (Vercel).
 * Mismas firmas que antes (Firebase), para no tocar las pantallas.
 */
import { apiFetch } from './apiClient';
import {
  clearSession,
  getToken,
  saveSession,
  updateSessionUser,
} from './session';

function normalizarUsuario(user = {}) {
  const nombre = user.nombre || user.displayName || '';
  return {
    ...user,
    uid: user.uid || user.id,
    displayName: user.displayName || nombre,
    genero: user.genero || 'Otro',
  };
}

export const loginUser = async (email, password) => {
  try {
    const data = await apiFetch('/api/mobile/auth/login', {
      method: 'POST',
      auth: false,
      body: { email, password },
    });
    const user = normalizarUsuario(data.user);
    await saveSession(data.token, user);
    return { success: true, user };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const registerUser = async (
  email,
  password,
  name,
  lastName,
  phone,
  gender = 'Otro',
) => {
  try {
    const data = await apiFetch('/api/mobile/auth/register', {
      method: 'POST',
      auth: false,
      body: {
        nombre: name,
        apellido: lastName,
        telefono: phone,
        email,
        password,
        genero: gender,
      },
    });
    const user = normalizarUsuario(data.user);
    await saveSession(data.token, user);
    return { success: true, user };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const sendPasswordReset = async (email) => {
  try {
    await apiFetch('/api/mobile/auth/recuperar', {
      method: 'POST',
      auth: false,
      body: { email },
    });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const logoutUser = async () => {
  await clearSession();
  return { success: true };
};

/** Refresca el perfil desde el servidor; si el token murió, cierra sesión. */
export const refreshProfile = async () => {
  if (!getToken()) return null;
  try {
    const data = await apiFetch('/api/mobile/auth/me');
    const user = normalizarUsuario(data.user);
    await updateSessionUser(user);
    return user;
  } catch (error) {
    if (error?.status === 401 || error?.status === 403) {
      await clearSession();
    }
    return null;
  }
};
