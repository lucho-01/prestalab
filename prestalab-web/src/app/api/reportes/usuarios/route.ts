import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { ReporteUsuario, Usuario, SolicitudPrestamo } from '@/types';

export async function GET() {
  try {
    const [usuariosSnap, solicitudesSnap] = await Promise.all([
      adminDb.collection('usuarios').get(),
      adminDb.collection('prestamos').get(),
    ]);

    const usuarios: Usuario[] = usuariosSnap.docs.map(d => ({ id: d.id, ...d.data() } as Usuario));
    const solicitudes: SolicitudPrestamo[] = solicitudesSnap.docs.map(d => ({ id: d.id, ...d.data() } as SolicitudPrestamo));

    const estudiantesYDocentes = usuarios.filter(u => u.rol === 'estudiante' || u.rol === 'docente');

    const reportes: ReporteUsuario[] = estudiantesYDocentes.map(user => {
      const userSols = solicitudes.filter(s => s.userId === user.id);
      const totalPrestamos = userSols.length;
      const prestamosActivos = userSols.filter(s => s.estado === 'activo').length;
      const prestamosDevueltos = userSols.filter(s => s.estado === 'devuelto').length;
      const prestamosRechazados = userSols.filter(s => s.estado === 'rechazado').length;

      // Calcular estimaciÃ³n de horas reservadas (suponiendo 3 horas por reserva estÃ¡ndar o diferencia de fechas)
      const horasReservadas = userSols.reduce((sum, s) => {
        if (!s.fechaInicio || !s.fechaFin) return sum + 3;
        const diffMs = new Date(s.fechaFin).getTime() - new Date(s.fechaInicio).getTime();
        const diffDays = Math.max(1, Math.round(diffMs / (1000 * 60 * 60 * 24)));
        return sum + (diffDays * 4); // 4 horas promedio de jornada de lab por dÃ­a
      }, 0);

      const tasaCumplimiento = totalPrestamos > 0
        ? Math.round((prestamosDevueltos / (totalPrestamos - prestamosRechazados || 1)) * 100)
        : 100;

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

    // EstadÃ­sticas globales agregadas
    const resumen = {
      totalEstudiantes: estudiantesYDocentes.filter(u => u.rol === 'estudiante').length,
      totalDocentes: estudiantesYDocentes.filter(u => u.rol === 'docente').length,
      horasEstudiantes: reportes.filter(r => r.rol === 'estudiante').reduce((a, b) => a + b.horasReservadas, 0),
      horasDocentes: reportes.filter(r => r.rol === 'docente').reduce((a, b) => a + b.horasReservadas, 0),
      prestamosEstudiantes: reportes.filter(r => r.rol === 'estudiante').reduce((a, b) => a + b.totalPrestamos, 0),
      prestamosDocentes: reportes.filter(r => r.rol === 'docente').reduce((a, b) => a + b.totalPrestamos, 0),
    };

    return NextResponse.json({ success: true, data: reportes, resumen });
  } catch (error: any) {
    console.error('Error in user analytics report:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

