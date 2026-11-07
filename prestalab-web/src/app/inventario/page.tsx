'use client';

import React, { useState, useEffect } from 'react';
import {
  Boxes,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  X,
  Edit2,
  Trash2,
  PackageCheck,
  Tag,
  DoorOpen,
  ShieldCheck,
  XCircle,
} from 'lucide-react';
import Header from '@/components/Header';
import { useActiveRole } from '@/context/RoleContext';
import { Articulo, Sala, CondicionArticulo } from '@/types';

export default function InventarioPage() {
  const { activeUser } = useActiveRole();
  const [articulos, setArticulos] = useState<Articulo[]>([]);
  const [salas, setSalas] = useState<Sala[]>([]);
  const [loading, setLoading] = useState(true);

  // Filtros
  const [selectedSalaId, setSelectedSalaId] = useState('todas');
  const [selectedCategoria, setSelectedCategoria] = useState('Todas');
  const [selectedCondicion, setSelectedCondicion] = useState('todas');
  const [searchTerm, setSearchTerm] = useState('');

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingArt, setEditingArt] = useState<Articulo | null>(null);
  const [formData, setFormData] = useState({
    nombre: '',
    categoria: 'Dispositivos' as Articulo['categoria'],
    salaId: '',
    stock: 5,
    stockTotal: 5,
    estado: 'operativo' as Articulo['estado'],
    condicion: 'buen_estado' as CondicionArticulo,
    codigoActivo: '',
    descripcion: '',
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [resArts, resSalas] = await Promise.all([
        fetch('/api/articulos'),
        fetch('/api/salas'),
      ]);
      const dataArts = await resArts.json();
      const dataSalas = await resSalas.json();
      if (dataArts.success) setArticulos(dataArts.data || []);
      if (dataSalas.success) setSalas(dataSalas.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openModal = (art?: Articulo) => {
    if (art) {
      setEditingArt(art);
      setFormData({
        nombre: art.nombre,
        categoria: art.categoria,
        salaId: art.salaId,
        stock: art.stock,
        stockTotal: art.stockTotal,
        estado: art.estado,
        condicion: art.condicion || 'buen_estado',
        codigoActivo: art.codigoActivo,
        descripcion: art.descripcion || '',
      });
    } else {
      setEditingArt(null);
      setFormData({
        nombre: '',
        categoria: 'Herramientas',
        salaId: salas[0]?.id || '',
        stock: 5,
        stockTotal: 5,
        estado: 'operativo',
        condicion: 'buen_estado',
        codigoActivo: `ACT-${Math.floor(1000 + Math.random() * 9000)}`,
        descripcion: '',
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const targetSala = salas.find((s) => s.id === formData.salaId);
      const payload = {
        ...formData,
        salaNombre: targetSala?.nombre || 'Laboratorio',
        fechaRegistro: editingArt?.fechaRegistro || new Date().toISOString().split('T')[0],
      };

      if (editingArt) {
        await fetch(`/api/articulos/${editingArt.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } else {
        await fetch('/api/articulos', {
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

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este artículo del inventario del laboratorio?')) return;
    try {
      await fetch(`/api/articulos/${id}`, { method: 'DELETE' });
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  // Filtrado
  const filteredArticulos = articulos.filter((art) => {
    if (selectedSalaId !== 'todas' && art.salaId !== selectedSalaId) return false;
    if (selectedCategoria !== 'Todas' && art.categoria !== selectedCategoria) return false;
    if (selectedCondicion !== 'todas' && (art.condicion || 'buen_estado') !== selectedCondicion) return false;

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const matchName = art.nombre?.toLowerCase().includes(term);
      const matchCode = art.codigoActivo?.toLowerCase().includes(term);
      const matchDesc = art.descripcion?.toLowerCase().includes(term);
      if (!matchName && !matchCode && !matchDesc) return false;
    }

    return true;
  });

  const canEdit = activeUser.rol === 'admin' || activeUser.rol === 'gestor';

  return (
    <>
      <Header
        title="Gestión de Inventario Localizado por Laboratorio"
        subtitle="Control en tiempo real de activos, herramientas y equipos clasificados por condición física y ubicación."
      />

      <main className="p-8 space-y-6 max-w-7xl mx-auto w-full">
        {/* Barra de Filtros */}
        <div className="bg-white p-5 rounded-[18px] border border-[var(--border)]  flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            {/* Buscador */}
            <div className="relative min-w-[220px]">
              <Search className="w-4 h-4 text-[var(--text-soft)] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar por código o nombre..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-[13px] bg-[var(--background)] border border-[var(--border)] rounded-[14px] text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--green-soft-strong)]"
              />
            </div>

            {/* Selector de Laboratorio / Sala */}
            <select
              value={selectedSalaId}
              onChange={(e) => setSelectedSalaId(e.target.value)}
              className="text-[13px] bg-[var(--background)] border border-[var(--border)] rounded-[14px] px-3 py-2 text-[var(--text-muted)] font-medium focus:outline-none focus:ring-2 focus:ring-[var(--green-soft-strong)]"
            >
              <option value="todas">Todos los Laboratorios</option>
              {salas.map((sala) => (
                <option key={sala.id} value={sala.id}>
                  {sala.codigo} - {sala.nombre}
                </option>
              ))}
            </select>

            {/* Selector de Categoría */}
            <select
              value={selectedCategoria}
              onChange={(e) => setSelectedCategoria(e.target.value)}
              className="text-[13px] bg-[var(--background)] border border-[var(--border)] rounded-[14px] px-3 py-2 text-[var(--text-muted)] font-medium focus:outline-none focus:ring-2 focus:ring-[var(--green-soft-strong)]"
            >
              <option value="Todas">Todas las Categorías</option>
              <option value="Herramientas">Herramientas</option>
              <option value="Dispositivos">Dispositivos</option>
              <option value="Cables">Cables</option>
              <option value="Redes">Redes</option>
              <option value="Instrumentos">Instrumentos</option>
              <option value="Audio/Video">Audio/Video</option>
              <option value="Equipos de Medición">Equipos de Medición</option>
            </select>

            {/* Selector de Condición Física */}
            <select
              value={selectedCondicion}
              onChange={(e) => setSelectedCondicion(e.target.value)}
              className="text-[13px] bg-[var(--background)] border border-[var(--border)] rounded-[14px] px-3 py-2 text-[var(--text-muted)] font-medium focus:outline-none focus:ring-2 focus:ring-[var(--green-soft-strong)]"
            >
              <option value="todas">Todas las Condiciones</option>
              <option value="buen_estado">Buen Estado</option>
              <option value="daniado">Dañado</option>
              <option value="perdido">Perdido</option>
            </select>
          </div>

          {canEdit && (
            <button
              onClick={() => openModal()}
              className="flex items-center gap-2 px-4 py-2 text-[13px] font-semibold rounded-[14px] bg-[var(--primary)] hover:bg-[var(--primary-dark)] text-white  transition-colors shrink-0"
            >
              <Plus className="w-4 h-4" /> Registrar Activo
            </button>
          )}
        </div>

        {/* Tabla de Artículos */}
        <div className="bg-white rounded-[18px] border border-[var(--border)]  overflow-hidden">
          <div className="p-5 border-b border-[var(--border)] flex items-center justify-between bg-[var(--background)]/60">
            <div>
              <h3 className="font-bold text-[var(--text)] text-base">
                Catálogo Físico Localizado ({filteredArticulos.length} activos)
              </h3>
              <p className="text-[13px] text-[var(--text-soft)]">
                Inventario clasificado y auditado por condición física y laboratorio
              </p>
            </div>
          </div>

          {loading ? (
            <div className="p-12 text-center text-sm text-[var(--text-soft)]">Cargando inventario...</div>
          ) : filteredArticulos.length === 0 ? (
            <div className="p-12 text-center text-[var(--text-soft)] text-sm">
              No hay activos registrados bajo estos criterios.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-[13px]">
                <thead>
                  <tr className="border-b border-[var(--border)] bg-[var(--background)]/90 text-[var(--text-muted)] font-bold uppercase tracking-wider text-[10px]">
                    <th className="p-4">Código / Activo</th>
                    <th className="p-4">Categoría</th>
                    <th className="p-4">Laboratorio Físico</th>
                    <th className="p-4">Disponibilidad</th>
                    <th className="p-4">Condición Física</th>
                    <th className="p-4">Estado Operativo</th>
                    {canEdit && <th className="p-4 text-right">Acciones</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)] text-[var(--text-muted)] font-medium">
                  {filteredArticulos.map((art) => {
                    const agotado = art.stock === 0;
                    const stockPorcentaje = Math.round((art.stock / (art.stockTotal || 1)) * 100);
                    const cond = art.condicion || 'buen_estado';

                    return (
                      <tr key={art.id} className="hover:bg-[var(--background)]/60 transition-colors">
                        <td className="p-4">
                          <span className="text-[10px] font-mono font-bold bg-[var(--green-soft)] text-[var(--text-muted)] px-2 py-0.5 rounded border border-[var(--border)]">
                            {art.codigoActivo}
                          </span>
                          <div className="font-bold text-[var(--text)] text-sm mt-1">{art.nombre}</div>
                          {art.descripcion && (
                            <div className="text-[11px] text-[var(--text-soft)] line-clamp-1 max-w-sm">
                              {art.descripcion}
                            </div>
                          )}
                        </td>

                        <td className="p-4">
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-[var(--green-soft)] text-[var(--text-muted)]">
                            <Tag className="w-3 h-3 text-[var(--text-soft)]" /> {art.categoria}
                          </span>
                        </td>

                        <td className="p-4">
                          <div className="font-bold text-[var(--primary-dark)] bg-[var(--green-soft)] px-2.5 py-1 rounded-lg border border-[var(--border)] inline-flex items-center gap-1.5">
                            <DoorOpen className="w-3.5 h-3.5 text-[var(--primary)]" />
                            <span>{art.salaNombre}</span>
                          </div>
                        </td>

                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <div className="w-20 bg-[var(--border)] rounded-full h-2 overflow-hidden">
                              <div
                                className={`h-full rounded-full ${
                                  agotado
                                    ? 'bg-[var(--error-bg)]0'
                                    : stockPorcentaje < 30
                                    ? 'bg-[var(--warning-text)]'
                                    : 'bg-[var(--green-soft)]0'
                                }`}
                                style={{ width: `${stockPorcentaje}%` }}
                              />
                            </div>
                            <span
                              className={`font-bold ${
                                agotado
                                  ? 'text-[var(--error)]'
                                  : stockPorcentaje < 30
                                  ? 'text-[var(--warning-text)]'
                                  : 'text-[var(--text)]'
                              }`}
                            >
                              {art.stock} / {art.stockTotal}
                            </span>
                          </div>
                        </td>

                        {/* Condición Física */}
                        <td className="p-4">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase border ${
                              cond === 'buen_estado'
                                ? 'bg-[var(--green-soft)] text-[var(--primary-dark)] border-[var(--border)]'
                                : cond === 'daniado'
                                ? 'bg-[var(--warning-bg)] text-[var(--warning-text)] border-[var(--warning-border)]'
                                : 'bg-[var(--error-bg)] text-[var(--error)] border-[var(--error-bg)]'
                            }`}
                          >
                            {cond === 'buen_estado' ? 'Buen Estado' : cond === 'daniado' ? 'Dañado' : 'Perdido'}
                          </span>
                        </td>

                        {/* Estado Operativo */}
                        <td className="p-4">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase border ${
                              art.estado === 'operativo'
                                ? 'bg-[var(--green-soft)] text-[var(--text)] border-[var(--border)]'
                                : art.estado === 'en_reparacion'
                                ? 'bg-[var(--warning-bg)] text-[var(--warning-text)] border-[var(--warning-border)]'
                                : 'bg-[var(--error-bg)] text-[var(--error)] border-[var(--error-bg)]'
                            }`}
                          >
                            {art.estado.replace('_', ' ')}
                          </span>
                        </td>

                        {canEdit && (
                          <td className="p-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => openModal(art)}
                                className="p-1.5 text-[var(--text-soft)] hover:text-[var(--primary)] hover:bg-[var(--green-soft)] rounded-lg transition-colors"
                                title="Editar activo"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              {activeUser.rol === 'admin' && (
                                <button
                                  onClick={() => handleDelete(art.id)}
                                  className="p-1.5 text-[var(--text-soft)] hover:text-[var(--error)] hover:bg-[var(--error-bg)] rounded-lg transition-colors"
                                  title="Dar de baja / eliminar"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* MODAL CREAR / EDITAR ACTIVO */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-[rgba(24,28,26,0.45)]  flex items-center justify-center p-4 z-50 animate-fadeIn">
            <div className="bg-white rounded-[18px] max-w-lg w-full p-6  border border-[var(--border)] space-y-4">
              <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
                <h3 className="font-bold text-[var(--text)] text-base">
                  {editingArt ? 'Editar Activo de Laboratorio' : 'Registrar Nuevo Activo Localizado'}
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
                      Nombre del Equipo / Herramienta *
                    </label>
                    <input
                      type="text"
                      value={formData.nombre}
                      onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                      placeholder="Ej: Multímetro Digital Fluke 115"
                      className="w-full text-[13px] p-2.5 border border-[var(--border)] rounded-[14px]"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[13px] font-semibold text-[var(--text-muted)] mb-1">
                      Código Activo *
                    </label>
                    <input
                      type="text"
                      value={formData.codigoActivo}
                      onChange={(e) => setFormData({ ...formData, codigoActivo: e.target.value })}
                      className="w-full text-[13px] p-2.5 border border-[var(--border)] rounded-[14px] uppercase font-mono"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[13px] font-semibold text-[var(--text-muted)] mb-1">
                      Laboratorio Físico *
                    </label>
                    <select
                      value={formData.salaId}
                      onChange={(e) => setFormData({ ...formData, salaId: e.target.value })}
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
                      Categoría
                    </label>
                    <select
                      value={formData.categoria}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          categoria: e.target.value as Articulo['categoria'],
                        })
                      }
                      className="w-full text-[13px] p-2.5 border border-[var(--border)] rounded-[14px] bg-white"
                    >
                      <option value="Herramientas">Herramientas</option>
                      <option value="Dispositivos">Dispositivos</option>
                      <option value="Cables">Cables</option>
                      <option value="Redes">Redes</option>
                      <option value="Instrumentos">Instrumentos</option>
                      <option value="Audio/Video">Audio/Video</option>
                      <option value="Equipos de Medición">Equipos de Medición</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[13px] font-semibold text-[var(--text-muted)] mb-1">
                      Condición Física *
                    </label>
                    <select
                      value={formData.condicion}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          condicion: e.target.value as CondicionArticulo,
                        })
                      }
                      className="w-full text-[13px] p-2.5 border border-[var(--border)] rounded-[14px] bg-white font-medium"
                    >
                      <option value="buen_estado">Buen Estado</option>
                      <option value="daniado">Dañado (Requiere reparación)</option>
                      <option value="perdido">Perdido (Extraviado)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[13px] font-semibold text-[var(--text-muted)] mb-1">
                      Estado Operativo
                    </label>
                    <select
                      value={formData.estado}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          estado: e.target.value as Articulo['estado'],
                        })
                      }
                      className="w-full text-[13px] p-2.5 border border-[var(--border)] rounded-[14px] bg-white"
                    >
                      <option value="operativo">Operativo</option>
                      <option value="en_reparacion">En Reparación</option>
                      <option value="de_baja">De Baja</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[13px] font-semibold text-[var(--text-muted)] mb-1">
                      Stock Libre *
                    </label>
                    <input
                      type="number"
                      value={formData.stock}
                      onChange={(e) =>
                        setFormData({ ...formData, stock: Number(e.target.value) })
                      }
                      className="w-full text-[13px] p-2.5 border border-[var(--border)] rounded-[14px]"
                      min={0}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[13px] font-semibold text-[var(--text-muted)] mb-1">
                      Stock Total *
                    </label>
                    <input
                      type="number"
                      value={formData.stockTotal}
                      onChange={(e) =>
                        setFormData({ ...formData, stockTotal: Number(e.target.value) })
                      }
                      className="w-full text-[13px] p-2.5 border border-[var(--border)] rounded-[14px]"
                      min={1}
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[13px] font-semibold text-[var(--text-muted)] mb-1">
                    Especificaciones y Notas
                  </label>
                  <textarea
                    rows={2}
                    value={formData.descripcion}
                    onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                    placeholder="Número de serie, calibración, conectores incluidos..."
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
                    Guardar Activo
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
