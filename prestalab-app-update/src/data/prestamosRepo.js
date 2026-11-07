/**
 * Repositorio de préstamos (offline-first) — modelo de movil2.0:
 * estados: pendiente | aprobado | activo | devuelto | rechazado | vencido
 */
import { getDb, nowIso, safeAll, safeFirst, txt, num, boolInt, toIso } from './localDb';
import { on, emit } from './emit';
import { nuevoId } from './ids';
import { encolar, pendientesDe } from '../sync/outbox';

const BASE = `
  SELECT loan_id AS id, user_id AS userId, user_nombre AS userNombre,
         user_email AS userEmail, user_rol AS userRol, user_genero AS userGenero,
         tipo_recurso AS tipoRecurso, articulo_id AS articuloId,
         articulo_nombre AS articuloNombre, sala_id AS salaId,
         sala_nombre AS salaNombre, sala_original_id AS salaOriginalId,
         sala_original_nombre AS salaOriginalNombre,
         fue_reasignada AS fueReasignada, motivo_reasignacion AS motivoReasignacion,
         cantidad, tipo, motivo, observaciones, estado,
         fecha_solicitud AS fechaSolicitud, fecha_inicio AS fechaInicio,
         fecha_fin AS fechaFin, fecha_aprobacion AS fechaAprobacion,
         fecha_devolucion AS fechaDevolucion, gestor_id AS gestorId,
         gestor_nombre AS gestorNombre, motivo_rechazo AS motivoRechazo, dirty
  FROM prestamos
  WHERE deleted_at IS NULL`;

export const listarPrestamosDe = (uid) =>
  safeAll(`${BASE} AND user_id = ? ORDER BY fecha_solicitud DESC`, [uid]);

export const obtenerPrestamo = (id) => safeFirst(`${BASE} AND loan_id = ?`, [id]);

export function suscribirPrestamosDe(uid, cb) {
  const emitir = () => cb(listarPrestamosDe(uid));
  emitir();
  return on('prestamos', emitir);
}

/** Crea la solicitud offline (SQLite + outbox en una transacción). */
export function crearSolicitud(data) {
  const db = getDb();
  const id = nuevoId();
  const ahora = nowIso();

  const payload = {
    userId: data.userId,
    userNombre: data.userNombre ?? null,
    userEmail: data.userEmail ?? null,
    userRol: data.userRol ?? 'estudiante',
    userGenero: data.userGenero ?? 'Otro',
    tipoRecurso: data.tipoRecurso ?? 'articulo',
    articuloId: data.articuloId ?? null,
    articuloNombre: data.articuloNombre ?? null,
    salaId: data.salaId ?? null,
    salaNombre: data.salaNombre ?? null,
    cantidad: num(data.cantidad, 1),
    tipo: data.tipo ?? null,
    motivo: data.motivo ?? null,
    observaciones: data.observaciones ?? '',
    fechaSolicitud: ahora,
    fechaInicio: data.fechaInicio ?? null,
    fechaFin: data.fechaFin ?? null,
    estado: 'pendiente',
    fueReasignada: false,
  };

  db.withTransactionSync(() => {
    db.runSync(
      `INSERT INTO prestamos (
         loan_id, user_id, user_nombre, user_email, user_rol, user_genero,
         tipo_recurso, articulo_id, articulo_nombre, sala_id, sala_nombre,
         cantidad, tipo, motivo, observaciones, estado, fecha_inicio, fecha_fin,
         fecha_solicitud, fue_reasignada, dirty, updated_at
       ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,0,1,?)`,
      [
        id,
        txt(payload.userId),
        txt(payload.userNombre),
        txt(payload.userEmail),
        txt(payload.userRol),
        txt(payload.userGenero),
        txt(payload.tipoRecurso),
        txt(payload.articuloId),
        txt(payload.articuloNombre),
        txt(payload.salaId),
        txt(payload.salaNombre),
        payload.cantidad,
        txt(payload.tipo),
        txt(payload.motivo),
        payload.observaciones,
        'pendiente',
        txt(payload.fechaInicio),
        txt(payload.fechaFin),
        ahora,
        ahora,
      ],
    );
    encolar(db, { entity: 'prestamos', recordId: id, action: 'create', payload });
  });

  emit('prestamos');
  emit('sync');
  return id;
}

