'use client';

import { useState, useEffect } from 'react';
import { Users, Plus, Search, FileText, AlertCircle, ShieldAlert, Check, Clock, Edit3 } from 'lucide-react';

export default function PacientesPage() {
  const [patients, setPatients] = useState<any[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [isReadOnly, setIsReadOnly] = useState(false);

  // Modal Alta Paciente
  const [showNewModal, setShowNewModal] = useState(false);
  const [newPatient, setNewPatient] = useState({
    documentType: 'DNI',
    documentNumber: '',
    firstName: '',
    lastName: '',
    gender: 'M',
    birthDate: '',
    phone: '',
    email: '',
    address: '',
    medicalInsuranceName: '',
    affiliateNumber: '',
    notes: '',
  });

  // Modal Historia Clínica
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [ehrRecords, setEhrRecords] = useState<any[]>([]);
  const [showEhrModal, setShowEhrModal] = useState(false);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [newEhr, setNewEhr] = useState({
    reasonForVisit: '',
    symptoms: '',
    diagnosis: '',
    treatmentPlan: '',
    prescribedMedication: '',
    authorId: '',
  });

  // Amendment State
  const [amendingRecordId, setAmendingRecordId] = useState<string | null>(null);
  const [amendmentReason, setAmendmentReason] = useState('');
  const [amendmentContent, setAmendmentContent] = useState('');

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const loadDoctors = async () => {
    try {
      const res = await fetch('/api/staff?area=MEDICO');
      const data = await res.json();
      setDoctors(data.staff || []);
    } catch (e) {
      console.error(e);
    }
  };

  const loadPatients = async () => {
    setLoading(true);
    try {
      const meRes = await fetch('/api/auth/me');
      const meData = await meRes.json();
      setIsReadOnly(meData.subscription?.isReadOnly || false);

      const res = await fetch(`/api/patients?query=${encodeURIComponent(query)}`);
      const data = await res.json();
      setPatients(data.patients || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPatients();
    loadDoctors();
  }, [query]);

  const handleCreatePatient = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const res = await fetch('/api/patients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPatient),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al guardar paciente');

      setSuccess('Paciente registrado correctamente.');
      setShowNewModal(false);
      setNewPatient({
        documentType: 'DNI',
        documentNumber: '',
        firstName: '',
        lastName: '',
        gender: 'M',
        birthDate: '',
        phone: '',
        email: '',
        address: '',
        medicalInsuranceName: '',
        affiliateNumber: '',
        notes: '',
      });
      loadPatients();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const openEHR = async (patient: any) => {
    setSelectedPatient(patient);
    setShowEhrModal(true);
    try {
      const res = await fetch(`/api/patients/${patient.id}/ehr`);
      const data = await res.json();
      setEhrRecords(data.records || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateEHR = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatient) return;
    setError('');

    try {
      const res = await fetch(`/api/patients/${selectedPatient.id}/ehr`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newEhr),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al guardar evolución clínica');

      setNewEhr({
        reasonForVisit: '',
        symptoms: '',
        diagnosis: '',
        treatmentPlan: '',
        prescribedMedication: '',
        authorId: '',
      });
      openEHR(selectedPatient);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleAddAmendment = async (recordId: string) => {
    if (!amendmentReason || !amendmentContent) return;
    setError('');

    try {
      const res = await fetch(`/api/patients/${selectedPatient.id}/ehr/amend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ehrRecordId: recordId,
          amendmentReason,
          content: amendmentContent,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al guardar enmienda');

      setAmendingRecordId(null);
      setAmendmentReason('');
      setAmendmentContent('');
      openEHR(selectedPatient);
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Users className="w-6 h-6 text-sky-600" /> Registro de Pacientes e Historia Clínica
          </h1>
          <p className="text-xs text-slate-500 mt-1">Gestión de datos filiatorios y evoluciones clínicas longitudinales</p>
        </div>

        <button
          onClick={() => {
            if (isReadOnly) {
              alert('Acción bloqueada: Su suscripción está vencida (Modo Solo Lectura).');
              return;
            }
            setShowNewModal(true);
          }}
          disabled={isReadOnly}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all ${
            isReadOnly
              ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
              : 'bg-sky-600 hover:bg-sky-500 text-white shadow-lg shadow-sky-600/20'
          }`}
        >
          <Plus className="w-4 h-4" />
          <span>Nuevo Paciente</span>
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-2xl text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
        <Search className="w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar por Nombre, Apellido o Número de DNI..."
          className="w-full text-xs text-slate-800 placeholder-slate-400 focus:outline-none"
        />
      </div>

      {/* Patient Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left text-xs text-slate-700">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-bold tracking-wider">
            <tr>
              <th className="p-4">Documento</th>
              <th className="p-4">Nombre y Apellido</th>
              <th className="p-4">Teléfono / Email</th>
              <th className="p-4">Obra Social / Prepaga</th>
              <th className="p-4 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {patients.map((p) => (
              <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                <td className="p-4 font-mono font-semibold text-slate-900">
                  {p.documentType} {p.documentNumber}
                </td>
                <td className="p-4 font-bold text-slate-900">
                  {p.firstName} {p.lastName}
                </td>
                <td className="p-4 text-slate-500">
                  <div>{p.phone || 'Sin teléfono'}</div>
                  <div className="text-[10px] text-slate-400">{p.email}</div>
                </td>
                <td className="p-4 text-slate-600">
                  <span className="bg-slate-100 border border-slate-200 px-2 py-0.5 rounded text-[11px] font-medium">
                    {p.medicalInsuranceName || 'Particular'}
                  </span>
                  {p.affiliateNumber && <span className="block text-[10px] text-slate-400 mt-0.5">Nº {p.affiliateNumber}</span>}
                </td>
                <td className="p-4 text-right">
                  <button
                    onClick={() => openEHR(p)}
                    className="bg-sky-50 text-sky-700 hover:bg-sky-600 hover:text-white px-3 py-1.5 rounded-lg font-bold text-xs transition-colors flex items-center gap-1.5 ml-auto"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Historia Clínica</span>
                  </button>
                </td>
              </tr>
            ))}

            {patients.length === 0 && !loading && (
              <tr>
                <td colSpan={5} className="p-8 text-center text-slate-400">
                  No se encontraron pacientes registrados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Nuevo Paciente */}
      {showNewModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold text-slate-900">Alta de Nuevo Paciente</h3>
            <form onSubmit={handleCreatePatient} className="space-y-4 text-xs">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Tipo</label>
                  <select
                    value={newPatient.documentType}
                    onChange={(e) => setNewPatient({ ...newPatient, documentType: e.target.value })}
                    className="w-full border border-slate-300 rounded-xl p-2"
                  >
                    <option value="DNI">DNI</option>
                    <option value="PASAPORTE">Pasaporte</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-slate-600 font-semibold mb-1">Número de Documento *</label>
                  <input
                    type="text"
                    required
                    value={newPatient.documentNumber}
                    onChange={(e) => setNewPatient({ ...newPatient, documentNumber: e.target.value })}
                    placeholder="35123456"
                    className="w-full border border-slate-300 rounded-xl p-2"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Nombre *</label>
                  <input
                    type="text"
                    required
                    value={newPatient.firstName}
                    onChange={(e) => setNewPatient({ ...newPatient, firstName: e.target.value })}
                    className="w-full border border-slate-300 rounded-xl p-2"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Apellido *</label>
                  <input
                    type="text"
                    required
                    value={newPatient.lastName}
                    onChange={(e) => setNewPatient({ ...newPatient, lastName: e.target.value })}
                    className="w-full border border-slate-300 rounded-xl p-2"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Obra Social / Prepaga</label>
                  <input
                    type="text"
                    value={newPatient.medicalInsuranceName}
                    onChange={(e) => setNewPatient({ ...newPatient, medicalInsuranceName: e.target.value })}
                    placeholder="Ej: OSDE, Swiss Medical"
                    className="w-full border border-slate-300 rounded-xl p-2"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Número de Afiliado</label>
                  <input
                    type="text"
                    value={newPatient.affiliateNumber}
                    onChange={(e) => setNewPatient({ ...newPatient, affiliateNumber: e.target.value })}
                    className="w-full border border-slate-300 rounded-xl p-2"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold"
                >
                  Cancelar
                </button>
                <button type="submit" className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl font-bold">
                  Guardar Paciente
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal / Drawer Historia Clínica */}
      {showEhrModal && selectedPatient && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-end">
          <div className="bg-white w-full max-w-3xl h-full p-6 space-y-6 overflow-y-auto shadow-2xl flex flex-col justify-between">
            <div className="space-y-6">
              {/* Header Drawer */}
              <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                <div>
                  <h3 className="text-lg font-black text-slate-900">
                    Historia Clínica: {selectedPatient.firstName} {selectedPatient.lastName}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Documento: {selectedPatient.documentType} {selectedPatient.documentNumber} — Obra Social: {selectedPatient.medicalInsuranceName || 'Particular'}
                  </p>
                </div>
                <button
                  onClick={() => setShowEhrModal(false)}
                  className="text-slate-400 hover:text-slate-600 font-bold text-sm bg-slate-100 p-2 rounded-xl"
                >
                  Cerrar
                </button>
              </div>

              {/* Formular Nueva Evolución */}
              {!isReadOnly ? (
                <form onSubmit={handleCreateEHR} className="bg-slate-50 border border-slate-200 p-4 rounded-2xl space-y-3 text-xs">
                  <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
                    <Plus className="w-4 h-4 text-sky-600" /> Nueva Evolución Médica
                  </h4>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Motivo de Consulta *</label>
                      <input
                        type="text"
                        required
                        value={newEhr.reasonForVisit}
                        onChange={(e) => setNewEhr({ ...newEhr, reasonForVisit: e.target.value })}
                        className="w-full border border-slate-300 rounded-xl p-2"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Diagnóstico *</label>
                      <input
                        type="text"
                        required
                        value={newEhr.diagnosis}
                        onChange={(e) => setNewEhr({ ...newEhr, diagnosis: e.target.value })}
                        className="w-full border border-slate-300 rounded-xl p-2"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Médico / Profesional Actuante (Opcional - Horario / Turno)
                    </label>
                    <select
                      value={newEhr.authorId}
                      onChange={(e) => setNewEhr({ ...newEhr, authorId: e.target.value })}
                      className="w-full border border-slate-300 rounded-xl p-2 bg-white text-xs"
                    >
                      <option value="">-- Sin asignar / Usar usuario en sesión --</option>
                      {doctors.map((d) => (
                        <option key={d.id} value={d.id}>
                          Dr./Dra. {d.firstName} {d.lastName} {d.matricula ? `(Mat: ${d.matricula})` : ''} - {d.specialty || 'General'} {d.shiftHours ? `[Turno: ${d.shiftHours}]` : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Indicaciones / Tratamiento</label>
                    <textarea
                      rows={2}
                      value={newEhr.treatmentPlan}
                      onChange={(e) => setNewEhr({ ...newEhr, treatmentPlan: e.target.value })}
                      className="w-full border border-slate-300 rounded-xl p-2"
                    />
                  </div>

                  <button type="submit" className="bg-sky-600 hover:bg-sky-500 text-white font-bold px-4 py-2 rounded-xl text-xs">
                    Registrar Evolución
                  </button>
                </form>
              ) : (
                <div className="bg-amber-50 border border-amber-300 p-3.5 rounded-xl text-xs text-amber-900 flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-amber-600" />
                  <span>Modo Solo Lectura: La registración de nuevas evoluciones está deshabilitada por vencimiento.</span>
                </div>
              )}

              {/* Timeline Longitudinal Records */}
              <div className="space-y-4">
                <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">Historial de Evoluciones</h4>

                {ehrRecords.map((r) => (
                  <div key={r.id} className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm space-y-3 text-xs">
                    <div className="flex justify-between items-start border-b border-slate-100 pb-2">
                      <div>
                        <span className="font-bold text-slate-900 text-sm block">{r.diagnosis}</span>
                        <span className="text-[11px] text-slate-500">Motivo: {r.reasonForVisit}</span>
                      </div>
                      <div className="text-right text-[10px] text-slate-400">
                        <div>{new Date(r.createdAt).toLocaleString()}</div>
                        <div className="font-semibold text-slate-700 flex items-center justify-end gap-1 mt-0.5">
                          <span>Dr./Dra. {r.author?.firstName} {r.author?.lastName}</span>
                          {r.author?.matricula && (
                            <span className="bg-sky-100 text-sky-700 px-1.5 py-0.2 rounded font-mono text-[9px]">
                              Mat: {r.author.matricula}
                            </span>
                          )}
                        </div>
                        {r.author?.shiftHours && (
                          <div className="text-[9px] text-sky-600 font-medium">Turno: {r.author.shiftHours}</div>
                        )}
                      </div>
                    </div>

                    {r.treatmentPlan && (
                      <div>
                        <span className="font-semibold text-slate-700">Tratamiento:</span>
                        <p className="text-slate-600 bg-slate-50 p-2 rounded-lg mt-1">{r.treatmentPlan}</p>
                      </div>
                    )}

                    {/* Amendments List */}
                    {r.amendments && r.amendments.length > 0 && (
                      <div className="bg-amber-50/70 border border-amber-200 p-3 rounded-xl space-y-2">
                        <span className="font-bold text-amber-900 text-[11px] flex items-center gap-1">
                          <Edit3 className="w-3.5 h-3.5" /> Enmiendas Auditadas ({r.amendments.length})
                        </span>
                        {r.amendments.map((a: any) => (
                          <div key={a.id} className="text-[11px] text-amber-950 border-l-2 border-amber-400 pl-2 space-y-0.5">
                            <div className="font-semibold">Motivo: {a.amendmentReason}</div>
                            <div>{a.content}</div>
                            <div className="text-[9px] text-amber-700">Por {a.author?.firstName} {a.author?.lastName} - {new Date(a.createdAt).toLocaleString()}</div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Add Amendment Action */}
                    {!isReadOnly && (
                      <div>
                        {amendingRecordId === r.id ? (
                          <div className="bg-slate-50 p-3 rounded-xl border space-y-2">
                            <input
                              type="text"
                              placeholder="Motivo de la corrección..."
                              value={amendmentReason}
                              onChange={(e) => setAmendmentReason(e.target.value)}
                              className="w-full border p-1.5 rounded-lg text-xs"
                            />
                            <textarea
                              placeholder="Detalle de la enmienda..."
                              value={amendmentContent}
                              onChange={(e) => setAmendmentContent(e.target.value)}
                              className="w-full border p-1.5 rounded-lg text-xs"
                            />
                            <div className="flex gap-2">
                              <button onClick={() => handleAddAmendment(r.id)} className="bg-emerald-600 text-white px-3 py-1 rounded-lg font-bold">
                                Guardar Enmienda
                              </button>
                              <button onClick={() => setAmendingRecordId(null)} className="bg-slate-200 text-slate-700 px-3 py-1 rounded-lg">
                                Cancelar
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => setAmendingRecordId(r.id)}
                            className="text-[11px] text-sky-600 hover:underline font-semibold flex items-center gap-1"
                          >
                            <Edit3 className="w-3 h-3" /> Agregar Enmienda Trazable
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                ))}

                {ehrRecords.length === 0 && (
                  <p className="text-center text-slate-400 text-xs py-4">No hay evoluciones anteriores asociadas.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
