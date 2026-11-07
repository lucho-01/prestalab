/** Outbox: cola persistente de operaciones pendientes de subir. */
import { getDb, nowIso } from '../data/localDb';

export function encolar(db, { entity, recordId, action, payload }) {
  db.runSync(
    `INSERT INTO sync_outbox (entity, record_id, action, payload, status, attempts, created_at)
     VALUES (?, ?, ?, ?, 'pending', 0, ?)`,
    [entity, recordId, action, JSON.stringify(payload), nowIso()],
  );
}

export function pendientes(limit = 20) {
  return getDb().getAllSync(
    `SELECT * FROM sync_outbox WHERE status IN ('pending','error') ORDER BY op_id ASC LIMIT ?`,
    [limit],
  );
}

export function pendientesDe(entity, recordId) {
  return getDb().getAllSync(
    `SELECT op_id FROM sync_outbox
     WHERE entity = ? AND record_id = ? AND status IN ('pending','in_flight','error')`,
    [entity, recordId],
  );
}

export function marcarEnVuelo(opId) {
  getDb().runSync(`UPDATE sync_outbox SET status = 'in_flight' WHERE op_id = ?`, [opId]);
}

export function marcarEnviada(opId) {
  getDb().runSync(`UPDATE sync_outbox SET status = 'done', sent_at = ? WHERE op_id = ?`, [
    nowIso(),
    opId,
  ]);
}

export function marcarError(opId, mensaje) {
  getDb().runSync(
    `UPDATE sync_outbox
     SET status = 'error', attempts = attempts + 1, last_error = ?
     WHERE op_id = ?`,
    [String(mensaje || 'error').slice(0, 300), opId],
  );
}
