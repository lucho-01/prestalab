import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    let query: FirebaseFirestore.Query = adminDb.collection('notificaciones');

    if (userId) {
      query = query.where('userId', '==', userId);
    }

    const snap = await query.get();
    const notificaciones = snap.docs.map(d => ({
      id: d.id,
      ...d.data(),
    }));

    // Ordenar de más reciente a más antigua
    notificaciones.sort((a: any, b: any) => new Date(b.fecha || 0).getTime() - new Date(a.fecha || 0).getTime());

    return NextResponse.json({ success: true, data: notificaciones });
  } catch (error: any) {
    console.error('Error fetching notificaciones:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, leida = true } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID de notificación requerido' }, { status: 400 });
    }

    await adminDb.collection('notificaciones').doc(id).update({
      leida,
      updatedAt: new Date().toISOString(),
    });

    return NextResponse.json({ success: true, message: 'Notificación actualizada' });
  } catch (error: any) {
    console.error('Error updating notificacion:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

