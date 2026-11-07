import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { Articulo } from '@/types';
import { forbidden, requireStaff, staffPuedeSala } from '@/lib/guards';

/** Inventario: admin ve todo; gestor solo los activos de sus laboratorios. */
export async function GET(request: NextRequest) {
  const guard = await requireStaff(request);
  if ('response' in guard) return guard.response;

  try {
    const { searchParams } = new URL(request.url);
    const salaId = searchParams.get('salaId');
    const categoria = searchParams.get('categoria');

    let query: FirebaseFirestore.Query = adminDb.collection('articulos');

    if (salaId && salaId !== 'todas') {
      query = query.where('salaId', '==', salaId);
    }
    if (categoria && categoria !== 'Todas') {
      query = query.where('categoria', '==', categoria);
    }

    const snapshot = await query.get();
    let articulos: Articulo[] = snapshot.docs.map(
      (doc) =>
        ({
          id: doc.id,
          ...doc.data(),
        }) as Articulo,
    );

    if (guard.user.rol !== 'admin') {
      const labs = guard.user.laboratoriosAsignados || [];
      articulos = articulos.filter((a) => labs.includes(a.salaId));
    }

    return NextResponse.json({ success: true, data: articulos });
  } catch (error: any) {
    console.error('Error fetching articulos:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}

/** Alta de inventario: staff, limitado a sus laboratorios si es gestor. */
export async function POST(request: NextRequest) {
  const guard = await requireStaff(request);
  if ('response' in guard) return guard.response;

  try {
    const body = await request.json();
    const {
      nombre,
      categoria,
      salaId,
      salaNombre,
      stock,
      stockTotal,
      estado = 'operativo',
      condicion = 'buen_estado',
      fechaRegistro,
      descripcion = '',
      codigoActivo,
    } = body;

    if (!nombre || !categoria || !salaId || stock === undefined) {
      return NextResponse.json(
        { success: false, error: 'Nombre, categoría, salaId y stock son obligatorios' },
        { status: 400 },
      );
    }

    if (!staffPuedeSala(guard.user, salaId)) {
      return forbidden('No puedes agregar inventario a un laboratorio que no supervisas.');
    }

    // Resolver nombre de la sala si no viene
    let nombreFinalSala = salaNombre;
    if (!nombreFinalSala) {
      const salaDoc = await adminDb.collection('salas').doc(salaId).get();
      if (salaDoc.exists) {
        nombreFinalSala = salaDoc.data()?.nombre;
      }
    }

    const docRef = adminDb.collection('articulos').doc();
    const nuevoArticulo: Articulo = {
      id: docRef.id,
      nombre,
      categoria,
      salaId,
      salaNombre: nombreFinalSala || 'Laboratorio',
      stock: Number(stock),
      stockTotal: Number(stockTotal || stock),
      estado,
      condicion,
      fechaRegistro: fechaRegistro || new Date().toISOString().split('T')[0],
      descripcion,
      codigoActivo: codigoActivo || `ACT-${Math.floor(1000 + Math.random() * 9000)}`,
    };

    await docRef.set(nuevoArticulo);

    return NextResponse.json({ success: true, data: nuevoArticulo }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating articulo:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}
