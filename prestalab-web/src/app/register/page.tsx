'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  Lock,
  Mail,
  Mars,
  NonBinary,
  Phone,
  User,
  UserPlus,
  Venus,
} from 'lucide-react';
import Brand from '@/components/Brand';

const GENEROS = [
  { value: 'Masculino', label: 'Masculino', icon: Mars },
  { value: 'Femenino', label: 'Femenino', icon: Venus },
  { value: 'Otro', label: 'Otro', icon: NonBinary },
];

export default function RegisterPage() {
  const router = useRouter();

  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [genero, setGenero] = useState('Masculino');
  const [telefono, setTelefono] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<{ nombre: string; email: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanNombre = nombre.trim();
    const cleanApellido = apellido.trim();
    const cleanTelefono = telefono.trim();
    const cleanEmail = email.trim();
    const cleanPassword = password.trim();

    // Mismas validaciones que registerScreen.js (app móvil)
    if (!cleanNombre || !cleanApellido || !cleanTelefono || !cleanEmail || !cleanPassword) {
      setError('Por favor completa todos los campos.');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setError('Ingresa un correo electrónico válido.');
      return;
    }

    if (cleanTelefono.replace(/\D/g, '').length < 10) {
      setError(
        'Ingresa un número de teléfono colombiano válido (ej. +57 300 123 4567).',
      );
      return;
    }

    if (cleanPassword.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: cleanNombre,
          apellido: cleanApellido,
          genero,
          telefono: cleanTelefono,
          email: cleanEmail,
          password: cleanPassword,
        }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error || 'No se pudo crear la cuenta. Intenta de nuevo.');
        return;
      }

      setCreated({ nombre: `${cleanNombre} ${cleanApellido}`, email: cleanEmail });
    } catch {
      setError('No se pudo conectar con el servidor.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen w-full flex items-center justify-center px-5 py-10"
      style={{ background: 'var(--background)' }}
    >
      <div className="w-full max-w-[480px]">
        <div className="flex items-center justify-between mb-6">
          <Link
            href="/login"
            aria-label="Volver al inicio de sesión"
            className="w-9 h-9 rounded-[10px] flex items-center justify-center transition-colors"
            style={{ color: 'var(--text-muted)' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--green-soft)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
            }}
          >
            <ArrowLeft size={18} />
          </Link>
          <Brand size="sm" />
          <span className="w-9 h-9" aria-hidden="true" />
        </div>

        <div className="card p-7">
          {created ? (
            <div className="text-center py-2">
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center mx-auto"
                style={{ background: 'var(--green-soft)', color: 'var(--primary)' }}
              >
                <CheckCircle2 size={30} />
              </div>
              <h1
                className="mt-4 text-[24px] font-bold tracking-tight"
                style={{ color: 'var(--text)' }}
              >
                ¡Cuenta creada!
              </h1>
              <p className="mt-2 text-[14px] leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                Bienvenido, <span className="font-semibold">{created.nombre}</span>.
                Registramos <span className="font-semibold">{created.email}</span> con rol de
                estudiante.
              </p>

              <div
                className="mt-5 rounded-[12px] px-3.5 py-3 text-[12px] leading-relaxed text-left"
                style={{ background: 'var(--green-soft)', color: 'var(--text-muted)' }}
              >
                Los estudiantes ingresan desde la app móvil de PrestaLab. Si eres gestor o
                administrador, pide a un administrador que actualice tu rol para acceder al
                portal web.
              </div>

              <button
                type="button"
                onClick={() => router.push('/login')}
                className="btn-primary w-full py-3 mt-5"
              >
                Ir a iniciar sesión
              </button>

              <button
                type="button"
                onClick={() => {
                  setCreated(null);
                  setNombre('');
                  setApellido('');
                  setTelefono('');
                  setEmail('');
                  setPassword('');
                  setGenero('Masculino');
                }}
                className="btn-ghost w-full mt-1"
              >
                Crear otra cuenta
              </button>
            </div>
          ) : (
            <>
              <h1
                className="text-[24px] font-bold tracking-tight"
                style={{ color: 'var(--text)' }}
              >
                Crear cuenta
              </h1>
              <p className="mt-1 text-[14px]" style={{ color: 'var(--text-muted)' }}>
                Regístrate para solicitar y gestionar tus préstamos de laboratorio.
              </p>

              <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label
                      htmlFor="nombre"
                      className="block text-[13px] font-semibold mb-1.5"
                      style={{ color: 'var(--text)' }}
                    >
                      Nombre
                    </label>
                    <div className="relative">
                      <User
                        size={16}
                        className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                        style={{ color: 'var(--text-soft)' }}
                      />
                      <input
                        id="nombre"
                        value={nombre}
                        onChange={(e) => setNombre(e.target.value)}
                        placeholder="Alejandro"
                        autoComplete="given-name"
                        className="field"
                        style={{ paddingLeft: 42 }}
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="apellido"
                      className="block text-[13px] font-semibold mb-1.5"
                      style={{ color: 'var(--text)' }}
                    >
                      Apellido
                    </label>
                    <div className="relative">
                      <User
                        size={16}
                        className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                        style={{ color: 'var(--text-soft)' }}
                      />
                      <input
                        id="apellido"
                        value={apellido}
                        onChange={(e) => setApellido(e.target.value)}
                        placeholder="García"
                        autoComplete="family-name"
                        className="field"
                        style={{ paddingLeft: 42 }}
                        required
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <span
                    className="block text-[13px] font-semibold mb-1.5"
                    style={{ color: 'var(--text)' }}
                  >
                    Sexo / Género
                  </span>
                  <div className="grid grid-cols-3 gap-2">
                    {GENEROS.map(({ value, label, icon: Icon }) => {
                      const selected = genero === value;
                      return (
                        <button
                          key={value}
                          type="button"
                          onClick={() => setGenero(value)}
                          aria-pressed={selected}
                          className="flex items-center justify-center gap-1.5 rounded-[12px] px-2 py-2.5 text-[13px] font-semibold transition-colors"
                          style={{
                            border: `1.5px solid ${selected ? 'var(--primary)' : 'var(--border-input)'}`,
                            background: selected ? 'var(--primary)' : '#EFF5F1',
                            color: selected ? '#FEFFFE' : '#3E4941',
                          }}
                        >
                          <Icon size={16} />
                          {label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="telefono"
                    className="block text-[13px] font-semibold mb-1.5"
                    style={{ color: 'var(--text)' }}
                  >
                    Teléfono
                  </label>
                  <div className="relative">
                    <Phone
                      size={16}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                      style={{ color: 'var(--text-soft)' }}
                    />
                    <input
                      id="telefono"
                      type="tel"
                      value={telefono}
                      onChange={(e) => setTelefono(e.target.value)}
                      placeholder="+57 300 123 4567"
                      autoComplete="tel"
                      className="field"
                      style={{ paddingLeft: 42 }}
                      required
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="email"
                    className="block text-[13px] font-semibold mb-1.5"
                    style={{ color: 'var(--text)' }}
                  >
                    Correo
                  </label>
                  <div className="relative">
                    <Mail
                      size={16}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                      style={{ color: 'var(--text-soft)' }}
                    />
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="alejandro.garcia@correo.com"
                      autoComplete="email"
                      className="field"
                      style={{ paddingLeft: 42 }}
                      required
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="password"
                    className="block text-[13px] font-semibold mb-1.5"
                    style={{ color: 'var(--text)' }}
                  >
                    Contraseña
                  </label>
                  <div className="relative">
                    <Lock
                      size={16}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                      style={{ color: 'var(--text-soft)' }}
                    />
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Crea una contraseña"
                      autoComplete="new-password"
                      className="field"
                      style={{ paddingLeft: 42, paddingRight: 44 }}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2"
                      style={{ color: 'var(--text-soft)' }}
                      aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    >
                      {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                    </button>
                  </div>
                  <p className="mt-1.5 text-[11px]" style={{ color: 'var(--text-soft)' }}>
                    Mínimo 6 caracteres.
                  </p>
                </div>

                {error ? (
                  <div
                    className="flex items-start gap-2 rounded-[12px] px-3 py-2.5 text-[13px]"
                    style={{ background: 'var(--error-bg)', color: 'var(--error)' }}
                    role="alert"
                  >
                    <AlertCircle size={15} className="mt-0.5 shrink-0" />
                    <span>{error}</span>
                  </div>
                ) : null}

                <button type="submit" disabled={loading} className="btn-primary w-full py-3">
                  <UserPlus size={17} />
                  {loading ? 'Creando cuenta…' : 'Crear cuenta'}
                </button>
              </form>

              <div
                className="mt-6 pt-5 text-center"
                style={{ borderTop: '1px solid var(--border)' }}
              >
                <p className="text-[14px]" style={{ color: 'var(--text-muted)' }}>
                  ¿Ya tienes una cuenta?{' '}
                  <Link
                    href="/login"
                    className="font-semibold"
                    style={{ color: 'var(--primary)' }}
                  >
                    Iniciar sesión
                  </Link>
                </p>
              </div>
            </>
          )}
        </div>

        <p className="text-center text-[12px] mt-6" style={{ color: 'var(--text-soft)' }}>
          PrestaLab · Gestión de laboratorios
        </p>
      </div>
    </div>
  );
}
