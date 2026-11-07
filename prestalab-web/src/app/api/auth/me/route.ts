import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/session';

export async function GET(request: NextRequest) {
  try {
    const user = await getSessionUser(request);

    if (!user) {
      return NextResponse.json({ success: false, user: null }, { status: 401 });
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        nombre: user.nombre,
        email: user.email,
        rol: user.rol,
        laboratoriosAsignados: user.laboratoriosAsignados,
        departamento: user.departamento,
      },
    });
  } catch (error: unknown) {
    console.error('Error in me route:', error);
    return NextResponse.json({ success: false, user: null }, { status: 401 });
  }
}
