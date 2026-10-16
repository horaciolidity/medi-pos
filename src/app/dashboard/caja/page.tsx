'use client';

import { useState, useEffect } from 'react';
import {
  ShoppingCart, DollarSign, Plus, Lock, Unlock, AlertTriangle, ShieldAlert,
  Check, XCircle, Monitor, CreditCard, QrCode, Printer, Sparkles, CheckCircle2,
  X, ExternalLink, Smartphone, ArrowRight, RefreshCw, Receipt
} from 'lucide-react';

export default function CajaPage() {
  const [currentShift, setCurrentShift] = useState<any>(null);
  const [historicalShifts, setHistoricalShifts] = useState<any[]>([]);
  const [tariffs, setTariffs] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isReadOnly, setIsReadOnly] = useState(false);

  // Pantalla del Paciente / Mostrador POS
  const [showCustomerScreen, setShowCustomerScreen] = useState(false);
  const [customerConcept, setCustomerConcept] = useState('Coseguro Consulta Médica');
  const [customerAmount, setCustomerAmount] = useState('2500');
  const [customerMethod, setCustomerMethod] = useState<'ELECTRONICO' | 'EFECTIVO' | 'TARJETA'>('ELECTRONICO');
  const [customerPaid, setCustomerPaid] = useState(false);

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
      setUser(meData.user);
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

  const handleCustomerDirectPay = async () => {
    if (!customerAmount || Number(customerAmount) <= 0) {
      alert('Ingrese un importe válido.');
      return;
    }
    setError('');
    try {
      const pMethod = customerMethod === 'ELECTRONICO' ? 'MERCADOPAGO' : customerMethod === 'TARJETA' ? 'DEBIT_CARD' : 'CASH';
      const res = await fetch('/api/cash/movements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'INCOME',
          amount: Number(customerAmount),
          paymentMethod: pMethod,
          concept: customerConcept || 'Cobro Mostrador POS',
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al registrar cobro');
      setCustomerPaid(true);
      loadData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handlePrintReceipt = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(`
      <html>
        <head>
          <title>Comprobante de Cobro</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 24px; font-size: 13px; max-width: 320px; margin: 0 auto; color: #111; }
            .center { text-align: center; }
            .bold { font-weight: bold; }
            .line { border-top: 1px dashed #999; margin: 12px 0; }
            .row { display: flex; justify-content: space-between; margin-bottom: 6px; }
          </style>
        </head>
        <body>
          <div class="center bold" style="font-size:16px;">${user?.company?.name || 'CENTRO MÉDICO'}</div>
          <div class="center" style="font-size:11px; color:#555;">COMPROBANTE DE COBRO / COSEGURO</div>
          <div class="line"></div>
          <div class="row"><span>Fecha:</span><strong>${new Date().toLocaleString('es-AR')}</strong></div>
          <div class="row"><span>Concepto:</span><strong>${customerConcept}</strong></div>
          <div class="row"><span>Medio de Pago:</span><strong>${customerMethod}</strong></div>
          <div class="line"></div>
          <div class="row" style="font-size:16px;"><span>TOTAL:</span><strong style="font-size:18px;">ARS $${Number(customerAmount || 0).toLocaleString('es-AR')}</strong></div>
          <div class="line"></div>
          <div class="center" style="font-size:11px; color:#666;">
            Comprobante no válido como factura fiscal.<br/>
            ¡Muchas gracias por su visita!
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
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
              {/* Pantalla Cliente / Mostrador POS */}
              <button
                type="button"
                onClick={() => {
                  setCustomerPaid(false);
                  setShowCustomerScreen(true);
                }}
                className="bg-purple-600 hover:bg-purple-500 text-white font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-purple-600/20 transition-colors"
                title="Abrir pantalla orientada al paciente para cobro y QR"
              >
                <Monitor className="w-4 h-4" />
                <span>Pantalla Cliente & QR</span>
              </button>

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

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    if (!newMovement.amount) {
                      alert('Por favor ingrese un importe antes de proyectar');
                      return;
                    }
                    setCustomerAmount(newMovement.amount);
                    setCustomerConcept(newMovement.concept || 'Cobro de Prestación Médica');
                    if (newMovement.paymentMethod === 'MERCADOPAGO' || newMovement.paymentMethod === 'TRANSFER') {
                      setCustomerMethod('ELECTRONICO');
                    } else if (newMovement.paymentMethod === 'CASH') {
                      setCustomerMethod('EFECTIVO');
                    } else {
                      setCustomerMethod('TARJETA');
                    }
                    setCustomerPaid(false);
                    setShowMovementModal(false);
                    setShowCustomerScreen(true);
                  }}
                  className="px-3 py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition"
                >
                  <Monitor className="w-3.5 h-3.5" />
                  <span>Proyectar Pantalla Paciente (QR)</span>
                </button>
                <div className="flex items-center justify-end gap-2">
                  <button type="button" onClick={() => setShowMovementModal(false)} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-bold">
                    Cancelar
                  </button>
                  <button type="submit" className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl font-bold">
                    Guardar Cobro
                  </button>
                </div>
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

      {/* PANTALLA CLIENTE / MOSTRADOR POS & QR DINÁMICO */}
      {showCustomerScreen && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-3xl w-full shadow-2xl overflow-hidden text-white my-auto animate-in fade-in zoom-in-95 duration-200">
            {/* Header Orientado al Cliente */}
            <div className="bg-gradient-to-r from-purple-900/40 via-sky-900/30 to-slate-900 p-6 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-purple-600/30 border border-purple-500/40 flex items-center justify-center text-purple-300">
                  <Monitor className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                    <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-400 font-bold">Mostrador POS Activo</span>
                  </div>
                  <h2 className="text-xl font-black text-white tracking-tight">
                    {user?.company?.name || 'Centro Médico'}
                  </h2>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowCustomerScreen(false)}
                  className="w-9 h-9 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition"
                  title="Cerrar pantalla cliente"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Contenido Principal */}
            <div className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              {/* Columna Izquierda: Detalle de Cobro */}
              <div className="space-y-6">
                <div>
                  <span className="text-xs uppercase font-bold text-slate-400 tracking-wider">Concepto de Atención</span>
                  <div className="mt-1">
                    <input
                      type="text"
                      value={customerConcept}
                      onChange={(e) => setCustomerConcept(e.target.value)}
                      className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-slate-100 font-medium focus:outline-none focus:border-purple-500"
                      placeholder="Concepto..."
                    />
                  </div>
                </div>

                {/* Importe Gigante */}
                <div className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-5 text-center">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total a Pagar</span>
                  <div className="text-4xl sm:text-5xl font-black font-mono text-emerald-400 tracking-tight mt-1">
                    ARS ${Number(customerAmount || 0).toLocaleString('es-AR')}
                  </div>
                  <div className="mt-2 text-[11px] text-slate-400">
                    Importe final correspondiente a consulta o coseguro
                  </div>
                </div>

                {/* Selector de Medios de Pago */}
                <div className="space-y-2">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Seleccionar Medio</span>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setCustomerMethod('ELECTRONICO')}
                      className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition ${
                        customerMethod === 'ELECTRONICO'
                          ? 'bg-purple-600/30 border-purple-500 text-purple-200'
                          : 'bg-slate-800/60 border-slate-700/60 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <QrCode className="w-4 h-4" />
                      <span>QR / Transf.</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setCustomerMethod('EFECTIVO')}
                      className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition ${
                        customerMethod === 'EFECTIVO'
                          ? 'bg-emerald-600/30 border-emerald-500 text-emerald-200'
                          : 'bg-slate-800/60 border-slate-700/60 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <DollarSign className="w-4 h-4" />
                      <span>Efectivo</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setCustomerMethod('TARJETA')}
                      className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition ${
                        customerMethod === 'TARJETA'
                          ? 'bg-sky-600/30 border-sky-500 text-sky-200'
                          : 'bg-slate-800/60 border-slate-700/60 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <CreditCard className="w-4 h-4" />
                      <span>Tarjeta</span>
                    </button>
                  </div>
                </div>

                {/* Estado de Cobro */}
                {customerPaid ? (
                  <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-center space-y-3">
                    <div className="flex items-center justify-center gap-2 text-emerald-400 font-bold text-sm">
                      <CheckCircle2 className="w-5 h-5" />
                      <span>¡Pago Registrado en POS!</span>
                    </div>
                    <div className="flex justify-center gap-2">
                      <button
                        type="button"
                        onClick={handlePrintReceipt}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-emerald-600/20"
                      >
                        <Printer className="w-4 h-4" />
                        <span>Imprimir Comprobante</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setCustomerPaid(false);
                          setCustomerAmount('');
                          setCustomerConcept('Coseguro Consulta Médica');
                        }}
                        className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold text-xs flex items-center gap-1"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>Nuevo Cobro</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={handleCustomerDirectPay}
                    className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-2xl font-black text-sm flex items-center justify-center gap-2 shadow-xl shadow-emerald-600/25 transition active:scale-[0.98]"
                  >
                    <Check className="w-5 h-5" />
                    <span>Confirmar y Cobrar en Caja POS</span>
                  </button>
                )}
              </div>

              {/* Columna Derecha: QR Interoperable o Medio Dinámico */}
              <div className="flex flex-col items-center justify-center p-6 bg-slate-950/60 border border-slate-800/80 rounded-2xl text-center">
                {customerMethod === 'ELECTRONICO' ? (
                  <div className="space-y-4 w-full flex flex-col items-center">
                    <span className="text-xs font-bold text-purple-300 uppercase tracking-widest flex items-center gap-1.5">
                      <Smartphone className="w-4 h-4 text-purple-400" /> QR Interoperable
                    </span>

                    {/* QR Code dinámico */}
                    <div className="p-3 bg-white rounded-2xl shadow-2xl inline-block border-4 border-purple-500/30">
                      <img
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=clinica-${encodeURIComponent(user?.company?.name || 'pos')}-${customerAmount}`}
                        alt="QR Pago Interoperable"
                        className="w-48 h-48 rounded-lg"
                      />
                    </div>

                    <p className="text-xs text-slate-300 font-medium max-w-xs">
                      Escaneá desde <strong className="text-white">Mercado Pago, MODO, Cuenta DNI</strong> o cualquier banco
                    </p>

                    <div className="bg-slate-900 border border-slate-800 px-4 py-2 rounded-xl text-[11px] font-mono text-purple-300">
                      Alias: <strong>CLINICA.{user?.company?.slug ? user.company.slug.toUpperCase() : 'SALUD'}.MP</strong>
                    </div>
                  </div>
                ) : customerMethod === 'EFECTIVO' ? (
                  <div className="space-y-4 py-8">
                    <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto">
                      <DollarSign className="w-8 h-8" />
                    </div>
                    <h4 className="text-base font-bold text-white">Pago en Efectivo</h4>
                    <p className="text-xs text-slate-400 max-w-xs">
                      Por favor entregue el efectivo al personal de recepción para recibir su comprobante impreso.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4 py-8">
                    <div className="w-16 h-16 rounded-full bg-sky-500/10 border border-sky-500/30 text-sky-400 flex items-center justify-center mx-auto">
                      <CreditCard className="w-8 h-8" />
                    </div>
                    <h4 className="text-base font-bold text-white">Terminal de Tarjetas</h4>
                    <p className="text-xs text-slate-400 max-w-xs">
                      Acerque su tarjeta contactless o inserte chip en la terminal del mostrador.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Footer Orientado al Cliente */}
            <div className="p-4 bg-slate-950 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-500">
              <span className="flex items-center gap-1.5 font-medium">
                <Receipt className="w-3.5 h-3.5 text-purple-400" /> Terminal POS Segura y Auditada
              </span>
              <span>Todos los pagos emiten ticket de control</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
