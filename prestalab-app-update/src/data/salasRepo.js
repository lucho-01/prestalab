/** Repositorio de salas (laboratorios) — lectura desde SQLite. */
import { getDb, safeAll, txt, num, toIso } from './localDb';
import { on } from './emit';

const BASE = `
  SELECT sala_id AS id, nombre, codigo, edificio, capacidad, tipo, estado,
         gestor_responsable_id AS gestorResponsableId,
         gestor_nombre AS gestorNombre,
         equipos_count AS equiposCount, descripcion
  FROM salas
  WHERE deleted_at IS NULL`;

export const listarSalas = () => safeAll(`${BASE} ORDER BY nombre ASC`);

export function suscribirSalas(cb) {
  const emitir = () => cb(listarSalas());
  emitir();
  return on('salas', emitir);
}

export function aplicarSala(doc) {
  getDb().runSync(
    `INSERT INTO salas (
       sala_id, nombre, codigo, edificio, capacidad, tipo, estado,
       gestor_responsable_id, gestor_nombre, equipos_count, descripcion,
       updated_at, deleted_at
     ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)
     ON CONFLICT(sala_id) DO UPDATE SET
       nombre = excluded.nombre, codigo = excluded.codigo,
       edificio = excluded.edificio, capacidad = excluded.capacidad,
       tipo = excluded.tipo, estado = excluded.estado,
       gestor_responsable_id = excluded.gestor_responsable_id,
       gestor_nombre = excluded.gestor_nombre,
       equipos_count = excluded.equipos_count,
       descripcion = excluded.descripcion,
       updated_at = excluded.updated_at, deleted_at = excluded.deleted_at`,
    [
      txt(doc.id),
      txt(doc.nombre),
      txt(doc.codigo),
      txt(doc.edificio),
      num(doc.capacidad, 0),
      txt(doc.tipo),
      txt(doc.estado) ?? 'disponible',
      txt(doc.gestorResponsableId),
      txt(doc.gestorNombre),
      num(doc.equiposCount, 0),
      txt(doc.descripcion),
      toIso(doc.updatedAt),
      toIso(doc.deletedAt),
    ],
  );
}
