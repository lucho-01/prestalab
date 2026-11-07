/**
 * Llamadas a Firebase Auth (Identity Toolkit) desde el servidor.
 * La app móvil nunca ve estas credenciales: sólo consume este backend.
 */

const IDENTITY_BASE = 'https://identitytoolkit.googleapis.com/v1/accounts';

export const AUTH_ERROR_MESSAGES: Record<string, string> = {
  EMAIL_NOT_FOUND: 'No existe una cuenta con este correo.',
  INVALID_PASSWORD: 'Contraseña incorrecta.',
  INVALID_LOGIN_CREDENTIALS: 'Correo o contraseña incorrectos.',
  INVALID_EMAIL: 'El correo electrónico no es válido.',
  EMAIL_EXISTS: 'Ya existe una cuenta con este correo.',
  WEAK_PASSWORD: 'La contraseña debe tener al menos 6 caracteres.',
  USER_DISABLED: 'Esta cuenta está deshabilitada.',
  OPERATION_NOT_ALLOWED:
    'El registro con correo y contraseña está deshabilitado en Firebase.',
  TOO_MANY_ATTEMPTS_TRY_LATER: 'Demasiados intentos. Intenta más tarde.',
  MISSING_PASSWORD: 'Ingresa tu contraseña.',
  NO_API_KEY:
    'Falta NEXT_PUBLIC_FIREBASE_API_KEY en el servidor para autenticar.',
};

type IdentityResult =
  | { ok: true; data: Record<string, any> }
  | { ok: false; code: string };

export function firebaseApiKey(): string {
  return (
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY ||
    process.env.FIREBASE_API_KEY ||
    ''
  ).trim();
}

export function identityConfigured(): boolean {
  return firebaseApiKey().length > 0;
}

function mensajeDe(code: string): string {
  return AUTH_ERROR_MESSAGES[code] || 'No se pudo completar la operación.';
}

export function authErrorMessage(code: string): string {
  return mensajeDe(code);
}

async function call(
  endpoint: 'signInWithPassword' | 'signUp' | 'sendOobCode',
  payload: Record<string, unknown>,
): Promise<IdentityResult> {
  const key = firebaseApiKey();
  if (!key) return { ok: false, code: 'NO_API_KEY' };

  try {
    const res = await fetch(`${IDENTITY_BASE}:${endpoint}?key=${key}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      return { ok: false, code: data?.error?.message || 'UNKNOWN' };
    }
    return { ok: true, data };
  } catch (error) {
    console.error(`[identity:${endpoint}]`, error);
    return { ok: false, code: 'NETWORK_ERROR' };
  }
}

export function identitySignIn(email: string, password: string) {
  return call('signInWithPassword', { email, password, returnSecureToken: true });
}

export function identitySignUp(
  email: string,
  password: string,
  displayName: string,
) {
  return call('signUp', {
    email,
    password,
    displayName,
    returnSecureToken: true,
  });
}

export function identityPasswordReset(email: string) {
  return call('sendOobCode', { requestType: 'PASSWORD_RESET', email });
}
