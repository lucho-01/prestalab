/** Repositorio de artículos — lectura desde SQLite. */
import { getDb, safeAll, safeFirst, txt, num, toIso } from './localDb';
import { on } from './emit';

const BASE = `
  SELECT articulo_id AS id, nombre, categoria, sala_id AS salaId,
         sala_nombre AS salaNombre, stock, stock_total AS stockTotal,
         estado, condicion, codigo_activo AS codigoActivo,
         descripcion, fecha_registro AS fechaRegistro
  FROM articulos
  WHERE deleted_at IS NULL`;

export const listarArticulos = () => safeAll(`${BASE} ORDER BY nombre ASC`);

export const obtenerArticulo = (id) => safeFirst(`${BASE} AND articulo_id = ?`, [id]);

export function suscribirArticulos(cb) {
  const emitir = () => cb(listarArticulos());
  emitir();
  return on('articulos', emitir);
}

export function aplicarArticulo(doc) {
  if (!doc.id) return;
  getDb().runSync(
    `INSERT INTO articulos (
       articulo_id, nombre, categoria, sala_id, sala_nombre, stock, stock_total,
       estado, condicion, codigo_activo, descripcion, fecha_registro,
       updated_at, deleted_at
     ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)
     ON CONFLICT(articulo_id) DO UPDATE SET
       nombre = excluded.nombre, categoria = excluded.categoria,
       sala_id = excluded.sala_id, sala_nombre = excluded.sala_nombre,
       stock = excluded.stock, stock_total = excluded.stock_total,
       estado = excluded.estado, condicion = excluded.condicion,
       codigo_activo = excluded.codigo_activo, descripcion = excluded.descripcion,
       fecha_registro = excluded.fecha_registro,
       updated_at = excluded.updated_at, deleted_at = excluded.deleted_at`,
    [
      txt(doc.id),
      txt(doc.nombre) ?? 'Artículo',
      txt(doc.categoria),
      txt(doc.salaId),
      txt(doc.salaNombre),
      num(doc.stock, 0),
      num(doc.stockTotal, 0),
      txt(doc.estado) ?? 'operativo',
      txt(doc.condicion),
      txt(doc.codigoActivo),
      txt(doc.descripcion),
      txt(doc.fechaRegistro),
      toIso(doc.updatedAt),
      toIso(doc.deletedAt),
    ],
  );
}
