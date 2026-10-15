// Mapa de menú por rol — cada rol solo ve los ítems de su área
// Formato: { roles: string[], items: MenuItem[] }
export interface MenuItem {
  label: string;
  href: string;
  iconName: string; // nombre del ícono para importar dinámicamente
  description?: string;
}

export const MENU_BY_ROLE: Record<string, MenuItem[]> = {
  SUPER_ADMIN: [], // handled separately → /superadmin
  ADMIN: [
    { label: 'Visión General',     href: '/dashboard',                iconName: 'Activity' },
    { label: 'Pacientes',          href: '/dashboard/pacientes',       iconName: 'Users' },
    { label: 'Turnos / Agenda',    href: '/dashboard/turnos',          iconName: 'Clock' },
    { label: 'Reservas',           href: '/dashboard/reservas',        iconName: 'CalendarDays' },
    { label: 'Enfermería',         href: '/dashboard/enfermeria',      iconName: 'HeartPulse' },
    { label: 'Farmacia',           href: '/dashboard/farmacia',        iconName: 'Package' },
    { label: 'Caja & POS',         href: '/dashboard/caja',            iconName: 'ShoppingCart' },
    { label: 'Facturación',        href: '/dashboard/facturacion',     iconName: 'Receipt' },
    { label: 'Personal & Turnos',  href: '/dashboard/personal',        iconName: 'UserCheck' },
    { label: 'Novedades',          href: '/dashboard/novedades',       iconName: 'Bell' },
    { label: 'Ajustes & Ticket',   href: '/dashboard/configuracion',   iconName: 'Sliders' },
    { label: 'Exportar Datos',     href: '/dashboard/exportar',        iconName: 'Download' },
  ],
  MEDICO: [
    { label: 'Mis Pacientes / H.C.', href: '/dashboard/pacientes',    iconName: 'Stethoscope', description: 'Historial clínico y atenciones' },
    { label: 'Agenda & Reservas',    href: '/dashboard/reservas',     iconName: 'CalendarDays', description: 'Turnos asignados a mí' },
  ],
  ENFERMERIA: [
    { label: 'Pacientes',          href: '/dashboard/pacientes',       iconName: 'Users', description: 'Registrar procedimientos y signos vitales' },
    { label: 'Enfermería',         href: '/dashboard/enfermeria',      iconName: 'HeartPulse', description: 'Registros de enfermería' },
  ],
  RECEPCION: [
    { label: 'Pacientes',          href: '/dashboard/pacientes',       iconName: 'Users', description: 'Alta y edición de pacientes' },
    { label: 'Turnero & Sala',     href: '/dashboard/turnos',          iconName: 'Clock', description: 'Gestión de sala de espera' },
    { label: 'Reservas',           href: '/dashboard/reservas',        iconName: 'CalendarDays', description: 'Reservar y gestionar citas' },
    { label: 'Caja & Cobros',      href: '/dashboard/caja',            iconName: 'ShoppingCart', description: 'Cobros y arqueos' },
  ],
  FARMACIA: [
    { label: 'Farmacia & Stock',   href: '/dashboard/farmacia',        iconName: 'Package', description: 'Control de insumos y dispensación' },
  ],
  CAJA: [
    { label: 'Caja & POS',         href: '/dashboard/caja',            iconName: 'ShoppingCart' },
    { label: 'Facturación',        href: '/dashboard/facturacion',     iconName: 'Receipt' },
  ],
  ADMINISTRATIVO: [
    { label: 'Exportar Datos',     href: '/dashboard/exportar',        iconName: 'Download' },
    { label: 'Novedades',          href: '/dashboard/novedades',       iconName: 'Bell' },
    { label: 'Caja & POS',         href: '/dashboard/caja',            iconName: 'ShoppingCart' },
    { label: 'Facturación',        href: '/dashboard/facturacion',     iconName: 'Receipt' },
  ],
};

// Devuelve los menús correctos para un rol dado
export function getMenuForRole(role: string): MenuItem[] {
  const upperRole = role?.toUpperCase() || 'ADMIN';
  return MENU_BY_ROLE[upperRole] || MENU_BY_ROLE['ADMIN'];
}
