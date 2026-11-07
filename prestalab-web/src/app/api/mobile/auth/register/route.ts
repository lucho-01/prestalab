import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import {
  authErrorMessage,
  identityConfigured,
  identitySignUp,
} from '@/lib/firebase-auth-rest';
import {
  isMobileAuthConfigured,
  mobileUserFromFirestore,
  signMobileToken,
} from '@/lib/mobile-auth';

const GENEROS = ['Masculino', 'Femenino', 'Otro'];

/**
 * Registro desde la app móvil. Mismo esquema que el registro web:
 * cuenta en Firebase Auth + doc `usuarios` con rol estudiante.
 */
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

    if (!isMobileAuthConfigured()) {
      return NextResponse.json(
        {
          success: false,
          error: 'El servidor no tiene AUTH_SECRET configurado para la app móvil.',
        },
        { status: 503 },
      );
    }

    if (!identityConfigured()) {
      return NextResponse.json(
        { success: false, error: authErrorMessage('NO_API_KEY') },
        { status: 503 },
      );
    }

    const displayName = `${nombre} ${apellido}`;
    const result = await identitySignUp(email, password, displayName);

    if (!result.ok) {
      return NextResponse.json(
        { success: false, error: authErrorMessage(result.code) },
        { status: result.code === 'EMAIL_EXISTS' ? 409 : 400 },
      );
    }

    const uid = String(result.data.localId || '');
    if (!uid) {
      return NextResponse.json(
        { success: false, error: 'Respuesta inválida de Firebase Auth.' },
        { status: 502 },
      );
    }

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
      await adminAuth.deleteUser(uid).catch(() => {});
      console.error('[mobile register] No se pudo guardar el perfil:', dbError);
      return NextResponse.json(
        {
          success: false,
          error:
            'No se pudo guardar el perfil en el sistema. Verifica la configuración de Firebase e intenta de nuevo.',
        },
        { status: 500 },
      );
    }

    const user = await mobileUserFromFirestore(uid);
    const token = signMobileToken(uid);

    return NextResponse.json(
      {
        success: true,
        message: 'Cuenta creada correctamente.',
        token,
        user,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error('Error in mobile register:', error);
    return NextResponse.json(
      { success: false, error: 'Error inesperado al crear la cuenta.' },
      { status: 500 },
    );
  }
}
