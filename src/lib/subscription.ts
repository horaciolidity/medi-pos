import { prisma } from './prisma';
import { SubscriptionStatus, PlanCode } from '../types/enums';

export interface CompanySubscriptionInfo {
  companyId: string;
  companyName: string;
  status: string;
  isReadOnly: boolean;
  expiresAt: Date | null;
  daysRemaining: number;
  planCode: string;
  planName: string;
  isProTurneroEnabled: boolean;
  canWrite: boolean;
  canExport: boolean;
  message?: string;
}

export async function checkCompanySubscription(companyId: string): Promise<CompanySubscriptionInfo> {
  const company = await prisma.company.findUnique({
    where: { id: companyId },
    include: {
      subscriptions: {
        orderBy: { createdAt: 'desc' },
        take: 1,
        include: { plan: true },
      },
    },
  });

  if (!company || company.subscriptions.length === 0) {
    return {
      companyId,
      companyName: company?.name || 'Clínica',
      status: SubscriptionStatus.SUSPENDED,
      isReadOnly: true,
      expiresAt: null,
      daysRemaining: 0,
      planCode: PlanCode.STANDARD,
      planName: 'Sin Plan',
      isProTurneroEnabled: false,
      canWrite: false,
      canExport: false,
      message: 'No existe una suscripción activa registrada para la clínica.',
    };
  }

  const sub = company.subscriptions[0];
  const now = new Date();
  const expiresAt = new Date(sub.expiresAt);
  const isExpired = expiresAt.getTime() < now.getTime();
  
  // Si venció y estaba en ACTIVE o TRIAL, pasa lógicamente a READ_ONLY
  let currentStatus = sub.status;
  if (isExpired && (currentStatus === SubscriptionStatus.ACTIVE || currentStatus === SubscriptionStatus.TRIAL)) {
    currentStatus = SubscriptionStatus.READ_ONLY;
  }

  const isReadOnly = currentStatus !== SubscriptionStatus.ACTIVE && currentStatus !== SubscriptionStatus.TRIAL;
  const daysRemaining = Math.max(0, Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));

  let message = undefined;
  if (isReadOnly) {
    message = 'Atención: La suscripción de la clínica está vencida o suspendida. El sistema se encuentra en modo SOLO LECTURA. Puede consultar la información pero no puede registrar atenciones, modificar datos ni exportar archivos.';
  } else if (daysRemaining <= 5) {
    message = `Aviso de Suscripción: Su plan vence en ${daysRemaining} días. Por favor regularice su pago para evitar la interrupción de escritura.`;
  }

  return {
    companyId: company.id,
    companyName: company.name,
    status: currentStatus,
    isReadOnly,
    expiresAt,
    daysRemaining,
    planCode: sub.plan.code,
    planName: sub.plan.name,
    isProTurneroEnabled: sub.plan.isProTurneroEnabled && !isReadOnly,
    canWrite: !isReadOnly,
    canExport: !isReadOnly,
    message,
  };
}
