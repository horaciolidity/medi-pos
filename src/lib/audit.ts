import { prisma } from './prisma';

export interface AuditLogOptions {
  companyId?: string | null;
  userId?: string | null;
  userEmail: string;
  action: string;
  module: string;
  details: string;
  ipAddress?: string;
}

export async function logAuditAction(options: AuditLogOptions): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        companyId: options.companyId || null,
        userId: options.userId || null,
        userEmail: options.userEmail,
        action: options.action,
        module: options.module,
        details: options.details,
        ipAddress: options.ipAddress || '127.0.0.1',
      },
    });
  } catch (error) {
    console.error('❌ Error al registrar log de auditoría:', error);
  }
}
