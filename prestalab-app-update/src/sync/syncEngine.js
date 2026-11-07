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

  for (const sala of data.salas || []) {
    try {
      aplicarSala(sala);
    } catch (e) {
      console.warn('aplicarSala:', e?.message);
    }
  }

  for (const articulo of data.articulos || []) {
    try {
      aplicarArticulo(articulo);
    } catch (e) {
      console.warn('aplicarArticulo:', e?.message);
    }
  }

  for (const prestamo of data.prestamos || []) {
    try {
      aplicarPrestamo(prestamo);
    } catch (e) {
      console.warn('aplicarPrestamo:', e?.message);
    }
  }

  emit('salas');
  emit('articulos');
  emit('prestamos');
}

// ---------------- orquestación ----------------
export async function sincronizar(uid) {
  if (!uid || sincronizando) return { ok: false, razon: 'en curso o sin usuario' };
  sincronizando = true;
  const resultado = { ok: true, error: null };

  try {
    await empujarOutbox();
    await bajarTodo();
  } catch (e) {
    resultado.ok = false;
    resultado.error = e?.message || 'error de sincronización';
    console.warn('Sync falló:', resultado.error);

    // Token vencido/inválido: se cierra la sesión para que vuelva a entrar.
    if (e?.status === 401) {
      await clearSession();
    }
  } finally {
    sincronizando = false;
  }
  return resultado;
}
