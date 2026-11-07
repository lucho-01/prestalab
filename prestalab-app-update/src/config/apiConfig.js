/**
 * Configuración de la API.
 * La app NO habla con Firebase: sólo con el backend de PrestaLab (Vercel).
 */
export const API_BASE_URL = (
  process.env.EXPO_PUBLIC_API_VERCEL ||
  process.env.EXPO_PUBLIC_API_URL ||
  ''
)
  .trim()
  .replace(/\/+$/, '');
