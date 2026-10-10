'use client';

import { useState, useEffect } from 'react';
import { ShoppingCart, DollarSign, Plus, Lock, Unlock, AlertTriangle, ShieldAlert, Check, XCircle } from 'lucide-react';

export default function CajaPage() {
  const [currentShift, setCurrentShift] = useState<any>(null);
  const [historicalShifts, setHistoricalShifts] = useState<any[]>([]);
  const [tariffs, setTariffs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isReadOnly, setIsReadOnly] = useState(false);

  // Open / Close Shift Modals
  const [showOpenModal, setShowOpenModal] = useState(false);
  const [initialFund, setInitialFund] = useState('5000');

  const [showCloseModal, setShowCloseModal] = useState(false);
  const [actualFinalFund, setActualFinalFund] = useState('');
  const [closingNotes, setClosingNotes] = useState('');

  // New Movement Modal
  const [showMovementModal, setShowMovementModal] = useState(false);
  const [newMovement, setNewMovement] = useState({
    type: 'INCOME',
    amount: '',
    paymentMethod: 'CASH',
    concept: '',
  });

  // Void Movement
  const [voidingMovementId, setVoidingMovementId] = useState<string | null>(null);
  const [voidReason, setVoidReason] = useState('');

  const [error, setError] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [meRes, shiftRes, tariffRes] = await Promise.all([
        fetch('/api/auth/me'),
        fetch('/api/cash/shift'),
        fetch('/api/tariffs'),
      ]);

      const meData = await meRes.json();
      setIsReadOnly(meData.subscription?.isReadOnly || false);

      const shiftData = await shiftRes.json();
      setCurrentShift(shiftData.currentShift);
      setHistoricalShifts(shiftData.historicalShifts || []);

      const tariffData = await tariffRes.json();
      setTariffs(tariffData.tariffs || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenShift = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const res = await fetch('/api/cash/shift', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'OPEN',
          initialFund: Number(initialFund),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al abrir caja');

      setShowOpenModal(false);
      loadData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleCloseShift = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const res = await fetch('/api/cash/shift', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'CLOSE',
          actualFinalFund: Number(actualFinalFund),
          closingNotes,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al cerrar caja');

      setShowCloseModal(false);
      loadData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleCreateMovement = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const res = await fetch('/api/cash/movements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newMovement),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al registrar movimiento');

      setShowMovementModal(false);
      setNewMovement({ type: 'INCOME', amount: '', paymentMethod: 'CASH', concept: '' });
      loadData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleVoidMovement = async (movementId: string) => {
    if (!voidReason) return;
    setError('');

    try {
      const res = await fetch('/api/cash/movements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'VOID',
          movementId,
          voidReason,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al anular movimiento');

      setVoidingMovementId(null);
      setVoidReason('');
      loadData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <ShoppingCart className="w-6 h-6 text-sky-600" /> Caja POS & Arqueo de Turnos
          </h1>
          <p className="text-xs text-slate-500 mt-1">Cobro de prestaciones/coseguros, apertura/cierre de turno y anulaciones auditadas</p>
        </div>

        <div className="flex items-center gap-3">
          {!currentShift ? (
            <button
              onClick={() => {
                if (isReadOnly) {
                  alert('Acción bloqueada: Su suscripción está vencida (Modo Solo Lectura).');
                  return;
                }
                setShowOpenModal(true);
              }}
              disabled={isReadOnly}
              className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 shadow-lg ${
                isReadOnly ? 'bg-slate-300 text-slate-500 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20'
              }`}
            >
              <Unlock className="w-4 h-4" />
              <span>Abrir Caja POS</span>
            </button>
          ) : (
            <>
              <button
                onClick={() => {
                  if (isReadOnly) {
                    alert('Acción bloqueada: Su suscripción está vencida (Modo Solo Lectura).');
                    return;
                  }
                  setShowMovementModal(true);
                }}
                disabled={isReadOnly}
                className="bg-sky-600 hover:bg-sky-500 text-white font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-sky-600/20"
              >
                <Plus className="w-4 h-4" />
                <span>Registrar Cobro</span>
              </button>

              <button
                onClick={() => {
                  if (isReadOnly) {
                    alert('Acción bloqueada: Su suscripción está vencida (Modo Solo Lectura).');
                    return;
                  }
                  setShowCloseModal(true);
                }}
                disabled={isReadOnly}
                className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-2"
              >
                <Lock className="w-4 h-4" />
                <span>Cerrar & Arqueo</span>
              </button>
            </>
          )}
        </div>
      </div>

      {error && <div className="bg-red-50 text-red-700 p-3.5 rounded-xl text-xs border border-red-200">{error}</div>}

      {/* Current Shift Status Card */}
      {currentShift ? (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex justify-between items-center border-b border-slate-100 pb-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> Turno de Caja ABIERTO
              </span>
              <h3 className="text-base font-bold text-slate-900 mt-1">
                Operador: {currentShift.operator?.firstName} {currentShift.operator?.lastName}
              </h3>
            </div>

            <div className="text-right">
              <span className="text-xs text-slate-400">Fondo Inicial:</span>
              <span className="text-lg font-black text-slate-900 block font-mono">ARS ${currentShift.initialFund}</span>
            </div>
          </div>

          {/* Movements Table */}
          <div className="space-y-2">
            <h4 className="font-bold text-xs text-slate-900 uppercase tracking-wider">Movimientos Registrados en el Turno</h4>
            <div className="overflow-hidden rounded-xl border border-slate-200 text-xs">
              <table className="w-full text-left">
                <thead className="bg-slate-50 font-bold text-slate-500 border-b">
                  <tr>
                    <th className="p-3">Hora</th>
                    <th className="p-3">Tipo</th>
                    <th className="p-3">Concepto</th>
                    <th className="p-3">Medio de Pago</th>
                    <th className="p-3 text-right">Importe</th>
                    <th className="p-3 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {currentShift.cashMovements?.map((m: any) => (
                    <tr key={m.id} className={m.isVoided ? 'bg-red-50/50 opacity-60' : 'hover:bg-slate-50'}>
                      <td className="p-3 font-mono text-slate-400">{new Date(m.createdAt).toLocaleTimeString()}</td>
                      <td className="p-3">
                        {m.type === 'INCOME' && <span className="text-emerald-600 font-bold">Cobro / Ingreso</span>}
                        {m.type === 'EXPENSE' && <span className="text-red-600 font-bold">Egreso</span>}
                        {m.type === 'REFUND' && <span className="text-amber-600 font-bold">Devolución</span>}
                      </td>
                      <td className="p-3 font-semibold text-slate-800">
                        {m.concept}
                        {m.isVoided && <span className="block text-[10px] text-red-600">ANULADO: {m.voidReason}</span>}
                      </td>
                      <td className="p-3 font-mono text-slate-600">{m.paymentMethod}</td>
                      <td className="p-3 text-right font-bold font-mono text-slate-900">
                        ARS ${m.amount}
                      </td>
                      <td className="p-3 text-right">
                        {!isReadOnly && !m.isVoided && (
                          <button
                            onClick={() => setVoidingMovementId(m.id)}
                            className="text-[11px] text-red-600 hover:underline font-bold"
                          >
                            Anular
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {(!currentShift.cashMovements || currentShift.cashMovements.length === 0) && (
                    <tr>
                      <td colSpan={6} className="p-6 text-center text-slate-400">Sin movimientos aún en esta caja.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-slate-50 border-2 border-dashed border-slate-200 p-8 rounded-2xl text-center space-y-3">
          <ShoppingCart className="w-8 h-8 text-slate-400 mx-auto" />
          <h3 className="font-bold text-slate-700 text-sm">No hay ninguna caja abierta en este momento</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Abra una nueva caja indicando el fondo inicial para comenzar a cobrar atenciones y prestaciones médicas.
          </p>
        </div>
      )}

      {/* Modal Anular Movimiento */}
      {voidingMovementId && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-slate-900">Anular Movimiento de Caja</h3>
            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Motivo Obligatorio de Anulación *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Error en el cobro / Cambio de medio de pago"
                  value={voidReason}
                  onChange={(e) => setVoidReason(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl p-2.5"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button onClick={() => setVoidingMovementId(null)} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-bold">
                  Cancelar
                </button>
                <button onClick={() => handleVoidMovement(voidingMovementId)} className="px-4 py-2 bg-red-600 text-white rounded-xl font-bold">
                  Confirmar Anulación
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Abrir Caja */}
      {showOpenModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold text-slate-900">Apertura de Caja POS</h3>
            <form onSubmit={handleOpenShift} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Fondo Inicial de Caja (ARS) *</label>
                <input
                  type="number"
                  required
                  value={initialFund}
                  onChange={(e) => setInitialFund(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl p-2.5 font-mono text-base font-bold text-slate-900"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowOpenModal(false)} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-bold">
                  Cancelar
                </button>
                <button type="submit" className="px-4 py-2 bg-emerald-600 text-white rounded-xl font-bold">
                  Abrir Caja
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Registrar Cobro */}
      {showMovementModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold text-slate-900">Registrar Cobro / Movimiento</h3>
            <form onSubmit={handleCreateMovement} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Cargar desde Arancel (Opcional)</label>
                <select
                  onChange={(e) => {
                    const tariff = tariffs.find((t) => t.id === e.target.value);
                    if (tariff) {
                      setNewMovement({
                        ...newMovement,
                        amount: String(tariff.copayAmount > 0 ? tariff.copayAmount : tariff.price),
                        concept: `Cobro ${tariff.name}`,
                      });
                    }
                  }}
                  className="w-full border border-slate-300 rounded-xl p-2.5"
                >
                  <option value="">-- Seleccionar de catálogo --</option>
                  {tariffs.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} (Precio ARS ${t.price} / Coseguro ARS ${t.copayAmount})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Importe (ARS) *</label>
                  <input
                    type="number"
                    required
                    value={newMovement.amount}
                    onChange={(e) => setNewMovement({ ...newMovement, amount: e.target.value })}
                    placeholder="3500"
                    className="w-full border border-slate-300 rounded-xl p-2.5 font-bold"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Medio de Pago</label>
                  <select
                    value={newMovement.paymentMethod}
                    onChange={(e) => setNewMovement({ ...newMovement, paymentMethod: e.target.value })}
                    className="w-full border border-slate-300 rounded-xl p-2.5 font-bold"
                  >
                    <option value="CASH">Efectivo</option>
                    <option value="DEBIT_CARD">Tarjeta Débito</option>
                    <option value="CREDIT_CARD">Tarjeta Crédito</option>
                    <option value="TRANSFER">Transferencia bancaria</option>
                    <option value="MERCADOPAGO">Mercado Pago</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Concepto *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Coseguro consulta clínica Juan Pérez"
                  value={newMovement.concept}
                  onChange={(e) => setNewMovement({ ...newMovement, concept: e.target.value })}
                  className="w-full border border-slate-300 rounded-xl p-2.5"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowMovementModal(false)} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-bold">
                  Cancelar
                </button>
                <button type="submit" className="px-4 py-2 bg-sky-600 text-white rounded-xl font-bold">
                  Guardar Cobro
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Cerrar & Arqueo */}
      {showCloseModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold text-slate-900">Cierre & Arqueo de Caja POS</h3>
            <form onSubmit={handleCloseShift} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Importe Contado en Arqueo (ARS) *</label>
                <input
                  type="number"
                  required
                  value={actualFinalFund}
                  onChange={(e) => setActualFinalFund(e.target.value)}
                  placeholder="Ingrese el monto físico contado"
                  className="w-full border border-slate-300 rounded-xl p-2.5 font-bold font-mono text-base text-slate-900"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Observaciones de Cierre</label>
                <textarea
                  rows={2}
                  value={closingNotes}
                  onChange={(e) => setClosingNotes(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl p-2.5"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowCloseModal(false)} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-bold">
                  Cancelar
                </button>
                <button type="submit" className="px-4 py-2 bg-slate-900 text-white rounded-xl font-bold">
                  Confirmar Cierre de Caja
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
