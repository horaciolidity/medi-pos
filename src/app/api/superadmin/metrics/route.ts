import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Role, SubscriptionStatus, PlanCode } from '@/types/enums';

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session || session.role !== Role.SUPER_ADMIN) {
      return NextResponse.json({ error: 'Acceso denegado. Se requieren permisos de Superadmin.' }, { status: 403 });
    }

    const totalCompanies = await prisma.company.count();
    const totalPatients = await prisma.patient.count();
    const totalEHRRecords = await prisma.eHRRecord.count();
    const totalTurnos = await prisma.queueTurno.count();

    const subscriptions = await prisma.subscription.findMany({
      include: { plan: true },
    });

    const now = new Date();
    let activeCount = 0;
    let trialCount = 0;
    let readOnlyCount = 0;
    let suspendedCount = 0;
    let standardCount = 0;
    let proCount = 0;

    let estimatedMRR = 0; // Monthly Recurring Revenue

    subscriptions.forEach((sub) => {
      const isExpired = new Date(sub.expiresAt).getTime() < now.getTime();
      const status = isExpired && (sub.status === SubscriptionStatus.ACTIVE || sub.status === SubscriptionStatus.TRIAL)
        ? SubscriptionStatus.READ_ONLY
        : sub.status;

      if (status === SubscriptionStatus.ACTIVE) {
        activeCount++;
        estimatedMRR += sub.monthlyPriceAtSignup;
      } else if (status === SubscriptionStatus.TRIAL) {
        trialCount++;
      } else if (status === SubscriptionStatus.READ_ONLY || status === SubscriptionStatus.PAST_DUE) {
        readOnlyCount++;
      } else {
        suspendedCount++;
      }

      if (sub.plan.code === PlanCode.PRO) proCount++;
      else standardCount++;
    });

    const recentLogs = await prisma.auditLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    return NextResponse.json({
      success: true,
      metrics: {
        totalCompanies,
        totalPatients,
        totalEHRRecords,
        totalTurnos,
        subscriptions: {
          active: activeCount,
          trial: trialCount,
          readOnly: readOnlyCount,
          suspended: suspendedCount,
        },
        plans: {
          standard: standardCount,
          pro: proCount,
        },
        estimatedMRR,
      },
      recentLogs,
    });
  } catch (error) {
    console.error('Error en /api/superadmin/metrics:', error);
    return NextResponse.json({ error: 'Error al calcular métricas global SaaS' }, { status: 500 });
  }
}
