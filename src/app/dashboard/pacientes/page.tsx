'use client';

import { useState, useEffect } from 'react';
import {
  Users, Plus, Search, FileText, AlertCircle, ShieldAlert,
  Edit3, Edit2, Stethoscope, HeartPulse, Phone, Mail,
  User as UserIcon, MapPin, Droplet, ChevronDown, ChevronUp,
  Save, X, Clock
} from 'lucide-react';

// ────────────────────────────────────────────────
// TIPOS Y HELPERS
// ────────────────────────────────────────────────
const emptyPatient = {
  documentType: 'DNI',
  documentNumber: '',
  firstName: '',
  lastName: '',
  gender: 'M',
  birthDate: '',
  phone: '',
  email: '',
  address: '',
  bloodType: '',
  emergencyContactName: '',
  emergencyContactPhone: '',
  medicalInsuranceName: '',
  affiliateNumber: '',
  notes: '',
};

const emptyEhr = {
  reasonForVisit: '',
  symptoms: '',
  diagnosis: '',
  treatmentPlan: '',
  prescribedMedication: '',
  observations: '',
  authorId: '',
};

// ────────────────────────────────────────────────
// COMPONENTE PRINCIPAL
// ────────────────────────────────────────────────
export default function PacientesPage() {
  const [user, setUser] = useState<any>(null);
  const [patients, setPatients] = useState<any[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [isReadOnly, setIsReadOnly] = useState(false);

  // Modales de paciente
  const [showNewModal, setShowNewModal]     = useState(false);
  const [showEditModal, setShowEditModal]   = useState(false);
  const [editingPatient, setEditingPatient] = useState<any>(null);
  const [patientForm, setPatientForm]       = useState({ ...emptyPatient });

  // Historia Clínica (médico)
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [ehrRecords, setEhrRecords]           = useState<any[]>([]);
  const [showEhrModal, setShowEhrModal]       = useState(false);
  const [newEhr, setNewEhr]                   = useState({ ...emptyEhr });
  const [doctors, setDoctors]                 = useState<any[]>([]);

  // Enmiendas
  const [amendingRecordId, setAmendingRecordId] = useState<string | null>(null);
  const [amendmentReason, setAmendmentReason]   = useState('');
  const [amendmentContent, setAmendmentContent] = useState('');

  // Enfermería rápida desde pacientes
  const [showNursingModal, setShowNursingModal]   = useState(false);
  const [nursingPatient, setNursingPatient]       = useState<any>(null);
  const [nurses, setNurses]                       = useState<any[]>([]);
  const [nursingForm, setNursingForm]             = useState({
    authorId: '',
    proceduresDone: '',
    medicationAdministered: '',
    notes: '',
    vitalSigns: { bloodPressure: '', heartRate: '', temperature: '', oxygenSaturation: '', weight: '' },
  });

  const [error, setError]     = useState('');
  const [success, setSuccess] = useState('');

  // ── Carga inicial ──────────────────────────────
  const loadAll = async () => {
    setLoading(true);
    try {
      const meRes  = await fetch('/api/auth/me');
      const meData = await meRes.json();
      if (meRes.ok) {
        setUser(meData.user);
        setIsReadOnly(meData.subscription?.isReadOnly || false);
      }

      const res  = await fetch(`/api/patients?query=${encodeURIComponent(query)}`);
      const data = await res.json();
      setPatients(data.patients || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const loadDoctors = async () => {
    try {
      const r = await fetch('/api/staff?area=MEDICO');
      const d = await r.json();
      setDoctors(d.staff || []);
    } catch {}
  };

  const loadNurses = async () => {
    try {
      const r = await fetch('/api/staff?area=ENFERMERIA');
      const d = await r.json();
      setNurses(d.staff || []);
    } catch {}
  };

  useEffect(() => { loadAll(); loadDoctors(); loadNurses(); }, [query]);

  // ── Crear paciente ────────────────────────────
  const handleCreatePatient = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setSuccess('');
    try {
      const res  = await fetch('/api/patients', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(patientForm) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al guardar paciente');
      setSuccess('Paciente registrado correctamente.');
      setShowNewModal(false);
      setPatientForm({ ...emptyPatient });
      loadAll();
    } catch (err: any) { setError(err.message); }
  };

  // ── Editar paciente ───────────────────────────
  const openEditModal = (p: any) => {
    setEditingPatient(p);
    setPatientForm({
      documentType: p.documentType || 'DNI',
      documentNumber: p.documentNumber || '',
      firstName: p.firstName || '',
      lastName: p.lastName || '',
      gender: p.gender || 'M',
      birthDate: p.birthDate ? p.birthDate.split('T')[0] : '',
      phone: p.phone || '',
      email: p.email || '',
      address: p.address || '',
      bloodType: p.bloodType || '',
      emergencyContactName: p.emergencyContactName || '',
      emergencyContactPhone: p.emergencyContactPhone || '',
      medicalInsuranceName: p.medicalInsuranceName || '',
      affiliateNumber: p.affiliateNumber || '',
      notes: p.notes || '',
    });
    setShowEditModal(true);
  };

  const handleUpdatePatient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPatient) return;
    setError(''); setSuccess('');
    try {
      const res  = await fetch(`/api/patients/${editingPatient.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(patientForm) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al actualizar paciente');
      setSuccess('Datos del paciente actualizados.');
      setShowEditModal(false);
      setEditingPatient(null);
      loadAll();
    } catch (err: any) { setError(err.message); }
  };

  // ── Historia Clínica (EHR) ────────────────────
  const openEHR = async (patient: any) => {
    setSelectedPatient(patient);
    setShowEhrModal(true);
    try {
      const res  = await fetch(`/api/patients/${patient.id}/ehr`);
      const data = await res.json();
      setEhrRecords(data.records || []);
    } catch (err) { console.error(err); }
  };

  const handleCreateEHR = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatient) return;
    setError('');
    try {
      const res  = await fetch(`/api/patients/${selectedPatient.id}/ehr`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newEhr) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al guardar evolución clínica');
      setNewEhr({ ...emptyEhr });
      openEHR(selectedPatient);
    } catch (err: any) { setError(err.message); }
  };

  const handleAddAmendment = async (recordId: string) => {
    if (!amendmentReason || !amendmentContent) return;
    setError('');
    try {
      const res  = await fetch(`/api/patients/${selectedPatient.id}/ehr/amend`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ehrRecordId: recordId, amendmentReason, content: amendmentContent }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al guardar enmienda');
      setAmendingRecordId(null);
      setAmendmentReason('');
      setAmendmentContent('');
      openEHR(selectedPatient);
    } catch (err: any) { setError(err.message); }
  };

  // ── Enfermería rápida ─────────────────────────
  const openNursing = (patient: any) => {
    setNursingPatient(patient);
    setNursingForm({ authorId: '', proceduresDone: '', medicationAdministered: '', notes: '', vitalSigns: { bloodPressure: '', heartRate: '', temperature: '', oxygenSaturation: '', weight: '' } });
    setShowNursingModal(true);
  };

  const handleSaveNursing = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nursingPatient) return;
    setError('');
    try {
      const payload = { patientId: nursingPatient.id, ...nursingForm };
      const res  = await fetch('/api/nursing', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al guardar registro de enfermería');
      setShowNursingModal(false);
      setSuccess('Registro de enfermería guardado.');
    } catch (err: any) { setError(err.message); }
  };

  // ── Roles ────────────────────────────────────
  const role       = user?.role || '';
  const isDoctor   = role === 'MEDICO' || role === 'ADMIN' || role === 'SUPER_ADMIN';
  const isNurse    = role === 'ENFERMERIA' || role === 'ADMIN' || role === 'SUPER_ADMIN';
  const isReception = role === 'RECEPCION' || role === 'ADMIN' || role === 'SUPER_ADMIN';

  // ── Formulario paciente (reutilizable) ────────
  const PatientForm = ({ onSubmit, title, submitLabel }: { onSubmit: (e: React.FormEvent) => void; title: string; submitLabel: string }) => (
    <form onSubmit={onSubmit} className="space-y-4 text-xs">
      <h3 className="text-base font-black text-slate-900">{title}</h3>

      {/* Documento */}
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="block text-slate-600 font-semibold mb-1">Tipo Doc.</label>
          <select value={patientForm.documentType} onChange={(e) => setPatientForm({ ...patientForm, documentType: e.target.value })} className="w-full border border-slate-300 rounded-xl p-2">
            <option value="DNI">DNI</option>
            <option value="PASAPORTE">Pasaporte</option>
            <option value="CI">Cédula</option>
          </select>
        </div>
        <div className="col-span-2">
          <label className="block text-slate-600 font-semibold mb-1">Número de Documento *</label>
          <input type="text" required value={patientForm.documentNumber} onChange={(e) => setPatientForm({ ...patientForm, documentNumber: e.target.value })} placeholder="35123456" className="w-full border border-slate-300 rounded-xl p-2" disabled={!!editingPatient} />
        </div>
      </div>

      {/* Nombre Apellido */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-slate-600 font-semibold mb-1">Nombre *</label>
          <input type="text" required value={patientForm.firstName} onChange={(e) => setPatientForm({ ...patientForm, firstName: e.target.value })} className="w-full border border-slate-300 rounded-xl p-2" />
        </div>
        <div>
          <label className="block text-slate-600 font-semibold mb-1">Apellido *</label>
          <input type="text" required value={patientForm.lastName} onChange={(e) => setPatientForm({ ...patientForm, lastName: e.target.value })} className="w-full border border-slate-300 rounded-xl p-2" />
        </div>
      </div>

      {/* Género / Fecha Nac / Grupo Sanguíneo */}
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="block text-slate-600 font-semibold mb-1">Sexo</label>
          <select value={patientForm.gender} onChange={(e) => setPatientForm({ ...patientForm, gender: e.target.value })} className="w-full border border-slate-300 rounded-xl p-2">
            <option value="M">Masculino</option>
            <option value="F">Femenino</option>
            <option value="X">No binario</option>
          </select>
        </div>
        <div>
          <label className="block text-slate-600 font-semibold mb-1">Fecha de Nacimiento</label>
          <input type="date" value={patientForm.birthDate} onChange={(e) => setPatientForm({ ...patientForm, birthDate: e.target.value })} className="w-full border border-slate-300 rounded-xl p-2" />
        </div>
        <div>
          <label className="block text-slate-600 font-semibold mb-1">Grupo Sanguíneo</label>
          <select value={patientForm.bloodType} onChange={(e) => setPatientForm({ ...patientForm, bloodType: e.target.value })} className="w-full border border-slate-300 rounded-xl p-2">
            <option value="">Sin especificar</option>
            {['A+','A-','B+','B-','AB+','AB-','O+','O-'].map(bt => <option key={bt} value={bt}>{bt}</option>)}
          </select>
        </div>
      </div>

      {/* Contacto */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-slate-600 font-semibold mb-1 flex items-center gap-1"><Phone className="w-3 h-3"/>Teléfono</label>
          <input type="tel" value={patientForm.phone} onChange={(e) => setPatientForm({ ...patientForm, phone: e.target.value })} placeholder="+54 11 1234-5678" className="w-full border border-slate-300 rounded-xl p-2" />
        </div>
        <div>
          <label className="block text-slate-600 font-semibold mb-1 flex items-center gap-1"><Mail className="w-3 h-3"/>Correo (opcional)</label>
          <input type="email" value={patientForm.email} onChange={(e) => setPatientForm({ ...patientForm, email: e.target.value })} placeholder="paciente@email.com" className="w-full border border-slate-300 rounded-xl p-2" />
        </div>
      </div>

      {/* Dirección */}
      <div>
        <label className="block text-slate-600 font-semibold mb-1 flex items-center gap-1"><MapPin className="w-3 h-3"/>Domicilio</label>
        <input type="text" value={patientForm.address} onChange={(e) => setPatientForm({ ...patientForm, address: e.target.value })} placeholder="Av. Corrientes 1234, CABA" className="w-full border border-slate-300 rounded-xl p-2" />
      </div>

      {/* Contacto de emergencia */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-slate-600 font-semibold mb-1">Contacto de Emergencia</label>
          <input type="text" value={patientForm.emergencyContactName} onChange={(e) => setPatientForm({ ...patientForm, emergencyContactName: e.target.value })} placeholder="Nombre del contacto" className="w-full border border-slate-300 rounded-xl p-2" />
        </div>
        <div>
          <label className="block text-slate-600 font-semibold mb-1">Tel. Emergencia</label>
          <input type="tel" value={patientForm.emergencyContactPhone} onChange={(e) => setPatientForm({ ...patientForm, emergencyContactPhone: e.target.value })} placeholder="+54 11 5555-1234" className="w-full border border-slate-300 rounded-xl p-2" />
        </div>
      </div>

      {/* Cobertura */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-slate-600 font-semibold mb-1">Obra Social / Prepaga</label>
          <input type="text" value={patientForm.medicalInsuranceName} onChange={(e) => setPatientForm({ ...patientForm, medicalInsuranceName: e.target.value })} placeholder="Ej: OSDE, Swiss Medical, Particular" className="w-full border border-slate-300 rounded-xl p-2" />
        </div>
        <div>
          <label className="block text-slate-600 font-semibold mb-1">Nº de Afiliado</label>
          <input type="text" value={patientForm.affiliateNumber} onChange={(e) => setPatientForm({ ...patientForm, affiliateNumber: e.target.value })} className="w-full border border-slate-300 rounded-xl p-2" />
        </div>
      </div>

      {/* Notas */}
      <div>
        <label className="block text-slate-600 font-semibold mb-1">Notas (alergias, antecedentes)</label>
        <textarea rows={2} value={patientForm.notes} onChange={(e) => setPatientForm({ ...patientForm, notes: e.target.value })} placeholder="Alergias conocidas, antecedentes relevantes..." className="w-full border border-slate-300 rounded-xl p-2" />
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <button type="button" onClick={() => { setShowNewModal(false); setShowEditModal(false); }} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold flex items-center gap-1.5"><X className="w-3.5 h-3.5"/>Cancelar</button>
        <button type="submit" className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl font-bold flex items-center gap-1.5"><Save className="w-3.5 h-3.5"/>{submitLabel}</button>
      </div>
    </form>
  );

  // ════════════════════════════════════════════
  // RENDER
  // ════════════════════════════════════════════
  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Users className="w-6 h-6 text-sky-600" />
            Pacientes
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {user && <span className="font-semibold text-sky-700">{user.firstName} {user.lastName} — {user.role}</span>}
            {' · '}Registro, Historia Clínica y Atenciones
          </p>
        </div>

        {/* Botones según rol */}
        <div className="flex gap-2 flex-wrap">
          {isReception && !isReadOnly && (
            <button
              onClick={() => { setPatientForm({ ...emptyPatient }); setShowNewModal(true); }}
              className="bg-sky-600 hover:bg-sky-500 text-white px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 shadow-lg shadow-sky-600/20"
            >
              <Plus className="w-4 h-4" /> Nuevo Paciente
            </button>
          )}
        </div>
      </div>

      {/* Mensajes */}
      {error   && <div className="bg-red-50   border border-red-200   text-red-700   p-3 rounded-2xl text-xs flex items-center gap-2"><AlertCircle className="w-4 h-4 shrink-0"/>{error}</div>}
      {success && <div className="bg-green-50 border border-green-200 text-green-700 p-3 rounded-2xl text-xs flex items-center gap-2"><Save className="w-4 h-4 shrink-0"/>{success}</div>}

      {/* Buscador */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
        <Search className="w-4 h-4 text-slate-400 shrink-0" />
        <input type="text" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar por Nombre, Apellido o Número de DNI..." className="w-full text-xs text-slate-800 placeholder-slate-400 focus:outline-none" />
      </div>

      {/* Tabla de pacientes */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left text-xs text-slate-700">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-bold tracking-wider">
            <tr>
              <th className="p-4">Documento</th>
              <th className="p-4">Nombre y Apellido</th>
              <th className="p-4">Teléfono / Email</th>
              <th className="p-4">Cobertura Médica</th>
              <th className="p-4 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {patients.map((p) => (
              <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                <td className="p-4 font-mono font-semibold text-slate-900">{p.documentType} {p.documentNumber}</td>
                <td className="p-4">
                  <div className="font-bold text-slate-900">{p.firstName} {p.lastName}</div>
                  {p.birthDate && <div className="text-[10px] text-slate-400 mt-0.5">Nac: {new Date(p.birthDate).toLocaleDateString('es-AR')}</div>}
                </td>
                <td className="p-4 text-slate-500">
                  <div className="flex items-center gap-1"><Phone className="w-3 h-3"/>{p.phone || 'Sin teléfono'}</div>
                  {p.email && <div className="flex items-center gap-1 text-[10px] text-slate-400 mt-0.5"><Mail className="w-3 h-3"/>{p.email}</div>}
                </td>
                <td className="p-4 text-slate-600">
                  <span className="bg-slate-100 border border-slate-200 px-2 py-0.5 rounded text-[11px] font-medium">{p.medicalInsuranceName || 'Particular'}</span>
                  {p.affiliateNumber && <span className="block text-[10px] text-slate-400 mt-0.5">Nº {p.affiliateNumber}</span>}
                </td>
                <td className="p-4 text-right">
                  <div className="flex items-center justify-end gap-1.5 flex-wrap">
                    {/* Editar datos */}
                    {isReception && !isReadOnly && (
                      <button onClick={() => openEditModal(p)} className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 py-1.5 rounded-lg font-bold text-xs flex items-center gap-1 transition-colors">
                        <Edit2 className="w-3.5 h-3.5"/>Editar
                      </button>
                    )}
                    {/* Historia Clínica — Médico */}
                    {isDoctor && (
                      <button onClick={() => openEHR(p)} className="bg-sky-50 text-sky-700 hover:bg-sky-600 hover:text-white px-2.5 py-1.5 rounded-lg font-bold text-xs flex items-center gap-1 transition-colors">
                        <Stethoscope className="w-3.5 h-3.5"/>H. Clínica
                      </button>
                    )}
                    {/* Enfermería */}
                    {isNurse && !isReadOnly && (
                      <button onClick={() => openNursing(p)} className="bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white px-2.5 py-1.5 rounded-lg font-bold text-xs flex items-center gap-1 transition-colors">
                        <HeartPulse className="w-3.5 h-3.5"/>Enfermería
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {patients.length === 0 && !loading && (
              <tr><td colSpan={5} className="p-8 text-center text-slate-400">No se encontraron pacientes registrados.</td></tr>
            )}
            {loading && (
              <tr><td colSpan={5} className="p-8 text-center text-slate-300 animate-pulse">Cargando pacientes...</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ══ MODAL NUEVO PACIENTE ══════════════════════ */}
      {showNewModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl my-4">
            <PatientForm onSubmit={handleCreatePatient} title="Alta de Nuevo Paciente — Recepción" submitLabel="Guardar Paciente" />
          </div>
        </div>
      )}

      {/* ══ MODAL EDITAR PACIENTE ════════════════════ */}
      {showEditModal && editingPatient && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl my-4">
            <PatientForm onSubmit={handleUpdatePatient} title={`Editar Datos — ${editingPatient.firstName} ${editingPatient.lastName}`} submitLabel="Actualizar Datos" />
          </div>
        </div>
      )}

      {/* ══ PANEL HISTORIA CLÍNICA (MÉDICO) ════════ */}
      {showEhrModal && selectedPatient && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-end">
          <div className="bg-white w-full max-w-3xl h-full p-6 space-y-5 overflow-y-auto shadow-2xl">

            {/* Header */}
            <div className="flex items-start justify-between border-b border-slate-200 pb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Stethoscope className="w-5 h-5 text-sky-600" />
                  <h3 className="text-lg font-black text-slate-900">Historia Clínica</h3>
                </div>
                <p className="text-sm font-bold text-slate-700">{selectedPatient.firstName} {selectedPatient.lastName}</p>
                <p className="text-xs text-slate-500">
                  {selectedPatient.documentType} {selectedPatient.documentNumber}
                  {selectedPatient.birthDate && ` · Nac: ${new Date(selectedPatient.birthDate).toLocaleDateString('es-AR')}`}
                  {selectedPatient.bloodType && ` · Grupo ${selectedPatient.bloodType}`}
                </p>
                <p className="text-xs text-slate-400 mt-0.5">
                  Cobertura: {selectedPatient.medicalInsuranceName || 'Particular'}
                  {selectedPatient.affiliateNumber && ` (Nº ${selectedPatient.affiliateNumber})`}
                </p>
                {selectedPatient.notes && (
                  <div className="mt-1 bg-amber-50 border border-amber-200 text-amber-900 text-[10px] px-2 py-1 rounded-lg">
                    ⚠️ {selectedPatient.notes}
                  </div>
                )}
              </div>
              <button onClick={() => setShowEhrModal(false)} className="text-slate-400 hover:text-slate-600 bg-slate-100 p-2 rounded-xl text-xs font-bold flex items-center gap-1"><X className="w-3.5 h-3.5"/>Cerrar</button>
            </div>

            {/* Formulario nueva evolución */}
            {isDoctor && !isReadOnly ? (
              <form onSubmit={handleCreateEHR} className="bg-sky-50 border border-sky-200 p-4 rounded-2xl space-y-3 text-xs">
                <h4 className="font-bold text-sky-900 flex items-center gap-1.5"><Plus className="w-4 h-4 text-sky-600"/>Nueva Evolución Médica</h4>

                {/* Médico asignado */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Médico / Profesional Tratante (Opcional)</label>
                  <select value={newEhr.authorId} onChange={(e) => setNewEhr({ ...newEhr, authorId: e.target.value })} className="w-full border border-slate-300 rounded-xl p-2 bg-white text-xs">
                    <option value="">-- Usar usuario en sesión --</option>
                    {doctors.map((d) => (
                      <option key={d.id} value={d.id}>
                        Dr./Dra. {d.firstName} {d.lastName}{d.matricula ? ` (Mat: ${d.matricula})` : ''} — {d.specialty || 'General'}{d.shiftHours ? ` [${d.shiftHours}]` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Motivo de Consulta *</label>
                    <input type="text" required value={newEhr.reasonForVisit} onChange={(e) => setNewEhr({ ...newEhr, reasonForVisit: e.target.value })} className="w-full border border-slate-300 rounded-xl p-2" />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Diagnóstico *</label>
                    <input type="text" required value={newEhr.diagnosis} onChange={(e) => setNewEhr({ ...newEhr, diagnosis: e.target.value })} className="w-full border border-slate-300 rounded-xl p-2" />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Síntomas / Examen</label>
                  <textarea rows={2} value={newEhr.symptoms} onChange={(e) => setNewEhr({ ...newEhr, symptoms: e.target.value })} className="w-full border border-slate-300 rounded-xl p-2" />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Plan de Tratamiento / Indicaciones</label>
                  <textarea rows={2} value={newEhr.treatmentPlan} onChange={(e) => setNewEhr({ ...newEhr, treatmentPlan: e.target.value })} className="w-full border border-slate-300 rounded-xl p-2" />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Medicación Recetada</label>
                    <input type="text" value={newEhr.prescribedMedication} onChange={(e) => setNewEhr({ ...newEhr, prescribedMedication: e.target.value })} className="w-full border border-slate-300 rounded-xl p-2" />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Observaciones</label>
                    <input type="text" value={newEhr.observations} onChange={(e) => setNewEhr({ ...newEhr, observations: e.target.value })} className="w-full border border-slate-300 rounded-xl p-2" />
                  </div>
                </div>

                <button type="submit" className="bg-sky-600 hover:bg-sky-500 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5">
                  <Save className="w-3.5 h-3.5"/>Registrar Evolución
                </button>
              </form>
            ) : isReadOnly ? (
              <div className="bg-amber-50 border border-amber-300 p-3 rounded-xl text-xs text-amber-900 flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-amber-600"/>Modo Solo Lectura: escritura bloqueada por vencimiento.
              </div>
            ) : (
              <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl text-xs text-slate-500 flex items-center gap-2">
                <ShieldAlert className="w-4 h-4"/>Solo los médicos pueden registrar evoluciones clínicas.
              </div>
            )}

            {/* Historial de evoluciones */}
            <div className="space-y-3">
              <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-slate-400"/>Historial de Evoluciones ({ehrRecords.length})</h4>

              {ehrRecords.map((r) => (
                <div key={r.id} className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm space-y-2 text-xs">
                  <div className="flex justify-between items-start border-b border-slate-100 pb-2">
                    <div>
                      <span className="font-bold text-slate-900 text-sm block">{r.diagnosis}</span>
                      <span className="text-[11px] text-slate-500">Motivo: {r.reasonForVisit}</span>
                    </div>
                    <div className="text-right text-[10px] text-slate-400 shrink-0 ml-2">
                      <div>{new Date(r.createdAt).toLocaleString('es-AR')}</div>
                      <div className="font-semibold text-slate-700 mt-0.5">
                        {r.author?.firstName} {r.author?.lastName}
                        {r.author?.matricula && <span className="ml-1 bg-sky-100 text-sky-700 px-1.5 rounded font-mono text-[9px]">Mat: {r.author.matricula}</span>}
                      </div>
                      {r.author?.shiftHours && <div className="text-sky-600 font-medium">{r.author.shiftHours}</div>}
                    </div>
                  </div>

                  {r.symptoms && <div><span className="font-semibold text-slate-600">Síntomas:</span> <span className="text-slate-500">{r.symptoms}</span></div>}
                  {r.treatmentPlan && <div><span className="font-semibold text-slate-600">Tratamiento:</span> <p className="text-slate-500 bg-slate-50 p-2 rounded-lg mt-0.5">{r.treatmentPlan}</p></div>}
                  {r.prescribedMedication && <div><span className="font-semibold text-slate-600">Medicación:</span> <span className="text-slate-500">{r.prescribedMedication}</span></div>}
                  {r.observations && <div><span className="font-semibold text-slate-600">Obs:</span> <span className="text-slate-500">{r.observations}</span></div>}

                  {/* Enmiendas */}
                  {r.amendments?.length > 0 && (
                    <div className="bg-amber-50/70 border border-amber-200 p-3 rounded-xl space-y-2">
                      <span className="font-bold text-amber-900 text-[11px] flex items-center gap-1"><Edit3 className="w-3.5 h-3.5"/>Enmiendas ({r.amendments.length})</span>
                      {r.amendments.map((a: any) => (
                        <div key={a.id} className="text-[11px] text-amber-950 border-l-2 border-amber-400 pl-2 space-y-0.5">
                          <div className="font-semibold">Motivo: {a.amendmentReason}</div>
                          <div>{a.content}</div>
                          <div className="text-[9px] text-amber-700">Por {a.author?.firstName} {a.author?.lastName} — {new Date(a.createdAt).toLocaleString('es-AR')}</div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Agregar enmienda */}
                  {isDoctor && !isReadOnly && (
                    amendingRecordId === r.id ? (
                      <div className="bg-slate-50 p-3 rounded-xl border space-y-2">
                        <input type="text" placeholder="Motivo de la corrección..." value={amendmentReason} onChange={(e) => setAmendmentReason(e.target.value)} className="w-full border p-1.5 rounded-lg text-xs" />
                        <textarea placeholder="Detalle de la enmienda..." value={amendmentContent} onChange={(e) => setAmendmentContent(e.target.value)} className="w-full border p-1.5 rounded-lg text-xs" rows={2} />
                        <div className="flex gap-2">
                          <button onClick={() => handleAddAmendment(r.id)} className="bg-emerald-600 text-white px-3 py-1 rounded-lg font-bold text-xs">Guardar</button>
                          <button onClick={() => setAmendingRecordId(null)} className="bg-slate-200 text-slate-700 px-3 py-1 rounded-lg text-xs">Cancelar</button>
                        </div>
                      </div>
                    ) : (
                      <button onClick={() => setAmendingRecordId(r.id)} className="text-[11px] text-sky-600 hover:underline font-semibold flex items-center gap-1">
                        <Edit3 className="w-3 h-3"/>Agregar Enmienda Trazable
                      </button>
                    )
                  )}
                </div>
              ))}

              {ehrRecords.length === 0 && (
                <p className="text-center text-slate-400 text-xs py-6">No hay evoluciones clínicas registradas para este paciente.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ══ MODAL ENFERMERÍA ════════════════════════ */}
      {showNursingModal && nursingPatient && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <h3 className="text-base font-black text-slate-900 flex items-center gap-2"><HeartPulse className="w-5 h-5 text-emerald-600"/>Registro de Enfermería</h3>
                <p className="text-xs text-slate-500 mt-0.5">Paciente: {nursingPatient.firstName} {nursingPatient.lastName} — {nursingPatient.documentType} {nursingPatient.documentNumber}</p>
              </div>
              <button onClick={() => setShowNursingModal(false)} className="text-slate-400 hover:text-slate-600 bg-slate-100 p-1.5 rounded-lg"><X className="w-4 h-4"/></button>
            </div>

            <form onSubmit={handleSaveNursing} className="space-y-4 text-xs">

              {/* Enfermero asignado */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Enfermero/a a Cargo (Opcional)</label>
                <select value={nursingForm.authorId} onChange={(e) => setNursingForm({ ...nursingForm, authorId: e.target.value })} className="w-full border border-slate-300 rounded-xl p-2 bg-white">
                  <option value="">-- Usar usuario en sesión --</option>
                  {nurses.map((n) => (
                    <option key={n.id} value={n.id}>{n.firstName} {n.lastName}{n.matricula ? ` (Mat: ${n.matricula})` : ''}{n.shiftHours ? ` [${n.shiftHours}]` : ''}</option>
                  ))}
                </select>
              </div>

              {/* Signos vitales */}
              <div>
                <label className="block font-semibold text-slate-700 mb-2">Signos Vitales</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { key: 'bloodPressure',    label: 'Presión Art.', ph: '120/80 mmHg' },
                    { key: 'heartRate',         label: 'Frec. Cardíaca', ph: '72 bpm' },
                    { key: 'temperature',       label: 'Temperatura', ph: '36.5 °C' },
                    { key: 'oxygenSaturation',  label: 'SatO₂', ph: '98%' },
                    { key: 'weight',            label: 'Peso', ph: '70 kg' },
                  ].map(({ key, label, ph }) => (
                    <div key={key}>
                      <label className="block text-slate-500 mb-0.5">{label}</label>
                      <input
                        type="text"
                        placeholder={ph}
                        value={(nursingForm.vitalSigns as any)[key]}
                        onChange={(e) => setNursingForm({ ...nursingForm, vitalSigns: { ...nursingForm.vitalSigns, [key]: e.target.value } })}
                        className="w-full border border-slate-300 rounded-xl p-1.5 text-[11px]"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Procedimientos / Curaciones</label>
                <textarea rows={2} value={nursingForm.proceduresDone} onChange={(e) => setNursingForm({ ...nursingForm, proceduresDone: e.target.value })} placeholder="Curación de herida, colocación de vía periférica..." className="w-full border border-slate-300 rounded-xl p-2" />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Medicación Administrada</label>
                <input type="text" value={nursingForm.medicationAdministered} onChange={(e) => setNursingForm({ ...nursingForm, medicationAdministered: e.target.value })} placeholder="Ibuprofeno 400mg VO, Glucosa IV..." className="w-full border border-slate-300 rounded-xl p-2" />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Notas de Enfermería</label>
                <textarea rows={2} value={nursingForm.notes} onChange={(e) => setNursingForm({ ...nursingForm, notes: e.target.value })} placeholder="Observaciones del turno..." className="w-full border border-slate-300 rounded-xl p-2" />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowNursingModal(false)} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-bold flex items-center gap-1.5"><X className="w-3.5 h-3.5"/>Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold flex items-center gap-1.5"><Save className="w-3.5 h-3.5"/>Guardar Registro</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
