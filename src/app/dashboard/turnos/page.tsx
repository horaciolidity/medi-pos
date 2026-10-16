'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Clock,
  Ticket,
  Monitor,
  Plus,
  Volume2,
  CheckCircle2,
  ShieldAlert,
  AlertCircle,
  Printer,
  QrCode,
  Copy,
  Check,
  ExternalLink,
  DollarSign,
  CreditCard,
  Smartphone,
  Sparkles,
  X,
  User,
  ArrowRight,
  Calendar
} from 'lucide-react';

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

  // Portal de Pacientes & QR
  const [showQrModal, setShowQrModal] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Citas y Reservas Online de Hoy
  const [todayAppointments, setTodayAppointments] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'COLA' | 'CITAS'>('COLA');
  const [admittingId, setAdmittingId] = useState<string | null>(null);

  const [error, setError] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      const [meRes, turnosRes, patientsRes, appRes] = await Promise.all([
        fetch('/api/auth/me'),
        fetch('/api/turnos'),
        fetch('/api/patients'),
        fetch(`/api/appointments?date=${todayStr}`),
      ]);

      const meData = await meRes.json();
      setUser(meData.user);
      setSubscription(meData.subscription);

      const turnosData = await turnosRes.json();
      setTurnos(turnosData.turnos || []);
      setBoxes(turnosData.boxes || []);

      const patientsData = await patientsRes.json();
      setPatients(patientsData.patients || []);

      const appData = await appRes.json();
      setTodayAppointments(appData.appointments || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 15000);
    return () => clearInterval(interval);
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

  // Admisión de un paciente que reservó cita online: generar ticket e ingresar a sala
  const handleAdmitAppointment = async (app: any) => {
    setAdmittingId(app.id);
    setError('');
    try {
      // Generar ticket en la cola en vivo (Prefijo B = Turno Programado / Online)
      const res = await fetch('/api/turnos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prefix: 'B',
          patientId: app.patientId || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al emitir ticket de ingreso');

      // Marcar la cita como ingresada a sala de espera
      await fetch('/api/appointments', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: app.id,
          status: 'IN_WAITING_ROOM',
        }),
      });

      setPrintedTicket(data.ticketPrintData);
      setShowTicketModal(true);
      loadData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setAdmittingId(null);
    }
  };

  // Enlace del portal de pacientes
  const clinicSlug = user?.company?.slug || user?.company?.id || '';
  const patientBookingUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/turnos-online?slug=${encodeURIComponent(clinicSlug)}`
    : '/turnos-online';

  const handleCopyLink = () => {
    if (typeof window === 'undefined') return;
    navigator.clipboard.writeText(patientBookingUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  // URL del QR de reserva online para pacientes
  const qrOnlineBookingUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(patientBookingUrl)}`;

  const isReadOnly = subscription?.isReadOnly;
  const isPro = subscription?.isProTurneroEnabled;

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Clock className="w-6 h-6 text-sky-600" /> Recepción & Turnero de Pacientes
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Gestión de sala de espera, llamado a boxes, emisión de tickets y recepción de citas online.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Botón Pantalla Pública */}
          {user?.branchId && (
            <Link
              href={`/display/${user.branchId}`}
              target="_blank"
              className="bg-purple-600 hover:bg-purple-500 text-white font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-purple-600/20 transition-colors"
            >
              <Monitor className="w-4 h-4" />
              <span>Pantalla Pública</span>
            </Link>
          )}

          {/* Acceso a Caja POS (El coseguro y cobros se gestionan en Caja) */}
          <Link
            href="/dashboard/caja"
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-emerald-600/20 transition-colors"
          >
            <CreditCard className="w-4 h-4" />
            <span>Caja POS & Cobros</span>
          </Link>

          {/* Botón Nuevo Ticket */}
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

      {/* BANNER: Enlace de Turnos para el Paciente con Servicios Disponibles */}
      <div className="bg-gradient-to-r from-sky-950 via-slate-900 to-slate-900 border border-sky-800/60 p-5 md:p-6 rounded-3xl text-white shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1 max-w-xl">
            <div className="flex items-center gap-2">
              <span className="bg-sky-500/20 text-sky-300 border border-sky-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 font-mono">
                <Sparkles className="w-3 h-3" /> Turnos Futuros del Paciente
              </span>
              <span className="text-xs font-bold text-slate-200">Enlace Online para que el Paciente Saque Turno</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Compartí este enlace con tus pacientes o mostrales el código QR en mostrador para que agenden turnos futuros desde su celular y reciban confirmación automática por WhatsApp.
            </p>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <button
              type="button"
              onClick={handleCopyLink}
              className="flex-1 md:flex-initial bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-bold px-3.5 py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-sky-400" />}
              <span>{copiedLink ? '¡Enlace Copiado!' : 'Copiar Enlace'}</span>
            </button>

            <button
              type="button"
              onClick={() => setShowQrModal(true)}
              className="bg-sky-500 hover:bg-sky-400 text-slate-950 font-black px-4 py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all shadow-md shadow-sky-500/20 shrink-0"
            >
              <QrCode className="w-4 h-4" />
              <span>QR en Pantalla</span>
            </button>

            <a
              href={patientBookingUrl}
              target="_blank"
              rel="noreferrer"
              className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-sky-300 font-bold px-3.5 py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors shrink-0"
              title="Abrir portal de turnos en nueva pestaña"
            >
              <ExternalLink className="w-4 h-4" />
              <span className="hidden sm:inline">Ver Portal</span>
            </a>
          </div>
        </div>

        {/* Listado de Servicios Disponibles en el Portal (3 servicios configurados) */}
        <div className="pt-3 border-t border-slate-800/80 flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-bold text-slate-300 flex items-center gap-1">
            <span>Servicios habilitados para pacientes (3 disponibles):</span>
          </span>
          <span className="bg-sky-500/15 border border-sky-500/30 text-sky-200 text-[11px] font-semibold px-2.5 py-1 rounded-xl flex items-center gap-1.5">
            <span>🩺</span>
            <span>Consulta Médica General (20m · Sin Coseguro)</span>
          </span>
          <span className="bg-purple-500/15 border border-purple-500/30 text-purple-200 text-[11px] font-semibold px-2.5 py-1 rounded-xl flex items-center gap-1.5">
            <span>👶</span>
            <span>Pediatría (30m · Coseguro $2.500)</span>
          </span>
          <span className="bg-rose-500/15 border border-rose-500/30 text-rose-200 text-[11px] font-semibold px-2.5 py-1 rounded-xl flex items-center gap-1.5">
            <span>❤️</span>
            <span>Cardiología & ECG (30m · Coseguro $4.000)</span>
          </span>
          <Link
            href="/dashboard/configuracion"
            className="text-[11px] text-sky-400 hover:text-sky-300 font-bold underline ml-auto flex items-center gap-1"
          >
            <span>Configurar en Ajustes</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </div>

      {/* Notice Plan Standard vs Pro */}
      {!isPro && (
        <div className="bg-sky-50 border border-sky-200 p-4 rounded-2xl text-xs text-sky-900 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Ticket className="w-5 h-5 text-sky-600 shrink-0" />
            <span>
              Actualmente posee el <strong>Plan Estándar</strong>. La recepción básica puede generar tickets, cobrar coseguros y compartir el portal online, pero la pantalla pública de sala requiere el <strong>Plan Pro</strong>.
            </span>
          </div>
        </div>
      )}

      {error && <div className="bg-red-50 text-red-700 p-3.5 rounded-xl text-xs border border-red-200">{error}</div>}

      {/* Selector de Pestañas: Cola en Vivo vs Citas Online de Hoy */}
      <div className="flex bg-slate-200/80 p-1 rounded-2xl w-full sm:w-fit">
        <button
          type="button"
          onClick={() => setActiveTab('COLA')}
          className={`flex-1 sm:flex-initial px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
            activeTab === 'COLA'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Clock className="w-4 h-4 text-sky-600" />
          <span>Cola en Vivo & Sala de Espera ({turnos.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('CITAS')}
          className={`flex-1 sm:flex-initial px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
            activeTab === 'CITAS'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Calendar className="w-4 h-4 text-purple-600" />
          <span>Citas & Reservas Online de Hoy ({todayAppointments.length})</span>
          {todayAppointments.length > 0 && (
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          )}
        </button>
      </div>

      {/* PESTAÑA 1: COLA EN VIVO DE SALA DE ESPERA */}
      {activeTab === 'COLA' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden text-xs">
          <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
            <h3 className="font-bold text-slate-900">Cola de Turnos en Vivo del Día</h3>
            <span className="text-[11px] font-semibold text-slate-500">{turnos.length} Turnos en Circulación</span>
          </div>

          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-200 font-bold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="p-4">Ticket</th>
                <th className="p-4">Estado</th>
                <th className="p-4">Paciente</th>
                <th className="p-4">Consultorio / Box</th>
                <th className="p-4 text-right">Llamado a Box</th>
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
                  <td className="p-4">
                    <div className="font-semibold text-slate-800">
                      {t.patient ? `${t.patient.firstName} ${t.patient.lastName}` : 'Anónimo / Guardia'}
                    </div>
                    {t.patient?.documentNumber && (
                      <div className="text-[10px] text-slate-400 font-mono">DNI: {t.patient.documentNumber}</div>
                    )}
                  </td>
                  <td className="p-4 font-mono text-slate-600">{t.box?.name || 'Recepción'}</td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {!isReadOnly && t.status === 'WAITING' && (
                        <button
                          onClick={() => {
                            if (!isPro) {
                              alert('El llamado desde boxes en tiempo real es exclusivo del Plan Pro.');
                              return;
                            }
                            setCallingTurno(t);
                          }}
                          className="bg-purple-50 text-purple-700 hover:bg-purple-600 hover:text-white px-3 py-1.5 rounded-lg font-bold text-xs transition-colors flex items-center gap-1 shadow-sm"
                        >
                          <Volume2 className="w-3.5 h-3.5" />
                          <span>Llamar a Box</span>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {turnos.length === 0 && !loading && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-400">
                    No hay turnos registrados en la cola en vivo en este momento.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* PESTAÑA 2: CITAS & RESERVAS ONLINE DE HOY */}
      {activeTab === 'CITAS' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden text-xs">
          <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
            <div>
              <h3 className="font-bold text-slate-900">Citas & Turnos Online Agendados para Hoy</h3>
              <p className="text-[11px] text-slate-500">
                Cuando el paciente se presente en recepción, hacé clic en &ldquo;Ingresar a Sala&rdquo; para asignarle ticket e incorporarlo a la pantalla de llamados.
              </p>
            </div>
            <span className="text-[11px] font-semibold text-purple-700 bg-purple-50 border border-purple-200 px-2.5 py-1 rounded-xl">
              {todayAppointments.length} Citas Registradas
            </span>
          </div>

          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-200 font-bold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="p-4">Horario</th>
                <th className="p-4">Paciente</th>
                <th className="p-4">Servicio / Especialidad</th>
                <th className="p-4">Médico Asignado</th>
                <th className="p-4">Estado</th>
                <th className="p-4 text-right">Acción de Ingreso</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {todayAppointments.map((app) => {
                const patName = app.patient
                  ? `${app.patient.firstName} ${app.patient.lastName}`
                  : app.guestName || 'Paciente Invitado';
                const patDoc = app.patient?.documentNumber || app.guestDni;
                const patPhone = app.patient?.phone || app.guestPhone;
                const timeStr = new Date(app.date).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });

                return (
                  <tr key={app.id} className="hover:bg-slate-50">
                    <td className="p-4 font-mono font-bold text-sky-700">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-sky-500" />
                        <span>{timeStr} hs</span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-normal">{app.durationMins || 20}m</span>
                    </td>

                    <td className="p-4">
                      <div className="font-bold text-slate-900 flex items-center gap-1.5 flex-wrap">
                        <span>{patName}</span>
                        {app.isOnlineBooking && (
                          <span className="text-[9px] bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold px-1.5 py-0.5 rounded-full">
                            📱 Reserva Online
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                        {patDoc && <span>DNI: {patDoc}</span>}
                        {patPhone && <span>Tel: {patPhone}</span>}
                      </div>
                    </td>

                    <td className="p-4">
                      <span className="font-semibold text-slate-800 block">
                        {app.serviceName || app.specialty || 'Consulta Médica'}
                      </span>
                      {app.hasCoseguro ? (
                        <span className="text-[10px] text-amber-700 font-mono font-bold">
                          Coseguro: ARS ${Number(app.coseguroAmount || 0).toLocaleString('es-AR')}
                        </span>
                      ) : (
                        <span className="text-[10px] text-emerald-600 font-semibold">Sin coseguro</span>
                      )}
                    </td>

                    <td className="p-4">
                      <span className="font-medium text-slate-700">
                        {app.doctor ? `Dr/a. ${app.doctor.firstName} ${app.doctor.lastName}` : 'Cualquier disponible'}
                      </span>
                    </td>

                    <td className="p-4">
                      {app.status === 'CONFIRMED' && (
                        <span className="bg-sky-50 text-sky-700 border border-sky-200 text-[10px] font-bold px-2 py-0.5 rounded-full">
                          Confirmado
                        </span>
                      )}
                      {app.status === 'IN_WAITING_ROOM' && (
                        <span className="bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-bold px-2 py-0.5 rounded-full">
                          En Sala de Espera
                        </span>
                      )}
                      {app.status === 'ATTENDED' && (
                        <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold px-2 py-0.5 rounded-full">
                          Atendido
                        </span>
                      )}
                      {app.status === 'PENDING' && (
                        <span className="bg-slate-100 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded-full">
                          Pendiente
                        </span>
                      )}
                    </td>

                    <td className="p-4 text-right">
                      {app.status !== 'IN_WAITING_ROOM' && app.status !== 'ATTENDED' ? (
                        <button
                          onClick={() => handleAdmitAppointment(app)}
                          disabled={admittingId === app.id}
                          className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3 py-1.5 rounded-xl text-xs transition-all shadow-md shadow-emerald-600/20 inline-flex items-center gap-1.5 disabled:opacity-50"
                          title="Generar ticket e incorporar a la cola de espera"
                        >
                          <Ticket className="w-3.5 h-3.5" />
                          <span>{admittingId === app.id ? 'Generando...' : 'Ingresar a Sala'}</span>
                        </button>
                      ) : (
                        <span className="text-[11px] text-emerald-600 font-bold">✔ En Circulación</span>
                      )}
                    </td>
                  </tr>
                );
              })}

              {todayAppointments.length === 0 && !loading && (
                <tr>
                  <td colSpan={6} className="p-12 text-center space-y-2">
                    <Calendar className="w-8 h-8 text-slate-300 mx-auto" />
                    <p className="text-sm font-bold text-slate-700">No hay citas programadas para hoy</p>
                    <p className="text-xs text-slate-400 max-w-md mx-auto">
                      Los pacientes que reserven un turno para la fecha de hoy desde el enlace online aparecerán aquí con sus datos y motivo de consulta.
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* MODAL 1: QR GIGANTE PARA QUE EL PACIENTE SAQUE TURNOS ONLINE */}
      {showQrModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-2xl text-center">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-sky-600 block">
                  Autogestión de Turnos
                </span>
                <h3 className="text-lg font-black text-slate-900 mt-0.5">Escaneá para Sacar Turno</h3>
              </div>
              <button
                onClick={() => setShowQrModal(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-xl hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Código QR generado */}
            <div className="bg-slate-50 border-2 border-slate-200 p-4 rounded-2xl mx-auto inline-block shadow-inner">
              <img
                src={qrOnlineBookingUrl}
                alt="QR Turnos Online"
                className="w-56 h-56 mx-auto rounded-lg"
              />
            </div>

            <div className="space-y-1 text-xs text-slate-500">
              <p className="font-semibold text-slate-800">Apuntá la cámara de tu celular al código QR</p>
              <p className="text-[11px]">Accedé al portal web oficial para reservar tus futuros turnos y consultas médicas.</p>
            </div>

            <div className="pt-2 border-t border-slate-100 flex gap-2">
              <button
                onClick={handleCopyLink}
                className="flex-1 py-2 rounded-xl text-xs font-bold border border-slate-200 hover:bg-slate-50 text-slate-700 flex items-center justify-center gap-1.5 transition-colors"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedLink ? '¡Copiado!' : 'Copiar Link'}</span>
              </button>

              <button
                onClick={() => setShowQrModal(false)}
                className="flex-1 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors"
              >
                Listo
              </button>
            </div>
          </div>
        </div>
      )}

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
