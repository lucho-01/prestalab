import { NextRequest, NextResponse } from 'next/server';
import {
  authErrorMessage,
  identityConfigured,
  identityPasswordReset,
} from '@/lib/firebase-auth-rest';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const email = String(body.email || '').trim().toLowerCase();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { success: false, error: 'Ingresa un correo electrónico válido.' },
        { status: 400 },
      );
    }

    if (!identityConfigured()) {
      return NextResponse.json(
        { success: false, error: authErrorMessage('NO_API_KEY') },
        { status: 503 },
      );
    }

    const result = await identityPasswordReset(email);
    if (!result.ok) {
      return NextResponse.json(
        { success: false, error: authErrorMessage(result.code) },
        { status: result.code === 'EMAIL_NOT_FOUND' ? 404 : 400 },
      );
    }

    return NextResponse.json({
      success: true,
      message: `Enviamos un enlace de recuperación a ${email}.`,
    });
  } catch (error) {
    console.error('Error in mobile password reset:', error);
    return NextResponse.json(
      { success: false, error: 'Error inesperado al enviar el correo.' },
      { status: 500 },
    );
  }
}
