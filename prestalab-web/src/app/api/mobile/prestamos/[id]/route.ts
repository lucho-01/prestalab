import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { requireMobileAuth } from '@/lib/mobile-auth';

const DEVOLUBLES = ['activo', 'aprobado'];

/**
 * Actualización de un préstamo desde la app móvil.
 * Sólo el dueño puede registrar la devolución; el resto de campos se ignora.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const guard = await requireMobileAuth(request);
  if ('response' in guard) return guard.response;

  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));

    const docRef = adminDb.collection('prestamos').doc(id);
    const snap = await docRef.get();

    if (!snap.exists) {
      return NextResponse.json(
        { success: false, error: 'Solicitud no encontrada.' },
        { status: 404 },
      );
    }

    const data = snap.data() || {};

    if (data.userId !== guard.user.uid) {
      return NextResponse.json(
        { success: false, error: 'No puedes modificar un préstamo de otro usuario.' },
        { status: 403 },
      );
    }

    const estado = String(body.estado || '');
    if (estado !== 'devuelto') {
      return NextResponse.json(
        {
          success: false,
          error: 'Desde la app móvil sólo puedes registrar devoluciones.',
        },
        { status: 400 },
      );
    }

    if (data.estado === 'devuelto') {
      return NextResponse.json({
        success: true,
        duplicate: true,
        data: { id, ...data },
      });
    }

    if (!DEVOLUBLES.includes(data.estado)) {
      return NextResponse.json(
        {
          success: false,
          error: `No se puede devolver un préstamo en estado "${data.estado}".`,
        },
        { status: 409 },
      );
    }

    const ahora = new Date().toISOString();
    const updates = {
      estado: 'devuelto',
      fechaDevolucion: ahora,
      updatedAt: ahora,
    };

    await docRef.update(updates);

    return NextResponse.json({
      success: true,
      data: { id, ...data, ...updates },
    });
  } catch (error) {
    console.error('[mobile prestamos:update] Error:', error);
    return NextResponse.json(
      { success: false, error: 'No se pudo actualizar el préstamo.' },
      { status: 500 },
    );
  }
}
