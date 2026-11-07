import { API_BASE_URL } from '../config/apiConfig';
import { getToken } from './session';

const TIMEOUT_MS = 15000;

export class ApiError extends Error {
  constructor(message, status = 0) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

/**
 * Cliente HTTP de la app. Adjunta el token Bearer y normaliza los errores.
 * `auth: false` se usa sólo en login/registro/recuperación.
 */
export async function apiFetch(path, options = {}) {
  const { method = 'GET', body, auth = true } = options;

  if (!API_BASE_URL) {
    throw new ApiError(
      'Falta EXPO_PUBLIC_API_VERCEL en el archivo .env de la app.',
      0,
    );
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const headers = { Accept: 'application/json' };
    if (body !== undefined) headers['Content-Type'] = 'application/json';

    if (auth) {
      const token = getToken();
      if (!token) throw new ApiError('Sesión no iniciada.', 401);
      headers.Authorization = `Bearer ${token}`;
    }

    const res = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: controller.signal,
    });

    const text = await res.text();
    let data = {};
    if (text) {
      try {
        data = JSON.parse(text);
      } catch (e) {
        data = {};
      }
    }

    if (!res.ok || data?.success === false) {
      throw new ApiError(data?.error || `Error ${res.status}`, res.status);
    }

    return data;
  } catch (e) {
    if (e instanceof ApiError) throw e;
    if (e?.name === 'AbortError') {
      throw new ApiError('La conexión tardó demasiado. Intenta de nuevo.', 0);
    }
    throw new ApiError('Sin conexión con el servidor. Verifica tu internet.', 0);
  } finally {
    clearTimeout(timer);
  }
}
