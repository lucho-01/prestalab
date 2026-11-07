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

/** Guard exclusivo del administrador (gestión de usuarios y configuración). */
export async function requireAdmin(
  request: Request,
): Promise<{ user: SessionUser } | { response: NextResponse }> {
  const user = await getSessionUser(request);
  if (!user) return { response: unauthorized() };
  if (user.rol !== 'admin') {
    return { response: forbidden('Sólo un administrador puede realizar esta acción.') };
  }
  return { user };
}

/**
 * Alcance por laboratorio: el admin opera sobre cualquier sala; el gestor
 * únicamente sobre las que tiene asignadas.
 */
export function staffPuedeSala(user: SessionUser, salaId?: string): boolean {
  if (user.rol === 'admin') return true;
  if (!salaId) return false;
  return (user.laboratoriosAsignados || []).includes(salaId);
}
