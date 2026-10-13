import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { logAuditAction } from '@/lib/audit';
import { Role } from '@/types/enums';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSessionUser(req);
    if (!session || session.role !== Role.SUPER_ADMIN) {
      return NextResponse.json({ error: 'Acceso denegado. Se requieren permisos de Superadmin.' }, { status: 403 });
    }

    const companyId = params.id;
    const body = await req.json();
    const { status, planCode, extendDays, newExpiresAt, reason, notes } = body;

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

    if (!company) {
      return NextResponse.json({ error: 'Clínica no encontrada' }, { status: 404 });
    }

    let currentSub = company.subscriptions[0];
    
    // Si la empresa no tenía suscripción registrada, crear una inicial
    if (!currentSub) {
      let defaultPlan = await prisma.plan.findUnique({ where: { code: planCode || 'STANDARD' } });
      if (!defaultPlan) {
        defaultPlan = await prisma.plan.findFirst();
      }
      if (!defaultPlan) {
        defaultPlan = await prisma.plan.create({
          data: {
            code: 'STANDARD',
            name: 'Plan Estándar',
            description: 'Acceso completo a gestión de clínica',
            monthlyPrice: 14900,
          },
        });
      }

      currentSub = await prisma.subscription.create({
        data: {
          companyId: company.id,
          planId: defaultPlan.id,
          status: 'ACTIVE',
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          monthlyPriceAtSignup: defaultPlan.monthlyPrice,
        },
        include: { plan: true },
      });
    }

    let targetPlanId = currentSub.planId;
    if (planCode) {
      let plan = await prisma.plan.findUnique({ where: { code: planCode } });
      if (!plan && planCode === 'TRIAL') {
        plan = await prisma.plan.create({
          data: {
            code: 'TRIAL',
            name: 'Prueba Gratuita (50 Pacientes)',
            description: 'Modo de evaluación gratuito inicial con 50 ingresos sin costo',
            monthlyPrice: 0,
            isProTurneroEnabled: false,
          },
        });
      }
      if (plan) targetPlanId = plan.id;
    }

    let updatedExpiresAt = new Date(currentSub.expiresAt);
    if (extendDays && typeof extendDays === 'number' && extendDays !== 0) {
      const nowTime = Date.now();
      if (extendDays > 0) {
        // Si se suman días y la fecha ya venció, se computa a partir de hoy
        const base = updatedExpiresAt.getTime() < nowTime ? new Date() : updatedExpiresAt;
        updatedExpiresAt = new Date(base.getTime() + extendDays * 24 * 60 * 60 * 1000);
      } else {
        // Descontar días de la fecha de vencimiento actual
        updatedExpiresAt = new Date(updatedExpiresAt.getTime() + extendDays * 24 * 60 * 60 * 1000);
      }
    } else if (newExpiresAt) {
      updatedExpiresAt = new Date(newExpiresAt);
    }

    const targetStatus = status || currentSub.status;

    // Actualizar suscripción y registrar log de cambios
    const [updatedSub] = await prisma.$transaction([
      prisma.subscription.update({
        where: { id: currentSub.id },
        data: {
          status: targetStatus,
          planId: targetPlanId,
          expiresAt: updatedExpiresAt,
          notes: notes ? `${currentSub.notes || ''}\n[${new Date().toLocaleDateString()}] ${notes}` : currentSub.notes,
        },
        include: { plan: true },
      }),
      prisma.subscriptionLog.create({
        data: {
          companyId: company.id,
          subscriptionId: currentSub.id,
          oldStatus: currentSub.status,
          newStatus: targetStatus,
          oldExpiresAt: currentSub.expiresAt,
          newExpiresAt: updatedExpiresAt,
          changedBy: session.email,
          reason: reason || (extendDays ? `Ajuste de días: ${extendDays > 0 ? '+' : ''}${extendDays} días` : `Cambio de estado/plan a ${targetStatus}`),
        },
      }),
    ]);

    // Si se suspende o activa, actualizar el estado de los usuarios de la clínica
    if (targetStatus === 'SUSPENDED') {
      await prisma.user.updateMany({
        where: { companyId: company.id },
        data: { isActive: false },
      });
    } else if (targetStatus === 'ACTIVE' || targetStatus === 'TRIAL') {
      await prisma.user.updateMany({
        where: { companyId: company.id },
        data: { isActive: true },
      });
    }

    await logAuditAction({
      companyId: company.id,
      userId: session.userId,
      userEmail: session.email,
      action: 'UPDATE_SUBSCRIPTION',
      module: 'SUPERADMIN',
      details: `Modificación por Superadmin (${session.email}) para ${company.name}: Estado=${targetStatus}, Plan=${updatedSub.plan.name}, Vence=${updatedExpiresAt.toISOString()}. Motivo: ${reason || 'N/A'}`,
    });

    return NextResponse.json({
      success: true,
      message: 'Suscripción y estado de cuenta actualizados exitosamente',
      subscription: updatedSub,
    });
  } catch (error: any) {
    console.error('Error en PATCH /api/superadmin/companies/[id]:', error);
    return NextResponse.json({ error: error.message || 'Error al actualizar suscripción' }, { status: 500 });
  }
}
