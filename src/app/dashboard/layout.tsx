'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  Activity, Users, FileText, Stethoscope, HeartPulse, Clock,
  Package, ShoppingCart, Receipt, Bell, Download, LogOut,
  ShieldAlert, Sparkles, Building2, ChevronRight, User as UserIcon
} from 'lucide-react';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  const [user, setUser] = useState<any>(null);
  const [subscription, setSubscription] = useState<any>(null);
  const [loading, setLoading] = useState(true);

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
      } catch (err) {
        router.push('/login');
      } finally {
        setLoading(false);
      }
    }
    loadMe();
  }, [router]);

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

  const menuItems = [
    { label: 'Visión General', href: '/dashboard', icon: Activity },
    { label: 'Pacientes & H.C.', href: '/dashboard/pacientes', icon: Users },
    { label: 'Triage Confidencial', href: '/dashboard/triage', icon: Stethoscope },
    { label: 'Enfermería', href: '/dashboard/enfermeria', icon: HeartPulse },
    { label: 'Recepción & Turnos', href: '/dashboard/turnos', icon: Clock },
    { label: 'Farmacia & Insumos', href: '/dashboard/farmacia', icon: Package },
    { label: 'Caja & POS', href: '/dashboard/caja', icon: ShoppingCart },
    { label: 'Facturación (ARCA)', href: '/dashboard/facturacion', icon: Receipt },
    { label: 'Novedades', href: '/dashboard/novedades', icon: Bell },
    { label: 'Exportar Datos', href: '/dashboard/exportar', icon: Download },
  ];

  const isReadOnly = subscription?.isReadOnly;

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      {/* Top Banner Alerta de Suscripción */}
      {isReadOnly && (
        <div className="bg-amber-600 text-slate-950 px-6 py-2.5 flex items-center justify-between text-xs font-bold shadow-md">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 shrink-0 text-slate-950 animate-pulse" />
            <span>
              <strong>MODO SOLO LECTURA ACTIVADO:</strong> La suscripción de su clínica está vencida o suspendida.
              Puede consultar la información existente pero las escrituras, modificaciones y exportaciones de archivos están bloqueadas.
            </span>
          </div>
          <button
            onClick={() => alert('Para regularizar su suscripción o solicitar asistencia, comuníquese con el Superadmin o su representante comercial.')}
            className="bg-slate-950 text-white hover:bg-slate-900 px-3 py-1 rounded-lg text-xs font-bold shrink-0 ml-4 transition-colors"
          >
            Regularizar Pago
          </button>
        </div>
      )}

      {subscription && !isReadOnly && subscription.daysRemaining <= 5 && (
        <div className="bg-amber-500/20 border-b border-amber-500/40 text-amber-900 px-6 py-2 text-xs font-semibold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-600" />
            <span>
              Aviso de suscripción: Su {subscription.planName} vence en <strong>{subscription.daysRemaining} días</strong>.
            </span>
          </div>
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
                  <p className="text-[10px] text-slate-400 font-mono uppercase">{user?.role}</p>
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
    </div>
  );
}
