'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Activity, Lock, Mail, ArrowRight, AlertCircle, CheckCircle2, ShieldAlert } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
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
        router.push('/dashboard');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const quickFill = (uEmail: string, uPass: string) => {
    setEmail(uEmail);
    setPassword(uPass);
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6">
      <div className="max-w-md w-full space-y-6">
        {/* Header Logo */}
        <div className="text-center space-y-2">
          <div className="inline-flex bg-sky-500 text-slate-950 p-3 rounded-2xl shadow-xl shadow-sky-500/20 font-bold mb-2">
            <Activity className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight">Iniciar Sesión en Clinic POS</h2>
          <p className="text-xs text-slate-400">Plataforma SaaS para clínicas y consultorios en Argentina</p>
        </div>

        {/* Quick Demo Fill Buttons */}
        <div className="bg-slate-800/60 border border-slate-700 p-4 rounded-2xl space-y-2">
          <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">Acceso Rápido Demo:</span>
          <div className="grid grid-cols-1 gap-2">
            <button
              type="button"
              onClick={() => quickFill('admin@centro-salud-norte.com.ar', 'Clinica2026!')}
              className="text-left text-xs bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 p-2.5 rounded-xl font-medium transition-colors flex items-center justify-between"
            >
              <span>🏥 <strong>Clínica Activa (Plan Pro)</strong> - Admin</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </button>

            <button
              type="button"
              onClick={() => quickFill('admin@consultorios-sur.com.ar', 'Clinica2026!')}
              className="text-left text-xs bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 p-2.5 rounded-xl font-medium transition-colors flex items-center justify-between"
            >
              <span>🔒 <strong>Clínica Vencida (Solo Lectura)</strong> - Admin</span>
              <ShieldAlert className="w-4 h-4 text-amber-400" />
            </button>

            <button
              type="button"
              onClick={() => quickFill('superadmin@clinicpos.ar', 'SuperAdmin2026!')}
              className="text-left text-xs bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 text-purple-300 p-2.5 rounded-xl font-medium transition-colors flex items-center justify-between"
            >
              <span>⚡ <strong>Superadmin Global SaaS</strong></span>
              <ArrowRight className="w-4 h-4 text-purple-400" />
            </button>
          </div>
        </div>

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
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Correo Electrónico</label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ejemplo@clinicpos.ar"
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
              className="w-full bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold py-3 rounded-xl transition-colors shadow-lg shadow-sky-500/20 flex items-center justify-center gap-2 text-sm disabled:opacity-50"
            >
              {loading ? 'Ingresando...' : 'Iniciar Sesión'}
            </button>
          </form>

          <div className="text-center pt-2">
            <Link href="/register" className="text-xs text-sky-400 hover:underline">
              ¿No tenés una cuenta? Registrá tu clínica acá
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
