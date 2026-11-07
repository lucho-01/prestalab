import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { SolicitudPrestamo } from '@/types';
import { requireStaff } from '@/lib/guards';

/**
 * Listado de préstamos para el portal web (solo staff).
 * - admin: ve todo.
 * - gestor: solo los préstamos de los laboratorios que supervisa.
 * La creación de solicitudes se hace exclusivamente desde la app móvil.
 */
export async function GET(request: NextRequest) {
  const guard = await requireStaff(request);
  if ('response' in guard) return guard.response;

  try {
    const { searchParams } = new URL(request.url);
    const estado = searchParams.get('estado');
    const salaId = searchParams.get('salaId');

    let query: FirebaseFirestore.Query = adminDb.collection('prestamos');

    if (estado && estado !== 'todos') {
      query = query.where('estado', '==', estado);
    }
    if (salaId && salaId !== 'todas') {
      query = query.where('salaId', '==', salaId);
    }

    const snapshot = await query.get();
    let solicitudes: SolicitudPrestamo[] = snapshot.docs.map(
      (doc) =>
        ({
          id: doc.id,
          ...doc.data(),
        }) as SolicitudPrestamo,
    );

    if (guard.user.rol !== 'admin') {
      const labs = guard.user.laboratoriosAsignados || [];
      solicitudes = solicitudes.filter((s) => labs.includes(s.salaId));
    }

    solicitudes.sort(
      (a, b) =>
        new Date(b.fechaSolicitud || 0).getTime() -
        new Date(a.fechaSolicitud || 0).getTime(),
    );

    return NextResponse.json({ success: true, data: solicitudes });
  } catch (error: any) {
    console.error('Error fetching solicitudes:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}
