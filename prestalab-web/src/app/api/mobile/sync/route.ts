import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { requireMobileAuth } from '@/lib/mobile-auth';

/** Convierte Timestamps de Firestore y anidados a JSON plano (ISO 8601). */
function plain(value: any): any {
  if (value == null) return value;
  if (typeof value !== 'object') return value;
  if (value instanceof Date) return value.toISOString();
  if (typeof value.toDate === 'function') return value.toDate().toISOString();
  if (Array.isArray(value)) return value.map(plain);
  if (typeof value._seconds === 'number') {
    return new Date(value._seconds * 1000).toISOString();
  }
  const out: Record<string, any> = {};
  for (const [key, val] of Object.entries(value)) out[key] = plain(val);
  return out;
}

function toList(snapshot: FirebaseFirestore.QuerySnapshot) {
  return snapshot.docs.map((doc) => ({ id: doc.id, ...plain(doc.data()) }));
}

/**
 * Pull de la app móvil en una sola llamada:
 * catálogo (salas + artículos), préstamos del usuario y notificaciones.
 */
export async function GET(request: NextRequest) {
  const guard = await requireMobileAuth(request);
  if ('response' in guard) return guard.response;

  const uid = guard.user.uid;

  try {
    const [salasSnap, articulosSnap, prestamosSnap, notifSnap] = await Promise.all([
      adminDb.collection('salas').get(),
      adminDb.collection('articulos').get(),
      adminDb.collection('prestamos').where('userId', '==', uid).get(),
      adminDb
        .collection('notificaciones')
        .where('userId', '==', uid)
        .get(),
    ]);

    const prestamos = toList(prestamosSnap).sort((a: any, b: any) => {
      const fa = new Date(a.fechaSolicitud || a.createdAt || 0).getTime();
      const fb = new Date(b.fechaSolicitud || b.createdAt || 0).getTime();
      return fb - fa;
    });

    const notificaciones = toList(notifSnap).sort((a: any, b: any) => {
      return new Date(b.fecha || 0).getTime() - new Date(a.fecha || 0).getTime();
    });

    return NextResponse.json({
      success: true,
      serverTime: new Date().toISOString(),
      salas: toList(salasSnap),
      articulos: toList(articulosSnap),
      prestamos,
      notificaciones,
    });
  } catch (error) {
    console.error('[mobile sync] Error:', error);
    return NextResponse.json(
      { success: false, error: 'No se pudo sincronizar la información.' },
      { status: 500 },
    );
  }
}
