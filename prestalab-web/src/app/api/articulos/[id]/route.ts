import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const updates = await request.json();

    const docRef = adminDb.collection('articulos').doc(id);
    const snap = await docRef.get();

    if (!snap.exists) {
      return NextResponse.json({ success: false, error: 'Artículo no encontrado' }, { status: 404 });
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
    return NextResponse.json({ success: true, data: { id: updatedSnap.id, ...updatedSnap.data() } });
  } catch (error: any) {
    console.error('Error updating articulo:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await adminDb.collection('articulos').doc(id).delete();
    return NextResponse.json({ success: true, message: 'Artículo eliminado exitosamente' });
  } catch (error: any) {
    console.error('Error deleting articulo:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

