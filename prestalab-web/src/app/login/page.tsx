'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Lock, Mail, AlertCircle } from 'lucide-react';
import { useActiveRole } from '@/context/RoleContext';
import Brand from '@/components/Brand';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useActiveRole();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const result = await login(email, password);
      if (result.success) {
        router.push('/');
        router.refresh();
      } else {
        setError(result.error || 'Correo o contraseña incorrectos.');
      }
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
      <div className="w-full max-w-[420px]">
        <div className="flex justify-center mb-8">
          <Brand size="lg" />
        </div>

        <div className="card p-7">
          <h1 className="text-[24px] font-bold tracking-tight" style={{ color: 'var(--text)' }}>
            Inicia sesión
          </h1>
          <p className="mt-1 text-[14px]" style={{ color: 'var(--text-muted)' }}>
            Acceso para gestores y administradores de laboratorio.
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block text-[13px] font-semibold mb-1.5"
                style={{ color: 'var(--text)' }}
              >
                Correo institucional
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
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nombre@universidad.edu"
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
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
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
              {loading ? 'Ingresando…' : 'Ingresar'}
            </button>
          </form>

          <div className="mt-6 pt-5 text-center" style={{ borderTop: '1px solid var(--border)' }}>
            <p className="text-[14px]" style={{ color: 'var(--text-muted)' }}>
              ¿No tienes una cuenta?{' '}
              <Link
                href="/register"
                className="font-semibold"
                style={{ color: 'var(--primary)' }}
              >
                Crear cuenta
              </Link>
            </p>
            <p className="mt-3 text-[12px] leading-relaxed" style={{ color: 'var(--text-soft)' }}>
              Los estudiantes usan la app móvil de PrestaLab. Si olvidaste tu contraseña,
              solicita el restablecimiento al administrador.
            </p>
          </div>
        </div>

        <p className="text-center text-[12px] mt-6" style={{ color: 'var(--text-soft)' }}>
          PrestaLab · Gestión de laboratorios
        </p>
      </div>
    </div>
  );
}
