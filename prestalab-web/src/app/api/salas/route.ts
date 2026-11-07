import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { Sala } from '@/types';
import { requireAdmin, requireStaff } from '@/lib/guards';

/** Catálogo de salas: admin ve todo; gestor solo sus laboratorios. */
export async function GET(request: NextRequest) {
  const guard = await requireStaff(request);
  if ('response' in guard) return guard.response;

  try {
    const snapshot = await adminDb.collection('salas').get();
    let salas: Sala[] = snapshot.docs.map(
      (doc) =>
        ({
          id: doc.id,
          ...doc.data(),
        }) as Sala,
    );

    if (guard.user.rol !== 'admin') {
      const labs = guard.user.laboratoriosAsignados || [];
      salas = salas.filter((s) => labs.includes(s.id));
    }

    return NextResponse.json({ success: true, data: salas });
  } catch (error: any) {
    console.error('Error fetching salas:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}

/** Sólo el administrador crea laboratorios. */
export async function POST(request: NextRequest) {
  const guard = await requireAdmin(request);
  if ('response' in guard) return guard.response;

  try {
    const body = await request.json();
    const {
      nombre,
      codigo,
      edificio,
      capacidad,
      tipo,
      estado = 'disponible',
      gestorResponsableId,
      gestorNombre,
      descripcion = '',
    } = body;

    if (!nombre || !codigo || !capacidad || !tipo) {
      return NextResponse.json(
        { success: false, error: 'Nombre, código, capacidad y tipo son obligatorios' },
        { status: 400 },
      );
    }

    const docRef = adminDb.collection('salas').doc();
    const nuevaSala: Sala = {
      id: docRef.id,
      nombre,
      codigo: String(codigo).toUpperCase(),
      edificio: edificio || 'Campus Principal',
      capacidad: Number(capacidad),
      tipo,
      estado,
      gestorResponsableId: gestorResponsableId || undefined,
      gestorNombre: gestorNombre || undefined,
      equiposCount: 0,
      descripcion,
    };

    await docRef.set(nuevaSala);

    return NextResponse.json({ success: true, data: nuevaSala }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating sala:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}
