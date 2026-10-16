'use client';

import { useState, useEffect, useCallback } from 'react';
import { Volume2, Monitor, AlertTriangle, Clock, Users } from 'lucide-react';

export default function PublicTurneroDisplayPage({ params }: { params: { branchId: string } }) {
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState('');
  const [lastTicket, setLastTicket] = useState<string>('');
  const [time, setTime] = useState<string>('');

  const fetchDisplayData = useCallback(async () => {
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
  }, [params.branchId, lastTicket]);

  useEffect(() => {
    fetchDisplayData();
    const interval = setInterval(fetchDisplayData, 3000);
    return () => clearInterval(interval);
  }, [params.branchId]);

  // Reloj en tiempo real
  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

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
  const waitingQueue = data?.waitingQueue || [];
  const waitingCount = data?.waitingCount ?? 0;

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col font-sans">
      {/* Top Header */}
      <header className="flex justify-between items-center px-8 py-5 border-b border-slate-800/80 shrink-0">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight uppercase">
            {data?.clinicName || 'Centro Médico'}
          </h1>
          <p className="text-sm font-semibold text-slate-400 mt-1">
            {data?.branchName || 'Sede Central'} — Sistema de Llamados
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="font-mono font-black text-4xl text-sky-400 tabular-nums tracking-widest">
              {time}
            </div>
          </div>
          <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 px-4 py-2 rounded-2xl">
            <Monitor className="w-5 h-5 text-sky-400 animate-pulse" />
            <span className="text-xs font-mono font-bold text-sky-400 uppercase">En Vivo</span>
          </div>
        </div>
      </header>

      {/* Main grid */}
      <main className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-0 min-h-0">

        {/* ===== COLUMNA PRINCIPAL: Ticket actual llamado ===== */}
        <div className="lg:col-span-2 flex flex-col items-center justify-center p-8 border-r border-slate-800/60">
          {currentCalled ? (
            /* Un ticket fue llamado a box */
            <div className="w-full max-w-xl text-center space-y-6">
              <span className="text-base font-bold uppercase tracking-widest text-sky-400 flex items-center justify-center gap-2 animate-pulse">
                <Volume2 className="w-6 h-6" /> Llamando en este momento
              </span>

              <div
                className="font-black font-mono text-white drop-shadow-2xl leading-none"
                style={{ fontSize: 'clamp(6rem, 20vw, 14rem)' }}
              >
                {currentCalled.ticketNumber}
              </div>

              <div className="bg-sky-500 text-slate-950 font-black rounded-3xl px-10 py-5 inline-block shadow-2xl shadow-sky-500/30"
                style={{ fontSize: 'clamp(1.5rem, 4vw, 2.5rem)' }}
              >
                PASE A: {currentCalled.boxName}
              </div>
            </div>
          ) : waitingQueue.length > 0 ? (
            /* Nadie llamado aún pero hay cola — mostrar próximo en espera */
            <div className="w-full max-w-xl text-center space-y-6">
              <span className="text-base font-bold uppercase tracking-widest text-amber-400 flex items-center justify-center gap-2">
                <Clock className="w-6 h-6" /> Próximo en ser atendido
              </span>

              <div
                className="font-black font-mono text-amber-300 drop-shadow-2xl leading-none opacity-80"
                style={{ fontSize: 'clamp(5rem, 18vw, 12rem)' }}
              >
                {waitingQueue[0]?.ticketNumber}
              </div>

              <div className="bg-amber-500/20 border-2 border-amber-500/40 text-amber-300 font-black rounded-3xl px-10 py-5 inline-block"
                style={{ fontSize: 'clamp(1.2rem, 3vw, 2rem)' }}
              >
                EN SALA DE ESPERA
              </div>
            </div>
          ) : (
            /* Cola vacía */
            <div className="text-center space-y-4">
              <Users className="w-20 h-20 text-slate-700 mx-auto" />
              <div className="text-slate-500 text-3xl font-bold">Sin turnos en espera</div>
              <p className="text-slate-600 text-sm">El sistema está en reposo. Los llamados aparecerán aquí en tiempo real.</p>
            </div>
          )}
        </div>

        {/* ===== COLUMNA DERECHA: Cola y últimos llamados ===== */}
        <div className="flex flex-col divide-y divide-slate-800/60">

          {/* Últimos llamados */}
          <div className="p-6 space-y-3 flex-1">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
              <Volume2 className="w-3.5 h-3.5 text-sky-400" /> Últimos Llamados
            </h3>
            <div className="space-y-2">
              {recentList.slice(0, 5).map((t: any, i: number) => (
                <div
                  key={t.id}
                  className={`flex justify-between items-center p-3.5 rounded-2xl border ${i === 0
                    ? 'bg-sky-500/10 border-sky-500/30 text-sky-300'
                    : 'bg-slate-900 border-slate-800 text-slate-400'
                  }`}
                >
                  <span className={`font-black font-mono tracking-wider ${i === 0 ? 'text-4xl text-sky-200' : 'text-2xl'}`}>
                    {t.ticketNumber}
                  </span>
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-xl ${i === 0
                    ? 'bg-sky-500/20 border border-sky-500/40 text-sky-300'
                    : 'bg-slate-800 text-slate-400'
                  }`}>
                    {t.boxName}
                  </span>
                </div>
              ))}
              {recentList.length === 0 && (
                <p className="text-xs text-slate-600 text-center py-6">Sin llamados aún.</p>
              )}
            </div>
          </div>

          {/* Cola de espera */}
          <div className="p-6 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 mb-3 flex items-center gap-2">
              <Users className="w-3.5 h-3.5" /> Cola de Espera
            </h3>
            {waitingQueue.length > 0 ? (
              <div className="space-y-2">
                {waitingQueue.map((t: any, i: number) => (
                  <div key={t.id} className="flex justify-between items-center bg-amber-500/5 border border-amber-500/20 p-3 rounded-xl">
                    <span className="font-black font-mono text-2xl text-amber-200">{t.ticketNumber}</span>
                    <span className="text-[10px] text-amber-500 font-bold">#{i + 1}</span>
                  </div>
                ))}
                {waitingCount > waitingQueue.length && (
                  <p className="text-[11px] text-slate-500 text-center pt-1">
                    +{waitingCount - waitingQueue.length} más en espera
                  </p>
                )}
              </div>
            ) : (
              <p className="text-xs text-slate-600 text-center py-3">Cola vacía.</p>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 px-8 py-4 flex justify-between items-center text-xs text-slate-500 shrink-0">
        <span>
          Pacientes en espera:{' '}
          <strong className="text-white font-mono text-sm">{waitingCount}</strong>
        </span>
        <span>Por su seguridad y privacidad, sólo se muestran números de ticket y consultorio.</span>
      </footer>
    </div>
  );
}
