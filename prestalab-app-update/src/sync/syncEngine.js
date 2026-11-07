/**
 * SyncEngine — único módulo que habla con el backend (Vercel).
 *
 * Sin Firebase: push de la outbox + pull del catálogo y préstamos por HTTP.
 * Sin onSnapshot: la actualización llega por el pull periódico (30 s),
 * al volver a primer plano, al recuperar red y tras cada acción local.
 */
import { apiFetch } from '../services/apiClient';
import { clearSession } from '../services/session';
import { emit } from '../data/emit';
import { aplicarSala } from '../data/salasRepo';
import { aplicarArticulo } from '../data/articulosRepo';
import { aplicarPrestamo, marcarSincronizada } from '../data/prestamosRepo';
import { marcarEnVuelo, marcarEnviada, marcarError, pendientes } from './outbox';

const MAX_INTENTOS = 5;
let sincronizando = false;

// ---------------- push ----------------
async function empujarOutbox() {
  const ops = pendientes(20);

  for (const op of ops) {
    if (op.attempts >= MAX_INTENTOS) continue;

    try {
      marcarEnVuelo(op.op_id);
      const payload = JSON.parse(op.payload);

      if (op.entity === 'prestamos' && op.action === 'create') {
        await apiFetch('/api/mobile/prestamos', {
          method: 'POST',
          body: { ...payload, clientId: op.record_id },
        });
        marcarSincronizada(op.record_id);
      } else if (op.entity === 'prestamos' && op.action === 'update') {
        await apiFetch(
          `/api/mobile/prestamos/${encodeURIComponent(op.record_id)}`,
          { method: 'PATCH', body: payload },
        );
        marcarSincronizada(op.record_id);
      } else {
        throw new Error(`Operación no soportada: ${op.entity}/${op.action}`);
      }

      marcarEnviada(op.op_id);
    } catch (e) {
      marcarError(op.op_id, e?.status ? `HTTP ${e.status}: ${e.message}` : e?.message);
      console.warn(`Outbox ${op.op_id} falló:`, e?.message);
    }
  }
  emit('prestamos');
}

// ---------------- pull ----------------
async function bajarTodo() {
  const data = await apiFetch('/api/mobile/sync');
  const resumen = { salas: 0, articulos: 0, prestamos: 0, fallos: 0 };

  const aplicar = (lista, fn, clave, etiqueta) => {
    for (const item of lista || []) {
      try {
        fn(item);
        resumen[clave] += 1;
      } catch (e) {
        resumen.fallos += 1;
        console.warn(`aplicar ${etiqueta}:`, e?.message);
      }
    }
  };

  aplicar(data.salas, aplicarSala, 'salas', 'sala');
  aplicar(data.articulos, aplicarArticulo, 'articulos', 'artículo');
  aplicar(data.prestamos, aplicarPrestamo, 'prestamos', 'préstamo');

  // Si el servidor devolvió catálogo pero no se pudo guardar nada, es un
  // error real (esquema/DB), no una simple lista vacía: hay que avisar.
  const catalogosRecibidos =
    (data.salas?.length || 0) + (data.articulos?.length || 0);
  const catalogosGuardados = resumen.salas + resumen.articulos;
  if (catalogosRecibidos > 0 && catalogosGuardados === 0) {
    throw new Error(
      'No se pudo guardar el catálogo en el dispositivo. Cierra y vuelve a abrir la app.',
    );
  }

  emit('salas');
  emit('articulos');
  emit('prestamos');
  emit('sync');
  return resumen;
}

// ---------------- orquestación ----------------
let ultimoResultado = { ok: null, error: null, at: null };

/** Último estado de sincronización (para pantallas de diagnóstico). */
export const obtenerUltimoSync = () => ultimoResultado;

export async function sincronizar(uid) {
  if (!uid) {
    return { ok: false, error: 'Sesión no iniciada.' };
  }
  if (sincronizando) {
    return { ok: true, skipped: true };
  }

  sincronizando = true;
  let resultado = { ok: true, error: null };

  try {
    await empujarOutbox();
    const resumen = await bajarTodo();
    resultado = { ...resultado, ...resumen };
  } catch (e) {
    resultado = {
      ok: false,
      error: e?.message || 'Error de sincronización',
    };
    console.warn('Sync falló:', resultado.error);

    // Token vencido/inválido: se cierra la sesión para que vuelva a entrar.
    if (e?.status === 401) {
      await clearSession();
    }
  } finally {
    sincronizando = false;
    ultimoResultado = { ...resultado, at: new Date().toISOString() };
    emit('sync');
  }

  return resultado;
}
