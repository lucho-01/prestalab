import { NextRequest, NextResponse } from 'next/server';
import {
  authErrorMessage,
  identityConfigured,
  identitySignIn,
} from '@/lib/firebase-auth-rest';
import {
  isMobileAuthConfigured,
  mobileUserFromFirestore,
  signMobileToken,
} from '@/lib/mobile-auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const email = String(body.email || '').trim().toLowerCase();
    const password = String(body.password || '');

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Por favor completa todos los campos.' },
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

    const result = await identitySignIn(email, password);
    if (!result.ok) {
      return NextResponse.json(
        { success: false, error: authErrorMessage(result.code) },
        { status: 401 },
      );
    }

    const uid = String(result.data.localId || '');
    if (!uid) {
      return NextResponse.json(
        { success: false, error: 'Respuesta inválida de Firebase Auth.' },
        { status: 502 },
      );
    }

    const user = await mobileUserFromFirestore(uid);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Tu cuenta no tiene perfil en el sistema.' },
        { status: 403 },
      );
    }

    const token = signMobileToken(uid);

    return NextResponse.json({
      success: true,
      message: `Bienvenido, ${user.nombre || email}.`,
      token,
      user,
    });
  } catch (error) {
    console.error('Error in mobile login:', error);
    return NextResponse.json(
      { success: false, error: 'Error inesperado al iniciar sesión.' },
      { status: 500 },
    );
  }
}
