'use client';

import { useState, useEffect } from 'react';
import {
  Users,
  UserCheck,
  Stethoscope,
  HeartPulse,
  Package,
  Clock,
  Plus,
  Search,
  CheckCircle2,
  AlertCircle,
  Edit2,
  Power,
  Shield,
  Phone,
  Mail,
  FileBadge,
  Sparkles,
  Calendar
} from 'lucide-react';

export default function PersonalTurnosPage() {
  const [staff, setStaff] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedArea, setSelectedArea] = useState('ALL');
  const [showModal, setShowModal] = useState(false);
  const [editingStaff, setEditingStaff] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Formulario nuevo / edición de personal
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    dni: '',
    area: 'MEDICO',
    role: 'MEDICO',
    specialty: '',
    matricula: '',
    phone: '',
    shiftHours: 'Mañana (08:00 - 14:00)',
    workDays: 'Lunes a Viernes',
    email: '',
    password: '',
  });

  const loadStaff = async () => {
    setLoading(true);
    try {
      const url = `/api/staff?area=${selectedArea}&search=${encodeURIComponent(search)}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Error al cargar personal');
      const data = await res.json();
      setStaff(data.staff || []);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Error al cargar personal');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStaff();
  }, [selectedArea, search]);

  const openCreateModal = () => {
    setEditingStaff(null);
    setFormData({
      firstName: '',
      lastName: '',
      dni: '',
      area: 'MEDICO',
      role: 'MEDICO',
      specialty: '',
      matricula: '',
      phone: '',
      shiftHours: '',
      workDays: 'Lunes a Viernes',
      email: '',
      password: '',
    });
    setErrorMsg('');
    setShowModal(true);
  };

  const openEditModal = (item: any) => {
    setEditingStaff(item);
    setFormData({
      firstName: item.firstName || '',
      lastName: item.lastName || '',
      dni: item.dni || '',
      area: item.area || 'MEDICO',
      role: item.role || item.area || 'MEDICO',
      specialty: item.specialty || '',
      matricula: item.matricula || '',
      phone: item.phone || '',
      shiftHours: item.shiftHours || '',
      workDays: item.workDays || '',
      email: item.email || '',
      password: '',
    });
    setErrorMsg('');
    setShowModal(true);
  };

  const handleSaveStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const method = editingStaff ? 'PATCH' : 'POST';
      const payload = editingStaff ? { ...formData, id: editingStaff.id } : formData;

      const res = await fetch('/api/staff', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al guardar personal');

      setSuccessMsg(editingStaff ? 'Personal actualizado correctamente' : 'Personal registrado exitosamente');
      setShowModal(false);
      loadStaff();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error en la operación');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (item: any) => {
    try {
      const res = await fetch('/api/staff', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: item.id,
          isActive: !item.isActive,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al actualizar estado');

      loadStaff();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Conteos
  const totalMedicos = staff.filter((s) => s.area === 'MEDICO' || s.role === 'MEDICO').length;
  const totalEnfermeria = staff.filter((s) => s.area === 'ENFERMERIA' || s.role === 'ENFERMERIA').length;
  const totalFarmacia = staff.filter((s) => s.area === 'FARMACIA' || s.role === 'FARMACIA').length;
  const totalActivos = staff.filter((s) => s.isActive).length;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sky-600 font-bold text-xs uppercase tracking-wider mb-1">
            <UserCheck className="w-4 h-4" /> Gestión de Profesionales & Turnos
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Personal Clínico: Médicos, Enfermería & Farmacia
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Registrá a tu equipo con su horario/turno habitual y matrícula. Al atender o dispensar, podrás asignar opcionalmente quién realizó cada acción para emitir reportes completos con horario y responsable.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="bg-sky-600 hover:bg-sky-500 text-white font-bold px-4 py-2.5 rounded-xl shadow-lg shadow-sky-600/20 text-xs flex items-center gap-2 transition-all self-start md:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Registrar Nuevo Personal</span>
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

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex justify-between items-center text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Cuerpo Médico</span>
            <Stethoscope className="w-5 h-5 text-sky-600" />
          </div>
          <p className="text-3xl font-black text-slate-900">{totalMedicos}</p>
          <span className="text-[11px] text-slate-400">Especialistas y guardia</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex justify-between items-center text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Enfermería</span>
            <HeartPulse className="w-5 h-5 text-emerald-600" />
          </div>
          <p className="text-3xl font-black text-slate-900">{totalEnfermeria}</p>
          <span className="text-[11px] text-slate-400">Triage y atención clínica</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex justify-between items-center text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Farmacia & Stock</span>
            <Package className="w-5 h-5 text-purple-600" />
          </div>
          <p className="text-3xl font-black text-slate-900">{totalFarmacia}</p>
          <span className="text-[11px] text-slate-400">Control de medicamentos</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex justify-between items-center text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Personal Activo</span>
            <UserCheck className="w-5 h-5 text-amber-600" />
          </div>
          <p className="text-3xl font-black text-slate-900">{totalActivos} / {staff.length}</p>
          <span className="text-[11px] text-slate-400">Habilitados en la clínica</span>
        </div>
      </div>

      {/* Directorio de Personal */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-6 space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Tabs por área */}
          <div className="flex flex-wrap gap-1.5 p-1 bg-slate-100 rounded-xl text-xs font-bold">
            <button
              onClick={() => setSelectedArea('ALL')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                selectedArea === 'ALL' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Todos ({staff.length})
            </button>
            <button
              onClick={() => setSelectedArea('MEDICO')}
              className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
                selectedArea === 'MEDICO' ? 'bg-white text-sky-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Stethoscope className="w-3.5 h-3.5 text-sky-600" />
              <span>Médicos</span>
            </button>
            <button
              onClick={() => setSelectedArea('ENFERMERIA')}
              className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
                selectedArea === 'ENFERMERIA' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <HeartPulse className="w-3.5 h-3.5 text-emerald-600" />
              <span>Enfermería</span>
            </button>
            <button
              onClick={() => setSelectedArea('FARMACIA')}
              className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
                selectedArea === 'FARMACIA' ? 'bg-white text-purple-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Package className="w-3.5 h-3.5 text-purple-600" />
              <span>Farmacia</span>
            </button>
            <button
              onClick={() => setSelectedArea('RECEPCION')}
              className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
                selectedArea === 'RECEPCION' ? 'bg-white text-amber-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Clock className="w-3.5 h-3.5 text-amber-600" />
              <span>Recepción</span>
            </button>
          </div>

          {/* Buscador */}
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-slate-700 w-full md:w-72">
            <Search className="w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por Nombre, DNI, Matrícula..."
              className="bg-transparent border-none text-xs text-slate-900 placeholder-slate-400 focus:outline-none w-full"
            />
          </div>
        </div>

        {/* Tabla */}
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 font-bold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="p-4">Profesional / Datos</th>
                <th className="p-4">Área / Rol</th>
                <th className="p-4">Matrícula (MN/MP)</th>
                <th className="p-4">Turno / Horario Habitual</th>
                <th className="p-4">Días de Trabajo</th>
                <th className="p-4">Estado</th>
                <th className="p-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {staff.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400">
                    No hay personal registrado en este criterio. Podés dar de alta a tu equipo haciendo clic en "Registrar Nuevo Personal".
                  </td>
                </tr>
              ) : (
                staff.map((p) => {
                  const isMed = p.area === 'MEDICO' || p.role === 'MEDICO';
                  const isEnf = p.area === 'ENFERMERIA' || p.role === 'ENFERMERIA';
                  const isFar = p.area === 'FARMACIA' || p.role === 'FARMACIA';

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-4">
                        <div className="font-bold text-slate-900 text-sm">
                          {p.lastName}, {p.firstName}
                        </div>
                        {p.specialty && (
                          <div className="text-[11px] text-slate-500 font-medium">{p.specialty}</div>
                        )}
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                          {p.dni ? `DNI: ${p.dni}` : 'Sin DNI'} • {p.email}
                        </div>
                      </td>

                      <td className="p-4">
                        {isMed && (
                          <span className="bg-sky-50 text-sky-700 border border-sky-200 px-2.5 py-1 rounded-lg font-bold inline-flex items-center gap-1">
                            <Stethoscope className="w-3 h-3 text-sky-600" /> Médico
                          </span>
                        )}
                        {isEnf && (
                          <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1 rounded-lg font-bold inline-flex items-center gap-1">
                            <HeartPulse className="w-3 h-3 text-emerald-600" /> Enfermería
                          </span>
                        )}
                        {isFar && (
                          <span className="bg-purple-50 text-purple-700 border border-purple-200 px-2.5 py-1 rounded-lg font-bold inline-flex items-center gap-1">
                            <Package className="w-3 h-3 text-purple-600" /> Farmacia
                          </span>
                        )}
                        {!isMed && !isEnf && !isFar && (
                          <span className="bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg font-bold">
                            {p.area || p.role}
                          </span>
                        )}
                      </td>

                      <td className="p-4 font-mono font-semibold text-slate-700">
                        {p.matricula ? (
                          <span className="bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                            {p.matricula}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">No requerida</span>
                        )}
                      </td>

                      <td className="p-4">
                        <div className="flex items-center gap-1.5 text-slate-800 font-medium">
                          <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{p.shiftHours || 'Mañana (08:00 - 14:00)'}</span>
                        </div>
                      </td>

                      <td className="p-4">
                        <div className="flex items-center gap-1.5 text-slate-600">
                          <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{p.workDays || 'Lunes a Viernes'}</span>
                        </div>
                      </td>

                      <td className="p-4">
                        {p.isActive ? (
                          <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Activo
                          </span>
                        ) : (
                          <span className="bg-slate-100 text-slate-500 text-[10px] font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span> Inactivo
                          </span>
                        )}
                      </td>

                      <td className="p-4 text-right space-x-1">
                        <button
                          onClick={() => openEditModal(p)}
                          title="Editar Personal"
                          className="p-1.5 text-slate-600 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition-colors"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleToggleStatus(p)}
                          title={p.isActive ? 'Desactivar personal' : 'Habilitar personal'}
                          className={`p-1.5 rounded-lg transition-colors ${
                            p.isActive ? 'text-slate-400 hover:text-red-600 hover:bg-red-50' : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50'
                          }`}
                        >
                          <Power className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Registrar / Editar Personal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <span className="text-[10px] font-bold text-sky-600 uppercase tracking-wider block">
                {editingStaff ? 'Actualizar Ficha de Personal' : 'Nuevo Miembro del Equipo'}
              </span>
              <h3 className="text-lg font-black text-slate-900">
                {editingStaff ? `${editingStaff.firstName} ${editingStaff.lastName}` : 'Registrar Profesional o Personal'}
              </h3>
              <p className="text-xs text-slate-400">
                Podrás asociar este profesional opcionalmente a las atenciones, signos vitales o movimientos de farmacia.
              </p>
            </div>

            <form onSubmit={handleSaveStaff} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Nombre *</label>
                  <input
                    type="text"
                    required
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    placeholder="Ej: Carlos"
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-sky-500 font-medium"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Apellido *</label>
                  <input
                    type="text"
                    required
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    placeholder="Ej: Gómez"
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-sky-500 font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Área / Rol *</label>
                  <select
                    value={formData.area}
                    onChange={(e) => setFormData({ ...formData, area: e.target.value, role: e.target.value })}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-bold focus:outline-none focus:border-sky-500"
                  >
                    <option value="MEDICO">🩺 Médico / Especialista</option>
                    <option value="ENFERMERIA">💉 Enfermería / Cuidados</option>
                    <option value="FARMACIA">💊 Farmacia / Control Stock</option>
                    <option value="RECEPCION">🛎️ Recepción / Admisión</option>
                    <option value="ADMIN">💼 Administración / Facturación</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">DNI</label>
                  <input
                    type="text"
                    value={formData.dni}
                    onChange={(e) => setFormData({ ...formData, dni: e.target.value })}
                    placeholder="Ej: 32.845.119"
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-sky-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Especialidad Clínica</label>
                  <input
                    type="text"
                    value={formData.specialty}
                    onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
                    placeholder="Ej: Clínica Médica / Pediatría"
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-sky-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Matrícula Profesional (MN / MP)</label>
                  <input
                    type="text"
                    value={formData.matricula}
                    onChange={(e) => setFormData({ ...formData, matricula: e.target.value })}
                    placeholder="Ej: MP 48920 / MN 11284"
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-sky-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Horario / Turno de Trabajo</label>
                  <input
                    type="text"
                    value={formData.shiftHours}
                    onChange={(e) => setFormData({ ...formData, shiftHours: e.target.value })}
                    placeholder="Ej: Lunes 08:00-14:00 / Guardia noche 20:00-08:00"
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-sky-500 font-medium"
                  />
                  <span className="text-[10px] text-slate-400">Escribí el horario exacto de tu clínica, sin restricciones de formato.</span>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Días de Atención / Guardia</label>
                  <input
                    type="text"
                    value={formData.workDays}
                    onChange={(e) => setFormData({ ...formData, workDays: e.target.value })}
                    placeholder="Ej: Lunes a Viernes / Martes y Jueves"
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 border-t border-slate-100 pt-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Email (Opcional)</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="dr.gomez@clinica.com"
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-sky-500"
                  />
                  <span className="text-[10px] text-slate-400">Si se deja vacío, se genera automáticamente.</span>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Teléfono (Opcional)</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="011-4555-1234"
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl font-bold shadow-lg shadow-sky-600/20 transition-all disabled:opacity-50"
                >
                  {saving ? 'Guardando...' : 'Guardar Personal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
