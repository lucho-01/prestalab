/**
 * SQLite local — fuente de LECTURA de la app (offline-first).
 * Carga defensiva: si el binario no trae el módulo nativo, la app arranca
 * igual y las lecturas devuelven vacío.
 */
let SQLite = null;
try {
  SQLite = require('expo-sqlite');
} catch (e) {
  console.warn('expo-sqlite no disponible:', e?.message);
}

let _db = null;

export function getDb() {
  if (!SQLite) throw new Error('SQLite no disponible en este binario');
  if (_db) return _db;
  _db = SQLite.openDatabaseSync('prestalab.db');
  _db.execSync('PRAGMA journal_mode = WAL;');
  return _db;
}

export const nowIso = () => new Date().toISOString();

/** Normalizadores: SQLite solo acepta string/number/null. */
export const txt = (v) => (v == null ? null : String(v));
export const num = (v, def = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : def;
};
export const boolInt = (v) => (v === true || v === 1 || v === 'true' ? 1 : 0);

export function toIso(v) {
  if (!v) return null;
  if (typeof v === 'string') return v;
  if (typeof v.toDate === 'function') return v.toDate().toISOString();
  if (v instanceof Date) return v.toISOString();
  return null;
}

const MIGRACION_1 = `
CREATE TABLE IF NOT EXISTS usuarios (
  uid TEXT PRIMARY KEY,
  email TEXT, nombre TEXT, genero TEXT, rol TEXT NOT NULL DEFAULT 'estudiante',
  departamento TEXT, laboratorios_asignados TEXT, activo INTEGER NOT NULL DEFAULT 1,
  updated_at TEXT
);

CREATE TABLE IF NOT EXISTS salas (
  sala_id TEXT PRIMARY KEY,
  nombre TEXT, codigo TEXT, edificio TEXT, capacidad INTEGER,
  tipo TEXT, estado TEXT, gestor_responsable_id TEXT, gestor_nombre TEXT,
  equipos_count INTEGER, descripcion TEXT,
  updated_at TEXT, deleted_at TEXT
);

CREATE TABLE IF NOT EXISTS articulos (
  articulo_id TEXT PRIMARY KEY,
  nombre TEXT NOT NULL, categoria TEXT, sala_id TEXT, sala_nombre TEXT,
  stock INTEGER NOT NULL DEFAULT 0, stock_total INTEGER NOT NULL DEFAULT 0,
  estado TEXT, condicion TEXT, codigo_activo TEXT, descripcion TEXT,
  fecha_registro TEXT, updated_at TEXT, deleted_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_articulos_sala ON articulos(sala_id);
CREATE INDEX IF NOT EXISTS idx_articulos_categoria ON articulos(categoria);

CREATE TABLE IF NOT EXISTS prestamos (
  loan_id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL, user_nombre TEXT, user_email TEXT, user_rol TEXT,
  user_genero TEXT, tipo_recurso TEXT,
  articulo_id TEXT, articulo_nombre TEXT,
  sala_id TEXT, sala_nombre TEXT,
  sala_original_id TEXT, sala_original_nombre TEXT,
  fue_reasignada INTEGER NOT NULL DEFAULT 0, motivo_reasignacion TEXT,
  cantidad INTEGER NOT NULL DEFAULT 1, tipo TEXT, motivo TEXT, observaciones TEXT,
  estado TEXT NOT NULL DEFAULT 'pendiente',
  fecha_solicitud TEXT, fecha_inicio TEXT, fecha_fin TEXT,
  fecha_aprobacion TEXT, fecha_devolucion TEXT,
  gestor_id TEXT, gestor_nombre TEXT, motivo_rechazo TEXT,
  dirty INTEGER NOT NULL DEFAULT 0, updated_at TEXT, deleted_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_prestamos_user ON prestamos(user_id, fecha_solicitud DESC);
CREATE INDEX IF NOT EXISTS idx_prestamos_estado ON prestamos(estado, fecha_fin);

CREATE TABLE IF NOT EXISTS sync_outbox (
  op_id INTEGER PRIMARY KEY AUTOINCREMENT,
  entity TEXT NOT NULL, record_id TEXT NOT NULL, action TEXT NOT NULL,
  payload TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'pending',
  attempts INTEGER NOT NULL DEFAULT 0, last_error TEXT,
  created_at TEXT NOT NULL, sent_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_outbox_pending ON sync_outbox(status, op_id);

CREATE TABLE IF NOT EXISTS sync_state (
  collection TEXT PRIMARY KEY, last_pulled_at TEXT, last_sync_at TEXT
);
`;

const MIGRACIONES = [MIGRACION_1];

export function initDb() {
  const db = getDb();
  const row = db.getFirstSync('PRAGMA user_version;');
  const actual = row?.user_version ?? 0;
  for (let v = actual; v < MIGRACIONES.length; v++) {
    db.withTransactionSync(() => {
      db.execSync(MIGRACIONES[v]);
      db.execSync(`PRAGMA user_version = ${v + 1};`);
    });
  }
  return db;
}

export function safeAll(sql, params = []) {
  try {
    return getDb().getAllSync(sql, params);
  } catch (e) {
    console.warn('SQLite (lectura):', e?.message);
    return [];
  }
}

export function safeFirst(sql, params = []) {
  try {
    return getDb().getFirstSync(sql, params);
  } catch (e) {
    console.warn('SQLite (lectura):', e?.message);
    return null;
  }
}
