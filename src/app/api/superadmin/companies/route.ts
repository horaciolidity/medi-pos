import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Role } from '@/types/enums';

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session || session.role !== Role.SUPER_ADMIN) {
      return NextResponse.json({ error: 'Acceso denegado. Se requieren permisos de Superadmin.' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search')?.toLowerCase() || '';

    const companies = await prisma.company.findMany({
      where: search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { cuit: { contains: search, mode: 'insensitive' } },
              { email: { contains: search, mode: 'insensitive' } },
              { razonSocial: { contains: search, mode: 'insensitive' } },
            ],
          }
        : undefined,
      include: {
        subscriptions: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: { plan: true },
        },
        users: {
          select: { id: true, email: true, firstName: true, lastName: true, role: true, lastLoginAt: true, isActive: true },
        },
        _count: {
          select: { patients: true, branches: true, ehrRecords: true, cashMovements: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const now = new Date();
    const formatted = companies.map((c) => {
      const sub = c.subscriptions[0];
      const expiresAt = sub ? new Date(sub.expiresAt) : null;
      const isExpired = expiresAt ? expiresAt.getTime() < now.getTime() : false;
      const daysRemaining = expiresAt ? Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : 0;
      
      let effectiveStatus = sub?.status || 'NO_SUB';
      if (isExpired && (effectiveStatus === 'ACTIVE' || effectiveStatus === 'TRIAL')) {
        effectiveStatus = 'READ_ONLY';
      }

      const adminUser = c.users.find((u) => u.role === Role.ADMIN) || c.users[0];

      return {
        id: c.id,
        name: c.name,
        razonSocial: c.razonSocial,
        cuit: c.cuit,
        email: c.email,
        phone: c.phone,
        address: c.address,
        fiscalCondition: c.fiscalCondition,
        createdAt: c.createdAt,
        userCount: c.users.length,
        users: c.users,
        adminEmail: adminUser?.email || c.email || 'Sin email registrado',
        adminName: adminUser ? `${adminUser.firstName} ${adminUser.lastName}` : 'Administrador',
        lastLoginAt: c.users.find((u) => u.lastLoginAt)?.lastLoginAt || null,
        counts: {
          ...c._count,
          patients: c._count.patients,
        },
        subscription: sub
          ? {
              id: sub.id,
              status: effectiveStatus,
              rawStatus: sub.status,
              planCode: sub.plan.code,
              planName: sub.plan.name,
              startedAt: sub.startedAt,
              expiresAt: sub.expiresAt,
              isExpired,
              daysRemaining,
              isTrial: sub.status === 'TRIAL' || sub.plan.code === 'TRIAL',
              monthlyPriceAtSignup: sub.monthlyPriceAtSignup,
              notes: sub.notes,
            }
          : null,
      };
    });

    return NextResponse.json({ success: true, companies: formatted });
  } catch (error) {
    console.error('Error en /api/superadmin/companies:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
