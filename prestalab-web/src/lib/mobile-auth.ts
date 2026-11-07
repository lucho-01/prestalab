import { createHmac, timingSafeEqual } from 'crypto';
import { NextResponse } from 'next/server';
import { adminDb } from './firebase-admin';
import type { Rol, SessionUser } from './session';

/**
 * Sesión de la app móvil: JWT propio (HS256) emitido por este backend.
 * La app nunca habla con Firebase; sólo envía `Authorization: Bearer <token>`.
 */
const SECRET = () => (process.env.AUTH_SECRET || '').trim();
export const MOBILE_TOKEN_TTL_SECONDS = 60 * 60 * 24 * 30; // 30 días
const AUDIENCE = 'prestalab-mobile';

export interface MobileUser extends SessionUser {
  telefono: string;
  genero: string;
  displayName: string;
}

export function isMobileAuthConfigured(): boolean {
  return SECRET().length >= 16;
}

function b64url(input: string): string {
  return Buffer.from(input, 'utf8').toString('base64url');
}

export function signMobileToken(uid: string): string {
  const secret = SECRET();
  if (!secret) throw new Error('AUTH_SECRET no está configurado.');

  const header = b64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const now = Math.floor(Date.now() / 1000);
  const payload = b64url(
    JSON.stringify({
      sub: uid,
      iat: now,
      exp: now + MOBILE_TOKEN_TTL_SECONDS,
      aud: AUDIENCE,
    }),
  );
  const signature = createHmac('sha256', secret)
    .update(`${header}.${payload}`)
    .digest('base64url');

  return `${header}.${payload}.${signature}`;
}

export function verifyMobileToken(token: string): string | null {
  const secret = SECRET();
  if (!secret || !token) return null;

  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const [header, payload, signature] = parts;

  const expected = createHmac('sha256', secret)
    .update(`${header}.${payload}`)
    .digest('base64url');

  const receivedBuf = Buffer.from(signature, 'utf8');
  const expectedBuf = Buffer.from(expected, 'utf8');
  if (
    receivedBuf.length !== expectedBuf.length ||
    !timingSafeEqual(receivedBuf, expectedBuf)
  ) {
    return null;
  }

  try {
    const claims = JSON.parse(
      Buffer.from(payload, 'base64url').toString('utf8'),
    ) as { sub?: unknown; exp?: unknown; aud?: unknown };

    if (claims.aud !== AUDIENCE) return null;
    if (typeof claims.exp !== 'number') return null;
    if (claims.exp < Math.floor(Date.now() / 1000)) return null;
    return typeof claims.sub === 'string' ? claims.sub : null;
  } catch {
    return null;
  }
}

export function toMobileUser(uid: string, data: Record<string, any>): MobileUser {
  const nombre = String(data.nombre || '');
  return {
    id: uid,
    uid,
    email: String(data.email || ''),
    nombre,
    displayName: nombre,
    telefono: String(data.telefono || ''),
    genero: String(data.genero || 'Otro'),
    rol: (data.rol || 'estudiante') as Rol,
    laboratoriosAsignados: Array.isArray(data.laboratoriosAsignados)
      ? data.laboratoriosAsignados
      : [],
    departamento: String(data.departamento || ''),
  };
}

export async function mobileUserFromFirestore(
  uid: string,
): Promise<MobileUser | null> {
  const doc = await adminDb.collection('usuarios').doc(uid).get();
  if (!doc.exists) return null;
  return toMobileUser(uid, doc.data() || {});
}

function unauthorized(mensaje: string, status = 401) {
  return NextResponse.json({ success: false, error: mensaje }, { status });
}

/**
 * Guard de las rutas móviles: exige Bearer token válido y perfil existente.
 */
export async function requireMobileAuth(
  request: Request,
): Promise<{ user: MobileUser } | { response: NextResponse }> {
  if (!isMobileAuthConfigured()) {
    return {
      response: unauthorized(
        'El servidor no tiene AUTH_SECRET configurado para sesiones móviles.',
        503,
      ),
    };
  }

  const header = request.headers.get('authorization') || '';
  const token = header.startsWith('Bearer ') ? header.slice(7).trim() : '';
  if (!token) return { response: unauthorized('Debes iniciar sesión.') };

  const uid = verifyMobileToken(token);
  if (!uid) {
    return {
      response: unauthorized('Tu sesión expiró. Vuelve a iniciar sesión.'),
    };
  }

  try {
    const user = await mobileUserFromFirestore(uid);
    if (!user) {
      return {
        response: unauthorized('Tu cuenta no tiene perfil en el sistema.', 403),
      };
    }
    return { user };
  } catch (error) {
    console.error('[mobile-auth] Error leyendo perfil:', error);
    return {
      response: unauthorized('No se pudo verificar la sesión.', 500),
    };
  }
}
