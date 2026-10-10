'use client';

import { useState, useEffect } from 'react';
import { Bell, Plus, AlertCircle, CheckCircle } from 'lucide-react';

export default function NovedadesPage() {
  const [incidents, setIncidents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isReadOnly, setIsReadOnly] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [newIncident, setNewIncident] = useState({
    title: '',
    description: '',
    category: 'GENERAL',
    priority: 'MEDIUM',
  });

  const [error, setError] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [meRes, incRes] = await Promise.all([
        fetch('/api/auth/me'),
        fetch('/api/incidents'),
      ]);

      const meData = await meRes.json();
      setIsReadOnly(meData.subscription?.isReadOnly || false);

      const incData = await incRes.json();
      setIncidents(incData.incidents || []);
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
      const res = await fetch('/api/incidents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newIncident),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al crear novedad');

      setShowModal(false);
      setNewIncident({ title: '', description: '', category: 'GENERAL', priority: 'MEDIUM' });
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
            <Bell className="w-6 h-6 text-sky-600" /> Novedades e Incidencias Internas
          </h1>
          <p className="text-xs text-slate-500 mt-1">Tablero operativo de avisos, mantenimiento y comunicación interna de la clínica</p>
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
          <span>Nueva Novedad</span>
        </button>
      </div>

      {error && <div className="bg-red-50 text-red-700 p-3.5 rounded-xl text-xs border border-red-200">{error}</div>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {incidents.map((inc) => (
          <div key={inc.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] font-mono uppercase bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-bold">
                  {inc.category}
                </span>
                <h3 className="font-bold text-slate-900 text-sm mt-1">{inc.title}</h3>
              </div>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                  inc.priority === 'CRITICAL'
                    ? 'bg-red-100 text-red-700'
                    : inc.priority === 'HIGH'
                    ? 'bg-amber-100 text-amber-700'
                    : 'bg-slate-100 text-slate-700'
                }`}
              >
                {inc.priority}
              </span>
            </div>

            <p className="text-xs text-slate-600">{inc.description}</p>

            <div className="text-[10px] text-slate-400 border-t border-slate-100 pt-2 flex justify-between">
              <span>Por {inc.author?.firstName} {inc.author?.lastName}</span>
              <span>{new Date(inc.createdAt).toLocaleString()}</span>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold text-slate-900">Registrar Novedad / Incidencia</h3>
            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Título *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Falla en impresora de recepción / Cambio de turno de enfermería"
                  value={newIncident.title}
                  onChange={(e) => setNewIncident({ ...newIncident, title: e.target.value })}
                  className="w-full border border-slate-300 rounded-xl p-2.5 font-bold"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Descripción Detallada *</label>
                <textarea
                  rows={3}
                  required
                  value={newIncident.description}
                  onChange={(e) => setNewIncident({ ...newIncident, description: e.target.value })}
                  className="w-full border border-slate-300 rounded-xl p-2.5"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Categoría</label>
                  <select
                    value={newIncident.category}
                    onChange={(e) => setNewIncident({ ...newIncident, category: e.target.value })}
                    className="w-full border border-slate-300 rounded-xl p-2.5"
                  >
                    <option value="GENERAL">General</option>
                    <option value="EQUIPAMIENTO">Equipamiento</option>
                    <option value="MANTENIMIENTO">Mantenimiento</option>
                    <option value="PERSONAL">Personal</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Prioridad</label>
                  <select
                    value={newIncident.priority}
                    onChange={(e) => setNewIncident({ ...newIncident, priority: e.target.value })}
                    className="w-full border border-slate-300 rounded-xl p-2.5"
                  >
                    <option value="LOW">Baja</option>
                    <option value="MEDIUM">Media</option>
                    <option value="HIGH">Alta</option>
                    <option value="CRITICAL">Crítica</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-bold">
                  Cancelar
                </button>
                <button type="submit" className="px-4 py-2 bg-sky-600 text-white rounded-xl font-bold">
                  Guardar Novedad
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
