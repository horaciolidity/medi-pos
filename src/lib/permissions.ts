import { Role } from '../types/enums';

export function hasPermission(role: string, requiredRole: string): boolean {
  if (role === Role.SUPER_ADMIN) return true;
  if (role === Role.ADMIN) return true;
  return role === requiredRole;
}

export function canAccessModule(role: string, moduleName: string): boolean {
  if (role === Role.SUPER_ADMIN) return moduleName === 'superadmin' || moduleName === 'audit';
  if (role === Role.ADMIN) return moduleName !== 'superadmin';

  switch (moduleName) {
    case 'pacientes':
      return [Role.MEDICO, Role.RECEPCION, Role.ENFERMERIA, Role.ADMINISTRATIVO, Role.AUDITOR].includes(role as Role);
    case 'ehr':
      return [Role.MEDICO, Role.ENFERMERIA, Role.AUDITOR].includes(role as Role);
    case 'triage':
      return [Role.MEDICO, Role.ENFERMERIA, Role.RECEPCION].includes(role as Role);
    case 'enfermeria':
      return [Role.MEDICO, Role.ENFERMERIA].includes(role as Role);
    case 'turnos':
      return [Role.RECEPCION, Role.MEDICO, Role.ENFERMERIA, Role.ADMINISTRATIVO].includes(role as Role);
    case 'farmacia':
      return [Role.FARMACIA, Role.MEDICO, Role.ENFERMERIA, Role.ADMINISTRATIVO].includes(role as Role);
    case 'caja':
      return [Role.CAJA, Role.RECEPCION, Role.ADMINISTRATIVO].includes(role as Role);
    case 'facturacion':
      return [Role.CAJA, Role.ADMINISTRATIVO].includes(role as Role);
    case 'novedades':
      return true; // Todos los roles de la clínica pueden ver novedades operativas
    case 'limpieza':
      return [Role.LIMPIEZA, Role.ADMINISTRATIVO].includes(role as Role);
    case 'exportar':
      return [Role.ADMIN, Role.ADMINISTRATIVO, Role.AUDITOR].includes(role as Role);
    default:
      return true;
  }
}
