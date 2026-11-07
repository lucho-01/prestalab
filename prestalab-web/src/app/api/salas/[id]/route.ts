import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const updates = await request.json();

    const docRef = adminDb.collection('salas').doc(id);
    const snap = await docRef.get();

    if (!snap.exists) {
      return NextResponse.json({ success: false, error: 'Sala no encontrada' }, { status: 404 });
    }

    if (updates.capacidad) updates.capacidad = Number(updates.capacidad);

    await docRef.update({
      ...updates,
      updatedAt: new Date().toISOString(),
    });

    const updatedSnap = await docRef.get();
    return NextResponse.json({ success: true, data: { id: updatedSnap.id, ...updatedSnap.data() } });
  } catch (error: any) {
    console.error('Error updating sala:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await adminDb.collection('salas').doc(id).delete();
    return NextResponse.json({ success: true, message: 'Sala eliminada exitosamente' });
  } catch (error: any) {
    console.error('Error deleting sala:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

