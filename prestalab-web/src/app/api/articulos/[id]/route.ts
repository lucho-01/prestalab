import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { forbidden, requireAdmin, requireStaff, staffPuedeSala } from '@/lib/guards';

/** Edición de un activo: staff, limitado a sus laboratorios si es gestor. */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const guard = await requireStaff(request);
  if ('response' in guard) return guard.response;

  try {
    const { id } = await params;
    const updates = await request.json();

    const docRef = adminDb.collection('articulos').doc(id);
    const snap = await docRef.get();

    if (!snap.exists) {
      return NextResponse.json(
        { success: false, error: 'Artículo no encontrado' },
        { status: 404 },
      );
    }

    const actual = snap.data() || {};
    if (!staffPuedeSala(guard.user, actual.salaId)) {
      return forbidden('No puedes modificar inventario de un laboratorio que no supervisas.');
    }
    if (updates.salaId && !staffPuedeSala(guard.user, updates.salaId)) {
      return forbidden('No puedes mover el activo a un laboratorio que no supervisas.');
    }

    if (updates.stock !== undefined) updates.stock = Number(updates.stock);
    if (updates.stockTotal !== undefined) updates.stockTotal = Number(updates.stockTotal);

    if (updates.salaId && !updates.salaNombre) {
      const salaDoc = await adminDb.collection('salas').doc(updates.salaId).get();
      if (salaDoc.exists) {
        updates.salaNombre = salaDoc.data()?.nombre;
      }
    }

    await docRef.update({
      ...updates,
      updatedAt: new Date().toISOString(),
    });

    const updatedSnap = await docRef.get();
    return NextResponse.json({
      success: true,
      data: { id: updatedSnap.id, ...updatedSnap.data() },
    });
  } catch (error: any) {
    console.error('Error updating articulo:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}

/** Sólo el administrador elimina activos del inventario. */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const guard = await requireAdmin(request);
  if ('response' in guard) return guard.response;

  try {
    const { id } = await params;
    await adminDb.collection('articulos').doc(id).delete();
    return NextResponse.json({
      success: true,
      message: 'Artículo eliminado exitosamente',
    });
  } catch (error: any) {
    console.error('Error deleting articulo:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}
