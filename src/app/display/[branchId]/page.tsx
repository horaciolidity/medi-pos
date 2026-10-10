'use client';

import { useState, useEffect } from 'react';
import { Volume2, Monitor, AlertTriangle } from 'lucide-react';

export default function PublicTurneroDisplayPage({ params }: { params: { branchId: string } }) {
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState('');
  const [lastTicket, setLastTicket] = useState<string>('');

  const fetchDisplayData = async () => {
    try {
      const res = await fetch(`/api/turnos/public/${params.branchId}`);
      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || 'Error al consultar pantalla pública');
      }

      setData(result);
      setError('');

      // Si cambió el último ticket llamado, emitir alerta sonora sutil
      if (result.lastCalled?.ticketNumber && result.lastCalled.ticketNumber !== lastTicket) {
        setLastTicket(result.lastCalled.ticketNumber);
        try {
          const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
          audio.play().catch(() => {});
        } catch (e) {}
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  useEffect(() => {
    fetchDisplayData();
    const interval = setInterval(fetchDisplayData, 3000); // Polling cada 3 segundos en tiempo real
    return () => clearInterval(interval);
  }, [params.branchId]);

  if (error) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-6 text-center">
        <div className="max-w-md space-y-4 bg-slate-900 border border-slate-800 p-8 rounded-3xl">
          <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto" />
          <h2 className="text-xl font-bold text-white">Pantalla Pública No Disponible</h2>
          <p className="text-xs text-slate-400">{error}</p>
        </div>
      </div>
    );
  }

  const currentCalled = data?.lastCalled;
  const recentList = data?.recentTurnos || [];

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-between p-8 font-sans">
      {/* Top Header */}
      <header className="flex justify-between items-center border-b border-slate-800/80 pb-6">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight uppercase">{data?.clinicName || 'Centro Médico'}</h1>
          <p className="text-sm font-semibold text-slate-400 mt-1">{data?.branchName || 'Sede Central'} — Llamado a Consultorios</p>
        </div>
        <div className="flex items-center gap-3 bg-slate-900 border border-slate-800 px-4 py-2 rounded-2xl">
          <Monitor className="w-5 h-5 text-sky-400 animate-pulse" />
          <span className="text-xs font-mono font-bold text-sky-400 uppercase">Turnero Pro en Vivo</span>
        </div>
      </header>

      {/* Hero Display: Último Ticket Llamado */}
      <main className="my-auto grid grid-cols-1 lg:grid-cols-3 gap-8 items-center py-6">
        <div className="lg:col-span-2 bg-gradient-to-br from-slate-900 to-slate-950 border-2 border-sky-500/50 p-12 rounded-3xl text-center space-y-6 shadow-2xl shadow-sky-500/10">
          <span className="text-sm font-bold uppercase tracking-widest text-sky-400 flex items-center justify-center gap-2">
            <Volume2 className="w-5 h-5 animate-bounce" /> Llama en este momento
          </span>

          {currentCalled ? (
            <div className="space-y-4">
              <div className="text-8xl md:text-9xl font-black tracking-widest text-white font-mono drop-shadow-lg">
                {currentCalled.ticketNumber}
              </div>

              <div className="inline-block bg-sky-500 text-slate-950 font-black text-3xl md:text-4xl px-8 py-4 rounded-2xl shadow-lg">
                PASE A: {currentCalled.boxName}
              </div>
            </div>
          ) : (
            <div className="py-12 text-slate-500 text-2xl font-bold">Aguardando llamado...</div>
          )}
        </div>

        {/* Lista de Últimos Llamados */}
        <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-3xl space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800 pb-3">
            Últimos Llamados
          </h3>

          <div className="space-y-3">
            {recentList.slice(1).map((t: any) => (
              <div key={t.id} className="bg-slate-950 border border-slate-800/80 p-4 rounded-2xl flex justify-between items-center">
                <span className="text-3xl font-black font-mono text-white tracking-wider">{t.ticketNumber}</span>
                <span className="text-sm font-bold text-sky-400 bg-sky-500/10 border border-sky-500/20 px-3 py-1 rounded-xl">
                  {t.boxName}
                </span>
              </div>
            ))}

            {recentList.length <= 1 && (
              <p className="text-xs text-slate-500 text-center py-6">Sin otros llamados recientes.</p>
            )}
          </div>
        </div>
      </main>

      {/* Footer Sanitizado */}
      <footer className="border-t border-slate-800/80 pt-4 flex justify-between items-center text-xs text-slate-500">
        <span>Pacientes en espera: <strong className="text-white font-mono">{data?.waitingCount || 0}</strong></span>
        <span>Por su seguridad y privacidad, sólo se muestran números de ticket y consultorio.</span>
      </footer>
    </div>
  );
}
