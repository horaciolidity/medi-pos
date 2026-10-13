'use client';

import { useState, useEffect } from 'react';
import { Download, FileSpreadsheet, FileText, Code2, ShieldAlert, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function ExportarPage() {
  const [subscription, setSubscription] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState('');

  const [selectedModule, setSelectedModule] = useState('pacientes');
  const [selectedFormat, setSelectedFormat] = useState('xlsx');

  useEffect(() => {
    async function loadMe() {
      try {
        const res = await fetch('/api/auth/me');
        const data = await res.json();
        setSubscription(data.subscription);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadMe();
  }, []);

  const handleExport = async () => {
    setError('');
    setDownloading(true);

    try {
      const url = `/api/export?module=${selectedModule}&format=${selectedFormat}`;
      const res = await fetch(url);

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Error al descargar archivo de exportación');
      }

      const blob = await res.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `export_${selectedModule}_${new Date().toISOString().split('T')[0]}.${selectedFormat}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setDownloading(false);
    }
  };

  const isReadOnly = subscription?.isReadOnly;

  return (
    <div className="p-8 space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
          <Download className="w-6 h-6 text-sky-600" /> Exportación y Descarga de Datos
        </h1>
        <p className="text-xs text-slate-500 mt-1">Generación de reportes y exportación de información en formatos estándar</p>
      </div>

      {isReadOnly ? (
        <div className="bg-amber-50 border-2 border-amber-300 p-6 rounded-2xl space-y-3 text-amber-900 shadow-sm">
          <div className="flex items-center gap-3 font-bold text-base text-amber-950">
            <ShieldAlert className="w-6 h-6 text-amber-600 shrink-0" />
            <span>EXPORTACIÓN BLOQUEADA — Suscripción Vencida</span>
          </div>
          <p className="text-xs leading-relaxed">
            De acuerdo con las reglas de suscripción de la plataforma, cuando una clínica se encuentra en <strong>modo Solo Lectura</strong> por vencimiento o falta de pago, la generación y descarga de archivos (Excel, TXT, JSON) queda deshabilitada en la API y el frontend.
          </p>
          <p className="text-xs font-bold text-amber-950">
            Usted conserva el acceso completo para visualizar los datos en pantalla. Para volver a descargar exportaciones, solicite la regularización de la suscripción.
          </p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-3.5 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* 1. Seleccionar Módulo */}
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">1. Seleccionar Módulo / Reporte a Exportar</label>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {[
                {
                  id: 'atenciones_medicas',
                  label: 'Atenciones Médicas (EHR)',
                  desc: 'Fecha/hora, paciente, médico tratante, matrícula, turno y diagnóstico.',
                  tag: 'Clínica',
                },
                {
                  id: 'enfermeria',
                  label: 'Enfermería & Signos Vitales',
                  desc: 'Signos vitales, procedimientos, enfermero a cargo, turno y fecha/hora.',
                  tag: 'Enfermería',
                },
                {
                  id: 'movimientos_farmacia',
                  label: 'Farmacia & Insumos',
                  desc: 'Egresos e ingresos de stock, responsable, turno y motivo.',
                  tag: 'Farmacia',
                },
                {
                  id: 'personal',
                  label: 'Personal & Turnos',
                  desc: 'Padrón de médicos, enfermeros y farmacéuticos con matrículas y horarios.',
                  tag: 'RRHH',
                },
                {
                  id: 'pacientes',
                  label: 'Padrón de Pacientes',
                  desc: 'Datos de contacto, documento, obra social y número de afiliado.',
                  tag: 'Recepción',
                },
                {
                  id: 'caja',
                  label: 'Caja & Movimientos',
                  desc: 'Turnos de caja, fondo inicial/cierre, operadores y arqueos.',
                  tag: 'Finanzas',
                },
                {
                  id: 'turnos',
                  label: 'Turnos de Sala de Espera',
                  desc: 'Tickets emitidos, estado, tiempos y box de atención.',
                  tag: 'Recepción',
                },
              ].map((m) => (
                <div
                  key={m.id}
                  onClick={() => setSelectedModule(m.id)}
                  className={`p-3.5 rounded-xl border text-left cursor-pointer transition-all ${
                    selectedModule === m.id
                      ? 'border-sky-500 bg-sky-50 shadow-sm ring-1 ring-sky-500/20'
                      : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-xs font-bold ${selectedModule === m.id ? 'text-sky-900' : 'text-slate-900'}`}>
                      {m.label}
                    </span>
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-200 text-slate-700">
                      {m.tag}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 line-clamp-2 leading-tight">
                    {m.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* 2. Seleccionar Formato */}
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">2. Formato de Archivo</label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div
                onClick={() => setSelectedFormat('xlsx')}
                className={`p-4 rounded-xl border flex items-center gap-3 cursor-pointer transition-all ${
                  selectedFormat === 'xlsx'
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-900'
                    : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300'
                }`}
              >
                <FileSpreadsheet className="w-6 h-6 text-emerald-600" />
                <div>
                  <div className="font-bold text-xs">Excel (.xlsx)</div>
                  <div className="text-[10px] text-slate-400">Planilla de cálculo estándar</div>
                </div>
              </div>

              <div
                onClick={() => setSelectedFormat('txt')}
                className={`p-4 rounded-xl border flex items-center gap-3 cursor-pointer transition-all ${
                  selectedFormat === 'txt'
                    ? 'border-sky-500 bg-sky-50 text-sky-900'
                    : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300'
                }`}
              >
                <FileText className="w-6 h-6 text-sky-600" />
                <div>
                  <div className="font-bold text-xs">Texto (.txt)</div>
                  <div className="text-[10px] text-slate-400">Archivo plano delimitado</div>
                </div>
              </div>

              <div
                onClick={() => setSelectedFormat('json')}
                className={`p-4 rounded-xl border flex items-center gap-3 cursor-pointer transition-all ${
                  selectedFormat === 'json'
                    ? 'border-purple-500 bg-purple-50 text-purple-900'
                    : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300'
                }`}
              >
                <Code2 className="w-6 h-6 text-purple-600" />
                <div>
                  <div className="font-bold text-xs">JSON (.json)</div>
                  <div className="text-[10px] text-slate-400">Estructura para integración</div>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-2">
            <button
              onClick={handleExport}
              disabled={downloading}
              className="w-full bg-sky-600 hover:bg-sky-500 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-sky-600/20 flex items-center justify-center gap-2 text-sm transition-colors disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span>{downloading ? 'Generando descarga...' : `Descargar Reporte (${selectedFormat.toUpperCase()})`}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
