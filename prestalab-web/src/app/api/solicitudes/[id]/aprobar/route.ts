import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { requireStaff } from '@/lib/guards';

/**
 * Aprobación de una solicitud (sólo gestor/admin).
 * Una única transacción: estado + descuento de stock + notificación.
 * Idempotente: si ya estaba aprobada, no descuenta stock otra vez.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const guard = await requireStaff(request);
  if ('response' in guard) return guard.response;

  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const { nuevaSalaId, motivoReasignacion } = body;

    const resultado = await adminDb.runTransaction(async (tx) => {
      const solRef = adminDb.collection('prestamos').doc(id);
      const solSnap = await tx.get(solRef);

      if (!solSnap.exists) {
        throw Object.assign(new Error('Solicitud no encontrada'), { status: 404 });
      }
      const sol = solSnap.data() || {};

      if (sol.estado === 'activo' || sol.estado === 'aprobado') {
        return { yaAprobada: true, solicitud: sol };
      }
      if (sol.estado !== 'pendiente') {
        throw Object.assign(
          new Error(`No se puede aprobar una solicitud en estado "${sol.estado}".`),
          { status: 409 },
        );
      }

      const updates: Record<string, unknown> = {
        estado: 'activo',
        gestorId: guard.user.id,
        gestorNombre: guard.user.nombre || 'Gestor de Laboratorio',
        fechaAprobacion: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Reasignación opcional durante la aprobación
      if (nuevaSalaId && nuevaSalaId !== sol.salaId) {
        const salaRef = adminDb.collection('salas').doc(nuevaSalaId);
        const salaSnap = await tx.get(salaRef);
        if (!salaSnap.exists) {
          throw Object.assign(new Error('La sala de reasignación no existe'), { status: 404 });
        }
        updates.salaOriginalId = sol.salaId;
        updates.salaOriginalNombre = sol.salaNombre;
        updates.salaId = nuevaSalaId;
        updates.salaNombre = salaSnap.data()?.nombre;
        updates.fueReasignada = true;
        updates.motivoReasignacion =
          motivoReasignacion || 'Reasignación por disponibilidad y mantenimiento.';
      }

      // Stock: se descuenta UNA sola vez, dentro de la transacción
      if (sol.articuloId) {
        const artRef = adminDb.collection('articulos').doc(sol.articuloId);
        const artSnap = await tx.get(artRef);
        if (artSnap.exists) {
          const art = artSnap.data() || {};
          const disponible = Number(art.stock ?? 0);
          const cantidad = Number(sol.cantidad ?? 1);
          if (disponible < cantidad) {
            throw Object.assign(
              new Error(`Stock insuficiente de "${art.nombre || 'artículo'}".`),
              { status: 409 },
            );
          }
          tx.update(artRef, {
            stock: disponible - cantidad,
            updatedAt: new Date().toISOString(),
          });
        }
      }

      tx.update(solRef, updates);

      tx.set(adminDb.collection('notificaciones').doc(), {
        userId: sol.userId,
        tipo: updates.fueReasignada ? 'sala_modificada' : 'aprobada',
        titulo: updates.fueReasignada
          ? 'Sala Reasignada y Préstamo Aprobado'
          : '¡Préstamo Aprobado!',
        mensaje: updates.fueReasignada
          ? `Tu solicitud de ${sol.articuloNombre || 'espacio'} fue aprobada y reasignada a: ${updates.salaNombre}. Motivo: ${updates.motivoReasignacion}`
          : `Tu solicitud de ${sol.articuloNombre || 'espacio'} ha sido aprobada. Puedes utilizarlo en ${sol.salaNombre}.`,
        prestamoId: id,
        salaNombre: updates.salaNombre || sol.salaNombre,
        leida: false,
        fecha: new Date().toISOString(),
      });

      return { yaAprobada: false, updates };
    });

    return NextResponse.json({
      success: true,
      message: resultado.yaAprobada
        ? 'La solicitud ya estaba aprobada.'
        : 'Solicitud aprobada exitosamente',
      data: { id, ...resultado },
    });
  } catch (error: unknown) {
    const err = error as { message?: string; status?: number };
    console.error('Error approving solicitud:', err?.message);
    return NextResponse.json(
      { success: false, error: err?.message || 'Error al aprobar' },
      { status: err?.status || 500 },
    );
  }
}
