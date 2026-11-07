import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { Sala } from '@/types';

export async function GET() {
  try {
    const snapshot = await adminDb.collection('salas').get();
    const salas: Sala[] = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    } as Sala));

    return NextResponse.json({ success: true, data: salas });
  } catch (error: any) {
    console.error('Error fetching salas:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
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
        { status: 400 }
      );
    }

    const docRef = adminDb.collection('salas').doc();
    const nuevaSala: Sala = {
      id: docRef.id,
      nombre,
      codigo: codigo.toUpperCase(),
      edificio: edificio || 'Campus Principal',
      capacidad: Number(capacidad),
      tipo,
      estado,
      gestorResponsableId,
      gestorNombre,
      equiposCount: 0,
      descripcion,
    };

    await docRef.set(nuevaSala);

    return NextResponse.json({ success: true, data: nuevaSala }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating sala:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