/** Devolución: actualización optimista local + operación en la outbox. */
export function registrarDevolucion(id) {
  const db = getDb();
  const ahora = nowIso();
  const payload = { estado: 'devuelto', fechaDevolucion: ahora };

  db.withTransactionSync(() => {
    db.runSync(
      `UPDATE prestamos SET estado = 'devuelto', fecha_devolucion = ?, dirty = 1, updated_at = ?
       WHERE loan_id = ?`,
      [ahora, ahora, id],
    );
    encolar(db, { entity: 'prestamos', recordId: id, action: 'update', payload });
  });

  emit('prestamos');
  emit('sync');
  return id;
}

/** Aplica un doc remoto (respeta registros con operaciones pendientes). */
export function aplicarPrestamo(doc) {
  if (!doc.id || !doc.userId) return false;
  if (pendientesDe('prestamos', doc.id).length > 0) return false;

  getDb().runSync(
    `INSERT INTO prestamos (
       loan_id, user_id, user_nombre, user_email, user_rol, user_genero,
       tipo_recurso, articulo_id, articulo_nombre, sala_id, sala_nombre,
       sala_original_id, sala_original_nombre, fue_reasignada, motivo_reasignacion,
       cantidad, tipo, motivo, observaciones, estado,
       fecha_solicitud, fecha_inicio, fecha_fin, fecha_aprobacion, fecha_devolucion,
       gestor_id, gestor_nombre, motivo_rechazo, dirty, updated_at, deleted_at
     ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,0,?,?)
     ON CONFLICT(loan_id) DO UPDATE SET
       user_id = excluded.user_id, user_nombre = excluded.user_nombre,
       user_email = excluded.user_email, user_rol = excluded.user_rol,
       user_genero = excluded.user_genero, tipo_recurso = excluded.tipo_recurso,
       articulo_id = excluded.articulo_id, articulo_nombre = excluded.articulo_nombre,
       sala_id = excluded.sala_id, sala_nombre = excluded.sala_nombre,
       sala_original_id = excluded.sala_original_id,
       sala_original_nombre = excluded.sala_original_nombre,
       fue_reasignada = excluded.fue_reasignada,
       motivo_reasignacion = excluded.motivo_reasignacion,
       cantidad = excluded.cantidad, tipo = excluded.tipo, motivo = excluded.motivo,
       observaciones = excluded.observaciones, estado = excluded.estado,
       fecha_solicitud = excluded.fecha_solicitud,
       fecha_inicio = excluded.fecha_inicio, fecha_fin = excluded.fecha_fin,
       fecha_aprobacion = excluded.fecha_aprobacion,
       fecha_devolucion = excluded.fecha_devolucion,
       gestor_id = excluded.gestor_id, gestor_nombre = excluded.gestor_nombre,
       motivo_rechazo = excluded.motivo_rechazo, dirty = 0,
       updated_at = excluded.updated_at, deleted_at = excluded.deleted_at`,
    [
      txt(doc.id),
      txt(doc.userId),
      txt(doc.userNombre),
      txt(doc.userEmail),
      txt(doc.userRol),
      txt(doc.userGenero),
      txt(doc.tipoRecurso),
      txt(doc.articuloId),
      txt(doc.articuloNombre),
      txt(doc.salaId),
      txt(doc.salaNombre),
      txt(doc.salaOriginalId),
      txt(doc.salaOriginalNombre),
      boolInt(doc.fueReasignada),
      txt(doc.motivoReasignacion),
      num(doc.cantidad, 1),
      txt(doc.tipo),
      txt(doc.motivo),
      txt(doc.observaciones) ?? '',
      txt(doc.estado) ?? 'pendiente',
      toIso(doc.fechaSolicitud) ?? toIso(doc.createdAt),
      toIso(doc.fechaInicio),
      toIso(doc.fechaFin),
      toIso(doc.fechaAprobacion),
      toIso(doc.fechaDevolucion),
      txt(doc.gestorId),
      txt(doc.gestorNombre),
      txt(doc.motivoRechazo),
      toIso(doc.updatedAt),
      toIso(doc.deletedAt),
    ],
  );
  return true;
}

export function marcarSincronizada(id) {
  getDb().runSync(`UPDATE prestamos SET dirty = 0, updated_at = ? WHERE loan_id = ?`, [
    nowIso(),
    id,
  ]);
  emit('prestamos');
}
