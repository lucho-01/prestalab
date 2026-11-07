'use client';

import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Plus,
  Search,
  CheckCircle2,
  AlertCircle,
  X,
  Edit2,
  Briefcase,
  DoorOpen,
  Copy,
  KeyRound,
} from 'lucide-react';
import Header from '@/components/Header';
import { Usuario, Sala, UserRole } from '@/types';

const ROL_LABEL: Record<string, string> = {
  admin: 'Administrador',
  gestor: 'Gestor de laboratorio',
};

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [salas, setSalas] = useState<Sala[]>([]);
  const [loading, setLoading] = useState(true);

  // Filtros
  const [filterRol, setFilterRol] = useState('todos');
  const [searchTerm, setSearchTerm] = useState('');

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<Usuario | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [passwordTemporal, setPasswordTemporal] = useState<string | null>(null);
  const [copiado, setCopiado] = useState(false);

  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    telefono: '',
    rol: 'gestor' as UserRole,
    departamento: 'Facultad de Ingeniería',
    matriculaOCodigo: '',
    laboratoriosAsignados: [] as string[],
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [resUsers, resSalas] = await Promise.all([
        fetch('/api/usuarios'),
        fetch('/api/salas'),
      ]);
      const dataUsers = await resUsers.json();
      const dataSalas = await resSalas.json();
      if (dataUsers.success) setUsuarios(dataUsers.data || []);
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

  const openModal = (user?: Usuario) => {
    setError(null);
    setPasswordTemporal(null);
    setCopiado(false);

    if (user) {
      setEditingUser(user);
      setFormData({
        nombre: user.nombre,
        email: user.email,
        telefono: user.telefono || '',
        rol: user.rol,
        departamento: user.departamento || '',
        matriculaOCodigo: user.matriculaOCodigo || '',
        laboratoriosAsignados: user.laboratoriosAsignados || [],
      });
    } else {
      setEditingUser(null);
      setFormData({
        nombre: '',
        email: '',
        telefono: '',
        rol: 'gestor',
        departamento: 'Facultad de Ingeniería',
        matriculaOCodigo: '',
        laboratoriosAsignados: [],
      });
    }
    setIsModalOpen(true);
  };

  const handleToggleLab = (salaId: string) => {
    const current = [...formData.laboratoriosAsignados];
    const index = current.indexOf(salaId);
    if (index > -1) current.splice(index, 1);
    else current.push(salaId);
    setFormData({ ...formData, laboratoriosAsignados: current });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const payload = {
        ...formData,
        laboratoriosAsignados:
          formData.rol === 'gestor' ? formData.laboratoriosAsignados : [],
      };

      const res = await fetch(
        editingUser ? `/api/usuarios/${editingUser.id}` : '/api/usuarios',
        {
          method: editingUser ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        },
      );
      const data = await res.json();

      if (!data.success) {
        setError(data.error || 'No se pudo guardar el usuario.');
        return;
      }

      if (!editingUser && data.passwordTemporal) {
        // Alta real: se muestra la contraseña temporal una sola vez.
        setPasswordTemporal(data.passwordTemporal);
        fetchData();
        return;
      }

      setIsModalOpen(false);
      fetchData();
    } catch (err: any) {
      setError(err.message || 'No se pudo guardar el usuario.');
    } finally {
      setSaving(false);
    }
  };

  const copiarPassword = async () => {
    if (!passwordTemporal) return;
    try {
      await navigator.clipboard.writeText(passwordTemporal);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      // El usuario puede seleccionarla manualmente.
    }
  };

  const filteredUsuarios = usuarios.filter((u) => {
    if (u.rol !== 'admin' && u.rol !== 'gestor') return false;
    if (filterRol !== 'todos' && u.rol !== filterRol) return false;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const matchName = u.nombre?.toLowerCase().includes(term);
      const matchEmail = u.email?.toLowerCase().includes(term);
      const matchCode = u.matriculaOCodigo?.toLowerCase().includes(term);
      if (!matchName && !matchEmail && !matchCode) return false;
    }
    return true;
  });

  const totalAdmins = usuarios.filter((u) => u.rol === 'admin').length;
  const totalGestores = usuarios.filter((u) => u.rol === 'gestor').length;

  return (
    <>
      <Header
        title="Usuarios del portal"
        subtitle="Cuentas con acceso a PrestaLab: administradores y gestores de laboratorio."
      />

      <main className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full">
        {/* Resumen */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="bg-white p-5 rounded-[18px] border border-[var(--border)]">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-soft)]">
                Administradores
              </span>
              <ShieldCheck className="w-5 h-5 text-[var(--error)]" />
            </div>
            <p className="text-2xl font-extrabold text-[var(--text)] mt-2">{totalAdmins}</p>
          </div>
          <div className="bg-white p-5 rounded-[18px] border border-[var(--border)]">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-soft)]">
                Gestores
              </span>
              <Briefcase className="w-5 h-5 text-[var(--warning-text)]" />
            </div>
            <p className="text-2xl font-extrabold text-[var(--text)] mt-2">{totalGestores}</p>
          </div>
          <div className="bg-white p-5 rounded-[18px] border border-[var(--border)]">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-soft)]">
                Laboratorios
              </span>
              <DoorOpen className="w-5 h-5 text-[var(--primary)]" />
            </div>
            <p className="text-2xl font-extrabold text-[var(--text)] mt-2">{salas.length}</p>
          </div>
        </div>

        {/* Toolbar */}
        <div className="bg-white p-5 rounded-[18px] border border-[var(--border)] flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <div className="relative w-full sm:w-auto sm:min-w-[260px]">
              <Search className="w-4 h-4 text-[var(--text-soft)] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar por nombre, código o correo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-[13px] bg-[var(--background)] border border-[var(--border)] rounded-[14px] text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--green-soft-strong)]"
              />
            </div>

            <select
              value={filterRol}
              onChange={(e) => setFilterRol(e.target.value)}
              className="text-[13px] bg-[var(--background)] border border-[var(--border)] rounded-[14px] px-3 py-2 text-[var(--text-muted)] font-medium focus:outline-none focus:ring-2 focus:ring-[var(--green-soft-strong)]"
            >
              <option value="todos">Todos los roles</option>
              <option value="gestor">Gestores de laboratorio</option>
              <option value="admin">Administradores</option>
            </select>
          </div>

          <button
            onClick={() => openModal()}
            className="flex items-center gap-2 px-4 py-2 text-[13px] font-semibold rounded-[14px] bg-[var(--primary)] hover:bg-[var(--primary-dark)] text-white transition-colors shrink-0"
          >
            <Plus className="w-4 h-4" /> Crear cuenta de staff
          </button>
        </div>

        {/* Tabla */}
        <div className="bg-white rounded-[18px] border border-[var(--border)] overflow-hidden">
          <div className="p-5 border-b border-[var(--border)] bg-[var(--background)]/60">
            <h3 className="font-bold text-[var(--text)] text-base">
              Cuentas con acceso al portal ({filteredUsuarios.length})
            </h3>
            <p className="text-[13px] text-[var(--text-soft)]">
              Los estudiantes se registran desde la app móvil y no acceden al portal web.
            </p>
          </div>

          {loading ? (
            <div className="p-12 text-center text-sm text-[var(--text-soft)]">
              Cargando usuarios…
            </div>
          ) : filteredUsuarios.length === 0 ? (
            <div className="p-12 text-center text-[var(--text-soft)] text-sm">
              No se encontraron usuarios con esos criterios.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[680px] text-left border-collapse text-[13px]">
                <thead>
                  <tr className="border-b border-[var(--border)] bg-[var(--background)]/90 text-[var(--text-muted)] font-bold uppercase tracking-wider text-[10px]">
                    <th className="p-4">Usuario</th>
                    <th className="p-4">Rol</th>
                    <th className="p-4">Departamento</th>
                    <th className="p-4">Laboratorios supervisados</th>
                    <th className="p-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)] text-[var(--text-muted)] font-medium">
                  {filteredUsuarios.map((u) => {
                    const labsSupervisados = (u.laboratoriosAsignados || [])
                      .map((id) => salas.find((s) => s.id === id)?.codigo)
                      .filter(Boolean);

                    return (
                      <tr key={u.id} className="hover:bg-[var(--background)]/60 transition-colors">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-[var(--green-soft)] text-[var(--text-muted)] font-bold flex items-center justify-center text-[13px]">
                              {(u.nombre || 'PL').substring(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <div className="font-bold text-[var(--text)]">{u.nombre}</div>
                              <div className="text-[11px] text-[var(--text-soft)]">{u.email}</div>
                              {u.matriculaOCodigo && (
                                <span className="text-[10px] text-[var(--text-soft)] font-mono">
                                  {u.matriculaOCodigo}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        <td className="p-4">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider border ${
                              u.rol === 'admin'
                                ? 'bg-[var(--error-bg)] text-[var(--error)] border-[var(--error-bg)]'
                                : 'bg-[var(--warning-bg)] text-[var(--warning-text)] border-[var(--warning-border)]'
                            }`}
                          >
                            {u.rol === 'admin' ? (
                              <ShieldCheck className="w-3.5 h-3.5" />
                            ) : (
                              <Briefcase className="w-3.5 h-3.5" />
                            )}
                            {ROL_LABEL[u.rol] || u.rol}
                          </span>
                        </td>

                        <td className="p-4">
                          <span className="text-[var(--text)] font-medium">
                            {u.departamento || 'Sin especificar'}
                          </span>
                        </td>

                        <td className="p-4">
                          {u.rol === 'admin' ? (
                            <span className="text-[13px] text-[var(--error)] font-bold bg-[var(--error-bg)] px-2 py-0.5 rounded border border-rose-200">
                              Acceso total
                            </span>
                          ) : labsSupervisados.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {labsSupervisados.map((code) => (
                                <span
                                  key={code}
                                  className="text-[10px] font-bold bg-[var(--green-soft)] text-[var(--primary-dark)] px-2 py-0.5 rounded border border-[var(--border)]"
                                >
                                  {code}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-[var(--text-soft)] italic text-[13px]">
                              Sin laboratorios asignados
                            </span>
                          )}
                        </td>

                        <td className="p-4 text-right">
                          <button
                            onClick={() => openModal(u)}
                            className="p-1.5 text-[var(--text-soft)] hover:text-[var(--primary)] hover:bg-[var(--green-soft)] rounded-lg transition-colors"
                            title="Modificar rol o asignación"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* MODAL CREAR / EDITAR */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-[rgba(24,28,26,0.45)] flex items-center justify-center p-4 z-50 animate-fadeIn">
            <div className="bg-white rounded-[18px] max-w-lg w-full p-6 border border-[var(--border)] space-y-4 max-h-[85vh] overflow-y-auto scroll-thin">
              <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
                <h3 className="font-bold text-[var(--text)] text-base">
                  {editingUser
                    ? 'Modificar acceso'
                    : passwordTemporal
                    ? 'Cuenta creada'
                    : 'Crear cuenta de staff'}
                </h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-[var(--text-soft)] hover:text-[var(--text-muted)]"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {passwordTemporal ? (
                <div className="space-y-4">
                  <div className="flex items-start gap-2 p-3 rounded-[14px] bg-[var(--green-soft)] text-[var(--primary-dark)] border border-[var(--border)] text-[13px]">
                    <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
                    <p>
                      La cuenta <strong>{formData.email}</strong> ya puede ingresar al portal.
                      Comparte esta contraseña temporal; el usuario podrá cambiarla luego.
                    </p>
                  </div>

                  <div className="p-4 rounded-[14px] border border-[var(--border)] bg-[var(--background)]">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-soft)] mb-2 flex items-center gap-1.5">
                      <KeyRound className="w-3.5 h-3.5" /> Contraseña temporal
                    </p>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 text-[16px] font-bold text-[var(--text)] tracking-wider">
                        {passwordTemporal}
                      </code>
                      <button
                        type="button"
                        onClick={copiarPassword}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-[10px] text-[12px] font-semibold border border-[var(--border)] bg-white hover:bg-[var(--green-soft)]"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        {copiado ? 'Copiada' : 'Copiar'}
                      </button>
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      type="button"
                      onClick={() => setIsModalOpen(false)}
                      className="px-4 py-2 text-[13px] font-semibold rounded-[14px] bg-[var(--primary)] hover:bg-[var(--primary-dark)] text-white"
                    >
                      Entendido
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSave} className="space-y-3">
                  {error && (
                    <div className="flex items-start gap-2 p-3 rounded-[14px] bg-[var(--error-bg)] text-[var(--error)] text-[13px]">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>{error}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[13px] font-semibold text-[var(--text-muted)] mb-1">
                        Nombre completo *
                      </label>
                      <input
                        type="text"
                        value={formData.nombre}
                        onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                        placeholder="Ej: Carlos Mendoza"
                        className="w-full text-[13px] p-2.5 border border-[var(--border)] rounded-[14px]"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[13px] font-semibold text-[var(--text-muted)] mb-1">
                        Correo institucional *
                      </label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="usuario@universidad.edu.co"
                        className="w-full text-[13px] p-2.5 border border-[var(--border)] rounded-[14px] disabled:bg-[var(--background)] disabled:text-[var(--text-soft)]"
                        required
                        disabled={!!editingUser}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[13px] font-semibold text-[var(--text-muted)] mb-1">
                        Rol *
                      </label>
                      <select
                        value={formData.rol}
                        onChange={(e) =>
                          setFormData({ ...formData, rol: e.target.value as UserRole })
                        }
                        className="w-full text-[13px] p-2.5 border border-[var(--border)] rounded-[14px] bg-white font-semibold"
                      >
                        <option value="gestor">Gestor</option>
                        <option value="admin">Administrador</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[13px] font-semibold text-[var(--text-muted)] mb-1">
                        Teléfono
                      </label>
                      <input
                        type="text"
                        value={formData.telefono}
                        onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                        placeholder="300 000 0000"
                        className="w-full text-[13px] p-2.5 border border-[var(--border)] rounded-[14px]"
                      />
                    </div>

                    <div>
                      <label className="block text-[13px] font-semibold text-[var(--text-muted)] mb-1">
                        Código interno
                      </label>
                      <input
                        type="text"
                        value={formData.matriculaOCodigo}
                        onChange={(e) =>
                          setFormData({ ...formData, matriculaOCodigo: e.target.value })
                        }
                        placeholder="USR-101"
                        className="w-full text-[13px] p-2.5 border border-[var(--border)] rounded-[14px] font-mono uppercase"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[13px] font-semibold text-[var(--text-muted)] mb-1">
                      Departamento o facultad
                    </label>
                    <input
                      type="text"
                      value={formData.departamento}
                      onChange={(e) => setFormData({ ...formData, departamento: e.target.value })}
                      placeholder="Facultad de Ingeniería"
                      className="w-full text-[13px] p-2.5 border border-[var(--border)] rounded-[14px]"
                    />
                  </div>

                  {formData.rol === 'gestor' && (
                    <div className="bg-[var(--warning-bg)]/60 p-3.5 rounded-[14px] border border-[var(--warning-border)]/80 space-y-2">
                      <label className="block text-[13px] font-bold text-[var(--warning-text)]">
                        Laboratorios asignados
                      </label>
                      <p className="text-[11px] text-[var(--warning-text)]/80">
                        El gestor sólo podrá aprobar, rechazar, reasignar y registrar
                        devoluciones en estas salas.
                      </p>
                      <div className="space-y-1.5 max-h-36 overflow-y-auto pt-1">
                        {salas.map((sala) => {
                          const isChecked = formData.laboratoriosAsignados.includes(sala.id);
                          return (
                            <label
                              key={sala.id}
                              className="flex items-center gap-2 text-[13px] text-[var(--text-muted)] hover:bg-white p-1 rounded cursor-pointer"
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => handleToggleLab(sala.id)}
                                className="rounded text-[var(--primary)] focus:ring-[var(--green-soft-strong)]"
                              />
                              <span>
                                <strong>{sala.codigo}</strong> - {sala.nombre}
                              </span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {!editingUser && (
                    <p className="text-[11px] text-[var(--text-soft)]">
                      Se generará una contraseña temporal al crear la cuenta.
                    </p>
                  )}

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
                      disabled={saving}
                      className="px-4 py-2 text-[13px] font-semibold rounded-[14px] bg-[var(--primary)] hover:bg-[var(--primary-dark)] text-white disabled:opacity-60"
                    >
                      {saving ? 'Guardando…' : editingUser ? 'Guardar cambios' : 'Crear cuenta'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}
      </main>
    </>
  );
}
