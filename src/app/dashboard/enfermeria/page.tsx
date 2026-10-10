'use client';

import { useState, useEffect } from 'react';
import { HeartPulse, Plus, AlertCircle, Check } from 'lucide-react';

export default function EnfermeriaPage() {
  const [records, setRecords] = useState<any[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isReadOnly, setIsReadOnly] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [newRecord, setNewRecord] = useState({
    patientId: '',
    proceduresDone: '',
    medicationAdministered: '',
    notes: '',
  });

  const [error, setError] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [meRes, nRes, pRes] = await Promise.all([
        fetch('/api/auth/me'),
        fetch('/api/nursing'),
        fetch('/api/patients'),
      ]);

      const meData = await meRes.json();
      setIsReadOnly(meData.subscription?.isReadOnly || false);

      const nData = await nRes.json();
      setRecords(nData.records || []);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const res = await fetch('/api/nursing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newRecord),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al guardar registro de enfermería');

      setShowModal(false);
      setNewRecord({
        patientId: '',
        proceduresDone: '',
        medicationAdministered: '',
        notes: '',
      });
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
            <HeartPulse className="w-6 h-6 text-sky-600" /> Registro de Enfermería
          </h1>
          <p className="text-xs text-slate-500 mt-1">Control de procedimientos, medicamentos administrados y evoluciones</p>
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
          <span>Nuevo Registro</span>
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden text-xs">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-200 font-bold uppercase tracking-wider text-slate-500">
            <tr>
              <th className="p-4">Fecha y Hora</th>
              <th className="p-4">Paciente</th>
              <th className="p-4">Medicamento Administrado</th>
              <th className="p-4">Procedimientos</th>
              <th className="p-4">Enfermero/a</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {records.map((r) => (
              <tr key={r.id} className="hover:bg-slate-50">
                <td className="p-4 text-slate-400 font-mono">{new Date(r.createdAt).toLocaleString()}</td>
                <td className="p-4 font-bold text-slate-900">
                  {r.patient?.firstName} {r.patient?.lastName}
                  <span className="block text-[10px] text-slate-400 font-normal">DNI {r.patient?.documentNumber}</span>
                </td>
                <td className="p-4 text-slate-800 font-semibold">{r.medicationAdministered || 'N/A'}</td>
                <td className="p-4 text-slate-600">{r.proceduresDone || 'N/A'}</td>
                <td className="p-4 text-slate-500">{r.author?.firstName} {r.author?.lastName}</td>
              </tr>
            ))}
            {records.length === 0 && !loading && (
              <tr>
                <td colSpan={5} className="p-8 text-center text-slate-400">No hay registros de enfermería.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold text-slate-900">Nuevo Registro de Enfermería</h3>
            {error && <div className="text-xs text-red-600 bg-red-50 p-2 rounded-xl">{error}</div>}

            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Paciente *</label>
                <select
                  required
                  value={newRecord.patientId}
                  onChange={(e) => setNewRecord({ ...newRecord, patientId: e.target.value })}
                  className="w-full border border-slate-300 rounded-xl p-2.5"
                >
                  <option value="">-- Seleccionar Paciente --</option>
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.firstName} {p.lastName} (DNI {p.documentNumber})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Medicamento Administrado</label>
                <input
                  type="text"
                  placeholder="Ej: Paracetamol 1g EV / Dipirona 1g"
                  value={newRecord.medicationAdministered}
                  onChange={(e) => setNewRecord({ ...newRecord, medicationAdministered: e.target.value })}
                  className="w-full border border-slate-300 rounded-xl p-2.5"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Procedimientos Realizados</label>
                <textarea
                  rows={2}
                  placeholder="Ej: Curación de herida, colocación de vía periférica..."
                  value={newRecord.proceduresDone}
                  onChange={(e) => setNewRecord({ ...newRecord, proceduresDone: e.target.value })}
                  className="w-full border border-slate-300 rounded-xl p-2.5"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-bold">
                  Cancelar
                </button>
                <button type="submit" className="px-4 py-2 bg-sky-600 text-white rounded-xl font-bold">
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
