'use client';

import { useState, useEffect } from 'react';
import { Stethoscope, Plus, AlertCircle, ShieldAlert, Check } from 'lucide-react';

export default function TriagePage() {
  const [triages, setTriages] = useState<any[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isReadOnly, setIsReadOnly] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [newTriage, setNewTriage] = useState({
    patientId: '',
    priorityLevel: 'GREEN',
    chiefComplaint: '',
    systolicBP: '',
    diastolicBP: '',
    heartRate: '',
    temperature: '',
    oxygenSaturation: '',
    notes: '',
  });

  const [error, setError] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [meRes, triagesRes, patientsRes] = await Promise.all([
        fetch('/api/auth/me'),
        fetch('/api/triage'),
        fetch('/api/patients'),
      ]);

      const meData = await meRes.json();
      setIsReadOnly(meData.subscription?.isReadOnly || false);

      const triagesData = await triagesRes.json();
      setTriages(triagesData.triages || []);

      const patientsData = await patientsRes.json();
      setPatients(patientsData.patients || []);
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
      const res = await fetch('/api/triage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newTriage,
          systolicBP: newTriage.systolicBP ? Number(newTriage.systolicBP) : undefined,
          diastolicBP: newTriage.diastolicBP ? Number(newTriage.diastolicBP) : undefined,
          heartRate: newTriage.heartRate ? Number(newTriage.heartRate) : undefined,
          temperature: newTriage.temperature ? Number(newTriage.temperature) : undefined,
          oxygenSaturation: newTriage.oxygenSaturation ? Number(newTriage.oxygenSaturation) : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al guardar triage');

      setShowModal(false);
      setNewTriage({
        patientId: '',
        priorityLevel: 'GREEN',
        chiefComplaint: '',
        systolicBP: '',
        diastolicBP: '',
        heartRate: '',
        temperature: '',
        oxygenSaturation: '',
        notes: '',
      });
      loadData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'RED':
        return <span className="bg-red-500 text-white font-bold px-2.5 py-1 rounded-lg text-xs">ROJO - Emergencia</span>;
      case 'ORANGE':
        return <span className="bg-orange-500 text-white font-bold px-2.5 py-1 rounded-lg text-xs">NARANJA - Muy Urgente</span>;
      case 'YELLOW':
        return <span className="bg-amber-400 text-slate-950 font-bold px-2.5 py-1 rounded-lg text-xs">AMARILLO - Urgente</span>;
      case 'GREEN':
        return <span className="bg-emerald-500 text-white font-bold px-2.5 py-1 rounded-lg text-xs">VERDE - Estándar</span>;
      default:
        return <span className="bg-blue-500 text-white font-bold px-2.5 py-1 rounded-lg text-xs">AZUL - No Urgente</span>;
    }
  };

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Stethoscope className="w-6 h-6 text-sky-600" /> Triage Confidencial
          </h1>
          <p className="text-xs text-slate-500 mt-1">Categorización clínica de prioridad y signos vitales asistenciales</p>
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
          <span>Nuevo Triage</span>
        </button>
      </div>

      {/* Grid list of Triages */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {triages.map((t) => (
          <div key={t.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">{t.patient?.firstName} {t.patient?.lastName}</h3>
                <span className="text-xs text-slate-400 font-mono">DNI: {t.patient?.documentNumber}</span>
              </div>
              {getPriorityBadge(t.priorityLevel)}
            </div>

            <div className="text-xs text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-1">
              <span className="font-semibold text-slate-900 block">Motivo: {t.chiefComplaint}</span>
              <div className="flex flex-wrap gap-3 text-[11px] text-slate-600 pt-1">
                {t.systolicBP && <span>PA: <strong>{t.systolicBP}/{t.diastolicBP} mmHg</strong></span>}
                {t.heartRate && <span>FC: <strong>{t.heartRate} bpm</strong></span>}
                {t.temperature && <span>Temp: <strong>{t.temperature} °C</strong></span>}
                {t.oxygenSaturation && <span>SatO2: <strong>{t.oxygenSaturation} %</strong></span>}
              </div>
            </div>

            <div className="text-[10px] text-slate-400 text-right">
              Registrado por {t.author?.firstName} {t.author?.lastName} — {new Date(t.createdAt).toLocaleString()}
            </div>
          </div>
        ))}
      </div>

      {/* Modal Nuevo Triage */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold text-slate-900">Registrar Triage Confidencial</h3>
            {error && <div className="text-xs text-red-600 bg-red-50 p-2.5 rounded-xl border border-red-200">{error}</div>}

            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Seleccionar Paciente *</label>
                <select
                  required
                  value={newTriage.patientId}
                  onChange={(e) => setNewTriage({ ...newTriage, patientId: e.target.value })}
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
                <label className="block font-semibold text-slate-700 mb-1">Nivel de Prioridad Clínica</label>
                <select
                  value={newTriage.priorityLevel}
                  onChange={(e) => setNewTriage({ ...newTriage, priorityLevel: e.target.value })}
                  className="w-full border border-slate-300 rounded-xl p-2.5 font-bold"
                >
                  <option value="RED">🔴 ROJO - Emergencia (Atención Inmediata)</option>
                  <option value="ORANGE">🟠 NARANJA - Muy Urgente (hasta 15 min)</option>
                  <option value="YELLOW">🟡 AMARILLO - Urgente (hasta 30 min)</option>
                  <option value="GREEN">🟢 VERDE - Estándar (hasta 60 min)</option>
                  <option value="BLUE">🔵 AZUL - No Urgente (hasta 120 min)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Motivo Principal de Consulta *</label>
                <input
                  type="text"
                  required
                  value={newTriage.chiefComplaint}
                  onChange={(e) => setNewTriage({ ...newTriage, chiefComplaint: e.target.value })}
                  placeholder="Ej: Dolor torácico opresivo, disnea..."
                  className="w-full border border-slate-300 rounded-xl p-2.5"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Presión Sistólica / Diastólica</label>
                  <div className="flex gap-1">
                    <input
                      type="number"
                      placeholder="120"
                      value={newTriage.systolicBP}
                      onChange={(e) => setNewTriage({ ...newTriage, systolicBP: e.target.value })}
                      className="w-full border border-slate-300 rounded-xl p-2"
                    />
                    <input
                      type="number"
                      placeholder="80"
                      value={newTriage.diastolicBP}
                      onChange={(e) => setNewTriage({ ...newTriage, diastolicBP: e.target.value })}
                      className="w-full border border-slate-300 rounded-xl p-2"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Temp (°C) / SatO2 (%)</label>
                  <div className="flex gap-1">
                    <input
                      type="number"
                      step="0.1"
                      placeholder="36.5"
                      value={newTriage.temperature}
                      onChange={(e) => setNewTriage({ ...newTriage, temperature: e.target.value })}
                      className="w-full border border-slate-300 rounded-xl p-2"
                    />
                    <input
                      type="number"
                      placeholder="98"
                      value={newTriage.oxygenSaturation}
                      onChange={(e) => setNewTriage({ ...newTriage, oxygenSaturation: e.target.value })}
                      className="w-full border border-slate-300 rounded-xl p-2"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-bold">
                  Cancelar
                </button>
                <button type="submit" className="px-4 py-2 bg-sky-600 text-white rounded-xl font-bold">
                  Guardar Triage
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
