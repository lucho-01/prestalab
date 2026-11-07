import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { Usuario } from '@/types';
import { requireAdmin } from '@/lib/guards';

const ROLES_STAFF = ['admin', 'gestor'];

/** Listado de usuarios del portal: sólo administradores. */
export async function GET(request: NextRequest) {
  const guard = await requireAdmin(request);
  if ('response' in guard) return guard.response;

  try {
    const { searchParams } = new URL(request.url);
    const rol = searchParams.get('rol');

    let query: FirebaseFirestore.Query = adminDb.collection('usuarios');

    if (rol && rol !== 'todos') {
      query = query.where('rol', '==', rol);
    }

    const snapshot = await query.get();
    const usuarios: Usuario[] = snapshot.docs.map(
      (doc) =>
        ({
          id: doc.id,
          ...doc.data(),
        }) as Usuario,
    );

    return NextResponse.json({ success: true, data: usuarios });
  } catch (error: any) {
    console.error('Error fetching usuarios:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}

/** Genera una contraseña temporal legible para entregar al nuevo usuario. */
function passwordTemporal(): string {
  const mayus = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const minus = 'abcdefghijkmnopqrstuvwxyz';
  const nums = '23456789';
  const pick = (set: string, n: number) =>
    Array.from(
      { length: n },
      () => set[Math.floor(Math.random() * set.length)],
    ).join('');
  return `${pick(mayus, 2)}${pick(minus, 4)}${pick(nums, 3)}!`;
}

/**
 * Alta real de staff: crea la cuenta en Firebase Auth (con contraseña
 * temporal), guarda el perfil y fija el custom claim `rol`.
 * Sólo administradores. El portal web no crea estudiantes.
 */
export async function POST(request: NextRequest) {
  const guard = await requireAdmin(request);
  if ('response' in guard) return guard.response;

  try {
    const body = await request.json();
    const {
      nombre,
      email,
      telefono = '',
      genero = 'Masculino',
      rol = 'gestor',
      departamento = '',
      laboratoriosAsignados = [],
      matriculaOCodigo,
    } = body;

    const correo = String(email || '').trim().toLowerCase();
    if (!nombre || !correo) {
      return NextResponse.json(
        { success: false, error: 'Nombre y correo son obligatorios' },
        { status: 400 },
      );
    }
    if (!ROLES_STAFF.includes(rol)) {
      return NextResponse.json(
        { success: false, error: 'El portal sólo admite roles gestor o admin.' },
        { status: 400 },
      );
    }

    const password = passwordTemporal();

    let userRecord;
    try {
      userRecord = await adminAuth.createUser({
        email: correo,
        password,
        displayName: nombre,
        emailVerified: false,
      });
    } catch (error: any) {
      if (error?.code === 'auth/email-already-exists') {
        return NextResponse.json(
          { success: false, error: 'Ya existe una cuenta con este correo.' },
          { status: 409 },
        );
      }
      throw error;
    }

    await adminAuth.setCustomUserClaims(userRecord.uid, { rol });

    const nuevoUsuario: Usuario = {
      id: userRecord.uid,
      nombre,
      email: correo,
      telefono: telefono || '',
      genero,
      rol,
      departamento: departamento || 'Facultad de Ingeniería',
      matriculaOCodigo:
        matriculaOCodigo || `USR-${Math.floor(100 + Math.random() * 900)}`,
      laboratoriosAsignados: rol === 'gestor' ? laboratoriosAsignados : [],
      createdAt: new Date().toISOString(),
    };

    await adminDb.collection('usuarios').doc(userRecord.uid).set(nuevoUsuario);

    return NextResponse.json(
      {
        success: true,
        data: nuevoUsuario,
        // Se muestra una sola vez al administrador para entregarla al usuario.
        passwordTemporal: password,
        message:
          'Cuenta creada. Comparte la contraseña temporal y pide cambiarla al primer ingreso.',
      },
      { status: 201 },
    );
  } catch (error: any) {
    console.error('Error creating usuario:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}
