'use client';

import { useState, useEffect } from 'react';
import {
  CalendarDays,
  Clock,
  User,
  Stethoscope,
  Plus,
  Search,
  CheckCircle2,
  AlertCircle,
  XCircle,
  ChevronRight,
  Filter,
  Phone,
  Mail,
  UserCheck,
  Calendar as CalendarIcon,
  Activity,
  FileText,
  Trash2,
  RefreshCw,
  Sparkles
} from 'lucide-react';
import Link from 'next/link';

interface Appointment {
  id: string;
  patientId?: string | null;
  patient?: {
    id: string;
    firstName: string;
    lastName: string;
    documentNumber?: string;
    phone?: string;
  } | null;
  guestName?: string | null;
  guestPhone?: string | null;
  guestEmail?: string | null;
  doctorId?: string | null;
  doctor?: {
    id: string;
    firstName: string;
    lastName: string;
    specialty?: string;
    matricula?: string;
  } | null;
  date: string;
  durationMins: number;
  specialty?: string | null;
  reason?: string | null;
  notes?: string | null;
  status: string; // PENDING, CONFIRMED, IN_WAITING_ROOM, ATTENDED, CANCELLED, NO_SHOW
  createdBy?: {
    firstName: string;
    lastName: string;
  } | null;
}

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string; border: string }> = {
  PENDING: {
    label: 'Pendiente',
    bg: 'bg-amber-500/10',
    text: 'text-amber-500',
    border: 'border-amber-500/30',
  },
  CONFIRMED: {
    label: 'Confirmado',
    bg: 'bg-sky-500/10',
    text: 'text-sky-400',
    border: 'border-sky-500/30',
  },
  IN_WAITING_ROOM: {
    label: 'En Sala de Espera',
    bg: 'bg-emerald-500/15',
    text: 'text-emerald-400',
    border: 'border-emerald-500/40',
  },
  ATTENDED: {
    label: 'Atendido / Finalizado',
    bg: 'bg-slate-700/50',
    text: 'text-slate-300',
    border: 'border-slate-600',
  },
  CANCELLED: {
    label: 'Cancelado',
    bg: 'bg-rose-500/10',
    text: 'text-rose-400',
    border: 'border-rose-500/30',
  },
  NO_SHOW: {
    label: 'No Asistió',
    bg: 'bg-purple-500/10',
    text: 'text-purple-400',
    border: 'border-purple-500/30',
  },
};

