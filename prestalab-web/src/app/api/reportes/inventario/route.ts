import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { Articulo, Sala } from '@/types';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const salaId = searchParams.get('salaId') || 'todas';
    const categoria = searchParams.get('categoria') || 'todas';
    const condicion = searchParams.get('condicion') || 'todas';
    const fechaInicio = searchParams.get('fechaInicio');
    const fechaFin = searchParams.get('fechaFin');

    const [articulosSnap, salasSnap] = await Promise.all([
      adminDb.collection('articulos').get(),
      adminDb.collection('salas').get(),
    ]);

    let articulos: Articulo[] = articulosSnap.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    } as Articulo));

    const salas: Sala[] = salasSnap.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    } as Sala));

    // Filtrar por sala
    if (salaId !== 'todas') {
      articulos = articulos.filter(a => a.salaId === salaId);
    }

    // Filtrar por categoría
    if (categoria !== 'todas' && categoria !== 'Todas') {
      articulos = articulos.filter(a => a.categoria === categoria);
    }

    // Filtrar por condición física (buen_estado, daniado, perdido)
    if (condicion !== 'todas') {
      articulos = articulos.filter(a => (a.condicion || 'buen_estado') === condicion);
    }

    // Filtrar por rango de fechas (fechaRegistro)
    if (fechaInicio) {
      const inicio = new Date(fechaInicio).getTime();
      articulos = articulos.filter(a => {
        if (!a.fechaRegistro) return true;
        return new Date(a.fechaRegistro).getTime() >= inicio;
      });
    }

    if (fechaFin) {
      const fin = new Date(fechaFin).getTime() + (24 * 60 * 60 * 1000 - 1);
      articulos = articulos.filter(a => {
        if (!a.fechaRegistro) return true;
        return new Date(a.fechaRegistro).getTime() <= fin;
      });
    }

    // Totales agregados
    let buenEstado = 0;
    let daniado = 0;
    let perdido = 0;
    let totalStock = 0;

    for (const art of articulos) {
      const c = art.condicion || 'buen_estado';
      const cantidad = art.stockTotal || art.stock || 1;
      if (c === 'buen_estado') buenEstado += cantidad;
      else if (c === 'daniado') daniado += cantidad;
      else if (c === 'perdido') perdido += cantidad;
      totalStock += (art.stock || 0);
    }

    // Agrupación por sala para Highcharts
    const salasMap: { [key: string]: { nombre: string; buenEstado: number; daniado: number; perdido: number } } = {};
    for (const s of salas) {
      salasMap[s.id] = { nombre: s.codigo || s.nombre, buenEstado: 0, daniado: 0, perdido: 0 };
    }

    for (const art of articulos) {
      const target = salasMap[art.salaId] || { nombre: art.salaNombre, buenEstado: 0, daniado: 0, perdido: 0 };
      const c = art.condicion || 'buen_estado';
      const cantidad = art.stockTotal || art.stock || 1;
      if (c === 'buen_estado') target.buenEstado += cantidad;
      else if (c === 'daniado') target.daniado += cantidad;
      else if (c === 'perdido') target.perdido += cantidad;
      salasMap[art.salaId] = target;
    }

    const seriesPorSala = Object.values(salasMap).filter(s => s.buenEstado > 0 || s.daniado > 0 || s.perdido > 0);

    // Agrupación por categoría
    const categoriasMap: { [key: string]: number } = {};
    for (const art of articulos) {
      categoriasMap[art.categoria] = (categoriasMap[art.categoria] || 0) + (art.stockTotal || art.stock || 1);
    }
    const seriesPorCategoria = Object.entries(categoriasMap).map(([name, y]) => ({ name, y }));

    return NextResponse.json({
      success: true,
      data: articulos,
      totales: {
        buenEstado,
        daniado,
        perdido,
        totalItems: articulos.length,
        totalStock,
      },
      graficas: {
        distribucionCondicion: [
          { name: 'Buen Estado', y: buenEstado, color: '#10B981' },
          { name: 'Dañados', y: daniado, color: '#F59E0B' },
          { name: 'Perdidos', y: perdido, color: '#EF4444' },
        ],
        seriesPorSala,
        seriesPorCategoria,
      },
    });
  } catch (error: any) {
    if (error?.digest === 'NEXT_PRERENDER_INTERRUPTED') throw error;
    console.error('Error en reporte de inventario:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
