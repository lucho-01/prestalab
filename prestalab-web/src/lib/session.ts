import { cookies } from 'next/headers';
import { adminAuth, adminDb } from './firebase-admin';

/**
 * Sesión del portal web basada en Firebase Auth (session cookies httpOnly).
 * El rol se lee del custom claim `rol` y, como respaldo, del doc `usuarios`.
 */
export const SESSION_COOKIE = 'prestalab_session';
const EXPIRES_IN_MS = 60 * 60 * 24 * 5 * 1000; // 5 días

export type Rol = 'estudiante' | 'docente' | 'gestor' | 'admin';

export interface SessionUser {
  id: string;
  uid: string;
  email: string;
  nombre: string;
  rol: Rol;
  laboratoriosAsignados: string[];
  departamento: string;
}

/** Crea la cookie de sesión a partir de un idToken recién emitido. */
export async function setSessionCookie(idToken: string): Promise<void> {
  const sessionCookie = await adminAuth.createSessionCookie(idToken, {
    expiresIn: EXPIRES_IN_MS,
  });

  const store = await cookies();
  store.set(SESSION_COOKIE, sessionCookie, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: Math.floor(EXPIRES_IN_MS / 1000),
  });
}

export async function clearSessionCookie(): Promise<void> {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

function readCookie(request?: Request): string | null {
  if (!request) return null;
  const header = request.headers.get('cookie') || '';
  const match = header.match(new RegExp(`(?:^|;\\s*)${SESSION_COOKIE}=([^;]+)`));
  return match ? decodeURIComponent(match[1]) : null;
}

/** Verifica la sesión y devuelve el usuario (o null). */
export async function getSessionUser(request?: Request): Promise<SessionUser | null> {
  let cookieValue: string | null = null;

  try {
    if (request) {
      cookieValue = readCookie(request);
    } else {
      const store = await cookies();
      cookieValue = store.get(SESSION_COOKIE)?.value ?? null;
    }

    if (!cookieValue) return null;

    const decoded = await adminAuth.verifySessionCookie(cookieValue, true);
    const doc = await adminDb.collection('usuarios').doc(decoded.uid).get();
    const data = doc.data() || {};

    const rolClaim = (decoded as unknown as { rol?: Rol }).rol;
    const rol = (data.rol || rolClaim || 'estudiante') as Rol;

    return {
      id: decoded.uid,
      uid: decoded.uid,
      email: decoded.email || data.email || '',
      nombre: data.nombre || decoded.name || '',
      rol,
      laboratoriosAsignados: data.laboratoriosAsignados || [],
      departamento: data.departamento || '',
    };
  } catch (e) {
    // cookie inválida/expirada
    return null;
  }
}

/** El portal es sólo para gestores y administradores. */
export const ROLES_PORTAL: Rol[] = ['gestor', 'admin'];

export function puedeGestionar(user: SessionUser | null): boolean {
  return !!user && ROLES_PORTAL.includes(user.rol);
}
