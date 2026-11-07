import { NextResponse } from 'next/server';
import { SessionUser, getSessionUser, puedeGestionar } from './session';

/** Respuesta estándar cuando no hay sesión válida. */
export function unauthorized() {
  return NextResponse.json(
    { success: false, error: 'Debes iniciar sesión.' },
    { status: 401 },
  );
}

export function forbidden(mensaje = 'No tienes permisos para esta acción.') {
  return NextResponse.json({ success: false, error: mensaje }, { status: 403 });
}

/**
 * Guard para rutas mutables: exige sesión válida y rol gestor/admin.
 * Devuelve el usuario o una NextResponse lista para retornar.
 */
export async function requireStaff(
  request: Request,
): Promise<{ user: SessionUser } | { response: NextResponse }> {
  const user = await getSessionUser(request);
  if (!user) return { response: unauthorized() };
  if (!puedeGestionar(user)) {
    return {
      response: forbidden('Sólo gestores y administradores pueden realizar esta acción.'),
    };
  }
  return { user };
}
