'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Clock,
  CheckCircle,
  AlertTriangle,
  DoorOpen,
  Boxes,
  Users,
  ArrowRight,
  ArrowUpRight,
  RefreshCw,
  GitPullRequest,
  Check,
  X,
  ExternalLink,
} from 'lucide-react';
import Header from '@/components/Header';
import { useActiveRole } from '@/context/RoleContext';
import { SolicitudPrestamo, Sala } from '@/types';

export default function DashboardPage() {
  const { activeUser } = useActiveRole();
  const [stats, setStats] = useState<any>(null);
  const [solicitudes, setSolicitudes] = useState<SolicitudPrestamo[]>([]);
  const [salas, setSalas] = useState<Sala[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [resStats, resSols, resSalas] = await Promise.all([
        fetch('/api/stats'),
        fetch('/api/solicitudes?estado=pendiente'),
        fetch('/api/salas'),
      ]);

      const dataStats = await resStats.json();
      const dataSols = await resSols.json();
      const dataSalas = await resSalas.json();

      if (dataStats.success) setStats(dataStats.stats);
      if (dataSols.success) setSolicitudes(dataSols.data || []);
      if (dataSalas.success) setSalas(dataSalas.data || []);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeUser.rol]);

  // Filtrar pendientes si el rol es gestor
  const pendientesFiltradas = solicitudes.filter((s) => {
    if (activeUser.rol === 'admin') return true;
    if (activeUser.rol === 'gestor') {
      return activeUser.laboratoriosAsignados?.includes(s.salaId);
    }
    return s.userId === activeUser.id;
  });

  return (
    <>
      <Header
        title="Panel de Control General"
        subtitle={`Bienvenido de nuevo, ${activeUser.nombre}. Visión operativa centralizada de PrestaLab.`}
      />

      <main className="p-8 space-y-8 max-w-7xl mx-auto w-full">
        {/* KPI Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Card 1: Pendientes */}
          <div className="bg-white p-6 rounded-[18px] border border-[var(--border)]  hover: transition-shadow">
            <div className="flex items-center justify-between">
              <span className="text-[13px] font-semibold text-[var(--text-soft)] uppercase tracking-wider">
                Solicitudes Pendientes
              </span>
              <div className="w-10 h-10 rounded-[14px] bg-[var(--warning-bg)] text-[var(--warning-text)] flex items-center justify-center border border-[var(--warning-border)]">
                <Clock className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-[var(--text)]">
                {stats?.pendientes ?? 0}
              </span>
              <span className="text-[13px] text-[var(--warning-text)] bg-[var(--warning-bg)] font-medium px-2 py-0.5 rounded-full">
                Por evaluar
              </span>
            </div>
            <p className="text-[13px] text-[var(--text-soft)] mt-2">
              Requieren decisión del Gestor de Laboratorio
            </p>
          </div>

          {/* Card 2: Préstamos Activos */}
          <div className="bg-white p-6 rounded-[18px] border border-[var(--border)]  hover: transition-shadow">
            <div className="flex items-center justify-between">
              <span className="text-[13px] font-semibold text-[var(--text-soft)] uppercase tracking-wider">
                Préstamos Activos
              </span>
              <div className="w-10 h-10 rounded-[14px] bg-[var(--green-soft)] text-[var(--primary)] flex items-center justify-center border border-[var(--border)]">
                <CheckCircle className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-[var(--text)]">
                {stats?.activos ?? 0}
              </span>
              <span className="text-[13px] text-[var(--primary)] bg-[var(--green-soft-strong)]/60 font-medium px-2 py-0.5 rounded-full">
                En uso
              </span>
            </div>
            <p className="text-[13px] text-[var(--text-soft)] mt-2">
              {stats?.reasignadas ?? 0} préstamos con cambio de sala
            </p>
          </div>

          {/* Card 3: Salas y Laboratorios */}
          <div className="bg-white p-6 rounded-[18px] border border-[var(--border)]  hover: transition-shadow">
            <div className="flex items-center justify-between">
              <span className="text-[13px] font-semibold text-[var(--text-soft)] uppercase tracking-wider">
                Salas y Laboratorios
              </span>
              <div className="w-10 h-10 rounded-[14px] bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-200">
                <DoorOpen className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-[var(--text)]">
                {stats?.totalSalas ?? 0}
              </span>
              <span className="text-[13px] text-blue-700 bg-blue-100/60 font-medium px-2 py-0.5 rounded-full">
                {stats?.salasDisponibles ?? 0} libres
              </span>
            </div>
            <p className="text-[13px] text-[var(--text-soft)] mt-2">
              {stats?.salasMantenimiento ?? 0} en mantenimiento técnico
            </p>
          </div>

          {/* Card 4: Inventario Total */}
          <div className="bg-white p-6 rounded-[18px] border border-[var(--border)]  hover: transition-shadow">
            <div className="flex items-center justify-between">
              <span className="text-[13px] font-semibold text-[var(--text-soft)] uppercase tracking-wider">
                Activos e Inventario
              </span>
              <div className="w-10 h-10 rounded-[14px] bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-200">
                <Boxes className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-[var(--text)]">
                {stats?.totalArticulos ?? 0}
              </span>
              <span className="text-[13px] text-purple-700 bg-purple-100/60 font-medium px-2 py-0.5 rounded-full">
                Unidades
              </span>
            </div>
            <p className="text-[13px] text-[var(--text-soft)] mt-2">
              {stats?.articulosEnPrestamo ?? 0} prestados a usuarios
            </p>
          </div>
        </div>

        {/* Section: Solicitudes Pendientes de Atención Inmediata */}
        <div className="bg-white rounded-[18px] border border-[var(--border)]  overflow-hidden">
          <div className="p-6 border-b border-[var(--border)] flex items-center justify-between bg-[var(--background)]/50">
            <div>
              <h3 className="text-lg font-bold text-[var(--text)] flex items-center gap-2">
                <span>Bandeja de Decisiones del Gestor</span>
                {pendientesFiltradas.length > 0 && (
                  <span className="text-[13px] font-semibold bg-[var(--warning-text)] text-white px-2 py-0.5 rounded-full">
                    {pendientesFiltradas.length} pendientes
                  </span>
                )}
              </h3>
              <p className="text-[13px] text-[var(--text-soft)] mt-0.5">
                Evalúa, aprueba, rechaza con justificación o reasigna salas de laboratorio.
              </p>
            </div>

            <Link
              href="/prestamos"
              className="text-[13px] font-semibold text-[var(--primary)] hover:text-[var(--primary-dark)] flex items-center gap-1.5 transition-colors"
            >
              Ver todas en Préstamos <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {loading ? (
            <div className="p-8 text-center text-sm text-[var(--text-soft)] flex items-center justify-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin text-[var(--primary)]" /> Cargando solicitudes...
            </div>
          ) : pendientesFiltradas.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-12 h-12 rounded-full bg-[var(--green-soft)] text-[var(--primary)] flex items-center justify-center mx-auto mb-3">
                <Check className="w-6 h-6" />
              </div>
              <h4 className="font-semibold text-[var(--text)] text-sm">
                No hay solicitudes pendientes en este momento
              </h4>
              <p className="text-[13px] text-[var(--text-soft)] mt-1 max-w-sm mx-auto">
                Todas las solicitudes de tus laboratorios asignados han sido evaluadas y resueltas.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-[var(--border)]">
              {pendientesFiltradas.slice(0, 3).map((sol) => (
                <div
                  key={sol.id}
                  className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-[var(--background)]/70 transition-colors"
                >
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[13px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 capitalize">
                        {sol.userRol}
                      </span>
                      <h4 className="font-bold text-[var(--text)] text-sm">
                        {sol.userNombre}
                      </h4>
                      <span className="text-[13px] text-[var(--text-soft)]">•</span>
                      <span className="text-[13px] text-[var(--text-soft)]">
                        {sol.userEmail}
                      </span>
                    </div>

                    <div className="text-[13px] text-[var(--text-muted)] flex flex-wrap items-center gap-x-4 gap-y-1 font-medium">
                      <span>
                        <strong className="text-[var(--text)]">Recurso:</strong>{' '}
                        {sol.articuloNombre || 'Reserva de Sala'} ({sol.cantidad} ud)
                      </span>
                      <span>
                        <strong className="text-[var(--text)]">Sala solicitada:</strong>{' '}
                        <span className="text-[var(--primary-dark)] bg-[var(--green-soft)] px-2 py-0.5 rounded font-semibold border border-[var(--border)]/60">
                          {sol.salaNombre}
                        </span>
                      </span>
                      <span>
                        <strong className="text-[var(--text)]">Fechas:</strong>{' '}
                        {sol.fechaInicio} al {sol.fechaFin}
                      </span>
                    </div>

                    <p className="text-[13px] text-[var(--text-soft)] italic bg-[var(--background)] p-2 rounded-lg border border-[var(--border)]/50">
                      "{sol.motivo}"
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Link
                      href="/prestamos"
                      className="px-4 py-2 rounded-[14px] text-[13px] font-semibold bg-[var(--primary)] hover:bg-[var(--primary-dark)] text-white  transition-colors flex items-center gap-1.5"
                    >
                      Evaluar en Bandeja <ArrowUpRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Section 2: Estado de Laboratorios en Tiempo Real */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-[18px] border border-[var(--border)]  p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="font-bold text-[var(--text)] text-base">Salas y Espacios Académicos</h3>
                <p className="text-[13px] text-[var(--text-soft)]">Supervisión física y capacidad actual</p>
              </div>
              <Link href="/salas" className="text-[13px] text-[var(--primary)] font-semibold hover:underline">
                Gestionar salas →
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {salas.map((sala) => (
                <div
                  key={sala.id}
                  className="p-4 rounded-[14px] border border-[var(--border)] hover:border-[var(--border)] transition-all bg-[var(--background)]/50"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[11px] font-bold text-[var(--primary-dark)] bg-[var(--green-soft-strong)]/70 px-2 py-0.5 rounded border border-[var(--border)]">
                        {sala.codigo}
                      </span>
                      <h4 className="font-semibold text-[var(--text)] text-[13px] mt-1.5 line-clamp-1">
                        {sala.nombre}
                      </h4>
                      <p className="text-[11px] text-[var(--text-soft)] mt-0.5">{sala.edificio}</p>
                    </div>

                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                      sala.estado === 'disponible'
                        ? 'bg-[var(--green-soft-strong)] text-[var(--primary-dark)] border border-[var(--border)]'
                        : sala.estado === 'ocupado'
                        ? 'bg-[var(--warning-bg)] text-[var(--warning-text)] border border-[var(--warning-border)]'
                        : 'bg-[var(--error-bg)] text-[var(--error)] border border-[var(--error-bg)]'
                    }`}>
                      {sala.estado}
                    </span>
                  </div>

                  <div className="mt-3 pt-3 border-t border-[var(--border)]/60 flex items-center justify-between text-[11px] text-[var(--text-muted)]">
                    <span>Capacidad: <strong>{sala.capacidad} estudiantes</strong></span>
                    <span>Gestor: <strong>{sala.gestorNombre?.split(' ')[1] || 'Asignado'}</strong></span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Info & Matriz de Roles */}
          <div className="bg-white rounded-[18px] border border-[var(--border)]  p-6 flex flex-col justify-between">
            <div>
              <h3 className="font-bold text-[var(--text)] text-base mb-1">Matriz de Roles Activa</h3>
              <p className="text-[13px] text-[var(--text-soft)] mb-4">
                Reglas de control de acceso aplicadas según tu sesión:
              </p>

              <div className="space-y-3">
                <div className={`p-3 rounded-[14px] border text-[13px] ${
                  activeUser.rol === 'admin'
                    ? 'bg-[var(--green-soft)] border-[var(--border)] text-[var(--primary-dark)]'
                    : 'bg-[var(--background)] border-[var(--border)] text-[var(--text-muted)]'
                }`}>
                  <p className="font-bold">Administrador del Sistema</p>
                  <p className="text-[11px] mt-0.5">Acceso irrestricto, configuración global, gestión de usuarios y auditoría.</p>
                </div>

                <div className={`p-3 rounded-[14px] border text-[13px] ${
                  activeUser.rol === 'gestor'
                    ? 'bg-[var(--green-soft)] border-[var(--border)] text-[var(--primary-dark)]'
                    : 'bg-[var(--background)] border-[var(--border)] text-[var(--text-muted)]'
                }`}>
                  <p className="font-bold">Gestor de Laboratorio</p>
                  <p className="text-[11px] mt-0.5">Evaluación de reservas (aprobar/denegar con motivo), reasignación de salas.</p>
                </div>

                <div className={`p-3 rounded-[14px] border text-[13px] ${
                  activeUser.rol === 'estudiante' || activeUser.rol === 'docente'
                    ? 'bg-[var(--green-soft)] border-[var(--border)] text-[var(--primary-dark)]'
                    : 'bg-[var(--background)] border-[var(--border)] text-[var(--text-muted)]'
                }`}>
                  <p className="font-bold">Estudiante / Docente</p>
                  <p className="text-[11px] mt-0.5">Solicitar préstamos, consultar inventario y consultar historial propio.</p>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-[var(--border)] flex items-center justify-between text-[13px] text-[var(--text-soft)]">
              <span>Next.js API Routes</span>
              <span className="font-semibold text-[var(--primary)]">RESTful Active</span>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
