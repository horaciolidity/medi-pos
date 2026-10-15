'use client';

import { useState, useEffect } from 'react';
import {
  CalendarDays,
  Clock,
  User,
  Stethoscope,
  Phone,
  Mail,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Building2,
  ArrowRight,
  ArrowLeft,
  Calendar,
  Sparkles,
  ShieldCheck,
  CreditCard,
  MessageCircle,
  FileText,
  HeartPulse
} from 'lucide-react';

interface ServiceItem {
  id: string;
  name: string;
  specialty?: string;
  requiresCoseguro: boolean;
  coseguroAmount: number;
  durationMins: number;
  description?: string;
}

interface DoctorItem {
  id: string;
  firstName: string;
  lastName: string;
  specialty?: string;
  shiftHours?: string;
}

export default function PublicOnlineBookingPage() {
  const [loading, setLoading] = useState(true);
  const [clinic, setClinic] = useState<any>(null);
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [doctors, setDoctors] = useState<DoctorItem[]>([]);
  const [occupiedSlots, setOccupiedSlots] = useState<string[]>([]);
  const [errorMsg, setErrorMsg] = useState('');

  // Pasos: 1 = Servicio, 2 = Profesional & Horario, 3 = Datos del Paciente, 4 = Confirmado
  const [step, setStep] = useState(1);

  // Selecciones del turno
  const [selectedService, setSelectedService] = useState<ServiceItem | null>(null);
  const [selectedDoctorId, setSelectedDoctorId] = useState('');
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    today.setDate(today.getDate() + 1); // Por defecto mañana
    return today.toISOString().split('T')[0];
  });
  const [selectedTime, setSelectedTime] = useState('');

  // Formulario del Paciente
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    dni: '',
    phone: '',
    email: '',
    medicalInsuranceName: 'Particular',
    affiliateNumber: '',
    reason: '',
  });

  // Resultado
  const [submitting, setSubmitting] = useState(false);
  const [bookedResult, setBookedResult] = useState<any>(null);

  // Cargar datos de la clínica y servicios
  useEffect(() => {
    async function loadClinicData() {
      try {
        const params = new URLSearchParams(window.location.search);
        const slug = params.get('slug') || '';
        const companyId = params.get('clinic') || params.get('companyId') || '';

        const url = `/api/turnos-online?slug=${encodeURIComponent(slug)}&companyId=${encodeURIComponent(companyId)}&date=${selectedDate}`;
        const res = await fetch(url);
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || 'No se pudo cargar la clínica');
        }

        setClinic(data.company);
        setServices(data.services || []);
        setDoctors(data.doctors || []);
        setOccupiedSlots(data.occupiedSlots || []);
      } catch (err: any) {
        setErrorMsg(err.message || 'Error al conectar con la clínica');
      } finally {
        setLoading(false);
      }
    }
    loadClinicData();
  }, [selectedDate]);

  // Horarios disponibles (de 08:00 a 19:30 en bloques según duración)
  const generateSlots = () => {
    const slots = [];
    const startHour = 8;
    const endHour = 19;
    for (let h = startHour; h < endHour; h++) {
      slots.push(`${String(h).padStart(2, '0')}:00`);
      slots.push(`${String(h).padStart(2, '0')}:30`);
    }
    return slots;
  };

  const allSlots = generateSlots();

  const handleSelectService = (serv: ServiceItem) => {
    setSelectedService(serv);
    // Si el servicio especifica especialidad, buscar doctor afín
    if (serv.specialty) {
      const matchDoc = doctors.find((d) => d.specialty?.toLowerCase().includes(serv.specialty!.toLowerCase()));
      if (matchDoc) setSelectedDoctorId(matchDoc.id);
    }
    setStep(2);
  };

  const handleSelectSchedule = (time: string) => {
    setSelectedTime(time);
    setStep(3);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg('');

    try {
      const dateTimeIso = new Date(`${selectedDate}T${selectedTime}:00`).toISOString();

      const payload = {
        companyId: clinic?.id,
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        dni: formData.dni.trim(),
        phone: formData.phone.trim(),
        email: formData.email.trim() || null,
        medicalInsuranceName: formData.medicalInsuranceName,
        affiliateNumber: formData.affiliateNumber.trim() || null,
        serviceName: selectedService?.name,
        specialty: selectedService?.specialty,
        doctorId: selectedDoctorId || null,
        date: dateTimeIso,
        durationMins: selectedService?.durationMins || 20,
        reason: formData.reason.trim() || `Turno online: ${selectedService?.name}`,
        hasCoseguro: selectedService?.requiresCoseguro || false,
        coseguroAmount: selectedService?.coseguroAmount || 0,
      };

      const res = await fetch('/api/turnos-online', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Error al confirmar turno');
      }

      setBookedResult(data);
      setStep(4); // Pantalla de éxito
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al procesar reserva');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-sky-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-semibold text-slate-400">Cargando portal de turnos médicos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-sky-500 selection:text-slate-950">
      {/* Top Navbar */}
      <header className="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md sticky top-0 z-30 px-4 py-3 md:px-8">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-600 to-sky-400 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-sky-500/20">
              <HeartPulse className="w-5 h-5 text-slate-950" />
            </div>
            <div>
              <h1 className="font-extrabold text-sm text-white tracking-tight leading-tight">
                {clinic?.name || 'Clínica Médica'}
              </h1>
              <p className="text-[10px] text-sky-400 font-mono">Portal de Autogestión de Turnos</p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span className="hidden sm:inline">Paso {step} de 3</span>
            <div className="flex gap-1">
              {[1, 2, 3].map((s) => (
                <div
                  key={s}
                  className={`h-1.5 w-6 rounded-full transition-all ${
                    step >= s ? 'bg-sky-400' : 'bg-slate-800'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-3xl w-full mx-auto p-4 md:p-8 flex-1">
        {errorMsg && (
          <div className="mb-6 bg-rose-500/10 border border-rose-500/30 text-rose-300 p-4 rounded-2xl text-xs flex items-center gap-3 shadow-lg">
            <AlertCircle className="w-5 h-5 shrink-0 text-rose-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* PASO 1: SELECCIONAR SERVICIO / ESPECIALIDAD */}
        {step === 1 && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="text-center md:text-left space-y-1">
              <span className="text-xs font-bold text-sky-400 uppercase tracking-wider flex items-center justify-center md:justify-start gap-1.5">
                <Sparkles className="w-3.5 h-3.5" /> Paso 1 de 3
              </span>
              <h2 className="text-2xl font-black text-white tracking-tight">
                Seleccioná el servicio o consulta
              </h2>
              <p className="text-xs text-slate-400">
                Elegí la especialidad médica o práctica que necesitás realizar.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {services.map((serv) => (
                <div
                  key={serv.id}
                  onClick={() => handleSelectService(serv)}
                  className="group bg-slate-900/80 hover:bg-slate-800/90 border border-slate-800 hover:border-sky-500/50 p-5 rounded-2xl cursor-pointer transition-all duration-200 flex flex-col justify-between space-y-4 hover:shadow-xl hover:shadow-sky-500/5 hover:-translate-y-0.5"
                >
                  <div className="space-y-2">
                    <div className="flex justify-between items-start gap-2">
                      <h3 className="font-bold text-white text-base group-hover:text-sky-300 transition-colors">
                        {serv.name}
                      </h3>
                      {serv.requiresCoseguro ? (
                        <span className="bg-amber-500/15 text-amber-300 border border-amber-500/30 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full shrink-0">
                          Coseguro: ARS ${serv.coseguroAmount.toLocaleString('es-AR')}
                        </span>
                      ) : (
                        <span className="bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full shrink-0">
                          Sin Coseguro
                        </span>
                      )}
                    </div>
                    {serv.description && (
                      <p className="text-xs text-slate-400 leading-relaxed">
                        {serv.description}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-xs pt-3 border-t border-slate-800/60 text-slate-400">
                    <span className="flex items-center gap-1 font-mono text-[11px]">
                      <Clock className="w-3.5 h-3.5 text-slate-500" />
                      {serv.durationMins} minutos
                    </span>
                    <span className="text-sky-400 font-bold flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                      Elegir <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* PASO 2: PROFESIONAL, FECHA Y HORARIO */}
        {step === 2 && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-sky-400 uppercase tracking-wider">
                  Paso 2 de 3 · {selectedService?.name}
                </span>
                <h2 className="text-2xl font-black text-white tracking-tight mt-0.5">
                  Elegí la fecha y el horario
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setStep(1)}
                className="text-xs font-bold text-slate-400 hover:text-white flex items-center gap-1 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Cambiar servicio
              </button>
            </div>

            {/* Selector de Médico */}
            <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl space-y-2">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Stethoscope className="w-3.5 h-3.5 text-sky-400" />
                Profesional Tratante
              </label>
              <select
                value={selectedDoctorId}
                onChange={(e) => setSelectedDoctorId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
              >
                <option value="">Cualquier profesional disponible</option>
                {doctors.map((doc) => (
                  <option key={doc.id} value={doc.id}>
                    Dr/a. {doc.firstName} {doc.lastName} {doc.specialty ? `— ${doc.specialty}` : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Selector de Fecha */}
            <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl space-y-3">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-sky-400" />
                Día del Turno
              </label>
              <div className="flex flex-wrap items-center gap-2">
                <input
                  type="date"
                  min={new Date().toISOString().split('T')[0]}
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs font-semibold text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>
            </div>

            {/* Grilla de Horarios */}
            <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-2xl space-y-3">
              <span className="text-xs font-bold text-slate-300 block">
                Horarios Disponibles para el {new Date(selectedDate + 'T12:00:00').toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })}
              </span>

              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2 pt-1">
                {allSlots.map((time) => {
                  const isOccupied = occupiedSlots.includes(time);
                  const isSelected = selectedTime === time;

                  return (
                    <button
                      key={time}
                      type="button"
                      disabled={isOccupied}
                      onClick={() => handleSelectSchedule(time)}
                      className={`py-2.5 rounded-xl font-mono text-xs font-bold transition-all ${
                        isOccupied
                          ? 'bg-slate-950/40 text-slate-600 border border-slate-900 cursor-not-allowed line-through'
                          : isSelected
                          ? 'bg-sky-500 text-slate-950 shadow-lg shadow-sky-500/25 scale-105'
                          : 'bg-slate-950 hover:bg-sky-500/10 hover:border-sky-500/50 border border-slate-800 text-slate-200'
                      }`}
                    >
                      {time}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* PASO 3: DATOS DEL PACIENTE & CONFIRMACIÓN */}
        {step === 3 && (
          <form onSubmit={handleSubmit} className="space-y-6 animate-in fade-in duration-300">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-sky-400 uppercase tracking-wider">
                  Paso 3 de 3 · Datos Personales
                </span>
                <h2 className="text-2xl font-black text-white tracking-tight mt-0.5">
                  Completá tus datos para el turno
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setStep(2)}
                className="text-xs font-bold text-slate-400 hover:text-white flex items-center gap-1 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Modificar horario
              </button>
            </div>

            {/* Resumen Card */}
            <div className="bg-sky-950/30 border border-sky-800/40 p-4 rounded-2xl flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-sky-500/20 text-sky-300 flex items-center justify-center font-bold">
                  <CalendarDays className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-bold text-white">{selectedService?.name}</p>
                  <p className="text-slate-400 text-[11px]">
                    {new Date(selectedDate + 'T12:00:00').toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric', month: 'short' })} a las {selectedTime} hs
                  </p>
                </div>
              </div>

              <div className="text-right">
                {selectedService?.requiresCoseguro ? (
                  <span className="text-amber-300 font-mono font-bold block">
                    Coseguro: ARS ${selectedService.coseguroAmount.toLocaleString('es-AR')}
                  </span>
                ) : (
                  <span className="text-emerald-400 font-bold block">Sin coseguro requerido</span>
                )}
                <span className="text-[10px] text-slate-500">Se abona al ingresar a la clínica</span>
              </div>
            </div>

            {/* Inputs del Paciente */}
            <div className="bg-slate-900/90 border border-slate-800 p-6 rounded-3xl space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Nombre *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: Sofía"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Apellido *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: Rodríguez"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">DNI / Documento *</label>
                  <input
                    type="text"
                    required
                    placeholder="Sin puntos, ej: 38123456"
                    value={formData.dni}
                    onChange={(e) => setFormData({ ...formData, dni: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Teléfono Celular / WhatsApp *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="Ej: 11 3456 7890"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    Te enviaremos el comprobante y recordatorio por WhatsApp.
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Correo Electrónico (opcional)
                </label>
                <input
                  type="email"
                  placeholder="ejemplo@correo.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-800/80">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Obra Social / Cobertura
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: OSDE, Swiss Medical, Particular..."
                    value={formData.medicalInsuranceName}
                    onChange={(e) => setFormData({ ...formData, medicalInsuranceName: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Nº de Carnet / Afiliado (opcional)
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: 01-12345678-00"
                    value={formData.affiliateNumber}
                    onChange={(e) => setFormData({ ...formData, affiliateNumber: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Motivo de la Consulta o Síntomas (opcional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Ej: Dolor de garganta, control de rutina, certificado escolar..."
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="px-5 py-3 rounded-xl text-xs font-bold text-slate-400 hover:text-white bg-slate-900 border border-slate-800 transition-colors"
              >
                Volver
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="bg-sky-500 hover:bg-sky-400 disabled:opacity-50 text-slate-950 px-8 py-3 rounded-xl text-xs font-extrabold shadow-lg shadow-sky-500/25 transition-all flex items-center gap-2"
              >
                {submitting ? 'Confirmando Turno...' : 'Confirmar Reserva de Turno'}
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        )}

        {/* PASO 4: ÉXITO & COMPROBANTE WHATSAPP */}
        {step === 4 && bookedResult && (
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 md:p-10 space-y-6 text-center max-w-xl mx-auto shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 rounded-full flex items-center justify-center mx-auto shadow-xl shadow-emerald-500/10">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div className="space-y-1">
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest block">
                ¡Turno Reservado con Éxito!
              </span>
              <h2 className="text-2xl font-black text-white">
                Te esperamos en {clinic?.name}
              </h2>
              <p className="text-xs text-slate-400">
                Tu cita médica ha sido confirmada en el sistema. Guardá este comprobante.
              </p>
            </div>

            {/* Ticket de Turno */}
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 text-left space-y-3 text-xs">
              <div className="flex justify-between items-center border-b border-slate-800/80 pb-3">
                <span className="text-slate-400">Paciente:</span>
                <span className="font-bold text-white font-mono">{formData.firstName} {formData.lastName} (DNI {formData.dni})</span>
              </div>
              <div className="flex justify-between items-center border-b border-slate-800/80 pb-3">
                <span className="text-slate-400">Servicio:</span>
                <span className="font-bold text-sky-400">{selectedService?.name}</span>
              </div>
              <div className="flex justify-between items-center border-b border-slate-800/80 pb-3">
                <span className="text-slate-400">Fecha y Hora:</span>
                <span className="font-bold text-white font-mono">
                  {new Date(selectedDate + 'T12:00:00').toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })} a las {selectedTime} hs
                </span>
              </div>
              {clinic?.address && (
                <div className="flex justify-between items-center border-b border-slate-800/80 pb-3">
                  <span className="text-slate-400">Dirección:</span>
                  <span className="font-semibold text-slate-300">{clinic.address}</span>
                </div>
              )}
              <div className="flex justify-between items-center pt-1">
                <span className="text-slate-400">Coseguro / Arancel:</span>
                <span className="font-bold font-mono text-amber-300">
                  {selectedService?.requiresCoseguro
                    ? `ARS $${selectedService.coseguroAmount.toLocaleString('es-AR')} (Abonar en recepción)`
                    : 'Sin costo / Incluido'}
                </span>
              </div>
            </div>

            {/* Botón WhatsApp de Confirmación */}
            {bookedResult.whatsappUrl && (
              <a
                href={bookedResult.whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full inline-flex items-center justify-center gap-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 py-3.5 px-6 rounded-2xl font-black text-sm transition-all shadow-xl shadow-emerald-500/25"
              >
                <MessageCircle className="w-5 h-5 fill-current" />
                <span>Abrir Comprobante en WhatsApp</span>
              </a>
            )}

            <button
              onClick={() => {
                setStep(1);
                setSelectedService(null);
                setSelectedTime('');
                setBookedResult(null);
              }}
              className="text-xs text-slate-400 hover:text-white underline block mx-auto pt-2"
            >
              Reservar otro turno
            </button>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950 px-4 py-4 text-center text-[11px] text-slate-500">
        <p>© {new Date().getFullYear()} {clinic?.name || 'Clinic POS'} · Sistema de Autogestión de Turnos Médicos</p>
      </footer>
    </div>
  );
}
