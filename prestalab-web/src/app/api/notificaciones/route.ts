import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { forbidden, requireStaff } from '@/lib/guards';

/** Notificaciones del staff autenticado (nunca de otros usuarios). */
export async function GET(request: NextRequest) {
  const guard = await requireStaff(request);
  if ('response' in guard) return guard.response;

  try {
    const snap = await adminDb
      .collection('notificaciones')
      .where('userId', '==', guard.user.uid)
      .get();

    const notificaciones = snap.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    }));

    notificaciones.sort(
      (a: any, b: any) =>
        new Date(b.fecha || 0).getTime() - new Date(a.fecha || 0).getTime(),
    );

    return NextResponse.json({ success: true, data: notificaciones });
  } catch (error: any) {
    console.error('Error fetching notificaciones:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest) {
  const guard = await requireStaff(request);
  if ('response' in guard) return guard.response;

  try {
    const body = await request.json();
    const { id, leida = true } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID de notificación requerido' },
        { status: 400 },
      );
    }

    const docRef = adminDb.collection('notificaciones').doc(id);
    const snap = await docRef.get();

    if (!snap.exists) {
      return NextResponse.json(
        { success: false, error: 'Notificación no encontrada' },
        { status: 404 },
      );
    }
    if (snap.data()?.userId !== guard.user.uid) {
      return forbidden('Esta notificación no te pertenece.');
    }

    await docRef.update({
      leida: Boolean(leida),
      updatedAt: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      message: 'Notificación actualizada',
    });
  } catch (error: any) {
    console.error('Error updating notificacion:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}
