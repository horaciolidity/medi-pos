import Link from 'next/link';
import { Activity, ShieldCheck, CreditCard, Users, Clock, ArrowRight, Building2 } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col justify-between">
      {/* Navbar */}
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-sky-500 text-slate-950 p-2 rounded-xl font-bold">
              <Activity className="w-6 h-6" />
            </div>
            <div>
              <span className="font-extrabold text-xl tracking-tight text-white">Clinic POS</span>
              <span className="ml-2 text-xs bg-sky-500/20 text-sky-300 border border-sky-500/30 px-2 py-0.5 rounded-full font-medium">
                SaaS Argentina
              </span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="text-slate-300 hover:text-white px-4 py-2 text-sm font-medium transition-colors"
            >
              Iniciar Sesión
            </Link>
            <Link
              href="/register"
              className="bg-sky-500 hover:bg-sky-400 text-slate-950 px-4 py-2 text-sm font-bold rounded-lg transition-colors flex items-center gap-2 shadow-lg shadow-sky-500/20"
            >
              Registrar Clínica <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <main className="max-w-7xl mx-auto px-6 py-16 flex-1 flex flex-col justify-center">
        <div className="text-center max-w-3xl mx-auto space-y-6">
          <div className="inline-flex items-center gap-2 bg-slate-800/80 border border-slate-700 text-sky-400 text-xs px-3 py-1.5 rounded-full font-medium mb-2">
            <Building2 className="w-3.5 h-3.5" /> Diseñado para consultorios y clínicas de Argentina
          </div>
          <h1 className="text-4xl md:text-6xl font-black text-white tracking-tight leading-tight">
            Gestión Integral, Simple y Confiable para tu Clínica
          </h1>
          <p className="text-lg text-slate-400 leading-relaxed">
            Historia clínica longitudinal, triage confidencial, turnero avanzado con pantalla pública en tiempo real, caja POS, inventario de farmacia y facturación fiscal preparada para ARCA/AFIP.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            <Link
              href="/login"
              className="bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold px-8 py-3.5 rounded-xl transition-all shadow-xl shadow-sky-500/25 flex items-center gap-2 text-base"
            >
              Ingresar al Demo Activo
            </Link>
            <Link
              href="/superadmin"
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold px-6 py-3.5 rounded-xl transition-all text-base"
            >
              Panel Superadmin
            </Link>
          </div>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16">
          <div className="bg-slate-800/50 border border-slate-700/60 p-6 rounded-2xl space-y-3">
            <div className="bg-sky-500/10 text-sky-400 p-3 rounded-xl w-fit">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-lg text-white">Multiempresa & Modo Solo Lectura</h3>
            <p className="text-sm text-slate-400">
              Aislamiento total de datos por clínica. Ante vencimiento de suscripción, la clínica conserva acceso de consulta pero se bloquean de forma estricta escrituras y exportaciones.
            </p>
          </div>

          <div className="bg-slate-800/50 border border-slate-700/60 p-6 rounded-2xl space-y-3">
            <div className="bg-emerald-500/10 text-emerald-400 p-3 rounded-xl w-fit">
              <Clock className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-lg text-white">Turnero Avanzado (Plan Pro)</h3>
            <p className="text-sm text-slate-400">
              Pantalla pública de llamados en tiempo real, tickets térmicos operativos y llamado por boxes sin revelar datos confidenciales del paciente ni triage.
            </p>
          </div>

          <div className="bg-slate-800/50 border border-slate-700/60 p-6 rounded-2xl space-y-3">
            <div className="bg-purple-500/10 text-purple-400 p-3 rounded-xl w-fit">
              <CreditCard className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-lg text-white">Caja POS & Facturación ARCA</h3>
            <p className="text-sm text-slate-400">
              Arqueos de caja con control de diferencias, cobro de coseguros, catálogo de aranceles y módulo de comprobantes fiscales con simulación segura de CAE.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-6 text-center text-xs text-slate-500">
        Clinic POS Argentina &copy; 2026 - Todos los derechos reservados.
      </footer>
    </div>
  );
}
