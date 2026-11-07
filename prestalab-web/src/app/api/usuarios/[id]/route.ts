import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { requireAdmin } from '@/lib/guards';

const ROLES_STAFF = ['admin', 'gestor'];
const CAMPOS_PERMITIDOS = [
  'nombre',
  'telefono',
  'genero',
  'rol',
  'departamento',
  'laboratoriosAsignados',
  'matriculaOCodigo',
];

/** Actualización de un usuario del portal: sólo administradores. */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const guard = await requireAdmin(request);
  if ('response' in guard) return guard.response;

  try {
    const { id } = await params;
    const body = await request.json();

    const docRef = adminDb.collection('usuarios').doc(id);
    const snap = await docRef.get();

    if (!snap.exists) {
      return NextResponse.json(
        { success: false, error: 'Usuario no encontrado' },
        { status: 404 },
      );
    }

    const actual = snap.data() || {};
    const updates: Record<string, any> = {};

    for (const key of CAMPOS_PERMITIDOS) {
      if (body[key] !== undefined) updates[key] = body[key];
    }

    if (updates.rol !== undefined && !ROLES_STAFF.includes(updates.rol)) {
      return NextResponse.json(
        { success: false, error: 'El portal sólo admite roles gestor o admin.' },
        { status: 400 },
      );
    }

    // Un administrador no puede quitarse a sí mismo el rol.
    if (id === guard.user.uid && updates.rol && updates.rol !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'No puedes cambiar tu propio rol de administrador.' },
        { status: 409 },
      );
    }

    if (updates.rol && updates.rol !== actual.rol) {
      await adminAuth.setCustomUserClaims(id, { rol: updates.rol });
    }

    if (updates.rol === 'admin') updates.laboratoriosAsignados = [];
    if (updates.rol === 'gestor' && !Array.isArray(updates.laboratoriosAsignados)) {
      updates.laboratoriosAsignados = actual.laboratoriosAsignados || [];
    }

    await docRef.update({
      ...updates,
      updatedAt: new Date().toISOString(),
    });

    const updatedSnap = await docRef.get();
    return NextResponse.json({
      success: true,
      data: { id: updatedSnap.id, ...updatedSnap.data() },
    });
  } catch (error: any) {
    console.error('Error updating usuario:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}
