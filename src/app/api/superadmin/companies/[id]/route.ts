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

    const currentSub = company.subscriptions[0];
    if (!currentSub) {
      return NextResponse.json({ error: 'La clínica no posee suscripción registrada' }, { status: 404 });
    }

    let targetPlanId = currentSub.planId;
    if (planCode) {
      const plan = await prisma.plan.findUnique({ where: { code: planCode } });
      if (plan) targetPlanId = plan.id;
    }

    let updatedExpiresAt = new Date(currentSub.expiresAt);
    if (extendDays && typeof extendDays === 'number') {
      const baseDate = updatedExpiresAt.getTime() < Date.now() ? new Date() : updatedExpiresAt;
      updatedExpiresAt = new Date(baseDate.getTime() + extendDays * 24 * 60 * 60 * 1000);
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
          reason: reason || 'Modificación administrativa desde panel Superadmin',
        },
      }),
    ]);

    await logAuditAction({
      companyId: company.id,
      userId: session.userId,
      userEmail: session.email,
      action: 'UPDATE_SUBSCRIPTION',
      module: 'SUPERADMIN',
      details: `Modificación de suscripción para ${company.name}: Estado=${targetStatus}, Plan=${updatedSub.plan.name}, Vence=${updatedExpiresAt.toISOString()}. Motivo: ${reason || 'N/A'}`,
    });

    return NextResponse.json({
      success: true,
      message: 'Suscripción actualizada exitosamente',
      subscription: updatedSub,
    });
  } catch (error: any) {
    console.error('Error en /api/superadmin/companies/[id]:', error);
    return NextResponse.json({ error: error.message || 'Error al actualizar suscripción' }, { status: 500 });
  }
}
