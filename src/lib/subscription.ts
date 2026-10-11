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
  isTrial: boolean;
  trialPatientsCount: number;
  maxTrialPatients: number;
  isTrialLimitReached: boolean;
  message?: string;
}

export const MAX_FREE_TRIAL_PATIENTS = 50;

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
      isTrial: false,
      trialPatientsCount: 0,
      maxTrialPatients: MAX_FREE_TRIAL_PATIENTS,
      isTrialLimitReached: false,
      message: 'No existe una suscripción activa registrada para la clínica.',
    };
  }

  const sub = company.subscriptions[0];
  const now = new Date();
  const expiresAt = new Date(sub.expiresAt);
  const isExpired = expiresAt.getTime() < now.getTime();
  const isTrial = sub.status === SubscriptionStatus.TRIAL;

  // Contar pacientes para controlar límite de prueba gratuita (50 pacientes)
  const patientCount = await prisma.patient.count({
    where: { companyId },
  });

  const isTrialLimitReached = isTrial && patientCount >= MAX_FREE_TRIAL_PATIENTS;

  // Si venció por tiempo y estaba en ACTIVE o TRIAL, pasa lógicamente a READ_ONLY
  let currentStatus = sub.status;
  if (isExpired && (currentStatus === SubscriptionStatus.ACTIVE || currentStatus === SubscriptionStatus.TRIAL)) {
    currentStatus = SubscriptionStatus.READ_ONLY;
  }

  const isReadOnly = (currentStatus !== SubscriptionStatus.ACTIVE && currentStatus !== SubscriptionStatus.TRIAL) || isTrialLimitReached;
  const daysRemaining = Math.max(0, Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));

  let message = undefined;
  if (isTrialLimitReached) {
    message = `Has alcanzado el límite de ${MAX_FREE_TRIAL_PATIENTS} pacientes de tu Prueba Gratuita (${patientCount}/${MAX_FREE_TRIAL_PATIENTS}). Para continuar registrando nuevos pacientes y atenciones, por favor elige el Plan Estándar (ARS $14.900/mes) o Plan Pro (ARS $24.900/mes).`;
  } else if (isTrial) {
    message = `Prueba Gratuita activa: Has registrado ${patientCount} de ${MAX_FREE_TRIAL_PATIENTS} pacientes permitidos. Quedan ${MAX_FREE_TRIAL_PATIENTS - patientCount} ingresos disponibles.`;
  } else if (isReadOnly) {
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
    canExport: !isReadOnly && !isTrialLimitReached,
    isTrial,
    trialPatientsCount: patientCount,
    maxTrialPatients: MAX_FREE_TRIAL_PATIENTS,
    isTrialLimitReached,
    message,
  };
}
