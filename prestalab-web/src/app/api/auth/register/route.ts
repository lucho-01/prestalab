import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';

/**
 * Registro de cuentas — mismo flujo que `registerUser` de la app móvil:
 *  1. Crea el usuario en Firebase Auth (Identity Toolkit).
 *  2. Guarda el perfil en `usuarios/{uid}` con rol `estudiante`.
 *
 * El portal web es para gestores/administradores; las cuentas creadas aquí
 * sirven para la app móvil (o quedan listas para que un admin suba el rol).
 */

const SIGNUP_URL = 'https://identitytoolkit.googleapis.com/v1/accounts:signUp';

const MENSAJES: Record<string, string> = {
  EMAIL_EXISTS: 'Ya existe una cuenta con este correo.',
  INVALID_EMAIL: 'El correo electrónico no es válido.',
  WEAK_PASSWORD: 'La contraseña debe tener al menos 6 caracteres.',
  OPERATION_NOT_ALLOWED:
    'El registro con correo y contraseña está deshabilitado en Firebase.',
  TOO_MANY_ATTEMPTS_TRY_LATER: 'Demasiados intentos. Intenta más tarde.',
};

const GENEROS = ['Masculino', 'Femenino', 'Otro'];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));

    const nombre = String(body.nombre || '').trim();
    const apellido = String(body.apellido || '').trim();
    const telefono = String(body.telefono || '').trim();
    const email = String(body.email || '').trim().toLowerCase();
    const password = String(body.password || '');
    const genero = GENEROS.includes(body.genero) ? body.genero : 'Otro';

    if (!nombre || !apellido || !telefono || !email || !password) {
      return NextResponse.json(
        { success: false, error: 'Por favor completa todos los campos.' },
        { status: 400 },
      );
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { success: false, error: 'Ingresa un correo electrónico válido.' },
        { status: 400 },
      );
    }

    if (telefono.replace(/\D/g, '').length < 10) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Ingresa un número de teléfono colombiano válido (ej. +57 300 123 4567).',
        },
        { status: 400 },
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { success: false, error: 'La contraseña debe tener al menos 6 caracteres.' },
        { status: 400 },
      );
    }

    const apiKey =
      process.env.NEXT_PUBLIC_FIREBASE_API_KEY || process.env.FIREBASE_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Falta NEXT_PUBLIC_FIREBASE_API_KEY en .env.local para registrar usuarios.',
        },
        { status: 503 },
      );
    }

    const displayName = `${nombre} ${apellido}`;

    // 1) Alta en Firebase Auth
    const authRes = await fetch(`${SIGNUP_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, displayName, returnSecureToken: true }),
    });
    const authData = await authRes.json();

    if (!authRes.ok || !authData.localId) {
      const code = authData?.error?.message || 'SIGNUP_FAILED';
      return NextResponse.json(
        {
          success: false,
          error: MENSAJES[code] || 'No se pudo crear la cuenta. Intenta de nuevo.',
        },
        { status: code === 'EMAIL_EXISTS' ? 409 : 400 },
      );
    }

    const uid = authData.localId as string;

    // 2) Perfil en Firestore (mismo esquema que la app móvil)
    try {
      await adminDb.collection('usuarios').doc(uid).set(
        {
          id: uid,
          nombre: displayName,
          email,
          telefono,
          genero,
          rol: 'estudiante',
          departamento: 'Estudiante',
          laboratoriosAsignados: [],
          createdAt: new Date().toISOString(),
        },
        { merge: true },
      );
    } catch (dbError) {
      // Sin perfil la cuenta no puede iniciar sesión: se revierte el alta.
      await adminAuth.deleteUser(uid).catch(() => {});
      console.error('[register] No se pudo guardar el perfil:', dbError);
      return NextResponse.json(
        {
          success: false,
          error:
            'No se pudo guardar el perfil en el sistema. Verifica la configuración de Firebase e intenta de nuevo.',
        },
        { status: 500 },
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Cuenta creada correctamente.',
        user: { id: uid, nombre: displayName, email, rol: 'estudiante' },
      },
      { status: 201 },
    );
  } catch (error: unknown) {
    console.error('Error in register route:', error);
    return NextResponse.json(
      { success: false, error: 'Error inesperado al crear la cuenta.' },
      { status: 500 },
    );
  }
}
