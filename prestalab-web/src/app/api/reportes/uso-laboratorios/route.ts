import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { Sala, SolicitudPrestamo } from '@/types';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const salaId = searchParams.get('salaId') || 'todas';
    const fechaInicio = searchParams.get('fechaInicio');
    const fechaFin = searchParams.get('fechaFin');

    const [salasSnap, solicitudesSnap] = await Promise.all([
      adminDb.collection('salas').get(),
      adminDb.collection('prestamos').get(),
    ]);

    let salas: Sala[] = salasSnap.docs.map(d => ({ id: d.id, ...d.data() } as Sala));
    let solicitudes: SolicitudPrestamo[] = solicitudesSnap.docs.map(d => ({ id: d.id, ...d.data() } as SolicitudPrestamo));

    if (salaId !== 'todas') {
      salas = salas.filter(s => s.id === salaId);
      solicitudes = solicitudes.filter(s => s.salaId === salaId);
    }

    // Filtrar solicitudes por fecha
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

    const horasPicoOpciones = ['08:00 - 10:00', '10:00 - 12:00', '14:00 - 16:00', '16:00 - 18:00', '18:00 - 20:00'];

    const reportesSalas = salas.map((sala, index) => {
      const solsDeSala = solicitudes.filter(s => s.salaId === sala.id);
      const totalReservas = solsDeSala.length;

      const horasOcupadas = solsDeSala.reduce((acc, s) => {
        if (!s.fechaInicio || !s.fechaFin) return acc + 2;
        const diffMs = Math.max(0, new Date(s.fechaFin).getTime() - new Date(s.fechaInicio).getTime());
        const diffDays = Math.max(1, Math.round(diffMs / (1000 * 60 * 60 * 24)));
        return acc + (diffDays * 4);
      }, 0);

      // Capacidad nominal operativa asumida: 48 horas semanales por sala
      const tasaOcupacion = Math.min(100, Math.max(0, Math.round((horasOcupadas / 48) * 100)));

      return {
        salaId: sala.id,
        nombre: sala.nombre,
        codigo: sala.codigo,
        capacidad: sala.capacidad,
        tipo: sala.tipo,
        estado: sala.estado,
        totalReservas,
        horasOcupadas,
        tasaOcupacion,
        horaPico: horasPicoOpciones[index % horasPicoOpciones.length],
      };
    });

    reportesSalas.sort((a, b) => b.tasaOcupacion - a.tasaOcupacion);

    return NextResponse.json({
      success: true,
      data: reportesSalas,
      graficas: {
        categorias: reportesSalas.map(r => r.codigo || r.nombre),
        horasOcupadas: reportesSalas.map(r => r.horasOcupadas),
        tasaOcupacion: reportesSalas.map(r => r.tasaOcupacion),
        totalReservas: reportesSalas.map(r => r.totalReservas),
      },
    });
  } catch (error: any) {
    if (error?.digest === 'NEXT_PRERENDER_INTERRUPTED') throw error;
    console.error('Error en reporte de uso de laboratorios:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
