import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { SolicitudPrestamo } from '@/types';
import { requireStaff } from '@/lib/guards';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const estado = searchParams.get('estado');
    const salaId = searchParams.get('salaId');
    const gestorId = searchParams.get('gestorId');
    const userId = searchParams.get('userId');

    let query: FirebaseFirestore.Query = adminDb.collection('prestamos');

    if (estado && estado !== 'todos') {
      query = query.where('estado', '==', estado);
    }
    if (salaId && salaId !== 'todas') {
      query = query.where('salaId', '==', salaId);
    }
    if (userId) {
      query = query.where('userId', '==', userId);
    }

    const snapshot = await query.get();
    let solicitudes: SolicitudPrestamo[] = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    } as SolicitudPrestamo));

    // Si filtra por gestor, obtener las salas que supervisa el gestor
    if (gestorId && gestorId !== 'todos') {
      const gestorDoc = await adminDb.collection('usuarios').doc(gestorId).get();
      if (gestorDoc.exists) {
        const gestorData = gestorDoc.data();
        const labs = gestorData?.laboratoriosAsignados || [];
        if (labs.length > 0) {
          solicitudes = solicitudes.filter(s => labs.includes(s.salaId));
        }
      }
    }

    // Ordenar por fecha de solicitud descendente
    solicitudes.sort((a, b) => new Date(b.fechaSolicitud).getTime() - new Date(a.fechaSolicitud).getTime());

    return NextResponse.json({ success: true, data: solicitudes });
  } catch (error: any) {
    console.error('Error fetching solicitudes:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const guard = await requireStaff(request);
  if ('response' in guard) return guard.response;

  try {
    const body = await request.json();
    const {
      userId,
      userNombre,
      userEmail,
      userRol = 'estudiante',
      tipoRecurso = 'articulo',
      articuloId,
      articuloNombre,
      salaId,
      salaNombre,
      cantidad = 1,
      fechaInicio,
      fechaFin,
      motivo,
      observaciones = '',
    } = body;

    if (!userId || !salaId || !fechaInicio || !fechaFin || !motivo) {
      return NextResponse.json(
        { success: false, error: 'Campos requeridos incompletos' },
        { status: 400 }
      );
    }

    const newDocRef = adminDb.collection('prestamos').doc();
    const nuevaSolicitud: SolicitudPrestamo = {
      id: newDocRef.id,
      userId,
      userNombre: userNombre || 'Usuario',
      userEmail: userEmail || '',
      userRol,
      tipoRecurso,
      articuloId: articuloId || undefined,
      articuloNombre: articuloNombre || undefined,
      salaId,
      salaNombre: salaNombre || 'Sala Asignada',
      cantidad: Number(cantidad) || 1,
      fechaSolicitud: new Date().toISOString(),
      fechaInicio,
      fechaFin,
      motivo,
      observaciones,
      estado: 'pendiente',
      fueReasignada: false,
    };

    await newDocRef.set(nuevaSolicitud);

    return NextResponse.json({ success: true, data: nuevaSolicitud }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating solicitud:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

