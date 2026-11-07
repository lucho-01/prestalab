import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { requireStaff } from '@/lib/guards';

/**
 * Métricas del panel. El gestor sólo ve las de sus laboratorios asignados;
 * el administrador ve la institución completa.
 */
export async function GET(request: NextRequest) {
  const guard = await requireStaff(request);
  if ('response' in guard) return guard.response;

  try {
    const [solicitudesSnap, salasSnap, articulosSnap, usuariosSnap] =
      await Promise.all([
        adminDb.collection('prestamos').get(),
        adminDb.collection('salas').get(),
        adminDb.collection('articulos').get(),
        adminDb.collection('usuarios').get(),
      ]);

    const labs = guard.user.laboratoriosAsignados || [];
    const esAdmin = guard.user.rol === 'admin';

    let solicitudes = solicitudesSnap.docs.map((d) => d.data());
    let salas = salasSnap.docs.map((d) => ({ id: d.id, ...d.data() })) as Array<{
      id: string;
      estado?: string;
    }>;
    let articulos = articulosSnap.docs.map((d) => d.data());

    if (!esAdmin) {
      solicitudes = solicitudes.filter((s) => labs.includes(s.salaId));
      salas = salas.filter((s) => labs.includes(s.id));
      articulos = articulos.filter((a) => labs.includes(a.salaId));
    }

    const usuarios = usuariosSnap.docs.map((d) => d.data());

    const totalSolicitudes = solicitudes.length;
    const pendientes = solicitudes.filter((s) => s.estado === 'pendiente').length;
    const activos = solicitudes.filter((s) => s.estado === 'activo').length;
    const devueltos = solicitudes.filter((s) => s.estado === 'devuelto').length;
    const rechazados = solicitudes.filter((s) => s.estado === 'rechazado').length;
    const reasignadas = solicitudes.filter((s) => s.fueReasignada).length;

    const salasDisponibles = salas.filter((s) => s.estado === 'disponible').length;
    const salasOcupadas = salas.filter((s) => s.estado === 'ocupado').length;
    const salasMantenimiento = salas.filter(
      (s) => s.estado === 'mantenimiento',
    ).length;

    const totalArticulos = articulos.reduce(
      (acc, a) => acc + (a.stockTotal || 0),
      0,
    );
    const articulosEnPrestamo = articulos.reduce(
      (acc, a) => acc + ((a.stockTotal || 0) - (a.stock || 0)),
      0,
    );

    return NextResponse.json({
      success: true,
      stats: {
        totalSolicitudes,
        pendientes,
        activos,
        devueltos,
        rechazados,
        reasignadas,
        totalSalas: salas.length,
        salasDisponibles,
        salasOcupadas,
        salasMantenimiento,
        totalArticulos,
        articulosEnPrestamo,
        totalUsuarios: usuarios.length,
        estudiantes: usuarios.filter((u) => u.rol === 'estudiante').length,
        docentes: usuarios.filter((u) => u.rol === 'docente').length,
        gestores: usuarios.filter((u) => u.rol === 'gestor').length,
        admins: usuarios.filter((u) => u.rol === 'admin').length,
      },
    });
  } catch (error: any) {
    console.error('Error fetching stats:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}
