'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Activity, Building2, User, Mail, Lock, Phone, FileText, Check, AlertCircle } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    companyName: '',
    cuit: '',
    razonSocial: '',
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    phone: '',
    planCode: 'STANDARD',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccessMsg('');

    try {
      const res = await fetch('/api/auth/register-clinic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Error al registrar clínica');
      }

      setSuccessMsg('¡Registro exitoso! Redirigiendo al inicio de sesión...');
      setTimeout(() => {
        router.push('/login');
      }, 2000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6">
      <div className="max-w-2xl w-full space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex bg-sky-500 text-slate-950 p-3 rounded-2xl shadow-xl shadow-sky-500/20 font-bold mb-2">
            <Activity className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight">Registro de Nueva Clínica</h2>
          <p className="text-xs text-slate-400">Comenzá a gestionar tu centro de salud de forma simple y profesional</p>
        </div>

        <div className="bg-slate-800 border border-slate-700/80 p-6 rounded-2xl shadow-xl space-y-6">
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-3.5 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 p-3.5 rounded-xl text-xs flex items-center gap-2">
              <Check className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Selección de Plan con Prueba Gratuita */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">Plan Comercial a Probar</label>
                <span className="text-[11px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                  🎁 Incluye 50 pacientes gratis
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Tu registro activa el <strong>Modo Prueba Gratuita con 50 ingresos de pacientes sin costo</strong>. Al alcanzar los 50 pacientes podés activar el plan que elijas.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                <div
                  onClick={() => setFormData({ ...formData, planCode: 'STANDARD' })}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    formData.planCode === 'STANDARD'
                      ? 'border-sky-500 bg-sky-500/10 text-white shadow-lg shadow-sky-500/5'
                      : 'border-slate-700 bg-slate-900 text-slate-400 hover:border-slate-600'
                  }`}
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-bold text-sm text-white">Plan Estándar</span>
                    <span className="text-xs font-extrabold text-sky-400">ARS $14.900/mes</span>
                  </div>
                  <p className="text-xs text-slate-400 leading-snug">
                    Pacientes, Historia Clínica, Triage, Enfermería, Caja POS, Farmacia, Facturación y Reportes.
                  </p>
                </div>

                <div
                  onClick={() => setFormData({ ...formData, planCode: 'PRO' })}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    formData.planCode === 'PRO'
                      ? 'border-emerald-500 bg-emerald-500/10 text-white shadow-lg shadow-emerald-500/5'
                      : 'border-slate-700 bg-slate-900 text-slate-400 hover:border-slate-600'
                  }`}
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-bold text-sm text-white">Plan Pro</span>
                    <span className="text-xs font-extrabold text-emerald-400">ARS $24.900/mes</span>
                  </div>
                  <p className="text-xs text-slate-400 leading-snug">
                    Todo el Plan Estándar + Turnero avanzado con llamado público en tiempo real, tickets y boxes.
                  </p>
                </div>
              </div>
            </div>

            <hr className="border-slate-700/60 my-4" />

            {/* Datos de la Clínica */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Nombre Comercial de la Clínica</label>
                <input
                  type="text"
                  name="companyName"
                  required
                  value={formData.companyName}
                  onChange={handleChange}
                  placeholder="Ej: Centro Médico San Martin"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">CUIT Fiscal</label>
                <input
                  type="text"
                  name="cuit"
                  required
                  value={formData.cuit}
                  onChange={handleChange}
                  placeholder="Ej: 30-71123456-7"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Razón Social</label>
                <input
                  type="text"
                  name="razonSocial"
                  value={formData.razonSocial}
                  onChange={handleChange}
                  placeholder="Ej: Salud San Martin S.A."
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Teléfono de Contacto</label>
                <input
                  type="text"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="Ej: 011-4555-1234"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500"
                />
              </div>
            </div>

            <hr className="border-slate-700/60 my-4" />

            {/* Datos del Administrador */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Nombre Administrador</label>
                <input
                  type="text"
                  name="firstName"
                  required
                  value={formData.firstName}
                  onChange={handleChange}
                  placeholder="Carlos"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Apellido Administrador</label>
                <input
                  type="text"
                  name="lastName"
                  required
                  value={formData.lastName}
                  onChange={handleChange}
                  placeholder="Gómez"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Correo Electrónico (Login)</label>
                <input
                  type="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="admin@clinica.com.ar"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Contraseña</label>
                <input
                  type="password"
                  name="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold py-3 rounded-xl transition-colors shadow-lg shadow-sky-500/20 flex items-center justify-center gap-2 text-sm disabled:opacity-50 mt-6"
            >
              {loading ? 'Procesando Registro...' : 'Registrar Clínica e Iniciar Prueba'}
            </button>
          </form>

          <div className="text-center pt-2">
            <Link href="/login" className="text-xs text-sky-400 hover:underline">
              ¿Ya tenés una cuenta? Iniciar Sesión
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
