import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { forbidden, requireStaff, staffPuedeSala } from '@/lib/guards';

/**
 * Devolución de un préstamo (sólo gestor/admin).
 * Una única transacción: estado + restauración de stock + notificación.
 * Idempotente: si ya estaba devuelto, no vuelve a sumar stock.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const guard = await requireStaff(request);
  if ('response' in guard) return guard.response;

  try {
    const { id } = await params;

    const resultado = await adminDb.runTransaction(async (tx) => {
      const solRef = adminDb.collection('prestamos').doc(id);
      const solSnap = await tx.get(solRef);

      if (!solSnap.exists) {
        throw Object.assign(new Error('Préstamo no encontrado'), { status: 404 });
      }
      const sol = solSnap.data() || {};

      if (sol.estado === 'devuelto') {
        return { yaDevuelto: true };
      }
      if (sol.estado !== 'activo') {
        throw Object.assign(
          new Error(`No se puede devolver un préstamo en estado "${sol.estado}".`),
          { status: 409 },
        );
      }
      if (!staffPuedeSala(guard.user, sol.salaId)) {
        throw Object.assign(
          new Error('Este préstamo no pertenece a tus laboratorios asignados.'),
          { status: 403 },
        );
      }

      // Restaurar stock del artículo (una sola vez)
      if (sol.articuloId) {
        const artRef = adminDb.collection('articulos').doc(sol.articuloId);
        const artSnap = await tx.get(artRef);
        if (artSnap.exists) {
          const art = artSnap.data() || {};
          const stock = Number(art.stock ?? 0);
          const stockTotal = Number(art.stockTotal ?? stock);
          const cantidad = Number(sol.cantidad ?? 1);
          tx.update(artRef, {
            stock: Math.min(stock + cantidad, stockTotal),
            updatedAt: new Date().toISOString(),
          });
        }
      }

      const fechaDevolucion = new Date().toISOString();
      tx.update(solRef, {
        estado: 'devuelto',
        fechaDevolucion,
        gestorId: guard.user.id,
        gestorNombre: guard.user.nombre || 'Gestor de Laboratorio',
        updatedAt: fechaDevolucion,
      });

      tx.set(adminDb.collection('notificaciones').doc(), {
        userId: sol.userId,
        tipo: 'devuelta',
        titulo: 'Devolución Registrada',
        mensaje: `Tu préstamo de ${sol.articuloNombre || 'espacio'} en ${sol.salaNombre || 'el laboratorio'} fue registrado como devuelto.`,
        prestamoId: id,
        salaNombre: sol.salaNombre,
        leida: false,
        fecha: fechaDevolucion,
      });

      return { yaDevuelto: false, fechaDevolucion };
    });

    return NextResponse.json({
      success: true,
      message: resultado.yaDevuelto
        ? 'El préstamo ya estaba devuelto.'
        : 'Devolución registrada exitosamente.',
      data: { id, ...resultado },
    });
  } catch (error: unknown) {
    const err = error as { message?: string; status?: number };
    console.error('Error devolviendo préstamo:', err?.message);
    if (err?.status === 403) return forbidden(err.message);
    return NextResponse.json(
      { success: false, error: err?.message || 'Error al registrar la devolución' },
      { status: err?.status || 500 },
    );
  }
}
