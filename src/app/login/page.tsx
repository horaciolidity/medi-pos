'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Activity,
  Lock,
  Mail,
  ArrowRight,
  AlertCircle,
  Stethoscope,
  Shield,
  HeartPulse,
  UserCheck,
  Clock
} from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [loginType, setLoginType] = useState<'ADMIN' | 'STAFF'>('ADMIN');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Error al iniciar sesión');
      }

      if (data.user.role === 'SUPER_ADMIN') {
        router.push('/superadmin');
      } else {
        const r = (data.user?.role || data.user?.area || 'ADMIN').toUpperCase();
        if (r === 'MEDICO') {
          router.push('/dashboard/pacientes');
        } else if (r === 'ENFERMERIA') {
          router.push('/dashboard/enfermeria');
        } else if (r === 'RECEPCION') {
          router.push('/dashboard/turnos');
        } else if (r === 'FARMACIA') {
          router.push('/dashboard/farmacia');
        } else if (r === 'CAJA') {
          router.push('/dashboard/caja');
        } else {
          router.push('/dashboard');
        }
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6">
      <div className="max-w-md w-full space-y-6">
        {/* Header Logo */}
        <div className="text-center space-y-2">
          <div className="inline-flex bg-sky-500 text-slate-950 p-3 rounded-2xl shadow-xl shadow-sky-500/20 font-bold mb-2">
            <Activity className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight">Acceso a Clinic POS</h2>
          <p className="text-xs text-slate-400">Plataforma SaaS para clínicas, sanatorios y consultorios</p>
        </div>

        {/* Selector de Tipo de Acceso: Admin vs Personal */}
        <div className="bg-slate-800/80 p-1 rounded-2xl flex border border-slate-700/80">
          <button
            type="button"
            onClick={() => {
              setLoginType('ADMIN');
              setError('');
            }}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              loginType === 'ADMIN'
                ? 'bg-sky-500 text-slate-950 shadow-md font-extrabold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Shield className="w-4 h-4" />
            <span>Administración</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setLoginType('STAFF');
              setError('');
            }}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              loginType === 'STAFF'
                ? 'bg-sky-500 text-slate-950 shadow-md font-extrabold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Stethoscope className="w-4 h-4" />
            <span>Personal Médico & Equipo</span>
          </button>
        </div>

        {/* Free Trial Banner para Admin */}
        {loginType === 'ADMIN' && (
          <div className="bg-sky-500/10 border border-sky-500/30 p-4 rounded-2xl flex items-center justify-between gap-3 shadow-lg shadow-sky-500/5">
            <div className="space-y-0.5">
              <span className="text-xs font-black text-sky-400 uppercase tracking-wider block">🎁 Prueba Gratuita Inicial</span>
              <p className="text-xs text-slate-300">50 pacientes y atenciones gratis sin tarjeta de crédito</p>
            </div>
            <Link
              href="/register"
              className="shrink-0 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold px-3.5 py-2 rounded-xl text-xs transition-colors flex items-center gap-1.5"
            >
              <span>Crear Clínica</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        )}

        {/* Banner Explicativo para Personal Médico */}
        {loginType === 'STAFF' && (
          <div className="bg-slate-800/90 border border-slate-700 p-4 rounded-2xl space-y-2 text-xs text-slate-300 shadow-md">
            <div className="flex items-center gap-2 text-sky-400 font-bold">
              <UserCheck className="w-4 h-4" />
              <span>Portal de Profesionales & Puestos de Atención</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Ingresá con tu correo/usuario institucional y contraseña configurada por tu clínica. Al acceder, entrarás de forma directa a tu área asignada:
            </p>
            <div className="flex flex-wrap gap-1.5 pt-1">
              <span className="bg-slate-900 border border-slate-700 text-slate-300 text-[10px] px-2 py-0.5 rounded-md font-medium">🩺 Médicos (H.C.)</span>
              <span className="bg-slate-900 border border-slate-700 text-slate-300 text-[10px] px-2 py-0.5 rounded-md font-medium">💉 Enfermería</span>
              <span className="bg-slate-900 border border-slate-700 text-slate-300 text-[10px] px-2 py-0.5 rounded-md font-medium">🛎️ Recepción</span>
              <span className="bg-slate-900 border border-slate-700 text-slate-300 text-[10px] px-2 py-0.5 rounded-md font-medium">💊 Farmacia</span>
            </div>
          </div>
        )}

        {/* Login Form Card */}
        <div className="bg-slate-800 border border-slate-700/80 p-6 rounded-2xl shadow-xl space-y-4">
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-3 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                {loginType === 'STAFF' ? 'Correo o Usuario Institucional' : 'Correo Electrónico de la Cuenta'}
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={loginType === 'STAFF' ? 'profesional@clinica.com' : 'admin@clinica.com'}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-sky-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Contraseña</label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-sky-500 transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-sky-500 hover:bg-sky-400 disabled:opacity-50 text-slate-950 font-bold py-3 rounded-xl text-xs transition-all shadow-lg shadow-sky-500/20 flex items-center justify-center gap-2"
            >
              <span>{loading ? 'Validando Credenciales...' : loginType === 'STAFF' ? 'Acceder a mi Área' : 'Ingresar al Sistema'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>

        {/* Footer info */}
        <p className="text-center text-xs text-slate-500">
          ¿Problemas para acceder? Contactá al administrador de tu clínica para restablecer tu contraseña.
        </p>
      </div>
    </div>
  );
}
