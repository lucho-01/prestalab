import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { requireStaff } from '@/lib/guards';

/** Rechazo de una solicitud con justificación obligatoria (gestor/admin). */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const guard = await requireStaff(request);
  if ('response' in guard) return guard.response;

  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const motivoRechazo = String(body.motivoRechazo || '').trim();

    if (motivoRechazo.length < 5) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Debe proporcionar un motivo justificativo detallado para rechazar la solicitud.',
        },
        { status: 400 },
      );
    }

    const solRef = adminDb.collection('prestamos').doc(id);
    const solSnap = await solRef.get();
    if (!solSnap.exists) {
      return NextResponse.json(
        { success: false, error: 'Solicitud no encontrada' },
        { status: 404 },
      );
    }

    const sol = solSnap.data() || {};
    if (sol.estado !== 'pendiente') {
      return NextResponse.json(
        { success: false, error: `La solicitud ya está en estado "${sol.estado}".` },
        { status: 409 },
      );
    }

    const updates = {
      estado: 'rechazado',
      gestorId: guard.user.id,
      gestorNombre: guard.user.nombre || 'Gestor de Laboratorio',
      motivoRechazo,
      fechaRechazo: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const batch = adminDb.batch();
    batch.update(solRef, updates);
    batch.set(adminDb.collection('notificaciones').doc(), {
      userId: sol.userId,
      tipo: 'rechazada',
      titulo: 'Solicitud Denegada',
      mensaje: `Tu solicitud de ${sol.articuloNombre || 'espacio'} fue denegada por el gestor. Justificación: ${motivoRechazo}`,
      prestamoId: id,
      salaNombre: sol.salaNombre,
      leida: false,
      fecha: new Date().toISOString(),
    });
    await batch.commit();

    return NextResponse.json({
      success: true,
      message: 'Solicitud rechazada con justificación debidamente registrada.',
      data: { id, ...updates },
    });
  } catch (error: unknown) {
    const err = error as { message?: string };
    console.error('Error rejecting solicitud:', err?.message);
    return NextResponse.json(
      { success: false, error: err?.message || 'Error al rechazar' },
      { status: 500 },
    );
  }
}
