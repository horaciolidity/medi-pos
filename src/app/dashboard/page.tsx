'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Users, Stethoscope, HeartPulse, Clock, Package,
  ShoppingCart, Receipt, Bell, ShieldAlert, CheckCircle2, ArrowRight, Sliders, Printer
} from 'lucide-react';

export default function DashboardOverviewPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [meRes, patientsRes, turnosRes, incidentsRes] = await Promise.all([
          fetch('/api/auth/me'),
          fetch('/api/patients'),
          fetch('/api/turnos'),
          fetch('/api/incidents'),
        ]);

        const meData = await meRes.json();
        const patientsData = await patientsRes.json();
        const turnosData = await turnosRes.json();
        const incidentsData = await incidentsRes.json();

        setData({
          user: meData.user,
          subscription: meData.subscription,
          patientCount: patientsData.patients?.length || 0,
          turnosCount: turnosData.turnos?.length || 0,
          incidentsCount: incidentsData.incidents?.length || 0,
        });
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) {
    return <div className="p-8 text-sm text-slate-500">Cargando visión general...</div>;
  }

  const sub = data?.subscription;
  const isReadOnly = sub?.isReadOnly;

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Welcome Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 text-white p-6 rounded-2xl shadow-lg">
        <div>
          <span className="text-xs font-mono text-sky-400 uppercase tracking-widest">Panel Principal</span>
          <h2 className="text-2xl font-black text-white mt-1">
            Bienvenido, {data?.user?.firstName} {data?.user?.lastName}
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {data?.user?.company?.name} — Rol: <span className="font-semibold text-slate-200">{data?.user?.role}</span>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-slate-800 border border-slate-700 px-4 py-2 rounded-xl text-right">
            <span className="text-[10px] text-slate-400 uppercase block font-semibold">Estado Suscripción</span>
            <div className="flex items-center gap-1.5 justify-end mt-0.5">
              {isReadOnly ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping"></span>
                  <span className="text-xs font-bold text-amber-400">SOLO LECTURA</span>
                </>
              ) : (
                <>
                  <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                  <span className="text-xs font-bold text-emerald-400">ACTIVA ({sub?.planName})</span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Subscription Banner detail if read-only */}
      {isReadOnly && (
        <div className="bg-amber-50 border border-amber-300 p-5 rounded-2xl text-amber-900 flex items-start gap-4 shadow-sm">
          <ShieldAlert className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1 text-xs">
            <h4 className="font-bold text-sm text-amber-950">Aviso de Suscripción Vencida (Solo Lectura)</h4>
            <p className="leading-relaxed">
              La suscripción de la clínica ha expirado. De acuerdo con las reglas del servicio, usted puede ingresar y
              <strong> consultar todas las historias clínicas, atenciones anteriores, inventarios y cierres de caja</strong>, pero las funciones para
              registrar nuevos pacientes, crear turnos, emitir cobranzas y descargar/exportar archivos han sido bloqueadas.
            </p>
            <p className="font-bold pt-1 text-amber-950">
              Para rehabilitar la escritura, solicite la regularización del pago al administrador del SaaS.
            </p>
          </div>
        </div>
      )}

      {/* Quick Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex justify-between items-center text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Pacientes</span>
            <Users className="w-5 h-5 text-sky-600" />
          </div>
          <p className="text-3xl font-black text-slate-900">{data?.patientCount}</p>
          <span className="text-[11px] text-slate-400">Registrados en la clínica</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex justify-between items-center text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Turnos en Cola</span>
            <Clock className="w-5 h-5 text-emerald-600" />
          </div>
          <p className="text-3xl font-black text-slate-900">{data?.turnosCount}</p>
          <span className="text-[11px] text-slate-400">Atenciones del día</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex justify-between items-center text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Incidencias</span>
            <Bell className="w-5 h-5 text-purple-600" />
          </div>
          <p className="text-3xl font-black text-slate-900">{data?.incidentsCount}</p>
          <span className="text-[11px] text-slate-400">Novedades operativas</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex justify-between items-center text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Plan Contratado</span>
            <CheckCircle2 className="w-5 h-5 text-sky-600" />
          </div>
          <p className="text-lg font-black text-slate-900">{sub?.planName || 'Estándar'}</p>
          <span className="text-[11px] text-slate-400">
            {sub?.isProTurneroEnabled ? 'Turnero Pro Habilitado' : 'Turnero Básico'}
          </span>
        </div>
      </div>

      {/* Quick Navigation Modules */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-slate-900">Módulos Operativos</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          <Link
            href="/dashboard/pacientes"
            className="bg-white hover:border-sky-500 p-5 rounded-2xl border border-slate-200 shadow-sm transition-all group"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="bg-sky-50 text-sky-600 p-3 rounded-xl group-hover:bg-sky-500 group-hover:text-white transition-colors">
                <Users className="w-6 h-6" />
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-sky-600 group-hover:translate-x-1 transition-all" />
            </div>
            <h4 className="font-bold text-slate-900 text-base">Pacientes & Historia Clínica</h4>
            <p className="text-xs text-slate-500 mt-1">Evoluciones longitudinales, antecedentes, diagnósticos y enmiendas auditadas.</p>
          </Link>

          <Link
            href="/dashboard/turnos"
            className="bg-white hover:border-emerald-500 p-5 rounded-2xl border border-slate-200 shadow-sm transition-all group"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="bg-emerald-50 text-emerald-600 p-3 rounded-xl group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                <Clock className="w-6 h-6" />
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-1 transition-all" />
            </div>
            <h4 className="font-bold text-slate-900 text-base">Recepción & Turnero</h4>
            <p className="text-xs text-slate-500 mt-1">Generación de tickets, llamado por boxes y pantalla pública sanitizada.</p>
          </Link>

          <Link
            href="/dashboard/caja"
            className="bg-white hover:border-purple-500 p-5 rounded-2xl border border-slate-200 shadow-sm transition-all group"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="bg-purple-50 text-purple-600 p-3 rounded-xl group-hover:bg-purple-500 group-hover:text-white transition-colors">
                <ShoppingCart className="w-6 h-6" />
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-purple-600 group-hover:translate-x-1 transition-all" />
            </div>
            <h4 className="font-bold text-slate-900 text-base">Caja & POS</h4>
            <p className="text-xs text-slate-500 mt-1">Apertura/cierre de turnos, arqueo de caja con diferencias y cobro de coseguros.</p>
          </Link>

          <Link
            href="/dashboard/configuracion"
            className="bg-white hover:border-amber-500 p-5 rounded-2xl border border-slate-200 shadow-sm transition-all group"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="bg-amber-50 text-amber-600 p-3 rounded-xl group-hover:bg-amber-500 group-hover:text-white transition-colors">
                <Printer className="w-6 h-6" />
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-amber-600 group-hover:translate-x-1 transition-all" />
            </div>
            <h4 className="font-bold text-slate-900 text-base">Ajustes & Ticket Térmico</h4>
            <p className="text-xs text-slate-500 mt-1">Datos fiscales de la clínica, encabezados, ancho de papel y diseño de comprobantes.</p>
          </Link>
        </div>
      </div>
    </div>
  );
}
