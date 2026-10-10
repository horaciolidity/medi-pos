'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Clock, Ticket, Monitor, Plus, Volume2, CheckCircle2, ShieldAlert, AlertCircle, Printer } from 'lucide-react';

export default function TurnosPage() {
  const [turnos, setTurnos] = useState<any[]>([]);
  const [boxes, setBoxes] = useState<any[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [subscription, setSubscription] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Ticket Modal & Thermal Print Preview
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [ticketPrefix, setTicketPrefix] = useState('A');
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [printedTicket, setPrintedTicket] = useState<any>(null);

  // Calling Box Modal
  const [callingTurno, setCallingTurno] = useState<any>(null);
  const [selectedBoxId, setSelectedBoxId] = useState('');

  const [error, setError] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [meRes, turnosRes, patientsRes] = await Promise.all([
        fetch('/api/auth/me'),
        fetch('/api/turnos'),
        fetch('/api/patients'),
      ]);

      const meData = await meRes.json();
      setUser(meData.user);
      setSubscription(meData.subscription);

      const turnosData = await turnosRes.json();
      setTurnos(turnosData.turnos || []);
      setBoxes(turnosData.boxes || []);

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

  const handleGenerateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const res = await fetch('/api/turnos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prefix: ticketPrefix,
          patientId: selectedPatientId || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al generar ticket');

      setPrintedTicket(data.ticketPrintData);
      loadData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleCallBox = async () => {
    if (!callingTurno || !selectedBoxId) return;
    setError('');

    try {
      const res = await fetch('/api/turnos', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          turnoId: callingTurno.id,
          boxId: selectedBoxId,
          status: 'CALLED',
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al llamar a consultorio');

      setCallingTurno(null);
      setSelectedBoxId('');
      loadData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const isReadOnly = subscription?.isReadOnly;
  const isPro = subscription?.isProTurneroEnabled;

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Clock className="w-6 h-6 text-sky-600" /> Recepción & Turnero Avanzado
          </h1>
          <p className="text-xs text-slate-500 mt-1">Generación de tickets térmicos y llamado a consultorios/boxes en tiempo real</p>
        </div>

        <div className="flex items-center gap-3">
          {user?.branchId && (
            <Link
              href={`/display/${user.branchId}`}
              target="_blank"
              className="bg-purple-600 hover:bg-purple-500 text-white font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-purple-600/20"
            >
              <Monitor className="w-4 h-4" />
              <span>Abrir Pantalla Pública</span>
            </Link>
          )}

          <button
            onClick={() => {
              if (isReadOnly) {
                alert('Acción bloqueada: Su suscripción está vencida (Modo Solo Lectura).');
                return;
              }
              setPrintedTicket(null);
              setShowTicketModal(true);
            }}
            disabled={isReadOnly}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all ${
              isReadOnly ? 'bg-slate-300 text-slate-500 cursor-not-allowed' : 'bg-sky-600 hover:bg-sky-500 text-white shadow-lg'
            }`}
          >
            <Ticket className="w-4 h-4" />
            <span>Nuevo Ticket</span>
          </button>
        </div>
      </div>

      {/* Notice Plan Standard vs Pro */}
      {!isPro && (
        <div className="bg-sky-50 border border-sky-200 p-4 rounded-2xl text-xs text-sky-900 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Ticket className="w-5 h-5 text-sky-600 shrink-0" />
            <span>
              Actualmente posee el <strong>Plan Estándar</strong>. La recepción básica puede generar tickets, pero el llamado a boxes en tiempo real y la pantalla pública requieren el <strong>Plan Pro</strong>.
            </span>
          </div>
        </div>
      )}

      {error && <div className="bg-red-50 text-red-700 p-3.5 rounded-xl text-xs border border-red-200">{error}</div>}

      {/* Grid of Turnos in Queue */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden text-xs">
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
          <h3 className="font-bold text-slate-900">Cola de Turnos del Día</h3>
          <span className="text-[11px] font-semibold text-slate-500">{turnos.length} Turnos Registrados</span>
        </div>

        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-200 font-bold uppercase tracking-wider text-slate-500">
            <tr>
              <th className="p-4">Ticket</th>
              <th className="p-4">Estado</th>
              <th className="p-4">Paciente</th>
              <th className="p-4">Consultorio / Box</th>
              <th className="p-4 text-right">Llamar / Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {turnos.map((t) => (
              <tr key={t.id} className="hover:bg-slate-50">
                <td className="p-4 font-black text-sm text-sky-600 font-mono">{t.ticketNumber}</td>
                <td className="p-4">
                  {t.status === 'WAITING' && <span className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded font-bold">En Espera</span>}
                  {t.status === 'CALLED' && <span className="bg-purple-100 text-purple-800 px-2 py-0.5 rounded font-bold animate-pulse">LLAMADO</span>}
                  {t.status === 'IN_ATTENTION' && <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-bold">En Atención</span>}
                  {t.status === 'COMPLETED' && <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded">Finalizado</span>}
                </td>
                <td className="p-4 font-semibold text-slate-800">
                  {t.patient ? `${t.patient.firstName} ${t.patient.lastName}` : 'Anónimo / Consulta'}
                </td>
                <td className="p-4 font-mono text-slate-600">{t.box?.name || 'Recepción'}</td>
                <td className="p-4 text-right">
                  {!isReadOnly && t.status === 'WAITING' && (
                    <button
                      onClick={() => {
                        if (!isPro) {
                          alert('El llamado desde boxes en tiempo real es exclusivo del Plan Pro.');
                          return;
                        }
                        setCallingTurno(t);
                      }}
                      className="bg-purple-50 text-purple-700 hover:bg-purple-600 hover:text-white px-3 py-1.5 rounded-lg font-bold text-xs transition-colors flex items-center gap-1 ml-auto"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                      <span>Llamar a Box</span>
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {turnos.length === 0 && !loading && (
              <tr>
                <td colSpan={5} className="p-8 text-center text-slate-400">No hay turnos registrados en la cola.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Nuevo Ticket & Imprimir */}
      {showTicketModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold text-slate-900">Generar Ticket de Turno</h3>

            {!printedTicket ? (
              <form onSubmit={handleGenerateTicket} className="space-y-3 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Prefijo / Cola</label>
                  <select
                    value={ticketPrefix}
                    onChange={(e) => setTicketPrefix(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl p-2.5 font-bold"
                  >
                    <option value="A">Cola A - Guardia General</option>
                    <option value="B">Cola B - Especialidades / Turno Programado</option>
                    <option value="C">Cola C - Laboratorio / Insumos</option>
                    <option value="P">Cola P - Prioridad / Embarazadas / Mayores</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Asociar Paciente (Opcional)</label>
                  <select
                    value={selectedPatientId}
                    onChange={(e) => setSelectedPatientId(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl p-2.5"
                  >
                    <option value="">-- Sin paciente asignado --</option>
                    {patients.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.firstName} {p.lastName} ({p.documentNumber})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button type="button" onClick={() => setShowTicketModal(false)} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-bold">
                    Cancelar
                  </button>
                  <button type="submit" className="px-4 py-2 bg-sky-600 text-white rounded-xl font-bold">
                    Imprimir Ticket
                  </button>
                </div>
              </form>
            ) : (
              /* Thermal Ticket Preview */
              <div className="space-y-4">
                <div className="bg-amber-50 border-2 border-dashed border-amber-300 p-6 rounded-2xl text-center space-y-2 font-mono text-slate-900 shadow-inner">
                  <span className="text-xs font-bold uppercase tracking-widest text-slate-500 block">
                    {user?.company?.name || 'Centro Médico'}
                  </span>
                  <div className="text-4xl font-black text-slate-950 py-2 border-y border-amber-200">
                    {printedTicket.ticketNumber}
                  </div>
                  <div className="text-[11px] text-slate-600">
                    <div>Sector: {printedTicket.sector}</div>
                    <div>{printedTicket.date}</div>
                  </div>
                  <p className="text-[10px] text-slate-500 pt-2">{printedTicket.instructions}</p>
                </div>

                <div className="flex justify-between gap-2">
                  <button
                    onClick={() => {
                      window.print();
                    }}
                    className="bg-slate-900 text-white hover:bg-slate-800 px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2"
                  >
                    <Printer className="w-4 h-4" /> Imprimir Térmica
                  </button>

                  <button
                    onClick={() => setShowTicketModal(false)}
                    className="bg-sky-600 text-white px-4 py-2.5 rounded-xl text-xs font-bold"
                  >
                    Listo
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal Llamar a Box */}
      {callingTurno && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-slate-900">
              Llamar Ticket <span className="text-sky-600 font-mono">{callingTurno.ticketNumber}</span>
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Seleccionar Consultorio / Box</label>
                <select
                  value={selectedBoxId}
                  onChange={(e) => setSelectedBoxId(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl p-2.5 font-bold"
                >
                  <option value="">-- Seleccionar Box --</option>
                  {boxes.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({b.code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button onClick={() => setCallingTurno(null)} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-bold">
                  Cancelar
                </button>
                <button onClick={handleCallBox} className="px-4 py-2 bg-purple-600 text-white rounded-xl font-bold">
                  Emitir Llamado
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
