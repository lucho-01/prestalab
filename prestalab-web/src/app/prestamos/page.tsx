'use client';

import React, { useState, useEffect } from 'react';
import {
  Check,
  X,
  Shuffle,
  Clock,
  RotateCcw,
  Plus,
  Search,
  Filter,
  AlertCircle,
  CheckCircle2,
  Calendar,
  User,
  DoorOpen,
  Boxes,
  HelpCircle,
} from 'lucide-react';
import Header from '@/components/Header';
import { useActiveRole } from '@/context/RoleContext';
import { SolicitudPrestamo, Sala, Articulo } from '@/types';

export default function PrestamosPage() {
  const { activeUser } = useActiveRole();
  const [solicitudes, setSolicitudes] = useState<SolicitudPrestamo[]>([]);
  const [salas, setSalas] = useState<Sala[]>([]);
  const [articulos, setArticulos] = useState<Articulo[]>([]);
  const [loading, setLoading] = useState(true);

  // Filtros
  const [filterEstado, setFilterEstado] = useState('todos');
  const [filterSala, setFilterSala] = useState('todas');
  const [searchTerm, setSearchTerm] = useState('');

  // Modales
  const [selectedSol, setSelectedSol] = useState<SolicitudPrestamo | null>(null);
  const [modalType, setModalType] = useState<'aprobar' | 'rechazar' | 'reasignar' | 'nueva' | null>(null);

  // Form states para acciones
  const [motivoRechazo, setMotivoRechazo] = useState('');
  const [nuevaSalaId, setNuevaSalaId] = useState('');
  const [motivoReasignacion, setMotivoReasignacion] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Form nueva solicitud
  const [newSolData, setNewSolData] = useState({
    userNombre: activeUser.nombre,
    userEmail: activeUser.email,
    userRol: 'estudiante',
    tipoRecurso: 'mixto',
    articuloId: '',
    salaId: '',
    cantidad: 1,
    fechaInicio: '',
    fechaFin: '',
    motivo: '',
    observaciones: '',
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [resSols, resSalas, resArts] = await Promise.all([
        fetch('/api/solicitudes'),
        fetch('/api/salas'),
        fetch('/api/articulos'),
      ]);

      const dataSols = await resSols.json();
      const dataSalas = await resSalas.json();
      const dataArts = await resArts.json();

      if (dataSols.success) setSolicitudes(dataSols.data || []);
      if (dataSalas.success) setSalas(dataSalas.data || []);
      if (dataArts.success) setArticulos(dataArts.data || []);
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filtrado de solicitudes
  const filteredSolicitudes = solicitudes.filter((s) => {
    // Control de rol: Gestor solo ve salas que supervisa (a menos que sea Admin)
    if (activeUser.rol === 'gestor') {
      const supervisadas = activeUser.laboratoriosAsignados || [];
      if (!supervisadas.includes(s.salaId)) return false;
    } else if (activeUser.rol === 'estudiante' || activeUser.rol === 'docente') {
      if (s.userId !== activeUser.id) return false;
    }

    if (filterEstado !== 'todos' && s.estado !== filterEstado) return false;
    if (filterSala !== 'todas' && s.salaId !== filterSala) return false;

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const matchUser = s.userNombre?.toLowerCase().includes(term);
      const matchRecurso = s.articuloNombre?.toLowerCase().includes(term);
      const matchSala = s.salaNombre?.toLowerCase().includes(term);
      const matchMotivo = s.motivo?.toLowerCase().includes(term);
      if (!matchUser && !matchRecurso && !matchSala && !matchMotivo) return false;
    }

    return true;
  });

  // Acciones del Gestor
  const handleAprobar = async (conReasignacion: boolean = false) => {
    if (!selectedSol) return;
    setActionLoading(true);
    setFeedback(null);
    try {
      const payload: any = {
        gestorId: activeUser.id,
        gestorNombre: activeUser.nombre,
      };

      if (conReasignacion && nuevaSalaId) {
        payload.nuevaSalaId = nuevaSalaId;
        payload.motivoReasignacion = motivoReasignacion || 'Reasignación de laboratorio por mantenimiento u optimización horaria.';
      }

      const res = await fetch(`/api/solicitudes/${selectedSol.id}/aprobar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        setFeedback({ type: 'success', message: data.message });
        setModalType(null);
        setSelectedSol(null);
        fetchData();
      } else {
        setFeedback({ type: 'error', message: data.error });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
    } finally {
      setActionLoading(false);
    }
  };

  const handleRechazar = async () => {
    if (!selectedSol) return;
    if (!motivoRechazo || motivoRechazo.trim().length < 5) {
      alert('Por favor ingresa un motivo justificativo detallado.');
      return;
    }

    setActionLoading(true);
    setFeedback(null);
    try {
      const res = await fetch(`/api/solicitudes/${selectedSol.id}/rechazar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gestorId: activeUser.id,
          gestorNombre: activeUser.nombre,
          motivoRechazo: motivoRechazo.trim(),
        }),
      });

      const data = await res.json();
      if (data.success) {
        setFeedback({ type: 'success', message: data.message });
        setModalType(null);
        setSelectedSol(null);
        setMotivoRechazo('');
        fetchData();
      } else {
        setFeedback({ type: 'error', message: data.error });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
    } finally {
      setActionLoading(false);
    }
  };

  const handleReasignar = async () => {
    if (!selectedSol) return;
    if (!nuevaSalaId) {
      alert('Selecciona una sala equivalente de destino.');
      return;
    }
    if (!motivoReasignacion) {
      alert('Ingresa el motivo institucional de la reasignación de sala.');
      return;
    }

    setActionLoading(true);
    setFeedback(null);
    try {
      const res = await fetch(`/api/solicitudes/${selectedSol.id}/reasignar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nuevaSalaId,
          motivoReasignacion,
          gestorId: activeUser.id,
          gestorNombre: activeUser.nombre,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setFeedback({ type: 'success', message: data.message });
        setModalType(null);
        setSelectedSol(null);
        setNuevaSalaId('');
        setMotivoReasignacion('');
        fetchData();
      } else {
        setFeedback({ type: 'error', message: data.error });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDevolver = async (solId: string) => {
    if (!confirm('¿Confirmas el retorno y devolución formal de este préstamo al inventario del laboratorio?')) {
      return;
    }

    try {
      const res = await fetch(`/api/solicitudes/${solId}/aprobar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          estado: 'devuelto',
          fechaDevolucion: new Date().toISOString(),
        }),
      });
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleCrearSolicitud = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSolData.salaId || !newSolData.motivo) {
      alert('Selecciona una sala e indica el motivo académico.');
      return;
    }

    setActionLoading(true);
    try {
      const salaSeleccionada = salas.find((s) => s.id === newSolData.salaId);
      const articuloSeleccionado = articulos.find((a) => a.id === newSolData.articuloId);

      const res = await fetch('/api/solicitudes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: activeUser.id,
          userNombre: activeUser.nombre,
          userEmail: activeUser.email,
          userRol: activeUser.rol === 'admin' || activeUser.rol === 'gestor' ? 'docente' : activeUser.rol,
          tipoRecurso: articuloSeleccionado ? 'mixto' : 'sala',
          articuloId: articuloSeleccionado?.id,
          articuloNombre: articuloSeleccionado?.nombre,
          salaId: newSolData.salaId,
          salaNombre: salaSeleccionada?.nombre,
          cantidad: newSolData.cantidad,
          fechaInicio: newSolData.fechaInicio,
          fechaFin: newSolData.fechaFin,
          motivo: newSolData.motivo,
          observaciones: newSolData.observaciones,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setFeedback({ type: 'success', message: 'Solicitud enviada exitosamente a revisión del Gestor.' });
        setModalType(null);
        fetchData();
      } else {
        alert(data.error);
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const canManage = activeUser.rol === 'admin' || activeUser.rol === 'gestor';

  return (
    <>
      <Header
        title="Gestión Dinámica de Préstamos y Asignaciones"
        subtitle="Flujo en tiempo real: Evaluación de solicitudes, reasignación de espacios y auditoría de préstamos."
      />

      <main className="p-8 space-y-6 max-w-7xl mx-auto w-full">
        {/* Banner de Feedback */}
        {feedback && (
          <div
            className={`p-4 rounded-[14px] flex items-center justify-between text-sm font-medium ${
              feedback.type === 'success'
                ? 'bg-[var(--green-soft)] text-[var(--primary-dark)] border border-[var(--border)]'
                : 'bg-[var(--error-bg)] text-[var(--error)] border border-rose-200'
            }`}
          >
            <div className="flex items-center gap-2">
              {feedback.type === 'success' ? (
                <CheckCircle2 className="w-5 h-5 text-[var(--primary)]" />
              ) : (
                <AlertCircle className="w-5 h-5 text-[var(--error)]" />
              )}
              <span>{feedback.message}</span>
            </div>
            <button
              onClick={() => setFeedback(null)}
              className="text-[13px] underline hover:opacity-75"
            >
              Cerrar
            </button>
          </div>
        )}

        {/* Toolbar de Filtros y Búsqueda */}
        <div className="bg-white p-5 rounded-[18px] border border-[var(--border)]  flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            {/* Buscador */}
            <div className="relative min-w-[240px]">
              <Search className="w-4 h-4 text-[var(--text-soft)] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar por usuario, sala, recurso..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-[13px] bg-[var(--background)] border border-[var(--border)] rounded-[14px] text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--green-soft-strong)]"
              />
            </div>

            {/* Filtro Estado */}
            <select
              value={filterEstado}
              onChange={(e) => setFilterEstado(e.target.value)}
              className="text-[13px] bg-[var(--background)] border border-[var(--border)] rounded-[14px] px-3 py-2 text-[var(--text-muted)] font-medium focus:outline-none focus:ring-2 focus:ring-[var(--green-soft-strong)]"
            >
              <option value="todos">Todos los Estados</option>
              <option value="pendiente">Pendientes de Aprobación</option>
              <option value="activo">Préstamos Activos</option>
              <option value="devuelto">Devueltos / Finalizados</option>
              <option value="rechazado">Rechazados</option>
            </select>

            {/* Filtro Sala */}
            <select
              value={filterSala}
              onChange={(e) => setFilterSala(e.target.value)}
              className="text-[13px] bg-[var(--background)] border border-[var(--border)] rounded-[14px] px-3 py-2 text-[var(--text-muted)] font-medium focus:outline-none focus:ring-2 focus:ring-[var(--green-soft-strong)]"
            >
              <option value="todas">Todas las Salas</option>
              {salas.map((sala) => (
                <option key={sala.id} value={sala.id}>
                  {sala.codigo} - {sala.nombre}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto justify-end">
            <button
              onClick={() => {
                const today = new Date().toISOString().split('T')[0];
                const twoDaysLater = new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0];
                setNewSolData({
                  ...newSolData,
                  salaId: salas[0]?.id || '',
                  fechaInicio: today,
                  fechaFin: twoDaysLater,
                });
                setModalType('nueva');
              }}
              className="flex items-center gap-2 px-4 py-2 text-[13px] font-semibold rounded-[14px] bg-[var(--primary)] hover:bg-[var(--primary-dark)] text-white  transition-colors"
            >
              <Plus className="w-4 h-4" /> Nueva Solicitud
            </button>
          </div>
        </div>

        {/* Tabla de Préstamos y Solicitudes */}
        <div className="bg-white rounded-[18px] border border-[var(--border)]  overflow-hidden">
          <div className="p-5 border-b border-[var(--border)] flex items-center justify-between bg-[var(--background)]/60">
            <div>
              <h3 className="font-bold text-[var(--text)] text-base">
                Registro de Solicitudes y Préstamos
              </h3>
              <p className="text-[13px] text-[var(--text-soft)]">
                Mostrando {filteredSolicitudes.length} registros según tus permisos de rol
              </p>
            </div>
            {activeUser.rol === 'gestor' && (
              <span className="text-[13px] font-semibold px-2.5 py-1 rounded-lg bg-[var(--warning-bg)] text-[var(--warning-text)] border border-[var(--warning-border)]">
                Vista de Gestor: Solo tus salas asignadas
              </span>
            )}
          </div>

          {loading ? (
            <div className="p-12 text-center text-sm text-[var(--text-soft)]">Cargando registros...</div>
          ) : filteredSolicitudes.length === 0 ? (
            <div className="p-12 text-center text-[var(--text-soft)] text-sm">
              No se encontraron préstamos que coincidan con los filtros seleccionados.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-[13px]">
                <thead>
                  <tr className="border-b border-[var(--border)] bg-[var(--background)]/90 text-[var(--text-muted)] font-bold uppercase tracking-wider text-[10px]">
                    <th className="p-4">Solicitante</th>
                    <th className="p-4">Recurso / Equipo</th>
                    <th className="p-4">Sala Asignada</th>
                    <th className="p-4">Fechas</th>
                    <th className="p-4">Estado</th>
                    <th className="p-4 text-right">Acciones del Gestor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)] text-[var(--text-muted)] font-medium">
                  {filteredSolicitudes.map((sol) => (
                    <tr key={sol.id} className="hover:bg-[var(--background)]/60 transition-colors">
                      {/* Solicitante */}
                      <td className="p-4">
                        <div className="font-bold text-[var(--text)]">{sol.userNombre}</div>
                        <div className="text-[11px] text-[var(--text-soft)]">{sol.userEmail}</div>
                        <span className="inline-block mt-1 text-[10px] uppercase font-semibold px-1.5 py-0.2 rounded bg-[var(--green-soft)] text-[var(--text-muted)] border border-[var(--border)]">
                          {sol.userRol}
                        </span>
                      </td>

                      {/* Recurso */}
                      <td className="p-4">
                        <div className="font-semibold text-[var(--text)]">
                          {sol.articuloNombre || 'Reserva de Espacio'}
                        </div>
                        <div className="text-[11px] text-[var(--text-soft)]">
                          Cantidad: {sol.cantidad} ud • Tipo: {sol.tipoRecurso}
                        </div>
                        <div className="text-[11px] text-[var(--text-soft)] italic line-clamp-1 max-w-xs mt-0.5">
                          "{sol.motivo}"
                        </div>
                      </td>

                      {/* Sala */}
                      <td className="p-4">
                        <div className="font-bold text-[var(--primary-dark)] bg-[var(--green-soft)] px-2.5 py-1 rounded-lg border border-[var(--border)]/80 inline-block">
                          {sol.salaNombre}
                        </div>

                        {sol.fueReasignada && (
                          <div className="mt-1.5">
                            <span
                              className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 cursor-help"
                              title={`Sala original: ${sol.salaOriginalNombre}. Motivo: ${sol.motivoReasignacion}`}
                            >
                              <Shuffle className="w-3 h-3 text-indigo-600" /> Sala Reasignada
                            </span>
                            <p className="text-[10px] text-indigo-600/90 italic mt-0.5 max-w-[200px] line-clamp-1">
                              Orig: {sol.salaOriginalNombre?.split(' ')[0]}...
                            </p>
                          </div>
                        )}
                      </td>

                      {/* Fechas */}
                      <td className="p-4 whitespace-nowrap">
                        <div className="text-[var(--text)] font-semibold">{sol.fechaInicio}</div>
                        <div className="text-[var(--text-soft)] text-[11px]">hasta {sol.fechaFin}</div>
                      </td>

                      {/* Estado */}
                      <td className="p-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider border ${
                            sol.estado === 'pendiente'
                              ? 'bg-[var(--warning-bg)] text-[var(--warning-text)] border-[var(--warning-border)]'
                              : sol.estado === 'activo'
                              ? 'bg-[var(--green-soft)] text-[var(--primary-dark)] border-[var(--border)]'
                              : sol.estado === 'devuelto'
                              ? 'bg-blue-50 text-blue-800 border-blue-300'
                              : 'bg-[var(--error-bg)] text-[var(--error)] border-[var(--error-bg)]'
                          }`}
                        >
                          {sol.estado === 'pendiente' && <Clock className="w-3 h-3" />}
                          {sol.estado === 'activo' && <Check className="w-3 h-3" />}
                          {sol.estado === 'devuelto' && <RotateCcw className="w-3 h-3" />}
                          {sol.estado === 'rechazado' && <X className="w-3 h-3" />}
                          {sol.estado}
                        </span>

                        {sol.estado === 'rechazado' && sol.motivoRechazo && (
                          <p
                            className="text-[10px] text-[var(--error)] mt-1 italic max-w-xs line-clamp-2"
                            title={sol.motivoRechazo}
                          >
                            Motivo: {sol.motivoRechazo}
                          </p>
                        )}
                      </td>

                      {/* Acciones */}
                      <td className="p-4 text-right whitespace-nowrap">
                        {canManage && sol.estado === 'pendiente' ? (
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Botón Reasignar */}
                            <button
                              onClick={() => {
                                setSelectedSol(sol);
                                setNuevaSalaId(sol.salaId);
                                setMotivoReasignacion('');
                                setModalType('reasignar');
                              }}
                              className="p-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 transition-colors cursor-pointer"
                              title="Reasignar a sala equivalente antes de aprobar"
                            >
                              <Shuffle className="w-4 h-4" />
                            </button>

                            {/* Botón Rechazar */}
                            <button
                              onClick={() => {
                                setSelectedSol(sol);
                                setMotivoRechazo('');
                                setModalType('rechazar');
                              }}
                              className="p-1.5 rounded-lg bg-[var(--error-bg)] hover:bg-[var(--error-bg)] text-[var(--error)] border border-rose-200 transition-colors cursor-pointer"
                              title="Rechazar solicitud con motivo justificativo"
                            >
                              <X className="w-4 h-4" />
                            </button>

                            {/* Botón Aprobar */}
                            <button
                              onClick={() => {
                                setSelectedSol(sol);
                                setModalType('aprobar');
                              }}
                              className="px-3 py-1.5 rounded-lg bg-[var(--primary)] hover:bg-[var(--primary-dark)] text-white font-semibold text-[13px] transition-colors flex items-center gap-1  cursor-pointer"
                              title="Aprobar préstamo"
                            >
                              <Check className="w-3.5 h-3.5" /> Aprobar
                            </button>
                          </div>
                        ) : sol.estado === 'activo' ? (
                          <button
                            onClick={() => handleDevolver(sol.id)}
                            className="px-3 py-1.5 rounded-lg bg-[var(--green-soft)] hover:bg-[var(--border)] text-[var(--text-muted)] font-semibold text-[13px] border border-[var(--border)] transition-colors"
                          >
                            Registrar Devolución
                          </button>
                        ) : (
                          <span className="text-[11px] text-[var(--text-soft)] italic">Completado</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* MODAL: APROBAR SOLICITUD */}
        {modalType === 'aprobar' && selectedSol && (
          <div className="fixed inset-0 bg-[rgba(24,28,26,0.45)]  flex items-center justify-center p-4 z-50 animate-fadeIn">
            <div className="bg-white rounded-[18px] max-w-md w-full p-6  border border-[var(--border)] space-y-4">
              <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
                <h3 className="font-bold text-[var(--text)] text-base flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-[var(--primary)]" />
                  Aprobar Solicitud de Préstamo
                </h3>
                <button
                  onClick={() => setModalType(null)}
                  className="text-[var(--text-soft)] hover:text-[var(--text-muted)]"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="bg-[var(--background)] p-3 rounded-[14px] border border-[var(--border)] text-[13px] space-y-1.5">
                <p>
                  <strong>Solicitante:</strong> {selectedSol.userNombre} ({selectedSol.userRol})
                </p>
                <p>
                  <strong>Recurso:</strong> {selectedSol.articuloNombre || 'Reserva de Sala'} (
                  {selectedSol.cantidad} ud)
                </p>
                <p>
                  <strong>Sala:</strong> {selectedSol.salaNombre}
                </p>
                <p>
                  <strong>Vigencia:</strong> {selectedSol.fechaInicio} al {selectedSol.fechaFin}
                </p>
              </div>

              <div className="p-3 bg-[var(--green-soft)] text-[var(--primary-dark)] rounded-[14px] text-[13px] border border-[var(--border)]">
                Al aprobar, el recurso quedará formalmente en estado <strong>activo</strong> y se
                descontará el stock físico del inventario del laboratorio.
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalType(null)}
                  className="px-4 py-2 text-[13px] font-semibold rounded-[14px] text-[var(--text-muted)] hover:bg-[var(--green-soft)]"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => handleAprobar(false)}
                  disabled={actionLoading}
                  className="px-4 py-2 text-[13px] font-semibold rounded-[14px] bg-[var(--primary)] hover:bg-[var(--primary-dark)] text-white "
                >
                  {actionLoading ? 'Procesando...' : 'Confirmar Aprobación'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL: RECHAZAR SOLICITUD (CON MOTIVO JUSTIFICATIVO OBLIGATORIO) */}
        {modalType === 'rechazar' && selectedSol && (
          <div className="fixed inset-0 bg-[rgba(24,28,26,0.45)]  flex items-center justify-center p-4 z-50 animate-fadeIn">
            <div className="bg-white rounded-[18px] max-w-md w-full p-6  border border-[var(--border)] space-y-4">
              <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
                <h3 className="font-bold text-[var(--text)] text-base flex items-center gap-2 text-[var(--error)]">
                  <AlertCircle className="w-5 h-5 text-[var(--error)]" />
                  Rechazar Solicitud de Reserva
                </h3>
                <button
                  onClick={() => setModalType(null)}
                  className="text-[var(--text-soft)] hover:text-[var(--text-muted)]"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <p className="text-[13px] text-[var(--text-muted)]">
                De acuerdo a la política institucional, debes añadir un{' '}
                <strong>motivo justificativo formal</strong> que será notificado al estudiante o docente:
              </p>

              <div>
                <label className="block text-[13px] font-bold text-[var(--text-muted)] mb-1">
                  Motivo Justificativo del Rechazo *
                </label>
                <textarea
                  rows={3}
                  value={motivoRechazo}
                  onChange={(e) => setMotivoRechazo(e.target.value)}
                  placeholder="Ej: La sala se encuentra bajo mantenimiento correctivo de redes eléctricas durante las fechas solicitadas."
                  className="w-full text-[13px] p-3 border border-[var(--border)] rounded-[14px] focus:ring-2 focus:ring-rose-500 focus:outline-none"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalType(null)}
                  className="px-4 py-2 text-[13px] font-semibold rounded-[14px] text-[var(--text-muted)] hover:bg-[var(--green-soft)]"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleRechazar}
                  disabled={actionLoading || !motivoRechazo.trim()}
                  className="px-4 py-2 text-[13px] font-semibold rounded-[14px] bg-[var(--error)] hover:bg-[#8f1d17] text-white  disabled:opacity-50"
                >
                  {actionLoading ? 'Guardando...' : 'Rechazar con Justificación'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL: REASIGNACIÓN DE SALA (CAMBIO DE SALA EQUIVALENTE) */}
        {modalType === 'reasignar' && selectedSol && (
          <div className="fixed inset-0 bg-[rgba(24,28,26,0.45)]  flex items-center justify-center p-4 z-50 animate-fadeIn">
            <div className="bg-white rounded-[18px] max-w-lg w-full p-6  border border-[var(--border)] space-y-4">
              <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
                <h3 className="font-bold text-[var(--text)] text-base flex items-center gap-2 text-indigo-800">
                  <Shuffle className="w-5 h-5 text-indigo-600" />
                  Reasignación de Espacios (Cambio de Sala)
                </h3>
                <button
                  onClick={() => setModalType(null)}
                  className="text-[var(--text-soft)] hover:text-[var(--text-muted)]"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="bg-indigo-50/70 p-3 rounded-[14px] border border-indigo-200 text-[13px] text-indigo-900">
                <p>
                  <strong>Facultad del Gestor:</strong> En caso de conflicto de horarios o mantenimiento,
                  puedes reasignar una sala alternativa equivalente antes de la aprobación.
                </p>
                <p className="mt-1 font-semibold">
                  Sala original actual:{' '}
                  <span className="underline">{selectedSol.salaNombre}</span>
                </p>
              </div>

              <div>
                <label className="block text-[13px] font-bold text-[var(--text-muted)] mb-1">
                  Nueva Sala Equivalente de Destino *
                </label>
                <select
                  value={nuevaSalaId}
                  onChange={(e) => setNuevaSalaId(e.target.value)}
                  className="w-full text-[13px] p-2.5 border border-[var(--border)] rounded-[14px] focus:ring-2 focus:ring-indigo-500 font-medium bg-white"
                >
                  {salas.map((sala) => (
                    <option key={sala.id} value={sala.id}>
                      {sala.codigo} - {sala.nombre} (Cap: {sala.capacidad} | Estado: {sala.estado})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[13px] font-bold text-[var(--text-muted)] mb-1">
                  Motivo de la Reasignación *
                </label>
                <textarea
                  rows={2}
                  value={motivoReasignacion}
                  onChange={(e) => setMotivoReasignacion(e.target.value)}
                  placeholder="Ej: Se asigna la Sala 105 por mantenimiento eléctrico preventivo en la Sala 104."
                  className="w-full text-[13px] p-3 border border-[var(--border)] rounded-[14px] focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalType(null)}
                  className="px-4 py-2 text-[13px] font-semibold rounded-[14px] text-[var(--text-muted)] hover:bg-[var(--green-soft)]"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleReasignar}
                  disabled={actionLoading || !nuevaSalaId || !motivoReasignacion.trim()}
                  className="px-4 py-2 text-[13px] font-semibold rounded-[14px] bg-[var(--primary-dark)] hover:bg-[#184a2f] text-white  disabled:opacity-50"
                >
                  {actionLoading ? 'Reasignando...' : 'Guardar y Notificar Cambio'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL: NUEVA SOLICITUD */}
        {modalType === 'nueva' && (
          <div className="fixed inset-0 bg-[rgba(24,28,26,0.45)]  flex items-center justify-center p-4 z-50 animate-fadeIn">
            <div className="bg-white rounded-[18px] max-w-lg w-full p-6  border border-[var(--border)] space-y-4">
              <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
                <h3 className="font-bold text-[var(--text)] text-base flex items-center gap-2">
                  <Plus className="w-5 h-5 text-[var(--primary)]" />
                  Tramitar Solicitud de Préstamo
                </h3>
                <button
                  onClick={() => setModalType(null)}
                  className="text-[var(--text-soft)] hover:text-[var(--text-muted)]"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCrearSolicitud} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[13px] font-semibold text-[var(--text-muted)] mb-1">
                      Sala o Laboratorio *
                    </label>
                    <select
                      value={newSolData.salaId}
                      onChange={(e) => setNewSolData({ ...newSolData, salaId: e.target.value })}
                      className="w-full text-[13px] p-2.5 border border-[var(--border)] rounded-[14px] bg-white"
                      required
                    >
                      {salas.map((sala) => (
                        <option key={sala.id} value={sala.id}>
                          {sala.codigo} - {sala.nombre}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[13px] font-semibold text-[var(--text-muted)] mb-1">
                      Artículo o Equipo Específico
                    </label>
                    <select
                      value={newSolData.articuloId}
                      onChange={(e) =>
                        setNewSolData({ ...newSolData, articuloId: e.target.value })
                      }
                      className="w-full text-[13px] p-2.5 border border-[var(--border)] rounded-[14px] bg-white"
                    >
                      <option value="">Solo Reserva de Sala (Sin artículo)</option>
                      {articulos.map((art) => (
                        <option key={art.id} value={art.id}>
                          {art.nombre} ({art.stock} disp.)
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[13px] font-semibold text-[var(--text-muted)] mb-1">
                      Fecha Inicio *
                    </label>
                    <input
                      type="date"
                      value={newSolData.fechaInicio}
                      onChange={(e) =>
                        setNewSolData({ ...newSolData, fechaInicio: e.target.value })
                      }
                      className="w-full text-[13px] p-2 border border-[var(--border)] rounded-[14px]"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[13px] font-semibold text-[var(--text-muted)] mb-1">
                      Fecha Fin *
                    </label>
                    <input
                      type="date"
                      value={newSolData.fechaFin}
                      onChange={(e) =>
                        setNewSolData({ ...newSolData, fechaFin: e.target.value })
                      }
                      className="w-full text-[13px] p-2 border border-[var(--border)] rounded-[14px]"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[13px] font-semibold text-[var(--text-muted)] mb-1">
                    Motivo Académico / Práctica *
                  </label>
                  <textarea
                    rows={2}
                    value={newSolData.motivo}
                    onChange={(e) => setNewSolData({ ...newSolData, motivo: e.target.value })}
                    placeholder="Describe el propósito del préstamo o práctica"
                    className="w-full text-[13px] p-2.5 border border-[var(--border)] rounded-[14px]"
                    required
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-[var(--border)]">
                  <button
                    type="button"
                    onClick={() => setModalType(null)}
                    className="px-4 py-2 text-[13px] font-semibold rounded-[14px] text-[var(--text-muted)] hover:bg-[var(--green-soft)]"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="px-4 py-2 text-[13px] font-semibold rounded-[14px] bg-[var(--primary)] hover:bg-[var(--primary-dark)] text-white "
                  >
                    {actionLoading ? 'Registrando...' : 'Enviar Solicitud'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </>
  );
}
