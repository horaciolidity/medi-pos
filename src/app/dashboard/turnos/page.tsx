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
  ArrowRight
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

  // Pantalla Mostrador / Cliente Recepción & Cobro de Coseguro
  const [activeCounterTurno, setActiveCounterTurno] = useState<any>(null);
  const [hasCoseguro, setHasCoseguro] = useState(false);
  const [coseguroAmount, setCoseguroAmount] = useState('2500');
  const [paymentMethod, setPaymentMethod] = useState<'EFECTIVO' | 'ELECTRONICO'>('ELECTRONICO');
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);

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

  // Abre la pantalla de atención en mostrador para cobrar coseguro
  const openCounterScreen = (t: any) => {
    setActiveCounterTurno(t);
    setHasCoseguro(true);
    setCoseguroAmount('2500');
    setPaymentMethod('ELECTRONICO');
    setPaymentConfirmed(false);
  };

  const handleConfirmCounterPayment = () => {
    setPaymentConfirmed(true);
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

  // URL del QR de pago de coseguro en mostrador (simulado o link de pago con datos de clínica)
  const qrPaymentData = `PAGO CLINIC POS | CLINICA: ${user?.company?.name || 'CENTRO MEDICO'} | TICKET: ${activeCounterTurno?.ticketNumber || 'TICKET'} | COSEGURO: $${coseguroAmount} ARS | PACIENTE: ${activeCounterTurno?.patient ? `${activeCounterTurno.patient.firstName} ${activeCounterTurno.patient.lastName}` : 'PACIENTE'}`;
  const qrPaymentUrl = `https://api.qrserver.com/v1/create-qr-code/?size=280x280&data=${encodeURIComponent(qrPaymentData)}`;

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
            Gestión de sala de espera, emisión de tickets, atención en mostrador y enlace online para pacientes.
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

          {/* Botón Mostrador / Pantalla Cliente */}
          <button
            onClick={() => {
              if (turnos.length > 0) {
                openCounterScreen(turnos[0]);
              } else {
                openCounterScreen({ ticketNumber: 'A001', patient: { firstName: 'Paciente', lastName: 'En Mostrador' } });
              }
            }}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-emerald-600/20 transition-colors"
          >
            <CreditCard className="w-4 h-4" />
            <span>Mostrador & Coseguro QR</span>
          </button>

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

      {/* BANNER: Enlace de Turnos para el Paciente (Turnos Futuros) */}
      <div className="bg-gradient-to-r from-sky-950 via-slate-900 to-slate-900 border border-sky-800/60 p-5 rounded-3xl text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1 max-w-xl">
          <div className="flex items-center gap-2">
            <span className="bg-sky-500/20 text-sky-300 border border-sky-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 font-mono">
              <Sparkles className="w-3 h-3" /> Turnos Futuros del Paciente
            </span>
            <span className="text-xs font-bold text-slate-200">Enlace Online para que el Paciente Saque Turno</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Compartí este enlace en recepción o mostrale el código QR para que los pacientes agenden sus próximas consultas desde su celular y reciban confirmación automática por WhatsApp.
          </p>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <button
            type="button"
            onClick={handleCopyLink}
            className="flex-1 md:flex-initial bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-bold px-3.5 py-2 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors"
          >
            {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-sky-400" />}
            <span>{copiedLink ? '¡Enlace Copiado!' : 'Copiar Enlace'}</span>
          </button>

          <button
            type="button"
            onClick={() => setShowQrModal(true)}
            className="bg-sky-500 hover:bg-sky-400 text-slate-950 font-black px-4 py-2 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all shadow-md shadow-sky-500/20 shrink-0"
          >
            <QrCode className="w-4 h-4" />
            <span>QR en Pantalla</span>
          </button>
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
              <th className="p-4 text-right">Acciones de Recepción</th>
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
                    {t.patient ? `${t.patient.firstName} ${t.patient.lastName}` : 'Anónimo / Consulta'}
                  </div>
                  {t.patient?.documentNumber && (
                    <div className="text-[10px] text-slate-400 font-mono">DNI: {t.patient.documentNumber}</div>
                  )}
                </td>
                <td className="p-4 font-mono text-slate-600">{t.box?.name || 'Recepción'}</td>
                <td className="p-4 text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    {/* Botón Mostrador & Coseguro */}
                    <button
                      onClick={() => openCounterScreen(t)}
                      className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 px-2.5 py-1.5 rounded-lg font-bold text-xs transition-colors flex items-center gap-1"
                      title="Atender en Mostrador y Cobro Coseguro con QR"
                    >
                      <CreditCard className="w-3.5 h-3.5" />
                      <span>Cobrar Coseguro</span>
                    </button>

                    {/* Botón Llamar a Box */}
                    {!isReadOnly && t.status === 'WAITING' && (
                      <button
                        onClick={() => {
                          if (!isPro) {
                            alert('El llamado desde boxes en tiempo real es exclusivo del Plan Pro.');
                            return;
                          }
                          setCallingTurno(t);
                        }}
                        className="bg-purple-50 text-purple-700 hover:bg-purple-600 hover:text-white px-3 py-1.5 rounded-lg font-bold text-xs transition-colors flex items-center gap-1"
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
                <td colSpan={5} className="p-8 text-center text-slate-400">No hay turnos registrados en la cola.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

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

      {/* MODAL 2: PANTALLA CLIENTE / MOSTRADOR RECEPCIÓN & QR DE PAGO DE COSEGURO */}
      {activeCounterTurno && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full p-6 md:p-8 space-y-6 shadow-2xl text-white">
            {/* Header del Mostrador */}
            <div className="flex justify-between items-start border-b border-slate-800 pb-4">
              <div>
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                  <CreditCard className="w-4 h-4" /> Mostrador de Recepción & Atención al Paciente
                </span>
                <h3 className="text-xl font-black text-white mt-1">
                  Atención Ticket <span className="text-sky-400 font-mono">{activeCounterTurno.ticketNumber}</span>
                </h3>
              </div>
              <button
                onClick={() => setActiveCounterTurno(null)}
                className="text-slate-400 hover:text-white p-1 rounded-xl hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Datos del Turno y Paciente */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-950 p-4 rounded-2xl border border-slate-800/80 text-xs">
              <div>
                <span className="text-slate-400 block text-[11px]">Paciente:</span>
                <p className="font-bold text-white text-sm">
                  {activeCounterTurno.patient ? `${activeCounterTurno.patient.firstName} ${activeCounterTurno.patient.lastName}` : 'Paciente en Mostrador'}
                </p>
                {activeCounterTurno.patient?.documentNumber && (
                  <p className="text-slate-400 font-mono mt-0.5">DNI: {activeCounterTurno.patient.documentNumber}</p>
                )}
              </div>

              <div>
                <span className="text-slate-400 block text-[11px]">Cobertura Médica:</span>
                <p className="font-semibold text-sky-400">
                  {activeCounterTurno.patient?.medicalInsuranceName || 'Particular / Sin cobertura'}
                </p>
                {activeCounterTurno.patient?.affiliateNumber && (
                  <p className="text-slate-400 font-mono mt-0.5">Nº Afiliado: {activeCounterTurno.patient.affiliateNumber}</p>
                )}
              </div>
            </div>

            {/* Configuración de Coseguro */}
            <div className="bg-slate-800/70 border border-slate-700/80 p-5 rounded-2xl space-y-4 text-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-amber-400" />
                  <span className="font-bold text-slate-200">Cobro de Coseguro / Arancel Médico</span>
                </div>
                <label className="flex items-center gap-2 cursor-pointer font-bold text-sky-400">
                  <input
                    type="checkbox"
                    checked={hasCoseguro}
                    onChange={(e) => setHasCoseguro(e.target.checked)}
                    className="rounded text-sky-500 focus:ring-sky-400"
                  />
                  <span>Aplica Coseguro</span>
                </label>
              </div>

              {hasCoseguro && (
                <div className="space-y-4 pt-2 border-t border-slate-700/60">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Monto Coseguro (ARS $)</label>
                      <input
                        type="number"
                        min={0}
                        step={100}
                        value={coseguroAmount}
                        onChange={(e) => setCoseguroAmount(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-amber-300 font-mono font-bold focus:outline-none focus:border-amber-400"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Medio de Pago</label>
                      <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-700">
                        <button
                          type="button"
                          onClick={() => setPaymentMethod('ELECTRONICO')}
                          className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                            paymentMethod === 'ELECTRONICO'
                              ? 'bg-emerald-500 text-slate-950 shadow-md font-extrabold'
                              : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          QR / Electrónico
                        </button>
                        <button
                          type="button"
                          onClick={() => setPaymentMethod('EFECTIVO')}
                          className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                            paymentMethod === 'EFECTIVO'
                              ? 'bg-emerald-500 text-slate-950 shadow-md font-extrabold'
                              : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          Efectivo
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* GENERADOR DE CÓDIGO QR EN PANTALLA PARA EL PACIENTE */}
                  {paymentMethod === 'ELECTRONICO' && (
                    <div className="bg-slate-950 border border-emerald-500/30 p-5 rounded-2xl flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left">
                      <div className="bg-white p-2.5 rounded-xl shadow-lg shrink-0">
                        <img
                          src={qrPaymentUrl}
                          alt="QR Pago Coseguro"
                          className="w-36 h-36 rounded"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full inline-block">
                          QR Interoperable / Transferencia
                        </span>
                        <h4 className="font-black text-white text-base">
                          Total a Pagar: ARS ${Number(coseguroAmount).toLocaleString('es-AR')}
                        </h4>
                        <p className="text-slate-400 text-[11px] leading-relaxed">
                          Mostrale este código al paciente para que escanee con <strong>Mercado Pago, MODO, Cuenta DNI</strong> o cualquier billetera bancaria.
                        </p>
                        <div className="text-[10px] text-slate-500 font-mono pt-1">
                          Clínica: {user?.company?.name || 'Clínica POS'} · Ticket {activeCounterTurno.ticketNumber}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Confirmación y Acciones */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => {
                  window.print();
                }}
                className="w-full sm:w-auto px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-colors border border-slate-700"
              >
                <Printer className="w-4 h-4" />
                <span>Imprimir Ticket Comprobante</span>
              </button>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => setActiveCounterTurno(null)}
                  className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl text-xs font-bold text-slate-400 hover:text-white bg-slate-800 transition-colors"
                >
                  Cerrar
                </button>

                <button
                  type="button"
                  onClick={() => {
                    handleConfirmCounterPayment();
                    alert(`¡Atención confirmada para el ticket ${activeCounterTurno.ticketNumber}! Coseguro registrado.`);
                    setActiveCounterTurno(null);
                  }}
                  className="flex-1 sm:flex-initial px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-xs transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Confirmar & Pasar a Espera</span>
                </button>
              </div>
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
