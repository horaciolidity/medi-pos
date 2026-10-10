'use client';

import { useState, useEffect } from 'react';
import { Package, Plus, ArrowUpRight, ArrowDownRight, AlertTriangle, Search, AlertCircle } from 'lucide-react';

export default function FarmaciaPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isReadOnly, setIsReadOnly] = useState(false);

  const [showAddModal, setShowAddModal] = useState(false);
  const [newProduct, setNewProduct] = useState({
    internalCode: '',
    name: '',
    category: 'Medicamento',
    unit: 'Caja',
    initialStock: '10',
    minStockAlert: '5',
    batchNumber: '',
    expirationDate: '',
  });

  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [adjustType, setAdjustType] = useState('ENTRY');
  const [adjustQty, setAdjustQty] = useState('1');
  const [adjustReason, setAdjustReason] = useState('');

  const [error, setError] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [meRes, pRes] = await Promise.all([
        fetch('/api/auth/me'),
        fetch('/api/pharmacy/products'),
      ]);

      const meData = await meRes.json();
      setIsReadOnly(meData.subscription?.isReadOnly || false);

      const pData = await pRes.json();
      setProducts(pData.products || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const res = await fetch('/api/pharmacy/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newProduct),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al guardar producto');

      setShowAddModal(false);
      loadData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleAdjustStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;
    setError('');

    try {
      const res = await fetch('/api/pharmacy/products', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: selectedProduct.id,
          type: adjustType,
          quantity: Number(adjustQty),
          reason: adjustReason,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al ajustar stock');

      setShowAdjustModal(false);
      loadData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Package className="w-6 h-6 text-sky-600" /> Farmacia, Insumos y Stock
          </h1>
          <p className="text-xs text-slate-500 mt-1">Control de catálogo, lotes con vencimientos y movimientos trazables de stock</p>
        </div>

        <button
          onClick={() => {
            if (isReadOnly) {
              alert('Acción bloqueada: Su suscripción está vencida (Modo Solo Lectura).');
              return;
            }
            setShowAddModal(true);
          }}
          disabled={isReadOnly}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all ${
            isReadOnly ? 'bg-slate-300 text-slate-500 cursor-not-allowed' : 'bg-sky-600 hover:bg-sky-500 text-white shadow-lg'
          }`}
        >
          <Plus className="w-4 h-4" />
          <span>Nuevo Producto</span>
        </button>
      </div>

      {error && <div className="bg-red-50 text-red-700 p-3.5 rounded-xl text-xs border border-red-200">{error}</div>}

      {/* Catalog Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden text-xs">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-200 font-bold uppercase tracking-wider text-slate-500">
            <tr>
              <th className="p-4">Código</th>
              <th className="p-4">Producto / Insumo</th>
              <th className="p-4">Categoría</th>
              <th className="p-4">Stock Actual</th>
              <th className="p-4">Lotes & Vencimiento</th>
              <th className="p-4 text-right">Ajuste</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {products.map((p) => {
              const isLowStock = p.currentStock <= p.minStockAlert;
              return (
                <tr key={p.id} className="hover:bg-slate-50">
                  <td className="p-4 font-mono font-bold text-slate-900">{p.internalCode}</td>
                  <td className="p-4 font-bold text-slate-900">{p.name}</td>
                  <td className="p-4 text-slate-500">{p.category}</td>
                  <td className="p-4 font-bold">
                    <div className="flex items-center gap-1.5">
                      <span className={`text-sm ${isLowStock ? 'text-red-600 font-black' : 'text-slate-900'}`}>{p.currentStock} {p.unit}s</span>
                      {isLowStock && (
                        <span className="bg-red-100 text-red-700 text-[10px] px-1.5 py-0.5 rounded font-bold flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" /> Bajo Stock
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="p-4 text-slate-500 text-[11px]">
                    {p.productBatches?.map((b: any) => (
                      <div key={b.id}>
                        Lote: <strong>{b.batchNumber}</strong> (Vence: {b.expirationDate})
                      </div>
                    ))}
                    {(!p.productBatches || p.productBatches.length === 0) && 'Sin lote asociado'}
                  </td>
                  <td className="p-4 text-right">
                    {!isReadOnly && (
                      <button
                        onClick={() => {
                          setSelectedProduct(p);
                          setShowAdjustModal(true);
                        }}
                        className="bg-slate-100 hover:bg-slate-200 text-slate-800 px-3 py-1.5 rounded-lg font-bold text-xs"
                      >
                        Ajustar Stock
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Modal Nuevo Producto */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold text-slate-900">Alta de Nuevo Producto / Insumo</h3>
            <form onSubmit={handleCreateProduct} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Código Interno *</label>
                  <input
                    type="text"
                    required
                    value={newProduct.internalCode}
                    onChange={(e) => setNewProduct({ ...newProduct, internalCode: e.target.value })}
                    placeholder="MED-002"
                    className="w-full border border-slate-300 rounded-xl p-2.5"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Nombre Comercial *</label>
                  <input
                    type="text"
                    required
                    value={newProduct.name}
                    onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                    placeholder="Ibuprofeno 600mg Comp"
                    className="w-full border border-slate-300 rounded-xl p-2.5"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Stock Inicial</label>
                  <input
                    type="number"
                    value={newProduct.initialStock}
                    onChange={(e) => setNewProduct({ ...newProduct, initialStock: e.target.value })}
                    className="w-full border border-slate-300 rounded-xl p-2.5"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Nº Lote</label>
                  <input
                    type="text"
                    placeholder="LOT-2026-B"
                    value={newProduct.batchNumber}
                    onChange={(e) => setNewProduct({ ...newProduct, batchNumber: e.target.value })}
                    className="w-full border border-slate-300 rounded-xl p-2.5"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Vencimiento</label>
                  <input
                    type="date"
                    value={newProduct.expirationDate}
                    onChange={(e) => setNewProduct({ ...newProduct, expirationDate: e.target.value })}
                    className="w-full border border-slate-300 rounded-xl p-2.5"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-bold">
                  Cancelar
                </button>
                <button type="submit" className="px-4 py-2 bg-sky-600 text-white rounded-xl font-bold">
                  Guardar Producto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Ajustar Stock */}
      {showAdjustModal && selectedProduct && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-slate-900">Ajustar Stock: {selectedProduct.name}</h3>
            <form onSubmit={handleAdjustStock} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Tipo de Movimiento</label>
                <select
                  value={adjustType}
                  onChange={(e) => setAdjustType(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl p-2.5 font-bold"
                >
                  <option value="ENTRY">➕ Entrada de Stock</option>
                  <option value="EXIT">➖ Salida / Consumo</option>
                  <option value="ADJUSTMENT">⚙️ Ajuste de Inventario</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Cantidad</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={adjustQty}
                  onChange={(e) => setAdjustQty(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl p-2.5"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Motivo Trazable del Movimiento *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Reposición de farmacia / Rotura / Consumo atención"
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl p-2.5"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowAdjustModal(false)} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-bold">
                  Cancelar
                </button>
                <button type="submit" className="px-4 py-2 bg-sky-600 text-white rounded-xl font-bold">
                  Procesar Movimiento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
