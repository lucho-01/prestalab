/** Pub/sub local para que la UI reaccione a cambios de SQLite. */
const listeners = new Map();

export function on(tabla, cb) {
  if (!listeners.has(tabla)) listeners.set(tabla, new Set());
  listeners.get(tabla).add(cb);
  return () => {
    const set = listeners.get(tabla);
    if (set) {
      set.delete(cb);
      if (set.size === 0) listeners.delete(tabla);
    }
  };
}

export function emit(tabla) {
  const set = listeners.get(tabla);
  if (!set) return;
  for (const cb of Array.from(set)) {
    try {
      cb();
    } catch (e) {
      console.warn('listener error', tabla, e?.message);
    }
  }
}