export default function ReservasPage() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedDate, setSelectedDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [selectedDoctorId, setSelectedDoctorId] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [searchFilter, setSearchFilter] = useState('');
  const [showOnlineOnly, setShowOnlineOnly] = useState(false);
  // Modal create
  const [showModal, setShowModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [modalError, setModalError] = useState('');

  // Form
  const [patientMode, setPatientMode] = useState<'REGISTERED' | 'GUEST'>('REGISTERED');
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [guestName, setGuestName] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [targetDoctorId, setTargetDoctorId] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [formDate, setFormDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [formTime, setFormTime] = useState('09:00');
  const [durationMins, setDurationMins] = useState(20);
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');

  // Initial load
  useEffect(() => {
    async function init() {
      try {
        const [meRes, docsRes, patsRes] = await Promise.all([
          fetch('/api/auth/me'),
          fetch('/api/staff?area=MEDICO'),
          fetch('/api/patients'),
        ]);

        if (meRes.ok) {
          const meData = await meRes.json();
          setCurrentUser(meData.user);
          // Si el usuario es médico, auto-filtrar por sus citas
          if (meData.user?.role === 'MEDICO' || meData.user?.area === 'MEDICO') {
            setSelectedDoctorId(meData.user.id);
            setTargetDoctorId(meData.user.id);
            if (meData.user.specialty) setSpecialty(meData.user.specialty);
          }
        }

        if (docsRes.ok) {
          const docsData = await docsRes.json();
          setDoctors(docsData.staff || []);
        }

        if (patsRes.ok) {
          const patsData = await patsRes.json();
          setPatients(patsData.patients || []);
        }
      } catch (e) {
        console.error('Error init reservas:', e);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

  // Fetch appointments
  const fetchAppointments = async () => {
    try {
      let url = `/api/appointments?date=${selectedDate}`;
      if (selectedDoctorId) url += `&doctorId=${selectedDoctorId}`;
      if (selectedStatus && selectedStatus !== 'ALL') url += `&status=${selectedStatus}`;
      if (showOnlineOnly) url += `&onlineOnly=true`;

      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setAppointments(data.appointments || []);
      }
    } catch (e) {
      console.error('Error fetching appointments:', e);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, [selectedDate, selectedDoctorId, selectedStatus, showOnlineOnly]);

  // Update status
  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      const res = await fetch('/api/appointments', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: newStatus }),
      });
      if (res.ok) {
        fetchAppointments();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Delete appointment
  const handleDelete = async (id: string) => {
    if (!confirm('¿Confirma la cancelación y eliminación de este turno reservado?')) return;
    try {
      const res = await fetch(`/api/appointments?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchAppointments();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Create appointment
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setModalError('');

    try {
      const dateTimeIso = new Date(`${formDate}T${formTime}:00`).toISOString();

      const payload = {
        patientId: patientMode === 'REGISTERED' ? selectedPatientId : null,
        guestName: patientMode === 'GUEST' ? guestName.trim() : null,
        guestPhone: patientMode === 'GUEST' ? guestPhone.trim() : null,
        guestEmail: patientMode === 'GUEST' ? guestEmail.trim() : null,
        doctorId: targetDoctorId || null,
        specialty: specialty.trim() || null,
        date: dateTimeIso,
        durationMins: Number(durationMins),
        reason: reason.trim() || null,
        notes: notes.trim() || null,
      };

      const res = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Error al agendar reserva');
      }

      setShowModal(false);
      // Reset
      setReason('');
      setNotes('');
      setGuestName('');
      setGuestPhone('');
      setGuestEmail('');
      setSelectedPatientId('');
      fetchAppointments();
    } catch (err: any) {
      setModalError(err.message || 'Error al crear turno');
    } finally {
      setCreating(false);
    }
  };

  // Stats
  const totalCount = appointments.length;
  const confirmedCount = appointments.filter(a => a.status === 'CONFIRMED').length;
  const inWaitingCount = appointments.filter(a => a.status === 'IN_WAITING_ROOM').length;
  const attendedCount = appointments.filter(a => a.status === 'ATTENDED').length;

  const filteredAppointments = appointments.filter(a => {
    if (!searchFilter.trim()) return true;
    const q = searchFilter.toLowerCase();
    const pName = a.patient ? `${a.patient.firstName} ${a.patient.lastName}`.toLowerCase() : '';
    const gName = (a.guestName || '').toLowerCase();
    const docName = a.doctor ? `${a.doctor.firstName} ${a.doctor.lastName}`.toLowerCase() : '';
    const r = (a.reason || '').toLowerCase();
    const dni = a.patient?.documentNumber || '';
    return pName.includes(q) || gName.includes(q) || docName.includes(q) || r.includes(q) || dni.includes(q);
  });

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-3xl text-white shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-sky-400 uppercase tracking-wider flex items-center gap-1.5">
              <CalendarDays className="w-4 h-4" />
              Agenda & Reservas de Turnos
            </span>
            <span className="bg-sky-500/20 text-sky-300 border border-sky-500/30 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full">
              Sincronizado
            </span>
          </div>
          <h1 className="text-2xl font-black tracking-tight">Turnos Programados</h1>
          <p className="text-xs text-slate-400">
            Reserva de citas para pacientes registrados e invitados. Organice las agendas de cada médico y la sala de espera.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchAppointments()}
            className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors border border-slate-700"
            title="Refrescar"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Actualizar</span>
          </button>

          <button
            onClick={() => {
              setModalError('');
              setShowModal(true);
            }}
            className="flex items-center gap-2 bg-sky-500 hover:bg-sky-400 text-slate-950 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-lg shadow-sky-500/20"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Reservar Turno</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Total en Fecha</span>
          <span className="text-2xl font-black text-slate-900 font-mono mt-1 block">{totalCount}</span>
          <span className="text-[11px] text-slate-500 mt-0.5 block">Citas programadas</span>
        </div>

        <div className="bg-white border border-sky-100 rounded-2xl p-4 shadow-sm">
          <span className="text-[10px] font-bold uppercase tracking-wider text-sky-600 block">Confirmados</span>
          <span className="text-2xl font-black text-sky-600 font-mono mt-1 block">{confirmedCount}</span>
          <span className="text-[11px] text-slate-500 mt-0.5 block">Listos para asistir</span>
        </div>

        <div className="bg-white border border-emerald-100 rounded-2xl p-4 shadow-sm">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 block">En Sala de Espera</span>
          <span className="text-2xl font-black text-emerald-600 font-mono mt-1 block">{inWaitingCount}</span>
          <span className="text-[11px] text-slate-500 mt-0.5 block">En clínica / consultorio</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Atendidos</span>
          <span className="text-2xl font-black text-slate-700 font-mono mt-1 block">{attendedCount}</span>
          <span className="text-[11px] text-slate-500 mt-0.5 block">Consultas finalizadas</span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Date Selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-600 flex items-center gap-1.5">
              <CalendarIcon className="w-3.5 h-3.5 text-slate-400" />
              Fecha:
            </span>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-3 py-1.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
            <button
              onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
              className={`text-xs px-2.5 py-1.5 rounded-lg font-bold border transition-colors ${
                selectedDate === new Date().toISOString().split('T')[0]
                  ? 'bg-sky-50 border-sky-300 text-sky-700'
                  : 'bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Hoy
            </button>
            <button
              onClick={() => {
                const tomorrow = new Date();
                tomorrow.setDate(tomorrow.getDate() + 1);
                setSelectedDate(tomorrow.toISOString().split('T')[0]);
              }}
              className="text-xs px-2.5 py-1.5 rounded-lg font-bold border bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200 transition-colors"
            >
              Mañana
            </button>
          </div>

          {/* Doctor Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-600 flex items-center gap-1.5">
              <Stethoscope className="w-3.5 h-3.5 text-slate-400" />
              Profesional:
            </span>
            <select
              value={selectedDoctorId}
              onChange={(e) => setSelectedDoctorId(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-3 py-1.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-sky-500"
            >
              <option value="">Todos los profesionales</option>
              {doctors.map((doc) => (
                <option key={doc.id} value={doc.id}>
                  Dr/a. {doc.firstName} {doc.lastName} {doc.specialty ? `(${doc.specialty})` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-600 flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              Estado:
            </span>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-3 py-1.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-sky-500"
            >
              <option value="ALL">Todos los estados</option>
              <option value="PENDING">Pendientes</option>
              <option value="CONFIRMED">Confirmados</option>
              <option value="IN_WAITING_ROOM">En Sala de Espera</option>
              <option value="ATTENDED">Atendidos</option>
              <option value="CANCELLED">Cancelados</option>
            </select>
          </div>

          {/* Filtro: Solo Online */}
          <button
            type="button"
            onClick={() => setShowOnlineOnly(!showOnlineOnly)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors ${
              showOnlineOnly
                ? 'bg-emerald-500 text-white border-emerald-500 shadow-md'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-emerald-50 hover:border-emerald-300'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            {showOnlineOnly ? 'Solo Online ✔' : 'Solo Reservas Online'}
          </button>
        </div>

        {/* Search filter input */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Buscar por paciente, DNI, teléfono o motivo..."
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
        </div>
      </div>

      {/* Listado de Reservas */}
      <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
        {filteredAppointments.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="bg-slate-100 text-slate-400 w-12 h-12 rounded-2xl flex items-center justify-center mx-auto">
              <CalendarDays className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-800">No hay turnos registrados para esta fecha</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Utilice el botón "Reservar Turno" para agendar una cita o cambie la fecha seleccionada en los filtros superiores.
            </p>
            <button
              onClick={() => {
                setModalError('');
                setShowModal(true);
              }}
              className="inline-flex items-center gap-1.5 bg-sky-500 hover:bg-sky-400 text-slate-950 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-md shadow-sky-500/20"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              Reservar Primer Turno
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold text-[10px]">
                <tr>
                  <th className="px-5 py-3">Horario</th>
                  <th className="px-5 py-3">Paciente</th>
                  <th className="px-5 py-3">Médico / Especialidad</th>
                  <th className="px-5 py-3">Motivo</th>
                  <th className="px-5 py-3">Estado</th>
                  <th className="px-5 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredAppointments.map((app) => {
                  const timeStr = new Date(app.date).toLocaleTimeString('es-AR', {
                    hour: '2-digit',
                    minute: '2-digit',
                  });
                  const statusInfo = STATUS_CONFIG[app.status] || STATUS_CONFIG.PENDING;
                  const patientName = app.patient
                    ? `${app.patient.lastName}, ${app.patient.firstName}`
                    : app.guestName || 'Invitado';
                  const patientDoc = app.patient?.documentNumber ? `DNI ${app.patient.documentNumber}` : '';
                  const patientContact = app.patient?.phone || app.guestPhone || app.guestEmail || '';

                  return (
                    <tr key={app.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Horario */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-black text-sm text-slate-900 bg-slate-100 px-2 py-1 rounded-lg">
                            {timeStr}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {app.durationMins}m
                          </span>
                        </div>
                      </td>

                      {/* Paciente */}
                      <td className="px-5 py-4">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-bold text-slate-900">{patientName}</span>
                            {!app.patient && (
                              <span className="text-[9px] bg-slate-100 text-slate-500 font-mono px-1.5 py-0.5 rounded">
                                Invitado
                              </span>
                            )}
                            {(app as any).isOnlineBooking && (
                              <span className="text-[9px] bg-emerald-100 text-emerald-700 border border-emerald-200 font-bold px-1.5 py-0.5 rounded-full">
                                📱 Online
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-[11px] text-slate-500">
                            {patientDoc && <span>{patientDoc}</span>}
                            {patientContact && (
                              <span className="flex items-center gap-1 text-slate-400">
                                <Phone className="w-3 h-3" />
                                {patientContact}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Médico */}
                      <td className="px-5 py-4">
                        <div className="space-y-0.5">
                          <span className="font-semibold text-slate-800 block">
                            {app.doctor ? `Dr/a. ${app.doctor.firstName} ${app.doctor.lastName}` : 'Sin asignar'}
                          </span>
                          <span className="text-[10px] text-sky-600 font-medium block">
                            {app.specialty || app.doctor?.specialty || 'Clínica General'}
                          </span>
                        </div>
                      </td>

                      {/* Motivo */}
                      <td className="px-5 py-4 max-w-xs">
                        <p className="text-slate-600 truncate" title={app.reason || ''}>
                          {app.reason || <span className="text-slate-400 italic">Consulta de rutina</span>}
                        </p>
                        {app.notes && (
                          <p className="text-[10px] text-slate-400 italic truncate" title={app.notes}>
                            Nota: {app.notes}
                          </p>
                        )}
                      </td>

                      {/* Estado */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full border ${statusInfo.bg} ${statusInfo.text} ${statusInfo.border}`}
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-current" />
                          {statusInfo.label}
                        </span>
                      </td>

                      {/* Acciones */}
                      <td className="px-5 py-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Botón rápido En Sala de Espera */}
                          {app.status !== 'IN_WAITING_ROOM' && app.status !== 'ATTENDED' && app.status !== 'CANCELLED' && (
                            <button
                              onClick={() => handleUpdateStatus(app.id, 'IN_WAITING_ROOM')}
                              className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 px-2 py-1 rounded-lg text-[10px] font-bold transition-colors"
                              title="Marcar ingreso a Sala de Espera"
                            >
                              A Sala
                            </button>
                          )}

                          {/* Botón rápido Confirmar */}
                          {app.status === 'PENDING' && (
                            <button
                              onClick={() => handleUpdateStatus(app.id, 'CONFIRMED')}
                              className="bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 px-2 py-1 rounded-lg text-[10px] font-bold transition-colors"
                              title="Confirmar turno"
                            >
                              Confirmar
                            </button>
                          )}

                          {/* Botón Atendido */}
                          {app.status === 'IN_WAITING_ROOM' && (
                            <button
                              onClick={() => handleUpdateStatus(app.id, 'ATTENDED')}
                              className="bg-slate-800 hover:bg-slate-900 text-white px-2 py-1 rounded-lg text-[10px] font-bold transition-colors"
                              title="Marcar consulta finalizada"
                            >
                              Finalizar
                            </button>
                          )}

                          {/* Ir a Historia Clínica si tiene paciente */}
                          {app.patientId && (
                            <Link
                              href={`/dashboard/pacientes?search=${encodeURIComponent(app.patient?.documentNumber || app.patient?.lastName || '')}`}
                              className="p-1 text-slate-400 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition-colors"
                              title="Ver Historia Clínica"
                            >
                              <FileText className="w-4 h-4" />
                            </Link>
                          )}

                          {/* Cancelar / Eliminar */}
                          <button
                            onClick={() => handleDelete(app.id)}
                            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Cancelar y eliminar turno"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Nueva Reserva */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-slate-200 w-full max-w-xl rounded-3xl p-6 md:p-8 space-y-5 shadow-2xl my-8">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-xs font-bold text-sky-600 uppercase tracking-wider block">
                  Nueva Reserva de Cita
                </span>
                <h3 className="text-xl font-black text-slate-900 mt-0.5">Agendar Turno Médico</h3>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 transition-colors"
              >
                ✕
              </button>
            </div>

            {modalError && (
              <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-2xl text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleCreate} className="space-y-4">
              {/* Selector Modo Paciente: Registrado vs Invitado */}
              <div className="flex bg-slate-100 p-1 rounded-2xl">
                <button
                  type="button"
                  onClick={() => setPatientMode('REGISTERED')}
                  className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    patientMode === 'REGISTERED'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  Paciente Registrado
                </button>
                <button
                  type="button"
                  onClick={() => setPatientMode('GUEST')}
                  className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    patientMode === 'GUEST'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  Nuevo / Invitado Rápido
                </button>
              </div>

              {/* Selección de paciente registrado */}
              {patientMode === 'REGISTERED' ? (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Seleccionar Paciente *
                  </label>
                  <select
                    value={selectedPatientId}
                    onChange={(e) => setSelectedPatientId(e.target.value)}
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  >
                    <option value="">-- Buscar y seleccionar paciente --</option>
                    {patients.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.lastName}, {p.firstName} (DNI: {p.documentNumber || 'S/D'}) {p.phone ? `· ${p.phone}` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="space-y-2">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Nombre y Apellido *
                    </label>
                    <input
                      type="text"
                      placeholder="Ej: Laura Gómez"
                      value={guestName}
                      onChange={(e) => setGuestName(e.target.value)}
                      required
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Teléfono</label>
                      <input
                        type="tel"
                        placeholder="11-xxxx-xxxx"
                        value={guestPhone}
                        onChange={(e) => setGuestPhone(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Correo Electrónico</label>
                      <input
                        type="email"
                        placeholder="paciente@correo.com"
                        value={guestEmail}
                        onChange={(e) => setGuestEmail(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Selección de Médico & Especialidad */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Profesional Asignado
                  </label>
                  <select
                    value={targetDoctorId}
                    onChange={(e) => {
                      setTargetDoctorId(e.target.value);
                      const doc = doctors.find((d) => d.id === e.target.value);
                      if (doc?.specialty) setSpecialty(doc.specialty);
                    }}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  >
                    <option value="">Cualquier médico disponible</option>
                    {doctors.map((d) => (
                      <option key={d.id} value={d.id}>
                        Dr/a. {d.firstName} {d.lastName} {d.specialty ? `(${d.specialty})` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Especialidad
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: Pediatría, Cardiología..."
                    value={specialty}
                    onChange={(e) => setSpecialty(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>

              {/* Fecha, Hora y Duración */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Fecha *</label>
                  <input
                    type="date"
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Hora *</label>
                  <input
                    type="time"
                    value={formTime}
                    onChange={(e) => setFormTime(e.target.value)}
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Duración</label>
                  <select
                    value={durationMins}
                    onChange={(e) => setDurationMins(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  >
                    <option value={15}>15 minutos</option>
                    <option value={20}>20 minutos</option>
                    <option value={30}>30 minutos</option>
                    <option value={45}>45 minutos</option>
                    <option value={60}>60 minutos</option>
                  </select>
                </div>
              </div>

              {/* Motivo */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Motivo de la Consulta
                </label>
                <input
                  type="text"
                  placeholder="Ej: Control anual, chequeo de presión, dolor de garganta..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              {/* Notas */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Observaciones / Notas adicionales
                </label>
                <textarea
                  rows={2}
                  placeholder="Ej: Requiere orden médica previa, paciente alérgico a penicilina..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="bg-sky-500 hover:bg-sky-400 disabled:opacity-50 text-slate-950 px-5 py-2 rounded-xl text-xs font-bold transition-all shadow-md shadow-sky-500/20"
                >
                  {creating ? 'Agendando...' : 'Confirmar Reserva'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
