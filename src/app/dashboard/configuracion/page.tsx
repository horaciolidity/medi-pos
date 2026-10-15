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
  ChevronRight
} from 'lucide-react';

export default function ConfiguracionEmpresaTicketPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Datos Empresa
  const [company, setCompany] = useState({
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

  useEffect(() => {
    async function loadCompanySettings() {
      try {
        const res = await fetch('/api/company/settings');
        if (!res.ok) throw new Error('No se pudo cargar la información de la empresa');
        const data = await res.json();
        if (data.company) {
          setCompany({
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
          });

          if (data.company.ticketConfigJson) {
            try {
              const parsed = JSON.parse(data.company.ticketConfigJson);
              setTicketOptions((prev) => ({ ...prev, ...parsed }));
            } catch (e) {
              console.error('Error parseando ticketConfigJson', e);
            }
          }
        }
      } catch (err: any) {
        setErrorMsg(err.message || 'Error al cargar ajustes');
      } finally {
        setLoading(false);
      }
    }

    loadCompanySettings();
  }, []);

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
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al guardar los ajustes');

      setSuccessMsg('¡Ajustes de la empresa y configuración de ticket guardados con éxito!');
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al guardar los datos');
    } finally {
      setSaving(false);
    }
  };

  const handlePrintTest = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-500">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-sky-600 mb-2"></div>
        <p className="text-sm font-semibold">Cargando ajustes de empresa y ticket...</p>
      </div>
    );
  }

  const is58mm = ticketOptions.paperSize === '58mm';

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sky-600 font-bold text-xs uppercase tracking-wider mb-1">
            <Sliders className="w-4 h-4" /> Ajustes del Sistema
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Ajustes de Cuenta Empresa & Ticket Térmico
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Personalizá los datos fiscales de tu clínica y diseñá la plantilla de impresión de tickets para tus pacientes y caja.
          </p>
        </div>

        <button
          type="button"
          onClick={handlePrintTest}
          className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 font-bold px-4 py-2.5 rounded-xl shadow-sm text-xs flex items-center gap-2 transition-colors self-start md:self-auto"
        >
          <Printer className="w-4 h-4 text-sky-600" />
          <span>Imprimir Ticket de Prueba</span>
        </button>
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

      <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Columna Izquierda: Formulario de Empresa y Ticket (7 cols) */}
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
                  placeholder="Ej: Salud San Martín S.A."
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-800 font-medium focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">CUIT Fiscal *</label>
                <input
                  type="text"
                  value={company.cuit}
                  onChange={(e) => setCompany({ ...company, cuit: e.target.value })}
                  placeholder="Ej: 30-71123456-7"
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-800 font-mono focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Condición Fiscal</label>
                <select
                  value={company.fiscalCondition}
                  onChange={(e) => setCompany({ ...company, fiscalCondition: e.target.value })}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-800 font-medium focus:outline-none focus:border-sky-500"
                >
                  <option value="Monotributo">Monotributo</option>
                  <option value="IVA Responsable Inscripto">IVA Responsable Inscripto</option>
                  <option value="IVA Exento">IVA Exento</option>
                  <option value="Consumidor Final">Consumidor Final</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Dirección / Localidad</label>
                <input
                  type="text"
                  value={company.address}
                  onChange={(e) => setCompany({ ...company, address: e.target.value })}
                  placeholder="Ej: Av. San Martín 1234, CABA"
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-800 font-medium focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Teléfono de Contacto</label>
                <input
                  type="text"
                  value={company.phone}
                  onChange={(e) => setCompany({ ...company, phone: e.target.value })}
                  placeholder="Ej: 011-4555-1234"
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-800 font-medium focus:outline-none focus:border-sky-500"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block font-semibold text-slate-700 mb-1">Email de Contacto</label>
                <input
                  type="email"
                  value={company.email}
                  onChange={(e) => setCompany({ ...company, email: e.target.value })}
                  placeholder="contacto@clinicamedica.com.ar"
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-800 font-medium focus:outline-none focus:border-sky-500"
                />
              </div>
            </div>
          </div>

          {/* Card 2: Personalización del Ticket Térmico */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-5">
            <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
              <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                <Printer className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-black text-slate-900 text-base">Personalización de Ticket Térmico</h3>
                <p className="text-xs text-slate-400">Diseño para impresoras de 80mm y 58mm (Epson, Star, Xprinter, etc.).</p>
              </div>
            </div>

            <div className="space-y-4 text-xs">
              {/* Formato de papel */}
              <div>
                <label className="block font-semibold text-slate-700 mb-2">Ancho del Papel de Impresora</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setTicketOptions({ ...ticketOptions, paperSize: '80mm' })}
                    className={`py-3 px-4 rounded-xl font-bold border text-center transition-all ${
                      ticketOptions.paperSize === '80mm'
                        ? 'border-sky-500 bg-sky-50 text-sky-700 shadow-sm'
                        : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <div className="text-sm">80 mm (Estándar POS)</div>
                    <div className="text-[10px] text-slate-500 font-normal">Recomendado para clínicas y recepción</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTicketOptions({ ...ticketOptions, paperSize: '58mm' })}
                    className={`py-3 px-4 rounded-xl font-bold border text-center transition-all ${
                      ticketOptions.paperSize === '58mm'
                        ? 'border-sky-500 bg-sky-50 text-sky-700 shadow-sm'
                        : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <div className="text-sm">58 mm (Mini Térmico)</div>
                    <div className="text-[10px] text-slate-500 font-normal">Para impresoras compactas de mostrador</div>
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Encabezado Principal del Ticket</label>
                <input
                  type="text"
                  value={company.ticketHeader}
                  onChange={(e) => setCompany({ ...company, ticketHeader: e.target.value })}
                  placeholder="Ej: CENTRO MÉDICO SAN MARTÍN"
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-800 font-bold focus:outline-none focus:border-sky-500 uppercase"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Subtítulo / Especialidad en Ticket</label>
                <input
                  type="text"
                  value={ticketOptions.subtitle}
                  onChange={(e) => setTicketOptions({ ...ticketOptions, subtitle: e.target.value })}
                  placeholder="Ej: Guardia Médica & Consultorios Externos"
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Leyenda Fiscal / Tipo de Ticket</label>
                <input
                  type="text"
                  value={ticketOptions.fiscalNotice}
                  onChange={(e) => setTicketOptions({ ...ticketOptions, fiscalNotice: e.target.value })}
                  placeholder="Ej: DOCUMENTO NO FISCAL - TICKET DE ATENCIÓN"
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-800 font-mono text-[11px] focus:outline-none focus:border-sky-500 uppercase"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Pie de Página / Saludo Final</label>
                <textarea
                  rows={2}
                  value={company.ticketFooter}
                  onChange={(e) => setCompany({ ...company, ticketFooter: e.target.value })}
                  placeholder="Ej: ¡Gracias por su visita! Por favor conserve este comprobante para ingresar a su consulta."
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-sky-500"
                />
              </div>

              {/* Casillas de visualización */}
              <div className="pt-2 border-t border-slate-100">
                <span className="block font-bold text-slate-800 mb-2">Datos a Incluir en el Ticket:</span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  <label className="flex items-center gap-2 cursor-pointer text-slate-700 font-medium">
                    <input
                      type="checkbox"
                      checked={ticketOptions.showCuit}
                      onChange={(e) => setTicketOptions({ ...ticketOptions, showCuit: e.target.checked })}
                      className="rounded text-sky-600 focus:ring-sky-500"
                    />
                    <span>Mostrar CUIT y Condición Fiscal</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer text-slate-700 font-medium">
                    <input
                      type="checkbox"
                      checked={ticketOptions.showAddress}
                      onChange={(e) => setTicketOptions({ ...ticketOptions, showAddress: e.target.checked })}
                      className="rounded text-sky-600 focus:ring-sky-500"
                    />
                    <span>Mostrar Dirección de la Clínica</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer text-slate-700 font-medium">
                    <input
                      type="checkbox"
                      checked={ticketOptions.showPhone}
                      onChange={(e) => setTicketOptions({ ...ticketOptions, showPhone: e.target.checked })}
                      className="rounded text-sky-600 focus:ring-sky-500"
                    />
                    <span>Mostrar Teléfono de Contacto</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer text-slate-700 font-medium">
                    <input
                      type="checkbox"
                      checked={ticketOptions.showPatientDni}
                      onChange={(e) => setTicketOptions({ ...ticketOptions, showPatientDni: e.target.checked })}
                      className="rounded text-sky-600 focus:ring-sky-500"
                    />
                    <span>Mostrar DNI del Paciente</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer text-slate-700 font-medium">
                    <input
                      type="checkbox"
                      checked={ticketOptions.showHealthInsurance}
                      onChange={(e) => setTicketOptions({ ...ticketOptions, showHealthInsurance: e.target.checked })}
                      className="rounded text-sky-600 focus:ring-sky-500"
                    />
                    <span>Mostrar Obra Social / Prepaga</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer text-slate-700 font-medium">
                    <input
                      type="checkbox"
                      checked={ticketOptions.showDateTime}
                      onChange={(e) => setTicketOptions({ ...ticketOptions, showDateTime: e.target.checked })}
                      className="rounded text-sky-600 focus:ring-sky-500"
                    />
                    <span>Mostrar Fecha y Hora exacta</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer text-slate-700 font-medium">
                    <input
                      type="checkbox"
                      checked={ticketOptions.showBarcode}
                      onChange={(e) => setTicketOptions({ ...ticketOptions, showBarcode: e.target.checked })}
                      className="rounded text-sky-600 focus:ring-sky-500"
                    />
                    <span>Incluir Código de Barras / Validación</span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="bg-sky-600 hover:bg-sky-500 text-white font-bold px-6 py-3 rounded-xl shadow-lg shadow-sky-600/20 text-xs flex items-center gap-2 transition-all disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Guardando Ajustes...' : 'Guardar Todos los Ajustes'}</span>
            </button>
          </div>
        </div>

        {/* Columna Derecha: Vista Previa Realista en Vivo del Ticket (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="sticky top-20">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                Vista Previa en Tiempo Real ({ticketOptions.paperSize})
              </span>
              <span className="text-[10px] bg-slate-200 text-slate-700 font-bold px-2 py-0.5 rounded-full">
                Simulador Térmico
              </span>
            </div>

            {/* Renderizado de Ticket Térmico Fotorrealista */}
            <div
              id="thermal-ticket-preview"
              className={`mx-auto bg-amber-50/50 text-slate-900 border border-slate-300 shadow-xl rounded-sm p-6 font-mono text-center transition-all ${
                is58mm ? 'max-w-[280px] text-[11px]' : 'max-w-[360px] text-xs'
              }`}
              style={{
                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
                backgroundImage: 'radial-gradient(#00000008 1px, transparent 0)',
                backgroundSize: '16px 16px',
              }}
            >
              {/* Borde dentado superior de corte de papel */}
              <div className="border-b-2 border-dashed border-slate-400 pb-3 mb-3">
                <h2 className="font-extrabold text-sm sm:text-base uppercase tracking-tight text-slate-900">
                  {company.ticketHeader || company.name || 'NOMBRE DE CLÍNICA'}
                </h2>
                {company.razonSocial && (
                  <p className="text-[10px] text-slate-600 uppercase mt-0.5">{company.razonSocial}</p>
                )}
                {ticketOptions.subtitle && (
                  <p className="text-[10px] text-slate-700 font-sans font-semibold mt-1">
                    {ticketOptions.subtitle}
                  </p>
                )}
              </div>

              {/* Datos Fiscales y Contacto en Ticket */}
              <div className="text-[10px] text-slate-700 space-y-0.5 mb-3 leading-tight">
                {ticketOptions.showCuit && company.cuit && (
                  <div>CUIT: {company.cuit} — {company.fiscalCondition}</div>
                )}
                {ticketOptions.showAddress && company.address && (
                  <div>{company.address}</div>
                )}
                {ticketOptions.showPhone && company.phone && (
                  <div>Tel: {company.phone}</div>
                )}
              </div>

              {/* Leyenda Fiscal / Tipo */}
              <div className="py-1 px-2 border-y border-dashed border-slate-400 my-2 text-[9px] font-bold uppercase tracking-wider text-slate-600">
                {ticketOptions.fiscalNotice}
              </div>

              {/* Número de Turno / Box Destacado */}
              <div className="my-4 py-2 bg-slate-100/70 border border-slate-300 rounded">
                <span className="text-[10px] font-sans font-bold uppercase text-slate-500 block">Número de Turno</span>
                <span className="text-3xl font-black text-slate-950 font-mono tracking-wider">A-042</span>
                <span className="text-[10px] font-bold text-sky-700 block mt-0.5">Box 2 — Consulta Médica</span>
              </div>

              {/* Datos de Atención Simulados */}
              <div className="text-left text-[11px] space-y-1 border-b border-dashed border-slate-400 pb-3 mb-3">
                <div className="flex justify-between">
                  <span className="text-slate-500">Paciente:</span>
                  <span className="font-bold">Gómez, Carlos</span>
                </div>
                {ticketOptions.showPatientDni && (
                  <div className="flex justify-between text-[10px]">
                    <span className="text-slate-500">DNI:</span>
                    <span className="font-semibold">32.845.119</span>
                  </div>
                )}
                {ticketOptions.showHealthInsurance && (
                  <div className="flex justify-between text-[10px]">
                    <span className="text-slate-500">Cobertura:</span>
                    <span className="font-semibold">OSDE 310 (Gravado)</span>
                  </div>
                )}
                <div className="flex justify-between text-[10px]">
                  <span className="text-slate-500">Profesional:</span>
                  <span className="font-semibold">Dra. M. Fernández</span>
                </div>
                {ticketOptions.showDateTime && (
                  <div className="flex justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-200">
                    <span>Fecha: {new Date().toLocaleDateString()}</span>
                    <span>Hora: {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                )}
              </div>

              {/* Pie de Ticket */}
              {company.ticketFooter && (
                <div className="text-[10px] text-slate-700 italic px-2 mb-3 leading-snug">
                  "{company.ticketFooter}"
                </div>
              )}

              {/* Código de Barras / QR Simulado */}
              {ticketOptions.showBarcode && (
                <div className="pt-2 flex flex-col items-center justify-center">
                  <div className="h-9 w-44 bg-slate-900 flex items-center justify-center text-white text-[9px] font-mono tracking-widest px-2">
                    ||| | |||| | || |||| | | |||
                  </div>
                  <span className="text-[8px] text-slate-500 mt-0.5 font-mono">TKT-2026-004289</span>
                </div>
              )}

              {/* Pie con corte simulado */}
              <div className="mt-4 pt-2 border-t border-dotted border-slate-400 text-[8px] text-slate-400 uppercase">
                *** FIN DEL COMPROBANTE ***
              </div>
            </div>

            <p className="text-center text-[10px] text-slate-400 mt-2">
              💡 Este formato se aplicará automáticamente a los tickets de recepción, turnero y caja POS.
            </p>
          </div>
        </div>
      </form>

      {/* Estilos para impresión térmica */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #thermal-ticket-preview, #thermal-ticket-preview * {
            visibility: visible;
          }
          #thermal-ticket-preview {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            border: none;
            box-shadow: none;
          }
        }
      `}</style>
    </div>
  );
}
