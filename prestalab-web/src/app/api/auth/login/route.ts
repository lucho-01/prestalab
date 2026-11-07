import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { clearSessionCookie, setSessionCookie } from '@/lib/session';

const IDENTITY_URL = 'https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const email = String(body.email || '').trim().toLowerCase();
    const password = String(body.password || '');

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Ingresa tu correo institucional y contraseña.' },
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
            'Falta NEXT_PUBLIC_FIREBASE_API_KEY en .env.local para autenticar con Firebase.',
        },
        { status: 503 },
      );
    }

    // 1) Verificación real de credenciales contra Firebase Auth
    const authRes = await fetch(`${IDENTITY_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, returnSecureToken: true }),
    });
    const authData = await authRes.json();

    if (!authRes.ok || !authData.idToken) {
      const code = authData?.error?.message || 'INVALID_LOGIN_CREDENTIALS';
      const mensajes: Record<string, string> = {
        EMAIL_NOT_FOUND: 'No existe una cuenta con este correo.',
        INVALID_PASSWORD: 'Contraseña incorrecta.',
        INVALID_LOGIN_CREDENTIALS: 'Correo o contraseña incorrectos.',
        USER_DISABLED: 'Esta cuenta está deshabilitada.',
        TOO_MANY_ATTEMPTS_TRY_LATER: 'Demasiados intentos. Intenta más tarde.',
      };
      return NextResponse.json(
        { success: false, error: mensajes[code] || 'No se pudo iniciar sesión.' },
        { status: 401 },
      );
    }

    // 2) Perfil y rol desde Firestore (el rol manda sobre el claim si difieren)
    const uid = authData.localId as string;
    const doc = await adminDb.collection('usuarios').doc(uid).get();
    const data = doc.exists ? doc.data() : null;

    if (!data) {
      await adminAuth.deleteUser(uid).catch(() => {});
      await clearSessionCookie();
      return NextResponse.json(
        { success: false, error: 'Tu cuenta no tiene perfil en el sistema.' },
        { status: 403 },
      );
    }

    const rol = data?.rol || 'estudiante';
    if (rol !== 'gestor' && rol !== 'admin') {
      await clearSessionCookie();
      return NextResponse.json(
        {
          success: false,
          error:
            'El panel web es exclusivo para gestores y administradores. Usa la app móvil como estudiante.',
        },
        { status: 403 },
      );
    }

    // 3) Cookie de sesión httpOnly firmada por Firebase
    await setSessionCookie(authData.idToken);

    return NextResponse.json({
      success: true,
      message: `Bienvenido, ${data.nombre || email}.`,
      user: {
        id: uid,
        nombre: data.nombre || '',
        email: data.email || email,
        rol,
        laboratoriosAsignados: data.laboratoriosAsignados || [],
        departamento: data.departamento || '',
      },
    });
  } catch (error: unknown) {
    console.error('Error in login route:', error);
    const message = error instanceof Error ? error.message : 'Error inesperado';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
