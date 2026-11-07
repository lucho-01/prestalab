import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { ReporteSala, Sala, SolicitudPrestamo, Articulo } from '@/types';
import { requireStaff } from '@/lib/guards';

export async function GET(request: NextRequest) {
  const guard = await requireStaff(request);
  if ('response' in guard) return guard.response;

  try {
    const [salasSnap, solicitudesSnap, articulosSnap] = await Promise.all([
      adminDb.collection('salas').get(),
      adminDb.collection('prestamos').get(),
      adminDb.collection('articulos').get(),
    ]);

    const labs = guard.user.laboratoriosAsignados || [];
    const esAdmin = guard.user.rol === 'admin';

    let salas: Sala[] = salasSnap.docs.map(
      (d) => ({ id: d.id, ...d.data() }) as Sala,
    );
    let solicitudes: SolicitudPrestamo[] = solicitudesSnap.docs.map(
      (d) => ({ id: d.id, ...d.data() }) as SolicitudPrestamo,
    );
    let articulos: Articulo[] = articulosSnap.docs.map(
      (d) => ({ id: d.id, ...d.data() }) as Articulo,
    );

    if (!esAdmin) {
      salas = salas.filter((s) => labs.includes(s.id));
      solicitudes = solicitudes.filter((s) => labs.includes(s.salaId));
      articulos = articulos.filter((a) => labs.includes(a.salaId));
    }

    const reportes: ReporteSala[] = salas.map((sala) => {
      const solsDeSala = solicitudes.filter((s) => s.salaId === sala.id);
      const totalReservas = solsDeSala.length;

      // Estimación: cada préstamo reserva el espacio ~4 h por día de vigencia.
      const horasOcupadas = solsDeSala.reduce((acc, s) => {
        if (!s.fechaInicio || !s.fechaFin) return acc + 2;
        const diffDays = Math.max(
          1,
          Math.round(
            (new Date(s.fechaFin).getTime() -
              new Date(s.fechaInicio).getTime()) /
              (1000 * 60 * 60 * 24),
          ),
        );
        return acc + diffDays * 4;
      }, 0);

      // Semana operativa de referencia: 48 h.
      const tasaOcupacion = Math.min(
        100,
        Math.round((horasOcupadas / 48) * 100),
      );

      const articulosDeSala = articulos.filter((a) => a.salaId === sala.id);
      const articulosDisponibles = articulosDeSala.reduce(
        (sum, a) => sum + (a.stock || 0),
        0,
      );

      return {
        salaId: sala.id,
        nombre: sala.nombre,
        codigo: sala.codigo,
        capacidad: sala.capacidad,
        totalReservas,
        horasOcupadas,
        tasaOcupacion,
        estadoActual: sala.estado,
        articulosDisponibles,
      };
    });

    reportes.sort((a, b) => b.tasaOcupacion - a.tasaOcupacion);

    return NextResponse.json({ success: true, data: reportes });
  } catch (error: any) {
    console.error('Error in room analytics report:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}
