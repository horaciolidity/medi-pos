'use client';

import { useState, useEffect } from 'react';
import { Receipt, Plus, ShieldCheck, AlertCircle, FileText, CheckCircle2 } from 'lucide-react';

export default function FacturacionPage() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [fiscalData, setFiscalData] = useState<any>(null);
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isReadOnly, setIsReadOnly] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [newInvoice, setNewInvoice] = useState({
    patientId: '',
    invoiceType: 'FACTURA_B',
    totalAmount: '',
    cuitReceptor: '',
  });

  const [error, setError] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [meRes, invRes, pRes] = await Promise.all([
        fetch('/api/auth/me'),
        fetch('/api/billing/invoices'),
        fetch('/api/patients'),
      ]);

      const meData = await meRes.json();
      setIsReadOnly(meData.subscription?.isReadOnly || false);

      const invData = await invRes.json();
      setInvoices(invData.invoices || []);
      setFiscalData(invData.fiscalData || null);

      const pData = await pRes.json();
      setPatients(pData.patients || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleEmitInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const res = await fetch('/api/billing/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newInvoice),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al emitir comprobante');

      setShowModal(false);
      setNewInvoice({ patientId: '', invoiceType: 'FACTURA_B', totalAmount: '', cuitReceptor: '' });
      loadData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Receipt className="w-6 h-6 text-sky-600" /> Facturación Fiscal ARCA / AFIP
          </h1>
          <p className="text-xs text-slate-500 mt-1">Configuración fiscal de la clínica y emisión de comprobantes Factura A, B, C con CAE</p>
        </div>

        <button
          onClick={() => {
            if (isReadOnly) {
              alert('Acción bloqueada: Su suscripción está vencida (Modo Solo Lectura).');
              return;
            }
            setShowModal(true);
          }}
          disabled={isReadOnly}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all ${
            isReadOnly ? 'bg-slate-300 text-slate-500 cursor-not-allowed' : 'bg-sky-600 hover:bg-sky-500 text-white shadow-lg'
          }`}
        >
          <Plus className="w-4 h-4" />
          <span>Emitir Comprobante</span>
        </button>
      </div>

      {/* Fiscal Status Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
        <div className="space-y-1 text-xs">
          <span className="text-slate-400 font-semibold block uppercase">Datos Fiscales Registrados</span>
          <div className="font-bold text-slate-900 text-sm">{fiscalData?.razonSocial} (CUIT {fiscalData?.cuit})</div>
          <div className="text-slate-500">Condición IVA: {fiscalData?.fiscalCondition}</div>
        </div>

        <div className="text-right text-xs">
          <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1 rounded-full font-bold inline-flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" /> Estado ARCA: {fiscalData?.arcaIntegrationStatus}
          </span>
          <span className="block text-[10px] text-slate-400 mt-1">Entorno: {fiscalData?.arcaEnvironment}</span>
        </div>
      </div>

      {error && <div className="bg-red-50 text-red-700 p-3 rounded-xl text-xs border border-red-200">{error}</div>}

      {/* Invoices List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden text-xs">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-200 font-bold uppercase tracking-wider text-slate-500">
            <tr>
              <th className="p-4">Comprobante</th>
              <th className="p-4">Tipo</th>
              <th className="p-4">Receptor</th>
              <th className="p-4">Importe Total</th>
              <th className="p-4">Código CAE</th>
              <th className="p-4 text-right">Fecha</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {invoices.map((inv) => (
              <tr key={inv.id} className="hover:bg-slate-50">
                <td className="p-4 font-mono font-bold text-slate-900">{inv.invoiceNumber}</td>
                <td className="p-4 font-bold text-sky-600">{inv.invoiceType}</td>
                <td className="p-4 text-slate-700">
                  {inv.patient ? `${inv.patient.firstName} ${inv.patient.lastName}` : 'Consumidor Final'}
                </td>
                <td className="p-4 font-bold font-mono text-slate-900">ARS ${inv.totalAmount}</td>
                <td className="p-4 font-mono text-slate-500 text-[11px]">
                  <div>CAE: {inv.caeCode}</div>
                  <div className="text-[10px] text-slate-400">Vence: {inv.caeExpiration}</div>
                </td>
                <td className="p-4 text-right text-slate-400 font-mono">{new Date(inv.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
            {invoices.length === 0 && !loading && (
              <tr>
                <td colSpan={6} className="p-8 text-center text-slate-400">No hay comprobantes emitidos.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold text-slate-900">Emitir Comprobante Fiscal</h3>
            <form onSubmit={handleEmitInvoice} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Tipo de Comprobante</label>
                <select
                  value={newInvoice.invoiceType}
                  onChange={(e) => setNewInvoice({ ...newInvoice, invoiceType: e.target.value })}
                  className="w-full border border-slate-300 rounded-xl p-2.5 font-bold"
                >
                  <option value="FACTURA_B">Factura B (Consumidor Final)</option>
                  <option value="FACTURA_A">Factura A (Responsable Inscripto)</option>
                  <option value="FACTURA_C">Factura C (Monotributo / Exento)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Paciente / Receptor (Opcional)</label>
                <select
                  value={newInvoice.patientId}
                  onChange={(e) => setNewInvoice({ ...newInvoice, patientId: e.target.value })}
                  className="w-full border border-slate-300 rounded-xl p-2.5"
                >
                  <option value="">-- Consumidor Final --</option>
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>{p.firstName} {p.lastName} (DNI {p.documentNumber})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Importe Total (ARS) *</label>
                <input
                  type="number"
                  required
                  value={newInvoice.totalAmount}
                  onChange={(e) => setNewInvoice({ ...newInvoice, totalAmount: e.target.value })}
                  placeholder="15000"
                  className="w-full border border-slate-300 rounded-xl p-2.5 font-bold"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-bold">
                  Cancelar
                </button>
                <button type="submit" className="px-4 py-2 bg-sky-600 text-white rounded-xl font-bold">
                  Autorizar CAE
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
