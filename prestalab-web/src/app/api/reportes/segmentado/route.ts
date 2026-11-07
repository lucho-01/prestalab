import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { SolicitudPrestamo, Usuario, Sala } from '@/types';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const salaId = searchParams.get('salaId') || 'todas';
    const genero = searchParams.get('genero') || 'todos';
    const rol = searchParams.get('rol') || 'todos';
    const fechaInicio = searchParams.get('fechaInicio');
    const fechaFin = searchParams.get('fechaFin');

    const [solicitudesSnap, usuariosSnap, salasSnap] = await Promise.all([
      adminDb.collection('prestamos').get(),
      adminDb.collection('usuarios').get(),
      adminDb.collection('salas').get(),
    ]);

    let solicitudes: SolicitudPrestamo[] = solicitudesSnap.docs.map(d => ({ id: d.id, ...d.data() } as SolicitudPrestamo));
    const usuarios: Usuario[] = usuariosSnap.docs.map(d => ({ id: d.id, ...d.data() } as Usuario));
    const salas: Sala[] = salasSnap.docs.map(d => ({ id: d.id, ...d.data() } as Sala));

    // Crear mapa de usuario para enriquecer gÃ©nero y rol
    const userMap: { [uid: string]: Usuario } = {};
    for (const u of usuarios) {
      userMap[u.id] = u;
    }

    // Filtrar por sala
    if (salaId !== 'todas') {
      solicitudes = solicitudes.filter(s => s.salaId === salaId);
    }

    // Filtrar por fechas
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

    // Enriquecer solicitudes con el gÃ©nero del usuario si no venÃ­a en la solicitud
    solicitudes = solicitudes.map(s => {
      const u = userMap[s.userId];
      const userGen = s.userGenero || u?.genero || 'Otro';
      const uRol = s.userRol || u?.rol || 'estudiante';
      return {
        ...s,
        userGenero: userGen,
        userRol: uRol,
      };
    });

    // Filtrar por gÃ©nero
    if (genero !== 'todos') {
      solicitudes = solicitudes.filter(s => s.userGenero === genero);
    }

    // Filtrar por rol
    if (rol !== 'todos') {
      solicitudes = solicitudes.filter(s => s.userRol === rol);
    }

    // Desglose por gÃ©nero
    const generoCounts = {
      Masculino: solicitudes.filter(s => s.userGenero === 'Masculino').length,
      Femenino: solicitudes.filter(s => s.userGenero === 'Femenino').length,
      Otro: solicitudes.filter(s => s.userGenero === 'Otro').length,
    };

    // Desglose por laboratorio y gÃ©nero (para Highcharts stacked column)
    const salasSegmentadas: {
      [id: string]: {
        codigo: string;
        nombre: string;
        masculino: number;
        femenino: number;
        otro: number;
        total: number;
      };
    } = {};

    for (const s of salas) {
      salasSegmentadas[s.id] = {
        codigo: s.codigo,
        nombre: s.nombre,
        masculino: 0,
        femenino: 0,
        otro: 0,
        total: 0,
      };
    }

    for (const sol of solicitudes) {
      const target = salasSegmentadas[sol.salaId] || {
        codigo: 'LAB',
        nombre: sol.salaNombre,
        masculino: 0,
        femenino: 0,
        otro: 0,
        total: 0,
      };
      if (sol.userGenero === 'Masculino') target.masculino += 1;
      else if (sol.userGenero === 'Femenino') target.femenino += 1;
      else target.otro += 1;
      target.total += 1;
      salasSegmentadas[sol.salaId] = target;
    }

    const salasCategorias = Object.values(salasSegmentadas)
      .filter(s => s.total > 0)
      .map(s => s.codigo);

    const seriesMasculino = Object.values(salasSegmentadas)
      .filter(s => s.total > 0)
      .map(s => s.masculino);

    const seriesFemenino = Object.values(salasSegmentadas)
      .filter(s => s.total > 0)
      .map(s => s.femenino);

    const seriesOtro = Object.values(salasSegmentadas)
      .filter(s => s.total > 0)
      .map(s => s.otro);

    // SegmentaciÃ³n por usuario individual
    const userAggregates: {
      [uid: string]: {
        id: string;
        nombre: string;
        email: string;
        genero: string;
        rol: string;
        totalSolicitudes: number;
        horas: number;
        salasUtilizadas: Set<string>;
      };
    } = {};

    for (const sol of solicitudes) {
      if (!userAggregates[sol.userId]) {
        userAggregates[sol.userId] = {
          id: sol.userId,
          nombre: sol.userNombre || 'Usuario',
          email: sol.userEmail || '',
          genero: sol.userGenero || 'Otro',
          rol: sol.userRol || 'estudiante',
          totalSolicitudes: 0,
          horas: 0,
          salasUtilizadas: new Set<string>(),
        };
      }
      userAggregates[sol.userId].totalSolicitudes += 1;
      userAggregates[sol.userId].salasUtilizadas.add(sol.salaNombre);

      const diffDays = Math.max(1, Math.round((new Date(sol.fechaFin).getTime() - new Date(sol.fechaInicio).getTime()) / (1000 * 60 * 60 * 24)) || 1);
      userAggregates[sol.userId].horas += (diffDays * 4);
    }

    const usuariosResumen = Object.values(userAggregates).map(u => ({
      ...u,
      salasUtilizadas: Array.from(u.salasUtilizadas),
    })).sort((a, b) => b.totalSolicitudes - a.totalSolicitudes);

    return NextResponse.json({
      success: true,
      totalSolicitudes: solicitudes.length,
      desgloseGenero: generoCounts,
      usuariosResumen,
      graficas: {
        generoPie: [
          { name: 'Masculino', y: generoCounts.Masculino, color: '#3B82F6' },
          { name: 'Femenino', y: generoCounts.Femenino, color: '#EC4899' },
          { name: 'Otro / Prefiere no decir', y: generoCounts.Otro, color: '#8B5CF6' },
        ],
        salasCategorias,
        seriesPorGeneroYSala: [
          { name: 'Masculino', data: seriesMasculino, color: '#3B82F6' },
          { name: 'Femenino', data: seriesFemenino, color: '#EC4899' },
          { name: 'Otro', data: seriesOtro, color: '#8B5CF6' },
        ],
      },
    });
  } catch (error: any) {
    if (error?.digest === 'NEXT_PRERENDER_INTERRUPTED') throw error;
    console.error('Error en reporte segmentado:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
