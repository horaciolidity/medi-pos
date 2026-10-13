'use client';

import { useState, useEffect } from 'react';
import {
  Building2,
  Users,
  CreditCard,
  Search,
  Calendar,
  ShieldAlert,
  CheckCircle2,
  DollarSign,
  Edit3,
  Plus,
  ArrowUpRight,
  Lock,
  Unlock,
  Clock,
  Power,
  RefreshCw,
  Mail,
  Phone,
  UserCheck,
  AlertTriangle,
  Gift,
  Crown,
  Zap,
  Sliders
} from 'lucide-react';

export default function SuperadminPage() {
  const [companies, setCompanies] = useState<any[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [metrics, setMetrics] = useState<any>(null);
  const [recentLogs, setRecentLogs] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Modal Gestión de Suscripción / Cuenta
  const [selectedCompany, setSelectedCompany] = useState<any>(null);
  const [subStatus, setSubStatus] = useState('ACTIVE');
  const [subPlanCode, setSubPlanCode] = useState('STANDARD');
  const [extendDays, setExtendDays] = useState(0);
  const [customExpiresAt, setCustomExpiresAt] = useState('');
  const [subReason, setSubReason] = useState('');

  // Modal Modificar Precio del Plan
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [newPlanPrice, setNewPlanPrice] = useState('');
  const [priceReason, setPriceReason] = useState('');

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [compRes, plansRes, metricsRes] = await Promise.all([
        fetch(`/api/superadmin/companies?search=${encodeURIComponent(search)}`),
        fetch('/api/superadmin/plans'),
        fetch('/api/superadmin/metrics'),
      ]);

      const compData = await compRes.json();
      setCompanies(compData.companies || []);

      const plansData = await plansRes.json();
      setPlans(plansData.plans || []);

      const metricsData = await metricsRes.json();
      setMetrics(metricsData.metrics);
      setRecentLogs(metricsData.recentLogs || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [search]);

  // Activar o Desactivar cuenta directo con 1 clic
  const handleToggleAccountStatus = async (company: any) => {
    const isCurrentlyActive = company.subscription?.status === 'ACTIVE' || company.subscription?.status === 'TRIAL';
    const newStatus = isCurrentlyActive ? 'SUSPENDED' : 'ACTIVE';
    const confirmMsg = isCurrentlyActive
      ? `¿Estás seguro de DESACTIVAR / SUSPENDER la cuenta de "${company.name}"? Los usuarios de esta clínica no podrán acceder al sistema.`
      : `¿Estás seguro de ACTIVAR la cuenta de "${company.name}"?`;

    if (!window.confirm(confirmMsg)) return;

    setError('');
    setSuccess('');

    try {
      const res = await fetch(`/api/superadmin/companies/${company.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: newStatus,
          reason: isCurrentlyActive ? 'Suspensión manual por Superadmin' : 'Activación manual por Superadmin',
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al actualizar estado');

      setSuccess(`Cuenta "${company.name}" ${newStatus === 'ACTIVE' ? 'activada' : 'desactivada'} exitosamente.`);
      loadData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Guardar cambios del modal de suscripción (planes, días, etc.)
  const handleUpdateSubscription = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCompany) return;
    setError('');
    setSuccess('');

    try {
      const payload: any = {
        status: subStatus,
        planCode: subPlanCode,
        reason: subReason || 'Ajuste administrativo de suscripción por Superadmin',
      };

      if (customExpiresAt) {
        payload.newExpiresAt = new Date(customExpiresAt).toISOString();
      } else if (extendDays !== 0) {
        payload.extendDays = Number(extendDays);
      }

      const res = await fetch(`/api/superadmin/companies/${selectedCompany.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al actualizar suscripción');

      setSelectedCompany(null);
      setSubReason('');
      setExtendDays(0);
      setCustomExpiresAt('');
      setSuccess(`Suscripción de "${selectedCompany.name}" actualizada exitosamente.`);
      loadData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Modificar precio del plan
  const handleUpdatePlanPrice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlan) return;
    setError('');
    setSuccess('');

    try {
      const res = await fetch('/api/superadmin/plans', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId: selectedPlan.id,
          monthlyPrice: Number(newPlanPrice),
          reason: priceReason || 'Ajuste de tarifa comercial por Superadmin',
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al actualizar precio del plan');

      setSelectedPlan(null);
      setPriceReason('');
      setSuccess(`Precio del plan "${selectedPlan.name}" actualizado a ARS $${newPlanPrice}/mes.`);
      loadData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Abrir modal de gestión de clínica
  const openManageModal = (c: any) => {
    setSelectedCompany(c);
    setSubStatus(c.subscription?.rawStatus || c.subscription?.status || 'ACTIVE');
    setSubPlanCode(c.subscription?.planCode || 'STANDARD');
    setExtendDays(0);
    setSubReason('');
    if (c.subscription?.expiresAt) {
      const d = new Date(c.subscription.expiresAt);
      setCustomExpiresAt(d.toISOString().split('T')[0]);
    } else {
      setCustomExpiresAt('');
    }
  };

  return (
    <div className="space-y-8">
      {/* Top Banner de bienvenida Superadmin */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-purple-950 via-slate-900 to-slate-900 border border-purple-800/40 p-6 rounded-2xl shadow-xl">
        <div>
          <div className="flex items-center gap-2 text-purple-400 font-mono text-xs uppercase tracking-widest mb-1">
            <Zap className="w-4 h-4 text-purple-400" /> Control Central SaaS
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight flex items-center gap-2">
            Panel Superadmin — Clínicas & Suscripciones
          </h1>
          <p className="text-xs text-slate-300 mt-1">
            Operador Master: <span className="text-purple-300 font-bold font-mono">horaciowalterortiz@gmail.com</span>
          </p>
        </div>

        <button
          onClick={loadData}
          className="bg-purple-600/30 hover:bg-purple-600/50 text-purple-200 border border-purple-500/40 px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all self-start md:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Actualizar Datos</span>
        </button>
      </div>

      {success && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 p-4 rounded-2xl text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-2xl text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Clínicas</span>
            <Building2 className="w-4 h-4 text-purple-400" />
          </div>
          <p className="text-3xl font-black text-white">{metrics?.totalCompanies || companies.length}</p>
          <span className="text-[11px] text-slate-500">Cuentas registradas en el SaaS</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">Cuentas Activas</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-3xl font-black text-emerald-400">
            {companies.filter((c) => c.subscription?.status === 'ACTIVE' || c.subscription?.status === 'TRIAL').length}
          </p>
          <span className="text-[11px] text-slate-500">Operando con acceso total</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-400">Total Pacientes Red</span>
            <Users className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-3xl font-black text-amber-400">
            {companies.reduce((acc, c) => acc + (c.counts?.patients || 0), 0)}
          </p>
          <span className="text-[11px] text-slate-500">Pacientes cargados en el sistema</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold uppercase tracking-wider text-purple-400">Ingreso Mensual (MRR)</span>
            <DollarSign className="w-4 h-4 text-purple-400" />
          </div>
          <p className="text-2xl font-black text-purple-300 font-mono">
            ARS ${metrics?.estimatedMRR || 0}
          </p>
          <span className="text-[11px] text-slate-500">Recurrente estimado</span>
        </div>
      </div>

      {/* Planes Comerciales y Precios Editables */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-purple-400" /> Planes Comerciales Oficiales (Precios Editables)
          </h3>
          <span className="text-xs text-slate-400">Los cambios aplican a las nuevas suscripciones de la plataforma</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          {/* Plan Prueba Gratuita */}
          <div className="bg-slate-950 border border-slate-800 p-5 rounded-xl flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center">
                <h4 className="font-bold text-white text-base flex items-center gap-1.5">
                  <Gift className="w-4 h-4 text-amber-400" /> Prueba Gratuita
                </h4>
                <span className="bg-amber-500/10 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded-full text-[10px] font-bold">
                  50 PACIENTES
                </span>
              </div>
              <p className="text-slate-400 text-[11px] mt-2">
                Modo de prueba inicial sin costo hasta 50 ingresos de pacientes. Luego requiere plan.
              </p>
              <div className="mt-3 text-amber-300 font-bold font-mono text-base">GRATIS ($0)</div>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-800/80 text-[10px] text-slate-500">
              ✓ 50 pacientes gratis automáticos al registrarse
            </div>
          </div>

          {/* Planes de la BD (Estándar, Pro, etc.) */}
          {plans.map((p) => (
            <div key={p.id} className="bg-slate-950 border border-slate-800 p-5 rounded-xl flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center">
                  <h4 className="font-bold text-white text-base flex items-center gap-1.5">
                    {p.code === 'PRO' ? <Crown className="w-4 h-4 text-purple-400" /> : <Building2 className="w-4 h-4 text-sky-400" />}
                    {p.name}
                  </h4>
                  <span className="bg-purple-500/10 text-purple-400 border border-purple-500/30 px-2 py-0.5 rounded-full text-[10px] font-bold">
                    {p.code}
                  </span>
                </div>
                <p className="text-slate-400 text-[11px] mt-2 line-clamp-2">{p.description}</p>
                <div className="mt-3 text-purple-300 font-bold font-mono text-base">
                  ARS ${p.monthlyPrice} / mes
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                <span className="text-[10px] text-slate-500">
                  {p.isProTurneroEnabled ? 'Con Turnero Pro en vivo' : 'Gestión integral estándar'}
                </span>
                <button
                  onClick={() => {
                    setSelectedPlan(p);
                    setNewPlanPrice(String(p.monthlyPrice));
                  }}
                  className="bg-purple-600/20 hover:bg-purple-600/40 text-purple-300 border border-purple-500/30 px-3 py-1.5 rounded-lg font-bold text-xs flex items-center gap-1.5 transition-colors"
                >
                  <Edit3 className="w-3 h-3" /> Editar Precio
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Directorio de Empresas / Cuentas Clientes */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden space-y-4 p-6 text-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="font-bold text-white text-base">
              Directorio de Clínicas & Cuentas Clientes ({companies.length})
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Administrá los planes, activá o desactivá cuentas y extendé o descontá días de servicio.
            </p>
          </div>

          <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 px-3 py-2 rounded-xl text-slate-300 w-full md:w-80">
            <Search className="w-4 h-4 text-slate-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por Clínica, CUIT, Email o Admin..."
              className="bg-transparent border-none text-xs text-white placeholder-slate-500 focus:outline-none w-full"
            />
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-800">
          <table className="w-full text-left">
            <thead className="bg-slate-950 border-b border-slate-800 font-bold uppercase tracking-wider text-slate-400">
              <tr>
                <th className="p-4">Empresa / Clínica</th>
                <th className="p-4">Correos de Contacto</th>
                <th className="p-4 text-center">Pacientes Cargados</th>
                <th className="p-4">Plan Asignado</th>
                <th className="p-4">Estado Cuenta</th>
                <th className="p-4">Vencimiento / Días</th>
                <th className="p-4 text-right">Acciones Rápidas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {companies.map((c) => {
                const sub = c.subscription;
                const isSuspended = sub?.status === 'SUSPENDED';
                const isReadOnly = sub?.status === 'READ_ONLY';
                const isActive = sub?.status === 'ACTIVE' || sub?.status === 'TRIAL';
                const patientCount = c.counts?.patients || 0;
                const isTrial = sub?.isTrial;

                return (
                  <tr key={c.id} className="hover:bg-slate-850/50 transition-colors">
                    {/* Empresa & Razón Social */}
                    <td className="p-4">
                      <div className="font-bold text-white text-sm">{c.name}</div>
                      {c.razonSocial && (
                        <div className="text-[11px] text-slate-400">{c.razonSocial}</div>
                      )}
                      <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                        CUIT: {c.cuit || 'S/D'} • Registrada: {new Date(c.createdAt).toLocaleDateString()}
                      </div>
                    </td>

                    {/* Correos de Contacto */}
                    <td className="p-4">
                      <div className="text-slate-200 font-semibold flex items-center gap-1.5">
                        <Mail className="w-3 h-3 text-sky-400 shrink-0" />
                        <span>{c.adminEmail}</span>
                      </div>
                      {c.email && c.email !== c.adminEmail && (
                        <div className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                          <Building2 className="w-3 h-3 text-slate-500 shrink-0" />
                          <span>{c.email}</span>
                        </div>
                      )}
                      <div className="text-[10px] text-slate-500 mt-0.5">
                        Admin: {c.adminName} ({c.userCount} usuario{c.userCount !== 1 ? 's' : ''})
                      </div>
                    </td>

                    {/* Cantidad de Pacientes */}
                    <td className="p-4 text-center">
                      <div className="inline-flex flex-col items-center">
                        <span className="font-black text-sm text-white font-mono bg-slate-800 px-2.5 py-1 rounded-lg">
                          {patientCount} pacientes
                        </span>
                        {isTrial && (
                          <span className="text-[10px] text-amber-400 font-bold mt-1">
                            {patientCount}/50 de prueba
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Plan Asignado */}
                    <td className="p-4">
                      {isTrial ? (
                        <span className="bg-amber-500/10 border border-amber-500/30 text-amber-400 font-bold px-2.5 py-1 rounded-lg text-xs flex items-center gap-1 w-fit">
                          <Gift className="w-3 h-3" /> Prueba (50 pac.)
                        </span>
                      ) : sub?.planCode === 'PRO' ? (
                        <span className="bg-purple-500/10 border border-purple-500/30 text-purple-300 font-bold px-2.5 py-1 rounded-lg text-xs flex items-center gap-1 w-fit">
                          <Crown className="w-3 h-3" /> Plan Pro
                        </span>
                      ) : (
                        <span className="bg-sky-500/10 border border-sky-500/30 text-sky-300 font-bold px-2.5 py-1 rounded-lg text-xs flex items-center gap-1 w-fit">
                          <Building2 className="w-3 h-3" /> Plan Estándar
                        </span>
                      )}
                    </td>

                    {/* Estado Cuenta */}
                    <td className="p-4">
                      {isActive && (
                        <span className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold px-2.5 py-1 rounded-lg text-xs inline-flex items-center gap-1">
                          🟢 ACTIVA
                        </span>
                      )}
                      {isSuspended && (
                        <span className="bg-red-500/10 border border-red-500/30 text-red-400 font-bold px-2.5 py-1 rounded-lg text-xs inline-flex items-center gap-1">
                          🔴 SUSPENDIDA
                        </span>
                      )}
                      {isReadOnly && (
                        <span className="bg-amber-500/10 border border-amber-500/30 text-amber-400 font-bold px-2.5 py-1 rounded-lg text-xs inline-flex items-center gap-1">
                          🔒 SOLO LECTURA
                        </span>
                      )}
                    </td>

                    {/* Vencimiento & Días */}
                    <td className="p-4 font-mono text-slate-300">
                      {sub?.expiresAt ? (
                        <div>
                          <div className="font-semibold">{new Date(sub.expiresAt).toLocaleDateString()}</div>
                          <div className={`text-[10px] font-bold ${sub.daysRemaining > 5 ? 'text-emerald-400' : sub.daysRemaining > 0 ? 'text-amber-400' : 'text-red-400'}`}>
                            {sub.daysRemaining > 0 ? `Quedan ${sub.daysRemaining} días` : `Vencida`}
                          </div>
                        </div>
                      ) : (
                        <span className="text-slate-500">Sin vencimiento</span>
                      )}
                    </td>

                    {/* Acciones Rápidas */}
                    <td className="p-4 text-right space-x-2">
                      {/* Botón 1 Clic: Activar / Desactivar */}
                      <button
                        onClick={() => handleToggleAccountStatus(c)}
                        title={isActive ? 'Desactivar / Suspender Cuenta' : 'Activar Cuenta'}
                        className={`px-2.5 py-1.5 rounded-lg font-bold text-xs transition-colors inline-flex items-center gap-1 border ${
                          isActive
                            ? 'bg-red-500/10 hover:bg-red-500/20 text-red-400 border-red-500/30'
                            : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                        }`}
                      >
                        <Power className="w-3.5 h-3.5" />
                        <span>{isActive ? 'Suspender' : 'Activar'}</span>
                      </button>

                      {/* Botón: Gestionar Suscripción Completa */}
                      <button
                        onClick={() => openManageModal(c)}
                        className="bg-purple-600 hover:bg-purple-500 text-white font-bold px-3 py-1.5 rounded-lg transition-colors text-xs inline-flex items-center gap-1"
                      >
                        <Sliders className="w-3.5 h-3.5" />
                        <span>Gestionar</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Gestión de Suscripción (Planes, Días, Estado) */}
      {selectedCompany && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="border-b border-slate-800 pb-3">
              <span className="text-[10px] text-purple-400 font-bold uppercase tracking-wider block">
                Gestión de Cuenta & Planes
              </span>
              <h3 className="text-lg font-black text-white">{selectedCompany.name}</h3>
              <p className="text-xs text-slate-400">
                Contacto: {selectedCompany.adminEmail} • Pacientes: {selectedCompany.counts?.patients || 0}
              </p>
            </div>

            <form onSubmit={handleUpdateSubscription} className="space-y-4 text-xs">
              {/* Estado de la Cuenta */}
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Estado Operativo de la Cuenta</label>
                <select
                  value={subStatus}
                  onChange={(e) => setSubStatus(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl p-2.5 font-bold"
                >
                  <option value="ACTIVE">🟢 ACTIVA (Acceso completo regularizado)</option>
                  <option value="TRIAL">🎁 TRIAL (Modo Prueba Gratuita 50 pacientes)</option>
                  <option value="READ_ONLY">🔒 READ_ONLY (Vencida / Solo Lectura)</option>
                  <option value="SUSPENDED">🔴 SUSPENDED (Cuenta Desactivada / Suspendida)</option>
                </select>
              </div>

              {/* Poner / Sacar Planes */}
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Plan Asignado</label>
                <select
                  value={subPlanCode}
                  onChange={(e) => setSubPlanCode(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl p-2.5 font-bold"
                >
                  <option value="TRIAL">🎁 Prueba Gratuita (50 Pacientes sin costo)</option>
                  <option value="STANDARD">🔷 Plan Estándar (ARS $14.900/mes)</option>
                  <option value="PRO">👑 Plan Pro (ARS $24.900/mes - Turnero Avanzado)</option>
                </select>
              </div>

              {/* Modificar / Sumar / Descontar Días */}
              <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl space-y-3">
                <label className="block font-semibold text-purple-300">
                  Modificar Días de Activación (+ Sumar / - Descontar)
                </label>

                {/* Botones rápidos de días */}
                <div className="grid grid-cols-5 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setExtendDays(-30)}
                    className={`py-1.5 px-2 rounded-lg font-bold border text-center transition-all ${
                      extendDays === -30 ? 'bg-red-600 text-white border-red-500' : 'bg-slate-900 text-red-400 border-slate-700 hover:border-red-500'
                    }`}
                  >
                    -30 d
                  </button>
                  <button
                    type="button"
                    onClick={() => setExtendDays(-7)}
                    className={`py-1.5 px-2 rounded-lg font-bold border text-center transition-all ${
                      extendDays === -7 ? 'bg-red-600 text-white border-red-500' : 'bg-slate-900 text-red-400 border-slate-700 hover:border-red-500'
                    }`}
                  >
                    -7 d
                  </button>
                  <button
                    type="button"
                    onClick={() => setExtendDays(7)}
                    className={`py-1.5 px-2 rounded-lg font-bold border text-center transition-all ${
                      extendDays === 7 ? 'bg-emerald-600 text-white border-emerald-500' : 'bg-slate-900 text-emerald-400 border-slate-700 hover:border-emerald-500'
                    }`}
                  >
                    +7 d
                  </button>
                  <button
                    type="button"
                    onClick={() => setExtendDays(15)}
                    className={`py-1.5 px-2 rounded-lg font-bold border text-center transition-all ${
                      extendDays === 15 ? 'bg-emerald-600 text-white border-emerald-500' : 'bg-slate-900 text-emerald-400 border-slate-700 hover:border-emerald-500'
                    }`}
                  >
                    +15 d
                  </button>
                  <button
                    type="button"
                    onClick={() => setExtendDays(30)}
                    className={`py-1.5 px-2 rounded-lg font-bold border text-center transition-all ${
                      extendDays === 30 ? 'bg-emerald-600 text-white border-emerald-500' : 'bg-slate-900 text-emerald-400 border-slate-700 hover:border-emerald-500'
                    }`}
                  >
                    +30 d
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div>
                    <span className="text-[10px] text-slate-400 block mb-1">Días manuales (+ o -):</span>
                    <input
                      type="number"
                      value={extendDays}
                      onChange={(e) => setExtendDays(Number(e.target.value))}
                      placeholder="Ej: 30 o -15"
                      className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg p-2 font-mono font-bold text-center"
                    />
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-400 block mb-1">O fijar fecha exacta:</span>
                    <input
                      type="date"
                      value={customExpiresAt}
                      onChange={(e) => setCustomExpiresAt(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg p-2 font-mono text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Motivo Administrativo */}
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Motivo Administrativo (Auditoría) *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Pago de abono confirmado / Prórroga comercial concedida"
                  value={subReason}
                  onChange={(e) => setSubReason(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl p-2.5"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setSelectedCompany(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-bold shadow-lg shadow-purple-600/20 transition-colors"
                >
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Ajustar Precio de Plan */}
      {selectedPlan && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-lg font-black text-white">Editar Tarifa: {selectedPlan.name}</h3>
            <p className="text-xs text-slate-400">
              Modificá el precio mensual en pesos argentinos (ARS) para este plan comercial.
            </p>

            <form onSubmit={handleUpdatePlanPrice} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Nuevo Precio Mensual (ARS) *</label>
                <div className="relative">
                  <span className="absolute left-3 top-3 text-slate-400 font-mono font-bold">$</span>
                  <input
                    type="number"
                    required
                    value={newPlanPrice}
                    onChange={(e) => setNewPlanPrice(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 text-white font-mono text-base font-bold rounded-xl pl-8 pr-4 py-2.5"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Motivo del Ajuste de Precio *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Ajuste inflacionario / Tarifa especial 2026"
                  value={priceReason}
                  onChange={(e) => setPriceReason(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl p-2.5"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setSelectedPlan(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-bold shadow-lg shadow-purple-600/20 transition-colors"
                >
                  Guardar Nueva Tarifa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
