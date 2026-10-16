'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Building2,
  Printer,
  Save,
  CheckCircle2,
  AlertCircle,
  FileText,
  Phone,
  Mail,
  MapPin,
  Sparkles,
  QrCode,
  Sliders,
  RotateCcw,
  UserCheck,
  Lock,
  ChevronRight,
  Globe,
  MessageCircle,
  CalendarDays,
  Plus,
  Trash2,
  Copy,
  Check,
  ExternalLink,
  DollarSign,
  Stethoscope,
  Clock,
  Send
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

export default function ConfiguracionEmpresaTicketPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [activeTab, setActiveTab] = useState<'EMPRESA_TICKET' | 'TURNOS_WHATSAPP' | 'BOXES'>('EMPRESA_TICKET');
  const [copiedLink, setCopiedLink] = useState(false);

  // Boxes / Consultorios
  const [boxes, setBoxes] = useState<any[]>([]);
  const [newBoxName, setNewBoxName] = useState('');
  const [newBoxCode, setNewBoxCode] = useState('');
  const [savingBox, setSavingBox] = useState(false);

  // Datos Empresa
  const [company, setCompany] = useState({
    id: '',
    name: '',
    razonSocial: '',
    cuit: '',
    fiscalCondition: 'Monotributo',
    address: '',
    phone: '',
    email: '',
    logoUrl: '',
    ticketHeader: '',
    ticketFooter: '',
    slug: '',
    onlineBookingEnabled: true,
  });

  // Configuración de Ticket Térmico
  const [ticketOptions, setTicketOptions] = useState({
    paperSize: '80mm', // '80mm' | '58mm'
    subtitle: 'Atención Médica & Consultorios Externos',
    fiscalNotice: 'COMPROBANTE NO FISCAL - TICKET DE ATENCIÓN',
    showCuit: true,
    showAddress: true,
    showPhone: true,
    showEmail: true,
    showPatientDni: true,
    showHealthInsurance: true,
    showDateTime: true,
    showBarcode: true,
    autoPrint: false,
    fontSize: 'normal', // 'normal' | 'compact'
  });

  // Servicios habilitados para reserva online
  const [onlineServices, setOnlineServices] = useState<ServiceItem[]>([
    {
      id: 'serv-1',
      name: 'Consulta Médica General',
      specialty: 'Clínica Médica',
      requiresCoseguro: false,
      coseguroAmount: 0,
      durationMins: 20,
      description: 'Control clínico de rutina y prescripción de recetas',
    },
    {
      id: 'serv-2',
      name: 'Pediatría',
      specialty: 'Pediatría',
      requiresCoseguro: true,
      coseguroAmount: 2500,
      durationMins: 30,
      description: 'Atención integral pediátrica y controles de crecimiento',
    },
    {
      id: 'serv-3',
      name: 'Cardiología & ECG',
      specialty: 'Cardiología',
      requiresCoseguro: true,
      coseguroAmount: 4000,
      durationMins: 30,
      description: 'Evaluación cardiológica integral y apto físico',
    },
  ]);

  // Formulario para agregar servicio
  const [newService, setNewService] = useState({
    name: '',
    specialty: '',
    requiresCoseguro: false,
    coseguroAmount: 0,
    durationMins: 20,
    description: '',
  });

  // Configuración de WhatsApp
  const [whatsappConfig, setWhatsappConfig] = useState({
    phoneNumber: '',
    apiProvider: 'DIRECT_LINK', // 'DIRECT_LINK' | 'CALLMEBOT' | 'CUSTOM_WEBHOOK'
    apiKey: '',
    webhookUrl: '',
    customTemplate: '',
    autoSendEnabled: false,
  });

  useEffect(() => {
    async function loadCompanySettings() {
      try {
        const res = await fetch('/api/company/settings');
        if (!res.ok) throw new Error('No se pudo cargar la información de la empresa');
        const data = await res.json();
        if (data.company) {
          setCompany({
            id: data.company.id || '',
            name: data.company.name || '',
            razonSocial: data.company.razonSocial || '',
            cuit: data.company.cuit || '',
            fiscalCondition: data.company.fiscalCondition || 'Monotributo',
            address: data.company.address || '',
            phone: data.company.phone || '',
            email: data.company.email || '',
            logoUrl: data.company.logoUrl || '',
            ticketHeader: data.company.ticketHeader || data.company.name || '',
            ticketFooter: data.company.ticketFooter || '¡Gracias por su visita! Conserve este comprobante.',
            slug: data.company.slug || '',
            onlineBookingEnabled: data.company.onlineBookingEnabled !== false,
          });

          if (data.company.ticketConfigJson) {
            try {
              const parsed = JSON.parse(data.company.ticketConfigJson);
              setTicketOptions((prev) => ({ ...prev, ...parsed }));
            } catch (e) {
              console.error('Error parseando ticketConfigJson', e);
            }
          }

          if (data.company.onlineServicesJson) {
            try {
              const parsedServ = JSON.parse(data.company.onlineServicesJson);
              if (Array.isArray(parsedServ) && parsedServ.length > 0) {
                setOnlineServices(parsedServ);
              }
            } catch (e) {}
          }

          if (data.company.whatsappConfigJson) {
            try {
              const parsedWa = JSON.parse(data.company.whatsappConfigJson);
              setWhatsappConfig((prev) => ({
                ...prev,
                ...parsedWa,
                phoneNumber: parsedWa.phoneNumber || data.company.phone || '',
              }));
            } catch (e) {}
          } else if (data.company.phone) {
            setWhatsappConfig((prev) => ({ ...prev, phoneNumber: data.company.phone }));
          }
        }
      } catch (err: any) {
        setErrorMsg(err.message || 'Error al cargar ajustes');
      } finally {
        setLoading(false);
      }
    }

    loadCompanySettings();
    loadBoxes();
  }, []);

  const loadBoxes = async () => {
    try {
      const res = await fetch('/api/company/boxes');
      if (res.ok) {
        const data = await res.json();
        setBoxes(data.boxes || []);
      }
    } catch (e) {}
  };

  const handleAddBox = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBoxName.trim() || !newBoxCode.trim()) return;
    setSavingBox(true);
    try {
      const res = await fetch('/api/company/boxes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newBoxName.trim(), code: newBoxCode.trim().toUpperCase() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al crear el box');
      setNewBoxName('');
      setNewBoxCode('');
      loadBoxes();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setSavingBox(false);
    }
  };

  const handleDeleteBox = async (id: string) => {
    if (!confirm('¿Eliminar este box/consultorio?')) return;
    try {
      const res = await fetch('/api/company/boxes', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      if (res.ok) loadBoxes();
    } catch (e) {}
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg('');
    setErrorMsg('');

    try {
      const res = await fetch('/api/company/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...company,
          ticketConfigJson: JSON.stringify(ticketOptions),
          onlineServicesJson: JSON.stringify(onlineServices),
          whatsappConfigJson: JSON.stringify(whatsappConfig),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al guardar los ajustes');

      setSuccessMsg('Ajustes guardados correctamente.');
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  const handleAddService = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newService.name.trim()) return;

    const serv: ServiceItem = {
      id: `serv-${Date.now()}`,
      name: newService.name.trim(),
      specialty: newService.specialty.trim() || undefined,
      requiresCoseguro: newService.requiresCoseguro,
      coseguroAmount: newService.requiresCoseguro ? Number(newService.coseguroAmount) : 0,
      durationMins: Number(newService.durationMins) || 20,
      description: newService.description.trim() || undefined,
    };

    setOnlineServices([...onlineServices, serv]);
    setNewService({
      name: '',
      specialty: '',
      requiresCoseguro: false,
      coseguroAmount: 0,
      durationMins: 20,
      description: '',
    });
  };

  const handleDeleteService = (id: string) => {
    setOnlineServices(onlineServices.filter((s) => s.id !== id));
  };

  const handleCopyPublicLink = () => {
    if (typeof window === 'undefined') return;
    const origin = window.location.origin;
    const targetSlug = company.slug || company.id;
    const fullUrl = `${origin}/turnos-online?slug=${encodeURIComponent(targetSlug)}`;
    navigator.clipboard.writeText(fullUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const publicLink = typeof window !== 'undefined'
    ? `${window.location.origin}/turnos-online?slug=${encodeURIComponent(company.slug || company.id)}`
    : '/turnos-online';

  const handlePrintTest = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-500">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-sky-600 mb-2"></div>
        <p className="text-sm font-semibold">Cargando ajustes de empresa, turnos online y ticket...</p>
      </div>
    );
  }

  const is58mm = ticketOptions.paperSize === '58mm';

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header Principal */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sky-600 font-bold text-xs uppercase tracking-wider mb-1">
            <Sliders className="w-4 h-4" /> Ajustes del Sistema
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Configuración de Clínica, Turnos Online & Ticket
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Gestioná los datos fiscales de tu centro, habilitá el portal de turnos online para pacientes y configurá WhatsApp.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === 'EMPRESA_TICKET' && (
            <button
              type="button"
              onClick={handlePrintTest}
              className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 font-bold px-4 py-2 rounded-xl shadow-sm text-xs flex items-center gap-2 transition-colors"
            >
              <Printer className="w-4 h-4 text-sky-600" />
              <span>Imprimir Ticket de Prueba</span>
            </button>
          )}

          {activeTab === 'TURNOS_WHATSAPP' && (
            <a
              href={publicLink}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 font-bold px-4 py-2 rounded-xl shadow-sm text-xs flex items-center gap-2 transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              <span>Probar Portal Online</span>
            </a>
          )}
        </div>
      </div>

      {/* Banner de acceso a Gestión de Personal y Accesos */}
      <div className="bg-gradient-to-r from-slate-900 to-sky-950 border border-slate-800 p-5 rounded-2xl text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-lg">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="bg-sky-500/20 text-sky-300 border border-sky-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
              <Lock className="w-3 h-3" /> Cuentas & Accesos
            </span>
            <span className="text-xs font-bold text-slate-200">
              Personal por Área (Médicos, Enfermería, Recepción, Caja)
            </span>
          </div>
          <p className="text-xs text-slate-400 max-w-2xl">
            Pre-configurá los inicios de sesión con correo y contraseña para tu equipo. Cuando el médico o enfermero inicien sesión en sus puestos o consultorios, verán únicamente los módulos y pacientes correspondientes a su área.
          </p>
        </div>
        <Link
          href="/dashboard/personal"
          className="inline-flex items-center gap-1.5 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs transition-colors shrink-0 shadow-md shadow-sky-500/20"
        >
          <UserCheck className="w-4 h-4" />
          <span>Gestionar Personal & Roles</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Tabs de Navegación */}
      <div className="flex bg-slate-200/80 p-1 rounded-2xl w-full sm:w-fit">
        <button
          type="button"
          onClick={() => setActiveTab('EMPRESA_TICKET')}
          className={`flex-1 sm:flex-initial px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
            activeTab === 'EMPRESA_TICKET'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Building2 className="w-4 h-4 text-sky-600" />
          <span>Empresa & Ticket Térmico</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('TURNOS_WHATSAPP')}
          className={`flex-1 sm:flex-initial px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
            activeTab === 'TURNOS_WHATSAPP'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <MessageCircle className="w-4 h-4 text-emerald-600" />
          <span>Turnos Online para Pacientes & WhatsApp</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('BOXES')}
          className={`flex-1 sm:flex-initial px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
            activeTab === 'BOXES'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Stethoscope className="w-4 h-4 text-purple-600" />
          <span>Boxes & Consultorios</span>
        </button>
      </div>

      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-800 p-4 rounded-2xl flex items-center gap-3 text-xs shadow-sm">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span className="font-semibold">{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="bg-red-50 border border-red-300 text-red-800 p-4 rounded-2xl flex items-center gap-3 text-xs shadow-sm">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
          <span className="font-semibold">{errorMsg}</span>
        </div>
      )}

      {/* TAB 1: EMPRESA Y TICKET TÉRMICO */}
      {activeTab === 'EMPRESA_TICKET' && (
        <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Columna Izquierda: Formulario (7 cols) */}
          <div className="lg:col-span-7 space-y-8">
            {/* Card 1: Datos de la Empresa */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-5">
              <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
                <div className="p-2 bg-sky-50 text-sky-600 rounded-xl">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-base">Datos de la Empresa / Clínica</h3>
                  <p className="text-xs text-slate-400">Información fiscal y comercial para encabezados y comprobantes.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Nombre Comercial *</label>
                  <input
                    type="text"
                    required
                    value={company.name}
                    onChange={(e) => setCompany({ ...company, name: e.target.value })}
                    placeholder="Ej: Centro Médico San Martín"
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-800 font-medium focus:outline-none focus:border-sky-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Razón Social</label>
                  <input
                    type="text"
                    value={company.razonSocial}
                    onChange={(e) => setCompany({ ...company, razonSocial: e.target.value })}
                    placeholder="Ej: San Martín Salud S.A."
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-800 font-medium focus:outline-none focus:border-sky-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">CUIT</label>
                  <input
                    type="text"
                    value={company.cuit}
                    onChange={(e) => setCompany({ ...company, cuit: e.target.value })}
                    placeholder="Ej: 30-71234567-9"
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-800 font-medium font-mono focus:outline-none focus:border-sky-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Condición Fiscal</label>
                  <select
                    value={company.fiscalCondition}
                    onChange={(e) => setCompany({ ...company, fiscalCondition: e.target.value })}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-800 font-medium focus:outline-none focus:border-sky-500"
                  >
                    <option value="Responsable Inscripto">Responsable Inscripto</option>
                    <option value="Monotributo">Monotributo</option>
                    <option value="Exento">Exento</option>
                    <option value="Consumidor Final">Consumidor Final</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Dirección / Sede</label>
                  <input
                    type="text"
                    value={company.address}
                    onChange={(e) => setCompany({ ...company, address: e.target.value })}
                    placeholder="Ej: Av. Santa Fe 1234, CABA"
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-800 font-medium focus:outline-none focus:border-sky-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Teléfono de Contacto</label>
                  <input
                    type="text"
                    value={company.phone}
                    onChange={(e) => setCompany({ ...company, phone: e.target.value })}
                    placeholder="Ej: +54 11 4321-8765"
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-800 font-medium focus:outline-none focus:border-sky-500"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">Email Institucional</label>
                  <input
                    type="email"
                    value={company.email}
                    onChange={(e) => setCompany({ ...company, email: e.target.value })}
                    placeholder="Ej: contacto@centrosanmartin.com.ar"
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-800 font-medium focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>
            </div>

            {/* Card 2: Formato del Ticket Térmico */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-5">
              <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                  <Printer className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-base">Personalización del Ticket Térmico</h3>
                  <p className="text-xs text-slate-400">Configurá las líneas impresas para comprobantes de pago y de atención.</p>
                </div>
              </div>

              <div className="space-y-4 text-xs">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Ancho de Papel Térmico</label>
                    <select
                      value={ticketOptions.paperSize}
                      onChange={(e) => setTicketOptions({ ...ticketOptions, paperSize: e.target.value })}
                      className="w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-800 font-medium focus:outline-none focus:border-sky-500"
                    >
                      <option value="80mm">80 mm (Estándar POS)</option>
                      <option value="58mm">58 mm (Mini POS compacto)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Tamaño de Tipografía</label>
                    <select
                      value={ticketOptions.fontSize}
                      onChange={(e) => setTicketOptions({ ...ticketOptions, fontSize: e.target.value })}
                      className="w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-800 font-medium focus:outline-none focus:border-sky-500"
                    >
                      <option value="normal">Normal</option>
                      <option value="compact">Compacto / Ahorro de papel</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Encabezado de Ticket (Línea 1)</label>
                  <input
                    type="text"
                    value={company.ticketHeader}
                    onChange={(e) => setCompany({ ...company, ticketHeader: e.target.value })}
                    placeholder="Ej: CENTRO MÉDICO SAN MARTÍN"
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-800 font-medium focus:outline-none focus:border-sky-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Subtítulo del Ticket</label>
                  <input
                    type="text"
                    value={ticketOptions.subtitle}
                    onChange={(e) => setTicketOptions({ ...ticketOptions, subtitle: e.target.value })}
                    placeholder="Ej: Atención Médica & Consultorios Externos"
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-800 font-medium focus:outline-none focus:border-sky-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Pie de Página (Mensaje de despedida)</label>
                  <textarea
                    rows={2}
                    value={company.ticketFooter}
                    onChange={(e) => setCompany({ ...company, ticketFooter: e.target.value })}
                    placeholder="Ej: ¡Gracias por su visita! Conserve este comprobante para su control."
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-800 font-medium focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white font-black px-6 py-3 rounded-2xl shadow-lg shadow-sky-600/20 text-xs flex items-center gap-2 transition-all"
              >
                <Save className="w-4 h-4" />
                <span>{saving ? 'Guardando Ajustes...' : 'Guardar Ajustes de Empresa & Ticket'}</span>
              </button>
            </div>
          </div>

          {/* Columna Derecha: Vista Previa en Vivo del Ticket (5 cols) */}
          <div className="lg:col-span-5">
            <div className="sticky top-24 bg-slate-900 border border-slate-800 rounded-3xl p-6 text-white shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <span className="text-xs font-bold text-sky-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Printer className="w-3.5 h-3.5" /> Vista Previa del Ticket
                </span>
                <span className="bg-slate-800 text-slate-300 px-2 py-0.5 rounded text-[10px] font-mono">
                  {ticketOptions.paperSize}
                </span>
              </div>

              {/* Simulación física del papel térmico */}
              <div
                className={`bg-white text-slate-950 p-6 mx-auto rounded-lg shadow-2xl font-mono text-[11px] leading-tight space-y-3 ${
                  is58mm ? 'max-w-[260px]' : 'max-w-[340px]'
                }`}
              >
                <div className="text-center space-y-1">
                  <p className="font-extrabold text-sm uppercase">{company.ticketHeader || company.name || 'MI CLÍNICA'}</p>
                  <p className="text-[10px] text-slate-600">{ticketOptions.subtitle}</p>
                  {company.cuit && <p className="text-[10px]">CUIT: {company.cuit}</p>}
                  {company.address && <p className="text-[10px] text-slate-700">{company.address}</p>}
                </div>

                <div className="border-t border-dashed border-slate-400 pt-2 text-[10px] space-y-0.5">
                  <div className="flex justify-between">
                    <span>FECHA: 16/10/2026</span>
                    <span>HORA: 10:45 HS</span>
                  </div>
                  <p>PACIENTE: JUAN PÉREZ (DNI 35.123.456)</p>
                  <p>COBERTURA: OSDE (Plan 210)</p>
                </div>

                <div className="border-t border-b border-dashed border-slate-400 py-2 space-y-1">
                  <div className="flex justify-between font-bold">
                    <span>CONSULTA MÉDICA</span>
                    <span>$ 8.500,00</span>
                  </div>
                  <div className="flex justify-between text-slate-600 text-[10px]">
                    <span>COSEGURO / COPAGO</span>
                    <span>$ 2.500,00</span>
                  </div>
                  <div className="flex justify-between font-extrabold text-xs pt-1 border-t border-slate-300">
                    <span>TOTAL ABONADO</span>
                    <span>$ 11.000,00</span>
                  </div>
                </div>

                <div className="text-center text-[10px] space-y-1 pt-1">
                  <p className="font-bold">{ticketOptions.fiscalNotice}</p>
                  <p className="italic text-slate-600">{company.ticketFooter}</p>
                </div>
              </div>
            </div>
          </div>
        </form>
      )}

      {/* TAB 2: TURNOS ONLINE PARA PACIENTES & WHATSAPP */}
      {activeTab === 'TURNOS_WHATSAPP' && (
        <form onSubmit={handleSave} className="space-y-8 animate-in fade-in duration-200">
          {/* Card 1: Enlace Público para Pacientes */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 md:p-8 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-sky-50 text-sky-600 rounded-2xl">
                  <Globe className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-lg">Portal Público de Turnos para Pacientes</h3>
                  <p className="text-xs text-slate-500">
                    Compartí este enlace en tu web, redes sociales o por WhatsApp para que los pacientes reserven online.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={company.onlineBookingEnabled}
                    onChange={(e) => setCompany({ ...company, onlineBookingEnabled: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                </label>
                <span className="text-xs font-bold text-slate-700">
                  {company.onlineBookingEnabled ? 'Reservas Habilitadas' : 'Reservas Deshabilitadas'}
                </span>
              </div>
            </div>

            {/* Enlace y Slug */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
              <div className="md:col-span-4">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Identificador / Slug único de la Clínica
                </label>
                <input
                  type="text"
                  placeholder="ej: clinica-san-martin"
                  value={company.slug}
                  onChange={(e) => setCompany({ ...company, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-') })}
                  className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs font-mono font-bold text-slate-800 focus:outline-none focus:border-sky-500"
                />
              </div>

              <div className="md:col-span-8">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Enlace Web para compartir con tus pacientes
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={publicLink}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs font-mono text-slate-600 select-all"
                  />
                  <button
                    type="button"
                    onClick={handleCopyPublicLink}
                    className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-1.5 transition-colors shrink-0 shadow-sm"
                  >
                    {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    <span>{copiedLink ? '¡Copiado!' : 'Copiar'}</span>
                  </button>
                  <a
                    href={publicLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 font-bold px-3 py-2.5 rounded-xl text-xs flex items-center transition-colors shrink-0"
                    title="Abrir en pestaña nueva"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Configuración de Servicios & Coseguro */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 md:p-8 shadow-sm space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl">
                  <DollarSign className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-lg">Servicios Disponibles & Coseguros</h3>
                  <p className="text-xs text-slate-500">
                    Definí qué servicios y especialidades pueden reservar los pacientes y si llevan coseguro o copago obligatorio.
                  </p>
                </div>
              </div>
            </div>

            {/* Listado de Servicios Actuales */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Servicios Activos ({onlineServices.length})
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {onlineServices.map((serv) => (
                  <div
                    key={serv.id}
                    className="bg-slate-50 border border-slate-200 p-4 rounded-2xl flex items-start justify-between gap-3 hover:border-sky-300 transition-colors"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-black text-slate-900 text-sm">{serv.name}</span>
                        {serv.requiresCoseguro ? (
                          <span className="bg-amber-100 text-amber-800 border border-amber-300 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full">
                            Coseguro: ARS ${serv.coseguroAmount.toLocaleString('es-AR')}
                          </span>
                        ) : (
                          <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-full">
                            Sin Coseguro
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500">
                        {serv.specialty || 'General'} · Duración: {serv.durationMins} minutos
                      </p>
                      {serv.description && (
                        <p className="text-[11px] text-slate-400 italic">{serv.description}</p>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDeleteService(serv.id)}
                      className="text-slate-400 hover:text-rose-600 p-1 rounded-lg hover:bg-rose-50 transition-colors"
                      title="Eliminar servicio"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Formulario Agregar Nuevo Servicio */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
              <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Plus className="w-4 h-4 text-sky-600" />
                Agregar Nuevo Servicio a la Reserva Online
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nombre del Servicio *</label>
                  <input
                    type="text"
                    placeholder="Ej: Odontología / Control"
                    value={newService.name}
                    onChange={(e) => setNewService({ ...newService, name: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-sky-500 font-semibold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Especialidad</label>
                  <input
                    type="text"
                    placeholder="Ej: Odontología, Pediatría"
                    value={newService.specialty}
                    onChange={(e) => setNewService({ ...newService, specialty: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-sky-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Duración (minutos)</label>
                  <select
                    value={newService.durationMins}
                    onChange={(e) => setNewService({ ...newService, durationMins: Number(e.target.value) })}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-sky-500"
                  >
                    <option value={15}>15 minutos</option>
                    <option value={20}>20 minutos</option>
                    <option value={30}>30 minutos</option>
                    <option value={45}>45 minutos</option>
                    <option value={60}>60 minutos</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">¿Lleva Coseguro?</label>
                  <div className="flex items-center gap-3 pt-2">
                    <label className="flex items-center gap-1.5 cursor-pointer font-semibold text-slate-700">
                      <input
                        type="checkbox"
                        checked={newService.requiresCoseguro}
                        onChange={(e) => setNewService({ ...newService, requiresCoseguro: e.target.checked })}
                        className="rounded text-sky-600 focus:ring-sky-500"
                      />
                      <span>Aplica Coseguro</span>
                    </label>
                  </div>
                </div>

                {newService.requiresCoseguro && (
                  <div className="sm:col-span-2">
                    <label className="block font-bold text-amber-700 mb-1">
                      Monto del Coseguro / Arancel (ARS $)
                    </label>
                    <input
                      type="number"
                      min={0}
                      step={100}
                      placeholder="Ej: 3000"
                      value={newService.coseguroAmount}
                      onChange={(e) => setNewService({ ...newService, coseguroAmount: Number(e.target.value) })}
                      className="w-full bg-white border border-amber-300 rounded-xl px-3 py-2 text-slate-800 font-mono font-bold focus:outline-none focus:border-amber-500"
                    />
                  </div>
                )}

                <div className={newService.requiresCoseguro ? 'sm:col-span-2' : 'sm:col-span-4'}>
                  <label className="block font-bold text-slate-700 mb-1">Descripción Breve</label>
                  <input
                    type="text"
                    placeholder="Ej: Traer estudios previos y carnet de cobertura médica"
                    value={newService.description}
                    onChange={(e) => setNewService({ ...newService, description: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleAddService}
                  className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 transition-colors shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                  <span>Añadir Servicio</span>
                </button>
              </div>
            </div>
          </div>

          {/* Card 3: Configuración de WhatsApp */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 md:p-8 shadow-sm space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
                  <MessageCircle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-lg">Notificación de Turno por WhatsApp</h3>
                  <p className="text-xs text-slate-500">
                    Configurá el número oficial de WhatsApp de la clínica y el mensaje de confirmación que recibe el paciente.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
              <div className="space-y-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Número de WhatsApp de la Clínica *
                  </label>
                  <input
                    type="tel"
                    placeholder="Ej: +54 9 11 2345-6789"
                    value={whatsappConfig.phoneNumber}
                    onChange={(e) => setWhatsappConfig({ ...whatsappConfig, phoneNumber: e.target.value })}
                    className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-800 font-mono font-bold focus:outline-none focus:border-emerald-500"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    Número que verán los pacientes y desde donde se coordinará la atención.
                  </span>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Método de Envío / Proveedor</label>
                  <select
                    value={whatsappConfig.apiProvider}
                    onChange={(e) => setWhatsappConfig({ ...whatsappConfig, apiProvider: e.target.value as any })}
                    className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-800 font-semibold focus:outline-none focus:border-emerald-500"
                  >
                    <option value="DIRECT_LINK">Enlace Directo WhatsApp Web / App (Sin costo, 1 clic)</option>
                    <option value="CALLMEBOT">CallMeBot API (Gratuita para WhatsApp)</option>
                    <option value="CUSTOM_WEBHOOK">Webhook Personalizado / Evolution API / Twilio</option>
                  </select>
                </div>

                {whatsappConfig.apiProvider === 'CALLMEBOT' && (
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">API Key de CallMeBot</label>
                    <input
                      type="text"
                      placeholder="Pegá tu apikey obtenida de CallMeBot"
                      value={whatsappConfig.apiKey}
                      onChange={(e) => setWhatsappConfig({ ...whatsappConfig, apiKey: e.target.value })}
                      className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-800 font-mono focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                )}

                {whatsappConfig.apiProvider === 'CUSTOM_WEBHOOK' && (
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">URL del Webhook de WhatsApp</label>
                    <input
                      type="url"
                      placeholder="https://api.tuempresa.com/whatsapp/send"
                      value={whatsappConfig.webhookUrl}
                      onChange={(e) => setWhatsappConfig({ ...whatsappConfig, webhookUrl: e.target.value })}
                      className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-800 font-mono focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                )}

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Plantilla de Mensaje</label>
                  <textarea
                    rows={4}
                    placeholder="Dejar vacío para usar la plantilla médica predeterminada o personalizar usando: {clinica}, {paciente}, {fecha}, {hora}, {servicio}, {coseguro}, {direccion}."
                    value={whatsappConfig.customTemplate}
                    onChange={(e) => setWhatsappConfig({ ...whatsappConfig, customTemplate: e.target.value })}
                    className="w-full border border-slate-300 rounded-xl p-3 text-slate-800 focus:outline-none focus:border-emerald-500 font-mono text-[11px]"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    Variables disponibles: {'{clinica}'}, {'{paciente}'}, {'{fecha}'}, {'{hora}'}, {'{servicio}'}, {'{coseguro}'}, {'{direccion}'}
                  </span>
                </div>
              </div>

              {/* Vista Previa de WhatsApp */}
              <div className="bg-[#0b141a] rounded-3xl p-5 text-white shadow-xl flex flex-col justify-between space-y-4 border border-slate-800">
                <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center font-bold">
                    <MessageCircle className="w-5 h-5 fill-current" />
                  </div>
                  <div>
                    <p className="font-bold text-xs text-emerald-400">Notificación de WhatsApp</p>
                    <p className="text-[10px] text-slate-400">Mensaje que recibirá el paciente</p>
                  </div>
                </div>

                <div className="bg-[#1f2c34] p-4 rounded-2xl text-[11px] leading-relaxed text-slate-200 border-l-4 border-emerald-500 space-y-2">
                  <p className="font-bold text-white">🏥 CONFIRMACIÓN DE TURNO — {company.name.toUpperCase() || 'MI CLÍNICA'}</p>
                  <p>Hola <strong>Juan Pérez</strong>, tu turno médico ha sido reservado exitosamente:</p>
                  <div className="space-y-0.5 text-slate-300">
                    <p>📅 <strong>Fecha:</strong> Viernes 16 de Octubre</p>
                    <p>⏰ <strong>Horario:</strong> 10:30 hs</p>
                    <p>🩺 <strong>Servicio:</strong> Consulta Pediátrica</p>
                    <p>💵 <strong>Coseguro a abonar en recepción:</strong> ARS $2.500</p>
                    {company.address && <p>📍 <strong>Dirección:</strong> {company.address}</p>}
                  </div>
                  <p className="text-[10px] text-slate-400 italic pt-1">
                    ⚠️ Por favor presentarse con 10 minutos de anticipación con DNI y carnet.
                  </p>
                </div>

                <div className="text-right text-[10px] text-slate-500">
                  Formato compatible con WhatsApp Web & App Móvil
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-black px-8 py-3.5 rounded-2xl shadow-xl shadow-emerald-600/20 text-xs flex items-center gap-2 transition-all"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Guardando Ajustes...' : 'Guardar Configuración de Turnos & WhatsApp'}</span>
            </button>
          </div>
        </form>
      )}

      {/* TAB 3: BOXES / CONSULTORIOS */}
      {activeTab === 'BOXES' && (
        <div className="space-y-6">
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-950 to-slate-900 border border-purple-800/40 p-6 rounded-3xl text-white shadow-xl">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-purple-500/20 rounded-xl">
                <Stethoscope className="w-5 h-5 text-purple-300" />
              </div>
              <div>
                <h2 className="text-lg font-black">Boxes y Consultorios</h2>
                <p className="text-xs text-slate-400">
                  Configurá los consultorios, boxes de enfermería, laboratorio y demás áreas de atención. Luego podrás llamar pacientes a cada box desde el Turnero.
                </p>
              </div>
            </div>
          </div>

          {/* Agregar nuevo box */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
            <h3 className="font-black text-slate-900 text-base mb-4 flex items-center gap-2">
              <Plus className="w-5 h-5 text-purple-600" /> Agregar Box / Consultorio
            </h3>
            <form onSubmit={handleAddBox} className="flex flex-col sm:flex-row gap-3 text-xs">
              <div className="flex-1">
                <label className="block font-semibold text-slate-700 mb-1">Nombre del Box *</label>
                <input
                  type="text"
                  required
                  value={newBoxName}
                  onChange={(e) => setNewBoxName(e.target.value)}
                  placeholder="Ej: Consultorio 1, Box Enfermería, Laboratorio..."
                  className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-slate-800 font-medium focus:outline-none focus:border-purple-500"
                />
              </div>
              <div className="sm:w-40">
                <label className="block font-semibold text-slate-700 mb-1">Código Corto *</label>
                <input
                  type="text"
                  required
                  maxLength={8}
                  value={newBoxCode}
                  onChange={(e) => setNewBoxCode(e.target.value.toUpperCase())}
                  placeholder="Ej: BOX-1"
                  className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-slate-800 font-mono font-bold uppercase focus:outline-none focus:border-purple-500"
                />
              </div>
              <div className="flex items-end">
                <button
                  type="submit"
                  disabled={savingBox}
                  className="w-full sm:w-auto px-6 py-2.5 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-bold rounded-xl text-xs transition-colors shadow-lg shadow-purple-600/20 flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  {savingBox ? 'Guardando...' : 'Agregar Box'}
                </button>
              </div>
            </form>
          </div>

          {/* Lista de boxes existentes */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
            <h3 className="font-black text-slate-900 text-base mb-4">
              Boxes Configurados ({boxes.length})
            </h3>
            {boxes.length === 0 ? (
              <div className="text-center py-12 space-y-3">
                <div className="bg-slate-100 text-slate-400 w-12 h-12 rounded-2xl flex items-center justify-center mx-auto">
                  <Stethoscope className="w-6 h-6" />
                </div>
                <p className="text-sm font-bold text-slate-500">No hay boxes configurados</p>
                <p className="text-xs text-slate-400 max-w-xs mx-auto">
                  Agregá el primer box usando el formulario de arriba. Los boxes aparecerán en el Turnero para que la recepción pueda llamar a los pacientes.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {boxes.map((box: any) => (
                  <div key={box.id} className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex items-center justify-between hover:border-purple-300 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="bg-purple-100 text-purple-700 p-2.5 rounded-xl">
                        <Stethoscope className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 text-sm">{box.name}</p>
                        <p className="font-mono text-xs text-purple-600 font-bold">{box.code}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteBox(box.id)}
                      className="text-slate-400 hover:text-red-500 hover:bg-red-50 p-2 rounded-xl transition-colors"
                      title="Eliminar box"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Info: cómo se usan los boxes */}
          <div className="bg-sky-50 border border-sky-200 p-5 rounded-2xl text-xs text-sky-900 flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-sky-500 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold">¿Cómo se usan los boxes?</p>
              <p>En la pantalla de <strong>Recepción &amp; Turnero</strong>, cuando querés llamar a un paciente a consulta, seleccionás el box de destino y el sistema lo muestra en la <strong>Pantalla Pública</strong> con el código de turno.</p>
              <p className="text-sky-700">Ejemplos de boxes útiles: <em>Consultorio 1, Consultorio 2, Box Enfermería, Sala de Espera, Laboratorio, ECG, Farmacia.</em></p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
