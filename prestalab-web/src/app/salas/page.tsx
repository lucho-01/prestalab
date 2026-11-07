'use client';

import React, { useState, useEffect } from 'react';
import {
  DoorOpen,
  Plus,
  Users,
  Boxes,
  MapPin,
  CheckCircle2,
  Wrench,
  AlertTriangle,
  X,
  Edit2,
  Trash2,
} from 'lucide-react';
import Header from '@/components/Header';
import { useActiveRole } from '@/context/RoleContext';
import { Sala, Usuario } from '@/types';

export default function SalasPage() {
  const { activeUser } = useActiveRole();
  const [salas, setSalas] = useState<Sala[]>([]);
  const [gestores, setGestores] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal Crear/Editar
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSala, setEditingSala] = useState<Sala | null>(null);
  const [formData, setFormData] = useState({
    nombre: '',
    codigo: '',
    edificio: '',
    capacidad: 25,
    tipo: 'Redes' as Sala['tipo'],
    estado: 'disponible' as Sala['estado'],
    gestorResponsableId: '',
    descripcion: '',
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [resSalas, resUsers] = await Promise.all([
        fetch('/api/salas'),
        fetch('/api/usuarios?rol=gestor'),
      ]);
      const dataSalas = await resSalas.json();
      const dataUsers = await resUsers.json();
      if (dataSalas.success) setSalas(dataSalas.data || []);
      if (dataUsers.success) setGestores(dataUsers.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openModal = (sala?: Sala) => {
    if (sala) {
      setEditingSala(sala);
      setFormData({
        nombre: sala.nombre,
        codigo: sala.codigo,
        edificio: sala.edificio,
        capacidad: sala.capacidad,
        tipo: sala.tipo,
        estado: sala.estado,
        gestorResponsableId: sala.gestorResponsableId || '',
        descripcion: sala.descripcion || '',
      });
    } else {
      setEditingSala(null);
      setFormData({
        nombre: '',
        codigo: '',
        edificio: 'Edificio de Ingeniería - Bloque B',
        capacidad: 25,
        tipo: 'Redes',
        estado: 'disponible',
        gestorResponsableId: gestores[0]?.id || '',
        descripcion: '',
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const selectedGestor = gestores.find((g) => g.id === formData.gestorResponsableId);
      const payload = {
        ...formData,
        gestorNombre: selectedGestor?.nombre || '',
      };

      if (editingSala) {
        await fetch(`/api/salas/${editingSala.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } else {
        await fetch('/api/salas', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }
      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const toggleEstado = async (sala: Sala, nuevoEstado: Sala['estado']) => {
    try {
      await fetch(`/api/salas/${sala.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado: nuevoEstado }),
      });
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const canEdit = activeUser.rol === 'admin';

  return (
    <>
      <Header
        title="Gestión de Salas y Espacios Académicos"
        subtitle="Control de infraestructura de laboratorios, capacidad física y gestores asignados."
      />

      <main className="p-8 space-y-6 max-w-7xl mx-auto w-full">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-[var(--text)] text-lg">Catálogo Maestro de Laboratorios</h3>
            <p className="text-[13px] text-[var(--text-soft)]">
              {salas.length} espacios académicos registrados en la plataforma
            </p>
          </div>

          {canEdit && (
            <button
              onClick={() => openModal()}
              className="flex items-center gap-2 px-4 py-2 text-[13px] font-semibold rounded-[14px] bg-[var(--primary)] hover:bg-[var(--primary-dark)] text-white  transition-colors"
            >
              <Plus className="w-4 h-4" /> Agregar Laboratorio
            </button>
          )}
        </div>

        {loading ? (
          <div className="p-12 text-center text-sm text-[var(--text-soft)]">Cargando salas...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {salas.map((sala) => (
              <div
                key={sala.id}
                className="bg-white rounded-[18px] border border-[var(--border)]  hover: transition-all p-6 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <span className="text-[13px] font-extrabold px-2.5 py-1 rounded-lg bg-[var(--green-soft)] text-[var(--primary-dark)] border border-[var(--border)]">
                      {sala.codigo}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase border ${
                        sala.estado === 'disponible'
                          ? 'bg-[var(--green-soft)] text-[var(--primary-dark)] border-[var(--border)]'
                          : sala.estado === 'ocupado'
                          ? 'bg-[var(--warning-bg)] text-[var(--warning-text)] border-[var(--warning-border)]'
                          : 'bg-[var(--error-bg)] text-[var(--error)] border-[var(--error-bg)]'
                      }`}
                    >
                      {sala.estado}
                    </span>
                  </div>

                  <div>
                    <h4 className="font-bold text-[var(--text)] text-base">{sala.nombre}</h4>
                    <p className="text-[13px] text-[var(--text-soft)] flex items-center gap-1 mt-1">
                      <MapPin className="w-3.5 h-3.5 text-[var(--text-soft)] shrink-0" />
                      <span>{sala.edificio}</span>
                    </p>
                  </div>

                  {sala.descripcion && (
                    <p className="text-[13px] text-[var(--text-muted)] bg-[var(--background)] p-3 rounded-[14px] border border-[var(--border)]/60 leading-relaxed">
                      {sala.descripcion}
                    </p>
                  )}

                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[var(--border)] text-[13px] text-[var(--text-muted)]">
                    <div className="bg-[var(--background)] p-2.5 rounded-lg border border-[var(--border)]/50">
                      <span className="text-[10px] uppercase font-bold text-[var(--text-soft)] block">
                        Capacidad
                      </span>
                      <strong className="text-[var(--text)]">{sala.capacidad} estudiantes</strong>
                    </div>
                    <div className="bg-[var(--background)] p-2.5 rounded-lg border border-[var(--border)]/50">
                      <span className="text-[10px] uppercase font-bold text-[var(--text-soft)] block">
                        Especialidad
                      </span>
                      <strong className="text-[var(--text)]">{sala.tipo}</strong>
                    </div>
                  </div>

                  <div className="text-[13px] text-[var(--text-muted)]">
                    <span className="text-[10px] uppercase font-bold text-[var(--text-soft)] block">
                      Gestor Responsable
                    </span>
                    <strong className="text-[var(--primary-dark)] font-semibold">
                      {sala.gestorNombre || 'Sin gestor asignado'}
                    </strong>
                  </div>
                </div>

                {/* Acciones de Sala */}
                {canEdit && (
                  <div className="mt-5 pt-4 border-t border-[var(--border)] flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => toggleEstado(sala, 'disponible')}
                        className={`text-[10px] px-2 py-1 rounded font-bold ${
                          sala.estado === 'disponible'
                            ? 'bg-[var(--primary)] text-white'
                            : 'bg-[var(--green-soft)] text-[var(--text-muted)] hover:bg-[var(--border)]'
                        }`}
                      >
                        Libre
                      </button>
                      <button
                        onClick={() => toggleEstado(sala, 'ocupado')}
                        className={`text-[10px] px-2 py-1 rounded font-bold ${
                          sala.estado === 'ocupado'
                            ? 'bg-[var(--warning-text)] text-white'
                            : 'bg-[var(--green-soft)] text-[var(--text-muted)] hover:bg-[var(--border)]'
                        }`}
                      >
                        Ocupado
                      </button>
                      <button
                        onClick={() => toggleEstado(sala, 'mantenimiento')}
                        className={`text-[10px] px-2 py-1 rounded font-bold ${
                          sala.estado === 'mantenimiento'
                            ? 'bg-[var(--error)] text-white'
                            : 'bg-[var(--green-soft)] text-[var(--text-muted)] hover:bg-[var(--border)]'
                        }`}
                      >
                        Mantenimiento
                      </button>
                    </div>

                    <button
                      onClick={() => openModal(sala)}
                      className="p-1.5 text-[var(--text-soft)] hover:text-[var(--primary)] hover:bg-[var(--green-soft)] rounded-lg transition-colors"
                      title="Editar parámetros de la sala"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* MODAL CREAR / EDITAR SALA */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-[rgba(24,28,26,0.45)]  flex items-center justify-center p-4 z-50 animate-fadeIn">
            <div className="bg-white rounded-[18px] max-w-lg w-full p-6  border border-[var(--border)] space-y-4">
              <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
                <h3 className="font-bold text-[var(--text)] text-base">
                  {editingSala ? 'Editar Laboratorio' : 'Registrar Nuevo Laboratorio'}
                </h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-[var(--text-soft)] hover:text-[var(--text-muted)]"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSave} className="space-y-3">
                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-2">
                    <label className="block text-[13px] font-semibold text-[var(--text-muted)] mb-1">
                      Nombre del Laboratorio *
                    </label>
                    <input
                      type="text"
                      value={formData.nombre}
                      onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                      placeholder="Ej: Laboratorio de Telecomunicaciones"
                      className="w-full text-[13px] p-2.5 border border-[var(--border)] rounded-[14px]"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[13px] font-semibold text-[var(--text-muted)] mb-1">
                      Código *
                    </label>
                    <input
                      type="text"
                      value={formData.codigo}
                      onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
                      placeholder="LAB-201"
                      className="w-full text-[13px] p-2.5 border border-[var(--border)] rounded-[14px] uppercase"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[13px] font-semibold text-[var(--text-muted)] mb-1">
                    Ubicación Física / Edificio *
                  </label>
                  <input
                    type="text"
                    value={formData.edificio}
                    onChange={(e) => setFormData({ ...formData, edificio: e.target.value })}
                    placeholder="Ej: Edificio de Ingeniería - Bloque B (Piso 2)"
                    className="w-full text-[13px] p-2.5 border border-[var(--border)] rounded-[14px]"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[13px] font-semibold text-[var(--text-muted)] mb-1">
                      Capacidad Máxima *
                    </label>
                    <input
                      type="number"
                      value={formData.capacidad}
                      onChange={(e) =>
                        setFormData({ ...formData, capacidad: Number(e.target.value) })
                      }
                      className="w-full text-[13px] p-2.5 border border-[var(--border)] rounded-[14px]"
                      required
                      min={1}
                    />
                  </div>
                  <div>
                    <label className="block text-[13px] font-semibold text-[var(--text-muted)] mb-1">
                      Tipo / Especialidad
                    </label>
                    <select
                      value={formData.tipo}
                      onChange={(e) =>
                        setFormData({ ...formData, tipo: e.target.value as Sala['tipo'] })
                      }
                      className="w-full text-[13px] p-2.5 border border-[var(--border)] rounded-[14px] bg-white"
                    >
                      <option value="Redes">Redes</option>
                      <option value="Electrónica">Electrónica</option>
                      <option value="Software">Software</option>
                      <option value="Hardware">Hardware</option>
                      <option value="Multiuso">Multiuso</option>
                      <option value="Química">Química</option>
                      <option value="Física">Física</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[13px] font-semibold text-[var(--text-muted)] mb-1">
                    Gestor Responsable del Laboratorio
                  </label>
                  <select
                    value={formData.gestorResponsableId}
                    onChange={(e) =>
                      setFormData({ ...formData, gestorResponsableId: e.target.value })
                    }
                    className="w-full text-[13px] p-2.5 border border-[var(--border)] rounded-[14px] bg-white"
                  >
                    <option value="">Sin gestor asignado</option>
                    {gestores.map((gestor) => (
                      <option key={gestor.id} value={gestor.id}>
                        {gestor.nombre} ({gestor.departamento})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[13px] font-semibold text-[var(--text-muted)] mb-1">
                    Equipamiento y Descripción
                  </label>
                  <textarea
                    rows={2}
                    value={formData.descripcion}
                    onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                    placeholder="Detalles sobre bancos de trabajo, tomas de corriente, instrumentación..."
                    className="w-full text-[13px] p-2.5 border border-[var(--border)] rounded-[14px]"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-[var(--border)]">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 text-[13px] font-semibold rounded-[14px] text-[var(--text-muted)] hover:bg-[var(--green-soft)]"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-[13px] font-semibold rounded-[14px] bg-[var(--primary)] hover:bg-[var(--primary-dark)] text-white "
                  >
                    Guardar Laboratorio
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

