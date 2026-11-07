import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { requireMobileAuth } from '@/lib/mobile-auth';

const TIPOS = ['articulo', 'sala', 'mixto'];

/**
 * Crear solicitud desde la app móvil.
 * El `clientId` es el id local del outbox: así el reintento es idempotente y
 * el registro del teléfono y el del servidor comparten id.
 */
export async function POST(request: NextRequest) {
  const guard = await requireMobileAuth(request);
  if ('response' in guard) return guard.response;

  const user = guard.user;

  try {
    const body = await request.json().catch(() => ({}));

    const salaId = String(body.salaId || '').trim();
    const fechaInicio = String(body.fechaInicio || '').trim();
    const fechaFin = String(body.fechaFin || '').trim();
    const motivo = String(body.motivo || '').trim();

    if (!salaId || !fechaInicio || !fechaFin || !motivo) {
      return NextResponse.json(
        {
          success: false,
          error: 'Faltan datos de la solicitud (sala, fechas o motivo).',
        },
        { status: 400 },
      );
    }

    const clientId = String(body.clientId || '').trim();
    const validClientId = /^[A-Za-z0-9_-]{1,120}$/.test(clientId);
    const docRef = validClientId
      ? adminDb.collection('prestamos').doc(clientId)
      : adminDb.collection('prestamos').doc();

    const existing = await docRef.get();
    if (existing.exists) {
      // Reintento del outbox: no se duplica ni se pisa el estado.
      return NextResponse.json({
        success: true,
        duplicate: true,
        data: { id: docRef.id, ...existing.data() },
      });
    }

    const tipoRecurso = TIPOS.includes(body.tipoRecurso)
      ? body.tipoRecurso
      : 'articulo';
    const cantidad = Math.max(1, Number(body.cantidad) || 1);
    const ahora = new Date().toISOString();

    const solicitud = {
      id: docRef.id,
      userId: user.uid,
      userNombre: user.nombre || 'Estudiante',
      userEmail: user.email || '',
      userRol: user.rol || 'estudiante',
      userGenero: user.genero || 'Otro',
      tipoRecurso,
      articuloId: body.articuloId ? String(body.articuloId) : null,
      articuloNombre: body.articuloNombre ? String(body.articuloNombre) : null,
      salaId,
      salaNombre: body.salaNombre ? String(body.salaNombre) : 'Laboratorio',
      cantidad,
      tipo: body.tipo ? String(body.tipo) : null,
      motivo,
      observaciones: body.observaciones ? String(body.observaciones) : '',
      fechaSolicitud: ahora,
      fechaInicio,
      fechaFin,
      estado: 'pendiente',
      fueReasignada: false,
      createdAt: ahora,
      updatedAt: ahora,
    };

    await docRef.set(solicitud);

    return NextResponse.json(
      { success: true, data: solicitud },
      { status: 201 },
    );
  } catch (error) {
    console.error('[mobile prestamos:create] Error:', error);
    return NextResponse.json(
      { success: false, error: 'No se pudo crear la solicitud.' },
      { status: 500 },
    );
  }
}
