import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { requireStaff } from '@/lib/guards';

/** Reasignación de sala con motivo obligatorio (gestor/admin). */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const guard = await requireStaff(request);
  if ('response' in guard) return guard.response;

  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const nuevaSalaId = String(body.nuevaSalaId || '');
    const motivoReasignacion = String(body.motivoReasignacion || '').trim();

    if (!nuevaSalaId || !motivoReasignacion) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Debe especificar la nueva sala y el motivo institucional de la reasignación.',
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

    const salaSnap = await adminDb.collection('salas').doc(nuevaSalaId).get();
    if (!salaSnap.exists) {
      return NextResponse.json(
        { success: false, error: 'La nueva sala seleccionada no existe' },
        { status: 404 },
      );
    }
    const nuevaSala = salaSnap.data() || {};

    const updates = {
      salaOriginalId: sol.salaOriginalId || sol.salaId,
      salaOriginalNombre: sol.salaOriginalNombre || sol.salaNombre,
      salaId: nuevaSalaId,
      salaNombre: nuevaSala.nombre,
      fueReasignada: true,
      motivoReasignacion,
      gestorId: guard.user.id,
      gestorNombre: guard.user.nombre || sol.gestorNombre || 'Gestor de Laboratorio',
      updatedAt: new Date().toISOString(),
    };

    const batch = adminDb.batch();
    batch.update(solRef, updates);
    batch.set(adminDb.collection('notificaciones').doc(), {
      userId: sol.userId,
      tipo: 'sala_modificada',
      titulo: 'Espacio Reasignado por el Gestor',
      mensaje: `Tu solicitud ha sido reasignada a la sala "${nuevaSala.nombre}" (Original: ${updates.salaOriginalNombre}). Motivo: ${motivoReasignacion}`,
      prestamoId: id,
      salaNombre: nuevaSala.nombre,
      leida: false,
      fecha: new Date().toISOString(),
    });
    await batch.commit();

    return NextResponse.json({
      success: true,
      message: `Sala reasignada exitosamente a ${nuevaSala.nombre}.`,
      data: { id, ...updates },
    });
  } catch (error: unknown) {
    const err = error as { message?: string };
    console.error('Error reassigning room:', err?.message);
    return NextResponse.json(
      { success: false, error: err?.message || 'Error al reasignar' },
      { status: 500 },
    );
  }
}
