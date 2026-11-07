import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { SolicitudPrestamo } from '@/types';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const estado = searchParams.get('estado') || 'todos';
    const salaId = searchParams.get('salaId') || 'todas';
    const fechaInicio = searchParams.get('fechaInicio');
    const fechaFin = searchParams.get('fechaFin');

    const snap = await adminDb.collection('prestamos').get();
    let solicitudes: SolicitudPrestamo[] = snap.docs.map(d => ({ id: d.id, ...d.data() } as SolicitudPrestamo));

    if (estado !== 'todos') {
      solicitudes = solicitudes.filter(s => s.estado === estado);
    }

    if (salaId !== 'todas') {
      solicitudes = solicitudes.filter(s => s.salaId === salaId);
    }

    if (fechaInicio) {
      const inicio = new Date(fechaInicio).getTime();
      solicitudes = solicitudes.filter(s => {
        const f = s.fechaInicio || s.fechaSolicitud;
        if (!f) return true;
        return new Date(f).getTime() >= inicio;
      });
    }

    if (fechaFin) {
      const fin = new Date(fechaFin).getTime() + (24 * 60 * 60 * 1000 - 1);
      solicitudes = solicitudes.filter(s => {
        const f = s.fechaFin || s.fechaSolicitud;
        if (!f) return true;
        return new Date(f).getTime() <= fin;
      });
    }

    // DistribuciÃ³n por estado
    const counts = {
      pendiente: solicitudes.filter(s => s.estado === 'pendiente').length,
      aprobado: solicitudes.filter(s => s.estado === 'aprobado').length,
      activo: solicitudes.filter(s => s.estado === 'activo').length,
      devuelto: solicitudes.filter(s => s.estado === 'devuelto').length,
      rechazado: solicitudes.filter(s => s.estado === 'rechazado').length,
    };

    // DistribuciÃ³n por tipo de recurso
    const tipoRecursoCounts = {
      articulo: solicitudes.filter(s => s.tipoRecurso === 'articulo').length,
      sala: solicitudes.filter(s => s.tipoRecurso === 'sala').length,
      mixto: solicitudes.filter(s => s.tipoRecurso === 'mixto').length,
    };

    return NextResponse.json({
      success: true,
      total: solicitudes.length,
      data: solicitudes,
      distribucion: counts,
      graficas: {
        estadosPie: [
          { name: 'En RevisiÃ³n (Pendiente)', y: counts.pendiente, color: '#F59E0B' },
          { name: 'Aprobado', y: counts.aprobado, color: '#3B82F6' },
          { name: 'Activo en Curso', y: counts.activo, color: '#10B981' },
          { name: 'Devuelto', y: counts.devuelto, color: '#6366F1' },
          { name: 'Rechazado', y: counts.rechazado, color: '#EF4444' },
        ],
        tiposPie: [
          { name: 'ArtÃ­culos / Equipos', y: tipoRecursoCounts.articulo, color: '#0EA5E9' },
          { name: 'Salas / Espacios', y: tipoRecursoCounts.sala, color: '#8B5CF6' },
          { name: 'Mixto (Sala + Equipo)', y: tipoRecursoCounts.mixto, color: '#10B981' },
        ],
      },
    });
  } catch (error: any) {
    if (error?.digest === 'NEXT_PRERENDER_INTERRUPTED') throw error;
    console.error('Error en reporte de prÃ©stamos:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
