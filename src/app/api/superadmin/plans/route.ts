import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { logAuditAction } from '@/lib/audit';
import { Role } from '@/types/enums';

export async function GET(req: NextRequest) {
  try {
    const plans = await prisma.plan.findMany({
      include: {
        priceHistory: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
      },
    });

    return NextResponse.json({ success: true, plans });
  } catch (error) {
    return NextResponse.json({ error: 'Error al consultar planes' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session || session.role !== Role.SUPER_ADMIN) {
      return NextResponse.json({ error: 'Acceso denegado. Se requieren permisos de Superadmin.' }, { status: 403 });
    }

    const { planId, monthlyPrice, description, reason } = await req.json();

    if (!planId || typeof monthlyPrice !== 'number') {
      return NextResponse.json({ error: 'ID de plan e importe requeridos' }, { status: 400 });
    }

    const plan = await prisma.plan.findUnique({ where: { id: planId } });
    if (!plan) {
      return NextResponse.json({ error: 'Plan no encontrado' }, { status: 404 });
    }

    const oldPrice = plan.monthlyPrice;

    const [updatedPlan] = await prisma.$transaction([
      prisma.plan.update({
        where: { id: planId },
        data: {
          monthlyPrice,
          description: description || plan.description,
        },
      }),
      prisma.planPricingHistory.create({
        data: {
          planId,
          oldPrice,
          newPrice: monthlyPrice,
          changedByEmail: session.email,
          reason: reason || 'Ajuste tarifario de plan comercial',
        },
      }),
    ]);

    await logAuditAction({
      userId: session.userId,
      userEmail: session.email,
      action: 'UPDATE_PLAN_PRICE',
      module: 'SUPERADMIN',
      details: `Ajuste de precio del ${plan.name}: ARS $${oldPrice} -> ARS $${monthlyPrice}`,
    });

    return NextResponse.json({ success: true, plan: updatedPlan });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error al actualizar precio del plan' }, { status: 500 });
  }
}
