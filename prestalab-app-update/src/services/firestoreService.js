/**
 * Capa de servicios de datos — la UI NO cambia.
 *
 * Lecturas y suscripciones: SIEMPRE desde SQLite (offline-first).
 * Escrituras del estudiante: SQLite + outbox (se suben solas al reconectar).
 * El syncEngine es el único que habla con la API (Vercel).
 */
import {
  listarArticulos,
  obtenerArticulo,
  suscribirArticulos,
} from '../data/articulosRepo';
import { listarSalas, suscribirSalas } from '../data/salasRepo';
import {
  crearSolicitud,
  listarPrestamosDe,
  obtenerPrestamo,
  registrarDevolucion,
  suscribirPrestamosDe,
} from '../data/prestamosRepo';

// ==========================================
// ARTÍCULOS
// ==========================================

/** Filtros soportados: { category, salaId, available, search } */
export const getArticles = async (filters = {}) => {
  let lista = listarArticulos();
  if (filters.category && filters.category !== 'Todos') {
    lista = lista.filter((a) => a.categoria === filters.category);
  }
  if (filters.salaId && filters.salaId !== 'todas') {
    lista = lista.filter((a) => a.salaId === filters.salaId);
  }
  if (filters.available) {
    lista = lista.filter((a) => Number(a.stock) > 0);
  }
  return lista;
};

export const getArticle = async (articleId) => {
  const articulo = obtenerArticulo(articleId);
  if (!articulo) throw new Error('Artículo no encontrado');
  return articulo;
};

export const subscribeToArticles = (callback) => suscribirArticulos(callback);

// ==========================================
// SALAS Y LABORATORIOS
// ==========================================

export const getSalas = async () => listarSalas();

export const subscribeToSalas = (callback) => suscribirSalas(callback);

// ==========================================
// PRÉSTAMOS
// ==========================================

export const createLoan = async (loanData) => {
  const id = crearSolicitud(loanData);
  return { id, ...loanData, estado: 'pendiente' };
};

export const getLoans = async (userId) => listarPrestamosDe(userId);

export const getLoan = async (loanId) => obtenerPrestamo(loanId);

export const returnLoan = async (loanId) => {
  registrarDevolucion(loanId);
  return { ok: true, id: loanId, estado: 'devuelto' };
};

export const subscribeToLoans = (userId, callback) =>
  suscribirPrestamosDe(userId, callback);
