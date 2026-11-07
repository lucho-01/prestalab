import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { ReporteUsuario, Usuario, SolicitudPrestamo } from '@/types';
import { requireStaff } from '@/lib/guards';

export async function GET(request: NextRequest) {
  const guard = await requireStaff(request);
  if ('response' in guard) return guard.response;

  try {
    const [usuariosSnap, solicitudesSnap] = await Promise.all([
      adminDb.collection('usuarios').get(),
      adminDb.collection('prestamos').get(),
    ]);

    const usuarios: Usuario[] = usuariosSnap.docs.map(
      (d) => ({ id: d.id, ...d.data() }) as Usuario,
    );
    let solicitudes: SolicitudPrestamo[] = solicitudesSnap.docs.map(
      (d) => ({ id: d.id, ...d.data() }) as SolicitudPrestamo,
    );

    if (guard.user.rol !== 'admin') {
      const labs = guard.user.laboratoriosAsignados || [];
      solicitudes = solicitudes.filter((s) => labs.includes(s.salaId));
    }

    // Los solicitantes de la app móvil son estudiantes y docentes.
    const solicitantes = usuarios.filter(
      (u) => u.rol === 'estudiante' || u.rol === 'docente',
    );
    const idsSolicitantes = new Set(solicitantes.map((u) => u.id));

    // Sólo se reportan usuarios que realmente tienen préstamos.
    const conActividad = solicitantes.filter((u) =>
      solicitudes.some((s) => s.userId === u.id),
    );

    const reportes: ReporteUsuario[] = conActividad.map((user) => {
      const userSols = solicitudes.filter((s) => s.userId === user.id);
      const totalPrestamos = userSols.length;
      const prestamosActivos = userSols.filter((s) => s.estado === 'activo').length;
      const prestamosDevueltos = userSols.filter((s) => s.estado === 'devuelto').length;
      const prestamosRechazados = userSols.filter((s) => s.estado === 'rechazado').length;

      // Estimación de horas reservadas: 4 h por día de vigencia.
      const horasReservadas = userSols.reduce((sum, s) => {
        if (!s.fechaInicio || !s.fechaFin) return sum + 3;
        const diffMs =
          new Date(s.fechaFin).getTime() - new Date(s.fechaInicio).getTime();
        const diffDays = Math.max(1, Math.round(diffMs / (1000 * 60 * 60 * 24)));
        return sum + diffDays * 4;
      }, 0);

      const base = totalPrestamos - prestamosRechazados;
      const tasaCumplimiento = base > 0 ? Math.round((prestamosDevueltos / base) * 100) : 0;

      return {
        userId: user.id,
        nombre: user.nombre || 'Sin nombre',
        email: user.email || '',
        rol: user.rol as 'estudiante' | 'docente',
        totalPrestamos,
        horasReservadas,
        prestamosActivos,
        prestamosDevueltos,
        prestamosRechazados,
        tasaCumplimiento: Math.min(100, Math.max(0, tasaCumplimiento)),
      };
    });

    // Préstamos cuyo solicitante ya no existe como usuario real se omiten.
    const huerfanos = solicitudes.filter((s) => !idsSolicitantes.has(s.userId)).length;

    const resumen = {
      totalEstudiantes: solicitantes.filter((u) => u.rol === 'estudiante').length,
      totalDocentes: solicitantes.filter((u) => u.rol === 'docente').length,
      horasEstudiantes: reportes
        .filter((r) => r.rol === 'estudiante')
        .reduce((a, b) => a + b.horasReservadas, 0),
      horasDocentes: reportes
        .filter((r) => r.rol === 'docente')
        .reduce((a, b) => a + b.horasReservadas, 0),
      prestamosEstudiantes: reportes
        .filter((r) => r.rol === 'estudiante')
        .reduce((a, b) => a + b.totalPrestamos, 0),
      prestamosDocentes: reportes
        .filter((r) => r.rol === 'docente')
        .reduce((a, b) => a + b.totalPrestamos, 0),
      prestamosSinUsuario: huerfanos,
    };

    return NextResponse.json({ success: true, data: reportes, resumen });
  } catch (error: any) {
    console.error('Error in user analytics report:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}
