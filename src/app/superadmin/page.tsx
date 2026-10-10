'use client';

import { useState, useEffect } from 'react';
import {
  Building2, Users, CreditCard, Search, Calendar, ShieldAlert,
  CheckCircle2, DollarSign, Edit3, Plus, ArrowUpRight, Lock, Unlock, Clock
} from 'lucide-react';

export default function SuperadminPage() {
  const [companies, setCompanies] = useState<any[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [metrics, setMetrics] = useState<any>(null);
  const [recentLogs, setRecentLogs] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Edit Subscription Modal
  const [selectedCompany, setSelectedCompany] = useState<any>(null);
  const [subStatus, setSubStatus] = useState('ACTIVE');
  const [subPlanCode, setSubPlanCode] = useState('PRO');
  const [extendDays, setExtendDays] = useState('30');
  const [subReason, setSubReason] = useState('');

  // Edit Plan Price Modal
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

  const handleUpdateSubscription = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCompany) return;
    setError('');

    try {
      const res = await fetch(`/api/superadmin/companies/${selectedCompany.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: subStatus,
          planCode: subPlanCode,
          extendDays: Number(extendDays),
          reason: subReason,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al actualizar suscripción');

      setSelectedCompany(null);
      setSubReason('');
      setSuccess('Suscripción actualizada exitosamente.');
      loadData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleUpdatePlanPrice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlan) return;
    setError('');

    try {
      const res = await fetch('/api/superadmin/plans', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId: selectedPlan.id,
          monthlyPrice: Number(newPlanPrice),
          reason: priceReason,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al actualizar precio del plan');

      setSelectedPlan(null);
      setPriceReason('');
      setSuccess('Tarifa del plan actualizada exitosamente.');
      loadData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="space-y-8">
      {/* Title */}
      <div>
        <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-2">
          <Building2 className="w-7 h-7 text-purple-400" /> Administración Global de Clínicas SaaS
        </h1>
        <p className="text-xs text-slate-400 mt-1">Gestión centralizada de cuentas clientes, suscripciones, vigencias y precios comerciales</p>
      </div>

      {success && <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 p-4 rounded-2xl text-xs">{success}</div>}
      {error && <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-2xl text-xs">{error}</div>}

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Clínicas</span>
          <p className="text-3xl font-black text-white">{metrics?.totalCompanies || 0}</p>
          <span className="text-[11px] text-slate-500">Cuentas registradas</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">Suscripciones Activas</span>
          <p className="text-3xl font-black text-emerald-400">{metrics?.subscriptions?.active || 0}</p>
          <span className="text-[11px] text-slate-500">Clínicas al día</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-amber-400">Vencidas / Solo Lectura</span>
          <p className="text-3xl font-black text-amber-400">{metrics?.subscriptions?.readOnly || 0}</p>
          <span className="text-[11px] text-slate-500">Modo Solo Lectura activado</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-purple-400">Ingreso Mensual MRR</span>
          <p className="text-2xl font-black text-purple-300 font-mono">ARS ${metrics?.estimatedMRR || 0}</p>
          <span className="text-[11px] text-slate-500">Facturación estimada recurrente</span>
        </div>
      </div>

      {/* Plans Pricing Configuration Section */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <CreditCard className="w-4 h-4 text-purple-400" /> Planes Comerciales Oficiales
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          {plans.map((p) => (
            <div key={p.id} className="bg-slate-950 border border-slate-800 p-5 rounded-xl flex justify-between items-center">
              <div>
                <h4 className="font-bold text-white text-base">{p.name}</h4>
                <p className="text-slate-400 text-[11px] mt-1 max-w-sm">{p.description}</p>
                <div className="mt-2 text-purple-300 font-bold font-mono text-base">ARS ${p.monthlyPrice} / mes</div>
              </div>

              <button
                onClick={() => {
                  setSelectedPlan(p);
                  setNewPlanPrice(String(p.monthlyPrice));
                }}
                className="bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 px-3.5 py-2 rounded-xl font-bold transition-colors"
              >
                Ajustar Precio
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Companies List */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden space-y-4 p-6 text-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h3 className="font-bold text-white text-base">Directorio de Clínicas Clientes</h3>
          <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 px-3 py-2 rounded-xl text-slate-300 w-full md:w-72">
            <Search className="w-4 h-4 text-slate-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por Clínica, CUIT o Email..."
              className="bg-transparent border-none text-xs text-white placeholder-slate-500 focus:outline-none w-full"
            />
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-slate-800">
          <table className="w-full text-left">
            <thead className="bg-slate-950 border-b border-slate-800 font-bold uppercase tracking-wider text-slate-400">
              <tr>
                <th className="p-4">Clínica / CUIT</th>
                <th className="p-4">Contacto Admin</th>
                <th className="p-4">Plan Actual</th>
                <th className="p-4">Estado Suscripción</th>
                <th className="p-4">Fecha Vencimiento</th>
                <th className="p-4 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {companies.map((c) => {
                const sub = c.subscription;
                const isReadOnly = sub?.status === 'READ_ONLY' || sub?.status === 'PAST_DUE';
                return (
                  <tr key={c.id} className="hover:bg-slate-850/50">
                    <td className="p-4">
                      <div className="font-bold text-white text-sm">{c.name}</div>
                      <div className="text-[10px] text-slate-400 font-mono">CUIT: {c.cuit}</div>
                    </td>
                    <td className="p-4">
                      <div className="text-slate-300 font-medium">{c.adminEmail}</div>
                      <div className="text-[10px] text-slate-500">
                        {c.counts.patients} Pacientes — {c.userCount} Usuarios
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="bg-slate-800 text-purple-300 font-mono px-2 py-1 rounded font-bold">
                        {sub?.planName || 'Sin Plan'}
                      </span>
                    </td>
                    <td className="p-4">
                      {sub?.status === 'ACTIVE' && (
                        <span className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold px-2.5 py-1 rounded-lg">
                          ACTIVA
                        </span>
                      )}
                      {isReadOnly && (
                        <span className="bg-amber-500/10 border border-amber-500/30 text-amber-400 font-bold px-2.5 py-1 rounded-lg flex items-center gap-1 w-fit">
                          <Lock className="w-3 h-3" /> SOLO LECTURA
                        </span>
                      )}
                      {sub?.status === 'SUSPENDED' && (
                        <span className="bg-red-500/10 border border-red-500/30 text-red-400 font-bold px-2.5 py-1 rounded-lg">
                          SUSPENDIDA
                        </span>
                      )}
                    </td>
                    <td className="p-4 font-mono text-slate-300">
                      {sub?.expiresAt ? new Date(sub.expiresAt).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => {
                          setSelectedCompany(c);
                          setSubStatus(sub?.status || 'ACTIVE');
                          setSubPlanCode(sub?.planCode || 'PRO');
                        }}
                        className="bg-purple-600 hover:bg-purple-500 text-white font-bold px-3 py-1.5 rounded-lg transition-colors text-xs"
                      >
                        Gestionar
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Editar Suscripción */}
      {selectedCompany && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold text-white">Gestionar Suscripción: {selectedCompany.name}</h3>
            <form onSubmit={handleUpdateSubscription} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Estado de Suscripción</label>
                <select
                  value={subStatus}
                  onChange={(e) => setSubStatus(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl p-2.5 font-bold"
                >
                  <option value="ACTIVE">🟢 ACTIVE (Activa Regularizada)</option>
                  <option value="READ_ONLY">🔒 READ_ONLY (Vencida / Solo Lectura)</option>
                  <option value="PAST_DUE">⚠️ PAST_DUE (Pago Pendiente)</option>
                  <option value="SUSPENDED">🔴 SUSPENDED (Suspensión Administrativa)</option>
                  <option value="CANCELED">❌ CANCELED (Cancelada)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Plan Comercial</label>
                <select
                  value={subPlanCode}
                  onChange={(e) => setSubPlanCode(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl p-2.5 font-bold"
                >
                  <option value="STANDARD">Plan Estándar (ARS $14.900/mes)</option>
                  <option value="PRO">Plan Pro (ARS $24.900/mes - Turnero Avanzado)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Extender Días de Vigencia</label>
                <input
                  type="number"
                  value={extendDays}
                  onChange={(e) => setExtendDays(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl p-2.5 font-bold"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Motivo Administrativo *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Pago confirmado por transferencia / Prórroga concedida"
                  value={subReason}
                  onChange={(e) => setSubReason(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl p-2.5"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setSelectedCompany(null)} className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl font-bold">
                  Cancelar
                </button>
                <button type="submit" className="px-4 py-2 bg-purple-600 text-white rounded-xl font-bold">
                  Guardar Cambios Auditados
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
            <h3 className="text-lg font-bold text-white">Modificar Tarifa: {selectedPlan.name}</h3>
            <form onSubmit={handleUpdatePlanPrice} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Nuevo Precio Mensual (ARS) *</label>
                <input
                  type="number"
                  required
                  value={newPlanPrice}
                  onChange={(e) => setNewPlanPrice(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 text-white font-mono text-base font-bold rounded-xl p-2.5"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Motivo del Ajuste Tarifa *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Ajuste inflacionario / Promoción comercial"
                  value={priceReason}
                  onChange={(e) => setPriceReason(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl p-2.5"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setSelectedPlan(null)} className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl font-bold">
                  Cancelar
                </button>
                <button type="submit" className="px-4 py-2 bg-purple-600 text-white rounded-xl font-bold">
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
