import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { forbidden, requireStaff, staffPuedeSala } from '@/lib/guards';

/** Edición de sala: admin todo; gestor solo sus salas y campos operativos. */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const guard = await requireStaff(request);
  if ('response' in guard) return guard.response;

  try {
    const { id } = await params;

    if (!staffPuedeSala(guard.user, id)) {
      return forbidden('No puedes modificar un laboratorio que no supervisas.');
    }

    const body = await request.json();
    const updates: Record<string, any> = { ...body };

    // El gestor sólo puede actualizar el estado operativo y la descripción.
    if (guard.user.rol !== 'admin') {
      const permitidos = ['estado', 'descripcion'];
      for (const key of Object.keys(updates)) {
        if (!permitidos.includes(key)) delete updates[key];
      }
    }

    const docRef = adminDb.collection('salas').doc(id);
    const snap = await docRef.get();

    if (!snap.exists) {
      return NextResponse.json(
        { success: false, error: 'Sala no encontrada' },
        { status: 404 },
      );
    }

    if (updates.capacidad) updates.capacidad = Number(updates.capacidad);
    if (updates.codigo) updates.codigo = String(updates.codigo).toUpperCase();

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
    console.error('Error updating sala:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}
