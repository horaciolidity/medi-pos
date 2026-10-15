import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { checkCompanySubscription } from '@/lib/subscription';

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      include: {
        company: true,
        branch: true,
      },
    });

    if (!user || !user.isActive) {
      return NextResponse.json({ error: 'Usuario no encontrado o inactivo' }, { status: 401 });
    }

    let subscriptionInfo = null;
    if (user.companyId) {
      subscriptionInfo = await checkCompanySubscription(user.companyId);
    }

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        area: user.area,
        specialty: user.specialty,
        companyId: user.companyId,
        company: user.company,
        branchId: user.branchId,
        branch: user.branch,
      },
      subscription: subscriptionInfo,
    });
  } catch (error) {
    console.error('Error en /api/auth/me:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
