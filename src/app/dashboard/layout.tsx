'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  Activity, Users, FileText, Stethoscope, HeartPulse, Clock,
  Package, ShoppingCart, Receipt, Bell, Download, LogOut,
  ShieldAlert, Sparkles, Building2, ChevronRight, User as UserIcon, Sliders, UserCheck,
  CalendarDays, Shield
} from 'lucide-react';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  const [user, setUser] = useState<any>(null);
  const [subscription, setSubscription] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showPlansModal, setShowPlansModal] = useState(false);

  useEffect(() => {
    async function loadMe() {
      try {
        const res = await fetch('/api/auth/me');
        if (!res.ok) {
          router.push('/login');
          return;
        }
        const data = await res.json();
        setUser(data.user);
        setSubscription(data.subscription);

        // Si el usuario entra a /dashboard pero su rol no es ADMIN, redirigir a su área de trabajo
        const r = (data.user?.role || data.user?.area || 'ADMIN').toUpperCase();
        if (pathname === '/dashboard' && r !== 'ADMIN' && r !== 'SUPER_ADMIN' && data.user?.email !== 'horaciowalterortiz@gmail.com') {
          if (r === 'MEDICO') router.push('/dashboard/pacientes');
          else if (r === 'ENFERMERIA') router.push('/dashboard/enfermeria');
          else if (r === 'RECEPCION') router.push('/dashboard/turnos');
          else if (r === 'FARMACIA') router.push('/dashboard/farmacia');
          else if (r === 'CAJA') router.push('/dashboard/caja');
        }
      } catch (err) {
        router.push('/login');
      } finally {
        setLoading(false);
      }
    }
    loadMe();
  }, [router, pathname]);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center">
        <div className="flex items-center gap-3">
          <Activity className="w-6 h-6 animate-spin text-sky-400" />
          <span className="text-sm font-medium text-slate-400">Cargando sistema de gestión...</span>
        </div>
      </div>
    );
  }

  const userRole = (user?.role || user?.area || 'ADMIN').toUpperCase();
  const isSuperAdmin = userRole === 'SUPER_ADMIN' || user?.email === 'horaciowalterortiz@gmail.com';

  const allMenuItems = [
    { label: 'Visión General',     href: '/dashboard',                icon: Activity,      roles: ['ADMIN'] },
    { label: 'Pacientes & H.C.',   href: '/dashboard/pacientes',       icon: Stethoscope,   roles: ['ADMIN', 'MEDICO', 'ENFERMERIA', 'RECEPCION'] },
    { label: 'Reservas de Turnos', href: '/dashboard/reservas',        icon: CalendarDays,  roles: ['ADMIN', 'MEDICO', 'RECEPCION'] },
    { label: 'Recepción & Turnero',href: '/dashboard/turnos',          icon: Clock,         roles: ['ADMIN', 'RECEPCION'] },
    { label: 'Enfermería',         href: '/dashboard/enfermeria',      icon: HeartPulse,    roles: ['ADMIN', 'ENFERMERIA'] },
    { label: 'Farmacia & Insumos', href: '/dashboard/farmacia',        icon: Package,       roles: ['ADMIN', 'FARMACIA'] },
    { label: 'Caja & POS',         href: '/dashboard/caja',            icon: ShoppingCart,  roles: ['ADMIN', 'CAJA', 'RECEPCION'] },
    { label: 'Facturación (ARCA)', href: '/dashboard/facturacion',     icon: Receipt,       roles: ['ADMIN', 'CAJA'] },
    { label: 'Personal & Accesos', href: '/dashboard/personal',        icon: UserCheck,     roles: ['ADMIN'] },
    { label: 'Novedades',          href: '/dashboard/novedades',       icon: Bell,          roles: ['ADMIN', 'MEDICO', 'ENFERMERIA', 'RECEPCION'] },
    { label: 'Ajustes & Ticket',   href: '/dashboard/configuracion',   icon: Sliders,       roles: ['ADMIN'] },
    { label: 'Exportar Datos',     href: '/dashboard/exportar',        icon: Download,      roles: ['ADMIN'] },
  ];

  const menuItems = allMenuItems.filter(
    (item) => isSuperAdmin || item.roles.includes(userRole)
  );

  const isReadOnly = subscription?.isReadOnly;

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      {/* Top Banner de Prueba Gratuita (50 pacientes) */}
      {subscription?.isTrial && !subscription?.isTrialLimitReached && (
        <div className="bg-sky-600 text-white px-6 py-2 flex items-center justify-between text-xs font-semibold shadow-sm">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-sky-200" />
            <span>
              <strong>🎁 Prueba Gratuita:</strong> Has registrado <strong>{subscription.trialPatientsCount || 0} de 50 pacientes gratuitos</strong>. Quedan {Math.max(0, 50 - (subscription.trialPatientsCount || 0))} ingresos disponibles.
            </span>
          </div>
          <button
            onClick={() => setShowPlansModal(true)}
            className="bg-white text-sky-900 hover:bg-sky-50 px-3 py-1 rounded-lg text-xs font-bold shrink-0 ml-4 transition-colors"
          >
            Ver Planes Disponibles
          </button>
        </div>
      )}

      {/* Top Banner Límite de Prueba Gratuita Alcanzado */}
      {subscription?.isTrialLimitReached && (
        <div className="bg-amber-600 text-slate-950 px-6 py-2.5 flex items-center justify-between text-xs font-bold shadow-md">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 shrink-0 text-slate-950 animate-pulse" />
            <span>
              <strong>LÍMITE DE PRUEBA GRATUITA ALCANZADO (50/50 PACIENTES):</strong> Has completado tus 50 ingresos gratuitos.
              Para continuar registrando nuevos pacientes y atenciones, activa el Plan Estándar o Plan Pro.
            </span>
          </div>
          <button
            onClick={() => setShowPlansModal(true)}
            className="bg-slate-950 text-white hover:bg-slate-900 px-3.5 py-1.5 rounded-lg text-xs font-bold shrink-0 ml-4 transition-colors"
          >
            Elegir Plan Comercial
          </button>
        </div>
      )}

      {/* Top Banner Alerta de Suscripción Vencida (No Trial) */}
      {isReadOnly && !subscription?.isTrialLimitReached && (
        <div className="bg-amber-600 text-slate-950 px-6 py-2.5 flex items-center justify-between text-xs font-bold shadow-md">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 shrink-0 text-slate-950 animate-pulse" />
            <span>
              <strong>MODO SOLO LECTURA ACTIVADO:</strong> La suscripción de su clínica está vencida o suspendida.
              Puede consultar la información existente pero las escrituras, modificaciones y exportaciones de archivos están bloqueadas.
            </span>
          </div>
          <button
            onClick={() => setShowPlansModal(true)}
            className="bg-slate-950 text-white hover:bg-slate-900 px-3 py-1 rounded-lg text-xs font-bold shrink-0 ml-4 transition-colors"
          >
            Regularizar Plan
          </button>
        </div>
      )}

      <div className="flex flex-1">
        {/* Sidebar Navigation */}
        <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col justify-between shrink-0 min-h-screen border-r border-slate-800">
          <div>
            {/* Header Clinic Logo */}
            <div className="p-5 border-b border-slate-800 flex items-center gap-3">
              <div className="bg-sky-500 text-slate-950 p-2 rounded-xl font-bold">
                <Activity className="w-5 h-5" />
              </div>
              <div className="overflow-hidden">
                <h1 className="font-extrabold text-sm text-white truncate">{user?.company?.name || 'Clínica Demo'}</h1>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-mono">
                    {subscription?.planName || 'Plan Standard'}
                  </span>
                  {isReadOnly && (
                    <span className="text-[10px] bg-red-500/20 text-red-400 border border-red-500/30 px-1.5 py-0.5 rounded font-bold">
                      SOLO LECTURA
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Menu Items */}
            <nav className="p-3 space-y-1">
              {isSuperAdmin && (
                <Link
                  href="/superadmin"
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30 hover:bg-amber-500/20 transition-all mb-2"
                >
                  <Shield className="w-4 h-4 text-amber-400" />
                  <span>Panel Super Admin</span>
                </Link>
              )}

              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                      isActive
                        ? 'bg-sky-500 text-slate-950 shadow-md shadow-sky-500/20 font-bold'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Footer User Card */}
          <div className="p-4 border-t border-slate-800 bg-slate-950/40">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 overflow-hidden">
                <div className="bg-slate-800 p-2 rounded-lg text-slate-300">
                  <UserIcon className="w-4 h-4" />
                </div>
                <div className="overflow-hidden text-xs">
                  <p className="font-bold text-white truncate">{user?.firstName} {user?.lastName}</p>
                  <div className="flex items-center gap-1 mt-0.5">
                    <span className="text-[9px] bg-slate-800 text-sky-400 font-mono uppercase px-1.5 py-0.5 rounded font-bold">
                      {user?.role || 'USUARIO'}
                    </span>
                    {user?.specialty && (
                      <span className="text-[9px] text-slate-400 truncate max-w-[100px]">
                        · {user.specialty}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 bg-slate-800 hover:bg-red-500/20 hover:text-red-400 text-slate-300 py-2 rounded-lg text-xs font-semibold transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Cerrar Sesión</span>
            </button>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 bg-slate-50 min-h-screen overflow-y-auto">
          {children}
        </main>
      </div>

      {/* Modal de Selección de Planes Comerciales */}
      {showPlansModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-3xl rounded-3xl p-6 md:p-8 space-y-6 shadow-2xl">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-xs font-bold text-sky-400 uppercase tracking-wider block">Planes Comerciales Clinic POS</span>
                <h3 className="text-xl font-black text-white mt-1">Elegí el plan que mejor se adapta a tu clínica</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Tu prueba gratuita incluye hasta 50 ingresos de pacientes. Al activar un plan continuás gestionando sin límites.
                </p>
              </div>
              <button
                onClick={() => setShowPlansModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Plan Estándar */}
              <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-6 space-y-4 flex flex-col justify-between hover:border-sky-500/50 transition-all">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="font-extrabold text-base text-white">Plan Estándar</span>
                    <span className="bg-sky-500/10 text-sky-400 border border-sky-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                      Recomendado
                    </span>
                  </div>
                  <div>
                    <span className="text-2xl font-black text-white font-mono">ARS $14.900</span>
                    <span className="text-xs text-slate-400"> / mes</span>
                  </div>
                  <ul className="space-y-2 text-xs text-slate-300">
                    <li className="flex items-center gap-2">✓ Pacientes ilimitados</li>
                    <li className="flex items-center gap-2">✓ Historias Clínicas longitudinales</li>
                    <li className="flex items-center gap-2">✓ Enfermería & atenciones clínicas</li>
                    <li className="flex items-center gap-2">✓ Farmacia, stock & lotes</li>
                    <li className="flex items-center gap-2">✓ Caja POS & Arqueos</li>
                    <li className="flex items-center gap-2">✓ Exportación Excel, TXT, JSON</li>
                    <li className="flex items-center gap-2 text-slate-500">✗ Turnero avanzado con pantalla pública</li>
                  </ul>
                </div>
                <button
                  onClick={() => {
                    alert('Para contratar el Plan Estándar (ARS $14.900/mes), podés comunicarte con tu asesor comercial o coordinar el medio de pago.');
                    setShowPlansModal(false);
                  }}
                  className="w-full bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold py-2.5 rounded-xl text-xs transition-colors shadow-lg shadow-sky-500/20"
                >
                  Contratar Plan Estándar
                </button>
              </div>

              {/* Plan Pro */}
              <div className="bg-gradient-to-b from-slate-800 to-slate-850 border border-emerald-500/40 rounded-2xl p-6 space-y-4 flex flex-col justify-between shadow-xl shadow-emerald-500/5">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="font-extrabold text-base text-white">Plan Pro</span>
                    <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                      Completo
                    </span>
                  </div>
                  <div>
                    <span className="text-2xl font-black text-white font-mono">ARS $24.900</span>
                    <span className="text-xs text-slate-400"> / mes</span>
                  </div>
                  <ul className="space-y-2 text-xs text-slate-300">
                    <li className="flex items-center gap-2">✓ Todo lo del Plan Estándar</li>
                    <li className="flex items-center gap-2 font-semibold text-emerald-300">✓ Turnero avanzado en tiempo real</li>
                    <li className="flex items-center gap-2 font-semibold text-emerald-300">✓ Pantalla pública de llamados por box</li>
                    <li className="flex items-center gap-2 font-semibold text-emerald-300">✓ Impresión de tickets térmicos</li>
                    <li className="flex items-center gap-2 font-semibold text-emerald-300">✓ Configuración de boxes y colas</li>
                    <li className="flex items-center gap-2 font-semibold text-emerald-300">✓ Derivación entre sectores</li>
                  </ul>
                </div>
                <button
                  onClick={() => {
                    alert('Para contratar el Plan Pro (ARS $24.900/mes), podés comunicarte con tu asesor comercial o coordinar el medio de pago.');
                    setShowPlansModal(false);
                  }}
                  className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold py-2.5 rounded-xl text-xs transition-colors shadow-lg shadow-emerald-500/20"
                >
                  Contratar Plan Pro
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
